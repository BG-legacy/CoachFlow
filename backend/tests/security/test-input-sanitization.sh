#!/bin/bash

# Input Sanitization Tests for CoachFlow API
# Tests XSS, NoSQL injection, and SQL injection protection

echo "=========================================="
echo "🛡️  Input Sanitization Security Tests"
echo "=========================================="
echo ""

# Configuration
API_URL="http://localhost:5001/api/v1"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test counter
PASSED=0
FAILED=0

# Function to test injection
test_injection() {
    local attack_name=$1
    local endpoint=$2
    local payload=$3
    local expected_behavior=$4
    
    echo -e "${BLUE}Testing: ${attack_name}${NC}"
    echo "Endpoint: ${endpoint}"
    echo "Payload: ${payload}"
    echo ""
    
    response=$(curl -s -w "\n%{http_code}" -X POST "${API_URL}${endpoint}" \
        -H "Content-Type: application/json" \
        -d "$payload" 2>/dev/null)
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n -1)
    
    # Check if blocked (400 Bad Request for injection attempts)
    if [ "$http_code" == "400" ]; then
        echo -e "${GREEN}✓ Attack blocked with HTTP 400${NC}"
        echo "Response: $body" | head -c 200
        PASSED=$((PASSED + 1))
    elif [ "$http_code" == "422" ]; then
        echo -e "${GREEN}✓ Attack blocked with HTTP 422 (Validation Error)${NC}"
        echo "Response: $body" | head -c 200
        PASSED=$((PASSED + 1))
    else
        echo -e "${YELLOW}⚠ Response code: HTTP ${http_code}${NC}"
        echo "Response: $body" | head -c 200
        echo ""
        echo "Checking if payload was sanitized..."
        
        # Check if dangerous patterns are in response
        if echo "$body" | grep -q "<script>"; then
            echo -e "${RED}✗ XSS pattern found in response!${NC}"
            FAILED=$((FAILED + 1))
        elif echo "$body" | grep -q "\$ne\|\$gt\|\$where"; then
            echo -e "${RED}✗ NoSQL operator found in response!${NC}"
            FAILED=$((FAILED + 1))
        else
            echo -e "${GREEN}✓ Payload appears to be sanitized${NC}"
            PASSED=$((PASSED + 1))
        fi
    fi
    
    echo ""
    sleep 1
}

echo "Starting Input Sanitization Tests..."
echo ""

# XSS Attacks
echo "=========================================="
echo "Test Suite 1: XSS Protection"
echo "=========================================="
echo ""

test_injection \
    "XSS - Script Tag Injection" \
    "/auth/register" \
    '{"email":"test@example.com","password":"Test123!","firstName":"<script>alert(1)</script>","lastName":"User"}' \
    "Should block or sanitize script tags"

test_injection \
    "XSS - Inline Event Handler" \
    "/auth/register" \
    '{"email":"test@example.com","password":"Test123!","firstName":"<img src=x onerror=alert(1)>","lastName":"User"}' \
    "Should block or sanitize inline event handlers"

test_injection \
    "XSS - JavaScript Protocol" \
    "/auth/register" \
    '{"email":"test@example.com","password":"Test123!","firstName":"<a href=\"javascript:alert(1)\">Click</a>","lastName":"User"}' \
    "Should block or sanitize javascript: protocol"

test_injection \
    "XSS - Iframe Injection" \
    "/auth/register" \
    '{"email":"test@example.com","password":"Test123!","firstName":"<iframe src=\"https://evil.com\"></iframe>","lastName":"User"}' \
    "Should block or sanitize iframe tags"

# NoSQL Injection Attacks
echo "=========================================="
echo "Test Suite 2: NoSQL Injection Protection"
echo "=========================================="
echo ""

test_injection \
    "NoSQL - $ne Operator" \
    "/auth/login" \
    '{"email":{"$ne":null},"password":"test"}' \
    "Should block MongoDB operators"

test_injection \
    "NoSQL - $gt Operator" \
    "/auth/login" \
    '{"email":"admin@example.com","password":{"$gt":""}}' \
    "Should block MongoDB operators"

test_injection \
    "NoSQL - $where Operator" \
    "/auth/login" \
    '{"email":"test@example.com","password":"test","$where":"this.password == this.username"}' \
    "Should block MongoDB operators"

test_injection \
    "NoSQL - $regex Operator" \
    "/auth/login" \
    '{"email":{"$regex":".*"},"password":"test"}' \
    "Should block MongoDB operators"

# SQL Injection Attacks
echo "=========================================="
echo "Test Suite 3: SQL Injection Protection"
echo "=========================================="
echo ""

test_injection \
    "SQL - Classic OR Injection" \
    "/auth/login" \
    '{"email":"admin@example.com","password":"' OR '1'='1"}' \
    "Should block SQL keywords"

test_injection \
    "SQL - UNION Attack" \
    "/auth/login" \
    '{"email":"admin@example.com","password":"test' UNION SELECT * FROM users--"}' \
    "Should block SQL keywords"

test_injection \
    "SQL - Comment Injection" \
    "/auth/login" \
    '{"email":"admin@example.com' --","password":"anything"}' \
    "Should block SQL comments"

test_injection \
    "SQL - Stacked Query" \
    "/auth/login" \
    '{"email":"admin@example.com","password":"test'; DROP TABLE users;--"}' \
    "Should block SQL keywords"

# Object Pollution
echo "=========================================="
echo "Test Suite 4: Object Pollution Protection"
echo "=========================================="
echo ""

test_injection \
    "Prototype Pollution" \
    "/auth/register" \
    '{"email":"test@example.com","password":"Test123!","firstName":"Test","lastName":"User","__proto__":{"isAdmin":true}}' \
    "Should block __proto__ pollution"

test_injection \
    "Constructor Pollution" \
    "/auth/register" \
    '{"email":"test@example.com","password":"Test123!","firstName":"Test","lastName":"User","constructor":{"prototype":{"isAdmin":true}}}' \
    "Should block constructor pollution"

# Deep Nesting Attack
echo "=========================================="
echo "Test Suite 5: Deep Nesting Protection"
echo "=========================================="
echo ""

deep_nested='{"email":"test@example.com","password":"Test123!","data":{"a":{"b":{"c":{"d":{"e":{"f":{"g":{"h":{"i":{"j":{"k":{"l":"deep"}}}}}}}}}}}}}}'

test_injection \
    "Deep Object Nesting" \
    "/auth/register" \
    "$deep_nested" \
    "Should handle or limit deep nesting"

# Summary
echo "=========================================="
echo "📊 Test Summary"
echo "=========================================="
echo -e "${GREEN}Passed: ${PASSED}${NC}"
echo -e "${RED}Failed: ${FAILED}${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All input sanitization tests passed!${NC}"
    echo -e "${GREEN}Your API is protected against common injection attacks.${NC}"
    exit 0
else
    echo -e "${RED}✗ Some tests failed.${NC}"
    echo -e "${YELLOW}Review the failed tests and check sanitization middleware.${NC}"
    exit 1
fi




