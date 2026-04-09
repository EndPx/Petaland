/**
 * HUD — DOM-based overlay rendered on top of the Phaser canvas.
 *
 * Shows:
 *   - Energy bar (green fill)
 *   - Silver count (coin icon + number)
 *   - $PETAL count (flower icon + number)
 *   - Wallet address (short form, top-right)
 *   - Minimap placeholder (bottom-right)
 */

export interface HUDState {
  energy: number;
  maxEnergy: number;
  silver: number;
  petal: number;
  walletAddress?: string;
}

export class HUD {
  private container: HTMLElement;
  private energyBar!: HTMLElement;
  private energyFill!: HTMLElement;
  private energyText!: HTMLElement;
  private silverText!: HTMLElement;
  private petalText!: HTMLElement;
  private walletText!: HTMLElement;

  private state: HUDState;

  constructor(_game: Phaser.Game, initialState: HUDState) {
    this.state = { ...initialState };

    const overlay = document.getElementById('hud-overlay');
    if (!overlay) throw new Error('HUD: #hud-overlay element not found');

    this.container = overlay;
    this.buildDOM();
    this.render();
  }

  // ── DOM Construction ─────────────────────────────────────────────────────────

  private buildDOM(): void {
    this.container.innerHTML = `
      <style>
        #hud-root {
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          pointer-events: none;
          font-family: 'Courier New', monospace;
          font-size: 12px;
          color: #ffffff;
          text-shadow: 1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000;
          image-rendering: pixelated;
        }

        /* ── Top-left: Energy bar ─────────────────── */
        #hud-energy {
          position: absolute;
          top: 10px;
          left: 10px;
          display: flex;
          flex-direction: column;
          gap: 3px;
          min-width: 120px;
        }
        #hud-energy-label {
          font-size: 10px;
          color: #86efac;
          letter-spacing: 1px;
          text-transform: uppercase;
        }
        #hud-energy-bar-bg {
          width: 120px;
          height: 10px;
          background: #1a1a2e;
          border: 1px solid #4ade80;
          position: relative;
          overflow: hidden;
        }
        #hud-energy-fill {
          height: 100%;
          background: linear-gradient(90deg, #16a34a, #4ade80);
          transition: width 0.3s ease;
        }
        #hud-energy-text {
          font-size: 9px;
          color: #d1fae5;
        }

        /* ── Top-left: Currency ───────────────────── */
        #hud-currency {
          position: absolute;
          top: 50px;
          left: 10px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .hud-currency-row {
          display: flex;
          align-items: center;
          gap: 5px;
          background: #00000070;
          padding: 2px 6px;
          border-radius: 3px;
          border: 1px solid #ffffff20;
        }
        .hud-currency-icon {
          font-size: 13px;
        }
        .hud-currency-val {
          font-size: 11px;
          min-width: 45px;
        }

        /* ── Top-right: Wallet ────────────────────── */
        #hud-wallet {
          position: absolute;
          top: 10px;
          right: 10px;
          background: #00000080;
          border: 1px solid #ffffff30;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 10px;
          color: #9ca3af;
          letter-spacing: 0.5px;
        }
      </style>

      <div id="hud-root">
        <!-- Energy -->
        <div id="hud-energy">
          <div id="hud-energy-label">Energy</div>
          <div id="hud-energy-bar-bg">
            <div id="hud-energy-fill" style="width:100%"></div>
          </div>
          <div id="hud-energy-text">100 / 100</div>
        </div>

        <!-- Currency -->
        <div id="hud-currency">
          <div class="hud-currency-row">
            <span class="hud-currency-icon">🪙</span>
            <span class="hud-currency-val" id="hud-silver">0</span>
            <span style="font-size:9px;color:#9ca3af">Silver</span>
          </div>
          <div class="hud-currency-row">
            <span class="hud-currency-icon">🌸</span>
            <span class="hud-currency-val" id="hud-petal">0</span>
            <span style="font-size:9px;color:#f9a8d4">$PETAL</span>
          </div>
        </div>

        <!-- Wallet -->
        <div id="hud-wallet" id="hud-wallet-text">Not connected</div>
      </div>
    `;

    // Grab references
    this.energyFill = document.getElementById('hud-energy-fill')!;
    this.energyText = document.getElementById('hud-energy-text')!;
    this.silverText = document.getElementById('hud-silver')!;
    this.petalText = document.getElementById('hud-petal')!;
    this.walletText = document.getElementById('hud-wallet')!;
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  private render(): void {
    const pct = (this.state.energy / this.state.maxEnergy) * 100;
    this.energyFill.style.width = `${pct}%`;

    // Color shifts: green → yellow → red as energy drops
    if (pct > 60) {
      this.energyFill.style.background = 'linear-gradient(90deg, #16a34a, #4ade80)';
    } else if (pct > 30) {
      this.energyFill.style.background = 'linear-gradient(90deg, #b45309, #fbbf24)';
    } else {
      this.energyFill.style.background = 'linear-gradient(90deg, #991b1b, #ef4444)';
    }

    this.energyText.textContent = `${this.state.energy} / ${this.state.maxEnergy}`;
    this.silverText.textContent = this.formatNumber(this.state.silver);
    this.petalText.textContent = this.formatNumber(this.state.petal);

    if (this.state.walletAddress) {
      const addr = this.state.walletAddress;
      this.walletText.textContent =
        addr.length > 12 ? `${addr.slice(0, 4)}...${addr.slice(-4)}` : addr;
      this.walletText.style.color = '#4ade80';
    }
  }

  // ── Public Setters ────────────────────────────────────────────────────────────

  setEnergy(energy: number, maxEnergy: number): void {
    this.state.energy = energy;
    this.state.maxEnergy = maxEnergy;
    this.render();
  }

  setSilver(silver: number): void {
    this.state.silver = silver;
    this.silverText.textContent = this.formatNumber(silver);
  }

  setPetal(petal: number): void {
    this.state.petal = petal;
    this.petalText.textContent = this.formatNumber(petal);
  }

  setWalletAddress(address: string): void {
    this.state.walletAddress = address;
    this.render();
  }

  // ── Lifecycle ─────────────────────────────────────────────────────────────────

  destroy(): void {
    this.container.innerHTML = '';
  }

  // ── Helpers ───────────────────────────────────────────────────────────────────

  private formatNumber(n: number): string {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
    return n.toString();
  }
}
