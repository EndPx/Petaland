/**
 * WalletProvider — Solana wallet adapter connection stub.
 *
 * TODO: Integrate @solana/wallet-adapter-react (or vanilla adapter) and:
 *   - List available wallets (Phantom, Backpack, Solflare, etc.)
 *   - Connect / disconnect wallet
 *   - Sign transactions for on-chain actions ($PETAL transfers, NFT minting)
 *   - Sign messages for server authentication (prove wallet ownership)
 *   - Query $PETAL SPL token balance
 *   - Interact with Anchor program (land purchase, marketplace)
 *
 * For vanilla TS (no React), use @solana/wallet-adapter-base directly.
 */

import { GAME_EVENTS } from '../types/index';

export interface WalletState {
  connected: boolean;
  publicKey: string | null;
  petalBalance: number;
}

export class WalletProvider {
  private state: WalletState = {
    connected: false,
    publicKey: null,
    petalBalance: 0,
  };

  private gameEvents: Phaser.Events.EventEmitter | null = null;

  constructor(gameEvents?: Phaser.Events.EventEmitter) {
    this.gameEvents = gameEvents ?? null;
  }

  // ── Connection ────────────────────────────────────────────────────────────────

  async connect(): Promise<string | null> {
    console.log('[Wallet] Connecting wallet...');

    try {
      // TODO: const adapter = new PhantomWalletAdapter();
      // TODO: await adapter.connect();
      // TODO: const publicKey = adapter.publicKey?.toString();

      // Stub: simulate connection
      const stubKey = 'Demo1111111111111111111111111111111111111111';
      this.state.connected = true;
      this.state.publicKey = stubKey;

      this.gameEvents?.emit(GAME_EVENTS.WALLET_CONNECTED, {
        address: stubKey,
      });

      console.log('[Wallet] Connected (stub):', stubKey);
      return stubKey;
    } catch (err) {
      console.error('[Wallet] Connection failed:', err);
      return null;
    }
  }

  async disconnect(): Promise<void> {
    // TODO: await adapter.disconnect();
    this.state.connected = false;
    this.state.publicKey = null;
    this.state.petalBalance = 0;
    this.gameEvents?.emit(GAME_EVENTS.WALLET_DISCONNECTED, {});
    console.log('[Wallet] Disconnected');
  }

  // ── Token Balance ─────────────────────────────────────────────────────────────

  async getPetalBalance(): Promise<number> {
    if (!this.state.connected || !this.state.publicKey) return 0;

    // TODO: const connection = new Connection(clusterApiUrl('mainnet-beta'));
    // TODO: const ata = await getAssociatedTokenAddress(PETAL_MINT, new PublicKey(this.state.publicKey));
    // TODO: const info = await connection.getTokenAccountBalance(ata);
    // TODO: return Number(info.value.uiAmount ?? 0);

    // Stub: return 0
    return 0;
  }

  async getSolBalance(): Promise<number> {
    if (!this.state.connected || !this.state.publicKey) return 0;

    // TODO: const connection = new Connection(clusterApiUrl('mainnet-beta'));
    // TODO: const lamports = await connection.getBalance(new PublicKey(this.state.publicKey));
    // TODO: return lamports / LAMPORTS_PER_SOL;

    return 0;
  }

  // ── Signing ───────────────────────────────────────────────────────────────────

  async signMessage(message: string): Promise<string | null> {
    if (!this.state.connected) return null;

    // TODO: const encodedMessage = new TextEncoder().encode(message);
    // TODO: const signature = await adapter.signMessage(encodedMessage);
    // TODO: return Buffer.from(signature).toString('base64');

    console.log('[Wallet] signMessage (stub):', message);
    return 'stub_signature';
  }

  async signAndSendTransaction(_serializedTx: Uint8Array): Promise<string | null> {
    if (!this.state.connected) return null;

    // TODO: const tx = Transaction.from(serializedTx);
    // TODO: const { signature } = await adapter.sendTransaction(tx, connection);
    // TODO: await connection.confirmTransaction(signature);
    // TODO: return signature;

    console.log('[Wallet] signAndSendTransaction (stub)');
    return 'stub_tx_signature';
  }

  // ── State ─────────────────────────────────────────────────────────────────────

  getState(): WalletState {
    return { ...this.state };
  }

  isConnected(): boolean {
    return this.state.connected;
  }

  getPublicKey(): string | null {
    return this.state.publicKey;
  }

  getShortAddress(): string {
    if (!this.state.publicKey) return '';
    const pk = this.state.publicKey;
    return `${pk.slice(0, 4)}...${pk.slice(-4)}`;
  }
}

// Singleton
export const walletProvider = new WalletProvider();
