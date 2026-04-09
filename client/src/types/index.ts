// ─── Player ──────────────────────────────────────────────────────────────────

export type Direction = 'south' | 'north' | 'east' | 'west';

export interface PlayerState {
  id: string;
  walletAddress: string;
  x: number;
  y: number;
  direction: Direction;
  isMoving: boolean;
  energy: number;
  maxEnergy: number;
  silver: number;
  petal: number;
  level: number;
  xp: number;
  character: 'farmer_male' | 'farmer_female';
}

// ─── Tile ─────────────────────────────────────────────────────────────────────

export enum TileType {
  Grass = 'grass',
  Forest = 'forest',
  Stone = 'stone',
  Water = 'water',
}

export interface TileData {
  type: TileType;
  wangIndex: number; // 0-15 Wang tile variant
  x: number;         // tile grid x
  y: number;         // tile grid y
}

// ─── Land ─────────────────────────────────────────────────────────────────────

export enum LandTier {
  PetalPlot = 'petal_plot',  // free, off-chain
  Grove = 'grove',            // 50 $PETAL, NFT
  Cliff = 'cliff',            // 50 $PETAL, NFT
  Lake = 'lake',              // 50 $PETAL, NFT
  PetalEstate = 'petal_estate', // 300 $PETAL, NFT
}

export interface LandPlot {
  id: string;
  owner: string;          // wallet address
  tier: LandTier;
  gridX: number;
  gridY: number;
  taxRate: number;        // 0–100 percent
  isOpen: boolean;
  buildings: PlacedObject[];
}

// ─── Objects / Buildings ─────────────────────────────────────────────────────

export enum ObjectType {
  // Nature
  OakTree = 'oak_tree',
  PineTree = 'pine_tree',
  RockSmall = 'rock_small',
  Bush = 'bush',
  FlowerPetal = 'flower_petal',
  WildCarrot = 'wild_carrot',

  // Buildings
  Workbench = 'workbench',
  Bonfire = 'bonfire',
  StorageBox = 'storage_box',
  Well = 'well',
  Fence = 'fence',
  Sawmill = 'sawmill',
  Furnace = 'furnace',
  Scarecrow = 'scarecrow',
  ShopStall = 'shop_stall',

  // Farming
  SoilBed = 'soil_bed',
}

export interface PlacedObject {
  id: string;
  type: ObjectType;
  x: number;
  y: number;
  data?: Record<string, unknown>;
}

// ─── Items / Inventory ───────────────────────────────────────────────────────

export enum ItemType {
  // Resources
  Wood = 'wood',
  Stone = 'stone',
  Carrot = 'carrot',
  Wheat = 'wheat',

  // Seeds
  CarrotSeed = 'carrot_seed',
  WheatSeed = 'wheat_seed',

  // Crafted
  Bread = 'bread',
  CarrotSoup = 'carrot_soup',

  // Currency tokens (display only)
  Silver = 'silver',
  Petal = 'petal',
}

export interface InventoryItem {
  type: ItemType;
  quantity: number;
}

// ─── Blueprint ───────────────────────────────────────────────────────────────

export enum BlueprintTier {
  Basic = 'basic',
  Common = 'common',
  Uncommon = 'uncommon',
  Rare = 'rare',
  Legendary = 'legendary',
}

export interface Blueprint {
  id: string;
  name: string;
  tier: BlueprintTier;
  result: ItemType | ObjectType;
  ingredients: { type: ItemType; quantity: number }[];
  isNFT: boolean;
}

// ─── Network / Server ────────────────────────────────────────────────────────

export interface ServerMessage {
  type: string;
  payload: unknown;
}

export interface MovePayload {
  x: number;
  y: number;
  direction: Direction;
}

export interface ChatMessage {
  senderId: string;
  text: string;
  timestamp: number;
}

// ─── Game Events ─────────────────────────────────────────────────────────────

export const GAME_EVENTS = {
  PLAYER_MOVE: 'player:move',
  PLAYER_STOP: 'player:stop',
  PLAYER_ENERGY_CHANGE: 'player:energy_change',
  SILVER_CHANGE: 'silver:change',
  PETAL_CHANGE: 'petal:change',
  INVENTORY_UPDATE: 'inventory:update',
  WALLET_CONNECTED: 'wallet:connected',
  WALLET_DISCONNECTED: 'wallet:disconnected',
  SCENE_READY: 'scene:ready',
} as const;

export type GameEventKey = typeof GAME_EVENTS[keyof typeof GAME_EVENTS];

// ─── Crop Stages ─────────────────────────────────────────────────────────────

export interface CropStage {
  stage: 1 | 2 | 3 | 4;
  timeToNextStage: number; // seconds
  textureKey: string;
}

// ─── NPC ─────────────────────────────────────────────────────────────────────

export interface NpcData {
  id: string;
  name: string;
  type: 'shopkeeper' | 'quest_giver';
  x: number;
  y: number;
  dialogue: string[];
}
