"""Where things live, and the books we know about.

`books.json` is the registry. One entry per book; everything downstream (image
directory, OCR json, transcripts, published markdown) is derived from the slug,
so adding a book means adding one entry — which `bksh.py` writes for you from a
pasted BKD url.
"""

from __future__ import annotations

import json
import re
import unicodedata
from dataclasses import asdict, dataclass, fields
from pathlib import Path

PIPELINE_DIR = Path(__file__).resolve().parent.parent
REPO_ROOT = PIPELINE_DIR.parent

BOOKS_PATH = PIPELINE_DIR / "books.json"
PROMPTS_DIR = PIPELINE_DIR / "prompts"

# Scans and per-page transcripts are bulky and reproducible, so they stay out of
# git (see .gitignore). Only the two published artefacts live in the repo.
WORK_DIR = PIPELINE_DIR / "work"
OCR_DIR = REPO_ROOT / "ocr"
AUTORE_DIR = REPO_ROOT / "autore"
AUTHORS_INDEX = AUTORE_DIR / "index.json"


def slugify(text: str) -> str:
    """`Mrizi i Zânavet` -> `mrizi-i-zanavet`.

    NFKD strips the Albanian diacritics (ë, ç, â, ...) down to their base
    letters, which is what the rest of the site's folder names already do.
    """
    stripped = "".join(
        c
        for c in unicodedata.normalize("NFKD", text)
        if not unicodedata.combining(c)
    )
    return re.sub(r"-{2,}", "-", re.sub(r"[^a-z0-9]+", "-", stripped.lower())).strip("-")


@dataclass
class Book:
    slug: str
    title: str
    # IIIF manifest identifier, e.g. `libra1!HASHae57.dir`. Stored bare rather
    # than as a full url so the host can move without editing every entry.
    manifest: str
    author: str = ""  # as printed in the manifest: "Fishta, Gjergj"
    year: str = ""
    pages: int = 0
    source: str = ""  # the viewer url this was added from, for provenance
    # Publication target. Empty until someone decides where the book belongs;
    # `bksh.py publish` refuses to guess.
    author_folder: str = ""
    book_folder: str = ""
    author_name: str = ""  # byline written into each chapter: "Gjergj Fishta"

    @property
    def images_dir(self) -> Path:
        return WORK_DIR / self.slug / "images"

    @property
    def transcript_dir(self) -> Path:
        return WORK_DIR / self.slug / "pages"

    @property
    def ocr_json(self) -> Path:
        return OCR_DIR / f"{self.slug}.json"

    @property
    def publish_dir(self) -> Path | None:
        if not (self.author_folder and self.book_folder):
            return None
        return AUTORE_DIR / self.author_folder / self.book_folder

    def to_json(self) -> dict:
        return {k: v for k, v in asdict(self).items() if v != "" and v != 0}


def _from_json(raw: dict) -> Book:
    known = {f.name for f in fields(Book)}
    return Book(**{k: v for k, v in raw.items() if k in known})


def load_books() -> dict[str, Book]:
    if not BOOKS_PATH.exists():
        return {}
    raw = json.loads(BOOKS_PATH.read_text(encoding="utf-8"))
    return {b["slug"]: _from_json(b) for b in raw.get("books", [])}


def save_books(books: dict[str, Book]) -> None:
    payload = {
        "$comment": (
            "Registry of books pulled from bibliotekadigjitale.bksh.al. "
            "Managed by data-pipeline/bksh.py; safe to hand-edit."
        ),
        "books": [b.to_json() for b in sorted(books.values(), key=lambda b: b.slug)],
    }
    BOOKS_PATH.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def upsert(book: Book) -> Book:
    """Add `book`, or fill in blanks on the existing entry with the same slug.

    Existing values win: the registry is hand-editable, and a re-run of `add`
    on the same url must not clobber a publication target someone chose.
    """
    books = load_books()
    existing = books.get(book.slug)
    if existing:
        for f in fields(Book):
            current = getattr(existing, f.name)
            if current in ("", 0):
                setattr(existing, f.name, getattr(book, f.name))
        book = existing
    books[book.slug] = book
    save_books(books)
    return book


def find(slug: str) -> Book | None:
    return load_books().get(slug)


def find_by_manifest(identifier: str) -> Book | None:
    """Look a book up by its IIIF identifier.

    The identifier is the stable key — slugs are hand-editable and often differ
    from what the manifest's own label would produce, so matching on the slug
    alone would register the same book twice.
    """
    for book in load_books().values():
        if book.manifest == identifier:
            return book
    return None
