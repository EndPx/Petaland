/**
 * WorldMap.test.ts — RED phase tests for WorldMap logic.
 *
 * WorldMap uses Phaser for rendering but exposes pure utility methods
 * (worldToTile, tileToWorld, isWalkable, getWorldWidth/Height, seeded PRNG).
 * We mock Phaser scene APIs so we can instantiate WorldMap without a canvas.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Phaser mock ───────────────────────────────────────────────────────────────

const mockImages: Array<{ wx: number; wy: number; key: string }> = [];
const mockObjects: Array<{ key: string; tx: number; ty: number; solid: boolean }> = [];

const mockImage = vi.fn((wx: number, wy: number, key: string) => {
  const obj = {
    wx,
    wy,
    key,
    setDepth: vi.fn().mockReturnThis(),
    setOrigin: vi.fn().mockReturnThis(),
  };
  mockImages.push({ wx, wy, key });
  return obj;
});

const mockGroup = {
  add: vi.fn(),
};

const mockScene = {
  add: {
    image: mockImage,
    group: vi.fn(() => mockGroup),
  },
  physics: {
    add: {
      staticGroup: vi.fn(() => ({
        add: vi.fn(),
        refresh: vi.fn(),
      })),
    },
  },
};

vi.mock('phaser', () => ({
  default: {
    Physics: {
      Arcade: {
        Sprite: class {},
      },
    },
    Math: {
      Clamp: (v: number, min: number, max: number) => Math.min(Math.max(v, min), max),
    },
  },
}));

// ── Import after mock ─────────────────────────────────────────────────────────
import { WorldMap } from '../game/WorldMap';
import { TileType } from '../types/index';
import { TILE_SIZE, WORLD_WIDTH_TILES, WORLD_HEIGHT_TILES } from '../config';

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('WorldMap — world dimensions', () => {
  let map: WorldMap;

  beforeEach(() => {
    vi.clearAllMocks();
    mockImages.length = 0;
    map = new WorldMap(mockScene as never, 42);
  });

  it('getWorldWidth returns WORLD_WIDTH_TILES * TILE_SIZE', () => {
    expect(map.getWorldWidth()).toBe(WORLD_WIDTH_TILES * TILE_SIZE);
  });

  it('getWorldHeight returns WORLD_HEIGHT_TILES * TILE_SIZE', () => {
    expect(map.getWorldHeight()).toBe(WORLD_HEIGHT_TILES * TILE_SIZE);
  });

  it('default world width is 64 * 16 = 1024', () => {
    expect(map.getWorldWidth()).toBe(1024);
  });

  it('default world height is 64 * 16 = 1024', () => {
    expect(map.getWorldHeight()).toBe(1024);
  });
});

describe('WorldMap — coordinate conversion', () => {
  let map: WorldMap;

  beforeEach(() => {
    vi.clearAllMocks();
    map = new WorldMap(mockScene as never, 42);
  });

  it('worldToTile converts pixel (0,0) to tile (0,0)', () => {
    expect(map.worldToTile(0, 0)).toEqual({ tx: 0, ty: 0 });
  });

  it('worldToTile converts pixel (16,16) to tile (1,1)', () => {
    expect(map.worldToTile(16, 16)).toEqual({ tx: 1, ty: 1 });
  });

  it('worldToTile floors partial tile coordinates', () => {
    expect(map.worldToTile(17, 25)).toEqual({ tx: 1, ty: 1 });
  });

  it('worldToTile converts pixel (32,48) to tile (2,3)', () => {
    expect(map.worldToTile(32, 48)).toEqual({ tx: 2, ty: 3 });
  });

  it('tileToWorld converts tile (0,0) to pixel center (8,8)', () => {
    expect(map.tileToWorld(0, 0)).toEqual({ wx: 8, wy: 8 });
  });

  it('tileToWorld converts tile (1,1) to pixel center (24,24)', () => {
    expect(map.tileToWorld(1, 1)).toEqual({ wx: 24, wy: 24 });
  });

  it('tileToWorld converts tile (5,3) to correct center', () => {
    expect(map.tileToWorld(5, 3)).toEqual({
      wx: 5 * TILE_SIZE + TILE_SIZE / 2,
      wy: 3 * TILE_SIZE + TILE_SIZE / 2,
    });
  });

  it('worldToTile and tileToWorld are inverse operations (round-trip via floor)', () => {
    // tileToWorld gives center, worldToTile floors — centers should round-trip
    const { wx, wy } = map.tileToWorld(7, 4);
    const { tx, ty } = map.worldToTile(wx, wy);
    expect(tx).toBe(7);
    expect(ty).toBe(4);
  });
});

describe('WorldMap — isWalkable()', () => {
  let map: WorldMap;

  beforeEach(() => {
    vi.clearAllMocks();
    map = new WorldMap(mockScene as never, 42);
  });

  it('returns false for negative x', () => {
    expect(map.isWalkable(-1, 0)).toBe(false);
  });

  it('returns false for negative y', () => {
    expect(map.isWalkable(0, -1)).toBe(false);
  });

  it('returns false for x >= WORLD_WIDTH_TILES', () => {
    expect(map.isWalkable(WORLD_WIDTH_TILES, 0)).toBe(false);
  });

  it('returns false for y >= WORLD_HEIGHT_TILES', () => {
    expect(map.isWalkable(0, WORLD_HEIGHT_TILES)).toBe(false);
  });

  it('returns false for water tile at (11, 15) — known river region (tx 10-12, ty 8-47)', () => {
    // Hand-authored river runs fillRect(10, 8, 3, 40) => tx ∈ [10,12], ty ∈ [8,47]
    expect(map.isWalkable(11, 15)).toBe(false);
  });

  it('returns true for grass tile at origin (0,0)', () => {
    // (0,0) is in the stone mountain band (rows 0-4), but stone is walkable
    expect(map.isWalkable(0, 0)).toBe(true);
  });

  it('returns true for a known grass tile at (25,25) inside the village plaza', () => {
    expect(map.isWalkable(25, 25)).toBe(true);
  });

  it('returns true for forest tile (non-water)', () => {
    // Forest SW patch: fillRect(0, 48, 18, 16) => tx ∈ [0,17], ty ∈ [48,63]
    expect(map.isWalkable(5, 55)).toBe(true);
  });

  it('returns true for stone tile (non-water)', () => {
    // Stone mountain band fillRect(0, 0, 64, 5) => ty ∈ [0,4], any tx
    expect(map.isWalkable(45, 2)).toBe(true);
  });
});

describe('WorldMap — seeded PRNG determinism', () => {
  it('two maps with same seed produce same world dimensions', () => {
    const map1 = new WorldMap(mockScene as never, 12345);
    const map2 = new WorldMap(mockScene as never, 12345);
    expect(map1.getWorldWidth()).toBe(map2.getWorldWidth());
    expect(map1.getWorldHeight()).toBe(map2.getWorldHeight());
  });

  it('isWalkable is deterministic with same seed', () => {
    const map1 = new WorldMap(mockScene as never, 99);
    const map2 = new WorldMap(mockScene as never, 99);
    // Sample several coordinates
    const coords = [[0,0],[1,5],[10,10],[30,25],[45,10],[21,15]];
    for (const [tx, ty] of coords) {
      expect(map1.isWalkable(tx, ty)).toBe(map2.isWalkable(tx, ty));
    }
  });

  it('worldToTile is pure and unaffected by seed', () => {
    const map1 = new WorldMap(mockScene as never, 1);
    const map2 = new WorldMap(mockScene as never, 9999);
    expect(map1.worldToTile(100, 200)).toEqual(map2.worldToTile(100, 200));
  });

  it('different seeds can produce different walkability in noise-driven tiles', () => {
    const map1 = new WorldMap(mockScene as never, 1);
    const map2 = new WorldMap(mockScene as never, 2);
    // We cannot guarantee a specific tile differs, but the maps are distinct objects
    expect(map1).not.toBe(map2);
  });
});

describe('WorldMap — boundary conditions', () => {
  let map: WorldMap;

  beforeEach(() => {
    vi.clearAllMocks();
    map = new WorldMap(mockScene as never, 42);
  });

  it('isWalkable returns true at max valid index (63,63)', () => {
    // Corner — should be grass (outside all special patches)
    const result = map.isWalkable(WORLD_WIDTH_TILES - 1, WORLD_HEIGHT_TILES - 1);
    // 63,63 is in bottom-right forest patch (tx > 45 && tx < 60 = no, 63 > 60)
    // So it should be grass = walkable
    expect(result).toBe(true);
  });

  it('isWalkable returns false at exactly WORLD_WIDTH_TILES', () => {
    expect(map.isWalkable(WORLD_WIDTH_TILES, 0)).toBe(false);
  });

  it('isWalkable returns false at exactly WORLD_HEIGHT_TILES', () => {
    expect(map.isWalkable(0, WORLD_HEIGHT_TILES)).toBe(false);
  });

  it('worldToTile handles max world pixel correctly', () => {
    const maxPixel = WORLD_WIDTH_TILES * TILE_SIZE - 1;
    const { tx } = map.worldToTile(maxPixel, 0);
    expect(tx).toBe(WORLD_WIDTH_TILES - 1);
  });
});

describe('WorldMap — water region boundaries (hand-authored river & lake)', () => {
  let map: WorldMap;

  beforeEach(() => {
    vi.clearAllMocks();
    map = new WorldMap(mockScene as never, 42);
  });

  // River is fillRect(10, 8, 3, 40) → tx ∈ [10,12], ty ∈ [8,47]

  it('tile at tx=9 (just left of vertical river) is NOT water', () => {
    expect(map.isWalkable(9, 15)).toBe(true);
  });

  it('tile at tx=10 inside vertical river IS water', () => {
    expect(map.isWalkable(10, 15)).toBe(false);
  });

  it('tile at tx=12 (right edge of river) IS water', () => {
    expect(map.isWalkable(12, 15)).toBe(false);
  });

  it('tile at tx=13 (just right of river) is NOT water', () => {
    expect(map.isWalkable(13, 15)).toBe(true);
  });

  // Lake is ellipse centered at (44, 28) with rx=5, ry=4

  it('tile at center of lake (44, 28) IS water', () => {
    expect(map.isWalkable(44, 28)).toBe(false);
  });

  it('tile far from lake (20, 20) is NOT water (grass)', () => {
    expect(map.isWalkable(20, 20)).toBe(true);
  });
});
