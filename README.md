# Flugtheorie

Swiss paragliding theory (SHV/FSVL) exam study trainer.

- `index.html` — the full bilingual (DE/EN) trainer, built by `build.py`.
- `study-english.html` — **Cloudbase**, a standalone English-only interactive study experience
  (smart practice rounds, real-format mock exam, review queue, flashcards).
  Rebuild with `python3 scripts/build_study_en.py` after data changes.
- `flight-lab.html` — **Flight Lab**, an interactive 3D concept explorer (English): forces,
  angle of attack & the polar, wind & speed-to-fly, thermalling, Swiss airspace, wing anatomy.
  Static file; uses `assets/vendor/three.min.js`.
