#!/usr/bin/env python3
"""
Stream audio from each Free Wings MP4 and transcribe with faster-whisper.

Writes one WebVTT per video to data/transcripts/<slug>.de.vtt and a
JSON sidecar with segment-level metadata to data/transcripts/<slug>.de.json.

Run: python3 scripts/transcribe_videos.py
"""
from __future__ import annotations

import json
import os
import subprocess
import sys
import time
from pathlib import Path

from faster_whisper import WhisperModel

ROOT = Path(__file__).resolve().parent.parent
VIDEOS_FILE = ROOT / "data" / "videos.json"
OUT_DIR = ROOT / "data" / "transcripts"
OUT_DIR.mkdir(parents=True, exist_ok=True)

MODEL_SIZE = os.environ.get("WHISPER_MODEL", "small")
COMPUTE = os.environ.get("WHISPER_COMPUTE", "int8")  # CPU-friendly
CPU_THREADS = int(os.environ.get("WHISPER_THREADS", "8"))


def slugify(heading: str) -> str:
    return heading.strip().lower().replace(" ", "_")


def fmt_ts(seconds: float) -> str:
    h = int(seconds // 3600)
    m = int((seconds % 3600) // 60)
    s = seconds - h * 3600 - m * 60
    return f"{h:02d}:{m:02d}:{s:06.3f}".replace(",", ".")


def stream_audio(url: str, dest_wav: Path) -> None:
    # 16kHz mono PCM — Whisper's native input format
    subprocess.run(
        [
            "ffmpeg", "-y", "-loglevel", "error",
            "-i", url,
            "-vn", "-ac", "1", "-ar", "16000",
            "-f", "wav", str(dest_wav),
        ],
        check=True,
    )


def transcribe(model: WhisperModel, wav: Path, slug: str) -> dict:
    t0 = time.time()
    segments, info = model.transcribe(
        str(wav),
        language="de",
        beam_size=5,
        vad_filter=True,
        vad_parameters={"min_silence_duration_ms": 500},
        condition_on_previous_text=True,
    )
    vtt_lines = ["WEBVTT", ""]
    seg_list = []
    for i, seg in enumerate(segments, 1):
        vtt_lines.append(f"{i}")
        vtt_lines.append(f"{fmt_ts(seg.start)} --> {fmt_ts(seg.end)}")
        text = seg.text.strip()
        vtt_lines.append(text)
        vtt_lines.append("")
        seg_list.append({"i": i, "start": round(seg.start, 3), "end": round(seg.end, 3), "text": text})
    elapsed = time.time() - t0
    return {
        "slug": slug,
        "language": "de",
        "duration": info.duration,
        "transcribed_in_sec": round(elapsed, 1),
        "model": MODEL_SIZE,
        "segments": seg_list,
        "vtt": "\n".join(vtt_lines),
    }


def main() -> int:
    only = set(sys.argv[1:])  # optional slug filter

    payload = json.loads(VIDEOS_FILE.read_text())
    videos = payload["domVideos"]["videos"]

    # Shortest videos first so completed transcripts show up sooner.
    # Duration only known if ffprobe was run; fall back to filename order otherwise.
    def estimate(v: dict) -> float:
        url = v["src"]
        # cached probe via /tmp/_probe_<hash> would be nice; for now do nothing
        return 0.0
    # Hard-coded durations from earlier ffprobe (in seconds) — saves a probe round-trip
    DURATIONS = {
        "meteo_0": 3031, "meteo_1": 3080,
        "aerodynamik_0": 2030, "aerodynamik_1": 1386,
        "luftrecht_0": 1473, "luftrecht_1": 2287,
        "materialkunde_0": 995, "materialkunde_1": 874,
        "flugpraxis_0": 1486, "flugpraxis_1": 2203,
    }
    videos.sort(key=lambda v: DURATIONS.get(slugify(v["heading"]), 99999))

    print(f"Loading Whisper model: {MODEL_SIZE} ({COMPUTE}, {CPU_THREADS} threads)", flush=True)
    model = WhisperModel(MODEL_SIZE, device="cpu", compute_type=COMPUTE, cpu_threads=CPU_THREADS)

    for v in videos:
        slug = slugify(v["heading"])
        if only and slug not in only:
            continue
        vtt_path = OUT_DIR / f"{slug}.de.vtt"
        json_path = OUT_DIR / f"{slug}.de.json"
        if vtt_path.exists() and json_path.exists():
            print(f"[skip] {slug} already done", flush=True)
            continue
        wav = Path(f"/tmp/{slug}.wav")
        try:
            print(f"[{slug}] streaming audio from {v['src']}", flush=True)
            stream_audio(v["src"], wav)
            sz_mb = wav.stat().st_size / 1e6
            print(f"[{slug}] {sz_mb:.1f} MB wav -> transcribing", flush=True)
            result = transcribe(model, wav, slug)
            vtt_path.write_text(result["vtt"], encoding="utf-8")
            sidecar = {k: v for k, v in result.items() if k != "vtt"}
            json_path.write_text(json.dumps(sidecar, ensure_ascii=False, indent=2), encoding="utf-8")
            print(
                f"[{slug}] done in {result['transcribed_in_sec']}s "
                f"({len(result['segments'])} segments, {result['duration']:.0f}s of audio)",
                flush=True,
            )
        finally:
            wav.unlink(missing_ok=True)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
