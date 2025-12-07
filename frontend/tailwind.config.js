/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Aura brand colors
        'aura': {
          'teal': '#2D7A7D',
          'ocean': '#5B9A9C', 
          'peach': '#E8A89A',
          'coral': '#E6A08F',
          'lavender': '#C6AEE0',
          'purple': '#A491D3',
        },
        // Neutral colors
        'neutral': {
          'dark': '#1A202C',
          'medium': '#718096',
          'light': '#F7FAFC',
        },
        // Text colors for consistency
        'text': {
          'neutral': '#1A202C',
          'neutral-medium': '#718096',
        }
      },
      fontFamily: {
        'sans': ['Inter', 'system-ui', 'sans-serif'],
        'serif': ['DM Serif Display', 'serif'],
      },
      backgroundImage: {
        'aura-gradient': 'linear-gradient(120deg, #2D7A7D 0%, #E8A89A 50%, #A491D3 100%)',
        'aura-gradient-dark': 'linear-gradient(120deg, #1a5a5c 0%, #c8887a 50%, #8471b3 100%)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [
    require('daisyui'),
  ],
  daisyui: {
    themes: [
      {
        aura: {
          "primary": "#2D7A7D",
          "secondary": "#E8A89A", 
          "accent": "#A491D3",
          "neutral": "#1A202C",
          "base-100": "#FFFFFF",
          "base-200": "#F7FAFC",
          "base-300": "#E2E8F0",
          "info": "#4299E1",
          "success": "#48BB78",
          "warning": "#F6AD55",
          "error": "#E53E3E",
        },
      },
      {
        "aura-dark": {
          "primary": "#5B9A9C",
          "secondary": "#C8887A",
          "accent": "#8471B3", 
          "neutral": "#F7FAFC",
          "base-100": "#1A202C",
          "base-200": "#2D3748",
          "base-300": "#4A5568",
          "info": "#63B3ED",
          "success": "#68D391",
          "warning": "#F6AD55",
          "error": "#FC8181",
        },
      },
    ],
  },
}
