/**
 * Plot types — PlotState, Cell, Action union.
 *
 * Single source of truth for plot data shape. Used by:
 *   - processEvent (pure reducer)
 *   - Phaser PlotScene (rendering)
 *   - React components (HUD, inventory drawer)
 *   - Backend (same types, shared types pkg in real deploy)
 */

// ─── Cell ─────────────────────────────────────────────────────────────────────

export interface PlacedTile {
  /** Helius asset id (cNFT) — links cell to the on-chain owned token */
  assetId: string;
  /** Symbolic kind: 'oak_tree', 'wheat', 'chicken', etc. */
  tileKind: string;
  /** When the tile was placed (ms epoch) */
  placedAt: number;
  /** 0–3, multiples of 90deg */
  rotation?: 0 | 1 | 2 | 3;
}

export interface Cell {
  x: number;
  y: number;
  tile?: PlacedTile;
}

// ─── PlotState (the world your reducer transforms) ────────────────────────────

export interface PlotState {
  /** Wallet address of the plot owner (null until wallet connected) */
  owner: string | null;

  /** Plot dimensions in tiles */
  width: number;
  height: number;

  /** Plot level (1, 2, 3...) — gates expansion mechanics */
  level: number;

  /** Map keyed by `${x},${y}` — sparse for non-rect plots, dense for rectangles */
  cells: Record<string, Cell>;

  /** Inventory: type → quantity. Uses string keys so server JSON serializes cleanly. */
  inventory: Record<string, number>;

  /** Currencies (energy/silver are off-chain, petal is on-chain $PETAL) */
  energy: number;
  maxEnergy: number;
  silver: number;
  petal: number;

  /** XP and level (player-level, not plot-level) */
  xp: number;
  playerLevel: number;
}

// ─── Action union (typed events the reducer handles) ──────────────────────────

export type Action =
  | { type: 'PLACE_TILE'; cellX: number; cellY: number; assetId: string; tileKind: string }
  | { type: 'REMOVE_TILE'; cellX: number; cellY: number }
  | { type: 'MOVE_TILE'; from: { x: number; y: number }; to: { x: number; y: number } }
  | { type: 'EXPAND_PLOT' }
  | { type: 'GAIN_ITEM'; itemKind: string; quantity: number }
  | { type: 'SPEND_ITEM'; itemKind: string; quantity: number }
  | { type: 'GAIN_SILVER'; amount: number }
  | { type: 'SPEND_SILVER'; amount: number }
  | { type: 'GAIN_PETAL'; amount: number }
  | { type: 'SPEND_PETAL'; amount: number }
  | { type: 'GAIN_XP'; amount: number }
  | { type: 'CONSUME_ENERGY'; amount: number }
  | { type: 'RESTORE_ENERGY'; amount: number };

export type ActionType = Action['type'];

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function cellKey(x: number, y: number): string {
  return `${x},${y}`;
}

export function emptyPlotState(owner: string | null = null): PlotState {
  return {
    owner,
    width: 8,
    height: 8,
    level: 1,
    cells: {},
    inventory: {},
    energy: 100,
    maxEnergy: 100,
    silver: 0,
    petal: 0,
    xp: 0,
    playerLevel: 1,
  };
}
