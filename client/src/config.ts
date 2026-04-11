// ─── Constants ───────────────────────────────────────────────────────────────
// Pure constants only — no Phaser scene imports (keeps this file test-friendly).

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
