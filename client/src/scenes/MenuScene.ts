import Phaser from 'phaser';
import { GAME_EVENTS } from '../types/index';

/**
 * MenuScene — NomStead-style warm title screen.
 *
 * Warm cream/peach tones, soft rounded buttons, cozy pixel art feel.
 * Connect Wallet or Play (dev mode) to enter the game.
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

    // Warm cream overlay (NomStead-style, not dark)
    this.add
      .rectangle(width / 2, height / 2, width, height, 0xf0dcc8, 0.7)
      .setDepth(1);
  }

  // ── Title ───────────────────────────────────────────────────────────────────

  private createTitle(): void {
    const cx = this.scale.width / 2;

    // Decorative flower left
    this.add
      .text(cx - 200, 150, '\u{1F338}', { fontSize: '32px' })
      .setOrigin(0.5)
      .setDepth(2);

    this.titleText = this.add
      .text(cx, 150, 'PETALAND', {
        fontSize: '52px',
        color: '#5b8c3e',
        fontFamily: 'Nunito, sans-serif',
        fontStyle: 'bold',
        stroke: '#3d6228',
        strokeThickness: 6,
      })
      .setOrigin(0.5)
      .setDepth(2);

    // Decorative flower right
    this.add
      .text(cx + 200, 150, '\u{1F338}', { fontSize: '32px' })
      .setOrigin(0.5)
      .setDepth(2);

    this.subtitleText = this.add
      .text(cx, 210, 'Pixel Farming MMO on Solana', {
        fontSize: '15px',
        color: '#8b7355',
        fontFamily: 'Nunito, sans-serif',
        fontStyle: 'bold',
        stroke: '#f0dcc8',
        strokeThickness: 3,
      })
      .setOrigin(0.5)
      .setDepth(2);
  }

  // ── Buttons ─────────────────────────────────────────────────────────────────

  private createButtons(): void {
    const cx = this.scale.width / 2;

    // Connect Wallet — primary warm green button
    this.connectBtn = this.add
      .text(cx, 300, 'Connect Wallet', {
        fontSize: '20px',
        color: '#ffffff',
        fontFamily: 'Nunito, sans-serif',
        fontStyle: 'bold',
        padding: { x: 32, y: 12 },
        backgroundColor: '#6b9e3e',
      })
      .setOrigin(0.5)
      .setDepth(2)
      .setInteractive({ useHandCursor: true });

    this.connectBtn.on('pointerover', () => {
      this.connectBtn.setBackgroundColor('#7db648');
      this.connectBtn.setScale(1.04);
    });
    this.connectBtn.on('pointerout', () => {
      this.connectBtn.setBackgroundColor('#6b9e3e');
      this.connectBtn.setScale(1.0);
    });
    this.connectBtn.on('pointerdown', () => {
      this.onConnectWallet();
    });

    // Play (dev / skip wallet) — secondary muted button
    this.playBtn = this.add
      .text(cx, 365, 'Play (Dev Mode)', {
        fontSize: '15px',
        color: '#9a8672',
        fontFamily: 'Nunito, sans-serif',
        fontStyle: 'bold',
        padding: { x: 24, y: 8 },
        backgroundColor: '#e8ddd0',
      })
      .setOrigin(0.5)
      .setDepth(2)
      .setInteractive({ useHandCursor: true });

    this.playBtn.on('pointerover', () => {
      this.playBtn.setColor('#6b5540');
      this.playBtn.setBackgroundColor('#ddd0c0');
      this.playBtn.setScale(1.03);
    });
    this.playBtn.on('pointerout', () => {
      this.playBtn.setColor('#9a8672');
      this.playBtn.setBackgroundColor('#e8ddd0');
      this.playBtn.setScale(1.0);
    });
    this.playBtn.on('pointerdown', () => {
      this.startGame();
    });

    // Status feedback
    this.statusText = this.add
      .text(cx, 420, '', {
        fontSize: '13px',
        color: '#9a8672',
        fontFamily: 'Nunito, sans-serif',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setDepth(2);
  }

  // ── Footer ───────────────────────────────────────────────────────────────────

  private createFooter(): void {
    const cx = this.scale.width / 2;
    const cy = this.scale.height;

    this.add
      .text(cx, cy - 24, 'Built on Solana  \u2022  Powered by $PETAL', {
        fontSize: '11px',
        color: '#b0a090',
        fontFamily: 'Nunito, sans-serif',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setDepth(2);
  }

  // ── Animations ───────────────────────────────────────────────────────────────

  private playBgAnimation(): void {
    // Gentle title float
    this.tweens.add({
      targets: this.titleText,
      y: this.titleText.y - 4,
      duration: 2200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  // ── Actions ──────────────────────────────────────────────────────────────────

  private onConnectWallet(): void {
    this.statusText.setText('Connecting wallet...');
    this.statusText.setColor('#d4a43a');

    // Emit event for WalletProvider to handle
    this.game.events.emit(GAME_EVENTS.WALLET_CONNECTED, { address: 'demo' });

    // Simulate connection delay then start game
    this.time.delayedCall(1200, () => {
      this.statusText.setText('Wallet connected!');
      this.statusText.setColor('#6b9e3e');
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
