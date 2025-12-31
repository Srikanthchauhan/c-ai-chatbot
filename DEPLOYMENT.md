# C ai - Deployment Guide

## 🚀 Deploy to Production (FREE)

### Prerequisites
1. Create accounts (all FREE):
   - [GitHub](https://github.com) - for code repository
   - [Vercel](https://vercel.com) - for frontend hosting
   - [Render](https://render.com) - for backend hosting

### Step 1: Push Code to GitHub

1. **Initialize Git** (if not already done):
```bash
cd c:\Users\srika\OneDrive\Desktop\chatbot
git init
git add .
git commit -m "Initial commit - C ai chatbot"
```

2. **Create GitHub Repository**:
   - Go to https://github.com/new
   - Name: `c-ai-chatbot`
   - Make it **Public** or **Private**
   - Don't initialize with README

3. **Push to GitHub**:
```bash
git remote add origin https://github.com/YOUR_USERNAME/c-ai-chatbot.git
git branch -M main
git push -u origin main
```

---

### Step 2: Deploy Backend to Render

1. **Go to Render Dashboard**: https://dashboard.render.com
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository
4. Select `c-ai-chatbot` repository
5. Configure:
   - **Name**: `c-ai-backend`
   - **Root Directory**: `backend`
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - **Plan**: Free

6. **Add Environment Variables**:
   - Click "Advanced" → "Add Environment Variable"
   - Add:
     - `GROQ_API_KEY` = `your_groq_api_key_here`
     - `TAVILY_API_KEY` = `your_tavily_api_key_here`

7. Click **"Create Web Service"**
8. Wait for deployment (~2-3 minutes)
9. **Copy the URL** (e.g., `https://c-ai-backend.onrender.com`)

---

### Step 3: Deploy Frontend to Vercel

1. **Go to Vercel**: https://vercel.com/new
2. **Import Git Repository**
3. Select `c-ai-chatbot`
4. Configure:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

5. **Add Environment Variables**:
   - Click "Environment Variables"
   - Add:
     - `VITE_API_URL` = `https://c-ai-backend.onrender.com` (your Render backend URL)
     - `VITE_SUPABASE_URL` = `your_supabase_url` (if using auth)
     - `VITE_SUPABASE_ANON_KEY` = `your_supabase_key` (if using auth)

6. Click **"Deploy"**
7. Wait for deployment (~1-2 minutes)
8. Your app is live! 🎉

---

### Step 4: Update CORS (Backend)

After deployment, update backend CORS to allow your Vercel domain:

Edit `backend/main.py`:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://your-app.vercel.app",  # Add your Vercel URL
        "https://*.vercel.app"  # Allow all Vercel preview deployments
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

Commit and push changes - Render will auto-deploy.

---

## 🔧 Alternative: Deploy Both to Vercel

You can also deploy the backend to Vercel using serverless functions:

1. Create `frontend/api/` folder
2. Move backend logic to serverless functions
3. Deploy as a monorepo

---

## 📝 Important Notes

- **Free Tier Limits**:
  - Render: Sleeps after 15 min of inactivity (cold starts ~30s)
  - Vercel: 100 GB bandwidth/month
  - Groq: 30 req/min, 14,400 req/day

- **Custom Domain**: Add your domain in Vercel/Render dashboard
- **HTTPS**: Automatically enabled on both platforms
- **Auto Deploy**: Push to GitHub = automatic deployment

---

## ✅ Your URLs

After deployment:
- Frontend: `https://your-app.vercel.app`
- Backend: `https://c-ai-backend.onrender.com`
- API Health: `https://c-ai-backend.onrender.com/`

---

## 🆘 Troubleshooting

**Backend not responding?**
- Check Render logs in dashboard
- Verify environment variables are set
- First request might be slow (cold start)

**Frontend can't connect to backend?**
- Check `VITE_API_URL` environment variable
- Verify CORS settings in backend
- Check browser console for errors

**Build failed?**
- Check build logs
- Ensure all dependencies in requirements.txt/package.json
- Verify Python/Node versions

---

**Need help?** Check the deployment logs in respective dashboards!
