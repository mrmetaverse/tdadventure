import React, { useEffect, useRef, useState } from 'react';
import GameUI from '../components/game/GameUI';
import { useGameStore } from '../store/gameStore';
import { useCharacterStore } from '../store/characterStore';
import { GameEngine } from '../game/core/GameEngine';
import InGameCharacterCreation from '../components/game/InGameCharacterCreation';
import Inventory from '../components/game/Inventory';
import { CharacterCreationData } from '@types/character';

const GamePage: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const { setPlayer, setConnected, setEntities } = useGameStore();
  const { getSelectedCharacter, createCharacter } = useCharacterStore();
  const [showCharacterCreation, setShowCharacterCreation] = useState(false);
  const [showInventory, setShowInventory] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Get selected character (optional - can be formless)
    const character = getSelectedCharacter();

    // Initialize game engine (with or without character)
    const engine = new GameEngine(canvas, character || undefined);
    engineRef.current = engine;

    // Check if player is formless and show creation UI
    const checkFormless = () => {
      const localPlayer = engine.getLocalPlayer();
      if (localPlayer?.isFormless && !showCharacterCreation) {
        setShowCharacterCreation(true);
      }
    };

    // Check after a short delay to let engine initialize
    setTimeout(checkFormless, 100);

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
    }, [setPlayer, setConnected, setEntities, getSelectedCharacter, showCharacterCreation]);

  const handleCreateCharacter = (data: CharacterCreationData) => {
    // Create character in store
    const character = createCharacter(data);
    
    // Transform the formless player to the character
    if (engineRef.current) {
      const localPlayer = engineRef.current.getLocalPlayer();
      if (localPlayer?.isFormless) {
        localPlayer.transformToCharacter({
          class: data.class,
          race: data.race,
          divine: data.divine,
          alignment: data.startingAlignment,
          name: data.name,
        });
      }
    }
    
    setShowCharacterCreation(false);
  };

  const handleKeyPress = (e: KeyboardEvent) => {
    // Press 'C' to open character creation if formless
    if (e.key === 'c' || e.key === 'C') {
      if (engineRef.current) {
        const localPlayer = engineRef.current.getLocalPlayer();
        if (localPlayer?.isFormless) {
          setShowCharacterCreation(true);
        }
      }
    }
    
    // Press 'I' to toggle inventory
    if (e.key === 'i' || e.key === 'I') {
      if (engineRef.current) {
        const localPlayer = engineRef.current.getLocalPlayer();
        if (localPlayer && !localPlayer.isFormless) {
          setShowInventory((prev) => !prev);
        }
      }
    }
    
    // Press 'Escape' to close inventory
    if (e.key === 'Escape') {
      setShowInventory(false);
      setShowCharacterCreation(false);
    }
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

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
      {showCharacterCreation && (
        <InGameCharacterCreation
          onCreate={handleCreateCharacter}
          onClose={() => setShowCharacterCreation(false)}
        />
      )}
      <Inventory isOpen={showInventory} onClose={() => setShowInventory(false)} />
      {engineRef.current?.getLocalPlayer()?.isFormless && !showCharacterCreation && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-40 bg-game-panel border-2 border-game-border rounded-lg p-3 shadow-2xl">
          <div className="text-game-text text-sm text-center">
            Press <strong className="text-game-mana">C</strong> to create your character
          </div>
        </div>
      )}
    </div>
  );
};

export default GamePage;
