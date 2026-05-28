#!/usr/bin/env python3
"""
Pilot B: re-transcribe a single Free Wings video with a community-fine-tuned
Swiss-German Whisper model.

Path A (transcribe_pilot.py) keeps Whisper as-is but jumps from base to medium
plus an initial-prompt that primes the decoder with paragliding vocab. This
script swaps the *model itself* for one that has been further fine-tuned on
Swiss-German speech -> Standard-German text by Flurin17:

    Flurin17/whisper-large-v3-turbo-swiss-german
      - base: openai/whisper-large-v3-turbo (~809M params)
      - fine-tune target: standard-German text from Swiss-German audio
      - reported WER 37.96 on a private Swiss-German test set (-6.5 vs. base)
      - 1.8k downloads / month, BF16 safetensors, not gated

We convert the HF safetensors to CTranslate2 (int8) once with
`ct2-transformers-converter` and then drive it through the existing
faster-whisper API. This means every other knob (beam_size=10, the paragliding
initial_prompt, VAD, temperature fallback chain) is identical to Path A — the
only changed variable is the underlying acoustic/LM weights.

CPU budget: cpu_threads=2 so we share the 4-core box 50/50 with the medium
pilot that is running in parallel.

Inputs / outputs:
    streams the same wixstatic.com MP4 as the base/medium runs
    -> data/transcripts/materialkunde_1.swissg.de.json
    -> data/transcripts/materialkunde_1.swissg.de.vtt

Run: python3 scripts/transcribe_pilot_swissgerman.py [slug]   # default: materialkunde_1
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
MODEL_DIR = ROOT / "models" / "whisper-swissg-ct2"

HF_MODEL = "Flurin17/whisper-large-v3-turbo-swiss-german"

SOURCES = [
    (ROOT / "data" / "videos.json", ""),
    (ROOT / "data" / "air_active_videos.json", "aa_"),
]

# Identical to Path A so the only changed variable is the model weights.
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

    if not (MODEL_DIR / "model.bin").exists():
        print(f"CT2 model not found at {MODEL_DIR}.")
        print("Convert it once with:")
        print(
            "  ct2-transformers-converter "
            f"--model {HF_MODEL} "
            f"--output_dir {MODEL_DIR} "
            "--quantization int8 "
            "--copy_files tokenizer.json tokenizer_config.json vocab.json merges.txt "
            "special_tokens_map.json added_tokens.json normalizer.json "
            "preprocessor_config.json generation_config.json"
        )
        return 2

    wav = Path(f"/tmp/{slug}.swissg.wav")
    out_json = TR_DIR / f"{slug}.swissg.de.json"
    out_vtt = TR_DIR / f"{slug}.swissg.de.vtt"

    print(f"[{slug}] streaming audio from {video['src']}", flush=True)
    stream_audio(video["src"], wav)
    print(f"[{slug}] {wav.stat().st_size/1e6:.1f} MB wav", flush=True)

    print(f"Loading CT2 Swiss-German Whisper from {MODEL_DIR}…", flush=True)
    # cpu_threads=2 -> we share the 4-core machine with the medium pilot.
    model = WhisperModel(
        str(MODEL_DIR), device="cpu", compute_type="int8", cpu_threads=2,
    )

    print("Transcribing with quality-tuned settings:", flush=True)
    print(
        f"  model={HF_MODEL} (CT2 int8) · beam_size=10 · "
        f"initial_prompt seeded ({len(INITIAL_PROMPT)} chars)",
        flush=True,
    )
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
        "model": "whisper-large-v3-turbo-swiss-german",
        "hf_model": HF_MODEL,
        "settings": {
            "beam_size": 10,
            "temperature_fallback": [0.0, 0.2, 0.4, 0.6, 0.8, 1.0],
            "initial_prompt_chars": len(INITIAL_PROMPT),
            "vad_min_silence_ms": 300,
            "cpu_threads": 2,
            "compute_type": "int8",
        },
        "segments": seg_list,
    }
    out_vtt.write_text("\n".join(vtt_lines), encoding="utf-8")
    out_json.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    wav.unlink(missing_ok=True)

    print(
        f"[{slug}] done in {elapsed:.0f}s "
        f"({len(seg_list)} segments, {info.duration:.0f}s audio · "
        f"realtime factor {info.duration/elapsed:.2f}×)",
        flush=True,
    )
    print(f"  wrote {out_json.relative_to(ROOT)}", flush=True)
    print(f"  wrote {out_vtt.relative_to(ROOT)}", flush=True)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
