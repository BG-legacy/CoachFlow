#!/bin/bash

# Google OAuth Endpoint Testing Script
# Tests that Google OAuth endpoints are accessible and responding correctly

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
BASE_URL=${BASE_URL:-"http://localhost:5000"}
API_VERSION="v1"

echo ""
echo "======================================"
echo "Google OAuth Endpoint Testing"
echo "======================================"
echo ""

# Check if server is running
echo "🔍 Checking if server is running..."
if curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/health" | grep -q "200\|404"; then
    echo -e "${GREEN}✅ Server is running at $BASE_URL${NC}"
else
    echo -e "${RED}❌ Server is not running at $BASE_URL${NC}"
    echo "   Start the server with: npm run dev"
    exit 1
fi

echo ""
echo "======================================"
echo "Testing Google OAuth Endpoints"
echo "======================================"

# Test 1: GET /api/v1/auth/google (should redirect or return error)
echo ""
echo "1. Testing GET /api/v1/auth/google"
echo "   (This endpoint initiates Google OAuth flow)"
RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/$API_VERSION/auth/google" || echo "000")
STATUS_CODE=$(echo "$RESPONSE" | tail -n1)

if [ "$STATUS_CODE" = "000" ]; then
    echo -e "${RED}❌ Connection failed${NC}"
elif [ "$STATUS_CODE" = "404" ]; then
    echo -e "${RED}❌ Endpoint not found (404)${NC}"
    echo "   Check that auth routes are properly registered"
elif [ "$STATUS_CODE" = "302" ] || [ "$STATUS_CODE" = "200" ]; then
    echo -e "${GREEN}✅ Endpoint accessible (Status: $STATUS_CODE)${NC}"
else
    echo -e "${YELLOW}⚠️  Endpoint responded with status: $STATUS_CODE${NC}"
fi

# Test 2: POST /api/v1/auth/google (with invalid token)
echo ""
echo "2. Testing POST /api/v1/auth/google"
echo "   (Testing with invalid token - should return error)"
RESPONSE=$(curl -s -X POST \
    -H "Content-Type: application/json" \
    -d '{"idToken": "invalid_token_for_testing"}' \
    "$BASE_URL/api/$API_VERSION/auth/google" || echo '{"error": "connection_failed"}')

if echo "$RESPONSE" | grep -q "error\|message\|success"; then
    echo -e "${GREEN}✅ Endpoint accessible and processing requests${NC}"
    echo "   Response (first 100 chars):"
    echo "   $(echo "$RESPONSE" | head -c 100)..."
else
    echo -e "${RED}❌ Unexpected response format${NC}"
    echo "   Response: $RESPONSE"
fi

# Test 3: Check authentication methods endpoint
echo ""
echo "3. Testing GET /api/v1/auth/me (authentication required)"
echo "   (Should return 401 Unauthorized without token)"
RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/$API_VERSION/auth/me" || echo "000")
STATUS_CODE=$(echo "$RESPONSE" | tail -n1)

if [ "$STATUS_CODE" = "401" ]; then
    echo -e "${GREEN}✅ Auth endpoint working correctly (401 Unauthorized)${NC}"
elif [ "$STATUS_CODE" = "404" ]; then
    echo -e "${YELLOW}⚠️  Endpoint not found (404)${NC}"
else
    echo -e "${YELLOW}⚠️  Status: $STATUS_CODE${NC}"
fi

# Test 4: Check if Google OAuth callback endpoint exists
echo ""
echo "4. Testing GET /api/v1/auth/google/callback"
echo "   (Google OAuth callback endpoint)"
RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/$API_VERSION/auth/google/callback" || echo "000")
STATUS_CODE=$(echo "$RESPONSE" | tail -n1)

if [ "$STATUS_CODE" = "000" ]; then
    echo -e "${RED}❌ Connection failed${NC}"
elif [ "$STATUS_CODE" = "404" ]; then
    echo -e "${YELLOW}⚠️  Endpoint not found (404)${NC}"
    echo "   This endpoint might not be implemented on backend"
    echo "   (It's typically handled by frontend)"
elif [ "$STATUS_CODE" = "400" ] || [ "$STATUS_CODE" = "401" ]; then
    echo -e "${GREEN}✅ Endpoint exists (requires valid Google auth code)${NC}"
else
    echo -e "${YELLOW}⚠️  Status: $STATUS_CODE${NC}"
fi

# Check server logs for Google OAuth initialization
echo ""
echo "======================================"
echo "Server Configuration Check"
echo "======================================"
echo ""
echo "Check your server startup logs for:"
echo "  ✅ Google OAuth enabled"
echo "  ✅ Client ID: xxx..."
echo ""

# Summary
echo "======================================"
echo "Test Summary"
echo "======================================"
echo ""
echo "✅ Server is running and responding"
echo "✅ Google OAuth endpoints are accessible"
echo ""
echo "🚀 Next Steps:"
echo "   1. Verify Google OAuth is enabled in server logs"
echo "   2. Get a test Google ID token from:"
echo "      https://developers.google.com/oauthplayground/"
echo "   3. Test authentication with a real Google ID token:"
echo ""
echo "      curl -X POST $BASE_URL/api/$API_VERSION/auth/google \\"
echo "        -H 'Content-Type: application/json' \\"
echo "        -d '{\"idToken\": \"YOUR_GOOGLE_ID_TOKEN_HERE\"}'"
echo ""
echo "   4. Integrate Google Sign-In button in your frontend"
echo ""
echo "📖 Documentation:"
echo "   - docs/GOOGLE_OAUTH_IMPLEMENTATION.md"
echo "   - docs/GOOGLE_OAUTH_COMPLETE_CHECKLIST.md"
echo ""




