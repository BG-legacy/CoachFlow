/**
 * Security Headers Middleware
 * Configures helmet and additional security headers
 */

const helmet = require('helmet');
const config = require('../config');

/**
 * Get helmet configuration based on environment
 */
const getHelmetConfig = () => {
  const baseConfig = {
    // Content Security Policy
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"], // Allow inline styles for Swagger UI
        scriptSrc: ["'self'", "'unsafe-inline'"], // Allow inline scripts for Swagger UI
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'"],
        fontSrc: ["'self'", 'data:'],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },

    // Cross-Origin-Embedder-Policy
    crossOriginEmbedderPolicy: true,

    // Cross-Origin-Opener-Policy
    crossOriginOpenerPolicy: { policy: 'same-origin' },

    // Cross-Origin-Resource-Policy
    crossOriginResourcePolicy: { policy: 'same-origin' },

    // DNS Prefetch Control
    dnsPrefetchControl: { allow: false },

    // Frameguard (X-Frame-Options)
    frameguard: { action: 'deny' },

    // Hide Powered-By header
    hidePoweredBy: true,

    // HTTP Strict Transport Security
    hsts: {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true,
    },

    // IE No Open
    ieNoOpen: true,

    // X-Content-Type-Options
    noSniff: true,

    // Origin-Agent-Cluster
    originAgentCluster: true,

    // Permitted Cross-Domain Policies
    permittedCrossDomainPolicies: { permittedPolicies: 'none' },

    // Referrer Policy
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },

    // X-XSS-Protection
    xssFilter: true,
  };

  // Relax some settings for development
  if (config.env === 'development') {
    baseConfig.hsts = false; // No HTTPS in local dev
    baseConfig.contentSecurityPolicy.directives.scriptSrc.push("'unsafe-eval'"); // For dev tools
  }

  return baseConfig;
};

/**
 * Apply helmet middleware with configuration
 */
const applySecurityHeaders = () => helmet(getHelmetConfig());

/**
 * Additional custom security headers
 */
const customSecurityHeaders = (req, res, next) => {
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');

  // XSS Protection (legacy, but still good to have)
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Disable client-side caching for sensitive endpoints
  if (req.path.includes('/auth') || req.path.includes('/admin')) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }

  // Remove potentially sensitive headers
  res.removeHeader('X-Powered-By');
  res.removeHeader('Server');

  // Add API version header
  res.setHeader('X-API-Version', config.apiVersion);

  // Add rate limit info headers (if available)
  if (res.locals.rateLimit) {
    res.setHeader('X-RateLimit-Limit', res.locals.rateLimit.limit);
    res.setHeader('X-RateLimit-Remaining', res.locals.rateLimit.remaining);
    res.setHeader('X-RateLimit-Reset', res.locals.rateLimit.reset);
  }

  next();
};

/**
 * CORS options with enhanced security
 */
const getCorsOptions = () => {
  const allowedOrigins = config.cors.allowedOrigins || [];

  return {
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, Postman, etc.)
      if (!origin) return callback(null, true);

      // In development, allow all localhost origins
      if (config.env === 'development' && origin.includes('localhost')) {
        return callback(null, true);
      }

      // Check if origin is in allowed list
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      // Check if origin matches wildcard pattern
      const wildcardMatch = allowedOrigins.some((allowed) => {
        if (allowed.includes('*')) {
          const pattern = allowed.replace(/\*/g, '.*');
          const regex = new RegExp(`^${pattern}$`);
          return regex.test(origin);
        }
        return false;
      });

      if (wildcardMatch) {
        return callback(null, true);
      }

      // Reject unknown origins
      callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    optionsSuccessStatus: 200,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'X-Request-ID',
    ],
    exposedHeaders: [
      'X-Request-ID',
      'X-RateLimit-Limit',
      'X-RateLimit-Remaining',
      'X-RateLimit-Reset',
    ],
    maxAge: 86400, // 24 hours
  };
};

module.exports = {
  applySecurityHeaders,
  customSecurityHeaders,
  getCorsOptions,
  getHelmetConfig,
};
