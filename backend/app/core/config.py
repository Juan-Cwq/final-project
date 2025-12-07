"""
Configuration settings for Aura backend
"""

from pydantic import BaseSettings
from typing import List
import os


class Settings(BaseSettings):
    """Application settings"""
    
    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    DEBUG: bool = True
    
    # Security
    SECRET_KEY: str = "your-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # CORS
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:3001",
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3001",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000"
    ]
    
    # File Upload
    MAX_UPLOAD_SIZE: int = 10485760  # 10MB
    UPLOAD_DIR: str = "./uploads"
    
    # Model Paths
    DLIB_SHAPE_PREDICTOR: str = "models/shape_predictor_68_face_landmarks.dat"
    HAAR_CASCADE_FACE: str = "models/haarcascade_frontalface_alt.xml"
    HAAR_CASCADE_EYE: str = "models/haarcascade_eye.xml"
    
    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
