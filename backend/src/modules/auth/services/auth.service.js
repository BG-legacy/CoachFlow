/**
 * Auth Service
 * Business logic for authentication
 */

const jwt = require('jsonwebtoken');
const userRepository = require('../repositories/user.repository');
const TokenBlacklist = require('../models/tokenBlacklist.model');
const {
  hashPassword,
  comparePassword,
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  generateRandomToken,
  sanitizeUser,
} = require('../../../common/utils/security');
const {
  validatePassword,
} = require('../../../common/utils/passwordPolicy');
const {
  UnauthorizedError,
  ConflictError,
  NotFoundError,
  BadRequestError,
} = require('../../../common/utils/errors');
const logger = require('../../../common/utils/logger');
const config = require('../../../common/config');

class AuthService {
  /**
   * Register a new user
   */
  async register(userData) {
    const {
      email,
      password,
      firstName,
      lastName,
      role = 'client',
      acceptedTerms,
      acceptedPrivacy,
      marketingConsent = false,
    } = userData;

    // Check if user already exists
    const existingUser = await userRepository.findByEmail(email);
    if (existingUser) {
      throw new ConflictError('Email already registered');
    }

    // Validate password against policy
    const passwordValidation = validatePassword(password, { email, firstName, lastName });
    if (!passwordValidation.valid) {
      throw new BadRequestError(`Password validation failed: ${passwordValidation.errors.join(', ')}`);
    }

    // Validate consent acceptance
    if (!acceptedTerms || !acceptedPrivacy) {
      throw new BadRequestError('You must accept Terms of Service and Privacy Policy to register');
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user with consent tracking
    const user = await userRepository.create({
      email,
      password: hashedPassword,
      firstName,
      lastName,
      role,
      authProviders: [
        {
          provider: 'local',
          email,
          linkedAt: new Date(),
        },
      ],
      consent: {
        termsAcceptedAt: new Date(),
        termsVersion: '1.0',
        privacyPolicyAcceptedAt: new Date(),
        privacyPolicyVersion: '1.0',
        marketingConsent,
        marketingConsentDate: marketingConsent ? new Date() : null,
        dataProcessingConsent: true,
        dataProcessingConsentDate: new Date(),
      },
      consentHistory: [
        {
          type: 'terms',
          version: '1.0',
          accepted: true,
          timestamp: new Date(),
          ipAddress: null, // Will be added by controller if available
        },
        {
          type: 'privacy',
          version: '1.0',
          accepted: true,
          timestamp: new Date(),
          ipAddress: null,
        },
        {
          type: 'data_processing',
          version: '1.0',
          accepted: true,
          timestamp: new Date(),
          ipAddress: null,
        },
      ],
    });

    logger.info(`New user registered: ${email}`);

    // Generate tokens
    const accessToken = generateAccessToken({ userId: user._id, role: user.role });
    const refreshToken = generateRefreshToken({ userId: user._id });

    return {
      user: sanitizeUser(user),
      accessToken,
      refreshToken,
    };
  }

  /**
   * Login user
   */
  async login(email, password) {
    // Find user with password
    const user = await userRepository.findByEmail(email, true);

    if (!user) {
      throw new UnauthorizedError('Invalid credentials');
    }

    // Check if account is active
    if (!user.isActive) {
      throw new UnauthorizedError('Account is deactivated');
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid credentials');
    }

    // Update last login
    await userRepository.updateLastLogin(user._id);

    logger.info(`User logged in: ${email}`);

    // Generate tokens
    const accessToken = generateAccessToken({ userId: user._id, role: user.role });
    const refreshToken = generateRefreshToken({ userId: user._id });

    return {
      user: sanitizeUser(user),
      accessToken,
      refreshToken,
    };
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken) {
    try {
      // Check if token is blacklisted
      const isBlacklisted = await TokenBlacklist.isBlacklisted(refreshToken);
      if (isBlacklisted) {
        throw new UnauthorizedError('Token has been revoked');
      }

      const decoded = verifyRefreshToken(refreshToken);

      const user = await userRepository.findById(decoded.userId);

      if (!user || !user.isActive) {
        throw new UnauthorizedError('Invalid refresh token');
      }

      // Blacklist old refresh token (token rotation)
      const decodedToken = jwt.decode(refreshToken);
      await TokenBlacklist.blacklistToken({
        token: refreshToken,
        userId: user._id,
        tokenType: 'refresh',
        reason: 'logout',
        expiresAt: new Date(decodedToken.exp * 1000),
      });

      // Generate new tokens
      const accessToken = generateAccessToken({ userId: user._id, role: user.role });
      const newRefreshToken = generateRefreshToken({ userId: user._id });

      return {
        accessToken,
        refreshToken: newRefreshToken,
      };
    } catch (error) {
      if (error instanceof UnauthorizedError) {
        throw error;
      }
      throw new UnauthorizedError('Invalid refresh token');
    }
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(email) {
    const user = await userRepository.findByEmail(email);

    if (!user) {
      // Don't reveal if email exists
      return { message: 'If email exists, reset link has been sent' };
    }

    // Generate reset token
    const resetToken = generateRandomToken();
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await userRepository.updateById(user._id, {
      passwordResetToken: resetToken,
      passwordResetExpires: resetExpires,
    });

    logger.info(`Password reset requested for: ${email}`);

    // TODO: Send email with reset link
    // await emailService.sendPasswordReset(email, resetToken);

    return { message: 'If email exists, reset link has been sent' };
  }

  /**
   * Reset password
   */
  async resetPassword(token, newPassword) {
    const user = await userRepository.findByResetToken(token);

    if (!user) {
      throw new BadRequestError('Invalid or expired reset token');
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);

    // Update password and clear reset token
    await userRepository.updateById(user._id, {
      password: hashedPassword,
      passwordResetToken: undefined,
      passwordResetExpires: undefined,
    });

    logger.info(`Password reset completed for user: ${user.email}`);

    return { message: 'Password reset successful' };
  }

  /**
   * Change password
   */
  async changePassword(userId, currentPassword, newPassword) {
    const user = await userRepository.findById(userId, true);

    if (!user) {
      throw new NotFoundError('User');
    }

    // Verify current password
    const isPasswordValid = await comparePassword(currentPassword, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedError('Current password is incorrect');
    }

    // Validate new password against policy
    const passwordValidation = validatePassword(newPassword, {
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    });

    if (!passwordValidation.valid) {
      throw new BadRequestError(`Password validation failed: ${passwordValidation.errors.join(', ')}`);
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);

    // Update password
    await userRepository.updateById(userId, { password: hashedPassword });

    // Revoke all existing tokens for security
    await this.revokeAllUserTokens(userId, 'password_change');

    logger.info(`Password changed for user: ${user.email}`);

    return { message: 'Password changed successfully. Please login again.' };
  }

  /**
   * Set password for OAuth-only accounts
   */
  async setPassword(userId, newPassword) {
    const user = await userRepository.findById(userId, true);

    if (!user) {
      throw new NotFoundError('User');
    }

    // Check if user already has a password
    if (user.password) {
      throw new BadRequestError('Account already has a password. Use change password instead.');
    }

    // Validate new password against policy
    const passwordValidation = validatePassword(newPassword, {
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    });

    if (!passwordValidation.valid) {
      throw new BadRequestError(`Password validation failed: ${passwordValidation.errors.join(', ')}`);
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);

    // Initialize authProviders if it doesn't exist
    const authProviders = user.authProviders || [];

    // Add local provider if not already present
    const hasLocalProvider = authProviders.some((p) => p.provider === 'local');
    if (!hasLocalProvider) {
      authProviders.push({
        provider: 'local',
        email: user.email,
        linkedAt: new Date(),
      });
    }

    // Update password and auth providers
    await userRepository.updateById(userId, {
      password: hashedPassword,
      authProviders,
    });

    logger.info(`Password set for user: ${user.email}`);

    return { message: 'Password set successfully. You can now login with email and password.' };
  }

  /**
   * Verify email
   */
  async verifyEmail(token) {
    const user = await userRepository.findByVerificationToken(token);

    if (!user) {
      throw new BadRequestError('Invalid or expired verification token');
    }

    await userRepository.updateById(user._id, {
      isEmailVerified: true,
      emailVerificationToken: undefined,
      emailVerificationExpires: undefined,
    });

    logger.info(`Email verified for user: ${user.email}`);

    return { message: 'Email verified successfully' };
  }

  /**
   * Get current user
   */
  async getCurrentUser(userId) {
    const user = await userRepository.findById(userId);

    if (!user) {
      throw new NotFoundError('User');
    }

    return sanitizeUser(user);
  }

  /**
   * Logout user (blacklist tokens)
   */
  async logout(userId, accessToken, refreshToken, metadata = {}) {
    try {
      const blacklistPromises = [];

      // Blacklist access token
      if (accessToken) {
        const decodedAccess = jwt.decode(accessToken);
        blacklistPromises.push(
          TokenBlacklist.blacklistToken({
            token: accessToken,
            userId,
            tokenType: 'access',
            reason: 'logout',
            expiresAt: new Date(decodedAccess.exp * 1000),
            ipAddress: metadata.ipAddress,
            userAgent: metadata.userAgent,
          }),
        );
      }

      // Blacklist refresh token
      if (refreshToken) {
        const decodedRefresh = jwt.decode(refreshToken);
        blacklistPromises.push(
          TokenBlacklist.blacklistToken({
            token: refreshToken,
            userId,
            tokenType: 'refresh',
            reason: 'logout',
            expiresAt: new Date(decodedRefresh.exp * 1000),
            ipAddress: metadata.ipAddress,
            userAgent: metadata.userAgent,
          }),
        );
      }

      await Promise.all(blacklistPromises);

      logger.info(`User logged out: ${userId}`);

      return { message: 'Logout successful' };
    } catch (error) {
      logger.error(`Logout error for user ${userId}:`, error);
      throw new BadRequestError('Logout failed');
    }
  }

  /**
   * Revoke a specific token
   */
  async revokeToken(token, userId, tokenType = 'refresh', reason = 'revoked', revokedBy = null) {
    try {
      const decoded = jwt.decode(token);

      if (!decoded || !decoded.exp) {
        throw new BadRequestError('Invalid token');
      }

      await TokenBlacklist.blacklistToken({
        token,
        userId,
        tokenType,
        reason,
        expiresAt: new Date(decoded.exp * 1000),
        revokedBy,
      });

      logger.info(`Token revoked for user ${userId}, reason: ${reason}`);

      return { message: 'Token revoked successfully' };
    } catch (error) {
      logger.error('Token revocation error:', error);
      throw new BadRequestError('Token revocation failed');
    }
  }

  /**
   * Revoke all tokens for a user (e.g., on password change or security breach)
   */
  async revokeAllUserTokens(userId, reason = 'security') {
    try {
      // Note: This is a simplified implementation
      // In production, you'd want to track all active tokens
      // For now, we'll just update existing blacklist entries
      await TokenBlacklist.revokeAllUserTokens(userId, reason);

      logger.info(`All tokens revoked for user ${userId}, reason: ${reason}`);

      return { message: 'All tokens revoked successfully' };
    } catch (error) {
      logger.error(`Error revoking all tokens for user ${userId}:`, error);
      throw new BadRequestError('Failed to revoke tokens');
    }
  }

  /**
   * Get user's active sessions (from blacklist we can infer active tokens)
   */
  async getUserSessions(userId) {
    try {
      // This would typically query active tokens from a session store
      // For now, return blacklisted tokens as reference
      const blacklistedTokens = await TokenBlacklist.find({ userId })
        .sort({ createdAt: -1 })
        .limit(10)
        .select('-token'); // Don't send actual tokens

      return blacklistedTokens;
    } catch (error) {
      logger.error(`Error fetching sessions for user ${userId}:`, error);
      return [];
    }
  }
}

module.exports = new AuthService();
