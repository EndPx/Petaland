/**
 * Event handlers — pure functions that transform PlotState given an Action.
 *
 * Pattern: SFL `EVENTS[action.type]`. Each handler:
 *   - Takes `(state, action, now)` — `now` is passed in (no Date.now() inside)
 *   - Validates inputs, throws on invalid
 *   - Returns NEW state (never mutates)
 *
 * The throw IS the validation — server catches and returns the previous
 * state to client. Client catches and rolls back optimistic UI.
 */

import type { Action, PlotState } from './types';
import { cellKey } from './types';

// ─── Tile placement ──────────────────────────────────────────────────────────

export function handlePlaceTile(
  state: PlotState,
  action: Extract<Action, { type: 'PLACE_TILE' }>,
  now: number,
): PlotState {
  const { cellX, cellY, assetId, tileKind } = action;

  // Bounds check
  if (cellX < 0 || cellY < 0 || cellX >= state.width || cellY >= state.height) {
    throw new Error(`Cell (${cellX},${cellY}) out of plot bounds`);
  }

  const key = cellKey(cellX, cellY);
  const existing = state.cells[key];
  if (existing?.tile) {
    throw new Error(`Cell (${cellX},${cellY}) already occupied`);
  }

  return {
    ...state,
    cells: {
      ...state.cells,
      [key]: {
        x: cellX,
        y: cellY,
        tile: { assetId, tileKind, placedAt: now, rotation: 0 },
      },
    },
  };
}

export function handleRemoveTile(
  state: PlotState,
  action: Extract<Action, { type: 'REMOVE_TILE' }>,
  _now: number,
): PlotState {
  const { cellX, cellY } = action;
  const key = cellKey(cellX, cellY);
  const cell = state.cells[key];

  if (!cell?.tile) {
    throw new Error(`No tile at (${cellX},${cellY})`);
  }

  const nextCells = { ...state.cells };
  delete nextCells[key];
  return { ...state, cells: nextCells };
}

export function handleMoveTile(
  state: PlotState,
  action: Extract<Action, { type: 'MOVE_TILE' }>,
  now: number,
): PlotState {
  const { from, to } = action;
  const fromKey = cellKey(from.x, from.y);
  const toKey = cellKey(to.x, to.y);

  const fromCell = state.cells[fromKey];
  if (!fromCell?.tile) {
    throw new Error(`No tile at source (${from.x},${from.y})`);
  }
  const toCell = state.cells[toKey];
  if (toCell?.tile) {
    throw new Error(`Destination (${to.x},${to.y}) already occupied`);
  }
  if (to.x < 0 || to.y < 0 || to.x >= state.width || to.y >= state.height) {
    throw new Error(`Destination (${to.x},${to.y}) out of plot bounds`);
  }

  const nextCells = { ...state.cells };
  delete nextCells[fromKey];
  nextCells[toKey] = {
    x: to.x,
    y: to.y,
    tile: { ...fromCell.tile, placedAt: now },
  };
  return { ...state, cells: nextCells };
}

export function handleExpandPlot(state: PlotState, _now: number): PlotState {
  return {
    ...state,
    level: state.level + 1,
    width: state.width + 2,
    height: state.height + 2,
  };
}

// ─── Inventory ────────────────────────────────────────────────────────────────

export function handleGainItem(
  state: PlotState,
  action: Extract<Action, { type: 'GAIN_ITEM' }>,
  _now: number,
): PlotState {
  if (action.quantity <= 0) {
    throw new Error(`GAIN_ITEM quantity must be positive, got ${action.quantity}`);
  }
  const current = state.inventory[action.itemKind] ?? 0;
  return {
    ...state,
    inventory: { ...state.inventory, [action.itemKind]: current + action.quantity },
  };
}

export function handleSpendItem(
  state: PlotState,
  action: Extract<Action, { type: 'SPEND_ITEM' }>,
  _now: number,
): PlotState {
  if (action.quantity <= 0) {
    throw new Error(`SPEND_ITEM quantity must be positive, got ${action.quantity}`);
  }
  const current = state.inventory[action.itemKind] ?? 0;
  if (current < action.quantity) {
    throw new Error(
      `Insufficient ${action.itemKind}: have ${current}, need ${action.quantity}`,
    );
  }
  const remaining = current - action.quantity;
  const nextInventory = { ...state.inventory };
  if (remaining === 0) delete nextInventory[action.itemKind];
  else nextInventory[action.itemKind] = remaining;
  return { ...state, inventory: nextInventory };
}

// ─── Currency ─────────────────────────────────────────────────────────────────

export function handleGainSilver(
  state: PlotState,
  action: Extract<Action, { type: 'GAIN_SILVER' }>,
  _now: number,
): PlotState {
  if (action.amount <= 0) {
    throw new Error(`GAIN_SILVER amount must be positive, got ${action.amount}`);
  }
  return { ...state, silver: state.silver + action.amount };
}

export function handleSpendSilver(
  state: PlotState,
  action: Extract<Action, { type: 'SPEND_SILVER' }>,
  _now: number,
): PlotState {
  if (action.amount <= 0) {
    throw new Error(`SPEND_SILVER amount must be positive, got ${action.amount}`);
  }
  if (state.silver < action.amount) {
    throw new Error(
      `Insufficient silver: have ${state.silver}, need ${action.amount}`,
    );
  }
  return { ...state, silver: state.silver - action.amount };
}

export function handleGainPetal(
  state: PlotState,
  action: Extract<Action, { type: 'GAIN_PETAL' }>,
  _now: number,
): PlotState {
  if (action.amount <= 0) {
    throw new Error(`GAIN_PETAL amount must be positive, got ${action.amount}`);
  }
  return { ...state, petal: state.petal + action.amount };
}

export function handleSpendPetal(
  state: PlotState,
  action: Extract<Action, { type: 'SPEND_PETAL' }>,
  _now: number,
): PlotState {
  if (action.amount <= 0) {
    throw new Error(`SPEND_PETAL amount must be positive, got ${action.amount}`);
  }
  if (state.petal < action.amount) {
    throw new Error(
      `Insufficient $PETAL: have ${state.petal}, need ${action.amount}`,
    );
  }
  return { ...state, petal: state.petal - action.amount };
}

// ─── XP / Energy ──────────────────────────────────────────────────────────────

export function handleGainXp(
  state: PlotState,
  action: Extract<Action, { type: 'GAIN_XP' }>,
  _now: number,
): PlotState {
  if (action.amount <= 0) {
    throw new Error(`GAIN_XP amount must be positive, got ${action.amount}`);
  }
  const xp = state.xp + action.amount;
  // Auto-level: 100xp/level (linear; adjust with curve if needed)
  const playerLevel = Math.max(1, Math.floor(xp / 100) + 1);
  return { ...state, xp, playerLevel };
}

export function handleConsumeEnergy(
  state: PlotState,
  action: Extract<Action, { type: 'CONSUME_ENERGY' }>,
  _now: number,
): PlotState {
  if (action.amount <= 0) {
    throw new Error(`CONSUME_ENERGY amount must be positive, got ${action.amount}`);
  }
  if (state.energy < action.amount) {
    throw new Error(
      `Insufficient energy: have ${state.energy}, need ${action.amount}`,
    );
  }
  return { ...state, energy: state.energy - action.amount };
}

export function handleRestoreEnergy(
  state: PlotState,
  action: Extract<Action, { type: 'RESTORE_ENERGY' }>,
  _now: number,
): PlotState {
  if (action.amount <= 0) {
    throw new Error(`RESTORE_ENERGY amount must be positive, got ${action.amount}`);
  }
  return {
    ...state,
    energy: Math.min(state.maxEnergy, state.energy + action.amount),
  };
}
