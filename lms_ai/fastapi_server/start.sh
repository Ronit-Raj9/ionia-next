#!/bin/bash
# Start script for Ionia AI Service

echo "🚀 Starting Ionia AI Service..."

# Check if .env exists
if [ ! -f .env ]; then
    echo "⚠️  Warning: .env file not found. Copying from .env.example..."
    cp .env.example .env
    echo "📝 Please edit .env and add your API keys before continuing."
    exit 1
fi

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source venv/bin/activate

# Install/update dependencies
echo "📥 Installing dependencies..."
pip install -r requirements.txt --quiet

# Start the server
echo "✅ Starting FastAPI server on http://localhost:8000"
echo "📚 API docs available at http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

python main.py

