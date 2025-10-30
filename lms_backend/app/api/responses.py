"""
Standard API response models
Consistent response structures for all endpoints
"""
from typing import Generic, TypeVar, Optional, Any, Dict
from pydantic import BaseModel, Field
from datetime import datetime


T = TypeVar('T')


class SuccessResponse(BaseModel, Generic[T]):
    """
    Standard success response wrapper.
    Used for all successful API responses.
    """
    success: bool = True
    message: str
    data: Optional[T] = None
    meta: Optional[Dict[str, Any]] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        json_schema_extra = {
            "example": {
                "success": True,
                "message": "Operation completed successfully",
                "data": {
                    "id": "123",
                    "name": "Example"
                },
                "meta": {
                    "version": "1.0.0"
                },
                "timestamp": "2024-01-15T10:30:00Z"
            }
        }


class PaginatedResponse(BaseModel, Generic[T]):
    """
    Paginated response for list endpoints.
    """
    success: bool = True
    message: str
    data: list[T]
    pagination: Dict[str, Any] = Field(
        ...,
        description="Pagination metadata"
    )
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        json_schema_extra = {
            "example": {
                "success": True,
                "message": "Data retrieved successfully",
                "data": [
                    {"id": "1", "name": "Item 1"},
                    {"id": "2", "name": "Item 2"}
                ],
                "pagination": {
                    "page": 1,
                    "page_size": 20,
                    "total_pages": 5,
                    "total_items": 100,
                    "has_next": True,
                    "has_prev": False
                },
                "timestamp": "2024-01-15T10:30:00Z"
            }
        }


class MessageResponse(BaseModel):
    """
    Simple message response (no data).
    Used for operations that don't return data.
    """
    success: bool = True
    message: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        json_schema_extra = {
            "example": {
                "success": True,
                "message": "Operation completed successfully",
                "timestamp": "2024-01-15T10:30:00Z"
            }
        }


class CreatedResponse(BaseModel, Generic[T]):
    """
    Response for resource creation (201).
    """
    success: bool = True
    message: str = "Resource created successfully"
    data: T
    resource_id: Optional[str] = None
    resource_url: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        json_schema_extra = {
            "example": {
                "success": True,
                "message": "Assignment created successfully",
                "data": {
                    "id": "123e4567-e89b-12d3-a456-426614174000",
                    "title": "Math Homework",
                    "status": "published"
                },
                "resource_id": "123e4567-e89b-12d3-a456-426614174000",
                "resource_url": "/api/v1/assignments/123e4567-e89b-12d3-a456-426614174000",
                "timestamp": "2024-01-15T10:30:00Z"
            }
        }


class DeletedResponse(BaseModel):
    """
    Response for resource deletion.
    """
    success: bool = True
    message: str = "Resource deleted successfully"
    resource_id: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        json_schema_extra = {
            "example": {
                "success": True,
                "message": "Assignment deleted successfully",
                "resource_id": "123e4567-e89b-12d3-a456-426614174000",
                "timestamp": "2024-01-15T10:30:00Z"
            }
        }


class HealthResponse(BaseModel):
    """
    Health check response.
    """
    status: str = "healthy"
    version: str
    environment: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    services: Optional[Dict[str, str]] = None
    
    class Config:
        json_schema_extra = {
            "example": {
                "status": "healthy",
                "version": "1.0.0",
                "environment": "production",
                "timestamp": "2024-01-15T10:30:00Z",
                "services": {
                    "database": "healthy",
                    "supabase": "healthy",
                    "cache": "healthy"
                }
            }
        }


# Helper functions for creating responses

def success_response(
    message: str,
    data: Optional[Any] = None,
    meta: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """Create a standard success response"""
    return {
        "success": True,
        "message": message,
        "data": data,
        "meta": meta,
        "timestamp": datetime.utcnow().isoformat()
    }


def paginated_response(
    message: str,
    data: list,
    page: int,
    page_size: int,
    total_items: int
) -> Dict[str, Any]:
    """Create a paginated response"""
    total_pages = (total_items + page_size - 1) // page_size
    
    return {
        "success": True,
        "message": message,
        "data": data,
        "pagination": {
            "page": page,
            "page_size": page_size,
            "total_pages": total_pages,
            "total_items": total_items,
            "has_next": page < total_pages,
            "has_prev": page > 1
        },
        "timestamp": datetime.utcnow().isoformat()
    }


def message_response(message: str) -> Dict[str, Any]:
    """Create a simple message response"""
    return {
        "success": True,
        "message": message,
        "timestamp": datetime.utcnow().isoformat()
    }


def created_response(
    message: str,
    data: Any,
    resource_id: str,
    resource_url: Optional[str] = None
) -> Dict[str, Any]:
    """Create a resource creation response"""
    return {
        "success": True,
        "message": message,
        "data": data,
        "resource_id": resource_id,
        "resource_url": resource_url,
        "timestamp": datetime.utcnow().isoformat()
    }


def deleted_response(message: str, resource_id: str) -> Dict[str, Any]:
    """Create a resource deletion response"""
    return {
        "success": True,
        "message": message,
        "resource_id": resource_id,
        "timestamp": datetime.utcnow().isoformat()
    }

