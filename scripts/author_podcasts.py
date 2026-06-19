#!/usr/bin/env python3
"""Assemble the podcast manifest data/podcasts.json from per-episode scripts.

Each episode's dialogue lives in its own plain-text file under
data/podcast_scripts/<id>.txt, one turn per line:

    # comment lines (and blank lines) are ignored
    Maya: We start with the most boring-sounding word in aerodynamics...
    Theo: Vectors. Great. Sounds like homework.

Speaker names map to the host keys in HOSTS (Maya -> a, Theo -> b). Keeping the
prose in text files (not Python) makes the long scripts easy to edit and lets
each topic's script be authored independently.

Pipeline:
  scripts/author_podcasts.py  ->  data/podcasts.json        (transcript + metadata; THIS file)
  scripts/build_podcasts.py   ->  assets/podcast/<id>.m4a   (real audio, needs a cloud-TTS key)
                              ->  data/podcast_timing.json   (per-segment start times + duration)
  build.py                    inlines podcasts.json (+ timing if present) as window.PODCASTS

Each episode maps to one Study-Guide topic. Scripts are written audio-first from
ALL three source corpora for that topic: the study guide (data/guide.json), the
workbook (data/workbook.json), and the transcribed instructor videos
(data/transcripts/). Episodes with no script file yet fall back to their outline.

Speakers:  a = Maya  (instructor — calm, precise, paints pictures)
           b = Theo  (curious student — asks what a learner would ask)
"""
import json
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SCRIPTS_DIR = os.path.join(ROOT, "data", "podcast_scripts")

HOSTS = {
    "a": {"name": "Maya", "role": "instructor", "openai_voice": "shimmer", "elevenlabs_voice": "Rachel"},
    "b": {"name": "Theo", "role": "learner", "openai_voice": "onyx", "elevenlabs_voice": "Adam"},
}
NAME_TO_SPEAKER = {h["name"].lower(): k for k, h in HOSTS.items()}


def parse_script(episode_id):
    """Parse data/podcast_scripts/<id>.txt into [{speaker, text}, ...]."""
    path = os.path.join(SCRIPTS_DIR, episode_id + ".txt")
    if not os.path.exists(path):
        return []
    segs = []
    with open(path, encoding="utf-8") as f:
        for raw in f:
            line = raw.strip()
            if not line or line.startswith("#"):
                continue
            name, sep, text = line.partition(":")
            key = NAME_TO_SPEAKER.get(name.strip().lower()) if sep else None
            if key is None:
                # A line that doesn't start with a known "Name:" is treated as a
                # continuation of the previous turn (e.g. a hard-wrapped line).
                if segs:
                    segs[-1]["text"] += " " + line
                continue
            segs.append({"speaker": key, "text": text.strip()})
    return segs


# Episode metadata. One per Study-Guide topic; segments come from the script
# files. `sources` documents (and the build log surfaces) the three corpora each
# script should draw on. `outline` is shown in the app until a script exists.
EPISODES = [
    {
        "id": "aerodynamics", "part": "part1", "topic": "Aerodynamics",
        "title": "Aerodynamics & Flight Mechanics",
        "icon": "📐", "color": "#a855f7", "est_minutes": 12,
        "blurb": "How a wing actually flies — vectors, drag and the square-of-speed rule, the three explanations of lift, the angle-of-attack ladder, the polar curve, glide ratio, stability, and load factor in turns.",
        "sources": {"guide": "part1", "workbook": "aero", "videos": ["aerodynamik_0", "aerodynamik_1"]},
        "outline": [],
    },
    {
        "id": "meteorology", "part": "part2", "topic": "Meteorology",
        "title": "Meteorology",
        "icon": "🌦️", "color": "#06b6d4", "est_minutes": 13,
        "blurb": "The invisible engine: why air rises, how thermals form and where to find them, clouds as billboards in the sky, wind gradient and the venturi effect, inversions and Föhn, and the signs that tell you to stay on the ground.",
        "sources": {"guide": "part2", "workbook": "meteo",
                    "videos": ["meteo_0", "meteo_1", "aa_meteo_teil_1", "aa_meteo_teil_2", "aa_meteo_teil_3"]},
        "outline": [
            "Heating and convection — why the ground builds thermals, and the daily rhythm of a flyable day",
            "Reading clouds out loud — cumulus as thermal markers, over-development, and the danger signs",
            "Wind: gradient near the ground, venturi compression through gaps, rotor and lee-side turbulence",
            "Inversions, Föhn, fronts and the forecasts that decide whether you fly",
        ],
    },
    {
        "id": "legislation", "part": "part3", "topic": "Legislation / Airspace",
        "title": "Law & Airspace",
        "icon": "⚖️", "color": "#3b82f6", "est_minutes": 9,
        "blurb": "The rules that keep everyone alive: airspace classes and where free-flight is allowed, right-of-way and priority, distances and no-fly zones, and the pilot's legal responsibilities.",
        "sources": {"guide": "part3", "workbook": "law", "videos": ["luftrecht_0", "luftrecht_1"]},
        "outline": [
            "Airspace classes painted as a layer cake — what each one means for a paraglider",
            "Right-of-way: who yields to whom, ridge rules, and converging gliders",
            "Where you may not fly — protected zones, clouds, and minimum distances",
            "Insurance, licensing and the pilot-in-command's responsibilities",
        ],
    },
    {
        "id": "equipment", "part": "part4", "topic": "Equipment",
        "title": "Equipment",
        "icon": "🎒", "color": "#f59e0b", "est_minutes": 10,
        "blurb": "Your gear, from canopy to carabiner: how a wing is built, lines and risers, the harness and reserve parachute, certification classes, and the pre-flight check that catches problems on the ground.",
        "sources": {"guide": "part4", "workbook": "equip", "videos": ["materialkunde_0", "materialkunde_1"]},
        "outline": [
            "Anatomy of the wing — cells, internal structure, line cascade and risers",
            "Harness, reserve and connectors — how the safety system fits together",
            "Certification classes (A to D) and what they really say about a wing",
            "The pre-flight check, daily care, and when to retire a wing",
        ],
    },
    {
        "id": "flying-skills", "part": "part5", "topic": "Flying Skills",
        "title": "Flying Skills",
        "icon": "🛬", "color": "#10b981", "est_minutes": 12,
        "blurb": "Putting it together in the air: launch technique, active flying to keep the wing overhead, planning the approach and landing, and recognising and recovering from collapses when the air turns rough.",
        "sources": {"guide": "part5", "workbook": "skills",
                    "videos": ["flugpraxis_0", "flugpraxis_1", "aa_stallpunkt", "aa_grosse_ohren",
                               "aa_kleine_ohren", "aa_b-stall", "aa_nicken", "aa_rollen",
                               "aa_kurvenfliegen", "aa_bremshaltung", "aa_beschleunigt_fliegen",
                               "aa_seitenklapper_50%"]},
        "outline": [
            "Launch — forward and reverse, the wall, and aborting safely",
            "Active flying — feeling the wing and keeping it loaded over your head",
            "The approach: circuit planning, the aiming point and flaring to land",
            "When it goes wrong — collapses, big-ears, B-stall and the calm recovery sequence",
        ],
    },
]


def main():
    for ep in EPISODES:
        ep["segments"] = parse_script(ep["id"])
        # Once scripted, derive the shown time estimate from the word count
        # (~160 wpm conversational) until real audio duration replaces it.
        if ep["segments"]:
            wc = sum(len(s["text"].split()) for s in ep["segments"])
            ep["est_minutes"] = max(1, round(wc / 160))

    data = {
        "version": 1,
        "description": "Two-host audio companions, one per study-guide topic. Audio is rendered separately by scripts/build_podcasts.py.",
        "hosts": HOSTS,
        "episodes": EPISODES,
    }
    out = os.path.join(ROOT, "data", "podcasts.json")
    with open(out, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    scripted = [e for e in EPISODES if e["segments"]]
    words = sum(len(seg["text"].split()) for e in scripted for seg in e["segments"])
    print(f"Wrote {out}")
    print(f"  Episodes: {len(EPISODES)} ({len(scripted)} scripted, {len(EPISODES) - len(scripted)} outlined)")
    for e in EPISODES:
        n = len(e["segments"])
        print(f"   - {e['id']:<14} {e['topic']:<22} {(str(n) + ' turns') if n else 'outline only'}")
    print(f"  Scripted words: {words} (~{round(words / 150)} min of speech at 150 wpm)")


if __name__ == "__main__":
    main()
