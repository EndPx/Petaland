/**
 * ColyseusClient — WebSocket connection stub to the Colyseus game server.
 *
 * TODO: Install colyseus.js package and implement:
 *   - Connect/disconnect lifecycle
 *   - Join/create game rooms
 *   - Send player movement updates
 *   - Receive other players' states
 *   - Handle chat messages
 *   - Sync inventory and silver balance
 *
 * Server endpoint: ws://localhost:2567 (dev) / wss://api.petaland.io (prod)
 */

import { MovePayload, PlayerState, ChatMessage, ServerMessage } from '../types/index';

type MessageHandler = (message: ServerMessage) => void;
type StateHandler = (state: Map<string, PlayerState>) => void;

export class ColyseusClient {
  private serverUrl: string;
  private connected = false;
  private roomId: string | null = null;

  // Callbacks
  private onPlayersUpdate: StateHandler | null = null;
  private onChatMessage: ((msg: ChatMessage) => void) | null = null;
  private onMessage: MessageHandler | null = null;

  constructor(serverUrl = 'ws://localhost:2567') {
    this.serverUrl = serverUrl;
  }

  // ── Connection ────────────────────────────────────────────────────────────────

  async connect(walletAddress: string): Promise<void> {
    console.log(`[Colyseus] Connecting to ${this.serverUrl} as ${walletAddress}...`);
    // TODO: const client = new Client(this.serverUrl);
    // TODO: this.room = await client.joinOrCreate('world', { walletAddress });
    // TODO: this.room.onStateChange(state => { ... });
    this.connected = true;
    console.log('[Colyseus] Connected (stub)');
  }

  async disconnect(): Promise<void> {
    if (!this.connected) return;
    // TODO: await this.room?.leave();
    this.connected = false;
    this.roomId = null;
    console.log('[Colyseus] Disconnected');
  }

  // ── Send ──────────────────────────────────────────────────────────────────────

  sendMove(payload: MovePayload): void {
    if (!this.connected) return;
    // TODO: this.room?.send('move', payload);
    // console.debug('[Colyseus] sendMove', payload);
  }

  sendChat(text: string): void {
    if (!this.connected) return;
    // TODO: this.room?.send('chat', { text });
    console.log('[Colyseus] sendChat (stub):', text);
  }

  sendGather(objectId: string): void {
    if (!this.connected) return;
    // TODO: this.room?.send('gather', { objectId });
    console.log('[Colyseus] sendGather (stub):', objectId);
  }

  sendCraft(blueprintId: string): void {
    if (!this.connected) return;
    // TODO: this.room?.send('craft', { blueprintId });
    console.log('[Colyseus] sendCraft (stub):', blueprintId);
  }

  // ── Receive ───────────────────────────────────────────────────────────────────

  onPlayersState(handler: StateHandler): void {
    this.onPlayersUpdate = handler;
  }

  onChat(handler: (msg: ChatMessage) => void): void {
    this.onChatMessage = handler;
  }

  onServerMessage(handler: MessageHandler): void {
    this.onMessage = handler;
  }

  // ── State ─────────────────────────────────────────────────────────────────────

  isConnected(): boolean {
    return this.connected;
  }

  getRoomId(): string | null {
    return this.roomId;
  }

  getServerUrl(): string {
    return this.serverUrl;
  }
}

// Singleton export for convenience
export const colyseusClient = new ColyseusClient(
  import.meta.env.VITE_COLYSEUS_URL ?? 'ws://localhost:2567',
);
