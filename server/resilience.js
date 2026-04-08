const { Logger } = require('./logger');

const logger = new Logger();

/**
 * Middleware to ensure database is available
 */
function checkDatabaseHealth(db) {
  return (req, res, next) => {
    const status = db.getStatus();

    if (!status.connected) {
      logger.warn('Database unavailable for request', {
        method: req.method,
        url: req.url,
        ip: req.ip,
      });

      return res.status(503).json({
        error: 'Service Unavailable',
        message: 'Database connection temporarily unavailable',
        status: 'Database reconnecting...',
        retryAfter: 10,
      });
    }

    // Add database status to request for logging
    req.dbStatus = status;
    next();
  };
}

/**
 * Middleware to handle query errors with fallback
 */
function databaseErrorHandler(err, req, res, next) {
  if (err && err.code && err.code.startsWith('ECONNREFUSED|ETIMEDOUT|ENOTFOUND')) {
    logger.error('Database connection error', err);

    return res.status(503).json({
      error: 'Database Error',
      message: 'Unable to process request - database unavailable',
      retryAfter: 10,
    });
  }

  next(err);
}

/**
 * Middleware to log database query performance
 */
function logDatabaseQuery(query, duration, rows = 0) {
  if (duration > 1000) {
    logger.warn('Slow database query detected', {
      duration: `${duration}ms`,
      rows,
      query: query.substring(0, 100),
    });
  } else {
    logger.debug('Database query', {
      duration: `${duration}ms`,
      rows,
    });
  }
}

/**
 * Retry wrapper for async operations
 */
async function withRetry(fn, maxRetries = 3, backoffMs = 100) {
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Check if retryable
      const isRetryable =
        error.code?.includes('ECONNREFUSED') ||
        error.code?.includes('ETIMEDOUT') ||
        error.message?.includes('pool timeout');

      if (!isRetryable || attempt === maxRetries) {
        throw error;
      }

      const delay = backoffMs * Math.pow(2, attempt - 1);
      logger.debug('Retrying operation', {
        attempt,
        maxRetries,
        delay: `${delay}ms`,
      });

      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

/**
 * Circuit breaker pattern for database operations
 */
class CircuitBreaker {
  constructor(threshold = 5, timeout = 60000) {
    this.failureCount = 0;
    this.threshold = threshold;
    this.timeout = timeout;
    this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
    this.lastFailureTime = null;
  }

  async execute(fn) {
    if (this.state === 'OPEN') {
      // Check if we should try again
      if (Date.now() - this.lastFailureTime > this.timeout) {
        this.state = 'HALF_OPEN';
        logger.info('Circuit breaker: attempting recovery');
      } else {
        throw new Error('Circuit breaker is OPEN - database unavailable');
      }
    }

    try {
      const result = await fn();

      // Success - reset
      if (this.state === 'HALF_OPEN') {
        this.state = 'CLOSED';
        this.failureCount = 0;
        logger.info('Circuit breaker: recovered');
      }

      return result;
    } catch (error) {
      this.failureCount++;
      this.lastFailureTime = Date.now();

      if (this.failureCount >= this.threshold) {
        this.state = 'OPEN';
        logger.error('Circuit breaker: opened due to repeated failures', {
          failureCount: this.failureCount,
          threshold: this.threshold,
        });
      }

      throw error;
    }
  }

  getStatus() {
    return {
      state: this.state,
      failureCount: this.failureCount,
      threshold: this.threshold,
    };
  }
}

module.exports = {
  checkDatabaseHealth,
  databaseErrorHandler,
  logDatabaseQuery,
  withRetry,
  CircuitBreaker,
};
