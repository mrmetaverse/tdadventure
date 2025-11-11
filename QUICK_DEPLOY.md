# 🚀 Quick Deploy Guide

## Deploy to Vercel (5 minutes)

### Step 1: Deploy Frontend
```bash
cd tdadventure
vercel login
vercel
```

Follow the prompts:
- Set up and deploy? **Yes**
- Which scope? (select your account)
- Link to existing project? **No**
- Project name? **tdadventure** (or press enter)
- Directory? **./** (press enter)
- Override settings? **No**

Your frontend will be live at: `https://tdadventure.vercel.app` (or similar)

### Step 2: Deploy WebSocket Server

**Option A: Railway (Easiest - Free tier available)**

1. Go to https://railway.app
2. Click "New Project"
3. Click "Deploy from GitHub repo"
4. Select your `tdadventure` repository
5. Add a new service:
   - Root Directory: `server`
   - Start Command: `node index.js`
   - Environment Variables:
     - `PORT` = `3001` (or leave default)
6. Deploy!
7. Copy the public URL (e.g., `https://tdadventure-production.up.railway.app`)
8. Convert to WebSocket URL: `wss://tdadventure-production.up.railway.app` (note: `wss://` not `https://`)

**Option B: Render (Free tier available)**

1. Go to https://render.com
2. Click "New +" → "Web Service"
3. Connect your GitHub repo
4. Settings:
   - Name: `tdadventure-server`
   - Root Directory: `server`
   - Build Command: (leave empty)
   - Start Command: `node index.js`
   - Environment: `Node`
5. Deploy!
6. Copy the URL and convert to `wss://` format

**Option C: Fly.io (Free tier available)**

```bash
cd server
fly launch
# Follow prompts
fly deploy
```

### Step 3: Connect Frontend to WebSocket Server

1. Go to your Vercel project dashboard
2. Settings → Environment Variables
3. Add:
   - Key: `NEXT_PUBLIC_WS_URL`
   - Value: `wss://your-server-url.railway.app` (or your server URL)
4. Redeploy (or wait for auto-redeploy)

### Step 4: Optional - AI Sprites

1. Get API key from https://replicate.com
2. In Vercel dashboard → Environment Variables:
   - Key: `REPLICATE_API_KEY`
   - Value: `your-api-key`
3. Redeploy

## ✅ Done!

Your game is now live and publicly accessible! Share the Vercel URL with players.

## Testing Locally

```bash
# Terminal 1: Frontend
npm run dev

# Terminal 2: WebSocket Server
npm run dev:server
```

Visit: http://localhost:3000

## Troubleshooting

**WebSocket connection fails:**
- Check that `NEXT_PUBLIC_WS_URL` is set correctly in Vercel
- Ensure WebSocket server is running and accessible
- Check browser console for connection errors

**Sprites not generating:**
- Check `REPLICATE_API_KEY` is set in Vercel
- Check browser console for API errors
- Game will work with placeholder sprites if API key is missing

**Players not seeing each other:**
- Verify WebSocket server is running
- Check that both players are connected to the same server
- Check server logs for connection errors

