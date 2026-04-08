const fs = require('fs');
const path = require('path');
const config = require('./config');

/**
 * Logger for production-ready logging
 */
class Logger {
  constructor() {
    this.logDir = config.logging.dir;
    this.logLevels = {
      error: 0,
      warn: 1,
      info: 2,
      debug: 3,
    };
    this.currentLevel = this.logLevels[config.logging.level] || 2;
  }

  /**
   * Format log message
   */
  format(level, message, data = {}) {
    const timestamp = new Date().toISOString();
    const dataStr = Object.keys(data).length > 0 ? JSON.stringify(data) : '';
    return `[${timestamp}] [${level.toUpperCase()}] ${message} ${dataStr}`.trim();
  }

  /**
   * Write to file
   */
  writeFile(filePath, message) {
    try {
      fs.appendFileSync(filePath, message + '\n', 'utf8');
    } catch (error) {
      console.error(`Failed to write to log file ${filePath}:`, error);
    }
  }

  /**
   * Log error
   */
  error(message, error = null, data = {}) {
    if (this.logLevels.error > this.currentLevel) return;

    const formattedMessage = this.format('error', message, {
      ...data,
      error: error ? {
        message: error.message,
        stack: error.stack,
        code: error.code,
      } : undefined,
    });

    console.error(formattedMessage);
    this.writeFile(config.logging.errorFile, formattedMessage);
  }

  /**
   * Log warning
   */
  warn(message, data = {}) {
    if (this.logLevels.warn > this.currentLevel) return;

    const formattedMessage = this.format('warn', message, data);
    console.warn(formattedMessage);
    this.writeFile(config.logging.file, formattedMessage);
  }

  /**
   * Log info
   */
  info(message, data = {}) {
    if (this.logLevels.info > this.currentLevel) return;

    const formattedMessage = this.format('info', message, data);
    console.log(formattedMessage);
    this.writeFile(config.logging.file, formattedMessage);
  }

  /**
   * Log debug
   */
  debug(message, data = {}) {
    if (this.logLevels.debug > this.currentLevel) return;

    const formattedMessage = this.format('debug', message, data);
    if (config.server.isDev) {
      console.log(formattedMessage);
    }
    this.writeFile(config.logging.file, formattedMessage);
  }

  /**
   * Log API request
   */
  logRequest(req, res, duration) {
    const message = this.format('info', 'API Request', {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });

    this.writeFile(config.logging.file, message);
  }

  /**
   * Log audit trail
   */
  audit(action, actor, resource, data = {}) {
    const message = this.format('info', 'Audit', {
      action,
      actor,
      resource,
      ...data,
    });

    this.writeFile(config.logging.auditFile, message);
  }
}

/**
 * Express middleware for error handling
 */
function errorHandler(err, req, res, next) {
  const logger = new Logger();

  // Log error
  logger.error(err.message, err, {
    url: req.url,
    method: req.method,
    ip: req.ip,
  });

  // Handle validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation Error',
      message: err.message,
      details: err.details,
    });
  }

  // Handle file upload errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      error: 'File too large',
      message: 'Maximum file size is 5MB',
      maxSize: config.upload.maxFileSize,
    });
  }

  if (err.code === 'LIMIT_FILE_COUNT') {
    return res.status(400).json({
      error: 'Too many files',
      message: 'Maximum 1 file per upload',
    });
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({
      error: 'Unexpected field',
      message: err.field
        ? `Unexpected upload field: ${err.field}`
        : 'Unexpected upload field',
    });
  }

  if (err.message && err.message.includes('Invalid file type')) {
    return res.status(400).json({
      error: 'Invalid file type',
      message: err.message,
      allowedTypes: config.upload.allowedTypes,
    });
  }

  // Handle database errors
  if (err.code && err.code.startsWith('23')) {
    // PostgreSQL integrity constraint error
    return res.status(409).json({
      error: 'Conflict',
      message: 'A resource with this identifier already exists',
    });
  }

  // Handle authentication errors
  if (err.name === 'AuthenticationError') {
    return res.status(401).json({
      error: 'Authentication failed',
      message: err.message,
    });
  }

  // Handle authorization errors
  if (err.name === 'AuthorizationError') {
    return res.status(403).json({
      error: 'Access denied',
      message: err.message,
    });
  }

  // Default error response
  const statusCode = err.statusCode || 500;
  const isProduction = config.server.isProd;

  res.status(statusCode).json({
    error: err.name || 'Server Error',
    message: isProduction ? 'An error occurred' : err.message,
    ...(config.server.isDev && { details: err.stack }),
  });
}

/**
 * Express middleware for logging requests
 */
function requestLogger(req, res, next) {
  const logger = new Logger();
  const startTime = Date.now();

  // Monkey patch res.json to log response
  const originalJson = res.json;
  res.json = function(data) {
    const duration = Date.now() - startTime;
    logger.logRequest(req, res, duration);
    return originalJson.call(this, data);
  };

  next();
}

module.exports = {
  Logger,
  errorHandler,
  requestLogger,
};
