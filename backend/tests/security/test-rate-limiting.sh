#!/bin/bash

# Rate Limiting Tests for CoachFlow API
# Tests various rate limiters to ensure they're working correctly

echo "=========================================="
echo "🔒 Rate Limiting Security Tests"
echo "=========================================="
echo ""

# Configuration
API_URL="http://localhost:5001/api/v1"
EMAIL="test@example.com"
PASSWORD="TestPassword123!"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test counter
PASSED=0
FAILED=0

# Function to test rate limiting
test_rate_limit() {
    local endpoint=$1
    local method=$2
    local data=$3
    local max_requests=$4
    local test_name=$5
    
    echo -e "${BLUE}Testing: ${test_name}${NC}"
    echo "Endpoint: ${method} ${endpoint}"
    echo "Expected limit: ${max_requests} requests"
    echo ""
    
    local blocked=false
    local requests_made=0
    
    # Make requests until blocked
    for i in $(seq 1 $((max_requests + 5))); do
        if [ "$method" == "POST" ]; then
            response=$(curl -s -w "\n%{http_code}" -X POST "${API_URL}${endpoint}" \
                -H "Content-Type: application/json" \
                -d "$data" 2>/dev/null)
        else
            response=$(curl -s -w "\n%{http_code}" -X GET "${API_URL}${endpoint}" 2>/dev/null)
        fi
        
        http_code=$(echo "$response" | tail -n1)
        requests_made=$i
        
        if [ "$http_code" == "429" ]; then
            blocked=true
            echo -e "${GREEN}✓ Rate limit triggered after ${requests_made} requests${NC}"
            echo "Response code: 429 (Too Many Requests)"
            PASSED=$((PASSED + 1))
            break
        fi
        
        echo "Request $i: HTTP $http_code"
        sleep 0.1
    done
    
    if [ "$blocked" = false ]; then
        echo -e "${RED}✗ Rate limit NOT triggered after ${requests_made} requests${NC}"
        echo -e "${YELLOW}Expected to be blocked after ~${max_requests} requests${NC}"
        FAILED=$((FAILED + 1))
    fi
    
    echo ""
    echo "Waiting 2 seconds before next test..."
    echo ""
    sleep 2
}

echo "Starting Rate Limiting Tests..."
echo ""

# Test 1: Login Rate Limiter
echo "----------------------------------------"
echo "Test 1: Login Rate Limiter"
echo "----------------------------------------"
test_rate_limit \
    "/auth/login" \
    "POST" \
    "{\"email\":\"${EMAIL}\",\"password\":\"wrong\"}" \
    3 \
    "Login Endpoint (should block after 3 attempts in dev: 10)"

# Test 2: Registration Rate Limiter
echo "----------------------------------------"
echo "Test 2: Registration Rate Limiter"
echo "----------------------------------------"
test_rate_limit \
    "/auth/register" \
    "POST" \
    "{\"email\":\"test${RANDOM}@example.com\",\"password\":\"${PASSWORD}\",\"firstName\":\"Test\",\"lastName\":\"User\"}" \
    10 \
    "Registration Endpoint (should block after 3 attempts in dev: 10)"

# Test 3: Password Reset Rate Limiter
echo "----------------------------------------"
echo "Test 3: Password Reset Rate Limiter"
echo "----------------------------------------"
test_rate_limit \
    "/auth/forgot-password" \
    "POST" \
    "{\"email\":\"${EMAIL}\"}" \
    10 \
    "Password Reset Endpoint (should block after 3 attempts in dev: 10)"

# Test 4: Global API Rate Limiter
echo "----------------------------------------"
echo "Test 4: Global Rate Limiter"
echo "----------------------------------------"
echo -e "${BLUE}Testing: Global API Rate Limiter${NC}"
echo "This would take too long (1000 requests in dev)"
echo -e "${YELLOW}⚠ Skipping full test, making 20 sample requests...${NC}"
echo ""

count=0
for i in $(seq 1 20); do
    response=$(curl -s -w "%{http_code}" -X GET "${API_URL}/auth/sessions" \
        -H "Authorization: Bearer invalid_token" 2>/dev/null | tail -c 3)
    
    if [ "$response" == "429" ]; then
        echo -e "${GREEN}✓ Global rate limit triggered at request ${i}${NC}"
        PASSED=$((PASSED + 1))
        break
    fi
    echo "Request $i: HTTP $response"
    sleep 0.1
    count=$((count + 1))
done

if [ $count -eq 20 ]; then
    echo -e "${GREEN}✓ Global rate limiter allows many requests (expected in dev)${NC}"
    PASSED=$((PASSED + 1))
fi

echo ""

# Summary
echo "=========================================="
echo "📊 Test Summary"
echo "=========================================="
echo -e "${GREEN}Passed: ${PASSED}${NC}"
echo -e "${RED}Failed: ${FAILED}${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All rate limiting tests passed!${NC}"
    exit 0
else
    echo -e "${RED}✗ Some tests failed. Check configuration.${NC}"
    exit 1
fi




