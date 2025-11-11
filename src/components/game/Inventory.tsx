import React, { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { InventoryItem, Equipment } from '../../types/game';
import { Player } from '../../game/entities/Player';

interface InventoryProps {
  isOpen: boolean;
  onClose: () => void;
}

const Inventory: React.FC<InventoryProps> = ({ isOpen, onClose }) => {
  const { player } = useGameStore();
  const [draggedItem, setDraggedItem] = useState<InventoryItem | null>(null);
  const [draggedFrom, setDraggedFrom] = useState<{ type: 'inventory' | 'equipment'; index?: number; slot?: string } | null>(null);

  if (!isOpen || !player) return null;
  
  // Cast player to Player entity to access methods
  const playerEntity = player as unknown as Player;

  const inventorySize = 30; // 6x5 grid
  const inventorySlots: (InventoryItem | null)[] = Array(inventorySize).fill(null);
  
  // Fill inventory slots with player's inventory
  player.inventory.forEach((item, index) => {
    if (index < inventorySize) {
      inventorySlots[index] = item;
    }
  });

  const equipmentSlots = [
    { key: 'weapon', label: 'Weapon', item: player.equipment.weapon },
    { key: 'armor', label: 'Armor', item: player.equipment.armor },
    { key: 'helmet', label: 'Helmet', item: player.equipment.helmet },
    { key: 'boots', label: 'Boots', item: player.equipment.boots },
    { key: 'accessory1', label: 'Accessory', item: player.equipment.accessory1 },
    { key: 'accessory2', label: 'Accessory', item: player.equipment.accessory2 },
  ];

  const handleDragStart = (item: InventoryItem, from: { type: 'inventory' | 'equipment'; index?: number; slot?: string }) => {
    setDraggedItem(item);
    setDraggedFrom(from);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setDraggedFrom(null);
  };

  const handleDrop = async (to: { type: 'inventory' | 'equipment'; index?: number; slot?: string }) => {
    if (!draggedItem || !draggedFrom) return;

    // Handle equipment
    if (to.type === 'equipment' && to.slot && playerEntity.equipItem) {
      const slot = to.slot as keyof Equipment;
      if (draggedItem.type === 'weapon' && slot === 'weapon') {
        await playerEntity.equipItem(draggedItem, 'weapon');
        if (draggedFrom.type === 'inventory' && draggedFrom.index !== undefined) {
          playerEntity.removeItem(draggedItem.id, 1);
        }
      } else if (draggedItem.type === 'armor') {
        if (slot === 'armor' || slot === 'helmet' || slot === 'boots') {
          await playerEntity.equipItem(draggedItem, slot);
          if (draggedFrom.type === 'inventory' && draggedFrom.index !== undefined) {
            playerEntity.removeItem(draggedItem.id, 1);
          }
        }
      }
    }
    
    // Handle unequip (drag from equipment to inventory)
    if (draggedFrom.type === 'equipment' && draggedFrom.slot && to.type === 'inventory' && playerEntity.unequipItem) {
      await playerEntity.unequipItem(draggedFrom.slot as keyof Equipment);
    }
    
    handleDragEnd();
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'text-gray-400';
      case 'uncommon': return 'text-green-400';
      case 'rare': return 'text-blue-400';
      case 'epic': return 'text-purple-400';
      case 'legendary': return 'text-yellow-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-game-panel border-4 border-game-border rounded-lg p-6 max-w-5xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-game-text font-game">Inventory</h2>
          <button
            onClick={onClose}
            className="text-game-text hover:text-game-health text-3xl font-bold"
          >
            ×
          </button>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* Left: Equipment Slots */}
          <div className="col-span-1">
            <h3 className="text-xl font-bold text-game-text mb-4">Equipment</h3>
            <div className="grid grid-cols-2 gap-3">
              {equipmentSlots.map((slot) => (
                <div
                  key={slot.key}
                  className="aspect-square border-2 border-game-border rounded-lg bg-game-bg p-2 flex flex-col items-center justify-center relative"
                  onDrop={(e) => {
                    e.preventDefault();
                    handleDrop({ type: 'equipment', slot: slot.key });
                  }}
                  onDragOver={(e) => e.preventDefault()}
                >
                  {slot.item ? (
                    <div
                      className="w-full h-full flex flex-col items-center justify-center cursor-move"
                      draggable
                      onDragStart={() => handleDragStart(slot.item!, { type: 'equipment', slot: slot.key })}
                      onDragEnd={handleDragEnd}
                    >
                      <div className={`text-xs font-bold ${getRarityColor(slot.item.rarity)}`}>
                        {slot.item.name}
                      </div>
                      {slot.item.quantity > 1 && (
                        <div className="text-xs text-game-text">{slot.item.quantity}</div>
                      )}
                    </div>
                  ) : (
                    <div className="text-xs text-game-text opacity-50 text-center">{slot.label}</div>
                  )}
                </div>
              ))}
            </div>

            {/* Character Stats */}
            <div className="mt-6 p-4 bg-game-bg border-2 border-game-border rounded-lg">
              <h4 className="text-lg font-bold text-game-text mb-2">Stats</h4>
              <div className="text-sm text-game-text space-y-1">
                <div>STR: {Math.floor(player.stats.strength)}</div>
                <div>DEX: {Math.floor(player.stats.dexterity)}</div>
                <div>INT: {Math.floor(player.stats.intelligence)}</div>
                <div>VIT: {Math.floor(player.stats.vitality)}</div>
                <div>ATK: {Math.floor(player.stats.attackDamage)}</div>
                <div>DEF: {Math.floor(player.stats.defense)}</div>
              </div>
            </div>
          </div>

          {/* Right: Inventory Grid */}
          <div className="col-span-2">
            <h3 className="text-xl font-bold text-game-text mb-4">Inventory</h3>
            <div className="grid grid-cols-6 gap-2">
              {inventorySlots.map((item, index) => (
                <div
                  key={index}
                  className="aspect-square border-2 border-game-border rounded bg-game-bg p-1 flex items-center justify-center relative cursor-pointer hover:border-game-mana transition-colors"
                  onDrop={(e) => {
                    e.preventDefault();
                    handleDrop({ type: 'inventory', index });
                  }}
                  onDragOver={(e) => e.preventDefault()}
                >
                  {item ? (
                    <div
                      className="w-full h-full flex flex-col items-center justify-center cursor-move"
                      draggable
                      onDragStart={() => handleDragStart(item, { type: 'inventory', index })}
                      onDragEnd={handleDragEnd}
                    >
                      <div className={`text-xs font-bold ${getRarityColor(item.rarity)} text-center`}>
                        {item.name}
                      </div>
                      {item.quantity > 1 && (
                        <div className="text-xs text-game-text absolute bottom-0 right-1">
                          {item.quantity}
                        </div>
                      )}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>

            {/* Gold Display */}
            <div className="mt-4 p-3 bg-game-bg border-2 border-game-border rounded-lg">
              <div className="text-game-text font-bold">
                Gold: <span className="text-yellow-400">0</span>
              </div>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-6 text-center text-game-text text-sm opacity-75">
          Drag items to move them. Right-click to use consumables.
        </div>
      </div>
    </div>
  );
};

export default Inventory;

