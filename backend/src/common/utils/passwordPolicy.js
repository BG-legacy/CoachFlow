/**
 * Password Policy Validator
 * Industry-standard password validation and strength checking
 */

const config = require('../config');

/**
 * Password policy configuration
 */
const PASSWORD_POLICY = {
  minLength: 8,
  maxLength: 128,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  specialChars: '!@#$%^&*()_+-=[]{}|;:,.<>?',
  preventCommonPasswords: true,
  preventUserInfo: true,
};

/**
 * Common weak passwords (top 100 most common)
 */
const COMMON_PASSWORDS = [
  'password', 'password123', '123456', '12345678', '1234567890',
  'qwerty', 'abc123', 'password1', '12345', '1234567',
  'welcome', 'monkey', 'dragon', 'master', 'letmein',
  'login', 'admin', 'root', 'toor', 'pass',
  'test', 'guest', 'hello', 'access', 'shadow',
  'sunshine', 'iloveyou', 'princess', 'admin123', 'welcome123',
  // Add more as needed
];

/**
 * Validate password against policy
 * @param {String} password - Password to validate
 * @param {Object} userInfo - Optional user info to prevent password = email, name, etc.
 * @returns {Object} - { valid: boolean, errors: string[], strength: string }
 */
const validatePassword = (password, userInfo = {}) => {
  const errors = [];

  if (!password) {
    return {
      valid: false,
      errors: ['Password is required'],
      strength: 'invalid',
    };
  }

  // Length check
  if (password.length < PASSWORD_POLICY.minLength) {
    errors.push(`Password must be at least ${PASSWORD_POLICY.minLength} characters long`);
  }

  if (password.length > PASSWORD_POLICY.maxLength) {
    errors.push(`Password must not exceed ${PASSWORD_POLICY.maxLength} characters`);
  }

  // Complexity checks
  if (PASSWORD_POLICY.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (PASSWORD_POLICY.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (PASSWORD_POLICY.requireNumbers && !/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (PASSWORD_POLICY.requireSpecialChars) {
    const specialCharsRegex = new RegExp(`[${PASSWORD_POLICY.specialChars.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')}]`);
    if (!specialCharsRegex.test(password)) {
      errors.push('Password must contain at least one special character (!@#$%^&*()_+-=[]{}|;:,.<>?)');
    }
  }

  // Check against common passwords
  if (PASSWORD_POLICY.preventCommonPasswords) {
    const lowerPassword = password.toLowerCase();
    if (COMMON_PASSWORDS.some((common) => lowerPassword.includes(common))) {
      errors.push('Password is too common. Please choose a stronger password');
    }
  }

  // Check against user information
  if (PASSWORD_POLICY.preventUserInfo && userInfo) {
    const lowerPassword = password.toLowerCase();
    const checkFields = ['email', 'firstName', 'lastName', 'username'];

    for (const field of checkFields) {
      if (userInfo[field]) {
        const value = userInfo[field].toLowerCase().split('@')[0]; // Remove domain from email
        if (value.length >= 3 && lowerPassword.includes(value)) {
          errors.push('Password should not contain your personal information');
          break;
        }
      }
    }
  }

  // Calculate password strength
  const strength = calculatePasswordStrength(password);

  return {
    valid: errors.length === 0,
    errors,
    strength,
  };
};

/**
 * Calculate password strength
 * @param {String} password - Password to check
 * @returns {String} - 'weak', 'fair', 'good', 'strong', 'excellent'
 */
const calculatePasswordStrength = (password) => {
  let score = 0;

  if (!password) return 'invalid';

  // Length scoring
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (password.length >= 16) score += 1;

  // Complexity scoring
  if (/[a-z]/.test(password)) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^a-zA-Z0-9]/.test(password)) score += 1;

  // Pattern variety
  if (/[a-z].*[a-z]/.test(password) && /[A-Z].*[A-Z]/.test(password)) score += 1;
  if (/\d.*\d/.test(password)) score += 1;

  // Check for patterns (consecutive chars, repeated chars)
  if (!/(.)\1{2,}/.test(password)) score += 1; // No 3+ repeated chars
  if (!/012|123|234|345|456|567|678|789|890|abc|bcd|cde/.test(password.toLowerCase())) score += 1;

  // Map score to strength level
  if (score <= 3) return 'weak';
  if (score <= 5) return 'fair';
  if (score <= 7) return 'good';
  if (score <= 9) return 'strong';
  return 'excellent';
};

/**
 * Generate password requirements message
 * @returns {String} - Human-readable password requirements
 */
const getPasswordRequirements = () => {
  const requirements = [];

  requirements.push(`At least ${PASSWORD_POLICY.minLength} characters long`);

  if (PASSWORD_POLICY.requireUppercase) {
    requirements.push('At least one uppercase letter (A-Z)');
  }

  if (PASSWORD_POLICY.requireLowercase) {
    requirements.push('At least one lowercase letter (a-z)');
  }

  if (PASSWORD_POLICY.requireNumbers) {
    requirements.push('At least one number (0-9)');
  }

  if (PASSWORD_POLICY.requireSpecialChars) {
    requirements.push('At least one special character (!@#$%^&*...)');
  }

  if (PASSWORD_POLICY.preventCommonPasswords) {
    requirements.push('Not a commonly used password');
  }

  if (PASSWORD_POLICY.preventUserInfo) {
    requirements.push('Should not contain your personal information');
  }

  return requirements;
};

/**
 * Check if password has been pwned (breached in data leaks)
 * This would typically call the Have I Been Pwned API
 * For now, returns a placeholder implementation
 * @param {String} password - Password to check
 * @returns {Promise<Boolean>} - True if password has been pwned
 */
const checkPasswordPwned = async (password) =>
  // TODO: Implement Have I Been Pwned API check
  // https://haveibeenpwned.com/API/v3#PwnedPasswords
  // Use k-anonymity model - only send first 5 chars of SHA-1 hash
  false;
module.exports = {
  validatePassword,
  calculatePasswordStrength,
  getPasswordRequirements,
  checkPasswordPwned,
  PASSWORD_POLICY,
  COMMON_PASSWORDS,
};



