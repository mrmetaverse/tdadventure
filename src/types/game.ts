import * as THREE from 'three';

export interface Vector2 {
  x: number;
  y: number;
}

export type EntityType = 'player' | 'npc' | 'enemy' | 'item' | 'projectile';

export interface Entity {
  id: string;
  type: EntityType;
  position: Vector2;
  velocity: Vector2;
  rotation: number;
  health: number;
  maxHealth: number;
  mesh?: THREE.Mesh | THREE.Group;
  speed: number;
  size: number;
}

export interface Player extends Entity {
  type: 'player';
  name: string;
  level: number;
  experience: number;
  experienceToLevel: number;
  mana: number;
  maxMana: number;
  inventory: InventoryItem[];
  equipment: Equipment;
  stats: PlayerStats;
  isLocal: boolean;
  class?: string;
  race?: string;
  divine?: string;
  alignment?: any;
  isFormless?: boolean;
}

export interface PlayerStats {
  strength: number;
  dexterity: number;
  intelligence: number;
  vitality: number;
  attackDamage: number;
  defense: number;
  critChance: number;
  critDamage: number;
}

export interface Equipment {
  weapon?: InventoryItem;
  armor?: InventoryItem;
  helmet?: InventoryItem;
  boots?: InventoryItem;
  accessory1?: InventoryItem;
  accessory2?: InventoryItem;
}

export interface InventoryItem {
  id: string;
  name: string;
  type: 'weapon' | 'armor' | 'consumable' | 'quest' | 'material';
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  icon?: string;
  stats?: Partial<PlayerStats>;
  quantity: number;
}

export interface NPC extends Entity {
  type: 'npc';
  name: string;
  dialogue: string[];
  questId?: string;
}

export interface Enemy extends Entity {
  type: 'enemy';
  name: string;
  level: number;
  damage: number;
  experienceReward: number;
  lootTable: string[];
  aiState: 'idle' | 'patrol' | 'chase' | 'attack' | 'flee';
  targetId?: string;
}

export interface GameState {
  isRunning: boolean;
  isPaused: boolean;
  currentZone: string;
  entities: Map<string, Entity>;
  localPlayer?: Player;
  camera: {
    position: Vector2;
    zoom: number;
    target?: string;
  };
  worldSize: Vector2;
  time: number;
  deltaTime: number;
}

export interface TileData {
  id: number;
  type: 'grass' | 'dirt' | 'stone' | 'water' | 'wall';
  walkable: boolean;
  color: string;
}

export interface Zone {
  id: string;
  name: string;
  size: Vector2;
  tiles: number[][];
  spawnPoints: Vector2[];
  npcs: NPC[];
  enemies: Enemy[];
}

export interface NetworkMessage {
  type: 'player_move' | 'player_attack' | 'player_update' | 'entity_update' | 'entity_spawn' | 'entity_despawn' | 'chat' | 'zone_change' | 'ping' | 'pong' | 'connected' | 'world_state' | 'player_joined' | 'player_left' | 'character_created';
  data: any;
  timestamp: number;
  playerId?: string;
}

export interface InputState {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  mousePosition: Vector2;
  mouseDown: boolean;
  keys: Set<string>;
}
