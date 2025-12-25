/**
 * Google OAuth Service
 * Handles Google OAuth authentication and account linking
 */

const { OAuth2Client } = require('google-auth-library');
const userRepository = require('../repositories/user.repository');
const {
  generateAccessToken,
  generateRefreshToken,
  sanitizeUser,
} = require('../../../common/utils/security');
const {
  BadRequestError,
  ConflictError,
  UnauthorizedError,
} = require('../../../common/utils/errors');
const logger = require('../../../common/utils/logger');
const config = require('../../../common/config');

class GoogleAuthService {
  constructor() {
    this.client = new OAuth2Client(config.auth.google.clientId);
  }

  /**
   * Verify Google ID token
   */
  async verifyGoogleToken(idToken) {
    try {
      const ticket = await this.client.verifyIdToken({
        idToken,
        audience: config.auth.google.clientId,
      });

      const payload = ticket.getPayload();

      return {
        googleId: payload.sub,
        email: payload.email,
        emailVerified: payload.email_verified,
        firstName: payload.given_name || '',
        lastName: payload.family_name || '',
        avatar: payload.picture,
      };
    } catch (error) {
      logger.error('Google token verification failed:', error);
      throw new UnauthorizedError('Invalid Google token');
    }
  }

  /**
   * Google Sign In - Handles both new users and returning users
   * Implements account linking logic
   */
  async googleSignIn(idToken, options = {}) {
    // Verify the Google token
    const googleData = await this.verifyGoogleToken(idToken);

    if (!googleData.emailVerified) {
      throw new BadRequestError('Google email is not verified');
    }

    // Check for existing user by Google ID
    let user = await userRepository.findOne({ googleId: googleData.googleId });

    if (user) {
      // Existing Google user - just log them in
      return this._generateAuthResponse(user, 'login');
    }

    // Check for existing user by email
    user = await userRepository.findByEmail(googleData.email);

    if (user) {
      // User exists with this email - link Google account
      return this._linkGoogleAccount(user, googleData);
    }

    // New user - create account
    return this._createGoogleUser(googleData, options);
  }

  /**
   * Link Google account to existing user
   */
  async linkGoogleToExistingUser(userId, idToken) {
    const googleData = await this.verifyGoogleToken(idToken);

    if (!googleData.emailVerified) {
      throw new BadRequestError('Google email is not verified');
    }

    // Get current user
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new UnauthorizedError('User not found');
    }

    // Check if Google ID is already linked to another account
    const existingGoogleUser = await userRepository.findOne({
      googleId: googleData.googleId,
      _id: { $ne: userId },
    });

    if (existingGoogleUser) {
      throw new ConflictError('This Google account is already linked to another user');
    }

    // Check if user's email matches Google email
    if (user.email.toLowerCase() !== googleData.email.toLowerCase()) {
      throw new BadRequestError(
        'Google account email does not match your account email. Please use a Google account with the same email address.',
      );
    }

    // Check if already linked
    const hasGoogleProvider = user.authProviders?.some(
      (p) => p.provider === 'google' && p.providerId === googleData.googleId,
    );

    if (hasGoogleProvider) {
      throw new ConflictError('Google account is already linked to this user');
    }

    // Link the Google account
    return this._linkGoogleAccount(user, googleData);
  }

  /**
   * Unlink Google account from user
   */
  async unlinkGoogleAccount(userId) {
    const user = await userRepository.findById(userId, true);

    if (!user) {
      throw new UnauthorizedError('User not found');
    }

    // Check if user has Google provider
    const hasGoogleProvider = user.authProviders?.some((p) => p.provider === 'google');

    if (!hasGoogleProvider) {
      throw new BadRequestError('No Google account linked to this user');
    }

    // Check if user has password (can't unlink if it's the only auth method)
    const hasLocalProvider = user.authProviders?.some((p) => p.provider === 'local');

    if (!hasLocalProvider && !user.password) {
      throw new BadRequestError(
        'Cannot unlink Google account. Please set a password first to maintain account access.',
      );
    }

    // Remove Google provider
    const updatedProviders = user.authProviders.filter((p) => p.provider !== 'google');

    await userRepository.updateById(userId, {
      authProviders: updatedProviders,
      googleId: null,
    });

    logger.info(`Google account unlinked from user: ${user.email}`);

    return { message: 'Google account unlinked successfully' };
  }

  /**
   * Internal: Link Google account to existing user
   */
  async _linkGoogleAccount(user, googleData) {
    // Initialize authProviders if it doesn't exist
    const authProviders = user.authProviders || [];

    // Check if local provider exists
    const hasLocalProvider = authProviders.some((p) => p.provider === 'local');

    // If user has password but no local provider, add it
    if (!hasLocalProvider && user.password) {
      authProviders.push({
        provider: 'local',
        email: user.email,
        linkedAt: user.createdAt || new Date(),
      });
    }

    // Add Google provider
    authProviders.push({
      provider: 'google',
      providerId: googleData.googleId,
      email: googleData.email,
      linkedAt: new Date(),
    });

    // Update user
    const updateData = {
      authProviders,
      googleId: googleData.googleId,
      isEmailVerified: true, // Google email is verified
    };

    // Update avatar if not set
    if (!user.avatar && googleData.avatar) {
      updateData.avatar = googleData.avatar;
    }

    await userRepository.updateById(user._id, updateData);
    await userRepository.updateLastLogin(user._id);

    // Fetch updated user
    const updatedUser = await userRepository.findById(user._id);

    logger.info(`Google account linked to existing user: ${user.email}`);

    return this._generateAuthResponse(updatedUser, 'linked');
  }

  /**
   * Internal: Create new user from Google data
   */
  async _createGoogleUser(googleData, options = {}) {
    const {
      role = 'client',
      acceptedTerms = true,
      acceptedPrivacy = true,
      marketingConsent = false,
    } = options;

    // Validate required data
    if (!googleData.firstName || !googleData.lastName) {
      throw new BadRequestError('First name and last name are required');
    }

    // Create user with Google provider
    const userData = {
      email: googleData.email,
      firstName: googleData.firstName,
      lastName: googleData.lastName,
      avatar: googleData.avatar,
      role,
      isEmailVerified: true, // Google email is pre-verified
      googleId: googleData.googleId,
      authProviders: [
        {
          provider: 'google',
          providerId: googleData.googleId,
          email: googleData.email,
          linkedAt: new Date(),
        },
      ],
      consent: {
        termsAcceptedAt: acceptedTerms ? new Date() : null,
        termsVersion: '1.0',
        privacyPolicyAcceptedAt: acceptedPrivacy ? new Date() : null,
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
          accepted: acceptedTerms,
          timestamp: new Date(),
        },
        {
          type: 'privacy',
          version: '1.0',
          accepted: acceptedPrivacy,
          timestamp: new Date(),
        },
        {
          type: 'data_processing',
          version: '1.0',
          accepted: true,
          timestamp: new Date(),
        },
      ],
    };

    const user = await userRepository.create(userData);

    logger.info(`New user registered via Google: ${user.email}`);

    return this._generateAuthResponse(user, 'register');
  }

  /**
   * Internal: Generate authentication response
   */
  _generateAuthResponse(user, action) {
    const accessToken = generateAccessToken({ userId: user._id, role: user.role });
    const refreshToken = generateRefreshToken({ userId: user._id });

    return {
      user: sanitizeUser(user),
      accessToken,
      refreshToken,
      action, // 'login', 'register', or 'linked'
    };
  }
}

module.exports = new GoogleAuthService();



