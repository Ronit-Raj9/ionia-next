"""
Supabase Client Manager
Centralized Supabase client configuration with RLS enforcement.
Renamed from supabase.py to match the architecture
"""
from supabase import create_client, Client
from typing import Optional

from app.core.config import settings
from app.core.logger import get_logger

logger = get_logger(__name__)


class SupabaseClientManager:
    """
    Manages Supabase client instances.
    Provides both anon (RLS-enforced) and service role (admin) clients.
    """
    
    _anon_client: Optional[Client] = None
    _service_client: Optional[Client] = None
    
    @classmethod
    def get_anon_client(cls) -> Client:
        """
        Get Supabase client with anon key (RLS enforced).
        Use this for all user-facing operations - RLS policies will be enforced.
        """
        if cls._anon_client is None:
            try:
                cls._anon_client = create_client(
                    supabase_url=settings.SUPABASE_URL,
                    supabase_key=settings.SUPABASE_KEY
                )
                logger.debug("Supabase anon client initialized")
            except Exception as e:
                logger.error(f"Failed to initialize Supabase anon client: {e}")
                raise
        return cls._anon_client
    
    @classmethod
    def get_service_client(cls) -> Client:
        """
        Get Supabase client with service role key (bypasses RLS).
        ⚠️ WARNING: Use ONLY for admin operations and system tasks.
        This bypasses Row Level Security - use with extreme caution.
        """
        if cls._service_client is None:
            try:
                cls._service_client = create_client(
                    supabase_url=settings.SUPABASE_URL,
                    supabase_key=settings.SUPABASE_SERVICE_ROLE_KEY
                )
                logger.debug("Supabase service client initialized")
            except Exception as e:
                logger.error(f"Failed to initialize Supabase service client: {e}")
                raise
        return cls._service_client
    
    @classmethod
    def get_user_client(cls, access_token: str) -> Client:
        """
        Get Supabase client authenticated with user's JWT token.
        This ensures RLS policies use the user's context.
        
        Args:
            access_token: User's JWT token from Supabase auth
            
        Returns:
            Client configured with user's auth context
        """
        try:
            client = create_client(
                supabase_url=settings.SUPABASE_URL,
                supabase_key=settings.SUPABASE_KEY
            )
            # Set the user's JWT for RLS context
            client.postgrest.auth(access_token)
            return client
        except Exception as e:
            logger.error(f"Failed to create user-specific Supabase client: {e}")
            raise


# Convenience functions for direct use
def get_supabase_client() -> Client:
    """Get standard RLS-enforced Supabase client"""
    return SupabaseClientManager.get_anon_client()


def get_supabase_admin() -> Client:
    """Get admin Supabase client (bypasses RLS) - USE WITH CAUTION"""
    return SupabaseClientManager.get_service_client()


def get_supabase_for_user(token: str) -> Client:
    """Get Supabase client with user's auth context"""
    return SupabaseClientManager.get_user_client(token)

