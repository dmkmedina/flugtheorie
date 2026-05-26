#!/usr/bin/env python3
"""Generate the manifest of Freewings slide decks for the app."""
import json
import os
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DECKS_DIR = ROOT / "assets" / "freewings"

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
    decks = []
    for slug, meta in META.items():
        deck_dir = DECKS_DIR / slug
        if not deck_dir.is_dir():
            print(f"Skipping missing deck: {slug}")
            continue
        pages = sorted(
            int(m.group(1))
            for f in deck_dir.glob("page-*.jpg")
            if (m := re.match(r"page-(\d+)\.jpg$", f.name))
        )
        if not pages:
            continue
        decks.append({
            "id": slug,
            "title": meta["title"],
            "category": meta["category"],
            "instructor": meta["instructor"],
            "icon": meta["icon"],
            "pages": pages,
            "path": f"assets/freewings/{slug}",
        })

    out = ROOT / "data" / "decks.json"
    out.write_text(json.dumps({"decks": decks}, ensure_ascii=False, indent=2))
    total_pages = sum(len(d["pages"]) for d in decks)
    print(f"Wrote {out}")
    print(f"  {len(decks)} decks · {total_pages} slides total")


if __name__ == "__main__":
    main()
