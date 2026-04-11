import { describe, it, expect } from "vitest";
import { ITEMS, getItem, ALL_ITEM_IDS } from "../data/items";
import { RECIPES, getRecipe } from "../data/recipes";
import { QUESTS, getQuest } from "../data/quests";
import { BLUEPRINTS, getBlueprint, getShopBlueprints } from "../data/blueprints";
import { ItemDefinition, RecipeDefinition, QuestDefinition } from "../types";

describe("Data validation", () => {
  // ── Items ─────────────────────────────────────────────────────────
  describe("items", () => {
    it("all items have required fields", () => {
      for (const [id, item] of Object.entries(ITEMS)) {
        expect(item.id, `${id} missing id`).toBe(id);
        expect(item.name, `${id} missing name`).toBeTruthy();
        expect(item.type, `${id} missing type`).toBeTruthy();
        expect(item.stackSize, `${id} stackSize`).toBeGreaterThan(0);
        expect(item.sellPrice, `${id} sellPrice`).toBeGreaterThanOrEqual(0);
        expect(item.description, `${id} missing desc`).toBeTruthy();
        expect(item.iconKey, `${id} missing iconKey`).toBeTruthy();
      }
    });

    it("food items have energyRestore", () => {
      const foods = Object.values(ITEMS).filter((i) => i.type === "food");
      expect(foods.length).toBeGreaterThan(0);
      for (const food of foods) {
        expect(food.energyRestore, `${food.id} missing energyRestore`).toBeGreaterThan(0);
      }
    });

    it("seeds have buyPrice", () => {
      const seeds = Object.values(ITEMS).filter((i) => i.type === "seed");
      expect(seeds.length).toBeGreaterThan(0);
      for (const seed of seeds) {
        expect(seed.buyPrice, `${seed.id} missing buyPrice`).toBeGreaterThan(0);
      }
    });

    it("getItem throws for unknown id", () => {
      expect(() => getItem("fake")).toThrow();
    });

    it("has at least 30 items defined", () => {
      expect(ALL_ITEM_IDS.length).toBeGreaterThanOrEqual(30);
    });
  });

  // ── Recipes ───────────────────────────────────────────────────────
  describe("recipes", () => {
    it("all recipes have valid input item references", () => {
      for (const [id, recipe] of Object.entries(RECIPES)) {
        for (const input of recipe.inputs) {
          expect(ITEMS[input.itemId], `Recipe ${id} references unknown input: ${input.itemId}`).toBeDefined();
          expect(input.quantity, `Recipe ${id} input ${input.itemId} quantity`).toBeGreaterThan(0);
        }
      }
    });

    it("all recipes have valid output item references", () => {
      for (const [id, recipe] of Object.entries(RECIPES)) {
        for (const output of recipe.outputs) {
          expect(ITEMS[output.itemId], `Recipe ${id} references unknown output: ${output.itemId}`).toBeDefined();
          expect(output.quantity, `Recipe ${id} output ${output.itemId} quantity`).toBeGreaterThan(0);
        }
      }
    });

    it("all recipes have a blueprintId", () => {
      for (const [id, recipe] of Object.entries(RECIPES)) {
        expect(recipe.blueprintId, `Recipe ${id} missing blueprintId`).toBeTruthy();
      }
    });

    it("all recipes have positive crafting time", () => {
      for (const [id, recipe] of Object.entries(RECIPES)) {
        expect(recipe.craftingTime, `Recipe ${id} craftingTime`).toBeGreaterThan(0);
      }
    });

    it("building requirements reference valid building items", () => {
      for (const [id, recipe] of Object.entries(RECIPES)) {
        if (recipe.requiresBuilding) {
          expect(
            ITEMS[recipe.requiresBuilding],
            `Recipe ${id} requires unknown building: ${recipe.requiresBuilding}`
          ).toBeDefined();
        }
      }
    });

    it("getRecipe throws for unknown id", () => {
      expect(() => getRecipe("fake")).toThrow();
    });
  });

  // ── Quests ────────────────────────────────────────────────────────
  describe("quests", () => {
    it("all quests have required fields", () => {
      for (const [id, quest] of Object.entries(QUESTS)) {
        expect(quest.id, `${id} missing id`).toBe(id);
        expect(quest.title, `${id} missing title`).toBeTruthy();
        expect(quest.description, `${id} missing desc`).toBeTruthy();
        expect(quest.requiredLevel, `${id} requiredLevel`).toBeGreaterThanOrEqual(1);
        expect(quest.objectives.length, `${id} no objectives`).toBeGreaterThan(0);
        expect(quest.rewards, `${id} missing rewards`).toBeDefined();
        expect(quest.rewards.xp, `${id} rewards.xp`).toBeGreaterThanOrEqual(0);
      }
    });

    it("quest objectives have valid types", () => {
      const validTypes = ["gather", "craft", "deliver", "build", "reach_level"];
      for (const [id, quest] of Object.entries(QUESTS)) {
        for (const obj of quest.objectives) {
          expect(validTypes, `${id} invalid objective type: ${obj.type}`).toContain(obj.type);
          expect(obj.description, `${id} objective missing desc`).toBeTruthy();
        }
      }
    });

    it("quest item objectives reference valid items", () => {
      for (const [id, quest] of Object.entries(QUESTS)) {
        for (const obj of quest.objectives) {
          if (obj.itemId) {
            expect(
              ITEMS[obj.itemId],
              `Quest ${id} objective references unknown item: ${obj.itemId}`
            ).toBeDefined();
          }
        }
      }
    });

    it("quest item rewards reference valid items", () => {
      for (const [id, quest] of Object.entries(QUESTS)) {
        if (quest.rewards.itemRewards) {
          for (const reward of quest.rewards.itemRewards) {
            expect(
              ITEMS[reward.itemId],
              `Quest ${id} reward references unknown item: ${reward.itemId}`
            ).toBeDefined();
          }
        }
      }
    });

    it("quest prerequisites reference valid quests", () => {
      for (const [id, quest] of Object.entries(QUESTS)) {
        for (const prereq of quest.prerequisiteQuestIds) {
          expect(
            QUESTS[prereq],
            `Quest ${id} prerequisite references unknown quest: ${prereq}`
          ).toBeDefined();
        }
      }
    });

    it("getQuest throws for unknown id", () => {
      expect(() => getQuest("fake")).toThrow();
    });

    it("starter quest has no prerequisites", () => {
      const starterQuest = QUESTS["quest_gather_carrots"];
      expect(starterQuest.prerequisiteQuestIds).toHaveLength(0);
      expect(starterQuest.requiredLevel).toBe(1);
    });
  });

  // ── Blueprints ─────────────────────────────────────────────────────
  describe("blueprints", () => {
    it("all blueprints have required fields", () => {
      for (const [id, bp] of Object.entries(BLUEPRINTS)) {
        expect(bp.id, `${id} missing id`).toBe(id);
        expect(bp.name, `${id} missing name`).toBeTruthy();
        expect(bp.tier, `${id} missing tier`).toBeTruthy();
        expect(bp.description, `${id} missing desc`).toBeTruthy();
        expect(bp.unlockLevel, `${id} unlockLevel`).toBeGreaterThanOrEqual(1);
        expect(bp.craftingRecipeId, `${id} missing craftingRecipeId`).toBeTruthy();
      }
    });

    it("getBlueprint returns correct blueprint", () => {
      const bp = getBlueprint("bp_soil_bed");
      expect(bp.id).toBe("bp_soil_bed");
      expect(bp.name).toBeTruthy();
    });

    it("getBlueprint throws for unknown id", () => {
      expect(() => getBlueprint("bp_fake")).toThrow();
    });

    it("getShopBlueprints returns purchasable blueprints for level", () => {
      const shopBps = getShopBlueprints(1);
      expect(shopBps.length).toBeGreaterThan(0);
      for (const bp of shopBps) {
        expect(bp.unlockCost).toBeGreaterThan(0);
        expect(bp.unlockLevel).toBeLessThanOrEqual(1);
      }
    });

    it("getShopBlueprints returns more blueprints at higher level", () => {
      const level1 = getShopBlueprints(1);
      const level10 = getShopBlueprints(10);
      expect(level10.length).toBeGreaterThanOrEqual(level1.length);
    });

    it("getShopBlueprints excludes quest-only blueprints (cost 0)", () => {
      const shopBps = getShopBlueprints(99);
      for (const bp of shopBps) {
        expect(bp.unlockCost).toBeGreaterThan(0);
      }
    });

    it("blueprint craftingRecipeId references valid recipe", () => {
      for (const [id, bp] of Object.entries(BLUEPRINTS)) {
        expect(
          RECIPES[bp.craftingRecipeId],
          `Blueprint ${id} references unknown recipe: ${bp.craftingRecipeId}`
        ).toBeDefined();
      }
    });
  });
});
