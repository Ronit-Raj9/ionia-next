"""
Application Constants
Centralized location for all constants used across the application
"""
from enum import Enum
from typing import List


# ==================== User Roles with Hierarchy ====================

class UserRole(str, Enum):
    """
    User role enum for role-based access control (RBAC)
    Hierarchy: SCHOOL_ADMIN (highest) → PRINCIPAL → CLASS_TEACHER → TEACHER → STUDENT (lowest)
    """
    STUDENT = "student"
    TEACHER = "teacher"
    CLASS_TEACHER = "class_teacher"
    PRINCIPAL = "principal"
    SCHOOL_ADMIN = "school_admin"
    
    @classmethod
    def get_hierarchy(cls) -> List['UserRole']:
        """Return role hierarchy from lowest to highest"""
        return [
            cls.STUDENT,
            cls.TEACHER,
            cls.CLASS_TEACHER,
            cls.PRINCIPAL,
            cls.SCHOOL_ADMIN
        ]
    
    def get_level(self) -> int:
        """Get hierarchical level of role (higher = more permissions)"""
        hierarchy = self.get_hierarchy()
        return hierarchy.index(self)
    
    @classmethod
    def get_roles_at_or_above(cls, min_role: 'UserRole') -> List['UserRole']:
        """Get all roles at or above the minimum role in hierarchy"""
        hierarchy = cls.get_hierarchy()
        min_level = min_role.get_level()
        return [role for role in hierarchy if role.get_level() >= min_level]
    
    @classmethod
    def can_access(cls, user_role: 'UserRole', required_role: 'UserRole') -> bool:
        """Check if user_role has sufficient level for required_role"""
        return user_role.get_level() >= required_role.get_level()


# ==================== User Status ====================

class UserStatus(str, Enum):
    """User account status"""
    ACTIVE = "active"
    INACTIVE = "inactive"
    SUSPENDED = "suspended"
    PENDING = "pending"


# ==================== Assignment Status ====================

class AssignmentStatus(str, Enum):
    """Assignment status"""
    DRAFT = "draft"
    ACTIVE = "active"
    PUBLISHED = "published"  # alias for active
    CLOSED = "closed"
    COMPLETED = "completed"  # alias for closed
    ARCHIVED = "archived"


# ==================== Submission Status ====================

class SubmissionStatus(str, Enum):
    """Submission status"""
    PENDING = "pending"
    DRAFT = "draft"
    SUBMITTED = "submitted"
    GRADING = "grading"
    GRADED = "graded"
    RETURNED = "returned"


# ==================== Grade Status ====================

class GradeStatus(str, Enum):
    """Grade status"""
    PENDING = "pending"
    GRADED = "graded"
    PUBLISHED = "published"


# ==================== School Types ====================

class SchoolType(str, Enum):
    """School types"""
    PRIMARY = "primary"
    SECONDARY = "secondary"
    HIGH_SCHOOL = "high_school"
    COLLEGE = "college"
    UNIVERSITY = "university"


# ==================== API Response Messages ====================

class ResponseMessage:
    """Standard API response messages"""
    
    # Success messages
    SUCCESS = "Operation completed successfully"
    CREATED = "Resource created successfully"
    UPDATED = "Resource updated successfully"
    DELETED = "Resource deleted successfully"
    
    # Auth messages
    LOGIN_SUCCESS = "Login successful"
    LOGOUT_SUCCESS = "Logout successful"
    REGISTER_SUCCESS = "Registration successful"
    TOKEN_REFRESHED = "Token refreshed successfully"
    
    # Error messages
    NOT_FOUND = "Resource not found"
    UNAUTHORIZED = "Unauthorized access"
    FORBIDDEN = "Insufficient permissions"
    BAD_REQUEST = "Invalid request"
    INTERNAL_ERROR = "Internal server error"
    
    # Validation messages
    INVALID_CREDENTIALS = "Invalid email or password"
    INVALID_TOKEN = "Invalid or expired token"
    INVALID_ROLE = "Invalid role specified"
    INVALID_SCHOOL = "Invalid school specified"
    
    # Role-specific messages
    ROLE_ASSIGNED = "Role assigned successfully"
    ROLE_REMOVED = "Role removed successfully"
    PERMISSION_DENIED = "You don't have permission to perform this action"
    
    # RBAC messages
    SCHOOL_ACCESS_DENIED = "Access denied to this school's data"
    ROLE_HIERARCHY_VIOLATION = "Insufficient role level for this operation"


# ==================== Pagination ====================

DEFAULT_PAGE_SIZE = 20
MAX_PAGE_SIZE = 100


# ==================== Cache TTL (seconds) ====================

CACHE_TTL_SHORT = 300      # 5 minutes
CACHE_TTL_MEDIUM = 1800    # 30 minutes
CACHE_TTL_LONG = 3600      # 1 hour
CACHE_TTL_VERY_LONG = 86400  # 24 hours


# ==================== File Upload ====================

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB
ALLOWED_FILE_TYPES = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain"
]


# ==================== Grading ====================

MIN_GRADE = 0.0
MAX_GRADE = 100.0
PASSING_GRADE = 60.0


# ==================== Analytics ====================

class AnalyticsMetricType(str, Enum):
    """Analytics metric types"""
    PERFORMANCE = "performance"
    ENGAGEMENT = "engagement"
    PROGRESS = "progress"
    ATTENDANCE = "attendance"
    BEHAVIOR = "behavior"


# ==================== Audit Actions ====================

class AuditAction(str, Enum):
    """Audit log action types"""
    CREATE = "create"
    READ = "read"
    UPDATE = "update"
    DELETE = "delete"
    LOGIN = "login"
    LOGOUT = "logout"
    ROLE_CHANGE = "role_change"
    PERMISSION_CHANGE = "permission_change"
    GRADE_OVERRIDE = "grade_override"
    SCHOOL_ACCESS = "school_access"


# ==================== Background Task Priorities ====================

class TaskPriority(str, Enum):
    """Background task priorities"""
    LOW = "low"
    NORMAL = "normal"
    HIGH = "high"
    CRITICAL = "critical"


# ==================== Database Table Names ====================

class TableName:
    """Supabase table names"""
    PROFILES = "profiles"
    SCHOOLS = "schools"
    CLASSES = "classes"
    ASSIGNMENTS = "assignments"
    SUBMISSIONS = "submissions"
    GRADES = "grades"
    ANALYTICS = "analytics"
    TEACHER_ASSIGNMENTS = "teacher_assignments"
    STUDENT_ENROLLMENTS = "student_enrollments"
    AUDIT_LOGS = "audit_logs"
    LESSONS = "lessons"
    QUESTION_CHAINS = "question_chains"


# ==================== API Version ====================

API_VERSION = "v1"
API_PREFIX = f"/api/{API_VERSION}"


# ==================== Regex Patterns ====================

EMAIL_REGEX = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
UUID_REGEX = r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'


# ==================== Error Codes ====================

class ErrorCode:
    """Application error codes"""
    
    # Auth errors (1000-1099)
    AUTH_INVALID_CREDENTIALS = 1000
    AUTH_TOKEN_EXPIRED = 1001
    AUTH_TOKEN_INVALID = 1002
    AUTH_UNAUTHORIZED = 1003
    AUTH_FORBIDDEN = 1004
    
    # User errors (1100-1199)
    USER_NOT_FOUND = 1100
    USER_ALREADY_EXISTS = 1101
    USER_INACTIVE = 1102
    USER_SUSPENDED = 1103
    
    # School errors (1200-1299)
    SCHOOL_NOT_FOUND = 1200
    SCHOOL_ACCESS_DENIED = 1201
    ROLE_HIERARCHY_VIOLATION = 1202
    
    # Assignment errors (1300-1399)
    ASSIGNMENT_NOT_FOUND = 1300
    ASSIGNMENT_CLOSED = 1301
    
    # Submission errors (1400-1499)
    SUBMISSION_NOT_FOUND = 1400
    SUBMISSION_ALREADY_EXISTS = 1401
    
    # Grade errors (1500-1599)
    GRADE_NOT_FOUND = 1500
    GRADE_INVALID = 1501
    
    # Validation errors (1600-1699)
    VALIDATION_ERROR = 1600
    INVALID_INPUT = 1601
    
    # System errors (1700-1799)
    INTERNAL_ERROR = 1700
    DATABASE_ERROR = 1701
    EXTERNAL_SERVICE_ERROR = 1702


# ==================== RBAC Permissions Matrix ====================

ROLE_PERMISSIONS = {
    UserRole.STUDENT: [
        "view_own_assignments",
        "submit_assignments",
        "view_own_grades",
        "view_own_progress"
    ],
    UserRole.TEACHER: [
        "create_assignments",
        "grade_assignments",
        "view_class_students",
        "view_student_submissions"
    ],
    UserRole.CLASS_TEACHER: [
        "create_assignments",
        "grade_assignments",
        "view_class_students",
        "view_student_submissions",
        "manage_class",
        "view_class_analytics"
    ],
    UserRole.PRINCIPAL: [
        "view_all_classes",
        "view_all_teachers",
        "view_all_students",
        "view_school_analytics",
        "assign_teachers",
        "manage_classes"
    ],
    UserRole.SCHOOL_ADMIN: [
        "manage_school",
        "manage_users",
        "manage_roles",
        "view_all_data",
        "export_data",
        "manage_subscription"
    ]
}
