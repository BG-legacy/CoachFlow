# CoachFlow API Quick Reference

## Base URL
```
http://localhost:5000/api/v1
```

## Response Format

All responses follow this structure:

```json
{
  "requestId": "uuid",
  "timestamp": "ISO 8601 date",
  "data": {},      // or null for errors
  "error": {},     // or null for success
  "meta": {}
}
```

## Common Query Parameters

| Parameter | Description | Example |
|-----------|-------------|---------|
| `page` | Page number (default: 1) | `?page=2` |
| `limit` | Items per page (default: 10, max: 100) | `?limit=20` |
| `sort` | Sort fields | `?sort=-createdAt,name` |
| `fields` | Select specific fields | `?fields=name,email` |
| `cursor` | Cursor-based pagination | `?cursor=xyz123` |

## Filtering

### Basic Filtering
```
?status=active&type=strength
```

### Advanced Operators
```
?age[gte]=18          # Greater than or equal
?price[lte]=100       # Less than or equal
?status[in]=active,pending    # In array
?name[like]=john      # Contains (case-insensitive)
?coachId[exists]=true # Field exists
```

### Date Ranges
```
?startDate=2025-01-01&endDate=2025-12-31
```

## Sorting

### Single Field
```
?sort=createdAt       # Ascending
?sort=-createdAt      # Descending
?sort=name:asc        # Explicit ascending
?sort=name:desc       # Explicit descending
```

### Multiple Fields
```
?sort=-priority,createdAt
?sort=status:desc,name:asc
```

## Authentication

Include JWT token in header:
```
Authorization: Bearer <token>
```

## Request Tracing

Optionally provide request ID:
```
X-Request-ID: 123e4567-e89b-12d3-a456-426614174000
```

## Status Codes

| Code | Meaning |
|------|---------|
| 200 | OK |
| 201 | Created |
| 202 | Accepted |
| 204 | No Content |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 409 | Conflict |
| 422 | Validation Error |
| 429 | Rate Limited |
| 500 | Server Error |

## Example Requests

### Get Paginated Workouts
```bash
GET /api/v1/workouts/workouts?page=1&limit=20&sort=-createdAt&status=active
```

### Filter with Operators
```bash
GET /api/v1/clients?status[in]=active,pending&age[gte]=18&fields=name,email
```

### Create Resource
```bash
POST /api/v1/workouts/workouts
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Upper Body",
  "exercises": [...]
}
```

## Documentation

Interactive API documentation:
```
http://localhost:5000/api/docs
```

OpenAPI Spec:
```
http://localhost:5000/api/docs.json
```

## Rate Limits

- **Window:** 15 minutes
- **Max Requests:** 100 per IP

## Quick Tips

1. Always include `Authorization` header for protected routes
2. Use pagination for list endpoints
3. Include `X-Request-ID` header for debugging
4. Reference `requestId` in support requests
5. Check Swagger docs for detailed schemas
6. Use `fields` parameter to optimize response size
7. Combine filters, sorting, and pagination in single request

## Common Patterns

### List Resources with Filters
```bash
GET /api/v1/{resource}?page=1&limit=10&sort=-createdAt&status=active
```

### Get Single Resource
```bash
GET /api/v1/{resource}/{id}
```

### Create Resource
```bash
POST /api/v1/{resource}
Authorization: Bearer <token>
```

### Update Resource
```bash
PUT /api/v1/{resource}/{id}
Authorization: Bearer <token>
```

### Delete Resource
```bash
DELETE /api/v1/{resource}/{id}
Authorization: Bearer <token>
```

## Support

- Documentation: `/api/docs`
- Health Check: `/health`
- Full Standards: See `API_STANDARDS.md`

