"""
Clothing virtual try-on service using Mediapipe Pose
"""

import cv2
import numpy as np
import mediapipe as mp
from typing import Optional


class ClothingTryOn:
    """Real-time clothing overlay using pose estimation"""
    
    def __init__(self):
        """Initialize Mediapipe Pose"""
        self.mp_pose = mp.solutions.pose
        self.pose = self.mp_pose.Pose(
            static_image_mode=True,
            model_complexity=2,
            enable_segmentation=False,
            min_detection_confidence=0.5
        )
    
    def apply_clothing(self, user_image: np.ndarray, clothing_image: np.ndarray) -> Optional[np.ndarray]:
        """
        Apply clothing overlay to user image
        
        Args:
            user_image: BGR image of user
            clothing_image: BGRA image of clothing (with transparency)
        
        Returns:
            Processed image with clothing overlay or None if failed
        """
        
        try:
            # Convert to RGB for Mediapipe
            image_rgb = cv2.cvtColor(user_image, cv2.COLOR_BGR2RGB)
            results = self.pose.process(image_rgb)
            
            if not results.pose_landmarks:
                print("No pose detected")
                return user_image
            
            # Get image dimensions
            h, w = user_image.shape[:2]
            landmarks = results.pose_landmarks.landmark
            
            # Get key body landmarks
            left_shoulder = landmarks[self.mp_pose.PoseLandmark.LEFT_SHOULDER]
            right_shoulder = landmarks[self.mp_pose.PoseLandmark.RIGHT_SHOULDER]
            left_hip = landmarks[self.mp_pose.PoseLandmark.LEFT_HIP]
            right_hip = landmarks[self.mp_pose.PoseLandmark.RIGHT_HIP]
            
            # Convert normalized coordinates to pixels
            ls_x, ls_y = int(left_shoulder.x * w), int(left_shoulder.y * h)
            rs_x, rs_y = int(right_shoulder.x * w), int(right_shoulder.y * h)
            lh_x, lh_y = int(left_hip.x * w), int(left_hip.y * h)
            rh_x, rh_y = int(right_hip.x * w), int(right_hip.y * h)
            
            # Calculate torso dimensions
            shoulder_width = int(np.sqrt((rs_x - ls_x)**2 + (rs_y - ls_y)**2))
            torso_height = int(np.sqrt((ls_x - lh_x)**2 + (ls_y - lh_y)**2))
            
            # Scale clothing to fit torso (add 40% width for natural fit)
            clothing_width = int(shoulder_width * 1.4)
            clothing_height = int(torso_height * 1.2)
            
            if clothing_width <= 0 or clothing_height <= 0:
                return user_image
            
            # Resize clothing
            resized_clothing = cv2.resize(
                clothing_image,
                (clothing_width, clothing_height),
                interpolation=cv2.INTER_AREA
            )
            
            # Calculate position (center on shoulders)
            shoulder_center_x = (ls_x + rs_x) // 2
            shoulder_center_y = (ls_y + rs_y) // 2
            
            x_offset = shoulder_center_x - clothing_width // 2
            y_offset = shoulder_center_y - int(clothing_height * 0.1)  # Slightly above shoulders
            
            # Overlay clothing with alpha blending
            result = self._overlay_image(user_image, resized_clothing, x_offset, y_offset)
            
            return result
            
        except Exception as e:
            print(f"Error in clothing try-on: {e}")
            return user_image
    
    def _overlay_image(self, background: np.ndarray, overlay: np.ndarray, x: int, y: int) -> np.ndarray:
        """
        Overlay image with alpha channel onto background
        
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
        
        # Calculate valid overlay region
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
    
    def __del__(self):
        """Cleanup"""
        if hasattr(self, 'pose'):
            self.pose.close()
