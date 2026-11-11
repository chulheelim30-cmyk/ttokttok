#!/usr/bin/env python3
"""icon.svg 하나로 모든 아이콘 PNG를 초고해상도로 다시 만든다.
4096px로 그린 뒤 LANCZOS로 줄여서(슈퍼샘플링) 작은 크기도 선명하게.
사용: python3 tools/icons.py  (rsvg-convert, Pillow 필요)"""
import subprocess, re, os, io
from PIL import Image
R = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = open(os.path.join(R, 'icon.svg'), encoding='utf-8').read()
BIG = 4096

def render(svg):
    png = subprocess.run(['rsvg-convert', '-w', str(BIG), '-h', str(BIG)],
                         input=svg.encode(), capture_output=True, check=True).stdout
    return Image.open(io.BytesIO(png)).convert('RGB')

def maskable(svg, k=0.8):
    # 배경 rect 뒤의 그림만 가운데 기준 k배(안전 영역 80%)
    head, rest = svg.split('<rect width="512" height="512" fill="url(#bg)"/>', 1)
    body = rest.rsplit('</svg>', 1)[0]
    t = 256 * (1 - k)
    return (head + '<rect width="512" height="512" fill="url(#bg)"/>'
            f'<g transform="translate({t} {t}) scale({k})">' + body + '</g></svg>')

full, mask = render(SRC), render(maskable(SRC))
def out(img, size, path):
    p = os.path.join(R, path); os.makedirs(os.path.dirname(p) or '.', exist_ok=True)
    img.resize((size, size), Image.LANCZOS).save(p, optimize=True)

for s in (32, 180, 192, 512, 1024): out(full, s, f'icon-{s}.png')
out(full, 2048, 'icon-2048.png')
out(mask, 512, 'icon-maskable-512.png'); out(mask, 1024, 'icon-maskable-1024.png')
out(full, 512, 'android/store_icon.png')
res = 'android/app/src/main/res'
for d, s in dict(mdpi=48, hdpi=72, xhdpi=96, xxhdpi=144, xxxhdpi=192).items():
    out(full, s, f'{res}/mipmap-{d}/ic_launcher.png')
for d, s in dict(mdpi=82, hdpi=123, xhdpi=164, xxhdpi=246, xxxhdpi=328).items():
    out(mask, s, f'{res}/mipmap-{d}/ic_maskable.png')
print('ok')
