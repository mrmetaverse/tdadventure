import { Vector2 } from '../../types/game';
import { TILE_TYPES } from '../utils/Constants';

export interface ChunkData {
  chunkX: number;
  chunkY: number;
  tiles: number[][];
  explored: boolean;
  generated: boolean;
}

/**
 * Procedural world generator using deterministic seeding
 * Generates consistent terrain based on chunk coordinates
 */
export class ProceduralGenerator {
  private seed: number;
  private chunkSize: number = 20;
  private initialWorldSize: number = 1000; // 1000x1000 at origin

  constructor(seed: number = 12345) {
    this.seed = seed;
  }

  /**
   * Simple seeded random number generator
   */
  private seededRandom(chunkX: number, chunkY: number, offset: number = 0): number {
    const x = (chunkX * 73856093) ^ (chunkY * 19349663) ^ (this.seed * 83492791) ^ (offset * 50331653);
    return ((x * x * x) % 2147483647) / 2147483647;
  }

  /**
   * Generate a chunk at specific coordinates
   */
  generateChunk(chunkX: number, chunkY: number): ChunkData {
    const tiles: number[][] = [];
    
    // Check if this is within the initial 1000x1000 area
    const isInitialArea = 
      chunkX >= 0 && chunkX < this.initialWorldSize / this.chunkSize &&
      chunkY >= 0 && chunkY < this.initialWorldSize / this.chunkSize;

    for (let y = 0; y < this.chunkSize; y++) {
      const row: number[] = [];
      for (let x = 0; x < this.chunkSize; x++) {
        const worldX = chunkX * this.chunkSize + x;
        const worldY = chunkY * this.chunkSize + y;
        
        // Generate tile based on position and seed
        const tile = this.generateTile(worldX, worldY, chunkX, chunkY, isInitialArea);
        row.push(tile);
      }
      tiles.push(row);
    }

    return {
      chunkX,
      chunkY,
      tiles,
      explored: false,
      generated: true,
    };
  }

  /**
   * Generate a single tile using noise-like functions
   */
  private generateTile(worldX: number, worldY: number, chunkX: number, chunkY: number, isInitialArea: boolean): number {
    // Use multiple noise layers for terrain generation
    const noise1 = this.seededRandom(chunkX, chunkY, worldX + worldY);
    const noise2 = this.seededRandom(chunkX + 1, chunkY, worldX - worldY);
    const noise3 = this.seededRandom(chunkX, chunkY + 1, worldX * worldY);
    
    // Combine noises
    const combinedNoise = (noise1 + noise2 * 0.5 + noise3 * 0.25) / 1.75;
    
    // Distance from origin (affects terrain type)
    const distanceFromOrigin = Math.sqrt(worldX ** 2 + worldY ** 2);
    const normalizedDistance = distanceFromOrigin / 2000; // Normalize to 0-1 range
    
    // Edge detection for borders
    const isEdge = 
      worldX === chunkX * this.chunkSize ||
      worldY === chunkY * this.chunkSize ||
      worldX === (chunkX + 1) * this.chunkSize - 1 ||
      worldY === (chunkY + 1) * this.chunkSize - 1;
    
    // Generate terrain based on noise and distance
    if (isEdge && !isInitialArea) {
      // Unexplored edges are dark/foggy
      return 5; // Unexplored tile type
    }
    
    // Terrain generation logic
    if (combinedNoise < 0.1) {
      return 3; // Water
    } else if (combinedNoise < 0.15) {
      return 4; // Wall/rock
    } else if (combinedNoise < 0.6) {
      return 0; // Grass
    } else if (combinedNoise < 0.8) {
      return 1; // Dirt
    } else {
      return 2; // Stone
    }
  }

  /**
   * Check if a position is within the initial 1000x1000 area
   */
  isInInitialArea(position: Vector2): boolean {
    return (
      position.x >= 0 &&
      position.x < this.initialWorldSize &&
      position.y >= 0 &&
      position.y < this.initialWorldSize
    );
  }

  /**
   * Get chunk coordinates from world position
   */
  getChunkCoords(position: Vector2): { chunkX: number; chunkY: number } {
    return {
      chunkX: Math.floor(position.x / this.chunkSize),
      chunkY: Math.floor(position.y / this.chunkSize),
    };
  }

  /**
   * Get world position from chunk coordinates
   */
  getChunkWorldPos(chunkX: number, chunkY: number): Vector2 {
    return {
      x: chunkX * this.chunkSize,
      y: chunkY * this.chunkSize,
    };
  }

  /**
   * Get all chunks that should be loaded around a position
   */
  getChunksInRange(position: Vector2, renderDistance: number): Array<{ chunkX: number; chunkY: number }> {
    const { chunkX, chunkY } = this.getChunkCoords(position);
    const chunks: Array<{ chunkX: number; chunkY: number }> = [];

    for (let dy = -renderDistance; dy <= renderDistance; dy++) {
      for (let dx = -renderDistance; dx <= renderDistance; dx++) {
        chunks.push({
          chunkX: chunkX + dx,
          chunkY: chunkY + dy,
        });
      }
    }

    return chunks;
  }
}

