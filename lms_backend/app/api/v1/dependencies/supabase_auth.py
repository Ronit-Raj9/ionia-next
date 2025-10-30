"""
Supabase Authentication Dependencies
JWT validation and user extraction for FastAPI routes
"""
from typing import Optional
from fastapi import Depends, Request, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from app.core.security import JWTValidator, CurrentUser
from app.core.logger import get_logger

logger = get_logger(__name__)

# HTTP Bearer token scheme
security = HTTPBearer()


async def get_token(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> str:
    """
    Extract and return JWT token from Authorization header.
    Dependency that gets the token from "Bearer <token>".
    """
    return credentials.credentials


async def get_current_user(token: str = Depends(get_token)) -> CurrentUser:
    """
    Main authentication dependency.
    Validates JWT and returns CurrentUser with roles and permissions.
    
    Usage in routes:
        @router.get("/protected")
        async def protected_route(user: CurrentUser = Depends(get_current_user)):
            return {"user_id": user.user_id, "roles": user.roles}
    """
    payload = JWTValidator.decode_token(token)
    return CurrentUser(payload)


async def get_current_user_optional(
    request: Request
) -> Optional[CurrentUser]:
    """
    Optional authentication - returns user if authenticated, None otherwise.
    Useful for endpoints that work differently for authenticated vs anonymous users.
    """
    try:
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            return None
        
        token = auth_header.replace("Bearer ", "")
        payload = JWTValidator.decode_token(token)
        return CurrentUser(payload)
    except Exception as e:
        logger.debug(f"Optional auth failed: {e}")
        return None


async def get_current_active_user(
    user: CurrentUser = Depends(get_current_user)
) -> CurrentUser:
    """
    Get current user and verify they are active.
    Additional layer to check user status beyond JWT validation.
    """
    # Could add additional checks here like user status from database
    # For now, if JWT is valid, user is considered active
    return user

