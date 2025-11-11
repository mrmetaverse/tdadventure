import React, { useEffect, useRef } from 'react';
import { GameEngine } from '@game/core/GameEngine';

const GameCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<GameEngine | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Initialize game engine
    const engine = new GameEngine(canvas);
    engineRef.current = engine;

    // Start the game
    engine.start();

    // Cleanup on component unmount
    return () => {
      engine.stop();
      engine.dispose();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        display: 'block',
        width: '100%',
        height: '100%',
        cursor: 'crosshair',
      }}
    />
  );
};

export default GameCanvas;
