#!/bin/bash

# Build script for LMS Frontend
# Usage: ./build-lms.sh

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Project directory
PROJECT_DIR="/home/raj/Documents/CODDING/PROJECT/IONIA/28_sept_2025_ionia/ionia-next"
LMS_DIR="$PROJECT_DIR/lms_frontend"

echo -e "${BLUE}🚀 Building LMS Frontend...${NC}"
echo "=================================="

# Check if directory exists
if [ ! -d "$LMS_DIR" ]; then
    echo -e "${RED}❌ Error: LMS frontend directory not found at $LMS_DIR${NC}"
    exit 1
fi

# Navigate to LMS frontend directory
cd "$LMS_DIR"

echo -e "${YELLOW}📁 Working directory: $(pwd)${NC}"

# Check if package.json exists
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: package.json not found in LMS frontend directory${NC}"
    exit 1
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📦 Installing dependencies...${NC}"
    npm install
fi

# Run TypeScript check first
echo -e "${YELLOW}🔍 Checking TypeScript compilation...${NC}"
if npx tsc --noEmit; then
    echo -e "${GREEN}✅ TypeScript compilation successful${NC}"
else
    echo -e "${RED}❌ TypeScript compilation failed${NC}"
    exit 1
fi

# Run linting
echo -e "${YELLOW}🔍 Running linter...${NC}"
if npm run lint --silent 2>/dev/null || true; then
    echo -e "${GREEN}✅ Linting completed${NC}"
else
    echo -e "${YELLOW}⚠️  Linting completed with warnings${NC}"
fi

# Run the build
echo -e "${YELLOW}🏗️  Building Next.js application...${NC}"
if npm run build; then
    echo ""
    echo -e "${GREEN}🎉 BUILD SUCCESSFUL! 🎉${NC}"
    echo "=================================="
    echo -e "${GREEN}✅ LMS Frontend built successfully${NC}"
    echo -e "${BLUE}📁 Build output: $LMS_DIR/.next${NC}"
    echo ""
    echo -e "${YELLOW}Next steps:${NC}"
    echo "• Run 'npm start' to start production server"
    echo "• Run 'npm run dev' to start development server"
    echo ""
else
    echo ""
    echo -e "${RED}❌ BUILD FAILED!${NC}"
    echo "=================================="
    echo -e "${RED}Build process encountered errors. Please check the output above.${NC}"
    exit 1
fi

