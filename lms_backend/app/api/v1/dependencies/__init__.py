"""
API Dependencies
Reusable dependencies for authentication, authorization, and validation
"""
from app.api.v1.dependencies.supabase_auth import (
    get_token,
    get_current_user,
    get_current_user_optional,
    get_current_active_user
)
from app.api.v1.dependencies.role_guard import (
    RoleGuard,
    SchoolAccessGuard,
    require_admin,
    require_principal,
    require_teacher,
    require_student,
    require_authenticated,
    require_school_access,
    require_roles,
    require_any_role
)

__all__ = [
    # Auth dependencies
    "get_token",
    "get_current_user",
    "get_current_user_optional",
    "get_current_active_user",
    
    # Role guards
    "RoleGuard",
    "SchoolAccessGuard",
    "require_admin",
    "require_principal",
    "require_teacher",
    "require_student",
    "require_authenticated",
    "require_school_access",
    "require_roles",
    "require_any_role"
]

