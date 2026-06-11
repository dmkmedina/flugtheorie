#!/usr/bin/env python3
"""Build study-english.html — the standalone English study experience ("Cloudbase").

Merges the official SHV question pool with English explanations and the EN
flashcards, then injects both into the template as compact JSON.
"""
import json
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def jload(path):
    with open(os.path.join(ROOT, path), encoding='utf-8') as f:
        return json.load(f)


def main():
    src = jload('data/shv_questions.json')
    enr = jload('data/shv_enrichments.json')
    cards_src = jload('data/all_cards.json')

    # subcategory id -> human title, per topic
    subname = {}
    for topic, lst in (enr.get('subcategories') or {}).items():
        for s in lst:
            subname[(topic, s['id'])] = s['title']

    questions = []
    skipped = 0
    for q in sorted(src['questions'].values(), key=lambda q: (q['topic'], q['qid'])):
        # 43 source questions (all Weather) carry correct=None — unanswerable
        # as multiple choice, so they are excluded from the trainer.
        if not isinstance(q.get('correct'), int) or not (0 <= q['correct'] < len(q['options'])):
            skipped += 1
            continue
        key = f"{q['topic']}_{q['qid']}"
        e = (enr.get('enrichments') or {}).get(key, {})
        item = {
            'id': key,
            'topic': q['topic'],
            'text': q['text'],
            'options': q['options'],
            'correct': q['correct'],
        }
        if q.get('has_image') and q.get('image_path'):
            item['img'] = q['image_path']
        if e.get('explanation'):
            item['exp'] = e['explanation']
        sub = e.get('subcategory')
        if sub and (q['topic'], sub) in subname:
            item['sub'] = subname[(q['topic'], sub)]
        questions.append(item)

    cards = [
        {'id': c['id'], 'cat': c['category'], 'q': c['q_en'], 'a': c['a_en']}
        for c in cards_src
    ]

    with open(os.path.join(ROOT, 'scripts/study_en_template.html'), encoding='utf-8') as f:
        tpl = f.read()

    def embed(obj):
        # `</` would terminate the surrounding <script>; `<\/` is the same
        # string in JS and still valid JSON.
        return json.dumps(obj, ensure_ascii=False, separators=(',', ':')).replace('</', '<\\/')

    out = tpl.replace('__QUESTIONS__', embed(questions)).replace('__CARDS__', embed(cards))
    out_path = os.path.join(ROOT, 'study-english.html')
    with open(out_path, 'w', encoding='utf-8') as f:
        f.write(out)
    print(f"study-english.html · {len(questions)} questions ({skipped} skipped: no answer key) · {len(cards)} cards · {len(out) // 1024} KB")


if __name__ == '__main__':
    main()
