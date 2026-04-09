// Shared types for Petaland server

export type Direction = "north" | "south" | "east" | "west";

export type ItemType =
  | "resource"
  | "seed"
  | "crop"
  | "food"
  | "tool"
  | "blueprint"
  | "building"
  | "material"
  | "currency";

export type BlueprintTier = "basic" | "common" | "uncommon" | "rare" | "legendary";

export type LandType = "petal_plot" | "grove" | "cliff" | "lake" | "petal_estate";

export type QuestStatus = "locked" | "available" | "active" | "completed" | "claimed";

export type ActionType = "gather" | "craft" | "plant" | "harvest" | "cook" | "move";

export interface Position {
  x: number;
  y: number;
}

export interface ItemStack {
  itemId: string;
  quantity: number;
}

export interface ItemDefinition {
  id: string;
  name: string;
  type: ItemType;
  stackSize: number;
  sellPrice: number; // base silver sell price to NPC
  buyPrice?: number; // base silver buy price from NPC (if available)
  description: string;
  energyRestore?: number; // if food
  iconKey: string; // Phaser texture key
}

export interface BlueprintDefinition {
  id: string;
  name: string;
  tier: BlueprintTier;
  description: string;
  unlockCost: number; // silver cost to buy from NPC (0 = quest only)
  unlockLevel: number; // minimum level required
  craftingRecipeId: string; // links to recipe
  buildingSize?: { w: number; h: number }; // tile footprint if building
}

export interface RecipeDefinition {
  id: string;
  blueprintId: string;
  inputs: ItemStack[];
  outputs: ItemStack[];
  craftingTime: number; // ms
  requiresBuilding?: string; // building item id required (e.g. "workbench")
}

export interface QuestDefinition {
  id: string;
  title: string;
  description: string;
  requiredLevel: number;
  objectives: QuestObjective[];
  rewards: QuestReward;
  prerequisiteQuestIds: string[];
}

export interface QuestObjective {
  type: "gather" | "craft" | "deliver" | "build" | "reach_level";
  itemId?: string;
  quantity?: number;
  targetLevel?: number;
  description: string;
}

export interface QuestReward {
  silver?: number;
  xp: number;
  blueprintIds?: string[];
  itemRewards?: ItemStack[];
  petal?: number; // $PETAL token rewards (on-chain)
}

export interface NPCPriceEntry {
  itemId: string;
  basePrice: number;
  sellCount: number; // global count of how many have been sold to NPC
  lastDecayTime: number; // unix ms
}

export interface MoveMessage {
  x: number;
  y: number;
  direction: Direction;
}

export interface GatherMessage {
  resourceId: string; // world object id to gather from
  x: number;
  y: number;
}

export interface CraftMessage {
  recipeId: string;
  buildingId?: string; // optional building they are crafting at
  landOwnerId?: string; // if on someone else's land
}

export interface PlantMessage {
  soilBedId: string;
  seedItemId: string;
}

export interface HarvestMessage {
  soilBedId: string;
}

export interface NPCBuyMessage {
  itemId: string; // item to buy from NPC
  quantity: number;
}

export interface NPCSellMessage {
  itemId: string; // item to sell to NPC
  quantity: number;
}

export interface WorldObject {
  id: string;
  type: string; // "wild_carrot", "tree", "stone_rock", etc.
  x: number;
  y: number;
  depleted: boolean;
  respawnTime: number; // unix ms when it respawns
  ownerId?: string; // if on player land
}

export interface CropData {
  soilBedId: string;
  seedItemId: string;
  plantedAt: number; // unix ms
  growthDuration: number; // ms to mature
  harvestItemId: string;
  harvestQuantity: number;
  ownerId: string;
}

export const ENERGY_COSTS: Record<ActionType, number> = {
  gather: 5,
  craft: 10,
  plant: 3,
  harvest: 2,
  cook: 8,
  move: 0,
};

export const ENERGY_REGEN_PER_HOUR = 10;
export const BASE_MAX_ENERGY = 100;
export const ENERGY_PER_LEVEL = 10; // +10 max energy per level

export const XP_PER_LEVEL = 100; // simple linear: level * 100 xp to next
