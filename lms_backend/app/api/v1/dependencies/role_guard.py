"""
Role-Based Access Control Guards
Dependencies for protecting routes based on user roles
"""
from typing import List
from fastapi import Depends, HTTPException, status, Request

from app.core.security import CurrentUser
from app.core.constants import UserRole, ResponseMessage
from app.api.v1.dependencies.supabase_auth import get_current_user
from app.core.logger import get_logger

logger = get_logger(__name__)


class RoleGuard:
    """
    Dependency class for role-based access control.
    Creates reusable dependencies for different role requirements.
    """
    
    def __init__(self, allowed_roles: List[UserRole]):
        self.allowed_roles = allowed_roles
    
    def __call__(self, user: CurrentUser = Depends(get_current_user)) -> CurrentUser:
        """
        Check if user has any of the allowed roles.
        Raises HTTPException if not authorized.
        """
        if not user.has_any_role([role.value for role in self.allowed_roles]):
            logger.warning(
                f"Access denied for user {user.user_id}. "
                f"Required roles: {[r.value for r in self.allowed_roles]}, "
                f"User roles: {user.roles}"
            )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"{ResponseMessage.PERMISSION_DENIED}. Required roles: {', '.join([r.value for r in self.allowed_roles])}"
            )
        return user


class SchoolAccessGuard:
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
            logger.warning(
                f"School access denied for user {user.user_id}. "
                f"Requested school: {school_id}, User school: {user.school_id}"
            )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied to this school's data"
            )
        
        return user


# ==================== Hierarchical Role Guard ====================

class MinimumRoleGuard:
    """
    Dependency for hierarchical role checking.
    Allows any role at or above the minimum role in hierarchy.
    """
    
    def __init__(self, min_role: UserRole):
        self.min_role = min_role
    
    def __call__(self, user: CurrentUser = Depends(get_current_user)) -> CurrentUser:
        """
        Check if user meets minimum role requirement.
        """
        if not user.meets_minimum_role(self.min_role.value):
            logger.warning(
                f"Role hierarchy violation for user {user.user_id}. "
                f"Required minimum: {self.min_role.value}, User highest: {user.roles}"
            )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Insufficient role level. Minimum required: {self.min_role.value}"
            )
        return user


# ==================== Pre-configured Role Guards ====================

# School Admin only (highest level)
require_school_admin = RoleGuard([UserRole.SCHOOL_ADMIN])
require_admin = require_school_admin  # Alias for compatibility

# Principal or above
require_principal = RoleGuard([UserRole.SCHOOL_ADMIN, UserRole.PRINCIPAL])

# Class teacher or above  
require_class_teacher = RoleGuard([
    UserRole.SCHOOL_ADMIN,
    UserRole.PRINCIPAL,
    UserRole.CLASS_TEACHER
])

# Any teacher (class teacher or regular) or above
require_teacher = RoleGuard([
    UserRole.SCHOOL_ADMIN,
    UserRole.PRINCIPAL,
    UserRole.CLASS_TEACHER,
    UserRole.TEACHER
])

# Student only
require_student = RoleGuard([UserRole.STUDENT])

# Any authenticated user
require_authenticated = get_current_user

# School access verification
require_school_access = SchoolAccessGuard()

# ==================== Minimum Role Guards (Hierarchical) ====================

# Minimum class teacher level (allows class_teacher, principal, school_admin)
require_min_class_teacher = MinimumRoleGuard(UserRole.CLASS_TEACHER)

# Minimum teacher level (allows teacher, class_teacher, principal, school_admin)
require_min_teacher = MinimumRoleGuard(UserRole.TEACHER)

# Minimum principal level (allows principal, school_admin)
require_min_principal = MinimumRoleGuard(UserRole.PRINCIPAL)


# ==================== Helper Functions ====================

def require_roles(roles: List[UserRole]) -> RoleGuard:
    """
    Create a custom role guard dependency.
    
    Usage:
        @router.get("/custom")
        async def custom_route(
            user: CurrentUser = Depends(require_roles([UserRole.TEACHER, UserRole.PRINCIPAL]))
        ):
            return {"message": "Access granted"}
    """
    return RoleGuard(roles)


def require_any_role(*roles: UserRole) -> RoleGuard:
    """
    Create a role guard that accepts multiple roles.
    Syntactic sugar for require_roles.
    
    Usage:
        @router.get("/custom")
        async def custom_route(
            user: CurrentUser = Depends(require_any_role(UserRole.TEACHER, UserRole.PRINCIPAL))
        ):
            return {"message": "Access granted"}
    """
    return RoleGuard(list(roles))


def require_min_role(min_role: UserRole) -> MinimumRoleGuard:
    """
    Create a minimum role guard for hierarchical access.
    Allows any role at or above the specified minimum role.
    
    Usage:
        @router.get("/analytics")
        async def view_analytics(
            user: CurrentUser = Depends(require_min_role(UserRole.CLASS_TEACHER))
        ):
            # Allows class_teacher, principal, school_admin
            return {"message": "Access granted"}
    """
    return MinimumRoleGuard(min_role)

