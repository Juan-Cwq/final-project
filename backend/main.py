"""
Aura Virtual Try-On Platform - Backend Server
FastAPI application with OpenCV-based virtual try-on services
"""

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv
import os

from app.api import tryon, health, insightface_detection
from app.core.config import settings

# Load environment variables
load_dotenv()

# Initialize FastAPI app
app = FastAPI(
    title="Aura Virtual Try-On API",
    description="AR-powered virtual try-on for clothing, glasses, and makeup",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(health.router, prefix="/api", tags=["Health"])
app.include_router(tryon.router, prefix="/api/tryon", tags=["Try-On"])
app.include_router(insightface_detection.router, prefix="/api/landmarks", tags=["InsightFace Landmarks"])

# Mount static files for uploads
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

@app.on_event("startup")
async def startup_event():
    """Initialize services on startup"""
    print("🚀 Aura Backend Starting...")
    print(f"📍 Server running on {settings.HOST}:{settings.PORT}")
    print(f"📚 API Docs: http://{settings.HOST}:{settings.PORT}/api/docs")

@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    print("👋 Aura Backend Shutting Down...")

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
        log_level="info"
    )
