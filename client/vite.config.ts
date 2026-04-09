import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@scenes': path.resolve(__dirname, './src/scenes'),
      '@game': path.resolve(__dirname, './src/game'),
      '@network': path.resolve(__dirname, './src/network'),
      '@ui': path.resolve(__dirname, './src/ui'),
      '@types-game': path.resolve(__dirname, './src/types'),
    },
  },
  server: {
    port: 3000,
    host: true,
  },
  build: {
    target: 'es2020',
    assetsInlineLimit: 0,
  },
  // Pixel art: disable image smoothing via CSS, Phaser handles canvas-level smoothing
  define: {
    'import.meta.env.GAME_WIDTH': JSON.stringify(800),
    'import.meta.env.GAME_HEIGHT': JSON.stringify(600),
  },
});
