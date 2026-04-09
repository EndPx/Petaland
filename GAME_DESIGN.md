# Petaland — Game Design Document

## Overview
Petaland is a pixel art farming & social MMO on Solana. Plant, craft, trade, and hang out in a living pixel world. Inspired by Pixels, Sunflower Land, and Nomstead.

## Dual Currency

### Silver (Off-chain)
- Earned: quests, selling common items to NPCs
- Spent: blueprints, basic seeds, NPC shop items, recipes
- Supply: unlimited (always earnable)
- Not tradeable P2P

### $PETAL (On-chain SPL Token)
- Earned: daily pool (limited), rare item sales, P2P trades, gold quests
- Spent: land NFTs, rare seeds, cosmetics, marketplace trading
- Supply: fixed daily emission pool (shared by all players)
- Tradeable on Jupiter DEX
- 10% seller fee on P2P trades (burned)

### Daily $PETAL Pool
- Fixed amount enters economy per day
- Players with higher reputation get priority
- Once pool drained, remaining players get Silver quests only
- Prevents inflation

## Land System

### Tile Types

| Tile | Supply | Price | Resources | Size |
|------|--------|-------|-----------|------|
| Petal Plot (Grassland) | Infinite | Free (1 per player) | Empty land, basic crafting | Small |
| Grove (Forest) | 500 | 50 $PETAL | Wood, fruits | Medium |
| Cliff (Mountain/Stone) | 500 | 50 $PETAL | Stone, ores, rare gems | Medium |
| Lake (Pond) | 500 | 50 $PETAL | Fish, lotus | Medium |
| Petal Estate (Large) | 100 | 300 $PETAL | ALL resources, guild hall | Large |

### Land Rules
- Map is infinite, no center, expands in all directions
- Each tile is a hex on the shared world map
- Adjacent tiles = fast travel between them
- Players choose where to place tiles (strategic placement)
- Medium/Large tiles = Compressed NFTs on Solana (tradeable)
- Free Petal Plot = off-chain (not tradeable)

### Ownership Advantage: Crafting Tax
- When a player crafts on SOMEONE ELSE's land: 50% tax
  - Crafter gets 1 item, Land owner gets 1 item (passive income)
- When a player crafts on THEIR OWN land: full output (no tax)
- Cooking on someone else's bonfire: double ingredients (like Nomstead)
- Land owners can potentially set custom tax rates (25%, 50%, 0%)
- "FREE" / "OPEN" labeled lands attract foot traffic

## Blueprints & Crafting

### How Blueprints Work
- Blueprints are recipes required before crafting anything
- No free farm plots — everything must be crafted and placed
- Players start with EMPTY land

### How to Get Blueprints
- NPC shop: buy with Silver
- Quest rewards: complete tasks to unlock
- Rare drops: VRF random from gathering (legendary blueprints)
- Legendary blueprints = Compressed NFTs (tradeable on marketplace)

### Blueprint Tiers

| Tier | Examples | How to Unlock | Cost |
|------|---------|---------------|------|
| Basic | Soil Bed, Workbench, Storage Box | First NPC quest (free) | Quest reward |
| Common | Bonfire, Fence, Well, Scarecrow | NPC shop | 50-200 Silver |
| Uncommon | Sawmill, Furnace, Loom, Anvil | Quest chain (level 5+) | 500 Silver |
| Rare | Bakery, Brewery, Jeweler Table | Quest chain (level 10+) | 2,000 Silver |
| Legendary | Crystal Forge, Golden Loom | Rare drop / seasonal event | Not buyable |

### Crafting Flow
1. Own the blueprint
2. Gather required materials
3. Go to workbench
4. Select recipe → Craft
5. Place on land (buildings) or add to inventory (items)

## NPC Shop

| Tab | What It Sells | Currency |
|-----|--------------|----------|
| Blueprints | Crafting recipes | Silver |
| Seeds | Basic seeds (Wheat, Carrot, Potato) | Silver |
| Tools | Axe, Pickaxe, Fishing Rod | Silver |
| Quests | Task board → deliver items → earn rewards | — |

### NPC Dynamic Pricing (for selling TO NPCs)
- The more players sell an item, the lower its price drops
- The less players sell, the higher the price climbs
- Stock decays over time (prices recover naturally)
- Prices update live

## Energy System
- Every action costs energy (gathering, farming, crafting)
- Regenerates +10 per hour after last action
- Max energy increases with level
- Food restores energy (cooking mechanic)

## Game Loop

```
1. GATHER   → Walk map, pick wild resources (costs Energy)
2. CRAFT    → Workbench: resources → items (need blueprint)
3. FARM     → Plant on crafted Soil Beds, harvest crops
4. COOK     → Bonfire: ingredients → food (restores Energy)
5. QUEST    → NPC tasks: deliver items → Silver/$PETAL + blueprints + XP
6. SELL     → NPC (dynamic pricing) or P2P dropbox (in $PETAL)
7. BUILD    → Craft buildings, place on land, attract visitors
8. EXPAND   → Buy new tiles with $PETAL → grow kingdom
```

## New Player Onboarding

```
1. Connect wallet → Get free Petal Plot (empty land)
2. Talk to NPC → First quest: "gather 5 wild carrots"
3. Complete quest → Reward: Soil Bed Blueprint + 50 Silver
4. Gather wood + stone from map
5. Craft Soil Bed at workbench
6. Place Soil Bed on land → Plant first seeds
7. Harvest → Sell → Earn Silver → Buy more blueprints
8. Level up → Unlock new quests → Better blueprints
```

## Tech Stack

```
Frontend:     Phaser.js (pixel art game engine, browser-based)
Language:     TypeScript
On-chain:     Anchor (Rust) — $PETAL token, marketplace, land NFTs
Off-chain:    Colyseus (game server) — Silver, inventory, movement, chat
Wallet:       Solana Wallet Adapter + MagicBlock Session Keys
NFTs:         Metaplex Bubblegum (compressed NFTs for land + legendary blueprints)
Randomness:   MagicBlock VRF (rare drops)
Energy:       On-chain timestamp (Solana clock)
NPC Pricing:  Off-chain (game server, dynamic supply/demand)
Hosting:      Vercel (client) + Railway (game server)
```

## On-Chain vs Off-Chain

| Data | Where |
|------|-------|
| $PETAL token | On-chain (SPL Token) |
| Land NFTs (Grove/Cliff/Lake/Estate) | On-chain (Compressed NFT) |
| Legendary blueprints | On-chain (Compressed NFT, tradeable) |
| P2P marketplace | On-chain (Anchor program) |
| Silver currency | Off-chain (game server) |
| Player inventory | Off-chain (game server) |
| Blueprints owned | Off-chain (game server) |
| Buildings on land | Off-chain (game server) |
| Energy / timestamps | On-chain (Solana clock) |
| NPC pricing | Off-chain (game server) |
