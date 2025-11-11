import React from 'react';
import { useRouter } from 'next/router';

const Home: React.FC = () => {
  const router = useRouter();

  const handleJoinGame = () => {
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
            onClick={handleJoinGame}
            className="block w-64 mx-auto px-6 py-4 bg-game-mana hover:bg-blue-600 text-white font-bold rounded-lg transition-colors duration-200 shadow-lg hover:shadow-xl"
          >
            Join Game
          </button>
          <p className="text-game-text opacity-50 text-sm">
            Create your character once you&apos;re in the world
          </p>
        </div>
      </div>
    </div>
  );
};

export default Home;
