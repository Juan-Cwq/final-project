import { useRef, useEffect, useState } from 'react'
import Webcam from 'react-webcam'

interface MakeupPreviewProps {
  selectedColor: string
  isActive: boolean
}

const MakeupPreview: React.FC<MakeupPreviewProps> = ({ selectedColor, isActive }) => {
  const webcamRef = useRef<Webcam>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  // Convert hex color to RGB
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 232, g: 168, b: 154 } // Default Aura peach
  }

  // Simple lip detection and overlay (mock implementation)
  const applyMakeupOverlay = () => {
    if (!webcamRef.current || !canvasRef.current) return

    const video = webcamRef.current.video
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')

    if (!video || !ctx) return

    // Set canvas size to match video
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    // Draw the video frame
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

    if (isActive && selectedColor) {
      // Simple mock lip overlay - in real implementation, this would use face detection
      const { r, g, b } = hexToRgb(selectedColor)
      
      // Create a simple lip-like shape in the center-bottom area
      const centerX = canvas.width / 2
      const centerY = canvas.height * 0.75
      
      ctx.globalCompositeOperation = 'multiply'
      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.6)`
      
      // Draw a simple lip shape
      ctx.beginPath()
      ctx.ellipse(centerX, centerY, 40, 15, 0, 0, 2 * Math.PI)
      ctx.fill()
      
      // Add some gloss effect
      ctx.globalCompositeOperation = 'overlay'
      ctx.fillStyle = `rgba(255, 255, 255, 0.3)`
      ctx.beginPath()
      ctx.ellipse(centerX, centerY - 3, 25, 8, 0, 0, 2 * Math.PI)
      ctx.fill()
      
      ctx.globalCompositeOperation = 'source-over'
    }
  }

  useEffect(() => {
    const interval = setInterval(() => {
      if (isActive) {
        applyMakeupOverlay()
      }
    }, 100) // Update 10 times per second

    return () => clearInterval(interval)
  }, [selectedColor, isActive])

  return (
    <div className="relative camera-preview">
      <Webcam
        ref={webcamRef}
        screenshotFormat="image/jpeg"
        className="w-full h-full object-cover rounded-xl"
        mirrored
        onUserMedia={() => setIsProcessing(false)}
        onUserMediaError={() => setIsProcessing(true)}
      />
      
      {isActive && (
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full object-cover rounded-xl pointer-events-none"
          style={{ mixBlendMode: 'normal' }}
        />
      )}
      
      <div className="camera-overlay"></div>
      
      {isProcessing && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-xl">
          <div className="text-center text-white">
            <div className="loading loading-spinner loading-lg mb-2"></div>
            <p>Loading camera...</p>
          </div>
        </div>
      )}
      
      {isActive && (
        <div className="absolute top-4 left-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
          Live Preview
        </div>
      )}
    </div>
  )
}

export default MakeupPreview
