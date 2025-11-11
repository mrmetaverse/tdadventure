# Deployment Guide

## Quick Deploy to Vercel

### Option 1: Deploy via Vercel CLI (Recommended)

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Login to Vercel:
```bash
vercel login
```

3. Deploy:
```bash
cd tdadventure
vercel
```

4. Follow the prompts and your game will be live!

### Option 2: Deploy via GitHub Integration

1. Push your code to GitHub (already done)
2. Go to https://vercel.com
3. Import your repository
4. Vercel will auto-detect Next.js and deploy

## WebSocket Server Setup

For real-time multiplayer, you need a WebSocket server. Vercel doesn't support persistent WebSocket connections, so you have two options:

### Option A: Separate WebSocket Server (Recommended for Production)

Deploy the WebSocket server separately:

**Railway (Recommended):**
1. Go to https://railway.app
2. Create new project
3. Connect your GitHub repo
4. Add a new service
5. Set root directory to `server/`
6. Set start command: `node index.js`
7. Set PORT environment variable
8. Deploy!

**Render:**
1. Go to https://render.com
2. Create new Web Service
3. Connect your repo
4. Set build command: (none)
5. Set start command: `node server/index.js`
6. Deploy!

**Fly.io:**
1. Install flyctl: `curl -L https://fly.io/install.sh | sh`
2. Run: `fly launch` in the server directory
3. Deploy: `fly deploy`

### Option B: Use Vercel Edge Functions with Polling (Simpler, but less efficient)

The game will use HTTP polling instead of WebSockets. This works but has higher latency.

## Environment Variables

Set these in Vercel dashboard (Settings → Environment Variables):

- `REPLICATE_API_KEY` - For AI sprite generation (optional)
- `NEXT_PUBLIC_WS_URL` - WebSocket server URL (if using separate server)
  - Example: `wss://your-game-server.railway.app` or `ws://localhost:3001` for local

## Post-Deployment

1. Update `NEXT_PUBLIC_WS_URL` in Vercel to point to your WebSocket server
2. Your game will be publicly accessible!
3. Share the Vercel URL with players

## Local Development

Run both frontend and WebSocket server:

```bash
# Install concurrently (optional, for running both)
npm install -g concurrently

# Run both servers
npm run dev:all

# Or run separately:
# Terminal 1:
npm run dev

# Terminal 2:
npm run dev:server
```

## Production URLs

After deployment:
- **Frontend (Vercel):** `https://your-project.vercel.app`
- **WebSocket Server:** `wss://your-server.railway.app` (or similar)

Update the frontend's `NEXT_PUBLIC_WS_URL` to match your WebSocket server URL.

