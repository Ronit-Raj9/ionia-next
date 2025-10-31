"""
Submission Model
Student assignment submissions (text, photo, file)
"""
from sqlalchemy import Column, String, Text, Integer, TIMESTAMP, ForeignKey, DECIMAL
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from app.db.base import Base


class Submission(Base):
    """
    Student Submission
    Text, photo, or file uploads with OCR support
    """
    __tablename__ = "submissions"
    
    submission_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    assignment_id = Column(UUID(as_uuid=True), ForeignKey('assignments.assignment_id'), nullable=False)
    student_assignment_id = Column(UUID(as_uuid=True), ForeignKey('student_assignments.student_assignment_id'))
    student_id = Column(UUID(as_uuid=True), nullable=False)
    school_id = Column(Text, ForeignKey('schools.school_id'), nullable=False)
    
    # Submission content
    submission_type = Column(Text)  # text, photo, file
    content = Column(Text)  # Text answers
    files = Column(JSONB, default=[])  # Array of file URLs
    
    # OCR results (for photo submissions)
    ocr_text = Column(Text)
    ocr_confidence = Column(DECIMAL(5, 2))
    
    # Metadata
    time_taken = Column(Integer)  # minutes
    device_type = Column(Text)  # web, mobile, offline
    
    # Status
    status = Column(Text, default='submitted')  # submitted, grading, graded, returned, flagged
    
    # Timestamps
    submitted_at = Column(TIMESTAMP, default=datetime.utcnow)
    graded_at = Column(TIMESTAMP)
    created_at = Column(TIMESTAMP, default=datetime.utcnow)
    
    # Relationships
    assignment = relationship("Assignment", back_populates="submissions")
    grades = relationship("Grade", back_populates="submission")
    
    def __repr__(self):
        return f"<Submission(submission_id={self.submission_id}, student={self.student_id})>"

