import { CharacterClass, CharacterRace, Divine } from '../types/character';
import { Equipment } from '../types/game';

interface SpriteGenerationOptions {
  class: CharacterClass;
  race: CharacterRace;
  divine: Divine;
  equipment?: Equipment;
  animationType: 'idle' | 'walk' | 'attack';
  frame: number;
  totalFrames: number;
}

interface SpriteGenerationResult {
  imageUrl: string;
  prompt: string;
}

export class SpriteGenerator {
  private apiKey: string | null = null;
  private baseUrl: string = 'https://api.replicate.com/v1/predictions'; // Using Replicate as example
  private cache: Map<string, string> = new Map();

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.NEXT_PUBLIC_REPLICATE_API_KEY || null;
  }

  /**
   * Generate a prompt for sprite generation based on character data
   */
  private generatePrompt(options: SpriteGenerationOptions): string {
    const { class: characterClass, race, divine, equipment, animationType, frame, totalFrames } = options;

    // Build class description
    const classDescriptions: Record<CharacterClass, string> = {
      assassin: 'male assassin in dark hooded cloak with hidden blades',
      necromancer: 'male necromancer in dark robes with skull motifs',
      cleric: 'male cleric in white robes with holy symbols',
      wizard: 'male wizard in robes with staff',
      warrior: 'male warrior in armor with sword',
    };

    // Build race description
    const raceDescriptions: Record<CharacterRace, string> = {
      human: 'human',
      elf: 'elf with pointed ears',
      demon: 'demon with horns',
    };

    // Build divine description
    const divineDescriptions: Record<Divine, string> = {
      knowledge: 'scholarly appearance',
      passion: 'fiery appearance',
      fire: 'flame motifs',
      healing: 'radiant appearance',
      chaos: 'chaotic energy',
      hunt: 'nature motifs',
      lightning: 'electric energy',
      poison: 'toxic appearance',
      water: 'water motifs',
    };

    // Build equipment description
    let equipmentDesc = '';
    if (equipment) {
      const parts: string[] = [];
      if (equipment.weapon) {
        const weaponName = equipment.weapon.name.toLowerCase();
        // Check for special effects in weapon name
        if (weaponName.includes('fire') || weaponName.includes('flame')) {
          parts.push('flaming sword with fire effects');
        } else if (weaponName.includes('ice') || weaponName.includes('frost')) {
          parts.push('ice sword with frost effects');
        } else if (weaponName.includes('lightning') || weaponName.includes('thunder')) {
          parts.push('lightning sword with electric effects');
        } else if (weaponName.includes('poison')) {
          parts.push('poisoned sword with toxic effects');
        } else if (weaponName.includes('staff') || weaponName.includes('wand')) {
          parts.push('staff');
        } else {
          parts.push('sword');
        }
      }
      if (equipment.armor) {
        const armorName = equipment.armor.name.toLowerCase();
        if (armorName.includes('plate')) parts.push('plate armor');
        else if (armorName.includes('leather')) parts.push('leather armor');
        else if (armorName.includes('chain')) parts.push('chainmail armor');
        else parts.push('armor');
      }
      if (equipment.helmet) {
        const helmetName = equipment.helmet.name.toLowerCase();
        if (helmetName.includes('crown')) parts.push('crown');
        else if (helmetName.includes('hood')) parts.push('hood');
        else parts.push('helmet');
      }
      if (equipment.boots) {
        const bootsName = equipment.boots.name.toLowerCase();
        if (bootsName.includes('boots')) parts.push('boots');
        else if (bootsName.includes('sandals')) parts.push('sandals');
        else parts.push('footwear');
      }
      if (equipment.accessory1 || equipment.accessory2) {
        parts.push('accessories');
      }
      if (parts.length > 0) {
        equipmentDesc = `, ${parts.join(', ')}`;
      }
    }

    const animationDescriptions: Record<string, string> = {
      idle: 'standing idle',
      walk: 'walking',
      attack: 'attacking',
    };

    const prompt = `pixel art animation frames of a fantasy RPG character ${raceDescriptions[race]} ${classDescriptions[characterClass]}${equipmentDesc}, ${animationDescriptions[animationType]}, top-down view, frame ${frame} of ${totalFrames} for a ${totalFrames} frame animation, no background, consistent character, retro RPG style, clean pixel edges, ${divineDescriptions[divine]}`;

    return prompt;
  }

  /**
   * Generate sprite using AI (via Next.js API route)
   */
  async generateSprite(options: SpriteGenerationOptions): Promise<SpriteGenerationResult> {
    const cacheKey = this.getCacheKey(options);
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      return {
        imageUrl: this.cache.get(cacheKey)!,
        prompt: this.generatePrompt(options),
      };
    }

    const prompt = this.generatePrompt(options);

    try {
      // Call Next.js API route (which handles the actual AI API call)
      const response = await fetch('/api/generate-sprite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.imageUrl) {
          this.cache.set(cacheKey, data.imageUrl);
          return { imageUrl: data.imageUrl, prompt };
        }
      }
    } catch (error) {
      console.error('Sprite generation error:', error);
    }

    // Fallback: return placeholder
    return this.generatePlaceholderSprite(options);
  }

  /**
   * Poll for sprite generation completion
   */
  private async pollForCompletion(predictionId: string, maxAttempts: number = 30): Promise<string> {
    for (let i = 0; i < maxAttempts; i++) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const response = await fetch(`https://api.replicate.com/v1/predictions/${predictionId}`, {
        headers: {
          'Authorization': `Token ${this.apiKey}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.status === 'succeeded' && data.output && data.output.length > 0) {
          return data.output[0];
        }
        if (data.status === 'failed') {
          throw new Error('Sprite generation failed');
        }
      }
    }
    throw new Error('Sprite generation timeout');
  }

  /**
   * Generate placeholder sprite (fallback)
   */
  private generatePlaceholderSprite(options: SpriteGenerationOptions): SpriteGenerationResult {
    // Create a simple colored square as placeholder
    // In production, you might use a local sprite generator or default sprites
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      // Simple placeholder based on class
      const colors: Record<CharacterClass, string> = {
        assassin: '#2d3748',
        necromancer: '#4a148c',
        cleric: '#ffffff',
        wizard: '#3b82f6',
        warrior: '#dc2626',
      };
      
      ctx.fillStyle = colors[options.class];
      ctx.fillRect(0, 0, 64, 64);
      
      // Add frame indicator
      ctx.fillStyle = '#000000';
      ctx.font = '12px monospace';
      ctx.fillText(`${options.frame}/${options.totalFrames}`, 2, 12);
    }
    
    const imageUrl = canvas.toDataURL();
    return {
      imageUrl,
      prompt: this.generatePrompt(options),
    };
  }

  /**
   * Generate all animation frames for a character
   */
  async generateAnimationFrames(
    characterClass: CharacterClass,
    race: CharacterRace,
    divine: Divine,
    equipment: Equipment | undefined,
    animationType: 'idle' | 'walk' | 'attack' = 'idle',
    frameCount: number = 4
  ): Promise<string[]> {
    const frames: string[] = [];
    
    for (let frame = 1; frame <= frameCount; frame++) {
      const result = await this.generateSprite({
        class: characterClass,
        race,
        divine,
        equipment,
        animationType,
        frame,
        totalFrames: frameCount,
      });
      frames.push(result.imageUrl);
    }
    
    return frames;
  }

  /**
   * Regenerate sprites when equipment changes
   */
  async regenerateWithEquipment(
    characterClass: CharacterClass,
    race: CharacterRace,
    divine: Divine,
    oldEquipment: Equipment | undefined,
    newEquipment: Equipment,
    animationType: 'idle' | 'walk' | 'attack' = 'idle'
  ): Promise<string[]> {
    // Clear cache for this character's sprites
    this.clearCacheForCharacter(characterClass, race, divine);
    
    // Generate new frames with new equipment
    return this.generateAnimationFrames(characterClass, race, divine, newEquipment, animationType);
  }

  private getCacheKey(options: SpriteGenerationOptions): string {
    const equipKey = options.equipment 
      ? `${options.equipment.weapon?.id || 'none'}-${options.equipment.armor?.id || 'none'}`
      : 'none';
    return `${options.class}-${options.race}-${options.divine}-${options.animationType}-${options.frame}-${equipKey}`;
  }

  private clearCacheForCharacter(characterClass: CharacterClass, race: CharacterRace, divine: Divine): void {
    const keysToDelete: string[] = [];
    this.cache.forEach((_, key) => {
      if (key.startsWith(`${characterClass}-${race}-${divine}-`)) {
        keysToDelete.push(key);
      }
    });
    keysToDelete.forEach(key => this.cache.delete(key));
  }
}

// Singleton instance
export const spriteGenerator = new SpriteGenerator();

