import * as THREE from 'three';
import { Entity, Vector2, InventoryItem } from '../../types/game';
import { GAME_CONFIG, COLORS, RARITY_COLORS } from '../utils/Constants';
import { v4 as uuidv4 } from 'uuid';

/**
 * Represents an item dropped on the ground
 */
export class DroppedItem implements Entity {
  id: string;
  type: 'dropped_item' = 'dropped_item';
  position: Vector2;
  velocity: Vector2 = { x: 0, y: 0 };
  rotation: number = 0;
  size: number = 0.5;
  mesh?: THREE.Group;
  
  item: InventoryItem;
  pickupRange: number = 1.0;
  lifetime: number = 300; // 5 minutes in seconds
  age: number = 0;

  constructor(item: InventoryItem, position: Vector2) {
    this.id = uuidv4();
    this.item = item;
    this.position = position;
    this.createMesh();
  }

  private createMesh(): void {
    const group = new THREE.Group();

    // Item base (colored based on rarity)
    const rarityColor = RARITY_COLORS[this.item.rarity] || '#9ca3af';
    const baseGeometry = new THREE.CylinderGeometry(this.size / 2, this.size / 2, 0.1, 8);
    const baseMaterial = new THREE.MeshBasicMaterial({ 
      color: rarityColor,
      transparent: true,
      opacity: 0.8,
    });
    const base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.rotation.x = Math.PI / 2;
    base.position.y = 0.05;
    group.add(base);

    // Glow effect for rare+ items
    if (this.item.rarity !== 'common' && this.item.rarity !== 'uncommon') {
      const glowGeometry = new THREE.RingGeometry(this.size / 2, this.size / 2 + 0.1, 16);
      const glowMaterial = new THREE.MeshBasicMaterial({
        color: rarityColor,
        transparent: true,
        opacity: 0.5,
        side: THREE.DoubleSide,
      });
      const glow = new THREE.Mesh(glowGeometry, glowMaterial);
      glow.rotation.x = -Math.PI / 2;
      glow.position.y = 0.06;
      glow.name = 'glow';
      group.add(glow);
    }

    // Item icon placeholder (text sprite)
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      // Draw item type icon
      const icon = this.getItemIcon();
      ctx.fillText(icon, 32, 32);
      
      const texture = new THREE.CanvasTexture(canvas);
      texture.magFilter = THREE.NearestFilter;
      texture.minFilter = THREE.NearestFilter;
      
      const iconGeometry = new THREE.PlaneGeometry(0.3, 0.3);
      const iconMaterial = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
      });
      const iconMesh = new THREE.Mesh(iconGeometry, iconMaterial);
      iconMesh.rotation.x = -Math.PI / 2;
      iconMesh.position.y = 0.11;
      group.add(iconMesh);
    }

    // Floating animation
    group.userData.floatOffset = Math.random() * Math.PI * 2;
    group.userData.floatSpeed = 0.5 + Math.random() * 0.5;

    group.name = `dropped_item_${this.id}`;
    this.mesh = group;
  }

  private getItemIcon(): string {
    switch (this.item.type) {
      case 'weapon': return '⚔️';
      case 'armor': return '🛡️';
      case 'consumable': return '🧪';
      case 'material': return '💎';
      case 'quest': return '📜';
      default: return '📦';
    }
  }

  update(deltaTime: number): void {
    this.age += deltaTime;

    if (this.mesh) {
      // Floating animation
      const floatOffset = this.mesh.userData.floatOffset || 0;
      const floatSpeed = this.mesh.userData.floatSpeed || 1;
      const floatAmount = Math.sin((this.age * floatSpeed) + floatOffset) * 0.1;
      this.mesh.position.y = floatAmount + 0.1;

      // Rotation animation
      this.mesh.rotation.y += deltaTime * 0.5;

      // Update position
      this.mesh.position.x = this.position.x;
      this.mesh.position.z = this.position.y;

      // Pulsing glow for rare+ items
      if (this.item.rarity !== 'common' && this.item.rarity !== 'uncommon') {
        const glow = this.mesh.getObjectByName('glow') as THREE.Mesh;
        if (glow && glow.material instanceof THREE.MeshBasicMaterial) {
          const pulse = (Math.sin(this.age * 2) + 1) / 2;
          glow.material.opacity = 0.3 + pulse * 0.3;
        }
      }
    }
  }

  /**
   * Check if item should despawn (lifetime expired)
   */
  shouldDespawn(): boolean {
    return this.age >= this.lifetime;
  }

  /**
   * Check if player is in pickup range
   */
  canPickup(playerPosition: Vector2): boolean {
    const dx = playerPosition.x - this.position.x;
    const dy = playerPosition.y - this.position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance <= this.pickupRange;
  }

  dispose(): void {
    if (this.mesh) {
      this.mesh.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
          if (child.material instanceof THREE.Material) {
            if (Array.isArray(child.material)) {
              child.material.forEach((mat) => mat.dispose());
            } else {
              child.material.dispose();
            }
          }
        }
      });
    }
  }
}

