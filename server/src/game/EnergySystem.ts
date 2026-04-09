import { PlayerSchema } from "../schema/PlayerSchema";
import {
  ActionType,
  ENERGY_COSTS,
  ENERGY_REGEN_PER_HOUR,
  BASE_MAX_ENERGY,
  ENERGY_PER_LEVEL,
} from "../types";
import { getItem } from "../data/items";

/**
 * EnergySystem manages energy consumption, regeneration, and food restoration.
 *
 * Design:
 * - Every action costs a fixed amount of energy.
 * - Energy regenerates at +10 per hour, calculated from the last action timestamp.
 * - Max energy = BASE_MAX_ENERGY + (level - 1) * ENERGY_PER_LEVEL
 * - Food items restore energy instantly when consumed.
 */
export class EnergySystem {
  /**
   * Compute the current max energy for a player based on their level.
   */
  static getMaxEnergy(level: number): number {
    return BASE_MAX_ENERGY + (level - 1) * ENERGY_PER_LEVEL;
  }

  /**
   * Apply passive energy regeneration based on elapsed time since last action.
   * Call this before any action check or on a game tick.
   * Mutates the PlayerSchema in place.
   */
  static applyRegen(player: PlayerSchema): void {
    const now = Date.now();
    const maxEnergy = EnergySystem.getMaxEnergy(player.level);

    if (player.energy >= maxEnergy) {
      player.energy = maxEnergy;
      return;
    }

    if (player.lastActionTime <= 0) {
      // No action recorded yet — start at full energy
      player.energy = maxEnergy;
      player.lastActionTime = now;
      player.maxEnergy = maxEnergy;
      return;
    }

    const elapsedMs = now - player.lastActionTime;
    const hoursElapsed = elapsedMs / (1000 * 60 * 60);
    const regenAmount = Math.floor(hoursElapsed * ENERGY_REGEN_PER_HOUR);

    if (regenAmount > 0) {
      player.energy = Math.min(player.energy + regenAmount, maxEnergy);
      // Advance lastActionTime by the amount of regen we applied
      const msPerPoint = (1000 * 60 * 60) / ENERGY_REGEN_PER_HOUR;
      player.lastActionTime += regenAmount * msPerPoint;
    }

    player.maxEnergy = maxEnergy;
  }

  /**
   * Check whether a player has enough energy for an action.
   * Applies regen first.
   */
  static canAfford(player: PlayerSchema, action: ActionType): boolean {
    EnergySystem.applyRegen(player);
    const cost = ENERGY_COSTS[action];
    return player.energy >= cost;
  }

  /**
   * Deduct energy for an action. Returns false if insufficient energy.
   * Applies regen first, then deducts.
   * Sets lastActionTime to now so regen clock resets.
   */
  static spend(player: PlayerSchema, action: ActionType): boolean {
    EnergySystem.applyRegen(player);
    const cost = ENERGY_COSTS[action];

    if (player.energy < cost) {
      return false;
    }

    player.energy -= cost;
    player.lastActionTime = Date.now();
    return true;
  }

  /**
   * Restore energy by consuming a food item.
   * The item must exist in the player's inventory.
   * Returns the amount of energy restored (0 if item is not food or not found).
   */
  static eatFood(player: PlayerSchema, foodItemId: string): number {
    let itemDef;
    try {
      itemDef = getItem(foodItemId);
    } catch {
      return 0;
    }

    if (itemDef.type !== "food" || !itemDef.energyRestore) {
      return 0;
    }

    const slot = player.inventory.get(foodItemId);
    if (!slot || slot.quantity <= 0) {
      return 0;
    }

    // Consume one food item
    slot.quantity -= 1;
    if (slot.quantity <= 0) {
      player.inventory.delete(foodItemId);
    }

    // Apply regen first, then add food energy
    EnergySystem.applyRegen(player);
    const maxEnergy = EnergySystem.getMaxEnergy(player.level);
    const restored = Math.min(itemDef.energyRestore, maxEnergy - player.energy);
    player.energy = Math.min(player.energy + itemDef.energyRestore, maxEnergy);
    player.maxEnergy = maxEnergy;

    return restored;
  }

  /**
   * Called when player levels up — update their maxEnergy.
   */
  static onLevelUp(player: PlayerSchema): void {
    const newMax = EnergySystem.getMaxEnergy(player.level);
    const delta = newMax - player.maxEnergy;
    player.maxEnergy = newMax;
    // Award bonus energy on level up (fill the new headroom)
    player.energy = Math.min(player.energy + delta, newMax);
  }

  /**
   * Returns a human-readable time until full regen in ms.
   */
  static timeToFullRegen(player: PlayerSchema): number {
    EnergySystem.applyRegen(player);
    const maxEnergy = EnergySystem.getMaxEnergy(player.level);
    const deficit = maxEnergy - player.energy;
    if (deficit <= 0) return 0;
    const msPerPoint = (1000 * 60 * 60) / ENERGY_REGEN_PER_HOUR;
    return deficit * msPerPoint;
  }
}
