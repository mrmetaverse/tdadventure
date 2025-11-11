import { TileData } from '../../types/game';

// Game Constants
export const GAME_CONFIG = {
  TILE_SIZE: 1,
  PLAYER_SIZE: 0.8,
  PLAYER_SPEED: 3, // Reduced for better control
  ENEMY_SIZE: 0.9,
  NPC_SIZE: 0.9,
  CAMERA_HEIGHT: 20,
  CAMERA_FOV: 75,
  WORLD_SIZE: { x: 100, y: 100 },
  CHUNK_SIZE: 20,
  RENDER_DISTANCE: 3, // chunks
  TARGET_FPS: 60,
  NETWORK_UPDATE_RATE: 20, // updates per second
};

// Tile Types
export const TILE_TYPES: Record<number, TileData> = {
  0: { id: 0, type: 'grass', walkable: true, color: '#4a7c59' },
  1: { id: 1, type: 'dirt', walkable: true, color: '#8b7355' },
  2: { id: 2, type: 'stone', walkable: true, color: '#6b7280' },
  3: { id: 3, type: 'water', walkable: false, color: '#3b82f6' },
  4: { id: 4, type: 'wall', walkable: false, color: '#374151' },
};

// Colors
export const COLORS = {
  PLAYER: 0x3b82f6,
  PLAYER_LOCAL: 0x10b981,
  ENEMY: 0xef4444,
  NPC: 0xfbbf24,
  HEALTH_BAR_BG: 0x1f2937,
  HEALTH_BAR_FG: 0xdc2626,
  MANA_BAR_FG: 0x3b82f6,
  XP_BAR_FG: 0xfbbf24,
};

// Network
export const NETWORK = {
  WS_URL: process.env.NEXT_PUBLIC_WS_URL || 
    (typeof window !== 'undefined' 
      ? `ws://${window.location.hostname}:3001` 
      : 'ws://localhost:3001'),
  RECONNECT_INTERVAL: 3000,
  PING_INTERVAL: 5000,
  USE_POLLING: process.env.NEXT_PUBLIC_USE_POLLING === 'true', // Fallback to polling if WebSocket unavailable
};

// Input
export const INPUT_KEYS = {
  FORWARD: ['w', 'W', 'ArrowUp'],
  BACKWARD: ['s', 'S', 'ArrowDown'],
  LEFT: ['a', 'A', 'ArrowLeft'],
  RIGHT: ['d', 'D', 'ArrowRight'],
  ATTACK: [' ', 'Space'],
  INTERACT: ['e', 'E'],
  INVENTORY: ['i', 'I'],
  MAP: ['m', 'M'],
  CHAT: ['Enter'],
};

// Experience curve
export function getExperienceForLevel(level: number): number {
  return Math.floor(100 * Math.pow(level, 1.5));
}

// Rarity colors
export const RARITY_COLORS = {
  common: '#9ca3af',
  uncommon: '#22c55e',
  rare: '#3b82f6',
  epic: '#a855f7',
  legendary: '#f59e0b',
};
