"""
API v1 Routes
All version 1 API route handlers
"""
from app.api.v1.routes import auth_routes, protected

__all__ = [
    "auth_routes",
    "protected"
]

