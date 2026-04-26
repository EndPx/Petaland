import { Schema, type } from "@colyseus/schema";

/**
 * PlotTileSchema — a tile placed on a player's octagonal plot.
 *
 * Mirrors the client's PlotState.cells. Each placed tile is keyed by
 * `${ownerId}:${cellX},${cellY}` so multiple plots can coexist in one room
 * (visiting other players' farms).
 *
 * Lifecycle:
 *   1. Player sends `place_tile` message → server creates schema → broadcasts
 *   2. (Optional) growth tick: tree → mature tree, plant → grown plant
 *   3. Player sends `remove_tile` → server deletes → broadcasts
 *
 * For respawning/regrowing tiles (e.g. trees that yield wood every 10 min):
 *   - lastHarvestedAt stays 0 if never harvested
 *   - On harvest: lastHarvestedAt = Date.now(); ready = false
 *   - Tick: if now >= lastHarvestedAt + regrowMs → ready = true
 */
export class PlotTileSchema extends Schema {
  @type("string") id: string = "";
  @type("string") ownerId: string = "";       // wallet address or sessionId
  @type("number") cellX: number = 0;
  @type("number") cellY: number = 0;

  /** "oak_tree", "wheat", "carrot", "decoration_bush", etc. */
  @type("string") tileKind: string = "";

  /** Helius asset id (cNFT) — links to on-chain ownership */
  @type("string") assetId: string = "";

  @type("number") placedAt: number = 0;       // unix ms
  @type("number") rotation: number = 0;       // 0–3 (multiples of 90°)

  /** Harvest mechanics — for tiles that yield resources over time */
  @type("number") lastHarvestedAt: number = 0;
  @type("number") regrowMs: number = 0;       // 0 = no regrow (decoration only)
  @type("boolean") ready: boolean = false;
  @type("string") yieldsItem: string = "";    // "wood", "carrot", etc.
  @type("number") yieldsQty: number = 0;
}

/**
 * ChatMessageSchema — single chat line broadcasted to the room.
 *
 * The room keeps the last N messages in `state.chat` (ArraySchema).
 * Clients see new messages via state diff; older messages are pruned.
 */
export class ChatMessageSchema extends Schema {
  @type("string") id: string = "";
  @type("string") senderId: string = "";   // sessionId
  @type("string") senderName: string = ""; // display name (e.g. "Farmer_abc123")
  @type("string") text: string = "";
  @type("number") timestamp: number = 0;   // unix ms
  @type("string") channel: string = "global"; // "global", "trade", "guild"
}
