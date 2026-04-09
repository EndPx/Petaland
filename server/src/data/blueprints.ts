import { BlueprintDefinition } from "../types";

/**
 * All blueprint definitions for Petaland.
 * unlockCost = 0 means it is only obtainable via quest reward or drop.
 */
export const BLUEPRINTS: Record<string, BlueprintDefinition> = {
  // ── BASIC tier — rewarded from first NPC quest (free) ─────────────────────
  bp_soil_bed: {
    id: "bp_soil_bed",
    name: "Soil Bed Blueprint",
    tier: "basic",
    description: "Learn to craft a soil bed for growing crops.",
    unlockCost: 0, // quest reward only
    unlockLevel: 1,
    craftingRecipeId: "recipe_soil_bed",
    buildingSize: { w: 1, h: 1 },
  },
  bp_workbench: {
    id: "bp_workbench",
    name: "Workbench Blueprint",
    tier: "basic",
    description: "Learn to craft a workbench for more advanced recipes.",
    unlockCost: 0,
    unlockLevel: 1,
    craftingRecipeId: "recipe_workbench",
    buildingSize: { w: 2, h: 1 },
  },
  bp_storage_box: {
    id: "bp_storage_box",
    name: "Storage Box Blueprint",
    tier: "basic",
    description: "Learn to craft a storage box to hold your items.",
    unlockCost: 0,
    unlockLevel: 1,
    craftingRecipeId: "recipe_storage_box",
    buildingSize: { w: 1, h: 1 },
  },

  // ── COMMON tier — purchasable from NPC shop ────────────────────────────────
  bp_bonfire: {
    id: "bp_bonfire",
    name: "Bonfire Blueprint",
    tier: "common",
    description: "Learn to build a bonfire for cooking food.",
    unlockCost: 50,
    unlockLevel: 1,
    craftingRecipeId: "recipe_bonfire",
    buildingSize: { w: 1, h: 1 },
  },
  bp_fence: {
    id: "bp_fence",
    name: "Fence Blueprint",
    tier: "common",
    description: "Learn to craft fences to mark your land.",
    unlockCost: 50,
    unlockLevel: 1,
    craftingRecipeId: "recipe_fence",
    buildingSize: { w: 1, h: 1 },
  },
  bp_well: {
    id: "bp_well",
    name: "Well Blueprint",
    tier: "common",
    description: "Learn to build a well for faster crop growth.",
    unlockCost: 150,
    unlockLevel: 2,
    craftingRecipeId: "recipe_well",
    buildingSize: { w: 1, h: 1 },
  },
  bp_scarecrow: {
    id: "bp_scarecrow",
    name: "Scarecrow Blueprint",
    tier: "common",
    description: "Learn to craft a scarecrow to protect your crops.",
    unlockCost: 200,
    unlockLevel: 2,
    craftingRecipeId: "recipe_scarecrow",
    buildingSize: { w: 1, h: 1 },
  },
  bp_rope: {
    id: "bp_rope",
    name: "Rope Blueprint",
    tier: "common",
    description: "Learn to craft rope from fiber.",
    unlockCost: 60,
    unlockLevel: 1,
    craftingRecipeId: "recipe_rope",
  },
  bp_plank: {
    id: "bp_plank",
    name: "Plank Blueprint",
    tier: "common",
    description: "Learn to process wood into planks.",
    unlockCost: 60,
    unlockLevel: 1,
    craftingRecipeId: "recipe_plank",
  },
  bp_brick: {
    id: "bp_brick",
    name: "Brick Blueprint",
    tier: "common",
    description: "Learn to fire clay into bricks.",
    unlockCost: 80,
    unlockLevel: 2,
    craftingRecipeId: "recipe_brick",
  },
  bp_cloth: {
    id: "bp_cloth",
    name: "Cloth Blueprint",
    tier: "common",
    description: "Learn to weave fiber into cloth.",
    unlockCost: 100,
    unlockLevel: 2,
    craftingRecipeId: "recipe_cloth",
  },

  // ── UNCOMMON tier — quest chain (level 5+), 500 Silver ───────────────────
  bp_sawmill: {
    id: "bp_sawmill",
    name: "Sawmill Blueprint",
    tier: "uncommon",
    description: "Learn to build a sawmill for efficient wood processing.",
    unlockCost: 500,
    unlockLevel: 5,
    craftingRecipeId: "recipe_sawmill",
    buildingSize: { w: 2, h: 2 },
  },
  bp_furnace: {
    id: "bp_furnace",
    name: "Furnace Blueprint",
    tier: "uncommon",
    description: "Learn to build a furnace for smelting ores.",
    unlockCost: 500,
    unlockLevel: 5,
    craftingRecipeId: "recipe_furnace",
    buildingSize: { w: 2, h: 2 },
  },
  bp_loom: {
    id: "bp_loom",
    name: "Loom Blueprint",
    tier: "uncommon",
    description: "Learn to build a loom for advanced cloth-making.",
    unlockCost: 500,
    unlockLevel: 5,
    craftingRecipeId: "recipe_loom",
    buildingSize: { w: 2, h: 1 },
  },
  bp_anvil: {
    id: "bp_anvil",
    name: "Anvil Blueprint",
    tier: "uncommon",
    description: "Learn to craft an anvil for forging iron items.",
    unlockCost: 500,
    unlockLevel: 5,
    craftingRecipeId: "recipe_anvil",
    buildingSize: { w: 1, h: 1 },
  },
  bp_iron_bar: {
    id: "bp_iron_bar",
    name: "Iron Bar Blueprint",
    tier: "uncommon",
    description: "Learn to smelt iron ore into bars.",
    unlockCost: 300,
    unlockLevel: 5,
    craftingRecipeId: "recipe_iron_bar",
  },

  // ── RARE tier — quest chain (level 10+), 2000 Silver ─────────────────────
  bp_bakery: {
    id: "bp_bakery",
    name: "Bakery Blueprint",
    tier: "rare",
    description: "Learn to build a bakery for baking bread and pastries.",
    unlockCost: 2000,
    unlockLevel: 10,
    craftingRecipeId: "recipe_bakery",
    buildingSize: { w: 2, h: 2 },
  },
  bp_brewery: {
    id: "bp_brewery",
    name: "Brewery Blueprint",
    tier: "rare",
    description: "Learn to build a brewery for ales and potions.",
    unlockCost: 2000,
    unlockLevel: 10,
    craftingRecipeId: "recipe_brewery",
    buildingSize: { w: 2, h: 2 },
  },
  bp_jeweler_table: {
    id: "bp_jeweler_table",
    name: "Jeweler Table Blueprint",
    tier: "rare",
    description: "Learn to build a jeweler table for gem cutting.",
    unlockCost: 2000,
    unlockLevel: 10,
    craftingRecipeId: "recipe_jeweler_table",
    buildingSize: { w: 2, h: 1 },
  },
  bp_gem_cut: {
    id: "bp_gem_cut",
    name: "Gem Cutting Blueprint",
    tier: "rare",
    description: "Learn the art of cutting raw gems.",
    unlockCost: 1500,
    unlockLevel: 10,
    craftingRecipeId: "recipe_gem_cut",
  },

  // ── LEGENDARY tier — rare drop / seasonal events only ────────────────────
  bp_crystal_forge: {
    id: "bp_crystal_forge",
    name: "Crystal Forge Blueprint",
    tier: "legendary",
    description: "Blueprint for the legendary Crystal Forge. Extremely rare.",
    unlockCost: 0, // not buyable
    unlockLevel: 15,
    craftingRecipeId: "recipe_crystal_forge",
    buildingSize: { w: 3, h: 2 },
  },
  bp_golden_loom: {
    id: "bp_golden_loom",
    name: "Golden Loom Blueprint",
    tier: "legendary",
    description: "Blueprint for the legendary Golden Loom. Extremely rare.",
    unlockCost: 0,
    unlockLevel: 15,
    craftingRecipeId: "recipe_golden_loom",
    buildingSize: { w: 3, h: 2 },
  },
};

export function getBlueprint(id: string): BlueprintDefinition {
  const bp = BLUEPRINTS[id];
  if (!bp) throw new Error(`Unknown blueprint id: ${id}`);
  return bp;
}

/** Return all blueprints buyable from NPC shop at or below a given level */
export function getShopBlueprints(playerLevel: number): BlueprintDefinition[] {
  return Object.values(BLUEPRINTS).filter(
    (bp) => bp.unlockCost > 0 && bp.unlockLevel <= playerLevel
  );
}
