"""
Student Profile Model
Learning profiles with performance and personality traits
"""
from sqlalchemy import Column, Text, Integer, TIMESTAMP, ForeignKey, DECIMAL, ARRAY
from sqlalchemy.dialects.postgresql import UUID, JSONB
from datetime import datetime
import uuid

from app.db.base import Base


class StudentProfile(Base):
    """
    Student Learning Profile
    Performance, personality, and learning preferences
    """
    __tablename__ = "student_profiles"
    
    profile_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    student_id = Column(UUID(as_uuid=True), nullable=False)
    school_id = Column(Text, ForeignKey('schools.school_id'), nullable=False)
    class_id = Column(UUID(as_uuid=True), ForeignKey('classes.class_id'))
    
    # Performance metrics
    overall_performance = Column(DECIMAL(5, 2))  # 0-100
    subject_mastery = Column(JSONB, default={})  # {"math": 75, "science": 82}
    
    # Personality traits (from quick quiz)
    personality_type = Column(Text)  # visual, auditory, kinesthetic
    learning_pace = Column(Text)  # slow, medium, fast
    strengths = Column(ARRAY(Text))
    weaknesses = Column(ARRAY(Text))
    
    # Engagement
    engagement_score = Column(DECIMAL(5, 2))
    completion_rate = Column(DECIMAL(5, 2))
    avg_time_per_assignment = Column(Integer)  # minutes
    
    # Preferences
    preferred_difficulty = Column(Text, default='medium')  # easy, medium, hard
    preferred_question_types = Column(ARRAY(Text))
    
    # Profile metadata
    profile_version = Column(Integer, default=1)
    last_updated = Column(TIMESTAMP, default=datetime.utcnow)
    
    # Timestamps
    created_at = Column(TIMESTAMP, default=datetime.utcnow)
    updated_at = Column(TIMESTAMP, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def __repr__(self):
        return f"<StudentProfile(profile_id={self.profile_id}, student={self.student_id})>"

