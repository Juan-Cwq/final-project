#!/bin/bash

# Aura Virtual Try-On - Deployment Script
# This script prepares your project for deployment

set -e  # Exit on error

echo "🚀 Aura Virtual Try-On - Deployment Preparation"
echo "================================================"
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker Desktop."
    exit 1
fi

echo "✅ Docker is running"
echo ""

# Build containers
echo "📦 Building Docker containers..."
docker-compose build

if [ $? -eq 0 ]; then
    echo "✅ Containers built successfully"
else
    echo "❌ Container build failed"
    exit 1
fi

echo ""

# Test containers locally
echo "🧪 Testing containers locally..."
docker-compose up -d

# Wait for services to start
echo "⏳ Waiting for services to start..."
sleep 10

# Health check
echo "🏥 Checking backend health..."
if curl -f http://localhost:8000/api/health > /dev/null 2>&1; then
    echo "✅ Backend is healthy"
else
    echo "⚠️  Backend health check failed (might be normal if still starting)"
fi

# Stop containers
echo "🛑 Stopping test containers..."
docker-compose down

echo ""
echo "================================================"
echo "✅ Deployment preparation complete!"
echo ""
echo "📋 Next Steps:"
echo ""
echo "1. Push to GitHub:"
echo "   git add ."
echo "   git commit -m 'Add Docker deployment configuration'"
echo "   git push origin main"
echo ""
echo "2. Deploy on Railway (Recommended):"
echo "   - Go to https://railway.app"
echo "   - Click 'Deploy from GitHub'"
echo "   - Select your repo"
echo "   - Add environment variables"
echo ""
echo "3. Or deploy on Render:"
echo "   - Go to https://render.com"
echo "   - Click 'New Web Service'"
echo "   - Connect GitHub repo"
echo ""
echo "4. Or use Railway CLI:"
echo "   npm install -g @railway/cli"
echo "   railway login"
echo "   railway up"
echo ""
echo "📚 See DEPLOYMENT.md for detailed instructions"
echo "================================================"
