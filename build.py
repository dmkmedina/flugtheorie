#!/usr/bin/env python3
"""Build the single-file standalone HTML app."""
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.abspath(__file__))

def load_file(path):
    with open(os.path.join(ROOT, path), 'r', encoding='utf-8') as f:
        return f.read()

def load_json(path):
    with open(os.path.join(ROOT, path), 'r', encoding='utf-8') as f:
        return json.load(f)

def main():
    cards = load_json('data/all_cards.json')
    guide = load_json('data/guide.json')
    decks = load_json('data/decks.json')
    tips_md = load_file('data/study_tips.md')

    css = load_file('app.css')
    js = load_file('app.js')

    # Compact JSON for embedding
    cards_json = json.dumps(cards, ensure_ascii=False, separators=(',', ':'))
    guide_json = json.dumps(guide, ensure_ascii=False, separators=(',', ':'))
    decks_json = json.dumps(decks, ensure_ascii=False, separators=(',', ':'))

    # Encode tips markdown as a JS string-safe literal
    # Use JSON.parse('...') trick - escape backslashes/quotes/newlines
    tips_js = json.dumps(tips_md, ensure_ascii=False)

    total_slides = sum(len(d.get('slides') or d.get('pages') or []) for d in decks['decks'])

    html = f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover" />
<meta name="description" content="Swiss paragliding theory exam (SHV/FSVL) study trainer — {len(cards)} flashcards, mock exam, study guide, {total_slides} Freewings slide-deck images, and cheat sheet." />
<meta name="theme-color" content="#0284c7" />
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ctext y='84' font-size='90'%3E%E2%9C%88%EF%B8%8F%3C/text%3E%3C/svg%3E" />
<title>Flugtheorie — Swiss Paragliding Theory Trainer</title>
<style>
{css}
</style>
</head>
<body>
<div class="mobile-bar">
  <button class="menu-btn" id="mobile-menu">☰</button>
  <div class="brand">
    <span style="display:inline-block; width:24px; height:24px; background:linear-gradient(135deg,#0ea5e9,#6366f1); border-radius:6px; line-height:24px; text-align:center; font-size:14px;">✈️</span>
    Flugtheorie
  </div>
</div>

<div class="shell">
  <aside class="sidebar" id="sidebar">
    <div class="sidebar-brand">
      <span class="logo">✈️</span>
      <div>
        Flugtheorie
        <span class="sub">SHV/FSVL Trainer</span>
      </div>
    </div>
    <div class="nav-section">Study</div>
    <div id="sidebar-nav"></div>
    <div class="sidebar-footer">
      <button class="theme-toggle" id="theme-toggle">🖥 Auto theme</button>
      <div style="font-size:11px; color:var(--text-dim); padding:8px 10px;">
        {len(cards)} flashcards · {sum(len(p['chapters']) for p in guide['parts'])} chapters · {total_slides} slides · v1.1
      </div>
    </div>
  </aside>
  <div class="sidebar-backdrop" id="sidebar-backdrop"></div>

  <div class="content">
    <main class="content-inner" id="app"></main>
  </div>
</div>

<!-- Lightbox -->
<div class="lightbox" id="lightbox">
  <button class="lightbox-close" id="lb-close">Close ✕</button>
  <button class="lightbox-nav prev" id="lb-prev">‹</button>
  <button class="lightbox-nav next" id="lb-next">›</button>
  <img id="lb-img" alt="Page preview" />
</div>

<!-- Slide Viewer (side-by-side EN/DE) -->
<div class="slide-viewer" id="slide-viewer">
  <div class="slide-viewer-content" id="slide-viewer-content"></div>
</div>

<!-- Inline data -->
<script id="data-cards" type="application/json">{cards_json}</script>
<script id="data-guide" type="application/json">{guide_json}</script>
<script id="data-decks" type="application/json">{decks_json}</script>
<script>
window.CARDS = JSON.parse(document.getElementById('data-cards').textContent);
window.GUIDE = JSON.parse(document.getElementById('data-guide').textContent);
window.DECKS = JSON.parse(document.getElementById('data-decks').textContent);
window.TIPS_MD = {tips_js};
</script>

<script>
{js}
</script>
</body>
</html>
"""

    out = os.path.join(ROOT, 'index.html')
    with open(out, 'w', encoding='utf-8') as f:
        f.write(html)

    size_kb = os.path.getsize(out) / 1024
    print(f"Wrote {out} ({size_kb:.1f} KB)")
    print(f"  Cards: {len(cards)} · Guide chapters: {sum(len(p['chapters']) for p in guide['parts'])} · Slides: {total_slides} across {len(decks['decks'])} decks")

if __name__ == '__main__':
    main()
