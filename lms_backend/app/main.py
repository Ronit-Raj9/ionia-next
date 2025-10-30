"""
Main FastAPI Application Entry Point
LMS Backend with Supabase RBAC
"""
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from contextlib import asynccontextmanager
import logging

from app.core.config import settings
from app.api.v1.routes import auth_routes, protected


# Configure logging
logging.basicConfig(
    level=logging.INFO if settings.is_development else logging.WARNING,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan events - startup and shutdown.
    """
    # Startup
    logger.info(f"Starting {settings.APP_NAME} v{settings.APP_VERSION}")
    logger.info(f"Environment: {settings.ENVIRONMENT}")
    logger.info(f"Supabase URL: {settings.SUPABASE_URL}")
    logger.info("All security handled by Supabase RLS - FastAPI is lightweight proxy")
    
    yield
    
    # Shutdown
    logger.info(f"Shutting down {settings.APP_NAME}")


# Create FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="""
    LMS Backend API with Supabase Row-Level Security (RLS).
    
    ## Security Architecture
    
    - **Authentication**: Supabase Auth (Email/Password + Google OAuth)
    - **Authorization**: Role-Based Access Control (RBAC) via JWT + RLS policies
    - **Multi-Tenancy**: School isolation via school_id in RLS policies
    
    ## Roles
    
    - **admin**: Full system access, cross-school
    - **principal**: School-wide access
    - **teacher/class_teacher**: Class-specific access
    - **student**: Personal data access only
    
    ## How It Works
    
    1. User authenticates → Supabase returns JWT with roles in app_metadata
    2. FastAPI validates JWT → extracts user_id, roles, school_id
    3. Request forwarded to Supabase → RLS policies enforce data access
    4. FastAPI never decides permissions - Supabase RLS does
    
    This ensures security at the database level - unbreakable by API bugs.
    """,
    docs_url="/docs" if settings.is_development else None,  # Disable in production
    redoc_url="/redoc" if settings.is_development else None,
    openapi_url=f"{settings.API_PREFIX}/openapi.json" if settings.is_development else None,
    lifespan=lifespan
)


# ==================== Middleware ====================

# CORS - Allow frontend to call API
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]
)


# Custom request logging middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Log all requests for debugging (development only)"""
    if settings.is_development:
        logger.info(f"{request.method} {request.url.path}")
        
        # Log auth header (redacted)
        auth_header = request.headers.get("Authorization")
        if auth_header:
            logger.debug(f"Auth: Bearer ***{auth_header[-10:]}")
    
    response = await call_next(request)
    return response


# ==================== Exception Handlers ====================

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Handle validation errors with detailed messages"""
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "error": "Validation Error",
            "detail": exc.errors(),
            "body": exc.body
        }
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """Catch-all exception handler"""
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": "Internal Server Error",
            "message": str(exc) if settings.is_development else "An error occurred"
        }
    )


# ==================== Routes ====================

@app.get("/", tags=["Root"])
async def root():
    """API root - health check and info"""
    return {
        "name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "healthy",
        "environment": settings.ENVIRONMENT,
        "docs": f"{settings.API_PREFIX}/docs" if settings.is_development else "disabled",
        "security": {
            "auth_provider": "Supabase",
            "rbac": "Row-Level Security (RLS)",
            "multi_tenancy": "school_id isolation"
        },
        "message": "LMS API is running. All security enforced by Supabase RLS."
    }


@app.get("/health", tags=["Health"])
async def health_check():
    """Health check endpoint for monitoring"""
    return {
        "status": "healthy",
        "version": settings.APP_VERSION,
        "environment": settings.ENVIRONMENT
    }


# Include routers
app.include_router(auth_routes.router, prefix=settings.API_PREFIX)
app.include_router(protected.router, prefix=settings.API_PREFIX)


# ==================== Development Helper ====================

if settings.is_development:
    @app.get(f"{settings.API_PREFIX}/debug/config", tags=["Debug"])
    async def debug_config():
        """Debug endpoint to verify configuration (DEV ONLY)"""
        return {
            "supabase_url": settings.SUPABASE_URL,
            "supabase_key_present": bool(settings.SUPABASE_KEY),
            "service_key_present": bool(settings.SUPABASE_SERVICE_ROLE_KEY),
            "jwt_secret_present": bool(settings.SUPABASE_JWT_SECRET),
            "allowed_origins": settings.allowed_origins_list,
            "environment": settings.ENVIRONMENT,
            "debug_mode": settings.DEBUG
        }


# ==================== App Entry Point ====================

if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.is_development,
        log_level="info" if settings.is_development else "warning"
    )

