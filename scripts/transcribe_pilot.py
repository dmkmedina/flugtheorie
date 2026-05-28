#!/usr/bin/env python3
"""
Pilot: re-transcribe a single Free Wings video with quality-tuned settings.

What this changes vs. scripts/transcribe_videos.py:
  - model: medium (vs base) — ~10× compute, big WER drop on Swiss German.
  - initial_prompt: seeds Whisper with paragliding vocabulary so the decoder
    favours real terms ("Gleitschirm", "Bremsleinen") over the homophonic
    junk that base produces ("Gleichschirm", "Leitschirm", "Schuhschirm").
  - beam_size: 10 (vs 5) — slower, finds better hypotheses on dialectal audio.
  - temperature: fallback chain so a poor greedy pass triggers re-decoding
    instead of producing the stutter loops we saw with base.
  - VAD: shorter min_silence so sentence boundaries don't eat content.

Outputs are written next to the originals with a `.pilot` infix so the
existing files aren't overwritten — you can diff side-by-side:
  data/transcripts/materialkunde_1.de.json         (base, current)
  data/transcripts/materialkunde_1.pilot.de.json   (medium, this script)

Run: python3 scripts/transcribe_pilot.py [slug]   # default: materialkunde_1
"""
from __future__ import annotations

import json
import subprocess
import sys
import time
from pathlib import Path

from faster_whisper import WhisperModel

ROOT = Path(__file__).resolve().parent.parent
TR_DIR = ROOT / "data" / "transcripts"
TR_DIR.mkdir(parents=True, exist_ok=True)

SOURCES = [
    (ROOT / "data" / "videos.json", ""),
    (ROOT / "data" / "air_active_videos.json", "aa_"),
]

# Domain-priming for the Whisper decoder. Mix of high-frequency German
# paragliding terms + a couple of complete sentences in the expected
# instructor register so the model picks up the cadence too.
INITIAL_PROMPT = (
    "Dies ist ein Schweizer Lehrvideo zum Gleitschirmfliegen für die SHV-Theorieprüfung. "
    "Wir sprechen über Gleitschirm, Tragegurte, Bremsleinen, A-Ebene, B-Ebene, Beschleuniger, "
    "Anstellwinkel, Auftrieb, Widerstand, Profilsehne, Profil, Stall, Strömungsabriss, "
    "Frontklapper, Seitenklapper, Steilspirale, Thermik, Aufwind, Abwind, Hangwind, Föhn, "
    "Talwind, Bergwind, Inversion, Wolkenuntergrenze, Cumulus, Notschirm, Rettungsschirm, "
    "Schulschirm, Wettkampfschirm, Brevet, Luftraum, Kontrollzone, Startplatz, Landeplatz, "
    "EN-A, EN-B, EN-C, EN-D, SHV, FSVL."
)


def slugify(text: str) -> str:
    return text.strip().lower().replace(" ", "_").replace("%", "pct")


def find_video(slug: str) -> dict | None:
    for src_file, prefix in SOURCES:
        if not src_file.exists():
            continue
        payload = json.loads(src_file.read_text())
        for v in payload.get("domVideos", {}).get("videos", []):
            if f"{prefix}{slugify(v['heading'])}" == slug:
                return {**v, "src_prefix": prefix}
    return None


def stream_audio(url: str, dest_wav: Path) -> None:
    subprocess.run(
        ["ffmpeg", "-y", "-loglevel", "error",
         "-i", url, "-vn", "-ac", "1", "-ar", "16000",
         "-f", "wav", str(dest_wav)],
        check=True,
    )


def fmt_ts(seconds: float) -> str:
    h = int(seconds // 3600)
    m = int((seconds % 3600) // 60)
    s = seconds - h * 3600 - m * 60
    return f"{h:02d}:{m:02d}:{s:06.3f}"


def main() -> int:
    slug = sys.argv[1] if len(sys.argv) > 1 else "materialkunde_1"
    video = find_video(slug)
    if not video:
        print(f"Unknown slug: {slug}")
        return 1

    wav = Path(f"/tmp/{slug}.pilot.wav")
    out_json = TR_DIR / f"{slug}.pilot.de.json"
    out_vtt = TR_DIR / f"{slug}.pilot.de.vtt"

    print(f"[{slug}] streaming audio from {video['src']}", flush=True)
    stream_audio(video["src"], wav)
    print(f"[{slug}] {wav.stat().st_size/1e6:.1f} MB wav", flush=True)

    print("Loading Whisper medium (int8) — first run downloads ~1.5 GB…", flush=True)
    model = WhisperModel("medium", device="cpu", compute_type="int8", cpu_threads=4)

    print("Transcribing with quality-tuned settings:", flush=True)
    print(f"  model=medium · beam_size=10 · initial_prompt seeded ({len(INITIAL_PROMPT)} chars)", flush=True)
    t0 = time.time()
    segments, info = model.transcribe(
        str(wav),
        language="de",
        beam_size=10,
        initial_prompt=INITIAL_PROMPT,
        temperature=[0.0, 0.2, 0.4, 0.6, 0.8, 1.0],
        compression_ratio_threshold=2.4,
        no_speech_threshold=0.6,
        condition_on_previous_text=True,
        vad_filter=True,
        vad_parameters={"min_silence_duration_ms": 300, "speech_pad_ms": 200},
    )

    vtt_lines = ["WEBVTT", ""]
    seg_list = []
    for i, seg in enumerate(segments, 1):
        text = seg.text.strip()
        vtt_lines.extend([str(i), f"{fmt_ts(seg.start)} --> {fmt_ts(seg.end)}", text, ""])
        seg_list.append({"i": i, "start": round(seg.start, 3), "end": round(seg.end, 3), "text": text})

    elapsed = time.time() - t0
    payload = {
        "slug": slug,
        "language": "de",
        "duration": info.duration,
        "transcribed_in_sec": round(elapsed, 1),
        "model": "medium",
        "settings": {
            "beam_size": 10,
            "temperature_fallback": [0.0, 0.2, 0.4, 0.6, 0.8, 1.0],
            "initial_prompt_chars": len(INITIAL_PROMPT),
            "vad_min_silence_ms": 300,
        },
        "segments": seg_list,
    }
    out_vtt.write_text("\n".join(vtt_lines), encoding="utf-8")
    out_json.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    wav.unlink(missing_ok=True)

    print(
        f"[{slug}] done in {elapsed:.0f}s "
        f"({len(seg_list)} segments, {info.duration:.0f}s audio · "
        f"realtime factor {info.duration/elapsed:.1f}×)",
        flush=True,
    )
    print(f"  wrote {out_json.relative_to(ROOT)}", flush=True)
    print(f"  wrote {out_vtt.relative_to(ROOT)}", flush=True)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
