#!/bin/bash

# Master test runner for all security tests

echo "=========================================="
echo "🔐 CoachFlow API Security Test Suite"
echo "=========================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Check if server is running
echo "Checking if API server is running..."
if curl -s http://localhost:5001/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Server is running${NC}"
    echo ""
else
    echo -e "${RED}✗ Server is not running${NC}"
    echo ""
    echo "Please start the server first:"
    echo "  cd backend"
    echo "  npm run dev"
    echo ""
    exit 1
fi

# Make scripts executable
chmod +x "$SCRIPT_DIR"/*.sh

# Test results
TOTAL_SUITES=0
PASSED_SUITES=0
FAILED_SUITES=0

# Function to run test suite
run_test_suite() {
    local test_script=$1
    local test_name=$2
    
    TOTAL_SUITES=$((TOTAL_SUITES + 1))
    
    echo ""
    echo "=========================================="
    echo "Running: $test_name"
    echo "=========================================="
    echo ""
    
    if bash "$test_script"; then
        PASSED_SUITES=$((PASSED_SUITES + 1))
        echo -e "${GREEN}✓ $test_name completed successfully${NC}"
    else
        FAILED_SUITES=$((FAILED_SUITES + 1))
        echo -e "${RED}✗ $test_name had failures${NC}"
    fi
    
    echo ""
    sleep 2
}

# Run all test suites
echo "Starting security test suites..."
echo ""

run_test_suite "$SCRIPT_DIR/test-rate-limiting.sh" "Rate Limiting Tests"
run_test_suite "$SCRIPT_DIR/test-input-sanitization.sh" "Input Sanitization Tests"
run_test_suite "$SCRIPT_DIR/test-file-upload.sh" "File Upload Security Tests"

# Final summary
echo ""
echo "=========================================="
echo "🎯 Final Test Summary"
echo "=========================================="
echo ""
echo "Total Test Suites: $TOTAL_SUITES"
echo -e "${GREEN}Passed Suites: ${PASSED_SUITES}${NC}"
echo -e "${RED}Failed Suites: ${FAILED_SUITES}${NC}"
echo ""

if [ $FAILED_SUITES -eq 0 ]; then
    echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║  ✓ All Security Tests Passed!        ║${NC}"
    echo -e "${GREEN}║  Your API is properly secured.        ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════╝${NC}"
    echo ""
    exit 0
else
    echo -e "${RED}╔════════════════════════════════════════╗${NC}"
    echo -e "${RED}║  ✗ Some Security Tests Failed         ║${NC}"
    echo -e "${RED}║  Review the output above for details. ║${NC}"
    echo -e "${RED}╚════════════════════════════════════════╝${NC}"
    echo ""
    exit 1
fi




