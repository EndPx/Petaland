/**
 * REGISTRY — typed keys for Phaser's `game.registry`.
 *
 * Pattern: SFL / Pixels. Game-wide singletons (wallet, MMO server, plot
 * state, RPC connection) live in the registry so any scene can read them
 * without prop drilling. Always use these constants — `registry.get('foo')`
 * fails silently if 'foo' is misspelled.
 */

export const REGISTRY = {
  // ── Auth ──
  WALLET_ADDRESS: 'walletAddress',
  WALLET_CONNECTED: 'walletConnected',
  JWT_TOKEN: 'jwtToken',

  // ── Plot ──
  PLOT_STATE: 'plotState',
  PLOT_PDA: 'plotPda',
  PLOT_LEVEL: 'plotLevel',

  // ── Solana ──
  RPC_CONNECTION: 'rpcConnection',
  ANCHOR_PROGRAM: 'anchorProgram',
  HELIUS_API_KEY: 'heliusApiKey',
  MERKLE_TREE: 'merkleTree',
  COLLECTION_MINT: 'collectionMint',

  // ── Inventory ──
  INVENTORY: 'inventory',
  CNFT_ASSETS: 'cnftAssets',

  // ── MMO (optional, only if Colyseus rooms used) ──
  MMO_SERVER: 'mmoServer',
  MMO_ROOM: 'mmoRoom',

  // ── Player runtime ──
  PLAYER_BUMPKIN: 'playerBumpkin',
} as const;

export type RegistryKey = (typeof REGISTRY)[keyof typeof REGISTRY];
