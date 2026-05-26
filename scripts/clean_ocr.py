#!/usr/bin/env python3
"""Clean noisy OCR output → data/slide_text_de.json.

Heuristics:
- Drop lines where >50% of "words" are 1-2 chars (likely diagram-arrow noise)
- Drop lines with high ratio of non-alphabetic characters
- Keep ALL-CAPS lines (likely titles) when they look like real words
"""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def is_noise(line: str) -> bool:
    line = line.strip()
    if not line:
        return True
    # Pure short fragments
    if len(line) < 3:
        return True
    # Ratio of letters
    letters = sum(c.isalpha() for c in line)
    if letters / max(len(line), 1) < 0.55:
        return True
    words = re.findall(r"\b\w+\b", line)
    if not words:
        return True
    long_words = [w for w in words if len(w) >= 3]
    if len(long_words) / max(len(words), 1) < 0.4:
        return True
    # Common OCR garbage tokens
    garbage_tokens = ('IEEE', 'IIE', 'ER ER ER', 'BR BR', 'KR KR', '«MM', '"e"', 'I/M')
    if any(tok in line for tok in garbage_tokens):
        return True
    return False


def clean(text: str) -> str:
    lines = text.split("\n")
    kept = [ln.strip() for ln in lines if not is_noise(ln)]
    # Reassemble: keep paragraph spacing in roughly the same shape
    return "\n".join(kept).strip()


def main():
    raw = json.load(open(ROOT / "data" / "slide_ocr.json"))
    cleaned = {}
    total_slides = 0
    cleaned_chars = 0
    raw_chars = 0
    empty_after_clean = 0
    for deck, pages in raw.items():
        cleaned[deck] = {}
        for num, text in pages.items():
            raw_chars += len(text)
            c = clean(text)
            cleaned[deck][num] = c
            cleaned_chars += len(c)
            total_slides += 1
            if not c:
                empty_after_clean += 1

    out = ROOT / "data" / "slide_text_de.json"
    out.write_text(json.dumps(cleaned, ensure_ascii=False, indent=1))
    print(f"Wrote {out}")
    print(f"  {total_slides} slides processed")
    print(f"  Raw: {raw_chars} chars → Cleaned: {cleaned_chars} chars "
          f"({100 * cleaned_chars / max(raw_chars,1):.0f}% kept)")
    print(f"  {empty_after_clean} slides had no usable text after cleaning")


if __name__ == "__main__":
    main()
