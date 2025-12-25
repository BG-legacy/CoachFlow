/**
 * Auth Routes
 * With enhanced security: rate limiting and audit logging
 */

const express = require('express');
const Joi = require('joi');
const authController = require('../controllers/auth.controller');
const { authenticate } = require('../../../common/middleware/auth');
const { validate, validators } = require('../../../common/validators/common.validators');
const {
  loginLimiter,
  authLimiter,
  registrationLimiter,
  passwordResetLimiter,
} = require('../../../common/middleware/rateLimiter');

const router = express.Router();

// Validation schemas
const registerSchema = Joi.object({
  email: validators.email,
  password: validators.password,
  firstName: Joi.string().trim().min(2).max(50)
    .required(),
  lastName: Joi.string().trim().min(2).max(50)
    .required(),
  role: Joi.string().valid('client', 'coach').optional(),
  phone: validators.phone,
  acceptedTerms: Joi.boolean().valid(true).required()
    .messages({
      'any.only': 'You must accept the Terms of Service',
      'any.required': 'You must accept the Terms of Service',
    }),
  acceptedPrivacy: Joi.boolean().valid(true).required()
    .messages({
      'any.only': 'You must accept the Privacy Policy',
      'any.required': 'You must accept the Privacy Policy',
    }),
  marketingConsent: Joi.boolean().optional().default(false),
});

const loginSchema = Joi.object({
  email: validators.email,
  password: Joi.string().required(),
});

const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string().required(),
});

const forgotPasswordSchema = Joi.object({
  email: validators.email,
});

const resetPasswordSchema = Joi.object({
  token: Joi.string().required(),
  password: validators.password,
});

const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: validators.password,
});

const setPasswordSchema = Joi.object({
  password: validators.password,
});

const logoutSchema = Joi.object({
  refreshToken: Joi.string().optional(),
});

const revokeTokenSchema = Joi.object({
  token: Joi.string().required(),
  tokenType: Joi.string().valid('access', 'refresh').default('refresh'),
  reason: Joi.string().valid('logout', 'revoked', 'security').optional(),
});

const deleteAccountSchema = Joi.object({
  reason: Joi.string().max(500).optional(),
});

const googleAuthSchema = Joi.object({
  idToken: Joi.string().required()
    .messages({
      'any.required': 'Google ID token is required',
      'string.empty': 'Google ID token is required',
    }),
  role: Joi.string().valid('client', 'coach').optional(),
  acceptedTerms: Joi.boolean().valid(true).optional().default(true),
  acceptedPrivacy: Joi.boolean().valid(true).optional().default(true),
  marketingConsent: Joi.boolean().optional().default(false),
});

const linkGoogleSchema = Joi.object({
  idToken: Joi.string().required()
    .messages({
      'any.required': 'Google ID token is required',
      'string.empty': 'Google ID token is required',
    }),
});

// Public routes

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - firstName
 *               - lastName
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john.doe@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *                 example: SecurePass123!
 *               firstName:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 50
 *                 example: John
 *               lastName:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 50
 *                 example: Doe
 *               role:
 *                 type: string
 *                 enum: [client, coach]
 *                 default: client
 *               phone:
 *                 type: string
 *                 example: +1234567890
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         user:
 *                           type: object
 *                         token:
 *                           type: string
 *                         refreshToken:
 *                           type: string
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       409:
 *         description: User already exists
 */
router.post('/register', registrationLimiter, validate(registerSchema), authController.register);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john.doe@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: SecurePass123!
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         user:
 *                           type: object
 *                         token:
 *                           type: string
 *                         refreshToken:
 *                           type: string
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post('/login', loginLimiter, validate(loginSchema), authController.login);

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     summary: Refresh access token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 description: Refresh token received during login
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post('/refresh', authLimiter, validate(refreshTokenSchema), authController.refreshToken);

/**
 * @swagger
 * /auth/forgot-password:
 *   post:
 *     summary: Request password reset
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Password reset email sent
 */
router.post('/forgot-password', passwordResetLimiter, validate(forgotPasswordSchema), authController.forgotPassword);

/**
 * @swagger
 * /auth/reset-password:
 *   post:
 *     summary: Reset password with token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - password
 *             properties:
 *               token:
 *                 type: string
 *                 description: Reset token from email
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *     responses:
 *       200:
 *         description: Password reset successfully
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 */
router.post('/reset-password', passwordResetLimiter, validate(resetPasswordSchema), authController.resetPassword);

/**
 * @swagger
 * /auth/google:
 *   post:
 *     summary: Google Sign In / Sign Up
 *     description: Authenticate with Google OAuth. Creates new account or logs in existing user. Supports automatic account linking by email.
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - idToken
 *             properties:
 *               idToken:
 *                 type: string
 *                 description: Google ID token from client-side OAuth flow
 *               role:
 *                 type: string
 *                 enum: [client, coach]
 *                 default: client
 *                 description: User role (only for new registrations)
 *               acceptedTerms:
 *                 type: boolean
 *                 default: true
 *               acceptedPrivacy:
 *                 type: boolean
 *                 default: true
 *               marketingConsent:
 *                 type: boolean
 *                 default: false
 *     responses:
 *       200:
 *         description: Login successful or account linked
 *       201:
 *         description: New account created
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         description: Invalid Google token
 */
router.post('/google', loginLimiter, validate(googleAuthSchema), authController.googleAuth);

/**
 * @swagger
 * /auth/verify-email/{token}:
 *   get:
 *     summary: Verify email address
 *     tags: [Authentication]
 *     parameters:
 *       - name: token
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: Email verification token
 *     responses:
 *       200:
 *         description: Email verified successfully
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 */
router.get('/verify-email/:token', authController.verifyEmail);

// Protected routes

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Get current user profile
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current user data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/me', authenticate, authController.getCurrentUser);

/**
 * @swagger
 * /auth/change-password:
 *   put:
 *     summary: Change user password
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 format: password
 *               newPassword:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *     responses:
 *       200:
 *         description: Password changed successfully
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.put('/change-password', authenticate, authLimiter, validate(changePasswordSchema), authController.changePassword);

/**
 * @swagger
 * /auth/set-password:
 *   post:
 *     summary: Set password for OAuth-only accounts
 *     description: Allows users who signed up via OAuth to set a password for email/password login
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - password
 *             properties:
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *                 description: New password to set
 *     responses:
 *       200:
 *         description: Password set successfully
 *       400:
 *         description: Account already has a password or validation failed
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post('/set-password', authenticate, authLimiter, validate(setPasswordSchema), authController.setPassword);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Logout user and revoke tokens
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 description: Refresh token to revoke
 *     responses:
 *       200:
 *         description: Logout successful
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post('/logout', authenticate, validate(logoutSchema), authController.logout);

/**
 * @swagger
 * /auth/revoke-token:
 *   post:
 *     summary: Revoke a specific token
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *             properties:
 *               token:
 *                 type: string
 *                 description: Token to revoke
 *               tokenType:
 *                 type: string
 *                 enum: [access, refresh]
 *                 default: refresh
 *               reason:
 *                 type: string
 *                 enum: [logout, revoked, security]
 *     responses:
 *       200:
 *         description: Token revoked successfully
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post('/revoke-token', authenticate, validate(revokeTokenSchema), authController.revokeToken);

/**
 * @swagger
 * /auth/sessions:
 *   get:
 *     summary: Get user's active sessions
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of user sessions
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/sessions', authenticate, authController.getSessions);

// Data Privacy Routes

/**
 * @swagger
 * /auth/export-data:
 *   get:
 *     summary: Export all user data (GDPR right to data portability)
 *     tags: [Authentication, Privacy]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User data export in JSON format
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/export-data', authenticate, authController.exportData);

/**
 * @swagger
 * /auth/delete-account:
 *   post:
 *     summary: Request account deletion (30-day grace period)
 *     tags: [Authentication, Privacy]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 maxLength: 500
 *                 description: Optional reason for deletion
 *     responses:
 *       200:
 *         description: Account deletion scheduled
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post('/delete-account', authenticate, validate(deleteAccountSchema), authController.requestAccountDeletion);

/**
 * @swagger
 * /auth/cancel-deletion:
 *   post:
 *     summary: Cancel pending account deletion
 *     tags: [Authentication, Privacy]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Account deletion cancelled
 *       400:
 *         description: No pending deletion or grace period expired
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post('/cancel-deletion', authenticate, authController.cancelAccountDeletion);

// Google OAuth Account Linking Routes

/**
 * @swagger
 * /auth/google/link:
 *   post:
 *     summary: Link Google account to existing user
 *     description: Links a Google account to the currently authenticated user. Email must match.
 *     tags: [Authentication, OAuth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - idToken
 *             properties:
 *               idToken:
 *                 type: string
 *                 description: Google ID token from client-side OAuth flow
 *     responses:
 *       200:
 *         description: Google account linked successfully
 *       400:
 *         description: Email mismatch or already linked
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       409:
 *         description: Google account already linked to another user
 */
router.post('/google/link', authenticate, authLimiter, validate(linkGoogleSchema), authController.linkGoogleAccount);

/**
 * @swagger
 * /auth/google/unlink:
 *   delete:
 *     summary: Unlink Google account from user
 *     description: Removes Google authentication from user account. Requires password to be set first.
 *     tags: [Authentication, OAuth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Google account unlinked successfully
 *       400:
 *         description: Cannot unlink (only auth method or no Google linked)
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.delete('/google/unlink', authenticate, authLimiter, authController.unlinkGoogleAccount);

module.exports = router;
