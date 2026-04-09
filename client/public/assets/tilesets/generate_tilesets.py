"""
Petaland Terrain Tileset Generator
====================================
Generates 4 terrain tilesets as 16x16 pixel art tiles arranged in a
Wang/autotile-compatible spritesheet layout.

Style guide compliance:
- 16x16 base tiles
- Black 1px outlines
- Soft cel-shading (2-3 shade levels)
- Top-down perspective
- Palette strictly from PIXEL_ART_STYLE_GUIDE.md

Layout per tileset: 4 columns x 4 rows = 16 tiles (64x64px total spritesheet)
Tile arrangement (Wang-compatible autotile set):
  Row 0: full tile variant A, B, C, D  (4 base variations)
  Row 1: transition top, bottom, left, right
  Row 2: corner NW, NE, SE, SW
  Row 3: inner corner NW, NE, SE, SW
"""

from PIL import Image, ImageDraw
import random
import os
import math

OUTPUT_DIR = os.path.dirname(os.path.abspath(__file__))
TILE = 16
COLS = 4
ROWS = 4
SHEET_W = TILE * COLS  # 64px
SHEET_H = TILE * ROWS  # 64px

# ── Palette ─────────────────────────────────────────────────────────────────

PALETTES = {
    "grass": {
        "lower": [
            (0x7E, 0xC8, 0x50),  # bright grass
            (0x5B, 0x8C, 0x3E),  # mid grass
            (0x3D, 0x6B, 0x2E),  # dark grass
            (0x9E, 0xD8, 0x60),  # highlight grass
        ],
        "upper": [
            (0xC4, 0xA4, 0x6C),  # warm dirt
            (0x8B, 0x6F, 0x47),  # mid dirt
            (0x5C, 0x48, 0x30),  # dark dirt
            (0xD8, 0xBE, 0x8A),  # highlight dirt
        ],
        "outline": (0x00, 0x00, 0x00),
        "accent": (0xA0, 0xE0, 0x58),  # small flower accent
    },
    "forest": {
        "lower": [
            (0x3A, 0x2E, 0x1E),  # dark forest floor
            (0x4E, 0x3C, 0x28),  # mid forest floor
            (0x2A, 0x22, 0x16),  # deep shadow
            (0x5E, 0x4C, 0x34),  # lighter forest floor
        ],
        "upper": [
            (0x7E, 0xC8, 0x50),  # lush green grass
            (0x5B, 0x8C, 0x3E),  # mid grass
            (0x3D, 0x6B, 0x2E),  # dark grass
            (0x9E, 0xD8, 0x60),  # highlight
        ],
        "outline": (0x00, 0x00, 0x00),
        "accent": (0x5C, 0x8C, 0x40),  # moss accent
    },
    "stone": {
        "lower": [
            (0x6B, 0x76, 0x80),  # rocky gray
            (0x9E, 0xA7, 0xB0),  # mid gray
            (0x4A, 0x52, 0x58),  # dark gray
            (0xB4, 0xBC, 0xC4),  # highlight gray
        ],
        "upper": [
            (0xB4, 0xBC, 0xC4),  # light gravel
            (0x9E, 0xA7, 0xB0),  # mid gravel
            (0x7A, 0x84, 0x8C),  # darker gravel
            (0xCC, 0xD4, 0xDC),  # highlight
        ],
        "outline": (0x00, 0x00, 0x00),
        "accent": (0x58, 0x60, 0x68),  # dark crack
    },
    "water": {
        "lower": [
            (0x5B, 0x9B, 0xD5),  # mid blue water
            (0x3A, 0x7B, 0xBF),  # deeper blue
            (0x2B, 0x5E, 0x8C),  # dark deep
            (0x7A, 0xB8, 0xE8),  # highlight ripple
        ],
        "upper": [
            (0xE8, 0xD8, 0xA0),  # sandy shore
            (0xD4, 0xBE, 0x84),  # mid sand
            (0xB8, 0xA0, 0x68),  # dark sand
            (0xF4, 0xEC, 0xC0),  # highlight sand
        ],
        "outline": (0x00, 0x00, 0x00),
        "accent": (0x9A, 0xD0, 0xF8),  # bright ripple
    },
}

BLACK = (0, 0, 0, 255)


# ── Drawing helpers ──────────────────────────────────────────────────────────

def make_tile(size=TILE):
    """Create a transparent RGBA tile."""
    return Image.new("RGBA", (size, size), (0, 0, 0, 0))


def px(img, x, y, color):
    """Set a single pixel (color must be RGB or RGBA tuple)."""
    if len(color) == 3:
        color = color + (255,)
    if 0 <= x < img.width and 0 <= y < img.height:
        img.putpixel((x, y), color)


def fill_rect(img, x, y, w, h, color):
    """Fill a rectangle."""
    if len(color) == 3:
        color = color + (255,)
    draw = ImageDraw.Draw(img)
    draw.rectangle([x, y, x + w - 1, y + h - 1], fill=color)


def outline_tile(img, color=BLACK):
    """Draw 1px black outline around entire tile."""
    draw = ImageDraw.Draw(img)
    draw.rectangle([0, 0, img.width - 1, img.height - 1], outline=color)


def add_dither_noise(img, palette, density=0.12, seed=42):
    """Scatter darker pixels for organic texture."""
    rng = random.Random(seed)
    dark = palette[2]
    light = palette[3]
    for y in range(1, img.height - 1):
        for x in range(1, img.width - 1):
            r = rng.random()
            if r < density * 0.4:
                px(img, x, y, dark)
            elif r < density:
                px(img, x, y, light)


# ── Tile generators ──────────────────────────────────────────────────────────

def make_base_tile(palette_key, variant=0, upper=False):
    """
    Create a solid base terrain tile with soft shading and texture.
    variant: 0-3 subtle differences to avoid repetition.
    upper: if True, use upper palette (transition target terrain).
    """
    pal = PALETTES[palette_key]
    colors = pal["upper"] if upper else pal["lower"]
    tile = make_tile()

    base = colors[0]
    mid = colors[1]
    dark = colors[2]
    hi = colors[3]

    # Fill base color
    fill_rect(tile, 0, 0, TILE, TILE, base)

    # Soft gradient shading — darker bottom-right corner
    for y in range(TILE):
        for x in range(TILE):
            shade_factor = (x + y) / (TILE * 2 - 2)
            if shade_factor > 0.75:
                px(tile, x, y, dark)
            elif shade_factor > 0.5:
                px(tile, x, y, mid)

    # Top-left highlight strip
    for i in range(3):
        for j in range(3 - i):
            px(tile, i, j, hi)

    # Organic texture noise
    seed_offset = variant * 100 + (200 if upper else 0)
    add_dither_noise(tile, colors, density=0.10, seed=seed_offset)

    # Palette-specific details
    _add_terrain_detail(tile, palette_key, variant, upper)

    # Black outline
    outline_tile(tile, BLACK)

    return tile


def _add_terrain_detail(tile, palette_key, variant, upper):
    """Add characteristic pixel art details per terrain type."""
    pal = PALETTES[palette_key]

    if palette_key == "grass" and not upper:
        # Tiny grass tufts — 3-5 small strokes
        tuft_positions = [(3, 2), (9, 4), (6, 10), (12, 7), (2, 12)]
        dark_green = (0x3D, 0x6B, 0x2E)
        bright_green = (0x9E, 0xD8, 0x60)
        for i, (tx, ty) in enumerate(tuft_positions[:3 + variant % 2]):
            if 1 <= tx <= 13 and 1 <= ty <= 13:
                px(tile, tx, ty, bright_green)
                px(tile, tx, ty - 1, dark_green)

    elif palette_key == "grass" and upper:
        # Dirt path — small pebble marks
        pebble_positions = [(4, 5), (10, 9), (7, 12), (13, 4)]
        dark_dirt = (0x5C, 0x48, 0x30)
        for i, (px_, py_) in enumerate(pebble_positions[:2 + variant % 2]):
            if 1 <= px_ <= 13 and 1 <= py_ <= 13:
                px(tile, px_, py_, dark_dirt)
                px(tile, px_ + 1, py_, dark_dirt)

    elif palette_key == "forest" and not upper:
        # Fallen leaf marks and moss patches
        leaf_pos = [(5, 3), (11, 8), (3, 11), (8, 13)]
        moss = (0x5C, 0x8C, 0x40)
        leaf = (0x6A, 0x4E, 0x2C)
        for i, (lx, ly) in enumerate(leaf_pos[:2 + variant % 2]):
            if 1 <= lx <= 13 and 1 <= ly <= 13:
                col = moss if i % 2 == 0 else leaf
                px(tile, lx, ly, col)
                px(tile, lx + 1, ly, col)
                px(tile, lx, ly + 1, col)

    elif palette_key == "stone" and not upper:
        # Rock crack lines
        crack_start = [(2, 6), (9, 3), (5, 11)][variant % 3]
        dark_crack = pal["accent"]
        cx, cy = crack_start
        for step in range(3 + variant):
            nx = cx + step
            ny = cy + (1 if step % 2 == 0 else 0)
            if 1 <= nx <= 13 and 1 <= ny <= 13:
                px(tile, nx, ny, dark_crack)

    elif palette_key == "stone" and upper:
        # Gravel — small scattered dots
        gravel_pos = [(3, 4), (8, 7), (12, 10), (5, 13), (10, 2)]
        dark = pal["lower"][2]
        for gx, gy in gravel_pos[:3 + variant % 2]:
            if 1 <= gx <= 13 and 1 <= gy <= 13:
                px(tile, gx, gy, dark)

    elif palette_key == "water" and not upper:
        # Ripple lines — horizontal wave marks
        ripple_y = [4 + variant, 9, 12]
        ripple_col = pal["accent"]
        wave_col = pal["lower"][3]
        for ry in ripple_y:
            if 1 <= ry <= 13:
                for rx in range(2, 13, 3):
                    px(tile, rx, ry, wave_col)
                    px(tile, rx + 1, ry, ripple_col)

    elif palette_key == "water" and upper:
        # Sandy shore — tiny shell/pebble marks
        pebble_col = pal["lower"][2]
        for sx, sy in [(4, 6), (10, 4), (7, 10), (12, 8)]:
            if 1 <= sx <= 13 and 1 <= sy <= 13:
                px(tile, sx, sy, pebble_col)
                px(tile, sx + 1, sy, pebble_col)


def make_transition_tile(palette_key, direction="top"):
    """
    Transition tile: half lower terrain, half upper terrain.
    direction: which edge the transition crosses from.
    """
    pal = PALETTES[palette_key]
    lower_c = pal["lower"]
    upper_c = pal["upper"]
    tile = make_tile()

    # Fill halves
    if direction == "top":
        fill_rect(tile, 0, 0, TILE, TILE // 2, upper_c[0])
        fill_rect(tile, 0, TILE // 2, TILE, TILE // 2, lower_c[0])
        # Blend row at seam
        for x in range(TILE):
            blend = _blend(upper_c[0], lower_c[0], 0.5)
            px(tile, x, TILE // 2, blend)
            px(tile, x, TILE // 2 - 1, _blend(upper_c[0], lower_c[0], 0.25))
    elif direction == "bottom":
        fill_rect(tile, 0, 0, TILE, TILE // 2, lower_c[0])
        fill_rect(tile, 0, TILE // 2, TILE, TILE // 2, upper_c[0])
        for x in range(TILE):
            blend = _blend(lower_c[0], upper_c[0], 0.5)
            px(tile, x, TILE // 2, blend)
    elif direction == "left":
        fill_rect(tile, 0, 0, TILE // 2, TILE, upper_c[0])
        fill_rect(tile, TILE // 2, 0, TILE // 2, TILE, lower_c[0])
        for y in range(TILE):
            px(tile, TILE // 2, y, _blend(upper_c[0], lower_c[0], 0.5))
    elif direction == "right":
        fill_rect(tile, 0, 0, TILE // 2, TILE, lower_c[0])
        fill_rect(tile, TILE // 2, 0, TILE // 2, TILE, upper_c[0])
        for y in range(TILE):
            px(tile, TILE // 2, y, _blend(lower_c[0], upper_c[0], 0.5))

    add_dither_noise(tile, lower_c, density=0.06, seed=77)
    outline_tile(tile, BLACK)
    return tile


def make_corner_tile(palette_key, corner="nw"):
    """
    Outer corner tile: 3/4 lower + 1/4 upper in the given corner.
    """
    pal = PALETTES[palette_key]
    lower_c = pal["lower"][0]
    upper_c = pal["upper"][0]
    tile = make_tile()
    fill_rect(tile, 0, 0, TILE, TILE, lower_c)

    half = TILE // 2
    if corner == "nw":
        fill_rect(tile, 0, 0, half, half, upper_c)
    elif corner == "ne":
        fill_rect(tile, half, 0, half, half, upper_c)
    elif corner == "se":
        fill_rect(tile, half, half, half, half, upper_c)
    elif corner == "sw":
        fill_rect(tile, 0, half, half, half, upper_c)

    # Diagonal blend
    for i in range(half):
        blend = _blend(upper_c, lower_c, i / half)
        if corner == "nw":
            px(tile, i, half - 1, blend)
            px(tile, half - 1, i, blend)
        elif corner == "ne":
            px(tile, half + i, half - 1, blend)
            px(tile, half, i, blend)
        elif corner == "se":
            px(tile, half + i, half, blend)
            px(tile, half, half + i, blend)
        elif corner == "sw":
            px(tile, i, half, blend)
            px(tile, half - 1, half + i, blend)

    outline_tile(tile, BLACK)
    return tile


def make_inner_corner_tile(palette_key, corner="nw"):
    """
    Inner corner (concave): opposite of outer corner.
    """
    pal = PALETTES[palette_key]
    lower_c = pal["lower"][0]
    upper_c = pal["upper"][0]
    tile = make_tile()
    fill_rect(tile, 0, 0, TILE, TILE, upper_c)

    half = TILE // 2
    if corner == "nw":
        fill_rect(tile, 0, 0, half, half, lower_c)
    elif corner == "ne":
        fill_rect(tile, half, 0, half, half, lower_c)
    elif corner == "se":
        fill_rect(tile, half, half, half, half, lower_c)
    elif corner == "sw":
        fill_rect(tile, 0, half, half, half, lower_c)

    outline_tile(tile, BLACK)
    return tile


def _blend(c1, c2, t):
    """Linear interpolate between two RGB tuples, return RGBA."""
    r = int(c1[0] * (1 - t) + c2[0] * t)
    g = int(c1[1] * (1 - t) + c2[1] * t)
    b = int(c1[2] * (1 - t) + c2[2] * t)
    return (r, g, b, 255)


# ── Spritesheet assembly ─────────────────────────────────────────────────────

def build_spritesheet(palette_key):
    """
    Build a 64x64 spritesheet (4x4 tiles, each 16x16).

    Layout:
      [0,0] Base var A   [1,0] Base var B   [2,0] Base var C   [3,0] Base var D
      [0,1] Trans top    [1,1] Trans bot    [2,1] Trans left   [3,1] Trans right
      [0,2] Corner NW    [1,2] Corner NE    [2,2] Corner SE    [3,2] Corner SW
      [0,3] InCorner NW  [1,3] InCorner NE  [2,3] InCorner SE  [3,3] InCorner SW
    """
    sheet = Image.new("RGBA", (SHEET_W, SHEET_H), (0, 0, 0, 0))

    tiles = [
        # Row 0: base variants
        [make_base_tile(palette_key, 0), make_base_tile(palette_key, 1),
         make_base_tile(palette_key, 2), make_base_tile(palette_key, 3)],
        # Row 1: transitions
        [make_transition_tile(palette_key, "top"),
         make_transition_tile(palette_key, "bottom"),
         make_transition_tile(palette_key, "left"),
         make_transition_tile(palette_key, "right")],
        # Row 2: outer corners
        [make_corner_tile(palette_key, "nw"), make_corner_tile(palette_key, "ne"),
         make_corner_tile(palette_key, "se"), make_corner_tile(palette_key, "sw")],
        # Row 3: inner corners
        [make_inner_corner_tile(palette_key, "nw"), make_inner_corner_tile(palette_key, "ne"),
         make_inner_corner_tile(palette_key, "se"), make_inner_corner_tile(palette_key, "sw")],
    ]

    for row_i, row in enumerate(tiles):
        for col_i, tile in enumerate(row):
            sheet.paste(tile, (col_i * TILE, row_i * TILE))

    return sheet


# ── Main ─────────────────────────────────────────────────────────────────────

TILESET_SPECS = [
    ("grass",  "grass_tileset.png"),
    ("forest", "forest_floor_tileset.png"),
    ("stone",  "stone_tileset.png"),
    ("water",  "water_tileset.png"),
]

generated = []

for palette_key, filename in TILESET_SPECS:
    out_path = os.path.join(OUTPUT_DIR, filename)
    sheet = build_spritesheet(palette_key)
    sheet.save(out_path, "PNG")
    size = os.path.getsize(out_path)
    print(f"  Generated: {filename}  ({sheet.width}x{sheet.height}px, {size} bytes)")
    generated.append((palette_key, filename, sheet.width, sheet.height, size))

print(f"\nAll {len(generated)} tilesets saved to: {OUTPUT_DIR}")
