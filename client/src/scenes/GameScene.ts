import Phaser from 'phaser';
import { Player } from '../game/Player';
import { Camera } from '../game/Camera';
import { HUD } from '../ui/HUD';
import { ChatPanel } from '../ui/ChatPanel';
import { GAME_EVENTS } from '../types/index';
import { PlotRenderer, type PlotGeometry } from '../features/plot/scenes/PlotRenderer';
import { EventBus, EVENTS } from '../game/EventBus';
import { REGISTRY } from '../game/registry';
import { processEvent } from '../features/plot/lib/processEvent';
import { emptyPlotState, type PlotState } from '../features/plot/lib/types';
import { TILE_SIZE } from '../config';
import { colyseusClient } from '../network/ColyseusClient';

/**
 * GameScene — doodle-style octagonal plot scene.
 *
 * Composition:
 *   - PlotRenderer: doodle map (octagon + checkerboard + cliff + decor)
 *   - Player: grid-based movement with walkability check
 *   - Camera: follows player, bounded to world
 *   - HUD: NomStead-style overlay
 *   - PlotState (registry): driven by processEvent reducer
 *
 * Controls:
 *   WASD / Arrow keys — move player (grid-based, tile-to-tile)
 *   Click cell      — place tile (when in placement mode) / cell info
 *   I               — toggle inventory
 *   F1              — debug overlay
 */
export class GameScene extends Phaser.Scene {
  private plotRenderer!: PlotRenderer;
  private plotState!: PlotState;
  private player!: Player;
  private gameCamera!: Camera;
  private hud!: HUD;
  private chat!: ChatPanel;

  /** Visual sprites for placed tiles, keyed by `${tx},${ty}` */
  private placedTileGfx = new Map<string, Phaser.GameObjects.Graphics>();

  /** Currently selected tile kind for placement (null = no placement mode) */
  private placementMode: { tileKind: string; assetId: string } | null = null;
  private placementPreview?: Phaser.GameObjects.Graphics;

  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: {
    W: Phaser.Input.Keyboard.Key;
    A: Phaser.Input.Keyboard.Key;
    S: Phaser.Input.Keyboard.Key;
    D: Phaser.Input.Keyboard.Key;
  };
  private inventoryKey!: Phaser.Input.Keyboard.Key;
  private escapeKey!: Phaser.Input.Keyboard.Key;

  // Debug
  private debugText!: Phaser.GameObjects.Text;
  private debugKey!: Phaser.Input.Keyboard.Key;
  private showDebug = false;

  // World dimensions
  private worldWidthPx!: number;
  private worldHeightPx!: number;

  constructor() {
    super({ key: 'GameScene' });
  }

  create(): void {
    // 1. Define plot geometry — 11×11 cells, octagonal cuts of 2 tiles
    const plotGeom: PlotGeometry = {
      tx0: 6,
      ty0: 4,
      cols: 11,
      rows: 11,
      cornerCut: 2,
    };

    // 2. Set world bounds (24×18 tiles, like the design doc)
    this.worldWidthPx = 24 * TILE_SIZE;
    this.worldHeightPx = 18 * TILE_SIZE;

    // 3. Initialise plot state and put it in the registry
    this.plotState = {
      ...emptyPlotState('local-player'),
      width: plotGeom.cols,
      height: plotGeom.rows,
    };
    this.game.registry.set(REGISTRY.PLOT_STATE, this.plotState);

    // 4. Render the doodle plot
    this.plotRenderer = new PlotRenderer(this, plotGeom);
    this.plotRenderer.render();

    // 5. Spawn player on a valid plot cell (center)
    const plotCenterTx = plotGeom.tx0 + Math.floor(plotGeom.cols / 2);
    const plotCenterTy = plotGeom.ty0 + Math.floor(plotGeom.rows / 2);
    this.player = new Player(this, plotCenterTx, plotCenterTy, 'farmer_male');

    // 6. Wire walkability — player can walk on plot cells + outside grass,
    //    but cannot walk on placed tiles (and stays in world bounds)
    this.player.setWalkableCheck((tx, ty) => this.isWalkable(tx, ty));

    // 7. Setup input
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.wasd = {
      W: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      A: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      S: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      D: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };
    this.inventoryKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.I);
    this.escapeKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    this.debugKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.F1);
    this.player.setupInput(this.cursors, this.wasd);

    // 8. Setup camera (follows player, bounded to world)
    this.gameCamera = new Camera(this);
    this.gameCamera.follow(this.player, this.worldWidthPx, this.worldHeightPx);
    this.gameCamera.fadeIn(600);

    // 9. Setup HUD
    this.hud = new HUD(this.game, {
      energy: 100,
      maxEnergy: 100,
      silver: 0,
      petal: 0,
    });

    // 9b. Setup Chat panel
    this.chat = new ChatPanel();
    this.chat.setSendHandler((text) => {
      // Local echo immediately for snappy UX (server will broadcast back)
      this.chat.pushMessage({
        id: 'local-' + Date.now(),
        senderId: 'local',
        senderName: 'You',
        text,
        timestamp: Date.now(),
        isLocal: true,
      });
      colyseusClient.sendChat(text);
    });
    // Server broadcasts → push into chat
    this.game.events.on('chat_message', (msg: {
      senderId: string;
      senderName: string;
      text: string;
      timestamp: number;
    }) => {
      // Skip our own echo (server returns it; we already showed locally)
      if (msg.senderId === colyseusClient.getSessionId()) return;
      this.chat.pushMessage({
        id: 'remote-' + msg.timestamp,
        senderId: msg.senderId,
        senderName: msg.senderName,
        text: msg.text,
        timestamp: msg.timestamp,
        isLocal: false,
      });
    });
    this.chat.pushSystem('Welcome to Petaland! Press T/B to plant, R to remove.');

    // 10. Wire game events → HUD
    this.game.events.on(
      GAME_EVENTS.PLAYER_ENERGY_CHANGE,
      ({ energy, maxEnergy }: { energy: number; maxEnergy: number }) => {
        this.hud.setEnergy(energy, maxEnergy);
      },
    );
    this.game.events.on(
      GAME_EVENTS.SILVER_CHANGE,
      ({ silver }: { silver: number }) => this.hud.setSilver(silver),
    );
    this.game.events.on(
      GAME_EVENTS.PETAL_CHANGE,
      ({ petal }: { petal: number }) => this.hud.setPetal(petal),
    );

    // 11. Wire EventBus: cell clicks → placement reducer
    EventBus.on(EVENTS.CELL_CLICKED, this.onCellClicked, this);
    EventBus.on(EVENTS.START_PLACEMENT_MODE, this.onStartPlacementMode, this);
    EventBus.on(EVENTS.CANCEL_PLACEMENT_MODE, this.onCancelPlacement, this);

    // 12. Debug overlay
    this.debugText = this.add
      .text(8, 8, '', {
        fontSize: '10px',
        color: '#00ff00',
        fontFamily: 'Courier New',
        backgroundColor: '#00000080',
        padding: { x: 4, y: 4 },
      })
      .setScrollFactor(0)
      .setDepth(1000)
      .setVisible(false);

    // 13. Add control hints (fade out)
    this.addControlHints();

    // 14. Emit scene ready
    this.game.events.emit(GAME_EVENTS.SCENE_READY, { scene: 'GameScene' });

    // 15. Demo: give the player some starter currency + a placement mode preview
    this.time.delayedCall(500, () => {
      this.player.setSilver(100);
      this.player.setPetal(0);
    });

    // 16. Demo: press T → enter placement mode for a tree (so the user can see placement work)
    this.input.keyboard!.on('keydown-T', () => {
      this.onStartPlacementMode({ tileKind: 'tree', assetId: 'demo-tree-' + Date.now() });
    });
    this.input.keyboard!.on('keydown-B', () => {
      this.onStartPlacementMode({ tileKind: 'bush', assetId: 'demo-bush-' + Date.now() });
    });
    this.input.keyboard!.on('keydown-R', () => {
      this.tryRemoveTileAtPlayer();
    });
  }

  update(_time: number, delta: number): void {
    this.player.update(delta);
    this.gameCamera.update();

    if (Phaser.Input.Keyboard.JustDown(this.debugKey)) {
      this.showDebug = !this.showDebug;
      this.debugText.setVisible(this.showDebug);
    }

    if (Phaser.Input.Keyboard.JustDown(this.inventoryKey)) {
      this.toggleInventory();
    }

    if (Phaser.Input.Keyboard.JustDown(this.escapeKey)) {
      this.onCancelPlacement();
    }

    if (this.placementPreview) {
      const pointer = this.input.activePointer;
      const wp = pointer.positionToCamera(this.cameras.main) as Phaser.Math.Vector2;
      const tx = Math.floor(wp.x / TILE_SIZE);
      const ty = Math.floor(wp.y / TILE_SIZE);
      const cx = tx * TILE_SIZE + TILE_SIZE / 2;
      const cy = ty * TILE_SIZE + TILE_SIZE / 2;
      this.placementPreview.x = cx;
      this.placementPreview.y = cy;
    }

    if (this.showDebug) {
      this.debugText.setText([
        `Tile:  (${this.player.getTileX()}, ${this.player.getTileY()})`,
        `World: (${Math.round(this.player.x)}, ${Math.round(this.player.y)})`,
        `Dir:   ${this.player.getDirection()}`,
        `Plot tiles: ${Object.keys(this.plotState.cells).length}`,
        `Mode: ${this.placementMode ? `place ${this.placementMode.tileKind}` : 'idle'}`,
        `FPS:   ${Math.round(this.game.loop.actualFps)}`,
      ]);
    }
  }

  // ─── Walkability ───────────────────────────────────────────────────────────

  private isWalkable(tx: number, ty: number): boolean {
    // World bounds
    if (tx < 0 || ty < 0 || tx * TILE_SIZE >= this.worldWidthPx || ty * TILE_SIZE >= this.worldHeightPx) {
      return false;
    }
    // Cannot walk onto a tile that has something placed on it
    if (this.plotState.cells[`${tx},${ty}`]?.tile) return false;
    return true;
  }

  // ─── Placement event handlers ──────────────────────────────────────────────

  private onCellClicked({ tx, ty }: { tx: number; ty: number }): void {
    if (!this.placementMode) {
      console.log(`[Plot] Cell clicked: (${tx}, ${ty}) — no placement mode`);
      return;
    }

    try {
      this.plotState = processEvent(
        this.plotState,
        {
          type: 'PLACE_TILE',
          cellX: tx,
          cellY: ty,
          assetId: this.placementMode.assetId,
          tileKind: this.placementMode.tileKind,
        },
        Date.now(),
      );
      this.game.registry.set(REGISTRY.PLOT_STATE, this.plotState);
      this.spawnPlacedTileVisual(tx, ty, this.placementMode.tileKind);
      EventBus.emit(EVENTS.PLACE_TILE_CONFIRMED, {
        tx,
        ty,
        tileKind: this.placementMode.tileKind,
      });
      this.onCancelPlacement();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.flashError(msg);
    }
  }

  private onStartPlacementMode(payload: { tileKind: string; assetId: string }): void {
    this.placementMode = payload;
    this.placementPreview?.destroy();
    this.placementPreview = this.add.graphics().setDepth(50).setAlpha(0.7);
    this.drawTileVisual(this.placementPreview, 0, 0, payload.tileKind);
    this.flashHint(`Placing ${payload.tileKind} — click a cell, ESC to cancel`);
  }

  private onCancelPlacement(): void {
    this.placementMode = null;
    this.placementPreview?.destroy();
    this.placementPreview = undefined;
  }

  private tryRemoveTileAtPlayer(): void {
    const tx = this.player.getTileX();
    const ty = this.player.getTileY();
    try {
      this.plotState = processEvent(
        this.plotState,
        { type: 'REMOVE_TILE', cellX: tx, cellY: ty },
        Date.now(),
      );
      this.game.registry.set(REGISTRY.PLOT_STATE, this.plotState);
      const key = `${tx},${ty}`;
      this.placedTileGfx.get(key)?.destroy();
      this.placedTileGfx.delete(key);
      EventBus.emit(EVENTS.REMOVE_TILE_CONFIRMED, { tx, ty });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.flashError(msg);
    }
  }

  // ─── Tile visuals (procedural — match doodle aesthetic) ────────────────────

  private spawnPlacedTileVisual(tx: number, ty: number, tileKind: string): void {
    const key = `${tx},${ty}`;
    const cx = tx * TILE_SIZE + TILE_SIZE / 2;
    const cy = ty * TILE_SIZE + TILE_SIZE / 2;
    const g = this.add.graphics();
    g.x = cx;
    g.y = cy;
    g.setDepth(cy);
    this.drawTileVisual(g, 0, 0, tileKind);
    this.placedTileGfx.set(key, g);
  }

  private drawTileVisual(
    g: Phaser.GameObjects.Graphics,
    cx: number,
    cy: number,
    tileKind: string,
  ): void {
    g.clear();
    if (tileKind === 'tree') this.drawTinyTree(g, cx, cy);
    else if (tileKind === 'bush') this.drawTinyBush(g, cx, cy);
    else this.drawTinyMarker(g, cx, cy);
  }

  private drawTinyTree(g: Phaser.GameObjects.Graphics, cx: number, cy: number): void {
    const s = TILE_SIZE * 0.5;
    g.fillStyle(0x000000, 0.2);
    g.fillEllipse(cx, cy + s * 0.4, s * 0.7, s * 0.2);
    g.fillStyle(0xa07050, 1);
    g.fillRect(cx - s * 0.08, cy + s * 0.1, s * 0.16, s * 0.2);
    g.lineStyle(1.5, 0x3a4030, 1);
    g.strokeRect(cx - s * 0.08, cy + s * 0.1, s * 0.16, s * 0.2);
    g.fillStyle(0xa8c080, 1);
    g.beginPath();
    g.moveTo(cx - s * 0.5, cy + s * 0.1);
    g.lineTo(cx, cy - s * 0.7);
    g.lineTo(cx + s * 0.5, cy + s * 0.1);
    g.closePath();
    g.fillPath();
    g.strokePath();
  }

  private drawTinyBush(g: Phaser.GameObjects.Graphics, cx: number, cy: number): void {
    const r = TILE_SIZE * 0.18;
    g.fillStyle(0x000000, 0.2);
    g.fillEllipse(cx, cy + r * 1.6, r * 1.8, r * 0.5);
    g.fillStyle(0xa0b870, 1);
    g.lineStyle(1.5, 0x3a4030, 1);
    g.fillCircle(cx - r * 0.5, cy, r);
    g.fillCircle(cx + r * 0.5, cy, r);
    g.fillCircle(cx, cy - r * 0.5, r);
    g.strokeCircle(cx - r * 0.5, cy, r);
    g.strokeCircle(cx + r * 0.5, cy, r);
    g.strokeCircle(cx, cy - r * 0.5, r);
    g.fillStyle(0xb8c888, 1);
    g.fillCircle(cx, cy - r * 0.6, r * 0.2);
  }

  private drawTinyMarker(g: Phaser.GameObjects.Graphics, cx: number, cy: number): void {
    g.fillStyle(0xfff5b0, 1);
    g.lineStyle(1.5, 0x3a4030, 1);
    g.fillCircle(cx, cy, TILE_SIZE * 0.3);
    g.strokeCircle(cx, cy, TILE_SIZE * 0.3);
  }

  // ─── UI feedback ───────────────────────────────────────────────────────────

  private flashHint(message: string): void {
    const hint = this.add
      .text(this.scale.width / 2, this.scale.height - 80, message, {
        fontSize: '14px',
        color: '#ffffff',
        fontFamily: 'Nunito, sans-serif',
        fontStyle: 'bold',
        backgroundColor: '#3a4030cc',
        padding: { x: 14, y: 8 },
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(99);

    this.tweens.add({
      targets: hint,
      alpha: 0,
      delay: 2200,
      duration: 600,
      onComplete: () => hint.destroy(),
    });
  }

  private flashError(message: string): void {
    const err = this.add
      .text(this.scale.width / 2, this.scale.height - 80, `⚠ ${message}`, {
        fontSize: '13px',
        color: '#ffffff',
        fontFamily: 'Nunito, sans-serif',
        fontStyle: 'bold',
        backgroundColor: '#cc4040cc',
        padding: { x: 12, y: 7 },
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(99);

    this.tweens.add({
      targets: err,
      alpha: 0,
      delay: 1800,
      duration: 600,
      onComplete: () => err.destroy(),
    });
  }

  // ─── Control hints / inventory ─────────────────────────────────────────────

  private addControlHints(): void {
    const hints = this.add
      .text(
        this.scale.width - 8,
        this.scale.height - 8,
        'WASD: Move | T: Plant tree | B: Plant bush | R: Remove | I: Inv | F1: Debug',
        {
          fontSize: '10px',
          color: '#ffffff',
          fontFamily: 'Nunito, sans-serif',
          fontStyle: 'bold',
          backgroundColor: '#3a403080',
          padding: { x: 6, y: 4 },
        },
      )
      .setOrigin(1, 1)
      .setScrollFactor(0)
      .setDepth(99);

    this.tweens.add({
      targets: hints,
      alpha: 0.3,
      delay: 6000,
      duration: 1500,
    });
  }

  private toggleInventory(): void {
    const panel = document.getElementById('inventory-panel');
    if (!panel) return;
    const visible = panel.style.display !== 'none' && panel.style.display !== '';
    panel.style.display = visible ? 'none' : 'block';
  }

  // ─── Lifecycle ─────────────────────────────────────────────────────────────

  shutdown(): void {
    this.hud.destroy();
    this.chat?.destroy();
    EventBus.off(EVENTS.CELL_CLICKED, this.onCellClicked, this);
    EventBus.off(EVENTS.START_PLACEMENT_MODE, this.onStartPlacementMode, this);
    EventBus.off(EVENTS.CANCEL_PLACEMENT_MODE, this.onCancelPlacement, this);
    this.game.events.off(GAME_EVENTS.PLAYER_ENERGY_CHANGE);
    this.game.events.off(GAME_EVENTS.SILVER_CHANGE);
    this.game.events.off(GAME_EVENTS.PETAL_CHANGE);
    this.game.events.off('chat_message');
  }
}
