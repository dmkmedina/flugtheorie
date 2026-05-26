#!/usr/bin/env python3
"""Rasterize PDF pages to JPEG at a target DPI.

Usage:
    python scripts/pdf_to_images.py <input_dir> <output_dir> [--dpi 100] [--quality 75] [--dedupe]
"""

import argparse
import hashlib
import sys
from pathlib import Path

import fitz  # PyMuPDF


def sha256_file(path: Path, chunk: int = 1 << 20) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for block in iter(lambda: f.read(chunk), b""):
            h.update(block)
    return h.hexdigest()


def human(n: float) -> str:
    for unit in ("B", "KB", "MB", "GB"):
        if n < 1024:
            return f"{n:.1f} {unit}"
        n /= 1024
    return f"{n:.1f} TB"


def render_pdf(pdf: Path, out_dir: Path, dpi: int, quality: int) -> tuple[int, int]:
    out_dir.mkdir(parents=True, exist_ok=True)
    doc = fitz.open(pdf)
    scale = dpi / 72  # PDF user-space is 72 DPI
    mat = fitz.Matrix(scale, scale)
    total = 0
    pages = doc.page_count
    for i in range(pages):
        page = doc.load_page(i)
        pix = page.get_pixmap(matrix=mat, alpha=False)
        out = out_dir / f"page-{i + 1:03d}.jpg"
        pix.save(str(out), output="jpeg", jpg_quality=quality)
        total += out.stat().st_size
    doc.close()
    return pages, total


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("input_dir", type=Path)
    ap.add_argument("output_dir", type=Path)
    ap.add_argument("--dpi", type=int, default=100)
    ap.add_argument("--quality", type=int, default=75)
    ap.add_argument("--dedupe", action="store_true", help="Skip PDFs whose content hash matches a previously processed file")
    args = ap.parse_args()

    pdfs = sorted(args.input_dir.glob("*.pdf"))
    if not pdfs:
        print(f"No PDFs found in {args.input_dir}", file=sys.stderr)
        return 1

    seen: dict[str, Path] = {}
    grand_in = 0
    grand_out = 0

    for pdf in pdfs:
        in_size = pdf.stat().st_size
        grand_in += in_size
        if args.dedupe:
            digest = sha256_file(pdf)
            if digest in seen:
                print(f"[skip dup] {pdf.name} == {seen[digest].name}")
                continue
            seen[digest] = pdf
        out_sub = args.output_dir / pdf.stem
        print(f"[render]   {pdf.name} ({human(in_size)}) -> {out_sub}/")
        pages, out_total = render_pdf(pdf, out_sub, args.dpi, args.quality)
        grand_out += out_total
        ratio = out_total / in_size * 100 if in_size else 0
        print(f"           {pages} pages, {human(out_total)} total ({ratio:.1f}% of source)")

    print()
    print(f"Total input:  {human(grand_in)}")
    print(f"Total output: {human(grand_out)}")
    if grand_in:
        print(f"Compression:  {grand_out / grand_in * 100:.1f}% of source")
    return 0


if __name__ == "__main__":
    sys.exit(main())
