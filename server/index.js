require('dotenv').config();
const express = require('express');

const cors = require('cors');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const https = require('https');
const config = require('./config');
const { Logger, errorHandler, requestLogger } = require('./logger');
const { upload, generateFileName, calculateChecksum, handleUploadError } = require('./uploadMiddleware');
const { optimizeImage, deleteImages } = require('./imageOptimizer');
const DatabaseManager = require('./database');
const { checkDatabaseHealth, databaseErrorHandler, withRetry, CircuitBreaker } = require('./resilience');
const { Resend } = require('resend');
const resend = new Resend(config.email.apiKey);

// ============================================
// EMAIL TEMPLATES (Branded Kuku ni Sisi)
// ============================================
const getEmailHeader = (title) => `
  <div style="background-color: #f97316; padding: 40px 20px; text-align: center; border-radius: 12px 12px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">🍗 Kuku ni Sisi</h1>
    <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">${title}</p>
  </div>
`;

const getEmailFooter = () => `
  <div style="padding: 30px 20px; text-align: center; color: #64748b; font-size: 14px; border-top: 1px solid #e2e8f0; background-color: #f8fafc; border-radius: 0 0 12px 12px;">
    <p style="margin: 0 0 10px 0; font-weight: bold; color: #1e293b;">Kuku ni Sisi Cafe, Butchery & Groceries</p>
    <p style="margin: 0;">Work by BuildbySteve.co.ke</p>
    <div style="margin-top: 20px;">
      <a href="https://kukunisisi.co.ke" style="color: #f97316; text-decoration: none; margin: 0 10px;">Visit Website</a>
      <a href="https://kukunisisi.co.ke/menu" style="color: #f97316; text-decoration: none; margin: 0 10px;">Our Menu</a>
    </div>
  </div>
`;

const getWelcomeTemplate = (name) => `
  <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); border: 1px solid #e2e8f0;">
    ${getEmailHeader('Welcome to the Family!')}
    <div style="padding: 40px 30px; line-height: 1.6; color: #1e293b;">
      <h2 style="color: #0f172a; margin-top: 0;">Hi ${name},</h2>
      <p style="font-size: 16px;">We're absolutely thrilled to have you join **Kuku ni Sisi**! Your journey to delicious meals and farm-fresh produce starts here.</p>
      <p style="font-size: 16px;">Whether you're craving a Cafe special, quality cuts from our Butchery, or fresh Groceries, we've got you covered.</p>
      
      <div style="margin-top: 35px; text-align: center;">
        <a href="https://kukunisisi.co.ke/menu" style="background-color: #f97316; color: white; padding: 16px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px; display: inline-block; box-shadow: 0 4px 6px rgba(249, 115, 22, 0.2);">Browse Our Menu</a>
      </div>
      
      <p style="margin-top: 35px; font-size: 15px; border-left: 4px solid #f97316; padding-left: 15px; color: #64748b; font-style: italic;">
        Pro-tip: Try our Choma Special and Pilau — they're customer favorites for a reason!
      </p>
    </div>
    ${getEmailFooter()}
  </div>
`;

const getPasswordResetTemplate = (name, resetLink) => `
  <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); border: 1px solid #e2e8f0;">
    ${getEmailHeader('Reset Your Password')}
    <div style="padding: 40px 30px; line-height: 1.6; color: #1e293b;">
      <h2 style="color: #0f172a; margin-top: 0;">Hello ${name},</h2>
      <p style="font-size: 16px;">We received a request to reset your password. Click the button below to choose a new password:</p>
      
      <div style="margin: 35px 0; text-align: center;">
        <a href="${resetLink}" style="background-color: #f97316; color: white; padding: 16px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px; display: inline-block; box-shadow: 0 4px 6px rgba(249, 115, 22, 0.2);">Reset My Password</a>
      </div>
      
      <p style="font-size: 14px; color: #64748b;">This link will expire in 1 hour. If you didn't request a password reset, you can safely ignore this email.</p>
      <p style="font-size: 12px; color: #94a3b8; margin-top: 20px; word-break: break-all;">
        If the button doesn't work, copy and paste this URL into your browser:<br/>
        <a href="${resetLink}" style="color: #f97316;">${resetLink}</a>
      </p>
    </div>
    ${getEmailFooter()}
  </div>
`;

// Initialize logger
const logger = new Logger();

// Validate configuration
try {
  config.validate();
  logger.info('Configuration validated successfully');
} catch (error) {
  logger.error('Configuration validation failed', error);
  process.exit(1);
}

const app = express();
app.set('trust proxy', true);


// ============================================
// MIDDLEWARE CONFIGURATION
// ============================================

// CORS setup from config
app.use(cors({
  origin: (origin, callback) => {
    // In development, allow all origins to troubleshoot CORS issues
    if (config.isDev || !origin || config.cors.origin.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
}));

console.log('🛡️ CORS initialized in mode:', config.isDev ? 'DEVELOPMENT (permissive)' : 'PRODUCTION');
console.log('🛡️ Allowed origins:', config.cors.origin);

// Body parser middleware
// JSON body parser with `verify` to capture raw body for debugging proxied requests
app.use(express.json({
  limit: '10mb',
  verify: (req, res, buf) => {
    try { req.rawBody = buf && buf.toString(); } catch (e) { req.rawBody = undefined; }
  }
}));

app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Request logging middleware
app.use(requestLogger);

// Serve static files for uploads from the persistent host path first.
// Fall back to the legacy in-repo uploads directory so older or mismatched files still render.
app.use('/uploads', express.static(config.upload.directory));
console.log('📁 Serving uploads from:', config.upload.directory);

const legacyUploadDir = path.join(__dirname, 'uploads');
if (legacyUploadDir !== config.upload.directory && fs.existsSync(legacyUploadDir)) {
  app.use('/uploads', express.static(legacyUploadDir));
  console.log('📁 Serving legacy uploads from:', legacyUploadDir);
}

// ============================================
// DATABASE CONFIGURATION
// ============================================

const dbManager = new DatabaseManager();
const circuitBreaker = new CircuitBreaker(5, 60000);
const riderLocations = new Map(); // Store rider_id -> { latitude, longitude, updatedAt }

// (legacy token store removed) - we now use JWT access tokens and DB-backed refresh tokens

// JWT helpers (HMAC SHA256)
const signJwt = (payload, expiresInSeconds = 900) => {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const exp = Math.floor(Date.now() / 1000) + expiresInSeconds;
  const body = Buffer.from(JSON.stringify({ ...payload, exp })).toString('base64url');
  const data = `${header}.${body}`;
  const sig = crypto.createHmac('sha256', config.auth.tokenSecret).update(data).digest('base64url');
  return `${data}.${sig}`;
};

const verifyJwt = (token) => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [headerB, bodyB, sig] = parts;
    const data = `${headerB}.${bodyB}`;
    const expected = crypto.createHmac('sha256', config.auth.tokenSecret).update(data).digest('base64url');
    if (!expected || expected !== sig) return null;
    const body = JSON.parse(Buffer.from(bodyB, 'base64url').toString('utf8'));
    if (body.exp && Date.now() >= body.exp * 1000) return null;
    return body;
  } catch (err) {
    return null;
  }
};

// Middleware to require auth and optionally a role
function requireAuth(role) {
  return async (req, res, next) => {
    try {
      // Support token via Authorization header or ?token= in query (for EventSource)
      let token = null;
      const authHeader = req.headers['authorization'] || req.headers['Authorization'];
      if (authHeader && typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
        token = authHeader.slice(7).trim();
      }
      if (!token && req.query && req.query.token) {
        token = req.query.token;
      }

      if (!token) return res.status(401).json({ error: 'Missing auth token' });
      // First, accept JWT access tokens
      const jwtPayload = verifyJwt(token);
      if (jwtPayload) {
        if (role && jwtPayload.role !== role) return res.status(403).json({ error: 'Insufficient role' });
        req.user = { id: jwtPayload.sub, role: jwtPayload.role };
        return next();
      }

      // No legacy token store fallback — require valid JWT access token (or query param JWT for EventSource)
      return res.status(401).json({ error: 'Invalid or expired token' });
      next();
    } catch (err) {
      console.error('Auth middleware error', err);
      res.status(500).json({ error: 'Auth error' });
    }
  };
}

// Initialize database asynchronously
let pool;
(async () => {
  try {
    pool = await dbManager.initialize();
    logger.info('✅ Database connection pool ready');
    // Ensure rider_orders table exists and seed sample data in development
    try {
      await ensureAuthSchema();
      await ensureMenuTables();
      await ensureRiderOrdersTable();
      await ensureCustomerAddressesTable();
      await ensureOrdersTable();
      await ensureOrderItemsTable();
      await ensureRefreshTokensTable();
      await ensureMpesaTables();
      await ensureRefreshTokensAuditTable();
      await ensureFavoritesTable();
      await ensureNotificationsTable();
      await seedRiderOrdersIfEmpty();
      logger.info('✅ DB helper tables ensured and rider orders seeded (if empty)');
    } catch (err) {
      logger.warn('Could not ensure/seed helper tables', err);
    }
  } catch (error) {
    logger.error('❌ Failed to initialize database pool', error);
    // In production we should fail fast so a process supervisor can restart the service
    if (config.isProd) {
      logger.error('Exiting process due to database initialization failure in production');
      process.exit(1);
    }
    // In development, continue running and allow the database manager to attempt reconnects
  }
})();

// Add database health check middleware
app.use(checkDatabaseHealth(dbManager));

const PORT = config.server.port;
const HOST = config.server.host;

// ============================================
// HELPER FUNCTIONS FOR RESILIENT QUERIES
// ============================================

/**
 * Execute query with circuit breaker and retry logic
 */
async function executeQuery(text, values = []) {
  return circuitBreaker.execute(async () => {
    if (!pool) {
      throw new Error('Database pool not initialized');
    }
    return dbManager.query(text, values);
  });
}

// ============ AUTHENTICATION ENDPOINTS ============

// Simple token generator (for demo purposes)
const generateToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Hash password (simple implementation for demo)
const hashPassword = (password) => {
  return crypto.createHash('sha256').update(String(password || '')).digest('hex');
};

const normalizeEmail = (email) => String(email || '').trim().toLowerCase();

const verifyPasswordHash = async (password, storedHash) => {
  if (!storedHash) return { valid: false, needsRehash: false };

  if (storedHash.startsWith('$2a$') || storedHash.startsWith('$2b$') || storedHash.startsWith('$2y$')) {
    try {
      const bcrypt = require('bcryptjs');
      return { valid: await bcrypt.compare(password, storedHash), needsRehash: false };
    } catch (err) {
      console.error('Failed to verify bcrypt password hash:', err);
      return { valid: false, needsRehash: false };
    }
  }

  if (storedHash === password) {
    return { valid: true, needsRehash: true };
  }

  return { valid: hashPassword(password) === storedHash, needsRehash: false };
};

const parseProductTags = (raw) => {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return [...new Set(raw.map((tag) => String(tag).trim().toLowerCase()).filter(Boolean))];
  }
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return [...new Set(parsed.map((tag) => String(tag).trim().toLowerCase()).filter(Boolean))];
      }
    } catch (err) {
      // fallback to comma-separated
    }
    return [...new Set(raw.split(',').map((tag) => tag.trim().toLowerCase()).filter(Boolean))];
  }
  return [];
};

const parseTierPricing = (raw) => {
  if (!raw) return [];
  let parsed = raw;
  if (typeof raw === 'string') {
    try {
      parsed = JSON.parse(raw);
    } catch (err) {
      return [];
    }
  }
  if (!Array.isArray(parsed)) return [];
  return parsed
    .map((tier) => ({
      name: String(tier.name ?? tier.tier_name ?? tier.label ?? '').trim(),
      price: Number(tier.price ?? 0),
    }))
    .filter((tier) => tier.name && Number.isFinite(tier.price) && tier.price > 0);
};

// Login endpoint
app.post('/api/auth/login', async (req, res) => {
  try {
    // Log raw body when available to help debug proxied requests
    if (req.rawBody) console.info('Raw login body:', req.rawBody);
    const { email, password } = req.body;
    const normalizedEmail = normalizeEmail(email);

    if (!normalizedEmail || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Check if user exists in database
    const { rows } = await pool.query(
      'SELECT * FROM public.users WHERE LOWER(TRIM(email)) = $1 AND COALESCE(is_active, true) = true',
      [normalizedEmail]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid login credentials' });
    }

    const dbUser = rows[0];
    const { valid: passwordValid, needsRehash } = await verifyPasswordHash(password, dbUser.password_hash);

    // Verify password
    if (!passwordValid) {
      return res.status(401).json({ error: 'Invalid login credentials' });
    }

    if (needsRehash) {
      await pool.query(
        'UPDATE public.users SET password_hash = $1, updated_at = now() WHERE id = $2',
        [hashPassword(password), dbUser.id]
      );
    }

    // Create JWT access token (short-lived) and a refresh token persisted in DB
    const accessToken = signJwt({ sub: dbUser.id, role: dbUser.role }, 15 * 60); // 15 minutes
    const refreshToken = generateToken();

    // Persist refresh token with 7 days expiry
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await pool.query('INSERT INTO public.refresh_tokens (token, user_id, expires_at) VALUES ($1, $2, $3)', [refreshToken, dbUser.id, expiresAt]);
    // Audit creation
    auditRefreshToken('create', refreshToken, dbUser.id, req).catch(() => { });

    const user = {
      id: dbUser.id,
      email: dbUser.email,
      name: dbUser.name || normalizedEmail.split('@')[0],
      phone: dbUser.phone || null,
      role: dbUser.role
    };

    // Update last_login timestamp
    await pool.query('UPDATE public.users SET last_login = now() WHERE id = $1', [dbUser.id]);

    res.json({ accessToken, refreshToken, user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Register/Sign up endpoint
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name, phone } = req.body;
    const normalizedEmail = normalizeEmail(email);

    if (!normalizedEmail || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Check if user already exists
    const { rows: existingUsers } = await pool.query('SELECT id FROM public.users WHERE LOWER(TRIM(email)) = $1', [normalizedEmail]);

    if (existingUsers.length > 0) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const passwordHash = hashPassword(password);

    // Insert new user
    const { rows } = await pool.query(
      'INSERT INTO public.users (email, password_hash, name, phone, role, is_active) VALUES ($1, $2, $3, $4, $5, true) RETURNING id, email, name, role, phone',
      [normalizedEmail, passwordHash, name || normalizedEmail.split('@')[0], phone || null, 'customer']
    );

    const dbUser = rows[0];
    // For consistency with login, create access + refresh tokens for new user
    const accessToken = signJwt({ sub: dbUser.id, role: dbUser.role }, 15 * 60);
    const refreshToken = generateToken();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await pool.query('INSERT INTO public.refresh_tokens (token, user_id, expires_at) VALUES ($1, $2, $3)', [refreshToken, dbUser.id, expiresAt]);
    // Audit creation
    auditRefreshToken('create', refreshToken, dbUser.id, req).catch(() => { });

    const user = {
      id: dbUser.id,
      email: dbUser.email,
      name: dbUser.name,
      role: dbUser.role
    };

    res.json({ accessToken, refreshToken, user });

    // Send welcome notification
    createNotification(dbUser.id, 'welcome', 'Welcome! 🎉', `Welcome to Kuku ni Sisi, ${dbUser.name}! Explore our delicious menu and place your first order.`).catch(() => { });

    // Send welcome email via Resend
    if (config.email.apiKey) {
      resend.emails.send({
        from: config.email.from,
        to: [email],
        reply_to: config.email.supportEmail,
        subject: 'Welcome to Kuku ni Sisi! 🍗',
        html: getWelcomeTemplate(dbUser.name)
      })
        .then(result => {
          if (result.error) {
            console.error('Resend Error (Welcome):', result.error);
          } else {
            console.log('Welcome email sent successfully:', result.data?.id);
          }
        })
        .catch(err => console.error('CRITICAL: Failed to send welcome email:', err.message));
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Logout endpoint
app.post('/api/auth/logout', (req, res) => {
  // Try to remove token mapping if present
  try {
    const authHeader = req.headers['authorization'] || req.headers['Authorization'];
    let token = null;
    if (authHeader && typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
      token = authHeader.slice(7).trim();
    }
    // If client provides refresh token in body, remove it from DB
    if (req.body && req.body.refresh_token) {
      const r = req.body.refresh_token;
      pool.query('DELETE FROM public.refresh_tokens WHERE token = $1', [r]).catch(() => { });
      // Audit revoke
      auditRefreshToken('revoke', r, null, req).catch(() => { });
    }
    // No need to remove access JWT server-side; client should delete it. For legacy dev flows, remove from tokenStore if present.
    if (token && tokenStore.has(token)) tokenStore.delete(token);
  } catch (err) {
    // silent
  }
  res.json({ success: true });
});

// Refresh access token using refresh token
app.post('/api/auth/refresh', async (req, res) => {
  try {
    const { refresh_token } = req.body || {};
    if (!refresh_token) return res.status(400).json({ error: 'Missing refresh token' });
    // Validate existing refresh token
    const { rows } = await pool.query('SELECT token, user_id, expires_at FROM public.refresh_tokens WHERE token = $1', [refresh_token]);
    if (!rows || rows.length === 0) return res.status(401).json({ error: 'Invalid refresh token' });
    const row = rows[0];
    const expiresAt = new Date(row.expires_at);
    if (Date.now() > expiresAt.getTime()) {
      // Remove expired token
      await pool.query('DELETE FROM public.refresh_tokens WHERE token = $1', [refresh_token]).catch(() => { });
      return res.status(401).json({ error: 'Refresh token expired' });
    }

    // Fetch user role
    const { rows: urows } = await pool.query('SELECT id, role FROM public.users WHERE id = $1', [row.user_id]);
    if (!urows || urows.length === 0) return res.status(401).json({ error: 'User not found' });
    const user = urows[0];

    // Rate-limit by IP to prevent brute-force/abuse
    const ip = req.ip || req.headers['x-forwarded-for'] || req.connection && req.connection.remoteAddress;
    if (isRateLimited(ip)) return res.status(429).json({ error: 'Too many requests' });

    // Rotate refresh token: delete old, insert new
    const newRefresh = generateToken();
    const newExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      try {
        await client.query('DELETE FROM public.refresh_tokens WHERE token = $1', [refresh_token]);
        await client.query('INSERT INTO public.refresh_tokens (token, user_id, expires_at) VALUES ($1, $2, $3)', [newRefresh, user.id, newExpiresAt]);
        await client.query('COMMIT');
      } catch (err) {
        await client.query('ROLLBACK').catch(() => { });
        console.error('Failed to rotate refresh token', err);
        return res.status(500).json({ error: 'Failed to refresh token' });
      }
    } finally {
      client.release();
    }

    // Audit rotation: revoke old and create new
    auditRefreshToken('rotate_old', refresh_token, user.id, req).catch(() => { });
    auditRefreshToken('create', newRefresh, user.id, req).catch(() => { });

    const accessToken = signJwt({ sub: user.id, role: user.role }, 15 * 60);
    return res.json({ accessToken, refreshToken: newRefresh });
  } catch (err) {
    console.error('Refresh token error', err);
    return res.status(500).json({ error: 'Failed to refresh token' });
  }
});

// List active refresh token sessions for current user
app.get('/api/auth/sessions', requireAuth(), async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT token, created_at, expires_at FROM public.refresh_tokens WHERE user_id = $1 ORDER BY created_at DESC', [req.user.id]);
    const sessions = (rows || []).map(r => ({ token: r.token, createdAt: r.created_at, expiresAt: r.expires_at }));
    return res.json(sessions);
  } catch (err) {
    console.error('Failed to fetch sessions', err);
    return res.status(500).json({ error: 'DB error' });
  }
});

// Revoke a specific refresh token belonging to the user
app.post('/api/auth/revoke/:token', requireAuth(), async (req, res) => {
  try {
    const token = req.params.token;
    await pool.query('DELETE FROM public.refresh_tokens WHERE token = $1 AND user_id = $2', [token, req.user.id]);
    // audit revoke
    auditRefreshToken('revoke', token, req.user.id, req).catch(() => { });
    return res.json({ success: true });
  } catch (err) {
    console.error('Failed to revoke session', err);
    return res.status(500).json({ error: 'DB error' });
  }
});

// ============ MENU ENDPOINTS ============



app.get('/api/categories', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT id, name, description, image_url, display_order, is_active FROM public.menu_categories WHERE is_active = true AND name NOT LIKE \'%Test%\' ORDER BY display_order');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DB error' });
  }
});

app.get('/api/menu', async (req, res) => {
  try {
    const { category } = req.query;
    let result;
    if (category) {
      result = await pool.query(
        'SELECT m.*, c.name as category_name FROM public.menu_items m JOIN public.menu_categories c ON m.category_id = c.id WHERE m.category_id = $1 AND c.is_active = true AND c.name NOT LIKE \'%Test%\' AND m.name NOT LIKE \'%Test%\'',
        [category]
      );
    } else {
      result = await pool.query(
        'SELECT m.*, c.name as category_name FROM public.menu_items m JOIN public.menu_categories c ON m.category_id = c.id WHERE c.is_active = true AND c.name NOT LIKE \'%Test%\' AND m.name NOT LIKE \'%Test%\' ORDER BY m.created_at DESC'
      );
    }
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DB error' });
  }
});

// --------------------
// Rider mock endpoints
// These provide a lightweight API for the rider dashboard while a full
// orders subsystem is not yet implemented. They operate on an in-memory
// list and are suitable for local development and testing.
// --------------------

// SSE clients map: stores {res, userId, role} for each connection to prevent data leaks
// Key: UUID string, Value: {res, userId, role}
const sseClients = new Map();

// Simple in-memory rate limiter for critical endpoints (per IP)
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = parseInt(process.env.REFRESH_RATE_LIMIT_MAX || '6');

const isRateLimited = (ip) => {
  const now = Date.now();
  const entry = rateLimitMap.get(ip) || { count: 0, windowStart: now };
  if (now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    // reset window
    entry.count = 1;
    entry.windowStart = now;
    rateLimitMap.set(ip, entry);
    return false;
  }
  entry.count += 1;
  rateLimitMap.set(ip, entry);
  return entry.count > RATE_LIMIT_MAX;
};

// Ensure audit table for refresh token operations
const ensureRefreshTokensAuditTable = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS public.refresh_tokens_audit (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        token TEXT,
        user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
        action TEXT NOT NULL,
        ip TEXT,
        user_agent TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);
  } catch (err) {
    console.error('Failed to ensure refresh_tokens_audit table:', err);
  }
};

const auditRefreshToken = async (action, token, userId, req) => {
  try {
    const ip = (req && (req.ip || req.headers['x-forwarded-for'] || req.connection && req.connection.remoteAddress)) || null;
    const ua = (req && req.headers && req.headers['user-agent']) || null;
    await pool.query('INSERT INTO public.refresh_tokens_audit (token, user_id, action, ip, user_agent) VALUES ($1, $2, $3, $4, $5)', [token, userId, action, ip, ua]);
  } catch (err) {
    // audit failures should not block main flow
    console.warn('Failed to write refresh token audit:', err && err.message);
  }
};

// Ensure rider_orders table exists (create from migration if missing)
const ensureRiderOrdersTable = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS public.rider_orders (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        order_number TEXT NOT NULL,
        status TEXT NOT NULL,
        customer_name TEXT,
        customer_phone TEXT,
        items JSONB DEFAULT '[]'::jsonb,
        total NUMERIC DEFAULT 0,
        address JSONB DEFAULT '{}'::jsonb,
        distance TEXT,
        estimated_time TEXT,
        payment_method TEXT,
        assigned_rider_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
      );
      -- Ensure payment_method column exists
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'rider_orders' AND column_name = 'payment_method'
        ) THEN
          ALTER TABLE public.rider_orders ADD COLUMN payment_method TEXT;
        END IF;
      END
      $$;
    `);

    // Ensure unique constraint on order_number for ON CONFLICT to work
    await pool.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'rider_orders_order_number_key'
        ) THEN
          -- First remove duplicates keeping the latest updated_at
          DELETE FROM public.rider_orders a USING (
            SELECT MAX(updated_at) as updated_at, order_number 
            FROM public.rider_orders 
            GROUP BY order_number 
            HAVING COUNT(*) > 1
          ) b
          WHERE a.order_number = b.order_number 
          AND a.updated_at < b.updated_at;

          -- Add the unique constraint
          ALTER TABLE public.rider_orders ADD CONSTRAINT rider_orders_order_number_key UNIQUE (order_number);
        END IF;
      END
      $$;
    `);
  } catch (err) {
    console.error('Failed to ensure rider_orders table:', err);
  }
};

// Ensure menu tables exist and are seeded
const ensureMenuTables = async () => {
  try {
    // Create categories table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS public.menu_categories (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        description TEXT,
        image_url TEXT,
        display_order INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      CREATE INDEX IF NOT EXISTS idx_menu_categories_order ON public.menu_categories(display_order);
      CREATE INDEX IF NOT EXISTS idx_menu_categories_active ON public.menu_categories(is_active) WHERE is_active = true;
    `);

    // Create menu items table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS public.menu_items (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        category_id UUID REFERENCES public.menu_categories(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        description TEXT,
        price NUMERIC NOT NULL,
        image_url TEXT,
        secondary_image_url TEXT,
        is_featured BOOLEAN DEFAULT false,
        tags TEXT[] DEFAULT '{}',
        tier_pricing JSONB DEFAULT '[]'::jsonb,
        is_available BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      CREATE INDEX IF NOT EXISTS idx_menu_items_category ON public.menu_items(category_id);
      CREATE INDEX IF NOT EXISTS idx_menu_items_available ON public.menu_items(is_available) WHERE is_available = true;
    `);

    // Ensure newer columns exist for existing deployments
    await pool.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_schema = 'public'
            AND table_name = 'menu_items'
            AND column_name = 'secondary_image_url'
        ) THEN
          ALTER TABLE public.menu_items ADD COLUMN secondary_image_url TEXT;
        END IF;

        IF NOT EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_schema = 'public'
            AND table_name = 'menu_items'
            AND column_name = 'is_featured'
        ) THEN
          ALTER TABLE public.menu_items ADD COLUMN is_featured BOOLEAN DEFAULT false;
        END IF;

        IF NOT EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_schema = 'public'
            AND table_name = 'menu_items'
            AND column_name = 'tags'
        ) THEN
          ALTER TABLE public.menu_items ADD COLUMN tags TEXT[] DEFAULT '{}';
        END IF;

        IF NOT EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_schema = 'public'
            AND table_name = 'menu_items'
            AND column_name = 'tier_pricing'
        ) THEN
          ALTER TABLE public.menu_items ADD COLUMN tier_pricing JSONB DEFAULT '[]'::jsonb;
        END IF;
      END$$;
    `);

    // Seed categories if empty
    const { rows: count } = await pool.query('SELECT count(*) FROM public.menu_categories');
    if (parseInt(count[0].count) === 0) {
      console.log('Seeding menu categories...');

      const categories = [
        { name: 'Restaurant', description: 'Delicious cooked meals prepared with love', image_url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&q=80', display_order: 1 },
        { name: 'Butchery', description: 'Fresh high-quality cuts of meat', image_url: 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?auto=format&fit=crop&q=80', display_order: 2 },
        { name: 'Groceries', description: 'Fresh fruits, vegetables and essentials', image_url: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80', display_order: 3 }
      ];

      for (const cat of categories) {
        const { rows } = await pool.query(
          'INSERT INTO public.menu_categories (name, description, image_url, display_order) VALUES ($1, $2, $3, $4) RETURNING id',
          [cat.name, cat.description, cat.image_url, cat.display_order]
        );
        const catId = rows[0].id;

        // Seed items for this category
        if (cat.name === 'Restaurant') {
          await pool.query('INSERT INTO public.menu_items (category_id, name, description, price, image_url) VALUES ($1, $2, $3, $4, $5)',
            [catId, 'Kuku Choma (Half)', 'Grilled chicken served with ugali/chips and kachumbari', 850, 'https://images.unsplash.com/photo-1598103442097-8b74394b95c6?auto=format&fit=crop&q=80']);
          await pool.query('INSERT INTO public.menu_items (category_id, name, description, price, image_url) VALUES ($1, $2, $3, $4, $5)',
            [catId, 'Swahili Pilau', 'Aromatic rice cooked with beef and spices', 450, 'https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&q=80']);
        } else if (cat.name === 'Butchery') {
          await pool.query('INSERT INTO public.menu_items (category_id, name, description, price, image_url) VALUES ($1, $2, $3, $4, $5)',
            [catId, 'Beef Steak (1kg)', 'Premium beef steak cut', 750, 'https://images.unsplash.com/photo-1603048297172-c92544798d5e?auto=format&fit=crop&q=80']);
          await pool.query('INSERT INTO public.menu_items (category_id, name, description, price, image_url) VALUES ($1, $2, $3, $4, $5)',
            [catId, 'Goat Meat (1kg)', 'Fresh goat meat on bone', 800, 'https://images.unsplash.com/photo-1627582875323-289520e5e03a?auto=format&fit=crop&q=80']);
        } else if (cat.name === 'Groceries') {
          await pool.query('INSERT INTO public.menu_items (category_id, name, description, price, image_url) VALUES ($1, $2, $3, $4, $5)',
            [catId, 'Fresh Sukuma Wiki', 'Fresh kale bunch', 50, 'https://images.unsplash.com/photo-1528796760573-00a8979d40fe?auto=format&fit=crop&q=80']);
          await pool.query('INSERT INTO public.menu_items (category_id, name, description, price, image_url) VALUES ($1, $2, $3, $4, $5)',
            [catId, 'Tomatoes (1kg)', 'Ripe red tomatoes', 120, 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&q=80']);
        }
      }
      console.log('✅ Menu categories and items seeded');
    }

    // Ensure "Beverages & Snacks" category exists and consolidate old beverage/snack items into it
    const { rows: comboRows } = await pool.query(
      `SELECT id, name FROM public.menu_categories WHERE LOWER(name) = LOWER($1) LIMIT 1`,
      ['Beverages & Snacks']
    );

    let comboCategoryId = comboRows[0]?.id || null;
    if (!comboCategoryId) {
      const inserted = await pool.query(
        `INSERT INTO public.menu_categories (name, description, image_url, display_order, is_active)
         VALUES ($1, $2, $3, $4, true)
         RETURNING id`,
        [
          'Beverages & Snacks',
          'Hot and cold drinks, refreshments, and light bites.',
          '/placeholder.svg',
          4,
        ]
      );
      comboCategoryId = inserted.rows[0].id;
    }

    const { rows: legacyCategoryRows } = await pool.query(
      `SELECT id, name
       FROM public.menu_categories
       WHERE LOWER(name) IN ('beverages', 'snacks')
         AND id <> $1`,
      [comboCategoryId]
    );

    for (const category of legacyCategoryRows) {
      await pool.query(
        `UPDATE public.menu_items
         SET category_id = $1, updated_at = now()
         WHERE category_id = $2`,
        [comboCategoryId, category.id]
      );

      await pool.query(
        `UPDATE public.menu_categories
         SET is_active = false, updated_at = now()
         WHERE id = $1`,
        [category.id]
      );
    }
  } catch (err) {
    console.error('Failed to ensure menu tables:', err);
  }
};

// Ensure refresh_tokens table exists
const ensureRefreshTokensTable = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS public.refresh_tokens (
        token TEXT PRIMARY KEY,
        user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
        expires_at TIMESTAMPTZ NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);
  } catch (err) {
    console.error('Failed to ensure refresh_tokens table:', err);
  }
};

// Ensure auth-related columns exist on older deployments
const ensureAuthSchema = async () => {
  try {
    await pool.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'phone'
        ) THEN
          ALTER TABLE public.users ADD COLUMN phone TEXT;
        END IF;

        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'role'
        ) THEN
          ALTER TABLE public.users ADD COLUMN role TEXT NOT NULL DEFAULT 'customer';
        END IF;

        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'is_active'
        ) THEN
          ALTER TABLE public.users ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT true;
        END IF;

        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'avatar_url'
        ) THEN
          ALTER TABLE public.users ADD COLUMN avatar_url TEXT;
        END IF;

        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'last_login'
        ) THEN
          ALTER TABLE public.users ADD COLUMN last_login TIMESTAMPTZ;
        END IF;

        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'reset_token'
        ) THEN
          ALTER TABLE public.users ADD COLUMN reset_token TEXT;
        END IF;

        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'reset_token_expires'
        ) THEN
          ALTER TABLE public.users ADD COLUMN reset_token_expires TIMESTAMPTZ;
        END IF;

        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'created_at'
        ) THEN
          ALTER TABLE public.users ADD COLUMN created_at TIMESTAMPTZ NOT NULL DEFAULT now();
        END IF;

        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'updated_at'
        ) THEN
          ALTER TABLE public.users ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
        END IF;
      END
      $$;
    `);

    await pool.query(`
      UPDATE public.users
      SET role = COALESCE(NULLIF(role, ''), 'customer'),
          is_active = COALESCE(is_active, true)
      WHERE role IS NULL OR role = '' OR is_active IS NULL;
    `);
  } catch (err) {
    console.error('Failed to ensure auth schema:', err);
  }
};

// Ensure customer_addresses table exists
const ensureCustomerAddressesTable = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS public.customer_addresses (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
        label TEXT,
        street TEXT,
        city TEXT,
        phone TEXT,
        instructions TEXT,
        latitude NUMERIC,
        longitude NUMERIC,
        is_default BOOLEAN DEFAULT false,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);
  } catch (err) {
    console.error('Failed to ensure customer_addresses table:', err);
  }
};

// Ensure orders table exists
const ensureOrdersTable = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS public.orders (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        customer_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
        delivery_address_id UUID REFERENCES public.customer_addresses(id) ON DELETE SET NULL,
        subtotal NUMERIC DEFAULT 0,
        delivery_fee NUMERIC DEFAULT 0,
        discount NUMERIC DEFAULT 0,
        total NUMERIC DEFAULT 0,
        notes TEXT,
        promotion_code TEXT,
        payment_method TEXT,
        phone TEXT,
        status TEXT DEFAULT 'created',
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);

    // Ensure assigned_rider_id column exists
    await pool.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'orders' AND column_name = 'assigned_rider_id'
        ) THEN
          ALTER TABLE public.orders ADD COLUMN assigned_rider_id UUID REFERENCES public.users(id) ON DELETE SET NULL;
        END IF;

        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'orders' AND column_name = 'payment_method'
        ) THEN
          ALTER TABLE public.orders ADD COLUMN payment_method TEXT;
        END IF;

        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'orders' AND column_name = 'phone'
        ) THEN
          ALTER TABLE public.orders ADD COLUMN phone TEXT;
        END IF;
      END
      $$;
    `);
  } catch (err) {
    console.error('Failed to ensure orders table:', err);
  }
};

// Ensure order_items table exists
const ensureOrderItemsTable = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS public.order_items (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
        menu_item_id UUID REFERENCES public.menu_items(id) ON DELETE SET NULL,
        name TEXT,
        quantity INTEGER DEFAULT 1,
        unit_price NUMERIC DEFAULT 0,
        total_price NUMERIC DEFAULT 0,
        notes TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);
  } catch (err) {
    console.error('Failed to ensure order_items table:', err);
  }
};

// Ensure favorites table exists
const ensureFavoritesTable = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS public.favorites (
        user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
        item_id UUID REFERENCES public.menu_items(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        PRIMARY KEY (user_id, item_id)
      );
    `);
  } catch (err) {
    console.error('Failed to ensure favorites table:', err);
  }
};

// Ensure MPESA tables exist
const ensureMpesaTables = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS public.mpesa_stk_requests (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
        merchant_request_id TEXT,
        checkout_request_id TEXT,
        response_code TEXT,
        response_description TEXT,
        amount NUMERIC,
        phone TEXT,
        account_reference TEXT,
        transaction_desc TEXT,
        status TEXT DEFAULT 'initiated',
        provider_response JSONB,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);

    await pool.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_mpesa_stk_requests_checkout ON public.mpesa_stk_requests(checkout_request_id);
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS public.mpesa_stk_callbacks (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        stk_request_id UUID REFERENCES public.mpesa_stk_requests(id) ON DELETE SET NULL,
        merchant_request_id TEXT,
        checkout_request_id TEXT,
        result_code INTEGER,
        result_desc TEXT,
        mpesa_receipt_number TEXT,
        amount NUMERIC,
        phone TEXT,
        transaction_date TEXT,
        body JSONB,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);

    await pool.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'orders' AND column_name = 'payment_status'
        ) THEN
          ALTER TABLE public.orders ADD COLUMN payment_status TEXT DEFAULT 'pending';
        END IF;
      END
      $$;
    `);
  } catch (err) {
    console.error('Failed to ensure MPesa tables:', err);
  }
};

// Ensure notifications table
const ensureNotificationsTable = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS public.notifications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
        type TEXT NOT NULL DEFAULT 'info',
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        data JSONB DEFAULT '{}',
        is_read BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);
    // Ensure 'data' column exists (may be missing if table was created in an older version)
    await pool.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = 'notifications' AND column_name = 'data'
        ) THEN
          ALTER TABLE public.notifications ADD COLUMN data JSONB DEFAULT '{}';
        END IF;
      END
      $$;
    `);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id, created_at DESC);`);
    console.log('✅ Notifications table ready (with data column)');
  } catch (err) {
    console.error('Failed to ensure notifications table:', err);
  }
};

// Helper: create a notification and broadcast via SSE
async function createNotification(userId, type, title, message, data = {}) {
  try {
    console.log(`Creating notification for user ${userId}: ${title}`);
    const { rows } = await pool.query(
      `INSERT INTO public.notifications (user_id, type, title, message, data) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [userId, type, title, message, JSON.stringify(data)]
    );
    const notification = rows[0];
    console.log('Notification created:', notification.id);

    // Broadcast to connected SSE clients
    broadcastRiderEvent({ type: 'notification.new', notification });
    return notification;
  } catch (err) {
    logger.error('Failed to create notification', err);
    return null;
  }
}

// Helper: broadcast a notification to multiple users based on role
async function createBroadcastNotification(targetRole, type, title, message, data = {}) {
  try {
    let userQuery = 'SELECT id FROM public.users';
    let params = [];

    if (targetRole && targetRole !== 'all') {
      userQuery += ' WHERE role = $1';
      params.push(targetRole);
    }

    const { rows: users } = await pool.query(userQuery, params);
    console.log(`Broadcast to ${targetRole}: found ${users.length} users`);
    const notifications = [];

    for (const user of users) {
      const { rows } = await pool.query(
        `INSERT INTO public.notifications (user_id, type, title, message, data) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [user.id, type, title, message, JSON.stringify(data)]
      );
      if (rows[0]) {
        notifications.push(rows[0]);
      }
    }
    console.log(`Broadcast created ${notifications.length} notifications`);

    // Broadcast one event indicating new notifications are available
    // Clients will fetch their own via the API, but we can also broadcast the broadcast itself
    broadcastRiderEvent({
      type: 'notification.broadcast',
      targetRole,
      title,
      message,
      data
    });

    return notifications;
  } catch (err) {
    logger.error('Failed to create broadcast notification', err);
    return null;
  }
}

// Broadcast helpers for SSE - with user/role filtering to prevent data leaks
const broadcastToUser = (userId, event) => {
  const data = `data: ${JSON.stringify(event)}\n\n`;
  for (const [, client] of sseClients) {
    if (client.userId === userId) {
      try {
        client.res.write(data);
      } catch (err) {
        // ignore write errors; client will close and be removed
      }
    }
  }
};

const broadcastToRole = (role, event) => {
  const data = `data: ${JSON.stringify(event)}\n\n`;
  for (const [, client] of sseClients) {
    if (client.role === role) {
      try {
        client.res.write(data);
      } catch (err) {
        // ignore write errors; client will close and be removed
      }
    }
  }
};

const broadcastToRider = (riderId, event) => {
  const data = `data: ${JSON.stringify(event)}\n\n`;
  for (const [, client] of sseClients) {
    if (client.userId === riderId && client.role === 'rider') {
      try {
        client.res.write(data);
      } catch (err) {
        // ignore write errors; client will close and be removed
      }
    }
  }
};

// Keep for backward compatibility - broadcasts to all rider clients only
const broadcastRiderEvent = (event) => {
  const data = `data: ${JSON.stringify(event)}\n\n`;
  for (const [, client] of sseClients) {
    if (client.role === 'rider') {
      try {
        client.res.write(data);
      } catch (err) {
        // ignore write errors; client will close and be removed
      }
    }
  }
};

/**
 * Syncs an order to the rider_orders table and broadcasts it to rider SSE clients.
 * Consolidates logic for admin assignment and status updates.
 */
async function syncRiderOrder(orderId) {
  try {
    // 1. Fetch order details from main orders table
    const { rows: orderRows } = await pool.query(
      `SELECT o.id, o.status, o.total, o.payment_method, u.name as customer_name, ca.phone as customer_phone,
              ca.street, ca.city, ca.label as address_label, ca.latitude, ca.longitude, o.assigned_rider_id, o.created_at
       FROM public.orders o
       LEFT JOIN public.users u ON o.customer_id = u.id
       LEFT JOIN public.customer_addresses ca ON o.delivery_address_id = ca.id
       WHERE o.id = $1`,
      [orderId]
    );

    if (orderRows.length === 0) return null;
    const order = orderRows[0];

    // 2. Fetch order items
    const { rows: orderItems } = await pool.query(
      'SELECT name, quantity FROM public.order_items WHERE order_id = $1',
      [orderId]
    );
    const items = orderItems.map(item => ({ name: item.name, quantity: item.quantity }));

    // 3. Upsert into rider_orders using the shared order ID
    // We map 'ready_for_pickup' to 'assigned' if a rider is present
    // Map statuses for rider dashboard appropriately
    let riderStatus = order.status;
    // When a rider is assigned but hasn't accepted yet, map pre-acceptance statuses to 'assigned'
    // so the order shows up on the rider's dashboard
    // Note: 'created' (Pending M-Pesa) should NOT be visible to riders until it becomes 'pending'
    if (order.assigned_rider_id && ['ready_for_pickup', 'preparing', 'pending'].includes(order.status)) {
      riderStatus = 'assigned';
    }

    // Skip syncing to rider dashboard if the order is still in 'created' status (pending payment)
    if (order.status === 'created') {
      return null;
    }

    const { rows: riderUpdateRows } = await pool.query(
      `INSERT INTO public.rider_orders (id, order_number, status, customer_name, customer_phone, items, total, address, distance, estimated_time, payment_method, assigned_rider_id, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, now())
       ON CONFLICT (id) DO UPDATE SET 
         assigned_rider_id = EXCLUDED.assigned_rider_id, 
         status = EXCLUDED.status, 
         customer_name = EXCLUDED.customer_name,
         customer_phone = EXCLUDED.customer_phone,
         items = EXCLUDED.items,
         total = EXCLUDED.total,
         address = EXCLUDED.address,
         payment_method = EXCLUDED.payment_method,
         updated_at = now()
       RETURNING *`,
      [
        order.id,
        `SBT-${order.id.substring(0, 8).toUpperCase()}`,
        riderStatus,
        order.customer_name || 'Customer',
        order.customer_phone || '',
        JSON.stringify(items),
        order.total || 0,
        JSON.stringify({
          street: order.street || '',
          city: order.city || '',
          label: order.address_label || '',
          lat: order.latitude,
          lng: order.longitude
        }),
        '2.5 km', // Default placeholder
        '25 mins', // Default placeholder
        order.payment_method,
        order.assigned_rider_id,
        order.created_at
      ]
    );

    const riderOrder = riderUpdateRows[0];
    if (riderOrder) {
      broadcastRiderEvent({ type: 'order.updated', order: riderOrder });
    }
    return riderOrder;
  } catch (err) {
    console.error('Failed to sync rider order', err);
    return null;
  }
}

// Seed sample orders into DB if none exist (development convenience)
const seedRiderOrdersIfEmpty = async () => {
  try {
    // Aggressive cleanup: remove known mock orders reported by the user
    // including those with Waiyaki Way and Langata Road addresses
    const mockPatterns = ['SBT-MOCK%', 'ORD-1234%', 'ORD-5678%'];
    const mockAddresses = ['%Waiyaki Way%', '%Langata Road%'];

    await pool.query(
      "DELETE FROM public.rider_orders WHERE " +
      "(" + mockPatterns.map((_, i) => `order_number LIKE $${i + 1}`).join(' OR ') + ") OR " +
      "(" + mockAddresses.map((_, i) => `address::text LIKE $${mockPatterns.length + i + 1}`).join(' OR ') + ")",
      [...mockPatterns, ...mockAddresses]
    );

    console.log('✅ Mock orders cleanup completed');
  } catch (err) {
    console.warn('Failed to cleanup mock orders:', err);
  }
  return;
};

// Get available orders for rider
app.get('/api/rider/available', requireAuth('rider'), (req, res) => {
  (async () => {
    try {
      const riderId = req.user.id;
      // Get orders that are either:
      // 1. ready_for_pickup and not assigned to anyone
      // 2. assigned to this specific rider
      const { rows } = await pool.query(
        `SELECT * FROM public.rider_orders 
         WHERE (status = 'ready_for_pickup' AND (assigned_rider_id IS NULL OR assigned_rider_id = $1))
            OR (assigned_rider_id = $1 AND status IN ('assigned', 'accepted', 'preparing', 'ready_for_pickup', 'picked_up', 'on_the_way', 'arrived'))
         ORDER BY created_at DESC`,
        [riderId]
      );
      res.json(rows);
    } catch (err) {
      console.error('Failed to fetch rider available orders', err);
      res.status(500).json({ error: 'DB error' });
    }
  })();
});

// Accept an order for delivery
app.post('/api/rider/accept/:id', requireAuth('rider'), async (req, res) => {
  const { id } = req.params;
  const riderId = req.user.id;
  try {
    // 1. Update rider_orders table
    const { rows } = await pool.query(
      "UPDATE public.rider_orders SET status = 'accepted', assigned_rider_id = $1, updated_at = now() WHERE id = $2 RETURNING *",
      [riderId, id]
    );
    if (!rows || rows.length === 0) return res.status(404).json({ error: 'Order not found' });
    const riderOrder = rows[0];

    // 2. Update main orders table and get customer_id for notification
    const { rows: mainOrderRows } = await pool.query(
      "UPDATE public.orders SET status = 'accepted', assigned_rider_id = $1, updated_at = now() WHERE id = $2 RETURNING customer_id",
      [riderId, id]
    );

    // 3. Send notification to customer that rider has accepted their order (ONLY to that customer)
    if (mainOrderRows && mainOrderRows.length > 0 && mainOrderRows[0].customer_id) {
      const customerId = mainOrderRows[0].customer_id;
      createNotification(
        customerId,
        'order_assigned',
        'Rider Accepted Your Order 🚴',
        `Your order #${id.slice(-6).toUpperCase()} has been accepted. Your delivery is on the way!`,
        { orderId: id }
      ).catch(() => {});
      // Broadcast only to this specific customer
      broadcastToUser(customerId, { type: 'notification.new', notification: { type: 'order_assigned', orderId: id } }).catch(() => {});
    }

    broadcastRiderEvent({ type: 'order.updated', order: riderOrder });
    return res.json({ ok: true, order: riderOrder });
  } catch (err) {
    console.error('Failed to accept rider order', err);
    return res.status(500).json({ error: 'DB error' });
  }
});

// Update order status for a rider (picked_up, on_the_way, arrived, delivered)
app.post('/api/rider/update/:id', requireAuth('rider'), async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const allowed = ['picked_up', 'on_the_way', 'arrived', 'delivered'];
  if (!allowed.includes(status)) return res.status(400).json({ error: 'Invalid status' });

  try {
    // 1. Update rider_orders table
    const { rows } = await pool.query("UPDATE public.rider_orders SET status = $1, updated_at = now() WHERE id = $2 RETURNING *", [status, id]);
    if (!rows || rows.length === 0) return res.status(404).json({ error: 'Order not found' });
    const riderOrder = rows[0];

    // 2. Update main orders table and get customer_id for notification
    const mainStatus = (status === 'delivered') ? 'completed' : status;
    const { rows: mainOrderRows } = await pool.query(
      "UPDATE public.orders SET status = $1, updated_at = now() WHERE id = $2 RETURNING customer_id",
      [mainStatus, id]
    );

    // 3. Send real-time notifications to customer based on status (ONLY to that customer)
    if (mainOrderRows && mainOrderRows.length > 0 && mainOrderRows[0].customer_id) {
      const customerId = mainOrderRows[0].customer_id;
      const statusMessages = {
        'picked_up': { title: 'Your Order Picked Up 📦', message: 'Your order is now on the way to you!' },
        'on_the_way': { title: 'Delivery in Progress 🚴', message: 'Your order is on the way. Track your delivery on the map!' },
        'arrived': { title: 'Rider Arrived 🎯', message: 'Your rider has arrived at your location with your order!' },
        'delivered': { title: 'Order Delivered ✅', message: 'Your order has been delivered. Enjoy your meal!' }
      };
      const msg = statusMessages[status];
      if (msg) {
        createNotification(customerId, 'order_status', msg.title, msg.message, { orderId: id, status }).catch(() => {});
        // Broadcast only to this specific customer
        broadcastToUser(customerId, { type: 'notification.new', notification: { type: 'order_status', orderId: id, status } }).catch(() => {});
      }
    }

    broadcastRiderEvent({ type: 'order.updated', order: { ...riderOrder, status: mainStatus } });

    // Notify customer about rider status change
    if (riderOrder.customer_id) {
      const riderStatusMessages = {
        picked_up: 'Your order has been picked up by the rider',
        on_the_way: 'Your order is on the way! 🚴',
        arrived: 'Your rider has arrived at your location',
        delivered: 'Your order has been delivered. Enjoy! 🎉',
      };
      const msg = riderStatusMessages[status] || `Order update: ${status}`;
      createNotification(riderOrder.customer_id, 'order_status', 'Delivery Update', msg, { orderId: id, status: mainStatus }).catch(() => { });
    }

    return res.json({ ok: true, order: riderOrder });
  } catch (err) {
    console.error('Failed to update rider order', err);
    return res.status(500).json({ error: 'DB error' });
  }
});

// Get delivery history for a rider
app.get('/api/rider/history', requireAuth('rider'), async (req, res) => {
  try {
    const riderId = req.user.id;
    const { rows } = await pool.query(
      "SELECT * FROM public.rider_orders WHERE assigned_rider_id = $1 AND status = 'delivered' ORDER BY updated_at DESC LIMIT 50",
      [riderId]
    );
    res.json(rows || []);
  } catch (err) {
    logger.error('Failed to fetch rider history', err);
    res.status(500).json({ error: 'Failed to fetch rider history' });
  }
});

app.get('/api/rider/stream', requireAuth('rider'), (req, res) => {
  // Set headers for SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders && res.flushHeaders();

  // Send a comment to keep connection alive
  res.write(': connected\n\n');

  // Store connection with user info to prevent data leaks
  const clientId = crypto.randomUUID();
  sseClients.set(clientId, { res, userId: req.user.id, role: req.user.role || 'rider' });

  // remove when client disconnects
  req.on('close', () => {
    sseClients.delete(clientId);
  });
});

// General SSE stream for authenticated users (customers, admins)
app.get('/api/stream', requireAuth(), (req, res) => {
  // Set headers for SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders && res.flushHeaders();

  // Send a comment to keep connection alive
  res.write(': connected\n\n');

  // Store connection with user info to prevent data leaks
  const clientId = crypto.randomUUID();
  sseClients.set(clientId, { res, userId: req.user.id, role: req.user.role || 'customer' });

  // remove when client disconnects
  req.on('close', () => {
    sseClients.delete(clientId);
  });
});

// SSE heartbeat to keep connections alive and cleanup dead clients
setInterval(() => {
  // Also clean up any dead connections
  const deadClients = [];
  for (const [clientId, client] of sseClients) {
    if (!client || !client.res) {
      deadClients.push(clientId);
    }
  }
  for (const clientId of deadClients) {
    sseClients.delete(clientId);
  }
  const toRemove = [];
  for (const res of sseClients) {
    try {
      // comment ping
      res.write(': ping\n\n');
    } catch (err) {
      try { res.end(); } catch (e) { }
      toRemove.push(res);
    }
  }
  for (const r of toRemove) sseClients.delete(r);
}, 30 * 1000);

app.get('/api/health', (req, res) => {
  const dbStatus = dbManager.getStatus();
  const cbStatus = circuitBreaker.getStatus();

  res.json({
    ok: true,
    status: 'operational',
    database: dbStatus,
    circuitBreaker: cbStatus,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// ============ PRODUCT MANAGEMENT ENDPOINTS ============
const getUploadedFile = (req, field) => {
  if (!req || !req.files) return null;
  const files = req.files[field];
  return Array.isArray(files) && files.length > 0 ? files[0] : null;
};

// Get all products
app.get('/api/admin/products', requireAuth('admin'), async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM public.menu_items ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// Get single product
app.get('/api/admin/products/:id', requireAuth('admin'), async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM public.menu_items WHERE id = $1', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// Create new product with image
app.post('/api/admin/products', requireAuth('admin'), upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'secondary_image', maxCount: 1 },
]), async (req, res) => {
  try {
    const { name, description, price, category_id, preparation_time, is_featured, tags, tier_pricing } = req.body;

    // Validate required fields
    if (!name || !price || !category_id) {
      return res.status(400).json({ error: 'Name, price, and category are required' });
    }

    const primaryImageFile = getUploadedFile(req, 'image');
    const secondaryImageFile = getUploadedFile(req, 'secondary_image');

    let imageUrl = null;
    if (primaryImageFile) {
      const fileName = generateFileName(primaryImageFile.originalname);
      const result = await optimizeImage(primaryImageFile.buffer, 'products', fileName);

      if (!result.success) {
        return res.status(400).json({ error: 'Image optimization failed: ' + result.error });
      }

      // Use webp format with fallback to jpeg
      imageUrl = result.paths.webp || result.paths.jpeg;
    }

    let secondaryImageUrl = null;
    if (secondaryImageFile) {
      const fileName = generateFileName(secondaryImageFile.originalname);
      const result = await optimizeImage(secondaryImageFile.buffer, 'products', fileName);

      if (!result.success) {
        return res.status(400).json({ error: 'Secondary image optimization failed: ' + result.error });
      }

      secondaryImageUrl = result.paths.webp || result.paths.jpeg;
    }

    const normalizedTags = parseProductTags(tags);
    const normalizedTierPricing = parseTierPricing(tier_pricing);

    const { rows } = await pool.query(
      'INSERT INTO public.menu_items (name, description, price, category_id, image_url, secondary_image_url, is_featured, tags, tier_pricing, is_available) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, $10) RETURNING *',
      [
        name,
        description || null,
        price ? parseFloat(price) : 0,
        category_id,
        imageUrl,
        secondaryImageUrl,
        is_featured === 'true' || is_featured === true,
        normalizedTags,
        JSON.stringify(normalizedTierPricing),
        true // default to available on creation
      ]
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

// Update product with optional image
app.put('/api/admin/products/:id', requireAuth('admin'), upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'secondary_image', maxCount: 1 },
]), async (req, res) => {
  try {
    const { name, description, price, category_id, preparation_time, is_featured, is_available, tags, tier_pricing } = req.body;
    const productId = req.params.id;

    // Get current product
    const currentProduct = await pool.query('SELECT * FROM public.menu_items WHERE id = $1', [productId]);
    if (currentProduct.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const primaryImageFile = getUploadedFile(req, 'image');
    const secondaryImageFile = getUploadedFile(req, 'secondary_image');

    let imageUrl = currentProduct.rows[0].image_url;
    let secondaryImageUrl = currentProduct.rows[0].secondary_image_url;

    // Handle new image
    if (primaryImageFile) {
      const fileName = generateFileName(primaryImageFile.originalname);
      const result = await optimizeImage(primaryImageFile.buffer, 'products', fileName);

      if (!result.success) {
        return res.status(400).json({ error: 'Image optimization failed: ' + result.error });
      }

      // Delete old image if exists
      if (imageUrl) {
        const oldFileName = path.basename(imageUrl);
        await deleteImages('products', oldFileName);
      }

      imageUrl = result.paths.webp || result.paths.jpeg;
    }

    if (secondaryImageFile) {
      const fileName = generateFileName(secondaryImageFile.originalname);
      const result = await optimizeImage(secondaryImageFile.buffer, 'products', fileName);

      if (!result.success) {
        return res.status(400).json({ error: 'Secondary image optimization failed: ' + result.error });
      }

      if (secondaryImageUrl) {
        const oldFileName = path.basename(secondaryImageUrl);
        await deleteImages('products', oldFileName);
      }

      secondaryImageUrl = result.paths.webp || result.paths.jpeg;
    }

    const normalizedTags = tags !== undefined ? parseProductTags(tags) : (currentProduct.rows[0].tags || []);
    const normalizedTierPricing = tier_pricing !== undefined ? parseTierPricing(tier_pricing) : (currentProduct.rows[0].tier_pricing || []);

    const { rows } = await pool.query(
      'UPDATE public.menu_items SET name = $1, description = $2, price = $3, category_id = $4, image_url = $5, secondary_image_url = $6, is_featured = $7, tags = $8, tier_pricing = $9::jsonb, is_available = $10, updated_at = NOW() WHERE id = $11 RETURNING *',
      [
        name || currentProduct.rows[0].name,
        description !== undefined ? description : currentProduct.rows[0].description,
        price ? parseFloat(price) : currentProduct.rows[0].price,
        category_id || currentProduct.rows[0].category_id,
        imageUrl,
        secondaryImageUrl,
        is_featured !== undefined ? (is_featured === 'true' || is_featured === true) : currentProduct.rows[0].is_featured,
        normalizedTags,
        JSON.stringify(normalizedTierPricing),
        is_available !== undefined ? (is_available === 'true' || is_available === true) : currentProduct.rows[0].is_available,
        productId
      ]
    );

    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// Delete product and its image
app.delete('/api/admin/products/:id', requireAuth('admin'), async (req, res) => {
  try {
    const productId = req.params.id;

    // Get product to get image
    const { rows } = await pool.query('SELECT * FROM public.menu_items WHERE id = $1', [productId]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const product = rows[0];

    // Delete image if exists
    if (product.image_url) {
      const fileName = path.basename(product.image_url);
      await deleteImages('products', fileName);
    }
    if (product.secondary_image_url) {
      const fileName = path.basename(product.secondary_image_url);
      await deleteImages('products', fileName);
    }

    // Delete from database
    await pool.query('DELETE FROM public.menu_items WHERE id = $1', [productId]);
    res.json({ success: true, message: 'Product deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

// ============ CATEGORY MANAGEMENT ENDPOINTS ============

// Get all categories
// Get categories
app.get('/api/admin/categories', requireAuth('admin'), async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM public.menu_categories ORDER BY display_order');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// Create new category with image
app.post('/api/admin/categories', requireAuth('admin'), upload.single('image'), async (req, res) => {
  try {
    const { name, description, display_order, is_active } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Category name is required' });
    }

    let imageUrl = null;
    if (req.file) {
      const fileName = generateFileName(req.file.originalname);
      const result = await optimizeImage(req.file.buffer, 'categories', fileName);

      if (!result.success) {
        return res.status(400).json({ error: 'Image optimization failed: ' + result.error });
      }

      imageUrl = result.paths.webp || result.paths.jpeg;
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      try {
        const { rows } = await client.query(
          'INSERT INTO public.menu_categories (name, description, image_url, display_order, is_active) VALUES ($1, $2, $3, $4, $5) RETURNING *',
          [
            name,
            description || null,
            imageUrl,
            display_order ? parseInt(display_order) : 0,
            is_active === 'true' || is_active === true
          ]
        );
        await client.query('COMMIT');
        res.status(201).json(rows[0]);
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      }
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Failed to create category:', err);
    res.status(500).json({ error: 'Failed to create category' });
  }
});

// Update category with optional image
app.put('/api/admin/categories/:id', requireAuth('admin'), upload.single('image'), async (req, res) => {
  try {
    const { name, description, display_order, is_active } = req.body;
    const categoryId = req.params.id;

    const currentCategory = await pool.query('SELECT * FROM public.menu_categories WHERE id = $1', [categoryId]);
    if (currentCategory.rows.length === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }

    let imageUrl = currentCategory.rows[0].image_url;

    if (req.file) {
      const fileName = generateFileName(req.file.originalname);
      const result = await optimizeImage(req.file.buffer, 'categories', fileName);

      if (!result.success) {
        return res.status(400).json({ error: 'Image optimization failed: ' + result.error });
      }

      if (imageUrl) {
        const oldFileName = path.basename(imageUrl);
        await deleteImages('categories', oldFileName);
      }

      imageUrl = result.paths.webp || result.paths.jpeg;
    }

    const { rows } = await pool.query(
      'UPDATE public.menu_categories SET name = $1, description = $2, image_url = $3, display_order = $4, is_active = $5, updated_at = NOW() WHERE id = $6 RETURNING *',
      [
        name || currentCategory.rows[0].name,
        description !== undefined ? description : currentCategory.rows[0].description,
        imageUrl,
        display_order && display_order !== 'null' ? parseInt(display_order) : currentCategory.rows[0].display_order,
        is_active !== undefined ? (is_active === 'true' || is_active === true) : currentCategory.rows[0].is_active,
        categoryId
      ]
    );

    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update category' });
  }
});

// Delete category
app.delete('/api/admin/categories/:id', requireAuth('admin'), async (req, res) => {
  try {
    const categoryId = req.params.id;

    const { rows } = await pool.query('SELECT * FROM public.menu_categories WHERE id = $1', [categoryId]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }

    const category = rows[0];

    if (category.image_url) {
      const fileName = path.basename(category.image_url);
      await deleteImages('categories', fileName);
    }

    await pool.query('DELETE FROM public.menu_categories WHERE id = $1', [categoryId]);
    res.json({ success: true, message: 'Category deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

// ============ ORDERS ENDPOINTS ============

// Get all orders for authenticated user
app.get('/api/orders', requireAuth(), async (req, res) => {
  try {
    const userId = req.user.id;
    const { rows } = await pool.query(
      'SELECT * FROM public.orders WHERE customer_id = $1 ORDER BY created_at DESC LIMIT 50',
      [userId]
    );

    res.json(rows || []);
  } catch (err) {
    logger.error('Failed to fetch orders', err);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});


// Create a new order (authenticated users)
app.post('/api/orders', requireAuth(), async (req, res) => {
  try {
    const userId = req.user && req.user.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const FIXED_DELIVERY_FEE = 50;
    const ALLOWED_CITY = 'Nakuru';
    const {
      subtotal = 0,
      discount = 0,
      notes = null,
      promotion_code = null,
      promo_code = null,
      payment_method = 'cash',
      phone = null,
      delivery_address = null,
      items = []
    } = req.body || {};

    // Validate delivery city - only Nakuru orders accepted
    const deliveryCity = (delivery_address && (delivery_address.city || delivery_address.City)) || ALLOWED_CITY;
    if (deliveryCity.toLowerCase() !== ALLOWED_CITY.toLowerCase()) {
      return res.status(400).json({
        error: `Delivery not available in ${deliveryCity}`,
        message: `We currently only accept orders within ${ALLOWED_CITY}. Please select a delivery address in ${ALLOWED_CITY}.`,
        allowedCity: ALLOWED_CITY
      });
    }

    let deliveryAddressId = null;
    if (delivery_address && delivery_address.id) {
      deliveryAddressId = delivery_address.id;
    } else if (delivery_address && delivery_address.street) {
      const { rows: addrRows } = await pool.query(
        `INSERT INTO public.customer_addresses (user_id, label, street, city, phone, instructions, latitude, longitude, is_default, created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9, now(), now()) RETURNING id`,
        [
          userId,
          delivery_address.label || 'Home',
          delivery_address.street,
          delivery_address.city || 'Nakuru',
          delivery_address.phone || null,
          delivery_address.instructions || null,
          delivery_address.latitude || delivery_address.lat || null,
          delivery_address.longitude || delivery_address.lng || null,
          delivery_address.is_default || false
        ]
      );
      deliveryAddressId = addrRows && addrRows[0] && addrRows[0].id;
    }

    const initialStatus = payment_method === 'mpesa' ? 'created' : 'pending';

    const insertOrderQuery = `INSERT INTO public.orders (customer_id, delivery_address_id, subtotal, delivery_fee, discount, total, notes, promotion_code, payment_method, status, phone, created_at, updated_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11, now(), now()) RETURNING id, created_at`;

    const { rows } = await pool.query(insertOrderQuery, [
      userId,
      deliveryAddressId,
      subtotal,
      FIXED_DELIVERY_FEE,
      discount,
      Math.max(0, Number(subtotal || 0) + FIXED_DELIVERY_FEE - Number(discount || 0)),
      notes,
      promotion_code || promo_code,
      payment_method,
      initialStatus,
      phone
    ]);

    const orderId = rows && rows[0] && rows[0].id;

    // Insert order items
    for (const it of items || []) {
      const menuItemId = it.menu_item_id || null;
      const name = it.name || '';
      const quantity = Number(it.quantity) || 1;
      const unit_price = Number(it.unit_price) || 0;
      const total_price = Number(it.total_price) || unit_price * quantity;
      const itemNotes = it.notes || null;

      await pool.query(
        `INSERT INTO public.order_items (order_id, menu_item_id, name, quantity, unit_price, total_price, notes, created_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7, now())`,
        [orderId, menuItemId, name, quantity, unit_price, total_price, itemNotes]
      );
    }

    res.status(201).json({ success: true, orderId });

    // Notify customer about order placement (only to this customer)
    createNotification(userId, 'order_confirmed', 'Order Placed! 🛒', `Your order #${String(orderId).slice(-6).toUpperCase()} has been placed successfully.`, { orderId }).catch(() => { });
    // Also broadcast to customer's SSE connection
    broadcastToUser(userId, { type: 'notification.new', notification: { type: 'order_confirmed', orderId } }).catch(() => { });

    // Notify admin about new order (only admins receive this)
    createBroadcastNotification('admin', 'new_order', 'New Order Received 📋', `A new order #${String(orderId).slice(-6).toUpperCase()} has been received!`, { orderId }).catch(() => { });
    // Broadcast to all admin clients only
    broadcastToRole('admin', { type: 'notification.new', notification: { type: 'new_order', orderId } }).catch(() => { });
  } catch (err) {
    console.error('Failed to create order', err);
    logger.error('Failed to create order', err);
    if (config && config.isProd) {
      res.status(500).json({ error: 'Failed to create order' });
    } else {
      res.status(500).json({ error: 'Failed to create order', details: err && err.message ? err.message : String(err) });
    }
  }
});

// ============ ADMIN ORDER MANAGEMENT ENDPOINTS ============

// Get all orders (admin endpoint)
app.get('/api/admin/orders', requireAuth('admin'), async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT 
        o.id,
        o.customer_id,
        o.status,
        o.subtotal,
        o.discount,
        o.total,
        o.notes,
        o.payment_method,
        o.created_at,
        o.updated_at,
        u.name as customer_name,
        u.email as customer_email,
        ca.phone as customer_phone,
        CASE 
          WHEN ca.id IS NOT NULL THEN (COALESCE(ca.label, 'Address') || ': ' || COALESCE(ca.street, '') || ', ' || COALESCE(ca.city, ''))
          ELSE 'No address'
        END as address,
        o.assigned_rider_id,
        r.name as rider_name,
        array_agg(json_build_object('id', oi.id, 'name', oi.name, 'quantity', oi.quantity, 'unit_price', oi.unit_price, 'total_price', oi.total_price)) as items
      FROM public.orders o
      LEFT JOIN public.users u ON o.customer_id = u.id
      LEFT JOIN public.customer_addresses ca ON o.delivery_address_id = ca.id
      LEFT JOIN public.order_items oi ON o.id = oi.order_id
      LEFT JOIN public.users r ON o.assigned_rider_id = r.id
      GROUP BY o.id, u.id, ca.id, r.id
      ORDER BY o.created_at DESC
      LIMIT 100
    `);
    res.json(rows || []);
  } catch (err) {
    console.error('Failed to fetch admin orders', err);
    logger.error('Failed to fetch admin orders', err);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// Get single order details (admin endpoint)
app.get('/api/admin/orders/:id', requireAuth('admin'), async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT 
        o.id,
        o.customer_id,
        o.status,
        o.subtotal,
        o.delivery_fee,
        o.discount,
        o.total,
        o.notes,
        o.promotion_code,
        o.payment_method,
        o.created_at,
        o.updated_at,
        u.name as customer_name,
        u.email as customer_email,
        ca.phone as customer_phone,
        CASE 
          WHEN ca.id IS NOT NULL THEN (COALESCE(ca.label, 'Address') || ': ' || COALESCE(ca.street, '') || ', ' || COALESCE(ca.city, ''))
          ELSE 'No address'
        END as address,
        ca.phone as address_phone,
        ca.instructions as delivery_instructions,
        array_agg(json_build_object('id', oi.id, 'name', oi.name, 'quantity', oi.quantity, 'unit_price', oi.unit_price, 'total_price', oi.total_price)) as items
      FROM public.orders o
      LEFT JOIN public.users u ON o.customer_id = u.id
      LEFT JOIN public.customer_addresses ca ON o.delivery_address_id = ca.id
      LEFT JOIN public.order_items oi ON o.id = oi.order_id
      WHERE o.id = $1
      GROUP BY o.id, u.id, ca.id
    `, [req.params.id]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error('Failed to fetch order', err);
    logger.error('Failed to fetch order', err);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

// Update order status (admin endpoint)
app.put('/api/admin/orders/:id/status', requireAuth('admin'), async (req, res) => {
  try {
    const { status } = req.body || {};

    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    const validStatuses = ['pending', 'preparing', 'ready_for_pickup', 'on_the_way', 'delivered', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    // 1. Status Locking: Don't allow moving back from delivered/completed
    const { rows: currentOrderRows } = await pool.query('SELECT status, payment_method FROM public.orders WHERE id = $1', [req.params.id]);
    if (currentOrderRows.length === 0) return res.status(404).json({ error: 'Order not found' });

    const currentStatus = currentOrderRows[0].status;
    const paymentMethod = currentOrderRows[0].payment_method;

    if ((currentStatus === 'delivered' || currentStatus === 'completed') && status !== 'completed' && status !== 'delivered') {
      return res.status(400).json({ error: `Cannot move order from ${currentStatus} back to ${status}` });
    }

    // 2. COD Automation: Mark as paid if delivered
    let paymentStatusUpdate = '';
    if (status === 'delivered' && paymentMethod === 'cash') {
      paymentStatusUpdate = ", payment_status = 'paid'";
    }

    // If admin marks as delivered, auto-transition to completed for reports
    const finalStatus = (status === 'delivered') ? 'completed' : status;

    const { rows } = await pool.query(
      `UPDATE public.orders SET status = $1, updated_at = now() ${paymentStatusUpdate} WHERE id = $2 RETURNING *`,
      [finalStatus, req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const order = rows[0];

    // SYNC: Ensure rider dashboard is aware of this status change
    await syncRiderOrder(order.id);

    // Create notification for customer about status change
    if (order.customer_id) {
      const statusMessages = {
        pending: 'Your order has been received',
        preparing: 'Your order is being prepared',
        ready_for_pickup: 'Your order is ready for pickup',
        on_the_way: 'Your order is on the way!',
        completed: 'Your order has been delivered. Enjoy!',
        cancelled: 'Your order has been cancelled',
      };
      const msg = statusMessages[finalStatus] || `Order status updated to ${finalStatus}`;
      createNotification(order.customer_id, 'order_status', 'Order Update', msg, { orderId: order.id, status: finalStatus }).catch(() => { });
    }

    // Notify rider if assigned and status is ready_for_pickup
    if (order.assigned_rider_id && finalStatus === 'ready_for_pickup') {
      createNotification(order.assigned_rider_id, 'assigned', 'Order Ready for Pickup 📦', `Order #${order.id.slice(-6).toUpperCase()} is ready for pickup.`, { orderId: order.id }).catch(() => { });
    }

    res.json(order);
  } catch (err) {
    console.error('Failed to update order status', err);
    logger.error('Failed to update order status', err);
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

// Assign rider to order (admin endpoint)
app.post('/api/admin/orders/:id/assign-rider', requireAuth('admin'), async (req, res) => {
  try {
    const { rider_id } = req.body || {};
    const order_id = req.params.id;

    if (!rider_id) {
      return res.status(400).json({ error: 'Rider ID is required' });
    }

    // Verify rider exists and is a rider
    const { rows: riderRows } = await pool.query(
      'SELECT id, name, role FROM public.users WHERE id = $1 AND role = $2',
      [rider_id, 'rider']
    );

    if (riderRows.length === 0) {
      return res.status(404).json({ error: 'Rider not found' });
    }

    const rider = riderRows[0];

    // Assign the rider without changing the order status — let the rider accept first,
    // then progress through picked_up -> on_the_way -> delivered
    const { rows: orderRows } = await pool.query(
      `UPDATE public.orders 
       SET assigned_rider_id = $1,
           updated_at = now() 
       WHERE id = $2 
       RETURNING *`,
      [rider_id, order_id]
    );

    if (orderRows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const order = orderRows[0];

    // Notify rider of assignment
    createNotification(rider_id, 'assigned', 'New Order Assigned 🚴', `You have been assigned to order #${order_id.slice(-6).toUpperCase()}.`, { orderId: order_id }).catch(() => { });

    // Store assignment in rider_orders table for rider dashboard
    await syncRiderOrder(order.id);

    res.json({
      success: true,
      order,
      rider: { id: rider.id, name: rider.name, role: rider.role }
    });
  } catch (err) {
    console.error('Failed to assign rider', err);
    logger.error('Failed to assign rider', err);
    res.status(500).json({ error: 'Failed to assign rider' });
  }
});

// Admin: list riders
app.get('/api/admin/riders', requireAuth('admin'), async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT id, name, email FROM public.users WHERE role = 'rider' ORDER BY name");
    res.json(rows || []);
  } catch (err) {
    console.error('Failed to fetch riders', err);
    logger.error('Failed to fetch riders', err);
    res.status(500).json({ error: 'Failed to fetch riders' });
  }
});

// Admin: create rider
app.get('/api/admin/reports', requireAuth('admin'), async (req, res) => {
  try {
    // 1. Get summary stats — count both 'delivered' and 'completed' orders
    const statsQuery = `
      SELECT 
        (SELECT COALESCE(SUM(total), 0) FROM public.orders WHERE status IN ('delivered', 'completed')) as total_revenue,
        (SELECT COUNT(*) FROM public.orders WHERE status IN ('delivered', 'completed')) as total_orders,
        (SELECT COALESCE(AVG(total), 0) FROM public.orders WHERE status IN ('delivered', 'completed')) as avg_order_value,
        (SELECT COUNT(*) FROM public.users WHERE role = 'customer') as total_customers,
        (SELECT COUNT(*) FROM public.users WHERE role = 'rider') as total_riders
    `;
    const { rows: statsRows } = await pool.query(statsQuery);

    // 2. Sales by category
    const categoryQuery = `
      SELECT 
        c.name as name,
        COALESCE(SUM(oi.total_price), 0) as revenue,
        COUNT(DISTINCT o.id) as order_count
      FROM public.menu_categories c
      LEFT JOIN public.menu_items mi ON c.id = mi.category_id
      LEFT JOIN public.order_items oi ON mi.id = oi.menu_item_id
      LEFT JOIN public.orders o ON oi.order_id = o.id AND o.status IN ('delivered', 'completed')
      GROUP BY c.id, c.name
      ORDER BY revenue DESC
    `;
    const { rows: categoryRows } = await pool.query(categoryQuery);

    // 3. Weekly trend (last 7 days)
    const trendQuery = `
      SELECT 
        TO_CHAR(date, 'Dy') as label,
        COALESCE(SUM(o.total), 0) as revenue,
        COUNT(o.id) as order_count,
        DATE(date) as date
      FROM (
        SELECT CURRENT_DATE - i as date
        FROM generate_series(0, 6) i
      ) dates
      LEFT JOIN public.orders o ON DATE(o.created_at) = dates.date AND o.status IN ('delivered', 'completed')
      GROUP BY date, dates.date
      ORDER BY dates.date ASC
    `;
    const { rows: trendRows } = await pool.query(trendQuery);

    const topItemsQuery = `
      SELECT
        COALESCE(oi.name, mi.name, 'Item') as name,
        COALESCE(SUM(oi.quantity), 0) as quantity_sold,
        COALESCE(SUM(oi.total_price), 0) as revenue
      FROM public.order_items oi
      LEFT JOIN public.menu_items mi ON mi.id = oi.menu_item_id
      LEFT JOIN public.orders o ON o.id = oi.order_id
      WHERE o.status IN ('delivered', 'completed')
      GROUP BY COALESCE(oi.name, mi.name, 'Item')
      ORDER BY quantity_sold DESC, revenue DESC
      LIMIT 6
    `;
    const { rows: topItemRows } = await pool.query(topItemsQuery);

    res.json({
      stats: statsRows[0],
      categories: categoryRows,
      trend: trendRows,
      top_items: topItemRows
    });
  } catch (err) {
    console.error('Failed to fetch reports', err);
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
});

// Admin: get free delivery setting
app.get('/api/admin/settings/free_delivery', requireAuth('admin'), async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT value FROM public.app_settings WHERE key = $1', ['free_delivery']);
    if (!rows || rows.length === 0) {
      return res.json({ enabled: false });
    }
    const value = rows[0].value || {};
    return res.json(value);
  } catch (err) {
    console.error('Failed to fetch free_delivery setting', err);
    return res.status(500).json({ error: 'Failed to fetch setting' });
  }
});

// Admin: update free delivery setting
app.put('/api/admin/settings/free_delivery', requireAuth('admin'), async (req, res) => {
  try {
    const { enabled } = req.body;
    if (typeof enabled !== 'boolean') return res.status(400).json({ error: 'Invalid payload' });

    const val = { enabled };
    await pool.query(
      `INSERT INTO public.app_settings (key, value, created_at, updated_at)
       VALUES ($1, $2, now(), now())
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()`,
      ['free_delivery', JSON.stringify(val)]
    );

    return res.json(val);
  } catch (err) {
    console.error('Failed to update free_delivery setting', err);
    return res.status(500).json({ error: 'Failed to update setting' });
  }
});

app.post('/api/admin/riders', requireAuth('admin'), async (req, res) => {
  try {
    const { email, name, phone, password } = req.body || {};
    const normalizedEmail = normalizeEmail(email);
    if (!normalizedEmail || !name) return res.status(400).json({ error: 'email and name are required' });

    // generate a password if not provided
    const pwd = password || crypto.randomBytes(6).toString('hex');
    const passwordHash = hashPassword(pwd);

    const { rows } = await pool.query(
      'INSERT INTO public.users (email, password_hash, name, phone, role, is_active, created_at, updated_at) VALUES ($1,$2,$3,$4,$5,true, now(), now()) RETURNING id, email, name, phone, role',
      [normalizedEmail, passwordHash, name, phone || null, 'rider']
    );

    const rider = rows[0];
    res.status(201).json({ rider, password: pwd });
  } catch (err) {
    console.error('Failed to create rider', err);
    logger.error('Failed to create rider', err);
    res.status(500).json({ error: 'Failed to create rider' });
  }
});

// Admin: delete rider
app.delete('/api/admin/riders/:id', requireAuth('admin'), async (req, res) => {
  try {
    const { rows } = await pool.query('DELETE FROM public.users WHERE id = $1 AND role = $2 RETURNING id', [req.params.id, 'rider']);
    if (!rows || rows.length === 0) return res.status(404).json({ error: 'Rider not found' });
    res.json({ success: true });
  } catch (err) {
    console.error('Failed to delete rider', err);
    logger.error('Failed to delete rider', err);
    res.status(500).json({ error: 'Failed to delete rider' });
  }
});

// Admin: manage customers
app.get('/api/admin/customers', requireAuth('admin'), async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT id, name, email, phone, created_at FROM public.users WHERE role = 'customer' ORDER BY created_at DESC");
    res.json(rows || []);
  } catch (err) {
    console.error('Failed to fetch customers', err);
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
});

app.post('/api/admin/customers', requireAuth('admin'), async (req, res) => {
  try {
    const { email, name, phone, password } = req.body || {};
    const normalizedEmail = normalizeEmail(email);
    if (!normalizedEmail || !name) return res.status(400).json({ error: 'email and name are required' });
    const pwd = password || crypto.randomBytes(6).toString('hex');
    const passwordHash = hashPassword(pwd);
    const { rows } = await pool.query(
      'INSERT INTO public.users (email, password_hash, name, phone, role, is_active, created_at, updated_at) VALUES ($1,$2,$3,$4,$5,true, now(), now()) RETURNING id, email, name, phone, role',
      [normalizedEmail, passwordHash, name, phone || null, 'customer']
    );
    const customer = rows[0];
    res.status(201).json({ customer, password: pwd });
  } catch (err) {
    console.error('Failed to create customer', err);
    res.status(500).json({ error: 'Failed to create customer' });
  }
});

app.delete('/api/admin/customers/:id', requireAuth('admin'), async (req, res) => {
  try {
    const { rows } = await pool.query('DELETE FROM public.users WHERE id = $1 AND role = $2 RETURNING id', [req.params.id, 'customer']);
    if (!rows || rows.length === 0) return res.status(404).json({ error: 'Customer not found' });
    res.json({ success: true });
  } catch (err) {
    console.error('Failed to delete customer', err);
    res.status(500).json({ error: 'Failed to delete customer' });
  }
});

// Admin: clear all orders/transactions (dangerous - admin only)
app.delete('/api/admin/orders/clear', requireAuth('admin'), async (req, res) => {
  try {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      try {
        await client.query('DELETE FROM public.order_items');
        await client.query('DELETE FROM public.orders');
        await client.query('COMMIT');
        res.json({ success: true, message: 'All orders and order items cleared' });
      } catch (err) {
        await client.query('ROLLBACK').catch(() => { });
        throw err;
      }
    } finally {
      client.release();
    }
  } catch (err) {
    await pool.query('ROLLBACK').catch(() => {});
    console.error('Failed to clear orders', err);
    res.status(500).json({ error: 'Failed to clear orders' });
  }
});

// ============ PROFILE ENDPOINTS ============

// Get current user's profile
app.get('/api/profile', requireAuth(), (req, res) => {
  (async () => {
    try {
      const { rows } = await pool.query('SELECT id, email, name, phone, avatar_url, role FROM public.users WHERE id = $1', [req.user.id]);
      if (!rows || rows.length === 0) return res.status(404).json({ error: 'User not found' });
      res.json(rows[0]);
    } catch (err) {
      console.error('Failed to fetch profile', err);
      res.status(500).json({ error: 'DB error' });
    }
  })();
});

// Update current user's profile (name, phone)
app.put('/api/profile', requireAuth(), (req, res) => {
  (async () => {
    try {
      const { name, phone } = req.body || {};
      const { rows } = await pool.query('UPDATE public.users SET name = COALESCE($1, name), phone = COALESCE($2, phone), updated_at = now() WHERE id = $3 RETURNING id, email, name, phone, avatar_url, role', [name || null, phone || null, req.user.id]);
      if (!rows || rows.length === 0) return res.status(404).json({ error: 'User not found' });
      res.json(rows[0]);
    } catch (err) {
      console.error('Failed to update profile', err);
      res.status(500).json({ error: 'DB error' });
    }
  })();
});

// ============ NOTIFICATIONS ENDPOINTS ============

// Get current user's notifications
app.get('/api/notifications', requireAuth(), (req, res) => {
  (async () => {
    try {
      const { rows } = await pool.query(
        'SELECT * FROM public.notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50',
        [req.user.id]
      );
      console.log(`Fetched ${rows.length} notifications for user ${req.user.id}`);
      res.json(rows || []);
    } catch (err) {
      console.error('Failed to fetch notifications', err);
      res.status(500).json({ error: 'DB error' });
    }
  })();
});

// Mark a notification as read
app.put('/api/notifications/:id/read', requireAuth(), (req, res) => {
  (async () => {
    try {
      const { id } = req.params;
      await pool.query('UPDATE public.notifications SET is_read = true WHERE id = $1 AND user_id = $2', [id, req.user.id]);
      res.json({ ok: true });
    } catch (err) {
      console.error('Failed to mark notification as read', err);
      res.status(500).json({ error: 'DB error' });
    }
  })();
});

// Mark all notifications as read
app.put('/api/notifications/read-all', requireAuth(), (req, res) => {
  (async () => {
    try {
      await pool.query('UPDATE public.notifications SET is_read = true WHERE user_id = $1', [req.user.id]);
      res.json({ ok: true });
    } catch (err) {
      console.error('Failed to mark all notifications as read', err);
      res.status(500).json({ error: 'DB error' });
    }
  })();
});

// Delete a single notification
app.delete('/api/notifications/:id', requireAuth(), (req, res) => {
  (async () => {
    try {
      const { id } = req.params;
      await pool.query('DELETE FROM public.notifications WHERE id = $1 AND user_id = $2', [id, req.user.id]);
      res.json({ ok: true });
    } catch (err) {
      console.error('Failed to delete notification', err);
      res.status(500).json({ error: 'DB error' });
    }
  })();
});

// Delete all notifications for the user
app.delete('/api/notifications', requireAuth(), (req, res) => {
  (async () => {
    try {
      await pool.query('DELETE FROM public.notifications WHERE user_id = $1', [req.user.id]);
      res.json({ ok: true });
    } catch (err) {
      console.error('Failed to clear notifications', err);
      res.status(500).json({ error: 'DB error' });
    }
  })();
});

// Broadcast notification (Admin only)
app.post('/api/admin/notifications/broadcast', requireAuth('admin'), (req, res) => {
  (async () => {
    try {
      const { targetRole, title, message, data } = req.body;
      if (!title || !message) {
        return res.status(400).json({ error: 'Title and message are required' });
      }

      await createBroadcastNotification(targetRole || 'all', 'info', title, message, data || {});
      res.json({ ok: true });
    } catch (err) {
      console.error('Failed to broadcast notification', err);
      res.status(500).json({ error: 'Failed to broadcast' });
    }
  })();
});

// Rider: update current location
app.put('/api/rider/location', requireAuth('rider'), (req, res) => {
  const { latitude, longitude } = req.body;

  if (latitude === undefined || longitude === undefined) {
    return res.status(400).json({ error: 'Latitude and longitude are required' });
  }

  const locationData = {
    latitude: Number(latitude),
    longitude: Number(longitude),
    updatedAt: new Date().toISOString()
  };

  riderLocations.set(req.user.id, locationData);

  // Broadcast to all connected clients (especially customers tracking their orders)
  const payload = JSON.stringify({
    type: 'rider.location',
    riderId: req.user.id,
    location: locationData
  });

  // Global sseClients should be accessible here
  for (const client of sseClients) {
    try {
      client.write(`data: ${payload}\n\n`);
    } catch (err) {
      // client likely disconnected
    }
  }

  res.json({ ok: true });
});

// Customer: get assigned rider's location
app.get('/api/orders/:id/rider-location', requireAuth(), async (req, res) => {
  try {
    const { id: orderId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Check if order exists and verify authorization
    const { rows } = await pool.query(
      'SELECT assigned_rider_id, customer_id FROM public.orders WHERE id = $1',
      [orderId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const { assigned_rider_id: riderId, customer_id: customerId } = rows[0];

    // Verify user is authorized: must be the customer or the assigned rider or admin
    if (userRole !== 'admin' && customerId !== userId && riderId !== userId) {
      return res.status(403).json({ error: 'Unauthorized to view this rider location' });
    }

    if (!riderId) {
      return res.status(200).json({ latitude: null, longitude: null });
    }

    const location = riderLocations.get(riderId) || { latitude: null, longitude: null };
    res.json(location);
  } catch (err) {
    console.error('Failed to fetch rider location', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============ FAVORITES ENDPOINTS ============

// Get current user's favorite menu item IDs
app.get('/api/favorites', requireAuth(), (req, res) => {
  (async () => {
    try {
      const { rows } = await pool.query('SELECT item_id FROM public.favorites WHERE user_id = $1 ORDER BY created_at DESC', [req.user.id]);
      const ids = (rows || []).map(r => r.item_id);
      return res.json(ids);
    } catch (err) {
      console.error('Failed to fetch favorites', err);
      return res.status(500).json({ error: 'DB error' });
    }
  })();
});

// Add a favorite (idempotent)
app.post('/api/favorites', requireAuth(), (req, res) => {
  (async () => {
    try {
      const { menu_item_id } = req.body || {};
      if (!menu_item_id) return res.status(400).json({ error: 'menu_item_id is required' });
      await pool.query('INSERT INTO public.favorites (user_id, item_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [req.user.id, menu_item_id]);
      // Audit create
      auditRefreshToken('favorite_add', null, req.user.id, req).catch(() => { });
      return res.json({ ok: true });
    } catch (err) {
      console.error('Failed to add favorite', err);
      return res.status(500).json({ error: 'DB error' });
    }
  })();
});

// Remove a favorite
app.delete('/api/favorites/:menu_item_id', requireAuth(), (req, res) => {
  (async () => {
    try {
      const menuItemId = req.params.menu_item_id;
      await pool.query('DELETE FROM public.favorites WHERE user_id = $1 AND item_id = $2', [req.user.id, menuItemId]);
      return res.json({ ok: true });
    } catch (err) {
      console.error('Failed to remove favorite', err);
      return res.status(500).json({ error: 'DB error' });
    }
  })();
});

// Get single order by ID
app.get('/api/orders/:id', requireAuth(), async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const { id } = req.params;

    // Fetch order details with its items
    const orderQuery = 'SELECT * FROM public.orders WHERE id = $1';
    const { rows: orderRows } = await pool.query(orderQuery, [id]);

    if (orderRows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const order = orderRows[0];

    // Check if the user is authorized to see this order
    // (User must be the owner, or an admin, or the assigned rider)
    if (userRole !== 'admin' && order.customer_id !== userId) {
      // Check if it's the assigned rider
      const { rows: riderRows } = await pool.query(
        'SELECT * FROM public.rider_assignments WHERE order_id = $1 AND rider_id = $2',
        [id, userId]
      );

      if (riderRows.length === 0) {
        return res.status(403).json({ error: 'Unauthorized to view this order' });
      }
    }

    // Fetch items
    const itemsQuery = 'SELECT * FROM public.order_items WHERE order_id = $1';
    const { rows: itemsRows } = await pool.query(itemsQuery, [id]);

    // Fetch delivery address
    let deliveryAddress = null;
    if (order.delivery_address_id) {
      const addressQuery = 'SELECT * FROM public.customer_addresses WHERE id = $1';
      const { rows: addressRows } = await pool.query(addressQuery, [order.delivery_address_id]);
      deliveryAddress = addressRows[0] || null;
    }

    res.json({
      ...order,
      items: itemsRows,
      delivery_address: deliveryAddress
    });
  } catch (err) {
    logger.error('Failed to fetch order', err);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});



// ============================================
// SAVED ADDRESSES CRUD
// ============================================

// Get user's addresses
app.get('/api/addresses', requireAuth(), async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM public.customer_addresses WHERE user_id = $1 ORDER BY is_default DESC, created_at DESC',
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    logger.error('Failed to fetch addresses', err);
    res.status(500).json({ error: 'Failed to fetch addresses' });
  }
});

// Add new address
app.post('/api/addresses', requireAuth(), async (req, res) => {
  try {
    const { label, street, city, phone, instructions, latitude, longitude, is_default } = req.body;
    if (!street) return res.status(400).json({ error: 'Street is required' });

    // If setting as default, unset others
    if (is_default) {
      await pool.query('UPDATE public.customer_addresses SET is_default = false WHERE user_id = $1', [req.user.id]);
    }

    const { rows } = await pool.query(
      `INSERT INTO public.customer_addresses (user_id, label, street, city, phone, instructions, latitude, longitude, is_default)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [req.user.id, label || 'Home', street, city || 'Nakuru', phone || null, instructions || null, latitude || null, longitude || null, is_default || false]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    logger.error('Failed to add address', err);
    res.status(500).json({ error: 'Failed to add address' });
  }
});

// Update address
app.put('/api/addresses/:id', requireAuth(), async (req, res) => {
  try {
    const { label, street, city, phone, instructions, latitude, longitude, is_default } = req.body;

    // Verify ownership
    const { rows: existing } = await pool.query(
      'SELECT id FROM public.customer_addresses WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]
    );
    if (existing.length === 0) return res.status(404).json({ error: 'Address not found' });

    if (is_default) {
      await pool.query('UPDATE public.customer_addresses SET is_default = false WHERE user_id = $1', [req.user.id]);
    }

    const { rows } = await pool.query(
      `UPDATE public.customer_addresses SET label = COALESCE($1, label), street = COALESCE($2, street), city = COALESCE($3, city),
       phone = COALESCE($4, phone), instructions = COALESCE($5, instructions), latitude = COALESCE($6, latitude),
       longitude = COALESCE($7, longitude), is_default = COALESCE($8, is_default), updated_at = now()
       WHERE id = $9 AND user_id = $10 RETURNING *`,
      [label, street, city, phone, instructions, latitude, longitude, is_default, req.params.id, req.user.id]
    );
    res.json(rows[0]);
  } catch (err) {
    logger.error('Failed to update address', err);
    res.status(500).json({ error: 'Failed to update address' });
  }
});

// Delete address
app.delete('/api/addresses/:id', requireAuth(), async (req, res) => {
  try {
    const { rowCount } = await pool.query(
      'DELETE FROM public.customer_addresses WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]
    );
    if (rowCount === 0) return res.status(404).json({ error: 'Address not found' });
    res.json({ ok: true });
  } catch (err) {
    logger.error('Failed to delete address', err);
    res.status(500).json({ error: 'Failed to delete address' });
  }
});


// ============================================
// PAYMENT METHODS CRUD
// ============================================

app.get('/api/payment-methods', requireAuth(), async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM public.payment_methods WHERE user_id = $1 ORDER BY is_default DESC, created_at DESC',
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    logger.error('Failed to fetch payment methods', err);
    res.status(500).json({ error: 'Failed to fetch payment methods' });
  }
});

app.post('/api/payment-methods', requireAuth(), async (req, res) => {
  try {
    const { type, label, phone_number } = req.body;
    if (!phone_number) return res.status(400).json({ error: 'Phone number is required' });

    // Check if any default exists
    const { rows: existingDefaults } = await pool.query(
      'SELECT id FROM public.payment_methods WHERE user_id = $1', [req.user.id]
    );
    const isDefault = existingDefaults.length === 0;

    const { rows } = await pool.query(
      `INSERT INTO public.payment_methods (user_id, type, label, phone_number, is_default)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [req.user.id, type || 'mpesa', label || 'M-Pesa', phone_number, isDefault]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    logger.error('Failed to add payment method', err);
    res.status(500).json({ error: 'Failed to add payment method' });
  }
});

app.put('/api/payment-methods/:id/default', requireAuth(), async (req, res) => {
  try {
    await pool.query('UPDATE public.payment_methods SET is_default = false WHERE user_id = $1', [req.user.id]);
    const { rows } = await pool.query(
      'UPDATE public.payment_methods SET is_default = true WHERE id = $1 AND user_id = $2 RETURNING *',
      [req.params.id, req.user.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Payment method not found' });
    res.json(rows[0]);
  } catch (err) {
    logger.error('Failed to set default payment method', err);
    res.status(500).json({ error: 'Failed to update' });
  }
});

app.delete('/api/payment-methods/:id', requireAuth(), async (req, res) => {
  try {
    const { rowCount } = await pool.query(
      'DELETE FROM public.payment_methods WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]
    );
    if (rowCount === 0) return res.status(404).json({ error: 'Payment method not found' });
    res.json({ ok: true });
  } catch (err) {
    logger.error('Failed to delete payment method', err);
    res.status(500).json({ error: 'Failed to delete payment method' });
  }
});


// ============================================
// MPESA / DARJA - OAuth + STK Push helpers
// ============================================

let _mpesaTokenCache = { accessToken: null, expiresAt: 0 };

function fetchJson(url, options = {}) {
  return new Promise((resolve, reject) => {
    try {
      const parsed = new URL(url);
      const reqOptions = {
        method: options.method || 'GET',
        hostname: parsed.hostname,
        path: parsed.pathname + (parsed.search || ''),
        headers: options.headers || {},
        port: parsed.port || 443,
      };

      const req = https.request(reqOptions, (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            let parsedBody = {};
            if (data) {
              try {
                parsedBody = JSON.parse(data);
              } catch (parseErr) {
                logger.error('[fetchJson] Failed to parse response', { parseError: parseErr.message });
                parsedBody = { _rawData: data.substring(0, 500), _parseError: parseErr.message };
              }
            }
            if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
              resolve(parsedBody);
            } else {
              const err = new Error('Non-2xx response from upstream');
              err.statusCode = res.statusCode;
              err.body = parsedBody;
              reject(err);
            }
          } catch (err) {
            reject(err);
          }
        });
      });

      req.on('error', (err) => reject(err));

      if (options.body) {
        req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
      }
      req.end();
    } catch (err) {
      reject(err);
    }
  });
}

async function getMpesaAccessToken() {
  const cfg = config.mpesa;
  const now = Date.now();
  
  logger.info('Checking MPesa token cache', { hasToken: !!_mpesaTokenCache.accessToken, isExpired: _mpesaTokenCache.expiresAt <= now + 5000 });
  
  if (_mpesaTokenCache.accessToken && _mpesaTokenCache.expiresAt > now + 5000) {
    logger.info('Using cached MPesa token');
    return _mpesaTokenCache.accessToken;
  }

  if (!cfg.consumerKey || !cfg.consumerSecret) {
    logger.error('MPesa credentials not configured', { consumerKeySet: !!cfg.consumerKey, consumerSecretSet: !!cfg.consumerSecret });
    throw new Error('MPESA consumer key/secret not configured');
  }

  const auth = Buffer.from(`${cfg.consumerKey}:${cfg.consumerSecret}`).toString('base64');
  const url = cfg.oauthUrl;
  
  logger.info('Fetching MPesa access token', { url, authLength: auth.length });

  try {
    const tokenResp = await fetchJson(url, {
      method: 'GET',
      headers: { Authorization: `Basic ${auth}` },
    });

    logger.info('MPesa token response', { hasAccessToken: !!tokenResp.access_token, expiresIn: tokenResp.expires_in });

    if (!tokenResp.access_token || !tokenResp.expires_in) {
      logger.error('Invalid MPesa token response', { tokenResp });
      throw new Error('Failed to obtain MPESA access token');
    }

    _mpesaTokenCache.accessToken = tokenResp.access_token;
    _mpesaTokenCache.expiresAt = Date.now() + (parseInt(tokenResp.expires_in, 10) - 10) * 1000;
    logger.info('MPesa token cached successfully');
    return _mpesaTokenCache.accessToken;
  } catch (err) {
    console.error('[getMpesaAccessToken] Token fetch error:', {
      statusCode: err?.statusCode,
      errorCode: err?.body?.errorCode,
      errorMessage: err?.body?.errorMessage
    });
    const errorInfo = {
      message: err?.message || String(err),
      statusCode: err?.statusCode,
      body: err?.body,
      stack: err?.stack?.split('\n').slice(0, 2).join('\n')
    };
    logger.error('MPesa token fetch failed', errorInfo);
    throw err;
  }
}

function makeTimestamp() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

async function initiateStkPush({ amount, phone, accountRef = 'Order', description = 'Payment', callbackPath = '/api/mpesa/callback', callbackBase }) {
  const cfg = config.mpesa;
  const configIssues = config.getMpesaValidationErrors(cfg);
  
  logger.info('initiateStkPush called', {
    amount,
    phone,
    accountRef,
    description,
    configKeys: { 
      consumerKey: !!cfg.consumerKey,
      consumerSecret: !!cfg.consumerSecret,
      shortcode: !!cfg.shortcode,
      passkey: !!cfg.passkey,
      partyB: !!cfg.partyB,
      transactionType: cfg.transactionType,
      sandbox: cfg.sandbox
    }
  });
  
  if (configIssues.length > 0) {
    logger.error('MPesa configuration invalid', {
      issues: configIssues,
      consumerKey: !!cfg.consumerKey,
      consumerSecret: !!cfg.consumerSecret,
      shortcode: !!cfg.shortcode,
      passkey: !!cfg.passkey,
      partyB: !!cfg.partyB,
      transactionType: cfg.transactionType,
      sandbox: cfg.sandbox
    });
    const err = new Error(`MPesa configuration error: ${configIssues.join(' ')}`);
    err.statusCode = 503;
    throw err;
  }

  const token = await getMpesaAccessToken();
  const timestamp = makeTimestamp();
  const password = Buffer.from(`${cfg.shortcode}${cfg.passkey}${timestamp}`).toString('base64');

  const resolvedCallbackBase = cfg.callbackBase || callbackBase || (config.server.isDev ? `http://localhost:${config.server.port}` : '');
  const callbackUrl = resolvedCallbackBase
    ? `${resolvedCallbackBase.replace(/\/$/, '')}${callbackPath}`
    : '';


  const payload = {
    BusinessShortCode: cfg.shortcode,
    Password: password,
    Timestamp: timestamp,
    TransactionType: cfg.transactionType,
    Amount: Number(amount),
    PartyA: phone,
    PartyB: cfg.partyB,
    PhoneNumber: phone,
    CallBackURL: callbackUrl || '',
    AccountReference: accountRef,
    TransactionDesc: description,
  };

  logger.info('MPesa STK payload prepared', { 
    payload: { ...payload, Password: '***' },
    stkUrl: cfg.stkUrl
  });

  const resp = await fetchJson(cfg.stkUrl, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: payload,
  });

  return resp;
}

// Endpoint to initiate STK push for authenticated users
app.post('/api/mpesa/stk', requireAuth(), async (req, res) => {
  try {
    const { amount, phone, accountRef, description, orderId } = req.body || {};
    logger.info('STK Push Request', { amount, phone, accountRef, description, orderId });
    if (!amount || !phone) return res.status(400).json({ error: 'amount and phone are required' });

    const normalizedPhone = phone.replace(/[^0-9]/g, '');
    // Ensure phone is in 2547XXXXXXXX or 2541XXXXXXXX format
    const msisdn = normalizedPhone.startsWith('0') ? `254${normalizedPhone.slice(1)}` : (normalizedPhone.startsWith('7') || normalizedPhone.startsWith('1') ? `254${normalizedPhone}` : normalizedPhone);
    if (!/^254[17]\d{8}$/.test(msisdn)) {
      return res.status(400).json({ error: 'Invalid phone number' });
    }

    const forwardedProto = req.headers['x-forwarded-proto'];
    const forwardedHost = req.headers['x-forwarded-host'];
    const proto = typeof forwardedProto === 'string' && forwardedProto.length > 0 ? forwardedProto : (req.protocol || 'https');
    const host = typeof forwardedHost === 'string' && forwardedHost.length > 0 ? forwardedHost : req.headers.host;
    const inferredCallbackBase = typeof host === 'string' && host.length > 0 ? `${proto}://${host}` : '';

    const result = await initiateStkPush({
      amount,
      phone: msisdn,
      accountRef,
      description,
      callbackBase: inferredCallbackBase,
    });

    let saved = null;
    let persistenceWarning = null;

    // Persist STK request to DB
    try {
      const insertRes = await pool.query(`
        INSERT INTO public.mpesa_stk_requests (
          order_id, merchant_request_id, checkout_request_id, response_code, response_description,
          amount, phone, account_reference, transaction_desc, provider_response
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *
      `, [orderId || null, result.MerchantRequestID || null, result.CheckoutRequestID || null, result.ResponseCode || null, result.ResponseDescription || null, amount, msisdn, accountRef || null, description || null, result]);

      saved = insertRes.rows[0];

      if (orderId) {
        // update order payment_status to processing
        await pool.query('UPDATE public.orders SET payment_status = $1, payment_method = $2, updated_at = now() WHERE id = $3', ['processing', 'mpesa', orderId]).catch(() => { });
      }
    } catch (err) {
      logger.error('Failed to save MPesa STK request', err);
      persistenceWarning = 'STK push was sent, but the request could not be saved locally.';
    }

    return res.json({ success: true, provider: 'mpesa', result, stkRequest: saved, warning: persistenceWarning });
  } catch (err) {
    const errorInfo = {
      message: err?.message || String(err),
      statusCode: err?.statusCode,
      body: err?.body,
      stack: err?.stack?.split('\n').slice(0, 3).join('\n')
    };
    logger.error('Failed to initiate MPesa STK push', errorInfo);
    const providerMessage = err?.body?.errorMessage || err?.body?.errorMessage?.message || err?.body?.ResponseDescription || err?.body?.responseDescription;
    const errorMessage =
      providerMessage ||
      (err.statusCode === 503 ? err?.message || 'MPesa is not configured correctly on the server.' : null) ||
      `Unable to start payment right now. Server error: ${err?.message || 'Unknown'}.`;
    return res.status(err.statusCode && Number.isInteger(err.statusCode) ? err.statusCode : 500).json({ error: errorMessage });
  }
});

// Callback endpoint for MPesa STK Push (public endpoint)
app.post('/api/mpesa/callback', async (req, res) => {
  try {
    // delegate to shared processor
    await processMpesaCallback(req.body);
    res.json({ ResultDesc: 'Accepted', ResultCode: 0 });
    return;
  } catch (err) {
    logger.error('Error handling MPesa callback', err);
    res.status(500).json({ error: 'Callback handling error' });
  }
});

// Admin endpoints to list MPesa requests and callbacks
app.get('/api/mpesa/requests', requireAuth('admin'), async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM public.mpesa_stk_requests ORDER BY created_at DESC LIMIT 200');
    res.json(rows || []);
  } catch (err) {
    logger.error('Failed to fetch mpesa requests', err);
    res.status(500).json({ error: 'DB error' });
  }
});

app.get('/api/mpesa/callbacks', requireAuth('admin'), async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM public.mpesa_stk_callbacks ORDER BY created_at DESC LIMIT 200');
    res.json(rows || []);
  } catch (err) {
    logger.error('Failed to fetch mpesa callbacks', err);
    res.status(500).json({ error: 'DB error' });
  }
});

// Admin: clear all M-Pesa transactions (dangerous - admin only)
app.delete('/api/admin/mpesa/clear', requireAuth('admin'), async (req, res) => {
  try {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      try {
        await client.query('DELETE FROM public.mpesa_stk_callbacks');
        await client.query('DELETE FROM public.mpesa_stk_requests');
        await client.query('COMMIT');
        res.json({ success: true, message: 'All M-Pesa transactions cleared' });
      } catch (err) {
        await client.query('ROLLBACK').catch(() => { });
        throw err;
      }
    } finally {
      client.release();
    }
  } catch (err) {
    await pool.query('ROLLBACK').catch(() => {});
    console.error('Failed to clear M-Pesa transactions', err);
    res.status(500).json({ error: 'Failed to clear M-Pesa transactions' });
  }
});

// Dev helper: process MPesa callback payload (reusable)
async function processMpesaCallback(body) {
  try {
    logger.info('Processing MPesa callback', { body });
    const payload = body || {};
    const cb = (payload.Body && payload.Body.stkCallback) ? payload.Body.stkCallback : (payload.stkCallback || payload);

    const merchantRequestId = cb.MerchantRequestID || cb.merchantRequestID || null;
    const checkoutRequestId = cb.CheckoutRequestID || cb.checkoutRequestID || null;
    const resultCode = typeof cb.ResultCode !== 'undefined' ? Number(cb.ResultCode) : null;
    const resultDesc = cb.ResultDesc || cb.ResultDesc || null;

    let amount = null, mpesaReceipt = null, phone = null, transactionDate = null;
    const items = cb.CallbackMetadata && (cb.CallbackMetadata.Item || cb.CallbackMetadata.items || cb.CallbackMetadata) ? (cb.CallbackMetadata.Item || cb.CallbackMetadata.items || cb.CallbackMetadata) : [];
    if (Array.isArray(items)) {
      for (const it of items) {
        const name = (it.Name || it.name || '').toLowerCase();
        if (name === 'amount') amount = it.Value || it.value || amount;
        if (name === 'mpesareceiptnumber' || name === 'receiptnumber' || name === 'mpesa receipt number') mpesaReceipt = it.Value || it.value || mpesaReceipt;
        if (name === 'phonenumber' || name === 'phone') phone = it.Value || it.value || phone;
        if (name === 'transactiondate' || name === 'transaction date') transactionDate = it.Value || it.value || transactionDate;
      }
    }

    // Find existing STK request
    let stkRequest = null;
    try {
      const q = await pool.query('SELECT * FROM public.mpesa_stk_requests WHERE checkout_request_id = $1 OR merchant_request_id = $2 LIMIT 1', [checkoutRequestId, merchantRequestId]);
      if (q.rows && q.rows.length > 0) stkRequest = q.rows[0];
    } catch (err) {
      logger.error('DB error when finding stk request', err);
    }

    // Persist callback
    try {
      await pool.query(`
        INSERT INTO public.mpesa_stk_callbacks (
          stk_request_id, merchant_request_id, checkout_request_id, result_code, result_desc,
          mpesa_receipt_number, amount, phone, transaction_date, body
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
      `, [stkRequest ? stkRequest.id : null, merchantRequestId, checkoutRequestId, resultCode, resultDesc, mpesaReceipt, amount, phone, transactionDate, payload]);

      const newStatus = resultCode === 0 ? 'success' : 'failed';
      try {
        await pool.query(`UPDATE public.mpesa_stk_requests SET status = $1, provider_response = COALESCE(provider_response, '{}'::jsonb) || $2::jsonb, updated_at = now() WHERE checkout_request_id = $3 OR merchant_request_id = $4`, [newStatus, JSON.stringify({ callback: payload }), checkoutRequestId, merchantRequestId]);
      } catch (err) {
        logger.error('Failed to update mpesa_stk_requests', err);
      }

      if (stkRequest && stkRequest.order_id) {
        try {
          if (resultCode === 0) {
            // If payment successful, set order status to 'pending' (placed) and payment_status to 'paid'
            await pool.query('UPDATE public.orders SET status = $1, payment_status = $2, updated_at = now() WHERE id = $3', ['pending', 'paid', stkRequest.order_id]);
            // Notify customer about successful payment
            createNotification(null, 'payment_received', 'Payment Received ✅', `Your M-Pesa payment of KES ${amount || ''} has been received.`, { orderId: stkRequest.order_id }).catch(async () => { });
            // Determine customer_id for notification
            try {
              const { rows: orderUserRows } = await pool.query('SELECT customer_id FROM public.orders WHERE id = $1', [stkRequest.order_id]);
              if (orderUserRows[0]?.customer_id) {
                await createNotification(orderUserRows[0].customer_id, 'payment_received', 'Payment Received ✅', `Your M-Pesa payment of KES ${amount || ''} has been received.`, { orderId: stkRequest.order_id });
              }
            } catch (nErr) { /* ignore */ }
            // Notify admin about payment received (ONLY to admins)
            await createBroadcastNotification('admin', 'payment_received', 'Payment Received 💰', `M-Pesa payment of KES ${amount || 'N/A'} received for order #${String(stkRequest.order_id).slice(-6).toUpperCase()}.`, { orderId: stkRequest.order_id, amount }).catch(() => {});
            // Broadcast to all admin clients only
            broadcastToRole('admin', { type: 'notification.new', notification: { type: 'payment_received', orderId: stkRequest.order_id, amount } }).catch(() => {});
            // Broadcast payment update to connected clients
            try {
              const { rows: updatedRows } = await pool.query('SELECT id, status, payment_status FROM public.orders WHERE id = $1', [stkRequest.order_id]);
              const updatedOrder = updatedRows && updatedRows[0] ? updatedRows[0] : null;
              broadcastRiderEvent({ type: 'payment.updated', order: updatedOrder });
            } catch (err) {
              logger.error('Failed to broadcast payment update', err);
            }
          } else {
            await pool.query('UPDATE public.orders SET payment_status = $1, updated_at = now() WHERE id = $2', ['failed', stkRequest.order_id]);
            // Notify customer about failed payment
            try {
              const { rows: orderUserRows } = await pool.query('SELECT customer_id FROM public.orders WHERE id = $1', [stkRequest.order_id]);
              if (orderUserRows[0]?.customer_id) {
                await createNotification(orderUserRows[0].customer_id, 'payment_failed', 'Payment Failed ❌', `Your M-Pesa payment could not be processed. Please try again.`, { orderId: stkRequest.order_id });
              }
            } catch (nErr) { /* ignore */ }
            try {
              const { rows: updatedRows } = await pool.query('SELECT id, status, payment_status FROM public.orders WHERE id = $1', [stkRequest.order_id]);
              const updatedOrder = updatedRows && updatedRows[0] ? updatedRows[0] : null;
              broadcastRiderEvent({ type: 'payment.updated', order: updatedOrder });
            } catch (err) {
              logger.error('Failed to broadcast payment update', err);
            }
          }
        } catch (err) {
          logger.error('Failed to update order based on mpesa callback', err);
        }
      }
    } catch (err) {
      logger.error('Failed to persist mpesa callback', err);
    }
  } catch (err) {
    logger.error('processMpesaCallback error', err);
    throw err;
  }
}

// Dev-only: simulate an MPesa callback locally (no ngrok required)
app.post('/api/mpesa/simulate-callback', requireAuth(), async (req, res) => {
  if (!config.isDev) return res.status(403).json({ error: 'Simulation endpoint allowed only in development' });
  try {
    const payload = req.body || {};
    await processMpesaCallback(payload);
    return res.json({ ok: true });
  } catch (err) {
    logger.error('Simulation callback failed', err);
    return res.status(500).json({ error: 'Simulation failed', details: err.message || err });
  }
});


// ============================================
// PROFILE UPDATE & AVATAR UPLOAD
// ============================================

app.put('/api/auth/profile', requireAuth(), async (req, res) => {
  try {
    const { name, phone } = req.body;
    const { rows } = await pool.query(
      'UPDATE public.users SET name = COALESCE($1, name), phone = COALESCE($2, phone), updated_at = now() WHERE id = $3 RETURNING id, name, email, phone, role, avatar_url',
      [name, phone, req.user.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'User not found' });
    res.json(rows[0]);
  } catch (err) {
    logger.error('Failed to update profile', err);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

app.post('/api/auth/avatar', requireAuth(), upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const fileName = `avatar_${req.user.id}_${Date.now()}${path.extname(req.file.originalname)}`;
    const avatarDir = path.join(__dirname, 'uploads', 'avatars');

    // Ensure avatar directory exists
    const fs = require('fs');
    if (!fs.existsSync(avatarDir)) fs.mkdirSync(avatarDir, { recursive: true });

    const avatarPath = path.join(avatarDir, fileName);
    fs.writeFileSync(avatarPath, req.file.buffer);

    const avatarUrl = `/uploads/avatars/${fileName}`;

    // Delete old avatar if exists
    const { rows: userRows } = await pool.query('SELECT avatar_url FROM public.users WHERE id = $1', [req.user.id]);
    if (userRows[0]?.avatar_url) {
      const oldPath = path.join(__dirname, userRows[0].avatar_url);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }

    const { rows } = await pool.query(
      'UPDATE public.users SET avatar_url = $1, updated_at = now() WHERE id = $2 RETURNING id, name, email, phone, role, avatar_url',
      [avatarUrl, req.user.id]
    );
    res.json(rows[0]);
  } catch (err) {
    logger.error('Failed to upload avatar', err);
    res.status(500).json({ error: 'Failed to upload avatar' });
  }
});


// ============================================
// PASSWORD MANAGEMENT
// ============================================

// Change password (requires old password)
app.put('/api/auth/change-password', requireAuth(), async (req, res) => {
  try {
    const { current_password, new_password } = req.body;
    if (!current_password || !new_password) return res.status(400).json({ error: 'Both current and new password are required' });
    if (new_password.length < 6) return res.status(400).json({ error: 'New password must be at least 6 characters' });

    const { rows } = await pool.query('SELECT password_hash FROM public.users WHERE id = $1', [req.user.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'User not found' });

    const isValid = await verifyPasswordHash(current_password, rows[0].password_hash);
    if (!isValid) return res.status(400).json({ error: 'Current password is incorrect' });

    const newHash = hashPassword(new_password);
    await pool.query('UPDATE public.users SET password_hash = $1, updated_at = now() WHERE id = $2', [newHash, req.user.id]);
    res.json({ ok: true, message: 'Password changed successfully' });
  } catch (err) {
    logger.error('Failed to change password', err);
    res.status(500).json({ error: 'Failed to change password' });
  }
});

// Forgot password — send reset email via Resend
app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    // Ensure reset_token columns exist
    await pool.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='users' AND column_name='reset_token') THEN
          ALTER TABLE public.users ADD COLUMN reset_token TEXT;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='users' AND column_name='reset_token_expires') THEN
          ALTER TABLE public.users ADD COLUMN reset_token_expires TIMESTAMPTZ;
        END IF;
      END $$;
    `);

    const { rows } = await pool.query('SELECT id, name FROM public.users WHERE email = $1', [email.toLowerCase().trim()]);
    if (rows.length === 0) {
      // Don't reveal if email exists
      return res.json({ ok: true, message: 'If an account exists with that email, a reset link has been sent.' });
    }

    const user = rows[0];
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetCode = resetToken.slice(0, 6).toUpperCase(); // Short code for the email
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await pool.query(
      'UPDATE public.users SET reset_token = $1, reset_token_expires = $2 WHERE id = $3',
      [resetToken, expires, user.id]
    );

    // Try to send email via Resend if configured
    if (config.email.apiKey) {
      try {
        const resetLink = `${config.server.url}/reset-password?token=${resetToken}`;
        const result = await resend.emails.send({
          from: config.email.from,
          to: [email],
          reply_to: config.email.supportEmail,
          subject: 'Reset Your Password - Kuku ni Sisi',
          html: getPasswordResetTemplate(user.name, resetLink),
        });
        if (result.error) {
          console.error('Resend Error (Reset):', result.error);
        } else {
          console.log('Password reset email sent successfully:', result.data?.id);
        }
      } catch (emailErr) {
        console.error('CRITICAL: Failed to send reset email via Resend:', emailErr.message);
        // Still return success — don't reveal email delivery status
      }
    } else {
      const resetLink = `${config.server.url}/reset-password?token=${resetToken}`;
      // No email service configured — log the token for development
      console.log(`[DEV] Password reset requested for ${email}. Link: ${resetLink}`);
    }

    res.json({ ok: true, message: 'If an account exists with that email, a reset link has been sent.' });
  } catch (err) {
    console.error('Failed to process forgot-password:', err.message);
    logger.error('Failed to process forgot-password', err);
    res.status(500).json({ error: 'Failed to send reset email. Please try again.' });
  }
});

// Reset password with token
app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { token, new_password } = req.body;
    if (!token || !new_password) return res.status(400).json({ error: 'Token and new password are required' });
    if (new_password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });

    const { rows } = await pool.query(
      'SELECT id FROM public.users WHERE reset_token = $1 AND reset_token_expires > now()',
      [token]
    );
    if (rows.length === 0) return res.status(400).json({ error: 'Invalid or expired reset token' });

    const hash = hashPassword(new_password);
    await pool.query(
      'UPDATE public.users SET password_hash = $1, reset_token = NULL, reset_token_expires = NULL, updated_at = now() WHERE id = $2',
      [hash, rows[0].id]
    );

    res.json({ ok: true, message: 'Password reset successfully. You can now log in.' });
  } catch (err) {
    logger.error('Failed to reset password', err);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

// Resend welcome email
app.post('/api/auth/resend-welcome', requireAuth(), async (req, res) => {
  try {
    const user = req.user; // From requireAuth middleware
    
    if (!config.email.apiKey) {
      return res.status(400).json({ error: 'Email service not configured' });
    }

    const result = await resend.emails.send({
      from: config.email.from,
      to: [user.email],
      reply_to: config.email.supportEmail,
      subject: 'Welcome to Kuku ni Sisi! 🍗',
      html: getWelcomeTemplate(user.name || 'Friend'),
    });

    if (result.error) {
      console.error('Resend Error (Welcome Resend):', result.error);
      return res.status(500).json({ error: 'Failed to send welcome email' });
    }

    console.log('Welcome email resent successfully:', result.data?.id);
    res.json({ success: true, message: 'Welcome email sent successfully' });
  } catch (err) {
    console.error('CRITICAL: Failed to resend welcome email:', err.message);
    logger.error('Failed to resend welcome email', err);
    res.status(500).json({ error: 'Failed to resend welcome email' });
  }
});

// Resend password reset email
app.post('/api/auth/resend-reset', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    if (!config.email.apiKey) {
      return res.status(400).json({ error: 'Email service not configured' });
    }

    // Check if user exists
    const { rows: userRows } = await pool.query(
      'SELECT id, name FROM public.users WHERE LOWER(email) = LOWER($1)',
      [email]
    );

    if (userRows.length === 0) {
      // Don't reveal if email exists
      return res.json({ ok: true, message: 'If an account exists with that email, a reset link has been sent.' });
    }

    const user = userRows[0];
    
    // Generate a new reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await pool.query(
      'UPDATE public.users SET reset_token = $1, reset_token_expires = $2 WHERE id = $3',
      [resetToken, expires, user.id]
    );

    try {
      const resetLink = `${config.server.url}/reset-password?token=${resetToken}`;
      const result = await resend.emails.send({
        from: config.email.from,
        to: [email],
        reply_to: config.email.supportEmail,
        subject: 'Reset Your Password - Kuku ni Sisi',
        html: getPasswordResetTemplate(user.name, resetLink),
      });

      if (result.error) {
        console.error('Resend Error (Reset Resend):', result.error);
      } else {
        console.log('Password reset email resent successfully:', result.data?.id);
      }
    } catch (emailErr) {
      console.error('CRITICAL: Failed to resend reset email via Resend:', emailErr.message);
    }

    res.json({ ok: true, message: 'If an account exists with that email, a reset link has been sent.' });
  } catch (err) {
    console.error('Failed to process resend-reset:', err.message);
    logger.error('Failed to process resend-reset', err);
    res.status(500).json({ error: 'Failed to send reset email. Please try again.' });
  }
});

// ============================================
// BACKUP & EXPORT ENDPOINTS (Admin Only)
// ============================================

// Export all users as CSV
app.get('/api/admin/export/users', requireAuth('admin'), async (req, res) => {
  try {
    const { rows: users } = await pool.query(
      `SELECT id, email, name, phone, role, is_active, last_login, created_at, updated_at 
       FROM public.users 
       ORDER BY created_at DESC`
    );

    // Create CSV header
    const headers = ['ID', 'Email', 'Name', 'Phone', 'Role', 'Active', 'Last Login', 'Created At', 'Updated At'];
    const csvRows = users.map(u => [
      u.id,
      u.email,
      u.name || '',
      u.phone || '',
      u.role,
      u.is_active ? 'Yes' : 'No',
      u.last_login ? new Date(u.last_login).toISOString() : '',
      new Date(u.created_at).toISOString(),
      new Date(u.updated_at).toISOString()
    ]);

    const csv = [headers, ...csvRows]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="users_${new Date().toISOString().split('T')[0]}.csv"`);
    res.send(csv);
  } catch (err) {
    console.error('Failed to export users', err);
    res.status(500).json({ error: 'Failed to export users' });
  }
});

// Export all transactions (orders + M-Pesa) as CSV
app.get('/api/admin/export/transactions', requireAuth('admin'), async (req, res) => {
  try {
    const { rows: orders } = await pool.query(
      `SELECT 
        o.id,
        o.customer_id,
        u.name as customer_name,
        u.email as customer_email,
        o.subtotal,
        o.delivery_fee,
        o.discount,
        o.total,
        o.payment_method,
        o.status,
        o.created_at,
        o.updated_at
       FROM public.orders o
       LEFT JOIN public.users u ON o.customer_id = u.id
       ORDER BY o.created_at DESC`
    );

    // Create CSV header
    const headers = ['Order ID', 'Customer ID', 'Customer Name', 'Customer Email', 'Subtotal', 'Delivery Fee', 'Discount', 'Total', 'Payment Method', 'Status', 'Created At', 'Updated At'];
    const csvRows = orders.map(o => [
      o.id,
      o.customer_id || '',
      o.customer_name || '',
      o.customer_email || '',
      o.subtotal || 0,
      o.delivery_fee || 0,
      o.discount || 0,
      o.total || 0,
      o.payment_method || '',
      o.status,
      new Date(o.created_at).toISOString(),
      new Date(o.updated_at).toISOString()
    ]);

    const csv = [headers, ...csvRows]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="transactions_${new Date().toISOString().split('T')[0]}.csv"`);
    res.send(csv);
  } catch (err) {
    console.error('Failed to export transactions', err);
    res.status(500).json({ error: 'Failed to export transactions' });
  }
});

// Export M-Pesa payments as CSV
app.get('/api/admin/export/mpesa', requireAuth('admin'), async (req, res) => {
  try {
    const { rows: payments } = await pool.query(
      `SELECT 
        cb.id,
        cb.merchant_request_id,
        cb.checkout_request_id,
        cb.result_code,
        cb.result_desc,
        cb.mpesa_receipt_number,
        cb.amount,
        cb.phone,
        cb.transaction_date,
        cb.created_at
       FROM public.mpesa_stk_callbacks cb
       ORDER BY cb.created_at DESC`
    );

    // Create CSV header
    const headers = ['Payment ID', 'Merchant Request ID', 'Checkout Request ID', 'Result Code', 'Result Description', 'M-Pesa Receipt', 'Amount', 'Phone', 'Transaction Date', 'Created At'];
    const csvRows = payments.map(p => [
      p.id,
      p.merchant_request_id || '',
      p.checkout_request_id || '',
      p.result_code,
      p.result_desc || '',
      p.mpesa_receipt_number || '',
      p.amount || 0,
      p.phone || '',
      p.transaction_date || '',
      new Date(p.created_at).toISOString()
    ]);

    const csv = [headers, ...csvRows]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="mpesa_payments_${new Date().toISOString().split('T')[0]}.csv"`);
    res.send(csv);
  } catch (err) {
    console.error('Failed to export M-Pesa payments', err);
    res.status(500).json({ error: 'Failed to export M-Pesa payments' });
  }
});

// ============================================
// ERROR HANDLING MIDDLEWARE
// ============================================

// 404 handler
app.use((req, res) => {
  logger.warn('404 Not Found', {
    method: req.method,
    url: req.url,
    ip: req.ip,
  });
  res.status(404).json({ error: 'Not Found', message: 'The requested resource does not exist' });
});

// Global error handler
app.use(errorHandler);

// ============================================
// SERVER STARTUP
// ============================================

const server = app.listen(PORT, HOST, () => {
  logger.info(`🚀 Server started`, {
    port: PORT,
    host: HOST,
    environment: config.server.nodeEnv,
    uploadDir: config.upload.directory,
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Server closed');
    pool.end(() => {
      logger.info('Database pool closed');
      process.exit(0);
    });
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  server.close(() => {
    logger.info('Server closed');
    pool.end(() => {
      logger.info('Database pool closed');
      process.exit(0);
    });
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', error);
  process.exit(1);
});

// Handle unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});
