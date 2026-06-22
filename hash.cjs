const crypto = require('crypto');
console.log(crypto.createHash('sha256').update('M!k3@2026').digest('hex'));
