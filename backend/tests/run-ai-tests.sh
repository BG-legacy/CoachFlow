#!/bin/bash

# AI Program Generation Tests Runner
# Run comprehensive tests for AI-assisted program generation

set -e

echo "🤖 CoachFlow AI Program Generation Tests"
echo "========================================"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Error: Node.js is not installed"
    exit 1
fi

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Set test environment
export NODE_ENV=test

echo "📋 Running AI Program Generation Tests..."
echo ""

# Run the AI program generation tests
npx jest tests/ai-program-generation.test.js --verbose --coverage --detectOpenHandles

echo ""
echo "✅ AI Program Generation Tests Complete"
echo ""

# Check if coverage threshold is met
echo "📊 Test Coverage Summary:"
echo "========================"

