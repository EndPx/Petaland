/**
 * Player.test.ts — tests for grid-based Player logic and state.
 *
 * Player extends Phaser.GameObjects.Sprite (no physics).
 * Movement is tile-to-tile via tweens, walkability checked externally.
 *
 * We mock Phaser so we can instantiate Player without a canvas and test:
 *   - Initial state values (tile-based constructor)
 *   - setEnergy / setSilver / setPetal clamping/flooring
 *   - setWalletAddress
 *   - setTilePosition pixel conversion
 *   - getTileX / getTileY accessors
 *   - getDirection / getIsMoving initial state
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Phaser mock ───────────────────────────────────────────────────────────────
// Player extends Phaser.GameObjects.Sprite (no physics).

const mockGameEvents = {
  emit: vi.fn(),
};

const mockGame = {
  events: mockGameEvents,
};

const mockScene = {
  add: {
    existing: vi.fn(),
  },
  game: mockGame,
};

vi.mock('phaser', () => {
  class MockSprite {
    x: number;
    y: number;
    scene: typeof mockScene;

    constructor(scene: typeof mockScene, x: number, y: number, _texture: string) {
      this.x = x;
      this.y = y;
      this.scene = scene;
    }

    setDepth = vi.fn().mockReturnThis();
    setOrigin = vi.fn().mockReturnThis();
    setTexture = vi.fn().mockReturnThis();
    setPosition(x: number, y: number) {
      this.x = x;
      this.y = y;
    }
  }

  return {
    default: {
      GameObjects: {
        Sprite: MockSprite,
      },
      Math: {
        Clamp: (value: number, min: number, max: number) =>
          Math.min(Math.max(value, min), max),
      },
      Input: {
        Keyboard: {
          JustDown: vi.fn(() => false),
          KeyCodes: { PLUS: 107, MINUS: 109 },
        },
      },
    },
  };
});

// ── Import after mock ─────────────────────────────────────────────────────────
import { Player } from '../game/Player';
import { TILE_SIZE, PLAYER_SPEED } from '../config';
import { GAME_EVENTS } from '../types/index';

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('Player — initial state (tile-based constructor)', () => {
  let player: Player;

  beforeEach(() => {
    vi.clearAllMocks();
    // Constructor: (scene, tileX, tileY, character)
    // tileX=5, tileY=10 → pixel: (5*16+8, 10*16+8) = (88, 168)
    player = new Player(mockScene as never, 5, 10);
  });

  it('sets initial pixel position from tile coords', () => {
    expect(player.playerData.x).toBe(5 * TILE_SIZE + TILE_SIZE / 2);
    expect(player.playerData.y).toBe(10 * TILE_SIZE + TILE_SIZE / 2);
  });

  it('starts facing south', () => {
    expect(player.getDirection()).toBe('south');
    expect(player.playerData.direction).toBe('south');
  });

  it('starts not moving', () => {
    expect(player.getIsMoving()).toBe(false);
    expect(player.playerData.isMoving).toBe(false);
  });

  it('starts with id "local"', () => {
    expect(player.playerData.id).toBe('local');
  });

  it('starts with default energy 100 / maxEnergy 100', () => {
    expect(player.playerData.energy).toBe(100);
    expect(player.playerData.maxEnergy).toBe(100);
  });

  it('starts with silver 0', () => {
    expect(player.playerData.silver).toBe(0);
  });

  it('starts with petal 0', () => {
    expect(player.playerData.petal).toBe(0);
  });

  it('starts with level 1 and xp 0', () => {
    expect(player.playerData.level).toBe(1);
    expect(player.playerData.xp).toBe(0);
  });

  it('defaults to farmer_male character', () => {
    expect(player.playerData.character).toBe('farmer_male');
  });

  it('accepts farmer_female character', () => {
    const female = new Player(mockScene as never, 0, 0, 'farmer_female');
    expect(female.playerData.character).toBe('farmer_female');
  });
});

describe('Player — tile accessors', () => {
  let player: Player;

  beforeEach(() => {
    vi.clearAllMocks();
    player = new Player(mockScene as never, 5, 10);
  });

  it('getTileX returns initial tileX', () => {
    expect(player.getTileX()).toBe(5);
  });

  it('getTileY returns initial tileY', () => {
    expect(player.getTileY()).toBe(10);
  });

  it('tile (0,0) gives pixel center (8,8)', () => {
    const p = new Player(mockScene as never, 0, 0);
    expect(p.x).toBe(TILE_SIZE / 2);
    expect(p.y).toBe(TILE_SIZE / 2);
  });
});

describe('Player — setEnergy()', () => {
  let player: Player;

  beforeEach(() => {
    vi.clearAllMocks();
    player = new Player(mockScene as never, 0, 0);
  });

  it('sets energy to the given value', () => {
    player.setEnergy(75);
    expect(player.playerData.energy).toBe(75);
  });

  it('clamps energy to 0 when given negative value', () => {
    player.setEnergy(-10);
    expect(player.playerData.energy).toBe(0);
  });

  it('clamps energy to maxEnergy when given value above max', () => {
    player.setEnergy(999);
    expect(player.playerData.energy).toBe(player.playerData.maxEnergy);
  });

  it('emits PLAYER_ENERGY_CHANGE event with energy and maxEnergy', () => {
    player.setEnergy(50);
    expect(mockGameEvents.emit).toHaveBeenCalledWith(
      GAME_EVENTS.PLAYER_ENERGY_CHANGE,
      { energy: 50, maxEnergy: 100 },
    );
  });

  it('allows setting energy to exactly 0', () => {
    player.setEnergy(0);
    expect(player.playerData.energy).toBe(0);
  });

  it('allows setting energy to exactly maxEnergy', () => {
    player.setEnergy(100);
    expect(player.playerData.energy).toBe(100);
  });
});

describe('Player — setSilver()', () => {
  let player: Player;

  beforeEach(() => {
    vi.clearAllMocks();
    player = new Player(mockScene as never, 0, 0);
  });

  it('sets silver to the given positive value', () => {
    player.setSilver(500);
    expect(player.playerData.silver).toBe(500);
  });

  it('floors silver to 0 when given negative value', () => {
    player.setSilver(-100);
    expect(player.playerData.silver).toBe(0);
  });

  it('allows setting silver to 0', () => {
    player.setSilver(0);
    expect(player.playerData.silver).toBe(0);
  });

  it('emits SILVER_CHANGE event with correct silver value', () => {
    player.setSilver(250);
    expect(mockGameEvents.emit).toHaveBeenCalledWith(
      GAME_EVENTS.SILVER_CHANGE,
      { silver: 250 },
    );
  });

  it('handles large silver values', () => {
    player.setSilver(1_000_000);
    expect(player.playerData.silver).toBe(1_000_000);
  });
});

describe('Player — setPetal()', () => {
  let player: Player;

  beforeEach(() => {
    vi.clearAllMocks();
    player = new Player(mockScene as never, 0, 0);
  });

  it('sets petal to the given positive value', () => {
    player.setPetal(42);
    expect(player.playerData.petal).toBe(42);
  });

  it('floors petal to 0 when given negative value', () => {
    player.setPetal(-5);
    expect(player.playerData.petal).toBe(0);
  });

  it('allows setting petal to 0', () => {
    player.setPetal(0);
    expect(player.playerData.petal).toBe(0);
  });

  it('emits PETAL_CHANGE event with correct petal value', () => {
    player.setPetal(10);
    expect(mockGameEvents.emit).toHaveBeenCalledWith(
      GAME_EVENTS.PETAL_CHANGE,
      { petal: 10 },
    );
  });
});

describe('Player — setWalletAddress()', () => {
  let player: Player;

  beforeEach(() => {
    vi.clearAllMocks();
    player = new Player(mockScene as never, 0, 0);
  });

  it('sets wallet address on playerData', () => {
    player.setWalletAddress('ABC123XYZ');
    expect(player.playerData.walletAddress).toBe('ABC123XYZ');
  });

  it('starts with empty wallet address', () => {
    expect(player.playerData.walletAddress).toBe('');
  });

  it('overwrites existing wallet address', () => {
    player.setWalletAddress('first');
    player.setWalletAddress('second');
    expect(player.playerData.walletAddress).toBe('second');
  });
});

describe('Player — setTilePosition()', () => {
  let player: Player;

  beforeEach(() => {
    vi.clearAllMocks();
    player = new Player(mockScene as never, 0, 0);
  });

  it('teleports to tile (0, 0) — pixel center of first tile', () => {
    player.setTilePosition(0, 0);
    expect(player.x).toBe(TILE_SIZE / 2);
    expect(player.y).toBe(TILE_SIZE / 2);
  });

  it('teleports to tile (1, 1) — correct pixel coords', () => {
    player.setTilePosition(1, 1);
    expect(player.x).toBe(TILE_SIZE + TILE_SIZE / 2);
    expect(player.y).toBe(TILE_SIZE + TILE_SIZE / 2);
  });

  it('teleports to tile (5, 3) — correct pixel coords', () => {
    player.setTilePosition(5, 3);
    expect(player.x).toBe(5 * TILE_SIZE + TILE_SIZE / 2);
    expect(player.y).toBe(3 * TILE_SIZE + TILE_SIZE / 2);
  });

  it('updates getTileX and getTileY after teleport', () => {
    player.setTilePosition(12, 8);
    expect(player.getTileX()).toBe(12);
    expect(player.getTileY()).toBe(8);
  });
});

describe('Player — PLAYER_SPEED constant', () => {
  it('PLAYER_SPEED is 120 pixels per second (legacy)', () => {
    expect(PLAYER_SPEED).toBe(120);
  });
});
