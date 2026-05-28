# Videos pipeline

End-to-end pipeline for ingesting paragliding-theory videos from external
academies, transcribing them with Whisper, translating the German
transcripts into English, and embedding the result as a bilingual
subtitled player in the app.

## Sources

| Provider     | Page                                       | Auth                          | Output                              |
|--------------|--------------------------------------------|-------------------------------|-------------------------------------|
| Free Wings   | https://www.freewings.ch/shv-theoriekurs   | none                          | `data/videos.json`                  |
| Air Active   | https://www.air-active.ch/academy          | password `airAcademy2024`     | `data/air_active_videos.json`       |

## Pipeline stages

```
                       extract_video_urls.mjs           transcribe_videos.py            translate_transcripts.py        build_video_manifest.py     build.py
external page (Wix)  ───────────────────────▶  videos.json  ───────────────────▶  *.de.vtt / *.de.json  ─────────▶  *.en.vtt / *.en.json  ─────▶  video_manifest.json  ───▶  index.html
                       (Playwright capture)              (ffmpeg + faster-whisper)         (LLM batch + glossary)             (combine + tag)                (inline)
```

### 1. Extract video URLs

```bash
# Free Wings (public)
node scripts/extract_video_urls.mjs

# Air Active (password gated; password is hard-coded in the script)
node scripts/extract_air_active_videos.mjs
```

Both scripts render the page in headless Chromium, capture every MP4 the
Wix player loads, and pair each URL with the nearest section heading.

### 2. Transcribe

```bash
# Defaults: model=small, threads=8 — best quality; takes ~2-3× realtime on CPU
python3 scripts/transcribe_videos.py

# Faster (lower quality, but useful for first-pass):
WHISPER_MODEL=base WHISPER_THREADS=4 python3 scripts/transcribe_videos.py

# Resume / single video:
python3 scripts/transcribe_videos.py materialkunde_1
```

**Model choice**: the Free Wings audio is Swiss-German technical content.
The `base` model produces visible errors in jargon (Gleichschirm vs.
Gleitschirm, mis-segmented sentences, occasional stutter loops). `small`
is the floor for usable quality; `medium` is recommended for final
production. The transcribe script skips videos that already have both
`.de.vtt` and `.de.json` in `data/transcripts/`, so you can re-run with
a better model after deleting the lower-quality outputs:

```bash
rm data/transcripts/*.de.*          # nuke base-model output
WHISPER_MODEL=medium python3 scripts/transcribe_videos.py
```

Output is sorted shortest-first so usable transcripts appear sooner.

### 3. Translate

```bash
# Anthropic
export ANTHROPIC_API_KEY=sk-ant-...
python3 scripts/translate_transcripts.py

# OpenAI
export OPENAI_API_KEY=sk-...
python3 scripts/translate_transcripts.py

# Single slug
python3 scripts/translate_transcripts.py materialkunde_1
```

Translation preserves the German VTT's timestamps verbatim — same cue
boundaries, English text only. The script batches ~25 segments per LLM
call with a paragliding glossary in the system prompt so technical terms
stay consistent across the deck.

### 4. Build manifest + bundle

```bash
python3 scripts/build_video_manifest.py    # combines FW + AA → data/video_manifest.json
python3 build.py                           # inlines manifest + every VTT into index.html
```

The build inlines all VTT files into `index.html` as JSON, and the app
mints a blob URL per VTT at runtime for the `<track>` elements. No
external requests for subtitles — the deploy stays a single file.

## File layout

```
data/
  videos.json                 # Free Wings extraction (10 videos)
  air_active_videos.json      # Air Active extraction (15 videos)
  video_manifest.json         # combined, grouped by deck, used by the app
  transcripts/
    <slug>.de.vtt             # German WebVTT
    <slug>.de.json            # German segment-level metadata
    <slug>.en.vtt             # English WebVTT (timestamps copied from .de)
    <slug>.en.json            # English segment-level metadata
```

Slugs follow `<heading>` slugified with `_`. Air Active slugs are
prefixed with `aa_` to prevent collision with Free Wings slugs.

## Adding a new academy

1. Write a new `scripts/extract_<name>_videos.mjs` modelled on the Air
   Active extractor (it handles login + Wix pro-galleries).
2. Add `<name>_SRC` and a `build_<name>()` function in
   `scripts/build_video_manifest.py`, with a heading-to-deck mapping in
   the same style as `AA_HEADING_DECK`.
3. Add a provider colour to `app.css` (`chip-<name>`) and a label
   mapping in the manifest entries.

## Known limitations

- Wix video CDN sometimes serves only 720p for Air Active vs. 1080p for
  Free Wings — that's a source-side choice, not a pipeline issue.
- `faster-whisper`'s VAD filter sometimes drops short interjections
  (single "Ja", "Nein") between sentences. Acceptable for study material.
- Translations are batch-LLM output, not human-reviewed. Worth a final
  proofread on any deck you plan to ship to learners.
