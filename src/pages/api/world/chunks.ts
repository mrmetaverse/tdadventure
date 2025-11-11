import type { NextApiRequest, NextApiResponse } from 'next';

// In-memory world state (in production, use a database)
// This stores all explored chunks across all players
let worldChunks: Map<string, { chunkX: number; chunkY: number; tiles: number[][] }> = new Map();

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    // Get all explored chunks
    const chunks = Array.from(worldChunks.values());
    res.status(200).json({ chunks });
  } else if (req.method === 'POST') {
    // Update explored chunks (from client exploration)
    const { chunks } = req.body;

    if (Array.isArray(chunks)) {
      chunks.forEach((chunk: { chunkX: number; chunkY: number; tiles: number[][] }) => {
        const key = `${chunk.chunkX},${chunk.chunkY}`;
        worldChunks.set(key, chunk);
      });

      res.status(200).json({ 
        success: true, 
        message: `Updated ${chunks.length} chunks`,
        totalChunks: worldChunks.size 
      });
    } else {
      res.status(400).json({ error: 'Invalid chunks data' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

