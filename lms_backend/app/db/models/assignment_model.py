"""
Assignment Models
Assignment creation, distribution, and personalization
"""
from sqlalchemy import Column, String, Text, Integer, TIMESTAMP, Boolean, ForeignKey, DECIMAL
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from app.db.base import Base


class Assignment(Base):
    """
    Assignment (Teacher-created)
    CBSE upload-based assignments with AI personalization
    """
    __tablename__ = "assignments"
    
    assignment_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    school_id = Column(Text, ForeignKey('schools.school_id'), nullable=False)
    class_id = Column(UUID(as_uuid=True), ForeignKey('classes.class_id'), nullable=False)
    teacher_id = Column(UUID(as_uuid=True), nullable=False)
    
    # Assignment details
    title = Column(Text, nullable=False)
    description = Column(Text)
    subject = Column(Text, nullable=False)
    class_level = Column(Integer, nullable=False)
    
    # Upload info (CBSE materials)
    upload_type = Column(Text)  # pdf, image, audio, text
    upload_url = Column(Text)  # Supabase storage URL
    upload_metadata = Column(JSONB, default={})
    
    # Assignment config
    total_questions = Column(Integer)
    questions_per_student = Column(Integer, default=5)
    max_score = Column(DECIMAL(5, 2), default=100)
    passing_score = Column(DECIMAL(5, 2), default=60)
    
    # Personalization
    is_personalized = Column(Boolean, default=True)
    personalization_criteria = Column(JSONB, default={})
    
    # Generated questions (from AI)
    question_pool = Column(JSONB, default=[])
    
    # Dates
    assigned_date = Column(TIMESTAMP, default=datetime.utcnow)
    due_date = Column(TIMESTAMP)
    
    # Status
    status = Column(Text, default='draft')  # draft, published, active, closed
    
    # Timestamps
    created_at = Column(TIMESTAMP, default=datetime.utcnow)
    updated_at = Column(TIMESTAMP, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    class_obj = relationship("Class", back_populates="assignments")
    student_assignments = relationship("StudentAssignment", back_populates="assignment")
    submissions = relationship("Submission", back_populates="assignment")
    grades = relationship("Grade", back_populates="assignment")
    
    def __repr__(self):
        return f"<Assignment(assignment_id={self.assignment_id}, title={self.title})>"


class StudentAssignment(Base):
    """
    Personalized Student Assignment
    Individual student's tailored version of assignment
    """
    __tablename__ = "student_assignments"
    
    student_assignment_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    assignment_id = Column(UUID(as_uuid=True), ForeignKey('assignments.assignment_id'), nullable=False)
    student_id = Column(UUID(as_uuid=True), nullable=False)
    
    # Personalized questions
    questions = Column(JSONB, nullable=False)  # Array of tailored questions
    
    # Status
    status = Column(Text, default='assigned')  # assigned, in_progress, submitted, graded
    
    # Timestamps
    assigned_at = Column(TIMESTAMP, default=datetime.utcnow)
    started_at = Column(TIMESTAMP)
    submitted_at = Column(TIMESTAMP)
    graded_at = Column(TIMESTAMP)
    
    # Relationships
    assignment = relationship("Assignment", back_populates="student_assignments")
    
    def __repr__(self):
        return f"<StudentAssignment(id={self.student_assignment_id}, student={self.student_id})>"

