import Phaser from 'phaser';
import { GAME_EVENTS } from '../types/index';

/**
 * MenuScene — title screen with Connect Wallet button.
 * Wallet connection is handled by WalletProvider (stub).
 * On success (or pressing Play for dev), transitions to GameScene.
 */
export class MenuScene extends Phaser.Scene {
  private titleText!: Phaser.GameObjects.Text;
  private subtitleText!: Phaser.GameObjects.Text;
  private connectBtn!: Phaser.GameObjects.Text;
  private playBtn!: Phaser.GameObjects.Text;
  private statusText!: Phaser.GameObjects.Text;
  private bgTiles: Phaser.GameObjects.Image[] = [];
  private frameCounter = 0;

  constructor() {
    super({ key: 'MenuScene' });
  }

  create(): void {
    this.createBackground();
    this.createTitle();
    this.createButtons();
    this.createFooter();
    this.playBgAnimation();
  }

  update(): void {
    this.frameCounter++;
    // Subtle parallax scroll on background tiles
    if (this.frameCounter % 2 === 0) {
      for (let i = 0; i < this.bgTiles.length; i++) {
        this.bgTiles[i].x -= 0.2;
        if (this.bgTiles[i].x < -16) {
          this.bgTiles[i].x += this.scale.width + 32;
        }
      }
    }
  }

  // ── Background ──────────────────────────────────────────────────────────────

  private createBackground(): void {
    const { width, height } = this.scale;
    const tileSize = 16;
    const cols = Math.ceil(width / tileSize) + 2;
    const rows = Math.ceil(height / tileSize) + 2;

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        // Pick one of the 4 clean base variants (indices 0-3).
        // Indices 4-15 are transitions/corners/inner-corners that show
        // the upper-palette color (dirt), which would make the menu
        // background look like chaotic dirt noise.
        const variant = Phaser.Math.Between(0, 3);
        const tile = this.add
          .image(
            col * tileSize + tileSize / 2,
            row * tileSize + tileSize / 2,
            `grass_wang_${variant}`,
          )
          .setScale(1);
        this.bgTiles.push(tile);
      }
    }

    // Dark overlay for readability
    this.add
      .rectangle(width / 2, height / 2, width, height, 0x000000, 0.55)
      .setDepth(1);
  }

  // ── Title ───────────────────────────────────────────────────────────────────

  private createTitle(): void {
    const cx = this.scale.width / 2;

    this.titleText = this.add
      .text(cx, 140, 'PETALAND', {
        fontSize: '48px',
        color: '#4ade80',
        fontFamily: 'Courier New',
        fontStyle: 'bold',
        stroke: '#064e3b',
        strokeThickness: 6,
      })
      .setOrigin(0.5)
      .setDepth(2);

    this.subtitleText = this.add
      .text(cx, 196, 'Pixel Farming MMO on Solana', {
        fontSize: '14px',
        color: '#86efac',
        fontFamily: 'Courier New',
        stroke: '#000000',
        strokeThickness: 2,
      })
      .setOrigin(0.5)
      .setDepth(2);

    // Animated petal decorations
    this.add
      .text(cx - 180, 140, '🌸', { fontSize: '28px' })
      .setOrigin(0.5)
      .setDepth(2);
    this.add
      .text(cx + 180, 140, '🌸', { fontSize: '28px' })
      .setOrigin(0.5)
      .setDepth(2);
  }

  // ── Buttons ─────────────────────────────────────────────────────────────────

  private createButtons(): void {
    const cx = this.scale.width / 2;

    // Connect Wallet button
    this.connectBtn = this.add
      .text(cx, 290, '[ Connect Wallet ]', {
        fontSize: '20px',
        color: '#fbbf24',
        fontFamily: 'Courier New',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 3,
        padding: { x: 16, y: 8 },
        backgroundColor: '#1a1a2e',
      })
      .setOrigin(0.5)
      .setDepth(2)
      .setInteractive({ useHandCursor: true });

    this.connectBtn.on('pointerover', () => {
      this.connectBtn.setColor('#fde68a');
      this.connectBtn.setScale(1.05);
    });
    this.connectBtn.on('pointerout', () => {
      this.connectBtn.setColor('#fbbf24');
      this.connectBtn.setScale(1.0);
    });
    this.connectBtn.on('pointerdown', () => {
      this.onConnectWallet();
    });

    // Play (dev / skip wallet) button
    this.playBtn = this.add
      .text(cx, 350, '[ Play (Dev Mode) ]', {
        fontSize: '16px',
        color: '#6b7280',
        fontFamily: 'Courier New',
        stroke: '#000000',
        strokeThickness: 2,
        padding: { x: 12, y: 6 },
        backgroundColor: '#111827',
      })
      .setOrigin(0.5)
      .setDepth(2)
      .setInteractive({ useHandCursor: true });

    this.playBtn.on('pointerover', () => {
      this.playBtn.setColor('#d1d5db');
      this.playBtn.setScale(1.03);
    });
    this.playBtn.on('pointerout', () => {
      this.playBtn.setColor('#6b7280');
      this.playBtn.setScale(1.0);
    });
    this.playBtn.on('pointerdown', () => {
      this.startGame();
    });

    // Status feedback text
    this.statusText = this.add
      .text(cx, 410, '', {
        fontSize: '12px',
        color: '#9ca3af',
        fontFamily: 'Courier New',
      })
      .setOrigin(0.5)
      .setDepth(2);
  }

  // ── Footer ───────────────────────────────────────────────────────────────────

  private createFooter(): void {
    const cx = this.scale.width / 2;
    const cy = this.scale.height;

    this.add
      .text(cx, cy - 20, 'Built on Solana  •  Powered by $PETAL', {
        fontSize: '10px',
        color: '#4b5563',
        fontFamily: 'Courier New',
      })
      .setOrigin(0.5)
      .setDepth(2);
  }

  // ── Animations ───────────────────────────────────────────────────────────────

  private playBgAnimation(): void {
    // Title pulse
    this.tweens.add({
      targets: this.titleText,
      scaleX: 1.02,
      scaleY: 1.02,
      duration: 1800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  // ── Actions ──────────────────────────────────────────────────────────────────

  private onConnectWallet(): void {
    this.statusText.setText('Connecting wallet...');
    this.statusText.setColor('#fbbf24');

    // Emit event for WalletProvider to handle
    this.game.events.emit(GAME_EVENTS.WALLET_CONNECTED, { address: 'demo' });

    // Simulate connection delay then start game
    this.time.delayedCall(1200, () => {
      this.statusText.setText('Wallet connected!');
      this.statusText.setColor('#4ade80');
      this.time.delayedCall(600, () => {
        this.startGame();
      });
    });
  }

  private startGame(): void {
    this.cameras.main.fadeOut(400, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('GameScene');
    });
  }
}
