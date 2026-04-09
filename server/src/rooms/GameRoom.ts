import { Room, Client } from "@colyseus/core";
import { GameState, WorldObjectSchema, BuildingSchema, CropSchema } from "../schema/GameState";
import { PlayerSchema } from "../schema/PlayerSchema";
import { addToInventory, removeFromInventory, countInventory } from "../schema/InventorySchema";
import { EnergySystem } from "../game/EnergySystem";
import { CraftingSystem } from "../game/CraftingSystem";
import { NPCShop } from "../game/NPCShop";
import { QuestSystem } from "../game/QuestSystem";
import { getRecipe } from "../data/recipes";
import { getItem } from "../data/items";
import { SEED_GROW_TIMES, SEED_HARVEST_MAP } from "../data/quests";
import {
  MoveMessage,
  GatherMessage,
  CraftMessage,
  PlantMessage,
  HarvestMessage,
  NPCBuyMessage,
  NPCSellMessage,
} from "../types";

// How often to run the game tick (ms)
const TICK_INTERVAL_MS = 1000;
// How often to check crop growth (ms)
const CROP_CHECK_INTERVAL_MS = 5000;

/**
 * GameRoom — the main Colyseus room for Petaland.
 *
 * Handles:
 * - Player join/leave/reconnect
 * - Movement messages
 * - Gather, craft, plant, harvest actions
 * - NPC buy/sell
 * - Energy system integration
 * - Quest progress tracking
 * - Broadcast of state changes to all clients
 */
export class GameRoom extends Room<GameState> {
  private npcShop!: NPCShop;
  private tickInterval: ReturnType<typeof setInterval> | null = null;
  private cropInterval: ReturnType<typeof setInterval> | null = null;

  // World resource respawn times (resourceId -> respawn unix ms)
  private resourceRespawnTimes: Map<string, number> = new Map();

  onCreate(options: any): void {
    console.log(`[GameRoom] Room created: ${this.roomId}`);

    this.setState(new GameState());
    this.npcShop = new NPCShop();

    // Seed the world with resources
    this.initializeWorld();

    // Register message handlers
    this.registerMessageHandlers();

    // Start ticks
    this.tickInterval = setInterval(() => this.onTick(), TICK_INTERVAL_MS);
    this.cropInterval = setInterval(() => this.checkCropGrowth(), CROP_CHECK_INTERVAL_MS);

    this.maxClients = 100;
  }

  // ── World Initialization ──────────────────────────────────────────────────

  private initializeWorld(): void {
    // Spawn wild resources scattered across the world
    const worldResources = [
      // Wild carrots (free for new players to gather)
      ...this.generateResources("wild_carrot", 30, -500, 500, -500, 500),
      // Trees
      ...this.generateResources("oak_tree", 40, -800, 800, -800, 800),
      // Stone rocks
      ...this.generateResources("stone_rock", 30, -600, 600, -600, 600),
      // Fiber patches
      ...this.generateResources("fiber_patch", 20, -400, 400, -400, 400),
      // Clay deposits near center
      ...this.generateResources("clay_deposit", 15, -300, 300, -300, 300),
    ];

    for (const res of worldResources) {
      this.state.worldObjects.set(res.id, res);
    }

    // Place the NPC at a fixed location
    const npc = this.state.npcs;
    const shopNPC = new (require("../schema/GameState").NPCSchema)();
    shopNPC.id = "npc_shopkeeper";
    shopNPC.name = "Mira the Merchant";
    shopNPC.x = 0;
    shopNPC.y = -100;
    shopNPC.role = "shopkeeper";
    shopNPC.dialogue = "Welcome to Petaland! Buy seeds, tools, and blueprints here.";
    this.state.npcs.set("npc_shopkeeper", shopNPC);

    const questNPC = new (require("../schema/GameState").NPCSchema)();
    questNPC.id = "npc_elder";
    questNPC.name = "Elder Bramble";
    questNPC.x = 100;
    questNPC.y = -100;
    questNPC.role = "quest_giver";
    questNPC.dialogue = "The fields need tending, young farmer. Speak with me for tasks!";
    this.state.npcs.set("npc_elder", questNPC);

    console.log(
      `[GameRoom] World initialized: ${this.state.worldObjects.size} resources, ${this.state.npcs.size} NPCs`
    );
  }

  private generateResources(
    type: string,
    count: number,
    minX: number,
    maxX: number,
    minY: number,
    maxY: number
  ): WorldObjectSchema[] {
    const resources: WorldObjectSchema[] = [];
    for (let i = 0; i < count; i++) {
      const obj = new WorldObjectSchema();
      obj.id = `${type}_${i}_${Math.random().toString(36).slice(2, 8)}`;
      obj.type = type;
      obj.x = Math.floor(Math.random() * (maxX - minX) + minX);
      obj.y = Math.floor(Math.random() * (maxY - minY) + minY);
      obj.depleted = false;
      obj.respawnTime = 0;
      obj.ownerId = "";
      resources.push(obj);
    }
    return resources;
  }

  // ── Message Handlers ──────────────────────────────────────────────────────

  private registerMessageHandlers(): void {
    // Player movement
    this.onMessage("move", (client, message: MoveMessage) => {
      this.handleMove(client, message);
    });

    // Gathering world resources
    this.onMessage("gather", (client, message: GatherMessage) => {
      this.handleGather(client, message);
    });

    // Crafting at workbench / building
    this.onMessage("craft", (client, message: CraftMessage) => {
      this.handleCraft(client, message);
    });

    // Planting seeds on soil bed
    this.onMessage("plant", (client, message: PlantMessage) => {
      this.handlePlant(client, message);
    });

    // Harvesting crops
    this.onMessage("harvest", (client, message: HarvestMessage) => {
      this.handleHarvest(client, message);
    });

    // Buying from NPC
    this.onMessage("npc_buy", (client, message: NPCBuyMessage) => {
      this.handleNPCBuy(client, message);
    });

    // Selling to NPC
    this.onMessage("npc_sell", (client, message: NPCSellMessage) => {
      this.handleNPCSell(client, message);
    });

    // Buy blueprint from NPC shop
    this.onMessage("npc_buy_blueprint", (client, message: { blueprintId: string }) => {
      this.handleBuyBlueprint(client, message);
    });

    // Accept a quest
    this.onMessage("quest_accept", (client, message: { questId: string }) => {
      const player = this.state.players.get(client.sessionId);
      if (!player) return;
      const result = QuestSystem.acceptQuest(player, message.questId);
      client.send("quest_accept_result", result);
    });

    // Claim quest reward
    this.onMessage("quest_claim", (client, message: { questId: string }) => {
      const player = this.state.players.get(client.sessionId);
      if (!player) return;
      const result = QuestSystem.claimReward(player, message.questId);
      client.send("quest_claim_result", result);
    });

    // Place a building on the world
    this.onMessage("place_building", (client, message: { itemId: string; x: number; y: number }) => {
      this.handlePlaceBuilding(client, message);
    });

    // Eat food to restore energy
    this.onMessage("eat", (client, message: { itemId: string }) => {
      const player = this.state.players.get(client.sessionId);
      if (!player) return;
      const restored = EnergySystem.eatFood(player, message.itemId);
      client.send("eat_result", { success: restored > 0, energyRestored: restored });
    });

    // Request shop stock
    this.onMessage("shop_stock", (client, _) => {
      const player = this.state.players.get(client.sessionId);
      if (!player) return;
      const stock = this.npcShop.getShopStock(player.level);
      const blueprints = this.npcShop.getShopBlueprints(player.level);
      client.send("shop_stock_result", { items: stock, blueprints });
    });

    // Request available quests
    this.onMessage("quest_list", (client, _) => {
      const player = this.state.players.get(client.sessionId);
      if (!player) return;
      const available = QuestSystem.getAvailableForPlayer(player);
      const active = QuestSystem.getActiveWithProgress(player);
      client.send("quest_list_result", { available, active });
    });

    // Debug: give items (dev only)
    this.onMessage("debug_give", (client, message: { itemId: string; quantity: number }) => {
      if (process.env.NODE_ENV !== "development") return;
      const player = this.state.players.get(client.sessionId);
      if (!player) return;
      addToInventory(player.inventory, message.itemId, message.quantity);
      client.send("debug_give_result", { success: true });
    });
  }

  // ── Action Handlers ───────────────────────────────────────────────────────

  private handleMove(client: Client, msg: MoveMessage): void {
    const player = this.state.players.get(client.sessionId);
    if (!player) return;

    player.x = msg.x;
    player.y = msg.y;
    player.direction = msg.direction ?? player.direction;
    player.animation = `walk_${player.direction}`;

    // Broadcast to all other clients
    this.broadcast(
      "player_moved",
      {
        sessionId: client.sessionId,
        x: player.x,
        y: player.y,
        direction: player.direction,
        animation: player.animation,
      },
      { except: client }
    );
  }

  private handleGather(client: Client, msg: GatherMessage): void {
    const player = this.state.players.get(client.sessionId);
    if (!player) return;

    // Check energy
    if (!EnergySystem.spend(player, "gather")) {
      client.send("gather_result", {
        success: false,
        error: "Not enough energy to gather.",
        energy: player.energy,
        timeToRegen: EnergySystem.timeToFullRegen(player),
      });
      return;
    }

    // Find the world object
    const worldObj = this.state.worldObjects.get(msg.resourceId);
    if (!worldObj) {
      client.send("gather_result", { success: false, error: "Resource not found." });
      return;
    }

    if (worldObj.depleted) {
      const timeLeft = worldObj.respawnTime - Date.now();
      client.send("gather_result", {
        success: false,
        error: "Resource depleted.",
        respawnInMs: Math.max(0, timeLeft),
      });
      return;
    }

    // Determine gathered item based on resource type
    const gatherResult = this.resolveGatherOutput(worldObj.type);
    if (!gatherResult) {
      client.send("gather_result", { success: false, error: "Cannot gather this resource." });
      return;
    }

    // Add items to inventory
    addToInventory(player.inventory, gatherResult.itemId, gatherResult.quantity);

    // Mark resource as depleted with respawn time
    worldObj.depleted = true;
    worldObj.respawnTime = Date.now() + gatherResult.respawnMs;
    this.resourceRespawnTimes.set(worldObj.id, worldObj.respawnTime);

    // Update quest progress
    const readyQuests = QuestSystem.updateProgress(player, "gather", gatherResult.itemId, gatherResult.quantity);
    if (readyQuests.length > 0) {
      client.send("quests_ready", { questIds: readyQuests });
    }

    // Grant XP
    const newLevel = QuestSystem.addXP(player, gatherResult.xp);
    if (newLevel !== undefined) {
      client.send("level_up", { newLevel, energy: player.energy, maxEnergy: player.maxEnergy });
    }

    client.send("gather_result", {
      success: true,
      itemId: gatherResult.itemId,
      quantity: gatherResult.quantity,
      energy: player.energy,
      maxEnergy: player.maxEnergy,
    });

    // Notify others of depletion
    this.broadcast(
      "resource_depleted",
      { resourceId: worldObj.id, respawnTime: worldObj.respawnTime },
      { except: client }
    );
  }

  private resolveGatherOutput(
    resourceType: string
  ): { itemId: string; quantity: number; respawnMs: number; xp: number } | null {
    const table: Record<string, { itemId: string; quantity: number; respawnMs: number; xp: number }> = {
      wild_carrot:   { itemId: "wild_carrot", quantity: 1, respawnMs: 5 * 60 * 1000,  xp: 5 },
      oak_tree:      { itemId: "wood",        quantity: 3, respawnMs: 10 * 60 * 1000, xp: 8 },
      stone_rock:    { itemId: "stone",       quantity: 2, respawnMs: 8 * 60 * 1000,  xp: 6 },
      fiber_patch:   { itemId: "fiber",       quantity: 3, respawnMs: 3 * 60 * 1000,  xp: 4 },
      clay_deposit:  { itemId: "clay",        quantity: 2, respawnMs: 6 * 60 * 1000,  xp: 7 },
      iron_vein:     { itemId: "iron_ore",    quantity: 2, respawnMs: 15 * 60 * 1000, xp: 15 },
      coal_seam:     { itemId: "coal",        quantity: 2, respawnMs: 12 * 60 * 1000, xp: 10 },
      gem_deposit:   { itemId: "gem_raw",     quantity: 1, respawnMs: 30 * 60 * 1000, xp: 30 },
      fishing_spot:  { itemId: "fish",        quantity: 1, respawnMs: 2 * 60 * 1000,  xp: 8 },
      lotus_patch:   { itemId: "lotus",       quantity: 1, respawnMs: 20 * 60 * 1000, xp: 15 },
    };
    return table[resourceType] ?? null;
  }

  private handleCraft(client: Client, msg: CraftMessage): void {
    const player = this.state.players.get(client.sessionId);
    if (!player) return;

    // Check energy
    if (!EnergySystem.spend(player, "craft")) {
      client.send("craft_result", {
        success: false,
        error: "Not enough energy to craft.",
        energy: player.energy,
      });
      return;
    }

    const result = CraftingSystem.craft(
      player,
      msg.recipeId,
      this.state,
      msg.buildingId,
      msg.landOwnerId
    );

    if (!result.success) {
      // Refund energy since craft failed
      player.energy = Math.min(player.energy + 10, player.maxEnergy);
      client.send("craft_result", result);
      return;
    }

    // Update quest progress for each output item
    if (result.outputs) {
      for (const output of result.outputs) {
        const readyQuests = QuestSystem.updateProgress(player, "craft", output.itemId, output.quantity);
        if (readyQuests.length > 0) {
          client.send("quests_ready", { questIds: readyQuests });
        }
      }
    }

    // Grant XP for crafting
    const newLevel = QuestSystem.addXP(player, 15);
    if (newLevel !== undefined) {
      client.send("level_up", { newLevel, energy: player.energy, maxEnergy: player.maxEnergy });
    }

    client.send("craft_result", {
      success: true,
      outputs: result.outputs,
      taxApplied: result.taxApplied,
      energy: player.energy,
    });

    // If tax went to land owner, notify them
    if (result.taxApplied && result.taxRecipient) {
      const ownerClient = this.clients.find((c) => c.sessionId === result.taxRecipient);
      if (ownerClient) {
        ownerClient.send("tax_received", {
          fromPlayer: player.name,
          items: result.outputs,
        });
      }
    }
  }

  private handlePlant(client: Client, msg: PlantMessage): void {
    const player = this.state.players.get(client.sessionId);
    if (!player) return;

    // Check energy
    if (!EnergySystem.spend(player, "plant")) {
      client.send("plant_result", { success: false, error: "Not enough energy to plant." });
      return;
    }

    // Verify soil bed exists and is owned by this player (or they have access)
    const building = this.state.buildings.get(msg.soilBedId);
    if (!building || building.type !== "soil_bed" || !building.active) {
      player.energy = Math.min(player.energy + 3, player.maxEnergy);
      client.send("plant_result", { success: false, error: "Invalid soil bed." });
      return;
    }

    // Check player has the seed
    const seedCount = countInventory(player.inventory, msg.seedItemId);
    if (seedCount <= 0) {
      player.energy = Math.min(player.energy + 3, player.maxEnergy);
      client.send("plant_result", { success: false, error: "You don't have that seed." });
      return;
    }

    // Check soil bed isn't already planted
    const existingCrop = Array.from(this.state.crops.values()).find(
      (c) => c.soilBedId === msg.soilBedId
    );
    if (existingCrop) {
      player.energy = Math.min(player.energy + 3, player.maxEnergy);
      client.send("plant_result", { success: false, error: "Soil bed already has a crop." });
      return;
    }

    // Get growth data
    const growthDuration = SEED_GROW_TIMES[msg.seedItemId];
    const harvestData = SEED_HARVEST_MAP[msg.seedItemId];
    if (!growthDuration || !harvestData) {
      player.energy = Math.min(player.energy + 3, player.maxEnergy);
      client.send("plant_result", { success: false, error: "Unknown seed type." });
      return;
    }

    // Consume seed
    removeFromInventory(player.inventory, msg.seedItemId, 1);

    // Create crop
    const crop = new CropSchema();
    crop.id = `crop_${msg.soilBedId}_${Date.now()}`;
    crop.soilBedId = msg.soilBedId;
    crop.seedItemId = msg.seedItemId;
    crop.plantedAt = Date.now();
    crop.growthDuration = growthDuration;
    crop.harvestItemId = harvestData.itemId;
    crop.harvestQuantity = harvestData.quantity;
    crop.ownerId = player.sessionId;
    crop.ready = false;

    this.state.crops.set(crop.id, crop);

    // Grant XP
    QuestSystem.addXP(player, 5);

    client.send("plant_result", {
      success: true,
      cropId: crop.id,
      growthDuration,
      readyAt: crop.plantedAt + growthDuration,
      energy: player.energy,
    });

    this.broadcast("crop_planted", { cropId: crop.id, soilBedId: msg.soilBedId }, { except: client });
  }

  private handleHarvest(client: Client, msg: HarvestMessage): void {
    const player = this.state.players.get(client.sessionId);
    if (!player) return;

    // Find crop on this soil bed
    let crop: CropSchema | undefined;
    for (const [, c] of this.state.crops) {
      if (c.soilBedId === msg.soilBedId) {
        crop = c;
        break;
      }
    }

    if (!crop) {
      client.send("harvest_result", { success: false, error: "No crop on this soil bed." });
      return;
    }

    if (!crop.ready) {
      const timeLeft = crop.plantedAt + crop.growthDuration - Date.now();
      client.send("harvest_result", {
        success: false,
        error: "Crop not ready yet.",
        readyInMs: Math.max(0, timeLeft),
      });
      return;
    }

    // Check energy
    if (!EnergySystem.spend(player, "harvest")) {
      client.send("harvest_result", { success: false, error: "Not enough energy to harvest." });
      return;
    }

    // Give items
    addToInventory(player.inventory, crop.harvestItemId, crop.harvestQuantity);

    // Remove crop
    this.state.crops.delete(crop.id);

    // Update quests
    const readyQuests = QuestSystem.updateProgress(
      player,
      "gather",
      crop.harvestItemId,
      crop.harvestQuantity
    );
    if (readyQuests.length > 0) {
      client.send("quests_ready", { questIds: readyQuests });
    }

    // Grant XP
    const newLevel = QuestSystem.addXP(player, 10);
    if (newLevel !== undefined) {
      client.send("level_up", { newLevel });
    }

    client.send("harvest_result", {
      success: true,
      itemId: crop.harvestItemId,
      quantity: crop.harvestQuantity,
      energy: player.energy,
    });

    this.broadcast("crop_harvested", { cropId: crop.id, soilBedId: msg.soilBedId }, { except: client });
  }

  private handleNPCBuy(client: Client, msg: NPCBuyMessage): void {
    const player = this.state.players.get(client.sessionId);
    if (!player) return;

    const result = this.npcShop.buyFromNPC(player, msg.itemId, msg.quantity);
    client.send("npc_buy_result", {
      ...result,
      silver: player.silver,
    });
  }

  private handleNPCSell(client: Client, msg: NPCSellMessage): void {
    const player = this.state.players.get(client.sessionId);
    if (!player) return;

    const result = this.npcShop.sellToNPC(player, msg.itemId, msg.quantity);

    if (result.success) {
      // Update quest progress for selling (type "deliver")
      const readyQuests = QuestSystem.updateProgress(player, "deliver", msg.itemId, msg.quantity);
      if (readyQuests.length > 0) {
        client.send("quests_ready", { questIds: readyQuests });
      }
      // Small XP for selling
      QuestSystem.addXP(player, 2);
    }

    client.send("npc_sell_result", {
      ...result,
      silver: player.silver,
    });
  }

  private handleBuyBlueprint(client: Client, msg: { blueprintId: string }): void {
    const player = this.state.players.get(client.sessionId);
    if (!player) return;

    const result = this.npcShop.buyBlueprint(player, msg.blueprintId);
    client.send("npc_buy_blueprint_result", {
      ...result,
      silver: player.silver,
      blueprintsOwned: player.blueprintsOwned,
    });
  }

  private handlePlaceBuilding(
    client: Client,
    msg: { itemId: string; x: number; y: number }
  ): void {
    const player = this.state.players.get(client.sessionId);
    if (!player) return;

    // Check player has the building item
    const count = countInventory(player.inventory, msg.itemId);
    if (count <= 0) {
      client.send("place_building_result", {
        success: false,
        error: `You don't have a ${msg.itemId} to place.`,
      });
      return;
    }

    // Check item is actually a building type
    let itemDef;
    try {
      itemDef = getItem(msg.itemId);
    } catch {
      client.send("place_building_result", { success: false, error: "Unknown item." });
      return;
    }

    if (itemDef.type !== "building") {
      client.send("place_building_result", {
        success: false,
        error: "This item cannot be placed as a building.",
      });
      return;
    }

    // Consume the item from inventory
    removeFromInventory(player.inventory, msg.itemId, 1);

    // Create building
    const building = new BuildingSchema();
    building.id = `building_${msg.itemId}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    building.type = msg.itemId;
    building.x = msg.x;
    building.y = msg.y;
    building.ownerId = player.sessionId;
    building.landId = player.homePlotId;
    building.active = true;

    this.state.buildings.set(building.id, building);

    // Update quest progress for building
    const readyQuests = QuestSystem.updateProgress(player, "build", msg.itemId, 1);
    if (readyQuests.length > 0) {
      client.send("quests_ready", { questIds: readyQuests });
    }

    QuestSystem.addXP(player, 20);

    client.send("place_building_result", {
      success: true,
      buildingId: building.id,
      type: building.type,
      x: building.x,
      y: building.y,
    });

    this.broadcast(
      "building_placed",
      {
        buildingId: building.id,
        type: building.type,
        x: building.x,
        y: building.y,
        ownerId: player.sessionId,
      },
      { except: client }
    );
  }

  // ── Game Tick ─────────────────────────────────────────────────────────────

  private onTick(): void {
    const now = Date.now();
    this.state.tick += 1;
    this.state.serverTime = now;

    // Check resource respawns
    for (const [, obj] of this.state.worldObjects) {
      if (obj.depleted && obj.respawnTime > 0 && now >= obj.respawnTime) {
        obj.depleted = false;
        obj.respawnTime = 0;
        this.broadcast("resource_respawned", { resourceId: obj.id });
      }
    }

    // Apply passive energy regen for all players
    for (const [, player] of this.state.players) {
      EnergySystem.applyRegen(player);
    }
  }

  private checkCropGrowth(): void {
    const now = Date.now();
    for (const [, crop] of this.state.crops) {
      if (!crop.ready && now >= crop.plantedAt + crop.growthDuration) {
        crop.ready = true;
        // Notify the crop owner
        const ownerClient = this.clients.find((c) => c.sessionId === crop.ownerId);
        if (ownerClient) {
          ownerClient.send("crop_ready", {
            cropId: crop.id,
            soilBedId: crop.soilBedId,
            harvestItemId: crop.harvestItemId,
            harvestQuantity: crop.harvestQuantity,
          });
        }
        this.broadcast("crop_ready_broadcast", { cropId: crop.id, soilBedId: crop.soilBedId });
      }
    }
  }

  // ── Player Join / Leave ───────────────────────────────────────────────────

  async onJoin(client: Client, options: any): Promise<void> {
    console.log(`[GameRoom] Player joined: ${client.sessionId}`, options);

    const player = new PlayerSchema();
    player.sessionId = client.sessionId;
    player.name = options?.name ?? `Farmer_${client.sessionId.slice(0, 6)}`;
    player.walletAddress = options?.walletAddress ?? "";

    // Spawn at world center with slight offset so players don't stack
    player.x = Math.floor(Math.random() * 100 - 50);
    player.y = Math.floor(Math.random() * 100 - 50);
    player.direction = "south";
    player.animation = "idle_south";

    // Starting stats
    player.level = 1;
    player.xp = 0;
    player.xpToNextLevel = 100;
    player.silver = 100; // small starter silver
    player.energy = EnergySystem.getMaxEnergy(1);
    player.maxEnergy = EnergySystem.getMaxEnergy(1);
    player.lastActionTime = Date.now();
    player.isOnline = true;

    // Starter inventory
    addToInventory(player.inventory, "axe", 1);
    addToInventory(player.inventory, "pickaxe", 1);
    addToInventory(player.inventory, "seed_carrot", 5);
    addToInventory(player.inventory, "seed_wheat", 5);

    // Blueprints start empty — player gets them from first quest
    player.blueprintsOwned = "";

    // Initialize first quest as available (no pre-requisites needed)
    // Player must talk to NPC to accept quests

    this.state.players.set(client.sessionId, player);

    // Tell the joining client their own session info
    client.send("init", {
      sessionId: client.sessionId,
      playerData: {
        name: player.name,
        x: player.x,
        y: player.y,
        silver: player.silver,
        energy: player.energy,
        maxEnergy: player.maxEnergy,
        level: player.level,
        xp: player.xp,
        xpToNextLevel: player.xpToNextLevel,
        blueprintsOwned: player.blueprintsOwned,
      },
    });

    // Notify all other players
    this.broadcast(
      "player_joined",
      {
        sessionId: client.sessionId,
        name: player.name,
        x: player.x,
        y: player.y,
      },
      { except: client }
    );
  }

  async onLeave(client: Client, consented: boolean): Promise<void> {
    console.log(`[GameRoom] Player left: ${client.sessionId} (consented: ${consented})`);

    const player = this.state.players.get(client.sessionId);
    if (player) {
      player.isOnline = false;
      player.lastX = player.x;
      player.lastY = player.y;

      // TODO: Persist player state to database here
      // For now, just remove from room state after a brief delay
      // In production, keep for reconnect window then persist
      if (consented) {
        this.state.players.delete(client.sessionId);
      } else {
        // Allow 30 second reconnect window
        setTimeout(() => {
          if (!this.state.players.get(client.sessionId)?.isOnline) {
            this.state.players.delete(client.sessionId);
          }
        }, 30000);
      }
    }

    this.broadcast("player_left", { sessionId: client.sessionId }, { except: client });
  }

  onDispose(): void {
    console.log(`[GameRoom] Room disposed: ${this.roomId}`);
    if (this.tickInterval) clearInterval(this.tickInterval);
    if (this.cropInterval) clearInterval(this.cropInterval);
  }
}
