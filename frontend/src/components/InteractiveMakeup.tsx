import React, { useRef, useEffect, useState } from 'react'
import Webcam from 'react-webcam'

interface MakeupStroke {
  id: string
  points: Array<{ x: number; y: number }>
  color: string
  brushSize: number
}

interface InteractiveMakeupProps {
  selectedColor: string
  brushSize: number
  onBrushSizeChange: (size: number) => void
}

const InteractiveMakeup: React.FC<InteractiveMakeupProps> = ({ 
  selectedColor, 
  brushSize, 
  onBrushSizeChange 
}) => {
  const webcamRef = useRef<Webcam>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [makeupStrokes, setMakeupStrokes] = useState<MakeupStroke[]>([])
  const [currentStroke, setCurrentStroke] = useState<MakeupStroke | null>(null)

  // Get mouse position relative to canvas
  const getMousePos = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return { x: 0, y: 0 }
    
    const rect = canvasRef.current.getBoundingClientRect()
    const scaleX = canvasRef.current.width / rect.width
    const scaleY = canvasRef.current.height / rect.height
    
    return {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY
    }
  }

  // Handle drawing start
  const handleMouseDown = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const pos = getMousePos(event)
    const newStroke: MakeupStroke = {
      id: Date.now().toString(),
      points: [pos],
      color: selectedColor,
      brushSize
    }
    
    setCurrentStroke(newStroke)
    setIsDrawing(true)
  }

  // Handle drawing move
  const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !currentStroke) return
    
    const pos = getMousePos(event)
    const updatedStroke = {
      ...currentStroke,
      points: [...currentStroke.points, pos]
    }
    
    setCurrentStroke(updatedStroke)
  }

  // Handle drawing end
  const handleMouseUp = () => {
    if (currentStroke) {
      setMakeupStrokes(prev => [...prev, currentStroke])
      setCurrentStroke(null)
    }
    setIsDrawing(false)
  }

  // Render makeup on canvas
  const renderMakeup = () => {
    if (!canvasRef.current) return
    
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Render all strokes
    const allStrokes = [...makeupStrokes, ...(currentStroke ? [currentStroke] : [])]
    
    allStrokes.forEach(stroke => {
      if (stroke.points.length < 2) return

      // Set up brush properties
      ctx.globalCompositeOperation = 'multiply'
      ctx.strokeStyle = stroke.color
      ctx.lineWidth = stroke.brushSize
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.globalAlpha = 0.7

      // Draw the stroke
      ctx.beginPath()
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y)
      
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y)
      }
      
      ctx.stroke()

      // Add highlight effect
      ctx.globalCompositeOperation = 'overlay'
      ctx.globalAlpha = 0.3
      ctx.strokeStyle = 'white'
      ctx.lineWidth = stroke.brushSize * 0.3
      
      ctx.beginPath()
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y)
      
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y)
      }
      
      ctx.stroke()
      
      // Reset composite operation
      ctx.globalCompositeOperation = 'source-over'
      ctx.globalAlpha = 1
    })
  }

  // Update canvas when strokes change
  useEffect(() => {
    renderMakeup()
  }, [makeupStrokes, currentStroke, selectedColor, brushSize])

  // Clear all makeup
  const clearMakeup = () => {
    setMakeupStrokes([])
    setCurrentStroke(null)
  }

  // Undo last stroke
  const undoStroke = () => {
    setMakeupStrokes(prev => prev.slice(0, -1))
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
      
      {/* Drawing Canvas */}
      <canvas
        ref={canvasRef}
        width={640}
        height={480}
        className="absolute inset-0 w-full h-full object-cover rounded-xl cursor-crosshair"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{ mixBlendMode: 'multiply' }}
      />
      
      {/* Overlay effects */}
      <div className="camera-overlay"></div>
      
      {/* Status indicator */}
      <div className="absolute top-4 left-4 bg-purple-500/80 text-white px-3 py-1 rounded-full text-sm flex items-center">
        <div className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></div>
        Interactive Makeup
      </div>
      
      {/* Controls */}
      <div className="absolute top-4 right-4 space-y-2">
        <button
          onClick={undoStroke}
          disabled={makeupStrokes.length === 0}
          className="block bg-blue-500/80 text-white px-3 py-1 rounded-full text-sm hover:bg-blue-600/80 transition-colors disabled:opacity-50"
        >
          Undo
        </button>
        <button
          onClick={clearMakeup}
          className="block bg-red-500/80 text-white px-3 py-1 rounded-full text-sm hover:bg-red-600/80 transition-colors"
        >
          Clear All
        </button>
      </div>
      
      {/* Brush controls */}
      <div className="absolute bottom-4 left-4 right-4">
        <div className="bg-black/50 backdrop-blur-sm rounded-lg p-4">
          <div className="flex items-center space-x-3 mb-3">
            <span className="text-white text-sm font-medium">Brush Size:</span>
            <input
              type="range"
              min="5"
              max="40"
              value={brushSize}
              onChange={(e) => onBrushSizeChange(Number(e.target.value))}
              className="flex-1 accent-purple-500"
            />
            <span className="text-white text-sm w-10 text-center">{brushSize}px</span>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-white text-sm">Color:</span>
              <div 
                className="w-8 h-8 rounded-full border-2 border-white shadow-md"
                style={{ backgroundColor: selectedColor }}
              />
            </div>
            
            <div className="text-white text-xs opacity-75">
              Click and drag to apply makeup
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default InteractiveMakeup
