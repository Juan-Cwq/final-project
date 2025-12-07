"""
Makeup virtual try-on service using Dlib facial landmarks
"""

import cv2
import numpy as np
from typing import Optional, Tuple
import dlib


class MakeupTryOn:
    """Real-time makeup application using facial landmarks"""
    
    def __init__(self):
        """Initialize Dlib face detector and landmark predictor"""
        self.detector = dlib.get_frontal_face_detector()
        
        # Note: The shape predictor model needs to be downloaded separately
        # Download from: http://dlib.net/files/shape_predictor_68_face_landmarks.dat.bz2
        try:
            self.predictor = dlib.shape_predictor("models/shape_predictor_68_face_landmarks.dat")
        except:
            print("Warning: Dlib shape predictor not found. Download from:")
            print("http://dlib.net/files/shape_predictor_68_face_landmarks.dat.bz2")
            self.predictor = None
    
    def apply_lipstick(self, user_image: np.ndarray, color: str) -> Optional[np.ndarray]:
        """
        Apply lipstick to user image
        
        Args:
            user_image: BGR image of user
            color: Hex color code (e.g., "#E8A89A")
        
        Returns:
            Processed image with lipstick or None if failed
        """
        
        if self.predictor is None:
            print("Dlib predictor not available")
            return user_image
        
        try:
            # Convert hex to BGR
            bgr_color = self._hex_to_bgr(color)
            
            # Convert to grayscale for detection
            gray = cv2.cvtColor(user_image, cv2.COLOR_BGR2GRAY)
            
            # Detect faces
            faces = self.detector(gray)
            
            if len(faces) == 0:
                print("No face detected")
                return user_image
            
            # Use first face
            face = faces[0]
            
            # Get facial landmarks
            landmarks = self.predictor(gray, face)
            
            # Extract lip landmarks (points 48-67)
            lip_points = []
            for i in range(48, 68):
                lip_points.append((landmarks.part(i).x, landmarks.part(i).y))
            
            # Create lip mask using quadrant approach for better handling of open mouths
            mask = np.zeros_like(user_image)
            
            # Upper lip (points 48-54)
            upper_lip = np.array(lip_points[0:7], dtype=np.int32)
            cv2.fillPoly(mask, [upper_lip], bgr_color)
            
            # Lower lip (points 54-60)
            lower_lip = np.array(lip_points[6:12], dtype=np.int32)
            cv2.fillPoly(mask, [lower_lip], bgr_color)
            
            # Inner lip (points 60-67)
            inner_lip = np.array(lip_points[12:], dtype=np.int32)
            cv2.fillPoly(mask, [inner_lip], bgr_color)
            
            # Apply Gaussian blur for natural blending
            mask = cv2.GaussianBlur(mask, (7, 7), 10)
            
            # Create alpha mask
            mask_gray = cv2.cvtColor(mask, cv2.COLOR_BGR2GRAY)
            _, alpha_mask = cv2.threshold(mask_gray, 1, 255, cv2.THRESH_BINARY)
            alpha_mask = alpha_mask.astype(float) / 255.0
            alpha_mask = np.stack([alpha_mask] * 3, axis=2)
            
            # Blend with original image (60% opacity for natural look)
            alpha = 0.6
            result = (alpha * mask * alpha_mask + (1 - alpha * alpha_mask) * user_image).astype(np.uint8)
            
            return result
            
        except Exception as e:
            print(f"Error in makeup try-on: {e}")
            return user_image
    
    def apply_eyeshadow(self, user_image: np.ndarray, color: str) -> Optional[np.ndarray]:
        """
        Apply eyeshadow to user image
        
        Args:
            user_image: BGR image of user
            color: Hex color code
        
        Returns:
            Processed image with eyeshadow
        """
        
        if self.predictor is None:
            return user_image
        
        try:
            bgr_color = self._hex_to_bgr(color)
            gray = cv2.cvtColor(user_image, cv2.COLOR_BGR2GRAY)
            faces = self.detector(gray)
            
            if len(faces) == 0:
                return user_image
            
            face = faces[0]
            landmarks = self.predictor(gray, face)
            
            # Create mask
            mask = np.zeros_like(user_image)
            
            # Left eye (points 36-41)
            left_eye = []
            for i in range(36, 42):
                left_eye.append((landmarks.part(i).x, landmarks.part(i).y))
            left_eye = np.array(left_eye, dtype=np.int32)
            cv2.fillPoly(mask, [left_eye], bgr_color)
            
            # Right eye (points 42-47)
            right_eye = []
            for i in range(42, 48):
                right_eye.append((landmarks.part(i).x, landmarks.part(i).y))
            right_eye = np.array(right_eye, dtype=np.int32)
            cv2.fillPoly(mask, [right_eye], bgr_color)
            
            # Blur for natural look
            mask = cv2.GaussianBlur(mask, (15, 15), 10)
            
            # Blend
            mask_gray = cv2.cvtColor(mask, cv2.COLOR_BGR2GRAY)
            _, alpha_mask = cv2.threshold(mask_gray, 1, 255, cv2.THRESH_BINARY)
            alpha_mask = alpha_mask.astype(float) / 255.0
            alpha_mask = np.stack([alpha_mask] * 3, axis=2)
            
            alpha = 0.4
            result = (alpha * mask * alpha_mask + (1 - alpha * alpha_mask) * user_image).astype(np.uint8)
            
            return result
            
        except Exception as e:
            print(f"Error in eyeshadow application: {e}")
            return user_image
    
    def _hex_to_bgr(self, hex_color: str) -> Tuple[int, int, int]:
        """
        Convert hex color to BGR tuple
        
        Args:
            hex_color: Hex color string (e.g., "#E8A89A")
        
        Returns:
            BGR tuple
        """
        hex_color = hex_color.lstrip('#')
        rgb = tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))
        # Convert RGB to BGR
        return (rgb[2], rgb[1], rgb[0])
