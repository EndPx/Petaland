import Phaser from 'phaser';

/**
 * BootScene — preloads every game asset before handing off to MenuScene.
 *
 * Uses staged loading to work around Phaser 3.90 loader batch stall:
 * assets are queued and loaded in groups via create() + load.start(),
 * rather than relying on preload()'s auto-start which can hang.
 */
export class BootScene extends Phaser.Scene {
  private progressBar!: Phaser.GameObjects.Graphics;
  private progressBox!: Phaser.GameObjects.Graphics;
  private loadingText!: Phaser.GameObjects.Text;
  private percentText!: Phaser.GameObjects.Text;

  /** All asset descriptors, split into stages */
  private stages: Array<Array<{ key: string; path: string }>> = [];
  private currentStage = 0;
  private totalAssets = 0;
  private loadedAssets = 0;

  constructor() {
    super({ key: 'BootScene' });
  }

  create(): void {
    this.createLoadingUI();
    this.buildAssetStages();

    this.totalAssets = this.stages.reduce((n, s) => n + s.length, 0);
    this.loadedAssets = 0;

    this.load.on('progress', () => {
      this.updateProgress();
    });

    this.load.on('complete', () => {
      this.loadedAssets += this.stages[this.currentStage].length;
      this.currentStage++;
      if (this.currentStage < this.stages.length) {
        this.loadNextStage();
      } else {
        this.onAllLoaded();
      }
    });

    this.load.on('loaderror', (file: Phaser.Loader.File) => {
      console.error('[BootScene] Asset load error:', file.key, file.src);
    });

    this.loadNextStage();
  }

  // ── Staged Loading ──────────────────────────────────────────────────────────

  private buildAssetStages(): void {
    const directions = ['south', 'north', 'east', 'west'];

    // Stage 1: Tilesets (64 files)
    const tilesets: Array<{ key: string; path: string }> = [];
    for (const type of ['grass', 'forest', 'stone', 'water']) {
      for (let i = 0; i <= 15; i++) {
        tilesets.push({
          key: `${type}_wang_${i}`,
          path: `assets/tilesets/${type}_wang_${i}.png`,
        });
      }
    }
    this.stages.push(tilesets);

    // Stage 2: Character idle sprites (18 files)
    const charIdles: Array<{ key: string; path: string }> = [];
    for (const char of ['farmer_male', 'farmer_female']) {
      charIdles.push({ key: char, path: `assets/characters/${char}.png` });
      charIdles.push({ key: `${char}_idle`, path: `assets/characters/${char}_idle.png` });
      for (const dir of directions) {
        charIdles.push({
          key: `${char}_${dir}`,
          path: `assets/characters/${char}_${dir}.png`,
        });
      }
    }
    // NPC shopkeeper
    charIdles.push({ key: 'npc_shopkeeper', path: 'assets/characters/npc_shopkeeper.png' });
    for (const dir of directions) {
      charIdles.push({
        key: `npc_shopkeeper_${dir}`,
        path: `assets/characters/npc_shopkeeper_${dir}.png`,
      });
    }
    this.stages.push(charIdles);

    // Stage 3: Walk animations (48 files)
    const walkFrames: Array<{ key: string; path: string }> = [];
    for (const char of ['farmer_male', 'farmer_female']) {
      for (const dir of directions) {
        for (let f = 0; f <= 5; f++) {
          walkFrames.push({
            key: `${char}_walk_${dir}_f${f}`,
            path: `assets/characters/${char}_walk_${dir}_f${f}.png`,
          });
        }
      }
    }
    this.stages.push(walkFrames);

    // Stage 4: Objects (27 files)
    const objects: Array<{ key: string; path: string }> = [];
    for (const obj of ['oak_tree', 'pine_tree', 'rock_small', 'bush', 'flower_petal', 'wild_carrot']) {
      objects.push({ key: obj, path: `assets/objects/nature/${obj}.png` });
    }
    for (const b of [
      'workbench', 'bonfire', 'storage_box', 'well', 'fence',
      'fence_horizontal', 'sawmill', 'furnace', 'scarecrow',
      'shop_stall', 'npc_shop_stall', 'soil_bed_empty',
    ]) {
      objects.push({ key: b, path: `assets/objects/buildings/${b}.png` });
    }
    for (const crop of ['wheat', 'carrot']) {
      for (let stage = 1; stage <= 4; stage++) {
        objects.push({
          key: `${crop}_stage${stage}`,
          path: `assets/objects/farming/${crop}_stage${stage}.png`,
        });
      }
    }
    objects.push({ key: 'soil_bed', path: 'assets/objects/farming/soil_bed.png' });
    this.stages.push(objects);
  }

  private loadNextStage(): void {
    const stage = this.stages[this.currentStage];
    for (const asset of stage) {
      this.load.image(asset.key, asset.path);
    }
    this.load.start();
  }

  private updateProgress(): void {
    const stageProgress = this.load.progress;
    const stageSize = this.stages[this.currentStage].length;
    const overallLoaded = this.loadedAssets + stageProgress * stageSize;
    const pct = overallLoaded / this.totalAssets;

    this.percentText.setText(`${Math.floor(pct * 100)}%`);
    this.progressBar.clear();
    this.progressBar.fillStyle(0x4ade80, 1);
    this.progressBar.fillRect(
      this.scale.width / 2 - 150 + 5,
      this.scale.height / 2 - 15,
      290 * pct,
      30,
    );
  }

  private onAllLoaded(): void {
    this.progressBar.destroy();
    this.progressBox.destroy();
    this.loadingText.destroy();
    this.percentText.destroy();
    this.scene.start('MenuScene');
  }

  // ── Loading UI ──────────────────────────────────────────────────────────────

  private createLoadingUI(): void {
    const cx = this.scale.width / 2;
    const cy = this.scale.height / 2;

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

    this.progressBox = this.add.graphics();
    this.progressBox.fillStyle(0x1a1a2e, 0.9);
    this.progressBox.fillRect(cx - 155, cy - 20, 310, 40);

    this.progressBar = this.add.graphics();

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
