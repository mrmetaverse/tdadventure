# Topdown Adventure (TDAdventure)

A **top-down 2D MMORPG** built with **Three.js**, **Next.js**, and **Vercel**. Inspired by Diablo II and EverQuest, featuring real-time multiplayer gameplay, persistent worlds, and scalable architecture.

![Topdown Adventure](https://img.shields.io/badge/Status-In%20Development-yellow)
![Next.js](https://img.shields.io/badge/Next.js-14-black)
![Three.js](https://img.shields.io/badge/Three.js-0.159-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)

## 🎮 Features

### Core Gameplay
- **Top-down 2D perspective** with smooth camera controls
- **WASD movement** with mouse interaction
- **Real-time multiplayer** via WebSocket connections
- **Persistent world** with dynamic zone loading
- **Entity system** supporting players, NPCs, and enemies
- **Combat system** with health, mana, and experience
- **Inventory and equipment** system (coming soon)

### Technical Features
- **Three.js** rendering with orthographic camera
- **Modular architecture** with ECS-inspired design
- **Collision detection** system
- **Dynamic chunk loading** for performance
- **WebSocket client** for multiplayer sync
- **Zustand** for state management
- **TailwindCSS** for UI styling

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Git

### Installation

1. Clone the repository:
```bash
git clone https://github.com/YOUR_USERNAME/tdadventure.git
cd tdadventure
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

### Building for Production

```bash
npm run build
npm start
```

## 🎯 Controls

- **WASD** - Move character
- **Mouse** - Look/Attack direction
- **Enter** - Open chat
- **I** - Inventory (coming soon)
- **M** - Map (coming soon)

## 🏗️ Architecture

### Project Structure

```
tdadventure/
├── src/
│   ├── components/
│   │   ├── game/          # Game UI components
│   │   │   ├── GameCanvas.tsx
│   │   │   ├── GameUI.tsx
│   │   │   ├── PlayerHUD.tsx
│   │   │   ├── Minimap.tsx
│   │   │   └── Chat.tsx
│   │   └── ui/            # Menu components
│   │       ├── MainMenu.tsx
│   │       └── LoginForm.tsx
│   ├── game/
│   │   ├── core/          # Core game systems
│   │   │   ├── GameEngine.ts
│   │   │   ├── GameLoop.ts
│   │   │   ├── SceneManager.ts
│   │   │   └── World.ts
│   │   ├── entities/      # Game entities
│   │   │   ├── Player.ts
│   │   │   ├── Enemy.ts
│   │   │   └── NPC.ts
│   │   ├── systems/       # Game systems
│   │   │   ├── InputSystem.ts
│   │   │   ├── MovementSystem.ts
│   │   │   └── CollisionSystem.ts
│   │   ├── network/       # Network client
│   │   │   └── NetworkClient.ts
│   │   └── utils/         # Utilities
│   │       ├── Constants.ts
│   │       └── Vector2.ts
│   ├── pages/             # Next.js pages
│   │   ├── index.tsx      # Main menu
│   │   ├── game.tsx        # Game page
│   │   └── api/           # API routes
│   ├── store/             # State management
│   │   └── gameStore.ts
│   ├── types/             # TypeScript types
│   │   ├── game.ts
│   │   └── player.ts
│   └── styles/            # Global styles
│       └── globals.css
└── package.json
```

### Key Systems

#### Game Engine
The `GameEngine` class orchestrates all game systems:
- Scene management (Three.js)
- World generation and loading
- Entity management
- Input handling
- Network synchronization
- Game loop

#### Entity System
Entities (Player, Enemy, NPC) are managed through a unified interface:
- Position and movement
- Health and stats
- Rendering meshes
- Serialization for networking

#### Network Client
WebSocket-based client for multiplayer:
- Player position sync
- Entity updates
- Chat messages
- Automatic reconnection

## 🌐 Multiplayer Setup

For multiplayer functionality, you'll need to set up a WebSocket server. The client is configured to connect to:

```
ws://localhost:3001 (development)
```

### WebSocket Server Options

1. **Socket.io** - Recommended for ease of use
2. **ws library** - Lightweight WebSocket server
3. **Vercel Edge Functions** - Serverless WebSocket support

Example server setup (separate repository recommended):
```javascript
// websocket-server/index.js
const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 3001 });

wss.on('connection', (ws) => {
  ws.on('message', (message) => {
    // Broadcast to all clients
    wss.clients.forEach((client) => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  });
});
```

## 🎨 Customization

### World Generation
Edit `src/game/core/World.ts` to customize:
- Tile types and colors
- Zone sizes
- Spawn points
- Terrain generation

### Game Constants
Modify `src/game/utils/Constants.ts` for:
- Player speed
- World size
- Camera settings
- Network configuration

### UI Styling
TailwindCSS configuration in `tailwind.config.js`:
- Color scheme
- Fonts
- Component styles

## 🚧 Roadmap

### Phase 1 (Current)
- [x] Core game engine
- [x] Player movement and rendering
- [x] World generation
- [x] Basic UI (HUD, minimap, chat)
- [x] WebSocket client

### Phase 2 (Next)
- [ ] WebSocket server implementation
- [ ] Inventory system
- [ ] Equipment system
- [ ] Quest system
- [ ] Combat mechanics

### Phase 3 (Future)
- [ ] Guild system
- [ ] PvP arenas
- [ ] Dungeon instances
- [ ] Crafting system
- [ ] Trading system

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Inspired by Diablo II and EverQuest
- Built with [Three.js](https://threejs.org/)
- Powered by [Next.js](https://nextjs.org/)
- Deployed on [Vercel](https://vercel.com/)

## 📧 Contact

For questions or suggestions, please open an issue on GitHub.

---

**Happy Adventuring!** 🎮⚔️🛡️
