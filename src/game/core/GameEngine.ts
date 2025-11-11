import * as THREE from 'three';
import { GameState, Entity, Player, Vector2 } from '@types/game';
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

  private init(characterData?: any): void {
    // Initialize input system
    const canvas = this.sceneManager.getRenderer().domElement;
    this.inputSystem.init(canvas);

    // Load default zone
    const defaultZone = World.generateDefaultZone(GAME_CONFIG.WORLD_SIZE);
    this.world.loadZone(defaultZone);
    this.collisionSystem.setZone(defaultZone);
    this.gameState.currentZone = defaultZone.id;

    // Create local player with character data or defaults
    const spawnPoint = defaultZone.spawnPoints[0];
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
      // Default character for testing
      this.localPlayer = new PlayerEntity(
        'Player',
        spawnPoint,
        {
          class: 'warrior',
          race: 'human',
          divine: 'fire',
          alignment: AlignmentSystem.getStartingAlignment('neutral', 'neutral'),
          level: 1,
          experience: 0,
        },
        true
      );
    }
    this.addEntity(this.localPlayer);
    this.gameState.localPlayer = this.localPlayer;

    // Add some NPCs
    for (let i = 0; i < 3; i++) {
      const npcPos = defaultZone.spawnPoints[i + 1] || {
        x: spawnPoint.x + (i * 5),
        y: spawnPoint.y + (i * 5),
      };
      const npc = new NPC(
        `NPC ${i + 1}`,
        npcPos,
        [`Hello, traveler! I am NPC ${i + 1}.`, `Welcome to ${defaultZone.name}!`]
      );
      this.addEntity(npc);
    }

    // Add some enemies
    for (let i = 0; i < 5; i++) {
      const enemyPos = {
        x: spawnPoint.x + (Math.random() - 0.5) * 20,
        y: spawnPoint.y + (Math.random() - 0.5) * 20,
      };
      const enemy = new Enemy(`Goblin ${i + 1}`, enemyPos, 1);
      this.addEntity(enemy);
    }

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
      } else if (entity.type === 'player' && !entity.isLocal) {
        // Remote players
        this.movementSystem.updateEntity(entity, deltaTime);
        if (entity.mesh) {
          entity.mesh.position.set(entity.position.x, 0, entity.position.y);
        }
      }
    });

    // Handle interactions
    if (inputState.mouseDown && this.localPlayer) {
      // Attack or interact
      const mouseWorld = this.sceneManager.getScreenToWorld(
        inputState.mousePosition.x,
        inputState.mousePosition.y
      );

      if (mouseWorld) {
        const targetPos: Vector2 = { x: mouseWorld.x, z: mouseWorld.z };
        // Could trigger attack or movement here
      }
    }
  }

  private render(): void {
    this.sceneManager.render();
  }

  private handleNetworkUpdate(data: any): void {
    // Handle remote player updates from network
    // This would create/update remote player entities
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
