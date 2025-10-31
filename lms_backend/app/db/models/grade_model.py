"""
Grade Model
AI and manual grading with override support
"""
from sqlalchemy import Column, String, Text, Boolean, TIMESTAMP, ForeignKey, DECIMAL
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from app.db.base import Base


class Grade(Base):
    """
    Grade (AI + Manual)
    Auto-grading with teacher override capability
    """
    __tablename__ = "grades"
    
    grade_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    submission_id = Column(UUID(as_uuid=True), ForeignKey('submissions.submission_id'), nullable=False)
    assignment_id = Column(UUID(as_uuid=True), ForeignKey('assignments.assignment_id'), nullable=False)
    student_id = Column(UUID(as_uuid=True), nullable=False)
    teacher_id = Column(UUID(as_uuid=True))
    school_id = Column(Text, ForeignKey('schools.school_id'), nullable=False)
    
    # Grading details
    score = Column(DECIMAL(5, 2), nullable=False)
    max_score = Column(DECIMAL(5, 2), default=100)
    percentage = Column(DECIMAL(5, 2))
    grade = Column(Text)  # A+, A, B+, etc.
    
    # AI grading
    ai_score = Column(DECIMAL(5, 2))
    ai_confidence = Column(DECIMAL(5, 2))
    ai_feedback = Column(Text)
    
    # Manual grading (teacher override)
    manual_override = Column(Boolean, default=False)
    teacher_feedback = Column(Text)
    teacher_score = Column(DECIMAL(5, 2))
    
    # Question-wise breakdown
    question_scores = Column(JSONB, default=[])
    
    # Status
    status = Column(Text, default='graded')  # pending, graded, published, flagged
    flagged = Column(Boolean, default=False)
    flag_reason = Column(Text)
    
    # Timestamps
    graded_at = Column(TIMESTAMP, default=datetime.utcnow)
    published_at = Column(TIMESTAMP)
    created_at = Column(TIMESTAMP, default=datetime.utcnow)
    
    # Relationships
    submission = relationship("Submission", back_populates="grades")
    assignment = relationship("Assignment", back_populates="grades")
    
    def __repr__(self):
        return f"<Grade(grade_id={self.grade_id}, score={self.score}, override={self.manual_override})>"

