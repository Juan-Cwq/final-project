"""
Glasses virtual try-on service using Haar Cascades
"""

import cv2
import numpy as np
from typing import Optional
import os


class GlassesTryOn:
    """Real-time glasses overlay using face and eye detection"""
    
    def __init__(self):
        """Initialize Haar Cascade classifiers"""
        # Try to load from OpenCV data directory
        cascade_path = cv2.data.haarcascades
        
        face_cascade_file = os.path.join(cascade_path, 'haarcascade_frontalface_default.xml')
        eye_cascade_file = os.path.join(cascade_path, 'haarcascade_eye.xml')
        
        self.face_cascade = cv2.CascadeClassifier(face_cascade_file)
        self.eye_cascade = cv2.CascadeClassifier(eye_cascade_file)
        
        if self.face_cascade.empty() or self.eye_cascade.empty():
            raise RuntimeError("Failed to load Haar Cascade classifiers")
    
    def apply_glasses(self, user_image: np.ndarray, glasses_image: np.ndarray) -> Optional[np.ndarray]:
        """
        Apply glasses overlay to user image
        
        Args:
            user_image: BGR image of user
            glasses_image: BGRA image of glasses (with transparency)
        
        Returns:
            Processed image with glasses overlay or None if failed
        """
        
        try:
            # Convert to grayscale for detection
            gray = cv2.cvtColor(user_image, cv2.COLOR_BGR2GRAY)
            
            # Detect faces
            faces = self.face_cascade.detectMultiScale(
                gray,
                scaleFactor=1.1,
                minNeighbors=5,
                minSize=(100, 100)
            )
            
            if len(faces) == 0:
                print("No face detected")
                return user_image
            
            # Use the first (largest) face
            (fx, fy, fw, fh) = faces[0]
            
            # Define region of interest for eyes (upper half of face)
            roi_gray = gray[fy:fy + fh//2, fx:fx + fw]
            
            # Detect eyes within face ROI
            eyes = self.eye_cascade.detectMultiScale(
                roi_gray,
                scaleFactor=1.1,
                minNeighbors=10,
                minSize=(20, 20)
            )
            
            if len(eyes) < 2:
                print("Not enough eyes detected")
                return user_image
            
            # Sort eyes by x-coordinate and take the two leftmost
            eyes = sorted(eyes, key=lambda e: e[0])[:2]
            
            # Calculate eye centers (adjusted for face ROI offset)
            eye1_center = (fx + eyes[0][0] + eyes[0][2]//2, fy + eyes[0][1] + eyes[0][3]//2)
            eye2_center = (fx + eyes[1][0] + eyes[1][2]//2, fy + eyes[1][1] + eyes[1][3]//2)
            
            # Ensure left eye is first
            if eye1_center[0] > eye2_center[0]:
                eye1_center, eye2_center = eye2_center, eye1_center
            
            # Calculate inter-eye distance
            eye_distance = int(np.sqrt(
                (eye2_center[0] - eye1_center[0])**2 + 
                (eye2_center[1] - eye1_center[1])**2
            ))
            
            # Scale glasses based on eye distance (2.5x for proper fit)
            glasses_width = int(eye_distance * 2.5)
            
            # Maintain aspect ratio
            aspect_ratio = glasses_image.shape[0] / glasses_image.shape[1]
            glasses_height = int(glasses_width * aspect_ratio)
            
            if glasses_width <= 0 or glasses_height <= 0:
                return user_image
            
            # Resize glasses
            resized_glasses = cv2.resize(
                glasses_image,
                (glasses_width, glasses_height),
                interpolation=cv2.INTER_AREA
            )
            
            # Calculate position (centered on eyes, slightly adjusted)
            x_offset = eye1_center[0] - int(glasses_width * 0.28)
            y_offset = eye1_center[1] - int(glasses_height * 0.45)
            
            # Overlay glasses
            result = self._overlay_with_transparency(user_image, resized_glasses, x_offset, y_offset)
            
            return result
            
        except Exception as e:
            print(f"Error in glasses try-on: {e}")
            return user_image
    
    def _overlay_with_transparency(self, background: np.ndarray, overlay: np.ndarray, x: int, y: int) -> np.ndarray:
        """
        Overlay image with transparency
        
        Args:
            background: Base image
            overlay: Image with alpha channel
            x, y: Position to place overlay
        
        Returns:
            Composited image
        """
        
        bg_h, bg_w = background.shape[:2]
        ov_h, ov_w = overlay.shape[:2]
        
        # Ensure overlay has alpha channel
        if overlay.shape[2] == 3:
            overlay = cv2.cvtColor(overlay, cv2.COLOR_BGR2BGRA)
        
        # Calculate valid region
        x1 = max(0, x)
        y1 = max(0, y)
        x2 = min(bg_w, x + ov_w)
        y2 = min(bg_h, y + ov_h)
        
        # Calculate overlay crop
        ov_x1 = max(0, -x)
        ov_y1 = max(0, -y)
        ov_x2 = ov_x1 + (x2 - x1)
        ov_y2 = ov_y1 + (y2 - y1)
        
        if x1 >= x2 or y1 >= y2:
            return background
        
        # Extract regions
        bg_crop = background[y1:y2, x1:x2]
        ov_crop = overlay[ov_y1:ov_y2, ov_x1:ov_x2]
        
        # Alpha blending
        alpha = ov_crop[:, :, 3:4] / 255.0
        ov_rgb = ov_crop[:, :, :3]
        
        blended = (alpha * ov_rgb + (1 - alpha) * bg_crop).astype(np.uint8)
        
        # Create result
        result = background.copy()
        result[y1:y2, x1:x2] = blended
        
        return result
