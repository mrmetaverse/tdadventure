import * as THREE from 'three';
import { GameState, Entity, Player, Vector2 } from '../../types/game';
import { SceneManager } from './SceneManager';
import { World } from './World';
import { InputSystem } from '../systems/InputSystem';
import { MovementSystem } from '../systems/MovementSystem';
import { CollisionSystem } from '../systems/CollisionSystem';
import { Player as PlayerEntity } from '../entities/Player';
import { Enemy } from '../entities/Enemy';
import { NPC } from '../entities/NPC';
import { GAME_CONFIG } from '../utils/Constants';
import { NetworkClient } from '../network/NetworkClient';
import { AlignmentSystem } from '../utils/Alignment';

export class GameEngine {
  private sceneManager: SceneManager;
  private world: World;
  private inputSystem: InputSystem;
  private movementSystem: MovementSystem;
  private collisionSystem: CollisionSystem;
  private networkClient: NetworkClient;

  private gameState: GameState;
  private isRunning: boolean = false;
  private lastTime: number = 0;
  private animationFrameId: number | null = null;

  private localPlayer: PlayerEntity | null = null;
  private entities: Map<string, Entity> = new Map();

  constructor(canvas: HTMLCanvasElement, characterData?: any) {
    this.sceneManager = new SceneManager(canvas);
    this.world = new World(this.sceneManager.getScene());
    this.inputSystem = new InputSystem();
    this.collisionSystem = new CollisionSystem();
    this.collisionSystem.setWorld(this.world);
    this.movementSystem = new MovementSystem(this.collisionSystem);
    this.networkClient = new NetworkClient();

    this.gameState = {
      isRunning: false,
      isPaused: false,
      currentZone: 'default_zone',
      entities: new Map(),
      camera: {
        position: { x: 0, y: 0 },
        zoom: 1,
      },
      worldSize: GAME_CONFIG.WORLD_SIZE,
      time: 0,
      deltaTime: 0,
    };

    this.init(characterData);
  }

  private async init(characterData?: any): Promise<void> {
    // Initialize input system
    const canvas = this.sceneManager.getRenderer().domElement;
    this.inputSystem.init(canvas);

    // Load explored chunks from server
    try {
      const response = await fetch('/api/world/chunks');
      if (response.ok) {
        const data = await response.json();
        if (data.chunks && Array.isArray(data.chunks)) {
          this.world.loadExploredChunks(data.chunks);
        }
      }
    } catch (error) {
      console.warn('Failed to load world chunks from server:', error);
    }

    // Spawn point at center of initial area
    const spawnPoint = { 
      x: GAME_CONFIG.INITIAL_WORLD_SIZE / 2, 
      y: GAME_CONFIG.INITIAL_WORLD_SIZE / 2 
    };
    if (characterData) {
      this.localPlayer = new PlayerEntity(
        characterData.name,
        spawnPoint,
        {
          class: characterData.class,
          race: characterData.race,
          divine: characterData.divine,
          alignment: characterData.alignment,
          level: characterData.level,
          experience: characterData.experience,
        },
        true
      );
    } else {
      // Formless player - ball of light
      this.localPlayer = new PlayerEntity(
        'Formless',
        spawnPoint,
        undefined, // No character data = formless
        true
      );
    }
    this.addEntity(this.localPlayer);
    this.gameState.localPlayer = this.localPlayer;

    // Add some NPCs around spawn
    for (let i = 0; i < 3; i++) {
      const npcPos = {
        x: spawnPoint.x + (i * 5) - 5,
        y: spawnPoint.y + (i * 3) - 3,
      };
      const npc = new NPC(
        `NPC ${i + 1}`,
        npcPos,
        [`Hello, traveler! I am NPC ${i + 1}.`, `Welcome to the world!`]
      );
      this.addEntity(npc);
    }

    // Add some enemies around spawn
    for (let i = 0; i < 5; i++) {
      const enemyPos = {
        x: spawnPoint.x + (Math.random() - 0.5) * 20,
        y: spawnPoint.y + (Math.random() - 0.5) * 20,
      };
      const enemy = new Enemy(`Goblin ${i + 1}`, enemyPos, 1);
      this.addEntity(enemy);
    }

    // Sync explored chunks to server periodically
    this.startExplorationSync();

    // Connect to network
    this.networkClient.connect();
    this.networkClient.onPlayerUpdate((data) => {
      // Handle remote player updates
      this.handleNetworkUpdate(data);
    });

    console.log('Game Engine Initialized');
  }

  private addEntity(entity: Entity): void {
    this.entities.set(entity.id, entity);
    this.gameState.entities.set(entity.id, entity);

    if (entity.mesh) {
      this.sceneManager.addToScene(entity.mesh);
    }
  }

  private removeEntity(entityId: string): void {
    const entity = this.entities.get(entityId);
    if (entity && entity.mesh) {
      this.sceneManager.removeFromScene(entity.mesh);
      entity.mesh.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
          if (Array.isArray(child.material)) {
            child.material.forEach((mat) => mat.dispose());
          } else {
            child.material.dispose();
          }
        }
      });
    }

    this.entities.delete(entityId);
    this.gameState.entities.delete(entityId);
  }

  start(): void {
    if (this.isRunning) return;

    this.isRunning = true;
    this.gameState.isRunning = true;
    this.lastTime = performance.now();
    this.gameLoop();

    console.log('Game Engine Started');
  }

  stop(): void {
    this.isRunning = false;
    this.gameState.isRunning = false;

    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    this.networkClient.disconnect();
    console.log('Game Engine Stopped');
  }

  private gameLoop = (): void => {
    if (!this.isRunning) return;

    const currentTime = performance.now();
    const deltaTime = Math.min((currentTime - this.lastTime) / 1000, 0.1); // Cap at 100ms
    this.lastTime = currentTime;

    this.gameState.time += deltaTime;
    this.gameState.deltaTime = deltaTime;

    this.update(deltaTime);
    this.render();

    this.animationFrameId = requestAnimationFrame(this.gameLoop);
  };

  private update(deltaTime: number): void {
    if (this.gameState.isPaused) return;

    // Update input
    const inputState = this.inputSystem.getInputState();
    const movement = this.inputSystem.getMovementVector();

    // Update local player
    if (this.localPlayer) {
      this.movementSystem.setVelocity(this.localPlayer, movement, this.localPlayer.speed);
      this.movementSystem.updateEntity(this.localPlayer, deltaTime);

      // Update camera to follow player
      this.sceneManager.followTarget(
        this.localPlayer.position.x,
        this.localPlayer.position.y,
        0.1
      );

      // Update world visible chunks
      this.world.updateVisibleChunks(this.localPlayer.position);

      // Send network update
      this.networkClient.sendPlayerUpdate({
        position: this.localPlayer.position,
        velocity: this.localPlayer.velocity,
        rotation: this.localPlayer.rotation,
      });

      // Update player mesh
      this.localPlayer.update(deltaTime);
    }

    // Update entities
    this.entities.forEach((entity) => {
      if (entity.type === 'enemy') {
        const enemy = entity as Enemy;
        const playerPos = this.localPlayer?.position || { x: 0, y: 0 };
        enemy.update(deltaTime, playerPos);
        this.movementSystem.updateEntity(enemy, deltaTime);
      } else if (entity.type === 'npc') {
        const npc = entity as NPC;
        npc.update(deltaTime);
      } else if (entity.type === 'player') {
        const player = entity as Player;
        if (!player.isLocal) {
          // Remote players
          this.movementSystem.updateEntity(entity, deltaTime);
          if (entity.mesh) {
            entity.mesh.position.set(entity.position.x, 0, entity.position.y);
          }
        }
      }
    });

    // Handle attack
    if (inputState.mouseDown && this.localPlayer && !this.localPlayer.isFormless) {
      const mouseWorld = this.sceneManager.getScreenToWorld(
        inputState.mousePosition.x,
        inputState.mousePosition.y
      );

      if (mouseWorld) {
        const targetPos: Vector2 = { x: mouseWorld.x, y: mouseWorld.z };
        this.localPlayer.attack(targetPos, this.entities);
      }
    }
    
    // Clean up dead enemies
    const deadEntities: string[] = [];
    this.entities.forEach((entity) => {
      if (entity.type === 'enemy') {
        const enemy = entity as Enemy;
        if (enemy.isDead && enemy.isDead()) {
          deadEntities.push(entity.id);
        }
      }
    });
    
    deadEntities.forEach((id) => {
      this.removeEntity(id);
    });
  }

  private render(): void {
    this.sceneManager.render();
  }

  private handleNetworkUpdate(data: any): void {
    // Handle remote player updates from network
    // This would create/update remote player entities
  }

  private explorationSyncInterval: NodeJS.Timeout | null = null;

  /**
   * Periodically sync explored chunks to server
   */
  private startExplorationSync(): void {
    // Sync every 10 seconds
    this.explorationSyncInterval = setInterval(async () => {
      try {
        const exploredChunks = this.world.getExploredChunks();
        if (exploredChunks.length > 0) {
          const response = await fetch('/api/world/chunks', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ chunks: exploredChunks }),
          });
          
          if (response.ok) {
            const data = await response.json();
            console.log(`Synced ${exploredChunks.length} chunks to server (total: ${data.totalChunks})`);
          }
        }
      } catch (error) {
        console.warn('Failed to sync exploration to server:', error);
      }
    }, 10000); // Every 10 seconds
  }

  getGameState(): GameState {
    return this.gameState;
  }

  getLocalPlayer(): PlayerEntity | null {
    return this.localPlayer;
  }

  getEntities(): Map<string, Entity> {
    return this.entities;
  }

  getScene(): THREE.Scene {
    return this.sceneManager.getScene();
  }

  pause(): void {
    this.gameState.isPaused = true;
  }

  resume(): void {
    this.gameState.isPaused = false;
  }

  dispose(): void {
    this.stop();
    this.inputSystem.destroy();
    this.sceneManager.dispose();
    this.networkClient.disconnect();
  }
}
