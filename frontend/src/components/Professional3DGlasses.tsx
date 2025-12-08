import { useRef, useEffect, useState } from 'react'
// @ts-ignore
import { JEELIZVTOWIDGET } from 'jeelizvtowidget'

interface Professional3DGlassesProps {
  showDebugInfo?: boolean
}

const GLASSES_MODELS = [
  { id: 'rayban_aviator_or_vertFlash', name: 'Ray-Ban Aviator Gold' },
  { id: 'rayban_wayfarer_black', name: 'Ray-Ban Wayfarer Black' },
  { id: 'rayban_round_classic', name: 'Ray-Ban Round Classic' },
  { id: 'oakley_holbrook', name: 'Oakley Holbrook' },
]

const Professional3DGlasses: React.FC<Professional3DGlassesProps> = ({ showDebugInfo = false }) => {
  const refPlaceHolder = useRef<HTMLDivElement>(null)
  const refCanvas = useRef<HTMLCanvasElement>(null)
  const refLoading = useRef<HTMLDivElement>(null)
  
  const [selectedModel, setSelectedModel] = useState('rayban_aviator_or_vertFlash')
  const [isLoading, setIsLoading] = useState(true)
  const [isInitialized, setIsInitialized] = useState(false)
  const [adjustMode, setAdjustMode] = useState(false)

  const toggleLoading = (isLoadingVisible: boolean) => {
    setIsLoading(isLoadingVisible)
    if (refLoading.current) {
      refLoading.current.style.display = isLoadingVisible ? 'block' : 'none'
    }
  }

  const initWidget = () => {
    if (!refPlaceHolder.current || !refCanvas.current) return

    JEELIZVTOWIDGET.start({
      placeHolder: refPlaceHolder.current,
      canvas: refCanvas.current,
      callbacks: {
        ADJUST_START: null,
        ADJUST_END: null,
        LOADING_START: toggleLoading.bind(null, true),
        LOADING_END: toggleLoading.bind(null, false)
      },
      sku: selectedModel,
      callbackReady: function () {
        console.log('✅ JEELIZVTOWIDGET is ready!')
        setIsInitialized(true)
        toggleLoading(false)
      },
      onError: function (errorLabel: string) {
        console.error('❌ JEELIZVTOWIDGET error:', errorLabel)
        
        switch (errorLabel) {
          case 'WEBCAM_UNAVAILABLE':
            alert('Camera unavailable. Please allow camera access.')
            break
          case 'INVALID_SKU':
            alert('Invalid glasses model. Trying default model...')
            break
          case 'PLACEHOLDER_NULL_WIDTH':
          case 'PLACEHOLDER_NULL_HEIGHT':
            console.error('Placeholder element issue')
            break
          case 'FATAL':
          default:
            alert('An error occurred loading the 3D glasses viewer.')
            break
        }
      }
    })
  }

  useEffect(() => {
    initWidget()

    return () => {
      try {
        JEELIZVTOWIDGET.destroy()
      } catch (e) {
        console.log('Widget cleanup:', e)
      }
    }
  }, [])

  const changeGlassesModel = (sku: string) => {
    if (!isInitialized) return
    
    try {
      JEELIZVTOWIDGET.load(sku)
      setSelectedModel(sku)
    } catch (e) {
      console.error('Error loading model:', e)
    }
  }

  const startAdjustMode = () => {
    if (!isInitialized) return
    JEELIZVTOWIDGET.enter_adjustMode()
    setAdjustMode(true)
  }

  const exitAdjustMode = () => {
    if (!isInitialized) return
    JEELIZVTOWIDGET.exit_adjustMode()
    setAdjustMode(false)
  }

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center">
      {/* Main 3D Viewer Container */}
      <div 
        ref={refPlaceHolder} 
        className="relative rounded-lg overflow-hidden"
        style={{ width: '640px', height: '480px' }}
      >
        <canvas 
          ref={refCanvas} 
          className="w-full h-full"
        />
        
        {/* Loading Indicator */}
        <div 
          ref={refLoading}
          className="absolute inset-0 bg-black/70 flex items-center justify-center"
          style={{ display: isLoading ? 'block' : 'none' }}
        >
          <div className="text-white text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p className="text-lg font-semibold">Loading 3D Glasses...</p>
          </div>
        </div>
      </div>

      {/* Status Indicator */}
      <div className="absolute top-4 left-4 space-y-2">
        <div className={`px-3 py-1 rounded-full text-sm flex items-center text-white ${
          isInitialized ? 'bg-green-500' : 'bg-blue-500'
        }`}>
          <div className={`w-2 h-2 rounded-full mr-2 bg-white ${isLoading ? 'animate-pulse' : ''}`}></div>
          {isInitialized ? '3D Glasses Try-On Active' : 'Initializing...'}
        </div>
        
        {isInitialized && (
          <div className="bg-blue-500/20 border border-blue-500/50 text-blue-300 px-2 py-1 rounded text-xs">
            🕶️ Professional 3D Rendering
          </div>
        )}
      </div>

      {/* Adjust Mode Notice */}
      {adjustMode && (
        <div className="absolute top-20 left-1/2 transform -translate-x-1/2 bg-black/80 text-white px-6 py-3 rounded-lg">
          <p className="text-sm font-medium mb-2">👆 Drag the glasses to adjust position</p>
          <button
            onClick={exitAdjustMode}
            className="w-full px-4 py-2 bg-red-500 hover:bg-red-600 rounded-lg text-sm font-medium transition-colors"
          >
            Exit Adjust Mode
          </button>
        </div>
      )}

      {/* Controls */}
      {!adjustMode && isInitialized && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/70 rounded-lg p-4 w-full max-w-2xl">
          <h3 className="text-white text-sm font-semibold mb-3 text-center">Select 3D Glasses Model</h3>
          
          {/* Model Selector */}
          <div className="grid grid-cols-2 gap-3 mb-3">
            {GLASSES_MODELS.map(model => (
              <button
                key={model.id}
                onClick={() => changeGlassesModel(model.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  selectedModel === model.id
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {model.name}
              </button>
            ))}
          </div>

          {/* Adjust Button */}
          <button
            onClick={startAdjustMode}
            className="w-full px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg text-sm font-medium transition-colors"
          >
            🔧 Adjust Glasses Position
          </button>
        </div>
      )}

      {/* Debug Info */}
      {showDebugInfo && (
        <div className="absolute top-4 right-4 bg-black/70 text-white p-3 rounded-lg text-xs">
          <h3 className="font-semibold mb-1">3D Viewer Status:</h3>
          <div>Initialized: {isInitialized ? '✅' : '❌'}</div>
          <div>Loading: {isLoading ? '⏳' : '✅'}</div>
          <div>Model: {selectedModel}</div>
          <div>Adjust Mode: {adjustMode ? '🔧' : '👓'}</div>
        </div>
      )}
    </div>
  )
}

export default Professional3DGlasses
