/**
 * InventoryUI.test.ts — RED phase tests for InventoryUI DOM panel.
 *
 * InventoryUI manipulates real DOM elements.  jsdom provides the environment.
 * We create the required #inventory-panel element before each test.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { InventoryUI } from '../ui/InventoryUI';
import { ItemType } from '../types/index';

// ── Phaser mock (InventoryUI does not use Phaser directly) ───────────────────
vi.mock('phaser', () => ({ default: {} }));

// ── Helpers ───────────────────────────────────────────────────────────────────

function createPanel(): HTMLElement {
  const el = document.createElement('div');
  el.id = 'inventory-panel';
  document.body.appendChild(el);
  return el;
}

function removePanel(): void {
  const el = document.getElementById('inventory-panel');
  if (el) el.remove();
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('InventoryUI — construction', () => {
  beforeEach(() => createPanel());
  afterEach(() => removePanel());

  it('constructs without throwing when #inventory-panel exists', () => {
    expect(() => new InventoryUI()).not.toThrow();
  });

  it('throws when #inventory-panel is missing', () => {
    removePanel();
    expect(() => new InventoryUI()).toThrow('InventoryUI: #inventory-panel element not found');
  });

  it('renders exactly 32 inventory slots (8 cols × 4 rows)', () => {
    new InventoryUI();
    const slots = document.querySelectorAll('.inv-slot');
    expect(slots).toHaveLength(32);
  });

  it('renders 5 tab buttons (All, Resources, Seeds, Food, Blueprints)', () => {
    new InventoryUI();
    const tabs = document.querySelectorAll('.inv-tab');
    expect(tabs).toHaveLength(5);
  });

  it('"All" tab is active by default', () => {
    new InventoryUI();
    const activeTab = document.querySelector('.inv-tab.active') as HTMLElement;
    expect(activeTab?.dataset['tab']).toBe('all');
  });

  it('footer shows "0 / 32 slots used" on init', () => {
    new InventoryUI();
    const footer = document.getElementById('inv-footer');
    expect(footer?.textContent).toContain('0 / 32 slots used');
  });
});

describe('InventoryUI — addItem()', () => {
  let inv: InventoryUI;

  beforeEach(() => {
    createPanel();
    inv = new InventoryUI();
  });

  afterEach(() => removePanel());

  it('adds a new item type to the inventory', () => {
    inv.addItem(ItemType.Wood, 5);
    const footer = document.getElementById('inv-footer');
    expect(footer?.textContent).toContain('1 / 32 slots used');
  });

  it('stacks quantity when adding same item type twice', () => {
    inv.addItem(ItemType.Wood, 5);
    inv.addItem(ItemType.Wood, 3);
    // Still 1 unique item type (stacked)
    const footer = document.getElementById('inv-footer');
    expect(footer?.textContent).toContain('1 / 32 slots used');
  });

  it('adds two different item types as separate entries', () => {
    inv.addItem(ItemType.Wood, 1);
    inv.addItem(ItemType.Stone, 1);
    const footer = document.getElementById('inv-footer');
    expect(footer?.textContent).toContain('2 / 32 slots used');
  });

  it('shows quantity badge when item quantity > 1', () => {
    inv.addItem(ItemType.Carrot, 5);
    const qtyEl = document.querySelector('.inv-slot-qty');
    expect(qtyEl?.textContent).toBe('5');
  });

  it('does NOT show quantity badge when item quantity is 1', () => {
    inv.addItem(ItemType.Stone, 1);
    const qtyEl = document.querySelector('.inv-slot-qty');
    expect(qtyEl).toBeNull();
  });

  it('defaults quantity to 1 when no quantity arg given', () => {
    inv.addItem(ItemType.Wheat);
    const footer = document.getElementById('inv-footer');
    expect(footer?.textContent).toContain('1 / 32 slots used');
    // No badge since qty = 1
    expect(document.querySelector('.inv-slot-qty')).toBeNull();
  });

  it('marks occupied slot with "occupied" class', () => {
    inv.addItem(ItemType.Wood, 2);
    const occupied = document.querySelectorAll('.inv-slot.occupied');
    expect(occupied).toHaveLength(1);
  });
});

describe('InventoryUI — removeItem()', () => {
  let inv: InventoryUI;

  beforeEach(() => {
    createPanel();
    inv = new InventoryUI();
  });

  afterEach(() => removePanel());

  it('returns true when item exists and quantity is sufficient', () => {
    inv.addItem(ItemType.Wood, 10);
    expect(inv.removeItem(ItemType.Wood, 5)).toBe(true);
  });

  it('returns false when item does not exist', () => {
    expect(inv.removeItem(ItemType.Wood, 1)).toBe(false);
  });

  it('returns false when removing more than available quantity', () => {
    inv.addItem(ItemType.Stone, 3);
    expect(inv.removeItem(ItemType.Stone, 5)).toBe(false);
  });

  it('reduces quantity correctly after partial removal', () => {
    inv.addItem(ItemType.Carrot, 10);
    inv.removeItem(ItemType.Carrot, 4);
    const qtyEl = document.querySelector('.inv-slot-qty');
    expect(qtyEl?.textContent).toBe('6');
  });

  it('removes item completely when removing all quantity', () => {
    inv.addItem(ItemType.Wood, 3);
    inv.removeItem(ItemType.Wood, 3);
    const footer = document.getElementById('inv-footer');
    expect(footer?.textContent).toContain('0 / 32 slots used');
  });

  it('removes item when reducing to exactly 0', () => {
    inv.addItem(ItemType.Stone, 1);
    inv.removeItem(ItemType.Stone, 1);
    const occupied = document.querySelectorAll('.inv-slot.occupied');
    expect(occupied).toHaveLength(0);
  });

  it('does not affect other items when removing one', () => {
    inv.addItem(ItemType.Wood, 5);
    inv.addItem(ItemType.Stone, 3);
    inv.removeItem(ItemType.Wood, 5);
    const footer = document.getElementById('inv-footer');
    expect(footer?.textContent).toContain('1 / 32 slots used');
  });
});

describe('InventoryUI — setItems()', () => {
  let inv: InventoryUI;

  beforeEach(() => {
    createPanel();
    inv = new InventoryUI();
  });

  afterEach(() => removePanel());

  it('replaces all items with new list', () => {
    inv.addItem(ItemType.Wood, 5);
    inv.setItems([{ type: ItemType.Stone, quantity: 2 }]);
    const footer = document.getElementById('inv-footer');
    expect(footer?.textContent).toContain('1 / 32 slots used');
  });

  it('clears all items when given empty array', () => {
    inv.addItem(ItemType.Wood, 5);
    inv.setItems([]);
    const footer = document.getElementById('inv-footer');
    expect(footer?.textContent).toContain('0 / 32 slots used');
  });

  it('renders multiple items correctly', () => {
    inv.setItems([
      { type: ItemType.Wood, quantity: 3 },
      { type: ItemType.Carrot, quantity: 1 },
      { type: ItemType.Wheat, quantity: 7 },
    ]);
    const footer = document.getElementById('inv-footer');
    expect(footer?.textContent).toContain('3 / 32 slots used');
  });
});

describe('InventoryUI — slot count', () => {
  beforeEach(() => createPanel());
  afterEach(() => removePanel());

  it('always renders exactly 32 slots regardless of item count', () => {
    const inv = new InventoryUI();
    // Add 5 items
    inv.addItem(ItemType.Wood, 1);
    inv.addItem(ItemType.Stone, 1);
    inv.addItem(ItemType.Carrot, 1);
    inv.addItem(ItemType.Wheat, 1);
    inv.addItem(ItemType.Bread, 1);
    const slots = document.querySelectorAll('.inv-slot');
    expect(slots).toHaveLength(32);
  });

  it('renders 32 slots even when empty', () => {
    new InventoryUI();
    const slots = document.querySelectorAll('.inv-slot');
    expect(slots).toHaveLength(32);
  });
});

describe('InventoryUI — tab filtering', () => {
  let inv: InventoryUI;

  beforeEach(() => {
    createPanel();
    inv = new InventoryUI();
    // Populate with different item categories
    inv.addItem(ItemType.Wood, 3);       // resources
    inv.addItem(ItemType.Stone, 2);      // resources
    inv.addItem(ItemType.CarrotSeed, 5); // seeds
    inv.addItem(ItemType.WheatSeed, 4);  // seeds
    inv.addItem(ItemType.Bread, 1);      // food
  });

  afterEach(() => removePanel());

  it('tab data attributes match expected values', () => {
    const tabs = document.querySelectorAll('.inv-tab');
    const tabValues = Array.from(tabs).map(t => (t as HTMLElement).dataset['tab']);
    expect(tabValues).toEqual(['all', 'resources', 'seeds', 'food', 'blueprints']);
  });

  it('clicking resources tab makes it active', () => {
    const resourcesTab = document.querySelector('[data-tab="resources"]') as HTMLElement;
    resourcesTab.click();
    expect(resourcesTab.classList.contains('active')).toBe(true);
  });

  it('clicking a tab deactivates the previously active tab', () => {
    const allTab = document.querySelector('[data-tab="all"]') as HTMLElement;
    const seedsTab = document.querySelector('[data-tab="seeds"]') as HTMLElement;
    seedsTab.click();
    expect(allTab.classList.contains('active')).toBe(false);
    expect(seedsTab.classList.contains('active')).toBe(true);
  });

  it('only one tab is active at a time', () => {
    const foodTab = document.querySelector('[data-tab="food"]') as HTMLElement;
    foodTab.click();
    const activeTabs = document.querySelectorAll('.inv-tab.active');
    expect(activeTabs).toHaveLength(1);
  });
});

describe('InventoryUI — show/hide/toggle', () => {
  let inv: InventoryUI;

  beforeEach(() => {
    createPanel();
    inv = new InventoryUI();
  });

  afterEach(() => removePanel());

  it('show() sets display to block', () => {
    inv.show();
    const panel = document.getElementById('inventory-panel') as HTMLElement;
    expect(panel.style.display).toBe('block');
  });

  it('hide() sets display to none', () => {
    inv.show();
    inv.hide();
    const panel = document.getElementById('inventory-panel') as HTMLElement;
    expect(panel.style.display).toBe('none');
  });

  it('toggle() shows when hidden', () => {
    inv.hide();
    inv.toggle();
    const panel = document.getElementById('inventory-panel') as HTMLElement;
    expect(panel.style.display).toBe('block');
  });

  it('toggle() hides when visible', () => {
    inv.show();
    inv.toggle();
    const panel = document.getElementById('inventory-panel') as HTMLElement;
    expect(panel.style.display).toBe('none');
  });
});
