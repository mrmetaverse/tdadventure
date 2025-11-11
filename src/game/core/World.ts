import * as THREE from 'three';
import { Vector2 } from '../../types/game';
import { TILE_TYPES, GAME_CONFIG } from '../utils/Constants';
import { ProceduralGenerator, ChunkData } from '../world/ProceduralGenerator';
import { ExplorationTracker } from '../world/ExplorationTracker';

/**
 * Infinite procedural world with exploration-based generation
 * - 1000x1000 initial area at origin
 * - Generates chunks as players explore
 * - Only renders explored chunks
 * - Server-persisted exploration data
 */
export class World {
  private scene: THREE.Scene;
  private generator: ProceduralGenerator;
  private explorationTracker: ExplorationTracker;
  private chunks: Map<string, THREE.Group> = new Map();
  private loadedChunks: Set<string> = new Set();

  constructor(scene: THREE.Scene, explorationTracker?: ExplorationTracker) {
    this.scene = scene;
    this.generator = new ProceduralGenerator(12345); // Fixed seed for consistency
    this.explorationTracker = explorationTracker || new ExplorationTracker();
    
    // Generate initial 1000x1000 area
    this.generateInitialArea();
  }

  /**
   * Generate the initial 1000x1000 area at origin
   */
  private generateInitialArea(): void {
    const initialSize = GAME_CONFIG.INITIAL_WORLD_SIZE;
    const chunkSize = GAME_CONFIG.CHUNK_SIZE;
    const chunksX = Math.ceil(initialSize / chunkSize);
    const chunksY = Math.ceil(initialSize / chunkSize);

    // Generate all chunks in initial area
    for (let cy = 0; cy < chunksY; cy++) {
      for (let cx = 0; cx < chunksX; cx++) {
        const chunk = this.generator.generateChunk(cx, cy);
        this.explorationTracker.setChunkData(chunk);
        // Mark initial area as explored
        this.explorationTracker.markExplored(cx, cy);
      }
    }
  }

  /**
   * Update visible chunks based on player position
   * Generates new chunks as player explores
   */
  updateVisibleChunks(playerPosition: Vector2): void {
    const renderDistance = GAME_CONFIG.RENDER_DISTANCE;
    const chunksToLoad = this.generator.getChunksInRange(playerPosition, renderDistance);

    // Mark chunks as explored when player is nearby
    this.explorationTracker.markChunksExploredAroundPosition(
      playerPosition,
      GAME_CONFIG.CHUNK_SIZE,
      GAME_CONFIG.EXPLORATION_RADIUS
    );

    // Load/generate chunks in range
    chunksToLoad.forEach(({ chunkX, chunkY }) => {
      const chunkKey = `${chunkX}_${chunkY}`;
      
      // Only render explored chunks
      if (!this.explorationTracker.isExplored(chunkX, chunkY)) {
        return; // Don't render unexplored chunks
      }

      // Load chunk if not already loaded
      if (!this.loadedChunks.has(chunkKey)) {
        this.loadChunk(chunkX, chunkY);
      }
    });

    // Update chunk visibility based on distance
    this.chunks.forEach((chunk, key) => {
      const [chunkX, chunkY] = key.split('_').map(Number);
      const { chunkX: playerChunkX, chunkY: playerChunkY } = this.generator.getChunkCoords(playerPosition);
      
      const distance = Math.max(
        Math.abs(chunkX - playerChunkX),
        Math.abs(chunkY - playerChunkY)
      );

      chunk.visible = distance <= renderDistance && this.explorationTracker.isExplored(chunkX, chunkY);
    });

    // Unload distant chunks
    this.unloadDistantChunks(playerPosition, renderDistance + 2);
  }

  /**
   * Load or generate a chunk
   */
  private loadChunk(chunkX: number, chunkY: number): void {
    const chunkKey = `${chunkX}_${chunkY}`;
    
    if (this.loadedChunks.has(chunkKey)) {
      return; // Already loaded
    }

    // Get chunk data (generate if needed)
    let chunkData = this.explorationTracker.getChunkData(chunkX, chunkY);
    
    if (!chunkData) {
      // Generate new chunk
      chunkData = this.generator.generateChunk(chunkX, chunkY);
      this.explorationTracker.setChunkData(chunkData);
    }

    // Create visual representation
    const chunkGroup = this.createChunkMesh(chunkData);
    this.chunks.set(chunkKey, chunkGroup);
    this.loadedChunks.add(chunkKey);
    this.scene.add(chunkGroup);
  }

  /**
   * Create Three.js mesh for a chunk
   */
  private createChunkMesh(chunkData: ChunkData): THREE.Group {
    const chunkGroup = new THREE.Group();
    const chunkSize = GAME_CONFIG.CHUNK_SIZE;

    for (let y = 0; y < chunkSize; y++) {
      for (let x = 0; x < chunkSize; x++) {
        const tileId = chunkData.tiles[y][x];
        const tileData = TILE_TYPES[tileId];

        if (tileData) {
          const worldX = chunkData.chunkX * chunkSize + x;
          const worldY = chunkData.chunkY * chunkSize + y;

          const geometry = new THREE.PlaneGeometry(
            GAME_CONFIG.TILE_SIZE,
            GAME_CONFIG.TILE_SIZE
          );
          
          const material = new THREE.MeshBasicMaterial({
            color: tileData.color,
            side: THREE.DoubleSide,
            transparent: tileId === 5, // Unexplored tiles are semi-transparent
            opacity: tileId === 5 ? 0.3 : 1.0,
          });

          const mesh = new THREE.Mesh(geometry, material);
          mesh.rotation.x = -Math.PI / 2;
          mesh.position.set(worldX, -0.01, worldY);

          // Add slight height variation for non-walkable tiles
          if (!tileData.walkable && tileId !== 5) {
            mesh.position.y = 0.1;
          }

          chunkGroup.add(mesh);
        }
      }
    }

    chunkGroup.name = `chunk_${chunkData.chunkX}_${chunkData.chunkY}`;
    return chunkGroup;
  }

  /**
   * Unload chunks that are too far away
   */
  private unloadDistantChunks(playerPosition: Vector2, maxDistance: number): void {
    const { chunkX: playerChunkX, chunkY: playerChunkY } = this.generator.getChunkCoords(playerPosition);
    const chunksToUnload: string[] = [];

    this.chunks.forEach((chunk, key) => {
      const [chunkX, chunkY] = key.split('_').map(Number);
      const distance = Math.max(
        Math.abs(chunkX - playerChunkX),
        Math.abs(chunkY - playerChunkY)
      );

      if (distance > maxDistance) {
        chunksToUnload.push(key);
      }
    });

    chunksToUnload.forEach(key => {
      const chunk = this.chunks.get(key);
      if (chunk) {
        this.scene.remove(chunk);
        chunk.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.geometry.dispose();
            if (child.material instanceof THREE.Material) {
              child.material.dispose();
            }
          }
        });
        this.chunks.delete(key);
        this.loadedChunks.delete(key);
      }
    });
  }

  /**
   * Get tile at world position
   */
  getTileAt(position: Vector2): number {
    const { chunkX, chunkY } = this.generator.getChunkCoords(position);
    const chunkData = this.explorationTracker.getChunkData(chunkX, chunkY);

    if (!chunkData) {
      return 5; // Unexplored
    }

    const chunkSize = GAME_CONFIG.CHUNK_SIZE;
    const localX = Math.floor(position.x) % chunkSize;
    const localY = Math.floor(position.y) % chunkSize;

    // Handle negative coordinates
    const adjustedX = localX < 0 ? chunkSize + localX : localX;
    const adjustedY = localY < 0 ? chunkSize + localY : localY;

    if (adjustedY >= 0 && adjustedY < chunkData.tiles.length &&
        adjustedX >= 0 && adjustedX < chunkData.tiles[adjustedY].length) {
      return chunkData.tiles[adjustedY][adjustedX];
    }

    return 5; // Unexplored
  }

  /**
   * Check if position is walkable
   */
  isWalkable(position: Vector2): boolean {
    const tileId = this.getTileAt(position);
    
    // Unexplored areas are not walkable
    if (tileId === 5) {
      return false;
    }

    const tile = TILE_TYPES[tileId];
    return tile ? tile.walkable : false;
  }

  /**
   * Get exploration tracker (for server sync)
   */
  getExplorationTracker(): ExplorationTracker {
    return this.explorationTracker;
  }

  /**
   * Load explored chunks from server
   */
  loadExploredChunks(chunks: Array<{ chunkX: number; chunkY: number; tiles?: number[][] }>): void {
    this.explorationTracker.loadExploredChunks(chunks);
  }

  /**
   * Get all explored chunks for server persistence
   */
  getExploredChunks(): Array<{ chunkX: number; chunkY: number; tiles: number[][] }> {
    return this.explorationTracker.getSerializedData();
  }
}
