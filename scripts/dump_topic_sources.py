#!/usr/bin/env python3
"""Bundle the three source corpora for one podcast episode into a single text file.

Pulls the study-guide part, the workbook book, and the (English) video
transcripts named in that episode's `sources` mapping in data/podcasts.json, so a
script author has everything for the topic in one place.

Usage:
    python3 scripts/dump_topic_sources.py <episode_id> [out_path]
    # default out_path: /tmp/podcast_src_<episode_id>.txt
"""
import json
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def load(p):
    with open(os.path.join(ROOT, p), encoding="utf-8") as f:
        return json.load(f)


def guide_part(part_id):
    g = load("data/guide.json")
    p = next((x for x in g["parts"] if x["id"] == part_id), None)
    if not p:
        return "(no guide part)"
    out = []
    for c in p["chapters"]:
        out.append("## " + c.get("title", ""))
        out.append((c.get("text") or "").strip())
        kp = c.get("key_points") or []
        if kp:
            out.append("KEY POINTS: " + " | ".join(kp))
    return "\n".join(out)


def workbook_book(book_id):
    w = load("data/workbook.json")
    b = next((x for x in w["books"] if x["id"] == book_id), None)
    if not b:
        return "(no workbook book)"
    out = []
    for c in b["chapters"]:
        title = c.get("title", "")
        if c.get("subtitle"):
            title += " — " + c["subtitle"]
        out.append("## " + title)
        if c.get("intro"):
            out.append(c["intro"].strip())
        for s in c.get("sections", []):
            t = s.get("text", "")
            if not isinstance(t, str):
                t = json.dumps(t, ensure_ascii=False)
            kind = s.get("kind", "")
            prefix = f"[{kind}] " if kind and kind not in ("p", "h2") else ""
            out.append(prefix + t)
    return "\n".join(out)


def videos(ids):
    out = []
    for vid in ids:
        for lang in ("en", "de"):  # prefer English transcript
            f = os.path.join(ROOT, "data", "transcripts", f"{vid}.{lang}.json")
            if os.path.exists(f):
                d = json.load(open(f, encoding="utf-8"))
                txt = " ".join((s.get("text") or "").strip() for s in d.get("segments", []))
                out.append(f"### {vid} ({lang})\n{txt}")
                break
    return "\n\n".join(out) if out else "(no transcripts)"


def main():
    if len(sys.argv) < 2:
        sys.exit("usage: dump_topic_sources.py <episode_id> [out_path]")
    ep_id = sys.argv[1]
    out_path = sys.argv[2] if len(sys.argv) > 2 else f"/tmp/podcast_src_{ep_id}.txt"
    data = load("data/podcasts.json")
    ep = next((e for e in data["episodes"] if e["id"] == ep_id), None)
    if not ep:
        sys.exit(f"unknown episode {ep_id!r}")
    src = ep.get("sources", {})
    blocks = [
        f"# SOURCE MATERIAL FOR EPISODE: {ep['title']} ({ep['topic']})",
        "\n========== STUDY GUIDE ==========\n" + guide_part(src.get("guide", "")),
        "\n========== WORKBOOK ==========\n" + workbook_book(src.get("workbook", "")),
        "\n========== INSTRUCTOR VIDEO TRANSCRIPTS ==========\n" + videos(src.get("videos", [])),
    ]
    with open(out_path, "w", encoding="utf-8") as f:
        f.write("\n".join(blocks))
    print(f"wrote {out_path} ({os.path.getsize(out_path)} chars)")


if __name__ == "__main__":
    main()
