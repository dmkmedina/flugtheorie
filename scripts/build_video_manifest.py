#!/usr/bin/env python3
"""Build data/video_manifest.json from extracted videos + (when present) transcripts.

The app loads this manifest to render the Videos view: one card per video,
grouped by deck. VTT files are read at runtime as separate fetches so the
inline-HTML build stays small.

Run after either extract_video_urls.mjs or transcribe_videos.py.
"""
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "data" / "videos.json"
TRANSCRIPTS = ROOT / "data" / "transcripts"
OUT = ROOT / "data" / "video_manifest.json"

# Match decks.json ids so we can cross-link to slide decks + flashcards
HEADING_TO_DECK = {
    "meteo": ("meteo", "Meteo", "🌤️"),
    "aerodynamik": ("aerodynamik", "Aerodynamik", "📐"),
    "luftrecht": ("luftrecht", "Luftrecht", "⚖️"),
    "materialkunde": ("material", "Materialkunde", "🪂"),
    "flugpraxis": ("flugpraxis", "Flugpraxis", "🛫"),
}


def slugify(heading: str) -> str:
    return heading.strip().lower().replace(" ", "_")


def fmt_duration(sec: float) -> str:
    m, s = divmod(int(sec), 60)
    h, m = divmod(m, 60)
    return f"{h}:{m:02d}:{s:02d}" if h else f"{m}:{s:02d}"


def main() -> int:
    payload = json.loads(SRC.read_text())
    videos = payload["domVideos"]["videos"]

    out_videos = []
    for v in videos:
        heading = v["heading"].strip().lower()
        # heading looks like "meteo 0", "aerodynamik 1"
        base, _, part_str = heading.rpartition(" ")
        try:
            part = int(part_str)
        except ValueError:
            base, part = heading, 0
        deck_id, deck_title, deck_icon = HEADING_TO_DECK.get(base, (base, base.title(), "🎬"))
        slug = slugify(v["heading"])
        de_vtt = TRANSCRIPTS / f"{slug}.de.vtt"
        en_vtt = TRANSCRIPTS / f"{slug}.en.vtt"
        de_json = TRANSCRIPTS / f"{slug}.de.json"

        duration = None
        if de_json.exists():
            try:
                duration = json.loads(de_json.read_text()).get("duration")
            except json.JSONDecodeError:
                pass

        out_videos.append({
            "id": slug,
            "deck_id": deck_id,
            "deck_title": deck_title,
            "deck_icon": deck_icon,
            "part": part,
            "title": f"{deck_title} — Part {part + 1}",
            "mp4_url": v["src"],
            "duration_seconds": duration,
            "duration_label": fmt_duration(duration) if duration else None,
            "has_de_vtt": de_vtt.exists(),
            "has_en_vtt": en_vtt.exists(),
            "de_vtt_path": f"data/transcripts/{slug}.de.vtt" if de_vtt.exists() else None,
            "en_vtt_path": f"data/transcripts/{slug}.en.vtt" if en_vtt.exists() else None,
        })

    # Group by deck
    decks_map: dict[str, dict] = {}
    for v in out_videos:
        d = decks_map.setdefault(v["deck_id"], {
            "id": v["deck_id"],
            "title": v["deck_title"],
            "icon": v["deck_icon"],
            "videos": [],
        })
        d["videos"].append(v)
    for d in decks_map.values():
        d["videos"].sort(key=lambda x: x["part"])

    # Keep canonical ordering matching decks.json
    canonical = ["aerodynamik", "meteo", "luftrecht", "material", "flugpraxis"]
    decks = [decks_map[i] for i in canonical if i in decks_map]
    # plus anything we didn't know about
    decks += [d for k, d in decks_map.items() if k not in canonical]

    manifest = {
        "source": payload["source"],
        "fetched_at": payload["fetchedAt"],
        "decks": decks,
    }
    OUT.write_text(json.dumps(manifest, ensure_ascii=False, indent=2))

    done = sum(1 for v in out_videos if v["has_en_vtt"])
    de_done = sum(1 for v in out_videos if v["has_de_vtt"])
    print(f"Wrote {OUT} — {len(out_videos)} videos · {de_done} with DE VTT · {done} with EN VTT")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
