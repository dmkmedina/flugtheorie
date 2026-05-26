#!/usr/bin/env python3
"""OCR every slide in assets/freewings/<deck>/ → data/slide_ocr.json (German text)."""
import json
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DECKS_DIR = ROOT / "assets" / "freewings"


def ocr_image(path: Path) -> str:
    out = subprocess.run(
        ["tesseract", str(path), "-", "-l", "deu", "--psm", "6"],
        capture_output=True, text=True, check=False,
    )
    text = out.stdout.strip()
    # Collapse repeated whitespace, drop empty lines
    lines = [ln.strip() for ln in text.splitlines() if ln.strip()]
    return "\n".join(lines)


def main():
    result = {}
    decks = sorted(p for p in DECKS_DIR.iterdir() if p.is_dir())
    total_done = 0
    total = sum(len(list(d.glob("page-*.jpg"))) for d in decks)
    for deck in decks:
        result[deck.name] = {}
        pages = sorted(deck.glob("page-*.jpg"))
        for page_path in pages:
            num = int(page_path.stem.split("-")[1])
            text = ocr_image(page_path)
            result[deck.name][str(num)] = text
            total_done += 1
            if total_done % 20 == 0:
                print(f"  {total_done}/{total}…")

    out = ROOT / "data" / "slide_ocr.json"
    out.write_text(json.dumps(result, ensure_ascii=False, indent=1))
    print(f"\nWrote {out}")
    # Stats
    chars_total = sum(len(t) for d in result.values() for t in d.values())
    has_text = sum(1 for d in result.values() for t in d.values() if t)
    print(f"  {total} slides · {has_text} have OCR text · {chars_total} characters")


if __name__ == "__main__":
    main()
