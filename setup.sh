#!/bin/bash

echo "🚀 Setting up Aura Virtual Try-On Platform..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    print_error "Python 3 is not installed. Please install Python 3.11+ first."
    exit 1
fi

print_status "Node.js version: $(node --version)"
print_status "Python version: $(python3 --version)"

# Setup Backend
print_status "Setting up Python backend..."
cd backend

# Create virtual environment
if [ ! -d "venv" ]; then
    print_status "Creating Python virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Install Python dependencies
print_status "Installing Python dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

# Create necessary directories
mkdir -p uploads models

# Copy environment file
if [ ! -f ".env" ]; then
    cp .env.example .env
    print_warning "Created .env file from template. Please update with your settings."
fi

print_success "Backend setup complete!"

# Setup Frontend
print_status "Setting up React frontend..."
cd ../frontend

# Install Node.js dependencies
print_status "Installing Node.js dependencies..."
npm install

print_success "Frontend setup complete!"

# Final instructions
cd ..
echo ""
print_success "🎉 Aura setup complete!"
echo ""
print_status "To start the application:"
echo ""
print_status "1. Start the backend server:"
echo "   cd backend"
echo "   source venv/bin/activate"
echo "   python main.py"
echo ""
print_status "2. In a new terminal, start the frontend:"
echo "   cd frontend"
echo "   npm run dev"
echo ""
print_status "3. Open your browser to:"
echo "   Frontend: http://localhost:3001"
echo "   Backend API: http://localhost:8000/api/docs"
echo ""
print_warning "Note: You'll need to download the Dlib shape predictor model:"
print_warning "wget http://dlib.net/files/shape_predictor_68_face_landmarks.dat.bz2"
print_warning "bunzip2 shape_predictor_68_face_landmarks.dat.bz2"
print_warning "mv shape_predictor_68_face_landmarks.dat backend/models/"
echo ""
print_success "Happy coding! 🚀"
