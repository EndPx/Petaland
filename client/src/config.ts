// ─── Constants ───────────────────────────────────────────────────────────────
// Pure constants only — no Phaser scene imports (keeps this file test-friendly).

export const GAME_WIDTH = 1280;
export const GAME_HEIGHT = 720;

export const TILE_SIZE = 64;          // NomStead uses 64×64 tiles
export const WORLD_WIDTH_TILES = 24;  // world width (farm centered)
export const WORLD_HEIGHT_TILES = 18; // world height

export const PLAYER_SPEED = 120;      // pixels per second (legacy, not used in grid movement)
export const WALK_FRAME_RATE = 8;     // frames per second for walk anim

export const CAMERA_ZOOM = 1;         // no zoom — NomStead style (64px tiles are large enough)
export const CAMERA_LERP = 0.1;       // camera follow lerp factor

export const ENERGY_REGEN_PER_HOUR = 10;
export const DEFAULT_MAX_ENERGY = 100;
