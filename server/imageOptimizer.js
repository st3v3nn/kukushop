const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;

const IMAGE_CONFIG = {
  products: {
    maxWidth: 800,
    maxHeight: 800,
    quality: 80,
    formats: ['webp', 'jpeg']
  },
  categories: {
    maxWidth: 600,
    maxHeight: 600,
    quality: 85,
    formats: ['webp', 'jpeg']
  },
  thumbnail: {
    maxWidth: 300,
    maxHeight: 300,
    quality: 75,
    formats: ['webp', 'jpeg']
  }
};

/**
 * Optimize and save image in multiple formats
 * @param {Buffer} imageBuffer - The image data
 * @param {String} type - Type: 'products', 'categories', or 'thumbnail'
 * @param {String} filename - Base filename without extension
 * @returns {Object} Object with paths to generated images
 */
async function optimizeImage(imageBuffer, type, filename) {
  const config = IMAGE_CONFIG[type] || IMAGE_CONFIG.products;
  const uploadDir = path.join(__dirname, 'uploads', type);
  
  // Ensure directory exists
  await fs.mkdir(uploadDir, { recursive: true });

  const results = {};
  const baseFileName = filename.replace(/\.[^/.]+$/, ''); // Remove extension

  try {
    // Create sharp instance from buffer
    let image = sharp(imageBuffer);
    
    // Get metadata to maintain aspect ratio
    const metadata = await image.metadata();
    
    // Calculate dimensions maintaining aspect ratio
    const dimensions = calculateDimensions(
      metadata.width,
      metadata.height,
      config.maxWidth,
      config.maxHeight
    );

    // Process for each format
    for (const format of config.formats) {
      const outputFilename = `${baseFileName}_${type}.${format === 'webp' ? 'webp' : 'jpg'}`;
      const outputPath = path.join(uploadDir, outputFilename);
      const relativePath = `/uploads/${type}/${outputFilename}`;

      if (format === 'webp') {
        await sharp(imageBuffer)
          .resize(dimensions.width, dimensions.height, {
            fit: 'inside',
            withoutEnlargement: true
          })
          .webp({ quality: config.quality })
          .toFile(outputPath);
      } else if (format === 'jpeg') {
        await sharp(imageBuffer)
          .resize(dimensions.width, dimensions.height, {
            fit: 'inside',
            withoutEnlargement: true
          })
          .jpeg({ quality: config.quality })
          .toFile(outputPath);
      }

      results[format] = relativePath;
    }

    // Generate thumbnail for products
    if (type === 'products') {
      const thumbConfig = IMAGE_CONFIG.thumbnail;
      const thumbDimensions = calculateDimensions(
        metadata.width,
        metadata.height,
        thumbConfig.maxWidth,
        thumbConfig.maxHeight
      );

      const thumbFilename = `${baseFileName}_thumb.jpg`;
      const thumbPath = path.join(uploadDir, thumbFilename);
      const thumbRelativePath = `/uploads/${type}/${thumbFilename}`;

      await sharp(imageBuffer)
        .resize(thumbDimensions.width, thumbDimensions.height, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .jpeg({ quality: thumbConfig.quality })
        .toFile(thumbPath);

      results.thumbnail = thumbRelativePath;
    }

    return {
      success: true,
      paths: results,
      originalDimensions: { width: metadata.width, height: metadata.height },
      optimizedDimensions: dimensions
    };
  } catch (error) {
    console.error('Image optimization error:', error);
    
    // Cleanup on error
    for (const format of config.formats) {
      const outputFilename = `${baseFileName}_${type}.${format === 'webp' ? 'webp' : 'jpg'}`;
      const outputPath = path.join(uploadDir, outputFilename);
      try {
        await fs.unlink(outputPath);
      } catch (e) {
        // Ignore cleanup errors
      }
    }

    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Calculate dimensions maintaining aspect ratio
 */
function calculateDimensions(width, height, maxWidth, maxHeight) {
  const ratio = Math.min(maxWidth / width, maxHeight / height);
  
  if (ratio >= 1) {
    return { width, height };
  }

  return {
    width: Math.round(width * ratio),
    height: Math.round(height * ratio)
  };
}

/**
 * Delete image files
 */
async function deleteImages(type, filename) {
  const uploadDir = path.join(__dirname, 'uploads', type);
  const baseFileName = filename.replace(/\.[^/.]+$/, '');
  
  const filesToDelete = [
    `${baseFileName}_${type}.webp`,
    `${baseFileName}_${type}.jpg`,
  ];

  if (type === 'products') {
    filesToDelete.push(`${baseFileName}_thumb.jpg`);
  }

  for (const file of filesToDelete) {
    const filePath = path.join(uploadDir, file);
    try {
      await fs.unlink(filePath);
    } catch (error) {
      console.warn(`Could not delete file ${file}:`, error.message);
    }
  }
}

module.exports = {
  optimizeImage,
  deleteImages,
  IMAGE_CONFIG
};
