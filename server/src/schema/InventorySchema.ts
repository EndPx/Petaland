import { Schema, type, MapSchema, ArraySchema } from "@colyseus/schema";

/**
 * A single inventory slot — one item id + quantity.
 * Used inside PlayerSchema.inventory as a MapSchema keyed by itemId.
 */
export class InventorySlotSchema extends Schema {
  @type("string") itemId: string = "";
  @type("number") quantity: number = 0;
}

/**
 * Standalone inventory container (e.g. for Storage Box buildings).
 * Not attached to a player directly — referenced by building id.
 */
export class StorageInventorySchema extends Schema {
  @type("string") ownerId: string = ""; // player session id who owns this storage
  @type("string") buildingId: string = "";
  @type("number") capacity: number = 20; // max unique item slots
  @type({ map: InventorySlotSchema }) slots = new MapSchema<InventorySlotSchema>();
}

/**
 * Helper: add items to a MapSchema<InventorySlotSchema>
 */
export function addToInventory(
  inventory: MapSchema<InventorySlotSchema>,
  itemId: string,
  quantity: number,
  stackSize: number = 99
): boolean {
  const existing = inventory.get(itemId);
  if (existing) {
    const newQty = existing.quantity + quantity;
    if (newQty > stackSize * 10) return false; // soft cap
    existing.quantity = newQty;
  } else {
    const slot = new InventorySlotSchema();
    slot.itemId = itemId;
    slot.quantity = quantity;
    inventory.set(itemId, slot);
  }
  return true;
}

/**
 * Helper: remove items from inventory. Returns false if not enough.
 */
export function removeFromInventory(
  inventory: MapSchema<InventorySlotSchema>,
  itemId: string,
  quantity: number
): boolean {
  const existing = inventory.get(itemId);
  if (!existing || existing.quantity < quantity) return false;
  existing.quantity -= quantity;
  if (existing.quantity <= 0) {
    inventory.delete(itemId);
  }
  return true;
}

/**
 * Helper: count how many of an item a player has.
 */
export function countInventory(
  inventory: MapSchema<InventorySlotSchema>,
  itemId: string
): number {
  return inventory.get(itemId)?.quantity ?? 0;
}
