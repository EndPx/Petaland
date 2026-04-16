"""
Petaland Terrain Tileset Generator — NomStead / Growtopia Style
================================================================
Generates 4 terrain tilesets as 16x16 pixel art tiles.

Art direction (NomStead + Growtopia hybrid):
  - Muted, warm palette (olive greens, warm beige, earthy browns, calm blues)
  - Diagonal hatching texture for organic feel
  - Soft colored outlines (NOT harsh black) — uses darker shade of the tile color
  - Rounded corner accents on base tiles
  - Clean, cartoonish shapes — no noisy dithering
  - 2-3 shade levels per tile (Growtopia cel-shading)

Output: individual 16x16 PNGs named {type}_wang_{0-15}.png
  Row 0 (indices 0-3): Base terrain variants A/B/C/D
  Row 1 (indices 4-7): Edge transitions (top/bottom/left/right)
  Row 2 (indices 8-11): Outer corners (NW/NE/SE/SW)
  Row 3 (indices 12-15): Inner corners (NW/NE/SE/SW)
"""

from PIL import Image, ImageDraw
import os

OUTPUT_DIR = os.path.dirname(os.path.abspath(__file__))
TILE = 16

# ── NomStead-inspired Palettes ────────────────────────────────────────────────
# Each palette has: base, light, dark, outline, accent
# "lower" = primary terrain color, "upper" = secondary/transition color

PALETTES = {
    "grass": {
        "lower": [
            (0x8A, 0xAA, 0x5C),  # muted olive green (base)
            (0x9B, 0xB8, 0x6A),  # lighter sage green
            (0x7A, 0x9A, 0x4E),  # darker olive
            (0xA8, 0xC8, 0x78),  # highlight green
        ],
        "upper": [
            (0xC4, 0xB8, 0x8A),  # warm beige soil
            (0xD4, 0xC8, 0x9A),  # light tan
            (0xA8, 0x9C, 0x72),  # dark soil
            (0xDC, 0xD4, 0xA8),  # highlight sand
        ],
        "outline": (0x5A, 0x72, 0x3C),  # dark olive (soft outline, NOT black)
        "accent": (0x6A, 0x8A, 0x48),   # grass tuft accent
    },
    "forest": {
        "lower": [
            (0x5A, 0x7A, 0x3A),  # dark forest green (base)
            (0x6A, 0x8A, 0x48),  # mid forest green
            (0x4A, 0x6A, 0x2E),  # deep forest shadow
            (0x78, 0x98, 0x56),  # highlight forest
        ],
        "upper": [
            (0x8A, 0xAA, 0x5C),  # lighter grass green
            (0x9B, 0xB8, 0x6A),  # sage green
            (0x7A, 0x9A, 0x4E),  # mid green
            (0xA8, 0xC8, 0x78),  # bright accent
        ],
        "outline": (0x3A, 0x52, 0x22),  # deep forest outline
        "accent": (0x4E, 0x6E, 0x34),   # moss accent
    },
    "stone": {
        "lower": [
            (0x9A, 0x94, 0x84),  # warm gray (base)
            (0xB0, 0xA8, 0x98),  # light warm gray
            (0x7A, 0x74, 0x68),  # dark warm gray
            (0xC0, 0xB8, 0xA8),  # highlight
        ],
        "upper": [
            (0xB8, 0xB0, 0xA0),  # light gravel
            (0xC8, 0xC0, 0xB0),  # pale stone
            (0x8A, 0x84, 0x78),  # darker gravel
            (0xD0, 0xC8, 0xB8),  # highlight gravel
        ],
        "outline": (0x5A, 0x54, 0x48),  # dark stone outline
        "accent": (0x6A, 0x64, 0x58),   # crack accent
    },
    "water": {
        "lower": [
            (0x5A, 0x8A, 0xB4),  # calm blue (base)
            (0x7A, 0xAA, 0xC8),  # light blue
            (0x4A, 0x72, 0x98),  # deep blue
            (0x8A, 0xBA, 0xD4),  # highlight ripple
        ],
        "upper": [
            (0xC4, 0xB8, 0x8A),  # sandy shore (beige)
            (0xD4, 0xC8, 0x9A),  # light sand
            (0xA8, 0x9C, 0x72),  # dark sand
            (0xDC, 0xD4, 0xA8),  # highlight sand
        ],
        "outline": (0x3A, 0x62, 0x84),  # deep blue outline
        "accent": (0x6A, 0x9A, 0xC0),   # bright ripple
    },
}


# ── Drawing helpers ───────────────────────────────────────────────────────────

def make_tile(size=TILE):
    return Image.new("RGBA", (size, size), (0, 0, 0, 0))


def px(img, x, y, color):
    if len(color) == 3:
        color = color + (255,)
    if 0 <= x < img.width and 0 <= y < img.height:
        img.putpixel((x, y), color)


def fill_rect(img, x, y, w, h, color):
    if len(color) == 3:
        color = color + (255,)
    draw = ImageDraw.Draw(img)
    draw.rectangle([x, y, x + w - 1, y + h - 1], fill=color)


def soft_outline(img, outline_color):
    """Draw a soft 1px outline using the tile's own dark shade (not black)."""
    if len(outline_color) == 3:
        outline_color = outline_color + (255,)
    draw = ImageDraw.Draw(img)
    s = img.width - 1
    # Top and bottom edges (skip corners for rounded feel)
    draw.line([(1, 0), (s - 1, 0)], fill=outline_color)
    draw.line([(1, s), (s - 1, s)], fill=outline_color)
    # Left and right edges (skip corners)
    draw.line([(0, 1), (0, s - 1)], fill=outline_color)
    draw.line([(s, 1), (s, s - 1)], fill=outline_color)


def add_diagonal_hatching(img, color, spacing=3, direction="right"):
    """Add NomStead-style diagonal hatching lines for organic texture."""
    w, h = img.width, img.height
    if len(color) == 3:
        color = color + (128,)  # semi-transparent for subtle effect

    for offset in range(-w, w + h, spacing):
        for i in range(max(w, h)):
            if direction == "right":
                x = i
                y = offset + i
            else:
                x = i
                y = offset - i + h
            if 1 <= x < w - 1 and 1 <= y < h - 1:
                # Blend with existing pixel for subtlety
                existing = img.getpixel((x, y))
                blended = _blend_alpha(existing[:3], color[:3], 0.15)
                px(img, x, y, blended)


def _blend(c1, c2, t):
    """Linear interpolate between two RGB tuples."""
    r = int(c1[0] * (1 - t) + c2[0] * t)
    g = int(c1[1] * (1 - t) + c2[1] * t)
    b = int(c1[2] * (1 - t) + c2[2] * t)
    return (r, g, b, 255)


def _blend_alpha(c1, c2, alpha):
    """Blend c2 over c1 with given alpha."""
    r = int(c1[0] * (1 - alpha) + c2[0] * alpha)
    g = int(c1[1] * (1 - alpha) + c2[1] * alpha)
    b = int(c1[2] * (1 - alpha) + c2[2] * alpha)
    return (r, g, b, 255)


# ── Tile generators ──────────────────────────────────────────────────────────

def make_base_tile(palette_key, variant=0):
    """Clean base terrain tile with diagonal hatching and soft outline."""
    pal = PALETTES[palette_key]
    colors = pal["lower"]
    outline = pal["outline"]
    tile = make_tile()

    base = colors[0]
    light = colors[1]
    dark = colors[2]
    hi = colors[3]

    # Fill with base color
    fill_rect(tile, 0, 0, TILE, TILE, base)

    # Subtle cel-shading: lighter top-left quadrant, darker bottom-right
    for y in range(TILE):
        for x in range(TILE):
            shade = (x + y) / (TILE * 2 - 2)
            if shade < 0.25:
                px(tile, x, y, hi)
            elif shade < 0.4:
                px(tile, x, y, light)
            elif shade > 0.75:
                px(tile, x, y, dark)

    # Diagonal hatching (NomStead signature)
    hatch_color = dark
    spacing = 3 + (variant % 2)  # slight variation per variant
    direction = "right" if variant < 2 else "left"
    add_diagonal_hatching(tile, hatch_color, spacing=spacing, direction=direction)

    # Terrain-specific details
    _add_clean_detail(tile, palette_key, variant)

    # Soft colored outline (NOT black)
    soft_outline(tile, outline)

    return tile


def _add_clean_detail(tile, palette_key, variant):
    """Add clean, Growtopia-style details per terrain type."""
    pal = PALETTES[palette_key]

    if palette_key == "grass":
        # Small grass tufts — clean 2-pixel marks
        tuft_positions = [(4, 5), (10, 3), (7, 11), (12, 8), (3, 13)]
        accent = pal["accent"]
        for i, (tx, ty) in enumerate(tuft_positions[:2 + variant % 2]):
            if 2 <= tx <= 13 and 2 <= ty <= 13:
                px(tile, tx, ty, accent)
                px(tile, tx, ty - 1, accent)

    elif palette_key == "forest":
        # Moss/leaf spots — clean dots
        spots = [(5, 4), (11, 7), (3, 10), (9, 12)]
        accent = pal["accent"]
        for i, (sx, sy) in enumerate(spots[:2 + variant % 2]):
            if 2 <= sx <= 13 and 2 <= sy <= 13:
                px(tile, sx, sy, accent)
                px(tile, sx + 1, sy, accent)

    elif palette_key == "stone":
        # Rock crack — clean short line
        cracks = [(3, 7), (9, 4), (6, 11)]
        crack_col = pal["accent"]
        cx, cy = cracks[variant % 3]
        for step in range(2 + variant % 2):
            nx = cx + step
            if 2 <= nx <= 13 and 2 <= cy <= 13:
                px(tile, nx, cy, crack_col)

    elif palette_key == "water":
        # Wave ripples — clean horizontal marks
        ripple_y = [5 + variant, 10]
        accent = pal["accent"]
        hi = pal["lower"][3]
        for ry in ripple_y:
            if 2 <= ry <= 13:
                for rx in range(3, 12, 3):
                    px(tile, rx, ry, hi)
                    px(tile, rx + 1, ry, accent)


def make_transition_tile(palette_key, direction="top"):
    """Transition tile: half lower terrain, half upper terrain with blend."""
    pal = PALETTES[palette_key]
    lower = pal["lower"][0]
    upper = pal["upper"][0]
    outline = pal["outline"]
    tile = make_tile()

    half = TILE // 2
    blend_mid = _blend(lower, upper, 0.5)

    if direction == "top":
        fill_rect(tile, 0, 0, TILE, half, upper)
        fill_rect(tile, 0, half, TILE, half, lower)
        for x in range(TILE):
            px(tile, x, half - 1, blend_mid)
            px(tile, x, half, blend_mid)
    elif direction == "bottom":
        fill_rect(tile, 0, 0, TILE, half, lower)
        fill_rect(tile, 0, half, TILE, half, upper)
        for x in range(TILE):
            px(tile, x, half - 1, blend_mid)
            px(tile, x, half, blend_mid)
    elif direction == "left":
        fill_rect(tile, 0, 0, half, TILE, upper)
        fill_rect(tile, half, 0, half, TILE, lower)
        for y in range(TILE):
            px(tile, half - 1, y, blend_mid)
            px(tile, half, y, blend_mid)
    elif direction == "right":
        fill_rect(tile, 0, 0, half, TILE, lower)
        fill_rect(tile, half, 0, half, TILE, upper)
        for y in range(TILE):
            px(tile, half - 1, y, blend_mid)
            px(tile, half, y, blend_mid)

    # Light hatching on lower portion only
    add_diagonal_hatching(tile, pal["lower"][2], spacing=4, direction="right")
    soft_outline(tile, outline)
    return tile


def make_corner_tile(palette_key, corner="nw"):
    """Outer corner: 3/4 lower + 1/4 upper in given corner, with blend."""
    pal = PALETTES[palette_key]
    lower = pal["lower"][0]
    upper = pal["upper"][0]
    outline = pal["outline"]
    tile = make_tile()
    fill_rect(tile, 0, 0, TILE, TILE, lower)

    half = TILE // 2
    blend = _blend(upper, lower, 0.4)

    if corner == "nw":
        fill_rect(tile, 0, 0, half, half, upper)
        # Soften edge
        for i in range(half):
            px(tile, i, half - 1, blend)
            px(tile, half - 1, i, blend)
    elif corner == "ne":
        fill_rect(tile, half, 0, half, half, upper)
        for i in range(half):
            px(tile, half + i, half - 1, blend)
            px(tile, half, i, blend)
    elif corner == "se":
        fill_rect(tile, half, half, half, half, upper)
        for i in range(half):
            px(tile, half + i, half, blend)
            px(tile, half, half + i, blend)
    elif corner == "sw":
        fill_rect(tile, 0, half, half, half, upper)
        for i in range(half):
            px(tile, i, half, blend)
            px(tile, half - 1, half + i, blend)

    soft_outline(tile, outline)
    return tile


def make_inner_corner_tile(palette_key, corner="nw"):
    """Inner corner (concave): opposite of outer corner."""
    pal = PALETTES[palette_key]
    lower = pal["lower"][0]
    upper = pal["upper"][0]
    outline = pal["outline"]
    tile = make_tile()
    fill_rect(tile, 0, 0, TILE, TILE, upper)

    half = TILE // 2
    blend = _blend(lower, upper, 0.4)

    if corner == "nw":
        fill_rect(tile, 0, 0, half, half, lower)
        for i in range(half):
            px(tile, i, half - 1, blend)
            px(tile, half - 1, i, blend)
    elif corner == "ne":
        fill_rect(tile, half, 0, half, half, lower)
        for i in range(half):
            px(tile, half + i, half - 1, blend)
            px(tile, half, i, blend)
    elif corner == "se":
        fill_rect(tile, half, half, half, half, lower)
        for i in range(half):
            px(tile, half + i, half, blend)
            px(tile, half, half + i, blend)
    elif corner == "sw":
        fill_rect(tile, 0, half, half, half, lower)
        for i in range(half):
            px(tile, i, half, blend)
            px(tile, half - 1, half + i, blend)

    soft_outline(tile, outline)
    return tile


# ── Build all tiles ──────────────────────────────────────────────────────────

def build_all_tiles(palette_key):
    """Build 16 individual tiles for a terrain type."""
    tiles = []

    # Row 0: base variants (indices 0-3)
    for v in range(4):
        tiles.append(make_base_tile(palette_key, v))

    # Row 1: transitions (indices 4-7)
    for d in ["top", "bottom", "left", "right"]:
        tiles.append(make_transition_tile(palette_key, d))

    # Row 2: outer corners (indices 8-11)
    for c in ["nw", "ne", "se", "sw"]:
        tiles.append(make_corner_tile(palette_key, c))

    # Row 3: inner corners (indices 12-15)
    for c in ["nw", "ne", "se", "sw"]:
        tiles.append(make_inner_corner_tile(palette_key, c))

    return tiles


# ── Main ─────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    terrain_types = ["grass", "forest", "stone", "water"]

    for terrain in terrain_types:
        tiles = build_all_tiles(terrain)
        for idx, tile in enumerate(tiles):
            filename = f"{terrain}_wang_{idx}.png"
            filepath = os.path.join(OUTPUT_DIR, filename)
            tile.save(filepath, "PNG")
        print(f"  Generated {len(tiles)} tiles for: {terrain}")

    print(f"\nAll tilesets saved to: {OUTPUT_DIR}")
    print("Style: NomStead/Growtopia — muted palette, diagonal hatching, soft outlines")
