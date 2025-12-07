import React, { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'aura' | 'aura-dark'

interface ThemeContextType {
  theme: Theme
  toggleTheme: () => void
  isDark: boolean
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

interface ThemeProviderProps {
  children: React.ReactNode
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    // Check localStorage first, then system preference
    const saved = localStorage.getItem('aura-theme') as Theme
    if (saved) return saved
    
    return window.matchMedia('(prefers-color-scheme: dark)').matches 
      ? 'aura-dark' 
      : 'aura'
  })

  const toggleTheme = () => {
    const newTheme = theme === 'aura' ? 'aura-dark' : 'aura'
    setTheme(newTheme)
  }

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('aura-theme', theme)
  }, [theme])

  const value = {
    theme,
    toggleTheme,
    isDark: theme === 'aura-dark'
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}
