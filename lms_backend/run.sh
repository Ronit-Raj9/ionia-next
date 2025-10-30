#!/bin/bash

# Quick run script for development

echo "🚀 Starting LMS Backend..."
echo ""

# Activate virtual environment
if [ -d "venv" ]; then
    source venv/bin/activate
else
    echo "❌ Virtual environment not found!"
    echo "Run ./setup.sh first"
    exit 1
fi

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ .env file not found!"
    echo "Copy .env.example to .env and configure your Supabase credentials"
    exit 1
fi

# Start server with auto-reload
echo "🔥 Starting FastAPI with auto-reload..."
echo "📍 Server will be available at: http://localhost:8000"
echo "📚 API Docs: http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop"
echo ""

uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

