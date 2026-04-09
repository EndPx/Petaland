import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { MenuScene } from './scenes/MenuScene';
import { GameScene } from './scenes/GameScene';

// ─── Constants ───────────────────────────────────────────────────────────────

export const GAME_WIDTH = 800;
export const GAME_HEIGHT = 600;

export const TILE_SIZE = 16;          // pixels per tile (pixel art)
export const WORLD_WIDTH_TILES = 64;  // map width in tiles
export const WORLD_HEIGHT_TILES = 64; // map height in tiles

export const PLAYER_SPEED = 120;      // pixels per second
export const WALK_FRAME_RATE = 8;     // frames per second for walk anim

export const CAMERA_ZOOM = 3;         // default zoom (3× for pixel art)
export const CAMERA_LERP = 0.1;       // camera follow lerp factor

export const ENERGY_REGEN_PER_HOUR = 10;
export const DEFAULT_MAX_ENERGY = 100;

// ─── Phaser Game Config ──────────────────────────────────────────────────────

export const gameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  parent: 'game-container',
  backgroundColor: '#2d5a27',
  pixelArt: true,                // disables anti-aliasing on canvas
  roundPixels: true,             // prevents sub-pixel rendering

  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false,
    },
  },

  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },

  render: {
    antialias: false,
    antialiasGL: false,
    pixelArt: true,
  },

  scene: [BootScene, MenuScene, GameScene],
};
