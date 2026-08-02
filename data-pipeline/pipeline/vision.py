"""Fast draft OCR with Apple's Vision framework, for the /ocr editor view.

This is the cheap pass: it produces the line-by-line text the volunteer editor
at fletoret.com/ocr sees next to each scan. It is *not* the transcription we
publish — that is `transcribe.py`, which reads the same images with Claude.
Both exist because they answer different questions: this one is free and
instant, the other one is accurate.
"""

from __future__ import annotations

import json
import re
from pathlib import Path

from . import iiif
from .config import Book


def _identifier(url: str) -> str:
    """The IIIF page identifier inside an image url, extension normalised away."""
    match = re.search(r"/IIIF/(.+?)/(?:full|square|pct:|\d)", url)
    return re.sub(r"\.(png|jpe?g)$", "", match.group(1) if match else url)


def annotate(
    book: Book,
    pages: list[iiif.Page],
    all_pages: list[iiif.Page] | None = None,
    on_page=None,
) -> Path:
    """Write `ocr/<slug>.json`: one entry per page, image url + OCR'd lines.

    `pages` is what to (re-)read; `all_pages` is the whole book. Results merge
    into whatever is already on disk, so running a few pages doesn't throw away
    the rest of the book.
    """
    try:
        from ocrmac import ocrmac
    except ImportError as err:  # pragma: no cover - platform guard
        raise RuntimeError(
            "the draft OCR pass needs `ocrmac`, which is macOS-only "
            "(pip install ocrmac). Use --skip-ocr elsewhere."
        ) from err

    # Keyed on the page identifier rather than the url: files written before
    # this pipeline carry a spurious `.png` in the identifier, and keying on the
    # url would treat those as different pages and duplicate the whole book.
    existing: dict[str, list] = {}
    if book.ocr_json.exists():
        for url, lines in json.loads(book.ocr_json.read_text(encoding="utf-8")):
            existing[_identifier(url)] = lines

    for page in pages:
        image = book.images_dir / page.filename
        if not image.exists():
            raise FileNotFoundError(f"missing scan for page {page.number}: {image}")

        annotations = ocrmac.OCR(str(image)).recognize()
        lines = [[text, confidence] for text, confidence, *_ in annotations]
        existing[page.identifier] = lines
        if on_page:
            on_page(page, lines)

    output = [
        [p.url(iiif.DISPLAY_SIZE), existing.pop(p.identifier)]
        for p in (all_pages or pages)
        if p.identifier in existing
    ]
    if existing:
        raise ValueError(
            f"{len(existing)} entrie(s) in {book.ocr_json.name} match no page in the "
            "manifest — is books.json pointing at the right book?"
        )

    book.ocr_json.parent.mkdir(parents=True, exist_ok=True)
    book.ocr_json.write_text(
        json.dumps(output, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )
    return book.ocr_json
