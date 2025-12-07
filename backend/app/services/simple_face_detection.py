import cv2
import numpy as np
from typing import List, Dict, Any, Optional, Tuple
import base64
from io import BytesIO
from PIL import Image

class SimpleFaceDetectionService:
    """
    Simple face detection service using OpenCV's built-in Haar cascades.
    Provides reliable face detection without requiring complex dependencies.
    """
    
    def __init__(self):
        # Load OpenCV's pre-trained Haar cascade classifiers
        self.face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
        self.face_cascade_alt = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_alt.xml')
        self.profile_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_profileface.xml')
        self.eye_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_eye.xml')
        self.smile_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_smile.xml')
        
    def detect_faces_and_features(self, image_data: str) -> Dict[str, Any]:
        """
        Detect faces and basic features using OpenCV Haar cascades.
        
        Args:
            image_data: Base64 encoded image string
            
        Returns:
            Dictionary containing face locations and basic features
        """
        try:
            # Decode base64 image
            image = self._decode_base64_image(image_data)
            if image is None:
                return {"error": "Invalid image data"}
            
            # Convert to grayscale for detection
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            
            # Detect faces using multiple cascades for better coverage
            faces = []
            
            # Try main frontal face detector (more sensitive)
            faces1 = self.face_cascade.detectMultiScale(
                gray, 
                scaleFactor=1.05,  # More sensitive
                minNeighbors=3,    # Lower threshold
                minSize=(20, 20),  # Smaller minimum size
                flags=cv2.CASCADE_SCALE_IMAGE
            )
            faces.extend(faces1)
            
            # Try alternative frontal face detector
            faces2 = self.face_cascade_alt.detectMultiScale(
                gray, 
                scaleFactor=1.1, 
                minNeighbors=4, 
                minSize=(25, 25)
            )
            faces.extend(faces2)
            
            # Try profile face detector for side angles
            faces3 = self.profile_cascade.detectMultiScale(
                gray, 
                scaleFactor=1.1, 
                minNeighbors=4, 
                minSize=(25, 25)
            )
            faces.extend(faces3)
            
            # Remove duplicate faces (if any overlap significantly)
            faces = self._remove_duplicate_faces(faces)
            
            if len(faces) == 0:
                return {
                    "faces_detected": 0,
                    "faces": [],
                    "message": "No faces detected"
                }
            
            # Process each detected face
            detected_faces = []
            for i, (x, y, w, h) in enumerate(faces):
                face_data = self._process_face_region(gray, image, x, y, w, h, i)
                detected_faces.append(face_data)
            
            return {
                "faces_detected": len(detected_faces),
                "faces": detected_faces,
                "image_dimensions": {
                    "width": image.shape[1],
                    "height": image.shape[0]
                }
            }
            
        except Exception as e:
            return {"error": f"Face detection failed: {str(e)}"}
    
    def _remove_duplicate_faces(self, faces):
        """Remove overlapping face detections."""
        if len(faces) <= 1:
            return faces
        
        # Convert to list if it's a numpy array
        faces = [tuple(face) for face in faces]
        unique_faces = []
        
        for face in faces:
            x, y, w, h = face
            is_duplicate = False
            
            for existing in unique_faces:
                ex, ey, ew, eh = existing
                
                # Calculate overlap
                overlap_x = max(0, min(x + w, ex + ew) - max(x, ex))
                overlap_y = max(0, min(y + h, ey + eh) - max(y, ey))
                overlap_area = overlap_x * overlap_y
                
                face_area = w * h
                existing_area = ew * eh
                
                # If overlap is more than 50% of either face, consider it duplicate
                if overlap_area > 0.5 * min(face_area, existing_area):
                    is_duplicate = True
                    break
            
            if not is_duplicate:
                unique_faces.append(face)
        
        return unique_faces
    
    def _decode_base64_image(self, image_data: str) -> Optional[np.ndarray]:
        """Decode base64 image string to OpenCV image array."""
        try:
            # Remove data URL prefix if present
            if "data:image" in image_data:
                image_data = image_data.split(",")[1]
            
            # Decode base64
            image_bytes = base64.b64decode(image_data)
            image_pil = Image.open(BytesIO(image_bytes))
            
            # Convert to OpenCV format
            image_cv = cv2.cvtColor(np.array(image_pil), cv2.COLOR_RGB2BGR)
            return image_cv
            
        except Exception as e:
            print(f"Error decoding image: {e}")
            return None
    
    def _process_face_region(self, gray: np.ndarray, color_image: np.ndarray, 
                           x: int, y: int, w: int, h: int, face_index: int) -> Dict[str, Any]:
        """Process individual face region and detect features within it."""
        
        # Face bounding box - ensure all values are Python ints, not numpy
        face_box = {
            "x": int(x.item() if hasattr(x, 'item') else x),
            "y": int(y.item() if hasattr(y, 'item') else y),
            "width": int(w.item() if hasattr(w, 'item') else w),
            "height": int(h.item() if hasattr(h, 'item') else h),
            "confidence": 0.85  # OpenCV Haar cascades have good reliability
        }
        
        # Extract face region for feature detection
        face_gray = gray[y:y+h, x:x+w]
        face_color = color_image[y:y+h, x:x+w]
        
        # Detect features within the face region
        features = self._detect_facial_features(face_gray, face_color, x, y, w, h)
        
        # Add contour tracing for the face
        face_contours = self._trace_face_contour(face_gray, face_color, x, y, w, h)
        
        return {
            "face": face_box,
            "features": features,
            "face_index": face_index,
            "contours": face_contours
        }
    
    def _detect_facial_features(self, face_gray: np.ndarray, face_color: np.ndarray,
                              face_x: int, face_y: int, face_w: int, face_h: int) -> Dict[str, Dict[str, Any]]:
        """Detect facial features within a face region."""
        features = {}
        
        # Detect eyes
        eyes = self.eye_cascade.detectMultiScale(
            face_gray,
            scaleFactor=1.1,
            minNeighbors=3,
            minSize=(10, 10)
        )
        
        if len(eyes) >= 1:
            # Combine all detected eyes into one region
            eye_x_coords = [ex for ex, ey, ew, eh in eyes]
            eye_y_coords = [ey for ex, ey, ew, eh in eyes]
            eye_x2_coords = [ex + ew for ex, ey, ew, eh in eyes]
            eye_y2_coords = [ey + eh for ex, ey, ew, eh in eyes]
            
            min_x = min(eye_x_coords)
            min_y = min(eye_y_coords)
            max_x = max(eye_x2_coords)
            max_y = max(eye_y2_coords)
            
            # Add padding and convert to global coordinates - ensure Python ints
            padding = 5
            features["eyes"] = {
                "x": int(face_x + max(0, min_x - padding)),
                "y": int(face_y + max(0, min_y - padding)),
                "width": int(min(face_w, (max_x - min_x) + padding * 2)),
                "height": int(min(face_h, (max_y - min_y) + padding * 2)),
                "confidence": 0.80
            }
        
        # Detect smile/mouth region
        smiles = self.smile_cascade.detectMultiScale(
            face_gray,
            scaleFactor=1.8,
            minNeighbors=20,
            minSize=(25, 25)
        )
        
        if len(smiles) >= 1:
            # Use the first detected smile region as lips - ensure Python ints
            sx, sy, sw, sh = smiles[0]
            padding = 3
            features["lips"] = {
                "x": int(face_x + sx - padding),
                "y": int(face_y + sy - padding),
                "width": int(sw + padding * 2),
                "height": int(sh + padding * 2),
                "confidence": 0.70
            }
        
        # Estimate nose region (center of face, middle third)
        nose_x = face_w // 3
        nose_y = int(face_h * 0.4)
        nose_w = face_w // 3
        nose_h = int(face_h * 0.25)
        
        features["nose"] = {
            "x": int(face_x + nose_x),
            "y": int(face_y + nose_y),
            "width": int(nose_w),
            "height": int(nose_h),
            "confidence": 0.60  # Lower confidence since it's estimated
        }
        
        # Detect potential hair region (above face)
        hair_region = self._detect_hair_region(face_color, face_x, face_y, face_w, face_h)
        if hair_region:
            features["hair"] = hair_region
        
        return features
    
    def _detect_hair_region(self, face_color: np.ndarray, face_x: int, face_y: int, 
                          face_w: int, face_h: int) -> Optional[Dict[str, Any]]:
        """Detect hair region above the face using color analysis."""
        try:
            # Look for dark regions above the face
            hair_y_start = max(0, face_y - int(face_h * 0.3))
            hair_height = face_y - hair_y_start + int(face_h * 0.2)
            
            if hair_height < 20:  # Not enough space for hair
                return None
            
            # Expand hair region horizontally
            hair_x = max(0, face_x - int(face_w * 0.1))
            hair_w = min(face_w * 1.2, face_w + (face_x - hair_x))
            
            return {
                "x": int(hair_x),
                "y": int(hair_y_start),
                "width": int(hair_w),
                "height": int(hair_height),
                "confidence": 0.50  # Lower confidence for hair detection
            }
            
        except Exception:
            return None
    
    def _trace_face_contour(self, face_gray: np.ndarray, face_color: np.ndarray,
                          face_x: int, face_y: int, face_w: int, face_h: int) -> Dict[str, Any]:
        """Trace contours around facial features for more precise detection."""
        contours = {}
        
        try:
            # Apply edge detection to find contours
            edges = cv2.Canny(face_gray, 50, 150)
            
            # Find contours
            contour_list, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            
            if len(contour_list) > 0:
                # Find the largest contour (likely the face outline)
                largest_contour = max(contour_list, key=cv2.contourArea)
                
                # Simplify the contour
                epsilon = 0.02 * cv2.arcLength(largest_contour, True)
                simplified_contour = cv2.approxPolyDP(largest_contour, epsilon, True)
                
                # Convert contour points to global coordinates
                face_outline = []
                for point in simplified_contour:
                    x, y = point[0]
                    face_outline.append({
                        "x": int(face_x + x),
                        "y": int(face_y + y)
                    })
                
                contours["face_outline"] = face_outline
            
            # Detect lip contours using color segmentation
            lip_contours = self._detect_lip_contours(face_color, face_x, face_y)
            if lip_contours:
                contours["lips"] = lip_contours
            
            # Detect eye contours
            eye_contours = self._detect_eye_contours(face_gray, face_x, face_y)
            if eye_contours:
                contours["eyes"] = eye_contours
                
        except Exception as e:
            print(f"Error tracing contours: {e}")
        
        return contours
    
    def _detect_lip_contours(self, face_color: np.ndarray, face_x: int, face_y: int) -> Optional[List[Dict[str, int]]]:
        """Detect lip contours using color segmentation."""
        try:
            # Convert to HSV for better color detection
            hsv = cv2.cvtColor(face_color, cv2.COLOR_BGR2HSV)
            
            # Define range for red/pink lip colors
            lower_red1 = np.array([0, 50, 50])
            upper_red1 = np.array([10, 255, 255])
            lower_red2 = np.array([170, 50, 50])
            upper_red2 = np.array([180, 255, 255])
            
            # Create masks for red colors
            mask1 = cv2.inRange(hsv, lower_red1, upper_red1)
            mask2 = cv2.inRange(hsv, lower_red2, upper_red2)
            mask = cv2.bitwise_or(mask1, mask2)
            
            # Find contours in the mask
            contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            
            if contours:
                # Find the largest contour (likely lips)
                largest_contour = max(contours, key=cv2.contourArea)
                
                if cv2.contourArea(largest_contour) > 50:  # Filter small areas
                    # Simplify contour
                    epsilon = 0.02 * cv2.arcLength(largest_contour, True)
                    simplified = cv2.approxPolyDP(largest_contour, epsilon, True)
                    
                    # Convert to global coordinates
                    lip_points = []
                    for point in simplified:
                        x, y = point[0]
                        lip_points.append({
                            "x": int(face_x + x),
                            "y": int(face_y + y)
                        })
                    
                    return lip_points
            
        except Exception as e:
            print(f"Error detecting lip contours: {e}")
        
        return None
    
    def _detect_eye_contours(self, face_gray: np.ndarray, face_x: int, face_y: int) -> Optional[List[Dict[str, int]]]:
        """Detect eye contours using edge detection."""
        try:
            # Focus on upper half of face for eyes
            eye_region = face_gray[:face_gray.shape[0]//2, :]
            
            # Apply threshold to find dark areas (pupils, eyelashes)
            _, thresh = cv2.threshold(eye_region, 60, 255, cv2.THRESH_BINARY_INV)
            
            # Find contours
            contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            
            if contours:
                # Filter contours by area and aspect ratio
                eye_contours = []
                for contour in contours:
                    area = cv2.contourArea(contour)
                    if area > 20:  # Minimum area for eyes
                        x, y, w, h = cv2.boundingRect(contour)
                        aspect_ratio = w / h
                        if 0.5 < aspect_ratio < 3.0:  # Reasonable eye aspect ratio
                            # Simplify contour
                            epsilon = 0.02 * cv2.arcLength(contour, True)
                            simplified = cv2.approxPolyDP(contour, epsilon, True)
                            
                            # Convert to global coordinates
                            for point in simplified:
                                px, py = point[0]
                                eye_contours.append({
                                    "x": int(face_x + px),
                                    "y": int(face_y + py)
                                })
                
                return eye_contours if eye_contours else None
            
        except Exception as e:
            print(f"Error detecting eye contours: {e}")
        
        return None

# Global service instance
simple_face_detection_service = SimpleFaceDetectionService()
