import { Entity, Vector2, Zone } from '@types/game';
import { TILE_TYPES } from '../utils/Constants';
import { Vector2 as Vec2 } from '../utils/Vector2';

export class CollisionSystem {
  private currentZone: Zone | null = null;

  setZone(zone: Zone): void {
    this.currentZone = zone;
  }

  checkEntityCollision(entity1: Entity, entity2: Entity): boolean {
    const distance = Vec2.distance(entity1.position, entity2.position);
    const minDistance = (entity1.size + entity2.size) / 2;
    return distance < minDistance;
  }

  checkTileCollision(position: Vector2, entitySize: number): boolean {
    if (!this.currentZone) return false;

    const halfSize = entitySize / 2;
    const corners = [
      { x: position.x - halfSize, y: position.y - halfSize },
      { x: position.x + halfSize, y: position.y - halfSize },
      { x: position.x - halfSize, y: position.y + halfSize },
      { x: position.x + halfSize, y: position.y + halfSize },
    ];

    for (const corner of corners) {
      const tileX = Math.floor(corner.x);
      const tileY = Math.floor(corner.y);

      if (
        tileX < 0 ||
        tileY < 0 ||
        tileY >= this.currentZone.tiles.length ||
        tileX >= this.currentZone.tiles[0].length
      ) {
        return true; // Out of bounds
      }

      const tileId = this.currentZone.tiles[tileY][tileX];
      const tile = TILE_TYPES[tileId];

      if (!tile || !tile.walkable) {
        return true; // Collision with unwalkable tile
      }
    }

    return false;
  }

  resolveCollision(entity: Entity, newPosition: Vector2): Vector2 {
    // Try full movement
    if (!this.checkTileCollision(newPosition, entity.size)) {
      return newPosition;
    }

    // Try X-only movement
    const xOnly: Vector2 = { x: newPosition.x, y: entity.position.y };
    if (!this.checkTileCollision(xOnly, entity.size)) {
      return xOnly;
    }

    // Try Y-only movement
    const yOnly: Vector2 = { x: entity.position.x, y: newPosition.y };
    if (!this.checkTileCollision(yOnly, entity.size)) {
      return yOnly;
    }

    // No movement possible
    return entity.position;
  }

  getEntitiesInRadius(
    position: Vector2,
    radius: number,
    entities: Map<string, Entity>,
    excludeId?: string
  ): Entity[] {
    const result: Entity[] = [];
    const radiusSquared = radius * radius;

    entities.forEach((entity) => {
      if (entity.id === excludeId) return;

      const distSquared = Vec2.from(position).distanceSquared(entity.position);
      if (distSquared <= radiusSquared) {
        result.push(entity);
      }
    });

    return result;
  }

  raycast(from: Vector2, to: Vector2): boolean {
    const direction = Vec2.from(to).subtract(from);
    const distance = direction.length();
    const normalized = direction.normalize();

    const steps = Math.ceil(distance * 10);
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const point = Vec2.from(from).add(normalized.multiply(distance * t));

      if (this.checkTileCollision(point, 0.1)) {
        return true; // Hit something
      }
    }

    return false; // Clear path
  }

  isPositionValid(position: Vector2, entitySize: number): boolean {
    return !this.checkTileCollision(position, entitySize);
  }

  clampToWorld(position: Vector2): Vector2 {
    if (!this.currentZone) return position;

    return {
      x: Math.max(0, Math.min(this.currentZone.size.x - 1, position.x)),
      y: Math.max(0, Math.min(this.currentZone.size.y - 1, position.y)),
    };
  }
}
