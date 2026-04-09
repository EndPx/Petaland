import Phaser from 'phaser';

/**
 * BootScene — preloads every game asset before handing off to MenuScene.
 *
 * Tilesets: individual Wang tiles (0–15) for grass, forest, stone, water.
 * Characters: farmer_male / farmer_female directional sprites + walk frames.
 * Objects: nature, buildings, farming objects.
 */
export class BootScene extends Phaser.Scene {
  private progressBar!: Phaser.GameObjects.Graphics;
  private progressBox!: Phaser.GameObjects.Graphics;
  private loadingText!: Phaser.GameObjects.Text;
  private percentText!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'BootScene' });
  }

  preload(): void {
    this.createLoadingUI();

    this.load.on('progress', (value: number) => {
      this.percentText.setText(`${Math.floor(value * 100)}%`);
      this.progressBar.clear();
      this.progressBar.fillStyle(0x4ade80, 1);
      this.progressBar.fillRect(
        this.scale.width / 2 - 150 + 5,
        this.scale.height / 2 - 15,
        290 * value,
        30,
      );
    });

    this.load.on('complete', () => {
      this.progressBar.destroy();
      this.progressBox.destroy();
      this.loadingText.destroy();
      this.percentText.destroy();
    });

    // ── Tilesets ─────────────────────────────────────────────────────────────
    const tilesetTypes = ['grass', 'forest', 'stone', 'water'];
    for (const type of tilesetTypes) {
      for (let i = 0; i <= 15; i++) {
        this.load.image(
          `${type}_wang_${i}`,
          `assets/tilesets/${type}_wang_${i}.png`,
        );
      }
    }

    // ── Characters — idle (directional) ──────────────────────────────────────
    const characterTypes = ['farmer_male', 'farmer_female'];
    const directions = ['south', 'north', 'east', 'west'];

    for (const char of characterTypes) {
      // Base / idle sprites
      this.load.image(char, `assets/characters/${char}.png`);
      this.load.image(`${char}_idle`, `assets/characters/${char}_idle.png`);

      for (const dir of directions) {
        // Directional idle
        this.load.image(
          `${char}_${dir}`,
          `assets/characters/${char}_${dir}.png`,
        );
        // Walk animation frames f0–f8
        for (let f = 0; f <= 8; f++) {
          this.load.image(
            `${char}_walk_${dir}_f${f}`,
            `assets/characters/${char}_walk_${dir}_f${f}.png`,
          );
        }
      }
    }

    // ── NPC Shopkeeper ────────────────────────────────────────────────────────
    this.load.image('npc_shopkeeper', 'assets/characters/npc_shopkeeper.png');
    for (const dir of directions) {
      this.load.image(
        `npc_shopkeeper_${dir}`,
        `assets/characters/npc_shopkeeper_${dir}.png`,
      );
    }

    // ── Nature Objects ────────────────────────────────────────────────────────
    const natureObjects = [
      'oak_tree',
      'pine_tree',
      'rock_small',
      'bush',
      'flower_petal',
      'wild_carrot',
    ];
    for (const obj of natureObjects) {
      this.load.image(obj, `assets/objects/nature/${obj}.png`);
    }

    // ── Building Objects ──────────────────────────────────────────────────────
    const buildings = [
      'workbench',
      'bonfire',
      'storage_box',
      'well',
      'fence',
      'fence_horizontal',
      'sawmill',
      'furnace',
      'scarecrow',
      'shop_stall',
      'npc_shop_stall',
      'soil_bed_empty',
    ];
    for (const b of buildings) {
      this.load.image(b, `assets/objects/buildings/${b}.png`);
    }

    // ── Farming Objects ───────────────────────────────────────────────────────
    const crops = ['wheat', 'carrot'];
    for (const crop of crops) {
      for (let stage = 1; stage <= 4; stage++) {
        this.load.image(
          `${crop}_stage${stage}`,
          `assets/objects/farming/${crop}_stage${stage}.png`,
        );
      }
    }
    this.load.image('soil_bed', 'assets/objects/farming/soil_bed.png');
  }

  create(): void {
    this.scene.start('MenuScene');
  }

  // ── Loading UI ──────────────────────────────────────────────────────────────

  private createLoadingUI(): void {
    const cx = this.scale.width / 2;
    const cy = this.scale.height / 2;

    // Title
    this.add
      .text(cx, cy - 80, 'PETALAND', {
        fontSize: '32px',
        color: '#4ade80',
        fontFamily: 'Courier New',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    this.add
      .text(cx, cy - 48, 'Pixel Farming MMO on Solana', {
        fontSize: '12px',
        color: '#86efac',
        fontFamily: 'Courier New',
      })
      .setOrigin(0.5);

    // Progress box (background)
    this.progressBox = this.add.graphics();
    this.progressBox.fillStyle(0x1a1a2e, 0.9);
    this.progressBox.fillRect(cx - 155, cy - 20, 310, 40);

    // Progress bar (fill)
    this.progressBar = this.add.graphics();

    // Loading text
    this.loadingText = this.add
      .text(cx, cy + 35, 'Loading assets...', {
        fontSize: '11px',
        color: '#6b7280',
        fontFamily: 'Courier New',
      })
      .setOrigin(0.5);

    this.percentText = this.add
      .text(cx, cy, '0%', {
        fontSize: '14px',
        color: '#ffffff',
        fontFamily: 'Courier New',
      })
      .setOrigin(0.5);
  }
}
