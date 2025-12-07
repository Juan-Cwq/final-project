from fastapi import APIRouter, HTTPException, UploadFile, File
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import base64
from ..services.advanced_face_detection import advanced_face_detection_service

router = APIRouter()

class ImageData(BaseModel):
    image: str  # Base64 encoded image

@router.post("/detect-landmarks", response_model=Dict[str, Any])
async def detect_face_landmarks(data: ImageData):
    """
    Detect faces and extract precise 68-point facial landmarks for feature outlining.
    
    Returns detailed facial landmarks including:
    - Face outline (jawline)
    - Eye outlines (left and right)
    - Eyebrow shapes
    - Nose bridge and tip
    - Mouth outline (outer and inner lip)
    """
    try:
        result = advanced_face_detection_service.detect_faces_and_landmarks(data.image)
        
        if "error" in result:
            raise HTTPException(status_code=400, detail=result["error"])
        
        return {
            "success": True,
            "data": result,
            "message": f"Detected {result['faces_detected']} face(s) with precise landmarks"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Advanced face detection failed: {str(e)}")

@router.post("/upload-landmarks", response_model=Dict[str, Any])
async def upload_and_detect_landmarks(file: UploadFile = File(...)):
    """
    Upload an image file and detect faces with precise landmarks.
    
    Supports common image formats: JPEG, PNG, GIF, BMP, WEBP
    """
    try:
        # Validate file type
        if not file.content_type.startswith("image/"):
            raise HTTPException(status_code=400, detail="File must be an image")
        
        # Read and encode image
        image_bytes = await file.read()
        image_base64 = base64.b64encode(image_bytes).decode('utf-8')
        
        # Detect faces with landmarks
        result = advanced_face_detection_service.detect_faces_and_landmarks(image_base64)
        
        if "error" in result:
            raise HTTPException(status_code=400, detail=result["error"])
        
        return {
            "success": True,
            "filename": file.filename,
            "file_size": len(image_bytes),
            "data": result,
            "message": f"Processed {file.filename} - detected {result['faces_detected']} face(s) with landmarks"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"File processing failed: {str(e)}")

@router.get("/health")
async def health_check():
    """Health check endpoint for the advanced face detection service."""
    return {
        "status": "healthy",
        "service": "Advanced Face Detection API",
        "library": "OpenCV + Custom Landmarks",
        "accuracy": "Professional-grade facial landmarks",
        "features": [
            "68-point facial landmarks",
            "Face outline detection",
            "Eye shape outlining", 
            "Eyebrow detection",
            "Nose bridge and tip",
            "Mouth outline (outer/inner lip)",
            "Real-time processing"
        ]
    }
