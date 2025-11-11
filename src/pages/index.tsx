import React, { useState } from 'react';
import { useRouter } from 'next/router';
import CharacterSelection from '../components/character/CharacterSelection';
import { useCharacterStore } from '../store/characterStore';

const Home: React.FC = () => {
  const router = useRouter();
  const { characters, createCharacter, selectCharacter, deleteCharacter } = useCharacterStore();
  const [showMainMenu, setShowMainMenu] = useState(false);

  const handleCreateCharacter = (data: any) => {
    createCharacter(data);
  };

  const handleSelectCharacter = (characterId: string) => {
    selectCharacter(characterId);
    router.push('/game');
  };

  const handleDeleteCharacter = (characterId: string) => {
    deleteCharacter(characterId);
  };

  if (showMainMenu) {
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
              onClick={() => setShowMainMenu(false)}
              className="block w-64 mx-auto px-6 py-4 bg-game-mana hover:bg-blue-600 text-white font-bold rounded-lg transition-colors duration-200 shadow-lg hover:shadow-xl"
            >
              Play Game
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <CharacterSelection
      characters={characters}
      onCreateCharacter={handleCreateCharacter}
      onSelectCharacter={handleSelectCharacter}
      onDeleteCharacter={handleDeleteCharacter}
    />
  );
};

export default Home;
