#!/usr/bin/env python3
"""Build data/video_manifest.json from extracted videos + (when present) transcripts.

Combines both providers (Free Wings + Air Active) into a single manifest grouped
by deck. Each video carries a provider tag so the UI can show a source chip.
"""
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
FW_SRC = ROOT / "data" / "videos.json"
AA_SRC = ROOT / "data" / "air_active_videos.json"
TRANSCRIPTS = ROOT / "data" / "transcripts"
OUT = ROOT / "data" / "video_manifest.json"

DECK_META = {
    "meteo":         ("Meteo", "🌤️"),
    "aerodynamik":   ("Aerodynamik", "📐"),
    "luftrecht":     ("Luftrecht", "⚖️"),
    "material":      ("Materialkunde", "🪂"),
    "flugpraxis":    ("Flugpraxis", "🛫"),
}

# Free Wings heading → deck id
FW_HEADING_DECK = {
    "meteo":         "meteo",
    "aerodynamik":   "aerodynamik",
    "luftrecht":     "luftrecht",
    "materialkunde": "material",
    "flugpraxis":    "flugpraxis",
}

# Air Active heading → deck id. Anything not matched here defaults to flugpraxis
# (the short manoeuvre clips are flight-practice demos).
AA_HEADING_DECK = {
    "meteo teil 1": "meteo",
    "meteo teil 2": "meteo",
    "meteo teil 3": "meteo",
}


def slugify(text: str) -> str:
    # Keep `%` literal — that's what the transcribe/translate pipeline writes
    # to disk (e.g. aa_seitenklapper_50%.de.vtt).
    return text.strip().lower().replace(" ", "_").replace("ä", "ae").replace("ö", "oe").replace("ü", "ue")


def fmt_duration(sec: float | None) -> str | None:
    if not sec:
        return None
    m, s = divmod(int(sec), 60)
    h, m = divmod(m, 60)
    return f"{h}:{m:02d}:{s:02d}" if h else f"{m}:{s:02d}"


def load_transcript_duration(slug: str) -> float | None:
    p = TRANSCRIPTS / f"{slug}.de.json"
    if not p.exists():
        return None
    try:
        return json.loads(p.read_text()).get("duration")
    except json.JSONDecodeError:
        return None


def build_freewings() -> list[dict]:
    if not FW_SRC.exists():
        return []
    payload = json.loads(FW_SRC.read_text())
    out = []
    for v in payload["domVideos"]["videos"]:
        heading = v["heading"].strip().lower()
        base, _, part_str = heading.rpartition(" ")
        try:
            part = int(part_str)
        except ValueError:
            base, part = heading, 0
        deck_id = FW_HEADING_DECK.get(base, base)
        title_base, _ = DECK_META.get(deck_id, (base.title(), "🎬"))
        slug = slugify(v["heading"])
        duration = load_transcript_duration(slug)
        out.append({
            "id": slug,
            "deck_id": deck_id,
            "part": part,
            "provider": "freewings",
            "provider_label": "Free Wings",
            "title": f"{title_base} — Part {part + 1}",
            "mp4_url": v["src"],
            "poster": None,
            "duration_seconds": duration,
            "duration_label": fmt_duration(duration),
            "has_de_vtt": (TRANSCRIPTS / f"{slug}.de.vtt").exists(),
            "has_en_vtt": (TRANSCRIPTS / f"{slug}.en.vtt").exists(),
        })
    return out


def build_airactive() -> list[dict]:
    if not AA_SRC.exists():
        return []
    payload = json.loads(AA_SRC.read_text())
    out = []
    for v in payload["domVideos"]["videos"]:
        heading = (v.get("heading") or "").strip()
        if not heading or not v.get("src"):
            continue
        # Prefix slug so it never collides with Free Wings
        slug = f"aa_{slugify(heading)}"
        deck_id = AA_HEADING_DECK.get(heading.lower(), "flugpraxis")
        duration = v.get("durationSec") or load_transcript_duration(slug)
        out.append({
            "id": slug,
            "deck_id": deck_id,
            "part": v.get("galleryIndex", 0),
            "provider": "airactive",
            "provider_label": "Air Active",
            "title": heading,
            "mp4_url": v["src"],
            "poster": v.get("poster"),
            "duration_seconds": duration,
            "duration_label": fmt_duration(duration),
            "has_de_vtt": (TRANSCRIPTS / f"{slug}.de.vtt").exists(),
            "has_en_vtt": (TRANSCRIPTS / f"{slug}.en.vtt").exists(),
        })
    return out


def main() -> int:
    all_videos = build_freewings() + build_airactive()

    decks_map: dict[str, dict] = {}
    for v in all_videos:
        title, icon = DECK_META.get(v["deck_id"], (v["deck_id"].title(), "🎬"))
        d = decks_map.setdefault(v["deck_id"], {
            "id": v["deck_id"],
            "title": title,
            "icon": icon,
            "videos": [],
        })
        d["videos"].append(v)

    # Sort within each deck: provider order (freewings first), then part/index
    PROVIDER_ORDER = {"freewings": 0, "airactive": 1}
    for d in decks_map.values():
        d["videos"].sort(key=lambda x: (PROVIDER_ORDER.get(x["provider"], 99), x.get("part") or 0, x["title"]))

    # Deck order
    CANON = ["aerodynamik", "meteo", "luftrecht", "material", "flugpraxis"]
    decks = [decks_map[i] for i in CANON if i in decks_map]
    decks += [d for k, d in decks_map.items() if k not in CANON]

    manifest = {
        "sources": {
            "freewings": "https://www.freewings.ch/shv-theoriekurs" if FW_SRC.exists() else None,
            "airactive": "https://www.air-active.ch/academy" if AA_SRC.exists() else None,
        },
        "decks": decks,
        "stats": {
            "total_videos": len(all_videos),
            "by_provider": {
                "freewings": sum(1 for v in all_videos if v["provider"] == "freewings"),
                "airactive": sum(1 for v in all_videos if v["provider"] == "airactive"),
            },
            "with_de_vtt": sum(1 for v in all_videos if v["has_de_vtt"]),
            "with_en_vtt": sum(1 for v in all_videos if v["has_en_vtt"]),
            "total_duration_seconds": sum((v.get("duration_seconds") or 0) for v in all_videos),
        },
    }
    OUT.write_text(json.dumps(manifest, ensure_ascii=False, indent=2))

    s = manifest["stats"]
    print(f"Wrote {OUT}")
    print(f"  {s['total_videos']} videos · FW: {s['by_provider']['freewings']} · AA: {s['by_provider']['airactive']}")
    print(f"  {s['with_de_vtt']} with DE VTT · {s['with_en_vtt']} with EN VTT")
    print(f"  total: {s['total_duration_seconds']/3600:.2f} h across {len(decks)} decks")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
