#!/usr/bin/env python3
"""Render the authored podcast scripts to audio with a cloud TTS provider.

Reads data/podcasts.json (produced by scripts/author_podcasts.py), synthesises
each dialogue segment with the voice assigned to its speaker, stitches the
segments into one track per episode (with a short pause between turns), and
writes:

  assets/podcast/<id>.m4a      one audio file per scripted episode
  data/podcast_timing.json     per-segment start times + total duration (for the
                               read-along transcript in the app)

No ffmpeg required: TTS segments are requested as WAV/PCM, concatenated with the
Python `wave` stdlib, and converted to .m4a with macOS `afconvert`.

Per-segment caching (keyed on provider+model+voice+text) lives in
scripts/.podcast_build/cache, so re-running after a script tweak only re-renders
the lines that changed — it does not re-bill the whole episode.

--- Providing a key (never commit it) --------------------------------------
Create a gitignored .env.local in the repo root:

    PODCAST_TTS_PROVIDER=openai            # or: elevenlabs
    OPENAI_API_KEY=sk-...                  # for openai
    # ELEVENLABS_API_KEY=...               # for elevenlabs

Then:  python3 scripts/build_podcasts.py            # render everything
       python3 scripts/build_podcasts.py --only aerodynamics
       python3 scripts/build_podcasts.py --dry-run  # cost/where-it-goes, no calls
       python3 scripts/build_podcasts.py --provider elevenlabs

After rendering, run `python3 build.py` to fold the new audio + timing into
index.html.
"""
import argparse
import hashlib
import json
import os
import subprocess
import sys
import urllib.error
import urllib.request
import wave

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BUILD_DIR = os.path.join(ROOT, "scripts", ".podcast_build")
CACHE_DIR = os.path.join(BUILD_DIR, "cache")
OUT_DIR = os.path.join(ROOT, "assets", "podcast")

# Canonical PCM format every segment is normalised to before stitching.
CH, WIDTH, RATE = 1, 2, 24000          # mono, 16-bit, 24 kHz
GAP_SECONDS = 0.34                     # pause inserted after each spoken turn
LEAD_SECONDS = 0.25                    # tiny lead-in so the first word isn't clipped


# --- config / secrets --------------------------------------------------------
def load_env_local():
    """Load KEY=VALUE lines from .env.local into os.environ (without overriding
    anything already set in the real environment)."""
    path = os.path.join(ROOT, ".env.local")
    if not os.path.exists(path):
        return
    with open(path, encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            k, v = line.split("=", 1)
            os.environ.setdefault(k.strip(), v.strip().strip('"').strip("'"))


def provider_config(args):
    provider = (args.provider or os.environ.get("PODCAST_TTS_PROVIDER") or "openai").lower()
    if provider == "openai":
        return {
            "provider": "openai",
            "key": os.environ.get("OPENAI_API_KEY"),
            "key_name": "OPENAI_API_KEY",
            "model": args.model or os.environ.get("PODCAST_TTS_MODEL") or "gpt-4o-mini-tts",
            "voice_field": "openai_voice",
        }
    if provider in ("elevenlabs", "11labs"):
        return {
            "provider": "elevenlabs",
            "key": os.environ.get("ELEVENLABS_API_KEY") or os.environ.get("ELEVEN_API_KEY"),
            "key_name": "ELEVENLABS_API_KEY",
            "model": args.model or os.environ.get("PODCAST_TTS_MODEL") or "eleven_multilingual_v2",
            "voice_field": "elevenlabs_voice",
        }
    sys.exit(f"Unknown TTS provider: {provider!r} (expected 'openai' or 'elevenlabs')")


# --- TTS providers (return canonical raw PCM bytes) --------------------------
def _http(req):
    try:
        with urllib.request.urlopen(req, timeout=120) as r:
            return r.read()
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", "replace")[:500]
        raise SystemExit(f"TTS request failed ({e.code}): {body}")


def tts_openai(text, voice, cfg):
    """OpenAI returns a full WAV; decode to canonical PCM frames."""
    body = json.dumps({
        "model": cfg["model"], "voice": voice, "input": text,
        "response_format": "wav",
    }).encode("utf-8")
    req = urllib.request.Request(
        "https://api.openai.com/v1/audio/speech", data=body,
        headers={"Authorization": f"Bearer {cfg['key']}", "Content-Type": "application/json"},
    )
    wav_bytes = _http(req)
    tmp = os.path.join(BUILD_DIR, "_tmp_openai.wav")
    with open(tmp, "wb") as f:
        f.write(wav_bytes)
    with wave.open(tmp, "rb") as w:
        if (w.getnchannels(), w.getsampwidth(), w.getframerate()) != (CH, WIDTH, RATE):
            raise SystemExit(
                f"OpenAI returned {w.getnchannels()}ch/{w.getsampwidth() * 8}bit/"
                f"{w.getframerate()}Hz, expected mono/16/{RATE}. Adjust CH/WIDTH/RATE.")
        return w.readframes(w.getnframes())


def tts_elevenlabs(text, voice, cfg):
    """ElevenLabs can emit raw PCM at 24 kHz — already canonical, no header."""
    url = (f"https://api.elevenlabs.io/v1/text-to-speech/{voice}"
           f"?output_format=pcm_24000")
    body = json.dumps({"text": text, "model_id": cfg["model"]}).encode("utf-8")
    req = urllib.request.Request(
        url, data=body,
        headers={"xi-api-key": cfg["key"], "Content-Type": "application/json",
                 "Accept": "audio/pcm"},
    )
    return _http(req)


def synth(text, voice, cfg):
    return (tts_openai if cfg["provider"] == "openai" else tts_elevenlabs)(text, voice, cfg)


# --- caching -----------------------------------------------------------------
def cached_pcm(text, voice, cfg):
    key = hashlib.sha1(
        f"{cfg['provider']}|{cfg['model']}|{voice}|{text}".encode("utf-8")).hexdigest()
    path = os.path.join(CACHE_DIR, key + ".pcm")
    if os.path.exists(path):
        with open(path, "rb") as f:
            return f.read(), True
    pcm = synth(text, voice, cfg)
    with open(path, "wb") as f:
        f.write(pcm)
    return pcm, False


# --- stitching ---------------------------------------------------------------
def silence(seconds):
    return b"\x00" * int(RATE * seconds) * CH * WIDTH


def pcm_seconds(pcm):
    return len(pcm) / (RATE * CH * WIDTH)


def build_episode(ep, cfg, dry_run):
    voices = {k: v[cfg["voice_field"]] for k, v in EP_HOSTS.items()}
    segs = ep["segments"]
    chars = sum(len(s["text"]) for s in segs)
    if dry_run:
        print(f"   - {ep['id']:<14} {len(segs):>3} segments · {chars:>6} chars "
              f"(~{chars / 1000:.1f}k) → {os.path.relpath(OUT_DIR)}/{ep['id']}.m4a")
        return None

    os.makedirs(OUT_DIR, exist_ok=True)
    starts, hits = [], 0
    cursor = LEAD_SECONDS
    frames = [silence(LEAD_SECONDS)]
    for i, s in enumerate(segs):
        voice = voices.get(s["speaker"], next(iter(voices.values())))
        pcm, hit = cached_pcm(s["text"], voice, cfg)
        hits += hit
        starts.append(round(cursor, 3))
        frames.append(pcm)
        frames.append(silence(GAP_SECONDS))
        cursor += pcm_seconds(pcm) + GAP_SECONDS
        print(f"\r     {ep['id']}: {i + 1}/{len(segs)} segments "
              f"({hits} cached)", end="", flush=True)
    print()

    wav_path = os.path.join(BUILD_DIR, f"{ep['id']}.wav")
    with wave.open(wav_path, "wb") as out:
        out.setnchannels(CH); out.setsampwidth(WIDTH); out.setframerate(RATE)
        out.writeframes(b"".join(frames))

    m4a_path = os.path.join(OUT_DIR, f"{ep['id']}.m4a")
    # 64 kbps AAC is ample for 24 kHz mono speech; higher bitrates are rejected
    # by the encoder at this sample rate/channel count ('!dat').
    subprocess.run(["afconvert", "-f", "m4af", "-d", "aac", "-b", "64000",
                    wav_path, m4a_path], check=True)
    dur = round(cursor, 3)
    size_mb = os.path.getsize(m4a_path) / 1e6
    print(f"     ✓ {os.path.relpath(m4a_path)}  ({dur / 60:.1f} min, {size_mb:.1f} MB, {hits}/{len(segs)} cached)")
    return {"audio": f"assets/podcast/{ep['id']}.m4a", "duration": dur, "segments": starts}


EP_HOSTS = {}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--provider", help="openai (default) | elevenlabs")
    ap.add_argument("--model", help="override TTS model")
    ap.add_argument("--only", help="render a single episode id")
    ap.add_argument("--dry-run", action="store_true", help="show plan + char counts, make no API calls")
    args = ap.parse_args()

    load_env_local()
    cfg = provider_config(args)

    os.makedirs(CACHE_DIR, exist_ok=True)
    data = json.load(open(os.path.join(ROOT, "data", "podcasts.json"), encoding="utf-8"))
    global EP_HOSTS
    EP_HOSTS = data["hosts"]
    episodes = [e for e in data["episodes"] if e["segments"]]
    if args.only:
        episodes = [e for e in episodes if e["id"] == args.only]
        if not episodes:
            sys.exit(f"No scripted episode with id {args.only!r}")

    print(f"Provider: {cfg['provider']} · model: {cfg['model']}")
    if not args.dry_run and not cfg["key"]:
        print()
        print(f"  ⚠  No API key found ({cfg['key_name']}). Nothing rendered.")
        print(f"     Add it to a gitignored .env.local, e.g.:")
        print(f"         PODCAST_TTS_PROVIDER={cfg['provider']}")
        print(f"         {cfg['key_name']}=...your key...")
        print(f"     Then re-run. Use --dry-run to preview cost without a key.")
        return
    print(f"Scripted episodes to render: {len(episodes)}")

    timing = {"renderedWith": f"{cfg['provider']}:{cfg['model']}", "episodes": {}}
    if args.dry_run:
        total = 0
        for ep in episodes:
            build_episode(ep, cfg, dry_run=True)
            total += sum(len(s["text"]) for s in ep["segments"])
        print(f"\n  Total: {total} characters (~{total / 1000:.1f}k). No API calls made.")
        return

    for ep in episodes:
        result = build_episode(ep, cfg, dry_run=False)
        if result:
            timing["episodes"][ep["id"]] = result

    timing_path = os.path.join(ROOT, "data", "podcast_timing.json")
    with open(timing_path, "w", encoding="utf-8") as f:
        json.dump(timing, f, ensure_ascii=False, indent=2)
    print(f"\nWrote {os.path.relpath(timing_path)} ({len(timing['episodes'])} episode(s)).")
    print("Next: run `python3 build.py` to fold audio + timing into index.html.")


if __name__ == "__main__":
    main()
