import type { NextApiRequest, NextApiResponse } from 'next';

// In-memory game state (for single server instance)
// In production, use Redis or a database
const gameState = {
  players: new Map(),
  entities: new Map(),
  lastUpdate: Date.now(),
};

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    // Return current game state
    res.status(200).json({
      players: Array.from(gameState.players.values()),
      entities: Array.from(gameState.entities.values()),
      timestamp: Date.now(),
    });
  } else if (req.method === 'POST') {
    // Update game state
    const { type, data, playerId } = req.body;

    switch (type) {
      case 'player_update':
        if (playerId && data.position) {
          gameState.players.set(playerId, {
            id: playerId,
            position: data.position,
            velocity: data.velocity,
            rotation: data.rotation,
            lastUpdate: Date.now(),
          });
        }
        break;
      case 'entity_update':
        if (data.id) {
          gameState.entities.set(data.id, data);
        }
        break;
    }

    res.status(200).json({ success: true });
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
