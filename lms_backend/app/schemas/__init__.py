"""
Pydantic schemas for request/response validation
"""
from .auth import (
    UserLogin,
    GoogleAuthRequest,
    UserRegister,
    AuthTokens,
    UserInfo,
    RoleAssignment,
    RoleUpdate,
    SchoolAssignment,
    TokenRefresh,
    PasswordReset,
    PasswordResetConfirm,
    UserProfile,
    BulkRoleAssignment
)

__all__ = [
    "UserLogin",
    "GoogleAuthRequest",
    "UserRegister",
    "AuthTokens",
    "UserInfo",
    "RoleAssignment",
    "RoleUpdate",
    "SchoolAssignment",
    "TokenRefresh",
    "PasswordReset",
    "PasswordResetConfirm",
    "UserProfile",
    "BulkRoleAssignment"
]

