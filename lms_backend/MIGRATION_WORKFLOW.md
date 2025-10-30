# 🔄 Database Migration Workflow

## Overview

This project uses **Alembic** for local migrations and syncs with **Supabase** for production deployment.

---

## 🛠️ **Setup (One-Time)**

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env with your Supabase credentials
```

---

## 📝 **Standard Workflow**

### **Step 1: Modify SQLAlchemy Models**

Edit models in `app/db/models/`:

```python
# app/db/models/assignment_model.py
class Assignment(Base):
    __tablename__ = "assignments"
    
    id = Column(UUID, primary_key=True, default=uuid.uuid4)
    title = Column(String(200), nullable=False)
    # Add new column
    difficulty_level = Column(String(50), default="medium")
```

### **Step 2: Generate Alembic Migration**

```bash
# Auto-generate migration from model changes
alembic revision --autogenerate -m "add difficulty_level to assignments"

# This creates: alembic/versions/xxxx_add_difficulty_level_to_assignments.py
```

### **Step 3: Review Migration**

Open the generated file and verify the changes:

```python
def upgrade() -> None:
    op.add_column('assignments', sa.Column('difficulty_level', sa.String(50), server_default='medium'))

def downgrade() -> None:
    op.drop_column('assignments', 'difficulty_level')
```

### **Step 4: Apply Migration Locally**

```bash
# Apply migration to local database
alembic upgrade head

# Check current version
alembic current

# See migration history
alembic history
```

### **Step 5: Sync to Supabase (Production)**

```bash
# Generate Supabase migration SQL
supabase db diff -f add_difficulty_level

# Review the generated SQL in supabase/migrations/

# Push to Supabase
supabase db push
```

### **Step 6: Commit Changes**

```bash
git add alembic/versions/ supabase/migrations/
git commit -m "feat: add difficulty_level to assignments"
git push
```

---

## 🔧 **Common Commands**

### Alembic Commands

```bash
# Generate migration (auto-detect changes)
alembic revision --autogenerate -m "description"

# Create empty migration (manual)
alembic revision -m "description"

# Apply all pending migrations
alembic upgrade head

# Revert last migration
alembic downgrade -1

# Revert all migrations
alembic downgrade base

# Show current revision
alembic current

# Show migration history
alembic history --verbose

# Show pending migrations
alembic heads
```

### Supabase Commands

```bash
# Generate migration from schema differences
supabase db diff -f migration_name

# Pull current schema from Supabase
supabase db pull

# Push local migrations to Supabase
supabase db push

# Reset remote database (DANGEROUS!)
supabase db reset
```

---

## 🧪 **Testing Migrations**

### Test Locally

```bash
# Apply migration
alembic upgrade head

# Test your changes
python -c "from app.db.base import check_db_connection; import asyncio; asyncio.run(check_db_connection())"

# If issues, rollback
alembic downgrade -1
```

### Test on Staging

```bash
# Push to staging Supabase project
SUPABASE_PROJECT_ID=staging-project supabase db push

# Verify schema
supabase db pull
```

---

## 🚨 **Troubleshooting**

### Problem: "Target database is not up to date"

```bash
# Check current version
alembic current

# Stamp database to latest revision (if out of sync)
alembic stamp head
```

### Problem: "Can't locate revision identified by 'xxxx'"

```bash
# Rebuild version history
alembic history

# If necessary, manually set revision
alembic stamp <revision_id>
```

### Problem: Migration fails halfway

```bash
# Rollback to previous version
alembic downgrade -1

# Fix the migration script
# Re-run migration
alembic upgrade head
```

### Problem: Supabase schema out of sync

```bash
# Pull current schema from Supabase
supabase db pull

# Generate new diff
supabase db diff -f sync_schema

# Review and push
supabase db push
```

---

## 📋 **Migration Checklist**

Before committing:

- [ ] Models updated in `app/db/models/`
- [ ] Migration generated: `alembic revision --autogenerate`
- [ ] Migration reviewed for correctness
- [ ] Migration tested locally: `alembic upgrade head`
- [ ] Rollback tested: `alembic downgrade -1`
- [ ] Supabase migration generated: `supabase db diff`
- [ ] Both migrations committed to git
- [ ] Pushed to remote and deployed

---

## 🎯 **Best Practices**

### ✅ Do

- Always review auto-generated migrations
- Test migrations locally before production
- Write descriptive migration messages
- Keep migrations small and focused
- Test both upgrade and downgrade
- Commit migrations with related code changes
- Use transactions for data migrations

### ❌ Don't

- Modify existing migrations after merging
- Skip migration testing
- Push untested migrations to production
- Mix schema and data changes in one migration
- Delete migrations from version control
- Run migrations manually on production (use CI/CD)

---

## 🔐 **Production Deployment**

### Automated (Recommended)

Use CI/CD to apply migrations:

```yaml
# .github/workflows/deploy.yml
- name: Run migrations
  run: |
    alembic upgrade head
    supabase db push
```

### Manual (If necessary)

```bash
# 1. Backup database first!
supabase db dump > backup_$(date +%Y%m%d).sql

# 2. Apply migrations
alembic upgrade head

# 3. Verify
python scripts/verify_schema.py

# 4. If issues, rollback
alembic downgrade -1
```

---

## 📚 **References**

- [Alembic Documentation](https://alembic.sqlalchemy.org/)
- [Supabase CLI Reference](https://supabase.com/docs/reference/cli)
- [SQLAlchemy Async](https://docs.sqlalchemy.org/en/20/orm/extensions/asyncio.html)

---

## 🆘 **Getting Help**

If migrations fail:

1. Check `logs/backend.log` for errors
2. Review migration script in `alembic/versions/`
3. Verify database connection: `alembic current`
4. Check Supabase dashboard for conflicts
5. Rollback and retry: `alembic downgrade -1`

**For complex migrations, test in staging first!**

