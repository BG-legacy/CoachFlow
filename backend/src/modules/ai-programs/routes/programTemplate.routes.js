/**
 * Program Template Routes
 * API routes for versioned program templates
 */

const express = require('express');
const router = express.Router();
const programTemplateController = require('../controllers/programTemplate.controller');
const { authenticate } = require('../../../common/middleware/auth');
const { validate } = require('../../../common/middleware/validation');
const { body, param, query } = require('express-validator');

/**
 * @swagger
 * tags:
 *   name: Program Templates
 *   description: Versioned program artifacts and template management
 */

/**
 * @swagger
 * /ai-programs/templates/find-match:
 *   post:
 *     summary: Find matching template before generating
 *     tags: [Program Templates]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - clientId
 *             properties:
 *               clientId:
 *                 type: string
 *               goals:
 *                 type: array
 *                 items:
 *                   type: string
 *               duration:
 *                 type: number
 *               allowSimilar:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Template search result
 */
router.post(
  '/find-match',
  authenticate,
  [
    body('clientId').notEmpty().withMessage('Client ID is required'),
    body('goals').optional().isArray(),
    body('duration').optional().isInt({ min: 1, max: 52 }),
    body('allowSimilar').optional().isBoolean(),
  ],
  validate,
  programTemplateController.findMatchingTemplate
);

/**
 * @swagger
 * /ai-programs/templates/featured:
 *   get:
 *     summary: Get featured templates
 *     tags: [Program Templates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: number
 *     responses:
 *       200:
 *         description: Featured templates
 */
router.get(
  '/featured',
  authenticate,
  [query('limit').optional().isInt({ min: 1, max: 50 })],
  validate,
  programTemplateController.getFeaturedTemplates
);

/**
 * @swagger
 * /ai-programs/templates:
 *   get:
 *     summary: Search/list templates
 *     tags: [Program Templates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: templateType
 *         schema:
 *           type: string
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *       - in: query
 *         name: experienceLevel
 *         schema:
 *           type: string
 *       - in: query
 *         name: goals
 *         schema:
 *           type: string
 *       - in: query
 *         name: tags
 *         schema:
 *           type: string
 *       - in: query
 *         name: visibility
 *         schema:
 *           type: string
 *       - in: query
 *         name: searchText
 *         schema:
 *           type: string
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *       - in: query
 *         name: myTemplates
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: limit
 *         schema:
 *           type: number
 *       - in: query
 *         name: page
 *         schema:
 *           type: number
 *     responses:
 *       200:
 *         description: Templates list
 */
router.get(
  '/',
  authenticate,
  [
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('page').optional().isInt({ min: 1 }),
  ],
  validate,
  programTemplateController.searchTemplates
);

/**
 * @swagger
 * /ai-programs/templates/from-generated/{id}:
 *   post:
 *     summary: Create template from generated program
 *     tags: [Program Templates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               visibility:
 *                 type: string
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *               customizationOptions:
 *                 type: object
 *     responses:
 *       201:
 *         description: Template created
 */
router.post(
  '/from-generated/:id',
  authenticate,
  [
    param('id').isMongoId().withMessage('Invalid program ID'),
    body('name').optional().isString().isLength({ max: 200 }),
    body('description').optional().isString().isLength({ max: 1000 }),
    body('visibility').optional().isIn(['private', 'organization', 'public']),
    body('tags').optional().isArray(),
  ],
  validate,
  programTemplateController.createFromGenerated
);

/**
 * @swagger
 * /ai-programs/templates/{templateId}:
 *   get:
 *     summary: Get template with version history
 *     tags: [Program Templates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: templateId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Template details
 */
router.get(
  '/:templateId',
  authenticate,
  [param('templateId').notEmpty().withMessage('Template ID is required')],
  validate,
  programTemplateController.getTemplate
);

/**
 * @swagger
 * /ai-programs/templates/{templateId}/apply:
 *   post:
 *     summary: Apply template to client
 *     tags: [Program Templates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: templateId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - clientId
 *             properties:
 *               clientId:
 *                 type: string
 *               customizations:
 *                 type: object
 *     responses:
 *       201:
 *         description: Template applied
 */
router.post(
  '/:templateId/apply',
  authenticate,
  [
    param('templateId').notEmpty().withMessage('Template ID is required'),
    body('clientId').notEmpty().withMessage('Client ID is required'),
    body('customizations').optional().isObject(),
  ],
  validate,
  programTemplateController.applyTemplate
);

/**
 * @swagger
 * /ai-programs/templates/{templateId}/version:
 *   post:
 *     summary: Create new version of template
 *     tags: [Program Templates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: templateId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: New version created
 */
router.post(
  '/:templateId/version',
  authenticate,
  [param('templateId').notEmpty().withMessage('Template ID is required')],
  validate,
  programTemplateController.createNewVersion
);

/**
 * @swagger
 * /ai-programs/templates/{templateId}/rate:
 *   post:
 *     summary: Rate a template
 *     tags: [Program Templates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: templateId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - rating
 *             properties:
 *               rating:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 5
 *               feedback:
 *                 type: string
 *     responses:
 *       200:
 *         description: Template rated
 */
router.post(
  '/:templateId/rate',
  authenticate,
  [
    param('templateId').notEmpty().withMessage('Template ID is required'),
    body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
    body('feedback').optional().isString().isLength({ max: 1000 }),
  ],
  validate,
  programTemplateController.rateTemplate
);

/**
 * @swagger
 * /ai-programs/templates/{templateId}/archive-old:
 *   post:
 *     summary: Archive old versions
 *     tags: [Program Templates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: templateId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               keepVersions:
 *                 type: number
 *     responses:
 *       200:
 *         description: Old versions archived
 */
router.post(
  '/:templateId/archive-old',
  authenticate,
  [
    param('templateId').notEmpty().withMessage('Template ID is required'),
    body('keepVersions').optional().isInt({ min: 1, max: 20 }),
  ],
  validate,
  programTemplateController.archiveOldVersions
);

module.exports = router;

