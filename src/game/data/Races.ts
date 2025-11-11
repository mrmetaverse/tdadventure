import { RaceData } from '@types/character';
import { CharacterRace } from '@types/character';

export const RACES: Record<string, RaceData> = {
  human: {
    id: 'human',
    name: 'Human',
    description: 'Versatile and adaptable. Humans excel in all areas through determination.',
    statBonuses: {
      strength: 2,
      dexterity: 2,
      intelligence: 2,
      vitality: 2,
    },
    racialAbilities: [
      'Adaptability: +5% experience gain',
      'Versatility: +1 to all stats per 5 levels',
    ],
  },
  elf: {
    id: 'elf',
    name: 'Elf',
    description: 'Graceful and magical. Elves have enhanced dexterity and magical affinity.',
    statBonuses: {
      dexterity: 4,
      intelligence: 4,
      vitality: -2,
    },
    racialAbilities: [
      'Elven Grace: +10% movement speed',
      'Arcane Affinity: +15% mana regeneration',
    ],
  },
  demon: {
    id: 'demon',
    name: 'Demon',
    description: 'Powerful and chaotic. Demons possess great strength and dark magic.',
    statBonuses: {
      strength: 4,
      intelligence: 3,
      vitality: 3,
      defense: -2,
    },
    racialAbilities: [
      'Demonic Strength: +10% attack damage',
      'Dark Resilience: +5% health regeneration',
    ],
  },
};

export function getRaceData(raceId: CharacterRace): RaceData {
  return RACES[raceId];
}

