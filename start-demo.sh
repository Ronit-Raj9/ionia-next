#!/bin/bash
# Quick Start Script for Investor Demo
# Starts both FastAPI backend and Next.js frontend

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}"
cat << "EOF"
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║       🎓 IONIA LMS - AI-Powered Learning Platform          ║
║                   Investor Demo Setup                      ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

# Check prerequisites
echo -e "${YELLOW}📋 Checking prerequisites...${NC}"

# Check Python
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed"
    exit 1
fi
echo "✓ Python 3 installed"

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed"
    exit 1
fi
echo "✓ Node.js installed"

# Check MongoDB
if ! command -v mongod &> /dev/null && ! pgrep -x "mongod" > /dev/null; then
    echo "⚠️  MongoDB not detected (may be running as service)"
else
    echo "✓ MongoDB detected"
fi

echo ""
echo -e "${YELLOW}🔧 Setting up environment...${NC}"

# Setup FastAPI
cd lms_ai/fastapi_server

if [ ! -f ".env" ]; then
    echo "⚠️  .env file not found in lms_ai/fastapi_server"
    echo "Creating from template..."
    cp env.template .env
    echo ""
    echo -e "${YELLOW}⚠️  IMPORTANT: Please edit lms_ai/fastapi_server/.env and add your API keys:${NC}"
    echo "   - GROQ_API_KEY (required)"
    echo "   - OPENAI_API_KEY (optional)"
    echo "   - GEMINI_API_KEY (optional)"
    echo ""
    read -p "Press Enter after updating .env file..."
fi

# Install Python dependencies if needed
if [ ! -d "venv" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv venv
fi

echo "Installing Python dependencies..."
source venv/bin/activate
pip install -q -r requirements.txt

# Setup Next.js
cd ../../lms_frontend

if [ ! -f ".env.local" ]; then
    echo "⚠️  .env.local file not found in lms_frontend"
    echo "Creating from example..."
    cp env.example .env.local
    echo ""
    echo -e "${YELLOW}⚠️  Please edit lms_frontend/.env.local and configure:${NC}"
    echo "   - MONGODB_URI"
    echo "   - GROQ_API_KEY"
    echo "   - CLOUDINARY_* keys (if using file uploads)"
    echo ""
    read -p "Press Enter after updating .env.local file..."
fi

# Install Node dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "Installing Node.js dependencies..."
    npm install
fi

echo ""
echo -e "${GREEN}✅ Setup complete!${NC}"
echo ""
echo -e "${BLUE}🚀 Starting services...${NC}"
echo ""

# Start FastAPI in background
cd ../lms_ai/fastapi_server
echo -e "${YELLOW}Starting FastAPI AI Service on port 8000...${NC}"
source venv/bin/activate
python main.py > ../../logs/fastapi.log 2>&1 &
FASTAPI_PID=$!
echo "FastAPI PID: $FASTAPI_PID"

# Wait for FastAPI to start
echo -n "Waiting for FastAPI to be ready"
for i in {1..15}; do
    if curl -s http://localhost:8000/health > /dev/null 2>&1; then
        echo -e " ${GREEN}✓${NC}"
        break
    fi
    echo -n "."
    sleep 1
done

if ! curl -s http://localhost:8000/health > /dev/null 2>&1; then
    echo -e " ${YELLOW}⚠${NC}"
    echo "FastAPI may not be ready yet, but continuing..."
fi

# Start Next.js in background
cd ../../lms_frontend
echo -e "${YELLOW}Starting Next.js Frontend on port 3001...${NC}"
npm run dev > ../logs/nextjs.log 2>&1 &
NEXTJS_PID=$!
echo "Next.js PID: $NEXTJS_PID"

# Wait for Next.js to start
echo -n "Waiting for Next.js to be ready"
for i in {1..30}; do
    if curl -s http://localhost:3001 > /dev/null 2>&1; then
        echo -e " ${GREEN}✓${NC}"
        break
    fi
    echo -n "."
    sleep 1
done

echo ""
echo -e "${GREEN}"
cat << "EOF"
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║                  🎉 DEMO READY!                            ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

echo -e "${BLUE}📡 Services:${NC}"
echo "   • FastAPI AI Backend:  http://localhost:8000"
echo "   • Next.js Frontend:    http://localhost:3001"
echo ""
echo -e "${BLUE}🧪 Test Integration:${NC}"
echo "   ./test-ai-integration.sh"
echo ""
echo -e "${BLUE}📊 View Logs:${NC}"
echo "   FastAPI: tail -f logs/fastapi.log"
echo "   Next.js: tail -f logs/nextjs.log"
echo ""
echo -e "${BLUE}🛑 Stop Services:${NC}"
echo "   ./stop-demo.sh"
echo "   or manually: kill $FASTAPI_PID $NEXTJS_PID"
echo ""
echo -e "${YELLOW}💡 Demo Accounts:${NC}"
echo "   Teacher: teacher@school.com / password123"
echo "   Student: student@school.com / password123"
echo ""
echo -e "${GREEN}✨ Ready for investor demo! Good luck! 🚀${NC}"
echo ""

# Save PIDs for cleanup
echo "$FASTAPI_PID" > /tmp/ionia_fastapi.pid
echo "$NEXTJS_PID" > /tmp/ionia_nextjs.pid

