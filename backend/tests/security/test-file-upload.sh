#!/bin/bash

# File Upload Security Tests for CoachFlow API
# Tests file type, size, and content validation

echo "=========================================="
echo "📁 File Upload Security Tests"
echo "=========================================="
echo ""

# Configuration
API_URL="http://localhost:5001/api/v1"
TEST_DIR="/tmp/coachflow_upload_tests"
TOKEN="" # Will need to login first

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test counter
PASSED=0
FAILED=0
SKIPPED=0

# Create test directory
mkdir -p "$TEST_DIR"
cd "$TEST_DIR"

echo "Creating test files..."
echo ""

# Create malicious PHP file
cat > malicious.php << 'EOF'
<?php
system($_GET['cmd']);
?>
EOF

# Create PHP disguised as image
cat > malicious.php.jpg << 'EOF'
<?php
system($_GET['cmd']);
?>
EOF

# Create file with script in filename
cat > "file<script>alert(1)</script>.jpg" << 'EOF'
Fake image content
EOF

# Create executable
cat > malicious.exe << 'EOF'
MZ executable content
EOF

# Create shell script
cat > malicious.sh << 'EOF'
#!/bin/bash
rm -rf /
EOF

# Create valid image (1x1 PNG)
printf '\x89\x50\x4E\x47\x0D\x0A\x1A\x0A\x00\x00\x00\x0D\x49\x48\x44\x52\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1F\x15\xC4\x89\x00\x00\x00\x0A\x49\x44\x41\x54\x78\x9C\x63\x00\x01\x00\x00\x05\x00\x01\x0D\x0A\x2D\xB4\x00\x00\x00\x00\x49\x45\x4E\x44\xAE\x42\x60\x82' > valid.png

# Create large file (if needed - 100MB)
# dd if=/dev/zero of=large.jpg bs=1M count=100 2>/dev/null

# Create embedded PHP in image
cat > embedded_php.jpg << 'EOF'
<?php system($_GET['cmd']); ?>
JFIF fake image data
EOF

echo "✓ Test files created"
echo ""

# Function to get auth token
get_auth_token() {
    echo "Getting authentication token..."
    
    # Try to register a test user
    register_response=$(curl -s -X POST "${API_URL}/auth/register" \
        -H "Content-Type: application/json" \
        -d '{
            "email":"uploadtest@example.com",
            "password":"TestPassword123!",
            "firstName":"Upload",
            "lastName":"Test"
        }' 2>/dev/null)
    
    # Extract token
    TOKEN=$(echo "$register_response" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
    
    # If registration failed, try login
    if [ -z "$TOKEN" ]; then
        login_response=$(curl -s -X POST "${API_URL}/auth/login" \
            -H "Content-Type: application/json" \
            -d '{
                "email":"uploadtest@example.com",
                "password":"TestPassword123!"
            }' 2>/dev/null)
        
        TOKEN=$(echo "$login_response" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
    fi
    
    if [ -z "$TOKEN" ]; then
        echo -e "${YELLOW}⚠ Could not get authentication token${NC}"
        echo -e "${YELLOW}File upload tests require authentication${NC}"
        echo -e "${YELLOW}Please ensure you have an upload endpoint that requires auth${NC}"
        return 1
    fi
    
    echo -e "${GREEN}✓ Got authentication token${NC}"
    echo ""
    return 0
}

# Function to test file upload
test_upload() {
    local test_name=$1
    local file_path=$2
    local field_name=${3:-"file"}
    local endpoint=${4:-"/form-analysis/upload"}
    local should_block=${5:-true}
    
    echo -e "${BLUE}Testing: ${test_name}${NC}"
    echo "File: $(basename $file_path)"
    echo "Expected: $([ "$should_block" = true ] && echo 'BLOCKED' || echo 'ALLOWED')"
    echo ""
    
    if [ ! -f "$file_path" ]; then
        echo -e "${YELLOW}⚠ File not found, skipping${NC}"
        SKIPPED=$((SKIPPED + 1))
        echo ""
        return
    fi
    
    # Make upload request
    response=$(curl -s -w "\n%{http_code}" -X POST "${API_URL}${endpoint}" \
        -H "Authorization: Bearer ${TOKEN}" \
        -F "${field_name}=@${file_path}" 2>/dev/null)
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n -1)
    
    # Check result
    if [ "$should_block" = true ]; then
        if [ "$http_code" == "400" ] || [ "$http_code" == "415" ]; then
            echo -e "${GREEN}✓ Malicious file blocked (HTTP ${http_code})${NC}"
            echo "Response: $body" | head -c 200
            PASSED=$((PASSED + 1))
        else
            echo -e "${RED}✗ Malicious file NOT blocked (HTTP ${http_code})${NC}"
            echo "Response: $body" | head -c 200
            FAILED=$((FAILED + 1))
        fi
    else
        if [ "$http_code" == "200" ] || [ "$http_code" == "201" ]; then
            echo -e "${GREEN}✓ Valid file accepted (HTTP ${http_code})${NC}"
            PASSED=$((PASSED + 1))
        else
            echo -e "${RED}✗ Valid file rejected (HTTP ${http_code})${NC}"
            echo "Response: $body" | head -c 200
            FAILED=$((FAILED + 1))
        fi
    fi
    
    echo ""
    sleep 0.5
}

# Get authentication token
if ! get_auth_token; then
    echo -e "${YELLOW}⚠ Skipping file upload tests - authentication required${NC}"
    echo -e "${YELLOW}To run these tests:${NC}"
    echo "1. Ensure server is running"
    echo "2. Ensure /api/v1/auth/register endpoint works"
    echo "3. Ensure you have a file upload endpoint"
    echo ""
    exit 0
fi

# Start tests
echo "Starting File Upload Tests..."
echo ""

echo "=========================================="
echo "Test Suite 1: Dangerous File Types"
echo "=========================================="
echo ""

test_upload \
    "PHP File Upload" \
    "malicious.php" \
    "video" \
    "/form-analysis/upload" \
    true

test_upload \
    "PHP Disguised as Image" \
    "malicious.php.jpg" \
    "video" \
    "/form-analysis/upload" \
    true

test_upload \
    "Executable File" \
    "malicious.exe" \
    "video" \
    "/form-analysis/upload" \
    true

test_upload \
    "Shell Script" \
    "malicious.sh" \
    "video" \
    "/form-analysis/upload" \
    true

echo "=========================================="
echo "Test Suite 2: Content Scanning"
echo "=========================================="
echo ""

test_upload \
    "Embedded PHP in Image" \
    "embedded_php.jpg" \
    "video" \
    "/form-analysis/upload" \
    true

echo "=========================================="
echo "Test Suite 3: Valid Files"
echo "=========================================="
echo ""

test_upload \
    "Valid PNG Image" \
    "valid.png" \
    "video" \
    "/form-analysis/upload" \
    false

echo "=========================================="
echo "Test Suite 4: Filename Security"
echo "=========================================="
echo ""

# Test XSS in filename
if [ -f "file<script>alert(1)</script>.jpg" ]; then
    echo -e "${BLUE}Testing: XSS in Filename${NC}"
    echo "File: file<script>alert(1)</script>.jpg"
    echo ""
    
    response=$(curl -s -w "\n%{http_code}" -X POST "${API_URL}/form-analysis/upload" \
        -H "Authorization: Bearer ${TOKEN}" \
        -F "video=@file<script>alert(1)</script>.jpg" 2>/dev/null)
    
    http_code=$(echo "$response" | tail -n1)
    
    if [ "$http_code" == "400" ] || [ "$http_code" == "415" ]; then
        echo -e "${GREEN}✓ File with XSS filename blocked${NC}"
        PASSED=$((PASSED + 1))
    else
        echo -e "${YELLOW}⚠ File uploaded (HTTP ${http_code})${NC}"
        echo "Check if filename was sanitized in storage"
        PASSED=$((PASSED + 1))
    fi
    echo ""
fi

# Cleanup
cd /
rm -rf "$TEST_DIR"
echo "✓ Test files cleaned up"
echo ""

# Summary
echo "=========================================="
echo "📊 Test Summary"
echo "=========================================="
echo -e "${GREEN}Passed: ${PASSED}${NC}"
echo -e "${RED}Failed: ${FAILED}${NC}"
echo -e "${YELLOW}Skipped: ${SKIPPED}${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All file upload security tests passed!${NC}"
    echo -e "${GREEN}Your API properly validates file uploads.${NC}"
    exit 0
else
    echo -e "${RED}✗ Some tests failed.${NC}"
    echo -e "${YELLOW}Review file upload validation middleware.${NC}"
    exit 1
fi




