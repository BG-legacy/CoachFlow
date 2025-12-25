/**
 * Auth Controller
 * Handles HTTP requests for authentication with audit logging
 */

const authService = require('../services/auth.service');
const googleAuthService = require('../services/googleAuth.service');
const accountDeletionService = require('../services/accountDeletion.service');
const { successResponse, createdResponse } = require('../../../common/utils/response');
const { asyncHandler } = require('../../../common/middleware/errorHandler');
const { auditHelpers } = require('../../../common/utils/auditLogger');
const logger = require('../../../common/utils/logger');

class AuthController {
  /**
   * Register new user
   * POST /api/v1/auth/register
   */
  register = asyncHandler(async (req, res) => {
    const result = await authService.register(req.body);
    return createdResponse(res, result, 'User registered successfully');
  });

  /**
   * Login user
   * POST /api/v1/auth/login
   */
  login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    
    try {
      const result = await authService.login(email, password);
      
      // Log successful login
      await auditHelpers.loginSuccess(req, result.user._id);
      
      return successResponse(res, result, 'Login successful');
    } catch (error) {
      // Log failed login attempt
      await auditHelpers.loginFailure(req, email, error.message);
      throw error;
    }
  });

  /**
   * Refresh access token
   * POST /api/v1/auth/refresh
   */
  refreshToken = asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;
    const result = await authService.refreshToken(refreshToken);
    return successResponse(res, result, 'Token refreshed successfully');
  });

  /**
   * Request password reset
   * POST /api/v1/auth/forgot-password
   */
  forgotPassword = asyncHandler(async (req, res) => {
    const { email } = req.body;
    const result = await authService.requestPasswordReset(email);
    
    // Log password reset request
    await auditHelpers.passwordResetRequest(req, email);
    
    return successResponse(res, result);
  });

  /**
   * Reset password
   * POST /api/v1/auth/reset-password
   */
  resetPassword = asyncHandler(async (req, res) => {
    const { token, password } = req.body;
    const result = await authService.resetPassword(token, password);
    return successResponse(res, result);
  });

  /**
   * Change password
   * PUT /api/v1/auth/change-password
   */
  changePassword = asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const result = await authService.changePassword(req.user._id, currentPassword, newPassword);
    
    // Log password change
    await auditHelpers.passwordChange(req, req.user._id);
    
    return successResponse(res, result);
  });

  /**
   * Set password for OAuth-only accounts
   * POST /api/v1/auth/set-password
   */
  setPassword = asyncHandler(async (req, res) => {
    const { password } = req.body;
    const result = await authService.setPassword(req.user._id, password);
    
    // Log password set
    await auditHelpers.passwordChange(req, req.user._id);
    
    return successResponse(res, result);
  });

  /**
   * Verify email
   * GET /api/v1/auth/verify-email/:token
   */
  verifyEmail = asyncHandler(async (req, res) => {
    const { token } = req.params;
    const result = await authService.verifyEmail(token);
    return successResponse(res, result);
  });

  /**
   * Get current user
   * GET /api/v1/auth/me
   */
  getCurrentUser = asyncHandler(async (req, res) => {
    const user = await authService.getCurrentUser(req.user._id);
    return successResponse(res, user);
  });

  /**
   * Logout user
   * POST /api/v1/auth/logout
   */
  logout = asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;
    const accessToken = req.headers.authorization?.split(' ')[1];
    
    const metadata = {
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.headers['user-agent'],
    };

    const result = await authService.logout(
      req.user._id,
      accessToken,
      refreshToken,
      metadata
    );
    
    // Log logout
    await auditHelpers.logout(req, req.user._id);
    
    return successResponse(res, result);
  });

  /**
   * Revoke a token
   * POST /api/v1/auth/revoke-token
   */
  revokeToken = asyncHandler(async (req, res) => {
    const { token, tokenType, reason } = req.body;
    const result = await authService.revokeToken(
      token,
      req.user._id,
      tokenType,
      reason,
      req.user._id
    );
    return successResponse(res, result);
  });

  /**
   * Get user sessions
   * GET /api/v1/auth/sessions
   */
  getSessions = asyncHandler(async (req, res) => {
    const sessions = await authService.getUserSessions(req.user._id);
    return successResponse(res, sessions);
  });

  /**
   * Export user data (GDPR right to data portability)
   * GET /api/v1/auth/export-data
   */
  exportData = asyncHandler(async (req, res) => {
    const dataExport = await accountDeletionService.exportUserData(req.user._id);
    
    // Set headers for file download
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="user-data-export-${req.user._id}-${Date.now()}.json"`);
    
    return res.status(200).json(dataExport);
  });

  /**
   * Request account deletion
   * POST /api/v1/auth/delete-account
   */
  requestAccountDeletion = asyncHandler(async (req, res) => {
    const { reason } = req.body;
    const result = await accountDeletionService.requestAccountDeletion(
      req.user._id,
      reason,
      req.user._id
    );
    return successResponse(res, result);
  });

  /**
   * Cancel account deletion
   * POST /api/v1/auth/cancel-deletion
   */
  cancelAccountDeletion = asyncHandler(async (req, res) => {
    const result = await accountDeletionService.cancelAccountDeletion(
      req.user._id,
      req.user._id
    );
    return successResponse(res, result);
  });

  /**
   * Google Sign In / Sign Up
   * POST /api/v1/auth/google
   */
  googleAuth = asyncHandler(async (req, res) => {
    const { idToken, role, acceptedTerms, acceptedPrivacy, marketingConsent } = req.body;

    try {
      const result = await googleAuthService.googleSignIn(idToken, {
        role,
        acceptedTerms,
        acceptedPrivacy,
        marketingConsent,
      });

      // Log based on action
      if (result.action === 'register') {
        logger.info(`New user registered via Google: ${result.user.email}`);
      } else if (result.action === 'linked') {
        await auditHelpers.accountLinked(req, result.user._id, 'google');
      } else {
        await auditHelpers.loginSuccess(req, result.user._id);
      }

      const message =
        result.action === 'register'
          ? 'Account created successfully'
          : result.action === 'linked'
          ? 'Google account linked and logged in'
          : 'Login successful';

      return result.action === 'register'
        ? createdResponse(res, result, message)
        : successResponse(res, result, message);
    } catch (error) {
      // Log failed login attempt
      await auditHelpers.loginFailure(req, req.body.email || 'unknown', error.message);
      throw error;
    }
  });

  /**
   * Link Google account to existing authenticated user
   * POST /api/v1/auth/google/link
   */
  linkGoogleAccount = asyncHandler(async (req, res) => {
    const { idToken } = req.body;
    const result = await googleAuthService.linkGoogleToExistingUser(req.user._id, idToken);

    // Log account linking
    await auditHelpers.accountLinked(req, req.user._id, 'google');

    return successResponse(res, result, 'Google account linked successfully');
  });

  /**
   * Unlink Google account from authenticated user
   * DELETE /api/v1/auth/google/unlink
   */
  unlinkGoogleAccount = asyncHandler(async (req, res) => {
    const result = await googleAuthService.unlinkGoogleAccount(req.user._id);

    // Log account unlinking
    await auditHelpers.accountUnlinked(req, req.user._id, 'google');

    return successResponse(res, result);
  });
}

module.exports = new AuthController();

