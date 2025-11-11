import * as THREE from 'three';
import { CharacterClass, CharacterRace, Divine } from '../../types/character';
import { Equipment } from '../../types/game';
import { spriteGenerator } from '../../services/spriteGenerator';

export interface SpriteAnimation {
  idle: string[];
  walk: string[];
  attack: string[];
}

export class SpriteSystem {
  private spriteCache: Map<string, SpriteAnimation> = new Map();
  private textureCache: Map<string, THREE.Texture> = new Map();

  /**
   * Get or generate sprites for a character
   */
  async getCharacterSprites(
    characterClass: CharacterClass,
    race: CharacterRace,
    divine: Divine,
    equipment?: Equipment
  ): Promise<SpriteAnimation> {
    const cacheKey = this.getCacheKey(characterClass, race, divine, equipment);
    
    if (this.spriteCache.has(cacheKey)) {
      return this.spriteCache.get(cacheKey)!;
    }

    // Generate all animation frames
    const [idleFrames, walkFrames, attackFrames] = await Promise.all([
      spriteGenerator.generateAnimationFrames(characterClass, race, divine, equipment, 'idle', 4),
      spriteGenerator.generateAnimationFrames(characterClass, race, divine, equipment, 'walk', 4),
      spriteGenerator.generateAnimationFrames(characterClass, race, divine, equipment, 'attack', 4),
    ]);

    const animation: SpriteAnimation = {
      idle: idleFrames,
      walk: walkFrames,
      attack: attackFrames,
    };

    this.spriteCache.set(cacheKey, animation);
    return animation;
  }

  /**
   * Load texture from image URL
   */
  async loadTexture(imageUrl: string): Promise<THREE.Texture> {
    if (this.textureCache.has(imageUrl)) {
      return this.textureCache.get(imageUrl)!;
    }

    return new Promise((resolve, reject) => {
      const loader = new THREE.TextureLoader();
      loader.load(
        imageUrl,
        (texture) => {
          texture.magFilter = THREE.NearestFilter;
          texture.minFilter = THREE.NearestFilter;
          texture.flipY = false;
          this.textureCache.set(imageUrl, texture);
          resolve(texture);
        },
        undefined,
        reject
      );
    });
  }

  /**
   * Create sprite mesh from texture
   */
  createSpriteMesh(texture: THREE.Texture, size: number = 1): THREE.Mesh {
    const geometry = new THREE.PlaneGeometry(size, size);
    const material = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      side: THREE.DoubleSide,
    });
    
    const mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.x = -Math.PI / 2; // Face up for top-down view
    return mesh;
  }

  /**
   * Regenerate sprites when equipment changes
   */
  async regenerateWithEquipment(
    characterClass: CharacterClass,
    race: CharacterRace,
    divine: Divine,
    oldEquipment: Equipment | undefined,
    newEquipment: Equipment
  ): Promise<SpriteAnimation> {
    // Clear old cache
    const oldKey = this.getCacheKey(characterClass, race, divine, oldEquipment);
    this.spriteCache.delete(oldKey);

    // Generate new sprites
    return this.getCharacterSprites(characterClass, race, divine, newEquipment);
  }

  private getCacheKey(
    characterClass: CharacterClass,
    race: CharacterRace,
    divine: Divine,
    equipment?: Equipment
  ): string {
    const equipKey = equipment
      ? `${equipment.weapon?.id || 'none'}-${equipment.armor?.id || 'none'}-${equipment.helmet?.id || 'none'}`
      : 'none';
    return `${characterClass}-${race}-${divine}-${equipKey}`;
  }

  /**
   * Clear all caches
   */
  clearCache(): void {
    this.spriteCache.clear();
    this.textureCache.forEach(texture => texture.dispose());
    this.textureCache.clear();
  }
}

