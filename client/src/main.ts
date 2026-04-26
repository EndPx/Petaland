import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from './config';
import { BootScene } from './scenes/BootScene';
import { MenuScene } from './scenes/MenuScene';
import { GameScene } from './scenes/GameScene';

/**
 * Petaland — Pixel Farming MMO on Solana
 * Entry point: initializes the Phaser game instance.
 */

// ─── Phaser Game Config ──────────────────────────────────────────────────────

const gameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  parent: 'game-container',
  backgroundColor: '#a8b87d',       // doodle olive-green (NomStead-mirror)
  pixelArt: false,               // doodle aesthetic — smooth Graphics lines
  roundPixels: true,             // prevents sub-pixel rendering

  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false,
    },
  },

  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },

  render: {
    antialias: false,
    antialiasGL: false,
    pixelArt: true,
  },

  scene: [BootScene, MenuScene, GameScene],
};

// Prevent right-click context menu on the game canvas
document.addEventListener('contextmenu', (e) => e.preventDefault());

// Start the Phaser game
const game = new Phaser.Game(gameConfig);

// Expose game instance globally for debugging in browser console
(window as unknown as Record<string, unknown>)['__petaland__'] = game;
