"""
Celery Configuration for Background Tasks
Grading, report generation, notifications, etc.
"""
from celery import Celery
from celery.schedules import crontab

from app.core.config import settings
from app.core.logger import logger

# ============================================================================
# CELERY APP
# ============================================================================

celery_app = Celery(
    "ionia_lms",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
    include=[
        "app.tasks.background_tasks",
        "app.tasks.notification_tasks"
    ]
)

# ============================================================================
# CELERY CONFIGURATION
# ============================================================================

celery_app.conf.update(
    # Task settings
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    
    # Task result settings
    result_expires=3600,  # 1 hour
    result_backend_transport_options={"master_name": "mymaster"},
    
    # Task execution settings
    task_track_started=True,
    task_time_limit=300,  # 5 minutes max
    task_soft_time_limit=240,  # 4 minutes soft limit
    
    # Worker settings
    worker_prefetch_multiplier=4,
    worker_max_tasks_per_child=1000,
    
    # Retry settings
    task_acks_late=True,
    task_reject_on_worker_lost=True,
    
    # Beat schedule (periodic tasks)
    beat_schedule={
        "cleanup-expired-tokens": {
            "task": "app.tasks.background_tasks.cleanup_expired_tokens",
            "schedule": crontab(minute=0, hour="*/6"),  # Every 6 hours
        },
        "generate-daily-analytics": {
            "task": "app.tasks.background_tasks.generate_daily_analytics",
            "schedule": crontab(minute=0, hour=1),  # 1 AM daily
        },
        "send-pending-notifications": {
            "task": "app.tasks.notification_tasks.send_pending_notifications",
            "schedule": crontab(minute="*/5"),  # Every 5 minutes
        },
    }
)

logger.info("Celery app configured successfully")


# ============================================================================
# CELERY SIGNALS
# ============================================================================

@celery_app.task(bind=True)
def debug_task(self):
    """Debug task to test Celery"""
    logger.info(f"Request: {self.request!r}")
    return f"Task executed: {self.request.id}"


__all__ = ["celery_app", "debug_task"]

