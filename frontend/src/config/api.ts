// API Configuration
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export const API_ENDPOINTS = {
  health: `${API_BASE_URL}/api/health`,
  landmarks: `${API_BASE_URL}/api/landmarks/health`,
  virtualClothing: `${API_BASE_URL}/api/tryon/virtual-clothing`,
}

console.log('🔧 API Configuration:', {
  baseUrl: API_BASE_URL,
  env: import.meta.env.VITE_API_URL,
})
