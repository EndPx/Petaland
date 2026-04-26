/**
 * HUD — NomStead-style DOM overlay rendered on top of the Phaser canvas.
 *
 * Design: warm white panels, rounded corners, soft shadows.
 * Layout:
 *   - Top-left:  Level badge + XP bar + Energy bar
 *   - Top-right: Silver & $PETAL currency pills
 *   - Left:      Sidebar icon buttons (inventory, map, settings)
 *   - Bottom:    Action toolbar with 6 slots
 */

export interface HUDState {
  energy: number;
  maxEnergy: number;
  silver: number;
  petal: number;
  level?: number;
  xp?: number;
  walletAddress?: string;
}

export class HUD {
  private container: HTMLElement;
  private energyFill!: HTMLElement;
  private energyText!: HTMLElement;
  private silverText!: HTMLElement;
  private petalText!: HTMLElement;
  private walletDot!: HTMLElement;
  private levelText!: HTMLElement;
  private xpFill!: HTMLElement;

  private state: HUDState;

  constructor(_game: Phaser.Game, initialState: HUDState) {
    this.state = { ...initialState, level: initialState.level ?? 1, xp: initialState.xp ?? 0 };

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
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800&display=swap');

        #hud-root {
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          pointer-events: none;
          font-family: 'Nunito', sans-serif;
          font-size: 13px;
          color: #4a3828;
          user-select: none;
          -webkit-user-select: none;
        }

        /* ── Shared panel style ─────────────────── */
        .hud-panel {
          background: #fffdf8;
          border-radius: 12px;
          box-shadow:
            0 2px 12px rgba(100, 60, 20, 0.12),
            0 1px 3px rgba(100, 60, 20, 0.08),
            inset 0 1px 0 rgba(255, 255, 255, 0.8);
          border: 1px solid rgba(180, 150, 120, 0.15);
        }

        /* ─── Top-Left: Player Info ──────────────── */
        #hud-player-info {
          position: absolute;
          top: 16px;
          left: 16px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          min-width: 180px;
        }

        /* Level badge row */
        #hud-level-row {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 14px 8px 8px;
        }
        #hud-level-badge {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: linear-gradient(135deg, #6b9e3e, #8bc34a);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 18px;
          color: #fff;
          text-shadow: 0 1px 2px rgba(0,0,0,0.2);
          box-shadow:
            0 2px 6px rgba(90, 130, 50, 0.3),
            inset 0 1px 0 rgba(255,255,255,0.3);
          flex-shrink: 0;
        }
        #hud-level-info {
          display: flex;
          flex-direction: column;
          gap: 3px;
          flex: 1;
          min-width: 0;
        }
        #hud-level-label {
          font-size: 11px;
          font-weight: 700;
          color: #6b9e3e;
          letter-spacing: 0.5px;
          text-transform: uppercase;
        }
        #hud-xp-bar-bg {
          width: 100%;
          height: 6px;
          background: #f0e8dc;
          border-radius: 3px;
          overflow: hidden;
        }
        #hud-xp-fill {
          height: 100%;
          background: linear-gradient(90deg, #f0b840, #f5d060);
          border-radius: 3px;
          transition: width 0.4s ease;
          width: 0%;
        }

        /* Energy bar */
        #hud-energy-panel {
          padding: 8px 12px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        #hud-energy-icon {
          font-size: 16px;
          flex-shrink: 0;
        }
        #hud-energy-bar-wrap {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        #hud-energy-bar-bg {
          width: 100%;
          height: 10px;
          background: #f5ece0;
          border-radius: 5px;
          overflow: hidden;
          box-shadow: inset 0 1px 3px rgba(0,0,0,0.06);
        }
        #hud-energy-fill {
          height: 100%;
          background: linear-gradient(90deg, #e8536a, #f47b8c);
          border-radius: 5px;
          transition: width 0.3s ease;
          box-shadow: 0 0 8px rgba(232, 83, 106, 0.25);
        }
        #hud-energy-text {
          font-size: 10px;
          font-weight: 600;
          color: #9a8672;
          text-align: right;
        }

        /* ─── Top-Right: Currency ────────────────── */
        #hud-currency {
          position: absolute;
          top: 16px;
          right: 16px;
          display: flex;
          flex-direction: column;
          gap: 6px;
          align-items: flex-end;
        }
        .hud-currency-pill {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 14px 6px 10px;
          min-width: 100px;
        }
        .hud-currency-icon {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 13px;
          flex-shrink: 0;
        }
        .hud-coin-icon {
          background: linear-gradient(135deg, #f0c040, #d4a43a);
          box-shadow: 0 1px 4px rgba(200, 160, 50, 0.3);
        }
        .hud-petal-icon {
          background: linear-gradient(135deg, #f0a0c0, #d4739a);
          box-shadow: 0 1px 4px rgba(200, 100, 140, 0.3);
        }
        .hud-currency-val {
          font-size: 15px;
          font-weight: 700;
          color: #4a3828;
          min-width: 40px;
          text-align: right;
        }
        .hud-currency-label {
          font-size: 10px;
          font-weight: 600;
          color: #9a8672;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        /* ─── Left Sidebar: Icon Buttons ─────────── */
        #hud-sidebar {
          position: absolute;
          left: 16px;
          top: 50%;
          transform: translateY(-50%);
          display: flex;
          flex-direction: column;
          gap: 6px;
          padding: 8px;
        }
        .hud-sidebar-btn {
          width: 42px;
          height: 42px;
          border-radius: 10px;
          background: #fffdf8;
          border: 1px solid rgba(180, 150, 120, 0.12);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          cursor: pointer;
          pointer-events: all;
          transition: all 0.15s ease;
          box-shadow: 0 1px 4px rgba(100, 60, 20, 0.08);
          position: relative;
        }
        .hud-sidebar-btn:hover {
          background: #f5efe5;
          transform: scale(1.08);
          box-shadow: 0 3px 10px rgba(100, 60, 20, 0.14);
        }
        .hud-sidebar-btn:active {
          transform: scale(0.96);
        }
        .hud-sidebar-btn .btn-tooltip {
          position: absolute;
          left: 52px;
          top: 50%;
          transform: translateY(-50%);
          background: #4a3828;
          color: #fffdf8;
          font-size: 11px;
          font-weight: 600;
          padding: 4px 10px;
          border-radius: 6px;
          white-space: nowrap;
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.15s ease;
        }
        .hud-sidebar-btn:hover .btn-tooltip {
          opacity: 1;
        }

        /* ─── Bottom: Action Bar ─────────────────── */
        #hud-actionbar {
          position: absolute;
          bottom: 16px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 8px 12px;
        }
        .hud-action-slot {
          width: 48px;
          height: 48px;
          border-radius: 10px;
          background: #f5ece0;
          border: 2px solid rgba(180, 150, 120, 0.15);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 22px;
          cursor: pointer;
          pointer-events: all;
          transition: all 0.15s ease;
          position: relative;
        }
        .hud-action-slot:hover {
          background: #ece2d4;
          border-color: #c0a882;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(100, 60, 20, 0.15);
        }
        .hud-action-slot:active {
          transform: translateY(0);
        }
        .hud-action-slot.active {
          border-color: #6b9e3e;
          background: #eef5e8;
          box-shadow: 0 0 0 2px rgba(107, 158, 62, 0.2);
        }
        .hud-slot-key {
          position: absolute;
          top: 2px;
          right: 4px;
          font-size: 9px;
          font-weight: 700;
          color: #b0a090;
        }

        /* ─── Bottom-right: Wallet Status ────────── */
        #hud-wallet {
          position: absolute;
          bottom: 16px;
          right: 16px;
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          font-size: 11px;
          font-weight: 600;
          color: #9a8672;
        }
        #hud-wallet-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #ccc;
          transition: background 0.3s ease;
        }
        #hud-wallet-dot.connected {
          background: #6b9e3e;
          box-shadow: 0 0 6px rgba(107, 158, 62, 0.4);
        }
      </style>

      <div id="hud-root">
        <!-- ── Top-Left: Level + Energy ── -->
        <div id="hud-player-info">
          <div id="hud-level-row" class="hud-panel">
            <div id="hud-level-badge">
              <span id="hud-level-text">1</span>
            </div>
            <div id="hud-level-info">
              <div id="hud-level-label">Level 1</div>
              <div id="hud-xp-bar-bg">
                <div id="hud-xp-fill"></div>
              </div>
            </div>
          </div>

          <div id="hud-energy-panel" class="hud-panel">
            <div id="hud-energy-icon">&#10084;&#65039;</div>
            <div id="hud-energy-bar-wrap">
              <div id="hud-energy-bar-bg">
                <div id="hud-energy-fill" style="width:100%"></div>
              </div>
              <div id="hud-energy-text">100 / 100</div>
            </div>
          </div>
        </div>

        <!-- ── Top-Right: Currency ── -->
        <div id="hud-currency">
          <div class="hud-currency-pill hud-panel">
            <div class="hud-currency-icon hud-coin-icon">&#9679;</div>
            <div>
              <div class="hud-currency-val" id="hud-silver">0</div>
              <div class="hud-currency-label">Silver</div>
            </div>
          </div>
          <div class="hud-currency-pill hud-panel">
            <div class="hud-currency-icon hud-petal-icon">&#10047;</div>
            <div>
              <div class="hud-currency-val" id="hud-petal">0</div>
              <div class="hud-currency-label">$Petal</div>
            </div>
          </div>
        </div>

        <!-- ── Left Sidebar: Icon Buttons ── -->
        <div id="hud-sidebar" class="hud-panel">
          <div class="hud-sidebar-btn" data-action="inventory" title="Inventory">
            &#127890;
            <span class="btn-tooltip">Inventory (I)</span>
          </div>
          <div class="hud-sidebar-btn" data-action="map" title="Map">
            &#128506;
            <span class="btn-tooltip">Map (M)</span>
          </div>
          <div class="hud-sidebar-btn" data-action="quests" title="Quests">
            &#128220;
            <span class="btn-tooltip">Quests (Q)</span>
          </div>
          <div class="hud-sidebar-btn" data-action="settings" title="Settings">
            &#9881;&#65039;
            <span class="btn-tooltip">Settings</span>
          </div>
        </div>

        <!-- ── Bottom: Action Bar ── -->
        <div id="hud-actionbar" class="hud-panel">
          <div class="hud-action-slot active" data-slot="0">
            &#9995;
            <span class="hud-slot-key">1</span>
          </div>
          <div class="hud-action-slot" data-slot="1">
            &#129683;
            <span class="hud-slot-key">2</span>
          </div>
          <div class="hud-action-slot" data-slot="2">
            &#128166;
            <span class="hud-slot-key">3</span>
          </div>
          <div class="hud-action-slot" data-slot="3">
            &#129704;
            <span class="hud-slot-key">4</span>
          </div>
          <div class="hud-action-slot" data-slot="4">
            &#127793;
            <span class="hud-slot-key">5</span>
          </div>
          <div class="hud-action-slot" data-slot="5">
            <span class="hud-slot-key">6</span>
          </div>
        </div>

        <!-- ── Bottom-Right: Wallet ── -->
        <div id="hud-wallet" class="hud-panel">
          <div id="hud-wallet-dot"></div>
          <span id="hud-wallet-text">Not connected</span>
        </div>
      </div>
    `;

    // Grab references
    this.energyFill = document.getElementById('hud-energy-fill')!;
    this.energyText = document.getElementById('hud-energy-text')!;
    this.silverText = document.getElementById('hud-silver')!;
    this.petalText = document.getElementById('hud-petal')!;
    this.walletDot = document.getElementById('hud-wallet-dot')!;
    this.levelText = document.getElementById('hud-level-text')!;
    this.xpFill = document.getElementById('hud-xp-fill')!;

    // Bind sidebar buttons
    this.bindSidebarEvents();
    // Bind action bar slot selection
    this.bindActionBarEvents();
  }

  // ── Event Binding ───────────────────────────────────────────────────────────

  private bindSidebarEvents(): void {
    const btns = document.querySelectorAll('.hud-sidebar-btn');
    btns.forEach(btn => {
      btn.addEventListener('click', () => {
        const action = (btn as HTMLElement).dataset['action'];
        if (action === 'inventory') {
          const panel = document.getElementById('inventory-panel');
          if (panel) {
            const vis = panel.style.display !== 'none' && panel.style.display !== '';
            panel.style.display = vis ? 'none' : 'block';
          }
        }
        // map, quests, settings — future stubs
      });
    });
  }

  private bindActionBarEvents(): void {
    const slots = document.querySelectorAll('.hud-action-slot');
    slots.forEach(slot => {
      slot.addEventListener('click', () => {
        slots.forEach(s => s.classList.remove('active'));
        slot.classList.add('active');
      });
    });
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  private render(): void {
    const pct = (this.state.energy / this.state.maxEnergy) * 100;
    this.energyFill.style.width = `${pct}%`;

    // Energy bar color: rose → amber → red as it drops
    if (pct > 60) {
      this.energyFill.style.background = 'linear-gradient(90deg, #e8536a, #f47b8c)';
    } else if (pct > 30) {
      this.energyFill.style.background = 'linear-gradient(90deg, #e8a030, #f0c050)';
    } else {
      this.energyFill.style.background = 'linear-gradient(90deg, #d43030, #e85050)';
    }

    this.energyText.textContent = `${this.state.energy} / ${this.state.maxEnergy}`;
    this.silverText.textContent = this.formatNumber(this.state.silver);
    this.petalText.textContent = this.formatNumber(this.state.petal);

    // Level
    const lvl = this.state.level ?? 1;
    this.levelText.textContent = lvl.toString();
    const labelEl = document.getElementById('hud-level-label');
    if (labelEl) labelEl.textContent = `Level ${lvl}`;

    // XP bar (simple demo: xp out of level*100)
    const xpMax = lvl * 100;
    const xpPct = Math.min(((this.state.xp ?? 0) / xpMax) * 100, 100);
    this.xpFill.style.width = `${xpPct}%`;

    // Wallet
    if (this.state.walletAddress) {
      const addr = this.state.walletAddress;
      const walletTextEl = document.getElementById('hud-wallet-text');
      if (walletTextEl) {
        walletTextEl.textContent =
          addr.length > 12 ? `${addr.slice(0, 4)}...${addr.slice(-4)}` : addr;
      }
      this.walletDot.classList.add('connected');
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

  setLevel(level: number, xp: number): void {
    this.state.level = level;
    this.state.xp = xp;
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
