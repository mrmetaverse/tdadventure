import React, { useEffect, useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { AlignmentSystem } from '../../game/utils/Alignment';

const PlayerHUD: React.FC = () => {
  const { player } = useGameStore();
  const [healthPercent, setHealthPercent] = useState(100);
  const [manaPercent, setManaPercent] = useState(100);
  const [xpPercent, setXpPercent] = useState(0);

  useEffect(() => {
    if (player) {
      setHealthPercent((player.health / player.maxHealth) * 100);
      setManaPercent((player.mana / player.maxMana) * 100);
      setXpPercent((player.experience / player.experienceToLevel) * 100);
    }
  }, [player]);

  if (!player) return null;

  // Don't show HUD for formless players
  if (player.isFormless) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 pointer-events-auto">
      <div className="bg-game-panel border-2 border-game-border rounded-lg p-4 min-w-[300px] shadow-2xl">
        {/* Player Info */}
        <div className="mb-3">
          <div className="text-game-text font-bold text-lg mb-1">{player.name}</div>
          <div className="text-game-text text-sm opacity-75">
            Level {player.level} {player.class && (
              <span className="capitalize">{player.class}</span>
            )}
          </div>
          {player.race && (
            <div className="text-game-text text-xs opacity-60 capitalize">
              {player.race} • {player.divine && (
                <span className="capitalize">{player.divine}</span>
              )}
            </div>
          )}
          {player.alignment && (
            <div className="text-game-text text-xs opacity-60 mt-1">
              Alignment: {player.alignment ? AlignmentSystem.getAlignmentName(player.alignment) : 'Neutral'}
            </div>
          )}
        </div>

        {/* Health Bar */}
        <div className="mb-2">
          <div className="flex justify-between text-xs text-game-text mb-1">
            <span>HP</span>
            <span>{Math.ceil(player.health)} / {player.maxHealth}</span>
          </div>
          <div className="w-full h-4 bg-game-bg rounded-full overflow-hidden border border-game-border">
            <div
              className="h-full bg-game-health transition-all duration-300"
              style={{ width: `${healthPercent}%` }}
            />
          </div>
        </div>

        {/* Mana Bar */}
        <div className="mb-2">
          <div className="flex justify-between text-xs text-game-text mb-1">
            <span>MP</span>
            <span>{Math.ceil(player.mana)} / {player.maxMana}</span>
          </div>
          <div className="w-full h-4 bg-game-bg rounded-full overflow-hidden border border-game-border">
            <div
              className="h-full bg-game-mana transition-all duration-300"
              style={{ width: `${manaPercent}%` }}
            />
          </div>
        </div>

        {/* Experience Bar */}
        <div>
          <div className="flex justify-between text-xs text-game-text mb-1">
            <span>XP</span>
            <span>{player.experience} / {player.experienceToLevel}</span>
          </div>
          <div className="w-full h-3 bg-game-bg rounded-full overflow-hidden border border-game-border">
            <div
              className="h-full bg-game-xp transition-all duration-300"
              style={{ width: `${xpPercent}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayerHUD;
