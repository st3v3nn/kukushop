const crypto = require('crypto');
const passwordHash = crypto.createHash('sha256').update('M!k3@2026').digest('hex');
console.log(passwordHash);
