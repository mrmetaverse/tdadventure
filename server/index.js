// WebSocket server for multiplayer
// This can be deployed separately on Railway, Render, Fly.io, or similar
// For Vercel, we'll use Edge Functions with polling as fallback

const WebSocket = require('ws');
const http = require('http');

class GameServer {
  constructor(port = 3001) {
    this.port = port;
    this.server = http.createServer();
    this.wss = new WebSocket.Server({ server: this.server });
    this.players = new Map();
    this.entities = new Map();
    this.rooms = new Map(); // Zone-based rooms
    
    this.setupWebSocket();
  }

  setupWebSocket() {
    this.wss.on('connection', (ws, req) => {
      const playerId = this.generatePlayerId();
      console.log(`Player ${playerId} connected from ${req.socket.remoteAddress}`);

      ws.playerId = playerId;
      this.players.set(playerId, {
        id: playerId,
        ws,
        position: { x: 0, y: 0 },
        character: null,
        lastUpdate: Date.now(),
      });

      // Send welcome message
      ws.send(JSON.stringify({
        type: 'connected',
        playerId,
        data: { message: 'Welcome to Topdown Adventure!' },
      }));

      // Broadcast new player to others
      this.broadcastToOthers(playerId, {
        type: 'player_joined',
        data: { playerId },
      });

      // Send current world state
      this.sendWorldState(ws);

      ws.on('message', (message) => {
        try {
          const data = JSON.parse(message.toString());
          this.handleMessage(playerId, data);
        } catch (error) {
          console.error('Error parsing message:', error);
        }
      });

      ws.on('close', () => {
        console.log(`Player ${playerId} disconnected`);
        this.handleDisconnect(playerId);
      });

      ws.on('error', (error) => {
        console.error(`WebSocket error for player ${playerId}:`, error);
      });
    });
  }

  generatePlayerId() {
    return `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  handleMessage(playerId, message) {
    const player = this.players.get(playerId);
    if (!player) return;

    switch (message.type) {
      case 'player_move':
        this.handlePlayerMove(playerId, message.data);
        break;
      case 'player_attack':
        this.handlePlayerAttack(playerId, message.data);
        break;
      case 'chat':
        this.handleChat(playerId, message.data);
        break;
      case 'character_created':
        this.handleCharacterCreated(playerId, message.data);
        break;
      case 'ping':
        player.ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
        break;
      default:
        console.log('Unknown message type:', message.type);
    }
  }

  handlePlayerMove(playerId, data) {
    const player = this.players.get(playerId);
    if (!player) return;

    player.position = data.position;
    player.lastUpdate = Date.now();

    // Broadcast to other players
    this.broadcastToOthers(playerId, {
      type: 'player_update',
      playerId,
      data: {
        position: data.position,
        velocity: data.velocity,
        rotation: data.rotation,
      },
    });
  }

  handlePlayerAttack(playerId, data) {
    // Broadcast attack to nearby players
    this.broadcastToOthers(playerId, {
      type: 'player_attack',
      playerId,
      data,
    });
  }

  handleChat(playerId, data) {
    const player = this.players.get(playerId);
    if (!player) return;

    // Broadcast chat to all players
    this.broadcast({
      type: 'chat',
      data: {
        player: player.character?.name || `Player ${playerId}`,
        message: data.message,
        timestamp: Date.now(),
      },
    });
  }

  handleCharacterCreated(playerId, data) {
    const player = this.players.get(playerId);
    if (!player) return;

    player.character = data.character;

    // Broadcast character creation
    this.broadcastToOthers(playerId, {
      type: 'character_created',
      playerId,
      data: { character: data.character },
    });
  }

  handleDisconnect(playerId) {
    this.players.delete(playerId);
    
    // Broadcast player left
    this.broadcast({
      type: 'player_left',
      data: { playerId },
    });
  }

  sendWorldState(ws) {
    // Send all current players
    const players = Array.from(this.players.values()).map(p => ({
      id: p.id,
      position: p.position,
      character: p.character,
    }));

    ws.send(JSON.stringify({
      type: 'world_state',
      data: { players },
    }));
  }

  broadcast(message) {
    const data = JSON.stringify(message);
    this.players.forEach((player) => {
      if (player.ws.readyState === WebSocket.OPEN) {
        player.ws.send(data);
      }
    });
  }

  broadcastToOthers(excludePlayerId, message) {
    const data = JSON.stringify(message);
    this.players.forEach((player, playerId) => {
      if (playerId !== excludePlayerId && player.ws.readyState === WebSocket.OPEN) {
        player.ws.send(data);
      }
    });
  }

  start() {
    this.server.listen(this.port, () => {
      console.log(`Game server running on port ${this.port}`);
      console.log(`WebSocket server ready at ws://localhost:${this.port}`);
    });
  }

  stop() {
    this.wss.close();
    this.server.close();
  }
}

// Start server if run directly
if (require.main === module) {
  const port = process.env.PORT || 3001;
  const server = new GameServer(port);
  server.start();

  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    server.stop();
    process.exit(0);
  });
}

module.exports = GameServer;

