#!/usr/bin/env python3
"""Attach the scraped SHV question images to the question pools.

The SHV elearning tool serves the *same* diagram for a question in every
language — the figures are language-neutral (or already carry DE/FR/IT
labels baked in), and the question number ("Question no. N") is stable
across the EN and DE runs of the pool. `scripts/shv_scrape_images.mjs`
only walks the English session, so it writes image refs into
`data/shv_questions.json` and leaves `data/shv_questions.de.json`
without any, which is why the German app showed image questions with no
figure.

This pass derives the image refs for *both* pools straight from what is
on disk in `assets/shv_images/`, keyed by the English topic slug + qid,
so DE and EN questions with the same qid share one file. Idempotent —
re-run it after every image scrape.

Usage:  python3 scripts/attach_question_images.py [--check]
"""
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
IMAGES_DIR = os.path.join(ROOT, 'assets', 'shv_images')

# Image filenames were written from the English subject labels; the German
# pool uses the German ones for the same five subjects.
TOPIC_TO_EN = {
    'Aerodynamics': 'Aerodynamics',
    'Weather': 'Weather',
    'Legislation': 'Legislation',
    'Materials': 'Materials',
    'Practical Flying': 'Practical Flying',
    'Fluglehre': 'Aerodynamics',
    'Wetterkunde': 'Weather',
    'Gesetzgebung': 'Legislation',
    'Materialkunde': 'Materials',
    'Flugpraxis': 'Practical Flying',
}

POOLS = ['data/shv_questions.json', 'data/shv_questions.de.json']


def slug(s):
    return re.sub(r'[^a-z0-9]+', '_', s.lower()).strip('_')


def image_for(topic, qid):
    """Relative path of the image for this question, or None."""
    en_topic = TOPIC_TO_EN.get(topic)
    if not en_topic:
        return None
    for ext in ('jpg', 'jpeg', 'png'):
        rel = f'assets/shv_images/{slug(en_topic)}_{qid}.{ext}'
        if os.path.exists(os.path.join(ROOT, rel)):
            return rel
    return None


def sync(pool_path, check=False):
    abs_path = os.path.join(ROOT, pool_path)
    if not os.path.exists(abs_path):
        print(f'  {pool_path}: missing, skipped')
        return 0
    with open(abs_path, 'r', encoding='utf-8') as f:
        dataset = json.load(f)

    unknown_topics = set()
    attached = changed = 0
    for q in dataset.get('questions', {}).values():
        if q['topic'] not in TOPIC_TO_EN:
            unknown_topics.add(q['topic'])
        rel = image_for(q['topic'], q['qid'])
        before = (q.get('has_image'), q.get('image_path'))
        if rel:
            q['has_image'] = True
            q['image_path'] = rel
            attached += 1
        else:
            q.pop('has_image', None)
            q.pop('image_path', None)
        if before != (q.get('has_image'), q.get('image_path')):
            changed += 1

    for t in sorted(unknown_topics):
        print(f'  !! unknown topic {t!r} — no image mapping', file=sys.stderr)

    total = len(dataset.get('questions', {}))
    if changed and not check:
        with open(abs_path, 'w', encoding='utf-8') as f:
            json.dump(dataset, f, ensure_ascii=False, indent=2)
    verb = 'would change' if check else 'changed'
    print(f'  {pool_path}: {attached}/{total} questions with images ({verb} {changed})')
    return changed


def main():
    check = '--check' in sys.argv[1:]
    files = [f for f in os.listdir(IMAGES_DIR) if not f.startswith('.')]
    print(f'{len(files)} image files in assets/shv_images/')
    changed = sum(sync(p, check) for p in POOLS)
    if check and changed:
        print('out of date — run without --check, then rebuild (python3 build.py)')
        return 1
    if changed:
        print('done — rebuild with: python3 build.py')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
