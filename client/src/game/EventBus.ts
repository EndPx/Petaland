/**
 * EventBus — namespaced event emitter for React ↔ Phaser communication.
 *
 * Pattern: Pixels.xyz / Sunflower Land. The bus is the ONLY way React
 * tells Phaser scenes what to render, and Phaser tells React what the
 * player did. Scenes never call React directly; React never reaches
 * into Phaser.
 *
 * Use namespaced EVENTS constants — never raw strings. Typos are silent
 * failures otherwise.
 */

import Phaser from 'phaser';

class _EventBus extends Phaser.Events.EventEmitter {}
export const EventBus = new _EventBus();

// ─── Namespaced event constants ──────────────────────────────────────────────

export const EVENTS = {
  // ── Plot interaction (player edits their grid) ──
  CELL_CLICKED: 'plot.cell_clicked',
  START_PLACEMENT_MODE: 'plot.start_placement',
  CANCEL_PLACEMENT_MODE: 'plot.cancel_placement',
  PLACE_TILE_CONFIRMED: 'plot.place_confirmed',
  REMOVE_TILE_CONFIRMED: 'plot.remove_confirmed',
  MOVE_TILE_CONFIRMED: 'plot.move_confirmed',

  // ── Transaction lifecycle (Solana) ──
  TX_PENDING: 'tx.pending',
  TX_CONFIRMED: 'tx.confirmed',
  TX_FAILED: 'tx.failed',

  // ── Inventory ──
  INVENTORY_UPDATED: 'inventory.updated',
  INVENTORY_ITEM_ADDED: 'inventory.item_added',
  INVENTORY_ITEM_REMOVED: 'inventory.item_removed',

  // ── Player ──
  PLAYER_MOVE: 'player.move',
  PLAYER_STOP: 'player.stop',
  PLAYER_ENERGY_CHANGE: 'player.energy_change',
  PLAYER_LEVEL_UP: 'player.level_up',

  // ── Currency ──
  SILVER_CHANGE: 'currency.silver_change',
  PETAL_CHANGE: 'currency.petal_change',

  // ── Wallet ──
  WALLET_CONNECTED: 'wallet.connected',
  WALLET_DISCONNECTED: 'wallet.disconnected',

  // ── Scene lifecycle ──
  SCENE_READY: 'scene.ready',
  SCENE_TRANSITION: 'scene.transition',
} as const;

export type GameEventKey = (typeof EVENTS)[keyof typeof EVENTS];
