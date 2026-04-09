import { Schema, type, MapSchema } from "@colyseus/schema";

export class InventoryItemSchema extends Schema {
  @type("string") itemId: string = "";
  @type("number") quantity: number = 0;
}

export class PlayerSchema extends Schema {
  // Position
  @type("number") x: number = 0;
  @type("number") y: number = 0;

  // Direction the player is facing
  @type("string") direction: string = "south";

  // Current animation state (idle_south, walk_north, etc.)
  @type("string") animation: string = "idle_south";

  // Identity
  @type("string") name: string = "Farmer";
  @type("string") walletAddress: string = "";
  @type("string") sessionId: string = "";

  // Currency (off-chain)
  @type("number") silver: number = 0;

  // Energy
  @type("number") energy: number = 100;
  @type("number") maxEnergy: number = 100;
  @type("number") lastActionTime: number = 0; // unix ms of last energy-costing action

  // Progression
  @type("number") level: number = 1;
  @type("number") xp: number = 0;
  @type("number") xpToNextLevel: number = 100;

  // Online status
  @type("boolean") isOnline: boolean = true;

  // Inventory: itemId -> InventoryItemSchema
  @type({ map: InventoryItemSchema }) inventory = new MapSchema<InventoryItemSchema>();

  // Blueprints owned (array of blueprint ids stored as a delimited string for Colyseus compat)
  @type("string") blueprintsOwned: string = ""; // comma-separated blueprint ids

  // Active quest ids
  @type("string") activeQuestIds: string = ""; // comma-separated

  // Completed quest ids
  @type("string") completedQuestIds: string = ""; // comma-separated

  // Quest progress JSON (questId -> progress map serialized)
  @type("string") questProgressJson: string = "{}";

  // Land owner id for home plot (off-chain reference)
  @type("string") homePlotId: string = "";

  // Last known position for reconnect
  @type("number") lastX: number = 0;
  @type("number") lastY: number = 0;
}
