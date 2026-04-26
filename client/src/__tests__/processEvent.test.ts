/**
 * processEvent.test.ts — tests for the core reducer.
 *
 * Pattern: SFL — every action handler tested for happy path + error cases.
 * Tests are pure (no DOM, no Phaser, no async). They run identically
 * on client and server because the reducer is pure.
 */

import { describe, it, expect } from 'vitest';
import { processEvent } from '../features/plot/lib/processEvent';
import { emptyPlotState, type PlotState } from '../features/plot/lib/types';

const NOW = 1_700_000_000_000;

function freshState(overrides: Partial<PlotState> = {}): PlotState {
  return { ...emptyPlotState('owner-wallet'), ...overrides };
}

// ─── Tile placement ──────────────────────────────────────────────────────────

describe('processEvent — PLACE_TILE', () => {
  it('places a tile on an empty cell', () => {
    const state = freshState();
    const next = processEvent(
      state,
      { type: 'PLACE_TILE', cellX: 2, cellY: 3, assetId: 'asset-1', tileKind: 'wheat' },
      NOW,
    );
    expect(next.cells['2,3']?.tile).toEqual({
      assetId: 'asset-1',
      tileKind: 'wheat',
      placedAt: NOW,
      rotation: 0,
    });
  });

  it('does NOT mutate the original state', () => {
    const state = freshState();
    const before = JSON.stringify(state);
    processEvent(
      state,
      { type: 'PLACE_TILE', cellX: 0, cellY: 0, assetId: 'a', tileKind: 'oak' },
      NOW,
    );
    expect(JSON.stringify(state)).toBe(before);
  });

  it('throws when cell is out of bounds (negative)', () => {
    const state = freshState();
    expect(() =>
      processEvent(
        state,
        { type: 'PLACE_TILE', cellX: -1, cellY: 0, assetId: 'a', tileKind: 'oak' },
        NOW,
      ),
    ).toThrow(/out of plot bounds/);
  });

  it('throws when cell is out of bounds (>= width)', () => {
    const state = freshState({ width: 5 });
    expect(() =>
      processEvent(
        state,
        { type: 'PLACE_TILE', cellX: 5, cellY: 0, assetId: 'a', tileKind: 'oak' },
        NOW,
      ),
    ).toThrow(/out of plot bounds/);
  });

  it('throws when cell is already occupied', () => {
    let state = freshState();
    state = processEvent(
      state,
      { type: 'PLACE_TILE', cellX: 1, cellY: 1, assetId: 'a', tileKind: 'oak' },
      NOW,
    );
    expect(() =>
      processEvent(
        state,
        { type: 'PLACE_TILE', cellX: 1, cellY: 1, assetId: 'b', tileKind: 'pine' },
        NOW,
      ),
    ).toThrow(/already occupied/);
  });
});

describe('processEvent — REMOVE_TILE', () => {
  it('removes an existing tile', () => {
    let state = freshState();
    state = processEvent(
      state,
      { type: 'PLACE_TILE', cellX: 2, cellY: 2, assetId: 'a', tileKind: 'oak' },
      NOW,
    );
    state = processEvent(state, { type: 'REMOVE_TILE', cellX: 2, cellY: 2 }, NOW);
    expect(state.cells['2,2']).toBeUndefined();
  });

  it('throws when no tile exists at that cell', () => {
    const state = freshState();
    expect(() =>
      processEvent(state, { type: 'REMOVE_TILE', cellX: 0, cellY: 0 }, NOW),
    ).toThrow(/No tile at/);
  });
});

describe('processEvent — MOVE_TILE', () => {
  it('moves a tile from one empty cell to another', () => {
    let state = freshState();
    state = processEvent(
      state,
      { type: 'PLACE_TILE', cellX: 0, cellY: 0, assetId: 'a', tileKind: 'oak' },
      NOW,
    );
    state = processEvent(
      state,
      { type: 'MOVE_TILE', from: { x: 0, y: 0 }, to: { x: 3, y: 4 } },
      NOW + 100,
    );
    expect(state.cells['0,0']).toBeUndefined();
    expect(state.cells['3,4']?.tile?.assetId).toBe('a');
    expect(state.cells['3,4']?.tile?.placedAt).toBe(NOW + 100);
  });

  it('throws when source has no tile', () => {
    const state = freshState();
    expect(() =>
      processEvent(
        state,
        { type: 'MOVE_TILE', from: { x: 0, y: 0 }, to: { x: 1, y: 1 } },
        NOW,
      ),
    ).toThrow(/No tile at source/);
  });

  it('throws when destination is occupied', () => {
    let state = freshState();
    state = processEvent(
      state,
      { type: 'PLACE_TILE', cellX: 0, cellY: 0, assetId: 'a', tileKind: 'oak' },
      NOW,
    );
    state = processEvent(
      state,
      { type: 'PLACE_TILE', cellX: 1, cellY: 1, assetId: 'b', tileKind: 'pine' },
      NOW,
    );
    expect(() =>
      processEvent(
        state,
        { type: 'MOVE_TILE', from: { x: 0, y: 0 }, to: { x: 1, y: 1 } },
        NOW,
      ),
    ).toThrow(/already occupied/);
  });

  it('throws when destination is out of bounds', () => {
    let state = freshState({ width: 4, height: 4 });
    state = processEvent(
      state,
      { type: 'PLACE_TILE', cellX: 0, cellY: 0, assetId: 'a', tileKind: 'oak' },
      NOW,
    );
    expect(() =>
      processEvent(
        state,
        { type: 'MOVE_TILE', from: { x: 0, y: 0 }, to: { x: 4, y: 0 } },
        NOW,
      ),
    ).toThrow(/out of plot bounds/);
  });
});

describe('processEvent — EXPAND_PLOT', () => {
  it('increments level and grows width/height by 2', () => {
    const state = freshState({ width: 8, height: 8, level: 1 });
    const next = processEvent(state, { type: 'EXPAND_PLOT' }, NOW);
    expect(next.level).toBe(2);
    expect(next.width).toBe(10);
    expect(next.height).toBe(10);
  });
});

// ─── Inventory ────────────────────────────────────────────────────────────────

describe('processEvent — GAIN_ITEM', () => {
  it('adds new item to empty inventory', () => {
    const state = freshState();
    const next = processEvent(
      state,
      { type: 'GAIN_ITEM', itemKind: 'wood', quantity: 5 },
      NOW,
    );
    expect(next.inventory['wood']).toBe(5);
  });

  it('stacks onto existing quantity', () => {
    let state = freshState();
    state = processEvent(
      state,
      { type: 'GAIN_ITEM', itemKind: 'wood', quantity: 3 },
      NOW,
    );
    state = processEvent(
      state,
      { type: 'GAIN_ITEM', itemKind: 'wood', quantity: 4 },
      NOW,
    );
    expect(state.inventory['wood']).toBe(7);
  });

  it('throws on non-positive quantity', () => {
    const state = freshState();
    expect(() =>
      processEvent(state, { type: 'GAIN_ITEM', itemKind: 'wood', quantity: 0 }, NOW),
    ).toThrow(/must be positive/);
  });

  it('throws when gain would exceed hoard limit', () => {
    const state = freshState({ inventory: { wood: 9998 } });
    expect(() =>
      processEvent(
        state,
        { type: 'GAIN_ITEM', itemKind: 'wood', quantity: 10 },
        NOW,
      ),
    ).toThrow(/Hoard limit exceeded/);
  });
});

describe('processEvent — SPEND_ITEM', () => {
  it('decrements quantity', () => {
    let state = freshState();
    state = processEvent(
      state,
      { type: 'GAIN_ITEM', itemKind: 'stone', quantity: 10 },
      NOW,
    );
    state = processEvent(
      state,
      { type: 'SPEND_ITEM', itemKind: 'stone', quantity: 3 },
      NOW,
    );
    expect(state.inventory['stone']).toBe(7);
  });

  it('removes item from inventory when reduced to 0', () => {
    let state = freshState();
    state = processEvent(
      state,
      { type: 'GAIN_ITEM', itemKind: 'stone', quantity: 5 },
      NOW,
    );
    state = processEvent(
      state,
      { type: 'SPEND_ITEM', itemKind: 'stone', quantity: 5 },
      NOW,
    );
    expect(state.inventory['stone']).toBeUndefined();
  });

  it('throws when player lacks the item', () => {
    const state = freshState();
    expect(() =>
      processEvent(
        state,
        { type: 'SPEND_ITEM', itemKind: 'wood', quantity: 1 },
        NOW,
      ),
    ).toThrow(/Insufficient/);
  });

  it('throws when spending more than owned', () => {
    let state = freshState();
    state = processEvent(
      state,
      { type: 'GAIN_ITEM', itemKind: 'wood', quantity: 5 },
      NOW,
    );
    expect(() =>
      processEvent(
        state,
        { type: 'SPEND_ITEM', itemKind: 'wood', quantity: 10 },
        NOW,
      ),
    ).toThrow(/Insufficient/);
  });
});

// ─── Currency ─────────────────────────────────────────────────────────────────

describe('processEvent — silver', () => {
  it('GAIN_SILVER increases balance', () => {
    const state = freshState({ silver: 100 });
    const next = processEvent(state, { type: 'GAIN_SILVER', amount: 50 }, NOW);
    expect(next.silver).toBe(150);
  });

  it('SPEND_SILVER decreases balance', () => {
    const state = freshState({ silver: 100 });
    const next = processEvent(state, { type: 'SPEND_SILVER', amount: 30 }, NOW);
    expect(next.silver).toBe(70);
  });

  it('SPEND_SILVER throws when insufficient', () => {
    const state = freshState({ silver: 10 });
    expect(() =>
      processEvent(state, { type: 'SPEND_SILVER', amount: 100 }, NOW),
    ).toThrow(/Insufficient silver/);
  });

  it('GAIN_SILVER throws when exceeds MAX_SILVER cap', () => {
    const state = freshState({ silver: 999_999_999 });
    expect(() =>
      processEvent(state, { type: 'GAIN_SILVER', amount: 100 }, NOW),
    ).toThrow(/Silver hoard limit exceeded/);
  });
});

describe('processEvent — petal', () => {
  it('GAIN_PETAL increases balance', () => {
    const state = freshState({ petal: 0 });
    const next = processEvent(state, { type: 'GAIN_PETAL', amount: 50 }, NOW);
    expect(next.petal).toBe(50);
  });

  it('SPEND_PETAL throws when insufficient', () => {
    const state = freshState({ petal: 0 });
    expect(() =>
      processEvent(state, { type: 'SPEND_PETAL', amount: 1 }, NOW),
    ).toThrow(/Insufficient \$PETAL/);
  });
});

// ─── Energy / XP ──────────────────────────────────────────────────────────────

describe('processEvent — energy', () => {
  it('CONSUME_ENERGY decreases energy', () => {
    const state = freshState({ energy: 100, maxEnergy: 100 });
    const next = processEvent(state, { type: 'CONSUME_ENERGY', amount: 25 }, NOW);
    expect(next.energy).toBe(75);
  });

  it('CONSUME_ENERGY throws when insufficient', () => {
    const state = freshState({ energy: 10, maxEnergy: 100 });
    expect(() =>
      processEvent(state, { type: 'CONSUME_ENERGY', amount: 50 }, NOW),
    ).toThrow(/Insufficient energy/);
  });

  it('RESTORE_ENERGY caps at maxEnergy', () => {
    const state = freshState({ energy: 90, maxEnergy: 100 });
    const next = processEvent(state, { type: 'RESTORE_ENERGY', amount: 50 }, NOW);
    expect(next.energy).toBe(100);
  });
});

describe('processEvent — GAIN_XP', () => {
  it('increases xp', () => {
    const state = freshState();
    const next = processEvent(state, { type: 'GAIN_XP', amount: 50 }, NOW);
    expect(next.xp).toBe(50);
    expect(next.playerLevel).toBe(1);
  });

  it('auto-levels at 100 XP', () => {
    const state = freshState();
    const next = processEvent(state, { type: 'GAIN_XP', amount: 100 }, NOW);
    expect(next.playerLevel).toBe(2);
  });

  it('throws when XP gain exceeds MAX_XP_PER_ACTION', () => {
    const state = freshState();
    expect(() =>
      processEvent(state, { type: 'GAIN_XP', amount: 100_000 }, NOW),
    ).toThrow(/XP gain too large/);
  });
});

// ─── Determinism ─────────────────────────────────────────────────────────────

describe('processEvent — determinism (client+server parity)', () => {
  it('same input produces same output', () => {
    const state = freshState();
    const action = {
      type: 'PLACE_TILE' as const,
      cellX: 1,
      cellY: 1,
      assetId: 'asset-x',
      tileKind: 'oak',
    };
    const out1 = processEvent(state, action, NOW);
    const out2 = processEvent(state, action, NOW);
    expect(out1).toEqual(out2);
  });

  it('does not call Date.now() — deterministic with passed-in `now`', () => {
    const state = freshState();
    const action = {
      type: 'PLACE_TILE' as const,
      cellX: 0,
      cellY: 0,
      assetId: 'a',
      tileKind: 'wheat',
    };
    const out1 = processEvent(state, action, 1000);
    const out2 = processEvent(state, action, 9999);
    // placedAt differs (proves `now` is the only timestamp source)
    expect(out1.cells['0,0']?.tile?.placedAt).toBe(1000);
    expect(out2.cells['0,0']?.tile?.placedAt).toBe(9999);
  });
});
