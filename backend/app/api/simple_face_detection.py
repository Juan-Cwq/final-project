from fastapi import APIRouter, HTTPException, UploadFile, File
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import base64
from ..services.simple_face_detection import simple_face_detection_service

router = APIRouter()

class ImageData(BaseModel):
    image: str  # Base64 encoded image

@router.post("/detect", response_model=Dict[str, Any])
async def detect_faces(data: ImageData):
    """
    Detect faces and basic facial features using OpenCV Haar cascades.
    
    Returns information about detected faces including:
    - Face bounding boxes
    - Basic feature detection (eyes, nose, lips, hair)
    - Confidence scores for each detection
    """
    try:
        result = simple_face_detection_service.detect_faces_and_features(data.image)
        
        if "error" in result:
            raise HTTPException(status_code=400, detail=result["error"])
        
        return {
            "success": True,
            "data": result,
            "message": f"Detected {result['faces_detected']} face(s) using OpenCV"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Face detection failed: {str(e)}")

@router.post("/upload", response_model=Dict[str, Any])
async def upload_and_detect(file: UploadFile = File(...)):
    """
    Upload an image file and detect faces with basic features.
    
    Supports common image formats: JPEG, PNG, GIF, BMP, WEBP
    """
    try:
        # Validate file type
        if not file.content_type.startswith("image/"):
            raise HTTPException(status_code=400, detail="File must be an image")
        
        # Read and encode image
        image_bytes = await file.read()
        image_base64 = base64.b64encode(image_bytes).decode('utf-8')
        
        # Detect faces
        result = simple_face_detection_service.detect_faces_and_features(image_base64)
        
        if "error" in result:
            raise HTTPException(status_code=400, detail=result["error"])
        
        return {
            "success": True,
            "filename": file.filename,
            "file_size": len(image_bytes),
            "data": result,
            "message": f"Processed {file.filename} - detected {result['faces_detected']} face(s)"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"File processing failed: {str(e)}")

@router.get("/health")
async def health_check():
    """Health check endpoint for the simple face detection service."""
    return {
        "status": "healthy",
        "service": "Simple Face Detection API",
        "library": "OpenCV Haar Cascades",
        "accuracy": "Good for basic detection",
        "features": [
            "Face detection",
            "Eye detection", 
            "Smile/mouth detection",
            "Nose estimation",
            "Hair region detection",
            "Real-time processing"
        ]
    }
