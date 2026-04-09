import { Schema, type, MapSchema, ArraySchema } from "@colyseus/schema";
import { PlayerSchema } from "./PlayerSchema";

export class WorldObjectSchema extends Schema {
  @type("string") id: string = "";
  @type("string") type: string = ""; // "wild_carrot", "oak_tree", "stone_rock", etc.
  @type("number") x: number = 0;
  @type("number") y: number = 0;
  @type("boolean") depleted: boolean = false;
  @type("number") respawnTime: number = 0; // unix ms
  @type("string") ownerId: string = ""; // player who owns the land tile (empty = world resource)
}

export class CropSchema extends Schema {
  @type("string") id: string = "";
  @type("string") soilBedId: string = "";
  @type("string") seedItemId: string = "";
  @type("number") plantedAt: number = 0; // unix ms
  @type("number") growthDuration: number = 60000; // ms (default 1 min for dev)
  @type("string") harvestItemId: string = "";
  @type("number") harvestQuantity: number = 1;
  @type("string") ownerId: string = "";
  @type("boolean") ready: boolean = false;
}

export class BuildingSchema extends Schema {
  @type("string") id: string = "";
  @type("string") type: string = ""; // "soil_bed", "workbench", "bonfire", etc.
  @type("number") x: number = 0;
  @type("number") y: number = 0;
  @type("string") ownerId: string = ""; // player session id
  @type("string") landId: string = ""; // land plot id
  @type("boolean") active: boolean = true;
}

export class NPCSchema extends Schema {
  @type("string") id: string = "";
  @type("string") name: string = "";
  @type("number") x: number = 0;
  @type("number") y: number = 0;
  @type("string") role: string = ""; // "shopkeeper", "quest_giver"
  @type("string") dialogue: string = ""; // current dialogue line
}

export class GameState extends Schema {
  // All connected players keyed by sessionId
  @type({ map: PlayerSchema }) players = new MapSchema<PlayerSchema>();

  // World resource objects (trees, rocks, wild crops)
  @type({ map: WorldObjectSchema }) worldObjects = new MapSchema<WorldObjectSchema>();

  // Planted crops
  @type({ map: CropSchema }) crops = new MapSchema<CropSchema>();

  // Placed buildings
  @type({ map: BuildingSchema }) buildings = new MapSchema<BuildingSchema>();

  // NPCs in the world
  @type({ map: NPCSchema }) npcs = new MapSchema<NPCSchema>();

  // World tick counter
  @type("number") tick: number = 0;

  // Server unix time (ms) — clients can sync their clock
  @type("number") serverTime: number = Date.now();
}
