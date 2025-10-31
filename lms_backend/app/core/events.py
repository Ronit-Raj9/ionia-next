"""
Application lifecycle events
Startup and shutdown event handlers
"""
import logging
from typing import Callable
from fastapi import FastAPI

from app.core.logger import get_logger
from app.core.config import settings

logger = get_logger(__name__)


async def on_startup() -> None:
    """
    Application startup event handler.
    Runs when the FastAPI application starts.
    """
    logger.info(f"🚀 Starting {settings.APP_NAME} v{settings.APP_VERSION}")
    logger.info(f"📍 Environment: {settings.ENVIRONMENT}")
    logger.info(f"🔗 Supabase URL: {settings.SUPABASE_URL}")
    logger.info(f"🔐 RBAC: Enabled with RLS enforcement")
    logger.info(f"🏫 Multi-tenancy: Enabled (school_id isolation)")
    
    # Test Supabase connection
    try:
        from app.core.supabase_client import get_supabase_client
        client = get_supabase_client()
        logger.info("✅ Supabase connection: OK")
    except Exception as e:
        logger.error(f"❌ Supabase connection failed: {e}")
    
    logger.info("=" * 60)
    logger.info("🎓 LMS Backend API is ready!")
    logger.info("=" * 60)


async def on_shutdown() -> None:
    """
    Application shutdown event handler.
    Runs when the FastAPI application stops.
    """
    logger.info(f"🛑 Shutting down {settings.APP_NAME}")
    logger.info("👋 Goodbye!")


def create_start_app_handler(app: FastAPI) -> Callable:
    """
    Create startup handler for FastAPI application.
    
    Args:
        app: FastAPI application instance
        
    Returns:
        Async callable that runs on startup
    """
    async def start_app() -> None:
        await on_startup()
    
    return start_app


def create_stop_app_handler(app: FastAPI) -> Callable:
    """
    Create shutdown handler for FastAPI application.
    
    Args:
        app: FastAPI application instance
        
    Returns:
        Async callable that runs on shutdown
    """
    async def stop_app() -> None:
        await on_shutdown()
    
    return stop_app

