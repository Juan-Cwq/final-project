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
}

interface DetectedFace {
  face: {
    x: number
    y: number
    width: number
    height: number
    confidence: number
  }
  landmarks: FacialLandmarks
}

interface GlassesStyle {
  id: string
  name: string
  image: string
  scale: number  // Scaling factor for this particular glasses style
}

const GLASSES_STYLES: GlassesStyle[] = [
  { id: 'black-frames', name: 'Black Frames', image: '/glasses/black-frames.svg', scale: 1.0 },
  { id: 'round-pink', name: 'Round Pink', image: '/glasses/round-pink.svg', scale: 0.9 }
]

interface GlassesTryOnProps {
  showDebugInfo?: boolean
}

const GlassesTryOn: React.FC<GlassesTryOnProps> = ({ showDebugInfo = false }) => {
  const webcamRef = useRef<Webcam>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const glassesImagesRef = useRef<Map<string, HTMLImageElement>>(new Map())
  
  const [detectedFaces, setDetectedFaces] = useState<DetectedFace[]>([])
  const [selectedGlasses, setSelectedGlasses] = useState<string>('black-frames')
  const [isDetecting, setIsDetecting] = useState(false)
  const [frameRate, setFrameRate] = useState(0)
  const [apiStatus, setApiStatus] = useState<'connecting' | 'connected' | 'error'>('connecting')
  
  const frameCountRef = useRef(0)
  const lastTimeRef = useRef(Date.now())
  const processingRef = useRef(false)

  // Preload glasses images
  useEffect(() => {
    GLASSES_STYLES.forEach(style => {
      const img = new Image()
      img.src = style.image
      img.onload = () => {
        glassesImagesRef.current.set(style.id, img)
      }
      img.onerror = () => {
        console.error(`Failed to load glasses image: ${style.image}`)
      }
    })
  }, [])

  // Check API health
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

  // Detect faces with landmarks
  const detectFacesWithLandmarks = useCallback(async () => {
    if (!webcamRef.current || processingRef.current || apiStatus !== 'connected') return

    const video = webcamRef.current.video
    if (!video || video.readyState !== 4) return

    processingRef.current = true

    try {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      canvas.width = video.videoWidth || 640
      canvas.height = video.videoHeight || 480
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

      const imageData = canvas.toDataURL('image/jpeg', 0.8).split(',')[1]

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
        
        // Update FPS
        frameCountRef.current++
        const now = Date.now()
        if (now - lastTimeRef.current >= 1000) {
          setFrameRate(frameCountRef.current)
          frameCountRef.current = 0
          lastTimeRef.current = now
        }
      } else {
        setDetectedFaces([])
        setIsDetecting(false)
      }
    } catch (error) {
      console.error('Face detection error:', error)
      setIsDetecting(false)
    } finally {
      processingRef.current = false
    }
  }, [apiStatus])

  // Calculate head pose from landmarks
  const calculateHeadPose = (landmarks: FacialLandmarks, canvasWidth: number) => {
    if (!landmarks.left_eye || !landmarks.right_eye) {
      return { roll: 0, yaw: 0, pitch: 0 }
    }

    // Get eye centers (use middle point of eye landmarks)
    const leftEye = landmarks.left_eye[Math.floor(landmarks.left_eye.length / 2)]
    const rightEye = landmarks.right_eye[Math.floor(landmarks.right_eye.length / 2)]
    
    // Flip coordinates for mirrored video BEFORE calculations
    const leftEyeFlipped = { x: canvasWidth - leftEye.x, y: leftEye.y }
    const rightEyeFlipped = { x: canvasWidth - rightEye.x, y: rightEye.y }
    
    // Calculate roll (head tilt left/right) - use flipped coordinates
    const eyeDeltaX = rightEyeFlipped.x - leftEyeFlipped.x
    const eyeDeltaY = rightEyeFlipped.y - leftEyeFlipped.y
    const roll = Math.atan2(eyeDeltaY, eyeDeltaX)

    // Simplified yaw and pitch for now
    const yaw = 0
    const pitch = 0

    return { roll, yaw, pitch }
  }

  // Draw glasses with 3D perspective
  const drawGlasses = useCallback(() => {
    const canvas = canvasRef.current
    const video = webcamRef.current?.video
    const ctx = canvas?.getContext('2d')
    if (!ctx || !video || !canvas) return

    canvas.width = video.videoWidth || 640
    canvas.height = video.videoHeight || 480

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    const glassesImage = glassesImagesRef.current.get(selectedGlasses)
    if (!glassesImage || !glassesImage.complete) return

    detectedFaces.forEach((faceData) => {
      const landmarks = faceData.landmarks
      
      // Need eyes and eyebrows for proper positioning
      if (!landmarks.left_eye || !landmarks.right_eye || 
          !landmarks.left_eyebrow || !landmarks.right_eyebrow) return

      // Flip coordinates for mirrored video
      const flipX = (x: number) => canvas.width - x
      
      // Get eyebrow positions (top of eyebrows for glasses positioning)
      const leftBrowTop = landmarks.left_eyebrow[Math.floor(landmarks.left_eyebrow.length / 2)]
      const rightBrowTop = landmarks.right_eyebrow[Math.floor(landmarks.right_eyebrow.length / 2)]
      
      // Get eye positions for width calculation
      const leftEye = landmarks.left_eye[Math.floor(landmarks.left_eye.length / 2)]
      const rightEye = landmarks.right_eye[Math.floor(landmarks.right_eye.length / 2)]
      
      // Flip all coordinates
      const leftBrowFlipped = { x: flipX(leftBrowTop.x), y: leftBrowTop.y }
      const rightBrowFlipped = { x: flipX(rightBrowTop.x), y: rightBrowTop.y }
      const leftEyeFlipped = { x: flipX(leftEye.x), y: leftEye.y }
      const rightEyeFlipped = { x: flipX(rightEye.x), y: rightEye.y }

      // Calculate eye distance (interpupillary distance)
      const eyeDistance = Math.sqrt(
        Math.pow(rightEyeFlipped.x - leftEyeFlipped.x, 2) +
        Math.pow(rightEyeFlipped.y - leftEyeFlipped.y, 2)
      )

      // Get selected glasses style
      const glassesStyle = GLASSES_STYLES.find(s => s.id === selectedGlasses)
      const scaleFactor = glassesStyle?.scale || 1.0

      // Scale glasses based on eye distance (industry standard: glasses width = 2.5-3x eye distance)
      const glassesWidth = eyeDistance * 3.0 * scaleFactor
      const glassesHeight = (glassesImage.height / glassesImage.width) * glassesWidth
      
      // Calculate temple points for debug
      const leftBrowOuter = landmarks.left_eyebrow[0]
      const rightBrowOuter = landmarks.right_eyebrow[landmarks.right_eyebrow.length - 1]
      const leftBrowOuterFlipped = { x: flipX(leftBrowOuter.x), y: leftBrowOuter.y }
      const rightBrowOuterFlipped = { x: flipX(rightBrowOuter.x), y: rightBrowOuter.y }

      // Position glasses at eyebrow level (like in the examples)
      const centerX = (leftBrowFlipped.x + rightBrowFlipped.x) / 2
      // Position slightly below eyebrows, above eyes
      const eyeBrowDistance = Math.abs(leftEyeFlipped.y - leftBrowFlipped.y)
      const centerY = (leftBrowFlipped.y + rightBrowFlipped.y) / 2 + eyeBrowDistance * 0.3

      // Draw glasses
      ctx.drawImage(
        glassesImage,
        centerX - glassesWidth / 2,
        centerY - glassesHeight / 2,
        glassesWidth,
        glassesHeight
      )

      // Debug: Draw landmark points like in the examples
      if (showDebugInfo) {
        // Draw eyebrow points
        ctx.fillStyle = 'cyan'
        ctx.beginPath()
        ctx.arc(leftBrowFlipped.x, leftBrowFlipped.y, 4, 0, 2 * Math.PI)
        ctx.fill()
        ctx.beginPath()
        ctx.arc(rightBrowFlipped.x, rightBrowFlipped.y, 4, 0, 2 * Math.PI)
        ctx.fill()
        
        // Draw eye points
        ctx.fillStyle = 'red'
        ctx.beginPath()
        ctx.arc(leftEyeFlipped.x, leftEyeFlipped.y, 3, 0, 2 * Math.PI)
        ctx.fill()
        ctx.beginPath()
        ctx.arc(rightEyeFlipped.x, rightEyeFlipped.y, 3, 0, 2 * Math.PI)
        ctx.fill()
        
        // Draw temple points
        ctx.fillStyle = 'magenta'
        ctx.beginPath()
        ctx.arc(leftBrowOuterFlipped.x, leftBrowOuterFlipped.y, 4, 0, 2 * Math.PI)
        ctx.fill()
        ctx.beginPath()
        ctx.arc(rightBrowOuterFlipped.x, rightBrowOuterFlipped.y, 4, 0, 2 * Math.PI)
        ctx.fill()
      }
    })
  }, [detectedFaces, selectedGlasses, showDebugInfo])

  // Draw glasses overlay
  useEffect(() => {
    drawGlasses()
  }, [drawGlasses])

  // Animation loop
  useEffect(() => {
    let intervalId: number

    if (apiStatus === 'connected') {
      intervalId = setInterval(detectFacesWithLandmarks, 100) // 10 FPS for smooth performance
    }

    return () => {
      if (intervalId) clearInterval(intervalId)
    }
  }, [apiStatus, detectFacesWithLandmarks])

  const getStatusColor = () => {
    switch (apiStatus) {
      case 'connected': return isDetecting ? 'bg-green-500' : 'bg-yellow-500'
      case 'connecting': return 'bg-blue-500'
      case 'error': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const getStatusText = () => {
    switch (apiStatus) {
      case 'connected': return isDetecting ? 'Glasses Try-On Active' : 'Ready - Position your face'
      case 'connecting': return 'Connecting to API...'
      case 'error': return 'API Connection Failed'
      default: return 'Unknown Status'
    }
  }

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center bg-gray-900">
      {/* Webcam */}
      <div className="relative">
        <Webcam
          ref={webcamRef}
          audio={false}
          screenshotFormat="image/jpeg"
          videoConstraints={{
            width: 1280,
            height: 720,
            facingMode: 'user'
          }}
          mirrored={true}
          className="rounded-lg"
        />
        
        {/* Glasses overlay canvas */}
        <canvas
          ref={canvasRef}
          className="absolute top-0 left-0 w-full h-full pointer-events-none"
        />
      </div>

      {/* Status indicators */}
      <div className="absolute top-4 left-4 space-y-2">
        <div className={`px-3 py-1 rounded-full text-sm flex items-center text-white ${getStatusColor()}`}>
          <div className={`w-2 h-2 rounded-full mr-2 bg-white ${isDetecting ? 'animate-pulse' : ''}`}></div>
          {getStatusText()}
        </div>
        
        {showDebugInfo && apiStatus === 'connected' && (
          <div className="bg-black/50 text-white px-3 py-1 rounded-full text-xs">
            {frameRate} FPS
          </div>
        )}
      </div>

      {/* Glasses selector */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/70 rounded-lg p-4">
        <h3 className="text-white text-sm font-semibold mb-2 text-center">Select Glasses</h3>
        <div className="flex gap-3">
          {GLASSES_STYLES.map(style => (
            <button
              key={style.id}
              onClick={() => setSelectedGlasses(style.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                selectedGlasses === style.id
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {style.name}
            </button>
          ))}
        </div>
      </div>

      {/* Face detection info */}
      {showDebugInfo && detectedFaces.length > 0 && (
        <div className="absolute top-4 right-4 bg-black/70 text-white p-3 rounded-lg text-sm">
          <h3 className="font-semibold mb-1">Detected: {detectedFaces.length} face(s)</h3>
          <div className="text-xs text-green-400">✓ Glasses overlay active</div>
        </div>
      )}
    </div>
  )
}

export default GlassesTryOn
