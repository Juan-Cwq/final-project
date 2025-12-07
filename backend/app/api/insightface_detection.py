from fastapi import APIRouter, HTTPException, UploadFile, File
from pydantic import BaseModel
from typing import Dict, Any
import base64
from ..services.insightface_detection import insightface_detection_service

router = APIRouter()

class ImageData(BaseModel):
    image: str  # Base64 encoded image

@router.post("/detect-landmarks", response_model=Dict[str, Any])
async def detect_face_landmarks(data: ImageData):
    """
    Detect faces and extract precise 106-point facial landmarks using InsightFace.
    
    Returns detailed facial landmarks including:
    - Face outline (33 points)
    - Left & right eyebrows (9 points each)
    - Nose bridge and tip
    - Left & right eyes (8 points each)
    - Outer and inner lip contours
    - Face embedding for recognition
    """
    try:
        result = insightface_detection_service.detect_faces_and_landmarks(data.image)
        
        if "error" in result:
            raise HTTPException(status_code=400, detail=result["error"])
        
        return {
            "success": True,
            "data": result,
            "message": f"Detected {result['faces_detected']} face(s) with InsightFace 106-point landmarks"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"InsightFace detection failed: {str(e)}")

@router.post("/upload-landmarks", response_model=Dict[str, Any])
async def upload_and_detect_landmarks(file: UploadFile = File(...)):
    """
    Upload an image file and detect faces with precise InsightFace landmarks.
    
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
        result = insightface_detection_service.detect_faces_and_landmarks(image_base64)
        
        if "error" in result:
            raise HTTPException(status_code=400, detail=result["error"])
        
        return {
            "success": True,
            "filename": file.filename,
            "file_size": len(image_bytes),
            "data": result,
            "message": f"Processed {file.filename} - detected {result['faces_detected']} face(s) with InsightFace"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"File processing failed: {str(e)}")

@router.get("/health")
async def health_check():
    """Health check endpoint for the InsightFace detection service."""
    return {
        "status": "healthy",
        "service": "InsightFace Detection API",
        "library": "InsightFace (State-of-the-art)",
        "accuracy": "Professional-grade 106-point landmarks",
        "features": [
            "106-point facial landmarks",
            "Face outline (33 points)",
            "Eye contours (8 points each)", 
            "Eyebrow detection (9 points each)",
            "Nose bridge and tip",
            "Lip contours (outer/inner)",
            "Face embeddings for recognition",
            "Real-time processing",
            "High accuracy face detection"
        ]
    }
