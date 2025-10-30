"""
Logging Configuration using Loguru
Structured, colorized logging with rotation and retention
"""
import sys
from pathlib import Path
from loguru import logger

from app.core.config import settings

# Remove default logger
logger.remove()

# ============================================================================
# CONSOLE LOGGING (Development)
# ============================================================================

if settings.DEBUG:
    logger.add(
        sys.stdout,
        format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - <level>{message}</level>",
        level=settings.LOG_LEVEL,
        colorize=True,
    )

# ============================================================================
# FILE LOGGING (Production)
# ============================================================================

# Ensure logs directory exists
log_path = Path(settings.LOG_FILE)
log_path.parent.mkdir(parents=True, exist_ok=True)

# Main application log
logger.add(
    settings.LOG_FILE,
    format="{time:YYYY-MM-DD HH:mm:ss} | {level: <8} | {name}:{function}:{line} - {message}",
    level=settings.LOG_LEVEL,
    rotation=settings.LOG_ROTATION,
    retention=settings.LOG_RETENTION,
    compression="zip",
    enqueue=True,  # Async logging
    backtrace=True,
    diagnose=True,
)

# Error log (separate file for errors only)
logger.add(
    log_path.parent / "error.log",
    format="{time:YYYY-MM-DD HH:mm:ss} | {level: <8} | {name}:{function}:{line} - {message}",
    level="ERROR",
    rotation=settings.LOG_ROTATION,
    retention=settings.LOG_RETENTION,
    compression="zip",
    enqueue=True,
    backtrace=True,
    diagnose=True,
)

# ============================================================================
# AUDIT LOG (Ethical Monitoring)
# ============================================================================

if settings.ENABLE_AUDIT_LOGGING:
    audit_log_path = log_path.parent / "audit.log"
    logger.add(
        audit_log_path,
        format="{time:YYYY-MM-DD HH:mm:ss} | AUDIT | {message}",
        level="INFO",
        rotation="1 day",
        retention="90 days",  # Keep audit logs for 90 days
        compression="zip",
        enqueue=True,
        filter=lambda record: "AUDIT" in record["extra"],
    )


# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def log_audit(action: str, user_id: str, resource_type: str, resource_id: str, **kwargs):
    """
    Log audit trail for ethical monitoring.
    
    Args:
        action: Action performed (e.g., "ai_grading", "manual_override")
        user_id: User performing the action
        resource_type: Type of resource (e.g., "assignment", "grade")
        resource_id: ID of the resource
        **kwargs: Additional context
    """
    logger.bind(AUDIT=True).info(
        f"action={action} user_id={user_id} resource_type={resource_type} "
        f"resource_id={resource_id} {' '.join(f'{k}={v}' for k, v in kwargs.items())}"
    )


def log_ai_operation(
    model: str,
    operation: str,
    input_text: str,
    output_text: str,
    confidence: float = None,
    **kwargs
):
    """
    Log AI model operations for transparency.
    
    Args:
        model: AI model used (e.g., "gemini-1.5-flash")
        operation: Operation type (e.g., "grading", "question_generation")
        input_text: Input prompt (truncated if too long)
        output_text: Output response (truncated if too long)
        confidence: Confidence score if available
        **kwargs: Additional metadata
    """
    # Truncate long text
    input_preview = input_text[:200] + "..." if len(input_text) > 200 else input_text
    output_preview = output_text[:200] + "..." if len(output_text) > 200 else output_text
    
    log_audit(
        action=f"ai_{operation}",
        user_id="system",
        resource_type="ai_operation",
        resource_id=model,
        input=input_preview,
        output=output_preview,
        confidence=confidence,
        **kwargs
    )


# Export logger instance
__all__ = ["logger", "log_audit", "log_ai_operation"]
