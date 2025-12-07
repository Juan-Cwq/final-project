from fastapi import APIRouter, HTTPException, UploadFile, File
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import base64
from ..services.face_detection import face_detection_service

router = APIRouter()

class ImageData(BaseModel):
    image: str  # Base64 encoded image
    
class FaceComparisonRequest(BaseModel):
    known_encoding: List[float]
    unknown_encoding: List[float]
    tolerance: Optional[float] = 0.6

@router.post("/detect", response_model=Dict[str, Any])
async def detect_faces(data: ImageData):
    """
    Detect faces and extract facial landmarks from an image.
    
    Returns detailed information about detected faces including:
    - Face bounding boxes with high confidence
    - 68-point facial landmarks
    - Individual feature bounding boxes (eyes, nose, lips, etc.)
    - Face encodings for recognition
    """
    try:
        result = face_detection_service.detect_faces_and_landmarks(data.image)
        
        if "error" in result:
            raise HTTPException(status_code=400, detail=result["error"])
        
        return {
            "success": True,
            "data": result,
            "message": f"Detected {result['faces_detected']} face(s) with professional accuracy"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Face detection failed: {str(e)}")

@router.post("/encode", response_model=Dict[str, Any])
async def get_face_encoding(data: ImageData):
    """
    Extract face encoding from an image for face recognition purposes.
    
    Returns a 128-dimensional face encoding that can be used for:
    - Face recognition and identification
    - Face comparison and matching
    - Building face databases
    """
    try:
        encoding = face_detection_service.get_face_encoding(data.image)
        
        if encoding is None:
            raise HTTPException(status_code=404, detail="No face found in image")
        
        return {
            "success": True,
            "encoding": encoding,
            "encoding_length": len(encoding),
            "message": "Face encoding extracted successfully"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Face encoding failed: {str(e)}")

@router.post("/compare", response_model=Dict[str, Any])
async def compare_faces(data: FaceComparisonRequest):
    """
    Compare two face encodings to determine if they represent the same person.
    
    Uses advanced facial recognition algorithms to calculate similarity.
    Returns match status, confidence score, and face distance.
    """
    try:
        result = face_detection_service.compare_faces(
            data.known_encoding, 
            data.unknown_encoding, 
            data.tolerance
        )
        
        if "error" in result:
            raise HTTPException(status_code=400, detail=result["error"])
        
        return {
            "success": True,
            "comparison": result,
            "message": "Face comparison completed successfully"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Face comparison failed: {str(e)}")

@router.post("/upload", response_model=Dict[str, Any])
async def upload_and_detect(file: UploadFile = File(...)):
    """
    Upload an image file and detect faces with landmarks.
    
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
        result = face_detection_service.detect_faces_and_landmarks(image_base64)
        
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
    """Health check endpoint for the face detection service."""
    return {
        "status": "healthy",
        "service": "Face Detection API",
        "library": "face_recognition v1.3.0",
        "accuracy": "99.38%",
        "features": [
            "Face detection",
            "Facial landmarks (68 points)",
            "Face encoding",
            "Face comparison",
            "Real-time processing"
        ]
    }
