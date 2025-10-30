"""
Supabase Client Manager
Centralized Supabase client configuration with RLS enforcement.
"""
from supabase import create_client, Client
from typing import Optional
from .config import settings


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
            cls._anon_client = create_client(
                supabase_url=settings.SUPABASE_URL,
                supabase_key=settings.SUPABASE_KEY
            )
        return cls._anon_client
    
    @classmethod
    def get_service_client(cls) -> Client:
        """
        Get Supabase client with service role key (bypasses RLS).
        ⚠️ WARNING: Use ONLY for admin operations and system tasks.
        This bypasses Row Level Security - use with extreme caution.
        """
        if cls._service_client is None:
            cls._service_client = create_client(
                supabase_url=settings.SUPABASE_URL,
                supabase_key=settings.SUPABASE_SERVICE_ROLE_KEY
            )
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
        client = create_client(
            supabase_url=settings.SUPABASE_URL,
            supabase_key=settings.SUPABASE_KEY
        )
        # Set the user's JWT for RLS context
        client.postgrest.auth(access_token)
        return client


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

