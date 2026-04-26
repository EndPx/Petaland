/**
 * Hoard limits — anti-cheat ceilings for inventory and currencies.
 *
 * Pattern: Sunflower Land's `MAX_INVENTORY_ITEMS`.
 * After every state transition, `checkProgress()` compares the delta
 * (newInventory - prevInventory) against these caps. If a player
 * suddenly has 100,000 wheat from one action, the action is rejected.
 *
 * This is what stops bots — no matter how clever the client-side
 * cheat is, the server runs the same checkProgress and rejects.
 */

import type { PlotState } from './types';

/** Per-item maximum a player may hold at once. */
export const MAX_INVENTORY_ITEMS: Record<string, number> = {
  // Resources
  wood: 9999,
  stone: 9999,
  carrot: 9999,
  wheat: 9999,

  // Seeds
  carrot_seed: 999,
  wheat_seed: 999,

  // Crafted
  bread: 99,
  carrot_soup: 99,
};

/** Default cap for any item not listed above. */
export const DEFAULT_INVENTORY_CAP = 9999;

/** Currency caps. Silver/petal are large; energy is per-player max. */
export const MAX_SILVER = 1_000_000_000;
export const MAX_PETAL = 1_000_000;
export const MIN_ENERGY = 0;

/** Maximum XP gain per single action — anti-cheat */
export const MAX_XP_PER_ACTION = 10_000;

/**
 * Verifies that the new state didn't violate hoard limits relative to
 * the previous state. Throws on violation; returns silently on success.
 *
 * Run this AFTER every successful action. Server runs the same check.
 * If the throw fires server-side, the action is rolled back and the
 * client gets the previous-state response.
 */
export function checkProgress(prev: PlotState, next: PlotState): void {
  // ── Inventory caps ──
  for (const [item, qty] of Object.entries(next.inventory)) {
    const cap = MAX_INVENTORY_ITEMS[item] ?? DEFAULT_INVENTORY_CAP;
    if (qty > cap) {
      throw new Error(
        `Hoard limit exceeded: ${item} = ${qty}, cap = ${cap}`,
      );
    }
    if (qty < 0) {
      throw new Error(`Inventory underflow: ${item} = ${qty}`);
    }
  }

  // ── Currency caps ──
  if (next.silver > MAX_SILVER) {
    throw new Error(`Silver hoard limit exceeded: ${next.silver}`);
  }
  if (next.silver < 0) {
    throw new Error(`Silver underflow: ${next.silver}`);
  }
  if (next.petal > MAX_PETAL) {
    throw new Error(`$PETAL hoard limit exceeded: ${next.petal}`);
  }
  if (next.petal < 0) {
    throw new Error(`$PETAL underflow: ${next.petal}`);
  }

  // ── Energy bounds ──
  if (next.energy < MIN_ENERGY) {
    throw new Error(`Energy underflow: ${next.energy}`);
  }
  if (next.energy > next.maxEnergy) {
    throw new Error(
      `Energy overflow: ${next.energy} > maxEnergy ${next.maxEnergy}`,
    );
  }

  // ── XP per-action cap ──
  const xpDelta = next.xp - prev.xp;
  if (xpDelta > MAX_XP_PER_ACTION) {
    throw new Error(
      `XP gain too large in single action: +${xpDelta}, max = ${MAX_XP_PER_ACTION}`,
    );
  }
}
