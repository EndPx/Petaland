# Petaland — Pixel Art Style Guide

## Core Style
- **Perspective**: Top-down (3/4 bird's eye view, like Stardew Valley / Pixels)
- **Tile Size**: 16x16 base tiles (characters can be 16x24 or 16x32)
- **Color Palette**: Soft, warm, pastel tones — spring/garden aesthetic
- **Outline**: Black outlines (1px), consistent on all assets
- **Shading**: Soft cel-shading, 2-3 shade levels per color
- **Detail Level**: Medium — readable at small size, charming up close

## Color Palette Guidelines
- **Grass/Nature**: Soft greens (#7EC850, #5B8C3E, #3D6B2E)
- **Dirt/Path**: Warm browns (#C4A46C, #8B6F47, #5C4830)
- **Water**: Soft blues (#5B9BD5, #3A7BBF, #2B5E8C)
- **Stone/Mountain**: Cool grays (#9EA7B0, #6B7680, #4A5258)
- **Wood**: Warm medium browns (#A0724A, #7D5A3C, #5C3D28)
- **Crops/Flowers**: Vibrant but not neon — yellows, oranges, pinks, purples
- **UI Elements**: Cream/parchment backgrounds, dark brown text
- **$PETAL token color**: Soft pink/rose (#E8A0BF)
- **Silver currency**: Light silver-blue (#C0C8D4)

## Character Guidelines
- **Size**: 16x24 pixels (body + head)
- **Directions**: 4 directions minimum (down, up, left, right)
- **Head-to-body ratio**: Chibi style (large head, ~40% of height)
- **Animations**: Walk (4 frames), Idle (2 frames), Action (3 frames)
- **Style**: Cute, friendly, approachable — no aggressive designs

## Tileset Guidelines
- **Base tile**: 16x16
- **Autotiling**: Wang tileset format (corner-based transitions)
- **Terrain types**: Grass, Dirt, Water, Stone, Sand, Forest floor
- **Transitions**: Smooth blending between terrain types
- **Variation**: 2-3 variations per base tile to avoid repetition

## Building/Object Guidelines
- **Small objects**: 16x16 (flowers, small rocks, crops)
- **Medium objects**: 16x32 or 32x32 (workbench, bonfire, well)
- **Large buildings**: 32x48 or 48x48 (sawmill, furnace, bakery)
- **Transparent background**: All objects on transparent PNG
- **Shadow**: Small drop shadow on ground-level objects
- **Consistent light source**: Top-left (NW direction)

## Crop Growth Stages
Each crop has 4 visual stages:
1. **Seed** — small mound of dirt
2. **Sprout** — tiny green shoot
3. **Growing** — half-size plant
4. **Harvestable** — full plant with visible produce (glowing/bouncing indicator)

## Naming Convention
```
assets/
  tilesets/
    grass_tileset.png
    dirt_tileset.png
    water_tileset.png
    stone_tileset.png
  characters/
    farmer_male_walk.png
    farmer_female_walk.png
    npc_shopkeeper.png
  objects/
    nature/
      tree_oak.png
      tree_pine.png
      rock_small.png
      bush_green.png
      flower_petal_pink.png
    farming/
      soil_bed_empty.png
      wheat_stage1.png → wheat_stage4.png
      carrot_stage1.png → carrot_stage4.png
      potato_stage1.png → potato_stage4.png
    buildings/
      workbench.png
      bonfire.png
      storage_box.png
      well.png
      fence_horizontal.png
      sawmill.png
      furnace.png
      scarecrow.png
    ui/
      icon_silver.png
      icon_petal.png
      icon_energy.png
      slot_inventory.png
```

## PixelLab Generation Parameters (Consistency)
Use these settings for ALL PixelLab generations:
- **outline**: "black" 
- **shading**: "soft"
- **detail**: "medium"
- **view**: "top-down" (for tilesets/objects) 
- **tile_size**: 16 (for tilesets)
- **size**: 16 or 32 depending on asset type
- **ai_freedom**: "low" (keep it consistent, less random variation)
