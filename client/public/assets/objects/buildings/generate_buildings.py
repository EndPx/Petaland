"""
Petaland Pixel Art Building Generator
Generates 10 building/crafting station objects following the Petaland style guide.
Palette: warm browns, soft greens, cool grays, warm fire oranges.
All outputs: transparent background PNG.
"""

from PIL import Image, ImageDraw
import os

OUT = "D:/Belajar/Hackacton/Colloseum/assets/objects/buildings"

# ── Petaland palette ──────────────────────────────────────────────────────────
BLK  = (20,  14,  10,  255)   # black outline
W    = (255, 255, 255, 255)
T    = (0,   0,   0,   0)     # transparent

# Wood tones
WD1  = (160, 114,  74, 255)   # light wood
WD2  = (125,  90,  60, 255)   # mid wood
WD3  = (88,   61,  40, 255)   # dark wood
WD4  = (62,   40,  24, 255)   # very dark wood (shadow)

# Dirt / soil
DR1  = (196, 164, 108, 255)   # light dirt
DR2  = (139, 111,  71, 255)   # mid dirt
DR3  = (92,   72,  48, 255)   # dark dirt

# Stone / cobble
ST1  = (180, 185, 190, 255)   # light stone
ST2  = (140, 148, 155, 255)   # mid stone
ST3  = (96,  108, 115, 255)   # dark stone
ST4  = (60,   68,  75, 255)   # shadow stone

# Fire / glow
FR1  = (255, 220,  60, 255)   # bright yellow
FR2  = (255, 160,  30, 255)   # orange
FR3  = (220,  80,  20, 255)   # deep orange
FR4  = (180,  40,  10, 255)   # ember red

# Greens
GR1  = (126, 200,  80, 255)   # light green
GR2  = (91,  140,  62, 255)   # mid green
GR3  = (61,  107,  46, 255)   # dark green

# Metal
MT1  = (200, 210, 215, 255)   # bright metal
MT2  = (140, 150, 160, 255)   # mid metal
MT3  = (80,   90,  100, 255)  # dark metal

# Rope / straw
RP1  = (220, 195, 130, 255)
RP2  = (180, 155,  90, 255)

# Fabric / awning colors
AW1  = (220,  80,  80, 255)   # red awning
AW2  = (240, 190,  60, 255)   # yellow stripe
AW3  = (80,  160,  80, 255)   # green

# Skin / straw scarecrow
SK1  = (230, 195, 145, 255)
SK2  = (200, 160, 100, 255)
HAT1 = (140, 100,  50, 255)
HAT2 = (100,  70,  30, 255)
PATCH1 = (180, 120,  60, 255)
PATCH2 = (100,  80, 160, 255)

# ── Helper ────────────────────────────────────────────────────────────────────

def new(w, h):
    img = Image.new("RGBA", (w, h), T)
    return img, ImageDraw.Draw(img)

def px(d, x, y, c):
    """Draw single pixel."""
    d.point((x, y), fill=c)

def rect(d, x0, y0, x1, y1, c):
    d.rectangle([x0, y0, x1, y1], fill=c)

def hline(d, y, x0, x1, c):
    d.line([(x0, y), (x1, y)], fill=c)

def vline(d, x, y0, y1, c):
    d.line([(x, y0), (x, y1)], fill=c)

def outline_rect(d, x0, y0, x1, y1, fill, border=BLK):
    rect(d, x0, y0, x1, y1, fill)
    d.rectangle([x0, y0, x1, y1], outline=border)

def save(img, name):
    path = os.path.join(OUT, name)
    img.save(path)
    print(f"  Saved: {path}")
    return path


# ═══════════════════════════════════════════════════════════════════════════════
# 1. WORKBENCH  32×32
# ═══════════════════════════════════════════════════════════════════════════════
def make_workbench():
    img, d = new(32, 32)

    # Table top surface (top-down 3/4, table seen from above-front)
    # Top face of table (lighter)
    rect(d,  4,  4, 27, 17, WD1)
    # Front face (darker, lower)
    rect(d,  4, 17, 27, 22, WD2)
    # Outline top
    d.rectangle([4, 4, 27, 17], outline=BLK)
    d.rectangle([4, 17, 27, 22], outline=BLK)

    # Wood grain lines on top
    hline(d, 8,  5, 26, WD2)
    hline(d, 12, 5, 26, WD2)
    hline(d, 16, 5, 26, WD3)

    # Legs (visible below front face)
    rect(d,  5, 22,  8, 28, WD3)
    rect(d, 23, 22, 26, 28, WD3)
    d.rectangle([5, 22, 8, 28], outline=BLK)
    d.rectangle([23, 22, 26, 28], outline=BLK)

    # Shadow under table
    rect(d, 6, 28, 27, 29, (30, 20, 10, 80))

    # Tools on top surface:
    # Hammer head (gray box)
    rect(d, 7,  6, 10,  9, MT2)
    d.rectangle([7, 6, 10, 9], outline=BLK)
    # Hammer handle
    rect(d, 11, 7, 14, 8, WD2)
    d.rectangle([11, 7, 14, 8], outline=BLK)

    # Nails (small dots)
    for nx, ny in [(17, 7), (19, 9), (21, 7)]:
        px(d, nx, ny, MT1)
        px(d, nx, ny+1, MT3)

    # Saw blade (zigzag line)
    for i in range(6):
        x = 8 + i*2
        y = 13 if i % 2 == 0 else 14
        px(d, x, y, MT2)
        px(d, x, 12, BLK)

    return save(img, "workbench.png")


# ═══════════════════════════════════════════════════════════════════════════════
# 2. BONFIRE  24×24
# ═══════════════════════════════════════════════════════════════════════════════
def make_bonfire():
    img, d = new(24, 24)

    # Stone ring base (top-down oval)
    # Outer ring
    for x in range(4, 20):
        for y in range(14, 22):
            cx, cy = 12, 17
            dx, dy = (x - cx) / 7.5, (y - cy) / 3.5
            if 0.75 < dx*dx + dy*dy <= 1.0:
                c = ST2 if (x + y) % 3 != 0 else ST1
                px(d, x, y, c)
                if 0.9 < dx*dx + dy*dy <= 1.0:
                    px(d, x, y, BLK)

    # Inner ground (dark earth)
    for x in range(6, 18):
        for y in range(15, 21):
            cx, cy = 12, 17
            dx, dy = (x - cx) / 5.5, (y - cy) / 2.8
            if dx*dx + dy*dy <= 0.75:
                px(d, x, y, DR3)

    # Logs (X cross, top-down)
    # Log 1: NW-SE
    for i in range(-3, 4):
        px(d, 12+i, 17+i//2, WD2)
        if abs(i) <= 2:
            px(d, 12+i, 17+i//2-1, WD1)
    # Log 2: NE-SW
    for i in range(-3, 4):
        px(d, 12-i, 17+i//2, WD3)
        if abs(i) <= 2:
            px(d, 12-i, 17+i//2-1, WD2)

    # Flame (center, going up)
    # Base flame (wide, orange)
    flame_pixels = [
        # (x, y, color)
        (11, 14, FR2), (12, 14, FR2), (13, 14, FR2),
        (10, 12, FR2), (11, 12, FR1), (12, 11, FR1), (13, 12, FR1), (14, 12, FR2),
        (11, 11, FR2), (12, 10, FR1), (13, 11, FR2),
        (11, 13, FR3), (12, 13, FR1), (13, 13, FR3),
        (10, 13, FR3), (14, 13, FR3),
        (12,  9, FR1), (11, 10, FR2), (13, 10, FR2),
        (12,  8, (255, 240, 200, 200)),  # bright tip
    ]
    for fx, fy, fc in flame_pixels:
        px(d, fx, fy, fc)

    # Glow halo (soft)
    glow = [(255, 160, 30, 60), (255, 200, 60, 40)]
    for gx in range(8, 17):
        for gy in range(10, 18):
            dx, dy = gx - 12, gy - 14
            dist = dx*dx + dy*dy
            if 4 < dist <= 16:
                r, g, b, a = img.getpixel((gx, gy))
                if a == 0:
                    px(d, gx, gy, (255, 140, 20, 30))

    return save(img, "bonfire.png")


# ═══════════════════════════════════════════════════════════════════════════════
# 3. STORAGE BOX  16×16
# ═══════════════════════════════════════════════════════════════════════════════
def make_storage_box():
    img, d = new(16, 16)

    # Top face (lighter, seen from above)
    rect(d, 1,  1, 14,  7, WD1)
    # Front face
    rect(d, 1,  7, 14, 13, WD2)
    # Side face (right)
    rect(d, 14, 4, 15, 13, WD3)

    # Outline
    d.rectangle([1, 1, 14, 7], outline=BLK)
    d.rectangle([1, 7, 14, 13], outline=BLK)
    d.rectangle([14, 4, 15, 13], outline=BLK)

    # Wood plank lines (top face)
    hline(d, 4, 2, 13, WD2)
    # Wood plank lines (front face)
    hline(d, 10, 2, 13, WD3)

    # Metal hinge (top-left of front)
    rect(d, 2, 7, 3, 8, MT2)
    px(d, 2, 7, MT1)
    # Metal hinge (top-right of front)
    rect(d, 12, 7, 13, 8, MT2)
    px(d, 12, 7, MT1)

    # Metal latch (center front)
    rect(d, 6, 9, 9, 11, MT2)
    d.rectangle([6, 9, 9, 11], outline=BLK)
    px(d, 7, 10, MT1)
    px(d, 8, 10, MT1)

    # Shadow
    rect(d, 2, 13, 14, 14, (20, 12, 6, 60))

    return save(img, "storage_box.png")


# ═══════════════════════════════════════════════════════════════════════════════
# 4. WELL  32×32
# ═══════════════════════════════════════════════════════════════════════════════
def make_well():
    img, d = new(32, 32)

    # Cobblestone base (top circle seen from above)
    for x in range(4, 28):
        for y in range(12, 28):
            cx, cy = 16, 20
            dx, dy = (x - cx) / 11.0, (y - cy) / 7.5
            dist = dx*dx + dy*dy
            if dist <= 1.0:
                # Cobble pattern
                c = ST2 if (x//3 + y//3) % 2 == 0 else ST1
                if dist > 0.7:
                    c = ST3 if (x + y) % 2 == 0 else ST2
                px(d, x, y, c)

    # Well opening (dark water inside)
    for x in range(9, 23):
        for y in range(15, 25):
            cx, cy = 16, 20
            dx, dy = (x - cx) / 6.5, (y - cy) / 4.5
            if dx*dx + dy*dy <= 0.8:
                # Water color
                c = (50, 100, 180, 255) if (x + y) % 3 != 0 else (70, 130, 200, 255)
                px(d, x, y, c)
                # Water highlight ripple
                if (x + y) % 5 == 0:
                    px(d, x, y, (140, 190, 230, 255))

    # Outer cobble outline ring
    for x in range(4, 28):
        for y in range(12, 28):
            cx, cy = 16, 20
            dx, dy = (x - cx) / 11.0, (y - cy) / 7.5
            dist = dx*dx + dy*dy
            if 0.9 < dist <= 1.0:
                px(d, x, y, BLK)

    # Wooden roof supports (two vertical posts)
    rect(d,  8,  2, 10, 14, WD2)
    rect(d, 22,  2, 24, 14, WD2)
    d.rectangle([8,  2, 10, 14], outline=BLK)
    d.rectangle([22, 2, 24, 14], outline=BLK)

    # Roof beam across top
    rect(d,  8,  2, 24,  5, WD1)
    d.rectangle([8, 2, 24, 5], outline=BLK)
    # Roof ridge shadow
    hline(d, 3, 9, 23, WD2)

    # Crossbar (winch rod)
    rect(d, 12,  6, 20,  8, WD3)
    d.rectangle([12, 6, 20, 8], outline=BLK)

    # Rope (hanging)
    for ry in range(8, 16):
        px(d, 16, ry, RP2)
        if ry % 2 == 0:
            px(d, 15, ry, RP1)

    # Bucket
    rect(d, 13, 16, 19, 21, WD2)
    d.rectangle([13, 16, 19, 21], outline=BLK)
    # Bucket handle
    hline(d, 15, 14, 20, RP2)
    px(d, 14, 15, RP1)
    px(d, 18, 15, RP1)

    return save(img, "well.png")


# ═══════════════════════════════════════════════════════════════════════════════
# 5. FENCE  16×16
# ═══════════════════════════════════════════════════════════════════════════════
def make_fence():
    img, d = new(16, 16)

    # Two horizontal rails
    rect(d, 0,  4, 15,  6, WD1)
    rect(d, 0, 10, 15, 12, WD1)
    d.rectangle([0,  4, 15,  6], outline=BLK)
    d.rectangle([0, 10, 15, 12], outline=BLK)

    # Wood grain on rails
    for rx in range(1, 15, 3):
        px(d, rx, 5, WD2)
        px(d, rx, 11, WD2)

    # Three vertical pickets
    for px_x in [2, 7, 12]:
        rect(d, px_x,  1, px_x+2, 14, WD2)
        d.rectangle([px_x, 1, px_x+2, 14], outline=BLK)
        # Pointed top
        px(d, px_x+1, 0, WD1)
        # Shadow side
        vline(d, px_x+2, 2, 13, WD3)

    # Slight shadow at ground
    rect(d, 1, 14, 14, 15, (20, 12, 6, 50))

    return save(img, "fence_horizontal.png")


# ═══════════════════════════════════════════════════════════════════════════════
# 6. SOIL BED (EMPTY)  16×16
# ═══════════════════════════════════════════════════════════════════════════════
def make_soil_bed():
    img, d = new(16, 16)

    # Tilled soil — dark rich earth
    # Base
    rect(d, 1, 2, 14, 13, DR3)

    # Tilled row furrows (lighter ridges)
    for fy in range(3, 13, 2):
        hline(d, fy, 2, 13, DR2)

    # Highlight on ridge tops
    for fy in range(3, 13, 2):
        hline(d, fy, 2, 13, DR2)
        px(d, 2, fy, DR1)
        px(d, 13, fy, DR2)

    # Border edge of bed (wooden border planks)
    rect(d, 1, 1, 14,  2, WD2)   # top plank
    rect(d, 1, 13, 14, 14, WD3)  # bottom plank
    rect(d, 1,  2,  2, 13, WD2)  # left plank
    rect(d, 13, 2, 14, 13, WD3)  # right plank

    # Outline
    d.rectangle([1, 1, 14, 14], outline=BLK)

    # Small soil clumps (texture)
    for cx, cy in [(4, 5), (8, 8), (11, 4), (5, 11), (10, 10)]:
        px(d, cx, cy, (70, 50, 30, 255))
        px(d, cx+1, cy, DR2)

    return save(img, "soil_bed_empty.png")


# ═══════════════════════════════════════════════════════════════════════════════
# 7. SAWMILL  48×48
# ═══════════════════════════════════════════════════════════════════════════════
def make_sawmill():
    img, d = new(48, 48)

    # ── Foundation / ground platform ──
    rect(d, 2, 28, 45, 44, WD3)
    d.rectangle([2, 28, 45, 44], outline=BLK)
    # Platform wood planks
    for py in range(30, 44, 4):
        hline(d, py, 3, 44, WD4)
    for px_x in range(4, 44, 8):
        vline(d, px_x, 29, 43, WD4)

    # ── Main building walls ──
    # Front wall
    rect(d, 6, 12, 42, 30, WD2)
    d.rectangle([6, 12, 42, 30], outline=BLK)
    # Side wall (right, slightly darker)
    rect(d, 42, 16, 46, 30, WD3)
    d.rectangle([42, 16, 46, 30], outline=BLK)
    # Wood plank lines on front
    for wy in range(15, 30, 4):
        hline(d, wy, 7, 41, WD3)
    for wx in range(8, 42, 6):
        vline(d, wx, 13, 29, WD3)

    # ── Roof ──
    # Roof slope left
    for i in range(10):
        hline(d, 4+i, 10-i//2, 42+i//2, WD1 if i < 5 else WD2)
    d.polygon([(10, 4), (38, 4), (44, 12), (4, 12)], fill=WD1, outline=BLK)
    # Roof ridge
    hline(d, 4, 11, 37, WD2)
    hline(d, 5, 10, 38, WD3)
    # Roof shingles
    for si in range(3):
        hline(d, 6+si*2, 10+si, 38-si, WD2 if si%2==0 else WD3)

    # ── Chimney / exhaust pipe ──
    rect(d, 33,  2, 37, 14, ST2)
    d.rectangle([33, 2, 37, 14], outline=BLK)
    # Smoke puffs
    for spx, spy in [(32, 1), (35, 0), (37, 2)]:
        px(d, spx, spy, (200, 200, 200, 160))

    # ── Door ──
    rect(d, 10, 20, 18, 30, WD4)
    d.rectangle([10, 20, 18, 30], outline=BLK)
    # Door plank
    hline(d, 25, 11, 17, WD3)
    # Doorknob
    px(d, 16, 25, MT1)

    # ── Circular Saw blade (mounted on front wall) ──
    cx_s, cy_s = 31, 22
    r = 6
    # Blade disk
    for bx in range(cx_s-r, cx_s+r+1):
        for by in range(cy_s-r, cy_s+r+1):
            dx, dy = bx-cx_s, by-cy_s
            dist2 = dx*dx + dy*dy
            if dist2 <= r*r:
                # Silver blade
                angle_val = (dx + dy) % 3
                c = MT1 if angle_val == 0 else (MT2 if angle_val == 1 else MT3)
                px(d, bx, by, c)
    # Blade teeth (around edge)
    import math
    for i in range(12):
        angle = i * math.pi * 2 / 12
        tx = int(cx_s + (r+1) * math.cos(angle))
        ty = int(cy_s + (r+1) * math.sin(angle))
        if 0 <= tx < 48 and 0 <= ty < 48:
            px(d, tx, ty, MT2)
    # Blade center hub
    rect(d, cx_s-1, cy_s-1, cx_s+1, cy_s+1, MT3)
    # Outline blade
    for i in range(36):
        angle = i * math.pi * 2 / 36
        tx = int(cx_s + r * math.cos(angle))
        ty = int(cy_s + r * math.sin(angle))
        if 0 <= tx < 48 and 0 <= ty < 48:
            px(d, tx, ty, BLK)

    # ── Log pile (side of building) ──
    for li in range(3):
        lx0 = 3
        ly0 = 32 + li * 3
        rect(d, lx0, ly0-li, lx0+5, ly0+2-li, WD2)
        d.rectangle([lx0, ly0-li, lx0+5, ly0+2-li], outline=BLK)
        # Log end rings
        px(d, lx0, ly0-li+1, WD1)
        # Shadow
        hline(d, ly0+2-li, lx0+1, lx0+4, WD4)

    return save(img, "sawmill.png")


# ═══════════════════════════════════════════════════════════════════════════════
# 8. FURNACE  32×32
# ═══════════════════════════════════════════════════════════════════════════════
def make_furnace():
    img, d = new(32, 32)

    # ── Base body ──
    rect(d, 3,  8, 28, 26, ST2)
    # Front face slightly lighter
    rect(d, 3, 16, 28, 26, ST1)
    # Right side darker
    rect(d, 28, 10, 30, 26, ST3)
    # Outline
    d.rectangle([3, 8, 28, 26], outline=BLK)
    d.rectangle([28, 10, 30, 26], outline=BLK)

    # Brick pattern
    for brow, by in enumerate(range(9, 26, 4)):
        offset = 0 if brow % 2 == 0 else 4
        for bx in range(3 + offset, 28, 8):
            d.rectangle([bx, by, min(bx+6, 27), by+2], outline=ST3)

    # ── Chimney ──
    rect(d, 12, 2, 19, 10, ST3)
    d.rectangle([12, 2, 19, 10], outline=BLK)
    # Chimney cap
    rect(d, 10, 1, 21, 3, ST2)
    d.rectangle([10, 1, 21, 3], outline=BLK)
    # Smoke
    for sx, sy in [(14, 0), (16, -1), (17, 1)]:
        if sy >= 0:
            px(d, sx, sy, (180, 180, 180, 180))

    # ── Furnace mouth / door (glowing) ──
    rect(d,  9, 17, 22, 24, BLK)
    # Glow inside
    rect(d, 10, 18, 21, 23, FR3)
    # Fire inside
    for fx2, fy2, fc2 in [
        (13, 22, FR3), (14, 21, FR2), (15, 20, FR1), (16, 21, FR2), (17, 22, FR3),
        (14, 22, FR2), (15, 21, FR1), (16, 22, FR2),
        (13, 21, FR3), (17, 21, FR3),
    ]:
        px(d, fx2, fy2, fc2)

    # ── Orange glow emanating from door ──
    for gx in range(7, 25):
        for gy in range(16, 26):
            r2, g2, b2, a2 = img.getpixel((gx, gy))
            if a2 == 0:
                dx, dy = gx - 15, gy - 21
                dist2 = dx*dx + dy*dy
                if dist2 < 30:
                    px(d, gx, gy, (255, 120, 20, max(10, 80 - dist2*2)))

    # ── Door handle / latch ──
    px(d, 22, 20, MT1)
    px(d, 22, 21, MT2)

    # ── Top vent slits ──
    for si in range(3):
        hline(d, 10 + si*2, 5, 26, ST3)

    # ── Shadow ──
    rect(d, 5, 26, 28, 27, (20, 14, 8, 80))

    return save(img, "furnace.png")


# ═══════════════════════════════════════════════════════════════════════════════
# 9. SCARECROW  16×32
# ═══════════════════════════════════════════════════════════════════════════════
def make_scarecrow():
    img, d = new(16, 32)

    # ── Wooden cross frame ──
    # Vertical post
    rect(d, 7, 14, 9, 30, WD2)
    d.rectangle([7, 14, 9, 30], outline=BLK)
    # Horizontal arm
    rect(d, 2, 14, 14, 16, WD2)
    d.rectangle([2, 14, 14, 16], outline=BLK)

    # ── Body (patchy shirt) ──
    rect(d, 5, 16, 11, 24, PATCH1)
    d.rectangle([5, 16, 11, 24], outline=BLK)
    # Patches
    rect(d, 5, 18, 7, 20, PATCH2)
    d.rectangle([5, 18, 7, 20], outline=BLK)
    rect(d, 9, 21, 11, 23, (180, 60, 60, 255))
    d.rectangle([9, 21, 11, 23], outline=BLK)
    # Collar line
    hline(d, 17, 6, 10, WD3)

    # ── Pants / legs ──
    rect(d, 5, 24, 7, 30, (80, 100, 150, 255))
    rect(d, 9, 24, 11, 30, (80, 100, 150, 255))
    d.rectangle([5, 24, 7, 30], outline=BLK)
    d.rectangle([9, 24, 11, 30], outline=BLK)

    # ── Head ──
    rect(d, 4, 7, 12, 14, SK1)
    d.rectangle([4, 7, 12, 14], outline=BLK)
    # Face shading
    rect(d, 5, 8, 11, 13, SK1)
    # Eyes (X shape — cute/spooky)
    for eye_x in [6, 10]:
        px(d, eye_x,   9, BLK)
        px(d, eye_x+1, 10, BLK)
        px(d, eye_x,   10, BLK)
        px(d, eye_x+1, 9, BLK)
    # Stitched mouth
    for mx in range(6, 11, 2):
        px(d, mx, 12, BLK)

    # ── Straw hat ──
    # Brim
    rect(d, 2, 6, 14, 8, HAT1)
    d.rectangle([2, 6, 14, 8], outline=BLK)
    # Hat crown
    rect(d, 5, 2, 11, 7, HAT2)
    d.rectangle([5, 2, 11, 7], outline=BLK)
    # Hat band
    hline(d, 6, 5, 11, RP2)
    # Straw wisps sticking out
    px(d, 2, 5, RP1)
    px(d, 3, 4, RP2)
    px(d, 13, 5, RP1)
    px(d, 12, 4, RP2)
    # Straw below shirt
    for sw in range(5, 12, 2):
        px(d, sw, 24, RP1)
        px(d, sw, 25, RP2)

    # ── Arms (straw-stuffed sleeves) ──
    # Left arm
    rect(d, 2, 16, 5, 18, PATCH1)
    d.rectangle([2, 16, 5, 18], outline=BLK)
    px(d, 1, 17, RP1)
    px(d, 1, 18, RP2)
    # Right arm
    rect(d, 11, 16, 14, 18, PATCH1)
    d.rectangle([11, 16, 14, 18], outline=BLK)
    px(d, 14, 17, RP1)
    px(d, 14, 18, RP2)

    return save(img, "scarecrow.png")


# ═══════════════════════════════════════════════════════════════════════════════
# 10. NPC SHOP STALL  48×48
# ═══════════════════════════════════════════════════════════════════════════════
def make_npc_stall():
    img, d = new(48, 48)

    # ── Ground shadow / base ──
    rect(d, 2, 36, 46, 46, WD3)
    d.rectangle([2, 36, 46, 46], outline=BLK)
    # Floor planks
    for pfx in range(3, 46, 6):
        vline(d, pfx, 37, 45, WD4)
    for pfy in range(38, 46, 4):
        hline(d, pfy, 3, 45, WD4)

    # ── Counter / display table ──
    rect(d, 4, 26, 44, 38, WD2)
    # Table top face
    rect(d, 4, 26, 44, 30, WD1)
    d.rectangle([4, 26, 44, 38], outline=BLK)
    d.rectangle([4, 26, 44, 30], outline=BLK)
    # Counter wood grain
    for cgx in range(5, 44, 5):
        vline(d, cgx, 27, 29, WD2)

    # ── Back wall ──
    rect(d, 4, 10, 44, 28, WD2)
    d.rectangle([4, 10, 44, 28], outline=BLK)
    # Wall planks
    for wpy in range(12, 28, 5):
        hline(d, wpy, 5, 43, WD3)
    for wpx in range(6, 43, 7):
        vline(d, wpx, 11, 27, WD3)

    # ── Awning ──
    # Main awning (red + yellow stripes)
    for ax in range(2, 46):
        stripe = ((ax - 2) // 4) % 2
        ac = AW1 if stripe == 0 else AW2
        # Slight downward curve
        ay_top = 8 - abs(ax - 24) // 8
        for ay in range(ay_top, 11):
            px(d, ax, ay, ac)

    # Awning fringe (dangling triangles)
    for fx3 in range(2, 46, 4):
        for fy3 in range(3):
            if fy3 <= 2 - abs(fx3 % 4 - 2):
                px(d, fx3 + (fx3 % 4 - 2), 11 + fy3, AW1 if fx3 % 8 < 4 else AW2)

    # Awning support poles
    rect(d,  3,  10,  5, 28, WD3)
    rect(d, 43,  10, 45, 28, WD3)
    d.rectangle([3, 10, 5, 28], outline=BLK)
    d.rectangle([43, 10, 45, 28], outline=BLK)
    # Awning outline
    d.line([(2, 8), (45, 8)], fill=BLK)
    d.line([(2, 11), (45, 11)], fill=BLK)

    # ── Hanging sign ──
    rect(d, 14, 14, 34, 19, WD1)
    d.rectangle([14, 14, 34, 19], outline=BLK)
    # Sign text (pixel art letters: "SHOP")
    # S
    for sx_s, sy_s in [(16,15),(17,15),(18,15),(16,16),(16,17),(17,17),(18,17),(18,18),(18,19),(17,19),(16,19)]:
        if 0 <= sx_s < 48 and 0 <= sy_s < 48:
            px(d, sx_s, sy_s, BLK)
    # Ropes holding sign
    vline(d, 16, 11, 14, RP2)
    vline(d, 32, 11, 14, RP2)

    # ── Items on counter ──
    # Potion bottle (left)
    rect(d, 7, 23, 10, 26, (100, 180, 220, 255))
    d.rectangle([7, 23, 10, 26], outline=BLK)
    px(d, 8, 22, (150, 200, 230, 255))
    px(d, 8, 23, W)

    # Apple (center-left)
    for ax2, ay2 in [(13,24),(14,23),(15,23),(16,24),(14,24),(15,24),(13,25),(14,25),(15,25),(16,25)]:
        px(d, ax2, ay2, (220, 60, 60, 255))
    px(d, 14, 22, GR2)  # stem

    # Bread loaf (center)
    rect(d, 20, 23, 26, 26, DR1)
    d.rectangle([20, 23, 26, 26], outline=BLK)
    # Score lines
    hline(d, 24, 21, 25, WD2)
    hline(d, 25, 21, 25, DR2)
    px(d, 23, 23, (240, 220, 180, 255))

    # Coin bag (right)
    rect(d, 30, 22, 35, 27, (220, 200, 80, 255))
    d.rectangle([30, 22, 35, 27], outline=BLK)
    # Bag tie
    rect(d, 31, 21, 34, 22, RP2)
    # Coin shimmer
    px(d, 32, 24, (255, 240, 100, 255))
    px(d, 33, 25, (255, 240, 100, 255))

    # Flower bunch (far right)
    for flx, fly, flc in [
        (38, 24, (240, 100, 160, 255)),
        (39, 23, (240, 180, 60, 255)),
        (40, 24, (160, 100, 220, 255)),
        (38, 25, GR2), (39, 25, GR2), (40, 25, GR2),
    ]:
        px(d, flx, fly, flc)
    vline(d, 39, 25, 27, GR3)
    d.rectangle([37, 22, 41, 27], outline=BLK)

    # ── NPC shopkeeper (simple chibi silhouette behind counter) ──
    # Head
    rect(d, 20, 11, 25, 16, SK1)
    d.rectangle([20, 11, 25, 16], outline=BLK)
    # Eyes
    px(d, 21, 13, BLK)
    px(d, 23, 13, BLK)
    # Smile
    px(d, 21, 15, BLK)
    px(d, 22, 15, BLK)
    px(d, 23, 15, BLK)
    # Hat (green merchant hat)
    rect(d, 19, 9, 26, 12, (60, 130, 60, 255))
    d.rectangle([19, 9, 26, 12], outline=BLK)
    # Body
    rect(d, 19, 16, 26, 26, (80, 120, 180, 255))
    d.rectangle([19, 16, 26, 26], outline=BLK)
    # Apron
    rect(d, 20, 17, 25, 25, (230, 220, 200, 255))
    d.rectangle([20, 17, 25, 25], outline=BLK)

    return save(img, "npc_shop_stall.png")


# ═══════════════════════════════════════════════════════════════════════════════
# MAIN
# ═══════════════════════════════════════════════════════════════════════════════
if __name__ == "__main__":
    results = {}

    print("Generating Petaland building assets...")
    print()

    print("1. Workbench (32x32)...")
    results["workbench"] = make_workbench()

    print("2. Bonfire (24x24)...")
    results["bonfire"] = make_bonfire()

    print("3. Storage Box (16x16)...")
    results["storage_box"] = make_storage_box()

    print("4. Well (32x32)...")
    results["well"] = make_well()

    print("5. Fence Horizontal (16x16)...")
    results["fence"] = make_fence()

    print("6. Soil Bed Empty (16x16)...")
    results["soil_bed"] = make_soil_bed()

    print("7. Sawmill (48x48)...")
    results["sawmill"] = make_sawmill()

    print("8. Furnace (32x32)...")
    results["furnace"] = make_furnace()

    print("9. Scarecrow (16x32)...")
    results["scarecrow"] = make_scarecrow()

    print("10. NPC Shop Stall (48x48)...")
    results["npc_stall"] = make_npc_stall()

    print()
    print("All done!")
    for name, path in results.items():
        print(f"  {name}: {path}")
