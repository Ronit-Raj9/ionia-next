"""
Custom Application Exceptions
Domain-specific exceptions for better error handling
"""
from typing import Optional, Any, Dict
from fastapi import status

from app.core.constants import ErrorCode, ResponseMessage


class AppException(Exception):
    """
    Base exception for all application errors.
    All custom exceptions should inherit from this.
    """
    
    def __init__(
        self,
        message: str = ResponseMessage.INTERNAL_ERROR,
        status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR,
        error_code: Optional[int] = None,
        details: Optional[Dict[str, Any]] = None
    ):
        self.message = message
        self.status_code = status_code
        self.error_code = error_code or ErrorCode.INTERNAL_ERROR
        self.details = details or {}
        super().__init__(self.message)


# ==================== Authentication Exceptions ====================

class AuthenticationException(AppException):
    """Base exception for authentication errors"""
    def __init__(self, message: str = ResponseMessage.UNAUTHORIZED, **kwargs):
        super().__init__(
            message=message,
            status_code=status.HTTP_401_UNAUTHORIZED,
            error_code=ErrorCode.AUTH_UNAUTHORIZED,
            **kwargs
        )


class InvalidCredentialsException(AuthenticationException):
    """Invalid username or password"""
    def __init__(self, **kwargs):
        super().__init__(
            message=ResponseMessage.INVALID_CREDENTIALS,
            error_code=ErrorCode.AUTH_INVALID_CREDENTIALS,
            **kwargs
        )


class TokenExpiredException(AuthenticationException):
    """JWT token has expired"""
    def __init__(self, **kwargs):
        super().__init__(
            message=ResponseMessage.INVALID_TOKEN,
            error_code=ErrorCode.AUTH_TOKEN_EXPIRED,
            **kwargs
        )


class InvalidTokenException(AuthenticationException):
    """JWT token is invalid"""
    def __init__(self, **kwargs):
        super().__init__(
            message=ResponseMessage.INVALID_TOKEN,
            error_code=ErrorCode.AUTH_TOKEN_INVALID,
            **kwargs
        )


# ==================== Authorization Exceptions ====================

class AuthorizationException(AppException):
    """Base exception for authorization errors"""
    def __init__(self, message: str = ResponseMessage.FORBIDDEN, **kwargs):
        super().__init__(
            message=message,
            status_code=status.HTTP_403_FORBIDDEN,
            error_code=ErrorCode.AUTH_FORBIDDEN,
            **kwargs
        )


class InsufficientPermissionsException(AuthorizationException):
    """User doesn't have required permissions"""
    def __init__(self, required_roles: Optional[list] = None, **kwargs):
        message = ResponseMessage.PERMISSION_DENIED
        if required_roles:
            message = f"{message}. Required roles: {', '.join(required_roles)}"
        super().__init__(message=message, **kwargs)


class SchoolAccessDeniedException(AuthorizationException):
    """User cannot access data from this school"""
    def __init__(self, school_id: str = None, **kwargs):
        message = f"Access denied to school {school_id}" if school_id else "School access denied"
        super().__init__(
            message=message,
            error_code=ErrorCode.SCHOOL_ACCESS_DENIED,
            **kwargs
        )


class ForbiddenError(AuthorizationException):
    """Generic forbidden access error (alias for compatibility)"""
    def __init__(self, message: str = "Access forbidden", **kwargs):
        super().__init__(message=message, **kwargs)


class RoleHierarchyViolationException(AuthorizationException):
    """User role doesn't meet minimum hierarchy requirement"""
    def __init__(self, required_role: str, user_role: str, **kwargs):
        super().__init__(
            message=f"Insufficient role level. Required: {required_role}, User has: {user_role}",
            error_code=ErrorCode.ROLE_HIERARCHY_VIOLATION,
            **kwargs
        )


# ==================== Resource Not Found Exceptions ====================

class NotFoundException(AppException):
    """Base exception for resource not found errors"""
    def __init__(self, resource: str = "Resource", **kwargs):
        super().__init__(
            message=f"{resource} not found",
            status_code=status.HTTP_404_NOT_FOUND,
            **kwargs
        )


class UserNotFoundException(NotFoundException):
    """User not found"""
    def __init__(self, user_id: Optional[str] = None, **kwargs):
        message = f"User {user_id} not found" if user_id else "User not found"
        super().__init__(
            resource=message,
            error_code=ErrorCode.USER_NOT_FOUND,
            **kwargs
        )


class SchoolNotFoundException(NotFoundException):
    """School not found"""
    def __init__(self, school_id: Optional[str] = None, **kwargs):
        message = f"School {school_id} not found" if school_id else "School not found"
        super().__init__(
            resource=message,
            error_code=ErrorCode.SCHOOL_NOT_FOUND,
            **kwargs
        )


class AssignmentNotFoundException(NotFoundException):
    """Assignment not found"""
    def __init__(self, assignment_id: Optional[str] = None, **kwargs):
        message = f"Assignment {assignment_id} not found" if assignment_id else "Assignment not found"
        super().__init__(
            resource=message,
            error_code=ErrorCode.ASSIGNMENT_NOT_FOUND,
            **kwargs
        )


class SubmissionNotFoundException(NotFoundException):
    """Submission not found"""
    def __init__(self, submission_id: Optional[str] = None, **kwargs):
        message = f"Submission {submission_id} not found" if submission_id else "Submission not found"
        super().__init__(
            resource=message,
            error_code=ErrorCode.SUBMISSION_NOT_FOUND,
            **kwargs
        )


class GradeNotFoundException(NotFoundException):
    """Grade not found"""
    def __init__(self, grade_id: Optional[str] = None, **kwargs):
        message = f"Grade {grade_id} not found" if grade_id else "Grade not found"
        super().__init__(
            resource=message,
            error_code=ErrorCode.GRADE_NOT_FOUND,
            **kwargs
        )


# ==================== Validation Exceptions ====================

class ValidationException(AppException):
    """Base exception for validation errors"""
    def __init__(self, message: str = "Validation error", **kwargs):
        super().__init__(
            message=message,
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            error_code=ErrorCode.VALIDATION_ERROR,
            **kwargs
        )


class InvalidInputException(ValidationException):
    """Invalid input data"""
    def __init__(self, field: Optional[str] = None, **kwargs):
        message = f"Invalid input for field: {field}" if field else "Invalid input"
        super().__init__(
            message=message,
            error_code=ErrorCode.INVALID_INPUT,
            **kwargs
        )


# ==================== Business Logic Exceptions ====================

class BusinessLogicException(AppException):
    """Base exception for business logic errors"""
    def __init__(self, message: str, **kwargs):
        super().__init__(
            message=message,
            status_code=status.HTTP_400_BAD_REQUEST,
            **kwargs
        )


class UserAlreadyExistsException(BusinessLogicException):
    """User with this email already exists"""
    def __init__(self, email: str, **kwargs):
        super().__init__(
            message=f"User with email {email} already exists",
            error_code=ErrorCode.USER_ALREADY_EXISTS,
            **kwargs
        )


class UserInactiveException(BusinessLogicException):
    """User account is inactive"""
    def __init__(self, **kwargs):
        super().__init__(
            message="User account is inactive",
            error_code=ErrorCode.USER_INACTIVE,
            **kwargs
        )


class UserSuspendedException(BusinessLogicException):
    """User account is suspended"""
    def __init__(self, **kwargs):
        super().__init__(
            message="User account is suspended",
            error_code=ErrorCode.USER_SUSPENDED,
            **kwargs
        )


class AssignmentClosedException(BusinessLogicException):
    """Assignment is closed for submissions"""
    def __init__(self, **kwargs):
        super().__init__(
            message="Assignment is closed for submissions",
            error_code=ErrorCode.ASSIGNMENT_CLOSED,
            **kwargs
        )


class SubmissionAlreadyExistsException(BusinessLogicException):
    """Submission already exists"""
    def __init__(self, **kwargs):
        super().__init__(
            message="Submission already exists for this assignment",
            error_code=ErrorCode.SUBMISSION_ALREADY_EXISTS,
            **kwargs
        )


class InvalidGradeException(BusinessLogicException):
    """Invalid grade value"""
    def __init__(self, **kwargs):
        super().__init__(
            message="Invalid grade value",
            error_code=ErrorCode.GRADE_INVALID,
            **kwargs
        )


# ==================== System Exceptions ====================

class DatabaseException(AppException):
    """Database operation error"""
    def __init__(self, message: str = "Database error", **kwargs):
        super().__init__(
            message=message,
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            error_code=ErrorCode.DATABASE_ERROR,
            **kwargs
        )


class ExternalServiceException(AppException):
    """External service error"""
    def __init__(self, service: str, **kwargs):
        super().__init__(
            message=f"External service error: {service}",
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            error_code=ErrorCode.EXTERNAL_SERVICE_ERROR,
            **kwargs
        )

