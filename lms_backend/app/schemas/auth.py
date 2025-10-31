"""
Authentication schemas for request/response validation
"""
from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional, List
from datetime import datetime


class UserLogin(BaseModel):
    """Login request with email and password"""
    email: EmailStr
    password: str = Field(..., min_length=6)


class GoogleAuthRequest(BaseModel):
    """Google OAuth authentication request"""
    id_token: str = Field(..., description="Google ID token from frontend")


class UserRegister(BaseModel):
    """User registration request"""
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=100)
    full_name: str = Field(..., min_length=2, max_length=100)
    school_id: Optional[str] = None
    
    @validator('password')
    def validate_password(cls, v):
        """Validate password strength"""
        if len(v) < 6:
            raise ValueError('Password must be at least 6 characters')
        if not any(c.isupper() for c in v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not any(c.isdigit() for c in v):
            raise ValueError('Password must contain at least one digit')
        return v


class AuthTokens(BaseModel):
    """Authentication tokens response"""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int
    user: "UserInfo"


class UserInfo(BaseModel):
    """User information from JWT"""
    user_id: str
    email: str
    roles: List[str] = []
    school_id: Optional[str] = None
    full_name: Optional[str] = None
    created_at: Optional[datetime] = None


class RoleAssignment(BaseModel):
    """Request to assign/update user roles"""
    user_id: str
    roles: List[str] = Field(
        ...,
        description="List of roles to assign",
        example=["teacher", "class_teacher"]
    )
    school_id: str = Field(
        ...,
        description="School ID for multi-tenant isolation"
    )
    
    @validator('roles')
    def validate_roles(cls, v):
        """Validate that roles are from allowed set"""
        allowed_roles = {"admin", "principal", "teacher", "class_teacher", "student"}
        invalid_roles = set(v) - allowed_roles
        if invalid_roles:
            raise ValueError(f"Invalid roles: {', '.join(invalid_roles)}")
        return v


class RoleUpdate(BaseModel):
    """Response after role update"""
    user_id: str
    roles: List[str]
    school_id: str
    updated_at: datetime
    message: str


class SchoolAssignment(BaseModel):
    """Assign user to a school"""
    user_id: str
    school_id: str


class TokenRefresh(BaseModel):
    """Refresh token request"""
    refresh_token: str


class PasswordReset(BaseModel):
    """Password reset request"""
    email: EmailStr


class PasswordResetConfirm(BaseModel):
    """Password reset confirmation"""
    token: str
    new_password: str = Field(..., min_length=6)


class UserProfile(BaseModel):
    """Complete user profile"""
    user_id: str
    email: str
    full_name: Optional[str] = None
    roles: List[str] = []
    school_id: Optional[str] = None
    school_name: Optional[str] = None
    status: str = "active"
    created_at: datetime
    last_login: Optional[datetime] = None
    metadata: dict = {}


class BulkRoleAssignment(BaseModel):
    """Bulk assign roles to multiple users"""
    assignments: List[RoleAssignment]
    
    @validator('assignments')
    def validate_assignments(cls, v):
        """Ensure at least one assignment"""
        if not v:
            raise ValueError("At least one role assignment required")
        return v

