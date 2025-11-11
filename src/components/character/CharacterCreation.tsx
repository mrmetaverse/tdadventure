import React, { useState } from 'react';
import { CharacterCreationData, CharacterClass, CharacterRace, Divine, AlignmentAxis, MoralityAxis } from '../../types/character';
import { CLASSES, getClassData } from '../../game/data/Classes';
import { RACES, getRaceData } from '../../game/data/Races';
import { DIVINES, getDivineData } from '../../game/data/Divines';
import { AlignmentSystem } from '../../game/utils/Alignment';

interface CharacterCreationProps {
  onCreate: (data: CharacterCreationData) => void;
  onCancel: () => void;
}

const CharacterCreation: React.FC<CharacterCreationProps> = ({ onCreate, onCancel }) => {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [selectedClass, setSelectedClass] = useState<CharacterClass | null>(null);
  const [selectedRace, setSelectedRace] = useState<CharacterRace | null>(null);
  const [selectedDivine, setSelectedDivine] = useState<Divine | null>(null);
  const [selectedAlignment, setSelectedAlignment] = useState<{ lawful: AlignmentAxis; good: MoralityAxis } | null>(null);

  const handleCreate = () => {
    if (!name.trim() || !selectedClass || !selectedRace || !selectedDivine || !selectedAlignment) {
      return;
    }

    const alignment = AlignmentSystem.getStartingAlignment(
      selectedAlignment.lawful,
      selectedAlignment.good
    );

    onCreate({
      name: name.trim(),
      class: selectedClass,
      race: selectedRace,
      divine: selectedDivine,
      startingAlignment: alignment,
    });
  };

  const alignmentGrid = AlignmentSystem.getAlignmentGrid();

  return (
    <div className="min-h-screen bg-game-bg flex items-center justify-center p-4">
      <div className="bg-game-panel border-2 border-game-border rounded-lg p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <h1 className="text-4xl font-bold text-game-text mb-6 text-center font-game">
          Create Character
        </h1>

        {/* Step 1: Name */}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-game-text mb-4">Character Name</h2>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your character name..."
              maxLength={20}
              className="w-full px-4 py-3 bg-game-bg border-2 border-game-border rounded-lg text-game-text text-lg focus:outline-none focus:border-game-mana"
            />
            <div className="flex justify-between mt-6">
              <button
                onClick={onCancel}
                className="px-6 py-3 bg-game-panel border-2 border-game-border text-game-text rounded-lg hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => name.trim() && setStep(2)}
                disabled={!name.trim()}
                className="px-6 py-3 bg-game-mana text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next: Choose Class
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Class Selection */}
        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-game-text mb-4">Choose Your Class</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.values(CLASSES).map((classData) => (
                <button
                  key={classData.id}
                  onClick={() => setSelectedClass(classData.id as CharacterClass)}
                  className={`p-4 border-2 rounded-lg text-left transition-all ${
                    selectedClass === classData.id
                      ? 'border-game-mana bg-game-mana bg-opacity-20'
                      : 'border-game-border hover:border-game-text'
                  }`}
                >
                  <h3 className="text-xl font-bold text-game-text mb-2">{classData.name}</h3>
                  <p className="text-sm text-game-text opacity-75 mb-3">{classData.description}</p>
                  <div className="text-xs text-game-text opacity-60">
                    <div>Primary: {classData.primaryStat}</div>
                    <div>Secondary: {classData.secondaryStat}</div>
                  </div>
                </button>
              ))}
            </div>
            <div className="flex justify-between mt-6">
              <button
                onClick={() => setStep(1)}
                className="px-6 py-3 bg-game-panel border-2 border-game-border text-game-text rounded-lg hover:bg-gray-700 transition-colors"
              >
                Back
              </button>
              <button
                onClick={() => selectedClass && setStep(3)}
                disabled={!selectedClass}
                className="px-6 py-3 bg-game-mana text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next: Choose Race
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Race Selection */}
        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-game-text mb-4">Choose Your Race</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.values(RACES).map((raceData) => (
                <button
                  key={raceData.id}
                  onClick={() => setSelectedRace(raceData.id as CharacterRace)}
                  className={`p-4 border-2 rounded-lg text-left transition-all ${
                    selectedRace === raceData.id
                      ? 'border-game-mana bg-game-mana bg-opacity-20'
                      : 'border-game-border hover:border-game-text'
                  }`}
                >
                  <h3 className="text-xl font-bold text-game-text mb-2">{raceData.name}</h3>
                  <p className="text-sm text-game-text opacity-75 mb-3">{raceData.description}</p>
                  <div className="text-xs text-game-text opacity-60">
                    {raceData.racialAbilities.map((ability, i) => (
                      <div key={i}>• {ability}</div>
                    ))}
                  </div>
                </button>
              ))}
            </div>
            <div className="flex justify-between mt-6">
              <button
                onClick={() => setStep(2)}
                className="px-6 py-3 bg-game-panel border-2 border-game-border text-game-text rounded-lg hover:bg-gray-700 transition-colors"
              >
                Back
              </button>
              <button
                onClick={() => selectedRace && setStep(4)}
                disabled={!selectedRace}
                className="px-6 py-3 bg-game-mana text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next: Choose Divine
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Divine Selection */}
        {step === 4 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-game-text mb-4">Choose Your Divine</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.values(DIVINES).map((divineData) => (
                <button
                  key={divineData.id}
                  onClick={() => setSelectedDivine(divineData.id as Divine)}
                  className={`p-4 border-2 rounded-lg text-left transition-all ${
                    selectedDivine === divineData.id
                      ? 'border-game-mana bg-game-mana bg-opacity-20'
                      : 'border-game-border hover:border-game-text'
                  }`}
                >
                  <h3 className="text-xl font-bold text-game-text mb-2">{divineData.name}</h3>
                  <p className="text-sm text-game-text opacity-75">{divineData.description}</p>
                </button>
              ))}
            </div>
            <div className="flex justify-between mt-6">
              <button
                onClick={() => setStep(3)}
                className="px-6 py-3 bg-game-panel border-2 border-game-border text-game-text rounded-lg hover:bg-gray-700 transition-colors"
              >
                Back
              </button>
              <button
                onClick={() => selectedDivine && setStep(5)}
                disabled={!selectedDivine}
                className="px-6 py-3 bg-game-mana text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next: Choose Alignment
              </button>
            </div>
          </div>
        )}

        {/* Step 5: Alignment Selection */}
        {step === 5 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-game-text mb-4">Choose Your Starting Alignment</h2>
            <p className="text-game-text opacity-75 mb-4">
              Your alignment will change based on your actions. Choose where you begin your journey.
            </p>
            <div className="grid grid-cols-3 gap-2 max-w-md mx-auto">
              {alignmentGrid.map((row, y) =>
                row.map((alignment, x) => {
                  const isSelected = selectedAlignment?.lawful === alignment.lawful && 
                                   selectedAlignment?.good === alignment.good;
                  return (
                    <button
                      key={`${x}-${y}`}
                      onClick={() => setSelectedAlignment({ lawful: alignment.lawful, good: alignment.good })}
                      className={`p-4 border-2 rounded-lg transition-all ${
                        isSelected
                          ? 'border-game-mana bg-game-mana bg-opacity-30'
                          : 'border-game-border hover:border-game-text'
                      }`}
                    >
                      <div className="text-sm font-bold text-game-text">{alignment.name}</div>
                    </button>
                  );
                })
              )}
            </div>
            <div className="flex justify-between mt-6">
              <button
                onClick={() => setStep(4)}
                className="px-6 py-3 bg-game-panel border-2 border-game-border text-game-text rounded-lg hover:bg-gray-700 transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleCreate}
                disabled={!selectedAlignment}
                className="px-6 py-3 bg-game-health text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create Character
              </button>
            </div>
          </div>
        )}

        {/* Progress Indicator */}
        <div className="mt-8 flex justify-center space-x-2">
          {[1, 2, 3, 4, 5].map((s) => (
            <div
              key={s}
              className={`h-2 w-2 rounded-full ${
                s <= step ? 'bg-game-mana' : 'bg-game-border'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default CharacterCreation;

