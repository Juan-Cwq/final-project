"""
Pydantic models for request/response validation
"""

from pydantic import BaseModel, Field
from typing import Optional, Literal
from enum import Enum


class TryOnCategory(str, Enum):
    """Product categories for virtual try-on"""
    CLOTHING = "clothing"
    GLASSES = "glasses"
    MAKEUP = "makeup"


class MakeupType(str, Enum):
    """Types of makeup products"""
    LIPSTICK = "lipstick"
    EYESHADOW = "eyeshadow"
    BLUSH = "blush"


class TryOnRequest(BaseModel):
    """Request model for try-on processing"""
    category: TryOnCategory
    product_id: Optional[str] = None
    color: Optional[str] = Field(None, description="Hex color code for makeup")
    makeup_type: Optional[MakeupType] = None
    
    class Config:
        json_schema_extra = {
            "example": {
                "category": "glasses",
                "product_id": "glasses_001"
            }
        }


class TryOnResponse(BaseModel):
    """Response model for try-on processing"""
    success: bool
    message: str
    image_url: Optional[str] = None
    processing_time: Optional[float] = None
    
    class Config:
        json_schema_extra = {
            "example": {
                "success": True,
                "message": "Try-on processed successfully",
                "image_url": "/uploads/tryon_12345.jpg",
                "processing_time": 0.234
            }
        }


class HealthResponse(BaseModel):
    """Health check response"""
    status: str
    version: str
    services: dict
    
    class Config:
        json_schema_extra = {
            "example": {
                "status": "healthy",
                "version": "1.0.0",
                "services": {
                    "opencv": "available",
                    "mediapipe": "available",
                    "dlib": "available"
                }
            }
        }


class ProductItem(BaseModel):
    """Product catalog item"""
    id: str
    name: str
    category: TryOnCategory
    brand: str
    price: float
    image_url: str
    description: Optional[str] = None
    colors: Optional[list[str]] = None
    
    class Config:
        json_schema_extra = {
            "example": {
                "id": "glasses_001",
                "name": "Classic Aviator",
                "category": "glasses",
                "brand": "Ray-Ban",
                "price": 159.99,
                "image_url": "/products/aviator.png",
                "description": "Timeless aviator style"
            }
        }
