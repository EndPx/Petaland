import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    // Use jsdom for DOM-based UI tests (HUD, InventoryUI)
    environment: 'jsdom',
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      include: ['src/**/*.ts'],
      exclude: [
        'src/main.ts',
        'src/vite-env.d.ts',
        'src/scenes/**',              // scenes depend deeply on Phaser runtime
        'src/config.ts',              // constants only
        'src/game/Camera.ts',         // requires Phaser scene + WebGL
        'src/game/Player.ts',         // update/anim loops need Phaser runtime
        'src/game/WorldMap.ts',       // tile rendering needs Phaser runtime
        'src/network/WalletProvider.ts', // requires Solana wallet adapter runtime
      ],
      thresholds: {
        branches: 80,
        functions: 80,
        lines: 80,
        statements: 80,
      },
    },
  },
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
});
