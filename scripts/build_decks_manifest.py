#!/usr/bin/env python3
"""Generate the manifest of Freewings slide decks for the app."""
import json
import os
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DECKS_DIR = ROOT / "assets" / "freewings"
TRANS_FILE = ROOT / "data" / "slide_translations.json"

# Maps deck folder slug → metadata
META = {
    "aerodynamik": {
        "title": "Aerodynamik",
        "category": "Aerodynamics",
        "instructor": "Stefan Keller",
        "icon": "📐",
    },
    "meteo": {
        "title": "Meteo",
        "category": "Meteorology",
        "instructor": "Freewings",
        "icon": "🌦️",
    },
    "luftrecht": {
        "title": "Luftrecht",
        "category": "Legislation",
        "instructor": "Freewings",
        "icon": "⚖️",
    },
    "material": {
        "title": "Material",
        "category": "Equipment",
        "instructor": "Freewings",
        "icon": "🪂",
    },
    "flugpraxis": {
        "title": "Flugpraxis",
        "category": "Flight Practice",
        "instructor": "Sam Hochstrasser",
        "icon": "✈️",
    },
}


def main():
    translations = {}
    if TRANS_FILE.exists():
        translations = json.loads(TRANS_FILE.read_text())

    decks = []
    for slug, meta in META.items():
        deck_dir = DECKS_DIR / slug
        if not deck_dir.is_dir():
            print(f"Skipping missing deck: {slug}")
            continue
        page_nums = sorted(
            int(m.group(1))
            for f in deck_dir.glob("page-*.jpg")
            if (m := re.match(r"page-(\d+)\.jpg$", f.name))
        )
        if not page_nums:
            continue

        deck_trans = translations.get(slug, {})
        slides = []
        for n in page_nums:
            t = deck_trans.get(str(n), {})
            de = t.get("de", {})
            en = t.get("en", {})
            slides.append({
                "page": n,
                "de_title": (de.get("title") or "").strip(),
                "de_body": (de.get("body") or "").strip(),
                "en_title": (en.get("title") or "").strip(),
                "en_body": (en.get("body") or "").strip(),
            })

        decks.append({
            "id": slug,
            "title": meta["title"],
            "category": meta["category"],
            "instructor": meta["instructor"],
            "icon": meta["icon"],
            "slides": slides,
            "path": f"assets/freewings/{slug}",
        })

    out = ROOT / "data" / "decks.json"
    out.write_text(json.dumps({"decks": decks}, ensure_ascii=False, indent=1))
    total_slides = sum(len(d["slides"]) for d in decks)
    translated = sum(1 for d in decks for s in d["slides"] if s["en_title"])
    print(f"Wrote {out}")
    print(f"  {len(decks)} decks · {total_slides} slides total · {translated} have translations")


if __name__ == "__main__":
    main()
