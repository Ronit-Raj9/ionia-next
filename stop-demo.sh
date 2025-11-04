#!/bin/bash
# Stop all demo services

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🛑 Stopping Ionia LMS services...${NC}"

# Kill services by PID
if [ -f "/tmp/ionia_fastapi.pid" ]; then
    FASTAPI_PID=$(cat /tmp/ionia_fastapi.pid)
    if ps -p $FASTAPI_PID > /dev/null 2>&1; then
        echo "Stopping FastAPI (PID: $FASTAPI_PID)..."
        kill $FASTAPI_PID
        rm /tmp/ionia_fastapi.pid
    fi
fi

if [ -f "/tmp/ionia_nextjs.pid" ]; then
    NEXTJS_PID=$(cat /tmp/ionia_nextjs.pid)
    if ps -p $NEXTJS_PID > /dev/null 2>&1; then
        echo "Stopping Next.js (PID: $NEXTJS_PID)..."
        kill $NEXTJS_PID
        rm /tmp/ionia_nextjs.pid
    fi
fi

# Fallback: kill by port
echo "Checking for services on ports..."

# Kill FastAPI (port 8000)
if lsof -ti:8000 > /dev/null 2>&1; then
    echo "Found service on port 8000, killing..."
    kill $(lsof -ti:8000) 2>/dev/null || true
fi

# Kill Next.js (port 3001)
if lsof -ti:3001 > /dev/null 2>&1; then
    echo "Found service on port 3001, killing..."
    kill $(lsof -ti:3001) 2>/dev/null || true
fi

# Kill any remaining Python/Node processes from our project
pkill -f "lms_ai/fastapi_server/main.py" 2>/dev/null || true
pkill -f "next dev.*3001" 2>/dev/null || true

echo ""
echo -e "${GREEN}✅ All services stopped${NC}"

