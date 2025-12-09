import React, { useState, useCallback, useRef } from 'react'
import { useDropzone } from 'react-dropzone'
import toast from 'react-hot-toast'
import {
  PhotoIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  XMarkIcon,
  SparklesIcon
} from '@heroicons/react/24/outline'

interface Jacket {
  id: string
  name: string
  image: string
  color: string
}

const JACKETS: Jacket[] = [
  { id: 'black-bomber', name: 'Black Bomber', image: '/jackets/black-bomber.jpg', color: 'Black' },
  { id: 'blue-jacket', name: 'Blue Jacket', image: '/jackets/blue-jacket.jpeg', color: 'Blue' },
  { id: 'red-jacket', name: 'Red Jacket', image: '/jackets/red-jacket.jpg', color: 'Red' },
]

interface VirtualClothingTryOnProps {
  showDebugInfo?: boolean
}

const VirtualClothingTryOn: React.FC<VirtualClothingTryOnProps> = ({ showDebugInfo = false }) => {
  const [userImage, setUserImage] = useState<string | null>(null)
  const [selectedJacket, setSelectedJacket] = useState<string>(JACKETS[0].id)
  const [resultImage, setResultImage] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (file) {
      setUploadedFile(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setUserImage(e.target?.result as string)
        setResultImage(null) // Clear previous result
      }
      reader.readAsDataURL(file)
      toast.success('Image uploaded! Select a jacket and click "Try On"')
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg']
    },
    maxFiles: 1,
    multiple: false
  })

  const processVirtualTryOn = async () => {
    if (!userImage || !uploadedFile) {
      toast.error('Please upload your photo first')
      return
    }

    console.log('🚀 Starting virtual try-on process...')
    setIsProcessing(true)
    setResultImage(null)

    try {
      // Get the selected jacket
      const jacket = JACKETS.find(j => j.id === selectedJacket)
      if (!jacket) {
        throw new Error('Jacket not found')
      }
      console.log('✅ Selected jacket:', jacket)

      // Fetch the jacket image
      console.log('📥 Fetching jacket image from:', jacket.image)
      const jacketResponse = await fetch(jacket.image)
      const jacketBlob = await jacketResponse.blob()
      console.log('✅ Jacket image fetched:', jacketBlob.size, 'bytes')

      // Create FormData
      const formData = new FormData()
      formData.append('user_image', uploadedFile, 'user.jpg')
      formData.append('garment_image', jacketBlob, 'jacket.png')
      formData.append('category', 'upper_body')
      formData.append('garment_type', 'jacket')

      // Call backend API
      console.log('📡 Calling backend API: http://localhost:8000/api/tryon/virtual-clothing')
      const response = await fetch('http://localhost:8000/api/tryon/virtual-clothing', {
        method: 'POST',
        body: formData
      })
      console.log('📨 Response status:', response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ Backend error:', response.status, errorText)
        
        // If backend is not available, show a demo/mock result
        if (response.status === 404 || response.status === 500) {
          toast.error(`Backend error: ${errorText.substring(0, 100)}`)
          // Create a simple overlay as demo
          createDemoOverlay()
          return
        }
        throw new Error(`API request failed: ${response.status}`)
      }

      const blob = await response.blob()
      const resultUrl = URL.createObjectURL(blob)
      setResultImage(resultUrl)
      toast.success('Virtual try-on complete! 🎉')

    } catch (error) {
      console.error('Virtual try-on error:', error)
      // Fallback to demo overlay
      toast('Creating demo overlay...', { icon: '🎨' })
      createDemoOverlay()
    } finally {
      setIsProcessing(false)
    }
  }

  const createDemoOverlay = () => {
    // Simple demo: just show the user image with a message
    // In production, this would be replaced with actual AI processing
    setResultImage(userImage)
    toast('Demo mode: Real AI processing requires backend setup', { 
      icon: 'ℹ️',
      duration: 5000 
    })
  }

  const resetTryOn = () => {
    setUserImage(null)
    setResultImage(null)
    setUploadedFile(null)
  }

  return (
    <div className="w-full h-full flex flex-col bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto w-full">
        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-white mb-2 flex items-center justify-center gap-2">
            <SparklesIcon className="w-6 h-6 text-purple-400" />
            Virtual Clothing Try-On
          </h2>
          <p className="text-gray-400 text-sm">
            Upload your photo and see how different jackets look on you!
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Side: Upload & Jacket Selection */}
          <div className="space-y-4">
            {/* Image Upload */}
            <div className="card-aura p-4">
              <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                <PhotoIcon className="w-5 h-5" />
                Step 1: Upload Your Photo
              </h3>
              
              {!userImage ? (
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                    isDragActive
                      ? 'border-purple-500 bg-purple-500/10'
                      : 'border-gray-600 hover:border-purple-500/50 bg-gray-800/50'
                  }`}
                >
                  <input {...getInputProps()} />
                  <PhotoIcon className="w-16 h-16 mx-auto mb-4 text-gray-500" />
                  {isDragActive ? (
                    <p className="text-purple-400 font-medium">Drop your photo here...</p>
                  ) : (
                    <div>
                      <p className="text-white font-medium mb-2">
                        Drop your photo here or click to browse
                      </p>
                      <p className="text-sm text-gray-400">
                        PNG, JPG up to 10MB
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="relative">
                  <img
                    src={userImage}
                    alt="Uploaded"
                    className="w-full h-64 object-cover rounded-lg"
                  />
                  <button
                    onClick={resetTryOn}
                    className="absolute top-2 right-2 p-2 bg-red-500 hover:bg-red-600 rounded-full text-white transition-colors"
                  >
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                  <div className="absolute bottom-2 left-2 bg-green-500 text-white px-3 py-1 rounded-full text-xs flex items-center gap-1">
                    <CheckCircleIcon className="w-4 h-4" />
                    Photo Ready
                  </div>
                </div>
              )}
            </div>

            {/* Jacket Selection */}
            <div className="card-aura p-4">
              <h3 className="text-white font-semibold mb-3">
                Step 2: Choose a Jacket
              </h3>
              
              <div className="grid grid-cols-3 gap-3">
                {JACKETS.map((jacket) => (
                  <button
                    key={jacket.id}
                    onClick={() => setSelectedJacket(jacket.id)}
                    className={`relative rounded-lg overflow-hidden transition-all ${
                      selectedJacket === jacket.id
                        ? 'ring-4 ring-purple-500 scale-105'
                        : 'hover:scale-105 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={jacket.image}
                      alt={jacket.name}
                      className="w-full h-32 object-cover bg-gray-800"
                      onError={(e) => {
                        // Fallback if image doesn't load
                        e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23333" width="200" height="200"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23999" font-size="16"%3EJacket%3C/text%3E%3C/svg%3E'
                      }}
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-black/70 p-2">
                      <p className="text-white text-xs font-medium">{jacket.name}</p>
                      <p className="text-gray-300 text-xs">{jacket.color}</p>
                    </div>
                    {selectedJacket === jacket.id && (
                      <div className="absolute top-2 right-2 bg-purple-500 rounded-full p-1">
                        <CheckCircleIcon className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Try On Button */}
            <button
              onClick={processVirtualTryOn}
              disabled={!userImage || isProcessing}
              className={`w-full py-4 rounded-lg font-semibold text-white transition-all flex items-center justify-center gap-2 ${
                !userImage || isProcessing
                  ? 'bg-gray-600 cursor-not-allowed'
                  : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 shadow-lg hover:shadow-xl'
              }`}
            >
              {isProcessing ? (
                <>
                  <ArrowPathIcon className="w-5 h-5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <SparklesIcon className="w-5 h-5" />
                  Try On Jacket
                </>
              )}
            </button>
          </div>

          {/* Right Side: Result */}
          <div className="card-aura p-4">
            <h3 className="text-white font-semibold mb-3">
              Step 3: See the Result
            </h3>
            
            <div className="relative bg-gray-800 rounded-lg overflow-hidden" style={{ minHeight: '500px' }}>
              {resultImage ? (
                <div className="relative">
                  <img
                    src={resultImage}
                    alt="Try-on result"
                    className="w-full h-full object-contain"
                  />
                  <div className="absolute top-4 left-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm flex items-center gap-2">
                    <CheckCircleIcon className="w-5 h-5" />
                    Try-On Complete!
                  </div>
                </div>
              ) : isProcessing ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <ArrowPathIcon className="w-16 h-16 text-purple-500 animate-spin mb-4" />
                  <p className="text-white font-medium">Processing your try-on...</p>
                  <p className="text-gray-400 text-sm mt-2">This may take a few seconds</p>
                </div>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8">
                  <SparklesIcon className="w-16 h-16 text-gray-600 mb-4" />
                  <p className="text-gray-400 font-medium mb-2">
                    Your virtual try-on result will appear here
                  </p>
                  <p className="text-gray-500 text-sm">
                    Upload a photo and select a jacket to get started
                  </p>
                </div>
              )}
            </div>

            {resultImage && (
              <div className="mt-4 flex gap-3">
                <button
                  onClick={() => {
                    const link = document.createElement('a')
                    link.href = resultImage
                    link.download = 'virtual-tryon-result.jpg'
                    link.click()
                  }}
                  className="flex-1 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
                >
                  Download Result
                </button>
                <button
                  onClick={resetTryOn}
                  className="flex-1 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
                >
                  Try Another
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Info Box */}
        <div className="mt-6 bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
          <h4 className="text-blue-400 font-semibold mb-2 flex items-center gap-2">
            <SparklesIcon className="w-5 h-5" />
            How it works
          </h4>
          <ul className="text-gray-300 text-sm space-y-1">
            <li>• Upload a clear, front-facing photo of yourself</li>
            <li>• Select the jacket you want to try on</li>
            <li>• Our AI will overlay the jacket onto your photo</li>
            <li>• Download and share your virtual try-on result!</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default VirtualClothingTryOn
