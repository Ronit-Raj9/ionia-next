"""
Lesson Plan Model
AI-generated lesson plans
"""
from sqlalchemy import Column, String, Text, Integer, TIMESTAMP, Boolean, ForeignKey, ARRAY
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from app.db.base import Base


class LessonPlan(Base):
    """
    Lesson Plan
    AI-generated weekly lesson plans from CBSE uploads
    """
    __tablename__ = "lesson_plans"
    
    lesson_plan_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    school_id = Column(Text, ForeignKey('schools.school_id'), nullable=False)
    teacher_id = Column(UUID(as_uuid=True), nullable=False)
    class_id = Column(UUID(as_uuid=True), ForeignKey('classes.class_id'))
    
    # Lesson details
    title = Column(Text, nullable=False)
    subject = Column(Text, nullable=False)
    class_level = Column(Integer, nullable=False)
    topic = Column(Text)
    
    # Plan content (AI generated)
    objectives = Column(ARRAY(Text))
    activities = Column(JSONB, default=[])  # Array of activity objects
    materials_needed = Column(ARRAY(Text))
    duration = Column(Integer)  # minutes
    
    # Linked to uploads
    source_upload_id = Column(UUID(as_uuid=True))
    
    # AI generation metadata
    ai_generated = Column(Boolean, default=True)
    generation_prompt = Column(Text)
    
    # Status
    status = Column(Text, default='draft')  # draft, published, in_use, archived
    
    # Timestamps
    week_number = Column(Integer)
    academic_year = Column(Text)
    created_at = Column(TIMESTAMP, default=datetime.utcnow)
    updated_at = Column(TIMESTAMP, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def __repr__(self):
        return f"<LessonPlan(id={self.lesson_plan_id}, title={self.title}, subject={self.subject})>"

