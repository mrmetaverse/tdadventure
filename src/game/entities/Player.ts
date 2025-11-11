import * as THREE from 'three';
import { Player as PlayerType, Vector2, PlayerStats, Equipment, InventoryItem } from '@types/game';
import { CharacterClass, CharacterRace, Divine, Alignment } from '@types/character';
import { GAME_CONFIG, COLORS, getExperienceForLevel } from '../utils/Constants';
import { getClassData } from '../data/Classes';
import { getRaceData } from '../data/Races';
import { getDivineData } from '../data/Divines';
import { AlignmentSystem } from '../utils/Alignment';
import { SpriteSystem, SpriteAnimation } from '../systems/SpriteSystem';
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
  
  // Character data (optional - formless if not set)
  class?: CharacterClass;
  race?: CharacterRace;
  divine?: Divine;
  alignment?: Alignment;
  isFormless: boolean = false;
  
  // Combat
  attackCooldown: number = 0;
  attackRange: number = 1.5;
  
  // Sprite system
  private spriteSystem: SpriteSystem;
  private spriteAnimation?: SpriteAnimation;
  private currentAnimation: 'idle' | 'walk' | 'attack' = 'idle';
  private animationFrame: number = 0;
  private animationTime: number = 0;
  private spriteMesh?: THREE.Mesh;
  private isGeneratingSprites: boolean = false;

  constructor(
    name: string,
    position: Vector2,
    characterData?: {
      class: CharacterClass;
      race: CharacterRace;
      divine: Divine;
      alignment: Alignment;
      level?: number;
      experience?: number;
    },
    isLocal: boolean = false
  ) {
    this.id = uuidv4();
    this.name = name;
    this.position = position;
    this.velocity = { x: 0, y: 0 };
    this.rotation = 0;
    this.isLocal = isLocal;
    
    // Check if formless (no character data)
    if (!characterData) {
      this.isFormless = true;
      this.level = 0;
      this.experience = 0;
      this.experienceToLevel = 0;
      this.speed = GAME_CONFIG.PLAYER_SPEED;
      this.size = GAME_CONFIG.PLAYER_SIZE * 0.8; // Slightly smaller
      
      // Formless stats - minimal
      this.stats = {
        strength: 0,
        dexterity: 0,
        intelligence: 0,
        vitality: 0,
        attackDamage: 0,
        defense: 0,
        critChance: 0,
        critDamage: 1.0,
      };
      
      this.maxHealth = 1;
      this.health = 1;
      this.maxMana = 0;
      this.mana = 0;
      this.inventory = [];
      this.equipment = {};
      
      this.createFormlessMesh();
      return;
    }
    
    // Has character data - create full character
    this.isFormless = false;
    this.level = characterData.level || 1;
    this.experience = characterData.experience || 0;
    this.experienceToLevel = getExperienceForLevel(this.level + 1);
    this.speed = GAME_CONFIG.PLAYER_SPEED;
    this.size = GAME_CONFIG.PLAYER_SIZE;
    
    // Set character data
    this.class = characterData.class;
    this.race = characterData.race;
    this.divine = characterData.divine;
    this.alignment = { ...characterData.alignment };

    // Calculate stats from class, race, and divine
    const classData = getClassData(characterData.class);
    const raceData = getRaceData(characterData.race);
    const divineData = getDivineData(characterData.divine);

    // Start with base class stats
    this.stats = {
      strength: classData.baseStats.strength || 10,
      dexterity: classData.baseStats.dexterity || 10,
      intelligence: classData.baseStats.intelligence || 10,
      vitality: classData.baseStats.vitality || 10,
      attackDamage: classData.baseStats.attackDamage || 15,
      defense: classData.baseStats.defense || 5,
      critChance: classData.baseStats.critChance || 0.05,
      critDamage: classData.baseStats.critDamage || 1.5,
    };

    // Apply race bonuses
    if (raceData.statBonuses.strength) this.stats.strength += raceData.statBonuses.strength;
    if (raceData.statBonuses.dexterity) this.stats.dexterity += raceData.statBonuses.dexterity;
    if (raceData.statBonuses.intelligence) this.stats.intelligence += raceData.statBonuses.intelligence;
    if (raceData.statBonuses.vitality) this.stats.vitality += raceData.statBonuses.vitality;
    if (raceData.statBonuses.defense) this.stats.defense += raceData.statBonuses.defense || 0;

    // Apply divine bonuses
    if (divineData.bonuses.strength) this.stats.strength += divineData.bonuses.strength;
    if (divineData.bonuses.dexterity) this.stats.dexterity += divineData.bonuses.dexterity;
    if (divineData.bonuses.intelligence) this.stats.intelligence += divineData.bonuses.intelligence;
    if (divineData.bonuses.vitality) this.stats.vitality += divineData.bonuses.vitality;
    if (divineData.bonuses.attackDamage) this.stats.attackDamage += divineData.bonuses.attackDamage || 0;
    if (divineData.bonuses.defense) this.stats.defense += divineData.bonuses.defense || 0;
    if (divineData.bonuses.critChance) this.stats.critChance += divineData.bonuses.critChance || 0;
    if (divineData.bonuses.critDamage) this.stats.critDamage += divineData.bonuses.critDamage || 0;

    // Apply level-based stat growth
    if (this.level > 1) {
      const levelsGained = this.level - 1;
      if (classData.statGrowth.strength) this.stats.strength += classData.statGrowth.strength * levelsGained;
      if (classData.statGrowth.dexterity) this.stats.dexterity += classData.statGrowth.dexterity * levelsGained;
      if (classData.statGrowth.intelligence) this.stats.intelligence += classData.statGrowth.intelligence * levelsGained;
      if (classData.statGrowth.vitality) this.stats.vitality += classData.statGrowth.vitality * levelsGained;
      if (classData.statGrowth.attackDamage) this.stats.attackDamage += classData.statGrowth.attackDamage * levelsGained;
      if (classData.statGrowth.defense) this.stats.defense += classData.statGrowth.defense * levelsGained;
      if (classData.statGrowth.critChance) this.stats.critChance += classData.statGrowth.critChance * levelsGained;
      if (classData.statGrowth.critDamage) this.stats.critDamage += classData.statGrowth.critDamage * levelsGained;
    }

    this.maxHealth = 100 + this.stats.vitality * 10;
    this.health = this.maxHealth;
    this.maxMana = 50 + this.stats.intelligence * 5;
    this.mana = this.maxMana;

    this.inventory = [];
    this.equipment = {};

    this.spriteSystem = new SpriteSystem();
    
    // Generate and load sprites if not formless
    if (!this.isFormless && this.class && this.race && this.divine) {
      this.loadSprites();
    } else {
      this.createMesh();
    }
  }

  /**
   * Load AI-generated sprites for the character
   */
  private async loadSprites(): Promise<void> {
    if (!this.class || !this.race || !this.divine || this.isGeneratingSprites) return;
    
    this.isGeneratingSprites = true;
    
    try {
      // Generate sprites
      this.spriteAnimation = await this.spriteSystem.getCharacterSprites(
        this.class,
        this.race,
        this.divine,
        this.equipment
      );
      
      // Load first frame texture
      if (this.spriteAnimation && this.spriteAnimation.idle.length > 0) {
        const texture = await this.spriteSystem.loadTexture(this.spriteAnimation.idle[0]);
        this.createSpriteMesh(texture);
      }
    } catch (error) {
      console.error('Failed to load sprites:', error);
      // Fallback to basic mesh
      this.createMesh();
    } finally {
      this.isGeneratingSprites = false;
    }
  }

  /**
   * Create sprite-based mesh
   */
  private createSpriteMesh(texture: THREE.Texture): void {
    // Remove old mesh if exists
    if (this.mesh) {
      this.mesh.traverse((child) => {
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

    const group = new THREE.Group();

    // Create sprite mesh
    const spriteGeometry = new THREE.PlaneGeometry(this.size, this.size);
    const spriteMaterial = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      side: THREE.DoubleSide,
    });
    
    this.spriteMesh = new THREE.Mesh(spriteGeometry, spriteMaterial);
    this.spriteMesh.rotation.x = -Math.PI / 2; // Face up for top-down view
    this.spriteMesh.position.y = 0.01;
    group.add(this.spriteMesh);

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

    group.name = `player_${this.id}`;
    this.mesh = group;
  }

  private createFormlessMesh(): void {
    const group = new THREE.Group();

    // Glowing ball of light
    const glowGeometry = new THREE.SphereGeometry(this.size / 2, 16, 16);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.8,
      emissive: 0xffffff,
      emissiveIntensity: 1.0,
    });
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    group.add(glow);

    // Inner core
    const coreGeometry = new THREE.SphereGeometry(this.size / 3, 12, 12);
    const coreMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffaa,
      transparent: true,
      opacity: 0.9,
      emissive: 0xffffaa,
      emissiveIntensity: 1.5,
    });
    const core = new THREE.Mesh(coreGeometry, coreMaterial);
    group.add(core);

    // Pulsing animation
    glow.userData.pulse = true;
    core.userData.pulse = true;

    group.name = `formless_player_${this.id}`;
    this.mesh = group;
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
    // Update attack cooldown
    if (this.attackCooldown > 0) {
      this.attackCooldown = Math.max(0, this.attackCooldown - deltaTime);
    }
    
    if (this.mesh) {
      // Update position
      this.mesh.position.set(this.position.x, 0, this.position.y);
      
      if (this.isFormless) {
        // Animate formless glow
        const time = Date.now() * 0.001;
        this.mesh.children.forEach((child) => {
          if (child.userData.pulse) {
            const scale = 1 + Math.sin(time * 2) * 0.1;
            child.scale.set(scale, scale, scale);
          }
        });
        // Rotate slowly
        this.mesh.rotation.y += deltaTime * 0.5;
      } else {
        // Update sprite animation
        this.updateSpriteAnimation(deltaTime);
        
        // Update health bar
        const healthBar = this.mesh.getObjectByName('healthBar') as THREE.Mesh;
        if (healthBar) {
          const healthPercent = this.health / this.maxHealth;
          healthBar.scale.x = healthPercent;
          healthBar.position.x = (-this.size / 2) * (1 - healthPercent);
        }
        
        // Update sprite rotation to face movement direction
        if (this.spriteMesh) {
          this.spriteMesh.rotation.z = this.rotation;
        }
      }
    }
  }

  /**
   * Update sprite animation frames
   */
  private updateSpriteAnimation(deltaTime: number): void {
    if (!this.spriteAnimation || !this.spriteMesh) return;

    // Determine current animation state
    const isMoving = this.velocity.x !== 0 || this.velocity.y !== 0;
    const isAttacking = this.attackCooldown > 0.4; // Show attack animation during cooldown
    
    let targetAnimation: 'idle' | 'walk' | 'attack' = 'idle';
    if (isAttacking) {
      targetAnimation = 'attack';
    } else if (isMoving) {
      targetAnimation = 'walk';
    }

    // Switch animation if needed
    if (targetAnimation !== this.currentAnimation) {
      this.currentAnimation = targetAnimation;
      this.animationFrame = 0;
      this.animationTime = 0;
    }

    // Update animation frame
    const frames = this.spriteAnimation[this.currentAnimation];
    if (frames && frames.length > 0) {
      this.animationTime += deltaTime;
      const frameRate = 0.2; // 5 frames per second
      
      if (this.animationTime >= frameRate) {
        this.animationTime = 0;
        this.animationFrame = (this.animationFrame + 1) % frames.length;
        
        // Update texture
        this.spriteSystem.loadTexture(frames[this.animationFrame]).then((texture) => {
          if (this.spriteMesh && this.spriteMesh.material instanceof THREE.MeshBasicMaterial) {
            if (this.spriteMesh.material.map) {
              this.spriteMesh.material.map.dispose();
            }
            this.spriteMesh.material.map = texture;
            this.spriteMesh.material.needsUpdate = true;
          }
        });
      }
    }
  }

  attack(target: Vector2, entities: Map<string, Entity>): boolean {
    if (this.isFormless || this.attackCooldown > 0) return false;
    
    // Calculate direction to target
    const dx = target.x - this.position.x;
    const dy = target.y - this.position.y;
    
    // Update rotation to face attack direction
    this.rotation = Math.atan2(dy, dx);
    
    // Check for enemies in attack range
    let hit = false;
    entities.forEach((entity) => {
      if (entity.type === 'enemy' && entity.id !== this.id) {
        const entityDx = entity.position.x - this.position.x;
        const entityDy = entity.position.y - this.position.y;
        const entityDistance = Math.sqrt(entityDx * entityDx + entityDy * entityDy);
        
        if (entityDistance <= this.attackRange) {
          // Deal damage - import Enemy type properly
          const enemy = entity as any; // Enemy type
          const damage = this.stats.attackDamage;
          
          // Check for critical hit
          const isCrit = Math.random() < this.stats.critChance;
          const finalDamage = isCrit ? damage * this.stats.critDamage : damage;
          
          if (enemy.takeDamage) {
            enemy.takeDamage(finalDamage);
            hit = true;
            
            // Gain experience if enemy dies
            if (enemy.isDead && enemy.isDead() && enemy.experienceReward) {
              this.gainExperience(enemy.experienceReward);
            }
          }
        }
      }
    });
    
    if (hit) {
      this.attackCooldown = 0.5; // 0.5 second attack cooldown
      return true;
    }
    
    return false;
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

    // Increase stats based on class growth
    const classData = getClassData(this.class);
    if (classData.statGrowth.strength) this.stats.strength += classData.statGrowth.strength;
    if (classData.statGrowth.dexterity) this.stats.dexterity += classData.statGrowth.dexterity;
    if (classData.statGrowth.intelligence) this.stats.intelligence += classData.statGrowth.intelligence;
    if (classData.statGrowth.vitality) this.stats.vitality += classData.statGrowth.vitality;
    if (classData.statGrowth.attackDamage) this.stats.attackDamage += classData.statGrowth.attackDamage;
    if (classData.statGrowth.defense) this.stats.defense += classData.statGrowth.defense;
    if (classData.statGrowth.critChance) this.stats.critChance += classData.statGrowth.critChance;
    if (classData.statGrowth.critDamage) this.stats.critDamage += classData.statGrowth.critDamage;

    // Human racial bonus: +1 to all stats per 5 levels
    if (this.race === 'human' && this.level % 5 === 0) {
      this.stats.strength += 1;
      this.stats.dexterity += 1;
      this.stats.intelligence += 1;
      this.stats.vitality += 1;
    }

    // Update max health and mana
    const oldMaxHealth = this.maxHealth;
    const oldMaxMana = this.maxMana;
    this.maxHealth = 100 + this.stats.vitality * 10;
    this.maxMana = 50 + this.stats.intelligence * 5;

    // Restore health and mana by the increase amount
    this.health += this.maxHealth - oldMaxHealth;
    this.mana += this.maxMana - oldMaxMana;
  }

  adjustAlignment(lawfulChange: number, goodChange: number): void {
    if (!this.alignment) return;
    this.alignment = AlignmentSystem.adjustAlignment(this.alignment, lawfulChange, goodChange);
  }

  getAlignmentName(): string {
    if (!this.alignment) return 'Formless';
    return AlignmentSystem.getAlignmentName(this.alignment);
  }

  // Transform from formless to character
  transformToCharacter(characterData: {
    class: CharacterClass;
    race: CharacterRace;
    divine: Divine;
    alignment: Alignment;
    name: string;
  }): void {
    if (!this.isFormless) return;

    this.isFormless = false;
    this.name = characterData.name;
    this.class = characterData.class;
    this.race = characterData.race;
    this.divine = characterData.divine;
    this.alignment = { ...characterData.alignment };
    this.level = 1;
    this.experience = 0;
    this.experienceToLevel = getExperienceForLevel(2);

    // Calculate stats
    const classData = getClassData(characterData.class);
    const raceData = getRaceData(characterData.race);
    const divineData = getDivineData(characterData.divine);

    this.stats = {
      strength: classData.baseStats.strength || 10,
      dexterity: classData.baseStats.dexterity || 10,
      intelligence: classData.baseStats.intelligence || 10,
      vitality: classData.baseStats.vitality || 10,
      attackDamage: classData.baseStats.attackDamage || 15,
      defense: classData.baseStats.defense || 5,
      critChance: classData.baseStats.critChance || 0.05,
      critDamage: classData.baseStats.critDamage || 1.5,
    };

    // Apply bonuses
    if (raceData.statBonuses.strength) this.stats.strength += raceData.statBonuses.strength;
    if (raceData.statBonuses.dexterity) this.stats.dexterity += raceData.statBonuses.dexterity;
    if (raceData.statBonuses.intelligence) this.stats.intelligence += raceData.statBonuses.intelligence;
    if (raceData.statBonuses.vitality) this.stats.vitality += raceData.statBonuses.vitality;
    if (raceData.statBonuses.defense) this.stats.defense += raceData.statBonuses.defense || 0;

    if (divineData.bonuses.strength) this.stats.strength += divineData.bonuses.strength;
    if (divineData.bonuses.dexterity) this.stats.dexterity += divineData.bonuses.dexterity;
    if (divineData.bonuses.intelligence) this.stats.intelligence += divineData.bonuses.intelligence;
    if (divineData.bonuses.vitality) this.stats.vitality += divineData.bonuses.vitality;
    if (divineData.bonuses.attackDamage) this.stats.attackDamage += divineData.bonuses.attackDamage || 0;
    if (divineData.bonuses.defense) this.stats.defense += divineData.bonuses.defense || 0;
    if (divineData.bonuses.critChance) this.stats.critChance += divineData.bonuses.critChance || 0;
    if (divineData.bonuses.critDamage) this.stats.critDamage += divineData.bonuses.critDamage || 0;

    this.maxHealth = 100 + this.stats.vitality * 10;
    this.health = this.maxHealth;
    this.maxMana = 50 + this.stats.intelligence * 5;
    this.mana = this.maxMana;
    this.size = GAME_CONFIG.PLAYER_SIZE;

    // Replace mesh - need to remove old and add new to scene
    if (this.mesh && this.mesh.parent) {
      // Remove from parent
      const parent = this.mesh.parent;
      parent.remove(this.mesh);
      
      // Dispose old mesh
      this.mesh.traverse((child) => {
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

    // Initialize sprite system
    this.spriteSystem = new SpriteSystem();
    
    // Generate and load sprites for the new character
    this.loadSprites();
    
    // Add new mesh to scene if we had a parent
    if (this.mesh && this.mesh.parent === null && parent) {
      parent.add(this.mesh);
    }
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
      class: this.class,
      race: this.race,
      divine: this.divine,
      alignment: this.alignment,
    };
  }
}
