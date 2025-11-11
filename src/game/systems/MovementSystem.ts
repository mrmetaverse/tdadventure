import { Entity, Vector2 } from '@types/game';
import { CollisionSystem } from './CollisionSystem';
import { Vector2 as Vec2 } from '../utils/Vector2';

export class MovementSystem {
  private collisionSystem: CollisionSystem;

  constructor(collisionSystem: CollisionSystem) {
    this.collisionSystem = collisionSystem;
  }

  updateEntity(entity: Entity, deltaTime: number): void {
    if (entity.velocity.x === 0 && entity.velocity.y === 0) return;

    const newPosition: Vector2 = {
      x: entity.position.x + entity.velocity.x * deltaTime,
      y: entity.position.y + entity.velocity.y * deltaTime,
    };

    // Resolve collision and update position
    entity.position = this.collisionSystem.resolveCollision(entity, newPosition);

    // Update rotation based on velocity
    if (entity.velocity.x !== 0 || entity.velocity.y !== 0) {
      entity.rotation = Math.atan2(entity.velocity.y, entity.velocity.x);
    }
  }

  setVelocity(entity: Entity, direction: Vector2, speed: number): void {
    const length = Math.sqrt(direction.x * direction.x + direction.y * direction.y);
    
    if (length > 0) {
      entity.velocity = {
        x: (direction.x / length) * speed,
        y: (direction.y / length) * speed,
      };
    } else {
      entity.velocity = { x: 0, y: 0 };
    }
  }

  moveTowards(entity: Entity, target: Vector2, speed: number, deltaTime: number): boolean {
    const direction = Vec2.from(target).subtract(entity.position);
    const distance = direction.length();

    if (distance < 0.1) {
      entity.velocity = { x: 0, y: 0 };
      return true; // Reached target
    }

    const normalized = direction.normalize();
    this.setVelocity(entity, normalized, speed);
    this.updateEntity(entity, deltaTime);

    return false;
  }

  stopEntity(entity: Entity): void {
    entity.velocity = { x: 0, y: 0 };
  }

  applyForce(entity: Entity, force: Vector2): void {
    entity.velocity = {
      x: entity.velocity.x + force.x,
      y: entity.velocity.y + force.y,
    };
  }

  applyFriction(entity: Entity, friction: number, deltaTime: number): void {
    const damping = Math.max(0, 1 - friction * deltaTime);
    entity.velocity = {
      x: entity.velocity.x * damping,
      y: entity.velocity.y * damping,
    };

    // Stop if velocity is very small
    if (Math.abs(entity.velocity.x) < 0.01) entity.velocity.x = 0;
    if (Math.abs(entity.velocity.y) < 0.01) entity.velocity.y = 0;
  }
}
