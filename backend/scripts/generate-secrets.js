#!/usr/bin/env node

/**
 * Secret Generation Script
 * Generates cryptographically secure random secrets for use in .env files
 * 
 * Usage:
 *   node scripts/generate-secrets.js
 *   npm run secrets:generate
 */

const crypto = require('crypto');

/**
 * Generate a cryptographically secure random string
 * @param {number} length - Length in bytes (output will be longer due to base64 encoding)
 * @returns {string} Base64-encoded random string
 */
function generateSecret(length = 64) {
  return crypto.randomBytes(length).toString('base64');
}

/**
 * Generate all required secrets
 */
function generateAllSecrets() {
  console.log('🔐 Generating Cryptographically Secure Secrets\n');
  console.log('=' .repeat(80));
  console.log('\nCopy these values to your .env file:\n');
  
  const secrets = {
    JWT_SECRET: generateSecret(64),
    JWT_REFRESH_SECRET: generateSecret(64),
    SESSION_SECRET: generateSecret(64),
    ADMIN_DEFAULT_PASSWORD: generateSecret(32).substring(0, 32), // Shorter for password
  };
  
  Object.entries(secrets).forEach(([key, value]) => {
    console.log(`${key}=${value}`);
  });
  
  console.log('\n' + '=' .repeat(80));
  console.log('\n⚠️  Security Reminders:');
  console.log('  1. Never commit these secrets to version control');
  console.log('  2. Use different secrets for each environment (dev/staging/prod)');
  console.log('  3. Store production secrets in a secure secret manager');
  console.log('  4. Rotate secrets periodically\n');
}

// Run if called directly
if (require.main === module) {
  generateAllSecrets();
}

module.exports = { generateSecret, generateAllSecrets };

