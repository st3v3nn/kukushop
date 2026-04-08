#!/usr/bin/env node

/**
 * Kuku ni Sisi API Server
 * Production-ready startup with health checks and validation
 */

require('dotenv').config();

const path = require('path');
const fs = require('fs');

// Check critical requirements
console.log('🔍 Validating environment...');

// Check if Node version is compatible
const nodeVersion = process.version;
const majorVersion = parseInt(nodeVersion.split('.')[0].slice(1));
if (majorVersion < 14) {
  console.error(`❌ Node.js v${majorVersion} is not supported. Minimum required: v14`);
  process.exit(1);
}
console.log(`✅ Node.js ${nodeVersion}`);

// Check if required packages are installed
const requiredPackages = ['express', 'pg', 'cors', 'multer', 'sharp'];
let missingPackages = [];

requiredPackages.forEach(pkg => {
  try {
    require(pkg);
    console.log(`✅ ${pkg}`);
  } catch (e) {
    missingPackages.push(pkg);
  }
});

if (missingPackages.length > 0) {
  console.error(`\n❌ Missing packages: ${missingPackages.join(', ')}`);
  console.error('Run: npm install');
  process.exit(1);
}

// Check environment variables
console.log('\n🔧 Checking environment variables...');

const requiredEnvVars = ['DATABASE_URL'];
const missingEnvVars = requiredEnvVars.filter(v => !process.env[v]);

if (missingEnvVars.length > 0) {
  console.error(`❌ Missing environment variables: ${missingEnvVars.join(', ')}`);
  console.error('Copy .env.example to .env and update with your values');
  process.exit(1);
}

// Check if upload directory can be created
console.log('\n📁 Checking directories...');

const uploadDir = process.env.UPLOAD_DIR || path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  try {
    fs.mkdirSync(uploadDir, { recursive: true });
    console.log(`✅ Created upload directory: ${uploadDir}`);
  } catch (error) {
    console.error(`❌ Failed to create upload directory: ${error.message}`);
    process.exit(1);
  }
} else {
  console.log(`✅ Upload directory exists: ${uploadDir}`);
}

// Test database connection
console.log('\n🗄️  Testing database connection...');

const { Pool } = require('pg');
const testPool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 5000,
});

testPool.query('SELECT NOW()')
  .then(() => {
    console.log('✅ Database connection successful');
    testPool.end();
    startServer();
  })
  .catch(error => {
    console.error(`❌ Database connection failed: ${error.message}`);
    console.error('Make sure PostgreSQL is running and DATABASE_URL is correct');
    testPool.end();
    process.exit(1);
  });

function startServer() {
  console.log('\n🚀 Starting server...\n');
  require('./index.js');
}
