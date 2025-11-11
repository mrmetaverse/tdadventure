import React, { useEffect, useRef, useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { Vector2 } from '@types/game';

const Minimap: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { player, entities } = useGameStore();
  const [worldSize, setWorldSize] = useState<Vector2>({ x: 100, y: 100 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !player) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = 200;
    canvas.width = size;
    canvas.height = size;

    const scaleX = size / worldSize.x;
    const scaleY = size / worldSize.y;

    // Clear canvas
    ctx.fillStyle = '#1a1f2e';
    ctx.fillRect(0, 0, size, size);

    // Draw grid
    ctx.strokeStyle = '#2d3748';
    ctx.lineWidth = 1;
    for (let x = 0; x <= worldSize.x; x += 10) {
      ctx.beginPath();
      ctx.moveTo(x * scaleX, 0);
      ctx.lineTo(x * scaleX, size);
      ctx.stroke();
    }
    for (let y = 0; y <= worldSize.y; y += 10) {
      ctx.beginPath();
      ctx.moveTo(0, y * scaleY);
      ctx.lineTo(size, y * scaleY);
      ctx.stroke();
    }

    // Draw entities
    entities.forEach((entity) => {
      const x = entity.position.x * scaleX;
      const y = entity.position.y * scaleY;

      if (entity.type === 'player') {
        ctx.fillStyle = entity.isLocal ? '#10b981' : '#3b82f6';
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fill();
      } else if (entity.type === 'enemy') {
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(x - 2, y - 2, 4, 4);
      } else if (entity.type === 'npc') {
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.arc(x, y, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // Draw player (on top)
    if (player) {
      const x = player.position.x * scaleX;
      const y = player.position.y * scaleY;

      // Draw direction indicator
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(
        x + Math.cos(player.rotation) * 5,
        y + Math.sin(player.rotation) * 5
      );
      ctx.stroke();

      // Draw player
      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // Draw viewport indicator
    const viewportSize = 10;
    const viewportX = (player.position.x - viewportSize / 2) * scaleX;
    const viewportY = (player.position.y - viewportSize / 2) * scaleY;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    ctx.strokeRect(viewportX, viewportY, viewportSize * scaleX, viewportSize * scaleY);
    ctx.setLineDash([]);
  }, [player, entities, worldSize]);

  return (
    <div className="fixed top-4 right-4 z-50 pointer-events-auto">
      <div className="bg-game-panel border-2 border-game-border rounded-lg p-2 shadow-2xl">
        <div className="text-game-text text-xs font-bold mb-2 text-center">Minimap</div>
        <canvas
          ref={canvasRef}
          className="border border-game-border rounded"
          style={{ display: 'block' }}
        />
      </div>
    </div>
  );
};

export default Minimap;

