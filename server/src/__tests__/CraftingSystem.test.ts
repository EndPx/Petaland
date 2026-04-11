import { describe, it, expect, beforeEach } from "vitest";
import { CraftingSystem } from "../game/CraftingSystem";
import { createMockPlayer, createMockGameState, giveItems } from "./helpers";
import { PlayerSchema } from "../schema/PlayerSchema";
import { GameState } from "../schema/GameState";
import { countInventory } from "../schema/InventorySchema";

describe("CraftingSystem", () => {
  let player: PlayerSchema;
  let state: GameState;

  beforeEach(() => {
    player = createMockPlayer();
    state = createMockGameState();
  });

  // ── Blueprint ownership ───────────────────────────────────────────
  describe("grantBlueprint / hasBlueprint", () => {
    it("grants a blueprint to player", () => {
      CraftingSystem.grantBlueprint(player, "bp_soil_bed");
      expect(CraftingSystem.hasBlueprint(player, "bp_soil_bed")).toBe(true);
    });

    it("does not duplicate blueprints", () => {
      CraftingSystem.grantBlueprint(player, "bp_soil_bed");
      CraftingSystem.grantBlueprint(player, "bp_soil_bed");
      expect(player.blueprintsOwned.split(",").filter(Boolean).length).toBe(1);
    });

    it("returns false for unowned blueprint", () => {
      expect(CraftingSystem.hasBlueprint(player, "bp_soil_bed")).toBe(false);
    });

    it("can grant multiple blueprints", () => {
      CraftingSystem.grantBlueprint(player, "bp_soil_bed");
      CraftingSystem.grantBlueprint(player, "bp_workbench");
      expect(CraftingSystem.hasBlueprint(player, "bp_soil_bed")).toBe(true);
      expect(CraftingSystem.hasBlueprint(player, "bp_workbench")).toBe(true);
    });
  });

  // ── Crafting success ──────────────────────────────────────────────
  describe("craft - success", () => {
    it("crafts soil bed with blueprint and materials", () => {
      CraftingSystem.grantBlueprint(player, "bp_soil_bed");
      giveItems(player, "wood", 10);
      giveItems(player, "fiber", 5);

      const result = CraftingSystem.craft(player, "recipe_soil_bed", state);

      expect(result.success).toBe(true);
      expect(countInventory(player.inventory, "soil_bed")).toBe(1);
      expect(countInventory(player.inventory, "wood")).toBe(6); // 10 - 4
      expect(countInventory(player.inventory, "fiber")).toBe(3); // 5 - 2
    });

    it("crafts fence producing 3 items from recipe", () => {
      CraftingSystem.grantBlueprint(player, "bp_fence");
      giveItems(player, "wood", 10);

      const result = CraftingSystem.craft(player, "recipe_fence", state);

      expect(result.success).toBe(true);
      expect(countInventory(player.inventory, "fence")).toBe(3);
      expect(countInventory(player.inventory, "wood")).toBe(8); // 10 - 2
    });
  });

  // ── Crafting failures ─────────────────────────────────────────────
  describe("craft - failures", () => {
    it("fails without blueprint", () => {
      giveItems(player, "wood", 10);
      giveItems(player, "fiber", 5);

      const result = CraftingSystem.craft(player, "recipe_soil_bed", state);

      expect(result.success).toBe(false);
      expect(result.error).toContain("blueprint");
    });

    it("fails without enough materials", () => {
      CraftingSystem.grantBlueprint(player, "bp_soil_bed");
      giveItems(player, "wood", 2); // need 4
      giveItems(player, "fiber", 5);

      const result = CraftingSystem.craft(player, "recipe_soil_bed", state);

      expect(result.success).toBe(false);
      expect(result.error).toContain("Not enough");
    });

    it("fails with unknown recipe", () => {
      const result = CraftingSystem.craft(player, "recipe_nonexistent", state);
      expect(result.success).toBe(false);
      expect(result.error).toContain("Unknown recipe");
    });

    it("does not consume materials on failure", () => {
      CraftingSystem.grantBlueprint(player, "bp_soil_bed");
      giveItems(player, "wood", 2); // not enough
      giveItems(player, "fiber", 5);

      CraftingSystem.craft(player, "recipe_soil_bed", state);

      expect(countInventory(player.inventory, "wood")).toBe(2); // unchanged
      expect(countInventory(player.inventory, "fiber")).toBe(5); // unchanged
    });
  });

  // ── Crafting tax on others' land ──────────────────────────────────
  describe("craft - land tax", () => {
    it("applies no tax on own land", () => {
      CraftingSystem.grantBlueprint(player, "bp_soil_bed");
      giveItems(player, "wood", 10);
      giveItems(player, "fiber", 5);

      const result = CraftingSystem.craft(player, "recipe_soil_bed", state, undefined, player.sessionId);

      expect(result.success).toBe(true);
      expect(result.taxApplied).toBe(false);
      expect(countInventory(player.inventory, "soil_bed")).toBe(1);
    });

    it("applies 50% tax on others' land", () => {
      const owner = createMockPlayer({ sessionId: "owner1" });
      state.players.set("owner1", owner);

      CraftingSystem.grantBlueprint(player, "bp_soil_bed");
      giveItems(player, "wood", 10);
      giveItems(player, "fiber", 5);

      const result = CraftingSystem.craft(player, "recipe_soil_bed", state, undefined, "owner1");

      expect(result.success).toBe(true);
      expect(result.taxApplied).toBe(true);
      expect(result.taxRecipient).toBe("owner1");
      // Crafter gets ceil(1/2) = 1
      expect(countInventory(player.inventory, "soil_bed")).toBe(1);
      // Owner also gets 1 (minimum)
      expect(countInventory(owner.inventory, "soil_bed")).toBe(1);
    });

    it("applies no tax when landOwnerId is undefined (own land)", () => {
      CraftingSystem.grantBlueprint(player, "bp_fence");
      giveItems(player, "wood", 10);

      const result = CraftingSystem.craft(player, "recipe_fence", state);

      expect(result.taxApplied).toBe(false);
      expect(countInventory(player.inventory, "fence")).toBe(3); // full output
    });
  });

  // ── canCraft (dry-run) ─────────────────────────────────────────────
  describe("canCraft", () => {
    it("returns canCraft true when player has materials and blueprint", () => {
      CraftingSystem.grantBlueprint(player, "bp_soil_bed");
      giveItems(player, "wood", 10);
      giveItems(player, "fiber", 5);

      const result = CraftingSystem.canCraft(player, "recipe_soil_bed", state);
      expect(result.canCraft).toBe(true);
    });

    it("returns canCraft false with reason when missing blueprint", () => {
      giveItems(player, "wood", 10);
      giveItems(player, "fiber", 5);

      const result = CraftingSystem.canCraft(player, "recipe_soil_bed", state);
      expect(result.canCraft).toBe(false);
      expect(result.reason).toContain("blueprint");
    });
  });

  // ── Building requirements ─────────────────────────────────────────
  describe("craft - building requirements", () => {
    it("fails when recipe requires building but none provided", () => {
      CraftingSystem.grantBlueprint(player, "bp_well");
      giveItems(player, "stone", 20);
      giveItems(player, "wood", 10);
      giveItems(player, "rope", 5);

      const result = CraftingSystem.craft(player, "recipe_well", state);

      expect(result.success).toBe(false);
      expect(result.error).toContain("workbench");
    });

    it("fails when building id is invalid or inactive", () => {
      CraftingSystem.grantBlueprint(player, "bp_well");
      giveItems(player, "stone", 20);
      giveItems(player, "wood", 10);
      giveItems(player, "rope", 5);

      const result = CraftingSystem.craft(player, "recipe_well", state, "nonexistent_building");

      expect(result.success).toBe(false);
      expect(result.error).toContain("workbench");
    });
  });
});
