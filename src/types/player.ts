import { Player, Vector2, InventoryItem } from './game';

export interface PlayerData {
  id: string;
  name: string;
  position: Vector2;
  level: number;
  experience: number;
  health: number;
  maxHealth: number;
  mana: number;
  maxMana: number;
  inventory: InventoryItem[];
  zoneId: string;
}

export interface PlayerInput {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  attack: boolean;
  interact: boolean;
}

export interface PlayerAction {
  type: 'move' | 'attack' | 'interact' | 'use_item' | 'equip' | 'unequip';
  data?: any;
  timestamp: number;
}

export type { Player };
