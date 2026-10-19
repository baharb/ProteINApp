# Generates the app icons (assets/*.png): a flat, top-down plate of colourful
# fresh food on the app's green — a plain dark plate so the food stands out.
# Big, simple shapes so each ingredient is still obvious at launcher size.
# Run: python scripts/make-icons.py   (needs Pillow)
import math
import os
import random
from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
S = 3  # supersampling for smooth edges
FOOD_ZOOM = 1.32  # how much of the plate the food covers

GREEN      = (0x4A, 0xDE, 0x80, 255)   # C.primary — background
PLATE      = (0x1B, 0x23, 0x2D, 255)   # C.card2 — plain dark plate
PLATE_RIM  = (0x2A, 0x35, 0x42, 255)
LEAF       = [(0x16, 0xA3, 0x4A, 255), (0x22, 0xC5, 0x5E, 255), (0x15, 0x80, 0x3D, 255)]
TOMATO     = (0xEF, 0x44, 0x44, 255)
TOMATO_IN  = (0xFC, 0xA5, 0xA5, 255)
SEED       = (0xFE, 0xF0, 0x8A, 255)
CUKE_RIND  = (0x15, 0x80, 0x3D, 255)
CUKE_IN    = (0xD9, 0xF9, 0x9D, 255)
BERRY      = (0x1E, 0x3A, 0x8A, 255)
BERRY_HI   = (0x60, 0x7F, 0xD8, 255)
STRAW      = (0xDC, 0x26, 0x26, 255)
STRAW_SEED = (0xFE, 0xE2, 0xE2, 255)
ORANGE     = (0xFB, 0x92, 0x3C, 255)
ORANGE_IN  = (0xFD, 0xBA, 0x74, 255)
PEPPER     = (0xFA, 0xCC, 0x15, 255)
PEPPER_SH  = (0xEA, 0xB3, 0x08, 255)


def circle(d, cx, cy, r, fill):
    d.ellipse((cx - r, cy - r, cx + r, cy + r), fill=fill)


def rotated(layer_size, draw_fn, angle):
    lay = Image.new('RGBA', (layer_size, layer_size), (0, 0, 0, 0))
    draw_fn(ImageDraw.Draw(lay), layer_size / 2)
    return lay.rotate(angle, resample=Image.BICUBIC)


def paste_center(img, lay, cx, cy):
    img.alpha_composite(lay, (int(cx - lay.width / 2), int(cy - lay.height / 2)))


def leaf(img, cx, cy, L, W, angle, color):
    def fn(d, c):
        d.ellipse((c - L / 2, c - W / 2, c + L / 2, c + W / 2), fill=color)
    paste_center(img, rotated(int(L * 1.3), fn, angle), cx, cy)


def tomato_slice(d, cx, cy, r):
    circle(d, cx, cy, r, TOMATO)
    circle(d, cx, cy, r * 0.78, TOMATO_IN)
    for k in range(5):  # chambers
        a = math.radians(k * 72 + 18)
        circle(d, cx + r * 0.45 * math.cos(a), cy + r * 0.45 * math.sin(a), r * 0.2, TOMATO)
        circle(d, cx + r * 0.45 * math.cos(a), cy + r * 0.45 * math.sin(a), r * 0.07, SEED)
    circle(d, cx, cy, r * 0.16, TOMATO)


def cucumber(d, cx, cy, r):
    circle(d, cx, cy, r, CUKE_RIND)
    circle(d, cx, cy, r * 0.84, CUKE_IN)
    for k in range(6):
        a = math.radians(k * 60)
        circle(d, cx + r * 0.38 * math.cos(a), cy + r * 0.38 * math.sin(a), r * 0.07, (0x84, 0xCC, 0x16, 255))


def blueberry(d, cx, cy, r):
    circle(d, cx, cy, r, BERRY)
    circle(d, cx - r * 0.3, cy - r * 0.3, r * 0.25, BERRY_HI)


def strawberry(img, cx, cy, r, angle):
    def fn(d, c):
        # body: a rounded heart-ish teardrop pointing down
        d.ellipse((c - r, c - r * 0.95, c + r, c + r * 0.55), fill=STRAW)
        d.polygon([(c - r * 0.92, c - r * 0.05), (c + r * 0.92, c - r * 0.05), (c, c + r * 1.25)], fill=STRAW)
        rnd = random.Random(7)
        for _ in range(16):
            x = c + rnd.uniform(-0.6, 0.6) * r
            y = c + rnd.uniform(-0.5, 0.75) * r
            if abs(x - c) < r * (0.75 - 0.5 * max(0, (y - c) / r)):
                d.ellipse((x - r * 0.05, y - r * 0.08, x + r * 0.05, y + r * 0.08), fill=STRAW_SEED)
        # leaves on top
        for a in (-60, -20, 20, 60):
            ax = c + r * 0.5 * math.sin(math.radians(a))
            d.ellipse((ax - r * 0.22, c - r * 1.15, ax + r * 0.22, c - r * 0.7), fill=LEAF[0])
    paste_center(img, rotated(int(r * 3), fn, angle), cx, cy)


def orange_wedge(img, cx, cy, r, angle):
    def fn(d, c):
        d.pieslice((c - r, c - r, c + r, c + r), 180, 360, fill=ORANGE)
        d.pieslice((c - r * 0.82, c - r * 0.82, c + r * 0.82, c + r * 0.82), 180, 360, fill=ORANGE_IN)
        for a in (210, 240, 270, 300, 330):
            d.line((c, c, c + r * 0.82 * math.cos(math.radians(a)), c + r * 0.82 * math.sin(math.radians(a))), fill=ORANGE, width=int(r * 0.07))
        d.rectangle((c - r, c - r * 0.04, c + r, c + r * 0.06), fill=ORANGE)
    paste_center(img, rotated(int(r * 2.4), fn, angle), cx, cy)


def pepper_cube(d, cx, cy, s):
    d.rounded_rectangle((cx - s, cy - s, cx + s, cy + s), radius=s * 0.35, fill=PEPPER)
    d.rounded_rectangle((cx - s, cy + s * 0.35, cx + s, cy + s), radius=s * 0.35, fill=PEPPER_SH)


def plate_mark(n, bg):
    img = Image.new('RGBA', (n, n), bg)
    d = ImageDraw.Draw(img)
    c = n / 2
    R = n * 0.40
    u = R / 100
    circle(d, c, c, R, PLATE_RIM)
    circle(d, c, c, R * 0.86, PLATE)

    # The food is drawn on its own layer, then enlarged so it fills the plate.
    plate_img = img
    img = Image.new('RGBA', (n, n), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)

    # lettuce bed
    for (dx, dy, ang, k) in ((-30, -34, 30, 0), (30, -36, -35, 1), (-42, 10, 80, 2), (40, 12, 100, 0),
                             (-10, 40, 0, 1), (22, 38, 60, 2), (0, -8, 45, 0), (-20, 0, -40, 1)):
        leaf(img, c + dx * u, c + dy * u, 52 * u, 30 * u, ang, LEAF[k])
    d = ImageDraw.Draw(img)

    tomato_slice(d, c - 26 * u, c - 22 * u, 21 * u)
    tomato_slice(d, c + 14 * u, c + 26 * u, 18 * u)
    cucumber(d, c + 30 * u, c - 26 * u, 16 * u)
    cucumber(d, c - 34 * u, c + 26 * u, 15 * u)
    pepper_cube(d, c + 2 * u, c - 2 * u, 9 * u)
    pepper_cube(d, c - 12 * u, c + 40 * u, 7.5 * u)
    strawberry(img, c + 6 * u, c - 44 * u, 14 * u, 15)
    orange_wedge(img, c + 44 * u, c + 6 * u, 20 * u, 80)
    d = ImageDraw.Draw(img)
    for (dx, dy) in ((-6, 20), (-46, -2), (26, 2), (2, -28)):
        blueberry(d, c + dx * u, c + dy * u, 7 * u)
    big = img.resize((int(n * FOOD_ZOOM), int(n * FOOD_ZOOM)), Image.LANCZOS)
    off = (big.width - n) // 2
    plate_img.alpha_composite(big.crop((off, off, off + n, off + n)))
    return plate_img


def render(size, bg, zoom=1.0):
    n = size * S
    mark = plate_mark(n, bg)
    if zoom != 1.0:  # shrink the plate (transparent canvases) for the adaptive safe zone
        z = mark.resize((int(n * zoom), int(n * zoom)), Image.LANCZOS)
        mark = Image.new('RGBA', (n, n), (0, 0, 0, 0))
        mark.alpha_composite(z, ((n - z.width) // 2, (n - z.height) // 2))
    return mark.resize((size, size), Image.LANCZOS)


def save(name, im):
    im.save(os.path.join(ROOT, 'assets', name))
    print('wrote assets/' + name)


def logo(size):
    """In-app logo: the plate alone with a green ring around it (transparent)."""
    n = size * S
    inner = int(n * 1.12)   # plate drawn at 80% of this, so it nearly fills the ring
    plate = plate_mark(inner, (0, 0, 0, 0))
    im = Image.new('RGBA', (n, n), (0, 0, 0, 0))
    ImageDraw.Draw(im).ellipse((n * 0.02, n * 0.02, n * 0.98, n * 0.98), outline=GREEN, width=int(n * 0.035))
    # plate_mark draws the plate at 80% of its canvas; centre it inside the ring
    im.alpha_composite(plate, ((n - inner) // 2, (n - inner) // 2))
    return im.resize((size, size), Image.LANCZOS)


if __name__ == '__main__':
    # Store / home-screen icon: the plate on green, full square (the OS rounds the corners).
    save('icon.png', render(1024, GREEN))
    # Android adaptive foreground: plate only, inside the safe zone; green comes from app.json.
    save('adaptive-icon.png', render(1024, (0, 0, 0, 0), zoom=0.78))
    # Inside the app (splash + loading screen): the plate with a green ring, no square.
    save('splash-icon.png', logo(512))
    save('logo.png', logo(512))
    # Google Play listing icon: 512x512, full green square.
    os.makedirs(os.path.join(os.path.dirname(ROOT), 'store', 'android'), exist_ok=True)
    render(512, GREEN).convert('RGB').save(os.path.join(os.path.dirname(ROOT), 'store', 'android', 'play-icon-512.png'))
    print('wrote store/android/play-icon-512.png')
