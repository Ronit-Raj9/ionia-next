"""
Example protected routes demonstrating RBAC in action.
These routes show how to use role-based access control.
"""
from fastapi import APIRouter, Depends, Query
from typing import List, Dict, Any

from app.api.v1.dependencies import (
    get_current_user,
    require_admin,
    require_principal,
    require_teacher,
    require_student,
    require_school_access
)
from app.core.security import CurrentUser
from app.core.supabase_client import get_supabase_client, get_supabase_for_user


router = APIRouter(prefix="/protected", tags=["Protected Examples"])


# ==================== Public Example ====================

@router.get("/public")
async def public_route() -> Dict[str, str]:
    """
    Public route - no authentication required.
    Anyone can access this.
    """
    return {
        "message": "This is a public endpoint - no auth required",
        "access": "public"
    }


# ==================== Basic Authentication ====================

@router.get("/authenticated")
async def authenticated_route(user: CurrentUser = Depends(get_current_user)) -> Dict[str, Any]:
    """
    Protected route - requires authentication but any role.
    RLS policies will still enforce data access based on user's role.
    """
    return {
        "message": "You are authenticated!",
        "user_id": user.user_id,
        "email": user.email,
        "roles": user.roles,
        "school_id": user.school_id
    }


# ==================== Student Routes ====================

@router.get("/student/dashboard")
async def student_dashboard(user: CurrentUser = Depends(require_student)) -> Dict[str, Any]:
    """
    Student dashboard - only students can access.
    RLS ensures students only see their own data.
    """
    return {
        "message": "Student Dashboard",
        "student_id": user.user_id,
        "school_id": user.school_id,
        "note": "RLS policies ensure you only see your own assignments and grades"
    }


@router.get("/student/assignments")
async def get_student_assignments(
    user: CurrentUser = Depends(require_student)
) -> Dict[str, Any]:
    """
    Get assignments for current student.
    Supabase RLS automatically filters by student_id.
    """
    supabase = get_supabase_client()
    
    # RLS policy ensures this only returns assignments for THIS student
    response = supabase.table("assignments").select("*").eq(
        "student_id", user.user_id
    ).execute()
    
    return {
        "student_id": user.user_id,
        "assignments": response.data,
        "note": "RLS filtered this automatically"
    }


# ==================== Teacher Routes ====================

@router.get("/teacher/dashboard")
async def teacher_dashboard(user: CurrentUser = Depends(require_teacher)) -> Dict[str, Any]:
    """
    Teacher dashboard - teachers, class teachers, principals, and admins can access.
    RLS policies filter data by teacher's class assignments.
    """
    return {
        "message": "Teacher Dashboard",
        "teacher_id": user.user_id,
        "roles": user.roles,
        "school_id": user.school_id,
        "note": "RLS policies ensure you only see your assigned classes"
    }


@router.get("/teacher/classes")
async def get_teacher_classes(
    user: CurrentUser = Depends(require_teacher)
) -> Dict[str, Any]:
    """
    Get classes assigned to current teacher.
    RLS filters by teacher_id and school_id.
    """
    supabase = get_supabase_client()
    
    # RLS policy: teacher can only see classes where they're assigned
    response = supabase.table("classes").select("*").eq(
        "teacher_id", user.user_id
    ).eq("school_id", user.school_id).execute()
    
    return {
        "teacher_id": user.user_id,
        "classes": response.data,
        "note": "RLS filtered by your assignments and school"
    }


@router.post("/teacher/grade-assignment")
async def grade_assignment(
    assignment_id: str,
    student_id: str,
    grade: float,
    user: CurrentUser = Depends(require_teacher)
) -> Dict[str, Any]:
    """
    Grade a student's assignment.
    RLS ensures teacher can only grade assignments in their classes.
    """
    supabase = get_supabase_client()
    
    # RLS policy will prevent grading if teacher doesn't own this class
    response = supabase.table("grades").insert({
        "assignment_id": assignment_id,
        "student_id": student_id,
        "teacher_id": user.user_id,
        "grade": grade,
        "school_id": user.school_id
    }).execute()
    
    return {
        "message": "Grade submitted",
        "grade": response.data,
        "note": "RLS prevented this if you don't teach this student"
    }


# ==================== Principal Routes ====================

@router.get("/principal/school-overview")
async def school_overview(user: CurrentUser = Depends(require_principal)) -> Dict[str, Any]:
    """
    School-wide overview - principals and admins only.
    RLS allows principals to see all data in their school.
    """
    supabase = get_supabase_client()
    
    # Principals can see all classes in their school
    classes = supabase.table("classes").select("*").eq(
        "school_id", user.school_id
    ).execute()
    
    # Principals can see all students in their school
    students = supabase.table("profiles").select("*").eq(
        "school_id", user.school_id
    ).contains("roles", ["student"]).execute()
    
    return {
        "message": "School Overview",
        "principal_id": user.user_id,
        "school_id": user.school_id,
        "total_classes": len(classes.data) if classes.data else 0,
        "total_students": len(students.data) if students.data else 0,
        "note": "RLS lets you see school-wide data"
    }


@router.get("/principal/teachers")
async def get_school_teachers(
    user: CurrentUser = Depends(require_principal)
) -> Dict[str, Any]:
    """
    Get all teachers in principal's school.
    RLS filters by school_id.
    """
    supabase = get_supabase_client()
    
    # Get all teachers in this school
    response = supabase.table("profiles").select("*").eq(
        "school_id", user.school_id
    ).contains("roles", ["teacher"]).execute()
    
    return {
        "school_id": user.school_id,
        "teachers": response.data,
        "count": len(response.data) if response.data else 0
    }


# ==================== Admin Routes ====================

@router.get("/admin/all-schools")
async def get_all_schools(user: CurrentUser = Depends(require_admin)) -> Dict[str, Any]:
    """
    Get all schools - admins only.
    RLS allows admins to bypass school_id filters.
    """
    supabase = get_supabase_client()
    
    # Admins can see ALL schools
    response = supabase.table("schools").select("*").execute()
    
    return {
        "message": "All Schools",
        "admin_id": user.user_id,
        "schools": response.data,
        "note": "Admin role bypasses school isolation"
    }


@router.get("/admin/users")
async def get_all_users(
    user: CurrentUser = Depends(require_admin),
    school_id: str = Query(None, description="Filter by school (optional)")
) -> Dict[str, Any]:
    """
    Get all users in system - admins only.
    Optional school_id filter.
    """
    supabase = get_supabase_client()
    
    query = supabase.table("profiles").select("*")
    
    if school_id:
        query = query.eq("school_id", school_id)
    
    response = query.execute()
    
    return {
        "message": "All Users",
        "admin_id": user.user_id,
        "filter": {"school_id": school_id} if school_id else "none",
        "users": response.data,
        "count": len(response.data) if response.data else 0
    }


# ==================== Multi-Role Access ====================

@router.get("/multi-role/analytics")
async def get_analytics(user: CurrentUser = Depends(get_current_user)) -> Dict[str, Any]:
    """
    Analytics route with different views based on role.
    Shows how to handle multi-role access patterns.
    """
    supabase = get_supabase_client()
    
    if user.is_admin():
        # Admins see everything
        data = supabase.table("analytics").select("*").execute()
        scope = "system-wide"
        
    elif user.is_principal():
        # Principals see their school
        data = supabase.table("analytics").select("*").eq(
            "school_id", user.school_id
        ).execute()
        scope = f"school: {user.school_id}"
        
    elif user.is_teacher():
        # Teachers see their classes
        data = supabase.table("analytics").select("*").eq(
            "teacher_id", user.user_id
        ).execute()
        scope = "your classes"
        
    elif user.is_student():
        # Students see their own stats
        data = supabase.table("analytics").select("*").eq(
            "student_id", user.user_id
        ).execute()
        scope = "personal"
        
    else:
        return {"error": "No analytics access"}
    
    return {
        "user_id": user.user_id,
        "roles": user.roles,
        "scope": scope,
        "analytics": data.data if data else []
    }


# ==================== School Isolation Example ====================

@router.get("/school/{school_id}/students")
async def get_school_students(
    school_id: str,
    user: CurrentUser = Depends(require_school_access)
) -> Dict[str, Any]:
    """
    Get students from a specific school.
    School access is verified by require_school_access dependency.
    Non-admins can only access their own school's data.
    """
    supabase = get_supabase_client()
    
    # If we reach here, user has access to this school
    response = supabase.table("profiles").select("*").eq(
        "school_id", school_id
    ).contains("roles", ["student"]).execute()
    
    return {
        "school_id": school_id,
        "requester": user.user_id,
        "requester_school": user.school_id,
        "students": response.data,
        "note": "Access verified by require_school_access"
    }

