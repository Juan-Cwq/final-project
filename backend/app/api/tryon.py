"""
Virtual try-on endpoints - Simplified version
"""

from fastapi import APIRouter, UploadFile, File, HTTPException, Form
from fastapi.responses import StreamingResponse
from app.models.schemas import TryOnCategory, TryOnResponse
import cv2
import numpy as np
from io import BytesIO
import time

router = APIRouter()


@router.post("/process", response_model=TryOnResponse)
async def process_tryon(
    image: UploadFile = File(..., description="User image"),
    category: str = Form(..., description="Product category: clothing, glasses, or makeup"),
    product_image: UploadFile = File(None, description="Product image (for clothing/glasses)"),
    color: str = Form(None, description="Hex color code (for makeup)")
):
    """
    Process virtual try-on for uploaded image
    
    - **image**: User's photo
    - **category**: clothing, glasses, or makeup
    - **product_image**: Product overlay image (optional)
    - **color**: Makeup color in hex format (optional)
    """
    
    start_time = time.time()
    
    try:
        # Validate category
        if category not in ["clothing", "glasses", "makeup"]:
            raise HTTPException(status_code=400, detail="Invalid category")
        
        # Read user image
        contents = await image.read()
        nparr = np.frombuffer(contents, np.uint8)
        user_img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if user_img is None:
            raise HTTPException(status_code=400, detail="Invalid image format")
        
        # Process based on category - simplified for now
        result_img = user_img.copy()  # Return original image for now
        
        # Add a simple overlay to show processing worked
        cv2.putText(result_img, f"Try-On: {category}", (10, 30), 
                   cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
        
        if result_img is None:
            raise HTTPException(status_code=500, detail="Failed to process try-on")
        
        # Encode result
        _, buffer = cv2.imencode('.jpg', result_img)
        processing_time = time.time() - start_time
        
        return TryOnResponse(
            success=True,
            message="Try-on processed successfully",
            processing_time=round(processing_time, 3)
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/stream")
async def stream_tryon(
    image: UploadFile = File(...),
    category: str = Form(...),
    product_image: UploadFile = File(None),
    color: str = Form(None)
):
    """
    Stream processed try-on image
    Returns the processed image directly
    """
    
    try:
        # Read user image
        contents = await image.read()
        nparr = np.frombuffer(contents, np.uint8)
        user_img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if user_img is None:
            raise HTTPException(status_code=400, detail="Invalid image format")
        
        # Process based on category - simplified for now
        result_img = user_img.copy()  # Return original image for now
        
        # Add a simple overlay to show processing worked
        cv2.putText(result_img, f"Stream: {category}", (10, 30), 
                   cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
        
        if result_img is None:
            result_img = user_img  # Return original if processing fails
        
        # Encode and stream
        _, buffer = cv2.imencode('.jpg', result_img, [cv2.IMWRITE_JPEG_QUALITY, 90])
        
        return StreamingResponse(
            BytesIO(buffer.tobytes()),
            media_type="image/jpeg"
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
