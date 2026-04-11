/**
 * HUD.test.ts — RED phase tests for HUD DOM-based overlay.
 *
 * The HUD class manipulates real DOM elements.  jsdom (configured in
 * vitest.config.ts) provides the DOM environment.  We create the required
 * #hud-overlay element before each test and destroy it after.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { HUD, HUDState } from '../ui/HUD';

// ── Phaser mock (HUD only uses Phaser.Game type annotation) ──────────────────
vi.mock('phaser', () => ({
  default: {},
}));

// ── Helpers ───────────────────────────────────────────────────────────────────

function createHUDOverlay(): HTMLElement {
  const el = document.createElement('div');
  el.id = 'hud-overlay';
  document.body.appendChild(el);
  return el;
}

function removeHUDOverlay(): void {
  const el = document.getElementById('hud-overlay');
  if (el) el.remove();
}

const defaultState: HUDState = {
  energy: 100,
  maxEnergy: 100,
  silver: 0,
  petal: 0,
};

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('HUD — construction', () => {
  beforeEach(() => createHUDOverlay());
  afterEach(() => removeHUDOverlay());

  it('constructs without throwing when #hud-overlay exists', () => {
    expect(() => new HUD({} as never, defaultState)).not.toThrow();
  });

  it('throws when #hud-overlay element is missing', () => {
    removeHUDOverlay();
    expect(() => new HUD({} as never, defaultState)).toThrow('HUD: #hud-overlay element not found');
  });

  it('renders energy text as "100 / 100" on init', () => {
    new HUD({} as never, defaultState);
    const el = document.getElementById('hud-energy-text');
    expect(el?.textContent).toBe('100 / 100');
  });

  it('renders silver as "0" on init', () => {
    new HUD({} as never, defaultState);
    const el = document.getElementById('hud-silver');
    expect(el?.textContent).toBe('0');
  });

  it('renders petal as "0" on init', () => {
    new HUD({} as never, defaultState);
    const el = document.getElementById('hud-petal');
    expect(el?.textContent).toBe('0');
  });

  it('renders energy fill at 100% on init', () => {
    new HUD({} as never, defaultState);
    const el = document.getElementById('hud-energy-fill') as HTMLElement;
    expect(el?.style.width).toBe('100%');
  });
});

describe('HUD — setEnergy()', () => {
  let hud: HUD;

  beforeEach(() => {
    createHUDOverlay();
    hud = new HUD({} as never, defaultState);
  });

  afterEach(() => removeHUDOverlay());

  it('updates energy text display', () => {
    hud.setEnergy(70, 100);
    const el = document.getElementById('hud-energy-text');
    expect(el?.textContent).toBe('70 / 100');
  });

  it('updates energy fill width as percentage', () => {
    hud.setEnergy(50, 100);
    const el = document.getElementById('hud-energy-fill') as HTMLElement;
    expect(el?.style.width).toBe('50%');
  });

  it('shows green gradient when energy > 60%', () => {
    hud.setEnergy(80, 100);
    const el = document.getElementById('hud-energy-fill') as HTMLElement;
    // jsdom normalizes hex #4ade80 → rgb(74, 222, 128)
    expect(el?.style.background).toContain('rgb(74, 222, 128)');
  });

  it('shows yellow/amber gradient when energy between 30% and 60%', () => {
    hud.setEnergy(45, 100);
    const el = document.getElementById('hud-energy-fill') as HTMLElement;
    // jsdom normalizes hex #fbbf24 → rgb(251, 191, 36)
    expect(el?.style.background).toContain('rgb(251, 191, 36)');
  });

  it('shows red gradient when energy <= 30%', () => {
    hud.setEnergy(20, 100);
    const el = document.getElementById('hud-energy-fill') as HTMLElement;
    // jsdom normalizes hex #ef4444 → rgb(239, 68, 68)
    expect(el?.style.background).toContain('rgb(239, 68, 68)');
  });

  it('shows energy text with custom maxEnergy', () => {
    hud.setEnergy(150, 200);
    const el = document.getElementById('hud-energy-text');
    expect(el?.textContent).toBe('150 / 200');
  });

  it('handles zero energy correctly', () => {
    hud.setEnergy(0, 100);
    const el = document.getElementById('hud-energy-fill') as HTMLElement;
    expect(el?.style.width).toBe('0%');
  });
});

describe('HUD — setSilver()', () => {
  let hud: HUD;

  beforeEach(() => {
    createHUDOverlay();
    hud = new HUD({} as never, defaultState);
  });

  afterEach(() => removeHUDOverlay());

  it('displays raw number for values under 1000', () => {
    hud.setSilver(999);
    const el = document.getElementById('hud-silver');
    expect(el?.textContent).toBe('999');
  });

  it('formats numbers >= 1000 as "X.Xk"', () => {
    hud.setSilver(1000);
    const el = document.getElementById('hud-silver');
    expect(el?.textContent).toBe('1.0k');
  });

  it('formats 1500 as "1.5k"', () => {
    hud.setSilver(1500);
    const el = document.getElementById('hud-silver');
    expect(el?.textContent).toBe('1.5k');
  });

  it('formats 10000 as "10.0k"', () => {
    hud.setSilver(10000);
    const el = document.getElementById('hud-silver');
    expect(el?.textContent).toBe('10.0k');
  });

  it('formats numbers >= 1,000,000 as "X.XM"', () => {
    hud.setSilver(1_000_000);
    const el = document.getElementById('hud-silver');
    expect(el?.textContent).toBe('1.0M');
  });

  it('formats 2_500_000 as "2.5M"', () => {
    hud.setSilver(2_500_000);
    const el = document.getElementById('hud-silver');
    expect(el?.textContent).toBe('2.5M');
  });

  it('displays 0 as "0"', () => {
    hud.setSilver(0);
    const el = document.getElementById('hud-silver');
    expect(el?.textContent).toBe('0');
  });
});

describe('HUD — setPetal()', () => {
  let hud: HUD;

  beforeEach(() => {
    createHUDOverlay();
    hud = new HUD({} as never, defaultState);
  });

  afterEach(() => removeHUDOverlay());

  it('displays raw number for values under 1000', () => {
    hud.setPetal(500);
    const el = document.getElementById('hud-petal');
    expect(el?.textContent).toBe('500');
  });

  it('formats numbers >= 1000 as "X.Xk"', () => {
    hud.setPetal(2500);
    const el = document.getElementById('hud-petal');
    expect(el?.textContent).toBe('2.5k');
  });

  it('formats numbers >= 1,000,000 as "X.XM"', () => {
    hud.setPetal(5_000_000);
    const el = document.getElementById('hud-petal');
    expect(el?.textContent).toBe('5.0M');
  });
});

describe('HUD — setWalletAddress()', () => {
  let hud: HUD;

  beforeEach(() => {
    createHUDOverlay();
    hud = new HUD({} as never, defaultState);
  });

  afterEach(() => removeHUDOverlay());

  it('truncates long addresses to "XXXX...XXXX" format', () => {
    hud.setWalletAddress('Demo1111111111111111111111111111111111111111');
    const el = document.getElementById('hud-wallet');
    expect(el?.textContent).toBe('Demo...1111');
  });

  it('displays short address (<=12 chars) without truncation', () => {
    hud.setWalletAddress('Short123');
    const el = document.getElementById('hud-wallet');
    expect(el?.textContent).toBe('Short123');
  });

  it('displays address of exactly 12 chars without truncation', () => {
    hud.setWalletAddress('123456789012');
    const el = document.getElementById('hud-wallet');
    expect(el?.textContent).toBe('123456789012');
  });

  it('truncates address of exactly 13 chars', () => {
    hud.setWalletAddress('1234567890123');
    const el = document.getElementById('hud-wallet');
    expect(el?.textContent).toBe('1234...0123');
  });

  it('changes wallet text color to green when address is set', () => {
    hud.setWalletAddress('SomeWalletAddress123456789');
    const el = document.getElementById('hud-wallet') as HTMLElement;
    // jsdom normalizes hex #4ade80 → rgb(74, 222, 128)
    expect(el?.style.color).toBe('rgb(74, 222, 128)');
  });
});

describe('HUD — destroy()', () => {
  beforeEach(() => createHUDOverlay());
  afterEach(() => removeHUDOverlay());

  it('clears the container innerHTML on destroy', () => {
    const hud = new HUD({} as never, defaultState);
    hud.destroy();
    const overlay = document.getElementById('hud-overlay');
    expect(overlay?.innerHTML).toBe('');
  });
});

describe('HUD — initial state variations', () => {
  beforeEach(() => createHUDOverlay());
  afterEach(() => removeHUDOverlay());

  it('renders partial energy correctly', () => {
    const hud = new HUD({} as never, { energy: 30, maxEnergy: 100, silver: 50, petal: 5 });
    const el = document.getElementById('hud-energy-text');
    expect(el?.textContent).toBe('30 / 100');
  });

  it('renders initial silver > 1000 formatted', () => {
    new HUD({} as never, { energy: 100, maxEnergy: 100, silver: 5000, petal: 0 });
    const el = document.getElementById('hud-silver');
    expect(el?.textContent).toBe('5.0k');
  });
});
