import { create } from 'zustand';
import { Player, Entity } from '@types/game';

interface GameStore {
  player: Player | null;
  entities: Entity[];
  isConnected: boolean;
  setPlayer: (player: Player | null) => void;
  addEntity: (entity: Entity) => void;
  removeEntity: (id: string) => void;
  updateEntity: (id: string, updates: Partial<Entity>) => void;
  setConnected: (connected: boolean) => void;
}

export const useGameStore = create<GameStore>((set) => ({
  player: null,
  entities: [],
  isConnected: false,
  setPlayer: (player) => set({ player }),
  addEntity: (entity) =>
    set((state) => ({
      entities: [...state.entities, entity],
    })),
  removeEntity: (id) =>
    set((state) => ({
      entities: state.entities.filter((e) => e.id !== id),
    })),
  updateEntity: (id, updates) =>
    set((state) => ({
      entities: state.entities.map((e) =>
        e.id === id ? { ...e, ...updates } : e
      ),
    })),
  setConnected: (connected) => set({ isConnected: connected }),
}));

