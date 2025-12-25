# API Standardization - Implementation Examples

This guide provides practical examples for implementing the API standards in your CoachFlow modules.

## Table of Contents
1. [Controller Examples](#controller-examples)
2. [Service/Repository Examples](#service-repository-examples)
3. [Route Documentation Examples](#route-documentation-examples)
4. [Testing Examples](#testing-examples)

---

## Controller Examples

### Basic Success Response

```javascript
const { successResponse } = require('../../common/utils/response');
const { asyncHandler } = require('../../common/middleware/errorHandler');

getWorkout = asyncHandler(async (req, res) => {
  const workout = await workoutService.getWorkoutById(req.params.id);
  return successResponse(res, workout, 'Workout retrieved successfully');
});
```

### Created Response

```javascript
const { createdResponse } = require('../../common/utils/response');

createWorkout = asyncHandler(async (req, res) => {
  const workout = await workoutService.createWorkout(req.user._id, req.body);
  return createdResponse(res, workout, 'Workout created successfully');
});
```

### Paginated Response

```javascript
const { paginatedResponse } = require('../../common/utils/response');
const { buildQueryOptions } = require('../../common/utils/queryParser');

getWorkouts = asyncHandler(async (req, res) => {
  // Parse and validate query parameters
  const queryOptions = buildQueryOptions(req.query, {
    allowedSortFields: ['name', 'createdAt', 'status', 'difficulty'],
    allowedFilterFields: ['status', 'type', 'clientId', 'difficulty'],
    defaultSort: '-createdAt',
  });

  const { pagination, filters } = queryOptions;

  // Call service with parsed options
  const { workouts, total } = await workoutService.getWorkouts(filters, queryOptions);

  // Return paginated response
  return paginatedResponse(
    res,
    workouts,
    pagination.page,
    pagination.limit,
    total,
    'Workouts retrieved successfully'
  );
});
```

### Response with Additional Meta

```javascript
const { successResponse } = require('../../common/utils/response');

getProgress = asyncHandler(async (req, res) => {
  const progress = await clientService.getProgress(req.user._id);
  
  return successResponse(
    res,
    progress,
    'Progress retrieved successfully',
    200,
    {
      calculatedAt: new Date().toISOString(),
      dataPoints: progress.measurements.length,
    }
  );
});
```

### Error Response

```javascript
const { errorResponse } = require('../../common/utils/response');
const { APIError } = require('../../common/utils/errors');

deleteWorkout = asyncHandler(async (req, res) => {
  const workout = await workoutService.getWorkoutById(req.params.id);
  
  if (!workout) {
    throw new APIError('Workout not found', 404);
  }
  
  if (workout.coachId.toString() !== req.user._id.toString()) {
    throw new APIError('Insufficient permissions', 403);
  }
  
  await workoutService.deleteWorkout(req.params.id);
  return successResponse(res, null, 'Workout deleted successfully');
});
```

---

## Service/Repository Examples

### Using Query Parser in Repository

```javascript
const { applyQueryOptions } = require('../../common/utils/queryParser');

async getWorkouts(filters, queryOptions) {
  // Build base query
  let query = Workout.find(filters);

  // Apply pagination, sorting, and field selection
  query = applyQueryOptions(query, queryOptions);

  // Execute query
  const workouts = await query.exec();

  // Get total count for pagination
  const total = await Workout.countDocuments(filters);

  return { workouts, total };
}
```

### Advanced Filtering in Service

```javascript
const { parseFilters, parseDateRange } = require('../../common/utils/queryParser');

async getWorkoutLogs(userId, queryParams) {
  // Parse filters from query
  const filters = parseFilters(queryParams, ['status', 'type', 'difficulty']);

  // Add user filter
  filters.userId = userId;

  // Add date range if provided
  const dateRange = parseDateRange(queryParams, 'completedAt');
  if (dateRange) {
    Object.assign(filters, dateRange);
  }

  // Build query
  const logs = await WorkoutLog.find(filters)
    .sort('-completedAt')
    .limit(50);

  return logs;
}
```

### Cursor-Based Pagination

```javascript
async getWorkoutsCursor(filters, queryOptions) {
  const { pagination } = queryOptions;

  let query = Workout.find(filters);

  // Apply cursor if present
  if (pagination.type === 'cursor' && pagination.cursor) {
    query = query.where('_id').gt(pagination.cursor);
  }

  // Apply sorting and limit
  query = applyQueryOptions(query, queryOptions);

  const workouts = await query.exec();

  // Generate next cursor (last item's ID)
  const nextCursor = workouts.length > 0 
    ? workouts[workouts.length - 1]._id.toString() 
    : null;

  return { 
    workouts, 
    nextCursor,
    hasMore: workouts.length === pagination.limit 
  };
}
```

### Complex Filtering Logic

```javascript
const { parseFilters } = require('../../common/utils/queryParser');

async searchClients(queryParams) {
  // Parse standard filters
  const filters = parseFilters(queryParams, [
    'status', 
    'coachId', 
    'subscriptionLevel'
  ]);

  // Add custom filter logic
  if (queryParams.search) {
    filters.$or = [
      { firstName: { $regex: queryParams.search, $options: 'i' } },
      { lastName: { $regex: queryParams.search, $options: 'i' } },
      { email: { $regex: queryParams.search, $options: 'i' } },
    ];
  }

  // Age range filter
  if (queryParams.minAge || queryParams.maxAge) {
    filters.age = {};
    if (queryParams.minAge) filters.age.$gte = parseInt(queryParams.minAge);
    if (queryParams.maxAge) filters.age.$lte = parseInt(queryParams.maxAge);
  }

  const clients = await ClientProfile.find(filters);
  const total = await ClientProfile.countDocuments(filters);

  return { clients, total };
}
```

---

## Route Documentation Examples

### Complete Endpoint Documentation

```javascript
/**
 * @swagger
 * /workouts:
 *   get:
 *     summary: Get all workouts with advanced filtering
 *     description: |
 *       Retrieve a paginated list of workouts with support for:
 *       - Pagination (offset or cursor-based)
 *       - Filtering by multiple fields
 *       - Sorting by multiple fields
 *       - Field selection
 *     tags: [Workouts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/PageParam'
 *       - $ref: '#/components/parameters/LimitParam'
 *       - $ref: '#/components/parameters/SortParam'
 *       - $ref: '#/components/parameters/FieldsParam'
 *       - $ref: '#/components/parameters/CursorParam'
 *       - name: status
 *         in: query
 *         description: Filter by workout status
 *         schema:
 *           type: string
 *           enum: [active, completed, archived]
 *         example: active
 *       - name: type
 *         in: query
 *         description: Filter by workout type
 *         schema:
 *           type: string
 *           enum: [strength, cardio, flexibility, mixed]
 *       - name: difficulty
 *         in: query
 *         description: Filter by difficulty level (supports operators)
 *         schema:
 *           type: string
 *         examples:
 *           exact:
 *             value: 3
 *             summary: Exact match
 *           gte:
 *             value: difficulty[gte]=3
 *             summary: Greater than or equal to 3
 *       - name: clientId
 *         in: query
 *         description: Filter by client ID
 *         schema:
 *           type: string
 *       - name: startDate
 *         in: query
 *         description: Filter workouts created after this date
 *         schema:
 *           type: string
 *           format: date
 *         example: '2025-01-01'
 *       - name: endDate
 *         in: query
 *         description: Filter workouts created before this date
 *         schema:
 *           type: string
 *           format: date
 *         example: '2025-12-31'
 *     responses:
 *       200:
 *         description: Successfully retrieved workouts
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedResponse'
 *             examples:
 *               offsetPagination:
 *                 summary: Offset-based pagination response
 *                 value:
 *                   requestId: 123e4567-e89b-12d3-a456-426614174000
 *                   timestamp: '2025-12-20T10:00:00.000Z'
 *                   data:
 *                     - _id: 507f1f77bcf86cd799439011
 *                       name: Upper Body Strength
 *                       type: strength
 *                       status: active
 *                       difficulty: 4
 *                       exercises: []
 *                       createdAt: '2025-12-20T10:00:00.000Z'
 *                   error: null
 *                   meta:
 *                     message: Success
 *                     pagination:
 *                       page: 1
 *                       limit: 10
 *                       total: 50
 *                       totalPages: 5
 *                       hasNextPage: true
 *                       hasPrevPage: false
 *                       nextPage: 2
 *                       prevPage: null
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/workouts', authenticate, workoutController.getWorkouts);
```

### Schema Documentation

```javascript
/**
 * @swagger
 * components:
 *   schemas:
 *     Workout:
 *       type: object
 *       required:
 *         - name
 *         - exercises
 *       properties:
 *         _id:
 *           type: string
 *           description: Workout ID
 *         name:
 *           type: string
 *           description: Workout name
 *           minLength: 3
 *           maxLength: 100
 *         description:
 *           type: string
 *           description: Workout description
 *         type:
 *           type: string
 *           enum: [strength, cardio, flexibility, mixed]
 *           description: Workout type
 *         difficulty:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *           description: Difficulty level (1-5)
 *         status:
 *           type: string
 *           enum: [active, completed, archived]
 *           default: active
 *         exercises:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               exerciseId:
 *                 type: string
 *               sets:
 *                 type: integer
 *               reps:
 *                 type: integer
 *               duration:
 *                 type: integer
 *         clientId:
 *           type: string
 *           description: Client ID (if assigned)
 *         coachId:
 *           type: string
 *           description: Coach who created the workout
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *       example:
 *         _id: 507f1f77bcf86cd799439011
 *         name: Upper Body Strength
 *         description: Focus on chest, back, and arms
 *         type: strength
 *         difficulty: 4
 *         status: active
 *         exercises:
 *           - exerciseId: 507f1f77bcf86cd799439012
 *             sets: 3
 *             reps: 10
 *         coachId: 507f1f77bcf86cd799439013
 *         createdAt: '2025-12-20T10:00:00.000Z'
 *         updatedAt: '2025-12-20T10:00:00.000Z'
 */
```

---

## Testing Examples

### Testing Pagination

```javascript
describe('GET /api/v1/workouts', () => {
  it('should return paginated workouts', async () => {
    const response = await request(app)
      .get('/api/v1/workouts/workouts')
      .query({ page: 1, limit: 10 })
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body).toHaveProperty('requestId');
    expect(response.body).toHaveProperty('timestamp');
    expect(response.body.data).toBeInstanceOf(Array);
    expect(response.body.error).toBeNull();
    expect(response.body.meta).toHaveProperty('pagination');
    expect(response.body.meta.pagination).toMatchObject({
      page: 1,
      limit: 10,
      total: expect.any(Number),
      totalPages: expect.any(Number),
      hasNextPage: expect.any(Boolean),
      hasPrevPage: false,
    });
  });

  it('should respect page and limit parameters', async () => {
    const response = await request(app)
      .get('/api/v1/workouts/workouts')
      .query({ page: 2, limit: 5 })
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body.data).toHaveLength(5);
    expect(response.body.meta.pagination.page).toBe(2);
    expect(response.body.meta.pagination.limit).toBe(5);
  });
});
```

### Testing Filtering

```javascript
describe('Workout Filtering', () => {
  it('should filter by status', async () => {
    const response = await request(app)
      .get('/api/v1/workouts/workouts')
      .query({ status: 'active' })
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    response.body.data.forEach((workout) => {
      expect(workout.status).toBe('active');
    });
  });

  it('should filter using operators', async () => {
    const response = await request(app)
      .get('/api/v1/workouts/workouts')
      .query({ 'difficulty[gte]': 3 })
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    response.body.data.forEach((workout) => {
      expect(workout.difficulty).toBeGreaterThanOrEqual(3);
    });
  });

  it('should combine multiple filters', async () => {
    const response = await request(app)
      .get('/api/v1/workouts/workouts')
      .query({ 
        status: 'active',
        type: 'strength',
        'difficulty[gte]': 3
      })
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    response.body.data.forEach((workout) => {
      expect(workout.status).toBe('active');
      expect(workout.type).toBe('strength');
      expect(workout.difficulty).toBeGreaterThanOrEqual(3);
    });
  });
});
```

### Testing Sorting

```javascript
describe('Workout Sorting', () => {
  it('should sort by createdAt descending by default', async () => {
    const response = await request(app)
      .get('/api/v1/workouts/workouts')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const dates = response.body.data.map((w) => new Date(w.createdAt));
    const sortedDates = [...dates].sort((a, b) => b - a);
    expect(dates).toEqual(sortedDates);
  });

  it('should sort by specified field', async () => {
    const response = await request(app)
      .get('/api/v1/workouts/workouts')
      .query({ sort: 'name' })
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const names = response.body.data.map((w) => w.name);
    const sortedNames = [...names].sort();
    expect(names).toEqual(sortedNames);
  });

  it('should handle multi-field sorting', async () => {
    const response = await request(app)
      .get('/api/v1/workouts/workouts')
      .query({ sort: '-difficulty,name' })
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    // Verify sorting logic
    for (let i = 0; i < response.body.data.length - 1; i++) {
      const current = response.body.data[i];
      const next = response.body.data[i + 1];
      
      if (current.difficulty === next.difficulty) {
        expect(current.name.localeCompare(next.name)).toBeLessThanOrEqual(0);
      } else {
        expect(current.difficulty).toBeGreaterThanOrEqual(next.difficulty);
      }
    }
  });
});
```

### Testing Request Tracing

```javascript
describe('Request Tracing', () => {
  it('should include requestId in response', async () => {
    const response = await request(app)
      .get('/api/v1/workouts/workouts')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body.requestId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    );
    expect(response.headers['x-request-id']).toBeDefined();
  });

  it('should use provided request ID', async () => {
    const requestId = '123e4567-e89b-12d3-a456-426614174000';
    
    const response = await request(app)
      .get('/api/v1/workouts/workouts')
      .set('Authorization', `Bearer ${token}`)
      .set('X-Request-ID', requestId)
      .expect(200);

    expect(response.body.requestId).toBe(requestId);
    expect(response.headers['x-request-id']).toBe(requestId);
  });
});
```

---

## Best Practices

1. **Always use response utilities** - Never manually construct responses
2. **Parse queries early** - Use `buildQueryOptions` at controller level
3. **Validate allowed fields** - Specify `allowedSortFields` and `allowedFilterFields`
4. **Document everything** - Add Swagger comments to all routes
5. **Test comprehensively** - Include pagination, filtering, and sorting tests
6. **Log with request IDs** - Include `req.id` in all log messages
7. **Handle edge cases** - Empty results, invalid cursors, etc.
8. **Use appropriate status codes** - Follow RESTful conventions

---

*For complete API standards, see `API_STANDARDS.md`*

