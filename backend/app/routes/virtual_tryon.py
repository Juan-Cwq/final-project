"""
Virtual Try-On API Routes
"""

from fastapi import APIRouter, File, UploadFile, Form, HTTPException
from fastapi.responses import Response
import os
import tempfile
from app.services.virtual_tryon_service import VirtualTryOnService, HuggingFaceTryOnService

router = APIRouter()

# Try Hugging Face first (free tier), fallback to Replicate
import os
if os.getenv('HUGGINGFACE_API_TOKEN'):
    tryon_service = HuggingFaceTryOnService()
    print("🤗 Using Hugging Face API for virtual try-on")
else:
    tryon_service = VirtualTryOnService()
    print("🔄 Using Replicate API for virtual try-on")


@router.post("/virtual-clothing")
async def virtual_clothing_tryon(
    user_image: UploadFile = File(...),
    garment_image: UploadFile = File(...),
    category: str = Form("upper_body"),
    garment_type: str = Form("jacket")
):
    """
    Virtual clothing try-on endpoint
    
    Args:
        user_image: User's photo
        garment_image: Clothing item image
        category: Type of clothing (upper_body, lower_body, dresses)
        garment_type: Specific type (jacket, shirt, pants, etc.)
    
    Returns:
        Processed image with clothing overlay
    """
    try:
        # Create temporary files
        with tempfile.NamedTemporaryFile(delete=False, suffix='.jpg') as user_temp:
            user_content = await user_image.read()
            user_temp.write(user_content)
            user_temp_path = user_temp.name
        
        with tempfile.NamedTemporaryFile(delete=False, suffix='.png') as garment_temp:
            garment_content = await garment_image.read()
            garment_temp.write(garment_content)
            garment_temp_path = garment_temp.name
        
        # Process virtual try-on
        result_image = tryon_service.process_clothing_tryon(
            person_image_path=user_temp_path,
            garment_image_path=garment_temp_path,
            category=category
        )
        
        # Clean up temp files
        os.unlink(user_temp_path)
        os.unlink(garment_temp_path)
        
        if result_image is None:
            raise HTTPException(
                status_code=500,
                detail="Virtual try-on processing failed"
            )
        
        # Return processed image
        return Response(
            content=result_image,
            media_type="image/jpeg",
            headers={
                "Content-Disposition": "inline; filename=tryon_result.jpg"
            }
        )
        
    except Exception as e:
        print(f"❌ Virtual try-on endpoint error: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Processing error: {str(e)}"
        )


@router.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "virtual-tryon",
        "api_available": bool(tryon_service.api_token)
    }
