"""Turn per-page transcripts into the markdown files the site reads.

Pages are grouped into pieces (poems, stories, chapters) on the `starts_piece`
flag the transcription pass sets, then written to
`autore/<author>/<book>/<slug>.md` with the frontmatter `$lib/db` expects.

Everything here is deterministic — no model calls. If the chapter boundaries
come out wrong, the fix is a page's transcript json, not this file.
"""

from __future__ import annotations

import json
import re
from dataclasses import dataclass, field
from pathlib import Path

from .config import AUTHORS_INDEX, WORK_DIR, Book, slugify

# Pages we never publish: the scan of the flyleaf, the library's stamp page,
# the plate with no text on it.
SKIP_KINDS = {"blank", "plate"}
# Published only with --include-front-matter; usually the editor wants to
# handle title pages and tables of contents by hand.
ASIDE_KINDS = {"front-matter", "back-matter", "toc"}

SENTENCE_END = tuple(".!?:»\"'…")


@dataclass
class Chapter:
    title: str
    pages: list[dict] = field(default_factory=list)
    kind: str = "body"

    @property
    def form(self) -> str:
        forms = [p.get("form") for p in self.pages if p.get("form") in ("verse", "prose")]
        if not forms:
            return "prose"
        return max(set(forms), key=forms.count)

    @property
    def uncertain(self) -> list[str]:
        notes = []
        for page in self.pages:
            for note in page.get("uncertain") or []:
                notes.append(f"faqe {page.get('page')}: {note}")
        return notes

    @property
    def body(self) -> str:
        text = ""
        for page in self.pages:
            text = _join(text, (page.get("text") or "").strip(), self.form)
        return text.strip()


def _join(previous: str, nxt: str, form: str) -> str:
    """Stitch two pages together without inventing or losing a break."""
    if not previous:
        return nxt
    if not nxt:
        return previous

    if previous.endswith("-"):
        # A word the typesetter split across the page break.
        return previous[:-1] + nxt.lstrip()

    tail = previous.rstrip()[-1:]
    head = nxt.lstrip()[:1]
    mid_sentence = tail not in SENTENCE_END and head.islower()

    if not mid_sentence:
        return previous + "\n\n" + nxt
    return previous + ("\n" if form == "verse" else " ") + nxt


def group(pages: list[dict], book: Book) -> list[Chapter]:
    chapters: list[Chapter] = []
    current: Chapter | None = None

    for page in pages:
        kind = page.get("kind", "body")
        has_text = bool((page.get("text") or "").strip())
        # A page carrying only a title — a section half-title, say — has no text
        # but still opens a chapter, so it can't be skipped as empty.
        if kind in SKIP_KINDS or not (has_text or page.get("starts_piece")):
            continue

        if kind in ASIDE_KINDS:
            title = page.get("piece_title") or _aside_title(kind)
            if not (current and current.kind == kind and current.title == title):
                current = Chapter(title=title, kind=kind)
                chapters.append(current)
            current.pages.append(page)
            continue

        starts = page.get("starts_piece") and (page.get("piece_title") or "").strip()
        if starts or current is None or current.kind != "body":
            title = (page.get("piece_title") or "").strip() or book.title
            current = Chapter(title=title, kind="body")
            chapters.append(current)
        current.pages.append(page)

    return chapters


def _aside_title(kind: str) -> str:
    return {
        "front-matter": "Hyrje",
        "back-matter": "Shënime",
        "toc": "Përmbajtja",
    }[kind]


def _yaml(value: str) -> str:
    """Quote a frontmatter scalar only when it would otherwise misparse."""
    if value == "":
        return ""
    if re.search(r"^[\s>|@`%&*!#{}\[\],]|: |:$|^-\s|\"|'", value):
        return "'" + value.replace("'", "''") + "'"
    return value


def render(chapter: Chapter, book: Book, order: int) -> str:
    front = [
        "---",
        f"title: {_yaml(chapter.title)}",
        f"author: {_yaml(book.author_name or book.author)}",
        f"respectLineBreaks: {'true' if chapter.form == 'verse' else 'false'}",
        f"parent: {_yaml(book.title)}",
        "grandparent: null",
        f"order: {order}",
        "---",
        "",
    ]
    return "\n".join(front) + chapter.body + "\n"


def write(
    book: Book,
    pages: list[dict],
    include_asides: bool = False,
    force: bool = False,
    dry_run: bool = False,
) -> tuple[list[Path], list[Path], list[str]]:
    """Write one markdown file per chapter.

    Returns (written, skipped_because_they_exist, uncertainty notes).
    """
    target = book.publish_dir
    if target is None:
        raise ValueError(
            f"{book.slug} has no publication target — set `author_folder` and "
            "`book_folder` in books.json (or pass --author/--book) first"
        )

    chapters = [c for c in group(pages, book) if include_asides or c.kind == "body"]
    if not chapters:
        raise ValueError(f"{book.slug} has no transcribed pages to publish")

    written: list[Path] = []
    skipped: list[Path] = []
    notes: list[str] = []
    used: set[str] = set()
    audit = []

    if not dry_run:
        target.mkdir(parents=True, exist_ok=True)

    for order, chapter in enumerate(chapters, start=1):
        stem = slugify(chapter.title) or f"pjesa-{order}"
        candidate, n = stem, 1
        while candidate in used:
            n += 1
            candidate = f"{stem}-{n}"
        used.add(candidate)

        path = target / f"{candidate}.md"
        audit.append(
            {
                "file": str(path.relative_to(target.parents[2])),
                "title": chapter.title,
                "kind": chapter.kind,
                "form": chapter.form,
                "order": order,
                "pages": [p.get("page") for p in chapter.pages],
                "uncertain": chapter.uncertain,
            }
        )
        notes.extend(chapter.uncertain)

        if path.exists() and not force:
            skipped.append(path)
            continue
        if not dry_run:
            path.write_text(render(chapter, book, order), encoding="utf-8")
        written.append(path)

    if not dry_run:
        audit_path = WORK_DIR / book.slug / "chapters.json"
        audit_path.parent.mkdir(parents=True, exist_ok=True)
        audit_path.write_text(
            json.dumps(audit, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
        )

    return written, skipped, notes


def register(book: Book, dry_run: bool = False) -> str:
    """Add the book to `autore/index.json` so the site lists it.

    Refuses to invent an author entry: those carry a biography, a portrait and
    schema.org dates that nobody should be guessing.
    """
    index = json.loads(AUTHORS_INDEX.read_text(encoding="utf-8"))
    author = index.get(book.author_folder)
    if author is None:
        raise ValueError(
            f"no `{book.author_folder}` in autore/index.json — add the author "
            "entry (name, description, thumbnail, dates) by hand first"
        )

    folder = f"{book.author_folder}/{book.book_folder}"
    for existing in author.get("books", []):
        if existing.get("folder") == folder:
            return f"already listed under {book.author_folder}"

    author.setdefault("books", []).append(
        {
            "@context": "https://schema.org",
            "@type": "Book",
            "name": book.title,
            "folder": folder,
            "genre": "",
            "datePublished": book.year,
            "thumbnail": "",
            "abstract": "",
            "publishedFletoret": False,
        }
    )

    if not dry_run:
        AUTHORS_INDEX.write_text(
            json.dumps(index, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
        )
    return (
        f"added to autore/index.json under {book.author_folder} — fill in genre, "
        "thumbnail and abstract, then set publishedFletoret: true"
    )
