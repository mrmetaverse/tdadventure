import { DivineData } from '@types/character';
import { Divine } from '@types/character';

export const DIVINES: Record<string, DivineData> = {
  knowledge: {
    id: 'knowledge',
    name: 'Knowledge',
    description: 'The pursuit of wisdom and understanding. Favors those who seek truth.',
    alignment: {
      preferredLawfulChaotic: 'lawful',
      preferredGoodEvil: 'neutral',
    },
    bonuses: {
      intelligence: 5,
    },
  },
  passion: {
    id: 'passion',
    name: 'Passion',
    description: 'The fire of emotion and desire. Embraces all who feel deeply.',
    alignment: {
      preferredLawfulChaotic: 'chaotic',
      preferredGoodEvil: 'neutral',
    },
    bonuses: {
      dexterity: 3,
      intelligence: 2,
    },
  },
  fire: {
    id: 'fire',
    name: 'Fire',
    description: 'The destructive and creative force of flame. Burns away the old.',
    alignment: {
      preferredLawfulChaotic: 'chaotic',
      preferredGoodEvil: 'evil',
    },
    bonuses: {
      strength: 3,
      attackDamage: 5,
    },
  },
  healing: {
    id: 'healing',
    name: 'Healing',
    description: 'The restorative power of life. Protects and nurtures all beings.',
    alignment: {
      preferredLawfulChaotic: 'lawful',
      preferredGoodEvil: 'good',
    },
    bonuses: {
      vitality: 5,
      defense: 3,
    },
  },
  chaos: {
    id: 'chaos',
    name: 'Chaos',
    description: 'The unpredictable force of disorder. Embraces randomness and change.',
    alignment: {
      preferredLawfulChaotic: 'chaotic',
      preferredGoodEvil: 'neutral',
    },
    bonuses: {
      critChance: 0.10,
      critDamage: 0.3,
    },
  },
  hunt: {
    id: 'hunt',
    name: 'Hunt / Earth',
    description: 'The primal connection to nature and the hunt. Values balance and survival.',
    alignment: {
      preferredLawfulChaotic: 'neutral',
      preferredGoodEvil: 'neutral',
    },
    bonuses: {
      dexterity: 3,
      vitality: 2,
    },
  },
  lightning: {
    id: 'lightning',
    name: 'Lightning',
    description: 'The swift and powerful strike. Represents speed and sudden change.',
    alignment: {
      preferredLawfulChaotic: 'neutral',
      preferredGoodEvil: 'neutral',
    },
    bonuses: {
      dexterity: 4,
      attackDamage: 3,
    },
  },
  poison: {
    id: 'poison',
    name: 'Poison',
    description: 'The slow and insidious corruption. Weakens enemies over time.',
    alignment: {
      preferredLawfulChaotic: 'neutral',
      preferredGoodEvil: 'evil',
    },
    bonuses: {
      intelligence: 3,
      critChance: 0.05,
    },
  },
  water: {
    id: 'water',
    name: 'Water / Frost',
    description: 'The adaptable and freezing element. Flows around obstacles and freezes enemies.',
    alignment: {
      preferredLawfulChaotic: 'lawful',
      preferredGoodEvil: 'neutral',
    },
    bonuses: {
      intelligence: 2,
      defense: 3,
    },
  },
};

export function getDivineData(divineId: Divine): DivineData {
  return DIVINES[divineId];
}

