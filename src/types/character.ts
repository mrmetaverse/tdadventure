import { PlayerStats } from './game';

export type AlignmentAxis = 'lawful' | 'neutral' | 'chaotic';
export type MoralityAxis = 'good' | 'neutral' | 'evil';

export interface Alignment {
  lawfulChaotic: AlignmentAxis; // -1 = lawful, 0 = neutral, 1 = chaotic
  goodEvil: MoralityAxis; // -1 = good, 0 = neutral, 1 = evil
  lawfulValue: number; // -100 to 100, where -100 is lawful, 100 is chaotic
  goodValue: number; // -100 to 100, where -100 is good, 100 is evil
}

export type CharacterClass = 'assassin' | 'necromancer' | 'cleric' | 'wizard' | 'warrior';
export type CharacterRace = 'human' | 'elf' | 'demon';
export type Divine = 
  | 'knowledge' 
  | 'passion' 
  | 'fire' 
  | 'healing' 
  | 'chaos' 
  | 'hunt' 
  | 'lightning' 
  | 'poison' 
  | 'water';

export interface ClassData {
  id: CharacterClass;
  name: string;
  description: string;
  baseStats: Partial<PlayerStats>;
  statGrowth: Partial<PlayerStats>; // Stats gained per level
  primaryStat: keyof PlayerStats;
  secondaryStat: keyof PlayerStats;
  icon?: string;
}

export interface RaceData {
  id: CharacterRace;
  name: string;
  description: string;
  statBonuses: Partial<PlayerStats>;
  racialAbilities: string[];
  icon?: string;
}

export interface DivineData {
  id: Divine;
  name: string;
  description: string;
  alignment: {
    preferredLawfulChaotic?: AlignmentAxis;
    preferredGoodEvil?: MoralityAxis;
  };
  bonuses: Partial<PlayerStats>;
  icon?: string;
}

export interface CharacterData {
  id: string;
  name: string;
  class: CharacterClass;
  race: CharacterRace;
  divine: Divine;
  alignment: Alignment;
  level: number;
  experience: number;
  createdAt: number;
  lastPlayed: number;
}

export interface CharacterCreationData {
  name: string;
  class: CharacterClass;
  race: CharacterRace;
  divine: Divine;
  startingAlignment: Alignment;
}

