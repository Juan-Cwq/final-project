import React, { useRef, useEffect, useState, useCallback } from 'react'
import Webcam from 'react-webcam'

// Face landmark indices for different facial features
const FACE_LANDMARKS = {
  // Lips outline (12 key points)
  LIPS: [61, 84, 17, 314, 405, 320, 307, 375, 321, 308, 324, 318],
  // Upper lip
  UPPER_LIP: [61, 84, 17, 314, 405, 320, 307, 375],
  // Lower lip  
  LOWER_LIP: [321, 308, 324, 318, 375, 307, 320, 405],
  // Left cheek
  LEFT_CHEEK: [116, 117, 118, 119, 120, 121, 126, 142, 36, 205, 206, 207, 213, 192, 147, 187, 207, 213, 192, 147],
  // Right cheek
  RIGHT_CHEEK: [345, 346, 347, 348, 349, 350, 355, 371, 266, 425, 426, 427, 436, 416, 376, 411, 427, 436, 416, 376],
  // Left eye area
  LEFT_EYE: [33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246],
  // Right eye area
  RIGHT_EYE: [362, 382, 381, 380, 374, 373, 390, 249, 263, 466, 388, 387, 386, 385, 384, 398]
}

interface MakeupApplication {
  id: string
  landmarks: number[]
  color: string
  opacity: number
  blendMode: string
  featureType: 'lips' | 'cheeks' | 'eyes'
}

interface RealisticMakeupProps {
  selectedColor: string
  makeupType: 'lipstick' | 'blush' | 'eyeshadow'
  intensity: number
  onIntensityChange: (intensity: number) => void
}

const RealisticMakeup: React.FC<RealisticMakeupProps> = ({
  selectedColor,
  makeupType,
  intensity,
  onIntensityChange
}) => {
  const webcamRef = useRef<Webcam>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [faceLandmarks, setFaceLandmarks] = useState<Array<{x: number, y: number}>>([])
  const [faceDetected, setFaceDetected] = useState(false)
  const [appliedMakeup, setAppliedMakeup] = useState<MakeupApplication[]>([])

  // Enhanced face detection with better tracking
  const detectFaceLandmarks = useCallback(() => {
    if (!webcamRef.current || !canvasRef.current) return

    const video = webcamRef.current.video
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')

    if (!video || !ctx || video.readyState !== 4) return

    // Set canvas dimensions
    canvas.width = video.videoWidth || 640
    canvas.height = video.videoHeight || 480

    // Draw video frame to analyze
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    
    // Use image data for basic face detection
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const faceRegion = detectFaceRegion(imageData, canvas.width, canvas.height)
    
    if (faceRegion) {
      const landmarks = generateDynamicLandmarks(faceRegion, canvas.width, canvas.height)
      setFaceLandmarks(landmarks)
      setFaceDetected(true)
    } else {
      setFaceLandmarks([])
      setFaceDetected(false)
    }
  }, [])

  // Detect face region using skin color detection
  const detectFaceRegion = (imageData: ImageData, width: number, height: number) => {
    const data = imageData.data
    let facePixels = 0
    let totalPixels = 0
    let minX = width, maxX = 0, minY = height, maxY = 0
    
    // Simple skin color detection
    for (let y = 0; y < height; y += 4) {
      for (let x = 0; x < width; x += 4) {
        const i = (y * width + x) * 4
        const r = data[i]
        const g = data[i + 1]
        const b = data[i + 2]
        
        // Basic skin color detection (simplified)
        if (r > 95 && g > 40 && b > 20 && 
            r > g && r > b && 
            Math.abs(r - g) > 15 && 
            r - b > 15) {
          facePixels++
          minX = Math.min(minX, x)
          maxX = Math.max(maxX, x)
          minY = Math.min(minY, y)
          maxY = Math.max(maxY, y)
        }
        totalPixels++
      }
    }
    
    // If we found enough skin pixels, return face region
    if (facePixels > totalPixels * 0.02) {
      return {
        x: minX,
        y: minY,
        width: maxX - minX,
        height: maxY - minY,
        centerX: (minX + maxX) / 2,
        centerY: (minY + maxY) / 2
      }
    }
    
    return null
  }

  // Generate dynamic landmarks based on detected face region
  const generateDynamicLandmarks = (faceRegion: any, canvasWidth: number, canvasHeight: number) => {
    const { centerX, centerY, width: faceWidth, height: faceHeight } = faceRegion
    const landmarks: Array<{x: number, y: number}> = []

    // Adjust proportions based on actual detected face
    const lipCenterX = centerX
    const lipCenterY = centerY + faceHeight * 0.25
    const lipWidth = faceWidth * 0.3
    const lipHeight = faceHeight * 0.06

    // Generate lip landmarks (16 points)
    for (let i = 0; i < 16; i++) {
      const angle = (i / 15) * Math.PI * 2
      landmarks.push({
        x: lipCenterX + Math.cos(angle) * lipWidth,
        y: lipCenterY + Math.sin(angle) * lipHeight * 0.5
      })
    }

    // Generate cheek landmarks based on face detection
    const cheekY = centerY - faceHeight * 0.1
    const cheekOffset = faceWidth * 0.4

    // Left cheek (10 points)
    for (let i = 0; i < 10; i++) {
      const angle = (i / 9) * Math.PI * 0.8
      landmarks.push({
        x: centerX - cheekOffset + Math.cos(angle) * faceWidth * 0.2,
        y: cheekY + Math.sin(angle) * faceHeight * 0.15
      })
    }

    // Right cheek (10 points)
    for (let i = 0; i < 10; i++) {
      const angle = Math.PI - (i / 9) * Math.PI * 0.8
      landmarks.push({
        x: centerX + cheekOffset + Math.cos(angle) * faceWidth * 0.2,
        y: cheekY + Math.sin(angle) * faceHeight * 0.15
      })
    }

    // Eye landmarks
    const eyeY = centerY - faceHeight * 0.2
    const eyeOffset = faceWidth * 0.25

    // Left eye (8 points)
    for (let i = 0; i < 8; i++) {
      const angle = (i / 7) * Math.PI * 2
      landmarks.push({
        x: centerX - eyeOffset + Math.cos(angle) * faceWidth * 0.1,
        y: eyeY + Math.sin(angle) * faceHeight * 0.05
      })
    }

    // Right eye (8 points)
    for (let i = 0; i < 8; i++) {
      const angle = (i / 7) * Math.PI * 2
      landmarks.push({
        x: centerX + eyeOffset + Math.cos(angle) * faceWidth * 0.1,
        y: eyeY + Math.sin(angle) * faceHeight * 0.05
      })
    }

    return landmarks
  }

  // Generate realistic face landmarks (simplified version)
  const generateMockFaceLandmarks = (width: number, height: number) => {
    // Detect face-like region using simple heuristics
    const centerX = width / 2
    const centerY = height * 0.45
    const faceWidth = width * 0.25
    const faceHeight = height * 0.35

    const landmarks: Array<{x: number, y: number}> = []

    // Generate landmarks for lips
    const lipCenterX = centerX
    const lipCenterY = centerY + faceHeight * 0.4
    const lipWidth = faceWidth * 0.4
    const lipHeight = faceHeight * 0.08

    // Upper lip landmarks
    for (let i = 0; i < 8; i++) {
      const angle = Math.PI + (i / 7) * Math.PI
      landmarks.push({
        x: lipCenterX + Math.cos(angle) * lipWidth,
        y: lipCenterY - Math.sin(angle) * lipHeight * 0.5
      })
    }

    // Lower lip landmarks  
    for (let i = 0; i < 8; i++) {
      const angle = (i / 7) * Math.PI
      landmarks.push({
        x: lipCenterX + Math.cos(angle) * lipWidth,
        y: lipCenterY + Math.sin(angle) * lipHeight * 0.5
      })
    }

    // Cheek landmarks
    const cheekY = centerY
    const cheekOffset = faceWidth * 0.7

    // Left cheek
    for (let i = 0; i < 10; i++) {
      const angle = (i / 9) * Math.PI * 0.5
      landmarks.push({
        x: centerX - cheekOffset + Math.cos(angle) * faceWidth * 0.3,
        y: cheekY + Math.sin(angle) * faceHeight * 0.2
      })
    }

    // Right cheek
    for (let i = 0; i < 10; i++) {
      const angle = Math.PI * 0.5 + (i / 9) * Math.PI * 0.5
      landmarks.push({
        x: centerX + cheekOffset + Math.cos(angle) * faceWidth * 0.3,
        y: cheekY + Math.sin(angle) * faceHeight * 0.2
      })
    }

    // Eye landmarks
    const eyeY = centerY - faceHeight * 0.1
    const eyeOffset = faceWidth * 0.5

    // Left eye
    for (let i = 0; i < 8; i++) {
      const angle = (i / 7) * Math.PI * 2
      landmarks.push({
        x: centerX - eyeOffset + Math.cos(angle) * faceWidth * 0.15,
        y: eyeY + Math.sin(angle) * faceHeight * 0.08
      })
    }

    // Right eye
    for (let i = 0; i < 8; i++) {
      const angle = (i / 7) * Math.PI * 2
      landmarks.push({
        x: centerX + eyeOffset + Math.cos(angle) * faceWidth * 0.15,
        y: eyeY + Math.sin(angle) * faceHeight * 0.08
      })
    }

    return landmarks
  }

  // Apply makeup based on type
  const applyMakeup = useCallback(() => {
    if (!canvasRef.current || faceLandmarks.length === 0) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear previous makeup
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Apply makeup based on selected type
    switch (makeupType) {
      case 'lipstick':
        applyLipstick(ctx, faceLandmarks.slice(0, 16), selectedColor, intensity)
        break
      case 'blush':
        applyBlush(ctx, faceLandmarks.slice(16, 36), selectedColor, intensity)
        break
      case 'eyeshadow':
        applyEyeshadow(ctx, faceLandmarks.slice(36), selectedColor, intensity)
        break
    }
  }, [faceLandmarks, selectedColor, makeupType, intensity])

  // Apply lipstick
  const applyLipstick = (ctx: CanvasRenderingContext2D, lipLandmarks: Array<{x: number, y: number}>, color: string, opacity: number) => {
    if (lipLandmarks.length < 8) return

    ctx.save()
    ctx.globalCompositeOperation = 'multiply'
    ctx.globalAlpha = opacity / 100

    // Create lip shape
    ctx.beginPath()
    ctx.moveTo(lipLandmarks[0].x, lipLandmarks[0].y)
    
    for (let i = 1; i < lipLandmarks.length; i++) {
      ctx.lineTo(lipLandmarks[i].x, lipLandmarks[i].y)
    }
    
    ctx.closePath()
    ctx.fillStyle = color
    ctx.fill()

    // Add gloss effect
    ctx.globalCompositeOperation = 'overlay'
    ctx.globalAlpha = opacity / 200
    
    const gradient = ctx.createLinearGradient(
      lipLandmarks[0].x, lipLandmarks[0].y - 10,
      lipLandmarks[0].x, lipLandmarks[0].y + 10
    )
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)')
    gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.3)')
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)')
    
    ctx.fillStyle = gradient
    ctx.fill()
    
    ctx.restore()
  }

  // Apply blush with better tracking and blending
  const applyBlush = (ctx: CanvasRenderingContext2D, cheekLandmarks: Array<{x: number, y: number}>, color: string, opacity: number) => {
    if (cheekLandmarks.length < 20) return

    ctx.save()
    
    // Parse color to RGB for better blending
    const hexToRgb = (hex: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
      return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      } : { r: 232, g: 168, b: 154 }
    }
    
    const rgb = hexToRgb(color)

    // Left cheek (landmarks 16-25)
    const leftCheek = cheekLandmarks.slice(16, 26)
    if (leftCheek.length > 0) {
      const centerX = leftCheek.reduce((sum, p) => sum + p.x, 0) / leftCheek.length
      const centerY = leftCheek.reduce((sum, p) => sum + p.y, 0) / leftCheek.length
      
      // Create more natural blush shape
      ctx.globalCompositeOperation = 'multiply'
      ctx.globalAlpha = opacity / 200
      
      // Main blush color
      const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 35)
      gradient.addColorStop(0, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.8)`)
      gradient.addColorStop(0.6, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.4)`)
      gradient.addColorStop(1, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0)`)
      
      ctx.fillStyle = gradient
      ctx.beginPath()
      ctx.ellipse(centerX, centerY, 35, 25, 0, 0, Math.PI * 2)
      ctx.fill()
      
      // Add subtle highlight
      ctx.globalCompositeOperation = 'overlay'
      ctx.globalAlpha = opacity / 400
      
      const highlightGradient = ctx.createRadialGradient(centerX - 8, centerY - 5, 0, centerX - 8, centerY - 5, 15)
      highlightGradient.addColorStop(0, 'rgba(255, 255, 255, 0.6)')
      highlightGradient.addColorStop(1, 'rgba(255, 255, 255, 0)')
      
      ctx.fillStyle = highlightGradient
      ctx.beginPath()
      ctx.ellipse(centerX - 8, centerY - 5, 15, 10, 0, 0, Math.PI * 2)
      ctx.fill()
    }

    // Right cheek (landmarks 26-35)
    const rightCheek = cheekLandmarks.slice(26, 36)
    if (rightCheek.length > 0) {
      const centerX = rightCheek.reduce((sum, p) => sum + p.x, 0) / rightCheek.length
      const centerY = rightCheek.reduce((sum, p) => sum + p.y, 0) / rightCheek.length
      
      // Main blush color
      ctx.globalCompositeOperation = 'multiply'
      ctx.globalAlpha = opacity / 200
      
      const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 35)
      gradient.addColorStop(0, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.8)`)
      gradient.addColorStop(0.6, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.4)`)
      gradient.addColorStop(1, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0)`)
      
      ctx.fillStyle = gradient
      ctx.beginPath()
      ctx.ellipse(centerX, centerY, 35, 25, 0, 0, Math.PI * 2)
      ctx.fill()
      
      // Add subtle highlight
      ctx.globalCompositeOperation = 'overlay'
      ctx.globalAlpha = opacity / 400
      
      const highlightGradient = ctx.createRadialGradient(centerX + 8, centerY - 5, 0, centerX + 8, centerY - 5, 15)
      highlightGradient.addColorStop(0, 'rgba(255, 255, 255, 0.6)')
      highlightGradient.addColorStop(1, 'rgba(255, 255, 255, 0)')
      
      ctx.fillStyle = highlightGradient
      ctx.beginPath()
      ctx.ellipse(centerX + 8, centerY - 5, 15, 10, 0, 0, Math.PI * 2)
      ctx.fill()
    }

    ctx.restore()
  }

  // Apply eyeshadow
  const applyEyeshadow = (ctx: CanvasRenderingContext2D, eyeLandmarks: Array<{x: number, y: number}>, color: string, opacity: number) => {
    if (eyeLandmarks.length < 8) return

    ctx.save()
    ctx.globalCompositeOperation = 'multiply'
    ctx.globalAlpha = opacity / 120

    // Left eye
    const leftEye = eyeLandmarks.slice(0, 8)
    if (leftEye.length > 0) {
      const centerX = leftEye.reduce((sum, p) => sum + p.x, 0) / leftEye.length
      const centerY = leftEye.reduce((sum, p) => sum + p.y, 0) / leftEye.length
      
      const gradient = ctx.createRadialGradient(centerX, centerY - 15, 0, centerX, centerY - 15, 30)
      gradient.addColorStop(0, color)
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)')
      
      ctx.fillStyle = gradient
      ctx.beginPath()
      ctx.ellipse(centerX, centerY - 15, 30, 15, 0, 0, Math.PI * 2)
      ctx.fill()
    }

    // Right eye
    const rightEye = eyeLandmarks.slice(8, 16)
    if (rightEye.length > 0) {
      const centerX = rightEye.reduce((sum, p) => sum + p.x, 0) / rightEye.length
      const centerY = rightEye.reduce((sum, p) => sum + p.y, 0) / rightEye.length
      
      const gradient = ctx.createRadialGradient(centerX, centerY - 15, 0, centerX, centerY - 15, 30)
      gradient.addColorStop(0, color)
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)')
      
      ctx.fillStyle = gradient
      ctx.beginPath()
      ctx.ellipse(centerX, centerY - 15, 30, 15, 0, 0, Math.PI * 2)
      ctx.fill()
    }

    ctx.restore()
  }

  // Animation loop
  useEffect(() => {
    let animationId: number

    const animate = () => {
      detectFaceLandmarks()
      applyMakeup()
      animationId = requestAnimationFrame(animate)
    }

    animate()
    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId)
      }
    }
  }, [detectFaceLandmarks, applyMakeup])

  return (
    <div className="relative camera-preview">
      {/* Webcam */}
      <Webcam
        ref={webcamRef}
        screenshotFormat="image/jpeg"
        className="w-full h-full object-cover rounded-xl"
        mirrored
      />
      
      {/* Makeup overlay canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full object-cover rounded-xl pointer-events-none"
        style={{ mixBlendMode: 'normal' }}
      />
      
      <div className="camera-overlay"></div>
      
      {/* Face detection status */}
      <div className={`absolute top-4 left-4 px-3 py-1 rounded-full text-sm flex items-center ${
        faceDetected ? 'bg-green-500/80 text-white' : 'bg-red-500/80 text-white'
      }`}>
        <div className={`w-2 h-2 rounded-full mr-2 ${
          faceDetected ? 'bg-white animate-pulse' : 'bg-white'
        }`}></div>
        {faceDetected ? 'Face Tracked' : 'No Face Detected'}
      </div>
      
      {/* Makeup type indicator */}
      <div className="absolute top-4 right-4 bg-purple-500/80 text-white px-3 py-1 rounded-full text-sm capitalize">
        {makeupType} Mode
      </div>
      
      {/* Controls */}
      <div className="absolute bottom-4 left-4 right-4">
        <div className="bg-black/50 backdrop-blur-sm rounded-lg p-4">
          <div className="flex items-center space-x-3 mb-3">
            <span className="text-white text-sm font-medium">Intensity:</span>
            <input
              type="range"
              min="0"
              max="100"
              value={intensity}
              onChange={(e) => onIntensityChange(Number(e.target.value))}
              className="flex-1 accent-purple-500"
            />
            <span className="text-white text-sm w-12 text-center">{intensity}%</span>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-white text-sm">Color:</span>
              <div 
                className="w-8 h-8 rounded-full border-2 border-white shadow-md"
                style={{ backgroundColor: selectedColor }}
              />
            </div>
            
            <div className="text-white text-xs opacity-75 capitalize">
              {makeupType} • {faceDetected ? 'Tracking' : 'No Face'}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RealisticMakeup
