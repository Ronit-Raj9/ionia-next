# Quick Fix for Startup Issues

## Issue: Missing packages and import errors

### Step 1: Install All Dependencies

```bash
cd /home/raj/Documents/CODING/Ionia/ionia-next/lms_backend

# Activate your conda environment
conda activate ionia

# Install all dependencies
pip install -r requirements.txt

# Or if using uv:
uv pip install -r requirements.txt
```

### Step 2: Create .env File

```bash
# Copy template
cp .env.example .env

# Edit with your Supabase credentials
nano .env
```

**Minimum required in .env:**
```env
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
SUPABASE_JWT_SECRET="your-jwt-secret"
DATABASE_URL="postgresql://postgres:password@localhost:5432/postgres"
ASYNC_DATABASE_URL="postgresql+asyncpg://postgres:password@localhost:5432/postgres"
ENVIRONMENT="development"
DEBUG=true
LOG_LEVEL="INFO"
```

### Step 3: Test Import

```bash
python -c "from app.core.logger import get_logger; print('✅ Logger OK')"
python -c "from app.core.config import settings; print('✅ Config OK')"
python -c "from app.main import app; print('✅ App OK')"
```

### Step 4: Start Server

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## Fixed Issues:

1. ✅ Added `get_logger()` function to `app/core/logger.py`
2. ✅ Made Supabase config fields optional (to allow startup without .env)
3. ✅ Removed module-level config exports that could cause circular imports

## If Still Having Issues:

### Check Python Environment
```bash
which python
python --version  # Should be 3.11+
```

### Reinstall Everything
```bash
pip uninstall -y fastapi uvicorn supabase loguru pydantic
pip install -r requirements.txt
```

### Verify All Packages Installed
```bash
python -c "import fastapi, uvicorn, supabase, loguru, pydantic; print('All OK')"
```

