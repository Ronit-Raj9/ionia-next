"""
User, Profile, and School Models
Core user management with proper RBAC integration
"""
from sqlalchemy import Column, String, Text, Integer, TIMESTAMP, Boolean, ForeignKey, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID, JSONB, ARRAY
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
import enum

from app.db.base import Base


# ============================================================================
# USER ROLE ENUM (matching constants.py)
# ============================================================================

class UserRole(str, enum.Enum):
    """
    User role enum for RBAC
    Hierarchy: SCHOOL_ADMIN > PRINCIPAL > CLASS_TEACHER > TEACHER > STUDENT
    """
    STUDENT = "student"
    TEACHER = "teacher"
    CLASS_TEACHER = "class_teacher"
    PRINCIPAL = "principal"
    SCHOOL_ADMIN = "school_admin"


# ============================================================================
# PROFILE MODEL (extends Supabase auth.users)
# ============================================================================

class Profile(Base):
    """
    User profile extending Supabase auth.users
    Stores roles, school affiliation, and user metadata
    
    This table syncs with Supabase auth via triggers.
    """
    __tablename__ = "profiles"
    
    # Primary key (links to auth.users.id)
    user_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Profile info
    email = Column(Text, nullable=False, unique=True, index=True)
    full_name = Column(Text, nullable=False)
    phone = Column(Text)
    avatar_url = Column(Text)
    
    # Role & School (RBAC)
    role = Column(
        SQLEnum(UserRole),
        default=UserRole.STUDENT,
        nullable=False,
        index=True
    )
    school_id = Column(
        Text,
        ForeignKey('schools.school_id', ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    
    # User status
    status = Column(
        Text,
        default='active',
        nullable=False
    )  # active, inactive, suspended, pending
    is_active = Column(Boolean, default=True, nullable=False)
    
    # Metadata
    user_type = Column(Text)  # teacher, student, admin (legacy, use role instead)
    preferences = Column(JSONB, default={})
    
    # Timestamps
    created_at = Column(TIMESTAMP, default=datetime.utcnow, nullable=False)
    updated_at = Column(TIMESTAMP, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_login = Column(TIMESTAMP)
    
    # Relationships
    school = relationship("School", back_populates="profiles")
    
    def __repr__(self):
        return f"<Profile(user_id={self.user_id}, email={self.email}, role={self.role.value})>"


# ============================================================================
# SCHOOL MODEL
# ============================================================================

class School(Base):
    """
    School/Institution
    Multi-tenant isolation unit for RBAC
    """
    __tablename__ = "schools"
    
    # Primary key
    school_id = Column(Text, primary_key=True)
    
    # School info
    school_name = Column(Text, nullable=False)
    school_type = Column(Text)  # primary, secondary, high_school
    board = Column(Text, default='CBSE')
    
    # Location
    address = Column(Text)
    city = Column(Text)
    state = Column(Text)
    pincode = Column(Text)
    country = Column(Text, default='India')
    
    # Contact
    contact_email = Column(Text)
    contact_phone = Column(Text)
    principal_name = Column(Text)
    principal_phone = Column(Text)
    
    # Metadata
    classes_offered = Column(ARRAY(Integer))  # [6, 7, 8, 9, 10]
    total_students = Column(Integer, default=0)
    total_teachers = Column(Integer, default=0)
    
    # Status & Subscription
    status = Column(Text, default='active')  # active, inactive, suspended
    is_active = Column(Boolean, default=True, nullable=False)
    subscription_plan = Column(Text, default='trial')  # trial, basic, premium
    subscription_expires_at = Column(TIMESTAMP)
    
    # Settings
    settings = Column(JSONB, default={})
    
    # Timestamps
    created_at = Column(TIMESTAMP, default=datetime.utcnow, nullable=False)
    updated_at = Column(TIMESTAMP, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    profiles = relationship("Profile", back_populates="school")
    classes = relationship("Class", back_populates="school")
    
    def __repr__(self):
        return f"<School(school_id={self.school_id}, name={self.school_name})>"


# ============================================================================
# USER (Supabase auth.users placeholder)
# ============================================================================

class User:
    """
    User authentication is handled by Supabase auth.users table.
    This is a placeholder class for reference.
    
    Use Profile model for extended user data.
    Use Supabase client for auth operations.
    
    Supabase auth.users structure:
        - id (UUID): Primary key
        - email (string): User email
        - encrypted_password (string): Hashed password
        - email_confirmed_at (timestamp)
        - created_at (timestamp)
        - updated_at (timestamp)
        - app_metadata (JSONB): Contains roles, school_id
        - user_metadata (JSONB): Custom user data
    """
    pass
