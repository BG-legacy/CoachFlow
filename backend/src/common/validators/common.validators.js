/**
 * Common Validation Schemas
 * Reusable Joi validation schemas
 */

const Joi = require('joi');

// Common field validators
const validators = {
  email: Joi.string().email().lowercase().trim()
    .required(),
  password: Joi.string()
    .min(8)
    .max(128)
    .pattern(/[A-Z]/, 'uppercase letter')
    .pattern(/[a-z]/, 'lowercase letter')
    .pattern(/[0-9]/, 'number')
    .pattern(/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/, 'special character')
    .required()
    .messages({
      'string.min': 'Password must be at least 8 characters long',
      'string.max': 'Password must not exceed 128 characters',
      'string.pattern.name': 'Password must contain at least one {#name}',
    }),
  phone: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).optional()
    .messages({
      'string.pattern.base': 'Phone number must be in valid E.164 format',
    }),
  mongoId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/)
    .messages({
      'string.pattern.base': 'Invalid ID format',
    }),
  uuid: Joi.string().uuid(),
  url: Joi.string().uri(),
  date: Joi.date().iso(),
  positiveInteger: Joi.number().integer().min(1),
  nonNegativeInteger: Joi.number().integer().min(0),
  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100)
      .default(10),
    sort: Joi.string().optional(),
    order: Joi.string().valid('asc', 'desc').default('desc'),
  }),
  search: Joi.string().trim().max(200).optional(),
};

// Validation middleware factory
const validate = (schema, property = 'body') => (req, res, next) => {
  const { error, value } = schema.validate(req[property], {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    const errors = error.details.map((detail) => ({
      field: detail.path.join('.'),
      message: detail.message,
    }));

    return res.status(422).json({
      success: false,
      message: 'Validation failed',
      errors,
    });
  }

  req[property] = value;
  next();
};

module.exports = {
  validators,
  validate,
};
