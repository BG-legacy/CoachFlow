# Onboarding & Profile Management Tests

Comprehensive test suite for user onboarding flow and trainer constraint management functionality.

## Test Coverage

### 1. Onboarding Flow Tests

#### Step 1: Goals
- ✅ Update fitness goals successfully
- ✅ Validate primary goal requirement
- ✅ Validate goal types
- ✅ Audit logging for step completion

#### Step 2: Experience Level
- ✅ Update experience level successfully
- ✅ Validate experience levels
- ✅ Track training history

#### Step 3: Equipment
- ✅ Update equipment preferences
- ✅ Validate gym access field
- ✅ Validate equipment types
- ✅ Handle both gym and home equipment

#### Step 4: Schedule
- ✅ Update schedule preferences
- ✅ Validate available days
- ✅ Validate session duration (15-180 min)
- ✅ Validate sessions per week (1-7)
- ✅ Handle time zones

#### Step 5: Injuries & Limitations
- ✅ Update medical information
- ✅ Track injuries with severity
- ✅ Track limitations with affected exercises
- ✅ Allow empty limitations

#### Step 6: Nutrition
- ✅ Update nutrition preferences
- ✅ Track dietary restrictions
- ✅ Handle food allergies with severity
- ✅ Validate calorie targets (1000-10000)
- ✅ Complete onboarding on final step

### 2. Onboarding Status
- ✅ Get onboarding progress
- ✅ Track completion percentage
- ✅ Track completed steps
- ✅ Authentication required

### 3. Profile Partial Updates
- ✅ Update profile after onboarding
- ✅ Partial field updates
- ✅ Maintain existing data

### 4. Trainer Constraint Management
- ✅ Coach view client constraints
- ✅ Single constraint updates with audit
- ✅ Bulk constraint updates
- ✅ Constraint change history
- ✅ Authorization checks
- ✅ Audit logging for all changes

### 5. Security & Authorization
- ✅ Prevent unauthorized access
- ✅ Coach can only access assigned clients
- ✅ Clients cannot use constraint endpoints
- ✅ Authentication required

### 6. Validation & Edge Cases
- ✅ Prevent duplicate onboarding
- ✅ Text length validation
- ✅ Numeric range validation
- ✅ Enum validation

### 7. Audit Trail
- ✅ Complete onboarding audit trail
- ✅ Constraint change audit trail
- ✅ IP address and user agent logging
- ✅ Old/new value tracking

## Running the Tests

### Run all onboarding tests:
```bash
npm test tests/onboarding.test.js
```

### Run with coverage:
```bash
npm test tests/onboarding.test.js -- --coverage
```

### Use the convenience script:
```bash
./tests/run-onboarding-tests.sh
```

### Run specific test suite:
```bash
npm test tests/onboarding.test.js -- -t "Onboarding Step 1"
```

## Test Database

Tests use a separate test database: `coachflow_test`

Environment variable: `MONGODB_URI_TEST`

**Note:** Test database is cleaned before and after each test run.

## API Endpoints Tested

### Onboarding Endpoints
- `POST /api/v1/clients/onboarding/goals`
- `POST /api/v1/clients/onboarding/experience`
- `POST /api/v1/clients/onboarding/equipment`
- `POST /api/v1/clients/onboarding/schedule`
- `POST /api/v1/clients/onboarding/limitations`
- `POST /api/v1/clients/onboarding/nutrition`
- `GET /api/v1/clients/onboarding/status`

### Profile Management
- `POST /api/v1/clients/profile`
- `GET /api/v1/clients/profile/me`
- `PUT /api/v1/clients/profile/me`

### Trainer Constraint Management
- `GET /api/v1/clients/:userId/constraints`
- `PATCH /api/v1/clients/:userId/constraints`
- `PUT /api/v1/clients/:userId/constraints`
- `GET /api/v1/clients/:userId/constraints/history`

## Test Data

### Test Users Created
- Client: `testclient@onboarding.test`
- Coach: `testcoach@onboarding.test`
- Additional clients for specific tests

All test users are cleaned up after tests complete.

## Audit Events Verified

- `ONBOARDING_STEP_COMPLETED` - Each step completion
- `ONBOARDING_COMPLETED` - Full onboarding completion
- `PROFILE_UPDATED` - Profile updates
- `CLIENT_CONSTRAINT_VIEWED` - Coach viewing constraints
- `CLIENT_CONSTRAINT_UPDATED` - Constraint modifications

## Expected Test Results

**Total Tests:** ~60+ test cases  
**Expected Duration:** 10-20 seconds  
**Coverage Target:** 90%+ for onboarding modules

## Test Structure

```
tests/
├── onboarding.test.js          # Main test file
├── run-onboarding-tests.sh     # Convenience runner script
└── ONBOARDING_TESTS_README.md  # This file
```

## Dependencies

- **jest**: Test framework
- **supertest**: HTTP assertions
- **mongoose**: Database models

## Troubleshooting

### Tests fail to connect to database
Ensure MongoDB is running and `MONGODB_URI_TEST` is set correctly.

### Authentication errors
Check that JWT secrets are properly configured in test environment.

### Timeout errors
Increase Jest timeout in test file if database operations are slow.

## Continuous Integration

These tests are designed to run in CI/CD pipelines:

```yaml
# Example GitHub Actions
- name: Run Onboarding Tests
  run: npm test tests/onboarding.test.js
  env:
    NODE_ENV: test
    MONGODB_URI_TEST: ${{ secrets.MONGODB_URI_TEST }}
```

## Future Enhancements

- [ ] Integration with mock email notifications
- [ ] Performance benchmarking tests
- [ ] Load testing for constraint updates
- [ ] Snapshot testing for API responses




