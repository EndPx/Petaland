import { describe, it, expect, beforeEach, vi } from "vitest";
import { EnergySystem } from "../game/EnergySystem";
import { createMockPlayer, giveItems } from "./helpers";
import { ENERGY_COSTS, BASE_MAX_ENERGY, ENERGY_PER_LEVEL, ENERGY_REGEN_PER_HOUR } from "../types";
import { PlayerSchema } from "../schema/PlayerSchema";

describe("EnergySystem", () => {
  let player: PlayerSchema;

  beforeEach(() => {
    player = createMockPlayer({ energy: 100, maxEnergy: 100, level: 1 });
  });

  // ── getMaxEnergy ──────────────────────────────────────────────────
  describe("getMaxEnergy", () => {
    it("returns base energy at level 1", () => {
      expect(EnergySystem.getMaxEnergy(1)).toBe(BASE_MAX_ENERGY);
    });

    it("increases by ENERGY_PER_LEVEL per level", () => {
      expect(EnergySystem.getMaxEnergy(5)).toBe(BASE_MAX_ENERGY + 4 * ENERGY_PER_LEVEL);
    });

    it("returns correct value at level 10", () => {
      expect(EnergySystem.getMaxEnergy(10)).toBe(BASE_MAX_ENERGY + 9 * ENERGY_PER_LEVEL);
    });
  });

  // ── spend ─────────────────────────────────────────────────────────
  describe("spend", () => {
    it("deducts correct energy for gather action", () => {
      player.energy = 100;
      const result = EnergySystem.spend(player, "gather");
      expect(result).toBe(true);
      expect(player.energy).toBe(100 - ENERGY_COSTS.gather);
    });

    it("deducts correct energy for craft action", () => {
      player.energy = 100;
      const result = EnergySystem.spend(player, "craft");
      expect(result).toBe(true);
      expect(player.energy).toBe(100 - ENERGY_COSTS.craft);
    });

    it("deducts correct energy for plant action", () => {
      player.energy = 100;
      const result = EnergySystem.spend(player, "plant");
      expect(result).toBe(true);
      expect(player.energy).toBe(100 - ENERGY_COSTS.plant);
    });

    it("deducts correct energy for harvest action", () => {
      player.energy = 100;
      const result = EnergySystem.spend(player, "harvest");
      expect(result).toBe(true);
      expect(player.energy).toBe(100 - ENERGY_COSTS.harvest);
    });

    it("returns false when not enough energy", () => {
      player.energy = 2;
      const result = EnergySystem.spend(player, "gather"); // costs 5
      expect(result).toBe(false);
      expect(player.energy).toBe(2); // unchanged
    });

    it("move costs 0 energy", () => {
      player.energy = 50;
      const result = EnergySystem.spend(player, "move");
      expect(result).toBe(true);
      expect(player.energy).toBe(50);
    });

    it("updates lastActionTime on successful spend", () => {
      const before = Date.now();
      EnergySystem.spend(player, "gather");
      expect(player.lastActionTime).toBeGreaterThanOrEqual(before);
    });
  });

  // ── canAfford ──────────────────────────────────────────────────────
  describe("canAfford", () => {
    it("returns true when player has enough energy", () => {
      player.energy = 100;
      expect(EnergySystem.canAfford(player, "gather")).toBe(true);
    });

    it("returns false when player has insufficient energy", () => {
      player.energy = 3;
      expect(EnergySystem.canAfford(player, "craft")).toBe(false); // costs 10
    });

    it("returns true when energy exactly matches cost", () => {
      player.energy = ENERGY_COSTS.gather;
      expect(EnergySystem.canAfford(player, "gather")).toBe(true);
    });
  });

  // ── applyRegen ────────────────────────────────────────────────────
  describe("applyRegen", () => {
    it("regenerates energy based on elapsed time", () => {
      player.energy = 50;
      player.lastActionTime = Date.now() - (2 * 60 * 60 * 1000); // 2 hours ago
      EnergySystem.applyRegen(player);
      expect(player.energy).toBe(50 + 2 * ENERGY_REGEN_PER_HOUR);
    });

    it("does not exceed max energy", () => {
      player.energy = 95;
      player.maxEnergy = 100;
      player.lastActionTime = Date.now() - (10 * 60 * 60 * 1000); // 10 hours ago
      EnergySystem.applyRegen(player);
      expect(player.energy).toBe(100);
    });

    it("no regen if already at max", () => {
      player.energy = 100;
      player.maxEnergy = 100;
      EnergySystem.applyRegen(player);
      expect(player.energy).toBe(100);
    });

    it("sets full energy if no last action time", () => {
      player.energy = 0;
      player.lastActionTime = 0;
      EnergySystem.applyRegen(player);
      expect(player.energy).toBe(EnergySystem.getMaxEnergy(player.level));
    });

    it("no regen for sub-hour elapsed time", () => {
      player.energy = 50;
      player.lastActionTime = Date.now() - (30 * 60 * 1000); // 30 min ago
      EnergySystem.applyRegen(player);
      // 30 min = 0.5 hours, floor(0.5 * 10) = 5
      expect(player.energy).toBe(55);
    });
  });

  // ── eatFood ───────────────────────────────────────────────────────
  describe("eatFood", () => {
    it("restores energy from food item", () => {
      player.energy = 50;
      giveItems(player, "roasted_carrot", 1);
      const restored = EnergySystem.eatFood(player, "roasted_carrot");
      expect(restored).toBe(20); // roasted_carrot restores 20
      expect(player.energy).toBe(70);
    });

    it("consumes the food item from inventory", () => {
      giveItems(player, "roasted_carrot", 3);
      EnergySystem.eatFood(player, "roasted_carrot");
      const slot = player.inventory.get("roasted_carrot");
      expect(slot?.quantity).toBe(2);
    });

    it("removes slot when last food consumed", () => {
      giveItems(player, "roasted_carrot", 1);
      EnergySystem.eatFood(player, "roasted_carrot");
      expect(player.inventory.get("roasted_carrot")).toBeUndefined();
    });

    it("caps energy at max", () => {
      player.energy = 95;
      player.maxEnergy = 100;
      giveItems(player, "roasted_carrot", 1); // restores 20
      const restored = EnergySystem.eatFood(player, "roasted_carrot");
      expect(restored).toBe(5); // only 5 room
      expect(player.energy).toBe(100);
    });

    it("returns 0 for non-food item", () => {
      giveItems(player, "wood", 5);
      const restored = EnergySystem.eatFood(player, "wood");
      expect(restored).toBe(0);
    });

    it("returns 0 for item not in inventory", () => {
      const restored = EnergySystem.eatFood(player, "roasted_carrot");
      expect(restored).toBe(0);
    });

    it("returns 0 for unknown item", () => {
      const restored = EnergySystem.eatFood(player, "fake_item");
      expect(restored).toBe(0);
    });
  });

  // ── onLevelUp ─────────────────────────────────────────────────────
  describe("onLevelUp", () => {
    it("increases max energy on level up", () => {
      player.level = 2;
      player.maxEnergy = BASE_MAX_ENERGY;
      EnergySystem.onLevelUp(player);
      expect(player.maxEnergy).toBe(BASE_MAX_ENERGY + ENERGY_PER_LEVEL);
    });

    it("awards bonus energy equal to new headroom", () => {
      player.level = 2;
      player.energy = 100;
      player.maxEnergy = BASE_MAX_ENERGY;
      EnergySystem.onLevelUp(player);
      expect(player.energy).toBe(100 + ENERGY_PER_LEVEL);
    });
  });

  // ── timeToFullRegen ───────────────────────────────────────────────
  describe("timeToFullRegen", () => {
    it("returns 0 when at full energy", () => {
      player.energy = 100;
      player.maxEnergy = 100;
      expect(EnergySystem.timeToFullRegen(player)).toBe(0);
    });

    it("returns correct ms for deficit", () => {
      player.energy = 90;
      player.maxEnergy = 100;
      const msPerPoint = (1000 * 60 * 60) / ENERGY_REGEN_PER_HOUR;
      expect(EnergySystem.timeToFullRegen(player)).toBe(10 * msPerPoint);
    });
  });
});
