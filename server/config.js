const path = require('path');
const fs = require('fs');

/**
 * Configuration management for production-ready setup
 */
class Config {
  constructor() {
    this.env = process.env.NODE_ENV || 'development';
    this.isDev = this.env === 'development';
    this.isProd = this.env === 'production';
  }

  // ============================================
  // DATABASE
  // ============================================
  get database() {
    return {
      url: this.getRequired('DATABASE_URL', 'postgresql://speedy_app:REPLACE@localhost:54812/speedy_bites'),
      pool: {
        min: parseInt(process.env.DB_POOL_MIN || '2'),
        max: parseInt(process.env.DB_POOL_MAX || '20'),
      },
      ssl: this.parseBool(process.env.DB_SSL, false),
      statementTimeout: parseInt(process.env.DB_STATEMENT_TIMEOUT || '30000'),
    };
  }

  // ============================================
  // SERVER
  // ============================================
  get server() {
    return {
      port: parseInt(process.env.PORT || '4000'),
      host: process.env.HOST || '0.0.0.0',
      nodeEnv: this.env,
      isDev: this.isDev,
      isProd: this.isProd,
    };
  }

  // ============================================
  // IMAGE UPLOAD
  // ============================================
  get upload() {
    const uploadDir = process.env.UPLOAD_DIR || path.join(__dirname, 'uploads');

    // Ensure upload directory exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    return {
      directory: uploadDir,
      maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880'), // 5MB
      allowedTypes: (process.env.ALLOWED_IMAGE_TYPES || 'image/jpeg,image/png,image/webp,image/gif').split(','),
      optimization: {
        enabled: this.parseBool(process.env.IMAGE_OPTIMIZATION_ENABLED, true),
        quality: parseInt(process.env.IMAGE_OPTIMIZATION_QUALITY || '80'),
      },
      paths: {
        products: path.join(uploadDir, 'products'),
        categories: path.join(uploadDir, 'categories'),
        temp: path.join(uploadDir, 'temp'),
      },
    };
  }

  // ============================================
  // CORS
  // ============================================
  get cors() {
    // In development allow common localhost ports used by Vite
    const defaultDevOrigins = [
      'http://localhost:8080',
      'http://localhost:8081',
      'http://localhost:8082',
      'http://localhost:8083',
      'http://localhost:5173',
      'http://127.0.0.1:8082',
    ];

    const originEnv = process.env.CORS_ORIGIN;
    const origins = originEnv
      ? originEnv.split(',').map(s => s.trim())
      : (this.isDev ? defaultDevOrigins : ['http://localhost:8081']);

    return {
      origin: origins,
      credentials: this.parseBool(process.env.CORS_CREDENTIALS, true),
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    };
  }

  // ============================================
  // AUTHENTICATION
  // ============================================
  get auth() {
    const tokenSecret = process.env.TOKEN_SECRET;

    if (this.isProd && (!tokenSecret || tokenSecret.length < 32)) {
      throw new Error('TOKEN_SECRET must be at least 32 characters in production');
    }

    return {
      tokenSecret: tokenSecret || 'dev-secret-key-min-32-chars-must-change',
      tokenExpiry: process.env.TOKEN_EXPIRY || '24h',
      maxLoginAttempts: parseInt(process.env.MAX_LOGIN_ATTEMPTS || '5'),
      loginAttemptWindow: process.env.LOGIN_ATTEMPT_WINDOW || '15m',
    };
  }

  // ============================================
  // RATE LIMITING
  // ============================================
  get rateLimit() {
    return {
      enabled: this.parseBool(process.env.RATE_LIMIT_ENABLED, true),
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
      maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
      uploadMaxRequests: parseInt(process.env.UPLOAD_RATE_LIMIT_MAX || '10'),
    };
  }

  // ============================================
  // LOGGING
  // ============================================
  get logging() {
    const logDir = process.env.LOG_DIR || path.join(__dirname, '..', 'logs');

    // Ensure log directory exists
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }

    return {
      level: process.env.LOG_LEVEL || 'info',
      file: process.env.LOG_FILE || path.join(logDir, 'app.log'),
      dir: logDir,
      errorFile: path.join(logDir, 'error.log'),
      auditFile: path.join(logDir, 'audit.log'),
    };
  }

  // ============================================
  // SECURITY
  // ============================================
  get security() {
    return {
      helmetEnabled: this.parseBool(process.env.HELMET_ENABLED, true),
      requireHttps: this.parseBool(process.env.REQUIRE_HTTPS, this.isProd),
      apiKeyEnabled: this.parseBool(process.env.API_KEY_ENABLED, true),
    };
  }

  // ============================================
  // FEATURES
  // ============================================
  get features() {
    return {
      imageUpload: this.parseBool(process.env.FEATURE_IMAGE_UPLOAD, true),
      productVariants: this.parseBool(process.env.FEATURE_PRODUCT_VARIANTS, false),
      inventoryTracking: this.parseBool(process.env.FEATURE_INVENTORY_TRACKING, false),
    };
  }

  // ============================================
  // MPESA / DARJA
  // ============================================
  get mpesa() {
    const sandbox = this.parseBool(process.env.MPESA_SANDBOX, true);
    const consumerKey = process.env.MPESA_CONSUMER_KEY || '';
    const consumerSecret = process.env.MPESA_CONSUMER_SECRET || '';
    const shortcode = process.env.MPESA_SHORTCODE || process.env.MPESA_BUSINESS_SHORTCODE || '';
    const passkey = process.env.MPESA_PASSKEY || '';
    const callbackBase = process.env.MPESA_CALLBACK_BASE || '';
    const oauthUrl = sandbox
      ? 'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials'
      : 'https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials';
    const stkUrl = sandbox
      ? 'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest'
      : 'https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest';

    return { sandbox, consumerKey, consumerSecret, shortcode, passkey, callbackBase, oauthUrl, stkUrl };
  }

  // ============================================
  // HELPER METHODS
  // ============================================
  getRequired(key, defaultValue) {
    const value = process.env[key];
    if (!value && !defaultValue) {
      throw new Error(`Required environment variable ${key} is not set`);
    }
    return value || defaultValue;
  }

  parseBool(value, defaultValue = false) {
    if (value === undefined || value === null) return defaultValue;
    return value === 'true' || value === '1' || value === true;
  }

  // Get all configuration
  getAll() {
    return {
      env: this.env,
      isDev: this.isDev,
      isProd: this.isProd,
      database: this.database,
      server: this.server,
      upload: this.upload,
      cors: this.cors,
      auth: this.auth,
      rateLimit: this.rateLimit,
      logging: this.logging,
      security: this.security,
      features: this.features,
    };
  }

  // Validate critical configuration
  validate() {
    const errors = [];

    try {
      // Validate database
      if (!this.database.url) {
        errors.push('DATABASE_URL is required');
      } else if (typeof this.database.url === 'string' && /REPLACE|REPLACEME|<password>/i.test(this.database.url)) {
        errors.push('DATABASE_URL appears to contain a placeholder password; set a valid DATABASE_URL environment variable');
      }

      // Validate token secret in production
      if (this.isProd && this.auth.tokenSecret.length < 32) {
        errors.push('TOKEN_SECRET must be at least 32 characters in production');
      }

      // Validate upload directory
      const uploadDir = this.upload.directory;
      if (!fs.existsSync(uploadDir)) {
        try {
          fs.mkdirSync(uploadDir, { recursive: true });
        } catch (err) {
          errors.push(`Cannot create upload directory: ${uploadDir}`);
        }
      }

      if (errors.length > 0) {
        throw new Error(`Configuration validation failed:\n${errors.join('\n')}`);
      }

      return true;
    } catch (error) {
      console.error('Configuration Error:', error.message);
      throw error;
    }
  }
}

module.exports = new Config();
