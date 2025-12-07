"""
Virtual try-on endpoints
"""

from fastapi import APIRouter, UploadFile, File, HTTPException, Form
from fastapi.responses import StreamingResponse
from app.models.schemas import TryOnCategory, TryOnResponse
from app.services.clothing import ClothingTryOn
from app.services.glasses import GlassesTryOn
from app.services.makeup import MakeupTryOn
import cv2
import numpy as np
from io import BytesIO
import time

router = APIRouter()

# Initialize services
clothing_service = ClothingTryOn()
glasses_service = GlassesTryOn()
makeup_service = MakeupTryOn()


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
        
        # Process based on category
        result_img = None
        
        if category == "clothing":
            if product_image is None:
                raise HTTPException(status_code=400, detail="Product image required for clothing")
            
            product_contents = await product_image.read()
            product_arr = np.frombuffer(product_contents, np.uint8)
            product_img = cv2.imdecode(product_arr, cv2.IMREAD_UNCHANGED)
            
            result_img = clothing_service.apply_clothing(user_img, product_img)
        
        elif category == "glasses":
            if product_image is None:
                raise HTTPException(status_code=400, detail="Product image required for glasses")
            
            product_contents = await product_image.read()
            product_arr = np.frombuffer(product_contents, np.uint8)
            product_img = cv2.imdecode(product_arr, cv2.IMREAD_UNCHANGED)
            
            result_img = glasses_service.apply_glasses(user_img, product_img)
        
        elif category == "makeup":
            if color is None:
                color = "#E8A89A"  # Default Aura peach
            
            result_img = makeup_service.apply_lipstick(user_img, color)
        
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
        
        # Process based on category
        result_img = None
        
        if category == "clothing" and product_image:
            product_contents = await product_image.read()
            product_arr = np.frombuffer(product_contents, np.uint8)
            product_img = cv2.imdecode(product_arr, cv2.IMREAD_UNCHANGED)
            result_img = clothing_service.apply_clothing(user_img, product_img)
        
        elif category == "glasses" and product_image:
            product_contents = await product_image.read()
            product_arr = np.frombuffer(product_contents, np.uint8)
            product_img = cv2.imdecode(product_arr, cv2.IMREAD_UNCHANGED)
            result_img = glasses_service.apply_glasses(user_img, product_img)
        
        elif category == "makeup":
            if color is None:
                color = "#E8A89A"
            result_img = makeup_service.apply_lipstick(user_img, color)
        
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
