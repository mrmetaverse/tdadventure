import React from 'react';
import { useRouter } from 'next/router';

const MainMenu: React.FC = () => {
  const router = useRouter();

  const startGame = () => {
    router.push('/game');
  };

  const joinGame = () => {
    // For now, same as start game
    router.push('/game');
  };

  return (
    <div className="min-h-screen bg-game-bg flex items-center justify-center">
      <div className="text-center space-y-8">
        <div>
          <h1 className="text-6xl font-bold text-game-text mb-2 font-game">
            Topdown Adventure
          </h1>
          <p className="text-game-text opacity-75 text-lg">
            A top-down 2D MMORPG
          </p>
        </div>

        <div className="space-y-4">
          <button
            onClick={startGame}
            className="block w-64 mx-auto px-6 py-4 bg-game-mana hover:bg-blue-600 text-white font-bold rounded-lg transition-colors duration-200 shadow-lg hover:shadow-xl"
          >
            Start Game
          </button>
          <button
            onClick={joinGame}
            className="block w-64 mx-auto px-6 py-4 bg-game-panel hover:bg-gray-700 text-game-text font-bold rounded-lg border-2 border-game-border transition-colors duration-200"
          >
            Join Game
          </button>
        </div>

        <div className="mt-12 text-game-text opacity-50 text-sm">
          <p>Use WASD to move, Mouse to interact</p>
          <p>Press Enter to open chat</p>
        </div>
      </div>
    </div>
  );
};

export default MainMenu;
