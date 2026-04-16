import Phaser from 'phaser';
import { TileType } from '../types/index';
import { TILE_SIZE, WORLD_WIDTH_TILES, WORLD_HEIGHT_TILES } from '../config';

/**
 * WorldMap — renders the tile-based world from a hand-authored biome layout.
 *
 * Design principles (learned the hard way after trying random Wang indices):
 *   1. One clean "center" Wang tile (index 15) per biome → no visual chaos
 *   2. Biome zones are hand-designed rectangles → coherent layout
 *   3. Variation comes from sparse, deterministic accent tiles, not randomness
 *   4. Objects are placed in organized clusters (farm plots in rows, village
 *      buildings aligned, forests as solid patches)
 */
export class WorldMap {
  private scene: Phaser.Scene;
  private tileLayer: Phaser.GameObjects.Group;
  private objectLayer: Phaser.GameObjects.Group;
  private collisionObjects: Phaser.GameObjects.Image[] = [];

  // The biome grid — every cell is a TileType
  private biomes: TileType[][] = [];

  constructor(scene: Phaser.Scene, _seed = 42) {
    this.scene = scene;
    this.tileLayer = scene.add.group();
    this.objectLayer = scene.add.group();
    // Build the biome grid eagerly so walkability queries work before generate().
    // Rendering Phaser images still happens in generate() to allow
    // construction in tests without a full Phaser runtime.
    this.buildBiomeGrid();
  }

  // ── Map Generation ──────────────────────────────────────────────────────────

  generate(): void {
    this.renderTiles();
    this.placeObjects();
  }

  /**
   * Build the biome grid by hand-designing zones:
   *   - Grass base (the whole map)
   *   - Central village plaza (grass)
   *   - Forest in NE and SW corners
   *   - Stone mountain range across the N
   *   - River flowing S→N through the middle
   *   - Small lake in the E
   */
  private buildBiomeGrid(): void {
    // 1. Fill everything with grass
    for (let ty = 0; ty < WORLD_HEIGHT_TILES; ty++) {
      this.biomes[ty] = [];
      for (let tx = 0; tx < WORLD_WIDTH_TILES; tx++) {
        this.biomes[ty][tx] = TileType.Grass;
      }
    }

    // 2. Stone mountain range across the top (y=0-5)
    this.fillRect(0, 0, WORLD_WIDTH_TILES, 5, TileType.Stone);

    // 3. Forest in NE corner (top-right)
    this.fillRect(48, 6, 16, 10, TileType.Forest);

    // 4. Forest in SW corner (bottom-left)
    this.fillRect(0, 48, 18, 16, TileType.Forest);

    // 5. Forest patch in SE (bottom-right)
    this.fillRect(46, 50, 18, 14, TileType.Forest);

    // 6. River — vertical stream flowing S→N through tx=10-12
    this.fillRect(10, 8, 3, 40, TileType.Water);

    // 7. Small lake in the east (centered around tx=44, ty=28)
    this.fillEllipse(44, 28, 5, 4, TileType.Water);

    // 8. Stone patch around mountain base (row 5-6, scattered)
    this.fillRect(20, 5, 6, 2, TileType.Stone);
    this.fillRect(38, 5, 8, 2, TileType.Stone);

    // NOTE: spawn/village area (tx=28-36, ty=24-32) stays as grass
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

  private renderTiles(): void {
    for (let ty = 0; ty < WORLD_HEIGHT_TILES; ty++) {
      for (let tx = 0; tx < WORLD_WIDTH_TILES; tx++) {
        const wx = tx * TILE_SIZE + TILE_SIZE / 2;
        const wy = ty * TILE_SIZE + TILE_SIZE / 2;
        const tileType = this.biomes[ty][tx];
        const wangIndex = this.pickTileIndex(tx, ty, tileType);
        const key = `${tileType}_wang_${wangIndex}`;

        const img = this.scene.add.image(wx, wy, key).setDepth(0);
        this.tileLayer.add(img);
      }
    }
  }

  /**
   * Pick the Wang tile index.
   *
   * The tileset spritesheet (see public/assets/tilesets/generate_tilesets.py)
   * arranges tiles as 4 rows × 4 cols = 16 tiles:
   *   - Indices 0–3  : BASE variants A/B/C/D (clean center terrain — what we want!)
   *   - Indices 4–7  : Transition edges to upper palette (half-and-half)
   *   - Indices 8–11 : Outer corners (3/4 lower + 1/4 upper)
   *   - Indices 12–15: Inner corners (3/4 upper + 1/4 lower — mostly dirt/sand)
   *
   * Previously this used index 15 thinking it was a "fully-surrounded center
   * tile" (the Wang-16 convention from other systems).  That was wrong for
   * THIS tileset — index 15 is an inner-corner tile showing the *upper*
   * palette (dirt for grass, sand for water, gravel for stone).  Rendering
   * index 15 everywhere made the map look like chaotic dirt/sand/moss
   * noise instead of a coherent terrain.  Fix: use indices 0–3 (base variants)
   * and rotate through them deterministically for subtle organic variation.
   */
  private pickTileIndex(tx: number, ty: number, _type: TileType): number {
    const h = ((tx * 73856093) ^ (ty * 19349663)) >>> 0;
    // Deterministically pick one of the 4 clean base variants (0, 1, 2, 3).
    // This gives the terrain organic variation without introducing any
    // transition/corner tiles that would bleed upper-palette colors in.
    return h % 4;
  }

  // ── Object Placement ─────────────────────────────────────────────────────────

  private placeObjects(): void {
    // ── Forest NE: dense pine cluster ──
    this.placePatchObjects('pine_tree', 48, 6, 16, 10, 18, true);
    // ── Forest SW: oak + pine mix ──
    this.placePatchObjects('oak_tree', 1, 48, 16, 14, 20, true);
    this.placePatchObjects('pine_tree', 1, 48, 16, 14, 10, true);
    // ── Forest SE ──
    this.placePatchObjects('pine_tree', 46, 50, 18, 14, 22, true);

    // ── Scattered oaks in open grassland (away from village) ──
    this.placePatchObjects('oak_tree', 38, 10, 10, 12, 8, true);
    this.placePatchObjects('oak_tree', 18, 35, 10, 10, 6, true);

    // ── Rocks near mountains & scattered ──
    this.placePatchObjects('rock_small', 20, 6, 20, 3, 15, true);
    this.placePatchObjects('rock_small', 38, 6, 20, 3, 15, true);

    // ── Wild carrots (gatherable, grass area near village) ──
    const carrotSpots: [number, number][] = [
      [22, 20], [25, 22], [38, 22], [40, 25],
      [24, 34], [38, 35], [20, 40], [42, 38],
    ];
    for (const [tx, ty] of carrotSpots) {
      this.placeObject('wild_carrot', tx, ty, false);
    }

    // ── Flower petals (decorative, scattered in grass) ──
    const flowerSpots: [number, number][] = [
      [20, 25], [26, 24], [36, 28], [40, 30],
      [22, 36], [30, 36], [38, 34], [18, 30],
    ];
    for (const [tx, ty] of flowerSpots) {
      this.placeObject('flower_petal', tx, ty, false);
    }

    // ── Bushes along forest edges ──
    this.placeObject('bush', 17, 50, false);
    this.placeObject('bush', 17, 54, false);
    this.placeObject('bush', 45, 52, false);
    this.placeObject('bush', 47, 18, false);

    // ── Village plaza (centered at tx=32, ty=28) ──
    this.placeObject('npc_shop_stall', 30, 26, true);
    this.placeObject('workbench', 34, 26, true);
    this.placeObject('well', 32, 30, true);
    this.placeObject('bonfire', 32, 27, true);
    this.placeObject('storage_box', 28, 30, true);

    // ── Fence along the north edge of village ──
    for (let tx = 26; tx <= 38; tx++) {
      if (tx === 32) continue; // leave a gap for the entrance
      this.placeObject('fence_horizontal', tx, 24, true);
    }

    // ── Soil beds ready for planting (organized rows) ──
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 4; col++) {
        this.placeObject('soil_bed', 38 + col * 2, 32 + row * 2, false);
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
    // Deterministic Halton-like distribution — no two objects on the same tile
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
      .setDepth(wy) // depth-sort by Y so objects overlap correctly
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
    return type !== TileType.Water;
  }
}
