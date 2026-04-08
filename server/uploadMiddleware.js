const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const config = require('./config');
const { Logger } = require('./logger');

const logger = new Logger();

/**
 * Production-ready upload middleware
 */

// Configure multer for memory storage (we'll write to disk after optimization)
const storage = multer.memoryStorage();

/**
 * File filter for validating uploads
 */
const fileFilter = (req, file, cb) => {
  try {
    // Check MIME type
    if (!config.upload.allowedTypes.includes(file.mimetype)) {
      const error = new Error(
        `Invalid file type. Only ${config.upload.allowedTypes.join(', ')} are allowed.`
      );
      logger.warn('Invalid file type attempted', {
        originalMimetype: file.mimetype,
        filename: file.originalname,
        ip: req.ip,
      });
      return cb(error, false);
    }

    // Additional file name validation - prevent path traversal
    const fileName = path.basename(file.originalname);
    if (fileName !== file.originalname) {
      const error = new Error('Invalid file name');
      logger.warn('Suspicious file name attempted', {
        filename: file.originalname,
        ip: req.ip,
      });
      return cb(error, false);
    }

    // Check file name length
    if (fileName.length > 255) {
      const error = new Error('File name too long (max 255 characters)');
      return cb(error, false);
    }

    cb(null, true);
  } catch (error) {
    logger.error('File filter error', error);
    cb(error, false);
  }
};

/**
 * Create multer instance with configuration
 */
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: config.upload.maxFileSize,
    files: 2, // Allow primary + secondary image when needed
  },
});

/**
 * Generate unique file name with validation
 */
function generateFileName(originalName) {
  try {
    const ext = path.extname(originalName).toLowerCase();
    const baseName = path.basename(originalName, ext);

    // Sanitize file name - remove special characters except hyphens and underscores
    const sanitized = baseName
      .replace(/[^a-z0-9\-_]/gi, '_')
      .substring(0, 50);

    if (!sanitized) {
      throw new Error('Invalid file name after sanitization');
    }

    const randomId = crypto.randomBytes(8).toString('hex');
    const timestamp = Date.now();

    return `${sanitized}_${timestamp}_${randomId}${ext}`;
  } catch (error) {
    logger.error('File name generation error', error, { originalName });
    throw error;
  }
}

/**
 * Calculate file checksum (SHA256) for deduplication
 */
async function calculateChecksum(buffer) {
  try {
    const hash = crypto.createHash('sha256');
    hash.update(buffer);
    return hash.digest('hex');
  } catch (error) {
    logger.error('Checksum calculation error', error);
    throw error;
  }
}

/**
 * Validate image dimensions
 */
async function validateImageDimensions(buffer, maxWidth = 10000, maxHeight = 10000) {
  try {
    const sharp = require('sharp');
    const metadata = await sharp(buffer).metadata();

    if (metadata.width > maxWidth || metadata.height > maxHeight) {
      throw new Error(`Image dimensions exceed limits (max: ${maxWidth}x${maxHeight})`);
    }

    return metadata;
  } catch (error) {
    if (error.message.includes('exceed limits')) {
      throw error;
    }
    logger.error('Image dimension validation error', error);
    throw new Error('Failed to validate image');
  }
}

/**
 * Middleware to handle upload errors
 */
function handleUploadError(err, req, res, next) {
  if (err instanceof multer.MulterError) {
    logger.error('Multer error', err, {
      field: err.field,
      code: err.code,
      ip: req.ip,
    });

    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({
        error: 'File too large',
        message: `Maximum file size is ${config.upload.maxFileSize / 1024 / 1024}MB`,
      });
    }

    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        error: 'Too many files',
        message: 'Only up to two files per upload are allowed',
      });
    }

    return res.status(400).json({
      error: 'Upload error',
      message: err.message,
    });
  }

  if (err && err.message && err.message.includes('Invalid file type')) {
    logger.warn('Invalid file type rejected', {
      message: err.message,
      ip: req.ip,
    });

    return res.status(400).json({
      error: 'Invalid file type',
      message: err.message,
      allowedTypes: config.upload.allowedTypes,
    });
  }

  if (err) {
    logger.error('Upload middleware error', err, { ip: req.ip });
    return res.status(400).json({
      error: 'Upload failed',
      message: err.message,
    });
  }

  next();
}

module.exports = {
  upload,
  generateFileName,
  calculateChecksum,
  validateImageDimensions,
  handleUploadError,
};
