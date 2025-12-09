# 🚀 Deployment Guide - Aura Virtual Try-On Platform

## Quick Deploy Options

### ⚡ **Railway (Easiest - Recommended)**

#### **Method 1: GitHub Integration (No CLI needed)**

1. **Push to GitHub** (if not already done)
   ```bash
   git add .
   git commit -m "Add Docker configuration"
   git push origin main
   ```

2. **Deploy on Railway**
   - Go to https://railway.app
   - Click "Start a New Project"
   - Select "Deploy from GitHub repo"
   - Choose `Juan-Cwq/final-project`
   - Railway auto-detects `docker-compose.yml`

3. **Configure Services**
   
   **Backend Service:**
   - Click on backend service
   - Go to "Variables" tab
   - Add:
     ```
     REPLICATE_API_TOKEN=r8_your_token_here
     PORT=8000
     ```
   - Click "Deploy"

   **Frontend Service:**
   - Click on frontend service
   - Go to "Variables" tab
   - Add:
     ```
     VITE_API_URL=https://your-backend-url.railway.app
     ```
   - Click "Deploy"

4. **Get Your URLs**
   - Backend: `https://aura-backend-production.up.railway.app`
   - Frontend: `https://aura-frontend-production.up.railway.app`

5. **Update CORS** (Important!)
   - Go to backend service variables
   - Update `ALLOWED_ORIGINS`:
     ```
     ALLOWED_ORIGINS=https://your-frontend-url.railway.app
     ```

**Cost:** $5/month after free trial ($5 credit included)

---

#### **Method 2: Railway CLI**

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Initialize project
railway init

# Deploy
railway up

# Add environment variables
railway variables set REPLICATE_API_TOKEN=r8_your_token_here

# Open in browser
railway open
```

---

### 🎨 **Render**

1. **Create Account**
   - Go to https://render.com
   - Sign up with GitHub

2. **Deploy Backend**
   - Click "New" → "Web Service"
   - Connect GitHub repo: `Juan-Cwq/final-project`
   - Settings:
     - **Name:** aura-backend
     - **Root Directory:** backend
     - **Environment:** Docker
     - **Plan:** Free
   - Environment Variables:
     ```
     REPLICATE_API_TOKEN=r8_your_token_here
     PORT=8000
     ```
   - Click "Create Web Service"

3. **Deploy Frontend**
   - Click "New" → "Web Service"
   - Connect same repo
   - Settings:
     - **Name:** aura-frontend
     - **Root Directory:** frontend
     - **Environment:** Docker
     - **Plan:** Free
   - Environment Variables:
     ```
     VITE_API_URL=https://aura-backend.onrender.com
     ```
   - Click "Create Web Service"

4. **Update Backend CORS**
   - Go to backend service
   - Add environment variable:
     ```
     ALLOWED_ORIGINS=https://aura-frontend.onrender.com
     ```

**Cost:** Free tier available, $7/month for paid tier

---

### ☁️ **Google Cloud Run**

#### **Prerequisites**
```bash
# Install gcloud CLI
brew install google-cloud-sdk

# Login
gcloud auth login

# Set project
gcloud config set project YOUR_PROJECT_ID
```

#### **Deploy Backend**
```bash
cd backend

# Build and deploy
gcloud run deploy aura-backend \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars REPLICATE_API_TOKEN=r8_your_token_here

# Get URL
gcloud run services describe aura-backend --region us-central1 --format 'value(status.url)'
```

#### **Deploy Frontend**
```bash
cd ../frontend

# Update VITE_API_URL in Dockerfile or pass as build arg
gcloud run deploy aura-frontend \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars VITE_API_URL=https://aura-backend-xxx.run.app
```

**Cost:** Free tier: 2M requests/month, then pay-per-use

---

### 🐳 **Docker Hub + Any Cloud**

#### **1. Push to Docker Hub**
```bash
# Login to Docker Hub
docker login

# Build and tag images
docker build -t yourusername/aura-backend:latest ./backend
docker build -t yourusername/aura-frontend:latest ./frontend

# Push to Docker Hub
docker push yourusername/aura-backend:latest
docker push yourusername/aura-frontend:latest
```

#### **2. Deploy to Any Platform**

**DigitalOcean:**
```bash
# Create droplet with Docker
doctl compute droplet create aura \
  --image docker-20-04 \
  --size s-2vcpu-4gb \
  --region nyc1

# SSH and run
ssh root@your-droplet-ip
docker-compose up -d
```

**AWS ECS:**
- Use AWS Console
- Create ECS cluster
- Create task definitions from Docker images
- Deploy services

---

### 🌐 **Vercel (Frontend Only)**

For frontend-only deployment (if you host backend elsewhere):

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy frontend
cd frontend
vercel --prod
```

**Note:** Backend needs separate hosting (Railway, Render, etc.)

---

## 🔧 **Pre-Deployment Checklist**

### **1. Update Environment Variables**

**Backend (.env):**
```env
REPLICATE_API_TOKEN=r8_your_actual_token
ALLOWED_ORIGINS=https://your-frontend-domain.com
DEBUG=False
```

**Frontend:**
```env
VITE_API_URL=https://your-backend-domain.com
```

### **2. Update docker-compose.yml for Production**

```yaml
environment:
  - DEBUG=False
  - ALLOWED_ORIGINS=https://your-frontend-url.com
```

### **3. Test Locally First**
```bash
docker-compose up --build
# Test at http://localhost:3001
```

### **4. Security**
- [ ] Never commit `.env` files
- [ ] Use platform secrets management
- [ ] Enable HTTPS (automatic on Railway/Render)
- [ ] Set up CORS properly
- [ ] Use environment variables for all secrets

---

## 📊 **Platform Comparison**

| Platform | Free Tier | Ease | Auto-Deploy | Cost/Month |
|----------|-----------|------|-------------|------------|
| **Railway** | $5 credit | ⭐⭐⭐⭐⭐ | ✅ | $5+ |
| **Render** | 750 hrs | ⭐⭐⭐⭐ | ✅ | Free/$7+ |
| **Cloud Run** | 2M requests | ⭐⭐⭐ | ✅ | Pay-per-use |
| **Vercel** | Unlimited | ⭐⭐⭐⭐⭐ | ✅ | Free (frontend) |
| **DigitalOcean** | $200 credit | ⭐⭐ | ❌ | $12+ |

---

## 🎯 **Recommended Setup**

**For Students/Free:**
- Frontend: **Vercel** (free, unlimited)
- Backend: **Render** (free tier, 750 hrs/month)

**For Production:**
- Full Stack: **Railway** ($5/month, easiest)
- Or: **Google Cloud Run** (pay-per-use, scales to zero)

**For Enterprise:**
- **AWS ECS** or **Google Cloud Run** (full control, scalable)

---

## 🐛 **Common Issues**

### **CORS Errors**
```env
# Backend .env
ALLOWED_ORIGINS=https://your-frontend-url.com,http://localhost:3001
```

### **API Not Connecting**
- Check `VITE_API_URL` in frontend
- Ensure backend is deployed and running
- Check backend logs for errors

### **Build Failures**
```bash
# Test build locally first
docker-compose build
docker-compose up
```

### **Environment Variables Not Working**
- Restart service after adding variables
- Check variable names (case-sensitive)
- Verify values are set correctly

---

## 📝 **Post-Deployment**

### **1. Test All Features**
- ✅ Glasses try-on
- ✅ Makeup application
- ✅ Clothing try-on (with Replicate API)

### **2. Monitor Usage**
- Check Replicate API usage: https://replicate.com/account
- Monitor platform costs
- Set up alerts for errors

### **3. Set Up Custom Domain** (Optional)
- Railway: Settings → Domains → Add custom domain
- Render: Settings → Custom Domain
- Cloud Run: Cloud Console → Domain mappings

### **4. Enable Analytics** (Optional)
- Google Analytics
- Vercel Analytics
- Custom logging

---

## 🚀 **Quick Deploy Script**

Create `deploy.sh`:
```bash
#!/bin/bash

echo "🚀 Deploying Aura Virtual Try-On..."

# Build containers
echo "📦 Building containers..."
docker-compose build

# Test locally
echo "🧪 Testing locally..."
docker-compose up -d
sleep 10
curl http://localhost:8000/api/health
docker-compose down

# Push to GitHub
echo "📤 Pushing to GitHub..."
git add .
git commit -m "Deploy: $(date)"
git push origin main

echo "✅ Pushed to GitHub! Deploy on Railway/Render now."
```

Make executable:
```bash
chmod +x deploy.sh
./deploy.sh
```

---

## 📚 **Additional Resources**

- [Railway Docs](https://docs.railway.app/)
- [Render Docs](https://render.com/docs)
- [Cloud Run Docs](https://cloud.google.com/run/docs)
- [Docker Compose Docs](https://docs.docker.com/compose/)

---

**Ready to deploy!** Choose your platform and follow the guide above. 🎉
