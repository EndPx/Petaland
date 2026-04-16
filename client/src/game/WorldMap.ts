import Phaser from 'phaser';
import { TileType } from '../types/index';
import { TILE_SIZE, WORLD_WIDTH_TILES, WORLD_HEIGHT_TILES } from '../config';

/**
 * WorldMap — NomStead-style homestead layout.
 *
 * The map is a small, focused world (32x32 tiles) with:
 *   1. Grass base everywhere
 *   2. Central farm area: 8x8 grid of soil plots
 *   3. Stone border around the farm (octagonal shape)
 *   4. Entrance gap at the bottom of the border
 *   5. Scattered trees, bushes, and flowers in the grass
 *   6. A small pond in the NE corner
 *   7. Forest patches in corners
 *
 * The player starts inside the farm area and can walk out
 * through the entrance to explore the surroundings.
 */
export class WorldMap {
  private scene: Phaser.Scene;
  private tileLayer: Phaser.GameObjects.Group;
  private objectLayer: Phaser.GameObjects.Group;
  private collisionObjects: Phaser.GameObjects.Image[] = [];

  private biomes: TileType[][] = [];

  // Farm area bounds (tile coords)
  private readonly farmX = 12;  // farm left edge
  private readonly farmY = 10;  // farm top edge
  private readonly farmW = 8;   // farm width in tiles
  private readonly farmH = 8;   // farm height in tiles

  constructor(scene: Phaser.Scene, _seed = 42) {
    this.scene = scene;
    this.tileLayer = scene.add.group();
    this.objectLayer = scene.add.group();
    this.buildBiomeGrid();
  }

  // ── Map Generation ──────────────────────────────────────────────────────────

  generate(): void {
    this.renderTiles();
    this.placeObjects();
  }

  /**
   * Build NomStead-style biome grid:
   *   - Grass everywhere
   *   - Stone border ring around farm area
   *   - Farm soil inside the border
   *   - Small pond in NE
   *   - Forest patches at corners
   */
  private buildBiomeGrid(): void {
    // 1. Fill everything with grass
    for (let ty = 0; ty < WORLD_HEIGHT_TILES; ty++) {
      this.biomes[ty] = [];
      for (let tx = 0; tx < WORLD_WIDTH_TILES; tx++) {
        this.biomes[ty][tx] = TileType.Grass;
      }
    }

    // 2. Stone border ring around farm (1 tile thick, octagonal)
    const bx = this.farmX - 1;
    const by = this.farmY - 1;
    const bw = this.farmW + 2;
    const bh = this.farmH + 2;

    // Top and bottom edges (skip corners for octagonal)
    for (let tx = bx + 1; tx < bx + bw - 1; tx++) {
      this.setBiome(tx, by, TileType.Stone);      // top
      this.setBiome(tx, by + bh - 1, TileType.Stone); // bottom
    }
    // Left and right edges
    for (let ty = by + 1; ty < by + bh - 1; ty++) {
      this.setBiome(bx, ty, TileType.Stone);       // left
      this.setBiome(bx + bw - 1, ty, TileType.Stone); // right
    }
    // Corner pieces (octagonal bevel)
    this.setBiome(bx + 1, by, TileType.Stone);
    this.setBiome(bx, by + 1, TileType.Stone);
    this.setBiome(bx + bw - 2, by, TileType.Stone);
    this.setBiome(bx + bw - 1, by + 1, TileType.Stone);
    this.setBiome(bx, by + bh - 2, TileType.Stone);
    this.setBiome(bx + 1, by + bh - 1, TileType.Stone);
    this.setBiome(bx + bw - 2, by + bh - 1, TileType.Stone);
    this.setBiome(bx + bw - 1, by + bh - 2, TileType.Stone);

    // 3. Entrance gap at bottom center of border (2 tiles wide)
    const entranceTX = this.farmX + Math.floor(this.farmW / 2) - 1;
    this.setBiome(entranceTX, by + bh - 1, TileType.Grass);
    this.setBiome(entranceTX + 1, by + bh - 1, TileType.Grass);

    // 4. Small pond in NE corner
    this.fillEllipse(26, 5, 3, 2, TileType.Water);

    // 5. Forest patches at map corners
    this.fillRect(0, 0, 4, 4, TileType.Forest);
    this.fillRect(28, 0, 4, 4, TileType.Forest);
    this.fillRect(0, 28, 4, 4, TileType.Forest);
    this.fillRect(28, 28, 4, 4, TileType.Forest);

    // 6. Small stone outcrops
    this.fillRect(6, 2, 2, 2, TileType.Stone);
    this.fillRect(24, 26, 2, 2, TileType.Stone);
  }

  private setBiome(tx: number, ty: number, tile: TileType): void {
    if (tx >= 0 && ty >= 0 && tx < WORLD_WIDTH_TILES && ty < WORLD_HEIGHT_TILES) {
      this.biomes[ty][tx] = tile;
    }
  }

  private fillRect(x: number, y: number, w: number, h: number, tile: TileType): void {
    for (let ty = y; ty < y + h && ty < WORLD_HEIGHT_TILES; ty++) {
      for (let tx = x; tx < x + w && tx < WORLD_WIDTH_TILES; tx++) {
        if (tx >= 0 && ty >= 0) this.biomes[ty][tx] = tile;
      }
    }
  }

  private fillEllipse(cx: number, cy: number, rx: number, ry: number, tile: TileType): void {
    for (let ty = cy - ry; ty <= cy + ry; ty++) {
      for (let tx = cx - rx; tx <= cx + rx; tx++) {
        if (tx < 0 || ty < 0 || tx >= WORLD_WIDTH_TILES || ty >= WORLD_HEIGHT_TILES) continue;
        const dx = (tx - cx) / rx;
        const dy = (ty - cy) / ry;
        if (dx * dx + dy * dy <= 1) this.biomes[ty][tx] = tile;
      }
    }
  }

  // ── Rendering ──────────────────────────────────────────────────────────────

  private renderTiles(): void {
    for (let ty = 0; ty < WORLD_HEIGHT_TILES; ty++) {
      for (let tx = 0; tx < WORLD_WIDTH_TILES; tx++) {
        const wx = tx * TILE_SIZE + TILE_SIZE / 2;
        const wy = ty * TILE_SIZE + TILE_SIZE / 2;
        const tileType = this.biomes[ty][tx];
        const wangIndex = this.pickTileIndex(tx, ty);
        const key = `${tileType}_wang_${wangIndex}`;

        const img = this.scene.add.image(wx, wy, key).setDepth(0);
        this.tileLayer.add(img);
      }
    }
  }

  /**
   * Pick clean base variant (indices 0-3) using deterministic hash.
   */
  private pickTileIndex(tx: number, ty: number): number {
    const h = ((tx * 73856093) ^ (ty * 19349663)) >>> 0;
    return h % 4;
  }

  // ── Object Placement ─────────────────────────────────────────────────────────

  private placeObjects(): void {
    // ── Farm soil beds (8x8 grid inside the border) ──
    for (let row = 0; row < this.farmH; row++) {
      for (let col = 0; col < this.farmW; col++) {
        this.placeObject('soil_bed', this.farmX + col, this.farmY + row, false);
      }
    }

    // ── Village structures near farm entrance ──
    this.placeObject('workbench', this.farmX - 3, this.farmY + 2, true);
    this.placeObject('bonfire', this.farmX - 3, this.farmY + 5, true);
    this.placeObject('well', this.farmX + this.farmW + 2, this.farmY + 3, true);
    this.placeObject('storage_box', this.farmX + this.farmW + 2, this.farmY + 6, true);
    this.placeObject('npc_shop_stall', 16, 22, true);

    // ── Trees in forest corners ──
    this.placePatchObjects('pine_tree', 0, 0, 4, 4, 4, true);
    this.placePatchObjects('pine_tree', 28, 0, 4, 4, 4, true);
    this.placePatchObjects('oak_tree', 0, 28, 4, 4, 4, true);
    this.placePatchObjects('pine_tree', 28, 28, 4, 4, 4, true);

    // ── Scattered oaks in grassland ──
    const treeSpots: [number, number][] = [
      [5, 8], [8, 5], [24, 8], [26, 14],
      [5, 24], [8, 26], [24, 24], [3, 16],
    ];
    for (const [tx, ty] of treeSpots) {
      this.placeObject('oak_tree', tx, ty, true);
    }

    // ── Scattered rocks ──
    const rockSpots: [number, number][] = [
      [7, 3], [25, 27], [3, 20], [27, 12],
    ];
    for (const [tx, ty] of rockSpots) {
      this.placeObject('rock_small', tx, ty, true);
    }

    // ── Wild carrots near farm ──
    const carrotSpots: [number, number][] = [
      [9, 12], [9, 15], [22, 13], [22, 16],
    ];
    for (const [tx, ty] of carrotSpots) {
      this.placeObject('wild_carrot', tx, ty, false);
    }

    // ── Flower petals scattered ──
    const flowerSpots: [number, number][] = [
      [6, 10], [10, 22], [22, 8], [25, 20],
      [8, 18], [14, 24], [20, 24], [4, 14],
    ];
    for (const [tx, ty] of flowerSpots) {
      this.placeObject('flower_petal', tx, ty, false);
    }

    // ── Bushes along paths ──
    this.placeObject('bush', 14, 21, false);
    this.placeObject('bush', 18, 21, false);
    this.placeObject('bush', 10, 8, false);
    this.placeObject('bush', 22, 8, false);
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
    const placed = new Set<string>();
    let attempts = 0;
    let i = 0;
    while (placed.size < count && attempts < count * 20) {
      attempts++;
      const h = (startX * 73856093 + startY * 19349663 + i * 83492791) >>> 0;
      const tx = startX + (h % width);
      const ty = startY + ((h >>> 8) % height);
      i++;
      const k = `${tx},${ty}`;
      if (placed.has(k)) continue;
      placed.add(k);
      this.placeObject(key, tx, ty, solid);
    }
  }

  private placeObject(
    key: string,
    tileX: number,
    tileY: number,
    solid: boolean,
  ): void {
    const wx = tileX * TILE_SIZE + TILE_SIZE / 2;
    const wy = tileY * TILE_SIZE + TILE_SIZE / 2;

    const img = this.scene.add
      .image(wx, wy, key)
      .setDepth(wy)
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

  // ── Farm Area Info ────────────────────────────────────────────────────────────

  getFarmCenter(): { tx: number; ty: number } {
    return {
      tx: this.farmX + Math.floor(this.farmW / 2),
      ty: this.farmY + Math.floor(this.farmH / 2),
    };
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
    const type = this.biomes[ty]?.[tx];
    // Water and stone border are not walkable
    return type !== TileType.Water && type !== TileType.Stone;
  }
}
