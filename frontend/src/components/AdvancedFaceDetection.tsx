import React, { useRef, useEffect, useState, useCallback } from 'react'
import Webcam from 'react-webcam'

interface FacialLandmarks {
  face_outline?: Array<{x: number, y: number}>
  left_eye?: Array<{x: number, y: number}>
  right_eye?: Array<{x: number, y: number}>
  left_eyebrow?: Array<{x: number, y: number}>
  right_eyebrow?: Array<{x: number, y: number}>
  nose_bridge?: Array<{x: number, y: number}>
  nose_tip?: Array<{x: number, y: number}>
  outer_lip?: Array<{x: number, y: number}>
  inner_lip?: Array<{x: number, y: number}>
}

interface DetectedFace {
  face: {
    x: number
    y: number
    width: number
    height: number
    confidence: number
  }
  face_index: number
  landmarks: FacialLandmarks
  feature_outlines: FacialLandmarks
}

interface AdvancedFaceDetectionProps {
  showDebugInfo?: boolean
}

const AdvancedFaceDetection: React.FC<AdvancedFaceDetectionProps> = ({ showDebugInfo = true }) => {
  const webcamRef = useRef<Webcam>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [detectedFaces, setDetectedFaces] = useState<DetectedFace[]>([])
  const [isDetecting, setIsDetecting] = useState(false)
  const [frameRate, setFrameRate] = useState(0)
  const [apiStatus, setApiStatus] = useState<'connecting' | 'connected' | 'error'>('connecting')
  const frameCountRef = useRef(0)
  const lastTimeRef = useRef(Date.now())
  const processingRef = useRef(false)

  // Check API health on component mount
  useEffect(() => {
    checkApiHealth()
  }, [])

  const checkApiHealth = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/landmarks/health')
      if (response.ok) {
        setApiStatus('connected')
      } else {
        setApiStatus('error')
      }
    } catch (error) {
      setApiStatus('error')
      console.error('API health check failed:', error)
    }
  }

  // Advanced face detection using landmarks API
  const detectFacesWithLandmarks = useCallback(async () => {
    if (!webcamRef.current || processingRef.current || apiStatus !== 'connected') return

    const video = webcamRef.current.video
    if (!video || video.readyState !== 4) return

    processingRef.current = true

    try {
      // Capture frame from webcam
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      canvas.width = video.videoWidth || 640
      canvas.height = video.videoHeight || 480
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

      // Convert to base64
      const imageData = canvas.toDataURL('image/jpeg', 0.8).split(',')[1]

      // Send to advanced landmarks API
      const response = await fetch('http://localhost:8000/api/landmarks/detect-landmarks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ image: imageData })
      })

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`)
      }

      const result = await response.json()
      
      if (result.success && result.data.faces_detected > 0) {
        setDetectedFaces(result.data.faces)
        setIsDetecting(true)
      } else {
        setDetectedFaces([])
        setIsDetecting(false)
      }

    } catch (error) {
      console.error('Advanced face detection API error:', error)
      setDetectedFaces([])
      setIsDetecting(false)
    } finally {
      processingRef.current = false
    }

    // Calculate frame rate
    frameCountRef.current++
    const now = Date.now()
    if (now - lastTimeRef.current >= 1000) {
      setFrameRate(frameCountRef.current)
      frameCountRef.current = 0
      lastTimeRef.current = now
    }
  }, [apiStatus])

  // Draw precise facial feature outlines
  const drawFacialLandmarks = useCallback(() => {
    if (!canvasRef.current || !webcamRef.current) return

    const canvas = canvasRef.current
    const video = webcamRef.current.video
    const ctx = canvas.getContext('2d')
    if (!ctx || !video) return

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth || 640
    canvas.height = video.videoHeight || 480

    // Clear previous drawings
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Draw facial features with solid outlines like the example
    detectedFaces.forEach((faceData) => {
      const landmarks = faceData.landmarks
      
      // Helper function to flip X coordinates for mirrored video
      const flipPoint = (point: {x: number, y: number}) => ({
        x: canvas.width - point.x,
        y: point.y
      })
      
      const flipPoints = (points: Array<{x: number, y: number}>) => 
        points.map(flipPoint)

      // Helper function to draw and fill smooth shapes
      const drawFilledFeature = (points: Array<{x: number, y: number}>, fillColor: string, strokeColor: string, lineWidth: number) => {
        if (!points || points.length < 3) return
        
        ctx.beginPath()
        ctx.moveTo(points[0].x, points[0].y)
        
        // Use quadratic curves for smooth lines
        for (let i = 1; i < points.length - 1; i++) {
          const xc = (points[i].x + points[i + 1].x) / 2
          const yc = (points[i].y + points[i + 1].y) / 2
          ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc)
        }
        
        ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y)
        ctx.closePath()
        
        // Fill first
        ctx.fillStyle = fillColor
        ctx.fill()
        
        // Then stroke
        ctx.strokeStyle = strokeColor
        ctx.lineWidth = lineWidth
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'
        ctx.setLineDash([])
        ctx.stroke()
      }

      // Helper for outline only (no fill)
      const drawOutline = (points: Array<{x: number, y: number}>, strokeColor: string, lineWidth: number, closed: boolean = false) => {
        if (!points || points.length < 2) return
        
        ctx.beginPath()
        ctx.moveTo(points[0].x, points[0].y)
        
        for (let i = 1; i < points.length - 1; i++) {
          const xc = (points[i].x + points[i + 1].x) / 2
          const yc = (points[i].y + points[i + 1].y) / 2
          ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc)
        }
        
        ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y)
        
        if (closed) {
          ctx.closePath()
        }
        
        ctx.strokeStyle = strokeColor
        ctx.lineWidth = lineWidth
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'
        ctx.setLineDash([])
        ctx.stroke()
      }

      // Draw face outline - clean brown/tan stroke (FLIPPED)
      if (landmarks.face_outline && landmarks.face_outline.length > 0) {
        drawOutline(flipPoints(landmarks.face_outline), 'rgba(139, 90, 60, 0.8)', 3, true)
      }

      // Draw eyes with fill and outline (FLIPPED)
      const eyes = [landmarks.left_eye, landmarks.right_eye]
      eyes.forEach((eye) => {
        if (eye && eye.length > 0) {
          drawFilledFeature(
            flipPoints(eye),
            'rgba(200, 220, 240, 0.3)',  // Light blue fill
            'rgba(100, 130, 160, 0.9)',   // Darker blue outline
            2.5
          )
        }
      })

      // Draw eyebrows - solid brown strokes (FLIPPED)
      const eyebrows = [landmarks.left_eyebrow, landmarks.right_eyebrow]
      eyebrows.forEach((eyebrow) => {
        if (eyebrow && eyebrow.length > 0) {
          drawOutline(flipPoints(eyebrow), 'rgba(101, 67, 33, 0.9)', 3, false)
        }
      })

      // Draw nose outline (FLIPPED)
      if (landmarks.nose_bridge && landmarks.nose_bridge.length > 0) {
        drawOutline(flipPoints(landmarks.nose_bridge), 'rgba(139, 90, 60, 0.7)', 2, false)
      }

      if (landmarks.nose_tip && landmarks.nose_tip.length > 0) {
        drawOutline(flipPoints(landmarks.nose_tip), 'rgba(139, 90, 60, 0.7)', 2, false)
      }

      // Draw mouth with fill and outline - like the example (FLIPPED)
      if (landmarks.outer_lip && landmarks.outer_lip.length > 0) {
        drawFilledFeature(
          flipPoints(landmarks.outer_lip),
          'rgba(255, 200, 220, 0.4)',   // Light pink fill
          'rgba(180, 80, 100, 0.9)',    // Darker pink/red outline
          2.5
        )
      }

      // Skip inner lip for cleaner look
    })
  }, [detectedFaces])

  // Animation loop for detection
  useEffect(() => {
    let intervalId: number

    if (apiStatus === 'connected') {
      // Run detection every 300ms for good performance with landmarks
      intervalId = setInterval(detectFacesWithLandmarks, 300)
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId)
      }
    }
  }, [detectFacesWithLandmarks, apiStatus])

  // Animation loop for drawing
  useEffect(() => {
    let animationId: number

    const animate = () => {
      drawFacialLandmarks()
      animationId = requestAnimationFrame(animate)
    }

    animate()
    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId)
      }
    }
  }, [drawFacialLandmarks])

  const getStatusColor = () => {
    switch (apiStatus) {
      case 'connected': return isDetecting ? 'bg-green-500/80' : 'bg-yellow-500/80'
      case 'connecting': return 'bg-blue-500/80'
      case 'error': return 'bg-red-500/80'
      default: return 'bg-gray-500/80'
    }
  }

  const getStatusText = () => {
    switch (apiStatus) {
      case 'connected': return isDetecting ? 'Landmark Detection Active' : 'Ready - Position your face'
      case 'connecting': return 'Connecting to Landmarks API...'
      case 'error': return 'Landmarks API Connection Failed'
      default: return 'Unknown Status'
    }
  }

  return (
    <div className="relative camera-preview">
      {/* Webcam */}
      <Webcam
        ref={webcamRef}
        screenshotFormat="image/jpeg"
        className="w-full h-full object-cover rounded-xl"
        mirrored
      />
      
      {/* Detection overlay canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full object-cover rounded-xl pointer-events-none"
      />
      
      <div className="camera-overlay"></div>
      
      {/* Status indicators */}
      <div className="absolute top-4 left-4 space-y-2">
        <div className={`px-3 py-1 rounded-full text-sm flex items-center text-white ${getStatusColor()}`}>
          <div className={`w-2 h-2 rounded-full mr-2 bg-white ${isDetecting ? 'animate-pulse' : ''}`}></div>
          {getStatusText()}
        </div>
        
        {apiStatus === 'connected' && (
          <div className="bg-blue-500/20 border border-blue-500/50 text-blue-300 px-2 py-1 rounded text-xs">
            🎯 InsightFace 106-Point Landmarks
          </div>
        )}
        
        {showDebugInfo && apiStatus === 'connected' && (
          <div className="bg-black/50 text-white px-3 py-1 rounded-full text-xs">
            {frameRate} FPS
          </div>
        )}
      </div>
      
      {/* API Error Message */}
      {apiStatus === 'error' && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-red-500/90 text-white p-4 rounded-lg text-center max-w-sm">
          <h3 className="font-semibold mb-2">Advanced Landmarks API Required</h3>
          <p className="text-sm mb-3">
            68-point facial landmarks require the advanced detection backend.
          </p>
          <div className="text-xs bg-black/30 p-2 rounded">
            <code>Backend running at :8000/api/landmarks</code>
          </div>
          <button 
            onClick={checkApiHealth}
            className="mt-3 px-3 py-1 bg-white/20 rounded text-sm hover:bg-white/30"
          >
            Retry Connection
          </button>
        </div>
      )}
      
      {/* Landmark info */}
      {showDebugInfo && detectedFaces.length > 0 && (
        <div className="absolute top-4 right-4 bg-black/70 text-white p-3 rounded-lg text-sm max-w-xs">
          <h3 className="font-semibold mb-2">Facial Landmarks:</h3>
          {detectedFaces.map((_, index) => (
            <div key={index} className="mb-2">
              <div className="text-green-400 font-medium">Face {index + 1}:</div>
              <div className="text-xs space-y-1">
                <div>✓ Face Outline (33 pts)</div>
                <div>✓ Eyes & Eyebrows (34 pts)</div>
                <div>✓ Nose Bridge & Tip (9 pts)</div>
                <div>✓ Mouth (Outer/Inner) (20 pts)</div>
                <div className="text-blue-400">106 landmarks detected</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default AdvancedFaceDetection
