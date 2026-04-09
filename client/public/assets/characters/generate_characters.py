"""
Petaland Pixel Art Character Generator
Generates all character sprites following the PIXEL_ART_STYLE_GUIDE.md
- 16x24 chibi humanoids (4 directions)
- 16x16 animals (4 directions)
- Black 1px outlines, soft cel-shading, pastel palette
"""

from PIL import Image, ImageDraw
import os

OUTPUT_DIR = os.path.dirname(os.path.abspath(__file__))

# ── Palette (from style guide + character-specific) ───────────────────────────
C = {
    # Skin
    "skin_light":   (255, 218, 185),
    "skin_mid":     (230, 185, 150),
    "skin_dark":    (195, 145, 110),
    # Hair
    "hair_brown":   (120, 80, 40),
    "hair_brown_s": (80, 50, 20),
    "hair_gold":    (220, 180, 60),
    "hair_gold_s":  (170, 130, 30),
    "hair_white":   (240, 240, 235),
    "hair_white_s": (200, 200, 195),
    # Straw hat
    "straw":        (220, 190, 100),
    "straw_s":      (170, 140, 60),
    "straw_d":      (140, 110, 40),
    # Blue overalls
    "denim":        (90, 130, 190),
    "denim_s":      (60, 95, 150),
    "denim_d":      (40, 65, 110),
    # Green dress
    "green_dress":  (100, 185, 100),
    "green_s":      (65, 140, 65),
    "green_d":      (40, 100, 40),
    # White shirt / apron
    "white":        (240, 240, 235),
    "white_s":      (210, 210, 205),
    # Brown boots
    "boot":         (120, 80, 45),
    "boot_s":       (80, 50, 25),
    # Merchant apron (green)
    "apron_g":      (80, 155, 80),
    "apron_gs":     (50, 115, 50),
    # Merchant hat (brown)
    "merch_hat":    (110, 75, 40),
    "merch_hat_s":  (75, 48, 22),
    # Beard / white facial hair
    "beard":        (235, 232, 225),
    "beard_s":      (195, 192, 185),
    # Pink flower
    "pink":         (232, 160, 191),
    "pink_d":       (190, 110, 150),
    # Sun hat (female)
    "sunhat":       (240, 210, 120),
    "sunhat_s":     (195, 165, 75),
    # Chicken white
    "chick_w":      (245, 242, 235),
    "chick_ws":     (210, 205, 195),
    # Chicken red comb
    "comb":         (210, 50, 50),
    "comb_s":       (165, 25, 25),
    # Chicken beak / feet
    "beak":         (225, 155, 60),
    "beak_s":       (175, 110, 30),
    # Outline
    "black":        (20, 18, 18),
    # Transparent
    "none":         (0, 0, 0, 0),
}

def rgba(name):
    c = C[name]
    return c + (255,) if len(c) == 3 else c

def new_canvas(w, h):
    return Image.new("RGBA", (w, h), (0, 0, 0, 0))

def px(img, x, y, color_name):
    """Paint a single pixel."""
    if 0 <= x < img.width and 0 <= y < img.height:
        img.putpixel((x, y), rgba(color_name))

def row(img, x1, x2, y, color_name):
    """Paint a horizontal run of pixels."""
    for x in range(x1, x2 + 1):
        px(img, x, y, color_name)

def col(img, y1, y2, x, color_name):
    """Paint a vertical run of pixels."""
    for y in range(y1, y2 + 1):
        px(img, x, y, color_name)

def rect(img, x1, y1, x2, y2, color_name):
    for y in range(y1, y2 + 1):
        row(img, x1, x2, y, color_name)

def outline_sprite(img):
    """Add black outline around all non-transparent pixels (1px expand)."""
    w, h = img.size
    out = img.copy()
    black = rgba("black")
    for y in range(h):
        for x in range(w):
            if img.getpixel((x, y))[3] > 0:
                for dx, dy in [(-1,0),(1,0),(0,-1),(0,1)]:
                    nx, ny = x+dx, y+dy
                    if 0 <= nx < w and 0 <= ny < h:
                        if img.getpixel((nx, ny))[3] == 0:
                            out.putpixel((nx, ny), black)
    return out


# ══════════════════════════════════════════════════════════════════════════════
#  FARMER MALE  (16×24, 4 directions)
# ══════════════════════════════════════════════════════════════════════════════

def draw_farmer_male_front():
    """16×24 chibi farmer boy facing forward."""
    img = new_canvas(16, 24)

    # ── Boots (rows 20-23) ──
    rect(img, 3, 20, 6, 22, "boot")
    rect(img, 9, 20, 12, 22, "boot")
    row(img, 3, 6, 23, "boot_s")
    row(img, 9, 12, 23, "boot_s")

    # ── Legs / overalls lower (rows 16-19) ──
    rect(img, 3, 16, 7, 19, "denim")
    rect(img, 8, 16, 12, 19, "denim")
    col(img, 16, 19, 7, "denim_s")
    col(img, 16, 19, 8, "denim_s")

    # ── Body / overalls bib (rows 9-15) ──
    rect(img, 2, 9, 13, 15, "denim")
    rect(img, 2, 9, 13, 10, "denim_s")   # shoulder shadow
    # White shirt sides
    col(img, 11, 14, 2, "white")
    col(img, 11, 14, 13, "white")
    # Suspenders
    px(img, 4, 10, "white_s")
    px(img, 11, 10, "white_s")

    # ── Arms (rows 9-14) ──
    col(img, 9, 14, 1, "white")
    col(img, 9, 14, 14, "white")
    col(img, 9, 14, 0, "white_s")
    col(img, 9, 14, 15, "white_s")

    # ── Neck (row 8) ──
    row(img, 6, 9, 8, "skin_light")

    # ── Head (rows 1-7) ──
    rect(img, 3, 1, 12, 7, "skin_light")
    rect(img, 4, 2, 11, 6, "skin_light")
    # Shading sides
    col(img, 2, 6, 3, "skin_mid")
    col(img, 2, 6, 12, "skin_mid")
    # Eyes
    px(img, 5, 4, "black")
    px(img, 10, 4, "black")
    # Eye shine
    px(img, 5, 3, "white")
    px(img, 10, 3, "white")
    # Smile
    px(img, 6, 6, "skin_dark")
    px(img, 9, 6, "skin_dark")
    row(img, 7, 8, 6, "skin_mid")
    # Rosy cheeks
    px(img, 4, 5, "pink")
    px(img, 11, 5, "pink")
    # Hair (top peeking under hat)
    row(img, 4, 11, 1, "hair_brown")

    # ── Straw hat (rows -2 to 2, clipped to 0) ──
    # Brim
    row(img, 1, 14, 2, "straw")
    row(img, 0, 15, 3, "straw")
    row(img, 0, 15, 2, "straw_s")
    # Crown
    rect(img, 3, 0, 12, 1, "straw")
    row(img, 3, 12, 0, "straw_d")

    return outline_sprite(img)


def draw_farmer_male_back():
    img = new_canvas(16, 24)
    # Boots
    rect(img, 3, 20, 6, 22, "boot_s")
    rect(img, 9, 20, 12, 22, "boot_s")
    row(img, 3, 6, 23, "boot"); row(img, 9, 12, 23, "boot")
    # Legs
    rect(img, 3, 16, 7, 19, "denim_s")
    rect(img, 8, 16, 12, 19, "denim_s")
    # Body
    rect(img, 2, 9, 13, 15, "denim_s")
    row(img, 2, 13, 9, "denim_d")
    # Arms
    col(img, 9, 14, 1, "white_s"); col(img, 9, 14, 14, "white_s")
    # Neck
    row(img, 6, 9, 8, "skin_mid")
    # Head back
    rect(img, 3, 1, 12, 7, "skin_mid")
    # Hair covering head (back view)
    rect(img, 3, 1, 12, 5, "hair_brown")
    rect(img, 3, 1, 12, 3, "hair_brown_s")
    # Hat (back)
    row(img, 1, 14, 2, "straw_s")
    row(img, 0, 15, 3, "straw_s")
    rect(img, 3, 0, 12, 1, "straw_d")
    return outline_sprite(img)


def draw_farmer_male_side(facing_right=True):
    img = new_canvas(16, 24)
    if facing_right:
        f, b = 10, 5   # front x, back x
    else:
        f, b = 5, 10

    # Boots
    rect(img, 5, 20, 9, 22, "boot")
    row(img, 5, 9, 23, "boot_s")
    # Legs
    rect(img, 5, 16, 9, 19, "denim")
    col(img, 16, 19, f, "denim_s")
    # Body
    rect(img, 4, 9, 11, 15, "denim")
    col(img, 9, 14, f, "denim_s")
    # Arm (front)
    col(img, 9, 14, f+1 if facing_right else f-1, "white")
    col(img, 10, 14, f+2 if facing_right else f-2, "white_s")
    # Neck
    col(img, 8, 8, 7, "skin_light")
    px(img, 7, 8, "skin_light")
    px(img, 8, 8, "skin_light")
    # Head
    rect(img, 4, 1, 11, 7, "skin_light")
    col(img, 2, 6, b, "skin_mid")
    # Eye (side)
    px(img, f-1 if facing_right else f+1, 4, "black")
    # Smile
    px(img, f-1 if facing_right else f+1, 6, "skin_dark")
    # Cheek
    px(img, f-1 if facing_right else f+1, 5, "pink")
    # Hair side
    col(img, 1, 4, b, "hair_brown")
    col(img, 1, 3, b+1 if not facing_right else b-1, "hair_brown")
    # Hat brim
    row(img, 2, 13, 2, "straw")
    row(img, 2, 13, 3, "straw_s")
    # Hat crown
    rect(img, 4, 0, 11, 1, "straw")
    row(img, 4, 11, 0, "straw_d")
    return outline_sprite(img)


def make_farmer_male_sheet():
    """4-direction sprite sheet: [down, up, left, right] arranged horizontally."""
    frames = [
        draw_farmer_male_front(),
        draw_farmer_male_back(),
        draw_farmer_male_side(facing_right=False),
        draw_farmer_male_side(facing_right=True),
    ]
    sheet = new_canvas(16 * 4, 24)
    for i, f in enumerate(frames):
        sheet.paste(f, (i * 16, 0), f)
    return sheet


# ══════════════════════════════════════════════════════════════════════════════
#  FARMER FEMALE  (16×24, 4 directions)
# ══════════════════════════════════════════════════════════════════════════════

def draw_farmer_female_front():
    img = new_canvas(16, 24)
    # Boots
    rect(img, 3, 20, 6, 22, "boot"); rect(img, 9, 20, 12, 22, "boot")
    row(img, 3, 6, 23, "boot_s"); row(img, 9, 12, 23, "boot_s")
    # Dress skirt flare (rows 15-19)
    rect(img, 2, 15, 13, 19, "green_dress")
    row(img, 2, 13, 15, "green_s")
    col(img, 15, 19, 2, "green_s"); col(img, 15, 19, 13, "green_s")
    # Body / dress bodice (rows 9-14)
    rect(img, 3, 9, 12, 14, "green_dress")
    row(img, 3, 12, 9, "green_s")
    # Apron overlay
    rect(img, 5, 9, 10, 14, "white")
    row(img, 5, 10, 14, "white_s")
    # Arms
    col(img, 9, 14, 1, "skin_light"); col(img, 9, 14, 14, "skin_light")
    col(img, 9, 14, 0, "skin_mid");   col(img, 9, 14, 15, "skin_mid")
    # Neck
    row(img, 6, 9, 8, "skin_light")
    # Head
    rect(img, 3, 1, 12, 7, "skin_light")
    col(img, 2, 6, 3, "skin_mid"); col(img, 2, 6, 12, "skin_mid")
    # Eyes (bigger, rounder — feminine)
    px(img, 5, 4, "black"); px(img, 10, 4, "black")
    px(img, 5, 3, "white"); px(img, 10, 3, "white")
    px(img, 6, 4, "black"); px(img, 11, 4, "black")  # wider eye
    # Eyelashes
    px(img, 4, 3, "black"); px(img, 12, 3, "black")
    # Smile
    row(img, 6, 9, 6, "skin_dark")
    px(img, 5, 6, "skin_mid"); px(img, 10, 6, "skin_mid")
    # Cheeks
    px(img, 4, 5, "pink"); px(img, 11, 5, "pink")
    # Hair (blonde, side tufts)
    row(img, 3, 12, 1, "hair_gold")
    col(img, 1, 5, 3, "hair_gold"); col(img, 1, 5, 12, "hair_gold")
    row(img, 3, 12, 1, "hair_gold_s")
    # Sun hat brim
    row(img, 0, 15, 2, "sunhat"); row(img, 0, 15, 3, "sunhat_s")
    row(img, 1, 14, 4, "sunhat_s")
    # Hat crown
    rect(img, 3, 0, 12, 1, "sunhat"); row(img, 3, 12, 0, "straw_d")
    # Pink flower on hat
    px(img, 13, 1, "pink"); px(img, 14, 0, "pink"); px(img, 14, 1, "pink")
    px(img, 14, 2, "pink"); px(img, 13, 2, "pink_d"); px(img, 15, 1, "pink_d")
    return outline_sprite(img)


def draw_farmer_female_back():
    img = new_canvas(16, 24)
    rect(img, 3, 20, 6, 22, "boot_s"); rect(img, 9, 20, 12, 22, "boot_s")
    row(img, 3, 6, 23, "boot");  row(img, 9, 12, 23, "boot")
    rect(img, 2, 15, 13, 19, "green_s")
    rect(img, 3, 9, 12, 14, "green_s")
    col(img, 9, 14, 1, "skin_mid"); col(img, 9, 14, 14, "skin_mid")
    row(img, 6, 9, 8, "skin_mid")
    rect(img, 3, 1, 12, 7, "skin_mid")
    # Long hair back
    rect(img, 3, 1, 12, 7, "hair_gold_s")
    rect(img, 3, 1, 12, 3, "hair_gold")
    # Hat back
    row(img, 0, 15, 2, "sunhat_s"); row(img, 0, 15, 3, "straw_d")
    rect(img, 3, 0, 12, 1, "straw_d")
    # Flower back (still visible)
    px(img, 13, 1, "pink"); px(img, 14, 1, "pink_d")
    return outline_sprite(img)


def draw_farmer_female_side(facing_right=True):
    img = new_canvas(16, 24)
    f = 10 if facing_right else 5
    b = 5  if facing_right else 10
    # Boots
    rect(img, 5, 20, 9, 22, "boot"); row(img, 5, 9, 23, "boot_s")
    # Dress
    rect(img, 4, 15, 11, 19, "green_dress"); col(img, 15, 19, f, "green_s")
    rect(img, 4, 9, 11, 14, "green_dress"); col(img, 9, 14, f, "green_s")
    # Arms
    col(img, 9, 14, f+1 if facing_right else f-1, "skin_light")
    # Neck
    px(img, 7, 8, "skin_light"); px(img, 8, 8, "skin_light")
    # Head
    rect(img, 4, 1, 11, 7, "skin_light"); col(img, 2, 6, b, "skin_mid")
    # Eyes
    px(img, f-1 if facing_right else f+1, 4, "black")
    px(img, f-1 if facing_right else f+1, 3, "white")
    px(img, f-2 if facing_right else f+2, 3, "black")  # lash
    # Cheek / smile
    px(img, f-1 if facing_right else f+1, 5, "pink")
    px(img, f-1 if facing_right else f+1, 6, "skin_dark")
    # Hair
    col(img, 1, 5, b, "hair_gold"); col(img, 2, 6, b-1 if facing_right else b+1, "hair_gold_s")
    # Hat
    row(img, 2, 13, 2, "sunhat"); row(img, 2, 13, 3, "sunhat_s")
    rect(img, 4, 0, 11, 1, "sunhat"); row(img, 4, 11, 0, "straw_d")
    # Flower (front side)
    px(img, f+1 if facing_right else f-1, 1, "pink")
    px(img, f+1 if facing_right else f-1, 2, "pink_d")
    return outline_sprite(img)


def make_farmer_female_sheet():
    frames = [
        draw_farmer_female_front(),
        draw_farmer_female_back(),
        draw_farmer_female_side(facing_right=False),
        draw_farmer_female_side(facing_right=True),
    ]
    sheet = new_canvas(16 * 4, 24)
    for i, f in enumerate(frames):
        sheet.paste(f, (i * 16, 0), f)
    return sheet


# ══════════════════════════════════════════════════════════════════════════════
#  NPC SHOPKEEPER  (16×24, 4 directions)
# ══════════════════════════════════════════════════════════════════════════════

def draw_shopkeeper_front():
    img = new_canvas(16, 24)
    # Shoes (stubby, round)
    rect(img, 2, 20, 6, 22, "boot_s"); rect(img, 9, 20, 13, 22, "boot_s")
    row(img, 2, 6, 23, "boot"); row(img, 9, 13, 23, "boot")
    # Rotund belly / body (rows 8-19)
    rect(img, 1, 8, 14, 19, "apron_g")
    row(img, 1, 14, 8, "apron_gs"); row(img, 1, 14, 19, "apron_gs")
    col(img, 8, 19, 1, "apron_gs"); col(img, 8, 19, 14, "apron_gs")
    # Apron front panel
    rect(img, 4, 10, 11, 18, "white"); row(img, 4, 11, 18, "white_s")
    # Arms (short, chubby)
    col(img, 11, 17, 0, "apron_g"); col(img, 11, 17, 15, "apron_g")
    col(img, 11, 17, 1, "apron_gs"); col(img, 11, 17, 14, "apron_gs")
    # Hands
    px(img, 0, 16, "skin_light"); px(img, 15, 16, "skin_light")
    # Neck
    row(img, 5, 10, 8, "skin_light"); row(img, 5, 10, 7, "skin_mid")
    # Head (large chibi)
    rect(img, 2, 1, 13, 6, "skin_light")
    col(img, 2, 5, 2, "skin_mid"); col(img, 2, 5, 13, "skin_mid")
    row(img, 2, 13, 6, "skin_mid")
    # Eyes (warm, squinty friendly)
    row(img, 4, 6, 3, "black"); row(img, 9, 11, 3, "black")
    px(img, 5, 4, "white"); px(img, 10, 4, "white")
    # Big warm smile
    row(img, 5, 10, 5, "skin_dark")
    px(img, 4, 5, "skin_mid"); px(img, 11, 5, "skin_mid")
    row(img, 5, 10, 6, "skin_mid")
    # Rosy round cheeks
    row(img, 3, 5, 4, "pink"); row(img, 10, 12, 4, "pink")
    # White beard
    rect(img, 3, 6, 12, 7, "beard")
    row(img, 3, 12, 6, "beard_s")
    # Merchant hat
    row(img, 1, 14, 0, "merch_hat"); row(img, 1, 14, 1, "merch_hat_s")  # brim
    rect(img, 4, 0, 11, 0, "merch_hat_s")  # already covered
    # Hat body (above head — extend canvas concept, clip to row 0)
    row(img, 3, 12, 0, "merch_hat_s")
    return outline_sprite(img)


def draw_shopkeeper_back():
    img = new_canvas(16, 24)
    rect(img, 2, 20, 6, 22, "boot"); rect(img, 9, 20, 13, 22, "boot")
    row(img, 2, 6, 23, "boot_s"); row(img, 9, 13, 23, "boot_s")
    rect(img, 1, 8, 14, 19, "apron_gs")
    col(img, 11, 17, 0, "apron_gs"); col(img, 11, 17, 15, "apron_gs")
    row(img, 5, 10, 8, "skin_mid"); row(img, 5, 10, 7, "skin_dark")
    rect(img, 2, 1, 13, 6, "skin_mid")
    rect(img, 3, 1, 12, 4, "hair_white"); row(img, 3, 12, 1, "hair_white_s")
    # Hat back
    row(img, 1, 14, 0, "merch_hat_s"); row(img, 1, 14, 1, "merch_hat")
    row(img, 3, 12, 0, "merch_hat")
    return outline_sprite(img)


def draw_shopkeeper_side(facing_right=True):
    img = new_canvas(16, 24)
    f = 10 if facing_right else 5
    b = 5  if facing_right else 10
    # Shoes
    rect(img, 4, 20, 10, 22, "boot_s"); row(img, 4, 10, 23, "boot")
    # Rotund body
    rect(img, 3, 8, 12, 19, "apron_g"); col(img, 8, 19, f, "apron_gs")
    col(img, 8, 19, b, "apron_gs")
    # Front arm
    col(img, 12, 17, f+1 if facing_right else f-1, "apron_gs")
    px(img, f+2 if facing_right else f-2, 16, "skin_light")
    # Neck / head
    px(img, 7, 7, "skin_light"); px(img, 8, 7, "skin_light")
    rect(img, 4, 1, 11, 6, "skin_light"); col(img, 2, 5, b, "skin_mid")
    # Eye
    px(img, f-1 if facing_right else f+1, 3, "black")
    px(img, f-2 if facing_right else f+2, 3, "white")
    # Smile / cheek
    px(img, f-1 if facing_right else f+1, 5, "skin_dark")
    row(img, f-2 if facing_right else f-1,
        f-1 if facing_right else f+2, 4, "pink")
    # Beard side
    col(img, 6, 7, f-1 if facing_right else f+1, "beard")
    col(img, 6, 7, f-2 if facing_right else f+2, "beard_s")
    # Hat
    row(img, 2, 13, 0, "merch_hat"); row(img, 2, 13, 1, "merch_hat_s")
    rect(img, 4, 0, 11, 0, "merch_hat_s")
    return outline_sprite(img)


def make_shopkeeper_sheet():
    frames = [
        draw_shopkeeper_front(),
        draw_shopkeeper_back(),
        draw_shopkeeper_side(facing_right=False),
        draw_shopkeeper_side(facing_right=True),
    ]
    sheet = new_canvas(16 * 4, 24)
    for i, f in enumerate(frames):
        sheet.paste(f, (i * 16, 0), f)
    return sheet


# ══════════════════════════════════════════════════════════════════════════════
#  CHICKEN  (16×16, 4 directions)
# ══════════════════════════════════════════════════════════════════════════════

def draw_chicken_front():
    img = new_canvas(16, 16)
    # Feet
    px(img, 5, 14, "beak"); px(img, 5, 15, "beak_s")
    px(img, 10, 14, "beak"); px(img, 10, 15, "beak_s")
    px(img, 4, 15, "beak_s"); px(img, 11, 15, "beak_s")
    # Body (round)
    rect(img, 3, 7, 12, 13, "chick_w")
    rect(img, 4, 8, 11, 12, "chick_w")
    row(img, 3, 12, 13, "chick_ws")
    col(img, 8, 12, 3, "chick_ws"); col(img, 8, 12, 12, "chick_ws")
    # Wing hints
    row(img, 3, 5, 10, "chick_ws"); row(img, 10, 12, 10, "chick_ws")
    # Neck
    row(img, 6, 9, 6, "chick_w"); row(img, 7, 8, 5, "chick_w")
    # Head
    rect(img, 5, 2, 10, 5, "chick_w")
    rect(img, 4, 3, 11, 4, "chick_w")
    row(img, 4, 11, 5, "chick_ws")
    col(img, 3, 4, 5, "chick_ws"); col(img, 3, 4, 10, "chick_ws")
    # Comb
    px(img, 6, 1, "comb"); px(img, 7, 0, "comb"); px(img, 8, 1, "comb"); px(img, 9, 1, "comb")
    px(img, 7, 1, "comb_s"); px(img, 8, 0, "comb_s")
    # Beak
    px(img, 7, 4, "beak"); px(img, 8, 4, "beak"); px(img, 7, 5, "beak_s")
    # Eyes
    px(img, 5, 3, "black"); px(img, 10, 3, "black")
    px(img, 5, 2, "white"); px(img, 10, 2, "white")
    # Wattle
    px(img, 7, 6, "comb"); px(img, 8, 6, "comb_s")
    return outline_sprite(img)


def draw_chicken_back():
    img = new_canvas(16, 16)
    px(img, 5, 14, "beak_s"); px(img, 10, 14, "beak_s")
    px(img, 5, 15, "beak_s"); px(img, 10, 15, "beak_s")
    rect(img, 3, 7, 12, 13, "chick_ws"); rect(img, 4, 8, 11, 12, "chick_ws")
    row(img, 6, 9, 6, "chick_ws"); row(img, 7, 8, 5, "chick_ws")
    rect(img, 5, 2, 10, 5, "chick_ws"); rect(img, 4, 3, 11, 4, "chick_ws")
    # Tail feather hint
    px(img, 7, 14, "chick_ws"); px(img, 8, 14, "chick_ws")
    px(img, 6, 13, "chick_w"); px(img, 9, 13, "chick_w")
    # Comb back
    px(img, 7, 1, "comb_s"); px(img, 8, 1, "comb_s")
    return outline_sprite(img)


def draw_chicken_side(facing_right=True):
    img = new_canvas(16, 16)
    fx = 9 if facing_right else 6
    bx = 4 if facing_right else 11
    # Feet
    px(img, fx, 14, "beak"); px(img, fx, 15, "beak_s")
    px(img, fx+1 if facing_right else fx-1, 15, "beak_s")
    px(img, bx+1 if facing_right else bx-1, 14, "beak")
    # Body oval
    rect(img, 4, 7, 11, 13, "chick_w")
    rect(img, 3, 8, 12, 12, "chick_w")
    col(img, 8, 12, bx, "chick_ws")
    row(img, 4, 11, 13, "chick_ws")
    # Tail
    px(img, bx-1 if facing_right else bx+1, 8, "chick_ws")
    px(img, bx-1 if facing_right else bx+1, 7, "chick_ws")
    # Neck
    col(img, 5, 7, fx, "chick_w"); col(img, 5, 6, fx+1 if facing_right else fx-1, "chick_w")
    # Head
    rect(img, fx-2, 2, fx+2, 5, "chick_w")
    col(img, 3, 4, fx-2, "chick_ws"); col(img, 3, 4, fx+2, "chick_ws")
    row(img, fx-2, fx+2, 5, "chick_ws")
    # Comb
    px(img, fx, 1, "comb"); px(img, fx-1, 0, "comb"); px(img, fx+1, 1, "comb_s")
    # Beak
    ex = fx+2 if facing_right else fx-2
    px(img, ex, 4, "beak"); px(img, ex, 5, "beak_s")
    # Eye
    px(img, fx, 3, "black"); px(img, fx, 2, "white")
    # Wattle
    px(img, ex-1 if facing_right else ex+1, 5, "comb")
    return outline_sprite(img)


def make_chicken_sheet():
    frames = [
        draw_chicken_front(),
        draw_chicken_back(),
        draw_chicken_side(facing_right=False),
        draw_chicken_side(facing_right=True),
    ]
    sheet = new_canvas(16 * 4, 16)
    for i, f in enumerate(frames):
        sheet.paste(f, (i * 16, 0), f)
    return sheet


# ══════════════════════════════════════════════════════════════════════════════
#  WALK ANIMATIONS  (4-frame, horizontal strip)
# ══════════════════════════════════════════════════════════════════════════════

def make_walk_frames(front_fn, side_fn):
    """
    Simple walk cycle — 4 frames using facing-down direction with
    leg offsets to simulate stride.
    Frame layout: neutral, stride-right, neutral, stride-left
    """
    base = front_fn()
    w, h = base.size

    def shift_legs(src, dx_l, dy_l, dx_r, dy_r):
        """Crude leg shift by copying and offsetting lower-body rows."""
        out = new_canvas(w, h)
        # Upper body (rows 0-15) stays fixed
        upper = src.crop((0, 0, w, 16))
        out.paste(upper, (0, 0), upper)
        # Left leg region (cols 2-7, rows 16-23)
        left_leg = src.crop((2, 16, 8, 24))
        out.paste(left_leg, (2 + dx_l, 16 + dy_l), left_leg)
        # Right leg region (cols 8-13, rows 16-23)
        right_leg = src.crop((8, 16, 14, 24))
        out.paste(right_leg, (8 + dx_r, 16 + dy_r), right_leg)
        return out

    f0 = base                           # neutral
    f1 = shift_legs(base, 0, -1, 0, 1) # right foot forward
    f2 = base                           # neutral
    f3 = shift_legs(base, 0, 1, 0, -1) # left foot forward

    sheet = new_canvas(w * 4, h)
    for i, fr in enumerate([f0, f1, f2, f3]):
        sheet.paste(fr, (i * w, 0), fr)
    return sheet


def make_idle_frames(front_fn):
    """2-frame idle: base + very subtle bob."""
    base = front_fn()
    w, h = base.size

    def bob(src, dy):
        out = new_canvas(w, h)
        # Shift entire sprite up/down by dy within canvas
        if dy < 0:
            body = src.crop((0, 0, w, h + dy))
            out.paste(body, (0, -dy), body)
        else:
            body = src.crop((0, dy, w, h))
            out.paste(body, (0, 0), body)
        return out

    f0 = base
    f1 = bob(base, -1)

    sheet = new_canvas(w * 2, h)
    sheet.paste(f0, (0, 0), f0)
    sheet.paste(f1, (w, 0), f1)
    return sheet


# ══════════════════════════════════════════════════════════════════════════════
#  SCALE UP for visibility  (×4 nearest-neighbor)
# ══════════════════════════════════════════════════════════════════════════════

def scale(img, factor=4):
    w, h = img.size
    return img.resize((w * factor, h * factor), Image.NEAREST)


# ══════════════════════════════════════════════════════════════════════════════
#  MAIN
# ══════════════════════════════════════════════════════════════════════════════

if __name__ == "__main__":
    results = {}

    # ── Farmer Male ──────────────────────────────────────────────────────────
    print("Generating farmer_male sprites...")
    fm_sheet = make_farmer_male_sheet()
    fm_path = os.path.join(OUTPUT_DIR, "farmer_male.png")
    scale(fm_sheet).save(fm_path)
    results["farmer_male"] = {"path": fm_path, "size": f"{fm_sheet.width}x{fm_sheet.height}"}

    fm_walk = make_walk_frames(draw_farmer_male_front, draw_farmer_male_side)
    fm_walk_path = os.path.join(OUTPUT_DIR, "farmer_male_walk.png")
    scale(fm_walk).save(fm_walk_path)
    results["farmer_male_walk"] = {"path": fm_walk_path}

    fm_idle = make_idle_frames(draw_farmer_male_front)
    fm_idle_path = os.path.join(OUTPUT_DIR, "farmer_male_idle.png")
    scale(fm_idle).save(fm_idle_path)
    results["farmer_male_idle"] = {"path": fm_idle_path}

    # ── Farmer Female ─────────────────────────────────────────────────────────
    print("Generating farmer_female sprites...")
    ff_sheet = make_farmer_female_sheet()
    ff_path = os.path.join(OUTPUT_DIR, "farmer_female.png")
    scale(ff_sheet).save(ff_path)
    results["farmer_female"] = {"path": ff_path, "size": f"{ff_sheet.width}x{ff_sheet.height}"}

    ff_walk = make_walk_frames(draw_farmer_female_front, draw_farmer_female_side)
    ff_walk_path = os.path.join(OUTPUT_DIR, "farmer_female_walk.png")
    scale(ff_walk).save(ff_walk_path)
    results["farmer_female_walk"] = {"path": ff_walk_path}

    ff_idle = make_idle_frames(draw_farmer_female_front)
    ff_idle_path = os.path.join(OUTPUT_DIR, "farmer_female_idle.png")
    scale(ff_idle).save(ff_idle_path)
    results["farmer_female_idle"] = {"path": ff_idle_path}

    # ── NPC Shopkeeper ────────────────────────────────────────────────────────
    print("Generating npc_shopkeeper sprites...")
    sk_sheet = make_shopkeeper_sheet()
    sk_path = os.path.join(OUTPUT_DIR, "npc_shopkeeper.png")
    scale(sk_sheet).save(sk_path)
    results["npc_shopkeeper"] = {"path": sk_path, "size": f"{sk_sheet.width}x{sk_sheet.height}"}

    # ── Chicken ───────────────────────────────────────────────────────────────
    print("Generating chicken sprites...")
    ch_sheet = make_chicken_sheet()
    ch_path = os.path.join(OUTPUT_DIR, "chicken.png")
    scale(ch_sheet).save(ch_path)
    results["chicken"] = {"path": ch_path, "size": f"{ch_sheet.width}x{ch_sheet.height}"}

    print("\nAll sprites generated:")
    for k, v in results.items():
        print(f"  {k}: {v['path']}")
