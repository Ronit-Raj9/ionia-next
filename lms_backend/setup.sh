#!/bin/bash

# LMS Backend Setup Script
# Quickly set up and run the FastAPI backend

echo "🚀 Setting up LMS Backend with Supabase RBAC..."
echo ""

# Check Python version
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.10+"
    exit 1
fi

PYTHON_VERSION=$(python3 --version 2>&1 | awk '{print $2}')
echo "✅ Python $PYTHON_VERSION detected"

# Create virtual environment
echo ""
echo "📦 Creating virtual environment..."
python3 -m venv venv

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source venv/bin/activate

# Upgrade pip
echo "⬆️  Upgrading pip..."
pip install --upgrade pip

# Install dependencies
echo "📥 Installing dependencies..."
pip install -r requirements.txt

# Check if .env exists
if [ ! -f .env ]; then
    echo ""
    echo "⚠️  .env file not found!"
    echo "📝 Creating .env from .env.example..."
    cp .env.example .env
    echo ""
    echo "⚠️  IMPORTANT: Edit .env and add your Supabase credentials:"
    echo "   - SUPABASE_URL"
    echo "   - SUPABASE_KEY"
    echo "   - SUPABASE_SERVICE_ROLE_KEY"
    echo "   - SUPABASE_JWT_SECRET"
    echo ""
    echo "Get these from: https://app.supabase.com → Your Project → Settings → API"
    echo ""
    read -p "Press Enter after you've configured .env..."
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "📚 Next steps:"
echo "   1. Configure .env with your Supabase credentials"
echo "   2. Run RLS policies in Supabase SQL Editor (see supabase_rls_policies.sql)"
echo "   3. Start the server: ./run.sh"
echo ""
echo "📖 See README.md for detailed instructions"

