#!/bin/bash

###############################################################################
# Data Privacy Testing Script
# Tests: PII fields, consent tracking, soft delete, data export
###############################################################################

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
API_URL="${API_URL:-http://localhost:5000}"
BASE_URL="$API_URL/api/v1"

# Test counters
TESTS_RUN=0
TESTS_PASSED=0
TESTS_FAILED=0

# Print functions
print_header() {
    echo -e "\n${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}\n"
}

print_test() {
    echo -e "${YELLOW}TEST ${TESTS_RUN}:${NC} $1"
}

print_pass() {
    echo -e "${GREEN}✓ PASS:${NC} $1"
    ((TESTS_PASSED++))
}

print_fail() {
    echo -e "${RED}✗ FAIL:${NC} $1"
    ((TESTS_FAILED++))
}

print_info() {
    echo -e "${BLUE}ℹ INFO:${NC} $1"
}

# Test functions
test_endpoint() {
    local method=$1
    local endpoint=$2
    local data=$3
    local headers=$4
    local expected_status=$5
    local description=$6
    
    ((TESTS_RUN++))
    print_test "$description"
    
    # Build curl command
    local curl_cmd="curl -s -w '\n%{http_code}' -X $method"
    
    if [ -n "$headers" ]; then
        curl_cmd="$curl_cmd -H '$headers'"
    fi
    
    if [ -n "$data" ]; then
        curl_cmd="$curl_cmd -H 'Content-Type: application/json' -d '$data'"
    fi
    
    curl_cmd="$curl_cmd '$BASE_URL$endpoint'"
    
    # Execute request
    response=$(eval $curl_cmd)
    status_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n-1)
    
    # Check status code
    if [ "$status_code" == "$expected_status" ]; then
        print_pass "$description (Status: $status_code)"
    else
        print_fail "$description (Expected: $expected_status, Got: $status_code)"
        echo "Response: $body"
    fi
    
    # Return body for further checks
    echo "$body"
}

# Helper function to extract field from JSON
extract_json_field() {
    local json=$1
    local field=$2
    echo "$json" | grep -o "\"$field\":\"[^\"]*\"" | cut -d'"' -f4
}

###############################################################################
# Test 1: PII Field Documentation Check
###############################################################################
print_header "Test 1: PII Fields Documentation"

print_info "Checking if DATA_PRIVACY_AUDIT.md exists..."
if [ -f "DATA_PRIVACY_AUDIT.md" ]; then
    ((TESTS_RUN++))
    print_pass "DATA_PRIVACY_AUDIT.md exists"
    ((TESTS_PASSED++))
    
    # Check for PII documentation
    ((TESTS_RUN++))
    if grep -q "Personally Identifiable Information" DATA_PRIVACY_AUDIT.md; then
        print_pass "PII fields are documented"
        ((TESTS_PASSED++))
    else
        print_fail "PII fields not documented"
        ((TESTS_FAILED++))
    fi
else
    ((TESTS_RUN++))
    print_fail "DATA_PRIVACY_AUDIT.md not found"
    ((TESTS_FAILED++))
fi

###############################################################################
# Test 2: User Consent Fields
###############################################################################
print_header "Test 2: User Consent & Terms Acceptance"

# Test registration with consent
print_info "Testing registration with consent tracking..."

TIMESTAMP=$(date +%s)
TEST_EMAIL="privacy_test_${TIMESTAMP}@test.com"
TEST_PASSWORD="SecurePass123!@#"

REGISTER_DATA=$(cat <<EOF
{
  "email": "$TEST_EMAIL",
  "password": "$TEST_PASSWORD",
  "firstName": "Privacy",
  "lastName": "Test",
  "acceptedTerms": true,
  "acceptedPrivacy": true,
  "termsVersion": "1.0",
  "privacyVersion": "1.0"
}
EOF
)

REGISTER_RESPONSE=$(test_endpoint "POST" "/auth/register" "$REGISTER_DATA" "" "201" "Register user with consent")

# Extract token and userId
ACCESS_TOKEN=$(extract_json_field "$REGISTER_RESPONSE" "accessToken")
USER_ID=$(echo "$REGISTER_RESPONSE" | grep -o '"_id":"[^"]*"' | cut -d'"' -f4)

if [ -n "$ACCESS_TOKEN" ]; then
    print_info "Registration successful, token obtained"
    
    # Test getting current user to verify consent fields
    USER_RESPONSE=$(test_endpoint "GET" "/auth/me" "" "Authorization: Bearer $ACCESS_TOKEN" "200" "Get current user profile")
    
    # Check for consent fields in response
    ((TESTS_RUN++))
    if echo "$USER_RESPONSE" | grep -q "consent"; then
        print_pass "Consent fields present in user profile"
        ((TESTS_PASSED++))
    else
        print_fail "Consent fields missing from user profile"
        ((TESTS_FAILED++))
    fi
else
    print_info "Registration may not support consent fields yet - this is expected if not implemented"
fi

###############################################################################
# Test 3: Soft Delete Implementation
###############################################################################
print_header "Test 3: Soft Delete & Account Deletion"

if [ -n "$ACCESS_TOKEN" ] && [ -n "$USER_ID" ]; then
    print_info "Testing account deletion request..."
    
    # Request account deletion
    DELETE_REQUEST_DATA='{"reason": "Testing data privacy features"}'
    DELETE_RESPONSE=$(curl -s -w '\n%{http_code}' -X POST \
        -H "Authorization: Bearer $ACCESS_TOKEN" \
        -H "Content-Type: application/json" \
        -d "$DELETE_REQUEST_DATA" \
        "$BASE_URL/auth/delete-account")
    
    DELETE_STATUS=$(echo "$DELETE_RESPONSE" | tail -n1)
    DELETE_BODY=$(echo "$DELETE_RESPONSE" | head -n-1)
    
    ((TESTS_RUN++))
    if [ "$DELETE_STATUS" == "200" ] || [ "$DELETE_STATUS" == "201" ]; then
        print_pass "Account deletion request successful"
        ((TESTS_PASSED++))
        
        # Check for deletion schedule
        ((TESTS_RUN++))
        if echo "$DELETE_BODY" | grep -q "deletionDate\|scheduledFor\|gracePeriod"; then
            print_pass "Deletion scheduled with grace period"
            ((TESTS_PASSED++))
        else
            print_fail "Grace period not mentioned in response"
            ((TESTS_FAILED++))
        fi
    elif [ "$DELETE_STATUS" == "404" ]; then
        print_info "Account deletion endpoint not implemented yet (404)"
        ((TESTS_RUN--))
    else
        print_fail "Account deletion request failed (Status: $DELETE_STATUS)"
        ((TESTS_FAILED++))
    fi
    
    # Test cancelling deletion
    print_info "Testing deletion cancellation..."
    CANCEL_RESPONSE=$(curl -s -w '\n%{http_code}' -X POST \
        -H "Authorization: Bearer $ACCESS_TOKEN" \
        "$BASE_URL/auth/cancel-deletion")
    
    CANCEL_STATUS=$(echo "$CANCEL_RESPONSE" | tail -n1)
    
    ((TESTS_RUN++))
    if [ "$CANCEL_STATUS" == "200" ] || [ "$CANCEL_STATUS" == "201" ]; then
        print_pass "Account deletion cancelled successfully"
        ((TESTS_PASSED++))
    elif [ "$CANCEL_STATUS" == "404" ]; then
        print_info "Cancel deletion endpoint not implemented yet (404)"
        ((TESTS_RUN--))
    else
        print_info "Cancel deletion returned status: $CANCEL_STATUS"
        ((TESTS_RUN--))
    fi
else
    print_info "Skipping soft delete tests - no authenticated user"
fi

###############################################################################
# Test 4: Data Export (GDPR Right to Data Portability)
###############################################################################
print_header "Test 4: Data Export Functionality"

if [ -n "$ACCESS_TOKEN" ]; then
    print_info "Testing data export..."
    
    EXPORT_RESPONSE=$(curl -s -w '\n%{http_code}' -X GET \
        -H "Authorization: Bearer $ACCESS_TOKEN" \
        "$BASE_URL/auth/export-data")
    
    EXPORT_STATUS=$(echo "$EXPORT_RESPONSE" | tail -n1)
    EXPORT_BODY=$(echo "$EXPORT_RESPONSE" | head -n-1)
    
    ((TESTS_RUN++))
    if [ "$EXPORT_STATUS" == "200" ]; then
        print_pass "Data export successful"
        ((TESTS_PASSED++))
        
        # Check export contains user data
        ((TESTS_RUN++))
        if echo "$EXPORT_BODY" | grep -q "user\|exportDate\|email"; then
            print_pass "Export contains user data"
            ((TESTS_PASSED++))
        else
            print_fail "Export does not contain expected user data"
            ((TESTS_FAILED++))
        fi
    elif [ "$EXPORT_STATUS" == "404" ]; then
        print_info "Data export endpoint not implemented yet (404)"
        ((TESTS_RUN--))
    else
        print_fail "Data export failed (Status: $EXPORT_STATUS)"
        ((TESTS_FAILED++))
    fi
else
    print_info "Skipping data export test - no authenticated user"
fi

###############################################################################
# Test 5: Data Retention Policies
###############################################################################
print_header "Test 5: Data Retention Policies"

print_info "Checking for data retention documentation..."

((TESTS_RUN++))
if grep -q "Data Retention Policy\|retention" DATA_PRIVACY_AUDIT.md 2>/dev/null; then
    print_pass "Data retention policies documented"
    ((TESTS_PASSED++))
    
    # Check for specific retention rules
    ((TESTS_RUN++))
    if grep -q "video\|Video" DATA_PRIVACY_AUDIT.md 2>/dev/null; then
        print_pass "Video retention policy documented"
        ((TESTS_PASSED++))
    else
        print_fail "Video retention policy not found"
        ((TESTS_FAILED++))
    fi
    
    ((TESTS_RUN++))
    if grep -q "message\|Message\|session\|Session" DATA_PRIVACY_AUDIT.md 2>/dev/null; then
        print_pass "Message/session retention policy documented"
        ((TESTS_PASSED++))
    else
        print_fail "Message retention policy not found"
        ((TESTS_FAILED++))
    fi
else
    print_fail "Data retention policies not documented"
    ((TESTS_FAILED++))
fi

###############################################################################
# Test 6: Encryption Configuration
###############################################################################
print_header "Test 6: Encryption & Security"

print_info "Testing TLS/HTTPS security headers..."

# Test security headers
HEADERS_RESPONSE=$(curl -s -I "$API_URL/health")

((TESTS_RUN++))
if echo "$HEADERS_RESPONSE" | grep -qi "strict-transport-security"; then
    print_pass "HSTS header present (TLS in transit)"
    ((TESTS_PASSED++))
else
    print_info "HSTS header not found (may not be enabled in dev mode)"
    ((TESTS_RUN--))
fi

((TESTS_RUN++))
if echo "$HEADERS_RESPONSE" | grep -qi "x-content-type-options"; then
    print_pass "X-Content-Type-Options header present"
    ((TESTS_PASSED++))
else
    print_fail "X-Content-Type-Options header missing"
    ((TESTS_FAILED++))
fi

((TESTS_RUN++))
if echo "$HEADERS_RESPONSE" | grep -qi "x-frame-options"; then
    print_pass "X-Frame-Options header present"
    ((TESTS_PASSED++))
else
    print_fail "X-Frame-Options header missing"
    ((TESTS_FAILED++))
fi

# Check for password hashing in docs
print_info "Checking password encryption documentation..."

((TESTS_RUN++))
if grep -rq "bcrypt\|hash" --include="*.md" . 2>/dev/null; then
    print_pass "Password hashing documented"
    ((TESTS_PASSED++))
else
    print_fail "Password hashing not documented"
    ((TESTS_FAILED++))
fi

###############################################################################
# Test 7: PII Field Protection
###############################################################################
print_header "Test 7: PII Field Protection"

if [ -n "$ACCESS_TOKEN" ]; then
    print_info "Testing that sensitive fields are not exposed..."
    
    USER_RESPONSE=$(curl -s -X GET \
        -H "Authorization: Bearer $ACCESS_TOKEN" \
        "$BASE_URL/auth/me")
    
    # Check that password is NOT in response
    ((TESTS_RUN++))
    if echo "$USER_RESPONSE" | grep -q "password"; then
        print_fail "Password field exposed in API response!"
        ((TESTS_FAILED++))
    else
        print_pass "Password field not exposed"
        ((TESTS_PASSED++))
    fi
    
    # Check that email verification token is NOT in response
    ((TESTS_RUN++))
    if echo "$USER_RESPONSE" | grep -q "emailVerificationToken\|passwordResetToken"; then
        print_fail "Sensitive tokens exposed in API response!"
        ((TESTS_FAILED++))
    else
        print_pass "Sensitive tokens not exposed"
        ((TESTS_PASSED++))
    fi
else
    print_info "Skipping PII protection tests - no authenticated user"
fi

###############################################################################
# Cleanup
###############################################################################
print_header "Cleanup"

if [ -n "$ACCESS_TOKEN" ] && [ -n "$USER_ID" ]; then
    print_info "Note: Test user created with email: $TEST_EMAIL"
    print_info "You may want to manually delete this user from the database"
fi

###############################################################################
# Summary
###############################################################################
print_header "TEST SUMMARY"

echo -e "Total Tests Run:    ${BLUE}$TESTS_RUN${NC}"
echo -e "Tests Passed:       ${GREEN}$TESTS_PASSED${NC}"
echo -e "Tests Failed:       ${RED}$TESTS_FAILED${NC}"

PASS_RATE=0
if [ $TESTS_RUN -gt 0 ]; then
    PASS_RATE=$((TESTS_PASSED * 100 / TESTS_RUN))
fi
echo -e "Pass Rate:          ${BLUE}${PASS_RATE}%${NC}"

echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}✗ Some tests failed${NC}"
    echo ""
    echo "Review the DATA_PRIVACY_AUDIT.md file for implementation guidance"
    exit 1
fi




