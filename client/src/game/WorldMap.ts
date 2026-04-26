import Phaser from 'phaser';
import { TileType } from '../types/index';
import { TILE_SIZE, WORLD_WIDTH_TILES, WORLD_HEIGHT_TILES } from '../config';

/**
 * WorldMap — NomStead-mirror layout.
 *
 * Specs (from inspecting NomStead):
 *   - 64×64px tiles, canvas fills window
 *   - 10×10 farm grid (border + inner 8×8 plots)
 *   - Octagonal stone border, entrance gap at bottom
 *   - Grass background with small decorations
 *   - Character ~1.25 tiles wide
 *   - No camera zoom
 */
export class WorldMap {
  private scene: Phaser.Scene;
  private tileLayer: Phaser.GameObjects.Group;
  private objectLayer: Phaser.GameObjects.Group;
  private collisionObjects: Phaser.GameObjects.Image[] = [];

  private biomes: TileType[][] = [];

  // Farm area: 8×8 inner plots, border makes it 10×10 total
  // Centered in 24×18 world → farm center at (12, 9)
  private readonly farmX = 8;
  private readonly farmY = 5;
  private readonly farmW = 8;
  private readonly farmH = 8;

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
   * Build biome grid:
   *   - Grass everywhere
   *   - Octagonal stone border around farm
   *   - Entrance gap at bottom center
   *   - Tiny pond in NE
   */
  private buildBiomeGrid(): void {
    // 1. Fill everything with grass
    for (let ty = 0; ty < WORLD_HEIGHT_TILES; ty++) {
      this.biomes[ty] = [];
      for (let tx = 0; tx < WORLD_WIDTH_TILES; tx++) {
        this.biomes[ty][tx] = TileType.Grass;
      }
    }

    // 2. Stone border ring (1 tile thick, octagonal)
    const bx = this.farmX - 1;  // 7
    const by = this.farmY - 1;  // 4
    const bw = this.farmW + 2;  // 10
    const bh = this.farmH + 2;  // 10

    // Top and bottom edges
    for (let tx = bx + 1; tx < bx + bw - 1; tx++) {
      this.setBiome(tx, by, TileType.Stone);
      this.setBiome(tx, by + bh - 1, TileType.Stone);
    }
    // Left and right edges
    for (let ty = by + 1; ty < by + bh - 1; ty++) {
      this.setBiome(bx, ty, TileType.Stone);
      this.setBiome(bx + bw - 1, ty, TileType.Stone);
    }
    // Corner bevels (octagonal)
    this.setBiome(bx + 1, by, TileType.Stone);
    this.setBiome(bx, by + 1, TileType.Stone);
    this.setBiome(bx + bw - 2, by, TileType.Stone);
    this.setBiome(bx + bw - 1, by + 1, TileType.Stone);
    this.setBiome(bx, by + bh - 2, TileType.Stone);
    this.setBiome(bx + 1, by + bh - 1, TileType.Stone);
    this.setBiome(bx + bw - 2, by + bh - 1, TileType.Stone);
    this.setBiome(bx + bw - 1, by + bh - 2, TileType.Stone);

    // 3. Entrance gap at bottom center (2 tiles wide)
    const entranceTX = this.farmX + Math.floor(this.farmW / 2) - 1; // 11
    this.setBiome(entranceTX, by + bh - 1, TileType.Grass);
    this.setBiome(entranceTX + 1, by + bh - 1, TileType.Grass);

    // 4. Tiny pond NE
    this.fillEllipse(20, 3, 1, 1, TileType.Water);
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
        img.setDisplaySize(TILE_SIZE, TILE_SIZE); // scale 16px art → 64px tile
        this.tileLayer.add(img);
      }
    }
  }

  private pickTileIndex(tx: number, ty: number): number {
    const h = ((tx * 73856093) ^ (ty * 19349663)) >>> 0;
    return h % 4;
  }

  // ── Object Placement ─────────────────────────────────────────────────────────

  private placeObjects(): void {
    // ── Farm soil beds (8×8 inner grid) ──
    for (let row = 0; row < this.farmH; row++) {
      for (let col = 0; col < this.farmW; col++) {
        this.placeObject('soil_bed', this.farmX + col, this.farmY + row, false);
      }
    }

    // ── Village structures flanking the farm ──
    this.placeObject('workbench', 5, 7, true);
    this.placeObject('bonfire', 5, 10, true);
    this.placeObject('well', 18, 7, true);
    this.placeObject('storage_box', 18, 10, true);
    this.placeObject('npc_shop_stall', 12, 16, true);

    // ── Trees (prominent, NomStead-scale) ──
    const treeScale = TILE_SIZE / 22; // ~2.9× → trees about 2×3 tiles
    const trees: [string, number, number][] = [
      ['pine_tree', 2, 2],
      ['oak_tree', 4, 3],
      ['pine_tree', 21, 2],
      ['oak_tree', 20, 4],
      ['oak_tree', 2, 14],
      ['pine_tree', 4, 16],
      ['pine_tree', 21, 15],
      ['oak_tree', 20, 16],
      ['oak_tree', 1, 9],
      ['pine_tree', 22, 9],
    ];
    for (const [key, tx, ty] of trees) {
      this.placeObject(key, tx, ty, true, treeScale);
    }

    // ── Rocks ──
    this.placeObject('rock_small', 3, 6, true);
    this.placeObject('rock_small', 21, 13, true);

    // ── Wild carrots near farm ──
    this.placeObject('wild_carrot', 6, 8, false);
    this.placeObject('wild_carrot', 6, 10, false);
    this.placeObject('wild_carrot', 17, 8, false);
    this.placeObject('wild_carrot', 17, 10, false);

    // ── Flower petals ──
    this.placeObject('flower_petal', 3, 8, false);
    this.placeObject('flower_petal', 20, 6, false);
    this.placeObject('flower_petal', 3, 12, false);
    this.placeObject('flower_petal', 20, 12, false);

    // ── Bushes near entrance ──
    this.placeObject('bush', 10, 15, false);
    this.placeObject('bush', 14, 15, false);
    this.placeObject('bush', 6, 14, false);
    this.placeObject('bush', 18, 14, false);
  }

  private placeObject(
    key: string,
    tileX: number,
    tileY: number,
    solid: boolean,
    customScale?: number,
  ): void {
    const wx = tileX * TILE_SIZE + TILE_SIZE / 2;
    const wy = tileY * TILE_SIZE + TILE_SIZE / 2;

    const scale = customScale ?? TILE_SIZE / 32;
    const depth = solid ? wy : 1;
    const img = this.scene.add
      .image(wx, wy, key)
      .setDepth(depth)
      .setOrigin(0.5, 0.85)
      .setScale(scale);

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
    return type !== TileType.Water && type !== TileType.Stone;
  }
}
