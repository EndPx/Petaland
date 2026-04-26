/**
 * PlotRenderer — draws the doodle-style octagonal plot procedurally.
 *
 * Reference: NomStead-style hand-drawn map.
 * Visual elements (all drawn with Phaser.Graphics — no asset files needed):
 *   - Olive-green grass background with scattered tufts, pebbles, dashes
 *   - Octagonal plot with sketchy outline + drop shadow
 *   - Checkerboard inside: solid yellow ⇄ diagonal-hatched yellow
 *   - Stone cliff border at the bottom edge
 *   - Pine trees and bushes scattered around the plot
 *
 * Each checkerboard cell is a clickable hit zone wired to the processEvent
 * reducer so players can place tiles from their inventory.
 */

import Phaser from 'phaser';
import { EventBus, EVENTS } from '../../../game/EventBus';
import { TILE_SIZE } from '../../../config';

// ─── Doodle palette ──────────────────────────────────────────────────────────

const COLORS = {
  // Grass base — soft olive-green from reference
  grassBase: 0xa8b87d,
  grassDark: 0x96a86b,
  grassDot: 0x8a9a68,

  // Plot interior
  plotBase: 0xc8d090,           // soft olive-yellow
  cellLight: 0xdce299,          // light cream-yellow checker
  cellDark: 0xc8d090,           // diagonal-hatch base
  cellHover: 0xece5a8,          // hover glow

  // Outline (sketchy black)
  outline: 0x3a4030,
  outlineSoft: 0x4a5040,

  // Cliff / stone (red-brown from reference)
  cliffStone: 0xa07050,
  cliffStoneDark: 0x805038,
  cliffShadow: 0x604028,

  // Shadow
  shadow: 0x000000,

  // Tree
  treeFoliage: 0xa8c080,
  treeFoliageDark: 0x88a060,
  treeTrunk: 0xa07050,
  treeTrunkDark: 0x704030,

  // Bush
  bushBase: 0xa0b870,
  bushHighlight: 0xb8c888,
};

// ─── Octagonal plot geometry ─────────────────────────────────────────────────

export interface PlotGeometry {
  /** Top-left tile of the plot */
  tx0: number;
  ty0: number;
  /** Width / height in tiles */
  cols: number;
  rows: number;
  /** Bevel size in tiles (octagon corner cut) */
  cornerCut: number;
}

export class PlotRenderer {
  private scene: Phaser.Scene;
  private geometry: PlotGeometry;
  private cellHitZones = new Map<string, Phaser.GameObjects.Zone>();
  private hoverHighlight?: Phaser.GameObjects.Graphics;

  /** Cells that lie INSIDE the octagonal plot (after corner-cuts) */
  private validCells = new Set<string>();

  constructor(scene: Phaser.Scene, geometry: PlotGeometry) {
    this.scene = scene;
    this.geometry = geometry;
    this.computeValidCells();
  }

  // ─── Build everything ──────────────────────────────────────────────────────

  render(): void {
    this.drawGrassBase();
    this.drawScatterDecorations();
    this.drawTreesAndBushes();
    this.drawPlotShadow();
    this.drawPlotInterior();
    this.drawCheckerboard();
    this.drawPlotOutline();
    this.drawCliffBottom();
    this.installCellHitZones();
  }

  // ─── Public API ────────────────────────────────────────────────────────────

  /** All `(tx,ty)` tile coords inside the octagonal plot */
  getValidCells(): { tx: number; ty: number }[] {
    return Array.from(this.validCells).map((k) => {
      const [tx, ty] = k.split(',').map(Number) as [number, number];
      return { tx, ty };
    });
  }

  isPlotCell(tx: number, ty: number): boolean {
    return this.validCells.has(`${tx},${ty}`);
  }

  // ─── Geometry / cell membership ────────────────────────────────────────────

  /**
   * An octagon = rectangle with each corner truncated by `cornerCut` tiles.
   * Cell (tx,ty) is inside iff it's in the rectangle AND not in a corner triangle.
   */
  private computeValidCells(): void {
    const { tx0, ty0, cols, rows, cornerCut } = this.geometry;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const fromLeft = c;
        const fromRight = cols - 1 - c;
        const fromTop = r;
        const fromBottom = rows - 1 - r;

        // Cut a triangle at each corner: if both distances < cornerCut,
        // the cell falls inside the cut.
        const cutTopLeft = fromLeft < cornerCut && fromTop < cornerCut &&
          (cornerCut - fromLeft) + (cornerCut - fromTop) > cornerCut;
        const cutTopRight = fromRight < cornerCut && fromTop < cornerCut &&
          (cornerCut - fromRight) + (cornerCut - fromTop) > cornerCut;
        const cutBottomLeft = fromLeft < cornerCut && fromBottom < cornerCut &&
          (cornerCut - fromLeft) + (cornerCut - fromBottom) > cornerCut;
        const cutBottomRight = fromRight < cornerCut && fromBottom < cornerCut &&
          (cornerCut - fromRight) + (cornerCut - fromBottom) > cornerCut;

        if (!cutTopLeft && !cutTopRight && !cutBottomLeft && !cutBottomRight) {
          this.validCells.add(`${tx0 + c},${ty0 + r}`);
        }
      }
    }
  }

  // ─── Drawing helpers ───────────────────────────────────────────────────────

  /** Hand-drawn jitter in pixels */
  private wobble(amount = 1.2): number {
    return (Math.random() - 0.5) * 2 * amount;
  }

  /** Sketchy line: small back-and-forth jitter to fake hand-drawn outline */
  private sketchyLine(
    g: Phaser.GameObjects.Graphics,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    segments = 8,
  ): void {
    g.beginPath();
    g.moveTo(x1, y1);
    for (let i = 1; i <= segments; i++) {
      const t = i / segments;
      const px = x1 + (x2 - x1) * t + this.wobble();
      const py = y1 + (y2 - y1) * t + this.wobble();
      g.lineTo(px, py);
    }
    g.strokePath();
  }

  // ─── Layer 0: Grass base ───────────────────────────────────────────────────

  private drawGrassBase(): void {
    const g = this.scene.add.graphics();
    g.setDepth(0);
    g.fillStyle(COLORS.grassBase, 1);
    g.fillRect(0, 0, this.scene.scale.width * 2, this.scene.scale.height * 2);
  }

  // ─── Layer 1: Scattered grass tufts, pebbles, dashes ───────────────────────

  private drawScatterDecorations(): void {
    const g = this.scene.add.graphics();
    g.setDepth(1);
    const w = this.scene.scale.width;
    const h = this.scene.scale.height;

    // Use a deterministic seed to keep scatter consistent between runs
    let seed = 42;
    const rand = (): number => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };

    // Plot bounds (skip decorations inside the plot)
    const plot = this.plotPixelBounds();

    // ── Grass tufts (small "m" shapes) ──
    for (let i = 0; i < 80; i++) {
      const x = rand() * w * 1.5 - w * 0.25;
      const y = rand() * h * 1.5 - h * 0.25;
      if (this.insidePlotRect(x, y, plot)) continue;
      this.drawGrassTuft(g, x, y, 4 + rand() * 3);
    }

    // ── Pebbles (small dark ellipses) ──
    g.fillStyle(COLORS.grassDot, 1);
    for (let i = 0; i < 35; i++) {
      const x = rand() * w * 1.5 - w * 0.25;
      const y = rand() * h * 1.5 - h * 0.25;
      if (this.insidePlotRect(x, y, plot)) continue;
      g.fillEllipse(x, y, 6 + rand() * 4, 3 + rand() * 2);
    }

    // ── Tiny stroke dashes (the "comma" marks) ──
    g.lineStyle(1.5, COLORS.outlineSoft, 0.7);
    for (let i = 0; i < 60; i++) {
      const x = rand() * w * 1.5 - w * 0.25;
      const y = rand() * h * 1.5 - h * 0.25;
      if (this.insidePlotRect(x, y, plot)) continue;
      const dx = (rand() - 0.5) * 6;
      g.lineBetween(x, y, x + dx, y - 2);
    }
  }

  private drawGrassTuft(
    g: Phaser.GameObjects.Graphics,
    x: number,
    y: number,
    size: number,
  ): void {
    g.lineStyle(1.5, COLORS.outline, 1);
    g.beginPath();
    g.moveTo(x - size, y);
    g.arc(x - size / 2, y - size / 3, size / 2, Math.PI, 0, false);
    g.arc(x + size / 2, y - size / 3, size / 2, Math.PI, 0, false);
    g.strokePath();
  }

  // ─── Layer 2: Trees & bushes around the plot ───────────────────────────────

  private drawTreesAndBushes(): void {
    const treesAndBushes: { type: 'pine' | 'bush'; x: number; y: number; scale: number }[] = [];

    let seed = 1337;
    const rand = (): number => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };

    const plot = this.plotPixelBounds();
    const w = this.scene.scale.width;
    const h = this.scene.scale.height;

    // Pine trees — clusters around the corners
    for (let i = 0; i < 28; i++) {
      const x = rand() * w * 1.5 - w * 0.25;
      const y = rand() * h * 1.5 - h * 0.25;
      if (this.distanceFromPlot(x, y, plot) < TILE_SIZE * 1.5) continue;
      treesAndBushes.push({ type: 'pine', x, y, scale: 0.9 + rand() * 0.5 });
    }

    // Bushes — small green clumps
    for (let i = 0; i < 14; i++) {
      const x = rand() * w * 1.5 - w * 0.25;
      const y = rand() * h * 1.5 - h * 0.25;
      if (this.distanceFromPlot(x, y, plot) < TILE_SIZE) continue;
      treesAndBushes.push({ type: 'bush', x, y, scale: 0.8 + rand() * 0.4 });
    }

    // Sort by Y so things draw back-to-front (depth order)
    treesAndBushes.sort((a, b) => a.y - b.y);

    for (const t of treesAndBushes) {
      if (t.type === 'pine') this.drawPineTree(t.x, t.y, t.scale);
      else this.drawBush(t.x, t.y, t.scale);
    }
  }

  private drawPineTree(x: number, y: number, scale: number): void {
    const g = this.scene.add.graphics();
    g.setDepth(y);
    const w = 28 * scale;
    const h = 56 * scale;

    // Trunk shadow
    g.fillStyle(COLORS.shadow, 0.18);
    g.fillEllipse(x, y + 3, w * 0.7, w * 0.25);

    // Trunk
    g.fillStyle(COLORS.treeTrunk, 1);
    g.fillRect(x - w * 0.13, y - h * 0.18, w * 0.26, h * 0.18);
    g.lineStyle(1.5, COLORS.outline, 1);
    g.strokeRect(x - w * 0.13, y - h * 0.18, w * 0.26, h * 0.18);

    // Foliage — three triangular layers (sketchy)
    g.fillStyle(COLORS.treeFoliage, 1);
    g.lineStyle(1.5, COLORS.outline, 1);
    for (let i = 0; i < 3; i++) {
      const layerY = y - h * (0.18 + 0.22 * (i + 1));
      const layerW = w * (0.95 - i * 0.15);
      const layerH = h * 0.32;
      g.beginPath();
      g.moveTo(x - layerW / 2 + this.wobble(), layerY + layerH / 2 + this.wobble());
      g.lineTo(x + this.wobble(), layerY - layerH / 2 + this.wobble());
      g.lineTo(x + layerW / 2 + this.wobble(), layerY + layerH / 2 + this.wobble());
      g.closePath();
      g.fillPath();
      g.strokePath();
    }
  }

  private drawBush(x: number, y: number, scale: number): void {
    const g = this.scene.add.graphics();
    g.setDepth(y);
    const r = 14 * scale;

    // Shadow
    g.fillStyle(COLORS.shadow, 0.2);
    g.fillEllipse(x, y + 2, r * 1.6, r * 0.5);

    // Bush body — a few overlapping circles (sketchy)
    g.fillStyle(COLORS.bushBase, 1);
    g.lineStyle(1.5, COLORS.outline, 1);
    g.fillCircle(x - r * 0.4, y - r * 0.2, r * 0.7);
    g.fillCircle(x + r * 0.4, y - r * 0.2, r * 0.7);
    g.fillCircle(x, y - r * 0.6, r * 0.7);
    g.strokeCircle(x - r * 0.4, y - r * 0.2, r * 0.7);
    g.strokeCircle(x + r * 0.4, y - r * 0.2, r * 0.7);
    g.strokeCircle(x, y - r * 0.6, r * 0.7);

    // Highlight bumps
    g.fillStyle(COLORS.bushHighlight, 1);
    g.fillCircle(x - r * 0.2, y - r * 0.5, r * 0.18);
    g.fillCircle(x + r * 0.3, y - r * 0.4, r * 0.15);
  }

  // ─── Layer 3: Plot drop shadow ─────────────────────────────────────────────

  private drawPlotShadow(): void {
    const g = this.scene.add.graphics();
    g.setDepth(2);
    const path = this.octagonPath();
    g.fillStyle(COLORS.shadow, 0.2);
    g.beginPath();
    g.moveTo(path[0].x + 4, path[0].y + 8);
    for (let i = 1; i < path.length; i++) {
      g.lineTo(path[i].x + 4, path[i].y + 8);
    }
    g.closePath();
    g.fillPath();
  }

  // ─── Layer 4: Plot interior fill ───────────────────────────────────────────

  private drawPlotInterior(): void {
    const g = this.scene.add.graphics();
    g.setDepth(3);
    g.fillStyle(COLORS.plotBase, 1);
    const path = this.octagonPath();
    g.beginPath();
    g.moveTo(path[0].x, path[0].y);
    for (let i = 1; i < path.length; i++) g.lineTo(path[i].x, path[i].y);
    g.closePath();
    g.fillPath();
  }

  // ─── Layer 5: Checkerboard ─────────────────────────────────────────────────

  private drawCheckerboard(): void {
    const g = this.scene.add.graphics();
    g.setDepth(4);
    const { tx0, ty0 } = this.geometry;

    for (const key of this.validCells) {
      const [tx, ty] = key.split(',').map(Number) as [number, number];
      const px = tx * TILE_SIZE;
      const py = ty * TILE_SIZE;
      const localX = tx - tx0;
      const localY = ty - ty0;
      const isLight = (localX + localY) % 2 === 0;

      if (isLight) {
        // Solid soft yellow square with rounded look
        g.fillStyle(COLORS.cellLight, 0.9);
        g.fillRoundedRect(px + 2, py + 2, TILE_SIZE - 4, TILE_SIZE - 4, 4);
      } else {
        // Diagonal stripes
        this.drawDiagonalHatch(g, px + 2, py + 2, TILE_SIZE - 4, TILE_SIZE - 4);
      }
    }
  }

  private drawDiagonalHatch(
    g: Phaser.GameObjects.Graphics,
    x: number,
    y: number,
    w: number,
    h: number,
  ): void {
    g.fillStyle(COLORS.cellDark, 0.4);
    g.fillRoundedRect(x, y, w, h, 4);
    g.lineStyle(1.5, COLORS.cellLight, 0.6);
    const step = 6;
    for (let i = -h; i < w; i += step) {
      const x1 = Math.max(x, x + i);
      const y1 = Math.max(y, y + i + h - w);
      const x2 = Math.min(x + w, x + i + h);
      const y2 = Math.min(y + h, y + i + h - w + (x2 - x1));
      g.lineBetween(x1, y1, x2, y2);
    }
  }

  // ─── Layer 6: Plot outline (sketchy) ───────────────────────────────────────

  private drawPlotOutline(): void {
    const g = this.scene.add.graphics();
    g.setDepth(6);
    g.lineStyle(2.5, COLORS.outline, 1);
    const path = this.octagonPath();
    for (let i = 0; i < path.length; i++) {
      const a = path[i];
      const b = path[(i + 1) % path.length];
      this.sketchyLine(g, a.x, a.y, b.x, b.y, 12);
    }
  }

  // ─── Layer 7: Stone cliff at the bottom edge ───────────────────────────────

  private drawCliffBottom(): void {
    const g = this.scene.add.graphics();
    g.setDepth(7);
    const path = this.octagonPath();

    // Bottom 3 segments (south-west diag, south, south-east diag)
    const bottomIdx = [4, 5, 6]; // octagon vertex indices for bottom rim
    for (let i = 0; i < bottomIdx.length; i++) {
      const idxA = bottomIdx[i];
      const idxB = (idxA + 1) % path.length;
      const a = path[idxA];
      const b = path[idxB];
      this.drawCliffSegment(g, a.x, a.y, b.x, b.y);
    }
  }

  private drawCliffSegment(
    g: Phaser.GameObjects.Graphics,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
  ): void {
    const len = Math.hypot(x2 - x1, y2 - y1);
    const stoneCount = Math.max(3, Math.floor(len / 18));
    const dx = (x2 - x1) / stoneCount;
    const dy = (y2 - y1) / stoneCount;

    g.lineStyle(2, COLORS.cliffShadow, 1);
    for (let i = 0; i < stoneCount; i++) {
      const cx = x1 + dx * (i + 0.5);
      const cy = y1 + dy * (i + 0.5);
      const w = 12 + Math.random() * 6;
      const h = 8 + Math.random() * 4;

      // Stone body
      g.fillStyle(COLORS.cliffStone, 1);
      g.fillEllipse(cx, cy + 4, w, h);

      // Darker shadow under
      g.fillStyle(COLORS.cliffShadow, 0.5);
      g.fillEllipse(cx, cy + h * 0.5 + 4, w * 0.9, h * 0.4);

      // Outline
      g.strokeEllipse(cx, cy + 4, w, h);
    }
  }

  // ─── Layer 8: Cell hit zones (interactive) ─────────────────────────────────

  private installCellHitZones(): void {
    for (const key of this.validCells) {
      const [tx, ty] = key.split(',').map(Number) as [number, number];
      const zone = this.scene.add
        .zone(tx * TILE_SIZE + TILE_SIZE / 2, ty * TILE_SIZE + TILE_SIZE / 2, TILE_SIZE, TILE_SIZE)
        .setInteractive({ useHandCursor: true });

      zone.on('pointerover', () => this.showHoverHighlight(tx, ty));
      zone.on('pointerout', () => this.clearHoverHighlight());
      zone.on('pointerdown', () => {
        EventBus.emit(EVENTS.CELL_CLICKED, { tx, ty });
      });

      this.cellHitZones.set(key, zone);
    }
  }

  private showHoverHighlight(tx: number, ty: number): void {
    if (!this.hoverHighlight) {
      this.hoverHighlight = this.scene.add.graphics();
      this.hoverHighlight.setDepth(5);
    }
    this.hoverHighlight.clear();
    const px = tx * TILE_SIZE;
    const py = ty * TILE_SIZE;
    this.hoverHighlight.fillStyle(COLORS.cellHover, 0.5);
    this.hoverHighlight.fillRoundedRect(px + 2, py + 2, TILE_SIZE - 4, TILE_SIZE - 4, 4);
    this.hoverHighlight.lineStyle(2, COLORS.outline, 0.9);
    this.hoverHighlight.strokeRoundedRect(px + 2, py + 2, TILE_SIZE - 4, TILE_SIZE - 4, 4);
  }

  private clearHoverHighlight(): void {
    this.hoverHighlight?.clear();
  }

  // ─── Geometry helpers ──────────────────────────────────────────────────────

  /** 8 vertices of the octagon, in pixels, clockwise from top-left */
  private octagonPath(): { x: number; y: number }[] {
    const { tx0, ty0, cols, rows, cornerCut } = this.geometry;
    const x0 = tx0 * TILE_SIZE;
    const y0 = ty0 * TILE_SIZE;
    const x1 = (tx0 + cols) * TILE_SIZE;
    const y1 = (ty0 + rows) * TILE_SIZE;
    const c = cornerCut * TILE_SIZE;
    return [
      { x: x0 + c, y: y0 },        // 0  top-left bevel start
      { x: x1 - c, y: y0 },        // 1  top-right bevel start
      { x: x1, y: y0 + c },        // 2  right-top bevel
      { x: x1, y: y1 - c },        // 3  right-bottom bevel
      { x: x1 - c, y: y1 },        // 4  bottom-right bevel
      { x: x0 + c, y: y1 },        // 5  bottom-left bevel
      { x: x0, y: y1 - c },        // 6  left-bottom bevel
      { x: x0, y: y0 + c },        // 7  left-top bevel
    ];
  }

  private plotPixelBounds(): { x0: number; y0: number; x1: number; y1: number } {
    const { tx0, ty0, cols, rows } = this.geometry;
    return {
      x0: tx0 * TILE_SIZE,
      y0: ty0 * TILE_SIZE,
      x1: (tx0 + cols) * TILE_SIZE,
      y1: (ty0 + rows) * TILE_SIZE,
    };
  }

  private insidePlotRect(
    x: number,
    y: number,
    p: { x0: number; y0: number; x1: number; y1: number },
  ): boolean {
    const pad = 8;
    return x > p.x0 - pad && x < p.x1 + pad && y > p.y0 - pad && y < p.y1 + pad;
  }

  private distanceFromPlot(
    x: number,
    y: number,
    p: { x0: number; y0: number; x1: number; y1: number },
  ): number {
    const dx = Math.max(p.x0 - x, 0, x - p.x1);
    const dy = Math.max(p.y0 - y, 0, y - p.y1);
    return Math.hypot(dx, dy);
  }
}
