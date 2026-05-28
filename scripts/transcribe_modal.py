"""
Modal pipeline for transcribing every Free Wings + Air Active video to German
WebVTT, using faster-whisper `large-v3-turbo` on GPU with the same
paragliding `initial_prompt` and `beam_size=10` settings the CPU medium
pilot validated.

Run from project root:
    modal run scripts/transcribe_modal.py

Each video is transcribed in its own A10G container; Modal fans out
`transcribe.map(...)` automatically. The HF model cache lives on a
named Volume so subsequent runs skip the download.

Output: data/transcripts/<slug>.de.{vtt,json} (with model='large-v3-turbo').
Existing .de.* files are renamed to .prev.de.* once per slug so previous
work is preserved for comparison/translation re-use.
"""
from __future__ import annotations

import json
import subprocess
import time
from pathlib import Path
from typing import Optional

import modal

# ---------------------------------------------------------------------------
# Modal infrastructure
# ---------------------------------------------------------------------------
HF_CACHE = modal.Volume.from_name("flugtheorie-hf-cache", create_if_missing=True)

image = (
    modal.Image.debian_slim(python_version="3.11")
    .apt_install("ffmpeg")
    .pip_install(
        "faster-whisper==1.0.3",
        "huggingface_hub>=0.24",
        "requests>=2.31",
    )
    .env({"HF_HOME": "/hf-cache"})
)

app = modal.App("flugtheorie-transcribe")

INITIAL_PROMPT = (
    "Dies ist ein Schweizer Lehrvideo zum Gleitschirmfliegen für die SHV-Theorieprüfung. "
    "Wir sprechen über Gleitschirm, Tragegurte, Bremsleinen, A-Ebene, B-Ebene, Beschleuniger, "
    "Anstellwinkel, Auftrieb, Widerstand, Profilsehne, Profil, Stall, Strömungsabriss, "
    "Frontklapper, Seitenklapper, Steilspirale, Thermik, Aufwind, Abwind, Hangwind, Föhn, "
    "Talwind, Bergwind, Inversion, Wolkenuntergrenze, Cumulus, Notschirm, Rettungsschirm, "
    "Schulschirm, Wettkampfschirm, Brevet, Luftraum, Kontrollzone, Startplatz, Landeplatz, "
    "EN-A, EN-B, EN-C, EN-D, SHV, FSVL, Aramidfasern, Dyneema."
)

MODEL_NAME = "large-v3"  # faster-whisper 1.0.3 doesn't recognise large-v3-turbo


def _fmt_ts(seconds: float) -> str:
    h = int(seconds // 3600)
    m = int((seconds % 3600) // 60)
    s = seconds - h * 3600 - m * 60
    return f"{h:02d}:{m:02d}:{s:06.3f}"


@app.function(
    image=image,
    gpu="A10G",
    volumes={"/hf-cache": HF_CACHE},
    timeout=1800,  # 30 min per video — plenty even for a 51 min audio at GPU speed
    retries=modal.Retries(max_retries=2, initial_delay=5.0),
)
def transcribe(slug: str, mp4_url: str) -> dict:
    """Transcribe one MP4 URL → German WebVTT + segment JSON."""
    from faster_whisper import WhisperModel

    wav = Path(f"/tmp/{slug}.wav")
    print(f"[{slug}] streaming audio from {mp4_url}", flush=True)
    subprocess.run(
        ["ffmpeg", "-y", "-loglevel", "error",
         "-i", mp4_url, "-vn", "-ac", "1", "-ar", "16000",
         "-f", "wav", str(wav)],
        check=True,
    )
    print(f"[{slug}] {wav.stat().st_size/1e6:.1f} MB wav, loading {MODEL_NAME}…", flush=True)

    model = WhisperModel(MODEL_NAME, device="cuda", compute_type="float16")

    t0 = time.time()
    segments_iter, info = model.transcribe(
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
    for i, seg in enumerate(segments_iter, 1):
        text = seg.text.strip()
        vtt_lines.extend([str(i), f"{_fmt_ts(seg.start)} --> {_fmt_ts(seg.end)}", text, ""])
        seg_list.append({"i": i, "start": round(seg.start, 3), "end": round(seg.end, 3), "text": text})
    elapsed = time.time() - t0

    print(f"[{slug}] done in {elapsed:.0f}s · {len(seg_list)} segments · realtime {info.duration/elapsed:.1f}×", flush=True)

    return {
        "slug": slug,
        "language": "de",
        "duration": info.duration,
        "transcribed_in_sec": round(elapsed, 1),
        "model": MODEL_NAME,
        "settings": {
            "device": "cuda",
            "compute_type": "float16",
            "beam_size": 10,
            "initial_prompt_chars": len(INITIAL_PROMPT),
            "vad_min_silence_ms": 300,
        },
        "segments": seg_list,
        "vtt": "\n".join(vtt_lines),
    }


# ---------------------------------------------------------------------------
# Local entrypoint — fans out across all 25 videos, writes results locally
# ---------------------------------------------------------------------------
def _slugify(text: str) -> str:
    return text.strip().lower().replace(" ", "_")


def _load_jobs() -> list[tuple[str, str]]:
    """Read both extraction files and return [(slug, mp4_url), ...]."""
    root = Path(__file__).resolve().parent.parent
    jobs: list[tuple[str, str]] = []

    fw = root / "data" / "videos.json"
    if fw.exists():
        for v in json.loads(fw.read_text())["domVideos"]["videos"]:
            if v.get("src"):
                jobs.append((_slugify(v["heading"]), v["src"]))

    aa = root / "data" / "air_active_videos.json"
    if aa.exists():
        for v in json.loads(aa.read_text())["domVideos"]["videos"]:
            if v.get("src"):
                slug = "aa_" + _slugify(v["heading"]).replace("%", "pct")
                # match local slugify in build_video_manifest.py which keeps `%`;
                # use the literal heading slug instead.
                slug = "aa_" + v["heading"].strip().lower().replace(" ", "_")
                jobs.append((slug, v["src"]))
    return jobs


def _backup_existing(slug: str, tr_dir: Path) -> None:
    """Rename current <slug>.de.{json,vtt} → <slug>.prev.de.{json,vtt} if not yet backed up."""
    for ext in ("json", "vtt"):
        cur = tr_dir / f"{slug}.de.{ext}"
        prev = tr_dir / f"{slug}.prev.de.{ext}"
        if cur.exists() and not prev.exists():
            cur.rename(prev)


@app.local_entrypoint()
def run(only: Optional[str] = None):
    """Run all videos (or comma-separated subset via --only)."""
    root = Path(__file__).resolve().parent.parent
    tr_dir = root / "data" / "transcripts"
    tr_dir.mkdir(parents=True, exist_ok=True)

    jobs = _load_jobs()
    if only:
        wanted = set(only.split(","))
        jobs = [j for j in jobs if j[0] in wanted]

    # Skip slugs that already have a large-v3-turbo result
    pending = []
    for slug, url in jobs:
        existing = tr_dir / f"{slug}.de.json"
        if existing.exists():
            try:
                if json.loads(existing.read_text()).get("model") == MODEL_NAME:
                    print(f"[skip] {slug} — already {MODEL_NAME}")
                    continue
            except json.JSONDecodeError:
                pass
        pending.append((slug, url))

    if not pending:
        print("Nothing to do.")
        return

    print(f"Dispatching {len(pending)} videos to Modal ({MODEL_NAME} on A10G)…")
    t0 = time.time()

    # transcribe.map yields results as they complete; .starmap unpacks the tuple
    for result in transcribe.starmap(pending):
        slug = result["slug"]
        _backup_existing(slug, tr_dir)
        vtt = result.pop("vtt")
        (tr_dir / f"{slug}.de.json").write_text(json.dumps(result, ensure_ascii=False, indent=2))
        (tr_dir / f"{slug}.de.vtt").write_text(vtt, encoding="utf-8")
        print(f"  wrote {slug}.de.{{json,vtt}}")

    print(f"\nAll done in {time.time() - t0:.0f}s wall.")
