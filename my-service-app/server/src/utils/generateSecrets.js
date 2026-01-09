const crypto = require('crypto');

// Generate secure random secrets
const generateJWTSecret = () => {
  return crypto.randomBytes(64).toString('hex');
};

const generateRefreshSecret = () => {
  return crypto.randomBytes(128).toString('hex');
};

const generateAPIKey = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Generate new secrets for production
console.log('=== SECURE SECRETS FOR PRODUCTION ===');
console.log('JWT_SECRET:', generateJWTSecret());
console.log('JWT_REFRESH_SECRET:', generateRefreshSecret());
console.log('API_SECRET:', generateAPIKey());
console.log('');
console.log('⚠️  IMPORTANT:');
console.log('1. Copy these secrets to your .env file');
console.log('2. NEVER commit .env file to git');
console.log('3. Store these secrets securely in production');
console.log('4. Use environment-specific secrets');
