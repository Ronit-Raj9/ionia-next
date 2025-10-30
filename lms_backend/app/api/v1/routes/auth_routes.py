"""
Authentication routes - Login, Register, Role Management
Implements lightweight FastAPI layer over Supabase Auth
"""
from fastapi import APIRouter, Depends, HTTPException, status
from typing import Dict, Any
from datetime import datetime

from app.api.v1.dependencies import (
    get_current_user,
    require_admin,
    require_principal
)
from app.core.security import CurrentUser
from app.core.supabase_client import get_supabase_client, get_supabase_admin
from app.schemas.auth import (
    UserLogin,
    GoogleAuthRequest,
    UserRegister,
    AuthTokens,
    UserInfo,
    RoleAssignment,
    RoleUpdate,
    TokenRefresh,
    PasswordReset,
    UserProfile,
    BulkRoleAssignment
)


router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=AuthTokens, status_code=status.HTTP_201_CREATED)
async def register_user(user_data: UserRegister) -> AuthTokens:
    """
    Register a new user with email and password.
    User starts with no roles - must be assigned by admin/principal.
    
    Flow:
    1. Create user in Supabase Auth
    2. Create profile in profiles table with default metadata
    3. Return auth tokens
    
    Note: Roles must be assigned separately via /auth/assign-role endpoint
    """
    try:
        supabase = get_supabase_client()
        
        # Register user with Supabase Auth
        auth_response = supabase.auth.sign_up({
            "email": user_data.email,
            "password": user_data.password,
            "options": {
                "data": {
                    "full_name": user_data.full_name,
                    "school_id": user_data.school_id
                }
            }
        })
        
        if not auth_response.user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Registration failed"
            )
        
        # Create user profile in database
        supabase.table("profiles").insert({
            "user_id": auth_response.user.id,
            "email": user_data.email,
            "full_name": user_data.full_name,
            "school_id": user_data.school_id,
            "roles": [],  # Empty initially - must be assigned
            "status": "pending",  # Pending until role assigned
            "created_at": datetime.utcnow().isoformat()
        }).execute()
        
        return AuthTokens(
            access_token=auth_response.session.access_token,
            refresh_token=auth_response.session.refresh_token,
            token_type="bearer",
            expires_in=auth_response.session.expires_in,
            user=UserInfo(
                user_id=auth_response.user.id,
                email=auth_response.user.email,
                roles=[],
                school_id=user_data.school_id,
                full_name=user_data.full_name
            )
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Registration failed: {str(e)}"
        )


@router.post("/login", response_model=AuthTokens)
async def login(credentials: UserLogin) -> AuthTokens:
    """
    Login with email and password.
    Returns JWT tokens with user's roles and school_id in app_metadata.
    """
    try:
        supabase = get_supabase_client()
        
        # Authenticate with Supabase
        auth_response = supabase.auth.sign_in_with_password({
            "email": credentials.email,
            "password": credentials.password
        })
        
        if not auth_response.user or not auth_response.session:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials"
            )
        
        # Get user profile for additional info
        profile = supabase.table("profiles").select("*").eq(
            "user_id", auth_response.user.id
        ).single().execute()
        
        profile_data = profile.data if profile.data else {}
        
        return AuthTokens(
            access_token=auth_response.session.access_token,
            refresh_token=auth_response.session.refresh_token,
            token_type="bearer",
            expires_in=auth_response.session.expires_in,
            user=UserInfo(
                user_id=auth_response.user.id,
                email=auth_response.user.email,
                roles=profile_data.get("roles", []),
                school_id=profile_data.get("school_id"),
                full_name=profile_data.get("full_name")
            )
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Authentication failed: {str(e)}"
        )


@router.post("/google", response_model=AuthTokens)
async def google_auth(auth_data: GoogleAuthRequest) -> AuthTokens:
    """
    Authenticate with Google OAuth.
    Frontend sends Google ID token, backend validates and creates/updates user.
    """
    try:
        supabase = get_supabase_client()
        
        # Sign in with Google ID token
        auth_response = supabase.auth.sign_in_with_id_token({
            "provider": "google",
            "token": auth_data.id_token
        })
        
        if not auth_response.user or not auth_response.session:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Google authentication failed"
            )
        
        # Get or create user profile
        profile_response = supabase.table("profiles").select("*").eq(
            "user_id", auth_response.user.id
        ).execute()
        
        if not profile_response.data:
            # Create new profile for Google user
            supabase.table("profiles").insert({
                "user_id": auth_response.user.id,
                "email": auth_response.user.email,
                "full_name": auth_response.user.user_metadata.get("full_name"),
                "roles": [],
                "status": "pending",
                "created_at": datetime.utcnow().isoformat()
            }).execute()
            profile_data = {"roles": [], "school_id": None}
        else:
            profile_data = profile_response.data[0]
        
        return AuthTokens(
            access_token=auth_response.session.access_token,
            refresh_token=auth_response.session.refresh_token,
            token_type="bearer",
            expires_in=auth_response.session.expires_in,
            user=UserInfo(
                user_id=auth_response.user.id,
                email=auth_response.user.email,
                roles=profile_data.get("roles", []),
                school_id=profile_data.get("school_id"),
                full_name=auth_response.user.user_metadata.get("full_name")
            )
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Google authentication failed: {str(e)}"
        )


@router.post("/refresh", response_model=AuthTokens)
async def refresh_token(token_data: TokenRefresh) -> AuthTokens:
    """
    Refresh access token using refresh token.
    """
    try:
        supabase = get_supabase_client()
        
        # Refresh session
        auth_response = supabase.auth.refresh_session(token_data.refresh_token)
        
        if not auth_response.user or not auth_response.session:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token"
            )
        
        # Get user profile
        profile = supabase.table("profiles").select("*").eq(
            "user_id", auth_response.user.id
        ).single().execute()
        
        profile_data = profile.data if profile.data else {}
        
        return AuthTokens(
            access_token=auth_response.session.access_token,
            refresh_token=auth_response.session.refresh_token,
            token_type="bearer",
            expires_in=auth_response.session.expires_in,
            user=UserInfo(
                user_id=auth_response.user.id,
                email=auth_response.user.email,
                roles=profile_data.get("roles", []),
                school_id=profile_data.get("school_id"),
                full_name=profile_data.get("full_name")
            )
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Token refresh failed: {str(e)}"
        )


@router.post("/logout")
async def logout(user: CurrentUser = Depends(get_current_user)) -> Dict[str, str]:
    """
    Logout current user (invalidate session).
    """
    try:
        supabase = get_supabase_client()
        supabase.auth.sign_out()
        
        return {"message": "Successfully logged out"}
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Logout failed: {str(e)}"
        )


@router.get("/me", response_model=UserProfile)
async def get_current_user_profile(
    user: CurrentUser = Depends(get_current_user)
) -> UserProfile:
    """
    Get current authenticated user's profile.
    """
    try:
        supabase = get_supabase_client()
        
        # Get detailed profile
        profile = supabase.table("profiles").select("*").eq(
            "user_id", user.user_id
        ).single().execute()
        
        if not profile.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User profile not found"
            )
        
        return UserProfile(
            user_id=profile.data["user_id"],
            email=profile.data["email"],
            full_name=profile.data.get("full_name"),
            roles=profile.data.get("roles", []),
            school_id=profile.data.get("school_id"),
            school_name=profile.data.get("school_name"),
            status=profile.data.get("status", "active"),
            created_at=profile.data["created_at"],
            last_login=profile.data.get("last_login"),
            metadata=profile.data.get("metadata", {})
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch profile: {str(e)}"
        )


# ==================== ADMIN/PRINCIPAL ONLY - Role Management ====================

@router.post("/assign-role", response_model=RoleUpdate)
async def assign_role(
    role_data: RoleAssignment,
    admin_user: CurrentUser = Depends(require_principal)
) -> RoleUpdate:
    """
    Assign roles to a user (Admin or Principal only).
    Principals can only assign roles within their school.
    
    This updates BOTH:
    1. User's app_metadata in Supabase Auth (included in JWT)
    2. User's profile in profiles table (for querying)
    """
    try:
        # Check school access for non-admins
        if not admin_user.is_admin():
            if role_data.school_id != admin_user.school_id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="You can only assign roles within your school"
                )
        
        supabase_admin = get_supabase_admin()
        
        # Update user's app_metadata (this goes into JWT)
        supabase_admin.auth.admin.update_user_by_id(
            role_data.user_id,
            {
                "app_metadata": {
                    "roles": role_data.roles,
                    "school_id": role_data.school_id
                }
            }
        )
        
        # Update profile table for easy querying
        supabase_admin.table("profiles").update({
            "roles": role_data.roles,
            "school_id": role_data.school_id,
            "status": "active",  # Activate user when role assigned
            "updated_at": datetime.utcnow().isoformat()
        }).eq("user_id", role_data.user_id).execute()
        
        return RoleUpdate(
            user_id=role_data.user_id,
            roles=role_data.roles,
            school_id=role_data.school_id,
            updated_at=datetime.utcnow(),
            message=f"Successfully assigned roles: {', '.join(role_data.roles)}"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Role assignment failed: {str(e)}"
        )


@router.post("/bulk-assign-roles")
async def bulk_assign_roles(
    bulk_data: BulkRoleAssignment,
    admin_user: CurrentUser = Depends(require_admin)
) -> Dict[str, Any]:
    """
    Bulk assign roles to multiple users (Admin only).
    Useful for school onboarding from CSV imports.
    """
    try:
        supabase_admin = get_supabase_admin()
        
        results = {
            "success": [],
            "failed": []
        }
        
        for assignment in bulk_data.assignments:
            try:
                # Update auth metadata
                supabase_admin.auth.admin.update_user_by_id(
                    assignment.user_id,
                    {
                        "app_metadata": {
                            "roles": assignment.roles,
                            "school_id": assignment.school_id
                        }
                    }
                )
                
                # Update profile
                supabase_admin.table("profiles").update({
                    "roles": assignment.roles,
                    "school_id": assignment.school_id,
                    "status": "active",
                    "updated_at": datetime.utcnow().isoformat()
                }).eq("user_id", assignment.user_id).execute()
                
                results["success"].append({
                    "user_id": assignment.user_id,
                    "roles": assignment.roles
                })
                
            except Exception as e:
                results["failed"].append({
                    "user_id": assignment.user_id,
                    "error": str(e)
                })
        
        return {
            "message": f"Processed {len(bulk_data.assignments)} assignments",
            "results": results
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Bulk assignment failed: {str(e)}"
        )


@router.post("/reset-password")
async def reset_password(reset_data: PasswordReset) -> Dict[str, str]:
    """
    Request password reset email.
    Public endpoint - no authentication required.
    """
    try:
        supabase = get_supabase_client()
        
        supabase.auth.reset_password_for_email(reset_data.email)
        
        return {
            "message": "If the email exists, a password reset link has been sent"
        }
        
    except Exception as e:
        # Always return success message for security (don't reveal if email exists)
        return {
            "message": "If the email exists, a password reset link has been sent"
        }

