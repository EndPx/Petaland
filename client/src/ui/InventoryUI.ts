/**
 * InventoryUI — NomStead-style inventory panel.
 *
 * Design: warm white panel, rounded corners, soft shadows.
 * Centered modal with translucent backdrop.
 * Grid of item slots (8 cols x 4 rows = 32 slots).
 * Tabs: All / Resources / Seeds / Food
 */

import { InventoryItem, ItemType } from '../types/index';

export class InventoryUI {
  private panel: HTMLElement;
  private items: InventoryItem[] = [];
  private isVisible = false;

  private static SLOT_COUNT = 32;
  private static COLS = 8;

  constructor() {
    const el = document.getElementById('inventory-panel');
    if (!el) throw new Error('InventoryUI: #inventory-panel element not found');
    this.panel = el;
    this.buildDOM();
  }

  // ── DOM Construction ─────────────────────────────────────────────────────────

  private buildDOM(): void {
    this.panel.innerHTML = `
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800&display=swap');

        #inv-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(60, 40, 20, 0.25);
          backdrop-filter: blur(2px);
          -webkit-backdrop-filter: blur(2px);
          z-index: 19;
        }

        #inv-container {
          position: relative;
          z-index: 20;
          background: #fffdf8;
          border-radius: 16px;
          padding: 20px 24px 16px;
          min-width: 380px;
          font-family: 'Nunito', sans-serif;
          color: #4a3828;
          box-shadow:
            0 12px 40px rgba(100, 60, 20, 0.2),
            0 4px 12px rgba(100, 60, 20, 0.1),
            inset 0 1px 0 rgba(255, 255, 255, 0.8);
          border: 1px solid rgba(180, 150, 120, 0.15);
        }

        /* Header */
        #inv-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 14px;
          padding-bottom: 10px;
          border-bottom: 1px solid rgba(180, 150, 120, 0.12);
        }
        #inv-title {
          font-size: 16px;
          font-weight: 800;
          color: #4a3828;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        #inv-title-icon {
          font-size: 20px;
        }
        #inv-close {
          width: 28px;
          height: 28px;
          border-radius: 8px;
          background: #f5ece0;
          border: 1px solid rgba(180, 150, 120, 0.12);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-size: 14px;
          color: #9a8672;
          transition: all 0.15s ease;
          pointer-events: all;
          font-family: 'Nunito', sans-serif;
          font-weight: 700;
          line-height: 1;
        }
        #inv-close:hover {
          background: #f0e0d0;
          color: #d45050;
          transform: scale(1.05);
        }

        /* Tabs */
        #inv-tabs {
          display: flex;
          gap: 4px;
          margin-bottom: 12px;
          background: #f5ece0;
          border-radius: 8px;
          padding: 3px;
        }
        .inv-tab {
          background: transparent;
          border: none;
          color: #9a8672;
          padding: 5px 12px;
          font-size: 12px;
          font-weight: 600;
          font-family: 'Nunito', sans-serif;
          cursor: pointer;
          border-radius: 6px;
          pointer-events: all;
          transition: all 0.15s ease;
        }
        .inv-tab:hover {
          color: #6b5540;
          background: rgba(255, 255, 255, 0.5);
        }
        .inv-tab.active {
          background: #fffdf8;
          color: #6b9e3e;
          font-weight: 700;
          box-shadow: 0 1px 4px rgba(100, 60, 20, 0.08);
        }

        /* Grid */
        #inv-grid {
          display: grid;
          grid-template-columns: repeat(8, 1fr);
          gap: 4px;
        }
        .inv-slot {
          aspect-ratio: 1;
          background: #f5ece0;
          border: 2px solid transparent;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          position: relative;
          cursor: pointer;
          pointer-events: all;
          transition: all 0.12s ease;
        }
        .inv-slot:hover {
          background: #ece2d4;
          border-color: #c0a882;
          transform: scale(1.04);
        }
        .inv-slot.occupied {
          background: #f0e8d8;
          border-color: rgba(180, 150, 120, 0.2);
        }
        .inv-slot.occupied:hover {
          border-color: #6b9e3e;
          background: #eef5e8;
        }
        .inv-slot-qty {
          position: absolute;
          bottom: 1px;
          right: 4px;
          font-size: 10px;
          font-weight: 700;
          color: #6b5540;
          font-family: 'Nunito', sans-serif;
        }

        /* Footer */
        #inv-footer {
          margin-top: 10px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 11px;
          color: #b0a090;
          font-weight: 600;
        }
        #inv-footer-hint {
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .inv-key-hint {
          background: #f0e8dc;
          border: 1px solid rgba(180, 150, 120, 0.15);
          border-radius: 4px;
          padding: 1px 5px;
          font-size: 10px;
          font-weight: 700;
          color: #9a8672;
        }
      </style>

      <div id="inv-backdrop"></div>
      <div id="inv-container">
        <div id="inv-header">
          <div id="inv-title">
            <span id="inv-title-icon">&#127890;</span>
            Inventory
          </div>
          <button id="inv-close">&times;</button>
        </div>
        <div id="inv-tabs">
          <button class="inv-tab active" data-tab="all">All</button>
          <button class="inv-tab" data-tab="resources">Resources</button>
          <button class="inv-tab" data-tab="seeds">Seeds</button>
          <button class="inv-tab" data-tab="food">Food</button>
        </div>
        <div id="inv-grid"></div>
        <div id="inv-footer">
          <div id="inv-footer-hint">
            Press <span class="inv-key-hint">I</span> to close
          </div>
          <div id="inv-footer-count">0 / 32 slots</div>
        </div>
      </div>
    `;

    this.renderGrid();
    this.bindTabEvents();
    this.bindCloseEvents();
  }

  // ── Grid Rendering ────────────────────────────────────────────────────────────

  private renderGrid(filter?: string): void {
    const grid = document.getElementById('inv-grid');
    if (!grid) return;

    const filteredItems = filter && filter !== 'all'
      ? this.items.filter(item => this.getItemCategory(item.type) === filter)
      : this.items;

    const slots: string[] = [];
    for (let i = 0; i < InventoryUI.SLOT_COUNT; i++) {
      const item = filteredItems[i];
      if (item) {
        slots.push(`
          <div class="inv-slot occupied" title="${item.type} x${item.quantity}">
            <span>${this.getItemEmoji(item.type)}</span>
            ${item.quantity > 1 ? `<span class="inv-slot-qty">${item.quantity}</span>` : ''}
          </div>
        `);
      } else {
        slots.push(`<div class="inv-slot"></div>`);
      }
    }
    grid.innerHTML = slots.join('');

    // Update footer count
    const footer = document.getElementById('inv-footer-count');
    if (footer) {
      footer.textContent = `${this.items.length} / ${InventoryUI.SLOT_COUNT} slots`;
    }
  }

  // ── Tab Events ────────────────────────────────────────────────────────────────

  private bindTabEvents(): void {
    const tabs = document.querySelectorAll('.inv-tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        const filter = (tab as HTMLElement).dataset['tab'];
        this.renderGrid(filter);
      });
    });
  }

  private bindCloseEvents(): void {
    const closeBtn = document.getElementById('inv-close');
    const backdrop = document.getElementById('inv-backdrop');
    const hidePanel = () => {
      this.panel.style.display = 'none';
      this.isVisible = false;
    };
    closeBtn?.addEventListener('click', hidePanel);
    backdrop?.addEventListener('click', hidePanel);
  }

  // ── Public API ────────────────────────────────────────────────────────────────

  setItems(items: InventoryItem[]): void {
    this.items = [...items];
    this.renderGrid();
  }

  addItem(type: ItemType, quantity = 1): void {
    const existing = this.items.find(i => i.type === type);
    if (existing) {
      existing.quantity += quantity;
    } else {
      this.items.push({ type, quantity });
    }
    this.renderGrid();
  }

  removeItem(type: ItemType, quantity = 1): boolean {
    const existing = this.items.find(i => i.type === type);
    if (!existing || existing.quantity < quantity) return false;
    existing.quantity -= quantity;
    if (existing.quantity <= 0) {
      this.items = this.items.filter(i => i.type !== type);
    }
    this.renderGrid();
    return true;
  }

  show(): void {
    this.panel.style.display = 'block';
    this.isVisible = true;
  }

  hide(): void {
    this.panel.style.display = 'none';
    this.isVisible = false;
  }

  toggle(): void {
    this.isVisible ? this.hide() : this.show();
  }

  // ── Helpers ───────────────────────────────────────────────────────────────────

  private getItemEmoji(type: ItemType): string {
    const map: Partial<Record<ItemType, string>> = {
      [ItemType.Wood]: '\u{1FAB5}',
      [ItemType.Stone]: '\u{1FAA8}',
      [ItemType.Carrot]: '\u{1F955}',
      [ItemType.Wheat]: '\u{1F33E}',
      [ItemType.CarrotSeed]: '\u{1F331}',
      [ItemType.WheatSeed]: '\u{1F331}',
      [ItemType.Bread]: '\u{1F35E}',
      [ItemType.CarrotSoup]: '\u{1F963}',
      [ItemType.Silver]: '\u{1FA99}',
      [ItemType.Petal]: '\u{1F338}',
    };
    return map[type] ?? '\u{1F4E6}';
  }

  private getItemCategory(type: ItemType): string {
    if ([ItemType.Wood, ItemType.Stone].includes(type)) return 'resources';
    if ([ItemType.CarrotSeed, ItemType.WheatSeed].includes(type)) return 'seeds';
    if ([ItemType.Bread, ItemType.CarrotSoup].includes(type)) return 'food';
    return 'resources';
  }
}
