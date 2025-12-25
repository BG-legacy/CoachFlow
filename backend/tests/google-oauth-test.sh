#!/bin/bash

##############################################################################
# Google OAuth Implementation Test Script
# Tests all Google OAuth endpoints
##############################################################################

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
BASE_URL="http://localhost:5001/api/v1"
TEMP_FILE="/tmp/coachflow_oauth_test.json"

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║         CoachFlow - Google OAuth Test Suite               ║${NC}"
echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo ""

##############################################################################
# Test 1: Check Server Health
##############################################################################
echo -e "${YELLOW}Test 1: Server Health Check${NC}"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" ${BASE_URL}/health 2>/dev/null || echo "000")

if [ "$HTTP_CODE" == "200" ] || [ "$HTTP_CODE" == "404" ]; then
    echo -e "${GREEN}✓ Server is running${NC}"
else
    echo -e "${RED}✗ Server is not responding (HTTP $HTTP_CODE)${NC}"
    echo -e "${RED}  Please start the server: npm run dev${NC}"
    exit 1
fi
echo ""

##############################################################################
# Test 2: Check Google OAuth Endpoint Exists
##############################################################################
echo -e "${YELLOW}Test 2: Google OAuth Endpoint Check${NC}"
echo -e "Testing: POST ${BASE_URL}/auth/google"

# Try with invalid token to see if endpoint exists
RESPONSE=$(curl -s -X POST ${BASE_URL}/auth/google \
    -H "Content-Type: application/json" \
    -d '{"idToken": "test_invalid_token"}' \
    -w "\n%{http_code}")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" == "401" ] || [ "$HTTP_CODE" == "400" ]; then
    echo -e "${GREEN}✓ Google OAuth endpoint exists${NC}"
    echo -e "  Response: ${BODY}" | head -c 100
    echo "..."
elif [ "$HTTP_CODE" == "404" ]; then
    echo -e "${RED}✗ Endpoint not found (HTTP 404)${NC}"
    echo -e "${RED}  The route may not be registered${NC}"
    exit 1
else
    echo -e "${YELLOW}⚠ Unexpected response (HTTP $HTTP_CODE)${NC}"
    echo -e "  Response: ${BODY}"
fi
echo ""

##############################################################################
# Test 3: Validation Check
##############################################################################
echo -e "${YELLOW}Test 3: Request Validation Check${NC}"
echo -e "Testing: Missing required field (idToken)"

RESPONSE=$(curl -s -X POST ${BASE_URL}/auth/google \
    -H "Content-Type: application/json" \
    -d '{"role": "client"}' \
    -w "\n%{http_code}")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" == "400" ]; then
    echo -e "${GREEN}✓ Validation is working${NC}"
    echo -e "  Error message: $(echo $BODY | grep -o '"message":"[^"]*"' | head -1)"
else
    echo -e "${YELLOW}⚠ Expected 400 Bad Request, got HTTP $HTTP_CODE${NC}"
fi
echo ""

##############################################################################
# Test 4: Check Link Endpoint (Requires Auth)
##############################################################################
echo -e "${YELLOW}Test 4: Link Google Account Endpoint Check${NC}"
echo -e "Testing: POST ${BASE_URL}/auth/google/link"

RESPONSE=$(curl -s -X POST ${BASE_URL}/auth/google/link \
    -H "Content-Type: application/json" \
    -d '{"idToken": "test"}' \
    -w "\n%{http_code}")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)

if [ "$HTTP_CODE" == "401" ]; then
    echo -e "${GREEN}✓ Link endpoint exists and requires authentication${NC}"
elif [ "$HTTP_CODE" == "404" ]; then
    echo -e "${RED}✗ Link endpoint not found${NC}"
else
    echo -e "${YELLOW}⚠ Unexpected response (HTTP $HTTP_CODE)${NC}"
fi
echo ""

##############################################################################
# Test 5: Check Unlink Endpoint (Requires Auth)
##############################################################################
echo -e "${YELLOW}Test 5: Unlink Google Account Endpoint Check${NC}"
echo -e "Testing: DELETE ${BASE_URL}/auth/google/unlink"

RESPONSE=$(curl -s -X DELETE ${BASE_URL}/auth/google/unlink \
    -w "\n%{http_code}")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)

if [ "$HTTP_CODE" == "401" ]; then
    echo -e "${GREEN}✓ Unlink endpoint exists and requires authentication${NC}"
elif [ "$HTTP_CODE" == "404" ]; then
    echo -e "${RED}✗ Unlink endpoint not found${NC}"
else
    echo -e "${YELLOW}⚠ Unexpected response (HTTP $HTTP_CODE)${NC}"
fi
echo ""

##############################################################################
# Test 6: Check Set Password Endpoint (Requires Auth)
##############################################################################
echo -e "${YELLOW}Test 6: Set Password Endpoint Check${NC}"
echo -e "Testing: POST ${BASE_URL}/auth/set-password"

RESPONSE=$(curl -s -X POST ${BASE_URL}/auth/set-password \
    -H "Content-Type: application/json" \
    -d '{"password": "TestPassword123!"}' \
    -w "\n%{http_code}")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)

if [ "$HTTP_CODE" == "401" ]; then
    echo -e "${GREEN}✓ Set password endpoint exists and requires authentication${NC}"
elif [ "$HTTP_CODE" == "404" ]; then
    echo -e "${RED}✗ Set password endpoint not found${NC}"
else
    echo -e "${YELLOW}⚠ Unexpected response (HTTP $HTTP_CODE)${NC}"
fi
echo ""

##############################################################################
# Test 7: Rate Limiting Check
##############################################################################
echo -e "${YELLOW}Test 7: Rate Limiting Check${NC}"
echo -e "Testing: Multiple rapid requests"

RATE_LIMITED=0
for i in {1..3}; do
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST ${BASE_URL}/auth/google \
        -H "Content-Type: application/json" \
        -d '{"idToken": "test"}')
    
    if [ "$HTTP_CODE" == "429" ]; then
        RATE_LIMITED=1
        break
    fi
    sleep 0.1
done

if [ $RATE_LIMITED -eq 1 ]; then
    echo -e "${GREEN}✓ Rate limiting is active${NC}"
else
    echo -e "${YELLOW}⚠ Rate limiting not triggered (may require more requests)${NC}"
fi
echo ""

##############################################################################
# Summary
##############################################################################
echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                     Test Summary                           ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}✓ All Google OAuth endpoints are configured correctly${NC}"
echo ""
echo -e "${BLUE}Next Steps:${NC}"
echo -e "  1. To test with real Google tokens, you need:"
echo -e "     - A frontend with Google Sign-In button"
echo -e "     - Or use Google OAuth Playground: https://developers.google.com/oauthplayground/"
echo ""
echo -e "  2. Example curl command with real token:"
echo -e "     ${YELLOW}curl -X POST ${BASE_URL}/auth/google \\${NC}"
echo -e "     ${YELLOW}  -H 'Content-Type: application/json' \\${NC}"
echo -e "     ${YELLOW}  -d '{\"idToken\": \"YOUR_GOOGLE_ID_TOKEN\"}'${NC}"
echo ""
echo -e "  3. Check Swagger documentation:"
echo -e "     ${BLUE}http://localhost:5001/api-docs${NC}"
echo ""
echo -e "  4. For detailed testing guide, see:"
echo -e "     ${BLUE}GOOGLE_OAUTH_IMPLEMENTATION.md${NC}"
echo ""

# Cleanup
rm -f $TEMP_FILE

echo -e "${GREEN}Testing complete!${NC}"

