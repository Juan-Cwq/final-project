import React, { useRef, useEffect, useState, useCallback } from 'react'
import Webcam from 'react-webcam'

interface MakeupStroke {
  id: string
  points: Array<{ x: number; y: number; pressure: number }>
  color: string
  brushSize: number
  timestamp: number
}

interface FaceLandmark {
  x: number
  y: number
  z?: number
}

interface FaceTrackingMakeupProps {
  selectedColor: string
  brushSize: number
  onBrushSizeChange: (size: number) => void
}

const FaceTrackingMakeup: React.FC<FaceTrackingMakeupProps> = ({ 
  selectedColor, 
  brushSize, 
  onBrushSizeChange 
}) => {
  const webcamRef = useRef<Webcam>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [makeupStrokes, setMakeupStrokes] = useState<MakeupStroke[]>([])
  const [faceLandmarks, setFaceLandmarks] = useState<FaceLandmark[]>([])
  const [currentStroke, setCurrentStroke] = useState<MakeupStroke | null>(null)
  const [faceDetectionActive, setFaceDetectionActive] = useState(false)

  // Simple face detection using getUserMedia and basic image processing
  const detectFace = useCallback(async () => {
    if (!webcamRef.current || !canvasRef.current) return

    const video = webcamRef.current.video
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')

    if (!video || !ctx) return

    // Set canvas size to match video
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    // Draw current video frame
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

    // Simple face detection using skin color detection (mock implementation)
    // In a real app, you'd use MediaPipe Face Mesh or similar
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const mockFaceLandmarks = generateMockFaceLandmarks(canvas.width, canvas.height)
    
    setFaceLandmarks(mockFaceLandmarks)
    setFaceDetectionActive(true)
  }, [])

  // Generate mock face landmarks (in real implementation, use MediaPipe)
  const generateMockFaceLandmarks = (width: number, height: number): FaceLandmark[] => {
    const centerX = width / 2
    const centerY = height / 2.2
    const faceWidth = width * 0.3
    const faceHeight = height * 0.4

    // Create basic face outline landmarks
    const landmarks: FaceLandmark[] = []
    
    // Face outline (simplified)
    for (let i = 0; i < 17; i++) {
      const angle = (i / 16) * Math.PI - Math.PI / 2
      landmarks.push({
        x: centerX + Math.cos(angle) * faceWidth * 0.8,
        y: centerY + Math.sin(angle) * faceHeight * 0.6
      })
    }

    // Eyes
    landmarks.push(
      { x: centerX - faceWidth * 0.3, y: centerY - faceHeight * 0.1 }, // Left eye
      { x: centerX + faceWidth * 0.3, y: centerY - faceHeight * 0.1 }  // Right eye
    )

    // Lips
    for (let i = 0; i < 12; i++) {
      const angle = (i / 11) * Math.PI
      landmarks.push({
        x: centerX + Math.cos(angle) * faceWidth * 0.25,
        y: centerY + faceHeight * 0.2 + Math.sin(angle) * faceHeight * 0.08
      })
    }

    return landmarks
  }

  // Convert screen coordinates to face-relative coordinates
  const screenToFaceCoords = (screenX: number, screenY: number) => {
    if (faceLandmarks.length === 0) return { x: screenX, y: screenY }

    // Use face landmarks to create a coordinate system relative to the face
    const faceCenter = faceLandmarks.reduce(
      (acc, landmark) => ({
        x: acc.x + landmark.x / faceLandmarks.length,
        y: acc.y + landmark.y / faceLandmarks.length
      }),
      { x: 0, y: 0 }
    )

    return {
      x: screenX - faceCenter.x,
      y: screenY - faceCenter.y
    }
  }

  // Convert face-relative coordinates back to screen coordinates
  const faceToScreenCoords = (faceX: number, faceY: number) => {
    if (faceLandmarks.length === 0) return { x: faceX, y: faceY }

    const faceCenter = faceLandmarks.reduce(
      (acc, landmark) => ({
        x: acc.x + landmark.x / faceLandmarks.length,
        y: acc.y + landmark.y / faceLandmarks.length
      }),
      { x: 0, y: 0 }
    )

    return {
      x: faceX + faceCenter.x,
      y: faceY + faceCenter.y
    }
  }

  // Handle mouse/touch events for drawing
  const handleDrawStart = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!overlayCanvasRef.current) return

    const rect = overlayCanvasRef.current.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top

    const faceCoords = screenToFaceCoords(x, y)
    
    const newStroke: MakeupStroke = {
      id: Date.now().toString(),
      points: [{ x: faceCoords.x, y: faceCoords.y, pressure: 1 }],
      color: selectedColor,
      brushSize,
      timestamp: Date.now()
    }

    setCurrentStroke(newStroke)
    setIsDrawing(true)
  }

  const handleDrawMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !currentStroke || !overlayCanvasRef.current) return

    const rect = overlayCanvasRef.current.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top

    const faceCoords = screenToFaceCoords(x, y)
    
    const updatedStroke = {
      ...currentStroke,
      points: [...currentStroke.points, { x: faceCoords.x, y: faceCoords.y, pressure: 1 }]
    }

    setCurrentStroke(updatedStroke)
  }

  const handleDrawEnd = () => {
    if (currentStroke) {
      setMakeupStrokes(prev => [...prev, currentStroke])
      setCurrentStroke(null)
    }
    setIsDrawing(false)
  }

  // Render makeup strokes
  const renderMakeup = useCallback(() => {
    if (!overlayCanvasRef.current) return

    const canvas = overlayCanvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear previous makeup
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Render all completed strokes
    [...makeupStrokes, ...(currentStroke ? [currentStroke] : [])].forEach(stroke => {
      if (stroke.points.length < 2) return

      ctx.globalCompositeOperation = 'multiply'
      ctx.strokeStyle = stroke.color
      ctx.lineWidth = stroke.brushSize
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'

      ctx.beginPath()
      
      stroke.points.forEach((point, index) => {
        const screenCoords = faceToScreenCoords(point.x, point.y)
        
        if (index === 0) {
          ctx.moveTo(screenCoords.x, screenCoords.y)
        } else {
          ctx.lineTo(screenCoords.x, screenCoords.y)
        }
      })
      
      ctx.stroke()

      // Add some transparency for realistic makeup effect
      ctx.globalAlpha = 0.6
      ctx.globalCompositeOperation = 'overlay'
      
      stroke.points.forEach((point, index) => {
        const screenCoords = faceToScreenCoords(point.x, point.y)
        
        if (index === 0) {
          ctx.moveTo(screenCoords.x, screenCoords.y)
        } else {
          ctx.lineTo(screenCoords.x, screenCoords.y)
        }
      })
      
      ctx.stroke()
      ctx.globalAlpha = 1
      ctx.globalCompositeOperation = 'source-over'
    })
  }, [makeupStrokes, currentStroke, faceLandmarks])

  // Animation loop
  useEffect(() => {
    const animate = () => {
      detectFace()
      renderMakeup()
      requestAnimationFrame(animate)
    }

    const animationId = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animationId)
  }, [detectFace, renderMakeup])

  // Clear all makeup
  const clearMakeup = () => {
    setMakeupStrokes([])
    setCurrentStroke(null)
  }

  return (
    <div className="relative camera-preview">
      <Webcam
        ref={webcamRef}
        screenshotFormat="image/jpeg"
        className="w-full h-full object-cover rounded-xl"
        mirrored
      />
      
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full object-cover rounded-xl pointer-events-none opacity-0"
      />
      
      <canvas
        ref={overlayCanvasRef}
        className="absolute inset-0 w-full h-full object-cover rounded-xl cursor-crosshair"
        width={640}
        height={480}
        onMouseDown={handleDrawStart}
        onMouseMove={handleDrawMove}
        onMouseUp={handleDrawEnd}
        onMouseLeave={handleDrawEnd}
      />
      
      <div className="camera-overlay"></div>
      
      {faceDetectionActive && (
        <div className="absolute top-4 left-4 bg-green-500/80 text-white px-3 py-1 rounded-full text-sm flex items-center">
          <div className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></div>
          Face Tracked
        </div>
      )}
      
      <div className="absolute top-4 right-4 space-y-2">
        <button
          onClick={clearMakeup}
          className="bg-red-500/80 text-white px-3 py-1 rounded-full text-sm hover:bg-red-600/80 transition-colors"
        >
          Clear All
        </button>
      </div>
      
      <div className="absolute bottom-4 left-4 right-4">
        <div className="bg-black/50 backdrop-blur-sm rounded-lg p-3">
          <div className="flex items-center space-x-3">
            <span className="text-white text-sm">Brush Size:</span>
            <input
              type="range"
              min="5"
              max="30"
              value={brushSize}
              onChange={(e) => onBrushSizeChange(Number(e.target.value))}
              className="flex-1"
            />
            <span className="text-white text-sm w-8">{brushSize}px</span>
          </div>
          <div className="mt-2 text-center">
            <div 
              className="w-8 h-8 rounded-full border-2 border-white mx-auto"
              style={{ backgroundColor: selectedColor }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default FaceTrackingMakeup
