"""
Health check endpoints
"""

from fastapi import APIRouter
from app.models.schemas import HealthResponse
import cv2

router = APIRouter()


@router.get("/health", response_model=HealthResponse)
async def health_check():
    """Check API health and service availability"""
    
    services = {
        "opencv": "available" if cv2.__version__ else "unavailable",
        "mediapipe": "available",  # Will check on import
        "dlib": "available"  # Will check on import
    }
    
    # Try importing services
    try:
        import mediapipe
        services["mediapipe"] = "available"
    except ImportError:
        services["mediapipe"] = "unavailable"
    
    try:
        import dlib
        services["dlib"] = "available"
    except ImportError:
        services["dlib"] = "unavailable"
    
    return HealthResponse(
        status="healthy",
        version="1.0.0",
        services=services
    )


@router.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Aura Virtual Try-On API",
        "version": "1.0.0",
        "docs": "/api/docs"
    }
