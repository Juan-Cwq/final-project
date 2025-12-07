import { useState, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'
import Webcam from 'react-webcam'
import { useDropzone } from 'react-dropzone'
import toast from 'react-hot-toast'
import AdvancedFaceDetection from '../components/AdvancedFaceDetection'
import {
  CameraIcon,
  PhotoIcon,
  ArrowPathIcon,
  Square3Stack3DIcon,
  EyeIcon,
  FaceSmileIcon,
  SwatchIcon
} from '@heroicons/react/24/outline'

type TryOnCategory = 'clothing' | 'glasses' | 'makeup'

const TryOn = () => {
  const [activeCategory, setActiveCategory] = useState<TryOnCategory>('clothing')
  const [isProcessing, setIsProcessing] = useState(false)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [selectedColor, setSelectedColor] = useState('#E8A89A')
  const [selectedProduct, setSelectedProduct] = useState<File | null>(null)
  const [brushSize, setBrushSize] = useState(15)
  const [makeupType, setMakeupType] = useState<'lipstick' | 'blush' | 'eyeshadow'>('lipstick')
  const [intensity, setIntensity] = useState(70)
  const webcamRef = useRef<Webcam>(null)

  const categories = [
    { id: 'clothing' as const, name: 'Clothing', icon: Square3Stack3DIcon, color: 'text-aura-teal' },
    { id: 'glasses' as const, name: 'Glasses', icon: EyeIcon, color: 'text-aura-peach' },
    { id: 'makeup' as const, name: 'Makeup', icon: FaceSmileIcon, color: 'text-aura-purple' }
  ]

  const makeupColors = [
    '#E8A89A', // Aura Peach
    '#E6A08F', // Coral Pink
    '#C6AEE0', // Soft Lavender
    '#A491D3', // Muted Purple
    '#FF6B6B', // Red
    '#4ECDC4', // Teal
    '#45B7D1', // Blue
    '#96CEB4', // Green
    '#FFEAA7', // Yellow
    '#DDA0DD', // Plum
    '#F39C12', // Orange
    '#8E44AD'  // Purple
  ]

  const capture = useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot()
    if (imageSrc) {
      setCapturedImage(imageSrc)
      processTryOn(imageSrc)
    }
  }, [webcamRef])

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (file) {
      if (activeCategory === 'makeup') {
        toast.error('Please use camera for makeup try-on')
        return
      }
      setSelectedProduct(file)
      toast.success('Product image uploaded!')
    }
  }, [activeCategory])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg']
    },
    maxFiles: 1,
    disabled: activeCategory === 'makeup'
  })

  const processTryOn = async (imageData: string) => {
    setIsProcessing(true)
    
    try {
      // For makeup, we use real-time preview instead of backend processing
      if (activeCategory === 'makeup') {
        setCapturedImage(imageData)
        toast.success('Makeup applied! Use the live preview to see changes.')
        setIsProcessing(false)
        return
      }
      
      // For clothing and glasses, try backend processing
      const response = await fetch(imageData)
      const blob = await response.blob()
      
      const formData = new FormData()
      formData.append('image', blob, 'capture.jpg')
      formData.append('category', activeCategory)
      
      if (selectedProduct) {
        formData.append('product_image', selectedProduct)
      }

      // Try to send to backend (will fail gracefully if backend is down)
      try {
        const apiResponse = await fetch('http://localhost:8000/api/tryon/stream', {
          method: 'POST',
          body: formData
        })

        if (apiResponse.ok) {
          const processedBlob = await apiResponse.blob()
          const processedImageUrl = URL.createObjectURL(processedBlob)
          setCapturedImage(processedImageUrl)
          toast.success('Try-on processed successfully!')
        } else {
          throw new Error('Backend processing failed')
        }
      } catch (backendError) {
        // Fallback: just show the captured image
        setCapturedImage(imageData)
        toast('Backend not available. Showing captured image.', { icon: '📸' })
      }
    } catch (error) {
      console.error('Try-on error:', error)
      toast.error('Failed to process try-on. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  const resetCapture = () => {
    setCapturedImage(null)
    setSelectedProduct(null)
  }

  return (
    <div className="min-h-screen bg-base-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-serif font-bold text-gradient mb-4">
            Virtual Try-On Studio
          </h1>
          <p className="text-lg text-neutral-medium max-w-2xl mx-auto">
            Experience products in real-time using your camera or upload a photo
          </p>
        </div>

        {/* Category Selection */}
        <div className="flex justify-center mb-8">
          <div className="flex space-x-2 bg-base-200 p-2 rounded-xl">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                  activeCategory === category.id
                    ? 'bg-primary text-white shadow-lg'
                    : 'text-neutral hover:bg-base-300'
                }`}
              >
                <category.icon className="w-5 h-5" />
                <span className="font-medium">{category.name}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Camera/Upload Section */}
          <div className="space-y-6">
            <div className="card-aura p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <CameraIcon className="w-6 h-6 mr-2" />
                Camera
              </h2>
              
              <div className="camera-preview mb-4">
                {capturedImage && activeCategory !== 'makeup' ? (
                  <div className="relative">
                    <img
                      src={capturedImage}
                      alt="Captured"
                      className="w-full h-full object-cover rounded-xl"
                    />
                    {isProcessing && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-xl">
                        <div className="text-center text-white">
                          <ArrowPathIcon className="w-8 h-8 animate-spin mx-auto mb-2" />
                          <p>Processing...</p>
                        </div>
                      </div>
                    )}
                  </div>
                ) : activeCategory === 'makeup' ? (
                  <AdvancedFaceDetection showDebugInfo={true} />
                ) : (
                  <Webcam
                    ref={webcamRef}
                    screenshotFormat="image/jpeg"
                    className="w-full h-full object-cover rounded-xl"
                    mirrored
                  />
                )}
              </div>

              <div className="flex space-x-3">
                {activeCategory === 'makeup' ? (
                  <div className="w-full text-center">
                    <p className="text-sm text-gray-600 mb-2">
                      🎯 68-point facial landmarks! Professional-grade feature outlining like in the example.
                    </p>
                    <button
                      onClick={capture}
                      className="btn btn-primary"
                    >
                      <CameraIcon className="w-5 h-5 mr-2" />
                      Capture Look
                    </button>
                  </div>
                ) : (
                  <>
                    <button
                      onClick={capture}
                      disabled={isProcessing}
                      className="btn btn-primary flex-1"
                    >
                      <CameraIcon className="w-5 h-5 mr-2" />
                      Capture & Try On
                    </button>
                    {capturedImage && (
                      <button
                        onClick={resetCapture}
                        className="btn btn-outline"
                      >
                        <ArrowPathIcon className="w-5 h-5" />
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Product Upload (for clothing/glasses) */}
            {activeCategory !== 'makeup' && (
              <div className="card-aura p-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center">
                  <PhotoIcon className="w-6 h-6 mr-2" />
                  Upload Product
                </h2>
                
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                    isDragActive
                      ? 'border-primary bg-primary/5'
                      : 'border-base-300 hover:border-primary/50'
                  }`}
                >
                  <input {...getInputProps()} />
                  <PhotoIcon className="w-12 h-12 mx-auto mb-4 text-neutral-medium" />
                  {selectedProduct ? (
                    <div>
                      <p className="font-medium text-success">
                        {selectedProduct.name}
                      </p>
                      <p className="text-sm text-neutral-medium">
                        Click to change
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="font-medium mb-2">
                        Drop {activeCategory} image here
                      </p>
                      <p className="text-sm text-neutral-medium">
                        or click to browse
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Makeup Controls */}
            {activeCategory === 'makeup' && (
              <div className="card-aura p-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center">
                  <SwatchIcon className="w-6 h-6 mr-2" />
                  Makeup Settings
                  <div 
                    className="ml-auto w-8 h-8 rounded-full border-2 border-primary shadow-md"
                    style={{ backgroundColor: selectedColor }}
                    title={`Selected: ${selectedColor}`}
                  />
                </h2>
                
                {/* Makeup Type Selector */}
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">Makeup Type</label>
                  <div className="flex space-x-2">
                    {[
                      { id: 'lipstick' as const, name: 'Lipstick', emoji: '💄' },
                      { id: 'blush' as const, name: 'Blush', emoji: '🌸' },
                      { id: 'eyeshadow' as const, name: 'Eyeshadow', emoji: '👁️' }
                    ].map((type) => (
                      <button
                        key={type.id}
                        onClick={() => setMakeupType(type.id)}
                        className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm transition-all ${
                          makeupType === type.id
                            ? 'bg-primary text-white'
                            : 'bg-base-200 hover:bg-base-300'
                        }`}
                      >
                        <span>{type.emoji}</span>
                        <span>{type.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="grid grid-cols-6 gap-3">
                  {makeupColors.map((color) => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={`w-12 h-12 rounded-full border-3 transition-all hover:scale-110 ${
                        selectedColor === color
                          ? 'border-primary scale-110 shadow-lg'
                          : 'border-base-300 hover:border-primary/50'
                      }`}
                      style={{ backgroundColor: color }}
                      title={`Apply ${color}`}
                    />
                  ))}
                </div>
                
                <div className="mt-4">
                  <label className="block text-sm font-medium mb-2">
                    Custom Color
                  </label>
                  <input
                    type="color"
                    value={selectedColor}
                    onChange={(e) => setSelectedColor(e.target.value)}
                    className="w-full h-10 rounded-lg border border-base-300"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Instructions/Tips */}
          <div className="space-y-6">
            <div className="card-aura p-6">
              <h2 className="text-xl font-semibold mb-4">
                How to Get the Best Results
              </h2>
              
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 mt-0.5">
                    1
                  </div>
                  <div>
                    <h3 className="font-medium">Good Lighting</h3>
                    <p className="text-sm text-neutral-medium">
                      Ensure you have even, natural lighting on your face
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 mt-0.5">
                    2
                  </div>
                  <div>
                    <h3 className="font-medium">Face the Camera</h3>
                    <p className="text-sm text-neutral-medium">
                      Look directly at the camera for accurate detection
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 mt-0.5">
                    3
                  </div>
                  <div>
                    <h3 className="font-medium">Clear Background</h3>
                    <p className="text-sm text-neutral-medium">
                      Use a plain background for better results
                    </p>
                  </div>
                </div>

                {activeCategory === 'clothing' && (
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 mt-0.5">
                      4
                    </div>
                    <div>
                      <h3 className="font-medium">Full Body View</h3>
                      <p className="text-sm text-neutral-medium">
                        Show your torso for accurate clothing placement
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="card-aura p-6 bg-gradient-to-br from-primary/5 to-secondary/5">
              <h2 className="text-xl font-semibold mb-4">
                ✨ Pro Tips
              </h2>
              
              <ul className="space-y-2 text-sm">
                <li className="flex items-center space-x-2">
                  <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
                  <span>Try multiple angles for the best fit assessment</span>
                </li>
                <li className="flex items-center space-x-2">
                  <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
                  <span>Save your favorite looks for later comparison</span>
                </li>
                <li className="flex items-center space-x-2">
                  <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
                  <span>Experiment with different colors and styles</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TryOn
