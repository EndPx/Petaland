import Phaser from 'phaser';
import {
  Direction,
  PlayerState,
  GAME_EVENTS,
} from '../types/index';
import { TILE_SIZE, WALK_FRAME_RATE } from '../config';

type CursorKeys = Phaser.Types.Input.Keyboard.CursorKeys;

interface WASDKeys {
  W: Phaser.Input.Keyboard.Key;
  A: Phaser.Input.Keyboard.Key;
  S: Phaser.Input.Keyboard.Key;
  D: Phaser.Input.Keyboard.Key;
}

/** Callback that checks if a tile coordinate is walkable */
type WalkableCheck = (tx: number, ty: number) => boolean;

/**
 * Player — NomStead-style grid-based movement.
 *
 * Movement is tile-to-tile with smooth tweening:
 *   - Press WASD/Arrows → check if target tile is walkable
 *   - If walkable, tween smoothly to the target tile center
 *   - Can't move again until current tween completes
 *   - Facing direction updates instantly on key press
 *
 * No physics needed — walkability is checked via WorldMap.isWalkable()
 * before each move, so the player never overlaps solid objects.
 */
export class Player extends Phaser.GameObjects.Sprite {
  private direction: Direction = 'south';
  private isMoving = false;
  private walkFrame = 0;
  private walkFrameTimer = 0;
  private readonly frameDuration: number;
  private character: 'farmer_male' | 'farmer_female';

  /** Duration (ms) to tween one tile */
  private readonly moveDuration = 180;

  /** Current tile position */
  private tileX: number;
  private tileY: number;

  /** Walkability checker (provided by GameScene from WorldMap) */
  private canWalk: WalkableCheck = () => true;

  // Input references
  private cursors: CursorKeys | null = null;
  private wasd: WASDKeys | null = null;

  // Player data exposed to network layer
  public playerData: PlayerState;

  constructor(
    scene: Phaser.Scene,
    tileX: number,
    tileY: number,
    character: 'farmer_male' | 'farmer_female' = 'farmer_male',
  ) {
    const wx = tileX * TILE_SIZE + TILE_SIZE / 2;
    const wy = tileY * TILE_SIZE + TILE_SIZE / 2;
    super(scene, wx, wy, `${character}_south`);

    this.character = character;
    this.tileX = tileX;
    this.tileY = tileY;
    this.frameDuration = 1000 / WALK_FRAME_RATE;

    this.playerData = {
      id: 'local',
      walletAddress: '',
      x: wx,
      y: wy,
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

    // Add to scene (no physics — grid movement handles collisions)
    scene.add.existing(this);

    // Scale 48px sprite to ~1.25 tiles wide (NomStead character is 80px on 64px tiles)
    const charScale = (TILE_SIZE * 1.25) / 48;
    this.setScale(charScale);

    this.setDepth(5);
    this.setOrigin(0.5, 0.75);
  }

  // ── Input Setup ─────────────────────────────────────────────────────────────

  setupInput(cursors: CursorKeys, wasd: WASDKeys): void {
    this.cursors = cursors;
    this.wasd = wasd;
  }

  /** Provide a walkability checker (from WorldMap.isWalkable) */
  setWalkableCheck(check: WalkableCheck): void {
    this.canWalk = check;
  }

  // ── Update (called every frame from GameScene) ───────────────────────────────

  update(delta: number): void {
    this.handleMovement();
    this.updateAnimation(delta);
    this.syncPlayerData();
  }

  // ── Grid-Based Movement ─────────────────────────────────────────────────────

  private handleMovement(): void {
    if (!this.cursors && !this.wasd) return;
    // Can't start a new move while already tweening
    if (this.isMoving) return;

    const left = this.cursors?.left.isDown || this.wasd?.A.isDown;
    const right = this.cursors?.right.isDown || this.wasd?.D.isDown;
    const up = this.cursors?.up.isDown || this.wasd?.W.isDown;
    const down = this.cursors?.down.isDown || this.wasd?.S.isDown;

    let dx = 0;
    let dy = 0;

    // Priority: vertical then horizontal (no diagonal in grid movement)
    if (up) {
      dy = -1;
      this.direction = 'north';
    } else if (down) {
      dy = 1;
      this.direction = 'south';
    } else if (left) {
      dx = -1;
      this.direction = 'west';
    } else if (right) {
      dx = 1;
      this.direction = 'east';
    }

    if (dx === 0 && dy === 0) return;

    const targetTX = this.tileX + dx;
    const targetTY = this.tileY + dy;

    // Check if target tile is walkable
    if (!this.canWalk(targetTX, targetTY)) return;

    // Start smooth tween to target tile
    this.isMoving = true;
    const targetWX = targetTX * TILE_SIZE + TILE_SIZE / 2;
    const targetWY = targetTY * TILE_SIZE + TILE_SIZE / 2;

    this.scene.tweens.add({
      targets: this,
      x: targetWX,
      y: targetWY,
      duration: this.moveDuration,
      ease: 'Power2',
      onComplete: () => {
        this.tileX = targetTX;
        this.tileY = targetTY;
        this.isMoving = false;
      },
    });
  }

  // ── Animation (manual frame cycling with individual images) ──────────────────

  private updateAnimation(delta: number): void {
    if (!this.isMoving) {
      this.setTexture(`${this.character}_${this.direction}`);
      this.walkFrame = 0;
      this.walkFrameTimer = 0;
      return;
    }

    this.walkFrameTimer += delta;
    if (this.walkFrameTimer >= this.frameDuration) {
      this.walkFrameTimer -= this.frameDuration;
      this.walkFrame = (this.walkFrame + 1) % 6; // f0–f5 (PixelLab walk cycle)
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
    // Y-based depth sorting: player renders in front of objects above,
    // behind objects below (proper top-down layering)
    this.setDepth(this.y);
  }

  // ── Public Accessors ─────────────────────────────────────────────────────────

  getDirection(): Direction {
    return this.direction;
  }

  getIsMoving(): boolean {
    return this.isMoving;
  }

  getTileX(): number {
    return this.tileX;
  }

  getTileY(): number {
    return this.tileY;
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
  setTilePosition(tx: number, ty: number): void {
    this.tileX = tx;
    this.tileY = ty;
    this.setPosition(
      tx * TILE_SIZE + TILE_SIZE / 2,
      ty * TILE_SIZE + TILE_SIZE / 2,
    );
  }
}
