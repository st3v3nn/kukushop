const { Pool } = require('pg');
const config = require('./config');
const { Logger } = require('./logger');

const logger = new Logger();

/**
 * Production-ready database connection manager with resilience
 */
class DatabaseManager {
  constructor() {
    this.pool = null;
    this.healthCheckInterval = null;
    this.isConnected = false;
    this.connectionAttempts = 0;
    this.maxConnectionAttempts = 5;
    this.reconnectDelay = 5000; // 5 seconds
  }

  /**
   * Initialize database connection pool
   */
  async initialize() {
    try {
      this.pool = new Pool({
        connectionString: config.database.url,
        max: config.database.pool.max,
        min: config.database.pool.min,
        ssl: config.database.ssl,
        statement_timeout: config.database.statementTimeout,
        // Connection pool timeout - important for stability
        idleTimeoutMillis: 30000, // 30 seconds
        connectionTimeoutMillis: 10000, // 10 seconds
        // Query timeout
        query_timeout: config.database.statementTimeout,
        // Reconnect settings
        maxUses: 7200, // Recycle connections after 2 hours
      });

      // Handle pool errors
      this.pool.on('error', (err, client) => {
        logger.error('Unexpected error on idle client', err, {
          errno: err.errno,
          code: err.code,
        });
      });

      // Handle pool connect events
      this.pool.on('connect', () => {
        logger.debug('New connection created in pool');
      });

      // Test connection                
      await this.testConnection();
      this.isConnected = true;
      this.connectionAttempts = 0;

      logger.info('Database connection pool initialized', {
        min: config.database.pool.min,
        max: config.database.pool.max,
        url: config.database.url.replace(/:[^:]*@/, ':***@'), // Hide password
      });

      // Start health check
      this.startHealthCheck();

      return this.pool;
    } catch (error) {
      logger.error('Failed to initialize database pool', error);
      this.isConnected = false;
      throw error;
    }
  }

  /**
   * Test database connection
   */
  async testConnection() {
    const client = await this.pool.connect();
    try {
      const result = await client.query('SELECT NOW()');
      logger.debug('Database connection test successful', {
        timestamp: result.rows[0].now,
      });
    } finally {
      client.release();
    }
  }

  /**
   * Start periodic health check
   */
  startHealthCheck() {
    // Check every 30 seconds
    this.healthCheckInterval = setInterval(async () => {
      try {
        await this.testConnection();
        if (!this.isConnected) {
          logger.info('Database connection restored');
          this.isConnected = true;
        }
      } catch (error) {
        logger.error('Health check failed', error);
        this.isConnected = false;
        this.attemptReconnect();
      }
    }, 30000);

    logger.info('Database health check started');
  }

  /**
   * Stop health check
   */
  stopHealthCheck() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
      logger.info('Database health check stopped');
    }
  }

  /**
   * Attempt to reconnect with backoff
   */
  async attemptReconnect() {
    if (this.connectionAttempts >= this.maxConnectionAttempts) {
      logger.error('Max reconnection attempts reached', {
        attempts: this.connectionAttempts,
      });
      return;
    }

    this.connectionAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.connectionAttempts - 1);

    logger.warn('Attempting database reconnection', {
      attempt: this.connectionAttempts,
      nextRetryIn: `${delay}ms`,
    });

    setTimeout(async () => {
      try {
        await this.testConnection();
        this.isConnected = true;
        this.connectionAttempts = 0;
        logger.info('Database reconnection successful');
      } catch (error) {
        logger.error('Reconnection attempt failed', error);
        this.attemptReconnect();
      }
    }, delay);
  }

  /**
   * Execute query with retry logic
   */
  async query(text, values = [], maxRetries = 3) {
    let lastError;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        if (!this.isConnected) {
          throw new Error('Database not connected');
        }

        const result = await this.pool.query(text, values);
        return result;
      } catch (error) {
        lastError = error;

        // Check if error is retryable
        if (!this.isRetryableError(error)) {
          throw error;
        }

        if (attempt < maxRetries) {
          const backoffDelay = Math.pow(2, attempt - 1) * 100; // Exponential backoff
          logger.warn('Query failed, retrying', {
            attempt,
            maxRetries,
            delay: `${backoffDelay}ms`,
            error: error.message,
          });

          await new Promise(resolve => setTimeout(resolve, backoffDelay));
        }
      }
    }

    logger.error('Query failed after all retries', lastError, {
      retries: maxRetries,
      text: text.substring(0, 100),
    });

    throw lastError;
  }

  /**
   * Check if error is retryable
   */
  isRetryableError(error) {
    const retryableErrors = [
      'ECONNREFUSED', // Connection refused
      'ENOTFOUND', // DNS lookup failed
      'ETIMEDOUT', // Connection timeout
      'EHOSTUNREACH', // Host unreachable
      'ECONNRESET', // Connection reset
      'pool timeout', // Pool timeout
    ];

    const errorString = `${error.code || ''} ${error.message || ''}`.toLowerCase();

    return retryableErrors.some(err => errorString.includes(err.toLowerCase()));
  }

  /**
   * Get pool status
   */
  getStatus() {
    if (!this.pool) {
      return {
        connected: false,
        status: 'Not initialized',
      };
    }

    return {
      connected: this.isConnected,
      totalConnections: this.pool.totalCount,
      idleConnections: this.pool.idleCount,
      activeConnections: this.pool.totalCount - this.pool.idleCount,
      waitingQueue: this.pool.waitingCount || 0,
      status: this.isConnected ? 'Connected' : 'Disconnected',
    };
  }

  /**
   * Close pool gracefully
   */
  async close() {
    this.stopHealthCheck();

    if (this.pool) {
      try {
        await this.pool.end();
        logger.info('Database pool closed');
      } catch (error) {
        logger.error('Error closing database pool', error);
      }
    }
  }
}

module.exports = DatabaseManager;
