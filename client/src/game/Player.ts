import Phaser from 'phaser';
import {
  Direction,
  PlayerState,
  GAME_EVENTS,
} from '../types/index';
import { PLAYER_SPEED, WALK_FRAME_RATE, TILE_SIZE } from '../config';

type CursorKeys = Phaser.Types.Input.Keyboard.CursorKeys;

interface WASDKeys {
  W: Phaser.Input.Keyboard.Key;
  A: Phaser.Input.Keyboard.Key;
  S: Phaser.Input.Keyboard.Key;
  D: Phaser.Input.Keyboard.Key;
}

/**
 * Player — Phaser arcade physics sprite with 4-direction movement and
 * walk animation using individual frame images (no spritesheet needed).
 *
 * NOTE: We avoid naming our property 'state' because Phaser.GameObjects.Sprite
 * already declares `state: string | number`.  We use `playerData` instead.
 */
export class Player extends Phaser.Physics.Arcade.Sprite {
  private direction: Direction = 'south';
  private isMoving = false;
  private walkFrame = 0;
  private walkFrameTimer = 0;
  private readonly frameDuration: number; // ms per walk frame
  private character: 'farmer_male' | 'farmer_female';

  // Input references (set from GameScene)
  private cursors: CursorKeys | null = null;
  private wasd: WASDKeys | null = null;

  // Player data exposed to network layer (renamed from 'state' to avoid Phaser conflict)
  public playerData: PlayerState;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    character: 'farmer_male' | 'farmer_female' = 'farmer_male',
  ) {
    super(scene, x, y, `${character}_south`);

    this.character = character;
    this.frameDuration = 1000 / WALK_FRAME_RATE;

    this.playerData = {
      id: 'local',
      walletAddress: '',
      x,
      y,
      direction: 'south',
      isMoving: false,
      energy: 100,
      maxEnergy: 100,
      silver: 0,
      petal: 0,
      level: 1,
      xp: 0,
      character,
    };

    // Add to scene + physics
    scene.add.existing(this as unknown as Phaser.GameObjects.GameObject);
    scene.physics.add.existing(this as unknown as Phaser.GameObjects.GameObject);

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setCollideWorldBounds(true);
    // Narrow hitbox — align to bottom of sprite for top-down feel
    body.setSize(TILE_SIZE * 0.7, TILE_SIZE * 0.5);
    body.setOffset(TILE_SIZE * 0.15, TILE_SIZE * 0.5);

    this.setDepth(5);
    this.setOrigin(0.5, 0.75);
  }

  // ── Input Setup ─────────────────────────────────────────────────────────────

  setupInput(
    cursors: CursorKeys,
    wasd: WASDKeys,
  ): void {
    this.cursors = cursors;
    this.wasd = wasd;
  }

  // ── Update (called every frame from GameScene) ───────────────────────────────

  update(delta: number): void {
    this.handleMovement();
    this.updateAnimation(delta);
    this.syncPlayerData();
  }

  // ── Movement ─────────────────────────────────────────────────────────────────

  private handleMovement(): void {
    if (!this.cursors && !this.wasd) return;

    const body = this.body as Phaser.Physics.Arcade.Body;
    let vx = 0;
    let vy = 0;

    const left =
      this.cursors?.left.isDown || this.wasd?.A.isDown;
    const right =
      this.cursors?.right.isDown || this.wasd?.D.isDown;
    const up =
      this.cursors?.up.isDown || this.wasd?.W.isDown;
    const down =
      this.cursors?.down.isDown || this.wasd?.S.isDown;

    if (left) {
      vx = -PLAYER_SPEED;
      this.direction = 'west';
    } else if (right) {
      vx = PLAYER_SPEED;
      this.direction = 'east';
    }

    if (up) {
      vy = -PLAYER_SPEED;
      this.direction = 'north';
    } else if (down) {
      vy = PLAYER_SPEED;
      this.direction = 'south';
    }

    // Normalize diagonal movement
    if (vx !== 0 && vy !== 0) {
      const factor = 1 / Math.SQRT2;
      vx *= factor;
      vy *= factor;
    }

    body.setVelocity(vx, vy);
    this.isMoving = vx !== 0 || vy !== 0;
  }

  // ── Animation (manual frame cycling with individual images) ──────────────────

  private updateAnimation(delta: number): void {
    if (!this.isMoving) {
      // Show idle directional sprite
      this.setTexture(`${this.character}_${this.direction}`);
      this.walkFrame = 0;
      this.walkFrameTimer = 0;
      return;
    }

    this.walkFrameTimer += delta;
    if (this.walkFrameTimer >= this.frameDuration) {
      this.walkFrameTimer -= this.frameDuration;
      this.walkFrame = (this.walkFrame + 1) % 9; // f0–f8
    }

    this.setTexture(
      `${this.character}_walk_${this.direction}_f${this.walkFrame}`,
    );
  }

  // ── Player Data Sync ─────────────────────────────────────────────────────────

  private syncPlayerData(): void {
    this.playerData.x = this.x;
    this.playerData.y = this.y;
    this.playerData.direction = this.direction;
    this.playerData.isMoving = this.isMoving;
  }

  // ── Public Accessors ─────────────────────────────────────────────────────────

  getDirection(): Direction {
    return this.direction;
  }

  getIsMoving(): boolean {
    return this.isMoving;
  }

  setEnergy(energy: number): void {
    this.playerData.energy = Phaser.Math.Clamp(energy, 0, this.playerData.maxEnergy);
    this.scene.game.events.emit(GAME_EVENTS.PLAYER_ENERGY_CHANGE, {
      energy: this.playerData.energy,
      maxEnergy: this.playerData.maxEnergy,
    });
  }

  setSilver(silver: number): void {
    this.playerData.silver = Math.max(0, silver);
    this.scene.game.events.emit(GAME_EVENTS.SILVER_CHANGE, {
      silver: this.playerData.silver,
    });
  }

  setPetal(petal: number): void {
    this.playerData.petal = Math.max(0, petal);
    this.scene.game.events.emit(GAME_EVENTS.PETAL_CHANGE, {
      petal: this.playerData.petal,
    });
  }

  setWalletAddress(address: string): void {
    this.playerData.walletAddress = address;
  }

  /** Teleport player to tile coordinates */
  setTilePosition(tileX: number, tileY: number, tileSize: number): void {
    this.setPosition(
      tileX * tileSize + tileSize / 2,
      tileY * tileSize + tileSize / 2,
    );
  }
}
