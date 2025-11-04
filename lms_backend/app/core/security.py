"""
Security utilities for JWT validation and user authentication.
Implements the lightweight FastAPI layer that validates Supabase JWTs.
"""
from typing import Optional, Dict, Any, List
from fastapi import HTTPException, status, Depends, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt
from jwt import PyJWTError
from datetime import datetime, timedelta
from .config import settings


# HTTP Bearer token scheme
security = HTTPBearer()


class JWTValidator:
    """
    Validates and decodes Supabase JWT tokens.
    Does NOT decide permissions - only validates and extracts claims.
    """
    
    @staticmethod
    def decode_token(token: str) -> Dict[str, Any]:
        """
        Decode and validate Supabase JWT token.
        
        Args:
            token: JWT token string
            
        Returns:
            Decoded token payload with user_id, email, roles, school_id, etc.
            
        Raises:
            HTTPException: If token is invalid, expired, or malformed
        """
        try:
            # Decode JWT using Supabase JWT secret
            payload = jwt.decode(
                token,
                settings.SUPABASE_JWT_SECRET,
                algorithms=[settings.JWT_ALGORITHM],
                audience="authenticated"  # Supabase audience
            )
            
            # Validate expiration
            exp = payload.get("exp")
            if exp and datetime.fromtimestamp(exp) < datetime.utcnow():
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Token has expired"
                )
            
            return payload
            
        except jwt.ExpiredSignatureError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token has expired"
            )
        except jwt.InvalidTokenError as e:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Invalid token: {str(e)}"
            )
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Could not validate credentials: {str(e)}"
            )
    
    @staticmethod
    def extract_user_id(payload: Dict[str, Any]) -> str:
        """Extract user_id from JWT payload"""
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token missing user ID"
            )
        return user_id
    
    @staticmethod
    def extract_roles(payload: Dict[str, Any]) -> List[str]:
        """
        Extract roles from JWT app_metadata.
        Supports both single role and multiple roles.
        """
        app_metadata = payload.get("app_metadata", {})
        roles = app_metadata.get("roles", [])
        
        # Handle single role string
        if isinstance(roles, str):
            return [roles]
        
        # Handle role array
        if isinstance(roles, list):
            return roles
        
        # Default to empty list (no roles)
        return []
    
    @staticmethod
    def extract_school_id(payload: Dict[str, Any]) -> Optional[str]:
        """Extract school_id from JWT app_metadata"""
        app_metadata = payload.get("app_metadata", {})
        return app_metadata.get("school_id")
    
    @staticmethod
    def extract_email(payload: Dict[str, Any]) -> Optional[str]:
        """Extract email from JWT payload"""
        return payload.get("email")


class CurrentUser:
    """
    Represents the authenticated current user with their permissions.
    This is the user context passed through FastAPI dependencies.
    """
    
    def __init__(self, payload: Dict[str, Any]):
        self.payload = payload
        self.user_id = JWTValidator.extract_user_id(payload)
        self.email = JWTValidator.extract_email(payload)
        self.roles = JWTValidator.extract_roles(payload)
        self.school_id = JWTValidator.extract_school_id(payload)
        
        # Additional metadata
        self.app_metadata = payload.get("app_metadata", {})
        self.user_metadata = payload.get("user_metadata", {})
    
    def has_role(self, role: str) -> bool:
        """Check if user has a specific role"""
        return role in self.roles
    
    def has_any_role(self, roles: List[str]) -> bool:
        """Check if user has any of the specified roles"""
        return any(role in self.roles for role in roles)
    
    def has_all_roles(self, roles: List[str]) -> bool:
        """Check if user has all of the specified roles"""
        return all(role in self.roles for role in roles)
    
    def is_school_admin(self) -> bool:
        """Check if user is a school admin"""
        return "school_admin" in self.roles
    
    def is_principal(self) -> bool:
        """Check if user is a principal"""
        return "principal" in self.roles
    
    def is_teacher(self) -> bool:
        """Check if user is a teacher or class teacher"""
        return "teacher" in self.roles or "class_teacher" in self.roles
    
    def is_class_teacher(self) -> bool:
        """Check if user is a class teacher"""
        return "class_teacher" in self.roles
    
    def is_student(self) -> bool:
        """Check if user is a student"""
        return "student" in self.roles
    
    def get_highest_role_level(self) -> int:
        """Get the highest role level user has (for hierarchy checks)"""
        from app.core.constants import UserRole
        role_levels = []
        for role_str in self.roles:
            try:
                role = UserRole(role_str)
                role_levels.append(role.get_level())
            except ValueError:
                continue
        return max(role_levels) if role_levels else 0
    
    def meets_minimum_role(self, min_role: str) -> bool:
        """Check if user meets minimum role requirement in hierarchy"""
        from app.core.constants import UserRole
        try:
            required_role = UserRole(min_role)
            required_level = required_role.get_level()
            return self.get_highest_role_level() >= required_level
        except ValueError:
            return False
    
    def can_access_school(self, school_id: str) -> bool:
        """Check if user can access data from a specific school"""
        # School admins can access all schools
        if self.is_school_admin():
            return True
        # Others can only access their own school
        return self.school_id == school_id
    
    def can_manage_user(self, target_user_role: str) -> bool:
        """Check if user can manage another user based on role hierarchy"""
        from app.core.constants import UserRole
        try:
            target_role = UserRole(target_user_role)
            # Can only manage users with lower role level
            return self.get_highest_role_level() > target_role.get_level()
        except ValueError:
            return False
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for logging/debugging"""
        return {
            "user_id": self.user_id,
            "email": self.email,
            "roles": self.roles,
            "school_id": self.school_id
        }


# ==================== FastAPI Dependencies ====================

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
        @app.get("/protected")
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
    except:
        return None


# ==================== Role-Based Access Dependencies ====================

class RoleChecker:
    """
    Dependency class for role-based access control.
    Creates reusable dependencies for different role requirements.
    """
    
    def __init__(self, allowed_roles: List[str]):
        self.allowed_roles = allowed_roles
    
    def __call__(self, user: CurrentUser = Depends(get_current_user)) -> CurrentUser:
        """
        Check if user has any of the allowed roles.
        Raises HTTPException if not authorized.
        """
        if not user.has_any_role(self.allowed_roles):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Insufficient permissions. Required roles: {', '.join(self.allowed_roles)}"
            )
        return user


# Pre-configured role checkers for common use cases
require_admin = RoleChecker(["admin"])
require_principal = RoleChecker(["admin", "principal"])
require_teacher = RoleChecker(["admin", "principal", "teacher", "class_teacher"])
require_student = RoleChecker(["student"])


def require_roles(roles: List[str]):
    """
    Create a custom role checker dependency.
    
    Usage:
        @app.get("/custom")
        async def custom_route(user: CurrentUser = Depends(require_roles(["teacher", "principal"]))):
            return {"message": "Access granted"}
    """
    return RoleChecker(roles)


class SchoolAccessChecker:
    """
    Dependency for checking school-level access.
    Ensures users can only access data from their own school (unless admin).
    """
    
    def __init__(self, school_id_param: str = "school_id"):
        self.school_id_param = school_id_param
    
    def __call__(
        self, 
        request: Request,
        user: CurrentUser = Depends(get_current_user)
    ) -> CurrentUser:
        """
        Verify user can access the requested school's data.
        """
        # Get school_id from path params or query params
        school_id = (
            request.path_params.get(self.school_id_param) or
            request.query_params.get(self.school_id_param)
        )
        
        if not school_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Missing required parameter: {self.school_id_param}"
            )
        
        if not user.can_access_school(school_id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied to this school's data"
            )
        
        return user


# Pre-configured school access checker
require_school_access = SchoolAccessChecker()

