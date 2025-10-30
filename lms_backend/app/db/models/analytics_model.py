"""
Analytics Model
Progress tracking and insights
"""
from sqlalchemy import Column, String, Text, Integer, TIMESTAMP, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from datetime import datetime
import uuid

from app.db.base import Base


class Analytics(Base):
    """
    Analytics & Metrics
    Performance, engagement, and progress tracking
    """
    __tablename__ = "analytics"
    
    analytics_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    school_id = Column(Text, ForeignKey('schools.school_id'), nullable=False)
    class_id = Column(UUID(as_uuid=True), ForeignKey('classes.class_id'))
    student_id = Column(UUID(as_uuid=True))
    teacher_id = Column(UUID(as_uuid=True))
    
    # Metric type
    metric_type = Column(Text, nullable=False)  # performance, engagement, progress, mastery
    metric_name = Column(Text, nullable=False)  # avg_score, completion_rate, time_saved
    
    # Metric value (flexible JSON structure)
    metric_value = Column(JSONB, nullable=False)
    
    # Dimensions
    subject = Column(Text)
    class_level = Column(Integer)
    time_period = Column(Text)  # daily, weekly, monthly
    
    # Timestamps
    recorded_at = Column(TIMESTAMP, default=datetime.utcnow)
    created_at = Column(TIMESTAMP, default=datetime.utcnow)
    
    def __repr__(self):
        return f"<Analytics(id={self.analytics_id}, type={self.metric_type}, name={self.metric_name})>"

