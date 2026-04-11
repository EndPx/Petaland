/**
 * types.test.ts — RED phase tests for shared type definitions.
 * Tests enum values and structural consistency of type definitions.
 */

import { describe, it, expect } from 'vitest';
import {
  TileType,
  LandTier,
  ObjectType,
  ItemType,
  BlueprintTier,
  GAME_EVENTS,
} from '../types/index';

describe('TileType enum', () => {
  it('has Grass value', () => {
    expect(TileType.Grass).toBe('grass');
  });

  it('has Forest value', () => {
    expect(TileType.Forest).toBe('forest');
  });

  it('has Stone value', () => {
    expect(TileType.Stone).toBe('stone');
  });

  it('has Water value', () => {
    expect(TileType.Water).toBe('water');
  });

  it('has exactly 4 tile types', () => {
    const values = Object.values(TileType);
    expect(values).toHaveLength(4);
  });
});

describe('LandTier enum', () => {
  it('has PetalPlot as free tier', () => {
    expect(LandTier.PetalPlot).toBe('petal_plot');
  });

  it('has Grove tier', () => {
    expect(LandTier.Grove).toBe('grove');
  });

  it('has Cliff tier', () => {
    expect(LandTier.Cliff).toBe('cliff');
  });

  it('has Lake tier', () => {
    expect(LandTier.Lake).toBe('lake');
  });

  it('has PetalEstate as premium tier', () => {
    expect(LandTier.PetalEstate).toBe('petal_estate');
  });

  it('has exactly 5 land tiers', () => {
    const values = Object.values(LandTier);
    expect(values).toHaveLength(5);
  });
});

describe('ItemType enum', () => {
  it('has resource types', () => {
    expect(ItemType.Wood).toBe('wood');
    expect(ItemType.Stone).toBe('stone');
    expect(ItemType.Carrot).toBe('carrot');
    expect(ItemType.Wheat).toBe('wheat');
  });

  it('has seed types', () => {
    expect(ItemType.CarrotSeed).toBe('carrot_seed');
    expect(ItemType.WheatSeed).toBe('wheat_seed');
  });

  it('has crafted food types', () => {
    expect(ItemType.Bread).toBe('bread');
    expect(ItemType.CarrotSoup).toBe('carrot_soup');
  });

  it('has currency display types', () => {
    expect(ItemType.Silver).toBe('silver');
    expect(ItemType.Petal).toBe('petal');
  });

  it('has exactly 10 item types', () => {
    const values = Object.values(ItemType);
    expect(values).toHaveLength(10);
  });
});

describe('ObjectType enum', () => {
  it('has nature object types', () => {
    expect(ObjectType.OakTree).toBe('oak_tree');
    expect(ObjectType.PineTree).toBe('pine_tree');
    expect(ObjectType.RockSmall).toBe('rock_small');
    expect(ObjectType.Bush).toBe('bush');
    expect(ObjectType.FlowerPetal).toBe('flower_petal');
    expect(ObjectType.WildCarrot).toBe('wild_carrot');
  });

  it('has building object types', () => {
    expect(ObjectType.Workbench).toBe('workbench');
    expect(ObjectType.Bonfire).toBe('bonfire');
    expect(ObjectType.StorageBox).toBe('storage_box');
    expect(ObjectType.Well).toBe('well');
    expect(ObjectType.Fence).toBe('fence');
    expect(ObjectType.Sawmill).toBe('sawmill');
    expect(ObjectType.Furnace).toBe('furnace');
    expect(ObjectType.Scarecrow).toBe('scarecrow');
    expect(ObjectType.ShopStall).toBe('shop_stall');
  });

  it('has farming object types', () => {
    expect(ObjectType.SoilBed).toBe('soil_bed');
  });
});

describe('BlueprintTier enum', () => {
  it('has all 5 tiers in ascending order of rarity', () => {
    expect(BlueprintTier.Basic).toBe('basic');
    expect(BlueprintTier.Common).toBe('common');
    expect(BlueprintTier.Uncommon).toBe('uncommon');
    expect(BlueprintTier.Rare).toBe('rare');
    expect(BlueprintTier.Legendary).toBe('legendary');
  });

  it('has exactly 5 blueprint tiers', () => {
    const values = Object.values(BlueprintTier);
    expect(values).toHaveLength(5);
  });
});

describe('GAME_EVENTS constants', () => {
  it('has player movement events', () => {
    expect(GAME_EVENTS.PLAYER_MOVE).toBe('player:move');
    expect(GAME_EVENTS.PLAYER_STOP).toBe('player:stop');
    expect(GAME_EVENTS.PLAYER_ENERGY_CHANGE).toBe('player:energy_change');
  });

  it('has currency events', () => {
    expect(GAME_EVENTS.SILVER_CHANGE).toBe('silver:change');
    expect(GAME_EVENTS.PETAL_CHANGE).toBe('petal:change');
  });

  it('has inventory event', () => {
    expect(GAME_EVENTS.INVENTORY_UPDATE).toBe('inventory:update');
  });

  it('has wallet events', () => {
    expect(GAME_EVENTS.WALLET_CONNECTED).toBe('wallet:connected');
    expect(GAME_EVENTS.WALLET_DISCONNECTED).toBe('wallet:disconnected');
  });

  it('has scene event', () => {
    expect(GAME_EVENTS.SCENE_READY).toBe('scene:ready');
  });

  it('all event keys use colon namespace separator', () => {
    const values = Object.values(GAME_EVENTS);
    for (const v of values) {
      expect(v).toContain(':');
    }
  });

  it('has exactly 9 game events', () => {
    const keys = Object.keys(GAME_EVENTS);
    expect(keys).toHaveLength(9);
  });
});
