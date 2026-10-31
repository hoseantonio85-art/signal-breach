#!/usr/bin/env python3
"""Generate SIGNAL//BREACH Android launcher icons using only Python stdlib.

The symbol matches the existing .menu-sigil: cyan diamond and filled pink square.
Outputs are copied into the Capacitor-generated native res/ directory in CI.
"""
from __future__ import annotations

import math
import struct
import sys
import zlib
from pathlib import Path

NAVY = (5, 7, 19)
CYAN = (113, 241, 255)
PINK = (255, 79, 216)


def over(dst, src, alpha):
    alpha = max(0.0, min(1.0, alpha))
    return tuple(round(a * (1 - alpha) + b * alpha) for a, b in zip(dst, src))


def smooth(value, half):
    return max(0.0, min(1.0, 0.5 + value / max(0.0001, 2 * half)))


def png(path: Path, size: int, kind: str):
    adaptive = kind in ('adaptive', 'mono')
    mono = kind == 'mono'
    round_icon = kind == 'round'
    radius = 0.229 if adaptive else 0.272
    square_half = 0.043 if adaptive else 0.051
    stroke_half = max(0.0058, 0.65 / size)
    softness = 0.9 / size
    lines = []
    for j in range(size):
        row = bytearray([0])  # PNG filter 0
        y = (j + 0.5) / size - 0.5
        for i in range(size):
            x = (i + 0.5) / size - 0.5
            d = abs(x) + abs(y)
            edge = abs(d - radius)
            outline = 1.0 - smooth(edge - stroke_half, softness)
            square_distance = max(abs(x), abs(y)) - square_half
            square = 1.0 - smooth(square_distance, softness)
            if mono:
                alpha = round(255 * max(outline, square))
                row.extend((255, 255, 255, alpha))
                continue
            if adaptive:
                glow = math.exp(-((max(0, edge - stroke_half) / 0.022) ** 1.65)) * 0.26
                pink_glow = math.exp(-((max(0, square_distance) / 0.018) ** 1.7)) * 0.28
                alpha = 1 - (1-outline) * (1-square) * (1-glow) * (1-pink_glow)
                if alpha < 0.002:
                    row.extend((0, 0, 0, 0))
                    continue
                cyan_weight = outline + glow * (1-outline)
                pink_weight = square + pink_glow * (1-square)
                color = tuple(round((CYAN[k] * cyan_weight * (1-pink_weight) + PINK[k] * pink_weight) / max(alpha, 0.00001)) for k in range(3))
                row.extend((*[max(0, min(255, v)) for v in color], round(alpha * 255)))
                continue
            distance = math.sqrt(x*x + y*y)
            ambient = max(0, 1 - distance / 0.62) * 0.12
            color = over(NAVY, (16, 38, 56), ambient)
            cyan_glow = math.exp(-((max(0, edge-stroke_half) / 0.024) ** 1.65)) * 0.33
            pink_glow = math.exp(-((max(0, square_distance) / 0.027) ** 1.65)) * 0.28
            color = over(color, CYAN, cyan_glow)
            color = over(color, CYAN, outline)
            color = over(color, PINK, pink_glow)
            color = over(color, PINK, square)
            if round_icon:
                a = round(255 * (1.0 - smooth(distance - 0.491, softness)))
            else:
                a = 255
            row.extend((*color, a))
        lines.append(bytes(row))
    raw = b''.join(lines)

    def chunk(tag: bytes, data: bytes):
        return (struct.pack('>I', len(data)) + tag + data
                + struct.pack('>I', zlib.crc32(tag + data) & 0xffffffff))

    image = (b'\x89PNG\r\n\x1a\n'
             + chunk(b'IHDR', struct.pack('>IIBBBBB', size, size, 8, 6, 0, 0, 0))
             + chunk(b'IDAT', zlib.compress(raw, level=9)) + chunk(b'IEND', b''))
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(image)


def generate(native: Path):
    res = native / 'app/src/main/res'
    for name, factor in [('mdpi', 1), ('hdpi', 1.5), ('xhdpi', 2),
                         ('xxhdpi', 3), ('xxxhdpi', 4)]:
        dirname = res / ('mipmap-' + name)
        png(dirname / 'ic_launcher.png', int(48 * factor), 'legacy')
        png(dirname / 'ic_launcher_round.png', int(48 * factor), 'round')
        png(dirname / 'ic_launcher_foreground.png', int(108 * factor), 'adaptive')
    png(res / 'drawable-nodpi' / 'ic_launcher_monochrome.png', 432, 'mono')

    bg = res / 'drawable' / 'ic_launcher_background.xml'
    bg.parent.mkdir(parents=True, exist_ok=True)
    bg.write_text('''<?xml version="1.0" encoding="utf-8"?>
<color xmlns:android="http://schemas.android.com/apk/res/android" android:color="#050713" />
''', encoding='utf-8')

    xml = '''<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@drawable/ic_launcher_background" />
    <foreground android:drawable="@mipmap/ic_launcher_foreground" />
    <monochrome android:drawable="@drawable/ic_launcher_monochrome" />
</adaptive-icon>
'''
    target = res / 'mipmap-anydpi-v26'
    target.mkdir(parents=True, exist_ok=True)
    for filename in ('ic_launcher.xml', 'ic_launcher_round.xml'):
        (target / filename).write_text(xml, encoding='utf-8')
    print('Generated SIGNAL//BREACH Android launcher icons at', res)


if __name__ == '__main__':
    if len(sys.argv) != 2:
        raise SystemExit('Usage: python3 scripts/generate-android-icons.py android')
    generate(Path(sys.argv[1]))
