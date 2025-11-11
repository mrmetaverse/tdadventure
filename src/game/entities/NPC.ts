import * as THREE from 'three';
import { NPC as NPCType, Vector2 } from '../../types/game';
import { GAME_CONFIG, COLORS } from '../utils/Constants';
import { v4 as uuidv4 } from 'uuid';

export class NPC implements NPCType {
  id: string;
  type: 'npc' = 'npc';
  name: string;
  position: Vector2;
  velocity: Vector2;
  rotation: number;
  health: number;
  maxHealth: number;
  speed: number;
  size: number;
  dialogue: string[];
  questId?: string;
  mesh?: THREE.Group;

  constructor(name: string, position: Vector2, dialogue: string[] = [], questId?: string) {
    this.id = uuidv4();
    this.name = name;
    this.position = position;
    this.velocity = { x: 0, y: 0 };
    this.rotation = 0;
    this.speed = 0;
    this.size = GAME_CONFIG.NPC_SIZE;
    this.health = 100;
    this.maxHealth = 100;
    this.dialogue = dialogue;
    this.questId = questId;

    this.createMesh();
  }

  private createMesh(): void {
    const group = new THREE.Group();

    // Body
    const bodyGeometry = new THREE.CylinderGeometry(this.size / 2, this.size / 2, 0.8, 6);
    const bodyMaterial = new THREE.MeshBasicMaterial({ color: COLORS.NPC });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 0.4;
    group.add(body);

    // Quest marker (if has quest)
    if (this.questId) {
      const markerGeometry = new THREE.ConeGeometry(0.2, 0.4, 3);
      const markerMaterial = new THREE.MeshBasicMaterial({ color: 0xffd700 });
      const marker = new THREE.Mesh(markerGeometry, markerMaterial);
      marker.position.set(0, 1.2, 0);
      marker.name = 'questMarker';
      group.add(marker);

      // Animate quest marker
      marker.userData.animate = true;
    }

    group.name = `npc_${this.id}`;
    this.mesh = group;
  }

  update(deltaTime: number): void {
    if (this.mesh) {
      this.mesh.position.set(this.position.x, 0, this.position.y);
      this.mesh.rotation.y = this.rotation;

      // Animate quest marker
      const questMarker = this.mesh.getObjectByName('questMarker');
      if (questMarker && questMarker.userData.animate) {
        questMarker.position.y = 1.2 + Math.sin(Date.now() * 0.003) * 0.1;
        questMarker.rotation.y += deltaTime * 2;
      }
    }
  }

  interact(): string {
    if (this.dialogue.length === 0) {
      return `${this.name} has nothing to say.`;
    }
    return this.dialogue[Math.floor(Math.random() * this.dialogue.length)];
  }

  serialize() {
    return {
      id: this.id,
      name: this.name,
      type: this.type,
      position: this.position,
      rotation: this.rotation,
      questId: this.questId,
    };
  }
}
