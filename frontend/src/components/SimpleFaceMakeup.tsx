import React, { useRef, useEffect, useState, useCallback } from 'react'
import Webcam from 'react-webcam'

interface SimpleFaceMakeupProps {
  selectedColor: string
  makeupType: 'lipstick' | 'blush' | 'eyeshadow'
  intensity: number
  onIntensityChange: (intensity: number) => void
}

const SimpleFaceMakeup: React.FC<SimpleFaceMakeupProps> = ({
  selectedColor,
  makeupType,
  intensity,
  onIntensityChange
}) => {
  const webcamRef = useRef<Webcam>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [faceCenter, setFaceCenter] = useState<{x: number, y: number} | null>(null)
  const [faceSize, setFaceSize] = useState<number>(100)

  // Simple face detection using center of frame and basic proportions
  const detectFaceCenter = useCallback(() => {
    if (!webcamRef.current || !canvasRef.current) return

    const video = webcamRef.current.video
    const canvas = canvasRef.current

    if (!video || video.readyState !== 4) return

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth || 640
    canvas.height = video.videoHeight || 480

    // Use center of frame as face center (most reliable for webcam usage)
    const centerX = canvas.width / 2
    const centerY = canvas.height / 2.2 // Slightly above center for face position

    // Estimate face size based on canvas dimensions
    const estimatedFaceSize = Math.min(canvas.width, canvas.height) * 0.25

    setFaceCenter({ x: centerX, y: centerY })
    setFaceSize(estimatedFaceSize)
  }, [])

  // Apply makeup based on face center and proportions
  const applyMakeup = useCallback(() => {
    if (!canvasRef.current || !faceCenter) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear previous makeup
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Parse hex color to RGB
    const hexToRgb = (hex: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
      return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      } : { r: 232, g: 168, b: 154 }
    }

    const rgb = hexToRgb(selectedColor)
    const alpha = intensity / 100

    ctx.save()

    switch (makeupType) {
      case 'lipstick':
        applyLipstick(ctx, faceCenter, faceSize, rgb, alpha)
        break
      case 'blush':
        applyBlush(ctx, faceCenter, faceSize, rgb, alpha)
        break
      case 'eyeshadow':
        applyEyeshadow(ctx, faceCenter, faceSize, rgb, alpha)
        break
    }

    ctx.restore()
  }, [faceCenter, faceSize, selectedColor, makeupType, intensity])

  // Apply lipstick
  const applyLipstick = (
    ctx: CanvasRenderingContext2D, 
    center: {x: number, y: number}, 
    size: number, 
    rgb: {r: number, g: number, b: number}, 
    alpha: number
  ) => {
    const lipX = center.x
    const lipY = center.y + size * 0.3
    const lipWidth = size * 0.25
    const lipHeight = size * 0.08

    ctx.globalCompositeOperation = 'multiply'
    ctx.globalAlpha = alpha * 0.8

    // Create lip gradient
    const gradient = ctx.createRadialGradient(lipX, lipY, 0, lipX, lipY, lipWidth)
    gradient.addColorStop(0, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 1)`)
    gradient.addColorStop(1, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0)`)

    ctx.fillStyle = gradient
    ctx.beginPath()
    ctx.ellipse(lipX, lipY, lipWidth, lipHeight, 0, 0, Math.PI * 2)
    ctx.fill()

    // Add gloss
    ctx.globalCompositeOperation = 'overlay'
    ctx.globalAlpha = alpha * 0.3
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)'
    ctx.beginPath()
    ctx.ellipse(lipX, lipY - lipHeight * 0.2, lipWidth * 0.6, lipHeight * 0.4, 0, 0, Math.PI * 2)
    ctx.fill()
  }

  // Apply blush
  const applyBlush = (
    ctx: CanvasRenderingContext2D, 
    center: {x: number, y: number}, 
    size: number, 
    rgb: {r: number, g: number, b: number}, 
    alpha: number
  ) => {
    const cheekOffset = size * 0.6
    const cheekY = center.y - size * 0.1
    const blushSize = size * 0.3

    ctx.globalCompositeOperation = 'multiply'
    ctx.globalAlpha = alpha * 0.6

    // Left cheek
    const leftCheekX = center.x - cheekOffset
    const leftGradient = ctx.createRadialGradient(leftCheekX, cheekY, 0, leftCheekX, cheekY, blushSize)
    leftGradient.addColorStop(0, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.8)`)
    leftGradient.addColorStop(0.7, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.3)`)
    leftGradient.addColorStop(1, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0)`)

    ctx.fillStyle = leftGradient
    ctx.beginPath()
    ctx.ellipse(leftCheekX, cheekY, blushSize * 0.8, blushSize * 0.6, -0.3, 0, Math.PI * 2)
    ctx.fill()

    // Right cheek
    const rightCheekX = center.x + cheekOffset
    const rightGradient = ctx.createRadialGradient(rightCheekX, cheekY, 0, rightCheekX, cheekY, blushSize)
    rightGradient.addColorStop(0, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.8)`)
    rightGradient.addColorStop(0.7, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.3)`)
    rightGradient.addColorStop(1, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0)`)

    ctx.fillStyle = rightGradient
    ctx.beginPath()
    ctx.ellipse(rightCheekX, cheekY, blushSize * 0.8, blushSize * 0.6, 0.3, 0, Math.PI * 2)
    ctx.fill()

    // Add subtle highlights
    ctx.globalCompositeOperation = 'overlay'
    ctx.globalAlpha = alpha * 0.2

    // Left highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)'
    ctx.beginPath()
    ctx.ellipse(leftCheekX - blushSize * 0.2, cheekY - blushSize * 0.1, blushSize * 0.3, blushSize * 0.2, -0.3, 0, Math.PI * 2)
    ctx.fill()

    // Right highlight
    ctx.beginPath()
    ctx.ellipse(rightCheekX + blushSize * 0.2, cheekY - blushSize * 0.1, blushSize * 0.3, blushSize * 0.2, 0.3, 0, Math.PI * 2)
    ctx.fill()
  }

  // Apply eyeshadow
  const applyEyeshadow = (
    ctx: CanvasRenderingContext2D, 
    center: {x: number, y: number}, 
    size: number, 
    rgb: {r: number, g: number, b: number}, 
    alpha: number
  ) => {
    const eyeOffset = size * 0.4
    const eyeY = center.y - size * 0.25
    const shadowSize = size * 0.25

    ctx.globalCompositeOperation = 'multiply'
    ctx.globalAlpha = alpha * 0.7

    // Left eye
    const leftEyeX = center.x - eyeOffset
    const leftGradient = ctx.createRadialGradient(leftEyeX, eyeY, 0, leftEyeX, eyeY, shadowSize)
    leftGradient.addColorStop(0, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.8)`)
    leftGradient.addColorStop(1, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0)`)

    ctx.fillStyle = leftGradient
    ctx.beginPath()
    ctx.ellipse(leftEyeX, eyeY, shadowSize, shadowSize * 0.6, 0, 0, Math.PI * 2)
    ctx.fill()

    // Right eye
    const rightEyeX = center.x + eyeOffset
    const rightGradient = ctx.createRadialGradient(rightEyeX, eyeY, 0, rightEyeX, eyeY, shadowSize)
    rightGradient.addColorStop(0, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.8)`)
    rightGradient.addColorStop(1, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0)`)

    ctx.fillStyle = rightGradient
    ctx.beginPath()
    ctx.ellipse(rightEyeX, eyeY, shadowSize, shadowSize * 0.6, 0, 0, Math.PI * 2)
    ctx.fill()
  }

  // Animation loop
  useEffect(() => {
    let animationId: number

    const animate = () => {
      detectFaceCenter()
      applyMakeup()
      animationId = requestAnimationFrame(animate)
    }

    animate()
    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId)
      }
    }
  }, [detectFaceCenter, applyMakeup])

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
      
      {/* Status indicator */}
      <div className="absolute top-4 left-4 bg-green-500/80 text-white px-3 py-1 rounded-full text-sm flex items-center">
        <div className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></div>
        Simple Tracking
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
              {makeupType} • Center Tracking
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SimpleFaceMakeup
