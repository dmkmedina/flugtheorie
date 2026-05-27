#!/usr/bin/env python3
"""Build distractors for paragliding flashcards.

Each card gets exactly 3 plausible-but-wrong English distractors.
Authored card-by-card with reference to source material.
"""
import json
from pathlib import Path

DATA = Path(__file__).resolve().parent.parent / 'data'
OUT = DATA / 'distractors.json'

# Load cards for cross-reference
with open(DATA / 'all_cards.json') as f:
    CARDS = json.load(f)
CARDS_BY_ID = {c['id']: c for c in CARDS}


def save(distractors):
    """Save current state of distractors to disk."""
    with open(OUT, 'w') as f:
        json.dump(distractors, f, indent=2, ensure_ascii=False, sort_keys=True)


def validate(distractors):
    """Check schema rules: every card has 3 distractors, none matches correct answer."""
    errors = []
    for card_id, card in CARDS_BY_ID.items():
        if card_id not in distractors:
            errors.append(f"MISSING: {card_id}")
            continue
        d = distractors[card_id]
        if len(d) != 3:
            errors.append(f"WRONG LENGTH ({len(d)}): {card_id}")
        if len(set(d)) != 3:
            errors.append(f"DUPLICATE WITHIN: {card_id}")
        for item in d:
            if item.strip() == card['a_en'].strip():
                errors.append(f"SAME AS CORRECT: {card_id} - {item[:50]}")
    return errors


if __name__ == "__main__":
    import sys
    sys.path.insert(0, str(Path(__file__).resolve().parent / 'distractors'))
    from distractors_data import DISTRACTORS
    save(DISTRACTORS)
    errs = validate(DISTRACTORS)
    if errs:
        print(f"ERRORS ({len(errs)}):")
        for e in errs[:20]:
            print(f"  {e}")
        print(f"Total cards: {len(DISTRACTORS)}, expected: {len(CARDS)}")
    else:
        print(f"OK: {len(DISTRACTORS)} cards validated.")
