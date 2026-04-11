import { MapSchema } from "@colyseus/schema";
import { PlayerSchema, InventoryItemSchema } from "../schema/PlayerSchema";
import { InventorySlotSchema, addToInventory } from "../schema/InventorySchema";
import { GameState, BuildingSchema } from "../schema/GameState";

/**
 * Create a mock PlayerSchema for testing.
 * Uses real Colyseus Schema so MapSchema works properly.
 */
export function createMockPlayer(overrides: Partial<{
  sessionId: string;
  level: number;
  silver: number;
  energy: number;
  maxEnergy: number;
  lastActionTime: number;
  blueprintsOwned: string;
  activeQuestIds: string;
  completedQuestIds: string;
  questProgressJson: string;
  xp: number;
  xpToNextLevel: number;
}> = {}): PlayerSchema {
  const player = new PlayerSchema();
  player.sessionId = overrides.sessionId ?? "player1";
  player.level = overrides.level ?? 1;
  player.silver = overrides.silver ?? 0;
  player.energy = overrides.energy ?? 100;
  player.maxEnergy = overrides.maxEnergy ?? 100;
  player.lastActionTime = overrides.lastActionTime ?? Date.now();
  player.blueprintsOwned = overrides.blueprintsOwned ?? "";
  player.activeQuestIds = overrides.activeQuestIds ?? "";
  player.completedQuestIds = overrides.completedQuestIds ?? "";
  player.questProgressJson = overrides.questProgressJson ?? "{}";
  player.xp = overrides.xp ?? 0;
  player.xpToNextLevel = overrides.xpToNextLevel ?? 100;
  return player;
}

/**
 * Add items to a player's inventory for testing.
 */
export function giveItems(player: PlayerSchema, itemId: string, quantity: number): void {
  addToInventory(player.inventory, itemId, quantity);
}

/**
 * Create a minimal mock GameState for testing.
 */
export function createMockGameState(): GameState {
  const state = new GameState();
  return state;
}
