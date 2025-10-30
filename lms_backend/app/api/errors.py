"""
Error response models
Standardized error response structures
"""
from typing import Optional, Dict, Any
from pydantic import BaseModel


class ErrorDetail(BaseModel):
    """Detailed error information"""
    field: Optional[str] = None
    message: str
    type: Optional[str] = None


class ErrorResponse(BaseModel):
    """
    Standard error response format.
    Used for all API error responses.
    """
    error: str
    message: str
    error_code: Optional[int] = None
    status_code: int
    details: Optional[Dict[str, Any]] = None
    path: Optional[str] = None
    timestamp: Optional[str] = None
    
    class Config:
        json_schema_extra = {
            "example": {
                "error": "Validation Error",
                "message": "Invalid email format",
                "error_code": 1600,
                "status_code": 422,
                "details": {
                    "field": "email",
                    "type": "value_error.email"
                },
                "path": "/api/v1/auth/register",
                "timestamp": "2024-01-15T10:30:00Z"
            }
        }


class ValidationErrorResponse(BaseModel):
    """Validation error response (422)"""
    error: str = "Validation Error"
    message: str
    status_code: int = 422
    errors: list[ErrorDetail]
    
    class Config:
        json_schema_extra = {
            "example": {
                "error": "Validation Error",
                "message": "Invalid request data",
                "status_code": 422,
                "errors": [
                    {
                        "field": "email",
                        "message": "Invalid email format",
                        "type": "value_error.email"
                    },
                    {
                        "field": "password",
                        "message": "Password must be at least 6 characters",
                        "type": "value_error.str.min_length"
                    }
                ]
            }
        }


class AuthErrorResponse(BaseModel):
    """Authentication error response (401)"""
    error: str = "Unauthorized"
    message: str
    status_code: int = 401
    error_code: int
    
    class Config:
        json_schema_extra = {
            "example": {
                "error": "Unauthorized",
                "message": "Invalid credentials",
                "status_code": 401,
                "error_code": 1000
            }
        }


class ForbiddenErrorResponse(BaseModel):
    """Authorization error response (403)"""
    error: str = "Forbidden"
    message: str
    status_code: int = 403
    error_code: int
    required_roles: Optional[list[str]] = None
    
    class Config:
        json_schema_extra = {
            "example": {
                "error": "Forbidden",
                "message": "Insufficient permissions. Required roles: admin, principal",
                "status_code": 403,
                "error_code": 1004,
                "required_roles": ["admin", "principal"]
            }
        }


class NotFoundErrorResponse(BaseModel):
    """Not found error response (404)"""
    error: str = "Not Found"
    message: str
    status_code: int = 404
    resource_type: Optional[str] = None
    resource_id: Optional[str] = None
    
    class Config:
        json_schema_extra = {
            "example": {
                "error": "Not Found",
                "message": "Assignment not found",
                "status_code": 404,
                "resource_type": "assignment",
                "resource_id": "123e4567-e89b-12d3-a456-426614174000"
            }
        }


class InternalErrorResponse(BaseModel):
    """Internal server error response (500)"""
    error: str = "Internal Server Error"
    message: str
    status_code: int = 500
    error_code: int
    request_id: Optional[str] = None
    
    class Config:
        json_schema_extra = {
            "example": {
                "error": "Internal Server Error",
                "message": "An unexpected error occurred",
                "status_code": 500,
                "error_code": 1700,
                "request_id": "req_abc123"
            }
        }

