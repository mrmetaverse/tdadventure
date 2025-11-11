import { Vector2 } from '../../types/game';
import { ChunkData } from './ProceduralGenerator';

/**
 * Tracks which chunks have been explored
 * Shared across all players (collective exploration)
 */
export class ExplorationTracker {
  private exploredChunks: Set<string> = new Set();
  private chunkData: Map<string, ChunkData> = new Map();

  /**
   * Mark a chunk as explored
   */
  markExplored(chunkX: number, chunkY: number): void {
    const key = this.getChunkKey(chunkX, chunkY);
    this.exploredChunks.add(key);
    
    // Mark chunk data as explored if it exists
    const chunk = this.chunkData.get(key);
    if (chunk) {
      chunk.explored = true;
    }
  }

  /**
   * Check if a chunk has been explored
   */
  isExplored(chunkX: number, chunkY: number): boolean {
    const key = this.getChunkKey(chunkX, chunkY);
    return this.exploredChunks.has(key);
  }

  /**
   * Store chunk data
   */
  setChunkData(chunk: ChunkData): void {
    const key = this.getChunkKey(chunk.chunkX, chunk.chunkY);
    this.chunkData.set(key, chunk);
  }

  /**
   * Get chunk data
   */
  getChunkData(chunkX: number, chunkY: number): ChunkData | undefined {
    const key = this.getChunkKey(chunkX, chunkY);
    return this.chunkData.get(key);
  }

  /**
   * Get all explored chunks
   */
  getAllExploredChunks(): Array<{ chunkX: number; chunkY: number }> {
    return Array.from(this.exploredChunks).map(key => {
      const [chunkX, chunkY] = key.split(',').map(Number);
      return { chunkX, chunkY };
    });
  }

  /**
   * Load explored chunks from server data
   */
  loadExploredChunks(chunks: Array<{ chunkX: number; chunkY: number; tiles?: number[][] }>): void {
    chunks.forEach(chunk => {
      const key = this.getChunkKey(chunk.chunkX, chunk.chunkY);
      this.exploredChunks.add(key);
      
      if (chunk.tiles) {
        this.chunkData.set(key, {
          chunkX: chunk.chunkX,
          chunkY: chunk.chunkY,
          tiles: chunk.tiles,
          explored: true,
          generated: true,
        });
      }
    });
  }

  /**
   * Get serialized data for server persistence
   */
  getSerializedData(): Array<{ chunkX: number; chunkY: number; tiles: number[][] }> {
    const data: Array<{ chunkX: number; chunkY: number; tiles: number[][] }> = [];
    
    this.chunkData.forEach(chunk => {
      if (chunk.explored && chunk.generated) {
        data.push({
          chunkX: chunk.chunkX,
          chunkY: chunk.chunkY,
          tiles: chunk.tiles,
        });
      }
    });

    return data;
  }

  /**
   * Mark chunks as explored when player enters them
   */
  markChunksExploredAroundPosition(position: Vector2, chunkSize: number, radius: number = 1): void {
    const chunkX = Math.floor(position.x / chunkSize);
    const chunkY = Math.floor(position.y / chunkSize);

    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        this.markExplored(chunkX + dx, chunkY + dy);
      }
    }
  }

  private getChunkKey(chunkX: number, chunkY: number): string {
    return `${chunkX},${chunkY}`;
  }
}

