/**
 * Security Utilities
 * Password hashing, token generation, and other security helpers
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const config = require('../config');

/**
 * Hash password using bcrypt
 * @param {String} password - Plain text password
 * @returns {Promise<String>} - Hashed password
 */
const hashPassword = async (password) => await bcrypt.hash(password, config.security.bcryptRounds);

/**
 * Compare password with hash
 * @param {String} password - Plain text password
 * @param {String} hash - Hashed password
 * @returns {Promise<Boolean>} - Match result
 */
const comparePassword = async (password, hash) => await bcrypt.compare(password, hash);

/**
 * Generate JWT access token
 * @param {Object} payload - Token payload
 * @returns {String} - JWT token
 */
const generateAccessToken = (payload) => jwt.sign(payload, config.jwt.secret, {
  expiresIn: config.jwt.expire,
});

/**
 * Generate JWT refresh token
 * @param {Object} payload - Token payload
 * @returns {String} - JWT refresh token
 */
const generateRefreshToken = (payload) => jwt.sign(payload, config.jwt.refreshSecret, {
  expiresIn: config.jwt.refreshExpire,
});

/**
 * Verify JWT access token
 * @param {String} token - JWT token
 * @returns {Object} - Decoded token payload
 */
const verifyAccessToken = (token) => jwt.verify(token, config.jwt.secret);

/**
 * Verify JWT refresh token
 * @param {String} token - JWT refresh token
 * @returns {Object} - Decoded token payload
 */
const verifyRefreshToken = (token) => jwt.verify(token, config.jwt.refreshSecret);

/**
 * Generate random token
 * @param {Number} length - Token length in bytes (default: 32)
 * @returns {String} - Random hex token
 */
const generateRandomToken = (length = 32) => crypto.randomBytes(length).toString('hex');

/**
 * Generate OTP (One-Time Password)
 * @param {Number} length - OTP length (default: 6)
 * @returns {String} - Numeric OTP
 */
const generateOTP = (length = 6) => {
  const digits = '0123456789';
  let otp = '';
  for (let i = 0; i < length; i++) {
    otp += digits[Math.floor(Math.random() * 10)];
  }
  return otp;
};

/**
 * Hash data using SHA256
 * @param {String} data - Data to hash
 * @returns {String} - Hashed data
 */
const hashSHA256 = (data) => crypto.createHash('sha256').update(data).digest('hex');

/**
 * Sanitize user object (remove sensitive fields)
 * @param {Object} user - User object
 * @returns {Object} - Sanitized user object
 */
const sanitizeUser = (user) => {
  const userObj = user.toObject ? user.toObject() : user;
  delete userObj.password;
  delete userObj.passwordResetToken;
  delete userObj.passwordResetExpires;
  delete userObj.verificationToken;
  delete userObj.__v;
  return userObj;
};

module.exports = {
  hashPassword,
  comparePassword,
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  generateRandomToken,
  generateOTP,
  hashSHA256,
  sanitizeUser,
};
