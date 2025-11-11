import * as THREE from 'three';
import { Zone, Vector2 } from '../../types/game';
import { TILE_TYPES, GAME_CONFIG } from '../utils/Constants';

export class World {
  private scene: THREE.Scene;
  private currentZone: Zone | null = null;
  private tileMeshes: Map<string, THREE.Mesh> = new Map();
  private chunks: Map<string, THREE.Group> = new Map();

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  loadZone(zone: Zone): void {
    this.clearWorld();
    this.currentZone = zone;
    this.generateWorld();
  }

  private clearWorld(): void {
    this.tileMeshes.forEach((mesh) => {
      this.scene.remove(mesh);
      mesh.geometry.dispose();
      (mesh.material as THREE.Material).dispose();
    });
    this.tileMeshes.clear();

    this.chunks.forEach((chunk) => {
      this.scene.remove(chunk);
    });
    this.chunks.clear();
  }

  private generateWorld(): void {
    if (!this.currentZone) return;

    const chunkSize = GAME_CONFIG.CHUNK_SIZE;
    const chunksX = Math.ceil(this.currentZone.size.x / chunkSize);
    const chunksY = Math.ceil(this.currentZone.size.y / chunkSize);

    for (let cy = 0; cy < chunksY; cy++) {
      for (let cx = 0; cx < chunksX; cx++) {
        this.generateChunk(cx, cy, chunkSize);
      }
    }
  }

  private generateChunk(chunkX: number, chunkY: number, chunkSize: number): void {
    if (!this.currentZone) return;

    const chunkGroup = new THREE.Group();
    const chunkKey = `${chunkX}_${chunkY}`;

    const startX = chunkX * chunkSize;
    const startY = chunkY * chunkSize;
    const endX = Math.min(startX + chunkSize, this.currentZone.size.x);
    const endY = Math.min(startY + chunkSize, this.currentZone.size.y);

    // Create merged geometry for better performance
    const geometries: THREE.PlaneGeometry[] = [];
    const materials: THREE.MeshBasicMaterial[] = [];

    for (let y = startY; y < endY; y++) {
      for (let x = startX; x < endX; x++) {
        const tileId = this.currentZone.tiles[y][x];
        const tileData = TILE_TYPES[tileId];

        if (tileData) {
          const geometry = new THREE.PlaneGeometry(
            GAME_CONFIG.TILE_SIZE,
            GAME_CONFIG.TILE_SIZE
          );
          geometry.translate(x, 0, y);
          
          const material = new THREE.MeshBasicMaterial({
            color: tileData.color,
            side: THREE.DoubleSide,
          });

          const mesh = new THREE.Mesh(geometry, material);
          mesh.rotation.x = -Math.PI / 2;
          mesh.position.y = -0.01;
          chunkGroup.add(mesh);

          // Add slight height variation for non-walkable tiles
          if (!tileData.walkable) {
            mesh.position.y = 0.1;
          }
        }
      }
    }

    chunkGroup.name = `chunk_${chunkKey}`;
    this.chunks.set(chunkKey, chunkGroup);
    this.scene.add(chunkGroup);
  }

  updateVisibleChunks(cameraPosition: Vector2): void {
    if (!this.currentZone) return;

    const chunkSize = GAME_CONFIG.CHUNK_SIZE;
    const renderDistance = GAME_CONFIG.RENDER_DISTANCE;

    const centerChunkX = Math.floor(cameraPosition.x / chunkSize);
    const centerChunkY = Math.floor(cameraPosition.y / chunkSize);

    this.chunks.forEach((chunk, key) => {
      const [chunkX, chunkY] = key.split('_').map(Number);
      const distance = Math.max(
        Math.abs(chunkX - centerChunkX),
        Math.abs(chunkY - centerChunkY)
      );

      chunk.visible = distance <= renderDistance;
    });
  }

  getCurrentZone(): Zone | null {
    return this.currentZone;
  }

  getTileAt(position: Vector2): number {
    if (!this.currentZone) return 0;

    const x = Math.floor(position.x);
    const y = Math.floor(position.y);

    if (
      x < 0 ||
      y < 0 ||
      y >= this.currentZone.tiles.length ||
      x >= this.currentZone.tiles[0].length
    ) {
      return 4; // Wall/out of bounds
    }

    return this.currentZone.tiles[y][x];
  }

  isWalkable(position: Vector2): boolean {
    const tileId = this.getTileAt(position);
    const tile = TILE_TYPES[tileId];
    return tile ? tile.walkable : false;
  }

  static generateDefaultZone(size: Vector2): Zone {
    const tiles: number[][] = [];

    for (let y = 0; y < size.y; y++) {
      const row: number[] = [];
      for (let x = 0; x < size.x; x++) {
        // Create borders
        if (x === 0 || y === 0 || x === size.x - 1 || y === size.y - 1) {
          row.push(4); // Wall
        }
        // Random terrain
        else {
          const rand = Math.random();
          if (rand < 0.7) {
            row.push(0); // Grass
          } else if (rand < 0.85) {
            row.push(1); // Dirt
          } else if (rand < 0.95) {
            row.push(2); // Stone
          } else {
            row.push(3); // Water
          }
        }
      }
      tiles.push(row);
    }

    // Add some walls randomly (but avoid center area for spawn points)
    for (let i = 0; i < 20; i++) {
      const x = Math.floor(Math.random() * (size.x - 4)) + 2;
      const y = Math.floor(Math.random() * (size.y - 4)) + 2;
      
      // Don't place walls near spawn points
      const centerX = size.x / 2;
      const centerY = size.y / 2;
      const distFromCenter = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
      
      if (distFromCenter > 10) {
        tiles[y][x] = 4;
      }
    }

    // Find walkable spawn points
    const findWalkableSpawn = (targetX: number, targetY: number): Vector2 => {
      // Try the target position first
      if (tiles[Math.floor(targetY)][Math.floor(targetX)] !== 4 && 
          tiles[Math.floor(targetY)][Math.floor(targetX)] !== 3) {
        return { x: targetX, y: targetY };
      }
      
      // Search in a spiral pattern for a walkable tile
      for (let radius = 1; radius < 20; radius++) {
        for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 4) {
          const x = Math.floor(targetX + Math.cos(angle) * radius);
          const y = Math.floor(targetY + Math.sin(angle) * radius);
          
          if (x >= 1 && x < size.x - 1 && y >= 1 && y < size.y - 1) {
            const tileId = tiles[y][x];
            if (tileId !== 4 && tileId !== 3) { // Not wall or water
              return { x: x + 0.5, y: y + 0.5 }; // Center of tile
            }
          }
        }
      }
      
      // Fallback to a safe position
      return { x: 10, y: 10 };
    };

    const spawnPoints: Vector2[] = [
      findWalkableSpawn(size.x / 2, size.y / 2),
      findWalkableSpawn(size.x / 4, size.y / 4),
      findWalkableSpawn((size.x * 3) / 4, (size.y * 3) / 4),
    ];

    return {
      id: 'default_zone',
      name: 'Starting Plains',
      size,
      tiles,
      spawnPoints,
      npcs: [],
      enemies: [],
    };
  }
}


