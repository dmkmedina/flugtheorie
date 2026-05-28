#!/usr/bin/env python3
"""
Quality-tuned re-transcription of all Free Wings videos.

Same settings as scripts/transcribe_pilot.py — medium model, paragliding
initial_prompt, beam_size=10, tuned VAD — applied to every Free Wings
video that isn't already at production quality.

Behaviour:
  - For each FW video, back up the existing `<slug>.de.{json,vtt}` to
    `<slug>.base.de.{json,vtt}` so the base-model output is preserved
    for comparison.
  - Skip videos that already have a `.pilot.de.json` (materialkunde_1 —
    promote the pilot file to canonical .de in-place).
  - Stream audio, transcribe, write new `<slug>.de.{json,vtt}`.
  - Sorted shortest-first so usable output appears sooner.

Run: python3 scripts/transcribe_quality.py
"""
from __future__ import annotations

import json
import shutil
import subprocess
import sys
import time
from pathlib import Path

from faster_whisper import WhisperModel

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "data" / "videos.json"
TR_DIR = ROOT / "data" / "transcripts"

INITIAL_PROMPT = (
    "Dies ist ein Schweizer Lehrvideo zum Gleitschirmfliegen für die SHV-Theorieprüfung. "
    "Wir sprechen über Gleitschirm, Tragegurte, Bremsleinen, A-Ebene, B-Ebene, Beschleuniger, "
    "Anstellwinkel, Auftrieb, Widerstand, Profilsehne, Profil, Stall, Strömungsabriss, "
    "Frontklapper, Seitenklapper, Steilspirale, Thermik, Aufwind, Abwind, Hangwind, Föhn, "
    "Talwind, Bergwind, Inversion, Wolkenuntergrenze, Cumulus, Notschirm, Rettungsschirm, "
    "Schulschirm, Wettkampfschirm, Brevet, Luftraum, Kontrollzone, Startplatz, Landeplatz, "
    "EN-A, EN-B, EN-C, EN-D, SHV, FSVL."
)

DURATIONS = {
    "meteo_0": 3031, "meteo_1": 3080,
    "aerodynamik_0": 2030, "aerodynamik_1": 1386,
    "luftrecht_0": 1473, "luftrecht_1": 2287,
    "materialkunde_0": 995, "materialkunde_1": 874,
    "flugpraxis_0": 1486, "flugpraxis_1": 2203,
}


def slugify(text: str) -> str:
    return text.strip().lower().replace(" ", "_")


def fmt_ts(seconds: float) -> str:
    h = int(seconds // 3600)
    m = int((seconds % 3600) // 60)
    s = seconds - h * 3600 - m * 60
    return f"{h:02d}:{m:02d}:{s:06.3f}"


def backup(slug: str) -> None:
    """Move <slug>.de.{json,vtt} → <slug>.base.de.{json,vtt} once."""
    for ext in ("json", "vtt"):
        src = TR_DIR / f"{slug}.de.{ext}"
        dst = TR_DIR / f"{slug}.base.de.{ext}"
        if src.exists() and not dst.exists():
            src.rename(dst)


def promote_pilot(slug: str) -> bool:
    """If a `.pilot.de.{json,vtt}` exists, copy it to canonical `.de` slot."""
    pj = TR_DIR / f"{slug}.pilot.de.json"
    pv = TR_DIR / f"{slug}.pilot.de.vtt"
    if not pj.exists() or not pv.exists():
        return False
    backup(slug)
    shutil.copy(pj, TR_DIR / f"{slug}.de.json")
    shutil.copy(pv, TR_DIR / f"{slug}.de.vtt")
    return True


def stream_audio(url: str, dest_wav: Path) -> None:
    subprocess.run(
        ["ffmpeg", "-y", "-loglevel", "error",
         "-i", url, "-vn", "-ac", "1", "-ar", "16000",
         "-f", "wav", str(dest_wav)],
        check=True,
    )


def transcribe_one(model: WhisperModel, slug: str, url: str) -> None:
    wav = Path(f"/tmp/{slug}.q.wav")
    out_json = TR_DIR / f"{slug}.de.json"
    out_vtt = TR_DIR / f"{slug}.de.vtt"

    print(f"[{slug}] streaming audio…", flush=True)
    stream_audio(url, wav)
    print(f"[{slug}] {wav.stat().st_size/1e6:.1f} MB wav → transcribing (medium, beam=10, init_prompt)", flush=True)

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

    out_vtt.write_text("\n".join(vtt_lines), encoding="utf-8")
    out_json.write_text(json.dumps({
        "slug": slug, "language": "de",
        "duration": info.duration,
        "transcribed_in_sec": round(elapsed, 1),
        "model": "medium",
        "settings": {"beam_size": 10, "initial_prompt_chars": len(INITIAL_PROMPT), "vad_min_silence_ms": 300},
        "segments": seg_list,
    }, ensure_ascii=False, indent=2), encoding="utf-8")
    wav.unlink(missing_ok=True)
    print(f"[{slug}] done in {elapsed:.0f}s · {len(seg_list)} segments · realtime {info.duration/elapsed:.2f}×", flush=True)


def main() -> int:
    only = set(sys.argv[1:])
    payload = json.loads(SRC.read_text())
    videos = sorted(
        payload["domVideos"]["videos"],
        key=lambda v: DURATIONS.get(slugify(v["heading"]), 99999),
    )

    # First pass: promote any .pilot.de files in-place (cheap)
    promoted = []
    for v in videos:
        slug = slugify(v["heading"])
        if only and slug not in only:
            continue
        if promote_pilot(slug):
            promoted.append(slug)
    if promoted:
        print(f"Promoted pilot files for: {', '.join(promoted)}", flush=True)

    # Second pass: re-transcribe whatever doesn't yet have a medium-model .de
    print("Loading Whisper medium (int8)…", flush=True)
    model = WhisperModel("medium", device="cpu", compute_type="int8", cpu_threads=4)

    for v in videos:
        slug = slugify(v["heading"])
        if only and slug not in only:
            continue
        de_json = TR_DIR / f"{slug}.de.json"
        if de_json.exists():
            try:
                if json.loads(de_json.read_text()).get("model") == "medium":
                    print(f"[skip] {slug} — already medium-quality", flush=True)
                    continue
            except json.JSONDecodeError:
                pass
        backup(slug)
        transcribe_one(model, slug, v["src"])

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
