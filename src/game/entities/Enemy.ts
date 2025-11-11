import * as THREE from 'three';
import { Enemy as EnemyType, Vector2 } from '@types/game';
import { GAME_CONFIG, COLORS } from '../utils/Constants';
import { v4 as uuidv4 } from 'uuid';

export class Enemy implements EnemyType {
  id: string;
  type: 'enemy' = 'enemy';
  name: string;
  position: Vector2;
  velocity: Vector2;
  rotation: number;
  health: number;
  maxHealth: number;
  level: number;
  damage: number;
  experienceReward: number;
  lootTable: string[];
  speed: number;
  size: number;
  aiState: 'idle' | 'patrol' | 'chase' | 'attack' | 'flee';
  targetId?: string;
  mesh?: THREE.Group;

  private patrolPoints: Vector2[] = [];
  private currentPatrolIndex: number = 0;
  private idleTimer: number = 0;
  private detectionRange: number = 5;
  private attackRange: number = 1.5;
  private attackCooldown: number = 0;

  constructor(name: string, position: Vector2, level: number = 1) {
    this.id = uuidv4();
    this.name = name;
    this.position = position;
    this.velocity = { x: 0, y: 0 };
    this.rotation = 0;
    this.level = level;
    this.speed = GAME_CONFIG.PLAYER_SPEED * 0.8;
    this.size = GAME_CONFIG.ENEMY_SIZE;
    this.aiState = 'idle';

    // Scale stats with level
    this.maxHealth = 50 + level * 20;
    this.health = this.maxHealth;
    this.damage = 10 + level * 5;
    this.experienceReward = 25 * level;
    this.lootTable = ['gold', 'potion'];

    this.createMesh();
    this.generatePatrolPoints();
  }

  private createMesh(): void {
    const group = new THREE.Group();

    // Body
    const bodyGeometry = new THREE.BoxGeometry(this.size, 0.2, this.size);
    const bodyMaterial = new THREE.MeshBasicMaterial({ color: COLORS.ENEMY });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 0.1;
    group.add(body);

    // Eyes
    const eyeGeometry = new THREE.CircleGeometry(0.1, 8);
    const eyeMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });
    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    leftEye.position.set(-0.15, 0.21, this.size / 3);
    leftEye.rotation.x = -Math.PI / 2;
    group.add(leftEye);

    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    rightEye.position.set(0.15, 0.21, this.size / 3);
    rightEye.rotation.x = -Math.PI / 2;
    group.add(rightEye);

    // Health bar background
    const healthBgGeometry = new THREE.PlaneGeometry(this.size, 0.1);
    const healthBgMaterial = new THREE.MeshBasicMaterial({
      color: COLORS.HEALTH_BAR_BG,
    });
    const healthBg = new THREE.Mesh(healthBgGeometry, healthBgMaterial);
    healthBg.position.set(0, 0.22, -this.size / 2 - 0.2);
    healthBg.rotation.x = -Math.PI / 2;
    group.add(healthBg);

    // Health bar
    const healthGeometry = new THREE.PlaneGeometry(this.size, 0.08);
    const healthMaterial = new THREE.MeshBasicMaterial({
      color: COLORS.HEALTH_BAR_FG,
    });
    const healthBar = new THREE.Mesh(healthGeometry, healthMaterial);
    healthBar.position.set(0, 0.23, -this.size / 2 - 0.2);
    healthBar.rotation.x = -Math.PI / 2;
    healthBar.name = 'healthBar';
    group.add(healthBar);

    group.name = `enemy_${this.id}`;
    this.mesh = group;
  }

  private generatePatrolPoints(): void {
    const numPoints = 3 + Math.floor(Math.random() * 3);
    for (let i = 0; i < numPoints; i++) {
      const angle = (i / numPoints) * Math.PI * 2;
      const radius = 3 + Math.random() * 3;
      this.patrolPoints.push({
        x: this.position.x + Math.cos(angle) * radius,
        y: this.position.y + Math.sin(angle) * radius,
      });
    }
  }

  update(deltaTime: number, playerPosition?: Vector2): void {
    this.attackCooldown = Math.max(0, this.attackCooldown - deltaTime);

    // Update AI behavior
    if (playerPosition) {
      this.updateAI(deltaTime, playerPosition);
    }

    // Update mesh
    if (this.mesh) {
      const healthBar = this.mesh.getObjectByName('healthBar') as THREE.Mesh;
      if (healthBar) {
        const healthPercent = this.health / this.maxHealth;
        healthBar.scale.x = healthPercent;
        healthBar.position.x = (-this.size / 2) * (1 - healthPercent);
      }

      this.mesh.position.set(this.position.x, 0, this.position.y);
      this.mesh.rotation.y = this.rotation;
    }
  }

  private updateAI(deltaTime: number, playerPosition: Vector2): void {
    const distanceToPlayer = Math.sqrt(
      Math.pow(playerPosition.x - this.position.x, 2) +
      Math.pow(playerPosition.y - this.position.y, 2)
    );

    switch (this.aiState) {
      case 'idle':
        this.idleTimer += deltaTime;
        if (distanceToPlayer < this.detectionRange) {
          this.aiState = 'chase';
          this.targetId = 'player';
        } else if (this.idleTimer > 2) {
          this.aiState = 'patrol';
          this.idleTimer = 0;
        }
        break;

      case 'patrol':
        if (distanceToPlayer < this.detectionRange) {
          this.aiState = 'chase';
          this.targetId = 'player';
        } else {
          this.patrolBehavior(deltaTime);
        }
        break;

      case 'chase':
        if (distanceToPlayer > this.detectionRange * 1.5) {
          this.aiState = 'idle';
          this.targetId = undefined;
          this.velocity = { x: 0, y: 0 };
        } else if (distanceToPlayer < this.attackRange) {
          this.aiState = 'attack';
        } else {
          this.chaseBehavior(playerPosition);
        }
        break;

      case 'attack':
        if (distanceToPlayer > this.attackRange * 1.2) {
          this.aiState = 'chase';
        } else {
          this.attackBehavior(deltaTime);
        }
        break;

      case 'flee':
        this.fleeBehavior(playerPosition);
        if (distanceToPlayer > this.detectionRange * 2) {
          this.aiState = 'idle';
        }
        break;
    }
  }

  private patrolBehavior(deltaTime: number): void {
    if (this.patrolPoints.length === 0) {
      this.aiState = 'idle';
      return;
    }

    const target = this.patrolPoints[this.currentPatrolIndex];
    const dx = target.x - this.position.x;
    const dy = target.y - this.position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < 0.5) {
      this.currentPatrolIndex = (this.currentPatrolIndex + 1) % this.patrolPoints.length;
      this.velocity = { x: 0, y: 0 };
    } else {
      const speed = this.speed * 0.5;
      this.velocity = {
        x: (dx / distance) * speed,
        y: (dy / distance) * speed,
      };
      this.rotation = Math.atan2(dy, dx);
    }
  }

  private chaseBehavior(target: Vector2): void {
    const dx = target.x - this.position.x;
    const dy = target.y - this.position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    this.velocity = {
      x: (dx / distance) * this.speed,
      y: (dy / distance) * this.speed,
    };
    this.rotation = Math.atan2(dy, dx);
  }

  private attackBehavior(deltaTime: number): void {
    this.velocity = { x: 0, y: 0 };
    // Attack logic would trigger damage here
    if (this.attackCooldown <= 0) {
      this.attackCooldown = 1.5; // 1.5 second cooldown
      // This would trigger a damage event
    }
  }

  private fleeBehavior(threat: Vector2): void {
    const dx = this.position.x - threat.x;
    const dy = this.position.y - threat.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > 0) {
      this.velocity = {
        x: (dx / distance) * this.speed * 1.2,
        y: (dy / distance) * this.speed * 1.2,
      };
      this.rotation = Math.atan2(dy, dx);
    }
  }

  takeDamage(amount: number): void {
    this.health = Math.max(0, this.health - amount);
    
    if (this.health < this.maxHealth * 0.2) {
      this.aiState = 'flee';
    }
  }

  isDead(): boolean {
    return this.health <= 0;
  }

  canAttack(): boolean {
    return this.attackCooldown <= 0;
  }

  serialize() {
    return {
      id: this.id,
      name: this.name,
      type: this.type,
      position: this.position,
      velocity: this.velocity,
      rotation: this.rotation,
      health: this.health,
      maxHealth: this.maxHealth,
      level: this.level,
      aiState: this.aiState,
    };
  }
}
