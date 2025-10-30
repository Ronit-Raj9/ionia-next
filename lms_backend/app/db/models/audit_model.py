"""
Audit Log Model
Ethical monitoring and compliance tracking
"""
from sqlalchemy import Column, String, Text, Integer, TIMESTAMP, Boolean, ForeignKey, DECIMAL
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
import uuid

from app.db.base import Base


class AuditLog(Base):
    """
    Audit Log
    Tracks all AI operations for ethical monitoring
    """
    __tablename__ = "audit_logs"
    
    log_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # User & context
    user_id = Column(UUID(as_uuid=True))
    school_id = Column(Text, ForeignKey('schools.school_id'))
    
    # Action details
    action_type = Column(Text, nullable=False)  # api_call, ai_inference, grading, override
    resource_type = Column(Text)  # assignment, submission, grade
    resource_id = Column(UUID(as_uuid=True))
    
    # AI-specific logs
    ai_model = Column(Text)  # groq-llama, gemini-pro, gpt-4
    ai_input = Column(Text)
    ai_output = Column(Text)
    ai_confidence = Column(DECIMAL(5, 2))
    
    # Bias detection
    bias_detected = Column(Boolean, default=False)
    bias_type = Column(Text)  # gender, caste, language
    bias_score = Column(DECIMAL(5, 2))
    
    # Request metadata
    ip_address = Column(Text)
    user_agent = Column(Text)
    request_duration = Column(Integer)  # milliseconds
    
    # Status
    status = Column(Text)  # success, failure, flagged
    error_message = Column(Text)
    
    # Timestamps
    timestamp = Column(TIMESTAMP, default=datetime.utcnow)
    
    def __repr__(self):
        return f"<AuditLog(id={self.log_id}, action={self.action_type}, model={self.ai_model})>"

