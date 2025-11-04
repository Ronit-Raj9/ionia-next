#!/bin/bash
# Stop all Ionia LMS services

echo "🛑 Stopping all services..."

# Read PIDs from file if it exists
if [ -f ".pids" ]; then
    while read pid; do
        if ps -p $pid > /dev/null 2>&1; then
            echo "  Killing process $pid..."
            kill $pid 2>/dev/null || true
        fi
    done < .pids
    rm .pids
fi

# Fallback: Kill by port
echo "  Checking ports..."

# FastAPI (8000)
FASTAPI_PID=$(lsof -ti:8000 2>/dev/null)
if [ ! -z "$FASTAPI_PID" ]; then
    echo "  Stopping FastAPI (PID: $FASTAPI_PID)..."
    kill $FASTAPI_PID 2>/dev/null || true
fi

# Next.js (3001)
NEXTJS_PID=$(lsof -ti:3001 2>/dev/null)
if [ ! -z "$NEXTJS_PID" ]; then
    echo "  Stopping Next.js (PID: $NEXTJS_PID)..."
    kill $NEXTJS_PID 2>/dev/null || true
fi

sleep 2

echo ""
echo "✅ All services stopped"
echo ""

