import Phaser from 'phaser';
import { gameConfig } from './config';

/**
 * Petaland — Pixel Farming MMO on Solana
 * Entry point: initializes the Phaser game instance.
 */

// Prevent right-click context menu on the game canvas
document.addEventListener('contextmenu', (e) => e.preventDefault());

// Start the Phaser game
const game = new Phaser.Game(gameConfig);

// Expose game instance globally for debugging in browser console
(window as unknown as Record<string, unknown>)['__petaland__'] = game;
