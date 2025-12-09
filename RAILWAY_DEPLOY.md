# 🚂 Railway Deployment Guide

## ⚡ Quick Deploy (Easiest Method)

### **Step 1: Push to GitHub**

```bash
git add .
git commit -m "Add Railway deployment config"
git push origin main
```

### **Step 2: Deploy Backend on Railway**

1. Go to https://railway.app and sign in with GitHub
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Choose **`Juan-Cwq/final-project`**
5. Railway will ask which service to deploy
6. Click **"Add variables"** and set:
   ```
   REPLICATE_API_TOKEN=r8_your_token_here
   PORT=8000
   ```
7. In **Settings**:
   - Root Directory: `backend`
   - Build Command: (leave empty, uses Dockerfile)
   - Start Command: `python main.py`
8. Click **"Deploy"**
9. Once deployed, click **"Generate Domain"** to get your backend URL
   - Example: `https://aura-backend-production.up.railway.app`

### **Step 3: Deploy Frontend on Railway**

1. In the same Railway project, click **"New Service"**
2. Select **"GitHub Repo"** → Same repo
3. Click **"Add variables"** and set:
   ```
   VITE_API_URL=https://your-backend-url.up.railway.app
   ```
   (Use the backend URL from Step 2)
4. In **Settings**:
   - Root Directory: `frontend`
   - Build Command: (leave empty, uses Dockerfile)
   - Start Command: `serve -s dist -l 3001`
5. Click **"Deploy"**
6. Once deployed, click **"Generate Domain"** to get your frontend URL
   - Example: `https://aura-frontend-production.up.railway.app`

### **Step 4: Update Backend CORS**

1. Go back to **Backend service** in Railway
2. Click **"Variables"**
3. Add new variable:
   ```
   ALLOWED_ORIGINS=https://your-frontend-url.up.railway.app
   ```
4. Backend will automatically redeploy

### **Step 5: Test Your App! 🎉**

Open your frontend URL and test:
- ✅ Glasses try-on
- ✅ Makeup application  
- ✅ Clothing try-on

---

## 🐛 Troubleshooting

### **"Script start.sh not found"**
✅ Fixed! The `railway.toml` files tell Railway to use Dockerfile

### **Build fails**
- Check Railway logs in the deployment tab
- Ensure Dockerfile exists in backend/frontend folders
- Verify all dependencies are in requirements.txt/package.json

### **CORS errors**
- Make sure `ALLOWED_ORIGINS` in backend includes your frontend URL
- Format: `https://your-frontend.up.railway.app` (no trailing slash)

### **API not connecting**
- Verify `VITE_API_URL` in frontend matches backend URL exactly
- Check backend is deployed and running (green status)
- Test backend health: `https://your-backend-url.up.railway.app/api/health`

---

## 💰 Pricing

- **Free Trial**: $5 credit (enough for ~1 month)
- **After Trial**: ~$5-10/month depending on usage
- **Hobby Plan**: $5/month for 500 hours

---

## 🎯 Alternative: Deploy with Railway CLI

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Link to project
railway link

# Deploy backend
cd backend
railway up

# Deploy frontend (in new terminal)
cd frontend
railway up
```

---

## ✅ Deployment Checklist

- [ ] Code pushed to GitHub
- [ ] Backend deployed on Railway
- [ ] Backend domain generated
- [ ] Frontend deployed on Railway
- [ ] Frontend `VITE_API_URL` set to backend URL
- [ ] Backend `ALLOWED_ORIGINS` includes frontend URL
- [ ] Backend `REPLICATE_API_TOKEN` set
- [ ] All services showing "Active" status
- [ ] Tested all features (glasses, makeup, clothing)

---

**Your app is now live! 🚀**

Share your frontend URL with anyone to try your virtual try-on platform!
