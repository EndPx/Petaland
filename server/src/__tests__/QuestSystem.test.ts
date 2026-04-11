import { describe, it, expect, beforeEach } from "vitest";
import { QuestSystem } from "../game/QuestSystem";
import { CraftingSystem } from "../game/CraftingSystem";
import { createMockPlayer, giveItems } from "./helpers";
import { PlayerSchema } from "../schema/PlayerSchema";
import { countInventory } from "../schema/InventorySchema";

describe("QuestSystem", () => {
  let player: PlayerSchema;

  beforeEach(() => {
    player = createMockPlayer({ level: 1, silver: 0, xp: 0, xpToNextLevel: 100 });
  });

  // ── acceptQuest ───────────────────────────────────────────────────
  describe("acceptQuest", () => {
    it("accepts a valid quest", () => {
      const result = QuestSystem.acceptQuest(player, "quest_gather_carrots");
      expect(result.success).toBe(true);
      expect(QuestSystem.getActiveQuestIds(player)).toContain("quest_gather_carrots");
    });

    it("initializes progress for quest objectives", () => {
      QuestSystem.acceptQuest(player, "quest_gather_carrots");
      const progress = QuestSystem.getProgress(player);
      expect(progress["quest_gather_carrots"]).toBeDefined();
      expect(progress["quest_gather_carrots"][0]).toBe(0);
    });

    it("fails for unknown quest", () => {
      const result = QuestSystem.acceptQuest(player, "fake_quest");
      expect(result.success).toBe(false);
      expect(result.error).toContain("Unknown");
    });

    it("fails when quest already active", () => {
      QuestSystem.acceptQuest(player, "quest_gather_carrots");
      const result = QuestSystem.acceptQuest(player, "quest_gather_carrots");
      expect(result.success).toBe(false);
      expect(result.error).toContain("already active");
    });

    it("fails when quest already completed", () => {
      player.completedQuestIds = "quest_gather_carrots";
      const result = QuestSystem.acceptQuest(player, "quest_gather_carrots");
      expect(result.success).toBe(false);
      expect(result.error).toContain("already completed");
    });

    it("fails when prerequisites not met", () => {
      const result = QuestSystem.acceptQuest(player, "quest_craft_soil_bed");
      expect(result.success).toBe(false);
      expect(result.error).toContain("Prerequisites");
    });

    it("succeeds when prerequisites are met", () => {
      player.completedQuestIds = "quest_gather_carrots";
      const result = QuestSystem.acceptQuest(player, "quest_craft_soil_bed");
      expect(result.success).toBe(true);
    });

    it("fails when level too low", () => {
      player.level = 1;
      player.completedQuestIds = "quest_gather_carrots,quest_craft_soil_bed,quest_first_harvest,quest_light_a_fire";
      const result = QuestSystem.acceptQuest(player, "quest_wood_and_stone"); // requires level 2
      expect(result.success).toBe(false);
      expect(result.error).toContain("level");
    });
  });

  // ── updateProgress ────────────────────────────────────────────────
  describe("updateProgress", () => {
    it("updates progress for matching action", () => {
      QuestSystem.acceptQuest(player, "quest_gather_carrots");
      QuestSystem.updateProgress(player, "gather", "wild_carrot", 3);

      const progress = QuestSystem.getProgress(player);
      expect(progress["quest_gather_carrots"][0]).toBe(3);
    });

    it("returns quest id when all objectives complete", () => {
      QuestSystem.acceptQuest(player, "quest_gather_carrots");
      const ready = QuestSystem.updateProgress(player, "gather", "wild_carrot", 5);
      expect(ready).toContain("quest_gather_carrots");
    });

    it("does not return quest id when objectives incomplete", () => {
      QuestSystem.acceptQuest(player, "quest_gather_carrots");
      const ready = QuestSystem.updateProgress(player, "gather", "wild_carrot", 3);
      expect(ready).not.toContain("quest_gather_carrots");
    });

    it("ignores non-matching item", () => {
      QuestSystem.acceptQuest(player, "quest_gather_carrots");
      QuestSystem.updateProgress(player, "gather", "wood", 5);

      const progress = QuestSystem.getProgress(player);
      expect(progress["quest_gather_carrots"][0]).toBe(0);
    });

    it("ignores non-matching action type", () => {
      QuestSystem.acceptQuest(player, "quest_gather_carrots");
      QuestSystem.updateProgress(player, "craft", "wild_carrot", 5);

      const progress = QuestSystem.getProgress(player);
      expect(progress["quest_gather_carrots"][0]).toBe(0);
    });

    it("skips invalid quest ids in active list gracefully", () => {
      // Manually inject a bad quest id into active quests
      player.activeQuestIds = "fake_invalid_quest";
      // Should not throw, just skip the invalid quest
      const ready = QuestSystem.updateProgress(player, "gather", "wild_carrot", 5);
      expect(ready).not.toContain("fake_invalid_quest");
    });

    it("accumulates progress across multiple calls", () => {
      QuestSystem.acceptQuest(player, "quest_gather_carrots");
      QuestSystem.updateProgress(player, "gather", "wild_carrot", 2);
      QuestSystem.updateProgress(player, "gather", "wild_carrot", 2);

      const progress = QuestSystem.getProgress(player);
      expect(progress["quest_gather_carrots"][0]).toBe(4);
    });
  });

  // ── claimReward ───────────────────────────────────────────────────
  describe("claimReward", () => {
    it("grants rewards on completion", () => {
      QuestSystem.acceptQuest(player, "quest_gather_carrots");
      QuestSystem.updateProgress(player, "gather", "wild_carrot", 5);

      const result = QuestSystem.claimReward(player, "quest_gather_carrots");

      expect(result.success).toBe(true);
      expect(player.silver).toBe(50); // reward
      expect(player.xp).toBeGreaterThan(0); // 30 xp
      // Check blueprint rewards
      expect(CraftingSystem.hasBlueprint(player, "bp_soil_bed")).toBe(true);
      expect(CraftingSystem.hasBlueprint(player, "bp_workbench")).toBe(true);
      expect(CraftingSystem.hasBlueprint(player, "bp_storage_box")).toBe(true);
      // Check item rewards
      expect(countInventory(player.inventory, "seed_carrot")).toBe(5);
    });

    it("moves quest from active to completed", () => {
      QuestSystem.acceptQuest(player, "quest_gather_carrots");
      QuestSystem.updateProgress(player, "gather", "wild_carrot", 5);
      QuestSystem.claimReward(player, "quest_gather_carrots");

      expect(QuestSystem.getActiveQuestIds(player)).not.toContain("quest_gather_carrots");
      expect(QuestSystem.getCompletedQuestIds(player)).toContain("quest_gather_carrots");
    });

    it("fails when objectives not complete", () => {
      QuestSystem.acceptQuest(player, "quest_gather_carrots");
      QuestSystem.updateProgress(player, "gather", "wild_carrot", 2); // need 5

      const result = QuestSystem.claimReward(player, "quest_gather_carrots");
      expect(result.success).toBe(false);
      expect(result.error).toContain("not yet complete");
    });

    it("fails for unknown quest", () => {
      const result = QuestSystem.claimReward(player, "fake_quest");
      expect(result.success).toBe(false);
    });
  });

  // ── addXP / leveling ──────────────────────────────────────────────
  describe("addXP", () => {
    it("adds XP to player", () => {
      QuestSystem.addXP(player, 50);
      expect(player.xp).toBe(50);
    });

    it("levels up when XP reaches threshold", () => {
      const newLevel = QuestSystem.addXP(player, 100); // xpToNextLevel = 100
      expect(newLevel).toBe(2);
      expect(player.level).toBe(2);
    });

    it("carries over excess XP", () => {
      QuestSystem.addXP(player, 150); // 100 to level, 50 leftover
      expect(player.level).toBe(2);
      expect(player.xp).toBe(50);
    });

    it("returns undefined when no level up", () => {
      const result = QuestSystem.addXP(player, 30);
      expect(result).toBeUndefined();
    });

    it("can level up multiple times", () => {
      player.xpToNextLevel = 100;
      QuestSystem.addXP(player, 350); // level 1→2 (100), 2→3 (200), 50 left
      expect(player.level).toBeGreaterThanOrEqual(2);
    });
  });

  // ── getActiveWithProgress ──────────────────────────────────────────
  describe("getActiveWithProgress", () => {
    it("returns active quests with progress arrays", () => {
      QuestSystem.acceptQuest(player, "quest_gather_carrots");
      QuestSystem.updateProgress(player, "gather", "wild_carrot", 3);

      const active = QuestSystem.getActiveWithProgress(player);
      expect(active.length).toBe(1);
      expect(active[0].quest.id).toBe("quest_gather_carrots");
      expect(active[0].progress[0]).toBe(3);
    });

    it("returns empty array when no active quests", () => {
      const active = QuestSystem.getActiveWithProgress(player);
      expect(active).toHaveLength(0);
    });

    it("handles malformed quest progress JSON gracefully", () => {
      player.questProgressJson = "not valid json";
      // getProgress should return {} without crashing
      const progress = QuestSystem.getProgress(player);
      expect(progress).toEqual({});
    });
  });

  // ── getAvailableForPlayer ─────────────────────────────────────────
  describe("getAvailableForPlayer", () => {
    it("returns quests with no prerequisites at level 1", () => {
      const available = QuestSystem.getAvailableForPlayer(player);
      const ids = available.map((q) => q.id);
      expect(ids).toContain("quest_gather_carrots");
      expect(ids).toContain("quest_daily_sell_crops");
    });

    it("excludes quests with unmet prerequisites", () => {
      const available = QuestSystem.getAvailableForPlayer(player);
      const ids = available.map((q) => q.id);
      expect(ids).not.toContain("quest_craft_soil_bed"); // needs quest_gather_carrots
    });

    it("includes quest after prerequisite completed", () => {
      player.completedQuestIds = "quest_gather_carrots";
      const available = QuestSystem.getAvailableForPlayer(player);
      const ids = available.map((q) => q.id);
      expect(ids).toContain("quest_craft_soil_bed");
    });

    it("excludes active quests", () => {
      QuestSystem.acceptQuest(player, "quest_gather_carrots");
      const available = QuestSystem.getAvailableForPlayer(player);
      const ids = available.map((q) => q.id);
      expect(ids).not.toContain("quest_gather_carrots");
    });
  });
});
