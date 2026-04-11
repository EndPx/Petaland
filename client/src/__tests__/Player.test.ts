/**
 * Player.test.ts — RED phase tests for Player logic and state.
 *
 * Phaser requires a live canvas/WebGL context, so we mock the entire Phaser
 * module.  We then test only the pure logic portions of Player:
 *   - Initial state values
 *   - setEnergy / setSilver / setPetal clamping/flooring
 *   - setWalletAddress
 *   - setTilePosition pixel conversion
 *   - getDirection / getIsMoving initial state
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Phaser mock ───────────────────────────────────────────────────────────────
// We need a minimal Phaser stub so Player.ts can be imported without a browser.

const mockBody = {
  setCollideWorldBounds: vi.fn(),
  setSize: vi.fn(),
  setOffset: vi.fn(),
  setVelocity: vi.fn(),
};

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
  physics: {
    add: {
      existing: vi.fn(),
    },
  },
  game: mockGame,
};

vi.mock('phaser', () => {
  class MockSprite {
    x: number;
    y: number;
    body: typeof mockBody;
    scene: typeof mockScene;

    constructor(scene: typeof mockScene, x: number, y: number, _texture: string) {
      this.x = x;
      this.y = y;
      this.body = mockBody;
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
      Physics: {
        Arcade: {
          Sprite: MockSprite,
        },
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

describe('Player — initial state', () => {
  let player: Player;

  beforeEach(() => {
    vi.clearAllMocks();
    player = new Player(mockScene as never, 100, 200);
  });

  it('sets initial x and y from constructor args', () => {
    expect(player.playerData.x).toBe(100);
    expect(player.playerData.y).toBe(200);
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

  it('converts tile (0, 0) to pixel center of first tile', () => {
    player.setTilePosition(0, 0, TILE_SIZE);
    expect(player.x).toBe(TILE_SIZE / 2);
    expect(player.y).toBe(TILE_SIZE / 2);
  });

  it('converts tile (1, 1) to correct pixel coords', () => {
    player.setTilePosition(1, 1, TILE_SIZE);
    expect(player.x).toBe(TILE_SIZE + TILE_SIZE / 2);
    expect(player.y).toBe(TILE_SIZE + TILE_SIZE / 2);
  });

  it('converts tile (5, 3) to correct pixel coords', () => {
    player.setTilePosition(5, 3, TILE_SIZE);
    expect(player.x).toBe(5 * TILE_SIZE + TILE_SIZE / 2);
    expect(player.y).toBe(3 * TILE_SIZE + TILE_SIZE / 2);
  });

  it('works with arbitrary tile sizes', () => {
    player.setTilePosition(2, 4, 32);
    expect(player.x).toBe(2 * 32 + 16);
    expect(player.y).toBe(4 * 32 + 16);
  });
});

describe('Player — PLAYER_SPEED constant', () => {
  it('PLAYER_SPEED is 120 pixels per second', () => {
    expect(PLAYER_SPEED).toBe(120);
  });
});
