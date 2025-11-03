"""
Central Configuration Management
All secrets and environment variables managed here using Pydantic Settings.
Single source of truth for all configuration.
"""
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional, List
from pydantic import Field, field_validator


class Settings(BaseSettings):
    """
    Application settings loaded from environment variables.
    
    Create a .env file in the project root with these variables.
    See .env.example for reference.
    """
    
    # ============================================================================
    # APPLICATION
    # ============================================================================
    APP_NAME: str = Field(default="Ionia LMS Backend")
    APP_VERSION: str = Field(default="1.0.0")
    DEBUG: bool = Field(default=False)
    ENVIRONMENT: str = Field(default="development")  # development, staging, production
    API_V1_PREFIX: str = Field(default="/api/v1")
    
    # ============================================================================
    # SUPABASE
    # ============================================================================
    SUPABASE_URL: Optional[str] = Field(default=None)
    SUPABASE_KEY: Optional[str] = Field(default=None)  # Anon key
    SUPABASE_SERVICE_ROLE_KEY: Optional[str] = Field(default=None)  # Admin key
    SUPABASE_JWT_SECRET: Optional[str] = Field(default=None)  # JWT verification
    
    # ============================================================================
    # JWT & AUTHENTICATION
    # ============================================================================
    JWT_ALGORITHM: str = Field(default="HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(default=30)
    REFRESH_TOKEN_EXPIRE_DAYS: int = Field(default=7)
    
    # ============================================================================
    # DATABASE (Supabase Postgres)
    # ============================================================================
    DATABASE_URL: Optional[str] = Field(default=None)  # postgresql://...
    ASYNC_DATABASE_URL: Optional[str] = Field(default=None)  # Auto-generated if not provided
    DB_POOL_SIZE: int = Field(default=10)
    DB_MAX_OVERFLOW: int = Field(default=20)
    
    # ============================================================================
    # GOOGLE OAUTH (Optional)
    # ============================================================================
    GOOGLE_CLIENT_ID: Optional[str] = Field(default=None)
    GOOGLE_CLIENT_SECRET: Optional[str] = Field(default=None)
    
    # ============================================================================
    # AI & LLM STACK
    # ============================================================================
    
    # LiteLLM Configuration
    LITELLM_MODEL: str = Field(default="gemini/gemini-1.5-flash")
    LITELLM_FALLBACK_MODEL: str = Field(default="deepseek/deepseek-r1")
    LITELLM_API_BASE: Optional[str] = Field(default=None)
    
    # API Keys for LLM Providers
    GOOGLE_API_KEY: Optional[str] = Field(default=None)  # For Gemini
    OPENAI_API_KEY: Optional[str] = Field(default=None)
    ANTHROPIC_API_KEY: Optional[str] = Field(default=None)
    GROQ_API_KEY: Optional[str] = Field(default=None)
    DEEPSEEK_API_KEY: Optional[str] = Field(default=None)
    
    # Google Cloud Vision (OCR)
    GOOGLE_CLOUD_PROJECT_ID: Optional[str] = Field(default=None)
    GOOGLE_APPLICATION_CREDENTIALS: Optional[str] = Field(default=None)  # Path to service account JSON
    
    # Qdrant Vector Database
    QDRANT_URL: str = Field(default="http://localhost:6333")
    QDRANT_API_KEY: Optional[str] = Field(default=None)
    QDRANT_COLLECTION_NAME: str = Field(default="cbse_questions")
    
    # Sentence Transformers
    EMBEDDING_MODEL: str = Field(default="all-MiniLM-L6-v2")
    EMBEDDING_DIMENSION: int = Field(default=384)
    
    # PraisonAI Agents
    PRAISONAI_ENABLED: bool = Field(default=True)
    
    # ============================================================================
    # REDIS & CELERY (Background Tasks)
    # ============================================================================
    REDIS_URL: str = Field(default="redis://localhost:6379/0")
    CELERY_BROKER_URL: Optional[str] = Field(default=None)  # Defaults to REDIS_URL
    CELERY_RESULT_BACKEND: Optional[str] = Field(default=None)  # Defaults to REDIS_URL
    
    # ============================================================================
    # CORS & SECURITY
    # ============================================================================
    CORS_ORIGINS: str = Field(default="http://localhost:3000,http://localhost:5173")
    ALLOWED_HOSTS: List[str] = Field(default=["*"])
    
    # ============================================================================
    # FILE UPLOAD & STORAGE
    # ============================================================================
    MAX_UPLOAD_SIZE: int = Field(default=10 * 1024 * 1024)  # 10MB
    ALLOWED_EXTENSIONS: str = Field(default=".pdf,.jpg,.jpeg,.png,.doc,.docx")
    SUPABASE_STORAGE_BUCKET: str = Field(default="assignments")
    
    # ============================================================================
    # RATE LIMITING
    # ============================================================================
    RATE_LIMIT_PER_MINUTE: int = Field(default=60)
    RATE_LIMIT_PER_HOUR: int = Field(default=1000)
    
    # ============================================================================
    # LOGGING
    # ============================================================================
    LOG_LEVEL: str = Field(default="INFO")  # DEBUG, INFO, WARNING, ERROR, CRITICAL
    LOG_FILE: str = Field(default="logs/backend.log")
    LOG_ROTATION: str = Field(default="10 MB")
    LOG_RETENTION: str = Field(default="30 days")
    
    # ============================================================================
    # MONITORING & ANALYTICS
    # ============================================================================
    ENABLE_AUDIT_LOGGING: bool = Field(default=True)
    ENABLE_PERFORMANCE_MONITORING: bool = Field(default=True)
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )
    
    @field_validator("ASYNC_DATABASE_URL", mode="before")
    @classmethod
    def generate_async_database_url(cls, v, info):
        """Auto-generate async database URL if not provided"""
        if v:
            return v
        database_url = info.data.get("DATABASE_URL")
        if database_url:
            return database_url.replace(
                "postgresql://", "postgresql+asyncpg://"
            ).replace(
                "postgres://", "postgresql+asyncpg://"
            )
        return None
    
    @field_validator("CELERY_BROKER_URL", mode="before")
    @classmethod
    def default_celery_broker(cls, v, info):
        """Default Celery broker to Redis URL"""
        return v or info.data.get("REDIS_URL")
    
    @field_validator("CELERY_RESULT_BACKEND", mode="before")
    @classmethod
    def default_celery_backend(cls, v, info):
        """Default Celery result backend to Redis URL"""
        return v or info.data.get("REDIS_URL")
    
    @property
    def allowed_origins_list(self) -> List[str]:
        """Parse CORS origins into a list"""
        if isinstance(self.CORS_ORIGINS, str):
            return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]
        return self.CORS_ORIGINS
    
    @property
    def allowed_extensions_list(self) -> List[str]:
        """Parse allowed file extensions into a list"""
        if isinstance(self.ALLOWED_EXTENSIONS, str):
            return [ext.strip() for ext in self.ALLOWED_EXTENSIONS.split(",")]
        return self.ALLOWED_EXTENSIONS
    
    @property
    def is_development(self) -> bool:
        """Check if running in development mode"""
        return self.ENVIRONMENT.lower() in ["development", "dev", "local"]
    
    @property
    def is_production(self) -> bool:
        """Check if running in production mode"""
        return self.ENVIRONMENT.lower() in ["production", "prod"]


# Singleton instance - SINGLE SOURCE OF TRUTH
settings = Settings()


def get_settings() -> Settings:
    """
    Dependency injection for settings.
    Use this in FastAPI routes: settings = Depends(get_settings)
    """
    return settings


# ============================================================================
# CONVENIENCE EXPORTS (Lazy - only created after settings initialization)
# ============================================================================
# Note: These are properties that access settings instance
# Access via settings.SUPABASE_URL instead of module-level SUPABASE_URL

__all__ = ["settings", "get_settings", "Settings"]
