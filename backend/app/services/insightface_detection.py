import cv2
import numpy as np
from typing import List, Dict, Any, Optional
import base64
from io import BytesIO
from PIL import Image
import insightface
from insightface.app import FaceAnalysis

class InsightFaceDetectionService:
    """
    Professional face detection service using InsightFace.
    Provides state-of-the-art face detection and 68/106-point facial landmarks.
    """
    
    def __init__(self):
        try:
            # Initialize InsightFace with CPU provider
            self.app = FaceAnalysis(providers=['CPUExecutionProvider'])
            # Use smaller detection size for better performance and compatibility
            self.app.prepare(ctx_id=-1, det_size=(320, 320))
            print("✅ InsightFace initialized successfully")
        except Exception as e:
            print(f"❌ InsightFace initialization error: {e}")
            self.app = None
        
    def detect_faces_and_landmarks(self, image_data: str) -> Dict[str, Any]:
        """
        Detect faces and extract precise facial landmarks using InsightFace.
        
        Args:
            image_data: Base64 encoded image string
            
        Returns:
            Dictionary containing face locations and precise 106-point landmarks
        """
        try:
            # Check if InsightFace is initialized
            if self.app is None:
                return {"error": "InsightFace not initialized. Please check backend logs."}
            
            # Decode base64 image
            image = self._decode_base64_image(image_data)
            if image is None:
                return {"error": "Invalid image data"}
            
            # Convert BGR to RGB (InsightFace expects RGB)
            rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
            
            # Detect faces with InsightFace
            try:
                faces = self.app.get(rgb_image)
            except Exception as e:
                print(f"InsightFace detection error: {e}")
                return {"error": f"Face detection failed: {str(e)}"}
            
            if len(faces) == 0:
                return {
                    "faces_detected": 0,
                    "faces": [],
                    "message": "No faces detected"
                }
            
            # Process each detected face
            detected_faces = []
            for i, face in enumerate(faces):
                face_data = self._process_insightface_result(face, i, image.shape)
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
            return {"error": f"InsightFace detection failed: {str(e)}"}
    
    def _decode_base64_image(self, image_data: str) -> Optional[np.ndarray]:
        """Decode base64 image string to OpenCV image array."""
        try:
            if "data:image" in image_data:
                image_data = image_data.split(",")[1]
            
            image_bytes = base64.b64decode(image_data)
            image_pil = Image.open(BytesIO(image_bytes))
            image_cv = cv2.cvtColor(np.array(image_pil), cv2.COLOR_RGB2BGR)
            return image_cv
            
        except Exception as e:
            print(f"Error decoding image: {e}")
            return None
    
    def _process_insightface_result(self, face, face_index: int, image_shape: tuple) -> Dict[str, Any]:
        """Process InsightFace detection result into our format."""
        
        # Get bounding box
        bbox = face.bbox.astype(int)
        face_box = {
            "x": int(bbox[0]),
            "y": int(bbox[1]),
            "width": int(bbox[2] - bbox[0]),
            "height": int(bbox[3] - bbox[1]),
            "confidence": float(face.det_score)
        }
        
        # Get landmarks (InsightFace provides 5-point or 106-point landmarks)
        landmarks = self._extract_landmarks(face)
        
        # Create feature outlines from landmarks
        feature_outlines = self._create_feature_outlines_from_landmarks(landmarks)
        
        return {
            "face": face_box,
            "face_index": face_index,
            "landmarks": landmarks,
            "feature_outlines": feature_outlines,
            "embedding": face.embedding.tolist() if hasattr(face, 'embedding') else None
        }
    
    def _extract_landmarks(self, face) -> Dict[str, List[Dict[str, int]]]:
        """Extract and organize facial landmarks from InsightFace."""
        landmarks_dict = {}
        
        # InsightFace provides landmark_2d_106 (106 points)
        if hasattr(face, 'landmark_2d_106') and face.landmark_2d_106 is not None:
            kps = face.landmark_2d_106
            
            # Map 106 points to facial features
            # Based on InsightFace 106-point landmark format
            landmarks_dict["face_outline"] = [
                {"x": int(kps[i][0]), "y": int(kps[i][1])} 
                for i in range(0, 33)  # Face contour points
            ]
            
            landmarks_dict["left_eyebrow"] = [
                {"x": int(kps[i][0]), "y": int(kps[i][1])} 
                for i in range(33, 42)  # Left eyebrow
            ]
            
            landmarks_dict["right_eyebrow"] = [
                {"x": int(kps[i][0]), "y": int(kps[i][1])} 
                for i in range(42, 51)  # Right eyebrow
            ]
            
            landmarks_dict["nose_bridge"] = [
                {"x": int(kps[i][0]), "y": int(kps[i][1])} 
                for i in range(51, 55)  # Nose bridge
            ]
            
            landmarks_dict["nose_tip"] = [
                {"x": int(kps[i][0]), "y": int(kps[i][1])} 
                for i in range(55, 60)  # Nose tip
            ]
            
            landmarks_dict["left_eye"] = [
                {"x": int(kps[i][0]), "y": int(kps[i][1])} 
                for i in range(60, 68)  # Left eye
            ]
            
            landmarks_dict["right_eye"] = [
                {"x": int(kps[i][0]), "y": int(kps[i][1])} 
                for i in range(68, 76)  # Right eye
            ]
            
            landmarks_dict["outer_lip"] = [
                {"x": int(kps[i][0]), "y": int(kps[i][1])} 
                for i in range(76, 88)  # Outer lip
            ]
            
            landmarks_dict["inner_lip"] = [
                {"x": int(kps[i][0]), "y": int(kps[i][1])} 
                for i in range(88, 96)  # Inner lip
            ]
            
        elif hasattr(face, 'kps') and face.kps is not None:
            # Fallback to 5-point landmarks
            kps = face.kps.astype(int)
            
            # 5 points: left_eye, right_eye, nose, left_mouth, right_mouth
            landmarks_dict["left_eye"] = [{"x": int(kps[0][0]), "y": int(kps[0][1])}]
            landmarks_dict["right_eye"] = [{"x": int(kps[1][0]), "y": int(kps[1][1])}]
            landmarks_dict["nose_tip"] = [{"x": int(kps[2][0]), "y": int(kps[2][1])}]
            landmarks_dict["outer_lip"] = [
                {"x": int(kps[3][0]), "y": int(kps[3][1])},
                {"x": int(kps[4][0]), "y": int(kps[4][1])}
            ]
        
        return landmarks_dict
    
    def _create_feature_outlines_from_landmarks(self, landmarks: Dict[str, List[Dict[str, int]]]) -> Dict[str, List[Dict[str, int]]]:
        """Create feature outlines from landmarks (same as landmarks for InsightFace)."""
        return landmarks

# Global service instance
insightface_detection_service = InsightFaceDetectionService()
