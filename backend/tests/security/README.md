# Security Test Suite

Comprehensive security tests for the CoachFlow API.

## Test Scripts

### 1. `test-rate-limiting.sh`
Tests rate limiting functionality across different endpoints:
- Login rate limiter (3 attempts in prod, 10 in dev)
- Registration rate limiter (3 per hour in prod, 10 in dev)
- Password reset rate limiter (3 per hour in prod, 10 in dev)
- Global API rate limiter (100 per 15min in prod, 1000 in dev)

### 2. `test-input-sanitization.sh`
Tests protection against injection attacks:
- **XSS Protection**: Script tags, inline handlers, javascript: protocol, iframes
- **NoSQL Injection**: MongoDB operators ($ne, $gt, $where, $regex)
- **SQL Injection**: OR injection, UNION attacks, comments, stacked queries
- **Object Pollution**: Prototype pollution, constructor pollution
- **Deep Nesting**: Protection against deep object nesting attacks

### 3. `test-file-upload.sh`
Tests file upload security:
- **Dangerous File Types**: PHP, executables, shell scripts
- **Double Extensions**: .php.jpg patterns
- **Content Scanning**: Embedded malicious code
- **Valid Files**: Ensures legitimate files are accepted
- **Filename Security**: XSS in filenames

### 4. `run-all-tests.sh`
Master script that runs all security tests in sequence.

## Prerequisites

1. **Server Running**: Ensure the API server is running
   ```bash
   cd backend
   npm run dev
   ```

2. **Dependencies**: curl must be installed
   ```bash
   # macOS (usually pre-installed)
   which curl
   
   # Linux
   sudo apt-get install curl
   ```

3. **Permissions**: Make scripts executable
   ```bash
   chmod +x tests/security/*.sh
   ```

## Running Tests

### Run All Tests
```bash
cd backend
./tests/security/run-all-tests.sh
```

### Run Individual Test Suites
```bash
# Rate limiting tests
./tests/security/test-rate-limiting.sh

# Input sanitization tests
./tests/security/test-input-sanitization.sh

# File upload tests
./tests/security/test-file-upload.sh
```

## Understanding Results

### Success Indicators
- ✓ Green checkmarks indicate passed tests
- HTTP 400/422 for blocked injection attempts
- HTTP 429 for rate limit enforcement
- Sanitized output for XSS attempts

### Failure Indicators
- ✗ Red X marks indicate failed tests
- Malicious payloads not blocked
- Rate limits not enforced
- Dangerous files accepted

### Expected Behavior

#### Rate Limiting
- **Development**: More lenient limits for testing
- **Production**: Strict limits for security
- Rate limit headers should be present in responses

#### Input Sanitization
- **XSS**: Script tags removed or request blocked
- **NoSQL Injection**: MongoDB operators blocked with 400 error
- **SQL Injection**: SQL keywords detected and blocked
- **Object Pollution**: __proto__ and constructor blocked

#### File Upload
- **Dangerous Files**: Rejected with 400/415 error
- **Valid Files**: Accepted with 200/201 status
- **Content Scanning**: Embedded code detected
- **Filename Sanitization**: Special characters removed

## Test Output Example

```bash
==========================================
🔒 Rate Limiting Security Tests
==========================================

Testing: Login Endpoint (should block after 3 attempts in dev: 10)
Endpoint: POST /auth/login
Expected limit: 3 requests

Request 1: HTTP 401
Request 2: HTTP 401
Request 3: HTTP 401
Request 4: HTTP 429
✓ Rate limit triggered after 4 requests
Response code: 429 (Too Many Requests)

==========================================
📊 Test Summary
==========================================
Passed: 4
Failed: 0

✓ All rate limiting tests passed!
```

## Troubleshooting

### Server Not Running
```
✗ Server is not running

Please start the server first:
  cd backend
  npm run dev
```
**Solution**: Start the development server

### Authentication Failures
```
⚠ Could not get authentication token
```
**Solution**: 
- Ensure `/api/v1/auth/register` endpoint works
- Check database connection
- Verify user model is set up

### Rate Limits Not Triggering
**Possible Causes**:
- Running in development mode (limits are higher)
- Rate limiter middleware not applied
- Redis cache issues (if using Redis)

**Solution**:
- Check `NODE_ENV` setting
- Verify middleware in routes
- Review rate limiter configuration

### Files Not Being Blocked
**Possible Causes**:
- File upload middleware not configured
- Validation middleware not applied
- MIME type detection issues

**Solution**:
- Check file upload middleware in routes
- Verify `validateUploadedFiles` is used
- Review allowed file types configuration

## Continuous Integration

Add to your CI/CD pipeline:

```yaml
# .github/workflows/security-tests.yml
name: Security Tests

on: [push, pull_request]

jobs:
  security:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v2
      
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm install
        working-directory: ./backend
      
      - name: Start server
        run: npm run dev &
        working-directory: ./backend
      
      - name: Wait for server
        run: sleep 10
      
      - name: Run security tests
        run: ./tests/security/run-all-tests.sh
        working-directory: ./backend
```

## Manual Testing

### Test Rate Limiting Manually
```bash
# Bash loop to test login rate limiting
for i in {1..15}; do
  curl -X POST http://localhost:5000/api/v1/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"wrong"}' \
    -w "\nHTTP: %{http_code}\n"
  sleep 1
done
```

### Test NoSQL Injection Manually
```bash
# Should be blocked
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":{"$ne":null},"password":"test"}' \
  -v
```

### Test XSS Manually
```bash
# Get token first
TOKEN="your-token-here"

# Try XSS in workout name
curl -X POST http://localhost:5000/api/v1/workouts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"<script>alert(1)</script>","description":"test"}' \
  -v
```

### Test File Upload Manually
```bash
# Create malicious file
echo '<?php system($_GET["cmd"]); ?>' > malicious.php

# Try to upload (should be blocked)
curl -X POST http://localhost:5000/api/v1/form-analysis/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "video=@malicious.php" \
  -v
```

## Security Checklist

After running tests, verify:

- [ ] Rate limiting enforced on auth endpoints
- [ ] Rate limiting enforced on AI endpoints
- [ ] XSS attacks blocked or sanitized
- [ ] NoSQL injection blocked
- [ ] SQL injection blocked
- [ ] Dangerous files rejected
- [ ] Valid files accepted
- [ ] Audit logs created for security events
- [ ] Error messages don't leak sensitive info
- [ ] CORS properly configured

## Reporting Issues

If tests fail:

1. **Review the output** - Understand which test failed
2. **Check configuration** - Verify middleware is applied
3. **Review logs** - Check server logs for errors
4. **Test manually** - Reproduce the issue manually
5. **Fix and retest** - Make changes and run tests again

## Additional Resources

- [API_SECURITY.md](../../API_SECURITY.md) - Security implementation guide
- [SECURITY_CONFIG_GUIDE.md](../../SECURITY_CONFIG_GUIDE.md) - Configuration guide
- [SECURITY_QUICK_REFERENCE.md](../../SECURITY_QUICK_REFERENCE.md) - Quick reference

## Notes

- Tests are designed for development environment
- Production limits are stricter (fewer allowed requests)
- Some tests may be skipped if authentication fails
- File upload tests require authentication
- Tests clean up after themselves (no persistent data)

---

**Last Updated**: December 2024  
**Maintained By**: CoachFlow Development Team




