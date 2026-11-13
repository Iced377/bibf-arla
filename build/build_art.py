"""Make light copies of the course artwork.

Masters live in art/ as PNG (the files produced in ChatGPT, renamed).
This writes:
  site/assets/art/<name>.webp   for the course site (small enough for phones)
  build/art-deck/<name>.jpg     for the PowerPoint decks
Usage: python3 build/build_art.py   (needs Pillow)
"""
import glob
import os

from PIL import Image

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
SRC = os.path.join(ROOT, "art")
WEB = os.path.join(ROOT, "site", "assets", "art")
DECK = os.path.join(ROOT, "build", "art-deck")


def fit(im, max_w, max_h):
    im = im.copy()
    im.thumbnail((max_w, max_h), Image.LANCZOS)
    return im


def main():
    os.makedirs(WEB, exist_ok=True)
    os.makedirs(DECK, exist_ok=True)
    for path in sorted(glob.glob(os.path.join(SRC, "*.png"))):
        name = os.path.splitext(os.path.basename(path))[0]
        im = Image.open(path).convert("RGB")
        square = name.startswith("client-")
        web = fit(im, 480, 480) if square else fit(im, 1600, 1600)
        web.save(os.path.join(WEB, name + ".webp"), "WEBP", quality=82, method=6)
        deck = fit(im, 600, 600) if square else fit(im, 1600, 1600)
        deck.save(os.path.join(DECK, name + ".jpg"), "JPEG", quality=86, optimize=True, progressive=True)
        kb = lambda p: round(os.path.getsize(p) / 1024)
        print(f"{name}: {im.size[0]}x{im.size[1]} -> web {kb(os.path.join(WEB, name + '.webp'))} KB, deck {kb(os.path.join(DECK, name + '.jpg'))} KB")


if __name__ == "__main__":
    main()
