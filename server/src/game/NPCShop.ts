import { PlayerSchema } from "../schema/PlayerSchema";
import { addToInventory, removeFromInventory, countInventory } from "../schema/InventorySchema";
import { getItem, ITEMS } from "../data/items";
import { getBlueprint, getShopBlueprints } from "../data/blueprints";
import { CraftingSystem } from "./CraftingSystem";
import { NPCPriceEntry } from "../types";

/**
 * NPCShop handles dynamic pricing for buying and selling items to the NPC.
 *
 * Dynamic pricing for player → NPC sells:
 *   price = basePrice * (1 / (1 + sellCount * 0.01))
 *
 * Decay: sellCount decreases by 10% every hour automatically.
 *
 * The shop state (sell counts, last decay times) is stored in memory on the
 * server and shared across all players in the room.
 */
export class NPCShop {
  // Global sell counts per item (persisted in-memory, reset on server restart)
  private priceTable: Map<string, NPCPriceEntry> = new Map();

  constructor() {
    this.initializePriceTable();
  }

  private initializePriceTable(): void {
    // Pre-populate with all sellable items
    for (const itemId of Object.keys(ITEMS)) {
      this.priceTable.set(itemId, {
        itemId,
        basePrice: ITEMS[itemId].sellPrice,
        sellCount: 0,
        lastDecayTime: Date.now(),
      });
    }
  }

  /**
   * Apply time-based decay to sell counts.
   * sellCount decreases by 10% every hour.
   */
  private applyDecay(entry: NPCPriceEntry): void {
    const now = Date.now();
    const hoursElapsed = (now - entry.lastDecayTime) / (1000 * 60 * 60);

    if (hoursElapsed >= 1) {
      const decayFactor = Math.pow(0.9, Math.floor(hoursElapsed));
      entry.sellCount = Math.floor(entry.sellCount * decayFactor);
      entry.lastDecayTime = now - ((hoursElapsed % 1) * 1000 * 60 * 60);
    }
  }

  /**
   * Get the current dynamic sell price for an item (player sells to NPC).
   * price = basePrice * (1 / (1 + sellCount * 0.01))
   */
  getCurrentSellPrice(itemId: string): number {
    let entry = this.priceTable.get(itemId);
    if (!entry) {
      // Unknown item — no price
      return 0;
    }
    this.applyDecay(entry);
    const price = entry.basePrice * (1 / (1 + entry.sellCount * 0.01));
    return Math.max(1, Math.floor(price));
  }

  /**
   * Get the NPC buy price (player buys item from NPC).
   * NPC buy price is fixed (not dynamic) — uses item.buyPrice.
   * Returns 0 if the item is not sold by the NPC.
   */
  getNPCBuyPrice(itemId: string): number {
    let itemDef;
    try {
      itemDef = getItem(itemId);
    } catch {
      return 0;
    }
    return itemDef.buyPrice ?? 0;
  }

  /**
   * Player sells items to the NPC.
   * Updates dynamic price table and gives player silver.
   */
  sellToNPC(
    player: PlayerSchema,
    itemId: string,
    quantity: number
  ): { success: boolean; error?: string; silverEarned?: number } {
    // Validate item exists
    let itemDef;
    try {
      itemDef = getItem(itemId);
    } catch {
      return { success: false, error: "Unknown item." };
    }

    // Can't sell blueprints or buildings directly to NPC (they are crafted buildings)
    if (itemDef.type === "blueprint") {
      return { success: false, error: "Cannot sell blueprints to the NPC shop." };
    }

    // Check player has enough
    const available = countInventory(player.inventory, itemId);
    if (available < quantity) {
      return {
        success: false,
        error: `Not enough ${itemDef.name}. Have ${available}, trying to sell ${quantity}.`,
      };
    }

    // Calculate price
    const pricePerItem = this.getCurrentSellPrice(itemId);
    if (pricePerItem <= 0) {
      return { success: false, error: "This item cannot be sold to the NPC." };
    }

    const totalSilver = pricePerItem * quantity;

    // Remove from inventory
    removeFromInventory(player.inventory, itemId, quantity);

    // Give silver
    player.silver += totalSilver;

    // Update sell count for price decay
    const entry = this.priceTable.get(itemId);
    if (entry) {
      entry.sellCount += quantity;
    }

    return { success: true, silverEarned: totalSilver };
  }

  /**
   * Player buys items from the NPC shop.
   * Price is fixed (item.buyPrice).
   */
  buyFromNPC(
    player: PlayerSchema,
    itemId: string,
    quantity: number
  ): { success: boolean; error?: string; silverSpent?: number } {
    let itemDef;
    try {
      itemDef = getItem(itemId);
    } catch {
      return { success: false, error: "Unknown item." };
    }

    const pricePerItem = this.getNPCBuyPrice(itemId);
    if (pricePerItem <= 0) {
      return { success: false, error: `${itemDef.name} is not sold by the NPC.` };
    }

    const totalCost = pricePerItem * quantity;
    if (player.silver < totalCost) {
      return {
        success: false,
        error: `Not enough Silver. Need ${totalCost}, have ${player.silver}.`,
      };
    }

    // Deduct silver and give items
    player.silver -= totalCost;
    addToInventory(player.inventory, itemId, quantity);

    return { success: true, silverSpent: totalCost };
  }

  /**
   * Player buys a blueprint from the NPC shop.
   */
  buyBlueprint(
    player: PlayerSchema,
    blueprintId: string
  ): { success: boolean; error?: string } {
    let bp;
    try {
      bp = getBlueprint(blueprintId);
    } catch {
      return { success: false, error: "Unknown blueprint." };
    }

    if (bp.unlockCost <= 0) {
      return { success: false, error: "This blueprint is not available in the NPC shop." };
    }

    if (player.level < bp.unlockLevel) {
      return {
        success: false,
        error: `You need to be level ${bp.unlockLevel} to buy this blueprint.`,
      };
    }

    if (CraftingSystem.hasBlueprint(player, blueprintId)) {
      return { success: false, error: "You already own this blueprint." };
    }

    if (player.silver < bp.unlockCost) {
      return {
        success: false,
        error: `Not enough Silver. Need ${bp.unlockCost}, have ${player.silver}.`,
      };
    }

    player.silver -= bp.unlockCost;
    CraftingSystem.grantBlueprint(player, blueprintId);

    return { success: true };
  }

  /**
   * Get all items available to buy from the NPC, with current prices.
   */
  getShopStock(playerLevel: number): Array<{
    itemId: string;
    buyPrice: number;
    type: string;
  }> {
    return Object.values(ITEMS)
      .filter((item) => item.buyPrice !== undefined && item.buyPrice > 0)
      .map((item) => ({
        itemId: item.id,
        buyPrice: item.buyPrice as number,
        type: item.type as string,
      }));
  }

  /**
   * Get blueprints available to buy, filtered by player level.
   */
  getShopBlueprints(playerLevel: number): Array<{
    blueprintId: string;
    name: string;
    cost: number;
    tier: string;
  }> {
    return getShopBlueprints(playerLevel).map((bp) => ({
      blueprintId: bp.id,
      name: bp.name,
      cost: bp.unlockCost,
      tier: bp.tier,
    }));
  }

  /**
   * Serialize price table for debugging or persistence.
   */
  getPriceSnapshot(): Array<{ itemId: string; currentPrice: number; sellCount: number }> {
    return Array.from(this.priceTable.values()).map((entry) => {
      this.applyDecay(entry);
      return {
        itemId: entry.itemId,
        currentPrice: this.getCurrentSellPrice(entry.itemId),
        sellCount: entry.sellCount,
      };
    });
  }
}
