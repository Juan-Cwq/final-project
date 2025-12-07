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

interface FaceDetectionProps {
  showDebugInfo?: boolean
}

const FaceDetection: React.FC<FaceDetectionProps> = ({ showDebugInfo = true }) => {
  const webcamRef = useRef<Webcam>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [detectedFeatures, setDetectedFeatures] = useState<DetectedFeature[]>([])
  const [isDetecting, setIsDetecting] = useState(false)
  const [frameRate, setFrameRate] = useState(0)
  const frameCountRef = useRef(0)
  const lastTimeRef = useRef(Date.now())

  // Simple color-based feature detection
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
    
    // Detect face region using skin color
    const faceRegion = detectSkinRegion(imageData, canvas.width, canvas.height)
    if (faceRegion) {
      features.push({
        name: 'Face',
        x: faceRegion.x,
        y: faceRegion.y,
        width: faceRegion.width,
        height: faceRegion.height,
        confidence: faceRegion.confidence
      })

      // Detect features within face region
      const eyesRegion = detectEyeRegion(imageData, faceRegion, canvas.width, canvas.height)
      if (eyesRegion) {
        features.push({
          name: 'Eyes',
          x: eyesRegion.x,
          y: eyesRegion.y,
          width: eyesRegion.width,
          height: eyesRegion.height,
          confidence: eyesRegion.confidence
        })
      }

      const noseRegion = detectNoseRegion(faceRegion)
      if (noseRegion) {
        features.push({
          name: 'Nose',
          x: noseRegion.x,
          y: noseRegion.y,
          width: noseRegion.width,
          height: noseRegion.height,
          confidence: noseRegion.confidence
        })
      }

      const lipsRegion = detectLipsRegion(imageData, faceRegion, canvas.width, canvas.height)
      if (lipsRegion) {
        features.push({
          name: 'Lips',
          x: lipsRegion.x,
          y: lipsRegion.y,
          width: lipsRegion.width,
          height: lipsRegion.height,
          confidence: lipsRegion.confidence
        })
      }

      const hairRegion = detectHairRegion(imageData, faceRegion, canvas.width, canvas.height)
      if (hairRegion) {
        features.push({
          name: 'Hair',
          x: hairRegion.x,
          y: hairRegion.y,
          width: hairRegion.width,
          height: hairRegion.height,
          confidence: hairRegion.confidence
        })
      }

      const glassesRegion = detectGlassesRegion(imageData, faceRegion, canvas.width, canvas.height)
      if (glassesRegion) {
        features.push({
          name: 'Glasses',
          x: glassesRegion.x,
          y: glassesRegion.y,
          width: glassesRegion.width,
          height: glassesRegion.height,
          confidence: glassesRegion.confidence
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

  // Detect skin-colored regions (face detection)
  const detectSkinRegion = (imageData: ImageData, width: number, height: number) => {
    const data = imageData.data
    const skinMap: boolean[][] = []
    
    // Initialize skin map
    for (let y = 0; y < height; y++) {
      skinMap[y] = []
      for (let x = 0; x < width; x++) {
        skinMap[y][x] = false
      }
    }

    let skinPixels = 0
    let totalPixels = 0

    // Create skin pixel map
    for (let y = 0; y < height; y += 2) {
      for (let x = 0; x < width; x += 2) {
        const i = (y * width + x) * 4
        const r = data[i]
        const g = data[i + 1]
        const b = data[i + 2]

        if (isSkinColor(r, g, b)) {
          skinMap[y][x] = true
          skinPixels++
        }
        totalPixels++
      }
    }

    if (skinPixels < totalPixels * 0.01) return null

    // Find the largest connected skin region
    const visited: boolean[][] = []
    for (let y = 0; y < height; y++) {
      visited[y] = new Array(width).fill(false)
    }

    let largestRegion = { minX: width, maxX: 0, minY: height, maxY: 0, size: 0 }

    const floodFill = (startX: number, startY: number) => {
      const stack = [{ x: startX, y: startY }]
      let minX = startX, maxX = startX, minY = startY, maxY = startY
      let size = 0

      while (stack.length > 0) {
        const { x, y } = stack.pop()!
        
        if (x < 0 || x >= width || y < 0 || y >= height || visited[y][x] || !skinMap[y][x]) {
          continue
        }

        visited[y][x] = true
        size++
        minX = Math.min(minX, x)
        maxX = Math.max(maxX, x)
        minY = Math.min(minY, y)
        maxY = Math.max(maxY, y)

        // Add neighbors
        stack.push({ x: x + 2, y })
        stack.push({ x: x - 2, y })
        stack.push({ x, y: y + 2 })
        stack.push({ x, y: y - 2 })
      }

      return { minX, maxX, minY, maxY, size }
    }

    // Find largest skin region
    for (let y = 0; y < height; y += 4) {
      for (let x = 0; x < width; x += 4) {
        if (skinMap[y] && skinMap[y][x] && !visited[y][x]) {
          const region = floodFill(x, y)
          if (region.size > largestRegion.size) {
            largestRegion = region
          }
        }
      }
    }

    // Validate face region
    if (largestRegion.size > 100) {
      const faceWidth = largestRegion.maxX - largestRegion.minX
      const faceHeight = largestRegion.maxY - largestRegion.minY
      const aspectRatio = faceWidth / faceHeight

      if (aspectRatio > 0.5 && aspectRatio < 2.0 && faceWidth > 40 && faceHeight > 40) {
        return {
          x: largestRegion.minX,
          y: largestRegion.minY,
          width: faceWidth,
          height: faceHeight,
          confidence: Math.min(largestRegion.size / 1000, 1)
        }
      }
    }

    return null
  }

  // Enhanced skin color detection
  const isSkinColor = (r: number, g: number, b: number): boolean => {
    // Multiple skin tone ranges
    const conditions = [
      // Light skin
      r > 95 && g > 40 && b > 20 && r > g && r > b && Math.abs(r - g) > 15,
      // Medium skin  
      r > 80 && g > 35 && b > 15 && r > g && r > b && (r - g) > 10,
      // Darker skin
      r > 60 && g > 30 && b > 15 && r >= g && r >= b
    ]
    
    return conditions.some(condition => condition)
  }

  // Detect eye region by finding actual dark eye areas
  const detectEyeRegion = (imageData: ImageData, faceRegion: any, width: number, height: number) => {
    const data = imageData.data
    const eyeSearchY = faceRegion.y + faceRegion.height * 0.2
    const eyeSearchHeight = faceRegion.height * 0.4
    const eyeSearchX = faceRegion.x + faceRegion.width * 0.1
    const eyeSearchWidth = faceRegion.width * 0.8

    // Create a map of dark pixels (potential eye areas)
    const darkPixelMap: boolean[][] = []
    for (let y = 0; y < height; y++) {
      darkPixelMap[y] = []
      for (let x = 0; x < width; x++) {
        darkPixelMap[y][x] = false
      }
    }

    // Mark dark pixels in eye search region
    for (let y = eyeSearchY; y < eyeSearchY + eyeSearchHeight; y += 1) {
      for (let x = eyeSearchX; x < eyeSearchX + eyeSearchWidth; x += 1) {
        if (x >= 0 && x < width && y >= 0 && y < height) {
          const i = (Math.floor(y) * width + Math.floor(x)) * 4
          const r = data[i]
          const g = data[i + 1]
          const b = data[i + 2]
          const brightness = (r + g + b) / 3

          // Look for very dark pixels (pupils, eyelashes, eyebrows)
          if (brightness < 60) {
            darkPixelMap[Math.floor(y)][Math.floor(x)] = true
          }
        }
      }
    }

    // Find connected dark regions (eyes)
    const visited: boolean[][] = []
    for (let y = 0; y < height; y++) {
      visited[y] = new Array(width).fill(false)
    }

    const eyeRegions: Array<{minX: number, maxX: number, minY: number, maxY: number, size: number}> = []

    const findDarkRegion = (startX: number, startY: number) => {
      const stack = [{ x: startX, y: startY }]
      let minX = startX, maxX = startX, minY = startY, maxY = startY
      let size = 0

      while (stack.length > 0) {
        const { x, y } = stack.pop()!
        
        if (x < 0 || x >= width || y < 0 || y >= height || visited[y][x] || !darkPixelMap[y][x]) {
          continue
        }

        visited[y][x] = true
        size++
        minX = Math.min(minX, x)
        maxX = Math.max(maxX, x)
        minY = Math.min(minY, y)
        maxY = Math.max(maxY, y)

        // Add neighbors
        stack.push({ x: x + 1, y })
        stack.push({ x: x - 1, y })
        stack.push({ x, y: y + 1 })
        stack.push({ x, y: y - 1 })
      }

      return { minX, maxX, minY, maxY, size }
    }

    // Find all dark regions in eye area
    for (let y = Math.floor(eyeSearchY); y < eyeSearchY + eyeSearchHeight; y += 3) {
      for (let x = Math.floor(eyeSearchX); x < eyeSearchX + eyeSearchWidth; x += 3) {
        if (y < height && x < width && darkPixelMap[y] && darkPixelMap[y][x] && !visited[y][x]) {
          const region = findDarkRegion(x, y)
          if (region.size > 20) { // Filter out noise
            eyeRegions.push(region)
          }
        }
      }
    }

    // Find the best eye region (largest dark area in upper face)
    if (eyeRegions.length > 0) {
      const bestRegion = eyeRegions.reduce((best, current) => 
        current.size > best.size ? current : best
      )

      const eyeWidth = bestRegion.maxX - bestRegion.minX
      const eyeHeight = bestRegion.maxY - bestRegion.minY

      // Expand the region slightly to include full eye area
      const padding = 10
      return {
        x: Math.max(0, bestRegion.minX - padding),
        y: Math.max(0, bestRegion.minY - padding),
        width: Math.min(width - bestRegion.minX + padding, eyeWidth + padding * 2),
        height: Math.min(height - bestRegion.minY + padding, eyeHeight + padding * 2),
        confidence: Math.min(bestRegion.size / 100, 1)
      }
    }

    return null
  }

  // Detect nose region (center of face)
  const detectNoseRegion = (faceRegion: any) => {
    const noseX = faceRegion.x + faceRegion.width * 0.35
    const noseY = faceRegion.y + faceRegion.height * 0.4
    const noseWidth = faceRegion.width * 0.3
    const noseHeight = faceRegion.height * 0.25

    return {
      x: noseX,
      y: noseY,
      width: noseWidth,
      height: noseHeight,
      confidence: 0.8 // Nose is always in center, so high confidence
    }
  }

  // Detect lips region by finding actual lip-colored pixels
  const detectLipsRegion = (imageData: ImageData, faceRegion: any, width: number, height: number) => {
    const data = imageData.data
    const lipSearchY = faceRegion.y + faceRegion.height * 0.6
    const lipSearchHeight = faceRegion.height * 0.25
    const lipSearchX = faceRegion.x + faceRegion.width * 0.2
    const lipSearchWidth = faceRegion.width * 0.6

    // Create a map of lip-colored pixels
    const lipPixelMap: boolean[][] = []
    for (let y = 0; y < height; y++) {
      lipPixelMap[y] = []
      for (let x = 0; x < width; x++) {
        lipPixelMap[y][x] = false
      }
    }

    // Mark lip-colored pixels
    for (let y = lipSearchY; y < lipSearchY + lipSearchHeight; y += 1) {
      for (let x = lipSearchX; x < lipSearchX + lipSearchWidth; x += 1) {
        if (x >= 0 && x < width && y >= 0 && y < height) {
          const i = (Math.floor(y) * width + Math.floor(x)) * 4
          const r = data[i]
          const g = data[i + 1]
          const b = data[i + 2]

          // Enhanced lip color detection
          const isLipColor = (
            // Reddish lips
            (r > g + 15 && r > b + 10 && r > 120) ||
            // Pinkish lips
            (r > g + 8 && r > b + 5 && g > b && r > 100 && g > 80) ||
            // Natural lip color (slightly more red than skin)
            (r > g + 5 && r > b + 3 && r > 90 && !isSkinColor(r, g, b))
          )

          if (isLipColor) {
            lipPixelMap[Math.floor(y)][Math.floor(x)] = true
          }
        }
      }
    }

    // Find connected lip regions
    const visited: boolean[][] = []
    for (let y = 0; y < height; y++) {
      visited[y] = new Array(width).fill(false)
    }

    const lipRegions: Array<{minX: number, maxX: number, minY: number, maxY: number, size: number}> = []

    const findLipRegion = (startX: number, startY: number) => {
      const stack = [{ x: startX, y: startY }]
      let minX = startX, maxX = startX, minY = startY, maxY = startY
      let size = 0

      while (stack.length > 0) {
        const { x, y } = stack.pop()!
        
        if (x < 0 || x >= width || y < 0 || y >= height || visited[y][x] || !lipPixelMap[y][x]) {
          continue
        }

        visited[y][x] = true
        size++
        minX = Math.min(minX, x)
        maxX = Math.max(maxX, x)
        minY = Math.min(minY, y)
        maxY = Math.max(maxY, y)

        // Add neighbors
        stack.push({ x: x + 1, y })
        stack.push({ x: x - 1, y })
        stack.push({ x, y: y + 1 })
        stack.push({ x, y: y - 1 })
      }

      return { minX, maxX, minY, maxY, size }
    }

    // Find all lip regions
    for (let y = Math.floor(lipSearchY); y < lipSearchY + lipSearchHeight; y += 2) {
      for (let x = Math.floor(lipSearchX); x < lipSearchX + lipSearchWidth; x += 2) {
        if (y < height && x < width && lipPixelMap[y] && lipPixelMap[y][x] && !visited[y][x]) {
          const region = findLipRegion(x, y)
          if (region.size > 15) { // Filter out noise
            lipRegions.push(region)
          }
        }
      }
    }

    // Find the best lip region (largest in lower face, horizontal shape)
    if (lipRegions.length > 0) {
      const bestRegion = lipRegions.reduce((best, current) => {
        const currentAspect = (current.maxX - current.minX) / (current.maxY - current.minY)
        const bestAspect = (best.maxX - best.minX) / (best.maxY - best.minY)
        
        // Prefer wider regions (lips are typically wider than tall)
        if (currentAspect > 1.5 && current.size > best.size * 0.7) {
          return current
        }
        return current.size > best.size ? current : best
      })

      const lipWidth = bestRegion.maxX - bestRegion.minX
      const lipHeight = bestRegion.maxY - bestRegion.minY

      // Add some padding
      const padding = 5
      return {
        x: Math.max(0, bestRegion.minX - padding),
        y: Math.max(0, bestRegion.minY - padding),
        width: Math.min(width - bestRegion.minX + padding, lipWidth + padding * 2),
        height: Math.min(height - bestRegion.minY + padding, lipHeight + padding * 2),
        confidence: Math.min(bestRegion.size / 50, 1)
      }
    }

    return null
  }

  // Detect hair region (darker pixels above face)
  const detectHairRegion = (imageData: ImageData, faceRegion: any, width: number, height: number) => {
    const hairY = Math.max(0, faceRegion.y - faceRegion.height * 0.3)
    const hairHeight = faceRegion.height * 0.5
    const hairX = faceRegion.x - faceRegion.width * 0.1
    const hairWidth = faceRegion.width * 1.2

    const data = imageData.data
    let darkPixels = 0
    let totalPixels = 0

    for (let y = hairY; y < hairY + hairHeight; y += 3) {
      for (let x = hairX; x < hairX + hairWidth; x += 3) {
        if (x >= 0 && x < width && y >= 0 && y < height) {
          const i = (Math.floor(y) * width + Math.floor(x)) * 4
          const r = data[i]
          const g = data[i + 1]
          const b = data[i + 2]
          const brightness = (r + g + b) / 3

          if (brightness < 100 && !isSkinColor(r, g, b)) {
            darkPixels++
          }
          totalPixels++
        }
      }
    }

    if (darkPixels > totalPixels * 0.15) {
      return {
        x: Math.max(0, hairX),
        y: hairY,
        width: Math.min(hairWidth, width - Math.max(0, hairX)),
        height: hairHeight,
        confidence: Math.min(darkPixels / (totalPixels * 0.3), 1)
      }
    }

    return null
  }

  // Detect glasses (dark frames around eyes)
  const detectGlassesRegion = (imageData: ImageData, faceRegion: any, width: number, height: number) => {
    const glassesY = faceRegion.y + faceRegion.height * 0.2
    const glassesHeight = faceRegion.height * 0.3
    const glassesX = faceRegion.x + faceRegion.width * 0.05
    const glassesWidth = faceRegion.width * 0.9

    const data = imageData.data
    let framePixels = 0
    let totalPixels = 0

    // Look for dark rectangular patterns (frames)
    for (let y = glassesY; y < glassesY + glassesHeight; y += 2) {
      for (let x = glassesX; x < glassesX + glassesWidth; x += 2) {
        if (x >= 0 && x < width && y >= 0 && y < height) {
          const i = (Math.floor(y) * width + Math.floor(x)) * 4
          const r = data[i]
          const g = data[i + 1]
          const b = data[i + 2]
          const brightness = (r + g + b) / 3

          // Look for very dark pixels that could be frames
          if (brightness < 50) {
            framePixels++
          }
          totalPixels++
        }
      }
    }

    // Glasses detection requires significant dark frame pixels
    if (framePixels > totalPixels * 0.08) {
      return {
        x: glassesX,
        y: glassesY,
        width: glassesWidth,
        height: glassesHeight,
        confidence: Math.min(framePixels / (totalPixels * 0.15), 1)
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

    // Draw feature boxes
    detectedFeatures.forEach(feature => {
      const colors: { [key: string]: string } = {
        'Face': '#00ff00',
        'Eyes': '#0099ff',
        'Nose': '#ff9900',
        'Lips': '#ff0066',
        'Hair': '#9900ff',
        'Glasses': '#ffff00'
      }

      ctx.strokeStyle = colors[feature.name] || '#ffffff'
      ctx.lineWidth = 2
      ctx.setLineDash([])
      
      // Draw bounding box
      ctx.strokeRect(feature.x, feature.y, feature.width, feature.height)
      
      // Draw label
      ctx.fillStyle = colors[feature.name] || '#ffffff'
      ctx.font = '14px Arial'
      ctx.fillText(
        `${feature.name} (${Math.round(feature.confidence * 100)}%)`,
        feature.x,
        feature.y - 5
      )
      
      // Draw confidence bar
      const barWidth = 60
      const barHeight = 4
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
      ctx.fillRect(feature.x, feature.y + feature.height + 5, barWidth, barHeight)
      ctx.fillStyle = colors[feature.name] || '#ffffff'
      ctx.fillRect(feature.x, feature.y + feature.height + 5, barWidth * feature.confidence, barHeight)
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
          {isDetecting ? 'Detecting Features' : 'No Face Detected'}
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

export default FaceDetection
