import Phaser from 'phaser';
import { TileType, ObjectType, PlacedObject } from '../types/index';
import { TILE_SIZE, WORLD_WIDTH_TILES, WORLD_HEIGHT_TILES } from '../config';

interface TileSprite {
  image: Phaser.GameObjects.Image;
  tileX: number;
  tileY: number;
  type: TileType;
  wangIndex: number;
}

/**
 * WorldMap — renders the tile-based world using individual Wang tile images
 * and places static objects (trees, rocks, etc.) on top.
 *
 * Since there is no tilemap JSON, we build the world procedurally:
 * - Base layer: grass Wang tiles
 * - Accent layer: scattered forest/stone/water patches
 * - Object layer: trees, rocks, bushes, buildings
 */
export class WorldMap {
  private scene: Phaser.Scene;
  private tileLayer: Phaser.GameObjects.Group;
  private objectLayer: Phaser.GameObjects.Group;
  private collisionObjects: Phaser.GameObjects.Image[] = [];

  // Simple seeded pseudo-random for deterministic map generation
  private seed: number;

  constructor(scene: Phaser.Scene, seed = 42) {
    this.scene = scene;
    this.seed = seed;
    this.tileLayer = scene.add.group();
    this.objectLayer = scene.add.group();
  }

  // ── Map Generation ──────────────────────────────────────────────────────────

  generate(): void {
    this.generateTiles();
    this.placeObjects();
  }

  private generateTiles(): void {
    for (let ty = 0; ty < WORLD_HEIGHT_TILES; ty++) {
      for (let tx = 0; tx < WORLD_WIDTH_TILES; tx++) {
        const wx = tx * TILE_SIZE + TILE_SIZE / 2;
        const wy = ty * TILE_SIZE + TILE_SIZE / 2;

        const tileType = this.getTileType(tx, ty);
        const wangIndex = this.getWangIndex(tx, ty, tileType);
        const key = `${tileType}_wang_${wangIndex}`;

        const img = this.scene.add.image(wx, wy, key).setDepth(0);
        this.tileLayer.add(img);
      }
    }
  }

  /** Determine tile type using simple noise-like logic */
  private getTileType(tx: number, ty: number): TileType {
    const n = this.noise(tx, ty);

    // Water border / river
    if (
      (tx > 20 && tx < 23 && ty > 10 && ty < 40) ||
      (ty > 28 && ty < 31 && tx > 5 && tx < 35)
    ) {
      return TileType.Water;
    }

    // Stone patch (top-right area)
    if (tx > 40 && tx < 55 && ty > 5 && ty < 20) {
      return TileType.Stone;
    }

    // Forest patch (bottom-left)
    if (tx > 5 && tx < 18 && ty > 35 && ty < 55) {
      return TileType.Forest;
    }

    // Another forest patch
    if (tx > 45 && tx < 60 && ty > 38 && ty < 58) {
      return TileType.Forest;
    }

    // Use noise for small scattered patches
    if (n > 0.75 && tx % 4 === 0 && ty % 3 === 0) {
      return TileType.Forest;
    }

    return TileType.Grass;
  }

  /**
   * Compute Wang index (0–15) based on neighbor tile types.
   * Wang tiles encode edge connectivity (N/E/S/W bits).
   * Bit layout: bit3=N, bit2=E, bit1=S, bit0=W
   */
  private getWangIndex(tx: number, ty: number, type: TileType): number {
    // For simplicity use noise-varied indices per tile type
    // giving organic visual variation without needing full neighbor checks
    const n = this.noise(tx * 3, ty * 7);
    return Math.floor(n * 16) % 16;
  }

  // ── Object Placement ─────────────────────────────────────────────────────────

  private placeObjects(): void {
    // Oak trees scattered in grass areas
    this.placeScatteredObjects('oak_tree', 80, 2, 58, 2, 58, true);

    // Pine trees in forest areas
    this.placePatchObjects('pine_tree', 5, 35, 13, 20, 30, true);
    this.placePatchObjects('pine_tree', 45, 38, 15, 20, 30, true);

    // Rocks (stone area + scattered)
    this.placeScatteredObjects('rock_small', 30, 2, 58, 2, 58, true);
    this.placePatchObjects('rock_small', 40, 5, 15, 15, 25, true);

    // Bushes (scattered light)
    this.placeScatteredObjects('bush', 50, 2, 58, 2, 58, false);

    // Wild carrots (gatherable)
    this.placeScatteredObjects('wild_carrot', 40, 2, 58, 2, 58, false);

    // Flower petals
    this.placeScatteredObjects('flower_petal', 35, 2, 30, 2, 30, false);

    // Starter village area (center-ish): NPC shop stall + workbench + well
    this.placeBuilding('npc_shop_stall', 30, 25, true);
    this.placeBuilding('workbench', 32, 26, true);
    this.placeBuilding('well', 28, 26, true);
    this.placeBuilding('bonfire', 30, 27, true);

    // Some fences around starter village
    for (let i = 26; i <= 34; i++) {
      this.placeBuilding('fence', i, 23, true);
    }
  }

  private placeScatteredObjects(
    key: string,
    count: number,
    minX: number,
    maxX: number,
    minY: number,
    maxY: number,
    solid: boolean,
  ): void {
    let placed = 0;
    let attempts = 0;
    while (placed < count && attempts < count * 10) {
      attempts++;
      const tx = this.randInt(minX, maxX);
      const ty = this.randInt(minY, maxY);
      const n = this.noise(tx * 13 + placed, ty * 17 + placed);
      if (n > 0.45) {
        this.placeBuilding(key, tx, ty, solid);
        placed++;
      }
    }
  }

  private placePatchObjects(
    key: string,
    startX: number,
    startY: number,
    width: number,
    height: number,
    count: number,
    solid: boolean,
  ): void {
    for (let i = 0; i < count; i++) {
      const tx = startX + this.randInt(0, width);
      const ty = startY + this.randInt(0, height);
      this.placeBuilding(key, tx, ty, solid);
    }
  }

  private placeBuilding(
    key: string,
    tileX: number,
    tileY: number,
    solid: boolean,
  ): void {
    const wx = tileX * TILE_SIZE + TILE_SIZE / 2;
    const wy = tileY * TILE_SIZE + TILE_SIZE / 2;

    const img = this.scene.add
      .image(wx, wy, key)
      .setDepth(wy) // depth-sort by Y for top-down overlap
      .setOrigin(0.5, 0.85);

    this.objectLayer.add(img);
    if (solid) {
      this.collisionObjects.push(img);
    }
  }

  // ── Collision ────────────────────────────────────────────────────────────────

  getCollisionObjects(): Phaser.GameObjects.Image[] {
    return this.collisionObjects;
  }

  /** Enable physics on collision objects so player can collide with them */
  enablePhysics(
    physics: Phaser.Physics.Arcade.ArcadePhysics,
  ): Phaser.Physics.Arcade.StaticGroup {
    const group = physics.add.staticGroup();
    for (const obj of this.collisionObjects) {
      group.add(obj);
    }
    group.refresh();
    return group;
  }

  // ── World Bounds ──────────────────────────────────────────────────────────────

  getWorldWidth(): number {
    return WORLD_WIDTH_TILES * TILE_SIZE;
  }

  getWorldHeight(): number {
    return WORLD_HEIGHT_TILES * TILE_SIZE;
  }

  // ── Utility ──────────────────────────────────────────────────────────────────

  worldToTile(wx: number, wy: number): { tx: number; ty: number } {
    return {
      tx: Math.floor(wx / TILE_SIZE),
      ty: Math.floor(wy / TILE_SIZE),
    };
  }

  tileToWorld(tx: number, ty: number): { wx: number; wy: number } {
    return {
      wx: tx * TILE_SIZE + TILE_SIZE / 2,
      wy: ty * TILE_SIZE + TILE_SIZE / 2,
    };
  }

  isWalkable(tx: number, ty: number): boolean {
    if (tx < 0 || ty < 0 || tx >= WORLD_WIDTH_TILES || ty >= WORLD_HEIGHT_TILES) {
      return false;
    }
    const type = this.getTileType(tx, ty);
    return type !== TileType.Water;
  }

  // ── Seeded PRNG ──────────────────────────────────────────────────────────────

  private noise(x: number, y: number): number {
    let h = this.seed + x * 374761393 + y * 668265263;
    h = (h ^ (h >>> 13)) * 1274126177;
    h = h ^ (h >>> 16);
    return (Math.abs(h) % 10000) / 10000;
  }

  private randInt(min: number, max: number): number {
    this.seed = (this.seed * 1664525 + 1013904223) & 0xffffffff;
    const t = Math.abs(this.seed) % (max - min + 1);
    return min + t;
  }
}
