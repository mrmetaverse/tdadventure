import { create } from 'zustand';
import { CharacterData, CharacterCreationData } from '../types/character';
import { v4 as uuidv4 } from 'uuid';

interface CharacterStore {
  characters: CharacterData[];
  selectedCharacterId: string | null;
  createCharacter: (data: CharacterCreationData) => CharacterData;
  deleteCharacter: (id: string) => void;
  selectCharacter: (id: string) => void;
  getSelectedCharacter: () => CharacterData | null;
  updateCharacter: (id: string, updates: Partial<CharacterData>) => void;
}

// Simple localStorage persistence
const STORAGE_KEY = 'tdadventure-characters';

const loadFromStorage = (): CharacterData[] => {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

const saveToStorage = (characters: CharacterData[]) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(characters));
  } catch {
    // Ignore storage errors
  }
};

// Load selected character ID from storage
const loadSelectedId = (): string | null => {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem('tdadventure-selected-character') || null;
  } catch {
    return null;
  }
};

const saveSelectedId = (id: string | null) => {
  if (typeof window === 'undefined') return;
  try {
    if (id) {
      localStorage.setItem('tdadventure-selected-character', id);
    } else {
      localStorage.removeItem('tdadventure-selected-character');
    }
  } catch {
    // Ignore storage errors
  }
};

export const useCharacterStore = create<CharacterStore>((set, get) => ({
      characters: loadFromStorage(),
      selectedCharacterId: loadSelectedId(),

      createCharacter: (data) => {
        const newCharacter: CharacterData = {
          id: uuidv4(),
          name: data.name,
          class: data.class,
          race: data.race,
          divine: data.divine,
          alignment: data.startingAlignment,
          level: 1,
          experience: 0,
          createdAt: Date.now(),
          lastPlayed: Date.now(),
        };

        set((state) => {
          const newCharacters = [...state.characters, newCharacter];
          saveToStorage(newCharacters);
          saveSelectedId(newCharacter.id);
          return {
            characters: newCharacters,
            selectedCharacterId: newCharacter.id,
          };
        });

        return newCharacter;
      },

      deleteCharacter: (id) => {
        set((state) => {
          const newCharacters = state.characters.filter((c) => c.id !== id);
          saveToStorage(newCharacters);
          if (state.selectedCharacterId === id) {
            saveSelectedId(null);
            return {
              characters: newCharacters,
              selectedCharacterId: null,
            };
          }
          return {
            characters: newCharacters,
            selectedCharacterId: state.selectedCharacterId,
          };
        });
      },

      selectCharacter: (id) => {
        set((state) => {
          const character = state.characters.find((c) => c.id === id);
          if (character) {
            const newCharacters = state.characters.map((c) =>
              c.id === id ? { ...c, lastPlayed: Date.now() } : c
            );
            saveToStorage(newCharacters);
            saveSelectedId(id);
            return {
              selectedCharacterId: id,
              characters: newCharacters,
            };
          }
          return state;
        });
      },

      getSelectedCharacter: () => {
        const state = get();
        if (!state.selectedCharacterId) return null;
        return state.characters.find((c) => c.id === state.selectedCharacterId) || null;
      },

      updateCharacter: (id, updates) => {
        set((state) => {
          const newCharacters = state.characters.map((c) =>
            c.id === id ? { ...c, ...updates } : c
          );
          saveToStorage(newCharacters);
          return {
            characters: newCharacters,
          };
        });
      },
    })
);


