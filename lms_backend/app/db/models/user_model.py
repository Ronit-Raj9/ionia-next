"""
User, Profile, and School Models
Core user management and school structure
"""
from sqlalchemy import Column, String, Text, Integer, TIMESTAMP, ARRAY, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from app.db.base import Base


class Profile(Base):
    """
    User profile extending Supabase auth.users
    Stores roles, school affiliation, and user metadata
    """
    __tablename__ = "profiles"
    
    user_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(Text, nullable=False, unique=True)
    full_name = Column(Text)
    phone = Column(Text)
    
    # Role & School
    roles = Column(ARRAY(Text), default=[])  # ['student', 'teacher', 'admin']
    school_id = Column(Text, ForeignKey('schools.school_id'))
    
    # User metadata
    status = Column(Text, default='active')  # active, inactive, suspended, pending
    user_type = Column(Text)  # teacher, student, admin
    
    # Timestamps
    created_at = Column(TIMESTAMP, default=datetime.utcnow)
    updated_at = Column(TIMESTAMP, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_login = Column(TIMESTAMP)
    
    # Relationships
    school = relationship("School", back_populates="profiles")
    
    def __repr__(self):
        return f"<Profile(user_id={self.user_id}, email={self.email}, roles={self.roles})>"


class School(Base):
    """
    School/Institution
    Multi-tenant isolation unit
    """
    __tablename__ = "schools"
    
    school_id = Column(Text, primary_key=True)
    school_name = Column(Text, nullable=False)
    school_type = Column(Text)  # primary, secondary, high_school
    
    # Location
    address = Column(Text)
    city = Column(Text)
    state = Column(Text)
    pincode = Column(Text)
    
    # Contact
    contact_email = Column(Text)
    contact_phone = Column(Text)
    principal_name = Column(Text)
    
    # Metadata
    board = Column(Text, default='CBSE')
    classes_offered = Column(ARRAY(Integer))  # [6, 7, 8, 9, 10]
    total_students = Column(Integer, default=0)
    total_teachers = Column(Integer, default=0)
    
    # Status
    status = Column(Text, default='active')
    subscription_plan = Column(Text, default='trial')
    subscription_expires_at = Column(TIMESTAMP)
    
    # Timestamps
    created_at = Column(TIMESTAMP, default=datetime.utcnow)
    updated_at = Column(TIMESTAMP, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    profiles = relationship("Profile", back_populates="school")
    classes = relationship("Class", back_populates="school")
    
    def __repr__(self):
        return f"<School(school_id={self.school_id}, name={self.school_name})>"


# Placeholder for compatibility (Supabase handles auth.users)
class User:
    """
    User authentication handled by Supabase auth.users
    This is a placeholder class for reference.
    Use Profile model for extended user data.
    """
    pass

