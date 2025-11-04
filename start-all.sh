#!/bin/bash
# Start all services for Ionia LMS + AI Integration

set -e

echo "🚀 Starting Ionia LMS with AI Integration..."
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -d "lms_ai" ] || [ ! -d "lms_frontend" ]; then
    echo "❌ Error: Please run this script from the ionia-next directory"
    exit 1
fi

# Function to check if port is in use
check_port() {
    lsof -ti:$1 > /dev/null 2>&1
}

# Kill processes on ports if they exist
echo "🧹 Cleaning up existing processes..."
if check_port 8000; then
    echo "  Killing process on port 8000..."
    kill $(lsof -ti:8000) 2>/dev/null || true
fi
if check_port 3001; then
    echo "  Killing process on port 3001..."
    kill $(lsof -ti:3001) 2>/dev/null || true
fi
sleep 2

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  STEP 1: Setting up FastAPI AI Service"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

cd lms_ai/fastapi_server

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "⚠️  No .env file found. Creating from .env.example..."
    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo "📝 .env file created. Please add your API keys:"
        echo "   - GROQ_API_KEY (required)"
        echo "   - OPENAI_API_KEY (optional)"
        echo "   - GEMINI_API_KEY (optional)"
        echo ""
        read -p "Press Enter to continue or Ctrl+C to exit and add keys..."
    else
        echo "❌ .env.example not found. Cannot create .env"
        exit 1
    fi
fi

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "📦 Creating Python virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo "📥 Installing Python dependencies..."
pip install -r requirements.txt --quiet

# Start FastAPI in background
echo ""
echo -e "${GREEN}✅ Starting FastAPI AI Service on port 8000...${NC}"
nohup python main.py > fastapi.log 2>&1 &
FASTAPI_PID=$!
echo "   PID: $FASTAPI_PID"

# Wait for FastAPI to start
echo "   Waiting for FastAPI to be ready..."
for i in {1..30}; do
    if curl -s http://localhost:8000/health > /dev/null; then
        echo -e "   ${GREEN}✓ FastAPI is ready!${NC}"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "   ❌ FastAPI failed to start. Check lms_ai/fastapi_server/fastapi.log"
        exit 1
    fi
    sleep 1
    echo -n "."
done

echo ""
echo "   📚 API Documentation: http://localhost:8000/docs"
echo "   🏥 Health Check: http://localhost:8000/health"
echo ""

cd ../..

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  STEP 2: Starting Next.js Frontend"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

cd lms_frontend

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing Node.js dependencies..."
    npm install
fi

# Start Next.js in background
echo ""
echo -e "${GREEN}✅ Starting Next.js Frontend on port 3001...${NC}"
nohup npm run dev > nextjs.log 2>&1 &
NEXTJS_PID=$!
echo "   PID: $NEXTJS_PID"

# Wait for Next.js to start
echo "   Waiting for Next.js to be ready..."
for i in {1..60}; do
    if curl -s http://localhost:3001 > /dev/null; then
        echo -e "   ${GREEN}✓ Next.js is ready!${NC}"
        break
    fi
    if [ $i -eq 60 ]; then
        echo "   ❌ Next.js failed to start. Check lms_frontend/nextjs.log"
        exit 1
    fi
    sleep 1
    if [ $((i % 10)) -eq 0 ]; then
        echo -n "."
    fi
done

cd ..

echo ""
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  🎉 ALL SERVICES RUNNING!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo -e "${GREEN}✅ FastAPI AI Service${NC}"
echo "   🌐 URL: http://localhost:8000"
echo "   📖 Docs: http://localhost:8000/docs"
echo "   📝 Logs: lms_ai/fastapi_server/fastapi.log"
echo "   🔢 PID: $FASTAPI_PID"
echo ""
echo -e "${GREEN}✅ Next.js Frontend${NC}"
echo "   🌐 URL: http://localhost:3001"
echo "   📝 Logs: lms_frontend/nextjs.log"
echo "   🔢 PID: $NEXTJS_PID"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo -e "${YELLOW}🚀 READY FOR INVESTOR DEMO!${NC}"
echo ""
echo "Demo checklist:"
echo "  1. ✅ Open http://localhost:3001"
echo "  2. ✅ Login as teacher"
echo "  3. ✅ Create assignment (ARC agent personalizes)"
echo "  4. ✅ Login as student"
echo "  5. ✅ Submit answer (GRADE agent auto-grades)"
echo "  6. ✅ Show DevTools Network tab for API calls"
echo ""
echo "To stop all services:"
echo "  kill $FASTAPI_PID $NEXTJS_PID"
echo ""
echo "Or run: ./stop-all.sh"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Save PIDs to file for stop script
echo "$FASTAPI_PID" > .pids
echo "$NEXTJS_PID" >> .pids

echo "Press Ctrl+C to view logs, or close this terminal (services will keep running)"
echo ""

# Follow logs (optional)
tail -f lms_ai/fastapi_server/fastapi.log lms_frontend/nextjs.log

