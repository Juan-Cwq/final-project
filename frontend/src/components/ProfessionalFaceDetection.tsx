import React, { useRef, useEffect, useState, useCallback } from 'react'
import Webcam from 'react-webcam'

interface DetectedFeature {
  name: string
  x: number
  y: number
  width: number
  height: number
  confidence: number
}

interface FaceLandmarks {
  [key: string]: Array<{x: number, y: number}>
}

interface DetectedFace {
  face: DetectedFeature
  landmarks?: FaceLandmarks
  features: {[key: string]: DetectedFeature}
  contours?: {
    face_outline?: Array<{x: number, y: number}>
    lips?: Array<{x: number, y: number}>
    eyes?: Array<{x: number, y: number}>
  }
}

interface ProfessionalFaceDetectionProps {
  showDebugInfo?: boolean
}

const ProfessionalFaceDetection: React.FC<ProfessionalFaceDetectionProps> = ({ showDebugInfo = true }) => {
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
      const response = await fetch('http://localhost:8000/api/face/health')
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

  // Professional face detection using backend API
  const detectFacesWithAPI = useCallback(async () => {
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

      // Send to backend API
      const response = await fetch('http://localhost:8000/api/face/detect', {
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
      console.error('Face detection API error:', error)
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

  // Draw detection overlays
  const drawDetections = useCallback(() => {
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

    // Draw face detections with contour tracing
    detectedFaces.forEach((faceData, faceIndex) => {
      const face = faceData.face
      
      // Draw face contour if available, otherwise fallback to bounding box
      if (faceData.contours?.face_outline && faceData.contours.face_outline.length > 0) {
        ctx.strokeStyle = '#00ff00'
        ctx.lineWidth = 3
        ctx.setLineDash([])
        
        // Draw face outline contour
        ctx.beginPath()
        const outline = faceData.contours.face_outline
        ctx.moveTo(outline[0].x, outline[0].y)
        for (let i = 1; i < outline.length; i++) {
          ctx.lineTo(outline[i].x, outline[i].y)
        }
        ctx.closePath()
        ctx.stroke()
      } else {
        // Fallback to bounding box
        ctx.strokeStyle = '#00ff00'
        ctx.lineWidth = 3
        ctx.setLineDash([])
        ctx.strokeRect(face.x, face.y, face.width, face.height)
      }
      
      // Draw face label
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)'
      ctx.fillRect(face.x, face.y - 25, 180, 20)
      ctx.fillStyle = '#00ff00'
      ctx.font = 'bold 14px Arial'
      ctx.fillText(`Face ${faceIndex + 1} (${Math.round(face.confidence * 100)}%) - Contour Traced`, face.x + 2, face.y - 8)

      // Draw lip contours if available
      if (faceData.contours?.lips && faceData.contours.lips.length > 0) {
        ctx.strokeStyle = '#ff0066'
        ctx.lineWidth = 2
        ctx.setLineDash([])
        
        ctx.beginPath()
        const lips = faceData.contours.lips
        ctx.moveTo(lips[0].x, lips[0].y)
        for (let i = 1; i < lips.length; i++) {
          ctx.lineTo(lips[i].x, lips[i].y)
        }
        ctx.closePath()
        ctx.stroke()
        
        // Lip label
        const lipCenter = lips.reduce((acc, point) => ({
          x: acc.x + point.x / lips.length,
          y: acc.y + point.y / lips.length
        }), {x: 0, y: 0})
        
        ctx.fillStyle = 'rgba(255, 0, 102, 0.8)'
        ctx.fillRect(lipCenter.x - 30, lipCenter.y - 15, 60, 12)
        ctx.fillStyle = '#ffffff'
        ctx.font = '10px Arial'
        ctx.fillText('Lips Traced', lipCenter.x - 25, lipCenter.y - 6)
      }

      // Skip eye contour drawing - it looks too much like lasers!
      // The eye bounding box below is cleaner

      // Draw feature bounding boxes (smaller, as backup)
      const featureColors: {[key: string]: string} = {
        'eyes': '#0099ff',
        'nose': '#ff9900',
        'lips': '#ff0066',
        'hair': '#9900ff'
      }

      Object.entries(faceData.features).forEach(([featureName, feature]) => {
        // Only draw bounding boxes if no contours available for that feature
        const hasContour = (featureName === 'lips' && faceData.contours?.lips)
        
        if (!hasContour) {
          ctx.strokeStyle = featureColors[featureName] || '#ffffff'
          ctx.lineWidth = 1
          ctx.setLineDash([2, 2]) // Dashed line for bounding boxes
          ctx.strokeRect(feature.x, feature.y, feature.width, feature.height)
          
          // Feature label (smaller)
          ctx.fillStyle = 'rgba(0, 0, 0, 0.6)'
          ctx.fillRect(feature.x, feature.y - 16, 80, 12)
          ctx.fillStyle = featureColors[featureName] || '#ffffff'
          ctx.font = '10px Arial'
          ctx.fillText(`${featureName} (${Math.round(feature.confidence * 100)}%)`, feature.x + 2, feature.y - 6)
        }
      })
    })
  }, [detectedFaces, showDebugInfo])

  // Animation loop for detection
  useEffect(() => {
    let intervalId: number

    if (apiStatus === 'connected') {
      // Run detection every 200ms for good performance
      intervalId = setInterval(detectFacesWithAPI, 200)
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId)
      }
    }
  }, [detectFacesWithAPI, apiStatus])

  // Animation loop for drawing
  useEffect(() => {
    let animationId: number

    const animate = () => {
      drawDetections()
      animationId = requestAnimationFrame(animate)
    }

    animate()
    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId)
      }
    }
  }, [drawDetections])

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
      case 'connected': return isDetecting ? 'Contour Tracing Active' : 'Ready - Move closer to camera'
      case 'connecting': return 'Connecting to API...'
      case 'error': return 'API Connection Failed'
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
          <div className="bg-purple-500/20 border border-purple-500/50 text-purple-300 px-2 py-1 rounded text-xs">
            ✨ Contour Tracing
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
          <h3 className="font-semibold mb-2">Backend API Required</h3>
          <p className="text-sm mb-3">
            Professional face detection requires the Python backend to be running.
          </p>
          <div className="text-xs bg-black/30 p-2 rounded">
            <code>cd backend && python main.py</code>
          </div>
          <button 
            onClick={checkApiHealth}
            className="mt-3 px-3 py-1 bg-white/20 rounded text-sm hover:bg-white/30"
          >
            Retry Connection
          </button>
        </div>
      )}
      
      {/* Feature detection info */}
      {showDebugInfo && detectedFaces.length > 0 && (
        <div className="absolute top-4 right-4 bg-black/70 text-white p-3 rounded-lg text-sm max-w-xs">
          <h3 className="font-semibold mb-2">Professional Detection:</h3>
          {detectedFaces.map((faceData, index) => (
            <div key={index} className="mb-2">
              <div className="text-green-400 font-medium">Face {index + 1}:</div>
              {Object.entries(faceData.features).map(([feature, data]) => (
                <div key={feature} className="flex justify-between items-center text-xs">
                  <span className="capitalize">{feature}:</span>
                  <span className="text-green-400">{Math.round(data.confidence * 100)}%</span>
                </div>
              ))}
              <div className="text-xs text-gray-400 mt-1">
                68 landmarks detected
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default ProfessionalFaceDetection
