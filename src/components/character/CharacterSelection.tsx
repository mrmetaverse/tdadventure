import React, { useState, useEffect } from 'react';
import { CharacterData } from '../../types/character';
import { useRouter } from 'next/router';
import CharacterCreation from './CharacterCreation';

interface CharacterSelectionProps {
  characters: CharacterData[];
  onCreateCharacter: (data: any) => void;
  onSelectCharacter: (characterId: string) => void;
  onDeleteCharacter: (characterId: string) => void;
}

const CharacterSelection: React.FC<CharacterSelectionProps> = ({
  characters,
  onCreateCharacter,
  onSelectCharacter,
  onDeleteCharacter,
}) => {
  const [showCreation, setShowCreation] = useState(false);
  const router = useRouter();

  const handleCreate = (data: any) => {
    onCreateCharacter(data);
    setShowCreation(false);
  };

  if (showCreation) {
    return <CharacterCreation onCreate={handleCreate} onCancel={() => setShowCreation(false)} />;
  }

  return (
    <div className="min-h-screen bg-game-bg flex items-center justify-center p-4">
      <div className="bg-game-panel border-2 border-game-border rounded-lg p-8 max-w-4xl w-full">
        <h1 className="text-4xl font-bold text-game-text mb-6 text-center font-game">
          Select Character
        </h1>

        {characters.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-game-text opacity-75 mb-6">No characters yet. Create your first character!</p>
            <button
              onClick={() => setShowCreation(true)}
              className="px-8 py-4 bg-game-mana text-white rounded-lg hover:bg-blue-600 transition-colors text-lg font-bold"
            >
              Create Character
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {characters.map((character) => (
                <div
                  key={character.id}
                  className="border-2 border-game-border rounded-lg p-4 hover:border-game-text transition-colors cursor-pointer"
                  onClick={() => onSelectCharacter(character.id)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xl font-bold text-game-text">{character.name}</h3>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Delete ${character.name}?`)) {
                          onDeleteCharacter(character.id);
                        }
                      }}
                      className="text-game-health hover:text-red-700 text-sm"
                    >
                      Delete
                    </button>
                  </div>
                  <div className="text-sm text-game-text opacity-75 space-y-1">
                    <div>Level {character.level} {character.class}</div>
                    <div>{character.race}</div>
                    <div>Divine: {character.divine}</div>
                    <div className="text-xs opacity-60">
                      Last played: {new Date(character.lastPlayed).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="text-center">
              <button
                onClick={() => setShowCreation(true)}
                className="px-6 py-3 bg-game-panel border-2 border-game-border text-game-text rounded-lg hover:bg-gray-700 transition-colors"
              >
                Create New Character
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CharacterSelection;

