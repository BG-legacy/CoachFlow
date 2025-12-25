#!/bin/bash

# Onboarding Tests Runner
# Run comprehensive tests for user onboarding and profile management

echo "🚀 Running Onboarding & Profile Management Tests..."
echo "=================================================="
echo ""

# Set test environment
export NODE_ENV=test

# Run the onboarding tests with coverage
npm test -- tests/onboarding.test.js --coverage --verbose

echo ""
echo "=================================================="
echo "✅ Test run complete!"
echo ""
echo "📊 Coverage report generated in: coverage/"
echo "📝 View detailed report: coverage/lcov-report/index.html"

