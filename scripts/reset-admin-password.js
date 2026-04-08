#!/usr/bin/env node
// Usage: node scripts/reset-admin-password.js email newPassword

const crypto = require('crypto');
const Config = require('../server/config');
const { Pool } = require('pg');

(async () => {
  const [,, email, newPassword] = process.argv;
  if (!email || !newPassword) {
    console.error('Usage: node scripts/reset-admin-password.js email newPassword');
    process.exit(2);
  }

  const config = new Config();
  const pool = new Pool({ connectionString: config.database.url, ssl: config.database.ssl });

  try {
    await pool.connect();
    // Hash password (server uses sha256)
    const passwordHash = crypto.createHash('sha256').update(newPassword).digest('hex');

    const { rows } = await pool.query('UPDATE public.users SET password_hash = $1, updated_at = now() WHERE email = $2 RETURNING id, email, role', [passwordHash, email]);
    if (!rows || rows.length === 0) {
      // Create admin user if not found
      const insert = await pool.query('INSERT INTO public.users (email, password_hash, name, role, is_active, created_at, updated_at) VALUES ($1,$2,$3,$4,true, now(), now()) RETURNING id, email, role', [email, passwordHash, 'Admin', 'admin']);
      console.log(`Created admin user ${email} (id=${insert.rows[0].id})`);
      process.exit(0);
    }

    console.log(`Password updated for ${email} (id=${rows[0].id}, role=${rows[0].role})`);
    process.exit(0);
  } catch (err) {
    console.error('Failed to update password:', err);
    process.exit(1);
  } finally {
    try { await pool.end(); } catch(e){}
  }
})();
