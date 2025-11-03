# 🚀 Alembic Migration Guide - Supabase

## ✅ Your Setup Status

- ✅ **9 SQLAlchemy models** created in `app/db/models/`
- ✅ **Alembic** configured with async support
- ✅ **Base** properly imports all models for autogenerate
- ⏳ **Migration** needs to be created

---

## 📋 Step-by-Step Migration Process

### Step 1: Configure Environment Variables

Create a `.env` file with your Supabase database credentials:

```bash
# Create .env file
nano .env
```

**Add these variables:**

```env
# Supabase Database URLs
DATABASE_URL="postgresql://postgres.YOUR_PROJECT_REF:YOUR_PASSWORD@aws-0-us-east-1.pooler.supabase.com:5432/postgres"
ASYNC_DATABASE_URL="postgresql+asyncpg://postgres.YOUR_PROJECT_REF:YOUR_PASSWORD@aws-0-us-east-1.pooler.supabase.com:5432/postgres"

# Supabase Auth
SUPABASE_URL="https://YOUR_PROJECT_REF.supabase.co"
SUPABASE_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
SUPABASE_JWT_SECRET="your-jwt-secret"

# App Config
ENVIRONMENT="development"
DEBUG=true
LOG_LEVEL="INFO"
```

**Get your Supabase credentials from:**
- Supabase Dashboard → Your Project → Settings → Database
- Supabase Dashboard → Your Project → Settings → API

---

### Step 2: Install Missing Dependencies

```bash
# Make sure all required packages are installed
pip install alembic sqlalchemy asyncpg psycopg2-binary python-dotenv
```

---

### Step 3: Create Initial Migration

```bash
# Navigate to project directory
cd /home/raj/Documents/CODING/Ionia/ionia-next/lms_backend

# Create initial migration (autogenerate from 
models)
alembic revision --autogenerate -m "Initial migration - all models"
```

This will:
- ✅ Scan all your SQLAlchemy models
- ✅ Compare with Supabase database (empty)
- ✅ Generate migration file in `alembic/versions/`

---

### Step 4: Review Generated Migration

```bash
# The migration file will be created in alembic/versions/
# Example: alembic/versions/abc123_initial_migration_all_models.py

# Open and review it:
cat alembic/versions/*_initial_migration_all_models.py
```

**What to check:**
- ✅ All 9 tables are being created
- ✅ Correct column types
- ✅ Foreign keys are correct
- ✅ Indexes are included

---

### Step 5: Run Migration to Supabase

```bash
# Apply migration to Supabase database
alembic upgrade head
```

This will:
- ✅ Connect to your Supabase PostgreSQL database
- ✅ Create all tables defined in your models
- ✅ Set up relationships and constraints
- ✅ Record migration in `alembic_version` table

---

## 📊 Your Database Models

The migration will create these **9 tables**:

| Table | Purpose | Key Fields |
|-------|---------|-----------|
| `profiles` | User profiles (extends Supabase auth.users) | user_id, role, school_id |
| `schools` | Schools/Institutions | school_id, school_name, board |
| `classes` | Classes/Sections | class_id, school_id, grade |
| `student_enrollments` | Student-Class associations | student_id, class_id |
| `assignments` | Teacher-created assignments | assignment_id, class_id, teacher_id |
| `student_assignments` | Personalized student assignments | student_assignment_id, assignment_id, student_id |
| `submissions` | Student submissions | submission_id, student_assignment_id |
| `grades` | Grading results | grade_id, submission_id, score |
| `student_profiles` | Student learning profiles | profile_id, student_id |
| `analytics` | Progress analytics | analytics_id, student_id |
| `lesson_plans` | AI-generated lessons | lesson_id, teacher_id |
| `audit_logs` | Ethical monitoring | log_id, action, user_id |

---

## 🔄 Common Alembic Commands

```bash
# Check current migration status
alembic current

# View migration history
alembic history

# Upgrade to latest migration
alembic upgrade head

# Downgrade one migration
alembic downgrade -1

# Downgrade to specific revision
alembic downgrade <revision_id>

# Create new migration after model changes
alembic revision --autogenerate -m "Description of changes"

# Show SQL without applying (dry run)
alembic upgrade head --sql
```

---

## 🐛 Troubleshooting

### Error: `No module named 'app'`
```bash
# Make sure you're in the lms_backend directory
cd /home/raj/Documents/CODING/Ionia/ionia-next/lms_backend

# Verify Python path
python -c "import sys; print(sys.path)"
```

### Error: `Cannot connect to database`
```bash
# Check .env file exists and has correct values
cat .env

# Test database connection
python -c "from app.db.base import engine; import asyncio; asyncio.run(engine.connect())"
```

### Error: `Target database is not up to date`
```bash
# Check current version
alembic current

# Stamp database to current (if needed)
alembic stamp head
```

### Error: `Table already exists`
```bash
# Option 1: Drop existing tables (WARNING: deletes data)
python -c "from app.db.base import drop_db; import asyncio; asyncio.run(drop_db())"

# Option 2: Stamp existing database
alembic stamp head
```

---

## 🔐 Setting Up Row-Level Security (RLS)

After creating tables, you'll want to add RLS policies. Create this in Supabase SQL Editor:

```sql
-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE grades ENABLE ROW LEVEL SECURITY;
-- ... repeat for all tables

-- Example: Students can only see their own data
CREATE POLICY "Students can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = user_id OR public.has_role('school_admin'));

-- Example: Teachers can access their classes
CREATE POLICY "Teachers can view their classes"
  ON classes FOR SELECT
  USING (
    public.has_role('teacher') AND 
    class_id IN (SELECT class_id FROM teacher_classes WHERE teacher_id = auth.uid())
  );
```

---

## ✅ Verification Checklist

After migration:

- [ ] All tables created in Supabase
- [ ] Check Supabase Dashboard → Table Editor
- [ ] Verify column types match models
- [ ] Test database connection from FastAPI
- [ ] Add RLS policies for security
- [ ] Test CRUD operations

---

## 📝 Next Steps

1. **Run the migration** (Steps 1-5 above)
2. **Verify in Supabase** (Dashboard → Table Editor)
3. **Add RLS policies** (for security)
4. **Test with FastAPI** (create, read, update, delete)
5. **Seed test data** (optional)

---

## 🚨 Important Notes

1. **Always review autogenerated migrations** before applying
2. **Backup your database** before running migrations in production
3. **RLS policies are separate** - Alembic only creates tables
4. **Supabase auth.users table** is managed by Supabase, not Alembic
5. **Use `profiles` table** to extend auth.users with RBAC

---

Ready to run? Start with **Step 1** above!

