import React, { useEffect, useRef } from 'react';
import GameUI from '../components/game/GameUI';
import { useGameStore } from '../store/gameStore';
import { GameEngine } from '../game/core/GameEngine';

const GamePage: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const { setPlayer, setConnected, setEntities } = useGameStore();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Initialize game engine
    const engine = new GameEngine(canvas);
    engineRef.current = engine;

    // Sync game state with Zustand store
    const syncInterval = setInterval(() => {
      const gameState = engine.getGameState();
      const localPlayer = engine.getLocalPlayer();
      const entities = Array.from(engine.getEntities().values());

      if (localPlayer) {
        setPlayer(localPlayer);
      }

      // Update entities in store for UI (minimap, etc.)
      setEntities(entities);
    }, 100);

    // Start the game
    engine.start();

    // Cleanup on component unmount
    return () => {
      clearInterval(syncInterval);
      engine.stop();
      engine.dispose();
      setPlayer(null);
    };
    }, [setPlayer, setConnected, setEntities]);

  return (
    <div className="game-container relative w-screen h-screen overflow-hidden">
      <canvas
        ref={canvasRef}
        className="absolute inset-0"
        style={{
          display: 'block',
          width: '100%',
          height: '100%',
          cursor: 'crosshair',
        }}
      />
      <GameUI />
    </div>
  );
};

export default GamePage;
