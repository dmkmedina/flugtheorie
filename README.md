# Flugtheorie

Swiss paragliding theory (SHV/FSVL) exam study trainer.

- `index.html` — the full bilingual (DE/EN) trainer, built by `build.py`.
- `study-english.html` — **Cloudbase**, a standalone English-only interactive study experience
  (smart practice rounds, real-format mock exam, review queue, flashcards).
  Rebuild with `python3 scripts/build_study_en.py` after data changes.
- `flight-lab.html` — **Flight Lab**, an interactive 3D concept explorer (English): forces,
  angle of attack & the polar, wind & speed-to-fly, thermalling, Swiss airspace, wing anatomy.
  Static file; uses `assets/vendor/three.min.js`.

## Podcast episodes

A two-host audio companion per study-guide topic (📐 Aerodynamics · 🌦️ Meteorology ·
⚖️ Law · 🎒 Equipment · 🛬 Flying Skills), surfaced in the **Podcast** section of the app.
Scripts are audio-first — every diagram is described out loud.

- `data/podcast_scripts/<id>.txt` — each episode's two-host script (one `Maya:`/`Theo:`
  turn per line), written audio-first from the topic's study-guide part, workbook book,
  and instructor video transcripts. `scripts/dump_topic_sources.py <id>` bundles those
  three sources into one file for authoring.
- `scripts/author_podcasts.py` — assembles the scripts into `data/podcasts.json`
  (transcript + metadata).
- `scripts/build_podcasts.py` — renders audio with a **cloud TTS** provider into
  `assets/podcast/<id>.m4a` and writes per-segment timings to `data/podcast_timing.json`
  (used for the read-along transcript). No ffmpeg needed (WAV stitch + `afconvert`).

Rendering needs an API key. Put it in a gitignored `.env.local`:

```
PODCAST_TTS_PROVIDER=openai     # or: elevenlabs
OPENAI_API_KEY=sk-...
```

Then:

```
python3 scripts/build_podcasts.py --dry-run     # preview cost, no API calls
python3 scripts/build_podcasts.py               # render scripted episodes (cached per segment)
python3 build.py                                 # fold audio + timings into index.html
```

The app works without audio — it shows the full transcript and a "not rendered yet" note.
Audio files in `assets/podcast/` are committed so Vercel serves them statically.
