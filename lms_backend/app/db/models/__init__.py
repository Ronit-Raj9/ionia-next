"""
SQLAlchemy Models
ORM models for all database tables (Supabase PostgreSQL)

Note: These models mirror the Supabase schema defined in supabase/migrations/initial_schema.sql
You can use either:
1. Direct Supabase client calls (in services) - Recommended for Phase 1
2. SQLAlchemy ORM (via these models) - Optional, for complex queries

Both approaches work with the same PostgreSQL database.
"""
from app.db.models.user_model import User, Profile, School
from app.db.models.class_model import Class, StudentEnrollment
from app.db.models.assignment_model import Assignment, StudentAssignment
from app.db.models.submission_model import Submission
from app.db.models.grade_model import Grade
from app.db.models.profile_model import StudentProfile
from app.db.models.analytics_model import Analytics
from app.db.models.lesson_model import LessonPlan
from app.db.models.audit_model import AuditLog

__all__ = [
    "User",
    "Profile",
    "School",
    "Class",
    "StudentEnrollment",
    "Assignment",
    "StudentAssignment",
    "Submission",
    "Grade",
    "StudentProfile",
    "Analytics",
    "LessonPlan",
    "AuditLog"
]

