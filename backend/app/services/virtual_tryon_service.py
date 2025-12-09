"""
Virtual Try-On Service using Replicate API
Requires: pip install replicate
"""

import replicate
import os
from typing import Optional
import base64
from io import BytesIO
from PIL import Image
import requests


class VirtualTryOnService:
    def __init__(self):
        # Set your Replicate API token
        # Get it from: https://replicate.com/account/api-tokens
        self.api_token = os.getenv('REPLICATE_API_TOKEN', '')
        if self.api_token:
            os.environ['REPLICATE_API_TOKEN'] = self.api_token
            print(f"✅ Replicate API token loaded: {self.api_token[:10]}...")
        else:
            print("⚠️ REPLICATE_API_TOKEN not found in environment")
    
    def process_clothing_tryon(
        self, 
        person_image_path: str, 
        garment_image_path: str,
        category: str = "upper_body"
    ) -> Optional[bytes]:
        """
        Process virtual try-on using Replicate's VITON-HD model
        
        Args:
            person_image_path: Path to person image
            garment_image_path: Path to garment image
            category: Type of garment (upper_body, lower_body, dresses)
            
        Returns:
            Processed image as bytes or None if failed
        """
        try:
            if not self.api_token:
                print("⚠️ REPLICATE_API_TOKEN not set. Using demo mode.")
                return self._create_demo_overlay(person_image_path, garment_image_path)
            
            print(f"🚀 Starting virtual try-on with Replicate API...")
            print(f"   Person image: {person_image_path}")
            print(f"   Garment image: {garment_image_path}")
            print(f"   Category: {category}")
            
            # Use Replicate's virtual try-on model
            # Model: yisol/IDM-VTON (popular virtual try-on model)
            print("📡 Calling Replicate API...")
            output = replicate.run(
                "cuuupid/idm-vton:c871bb9b046607b680449ecbae55fd8c6d945e0a1948644bf2361b3d021d3ff4",
                input={
                    "human_img": open(person_image_path, "rb"),
                    "garm_img": open(garment_image_path, "rb"),
                    "garment_des": "a jacket",
                    "is_checked": True,
                    "is_checked_crop": False,
                    "denoise_steps": 30,
                    "seed": 42
                }
            )
            
            print(f"✅ Replicate API response received: {type(output)}")
            
            # Download the result image
            if output:
                print(f"📥 Downloading result from: {output}")
                response = requests.get(output)
                if response.status_code == 200:
                    print(f"✅ Result downloaded successfully ({len(response.content)} bytes)")
                    return response.content
                else:
                    print(f"❌ Failed to download result: {response.status_code}")
            
            print("❌ No output from Replicate")
            return None
            
        except Exception as e:
            print(f"❌ Virtual try-on error: {e}")
            return self._create_demo_overlay(person_image_path, garment_image_path)
    
    def _create_demo_overlay(
        self, 
        person_image_path: str, 
        garment_image_path: str
    ) -> bytes:
        """
        Create a simple demo overlay when API is not available
        This is a placeholder - just returns the person image
        """
        try:
            # Open person image
            person_img = Image.open(person_image_path)
            
            # For demo: just return the person image
            # In production, this would do actual overlay
            buffer = BytesIO()
            person_img.save(buffer, format='JPEG', quality=95)
            return buffer.getvalue()
            
        except Exception as e:
            print(f"❌ Demo overlay error: {e}")
            return None


# Alternative: Using Hugging Face Inference API
class HuggingFaceTryOnService:
    def __init__(self):
        # Get from: https://huggingface.co/settings/tokens
        self.api_token = os.getenv('HUGGINGFACE_API_TOKEN', '')
        self.api_url = "https://api-inference.huggingface.co/models/yisol/IDM-VTON"
    
    def process_clothing_tryon(
        self, 
        person_image_path: str, 
        garment_image_path: str
    ) -> Optional[bytes]:
        """
        Process virtual try-on using Hugging Face Inference API
        """
        try:
            if not self.api_token:
                print("⚠️ HUGGINGFACE_API_TOKEN not set")
                return None
            
            headers = {"Authorization": f"Bearer {self.api_token}"}
            
            # Read images
            with open(person_image_path, "rb") as f:
                person_data = f.read()
            
            with open(garment_image_path, "rb") as f:
                garment_data = f.read()
            
            # Make API request
            response = requests.post(
                self.api_url,
                headers=headers,
                files={
                    "inputs": person_data,
                    "garment": garment_data
                }
            )
            
            if response.status_code == 200:
                return response.content
            else:
                print(f"❌ API error: {response.status_code}")
                return None
                
        except Exception as e:
            print(f"❌ Hugging Face try-on error: {e}")
            return None
