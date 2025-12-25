/**
 * Swagger/OpenAPI Configuration
 * Generates and serves API documentation
 */

const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const config = require('./index');

/**
 * Swagger definition
 */
const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'CoachFlow API',
    version: config.apiVersion,
    description: 'CoachFlow - Fitness Coaching Platform API Documentation',
    contact: {
      name: 'CoachFlow Team',
      email: config.admin.email,
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT',
    },
  },
  servers: [
    {
      url: `http://localhost:${config.port}/api/${config.apiVersion}`,
      description: 'Development server',
    },
    ...(config.env === 'production'
      ? [
        {
          url: `https://api.coachflow.com/api/${config.apiVersion}`,
          description: 'Production server',
        },
      ]
      : []),
    ...(config.env === 'staging'
      ? [
        {
          url: `https://staging-api.coachflow.com/api/${config.apiVersion}`,
          description: 'Staging server',
        },
      ]
      : []),
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter your JWT token',
      },
    },
    schemas: {
      // Standard Response Envelope
      SuccessResponse: {
        type: 'object',
        properties: {
          requestId: {
            type: 'string',
            format: 'uuid',
            description: 'Unique request identifier for tracing',
          },
          timestamp: {
            type: 'string',
            format: 'date-time',
            description: 'Response timestamp',
          },
          data: {
            description: 'Response data payload',
          },
          error: {
            type: 'null',
            description: 'Error object (null for successful responses)',
          },
          meta: {
            type: 'object',
            properties: {
              message: {
                type: 'string',
                description: 'Response message',
              },
            },
          },
        },
        required: ['requestId', 'timestamp', 'data', 'error', 'meta'],
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          requestId: {
            type: 'string',
            format: 'uuid',
            description: 'Unique request identifier for tracing',
          },
          timestamp: {
            type: 'string',
            format: 'date-time',
            description: 'Response timestamp',
          },
          data: {
            type: 'null',
            description: 'Data payload (null for error responses)',
          },
          error: {
            type: 'object',
            properties: {
              message: {
                type: 'string',
                description: 'Error message',
              },
              statusCode: {
                type: 'integer',
                description: 'HTTP status code',
              },
              details: {
                type: 'array',
                description: 'Detailed error information (e.g., validation errors)',
                items: {
                  type: 'object',
                },
              },
            },
            required: ['message', 'statusCode'],
          },
          meta: {
            type: 'object',
            description: 'Additional metadata',
          },
        },
        required: ['requestId', 'timestamp', 'data', 'error', 'meta'],
      },
      PaginatedResponse: {
        allOf: [
          {
            $ref: '#/components/schemas/SuccessResponse',
          },
          {
            type: 'object',
            properties: {
              meta: {
                type: 'object',
                properties: {
                  message: {
                    type: 'string',
                  },
                  pagination: {
                    type: 'object',
                    properties: {
                      page: {
                        type: 'integer',
                        description: 'Current page number',
                      },
                      limit: {
                        type: 'integer',
                        description: 'Items per page',
                      },
                      total: {
                        type: 'integer',
                        description: 'Total number of items',
                      },
                      totalPages: {
                        type: 'integer',
                        description: 'Total number of pages',
                      },
                      hasNextPage: {
                        type: 'boolean',
                        description: 'Whether there is a next page',
                      },
                      hasPrevPage: {
                        type: 'boolean',
                        description: 'Whether there is a previous page',
                      },
                      nextPage: {
                        type: 'integer',
                        nullable: true,
                        description: 'Next page number',
                      },
                      prevPage: {
                        type: 'integer',
                        nullable: true,
                        description: 'Previous page number',
                      },
                    },
                    required: [
                      'page',
                      'limit',
                      'total',
                      'totalPages',
                      'hasNextPage',
                      'hasPrevPage',
                    ],
                  },
                },
              },
            },
          },
        ],
      },
      // Common Parameters
      PaginationParams: {
        type: 'object',
        properties: {
          page: {
            type: 'integer',
            minimum: 1,
            default: 1,
            description: 'Page number for offset-based pagination',
          },
          limit: {
            type: 'integer',
            minimum: 1,
            maximum: 100,
            default: 10,
            description: 'Number of items per page',
          },
          cursor: {
            type: 'string',
            description: 'Cursor for cursor-based pagination (alternative to page)',
          },
        },
      },
      SortingParams: {
        type: 'object',
        properties: {
          sort: {
            type: 'string',
            description:
              'Sort fields. Format: field1:asc,field2:desc or -field1,field2. Prefix with "-" for descending order.',
            example: '-createdAt,name',
          },
        },
      },
      FilteringParams: {
        type: 'object',
        properties: {
          fields: {
            type: 'string',
            description: 'Comma-separated list of fields to include in response',
            example: 'name,email,phone',
          },
        },
      },
    },
    parameters: {
      PageParam: {
        name: 'page',
        in: 'query',
        description: 'Page number for pagination',
        schema: {
          type: 'integer',
          minimum: 1,
          default: 1,
        },
      },
      LimitParam: {
        name: 'limit',
        in: 'query',
        description: 'Number of items per page',
        schema: {
          type: 'integer',
          minimum: 1,
          maximum: 100,
          default: 10,
        },
      },
      SortParam: {
        name: 'sort',
        in: 'query',
        description:
          'Sort fields. Format: field1:asc,field2:desc or -field1,field2. Prefix with "-" for descending order.',
        schema: {
          type: 'string',
        },
        example: '-createdAt',
      },
      FieldsParam: {
        name: 'fields',
        in: 'query',
        description: 'Comma-separated list of fields to include in response',
        schema: {
          type: 'string',
        },
        example: 'name,email,phone',
      },
      CursorParam: {
        name: 'cursor',
        in: 'query',
        description: 'Cursor for cursor-based pagination (alternative to page parameter)',
        schema: {
          type: 'string',
        },
      },
      RequestIdHeader: {
        name: 'X-Request-ID',
        in: 'header',
        description: 'Optional request ID for tracing. If not provided, one will be generated.',
        schema: {
          type: 'string',
          format: 'uuid',
        },
      },
    },
    responses: {
      BadRequest: {
        description: 'Bad Request - Invalid input data',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ErrorResponse',
            },
            example: {
              requestId: '123e4567-e89b-12d3-a456-426614174000',
              timestamp: '2025-12-20T10:00:00.000Z',
              data: null,
              error: {
                message: 'Validation failed',
                statusCode: 400,
                details: [
                  {
                    field: 'email',
                    message: 'Invalid email format',
                  },
                ],
              },
              meta: {},
            },
          },
        },
      },
      Unauthorized: {
        description: 'Unauthorized - Authentication required',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ErrorResponse',
            },
            example: {
              requestId: '123e4567-e89b-12d3-a456-426614174000',
              timestamp: '2025-12-20T10:00:00.000Z',
              data: null,
              error: {
                message: 'Authentication required',
                statusCode: 401,
              },
              meta: {},
            },
          },
        },
      },
      Forbidden: {
        description: 'Forbidden - Insufficient permissions',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ErrorResponse',
            },
            example: {
              requestId: '123e4567-e89b-12d3-a456-426614174000',
              timestamp: '2025-12-20T10:00:00.000Z',
              data: null,
              error: {
                message: 'Insufficient permissions',
                statusCode: 403,
              },
              meta: {},
            },
          },
        },
      },
      NotFound: {
        description: 'Not Found - Resource does not exist',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ErrorResponse',
            },
            example: {
              requestId: '123e4567-e89b-12d3-a456-426614174000',
              timestamp: '2025-12-20T10:00:00.000Z',
              data: null,
              error: {
                message: 'Resource not found',
                statusCode: 404,
              },
              meta: {},
            },
          },
        },
      },
      InternalServerError: {
        description: 'Internal Server Error',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ErrorResponse',
            },
            example: {
              requestId: '123e4567-e89b-12d3-a456-426614174000',
              timestamp: '2025-12-20T10:00:00.000Z',
              data: null,
              error: {
                message: 'Internal server error',
                statusCode: 500,
              },
              meta: {},
            },
          },
        },
      },
    },
  },
  security: [
    {
      bearerAuth: [],
    },
  ],
  tags: [
    {
      name: 'Authentication',
      description: 'User authentication and authorization endpoints',
    },
    {
      name: 'Clients',
      description: 'Client profile management',
    },
    {
      name: 'Workouts',
      description: 'Workout and program management',
    },
    {
      name: 'Nutrition',
      description: 'Nutrition and meal plan management',
    },
    {
      name: 'Check-ins',
      description: 'Client check-in management',
    },
    {
      name: 'Sessions',
      description: 'Coaching session management',
    },
    {
      name: 'Gamification',
      description: 'Achievements and rewards',
    },
    {
      name: 'Reports',
      description: 'Analytics and reporting',
    },
    {
      name: 'Form Analysis',
      description: 'Exercise form analysis using AI',
    },
    {
      name: 'Admin',
      description: 'Administrative operations',
    },
  ],
};

/**
 * Options for swagger-jsdoc
 */
const swaggerOptions = {
  definition: swaggerDefinition,
  // Path to API route files that contain JSDoc comments
  apis: [
    './src/modules/*/routes/*.js',
    './src/modules/*/models/*.js',
    './src/common/utils/response.js',
  ],
};

// Generate swagger specification
const swaggerSpec = swaggerJsdoc(swaggerOptions);

/**
 * Swagger UI options
 */
const swaggerUiOptions = {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'CoachFlow API Documentation',
  customfavIcon: '/favicon.ico',
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    filter: true,
    tryItOutEnabled: true,
  },
};

module.exports = {
  swaggerSpec,
  swaggerUi,
  swaggerUiOptions,
};
