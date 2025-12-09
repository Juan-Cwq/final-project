# Virtual Try-On Setup Guide

## ⚠️ Important: Google AI Studio API Key

The API key you provided (`AIzaSyACcvP4u-fNzBStxNt8YEq5E6nPyvXtcCw`) is for **Google Gemini AI** (text/chat models), **NOT** for virtual try-on.

Virtual clothing try-on requires **computer vision models**, not language models.

## 🎯 Correct API Options for Virtual Try-On

### **Option 1: Replicate API (Recommended)**

1. **Sign up**: https://replicate.com/
2. **Get API Token**: https://replicate.com/account/api-tokens
3. **Add to `.env`**:
   ```bash
   REPLICATE_API_TOKEN=r8_your_token_here
   ```

**Models Available:**
- `yisol/idm-vton` - High-quality virtual try-on
- Free tier: $0.00155 per prediction (~$1.55 per 1000 images)

### **Option 2: Hugging Face Inference API**

1. **Sign up**: https://huggingface.co/join
2. **Get Token**: https://huggingface.co/settings/tokens
3. **Add to `.env`**:
   ```bash
   HUGGINGFACE_API_TOKEN=hf_your_token_here
   ```

**Models Available:**
- `yisol/IDM-VTON` - Same model as Replicate
- Free tier available with rate limits

### **Option 3: Local Processing (No API Key Needed)**

Run models locally (requires powerful GPU):
```bash
# Install dependencies
pip install torch torchvision diffusers transformers

# Download model
# Requires ~10GB disk space and GPU with 8GB+ VRAM
```

## 📦 Installation Steps

### **Backend Setup:**

1. **Install Python dependencies:**
   ```bash
   cd backend
   pip install replicate pillow requests
   ```

2. **Create `.env` file:**
   ```bash
   cp .env.example .env
   ```

3. **Add your API token:**
   ```bash
   # Edit .env file
   REPLICATE_API_TOKEN=your_actual_token_here
   ```

4. **Restart backend:**
   ```bash
   python main.py
   ```

### **Frontend Setup:**

Already configured! Just make sure backend is running.

## 🧪 Testing

1. **Check API health:**
   ```bash
   curl http://localhost:8000/api/tryon/health
   ```

2. **Test virtual try-on:**
   - Go to http://localhost:3001
   - Click "Clothing" category
   - Upload your photo
   - Select a jacket
   - Click "Try On Jacket"

## 💰 Cost Comparison

| Service | Free Tier | Cost per Image | Quality |
|---------|-----------|----------------|---------|
| Replicate | $5 credit | ~$0.00155 | ⭐⭐⭐⭐⭐ |
| Hugging Face | Limited | Free (slow) | ⭐⭐⭐⭐ |
| Local GPU | Free | $0 | ⭐⭐⭐⭐⭐ |
| Demo Mode | Free | $0 | ⭐ (no AI) |

## 🚀 Quick Start (Demo Mode)

Don't have an API key yet? The app works in **demo mode**:

1. Upload your photo
2. Select a jacket
3. Click "Try On"
4. See a simple overlay (not AI-powered)

## 📝 Notes

- **Google AI Studio** keys work for Gemini chat/text AI
- **Virtual try-on** needs computer vision models
- **Replicate** is easiest to set up
- **Demo mode** works without any API key

## 🔗 Useful Links

- Replicate: https://replicate.com/
- Hugging Face: https://huggingface.co/
- IDM-VTON Model: https://github.com/yisol/IDM-VTON
- API Docs: http://localhost:8000/api/docs
