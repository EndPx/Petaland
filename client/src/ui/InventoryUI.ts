/**
 * InventoryUI — DOM-based inventory panel stub.
 *
 * TODO: Full implementation:
 *   - Grid of item slots (8 cols × 4 rows = 32 slots)
 *   - Drag & drop items
 *   - Right-click context menu (use, drop, equip)
 *   - Item tooltips on hover
 *   - Tabs: All / Resources / Seeds / Food / Blueprints
 *   - Sync with Colyseus server inventory state
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
        #inv-container {
          background: #1a1a2e;
          border: 2px solid #4ade80;
          border-radius: 6px;
          padding: 10px;
          min-width: 320px;
          font-family: 'Courier New', monospace;
          color: #ffffff;
          box-shadow: 0 0 20px #4ade8040;
        }
        #inv-title {
          text-align: center;
          font-size: 14px;
          color: #4ade80;
          font-weight: bold;
          letter-spacing: 2px;
          margin-bottom: 8px;
          border-bottom: 1px solid #4ade8040;
          padding-bottom: 6px;
        }
        #inv-close {
          float: right;
          cursor: pointer;
          color: #9ca3af;
          font-size: 16px;
          line-height: 1;
          pointer-events: all;
        }
        #inv-close:hover { color: #ef4444; }

        #inv-tabs {
          display: flex;
          gap: 4px;
          margin-bottom: 8px;
        }
        .inv-tab {
          background: #111827;
          border: 1px solid #374151;
          color: #6b7280;
          padding: 3px 8px;
          font-size: 10px;
          font-family: 'Courier New', monospace;
          cursor: pointer;
          border-radius: 3px;
          pointer-events: all;
        }
        .inv-tab.active, .inv-tab:hover {
          background: #065f46;
          border-color: #4ade80;
          color: #4ade80;
        }

        #inv-grid {
          display: grid;
          grid-template-columns: repeat(8, 36px);
          gap: 3px;
        }
        .inv-slot {
          width: 36px;
          height: 36px;
          background: #111827;
          border: 1px solid #374151;
          border-radius: 3px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          position: relative;
          cursor: pointer;
          pointer-events: all;
          transition: border-color 0.1s;
        }
        .inv-slot:hover {
          border-color: #4ade80;
          background: #1e3a2e;
        }
        .inv-slot.occupied {
          border-color: #374151;
        }
        .inv-slot-qty {
          position: absolute;
          bottom: 1px;
          right: 3px;
          font-size: 9px;
          color: #ffffff;
          font-family: 'Courier New', monospace;
          text-shadow: 1px 1px 0 #000;
        }

        #inv-footer {
          margin-top: 8px;
          font-size: 10px;
          color: #4b5563;
          text-align: center;
        }
      </style>

      <div id="inv-container">
        <div id="inv-title">
          <span id="inv-close" onclick="document.getElementById('inventory-panel').style.display='none'">✕</span>
          INVENTORY
        </div>
        <div id="inv-tabs">
          <button class="inv-tab active" data-tab="all">All</button>
          <button class="inv-tab" data-tab="resources">Resources</button>
          <button class="inv-tab" data-tab="seeds">Seeds</button>
          <button class="inv-tab" data-tab="food">Food</button>
          <button class="inv-tab" data-tab="blueprints">Blueprints</button>
        </div>
        <div id="inv-grid"></div>
        <div id="inv-footer">Press I to close  •  0 / 32 slots used</div>
      </div>
    `;

    this.renderGrid();
    this.bindTabEvents();
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
          <div class="inv-slot occupied" title="${item.type} ×${item.quantity}">
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
    const footer = document.getElementById('inv-footer');
    if (footer) {
      footer.textContent = `Press I to close  •  ${this.items.length} / ${InventoryUI.SLOT_COUNT} slots used`;
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
      [ItemType.Wood]: '🪵',
      [ItemType.Stone]: '🪨',
      [ItemType.Carrot]: '🥕',
      [ItemType.Wheat]: '🌾',
      [ItemType.CarrotSeed]: '🌱',
      [ItemType.WheatSeed]: '🌱',
      [ItemType.Bread]: '🍞',
      [ItemType.CarrotSoup]: '🥣',
      [ItemType.Silver]: '🪙',
      [ItemType.Petal]: '🌸',
    };
    return map[type] ?? '📦';
  }

  private getItemCategory(type: ItemType): string {
    if ([ItemType.Wood, ItemType.Stone].includes(type)) return 'resources';
    if ([ItemType.CarrotSeed, ItemType.WheatSeed].includes(type)) return 'seeds';
    if ([ItemType.Bread, ItemType.CarrotSoup].includes(type)) return 'food';
    return 'resources';
  }
}
