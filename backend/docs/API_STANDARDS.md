# CoachFlow API Standards & Guidelines

## Overview

This document outlines the comprehensive API standards implemented across all CoachFlow endpoints to ensure consistency, maintainability, and excellent developer experience.

## Table of Contents

- [Response Envelope](#response-envelope)
- [Pagination](#pagination)
- [Filtering & Searching](#filtering--searching)
- [Sorting](#sorting)
- [Field Selection](#field-selection)
- [API Versioning](#api-versioning)
- [Request Tracing](#request-tracing)
- [Error Handling](#error-handling)
- [Authentication](#authentication)
- [API Documentation](#api-documentation)

---

## Response Envelope

All API responses follow a consistent envelope structure for both success and error cases.

### Success Response Structure

```json
{
  "requestId": "123e4567-e89b-12d3-a456-426614174000",
  "timestamp": "2025-12-20T10:00:00.000Z",
  "data": {
    // Actual response payload
  },
  "error": null,
  "meta": {
    "message": "Success message",
    // Additional metadata
  }
}
```

### Error Response Structure

```json
{
  "requestId": "123e4567-e89b-12d3-a456-426614174000",
  "timestamp": "2025-12-20T10:00:00.000Z",
  "data": null,
  "error": {
    "message": "Error message",
    "statusCode": 400,
    "details": [
      {
        "field": "email",
        "message": "Invalid email format"
      }
    ]
  },
  "meta": {}
}
```

### Paginated Response Structure

```json
{
  "requestId": "123e4567-e89b-12d3-a456-426614174000",
  "timestamp": "2025-12-20T10:00:00.000Z",
  "data": [
    // Array of items
  ],
  "error": null,
  "meta": {
    "message": "Success",
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 100,
      "totalPages": 10,
      "hasNextPage": true,
      "hasPrevPage": false,
      "nextPage": 2,
      "prevPage": null
    }
  }
}
```

### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `requestId` | string (UUID) | Unique identifier for request tracing |
| `timestamp` | string (ISO 8601) | Response generation timestamp |
| `data` | any | Response payload (null for errors) |
| `error` | object\|null | Error details (null for success) |
| `meta` | object | Additional metadata (message, pagination, etc.) |

---

## Pagination

The API supports two pagination strategies: **offset-based** (default) and **cursor-based**.

### Offset-Based Pagination (Default)

Use page numbers and limits for navigating through data.

**Query Parameters:**
- `page` (integer, default: 1, min: 1) - Page number
- `limit` (integer, default: 10, min: 1, max: 100) - Items per page

**Example Request:**
```http
GET /api/v1/workouts?page=2&limit=20
```

**Example Response:**
```json
{
  "requestId": "...",
  "timestamp": "...",
  "data": [...],
  "error": null,
  "meta": {
    "message": "Success",
    "pagination": {
      "page": 2,
      "limit": 20,
      "total": 150,
      "totalPages": 8,
      "hasNextPage": true,
      "hasPrevPage": true,
      "nextPage": 3,
      "prevPage": 1
    }
  }
}
```

### Cursor-Based Pagination

Use cursors for more efficient pagination of large datasets (especially useful for real-time data).

**Query Parameters:**
- `cursor` (string) - Cursor token from previous response
- `limit` (integer, default: 10, min: 1, max: 100) - Items per page

**Example Request:**
```http
GET /api/v1/workouts?cursor=eyJpZCI6IjEyMyJ9&limit=20
```

**Note:** If `cursor` parameter is present, it takes precedence over `page` parameter.

---

## Filtering & Searching

The API provides a powerful and flexible filtering system using query parameters.

### Basic Filtering (Exact Match)

```http
GET /api/v1/workouts?status=active&type=strength
```

### Advanced Filtering with Operators

Use bracket notation to specify operators:

| Operator | Description | Example |
|----------|-------------|---------|
| `eq` | Equal to | `?status[eq]=active` |
| `ne` | Not equal to | `?status[ne]=archived` |
| `gt` | Greater than | `?age[gt]=18` |
| `gte` | Greater than or equal | `?price[gte]=100` |
| `lt` | Less than | `?age[lt]=65` |
| `lte` | Less than or equal | `?price[lte]=500` |
| `in` | In array | `?status[in]=active,pending` |
| `nin` | Not in array | `?type[nin]=cardio,yoga` |
| `like` | Contains (case-insensitive) | `?name[like]=john` |
| `exists` | Field exists | `?coachId[exists]=true` |

### Date Range Filtering

```http
GET /api/v1/workouts?startDate=2025-01-01&endDate=2025-12-31
# or
GET /api/v1/workouts?from=2025-01-01&to=2025-12-31
```

### Multiple Filters

Combine multiple filters in a single request:

```http
GET /api/v1/workouts?status=active&type=strength&difficulty[gte]=3&clientId[exists]=true
```

---

## Sorting

Sort results by one or multiple fields.

### Single Field Sorting

**Ascending order:**
```http
GET /api/v1/workouts?sort=createdAt
# or
GET /api/v1/workouts?sort=createdAt:asc
```

**Descending order:**
```http
GET /api/v1/workouts?sort=-createdAt
# or
GET /api/v1/workouts?sort=createdAt:desc
```

### Multi-Field Sorting

Sort by multiple fields (comma-separated):

```http
GET /api/v1/workouts?sort=-priority,createdAt
# or
GET /api/v1/workouts?sort=priority:desc,createdAt:asc
```

**Sorting Priority:** Fields are sorted in the order specified (left to right).

### Default Sorting

If no sort parameter is provided, most endpoints default to `-createdAt` (newest first).

---

## Field Selection

Optimize response size by selecting only needed fields.

**Query Parameter:**
- `fields` (string) - Comma-separated list of fields to include

**Example Request:**
```http
GET /api/v1/clients?fields=name,email,phone
```

**Example Response:**
```json
{
  "requestId": "...",
  "data": [
    {
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "+1234567890"
    }
  ],
  ...
}
```

**Note:** Some fields (like `_id`, `createdAt`) may always be included for consistency.

---

## API Versioning

The API uses URL path versioning for clear version management.

### Current Version

```
/api/v1
```

### Version Strategy

- **URL Path Versioning:** Version is included in the URL path
- **Current Version:** v1
- **Version Format:** `v{major}`
- **Breaking Changes:** Require a new major version
- **Non-Breaking Changes:** Can be added to existing versions

### Examples

```http
GET /api/v1/workouts
POST /api/v1/clients
PUT /api/v1/nutrition/123
```

### Version Configuration

The API version is configured via environment variable:

```env
API_VERSION=v1
```

### Future Versions

When v2 is released, both versions will be supported during a transition period:

```http
GET /api/v1/workouts  # Old version (deprecated)
GET /api/v2/workouts  # New version
```

---

## Request Tracing

Every request receives a unique identifier for tracing and debugging.

### Request ID Header

**Client can provide:**
```http
X-Request-ID: 123e4567-e89b-12d3-a456-426614174000
```

**Server generates if not provided:**
- Automatically creates a UUID v4 if no request ID is provided
- Returns the request ID in both response header and body

**Response Header:**
```http
X-Request-ID: 123e4567-e89b-12d3-a456-426614174000
```

**Response Body:**
```json
{
  "requestId": "123e4567-e89b-12d3-a456-426614174000",
  ...
}
```

### Use Cases

- **Debugging:** Track requests through logs
- **Support:** Reference specific requests when reporting issues
- **Distributed Tracing:** Connect requests across microservices
- **Monitoring:** Track request performance and errors

---

## Error Handling

Consistent error responses across all endpoints.

### HTTP Status Codes

| Code | Description | When to Use |
|------|-------------|-------------|
| 200 | OK | Successful GET, PUT, PATCH |
| 201 | Created | Successful POST creating a resource |
| 202 | Accepted | Async operation accepted |
| 204 | No Content | Successful DELETE |
| 400 | Bad Request | Invalid request data |
| 401 | Unauthorized | Authentication required |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Resource conflict (e.g., duplicate) |
| 422 | Unprocessable Entity | Validation errors |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server-side error |

### Error Response Format

```json
{
  "requestId": "123e4567-e89b-12d3-a456-426614174000",
  "timestamp": "2025-12-20T10:00:00.000Z",
  "data": null,
  "error": {
    "message": "Validation failed",
    "statusCode": 422,
    "details": [
      {
        "field": "email",
        "message": "Invalid email format"
      },
      {
        "field": "password",
        "message": "Password must be at least 8 characters"
      }
    ]
  },
  "meta": {}
}
```

### Validation Errors

Validation errors include detailed field-level information:

```json
{
  "error": {
    "message": "Validation failed",
    "statusCode": 422,
    "details": [
      {
        "field": "email",
        "message": "Invalid email format",
        "value": "invalid-email"
      }
    ]
  }
}
```

---

## Authentication

API uses JWT bearer token authentication.

### Authentication Header

```http
Authorization: Bearer <jwt_token>
```

### Public Endpoints

The following endpoints don't require authentication:
- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `GET /health`
- `GET /`
- `GET /api/docs`

### Protected Endpoints

All other endpoints require valid JWT token.

### Token Response

```json
{
  "requestId": "...",
  "data": {
    "user": {...},
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": "7d"
  },
  "error": null,
  "meta": {
    "message": "Login successful"
  }
}
```

---

## API Documentation

### Interactive Documentation

OpenAPI/Swagger documentation is available at:

```
http://localhost:5000/api/docs
```

### Features

- **Interactive Testing:** Try API endpoints directly from the browser
- **Authentication Support:** Test authenticated endpoints
- **Request/Response Examples:** See example requests and responses
- **Schema Definitions:** View request/response schemas
- **Filter & Search:** Find endpoints quickly

### OpenAPI Spec

Download the OpenAPI specification:

```
http://localhost:5000/api/docs.json
```

### Documentation Standards

All endpoints should include:
1. **JSDoc comments** in route files
2. **Request/response schemas**
3. **Example requests/responses**
4. **Authentication requirements**
5. **Query parameter descriptions**

---

## Implementation Guide

### Using Response Utilities

```javascript
const { 
  successResponse, 
  errorResponse, 
  paginatedResponse,
  createdResponse 
} = require('../common/utils/response');

// Success response
successResponse(res, data, 'Operation successful', 200, { additionalMeta: 'value' });

// Created response
createdResponse(res, newResource, 'Resource created');

// Paginated response
paginatedResponse(res, items, page, limit, total, 'Success', { additionalMeta: 'value' });

// Error response
errorResponse(res, 'Error message', 400, validationErrors, { additionalMeta: 'value' });
```

### Using Query Parser

```javascript
const { buildQueryOptions, applyQueryOptions } = require('../common/utils/queryParser');

// In controller
const queryOptions = buildQueryOptions(req.query, {
  allowedSortFields: ['name', 'createdAt', 'status'],
  allowedFilterFields: ['status', 'type', 'clientId'],
  defaultSort: '-createdAt',
});

// In service/repository
const query = Model.find(queryOptions.filters);
applyQueryOptions(query, queryOptions);
const results = await query.exec();
```

### Adding Swagger Documentation

```javascript
/**
 * @swagger
 * /workouts:
 *   get:
 *     summary: Get all workouts
 *     tags: [Workouts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/PageParam'
 *       - $ref: '#/components/parameters/LimitParam'
 *       - $ref: '#/components/parameters/SortParam'
 *       - name: status
 *         in: query
 *         description: Filter by status
 *         schema:
 *           type: string
 *           enum: [active, completed, archived]
 *     responses:
 *       200:
 *         description: Successful response
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/', authenticate, workoutController.getWorkouts);
```

---

## Best Practices

### 1. Always Use Response Utilities

Never manually construct response objects. Always use the provided utility functions.

### 2. Validate Query Parameters

Use the query parser utilities to validate and sanitize query parameters.

### 3. Document All Endpoints

Add Swagger/JSDoc comments to all route definitions.

### 4. Include Request IDs in Logs

Always include the request ID in log messages for tracing.

```javascript
logger.info('Processing workout creation', { requestId: req.id, userId: req.user._id });
```

### 5. Use Appropriate HTTP Status Codes

Follow RESTful conventions and use appropriate status codes.

### 6. Provide Meaningful Error Messages

Error messages should be clear and actionable for clients.

### 7. Test With Various Query Combinations

Test endpoints with different combinations of pagination, filtering, and sorting.

### 8. Keep Documentation Updated

Update Swagger documentation whenever API changes are made.

---

## Rate Limiting

Current rate limits:
- **Window:** 15 minutes
- **Max Requests:** 100 per window per IP
- **Applies to:** All `/api/*` routes

Rate limit headers are included in all responses:
```http
RateLimit-Limit: 100
RateLimit-Remaining: 95
RateLimit-Reset: 1640000000
```

---

## CORS Configuration

Allowed origins are configurable via environment variables:

```env
CORS_ORIGIN=http://localhost:3000
ALLOWED_ORIGINS=http://localhost:3000,https://app.coachflow.com
```

---

## Support & Resources

- **API Documentation:** `/api/docs`
- **Health Check:** `/health`
- **OpenAPI Spec:** `/api/docs.json`
- **Current Version:** `v1`

---

## Changelog

### v1.0.0 (2025-12-20)
- Initial API standards implementation
- Standardized response envelope (requestId, data, error, meta)
- Comprehensive pagination support (offset and cursor-based)
- Advanced filtering with operators
- Multi-field sorting
- Field selection
- Request tracing with unique IDs
- OpenAPI/Swagger documentation
- API versioning via URL path

---

*Last Updated: December 20, 2025*

