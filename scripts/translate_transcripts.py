#!/usr/bin/env python3
"""
Translate German VTT transcripts to English, preserving WebVTT timestamps.

Uses the Anthropic SDK if ANTHROPIC_API_KEY is set, falls back to OpenAI if
OPENAI_API_KEY is set. Translates in batches of ~25 segments so the model
sees enough context for coherent paragraph-level translation, then re-attaches
each English line to its original timestamp.

Run: python3 scripts/translate_transcripts.py
Optional args: list of slugs to translate (e.g. `meteo_0 luftrecht_1`)
"""
from __future__ import annotations

import json
import os
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
TR_DIR = ROOT / "data" / "transcripts"

BATCH_SIZE = int(os.environ.get("TRANSLATE_BATCH", "25"))
MODEL = os.environ.get("TRANSLATE_MODEL", "")  # provider-specific default below

GLOSSARY = """
Domain: Swiss paragliding theory (SHV/FSVL exam preparation).
Keep these aviation/paragliding terms in fluent technical English:
  Gleitschirm -> paraglider / wing
  Bremsleinen -> brake lines
  Tragegurte -> risers
  Anstellwinkel -> angle of attack
  Auftrieb -> lift
  Widerstand -> drag
  Profilsehne -> chord line
  Profil -> airfoil / profile
  Klapper / Klapper -> collapse
  Stall / Strömungsabriss -> stall
  Trudeln -> spin
  Frontklapper -> frontal collapse
  Seitenklapper -> asymmetric collapse
  Steilspirale -> spiral dive
  Thermik -> thermal
  Aufwind -> updraft
  Abwind -> downdraft
  Hangwind -> ridge lift
  Talwind / Bergwind -> valley wind / mountain wind
  Föhn -> Foehn wind
  Inversion -> inversion
  Wolkenuntergrenze -> cloud base
  Cumulus / Cu -> cumulus
  Notschirm / Retter -> reserve parachute
  SHV / FSVL -> SHV/FSVL (Swiss Hang-gliding & Paragliding Federation)
  Brevet -> brevet / licence
  Luftraum -> airspace
  CTR / TMA / Kontrollzone -> CTR / TMA / control zone
  Schirm -> wing
  Startplatz / Landeplatz -> launch site / landing site
  A-Ebene / B-Ebene / C-Ebene -> A/B/C riser group
Use natural conversational English, contractions are fine. Keep sentences short.
"""


def fmt_ts(seconds: float) -> str:
    h = int(seconds // 3600)
    m = int((seconds % 3600) // 60)
    s = seconds - h * 3600 - m * 60
    return f"{h:02d}:{m:02d}:{s:06.3f}"


def call_anthropic(prompt: str) -> str:
    import anthropic
    client = anthropic.Anthropic()
    model = MODEL or "claude-sonnet-4-6"
    resp = client.messages.create(
        model=model,
        max_tokens=4096,
        system="You are a precise German-to-English translator for Swiss paragliding training material. Output only the translated lines, one per input segment, in the same order.",
        messages=[{"role": "user", "content": prompt}],
    )
    return resp.content[0].text


def call_openai(prompt: str) -> str:
    from openai import OpenAI
    client = OpenAI()
    model = MODEL or "gpt-4o-mini"
    resp = client.chat.completions.create(
        model=model,
        messages=[
            {"role": "system", "content": "You are a precise German-to-English translator for Swiss paragliding training material. Output only the translated lines, one per input segment, in the same order."},
            {"role": "user", "content": prompt},
        ],
        temperature=0.2,
    )
    return resp.choices[0].message.content


def get_llm():
    if os.environ.get("ANTHROPIC_API_KEY"):
        return call_anthropic, "anthropic"
    if os.environ.get("OPENAI_API_KEY"):
        return call_openai, "openai"
    raise RuntimeError("Set ANTHROPIC_API_KEY or OPENAI_API_KEY before running.")


def translate_batch(segments: list[dict], llm) -> list[str]:
    numbered = "\n".join(f"[{i + 1}] {s['text']}" for i, s in enumerate(segments))
    prompt = (
        f"{GLOSSARY}\n\n"
        "Translate each numbered German segment below into natural conversational English. "
        "Output exactly the same number of lines, each prefixed with its [n] marker, in the same order. "
        "Do not merge or split lines.\n\n"
        f"{numbered}"
    )
    raw = llm(prompt).strip()
    out: list[str | None] = [None] * len(segments)
    for line in raw.splitlines():
        line = line.strip()
        if not line.startswith("["):
            continue
        try:
            close = line.index("]")
            idx = int(line[1:close]) - 1
            text = line[close + 1 :].strip()
        except (ValueError, IndexError):
            continue
        if 0 <= idx < len(out):
            out[idx] = text
    for i, t in enumerate(out):
        if t is None:
            out[i] = "[translation missing]"
    return out  # type: ignore[return-value]


def translate_file(slug: str) -> None:
    src_json = TR_DIR / f"{slug}.de.json"
    out_vtt = TR_DIR / f"{slug}.en.vtt"
    out_json = TR_DIR / f"{slug}.en.json"
    if not src_json.exists():
        print(f"[skip] {slug} — no German JSON yet")
        return
    if out_vtt.exists() and out_json.exists():
        print(f"[skip] {slug} — already translated")
        return

    payload = json.loads(src_json.read_text())
    segments = payload["segments"]
    if not segments:
        print(f"[warn] {slug} — empty transcript")
        return

    llm, provider = get_llm()
    print(f"[{slug}] translating {len(segments)} segments via {provider}…", flush=True)

    translated: list[str] = []
    for i in range(0, len(segments), BATCH_SIZE):
        batch = segments[i : i + BATCH_SIZE]
        t0 = time.time()
        out = translate_batch(batch, llm)
        translated.extend(out)
        print(f"  batch {i // BATCH_SIZE + 1}/{(len(segments) - 1) // BATCH_SIZE + 1} ({time.time() - t0:.1f}s)", flush=True)

    # Compose English VTT
    lines = ["WEBVTT", ""]
    en_segments = []
    for i, (seg, en) in enumerate(zip(segments, translated), 1):
        lines.append(str(i))
        lines.append(f"{fmt_ts(seg['start'])} --> {fmt_ts(seg['end'])}")
        lines.append(en)
        lines.append("")
        en_segments.append({"i": i, "start": seg["start"], "end": seg["end"], "text": en})

    out_vtt.write_text("\n".join(lines), encoding="utf-8")
    out_json.write_text(json.dumps({
        "slug": slug,
        "language": "en",
        "provider": provider,
        "model": MODEL or "default",
        "duration": payload.get("duration"),
        "segments": en_segments,
    }, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"[{slug}] wrote {out_vtt.name}", flush=True)


def main() -> int:
    if not TR_DIR.exists():
        print("No transcripts dir — run transcribe_videos.py first.")
        return 1
    only = set(sys.argv[1:])
    de_files = sorted(p.stem.rsplit(".", 1)[0] for p in TR_DIR.glob("*.de.json"))
    for slug in de_files:
        if only and slug not in only:
            continue
        translate_file(slug)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
