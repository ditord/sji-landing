#!/usr/bin/env python3
"""Generate the site's logo and icon files from the master logo.

Source:  assets/img/sji-logo.png  (official SJI logo, transparent background)
Output:  assets/img/logo.png            tight-cropped logo (header, footer, JSON-LD)
         favicon.ico                    16/32/48 px, "sJi" crop on a white rounded tile
         favicon-32.png                 32 px PNG version of the same
         assets/img/apple-touch-icon.png  180 px, full logo on white
         assets/img/icon-192.png, icon-512.png  web app manifest icons

Run from the project root:  python3 tools/make-icons.py   (needs Pillow: pip install pillow)
The social preview image is separate: see the comment in assets/img/og-image.svg.

Not needed on the web server; don't upload the tools/ folder.
"""
from PIL import Image, ImageDraw

SRC = 'assets/img/sji-logo.png'

src = Image.open(SRC).convert('RGBA')
logo = src.crop(src.getchannel('A').getbbox())  # trim transparent margins

# Small favicons: the full wordmark is illegible at 16-48 px, so use only the
# "sJi" part (x 100-372 of the source: s, J, i and their colour blocks; drops "am").
mark = src.crop((100, 0, 372, 298))


def on_square(size, pad_ratio, radius_ratio=0.0, art=None):
    """Center `art` on a white (optionally rounded) square.

    The logo's colour blocks are semi-transparent and its letters are black, so it
    always gets a white tile: it then reads on light and dark browser tabs alike.
    Drawn at 4x and downsampled for clean edges.
    """
    art = art or logo
    S = size * 4
    canvas = Image.new('RGBA', (S, S), (0, 0, 0, 0))
    mask = Image.new('L', (S, S), 0)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, S - 1, S - 1], radius=int(S * radius_ratio), fill=255)
    canvas.paste(Image.new('RGBA', (S, S), (255, 255, 255, 255)), (0, 0), mask)
    inner = int(S * (1 - 2 * pad_ratio))
    w, h = art.size
    k = inner / max(w, h)
    resized = art.resize((round(w * k), round(h * k)), Image.LANCZOS)
    canvas.alpha_composite(resized, ((S - resized.width) // 2, (S - resized.height) // 2))
    return canvas.resize((size, size), Image.LANCZOS)


logo.save('assets/img/logo.png', optimize=True)

ico = [on_square(s, 0.04, 0.18, art=mark) for s in (16, 32, 48)]
ico[2].save('favicon.ico', sizes=[(16, 16), (32, 32), (48, 48)], append_images=ico[:2])
ico[1].save('favicon-32.png', optimize=True)

# Opaque squares: iOS / Android apply their own corner rounding
on_square(180, 0.12).convert('RGB').save('assets/img/apple-touch-icon.png', optimize=True)
for s in (192, 512):
    on_square(s, 0.14).convert('RGB').save(f'assets/img/icon-{s}.png', optimize=True)

print('Generated logo.png', logo.size, 'and icons.')
