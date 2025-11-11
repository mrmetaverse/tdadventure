import { InventoryItem, PlayerStats } from '../../types/game';
import { RARITY_COLORS } from '../utils/Constants';
import { v4 as uuidv4 } from 'uuid';

/**
 * Generates random items for enemy drops
 */
export class ItemGenerator {
  /**
   * Generate a random item based on enemy level
   */
  static generateItem(enemyLevel: number): InventoryItem | null {
    // Base drop chance: 30%
    if (Math.random() > 0.3) {
      return null;
    }

    // Determine item type
    const itemTypeRoll = Math.random();
    let itemType: 'weapon' | 'armor' | 'consumable' | 'quest' | 'material';
    
    if (itemTypeRoll < 0.4) {
      itemType = 'weapon';
    } else if (itemTypeRoll < 0.7) {
      itemType = 'armor';
    } else if (itemTypeRoll < 0.9) {
      itemType = 'consumable';
    } else {
      itemType = 'material';
    }

    // Determine rarity based on enemy level
    const rarity = this.determineRarity(enemyLevel);
    
    // Generate item based on type
    switch (itemType) {
      case 'weapon':
        return this.generateWeapon(enemyLevel, rarity);
      case 'armor':
        return this.generateArmor(enemyLevel, rarity);
      case 'consumable':
        return this.generateConsumable(rarity);
      case 'material':
        return this.generateMaterial(rarity);
      default:
        return null;
    }
  }

  /**
   * Determine item rarity based on enemy level
   */
  private static determineRarity(enemyLevel: number): InventoryItem['rarity'] {
    const roll = Math.random();
    
    // Higher level enemies have better drop rates
    const levelBonus = Math.min(enemyLevel / 20, 0.3); // Max 30% bonus
    
    if (roll < 0.5 - levelBonus) {
      return 'common';
    } else if (roll < 0.75 - levelBonus * 0.5) {
      return 'uncommon';
    } else if (roll < 0.9 - levelBonus * 0.3) {
      return 'rare';
    } else if (roll < 0.98 - levelBonus * 0.2) {
      return 'epic';
    } else {
      return 'legendary';
    }
  }

  /**
   * Generate a weapon
   */
  private static generateWeapon(level: number, rarity: InventoryItem['rarity']): InventoryItem {
    const weaponNames = [
      'Sword', 'Axe', 'Mace', 'Dagger', 'Staff', 'Bow', 'Spear', 'Hammer',
      'Flaming Sword', 'Ice Blade', 'Thunder Hammer', 'Poison Dagger', 'Lightning Staff'
    ];
    
    const name = weaponNames[Math.floor(Math.random() * weaponNames.length)];
    const rarityPrefix = rarity !== 'common' ? `${this.capitalize(rarity)} ` : '';
    const fullName = `${rarityPrefix}${name}`;

    // Calculate stats based on level and rarity
    const baseAttack = 10 + level * 3;
    const rarityMultiplier = this.getRarityMultiplier(rarity);
    const attackDamage = Math.floor(baseAttack * rarityMultiplier);

    const stats: Partial<PlayerStats> = {
      attackDamage,
    };

    // Add crit chance for rare+ weapons
    if (rarity === 'rare' || rarity === 'epic' || rarity === 'legendary') {
      stats.critChance = (rarity === 'legendary' ? 0.15 : rarity === 'epic' ? 0.10 : 0.05);
      stats.critDamage = rarity === 'legendary' ? 2.5 : rarity === 'epic' ? 2.0 : 1.5;
    }

    return {
      id: uuidv4(),
      name: fullName,
      type: 'weapon',
      rarity,
      stats,
      quantity: 1,
    };
  }

  /**
   * Generate armor
   */
  private static generateArmor(level: number, rarity: InventoryItem['rarity']): InventoryItem {
    const armorTypes = ['Helmet', 'Chestplate', 'Boots'];
    const armorType = armorTypes[Math.floor(Math.random() * armorTypes.length)];
    
    const materialNames = [
      'Leather', 'Chainmail', 'Plate', 'Scale', 'Bone', 'Crystal',
      'Dragon', 'Mythril', 'Obsidian'
    ];
    
    const material = materialNames[Math.floor(Math.random() * materialNames.length)];
    const rarityPrefix = rarity !== 'common' ? `${this.capitalize(rarity)} ` : '';
    const fullName = `${rarityPrefix}${material} ${armorType}`;

    // Calculate stats based on level and rarity
    const baseDefense = 5 + level * 2;
    const rarityMultiplier = this.getRarityMultiplier(rarity);
    const defense = Math.floor(baseDefense * rarityMultiplier);

    const stats: Partial<PlayerStats> = {
      defense,
    };

    // Add vitality for rare+ armor
    if (rarity === 'rare' || rarity === 'epic' || rarity === 'legendary') {
      stats.vitality = Math.floor((level * 2) * rarityMultiplier);
    }

    return {
      id: uuidv4(),
      name: fullName,
      type: 'armor',
      rarity,
      stats,
      quantity: 1,
    };
  }

  /**
   * Generate consumable
   */
  private static generateConsumable(rarity: InventoryItem['rarity']): InventoryItem {
    const consumableNames = [
      'Health Potion', 'Mana Potion', 'Stamina Potion', 'Elixir of Strength',
      'Elixir of Agility', 'Elixir of Wisdom'
    ];
    
    const name = consumableNames[Math.floor(Math.random() * consumableNames.length)];
    const rarityPrefix = rarity !== 'common' ? `${this.capitalize(rarity)} ` : '';
    const fullName = `${rarityPrefix}${name}`;

    // Consumables don't have stats, they're used for healing/buffs
    return {
      id: uuidv4(),
      name: fullName,
      type: 'consumable',
      rarity,
      quantity: 1 + (rarity === 'rare' ? 2 : rarity === 'epic' ? 3 : rarity === 'legendary' ? 5 : 0),
    };
  }

  /**
   * Generate material
   */
  private static generateMaterial(rarity: InventoryItem['rarity']): InventoryItem {
    const materialNames = [
      'Iron Ore', 'Gold Ore', 'Silver Ore', 'Crystal Shard', 'Dragon Scale',
      'Mythril Fragment', 'Essence of Power', 'Ancient Relic'
    ];
    
    const name = materialNames[Math.floor(Math.random() * materialNames.length)];
    const rarityPrefix = rarity !== 'common' ? `${this.capitalize(rarity)} ` : '';
    const fullName = `${rarityPrefix}${name}`;

    return {
      id: uuidv4(),
      name: fullName,
      type: 'material',
      rarity,
      quantity: 1 + Math.floor(Math.random() * 3),
    };
  }

  /**
   * Get stat multiplier based on rarity
   */
  private static getRarityMultiplier(rarity: InventoryItem['rarity']): number {
    switch (rarity) {
      case 'common': return 1.0;
      case 'uncommon': return 1.3;
      case 'rare': return 1.6;
      case 'epic': return 2.0;
      case 'legendary': return 2.5;
      default: return 1.0;
    }
  }

  /**
   * Capitalize first letter
   */
  private static capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}

