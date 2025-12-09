# Docker Setup Guide for Aura Virtual Try-On Platform

## 🐳 Prerequisites

- Docker Desktop installed and running
- Docker Compose (included with Docker Desktop)
- At least 4GB RAM available for Docker
- 10GB free disk space

## 🚀 Quick Start

### 1. **Set Up Environment Variables**

Create a `.env` file in the `backend` directory:

```bash
cd backend
cp .env.example .env
```

Edit `.env` and add your API tokens:
```env
REPLICATE_API_TOKEN=r8_your_token_here
HUGGINGFACE_API_TOKEN=hf_your_token_here  # Optional
```

### 2. **Build and Run with Docker Compose**

From the project root directory:

```bash
# Build the containers
docker-compose build

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f
```

### 3. **Access the Application**

- **Frontend**: http://localhost:3001
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/api/docs

### 4. **Stop the Application**

```bash
# Stop all services
docker-compose down

# Stop and remove volumes
docker-compose down -v
```

## 📦 Individual Container Commands

### **Backend Only**

```bash
cd backend
docker build -t aura-backend .
docker run -p 8000:8000 --env-file .env aura-backend
```

### **Frontend Only**

```bash
cd frontend
docker build -t aura-frontend .
docker run -p 3001:3001 aura-frontend
```

## 🔧 Development vs Production

### **Development Mode** (Current Setup)

```bash
docker-compose up
```

- Hot reload disabled (for stability)
- Debug mode enabled
- Logs visible in console

### **Production Mode**

For production deployment, update `docker-compose.yml`:

```yaml
environment:
  - DEBUG=False
  - ALLOWED_ORIGINS=https://yourdomain.com
```

## 🐛 Troubleshooting

### **Port Already in Use**

```bash
# Check what's using the port
lsof -ti:8000
lsof -ti:3001

# Kill the process
kill -9 $(lsof -ti:8000)
```

### **Container Won't Start**

```bash
# Check logs
docker-compose logs backend
docker-compose logs frontend

# Rebuild from scratch
docker-compose down -v
docker-compose build --no-cache
docker-compose up
```

### **Out of Memory**

Increase Docker Desktop memory:
1. Docker Desktop → Settings → Resources
2. Set Memory to at least 4GB
3. Click "Apply & Restart"

### **Backend Health Check Failing**

```bash
# Check backend health
curl http://localhost:8000/api/health

# Enter container to debug
docker exec -it aura-backend /bin/bash
```

## 📊 Container Management

### **View Running Containers**

```bash
docker ps
```

### **View All Containers**

```bash
docker ps -a
```

### **View Logs**

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
```

### **Restart Services**

```bash
# Restart all
docker-compose restart

# Restart specific service
docker-compose restart backend
```

### **Execute Commands in Container**

```bash
# Backend
docker exec -it aura-backend python -c "print('Hello from container')"

# Frontend
docker exec -it aura-frontend npm --version
```

## 🗄️ Data Persistence

### **Uploads Directory**

Backend uploads are persisted in `./backend/uploads` on your host machine.

### **Clear All Data**

```bash
docker-compose down -v
rm -rf backend/uploads/*
```

## 🌐 Network Configuration

Containers communicate via the `aura-network` bridge network:

- Backend: `http://backend:8000`
- Frontend: `http://frontend:3001`

## 📈 Resource Usage

Monitor container resources:

```bash
docker stats
```

Expected usage:
- **Backend**: ~500MB RAM, 10-20% CPU (idle)
- **Frontend**: ~100MB RAM, 1-5% CPU (idle)

## 🚢 Deployment Options

### **Docker Hub**

```bash
# Tag images
docker tag aura-backend:latest yourusername/aura-backend:latest
docker tag aura-frontend:latest yourusername/aura-frontend:latest

# Push to Docker Hub
docker push yourusername/aura-backend:latest
docker push yourusername/aura-frontend:latest
```

### **Cloud Platforms**

- **AWS ECS**: Use docker-compose.yml
- **Google Cloud Run**: Deploy individual containers
- **Azure Container Instances**: Use docker-compose
- **DigitalOcean App Platform**: Connect GitHub repo
- **Railway**: One-click deploy with Dockerfile

## 🔐 Security Best Practices

1. **Never commit `.env` files**
2. **Use secrets management** in production
3. **Run containers as non-root** user
4. **Keep images updated** regularly
5. **Scan for vulnerabilities**: `docker scan aura-backend`

## 📝 Useful Commands

```bash
# Remove all stopped containers
docker container prune

# Remove unused images
docker image prune -a

# Remove unused volumes
docker volume prune

# Complete cleanup
docker system prune -a --volumes
```

## 🎯 Next Steps

1. ✅ Containers are running
2. Test all features (glasses, makeup, clothing)
3. Deploy to cloud platform
4. Set up CI/CD pipeline
5. Configure domain and SSL

## 📚 Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Best Practices](https://docs.docker.com/develop/dev-best-practices/)
