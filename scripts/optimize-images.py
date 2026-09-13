#!/usr/bin/env python3
"""Download the photos and logos in scripts/photos.json and write optimized WebP derivatives
to src/assets/img/. Sources are cached in .cache/photos/ (git-ignored). Re-runnable."""
import json
import pathlib
import subprocess

from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / 'src' / 'assets' / 'img'
CACHE = ROOT / '.cache' / 'photos'
PHOTO_WIDTHS = (480, 960, 1600)


def fetch(url: str, dest: pathlib.Path) -> pathlib.Path:
    if not dest.exists():
        dest.parent.mkdir(parents=True, exist_ok=True)
        subprocess.run(['curl', '-sSfL', '--retry', '3', '-m', '90', '-o', str(dest), url], check=True)
    return dest


def save(im: Image.Image, width: int, path: pathlib.Path, quality: int) -> None:
    height = round(im.height * width / im.width)
    im.resize((width, height), Image.LANCZOS).save(path, 'WEBP', quality=quality, method=6)


def main() -> None:
    manifest = json.loads((ROOT / 'scripts' / 'photos.json').read_text(encoding='utf-8'))
    OUT.mkdir(parents=True, exist_ok=True)
    for photo in manifest['photos']:
        im = Image.open(fetch(photo['source'], CACHE / f"{photo['name']}.jpg")).convert('RGB')
        for width in PHOTO_WIDTHS:
            save(im, width, OUT / f"{photo['name']}-{width}.webp", quality=72)
    for logo in manifest['logos']:
        im = Image.open(fetch(logo['source'], CACHE / f"{logo['name']}.png")).convert('RGBA')
        for width in logo['widths']:
            save(im, width, OUT / f"{logo['name']}-{width}.webp", quality=86)
    for path in sorted(OUT.glob('*.webp')):
        print(f'{path.stat().st_size // 1024:>5} KB  {path.name}')


if __name__ == '__main__':
    main()
