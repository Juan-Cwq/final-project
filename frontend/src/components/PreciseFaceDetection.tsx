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

interface PreciseFaceDetectionProps {
  showDebugInfo?: boolean
}

const PreciseFaceDetection: React.FC<PreciseFaceDetectionProps> = ({ showDebugInfo = true }) => {
  const webcamRef = useRef<Webcam>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [detectedFeatures, setDetectedFeatures] = useState<DetectedFeature[]>([])
  const [isDetecting, setIsDetecting] = useState(false)
  const [frameRate, setFrameRate] = useState(0)
  const frameCountRef = useRef(0)
  const lastTimeRef = useRef(Date.now())

  // Much more precise facial feature detection
  const detectFacialFeatures = useCallback(() => {
    if (!webcamRef.current || !canvasRef.current) return

    const video = webcamRef.current.video
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')

    if (!video || !ctx || video.readyState !== 4) return

    // Set canvas dimensions
    canvas.width = video.videoWidth || 640
    canvas.height = video.videoHeight || 480

    // Draw video frame for analysis
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    
    const features: DetectedFeature[] = []
    
    // Only detect face if we can find a clear skin region
    const faceRegion = detectPreciseFace(imageData, canvas.width, canvas.height)
    if (faceRegion && faceRegion.confidence > 0.3) {
      features.push({
        name: 'Face',
        x: faceRegion.x,
        y: faceRegion.y,
        width: faceRegion.width,
        height: faceRegion.height,
        confidence: faceRegion.confidence
      })

      // Only detect other features if we have a good face detection
      const eyesRegion = detectPreciseEyes(imageData, faceRegion, canvas.width, canvas.height)
      if (eyesRegion && eyesRegion.confidence > 0.4) {
        features.push({
          name: 'Eyes',
          x: eyesRegion.x,
          y: eyesRegion.y,
          width: eyesRegion.width,
          height: eyesRegion.height,
          confidence: eyesRegion.confidence
        })
      }

      const lipsRegion = detectPreciseLips(imageData, faceRegion, canvas.width, canvas.height)
      if (lipsRegion && lipsRegion.confidence > 0.3) {
        features.push({
          name: 'Lips',
          x: lipsRegion.x,
          y: lipsRegion.y,
          width: lipsRegion.width,
          height: lipsRegion.height,
          confidence: lipsRegion.confidence
        })
      }

      // Only detect glasses if there's strong evidence
      const glassesRegion = detectActualGlasses(imageData, faceRegion, canvas.width, canvas.height)
      if (glassesRegion && glassesRegion.confidence > 0.6) {
        features.push({
          name: 'Glasses',
          x: glassesRegion.x,
          y: glassesRegion.y,
          width: glassesRegion.width,
          height: glassesRegion.height,
          confidence: glassesRegion.confidence
        })
      }

      // Hair detection with better filtering
      const hairRegion = detectActualHair(imageData, faceRegion, canvas.width, canvas.height)
      if (hairRegion && hairRegion.confidence > 0.4) {
        features.push({
          name: 'Hair',
          x: hairRegion.x,
          y: hairRegion.y,
          width: hairRegion.width,
          height: hairRegion.height,
          confidence: hairRegion.confidence
        })
      }
    }

    setDetectedFeatures(features)
    setIsDetecting(features.length > 0)

    // Calculate frame rate
    frameCountRef.current++
    const now = Date.now()
    if (now - lastTimeRef.current >= 1000) {
      setFrameRate(frameCountRef.current)
      frameCountRef.current = 0
      lastTimeRef.current = now
    }
  }, [])

  // Much more precise face detection
  const detectPreciseFace = (imageData: ImageData, width: number, height: number) => {
    const data = imageData.data
    const centerX = width / 2
    const centerY = height / 2

    // Look for skin in the center region first
    const searchRadius = Math.min(width, height) * 0.3
    let skinPixels = 0
    let totalPixels = 0
    let minX = width, maxX = 0, minY = height, maxY = 0

    // Scan in a circular pattern from center
    for (let angle = 0; angle < Math.PI * 2; angle += 0.1) {
      for (let radius = 10; radius < searchRadius; radius += 5) {
        const x = Math.floor(centerX + Math.cos(angle) * radius)
        const y = Math.floor(centerY + Math.sin(angle) * radius)

        if (x >= 0 && x < width && y >= 0 && y < height) {
          const i = (y * width + x) * 4
          const r = data[i]
          const g = data[i + 1]
          const b = data[i + 2]

          if (isDefinitelySkin(r, g, b)) {
            skinPixels++
            minX = Math.min(minX, x)
            maxX = Math.max(maxX, x)
            minY = Math.min(minY, y)
            maxY = Math.max(maxY, y)
          }
          totalPixels++
        }
      }
    }

    // Only proceed if we found significant skin
    if (skinPixels > totalPixels * 0.1 && (maxX - minX) > 60 && (maxY - minY) > 60) {
      const faceWidth = maxX - minX
      const faceHeight = maxY - minY
      const aspectRatio = faceWidth / faceHeight

      // Strict face proportions
      if (aspectRatio > 0.6 && aspectRatio < 1.3) {
        return {
          x: minX,
          y: minY,
          width: faceWidth,
          height: faceHeight,
          confidence: Math.min(skinPixels / (totalPixels * 0.2), 1)
        }
      }
    }

    return null
  }

  // Very strict skin detection
  const isDefinitelySkin = (r: number, g: number, b: number): boolean => {
    // Much stricter skin color criteria
    return (
      // Light skin
      (r > 120 && g > 80 && b > 60 && r > g + 10 && r > b + 20 && Math.abs(r - g) < 40) ||
      // Medium skin
      (r > 100 && g > 70 && b > 50 && r > g + 8 && r > b + 15 && Math.abs(r - g) < 35) ||
      // Darker skin (more restrictive)
      (r > 80 && g > 60 && b > 40 && r >= g && r >= b + 5 && Math.abs(r - g) < 30)
    )
  }

  // Precise eye detection - only detect if there are clear dark regions
  const detectPreciseEyes = (imageData: ImageData, faceRegion: any, width: number, height: number) => {
    const data = imageData.data
    const eyeY = faceRegion.y + faceRegion.height * 0.3
    const eyeHeight = faceRegion.height * 0.25
    const eyeX = faceRegion.x + faceRegion.width * 0.15
    const eyeWidth = faceRegion.width * 0.7

    let veryDarkPixels = 0
    let totalPixels = 0
    let minX = width, maxX = 0, minY = height, maxY = 0

    // Look for very dark pixels (pupils, eyelashes)
    for (let y = eyeY; y < eyeY + eyeHeight; y += 1) {
      for (let x = eyeX; x < eyeX + eyeWidth; x += 1) {
        if (x >= 0 && x < width && y >= 0 && y < height) {
          const i = (Math.floor(y) * width + Math.floor(x)) * 4
          const r = data[i]
          const g = data[i + 1]
          const b = data[i + 2]
          const brightness = (r + g + b) / 3

          // Very strict dark pixel detection
          if (brightness < 40 && r < 60 && g < 60 && b < 60) {
            veryDarkPixels++
            minX = Math.min(minX, x)
            maxX = Math.max(maxX, x)
            minY = Math.min(minY, y)
            maxY = Math.max(maxY, y)
          }
          totalPixels++
        }
      }
    }

    // Only detect if we found enough very dark pixels
    if (veryDarkPixels > 20 && (maxX - minX) > 10 && (maxY - minY) > 5) {
      const padding = 8
      return {
        x: Math.max(0, minX - padding),
        y: Math.max(0, minY - padding),
        width: Math.min(width - minX + padding, (maxX - minX) + padding * 2),
        height: Math.min(height - minY + padding, (maxY - minY) + padding * 2),
        confidence: Math.min(veryDarkPixels / 50, 1)
      }
    }

    return null
  }

  // Precise lip detection - only detect clear lip colors
  const detectPreciseLips = (imageData: ImageData, faceRegion: any, width: number, height: number) => {
    const data = imageData.data
    const lipY = faceRegion.y + faceRegion.height * 0.65
    const lipHeight = faceRegion.height * 0.2
    const lipX = faceRegion.x + faceRegion.width * 0.25
    const lipWidth = faceRegion.width * 0.5

    let lipPixels = 0
    let totalPixels = 0
    let minX = width, maxX = 0, minY = height, maxY = 0

    for (let y = lipY; y < lipY + lipHeight; y += 1) {
      for (let x = lipX; x < lipX + lipWidth; x += 1) {
        if (x >= 0 && x < width && y >= 0 && y < height) {
          const i = (Math.floor(y) * width + Math.floor(x)) * 4
          const r = data[i]
          const g = data[i + 1]
          const b = data[i + 2]

          // Very strict lip color detection
          const isLip = (
            // Clear red/pink lips
            (r > g + 20 && r > b + 15 && r > 130) ||
            // Natural lip color (clearly redder than surrounding skin)
            (r > g + 12 && r > b + 8 && r > 110 && !isDefinitelySkin(r, g, b))
          )

          if (isLip) {
            lipPixels++
            minX = Math.min(minX, x)
            maxX = Math.max(maxX, x)
            minY = Math.min(minY, y)
            maxY = Math.max(maxY, y)
          }
          totalPixels++
        }
      }
    }

    // Only detect if we found enough lip pixels in a horizontal shape
    if (lipPixels > 15 && (maxX - minX) > 20 && (maxY - minY) > 5) {
      const aspectRatio = (maxX - minX) / (maxY - minY)
      if (aspectRatio > 2) { // Lips should be wider than tall
        const padding = 3
        return {
          x: Math.max(0, minX - padding),
          y: Math.max(0, minY - padding),
          width: Math.min(width - minX + padding, (maxX - minX) + padding * 2),
          height: Math.min(height - minY + padding, (maxY - minY) + padding * 2),
          confidence: Math.min(lipPixels / 30, 1)
        }
      }
    }

    return null
  }

  // Very strict glasses detection - only detect if there are clear frame patterns
  const detectActualGlasses = (imageData: ImageData, faceRegion: any, width: number, height: number) => {
    const data = imageData.data
    const glassesY = faceRegion.y + faceRegion.height * 0.25
    const glassesHeight = faceRegion.height * 0.3
    const glassesX = faceRegion.x + faceRegion.width * 0.1
    const glassesWidth = faceRegion.width * 0.8

    let framePixels = 0
    let reflectionPixels = 0
    let totalPixels = 0

    for (let y = glassesY; y < glassesY + glassesHeight; y += 2) {
      for (let x = glassesX; x < glassesX + glassesWidth; x += 2) {
        if (x >= 0 && x < width && y >= 0 && y < height) {
          const i = (Math.floor(y) * width + Math.floor(x)) * 4
          const r = data[i]
          const g = data[i + 1]
          const b = data[i + 2]
          const brightness = (r + g + b) / 3

          // Look for very dark frames
          if (brightness < 30 && r < 40 && g < 40 && b < 40) {
            framePixels++
          }
          // Look for lens reflections (very bright pixels)
          else if (brightness > 200 && Math.abs(r - g) < 20 && Math.abs(g - b) < 20) {
            reflectionPixels++
          }
          totalPixels++
        }
      }
    }

    // Only detect glasses if we have BOTH dark frames AND reflections
    const frameRatio = framePixels / totalPixels
    const reflectionRatio = reflectionPixels / totalPixels

    if (frameRatio > 0.05 && reflectionRatio > 0.02 && framePixels > 30) {
      return {
        x: glassesX,
        y: glassesY,
        width: glassesWidth,
        height: glassesHeight,
        confidence: Math.min((frameRatio + reflectionRatio) * 5, 1)
      }
    }

    return null
  }

  // Better hair detection
  const detectActualHair = (imageData: ImageData, faceRegion: any, width: number, height: number) => {
    const data = imageData.data
    const hairY = Math.max(0, faceRegion.y - faceRegion.height * 0.2)
    const hairHeight = faceRegion.height * 0.6
    const hairX = faceRegion.x - faceRegion.width * 0.1
    const hairWidth = faceRegion.width * 1.2

    let hairPixels = 0
    let totalPixels = 0
    let minX = width, maxX = 0, minY = height, maxY = 0

    for (let y = hairY; y < hairY + hairHeight; y += 2) {
      for (let x = hairX; x < hairX + hairWidth; x += 2) {
        if (x >= 0 && x < width && y >= 0 && y < height) {
          const i = (Math.floor(y) * width + Math.floor(x)) * 4
          const r = data[i]
          const g = data[i + 1]
          const b = data[i + 2]
          const brightness = (r + g + b) / 3

          // Look for dark pixels that are NOT skin
          if (brightness < 80 && !isDefinitelySkin(r, g, b)) {
            hairPixels++
            minX = Math.min(minX, x)
            maxX = Math.max(maxX, x)
            minY = Math.min(minY, y)
            maxY = Math.max(maxY, y)
          }
          totalPixels++
        }
      }
    }

    if (hairPixels > totalPixels * 0.15 && (maxX - minX) > 40) {
      return {
        x: Math.max(0, minX),
        y: Math.max(0, minY),
        width: Math.min(width - minX, maxX - minX),
        height: Math.min(height - minY, maxY - minY),
        confidence: Math.min(hairPixels / (totalPixels * 0.3), 1)
      }
    }

    return null
  }

  // Draw detection overlays
  const drawDetections = useCallback(() => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear previous drawings
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Draw feature boxes with thicker lines for better visibility
    detectedFeatures.forEach(feature => {
      const colors: { [key: string]: string } = {
        'Face': '#00ff00',
        'Eyes': '#0099ff',
        'Lips': '#ff0066',
        'Hair': '#9900ff',
        'Glasses': '#ffff00'
      }

      ctx.strokeStyle = colors[feature.name] || '#ffffff'
      ctx.lineWidth = 3
      ctx.setLineDash([])
      
      // Draw bounding box
      ctx.strokeRect(feature.x, feature.y, feature.width, feature.height)
      
      // Draw label with background
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
      ctx.fillRect(feature.x, feature.y - 25, 120, 20)
      
      ctx.fillStyle = colors[feature.name] || '#ffffff'
      ctx.font = 'bold 14px Arial'
      ctx.fillText(
        `${feature.name} (${Math.round(feature.confidence * 100)}%)`,
        feature.x + 2,
        feature.y - 8
      )
    })
  }, [detectedFeatures])

  // Animation loop
  useEffect(() => {
    let animationId: number

    const animate = () => {
      detectFacialFeatures()
      drawDetections()
      animationId = requestAnimationFrame(animate)
    }

    animate()
    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId)
      }
    }
  }, [detectFacialFeatures, drawDetections])

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
        <div className={`px-3 py-1 rounded-full text-sm flex items-center ${
          isDetecting ? 'bg-green-500/80 text-white' : 'bg-red-500/80 text-white'
        }`}>
          <div className={`w-2 h-2 rounded-full mr-2 ${
            isDetecting ? 'bg-white animate-pulse' : 'bg-white'
          }`}></div>
          {isDetecting ? 'Precise Detection' : 'No Face Detected'}
        </div>
        
        {showDebugInfo && (
          <div className="bg-black/50 text-white px-3 py-1 rounded-full text-xs">
            {frameRate} FPS
          </div>
        )}
      </div>
      
      {/* Feature list */}
      {showDebugInfo && detectedFeatures.length > 0 && (
        <div className="absolute top-4 right-4 bg-black/70 text-white p-3 rounded-lg text-sm max-w-xs">
          <h3 className="font-semibold mb-2">Detected Features:</h3>
          {detectedFeatures.map((feature, index) => (
            <div key={index} className="flex justify-between items-center mb-1">
              <span>{feature.name}:</span>
              <span className="text-green-400">{Math.round(feature.confidence * 100)}%</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default PreciseFaceDetection
