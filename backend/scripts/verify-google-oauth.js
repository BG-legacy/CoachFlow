#!/usr/bin/env node
/**
 * Google OAuth Configuration Verification Script
 * Verifies that Google OAuth is properly configured in the backend
 */

require('dotenv').config();

const checkmark = '✅';
const cross = '❌';
const warning = '⚠️';

console.log('\n🔍 Google OAuth Configuration Verification\n');
console.log('='.repeat(60));

let hasErrors = false;
let hasWarnings = false;

// Check 1: Google Client ID
console.log('\n1. Google Client ID');
if (process.env.GOOGLE_CLIENT_ID) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (clientId.includes('apps.googleusercontent.com')) {
    console.log(`   ${checkmark} Present: ${clientId.substring(0, 20)}...`);
  } else {
    console.log(`   ${warning} Present but format looks incorrect`);
    console.log(`   Expected format: xxx.apps.googleusercontent.com`);
    hasWarnings = true;
  }
} else {
  console.log(`   ${cross} Missing: GOOGLE_CLIENT_ID not found in .env`);
  hasErrors = true;
}

// Check 2: Google Client Secret
console.log('\n2. Google Client Secret');
if (process.env.GOOGLE_CLIENT_SECRET) {
  const secret = process.env.GOOGLE_CLIENT_SECRET;
  if (secret.startsWith('GOCSPX-')) {
    console.log(`   ${checkmark} Present: ${secret.substring(0, 12)}...`);
  } else {
    console.log(`   ${warning} Present but format looks incorrect`);
    console.log(`   Expected format: GOCSPX-xxx...`);
    hasWarnings = true;
  }
} else {
  console.log(`   ${cross} Missing: GOOGLE_CLIENT_SECRET not found in .env`);
  hasErrors = true;
}

// Check 3: Google Auth Enabled
console.log('\n3. Google Auth Status');
const enableGoogleAuth = process.env.ENABLE_GOOGLE_AUTH;
if (enableGoogleAuth === 'true' || process.env.GOOGLE_CLIENT_ID) {
  console.log(`   ${checkmark} Enabled`);
} else {
  console.log(`   ${warning} Disabled (set ENABLE_GOOGLE_AUTH=true to enable)`);
  hasWarnings = true;
}

// Check 4: Node Environment
console.log('\n4. Environment Configuration');
const nodeEnv = process.env.NODE_ENV || 'development';
console.log(`   Environment: ${nodeEnv}`);

// Check 5: CORS Configuration
console.log('\n5. CORS Configuration');
const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:3000';
console.log(`   CORS Origin: ${corsOrigin}`);

if (nodeEnv === 'production' && corsOrigin.includes('localhost')) {
  console.log(`   ${warning} Production environment with localhost CORS`);
  hasWarnings = true;
}

// Check 6: Required Base Configuration
console.log('\n6. Required Base Configuration');
const checks = [
  { name: 'JWT_SECRET', value: process.env.JWT_SECRET },
  { name: 'JWT_REFRESH_SECRET', value: process.env.JWT_REFRESH_SECRET },
  { name: 'SESSION_SECRET', value: process.env.SESSION_SECRET },
  { name: 'MONGODB_URI', value: process.env.MONGODB_URI },
];

checks.forEach(({ name, value }) => {
  if (value && value !== `default_${name.toLowerCase()}`) {
    console.log(`   ${checkmark} ${name}`);
  } else if (value) {
    console.log(`   ${warning} ${name} (using default value - change for production)`);
    hasWarnings = true;
  } else {
    console.log(`   ${cross} ${name} (missing)`);
    hasErrors = true;
  }
});

// Check 7: Redirect URI Configuration
console.log('\n7. Authorized Redirect URIs (verify in Google Console)');
console.log('   You should have configured these in Google Cloud Console:');
console.log('   Development:');
console.log('   - http://localhost:3000');
console.log('   - http://localhost:3000/auth/callback');
console.log('   - http://localhost:5000/api/v1/auth/google/callback');
console.log('   Staging/Production:');
console.log('   - https://yourdomain.com');
console.log('   - https://yourdomain.com/auth/callback');
console.log('   - https://api.yourdomain.com/api/v1/auth/google/callback');

// Check 8: Try to load config
console.log('\n8. Configuration Module Load Test');
try {
  const config = require('../src/common/config');
  if (config.auth.google.enabled) {
    console.log(`   ${checkmark} Config module loaded successfully`);
    console.log(`   ${checkmark} Google Auth enabled in config`);
  } else {
    console.log(`   ${warning} Config loaded but Google Auth not enabled`);
    hasWarnings = true;
  }
} catch (error) {
  console.log(`   ${cross} Error loading config: ${error.message}`);
  hasErrors = true;
}

// Summary
console.log('\n' + '='.repeat(60));
console.log('\n📊 Verification Summary\n');

if (!hasErrors && !hasWarnings) {
  console.log(`${checkmark} All checks passed! Google OAuth is properly configured.`);
  console.log('\n🚀 Next Steps:');
  console.log('   1. Start the backend: npm run dev');
  console.log('   2. Verify Google OAuth endpoints are available');
  console.log('   3. Test authentication flow with your frontend');
  console.log('   4. Check logs for Google OAuth initialization message');
} else if (!hasErrors && hasWarnings) {
  console.log(`${warning} Configuration is functional but has warnings.`);
  console.log('   Review the warnings above and address them for production.');
  console.log('\n🚀 You can proceed with testing in development.');
} else {
  console.log(`${cross} Configuration has errors that must be fixed.`);
  console.log('   Fix the errors above before proceeding.');
  console.log('\n📖 Documentation:');
  console.log('   - docs/GOOGLE_OAUTH_COMPLETE_CHECKLIST.md');
  console.log('   - docs/ENV_TEMPLATE.md');
  process.exit(1);
}

console.log('\n' + '='.repeat(60));
console.log('\n');




