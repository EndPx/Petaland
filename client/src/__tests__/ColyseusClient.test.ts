/**
 * ColyseusClient.test.ts — RED phase tests for ColyseusClient state management.
 *
 * ColyseusClient is a stub with real state logic (connected flag, roomId,
 * serverUrl, callbacks).  We test all observable state transitions and
 * message-sending guards without a real WebSocket.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ColyseusClient uses import.meta.env — stub it before importing
vi.stubGlobal('import', {
  meta: {
    env: {
      VITE_COLYSEUS_URL: 'ws://test-server:2567',
    },
  },
});

// Mock phaser — ColyseusClient imports EventBus which extends Phaser.Events.EventEmitter
vi.mock('phaser', () => {
  class MockEmitter {
    private listeners = new Map<string, Array<(...args: unknown[]) => void>>();
    on(event: string, fn: (...args: unknown[]) => void): this {
      const arr = this.listeners.get(event) ?? [];
      arr.push(fn);
      this.listeners.set(event, arr);
      return this;
    }
    off(event: string, fn?: (...args: unknown[]) => void): this {
      if (!fn) this.listeners.delete(event);
      else {
        const arr = this.listeners.get(event) ?? [];
        this.listeners.set(event, arr.filter((f) => f !== fn));
      }
      return this;
    }
    emit(event: string, ...args: unknown[]): boolean {
      (this.listeners.get(event) ?? []).forEach((fn) => fn(...args));
      return true;
    }
  }
  return {
    default: {
      Events: { EventEmitter: MockEmitter },
    },
  };
});

import { ColyseusClient } from '../network/ColyseusClient';
import type { MovePayload, PlayerState, ChatMessage, ServerMessage } from '../types/index';

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('ColyseusClient — construction', () => {
  it('defaults to ws://localhost:2567 when no URL given', () => {
    const client = new ColyseusClient();
    expect(client.getServerUrl()).toBe('ws://localhost:2567');
  });

  it('uses provided server URL', () => {
    const client = new ColyseusClient('ws://custom:9000');
    expect(client.getServerUrl()).toBe('ws://custom:9000');
  });

  it('starts disconnected', () => {
    const client = new ColyseusClient();
    expect(client.isConnected()).toBe(false);
  });

  it('starts with null roomId', () => {
    const client = new ColyseusClient();
    expect(client.getRoomId()).toBeNull();
  });
});

describe('ColyseusClient — connect()', () => {
  let client: ColyseusClient;

  beforeEach(() => {
    client = new ColyseusClient('ws://localhost:2567');
  });

  it('sets connected to true after connect()', async () => {
    await client.connect({ walletAddress: 'wallet_abc' });
    expect(client.isConnected()).toBe(true);
  });

  it('returns a promise that resolves', async () => {
    await expect(
      client.connect({ walletAddress: 'wallet_abc' }),
    ).resolves.toBeUndefined();
  });

  it('is connected after connecting with any wallet address', async () => {
    await client.connect({ walletAddress: 'Demo1111111111111111111111111111111111111111' });
    expect(client.isConnected()).toBe(true);
  });
});

describe('ColyseusClient — disconnect()', () => {
  let client: ColyseusClient;

  beforeEach(async () => {
    client = new ColyseusClient('ws://localhost:2567');
    await client.connect({ walletAddress: 'wallet_abc' });
  });

  it('sets connected to false after disconnect()', async () => {
    await client.disconnect();
    expect(client.isConnected()).toBe(false);
  });

  it('sets roomId to null after disconnect()', async () => {
    await client.disconnect();
    expect(client.getRoomId()).toBeNull();
  });

  it('is idempotent — disconnect when already disconnected does not throw', async () => {
    await client.disconnect();
    await expect(client.disconnect()).resolves.toBeUndefined();
  });

  it('stays disconnected after double disconnect', async () => {
    await client.disconnect();
    await client.disconnect();
    expect(client.isConnected()).toBe(false);
  });
});

describe('ColyseusClient — sendMove() guard', () => {
  let client: ColyseusClient;

  const payload: MovePayload = { x: 100, y: 200, direction: 'east' };

  beforeEach(() => {
    client = new ColyseusClient('ws://localhost:2567');
  });

  it('does not throw when called while disconnected', () => {
    expect(() => client.sendMove(payload)).not.toThrow();
  });

  it('does not throw when called while connected', async () => {
    await client.connect({ walletAddress: 'wallet_abc' });
    expect(() => client.sendMove(payload)).not.toThrow();
  });

  it('silently ignores sendMove when not connected (no side effects)', () => {
    // Should be callable without error — connection guard fires
    client.sendMove(payload);
    expect(client.isConnected()).toBe(false);
  });
});

describe('ColyseusClient — sendChat() guard', () => {
  let client: ColyseusClient;

  beforeEach(() => {
    client = new ColyseusClient('ws://localhost:2567');
  });

  it('does not throw when disconnected', () => {
    expect(() => client.sendChat('hello')).not.toThrow();
  });

  it('does not throw when connected', async () => {
    await client.connect({ walletAddress: 'wallet_abc' });
    expect(() => client.sendChat('hello world')).not.toThrow();
  });
});

describe('ColyseusClient — sendGather() guard', () => {
  let client: ColyseusClient;

  beforeEach(() => {
    client = new ColyseusClient('ws://localhost:2567');
  });

  it('does not throw when disconnected', () => {
    expect(() => client.sendGather('oak_tree_1')).not.toThrow();
  });

  it('does not throw when connected', async () => {
    await client.connect({ walletAddress: 'wallet_abc' });
    expect(() => client.sendGather('rock_1')).not.toThrow();
  });
});

describe('ColyseusClient — sendCraft() guard', () => {
  let client: ColyseusClient;

  beforeEach(() => {
    client = new ColyseusClient('ws://localhost:2567');
  });

  it('does not throw when disconnected', () => {
    expect(() => client.sendCraft('soil_bed_blueprint')).not.toThrow();
  });

  it('does not throw when connected', async () => {
    await client.connect({ walletAddress: 'wallet_abc' });
    expect(() => client.sendCraft('workbench_blueprint')).not.toThrow();
  });
});

describe('ColyseusClient — callback registration', () => {
  let client: ColyseusClient;

  beforeEach(() => {
    client = new ColyseusClient('ws://localhost:2567');
  });

  it('onPlayersState() accepts a handler without throwing', () => {
    const handler = vi.fn((_state: Map<string, PlayerState>) => {});
    expect(() => client.onPlayersState(handler)).not.toThrow();
  });

  it('onChat() accepts a handler without throwing', () => {
    const handler = vi.fn((_msg: ChatMessage) => {});
    expect(() => client.onChat(handler)).not.toThrow();
  });

  it('onServerMessage() accepts a handler without throwing', () => {
    const handler = vi.fn((_msg: ServerMessage) => {});
    expect(() => client.onServerMessage(handler)).not.toThrow();
  });

  it('handlers can be replaced by registering again', () => {
    const handler1 = vi.fn((_state: Map<string, PlayerState>) => {});
    const handler2 = vi.fn((_state: Map<string, PlayerState>) => {});
    expect(() => {
      client.onPlayersState(handler1);
      client.onPlayersState(handler2);
    }).not.toThrow();
  });
});

describe('ColyseusClient — connect/disconnect lifecycle sequence', () => {
  let client: ColyseusClient;

  beforeEach(() => {
    client = new ColyseusClient('ws://localhost:2567');
  });

  it('can connect → disconnect → reconnect', async () => {
    await client.connect({ walletAddress: 'wallet_1' });
    expect(client.isConnected()).toBe(true);

    await client.disconnect();
    expect(client.isConnected()).toBe(false);

    await client.connect({ walletAddress: 'wallet_2' });
    expect(client.isConnected()).toBe(true);
  });

  it('serverUrl is unchanged across connect/disconnect cycles', async () => {
    const url = 'ws://stable:2567';
    const c = new ColyseusClient(url);
    await c.connect({ walletAddress: 'w1' });
    await c.disconnect();
    expect(c.getServerUrl()).toBe(url);
  });
});
