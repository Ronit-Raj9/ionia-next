"""
Class and Enrollment Models
Class management and student-teacher associations
"""
from sqlalchemy import Column, String, Text, Integer, TIMESTAMP, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from app.db.base import Base


class Class(Base):
    """
    Class/Section
    Represents a classroom with teacher and students
    """
    __tablename__ = "classes"
    
    class_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    school_id = Column(Text, ForeignKey('schools.school_id'), nullable=False)
    teacher_id = Column(UUID(as_uuid=True))
    
    # Class info
    class_name = Column(Text, nullable=False)  # "Class 8A"
    class_level = Column(Integer, nullable=False)  # 6, 7, 8, 9, 10
    section = Column(Text)  # A, B, C
    subject = Column(Text)  # Mathematics, Science
    
    # Metadata
    total_students = Column(Integer, default=0)
    academic_year = Column(Text)  # "2024-25"
    
    # Status
    status = Column(Text, default='active')
    
    # Timestamps
    created_at = Column(TIMESTAMP, default=datetime.utcnow)
    updated_at = Column(TIMESTAMP, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    school = relationship("School", back_populates="classes")
    assignments = relationship("Assignment", back_populates="class_obj")
    enrollments = relationship("StudentEnrollment", back_populates="class_obj")
    
    def __repr__(self):
        return f"<Class(class_id={self.class_id}, name={self.class_name}, level={self.class_level})>"


class StudentEnrollment(Base):
    """
    Student-Class Enrollment
    Many-to-many relationship between students and classes
    """
    __tablename__ = "student_enrollments"
    
    student_id = Column(UUID(as_uuid=True), primary_key=True)
    class_id = Column(UUID(as_uuid=True), ForeignKey('classes.class_id'), primary_key=True)
    school_id = Column(Text, ForeignKey('schools.school_id'), nullable=False)
    
    # Timestamps
    enrolled_at = Column(TIMESTAMP, default=datetime.utcnow)
    
    # Relationships
    class_obj = relationship("Class", back_populates="enrollments")
    
    def __repr__(self):
        return f"<StudentEnrollment(student_id={self.student_id}, class_id={self.class_id})>"

