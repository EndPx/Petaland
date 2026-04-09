import { RecipeDefinition } from "../types";

/**
 * All crafting recipes for Petaland.
 * Each recipe is linked to a blueprint via blueprintId.
 * inputs  = items consumed on craft
 * outputs = items produced on successful craft
 */
export const RECIPES: Record<string, RecipeDefinition> = {
  // ── Basic Buildings ────────────────────────────────────────────────────────
  recipe_soil_bed: {
    id: "recipe_soil_bed",
    blueprintId: "bp_soil_bed",
    inputs: [
      { itemId: "wood", quantity: 4 },
      { itemId: "fiber", quantity: 2 },
    ],
    outputs: [{ itemId: "soil_bed", quantity: 1 }],
    craftingTime: 3000,
  },
  recipe_workbench: {
    id: "recipe_workbench",
    blueprintId: "bp_workbench",
    inputs: [
      { itemId: "wood", quantity: 8 },
      { itemId: "stone", quantity: 4 },
    ],
    outputs: [{ itemId: "workbench", quantity: 1 }],
    craftingTime: 5000,
  },
  recipe_storage_box: {
    id: "recipe_storage_box",
    blueprintId: "bp_storage_box",
    inputs: [
      { itemId: "wood", quantity: 6 },
      { itemId: "fiber", quantity: 3 },
    ],
    outputs: [{ itemId: "storage_box", quantity: 1 }],
    craftingTime: 4000,
  },

  // ── Common Buildings ───────────────────────────────────────────────────────
  recipe_bonfire: {
    id: "recipe_bonfire",
    blueprintId: "bp_bonfire",
    inputs: [
      { itemId: "wood", quantity: 6 },
      { itemId: "stone", quantity: 3 },
    ],
    outputs: [{ itemId: "bonfire", quantity: 1 }],
    craftingTime: 4000,
  },
  recipe_fence: {
    id: "recipe_fence",
    blueprintId: "bp_fence",
    inputs: [{ itemId: "wood", quantity: 2 }],
    outputs: [{ itemId: "fence", quantity: 3 }],
    craftingTime: 1500,
  },
  recipe_well: {
    id: "recipe_well",
    blueprintId: "bp_well",
    inputs: [
      { itemId: "stone", quantity: 12 },
      { itemId: "wood", quantity: 4 },
      { itemId: "rope", quantity: 2 },
    ],
    outputs: [{ itemId: "well", quantity: 1 }],
    craftingTime: 8000,
    requiresBuilding: "workbench",
  },
  recipe_scarecrow: {
    id: "recipe_scarecrow",
    blueprintId: "bp_scarecrow",
    inputs: [
      { itemId: "wood", quantity: 4 },
      { itemId: "fiber", quantity: 6 },
      { itemId: "cloth", quantity: 1 },
    ],
    outputs: [{ itemId: "scarecrow", quantity: 1 }],
    craftingTime: 5000,
    requiresBuilding: "workbench",
  },

  // ── Common Materials ──────────────────────────────────────────────────────
  recipe_rope: {
    id: "recipe_rope",
    blueprintId: "bp_rope",
    inputs: [{ itemId: "fiber", quantity: 3 }],
    outputs: [{ itemId: "rope", quantity: 1 }],
    craftingTime: 1500,
  },
  recipe_plank: {
    id: "recipe_plank",
    blueprintId: "bp_plank",
    inputs: [{ itemId: "wood", quantity: 3 }],
    outputs: [{ itemId: "plank", quantity: 2 }],
    craftingTime: 2000,
  },
  recipe_brick: {
    id: "recipe_brick",
    blueprintId: "bp_brick",
    inputs: [{ itemId: "clay", quantity: 2 }],
    outputs: [{ itemId: "brick", quantity: 2 }],
    craftingTime: 3000,
    requiresBuilding: "bonfire",
  },
  recipe_cloth: {
    id: "recipe_cloth",
    blueprintId: "bp_cloth",
    inputs: [{ itemId: "fiber", quantity: 4 }],
    outputs: [{ itemId: "cloth", quantity: 1 }],
    craftingTime: 2500,
  },

  // ── Uncommon Buildings ────────────────────────────────────────────────────
  recipe_sawmill: {
    id: "recipe_sawmill",
    blueprintId: "bp_sawmill",
    inputs: [
      { itemId: "plank", quantity: 15 },
      { itemId: "stone", quantity: 10 },
      { itemId: "iron_bar", quantity: 5 },
    ],
    outputs: [{ itemId: "sawmill", quantity: 1 }],
    craftingTime: 15000,
    requiresBuilding: "workbench",
  },
  recipe_furnace: {
    id: "recipe_furnace",
    blueprintId: "bp_furnace",
    inputs: [
      { itemId: "stone", quantity: 20 },
      { itemId: "brick", quantity: 10 },
      { itemId: "iron_bar", quantity: 3 },
    ],
    outputs: [{ itemId: "furnace", quantity: 1 }],
    craftingTime: 15000,
    requiresBuilding: "workbench",
  },
  recipe_loom: {
    id: "recipe_loom",
    blueprintId: "bp_loom",
    inputs: [
      { itemId: "plank", quantity: 10 },
      { itemId: "rope", quantity: 5 },
      { itemId: "iron_bar", quantity: 2 },
    ],
    outputs: [{ itemId: "loom", quantity: 1 }],
    craftingTime: 12000,
    requiresBuilding: "workbench",
  },
  recipe_anvil: {
    id: "recipe_anvil",
    blueprintId: "bp_anvil",
    inputs: [
      { itemId: "iron_bar", quantity: 12 },
      { itemId: "stone", quantity: 5 },
    ],
    outputs: [{ itemId: "anvil", quantity: 1 }],
    craftingTime: 10000,
    requiresBuilding: "furnace",
  },
  recipe_iron_bar: {
    id: "recipe_iron_bar",
    blueprintId: "bp_iron_bar",
    inputs: [
      { itemId: "iron_ore", quantity: 2 },
      { itemId: "coal", quantity: 1 },
    ],
    outputs: [{ itemId: "iron_bar", quantity: 1 }],
    craftingTime: 5000,
    requiresBuilding: "furnace",
  },

  // ── Rare Buildings ────────────────────────────────────────────────────────
  recipe_bakery: {
    id: "recipe_bakery",
    blueprintId: "bp_bakery",
    inputs: [
      { itemId: "brick", quantity: 25 },
      { itemId: "plank", quantity: 20 },
      { itemId: "iron_bar", quantity: 8 },
      { itemId: "stone", quantity: 15 },
    ],
    outputs: [{ itemId: "bakery", quantity: 1 }],
    craftingTime: 30000,
    requiresBuilding: "workbench",
  },
  recipe_brewery: {
    id: "recipe_brewery",
    blueprintId: "bp_brewery",
    inputs: [
      { itemId: "plank", quantity: 20 },
      { itemId: "brick", quantity: 15 },
      { itemId: "iron_bar", quantity: 10 },
      { itemId: "rope", quantity: 8 },
    ],
    outputs: [{ itemId: "brewery", quantity: 1 }],
    craftingTime: 30000,
    requiresBuilding: "workbench",
  },
  recipe_jeweler_table: {
    id: "recipe_jeweler_table",
    blueprintId: "bp_jeweler_table",
    inputs: [
      { itemId: "plank", quantity: 10 },
      { itemId: "iron_bar", quantity: 15 },
      { itemId: "cloth", quantity: 5 },
      { itemId: "gem_raw", quantity: 2 },
    ],
    outputs: [{ itemId: "jeweler_table", quantity: 1 }],
    craftingTime: 25000,
    requiresBuilding: "anvil",
  },
  recipe_gem_cut: {
    id: "recipe_gem_cut",
    blueprintId: "bp_gem_cut",
    inputs: [{ itemId: "gem_raw", quantity: 1 }],
    outputs: [{ itemId: "gem_cut", quantity: 1 }],
    craftingTime: 8000,
    requiresBuilding: "jeweler_table",
  },

  // ── Legendary Buildings ───────────────────────────────────────────────────
  recipe_crystal_forge: {
    id: "recipe_crystal_forge",
    blueprintId: "bp_crystal_forge",
    inputs: [
      { itemId: "iron_bar", quantity: 50 },
      { itemId: "gem_cut", quantity: 10 },
      { itemId: "brick", quantity: 40 },
      { itemId: "plank", quantity: 30 },
    ],
    outputs: [{ itemId: "crystal_forge", quantity: 1 }],
    craftingTime: 120000,
    requiresBuilding: "anvil",
  },
  recipe_golden_loom: {
    id: "recipe_golden_loom",
    blueprintId: "bp_golden_loom",
    inputs: [
      { itemId: "iron_bar", quantity: 30 },
      { itemId: "gem_cut", quantity: 5 },
      { itemId: "cloth", quantity: 20 },
      { itemId: "plank", quantity: 20 },
    ],
    outputs: [{ itemId: "golden_loom", quantity: 1 }],
    craftingTime: 90000,
    requiresBuilding: "loom",
  },

  // ── Cooking Recipes (require bonfire) ────────────────────────────────────
  recipe_roasted_carrot: {
    id: "recipe_roasted_carrot",
    blueprintId: "bp_bonfire", // uses the bonfire building (no separate blueprint)
    inputs: [{ itemId: "carrot", quantity: 2 }],
    outputs: [{ itemId: "roasted_carrot", quantity: 1 }],
    craftingTime: 3000,
    requiresBuilding: "bonfire",
  },
  recipe_baked_potato: {
    id: "recipe_baked_potato",
    blueprintId: "bp_bonfire",
    inputs: [{ itemId: "potato", quantity: 2 }],
    outputs: [{ itemId: "baked_potato", quantity: 1 }],
    craftingTime: 4000,
    requiresBuilding: "bonfire",
  },
  recipe_bread: {
    id: "recipe_bread",
    blueprintId: "bp_bonfire",
    inputs: [{ itemId: "wheat", quantity: 3 }],
    outputs: [{ itemId: "bread", quantity: 1 }],
    craftingTime: 4000,
    requiresBuilding: "bonfire",
  },
  recipe_vegetable_stew: {
    id: "recipe_vegetable_stew",
    blueprintId: "bp_bonfire",
    inputs: [
      { itemId: "carrot", quantity: 2 },
      { itemId: "potato", quantity: 2 },
      { itemId: "tomato", quantity: 1 },
    ],
    outputs: [{ itemId: "vegetable_stew", quantity: 1 }],
    craftingTime: 8000,
    requiresBuilding: "bonfire",
  },
  recipe_fish_stew: {
    id: "recipe_fish_stew",
    blueprintId: "bp_bonfire",
    inputs: [
      { itemId: "fish", quantity: 2 },
      { itemId: "potato", quantity: 1 },
    ],
    outputs: [{ itemId: "fish_stew", quantity: 1 }],
    craftingTime: 8000,
    requiresBuilding: "bonfire",
  },
  recipe_sunflower_cake: {
    id: "recipe_sunflower_cake",
    blueprintId: "bp_bakery",
    inputs: [
      { itemId: "sunflower", quantity: 3 },
      { itemId: "wheat", quantity: 2 },
      { itemId: "bread", quantity: 1 },
    ],
    outputs: [{ itemId: "sunflower_cake", quantity: 1 }],
    craftingTime: 12000,
    requiresBuilding: "bakery",
  },
};

export function getRecipe(id: string): RecipeDefinition {
  const recipe = RECIPES[id];
  if (!recipe) throw new Error(`Unknown recipe id: ${id}`);
  return recipe;
}

/** Get recipe by blueprint id */
export function getRecipeByBlueprint(blueprintId: string): RecipeDefinition | undefined {
  return Object.values(RECIPES).find((r) => r.blueprintId === blueprintId);
}
