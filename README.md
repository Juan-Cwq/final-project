# Aura - Virtual Try-On Platform

Transform online shopping with AR-powered virtual try-on for clothing, glasses, and makeup.

## 🎯 Project Overview

Aura eliminates the uncertainty of online shopping by letting users see exactly how products look on them before purchasing. Built for the modern, conscious consumer who values time, money, and sustainability.

## 🏗️ Architecture

### Frontend
- **Framework:** React 18 + Vite + TypeScript
- **Styling:** Tailwind CSS + DaisyUI
- **Animations:** Framer Motion
- **Icons:** Heroicons
- **State Management:** React Context + Hooks

### Backend
- **Framework:** FastAPI (Python 3.11+)
- **Computer Vision:** OpenCV + Mediapipe + Dlib
- **Real-time Processing:** WebSocket support
- **API:** RESTful endpoints

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Python 3.11+
- Webcam access

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python main.py
```

## 📁 Project Structure

```
aura/
├── frontend/                 # React application
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/           # Page components
│   │   ├── hooks/           # Custom React hooks
│   │   ├── context/         # React Context providers
│   │   ├── utils/           # Utility functions
│   │   └── assets/          # Images, fonts, etc.
│   ├── public/              # Static assets
│   └── package.json
│
├── backend/                 # Python FastAPI server
│   ├── app/
│   │   ├── api/            # API routes
│   │   ├── core/           # Core functionality
│   │   ├── models/         # Data models
│   │   ├── services/       # Business logic
│   │   │   ├── clothing.py # Clothing try-on
│   │   │   ├── glasses.py  # Glasses try-on
│   │   │   └── makeup.py   # Makeup try-on
│   │   └── utils/          # Helper functions
│   ├── requirements.txt
│   └── main.py
│
└── README.md
```

## 🎨 Design System

### Color Palette
- **Primary Gradient:** `linear-gradient(120deg, #2D7A7D 0%, #E8A89A 50%, #A491D3 100%)`
- **Teal:** #2D7A7D (Trust)
- **Peach:** #E8A89A (Warmth)
- **Lavender:** #A491D3 (Sophistication)

### Typography
- **Primary:** Inter (UI, body text)
- **Secondary:** DM Serif Display (headlines)

## 🔧 Features

### MVP (Phase 1)
- [x] Real-time camera access
- [x] Precise face detection with pixel-level analysis
- [x] Advanced facial feature tracking (eyes, lips, nose, hair)
- [x] Strict validation to prevent false positives
- [x] Real-time makeup preview with accurate bounding boxes
- [x] Snapshot capture
- [x] Product catalog browsing

### Phase 2
- [ ] User authentication
- [ ] Save favorite looks
- [ ] Try-on history
- [ ] High-quality render (VITON-HD API)
- [ ] Social sharing

### Phase 3
- [ ] Brand partnerships
- [ ] Direct purchase integration
- [ ] Style recommendations
- [ ] Body measurement tool

## 🧪 Testing

```bash
# Frontend tests
cd frontend
npm run test

# Backend tests
cd backend
echo "   Frontend: http://localhost:3001"
echo "   Backend API: http://localhost:8000/api/docs"
pytest
```

## 📝 License

MIT License - See LICENSE file for details

## 👥 Team

Built with ❤️ for the modern shopper who deserves better.
