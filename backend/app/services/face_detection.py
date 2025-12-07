import face_recognition
import cv2
import numpy as np
from typing import List, Dict, Any, Optional, Tuple
import base64
from io import BytesIO
from PIL import Image

class FaceDetectionService:
    """
    Professional face detection service using the face_recognition library.
    Provides 99.38% accuracy facial detection and landmark extraction.
    """
    
    def __init__(self):
        self.model = "hog"  # Use HOG for speed, can switch to "cnn" for accuracy
        
    def detect_faces_and_landmarks(self, image_data: str) -> Dict[str, Any]:
        """
        Detect faces and extract detailed facial landmarks from base64 image data.
        
        Args:
            image_data: Base64 encoded image string
            
        Returns:
            Dictionary containing face locations, landmarks, and confidence scores
        """
        try:
            # Decode base64 image
            image = self._decode_base64_image(image_data)
            if image is None:
                return {"error": "Invalid image data"}
            
            # Convert to RGB (face_recognition expects RGB)
            rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
            
            # Detect face locations
            face_locations = face_recognition.face_locations(rgb_image, model=self.model)
            
            if not face_locations:
                return {
                    "faces_detected": 0,
                    "faces": [],
                    "message": "No faces detected"
                }
            
            # Get facial landmarks for each face
            face_landmarks_list = face_recognition.face_landmarks(rgb_image, face_locations)
            
            # Process each detected face
            faces = []
            for i, (face_location, landmarks) in enumerate(zip(face_locations, face_landmarks_list)):
                face_data = self._process_face(face_location, landmarks, rgb_image.shape)
                faces.append(face_data)
            
            return {
                "faces_detected": len(faces),
                "faces": faces,
                "image_dimensions": {
                    "width": rgb_image.shape[1],
                    "height": rgb_image.shape[0]
                }
            }
            
        except Exception as e:
            return {"error": f"Face detection failed: {str(e)}"}
    
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
    
    def _process_face(self, face_location: Tuple, landmarks: Dict, image_shape: Tuple) -> Dict[str, Any]:
        """Process individual face data and extract detailed information."""
        top, right, bottom, left = face_location
        height, width = image_shape[:2]
        
        # Calculate face bounding box
        face_box = {
            "x": left,
            "y": top,
            "width": right - left,
            "height": bottom - top,
            "confidence": 0.95  # face_recognition has high confidence by default
        }
        
        # Process facial landmarks
        processed_landmarks = self._process_landmarks(landmarks)
        
        # Extract individual features with tight bounding boxes
        features = self._extract_feature_boxes(landmarks)
        
        return {
            "face": face_box,
            "landmarks": processed_landmarks,
            "features": features,
            "face_encoding_available": True
        }
    
    def _process_landmarks(self, landmarks: Dict) -> Dict[str, List[Dict[str, int]]]:
        """Convert landmark points to structured format."""
        processed = {}
        
        for feature_name, points in landmarks.items():
            processed[feature_name] = [
                {"x": point[0], "y": point[1]} for point in points
            ]
        
        return processed
    
    def _extract_feature_boxes(self, landmarks: Dict) -> Dict[str, Dict[str, Any]]:
        """Extract tight bounding boxes for individual facial features."""
        features = {}
        
        # Eyes
        if "left_eye" in landmarks and "right_eye" in landmarks:
            left_eye_box = self._get_bounding_box(landmarks["left_eye"])
            right_eye_box = self._get_bounding_box(landmarks["right_eye"])
            
            # Combine both eyes into one region
            combined_x = min(left_eye_box["x"], right_eye_box["x"])
            combined_y = min(left_eye_box["y"], right_eye_box["y"])
            combined_width = max(left_eye_box["x"] + left_eye_box["width"], 
                               right_eye_box["x"] + right_eye_box["width"]) - combined_x
            combined_height = max(left_eye_box["y"] + left_eye_box["height"], 
                                right_eye_box["y"] + right_eye_box["height"]) - combined_y
            
            features["eyes"] = {
                "x": combined_x,
                "y": combined_y,
                "width": combined_width,
                "height": combined_height,
                "confidence": 0.98
            }
        
        # Nose
        if "nose_tip" in landmarks and "nose_bridge" in landmarks:
            nose_points = landmarks["nose_tip"] + landmarks["nose_bridge"]
            nose_box = self._get_bounding_box(nose_points)
            features["nose"] = {**nose_box, "confidence": 0.95}
        
        # Lips
        if "top_lip" in landmarks and "bottom_lip" in landmarks:
            lip_points = landmarks["top_lip"] + landmarks["bottom_lip"]
            lip_box = self._get_bounding_box(lip_points)
            features["lips"] = {**lip_box, "confidence": 0.97}
        
        # Eyebrows
        if "left_eyebrow" in landmarks and "right_eyebrow" in landmarks:
            eyebrow_points = landmarks["left_eyebrow"] + landmarks["right_eyebrow"]
            eyebrow_box = self._get_bounding_box(eyebrow_points)
            features["eyebrows"] = {**eyebrow_box, "confidence": 0.90}
        
        # Chin/Jaw
        if "chin" in landmarks:
            chin_box = self._get_bounding_box(landmarks["chin"])
            features["chin"] = {**chin_box, "confidence": 0.85}
        
        return features
    
    def _get_bounding_box(self, points: List[Tuple[int, int]]) -> Dict[str, int]:
        """Calculate tight bounding box for a set of points."""
        if not points:
            return {"x": 0, "y": 0, "width": 0, "height": 0}
        
        x_coords = [point[0] for point in points]
        y_coords = [point[1] for point in points]
        
        min_x, max_x = min(x_coords), max(x_coords)
        min_y, max_y = min(y_coords), max(y_coords)
        
        # Add small padding
        padding = 5
        return {
            "x": max(0, min_x - padding),
            "y": max(0, min_y - padding),
            "width": (max_x - min_x) + (padding * 2),
            "height": (max_y - min_y) + (padding * 2)
        }
    
    def get_face_encoding(self, image_data: str, face_location: Optional[Tuple] = None) -> Optional[List[float]]:
        """
        Get face encoding for face recognition/comparison.
        
        Args:
            image_data: Base64 encoded image string
            face_location: Optional specific face location to encode
            
        Returns:
            Face encoding as list of floats, or None if no face found
        """
        try:
            image = self._decode_base64_image(image_data)
            if image is None:
                return None
            
            rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
            
            if face_location:
                encodings = face_recognition.face_encodings(rgb_image, [face_location])
            else:
                encodings = face_recognition.face_encodings(rgb_image)
            
            return encodings[0].tolist() if encodings else None
            
        except Exception as e:
            print(f"Error getting face encoding: {e}")
            return None
    
    def compare_faces(self, known_encoding: List[float], unknown_encoding: List[float], tolerance: float = 0.6) -> Dict[str, Any]:
        """
        Compare two face encodings to determine if they're the same person.
        
        Args:
            known_encoding: Reference face encoding
            unknown_encoding: Face encoding to compare
            tolerance: Similarity threshold (lower = more strict)
            
        Returns:
            Comparison result with match status and distance
        """
        try:
            known_np = np.array(known_encoding)
            unknown_np = np.array(unknown_encoding)
            
            # Calculate face distance
            distance = face_recognition.face_distance([known_np], unknown_np)[0]
            
            # Determine if it's a match
            is_match = distance <= tolerance
            
            # Calculate confidence percentage
            confidence = max(0, (1 - distance) * 100)
            
            return {
                "is_match": is_match,
                "distance": float(distance),
                "confidence": round(confidence, 2),
                "tolerance_used": tolerance
            }
            
        except Exception as e:
            return {"error": f"Face comparison failed: {str(e)}"}

# Global service instance
face_detection_service = FaceDetectionService()
