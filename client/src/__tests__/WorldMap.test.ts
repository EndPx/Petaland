/**
 * WorldMap.test.ts — tests for NomStead-mirror 24×18 homestead.
 *
 * Layout (24×18):
 *   - Grass base everywhere
 *   - Stone border around farm (farmX=8, farmY=5, 8×8 inner plots)
 *   - Border: 10×10 from (7,4) to (16,13)
 *   - Entrance gap at bottom center (tx=11,12 at ty=13)
 *   - Tiny pond: ellipse(20, 3, rx=1, ry=1)
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
    setDisplaySize: vi.fn().mockReturnThis(),
    setScale: vi.fn().mockReturnThis(),
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

describe('WorldMap — world dimensions (24×18)', () => {
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

  it('world is 24×TILE_SIZE pixels wide', () => {
    expect(map.getWorldWidth()).toBe(24 * TILE_SIZE);
  });

  it('world is 18×TILE_SIZE pixels tall', () => {
    expect(map.getWorldHeight()).toBe(18 * TILE_SIZE);
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

  it('worldToTile converts pixel at TILE_SIZE to tile (1,1)', () => {
    expect(map.worldToTile(TILE_SIZE, TILE_SIZE)).toEqual({ tx: 1, ty: 1 });
  });

  it('worldToTile floors partial tile coordinates', () => {
    expect(map.worldToTile(TILE_SIZE + 1, TILE_SIZE + 9)).toEqual({ tx: 1, ty: 1 });
  });

  it('worldToTile converts pixel (2*TILE_SIZE, 3*TILE_SIZE) to tile (2,3)', () => {
    expect(map.worldToTile(2 * TILE_SIZE, 3 * TILE_SIZE)).toEqual({ tx: 2, ty: 3 });
  });

  it('tileToWorld converts tile (0,0) to pixel center', () => {
    expect(map.tileToWorld(0, 0)).toEqual({ wx: TILE_SIZE / 2, wy: TILE_SIZE / 2 });
  });

  it('tileToWorld converts tile (1,1) to pixel center', () => {
    expect(map.tileToWorld(1, 1)).toEqual({
      wx: TILE_SIZE + TILE_SIZE / 2,
      wy: TILE_SIZE + TILE_SIZE / 2,
    });
  });

  it('worldToTile and tileToWorld are inverse (round-trip)', () => {
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
    // farmX=8, farmY=5, farmW=8, farmH=8
    // center = (8 + 4, 5 + 4) = (12, 9)
    expect(map.getFarmCenter()).toEqual({ tx: 12, ty: 9 });
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

  it('returns false for x >= WORLD_WIDTH_TILES (24)', () => {
    expect(map.isWalkable(WORLD_WIDTH_TILES, 0)).toBe(false);
  });

  it('returns false for y >= WORLD_HEIGHT_TILES (18)', () => {
    expect(map.isWalkable(0, WORLD_HEIGHT_TILES)).toBe(false);
  });

  it('returns valid result at max index (23,17)', () => {
    expect(map.isWalkable(WORLD_WIDTH_TILES - 1, WORLD_HEIGHT_TILES - 1)).toBe(true);
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

  it('grass tile in open area (0,0) is walkable', () => {
    expect(map.isWalkable(0, 0)).toBe(true);
  });

  it('grass tile inside farm area (10,8) is walkable', () => {
    expect(map.isWalkable(10, 8)).toBe(true);
  });

  // ── Stone border (NOT walkable) ──

  it('stone border top edge (10,4) is NOT walkable', () => {
    expect(map.isWalkable(10, 4)).toBe(false);
  });

  it('stone border left edge (7,7) is NOT walkable', () => {
    expect(map.isWalkable(7, 7)).toBe(false);
  });

  it('stone border right edge (16,7) is NOT walkable', () => {
    expect(map.isWalkable(16, 7)).toBe(false);
  });

  it('stone border bottom edge (9,13) is NOT walkable', () => {
    expect(map.isWalkable(9, 13)).toBe(false);
  });

  // ── Water pond (NOT walkable) ──

  it('pond center (20,3) is NOT walkable', () => {
    expect(map.isWalkable(20, 3)).toBe(false);
  });
});

describe('WorldMap — farm entrance gap', () => {
  let map: WorldMap;

  beforeEach(() => {
    vi.clearAllMocks();
    map = new WorldMap(mockScene as never, 42);
  });

  it('entrance tile (11,13) IS walkable', () => {
    // entranceTX = 8 + floor(8/2) - 1 = 11
    expect(map.isWalkable(11, 13)).toBe(true);
  });

  it('entrance tile (12,13) IS walkable', () => {
    expect(map.isWalkable(12, 13)).toBe(true);
  });

  it('adjacent border tile (10,13) is NOT walkable', () => {
    expect(map.isWalkable(10, 13)).toBe(false);
  });

  it('adjacent border tile (13,13) is NOT walkable', () => {
    expect(map.isWalkable(13, 13)).toBe(false);
  });
});

describe('WorldMap — pond boundary (ellipse at cx=20, cy=3, rx=1, ry=1)', () => {
  let map: WorldMap;

  beforeEach(() => {
    vi.clearAllMocks();
    map = new WorldMap(mockScene as never, 42);
  });

  it('pond center (20,3) IS water', () => {
    expect(map.isWalkable(20, 3)).toBe(false);
  });

  it('pond left (19,3) IS water', () => {
    expect(map.isWalkable(19, 3)).toBe(false);
  });

  it('pond right (21,3) IS water', () => {
    expect(map.isWalkable(21, 3)).toBe(false);
  });

  it('tile outside pond (18,3) is walkable', () => {
    expect(map.isWalkable(18, 3)).toBe(true);
  });

  it('diagonal from pond (19,2) is walkable (outside ellipse)', () => {
    // (19-20)²/1 + (2-3)²/1 = 1 + 1 = 2 > 1
    expect(map.isWalkable(19, 2)).toBe(true);
  });
});

describe('WorldMap — seeded PRNG determinism', () => {
  it('two maps with same seed produce same dimensions', () => {
    const map1 = new WorldMap(mockScene as never, 12345);
    const map2 = new WorldMap(mockScene as never, 12345);
    expect(map1.getWorldWidth()).toBe(map2.getWorldWidth());
    expect(map1.getWorldHeight()).toBe(map2.getWorldHeight());
  });

  it('isWalkable is deterministic with same seed', () => {
    const map1 = new WorldMap(mockScene as never, 99);
    const map2 = new WorldMap(mockScene as never, 99);
    const coords = [[0,0],[7,7],[12,9],[20,3],[11,13],[16,7]];
    for (const [tx, ty] of coords) {
      expect(map1.isWalkable(tx, ty)).toBe(map2.isWalkable(tx, ty));
    }
  });

  it('worldToTile is pure and unaffected by seed', () => {
    const map1 = new WorldMap(mockScene as never, 1);
    const map2 = new WorldMap(mockScene as never, 9999);
    expect(map1.worldToTile(100, 200)).toEqual(map2.worldToTile(100, 200));
  });
});
