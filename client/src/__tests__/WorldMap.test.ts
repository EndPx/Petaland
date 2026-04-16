/**
 * WorldMap.test.ts — tests for NomStead-style 32×32 homestead layout.
 *
 * WorldMap uses Phaser for rendering but exposes pure utility methods
 * (worldToTile, tileToWorld, isWalkable, getWorldWidth/Height, getFarmCenter).
 * We mock Phaser scene APIs so we can instantiate WorldMap without a canvas.
 *
 * Layout (32×32):
 *   - Grass base everywhere
 *   - Stone border around farm (farmX=12, farmY=10, 8×8 plots)
 *   - Entrance gap at bottom center of border (tx=15,16 at ty=18)
 *   - Small pond in NE corner: ellipse(26, 5, rx=3, ry=2)
 *   - Forest patches at all 4 corners (4×4 each)
 *   - Stone outcrops at (6,2) 2×2 and (24,26) 2×2
 *   - isWalkable blocks Water and Stone
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Phaser mock ───────────────────────────────────────────────────────────────

const mockImages: Array<{ wx: number; wy: number; key: string }> = [];

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
import { TILE_SIZE, WORLD_WIDTH_TILES, WORLD_HEIGHT_TILES } from '../config';

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('WorldMap — world dimensions (32×32)', () => {
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

  it('world is 32×16 = 512 pixels wide', () => {
    expect(map.getWorldWidth()).toBe(512);
  });

  it('world is 32×16 = 512 pixels tall', () => {
    expect(map.getWorldHeight()).toBe(512);
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
    const { wx, wy } = map.tileToWorld(7, 4);
    const { tx, ty } = map.worldToTile(wx, wy);
    expect(tx).toBe(7);
    expect(ty).toBe(4);
  });
});

describe('WorldMap — getFarmCenter()', () => {
  let map: WorldMap;

  beforeEach(() => {
    vi.clearAllMocks();
    map = new WorldMap(mockScene as never, 42);
  });

  it('returns center of the 8×8 farm area', () => {
    // farmX=12, farmY=10, farmW=8, farmH=8
    // center = (12 + 4, 10 + 4) = (16, 14)
    expect(map.getFarmCenter()).toEqual({ tx: 16, ty: 14 });
  });
});

describe('WorldMap — isWalkable() boundary checks', () => {
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

  it('returns false for x >= WORLD_WIDTH_TILES (32)', () => {
    expect(map.isWalkable(WORLD_WIDTH_TILES, 0)).toBe(false);
  });

  it('returns false for y >= WORLD_HEIGHT_TILES (32)', () => {
    expect(map.isWalkable(0, WORLD_HEIGHT_TILES)).toBe(false);
  });

  it('returns valid result at max index (31,31)', () => {
    // (31,31) is in bottom-right forest patch (28-31, 28-31) — forest is walkable
    const result = map.isWalkable(WORLD_WIDTH_TILES - 1, WORLD_HEIGHT_TILES - 1);
    expect(result).toBe(true);
  });

  it('returns false at exactly WORLD_WIDTH_TILES', () => {
    expect(map.isWalkable(WORLD_WIDTH_TILES, 0)).toBe(false);
  });

  it('returns false at exactly WORLD_HEIGHT_TILES', () => {
    expect(map.isWalkable(0, WORLD_HEIGHT_TILES)).toBe(false);
  });

  it('worldToTile handles max world pixel correctly', () => {
    const maxPixel = WORLD_WIDTH_TILES * TILE_SIZE - 1;
    const { tx } = map.worldToTile(maxPixel, 0);
    expect(tx).toBe(WORLD_WIDTH_TILES - 1);
  });
});

describe('WorldMap — isWalkable() terrain types', () => {
  let map: WorldMap;

  beforeEach(() => {
    vi.clearAllMocks();
    map = new WorldMap(mockScene as never, 42);
  });

  // ── Grass (walkable) ──

  it('grass tile in open area (20,20) is walkable', () => {
    expect(map.isWalkable(20, 20)).toBe(true);
  });

  it('grass tile inside farm area (15,13) is walkable', () => {
    // Farm interior: farmX=12..19, farmY=10..17 — biome stays grass
    expect(map.isWalkable(15, 13)).toBe(true);
  });

  // ── Forest (walkable) ──

  it('forest tile at NW corner (1,1) is walkable', () => {
    // Forest patch: fillRect(0,0,4,4) → tx 0-3, ty 0-3
    expect(map.isWalkable(1, 1)).toBe(true);
  });

  it('forest tile at SE corner (29,29) is walkable', () => {
    // Forest patch: fillRect(28,28,4,4) → tx 28-31, ty 28-31
    expect(map.isWalkable(29, 29)).toBe(true);
  });

  // ── Stone border (NOT walkable) ──

  it('stone border top edge (14,9) is NOT walkable', () => {
    // Top edge: tx=12-19, ty=9
    expect(map.isWalkable(14, 9)).toBe(false);
  });

  it('stone border left edge (11,12) is NOT walkable', () => {
    // Left edge: tx=11, ty=10-17
    expect(map.isWalkable(11, 12)).toBe(false);
  });

  it('stone border right edge (20,14) is NOT walkable', () => {
    // Right edge: tx=20, ty=10-17
    expect(map.isWalkable(20, 14)).toBe(false);
  });

  it('stone border bottom edge (13,18) is NOT walkable', () => {
    // Bottom edge: tx=12-19, ty=18, except entrance at tx=15,16
    expect(map.isWalkable(13, 18)).toBe(false);
  });

  // ── Stone outcrops (NOT walkable) ──

  it('stone outcrop at (6,2) is NOT walkable', () => {
    // fillRect(6,2,2,2) → tx 6-7, ty 2-3
    expect(map.isWalkable(6, 2)).toBe(false);
  });

  it('stone outcrop at (25,27) is NOT walkable', () => {
    // fillRect(24,26,2,2) → tx 24-25, ty 26-27
    expect(map.isWalkable(25, 27)).toBe(false);
  });

  // ── Water pond (NOT walkable) ──

  it('pond center (26,5) is NOT walkable', () => {
    expect(map.isWalkable(26, 5)).toBe(false);
  });

  it('pond edge (24,5) is NOT walkable', () => {
    // (24-26)/3 = -0.67, (-0.67)^2 = 0.44, + 0 = 0.44 ≤ 1
    expect(map.isWalkable(24, 5)).toBe(false);
  });
});

describe('WorldMap — farm entrance gap', () => {
  let map: WorldMap;

  beforeEach(() => {
    vi.clearAllMocks();
    map = new WorldMap(mockScene as never, 42);
  });

  it('entrance tile (15,18) IS walkable (gap in stone border)', () => {
    // entranceTX = 12 + floor(8/2) - 1 = 15; both (15,18) and (16,18) are grass
    expect(map.isWalkable(15, 18)).toBe(true);
  });

  it('entrance tile (16,18) IS walkable (gap in stone border)', () => {
    expect(map.isWalkable(16, 18)).toBe(true);
  });

  it('adjacent border tile (14,18) is NOT walkable', () => {
    // Just left of entrance — still stone
    expect(map.isWalkable(14, 18)).toBe(false);
  });

  it('adjacent border tile (17,18) is NOT walkable', () => {
    // Just right of entrance — still stone
    expect(map.isWalkable(17, 18)).toBe(false);
  });
});

describe('WorldMap — pond boundary (ellipse at cx=26, cy=5, rx=3, ry=2)', () => {
  let map: WorldMap;

  beforeEach(() => {
    vi.clearAllMocks();
    map = new WorldMap(mockScene as never, 42);
  });

  it('tile at pond center (26,5) IS water', () => {
    expect(map.isWalkable(26, 5)).toBe(false);
  });

  it('tile at pond left edge (23,5) IS water', () => {
    // (23-26)²/9 + 0 = 9/9 = 1 ≤ 1
    expect(map.isWalkable(23, 5)).toBe(false);
  });

  it('tile just outside pond left (22,5) is NOT water', () => {
    // (22-26)²/9 = 16/9 = 1.78 > 1
    expect(map.isWalkable(22, 5)).toBe(true);
  });

  it('tile at pond top (26,3) IS water', () => {
    // 0 + (3-5)²/4 = 4/4 = 1 ≤ 1
    expect(map.isWalkable(26, 3)).toBe(false);
  });

  it('tile just above pond (26,2) is NOT water', () => {
    // 0 + (2-5)²/4 = 9/4 = 2.25 > 1
    expect(map.isWalkable(26, 2)).toBe(true);
  });

  it('tile far from pond (10,20) is walkable (grass)', () => {
    expect(map.isWalkable(10, 20)).toBe(true);
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
    // Sample coordinates across the 32×32 map
    const coords = [[0,0],[1,5],[10,10],[20,15],[26,5],[15,18]];
    for (const [tx, ty] of coords) {
      expect(map1.isWalkable(tx, ty)).toBe(map2.isWalkable(tx, ty));
    }
  });

  it('worldToTile is pure and unaffected by seed', () => {
    const map1 = new WorldMap(mockScene as never, 1);
    const map2 = new WorldMap(mockScene as never, 9999);
    expect(map1.worldToTile(100, 200)).toEqual(map2.worldToTile(100, 200));
  });

  it('different seeds still produce distinct map objects', () => {
    const map1 = new WorldMap(mockScene as never, 1);
    const map2 = new WorldMap(mockScene as never, 2);
    expect(map1).not.toBe(map2);
  });
});
