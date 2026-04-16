import Phaser from 'phaser';
import { Player } from '../game/Player';
import { WorldMap } from '../game/WorldMap';
import { Camera } from '../game/Camera';
import { HUD } from '../ui/HUD';
import { GAME_EVENTS } from '../types/index';

/**
 * GameScene — main scene: world map, player, camera, HUD.
 *
 * Movement is grid-based (tile-to-tile with tweening, no physics).
 * Walkability is checked via WorldMap.isWalkable() before each move.
 *
 * Controls:
 *   WASD / Arrow keys — move player (grid-based)
 *   Scroll wheel / +/- — zoom camera
 *   I — toggle inventory
 */
export class GameScene extends Phaser.Scene {
  private worldMap!: WorldMap;
  private player!: Player;
  private gameCamera!: Camera;
  private hud!: HUD;

  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: {
    W: Phaser.Input.Keyboard.Key;
    A: Phaser.Input.Keyboard.Key;
    S: Phaser.Input.Keyboard.Key;
    D: Phaser.Input.Keyboard.Key;
  };
  private inventoryKey!: Phaser.Input.Keyboard.Key;

  // Debug text (toggled with F1)
  private debugText!: Phaser.GameObjects.Text;
  private debugKey!: Phaser.Input.Keyboard.Key;
  private showDebug = false;

  constructor() {
    super({ key: 'GameScene' });
  }

  create(): void {
    // 1. Generate world
    this.worldMap = new WorldMap(this, 12345);
    this.worldMap.generate();

    // 2. Spawn player at farm center (grid-based — tile coordinates)
    const farmCenter = this.worldMap.getFarmCenter();
    this.player = new Player(this, farmCenter.tx, farmCenter.ty, 'farmer_male');

    // 3. Wire walkability check (grid movement uses this instead of physics)
    this.player.setWalkableCheck((tx, ty) => this.worldMap.isWalkable(tx, ty));

    // 4. Setup input
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.wasd = {
      W: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      A: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      S: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      D: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };
    this.inventoryKey = this.input.keyboard!.addKey(
      Phaser.Input.Keyboard.KeyCodes.I,
    );
    this.debugKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.F1);
    this.player.setupInput(this.cursors, this.wasd);

    // 5. Setup camera (follows player sprite, bounded to world)
    this.gameCamera = new Camera(this);
    this.gameCamera.follow(
      this.player,
      this.worldMap.getWorldWidth(),
      this.worldMap.getWorldHeight(),
    );
    this.gameCamera.fadeIn(600);

    // 6. Setup HUD (DOM overlay)
    this.hud = new HUD(this.game, {
      energy: 100,
      maxEnergy: 100,
      silver: 0,
      petal: 0,
    });

    // Wire game events → HUD
    this.game.events.on(
      GAME_EVENTS.PLAYER_ENERGY_CHANGE,
      ({ energy, maxEnergy }: { energy: number; maxEnergy: number }) => {
        this.hud.setEnergy(energy, maxEnergy);
      },
    );
    this.game.events.on(
      GAME_EVENTS.SILVER_CHANGE,
      ({ silver }: { silver: number }) => {
        this.hud.setSilver(silver);
      },
    );
    this.game.events.on(
      GAME_EVENTS.PETAL_CHANGE,
      ({ petal }: { petal: number }) => {
        this.hud.setPetal(petal);
      },
    );

    // 7. Debug overlay
    this.debugText = this.add
      .text(8, 8, '', {
        fontSize: '10px',
        color: '#00ff00',
        fontFamily: 'Courier New',
        backgroundColor: '#00000080',
        padding: { x: 4, y: 4 },
      })
      .setScrollFactor(0)
      .setDepth(100)
      .setVisible(false);

    // 8. Add control hints (fixed to camera)
    this.addControlHints();

    // 9. Emit scene ready
    this.game.events.emit(GAME_EVENTS.SCENE_READY, { scene: 'GameScene' });

    // Give the player some starting currency for demo
    this.time.delayedCall(500, () => {
      this.player.setSilver(100);
      this.player.setPetal(0);
    });
  }

  update(_time: number, delta: number): void {
    // Update player movement + animation
    this.player.update(delta);

    // Update camera zoom keys
    this.gameCamera.update();

    // Toggle debug
    if (Phaser.Input.Keyboard.JustDown(this.debugKey)) {
      this.showDebug = !this.showDebug;
      this.debugText.setVisible(this.showDebug);
    }

    // Toggle inventory
    if (Phaser.Input.Keyboard.JustDown(this.inventoryKey)) {
      this.toggleInventory();
    }

    // Update debug text
    if (this.showDebug) {
      this.debugText.setText([
        `Tile:  (${this.player.getTileX()}, ${this.player.getTileY()})`,
        `World: (${Math.round(this.player.x)}, ${Math.round(this.player.y)})`,
        `Dir:   ${this.player.getDirection()}`,
        `Moving:${this.player.getIsMoving()}`,
        `Zoom:  ${this.gameCamera.getZoom()}x`,
        `FPS:   ${Math.round(this.game.loop.actualFps)}`,
      ]);
    }
  }

  // ── Control Hints ─────────────────────────────────────────────────────────────

  private addControlHints(): void {
    const hints = this.add
      .text(
        this.scale.width - 8,
        this.scale.height - 8,
        'WASD/Arrows: Move  |  Scroll/+/-: Zoom  |  I: Inventory  |  F1: Debug',
        {
          fontSize: '9px',
          color: '#ffffff80',
          fontFamily: 'Courier New',
          backgroundColor: '#00000060',
          padding: { x: 4, y: 3 },
        },
      )
      .setOrigin(1, 1)
      .setScrollFactor(0)
      .setDepth(99);

    // Fade out after 5 seconds
    this.tweens.add({
      targets: hints,
      alpha: 0,
      delay: 5000,
      duration: 1500,
    });
  }

  // ── Inventory Toggle ──────────────────────────────────────────────────────────

  private toggleInventory(): void {
    const panel = document.getElementById('inventory-panel');
    if (!panel) return;
    const isVisible = panel.style.display !== 'none' && panel.style.display !== '';
    panel.style.display = isVisible ? 'none' : 'block';
  }

  // ── Scene Cleanup ─────────────────────────────────────────────────────────────

  shutdown(): void {
    this.hud.destroy();
    this.game.events.off(GAME_EVENTS.PLAYER_ENERGY_CHANGE);
    this.game.events.off(GAME_EVENTS.SILVER_CHANGE);
    this.game.events.off(GAME_EVENTS.PETAL_CHANGE);
  }
}
