import * as THREE from 'three';
import { Player as PlayerType, Vector2, PlayerStats, Equipment, InventoryItem } from '@types/game';
import { GAME_CONFIG, COLORS, getExperienceForLevel } from '../utils/Constants';
import { v4 as uuidv4 } from 'uuid';

export class Player implements PlayerType {
  id: string;
  type: 'player' = 'player';
  name: string;
  position: Vector2;
  velocity: Vector2;
  rotation: number;
  health: number;
  maxHealth: number;
  mana: number;
  maxMana: number;
  level: number;
  experience: number;
  experienceToLevel: number;
  speed: number;
  size: number;
  inventory: InventoryItem[];
  equipment: Equipment;
  stats: PlayerStats;
  isLocal: boolean;
  mesh?: THREE.Group;

  constructor(name: string, position: Vector2, isLocal: boolean = false) {
    this.id = uuidv4();
    this.name = name;
    this.position = position;
    this.velocity = { x: 0, y: 0 };
    this.rotation = 0;
    this.level = 1;
    this.experience = 0;
    this.experienceToLevel = getExperienceForLevel(2);
    this.speed = GAME_CONFIG.PLAYER_SPEED;
    this.size = GAME_CONFIG.PLAYER_SIZE;
    this.isLocal = isLocal;
    
    this.stats = {
      strength: 10,
      dexterity: 10,
      intelligence: 10,
      vitality: 10,
      attackDamage: 15,
      defense: 5,
      critChance: 0.05,
      critDamage: 1.5,
    };

    this.maxHealth = 100 + this.stats.vitality * 10;
    this.health = this.maxHealth;
    this.maxMana = 50 + this.stats.intelligence * 5;
    this.mana = this.maxMana;

    this.inventory = [];
    this.equipment = {};

    this.createMesh();
  }

  private createMesh(): void {
    const group = new THREE.Group();

    // Body
    const bodyGeometry = new THREE.CircleGeometry(this.size / 2, 8);
    const bodyMaterial = new THREE.MeshBasicMaterial({
      color: this.isLocal ? COLORS.PLAYER_LOCAL : COLORS.PLAYER,
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.rotation.x = -Math.PI / 2;
    group.add(body);

    // Direction indicator
    const arrowGeometry = new THREE.ConeGeometry(this.size / 4, this.size / 2, 3);
    const arrowMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const arrow = new THREE.Mesh(arrowGeometry, arrowMaterial);
    arrow.rotation.x = -Math.PI / 2;
    arrow.position.set(this.size / 3, 0.01, 0);
    group.add(arrow);

    // Health bar background
    const healthBgGeometry = new THREE.PlaneGeometry(this.size, 0.1);
    const healthBgMaterial = new THREE.MeshBasicMaterial({
      color: COLORS.HEALTH_BAR_BG,
    });
    const healthBg = new THREE.Mesh(healthBgGeometry, healthBgMaterial);
    healthBg.position.set(0, 0.02, -this.size / 2 - 0.2);
    healthBg.rotation.x = -Math.PI / 2;
    group.add(healthBg);

    // Health bar
    const healthGeometry = new THREE.PlaneGeometry(this.size, 0.08);
    const healthMaterial = new THREE.MeshBasicMaterial({
      color: COLORS.HEALTH_BAR_FG,
    });
    const healthBar = new THREE.Mesh(healthGeometry, healthMaterial);
    healthBar.position.set(0, 0.03, -this.size / 2 - 0.2);
    healthBar.rotation.x = -Math.PI / 2;
    healthBar.name = 'healthBar';
    group.add(healthBar);

    // Name tag (will be replaced with sprite/text in production)
    group.name = `player_${this.id}`;
    this.mesh = group;
  }

  update(deltaTime: number): void {
    // Update health bar
    if (this.mesh) {
      const healthBar = this.mesh.getObjectByName('healthBar') as THREE.Mesh;
      if (healthBar) {
        const healthPercent = this.health / this.maxHealth;
        healthBar.scale.x = healthPercent;
        healthBar.position.x = (-this.size / 2) * (1 - healthPercent);
      }

      // Update position
      this.mesh.position.set(this.position.x, 0, this.position.y);
      
      // Update rotation (rotate the arrow indicator)
      const arrow = this.mesh.children[1];
      if (arrow) {
        arrow.rotation.z = this.rotation;
      }
    }
  }

  takeDamage(amount: number): void {
    const actualDamage = Math.max(1, amount - this.stats.defense);
    this.health = Math.max(0, this.health - actualDamage);
  }

  heal(amount: number): void {
    this.health = Math.min(this.maxHealth, this.health + amount);
  }

  useMana(amount: number): boolean {
    if (this.mana >= amount) {
      this.mana -= amount;
      return true;
    }
    return false;
  }

  restoreMana(amount: number): void {
    this.mana = Math.min(this.maxMana, this.mana + amount);
  }

  gainExperience(amount: number): void {
    this.experience += amount;

    while (this.experience >= this.experienceToLevel) {
      this.levelUp();
    }
  }

  private levelUp(): void {
    this.experience -= this.experienceToLevel;
    this.level++;
    this.experienceToLevel = getExperienceForLevel(this.level + 1);

    // Increase stats
    this.stats.strength += 2;
    this.stats.dexterity += 2;
    this.stats.intelligence += 2;
    this.stats.vitality += 2;
    this.stats.attackDamage += 5;
    this.stats.defense += 2;

    // Update max health and mana
    const oldMaxHealth = this.maxHealth;
    const oldMaxMana = this.maxMana;
    this.maxHealth = 100 + this.stats.vitality * 10;
    this.maxMana = 50 + this.stats.intelligence * 5;

    // Restore health and mana by the increase amount
    this.health += this.maxHealth - oldMaxHealth;
    this.mana += this.maxMana - oldMaxMana;
  }

  addItem(item: InventoryItem): void {
    const existingItem = this.inventory.find((i) => i.id === item.id);
    if (existingItem) {
      existingItem.quantity += item.quantity;
    } else {
      this.inventory.push(item);
    }
  }

  removeItem(itemId: string, quantity: number = 1): boolean {
    const item = this.inventory.find((i) => i.id === itemId);
    if (!item || item.quantity < quantity) return false;

    item.quantity -= quantity;
    if (item.quantity <= 0) {
      this.inventory = this.inventory.filter((i) => i.id !== itemId);
    }
    return true;
  }

  isDead(): boolean {
    return this.health <= 0;
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
      mana: this.mana,
      maxMana: this.maxMana,
      level: this.level,
      experience: this.experience,
      isLocal: this.isLocal,
    };
  }
}
