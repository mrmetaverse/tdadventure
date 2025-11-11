# Topdown Adventure (TDAdventure)

A **top-down 2D MMORPG** built with **Three.js**, **Next.js**, and **Vercel**. Inspired by Diablo II and EverQuest, featuring real-time multiplayer gameplay, persistent worlds, and scalable architecture.

![Topdown Adventure](https://img.shields.io/badge/Status-In%20Development-yellow)
![Next.js](https://img.shields.io/badge/Next.js-14-black)
![Three.js](https://img.shields.io/badge/Three.js-0.159-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)

## 🎮 Features

### Core Gameplay
- **Top-down 2D perspective** with smooth camera controls
- **WASD movement** with mouse click to attack
- **Real-time multiplayer** via WebSocket connections
- **Persistent world** with dynamic zone loading
- **Entity system** supporting players, NPCs, and enemies
- **Combat system** with health, mana, and experience
- **AI-generated character sprites** based on class, race, divine, and equipment
- **Dynamic sprite regeneration** when equipping new items
- **Inventory and equipment** system with drag-and-drop
- **Character creation** with 5 classes, 3 races, 9 divines, and 9 alignment options
- **Formless player state** - join immediately as a ball of light, create character in-game

### Technical Features
- **Three.js** rendering with orthographic camera
- **Modular architecture** with ECS-inspired design
- **Collision detection** system
- **Dynamic chunk loading** for performance
- **WebSocket client** for multiplayer sync
- **Zustand** for state management
- **TailwindCSS** for UI styling

## 🚀 Quick Start

### Deploy to Vercel (Recommended)

1. **Install Vercel CLI:**
```bash
npm i -g vercel
```

2. **Login and Deploy:**
```bash
cd tdadventure
vercel login
vercel
```

3. **Set Environment Variables in Vercel Dashboard:**
   - Go to your project settings
   - Add `REPLICATE_API_KEY` (optional, for AI sprites)
   - Add `NEXT_PUBLIC_WS_URL` (WebSocket server URL - see below)

4. **Deploy WebSocket Server:**
   - See [DEPLOYMENT.md](./DEPLOYMENT.md) for options
   - Recommended: Deploy to Railway, Render, or Fly.io
   - Update `NEXT_PUBLIC_WS_URL` in Vercel to point to your server

### Local Development

1. **Clone and Install:**
```bash
git clone https://github.com/mrmetaverse/tdadventure.git
cd tdadventure
npm install
```

2. **Run Development Servers:**
```bash
# Terminal 1: Frontend
npm run dev

# Terminal 2: WebSocket Server
npm run dev:server

# Or both together:
npm run dev:all
```

3. **Open:** http://localhost:3000

## 🌐 Deployment Architecture

### Frontend (Vercel)
- Next.js application
- Static assets and API routes
- Publicly accessible

### WebSocket Server (Separate)
- Real-time multiplayer server
- Deploy to Railway, Render, or Fly.io
- Handles player connections and game state sync

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

## 🎯 Controls

- **WASD** - Move character
- **Mouse Click** - Attack enemies
- **Enter** - Open chat
- **I** - Open/close inventory
- **C** - Create character (when formless)
- **ESC** - Close menus

## 🏗️ Architecture

### Project Structure

```
tdadventure/
├── src/
│   ├── components/        # React components
│   ├── game/             # Game engine
│   │   ├── core/         # Core systems
│   │   ├── entities/     # Game entities
│   │   ├── systems/      # Game systems
│   │   └── network/      # Network client
│   ├── pages/            # Next.js pages
│   ├── services/         # Services (sprite generation)
│   ├── store/            # State management
│   └── types/            # TypeScript types
├── server/               # WebSocket server
└── public/               # Static assets
```

## 🎨 AI Sprite Generation

The game uses AI to generate character sprites based on:
- **Class** (Assassin, Necromancer, Cleric, Wizard, Warrior)
- **Race** (Human, Elf, Demon)
- **Divine** (Knowledge, Passion, Fire, Healing, Chaos, Hunt, Lightning, Poison, Water)
- **Equipment** (weapons, armor, accessories)

Sprites are automatically regenerated when you equip new items. For example, equipping a "Sword of Fire" will regenerate sprites showing the character with a flaming sword.

**Setup:**
1. Get a Replicate API key from https://replicate.com
2. Add `REPLICATE_API_KEY=your_key` to `.env.local` (local) or Vercel environment variables (production)
3. Sprites will be generated automatically when characters are created

**Without API Key:**
The game will use placeholder sprites (colored squares) that still function correctly.

## 📝 License

MIT License - see LICENSE file for details.

## 🙏 Acknowledgments

- Inspired by Diablo II and EverQuest
- Built with [Three.js](https://threejs.org/)
- Powered by [Next.js](https://nextjs.org/)
- Deployed on [Vercel](https://vercel.com/)

---

**Happy Adventuring!** 🎮⚔️🛡️
