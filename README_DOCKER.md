# 🐳 Aura Virtual Try-On - Docker Deployment

## Quick Start (3 Commands)

```bash
# 1. Build containers
docker-compose build

# 2. Start application
docker-compose up -d

# 3. Open browser
open http://localhost:3001
```

## 📦 What's Included

### **Services:**
- **Backend** (Python/FastAPI) - Port 8000
- **Frontend** (React/Vite) - Port 3001

### **Features:**
- ✅ Professional 3D glasses try-on (6 Ray-Ban models)
- ✅ AI-powered clothing try-on (Replicate API)
- ✅ 106-point facial landmark detection (InsightFace)
- ✅ Real-time face tracking
- ✅ Virtual makeup application

## 🚀 Deployment Commands

### **Local Development**
```bash
docker-compose up
```

### **Production Mode**
```bash
docker-compose up -d
docker-compose logs -f
```

### **Stop Everything**
```bash
docker-compose down
```

### **Rebuild from Scratch**
```bash
docker-compose down -v
docker-compose build --no-cache
docker-compose up
```

## 🔧 Configuration

### **Environment Variables**

Create `backend/.env`:
```env
REPLICATE_API_TOKEN=r8_your_token_here
HUGGINGFACE_API_TOKEN=hf_your_token_here
```

### **Ports**
- Frontend: `3001`
- Backend: `8000`

Change in `docker-compose.yml` if needed.

## 📊 Container Status

```bash
# View running containers
docker ps

# View logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Check resource usage
docker stats
```

## 🌐 Access Points

- **Application**: http://localhost:3001
- **API Docs**: http://localhost:8000/api/docs
- **Health Check**: http://localhost:8000/api/health

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Kill existing processes
lsof -ti:8000 | xargs kill -9
lsof -ti:3001 | xargs kill -9
```

### Container Won't Start
```bash
# Check logs
docker-compose logs backend

# Rebuild
docker-compose build --no-cache
```

### Out of Memory
- Docker Desktop → Settings → Resources
- Increase Memory to 4GB+
- Apply & Restart

## 📦 Image Sizes

- **Backend**: ~2GB (includes Python, OpenCV, InsightFace)
- **Frontend**: ~200MB (Node.js + built assets)

## 🚢 Deploy to Cloud

### **Docker Hub**
```bash
docker tag aura-backend yourusername/aura-backend
docker push yourusername/aura-backend
```

### **Cloud Platforms**
- AWS ECS
- Google Cloud Run
- Azure Container Instances
- DigitalOcean
- Railway
- Render

## 📝 Files Created

```
├── backend/
│   ├── Dockerfile          # Backend container config
│   └── requirements.txt    # Python dependencies
├── frontend/
│   └── Dockerfile          # Frontend container config
├── docker-compose.yml      # Multi-container orchestration
├── .dockerignore          # Files to exclude
└── DOCKER_SETUP.md        # Detailed documentation
```

## ✅ Next Steps

1. ✅ Containers built
2. Test locally: `docker-compose up`
3. Add API tokens to `backend/.env`
4. Deploy to cloud platform
5. Configure custom domain

## 🎯 Production Checklist

- [ ] Set `DEBUG=False` in docker-compose.yml
- [ ] Update `ALLOWED_ORIGINS` with your domain
- [ ] Use secrets management for API tokens
- [ ] Set up SSL/TLS certificates
- [ ] Configure CDN for frontend assets
- [ ] Set up monitoring and logging
- [ ] Configure auto-scaling
- [ ] Set up backup strategy

## 📚 Documentation

- Full setup: `DOCKER_SETUP.md`
- Virtual try-on: `VIRTUAL_TRYON_SETUP.md`
- Main README: `README.md`

---

**Ready to deploy!** 🚀
