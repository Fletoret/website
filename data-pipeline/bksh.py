#!/usr/bin/env python3
"""Pull a book out of the Biblioteka Kombëtare Dixhitale and into Fletoret.

    python bksh.py 'https://bibliotekadigjitale.bksh.al/?view=ThumbnailsView&manifest=...'

That one command registers the book, downloads every page scan, runs both the
draft OCR and the high-fidelity transcription, and — once the book has a
publication target — writes the chapter markdown. Every stage is resumable and
can be run on its own; see `python bksh.py --help`.
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from pipeline import assemble, config, iiif, transcribe, vision  # noqa: E402
from pipeline.config import Book  # noqa: E402


# --------------------------------------------------------------------------- output


def say(message: str) -> None:
    print(message, flush=True)


def fail(message: str) -> None:
    print(f"error: {message}", file=sys.stderr, flush=True)
    raise SystemExit(1)


def progress(description: str, total: int):
    """A rich progress bar when rich is installed, a no-op counter otherwise."""
    try:
        from rich.progress import BarColumn, MofNCompleteColumn, Progress, TextColumn

        bar = Progress(
            TextColumn("[progress.description]{task.description}"),
            BarColumn(),
            MofNCompleteColumn(),
        )
        task = bar.add_task(description, total=total)

        class Rich:
            def __enter__(self):
                bar.start()
                return self

            def __exit__(self, *exc):
                bar.stop()

            def tick(self, _=None):
                bar.advance(task)

        return Rich()
    except ImportError:

        class Plain:
            def __init__(self):
                self.done = 0

            def __enter__(self):
                say(f"{description} (0/{total})")
                return self

            def __exit__(self, *exc):
                pass

            def tick(self, _=None):
                self.done += 1
                if self.done % 10 == 0 or self.done == total:
                    say(f"  {description}: {self.done}/{total}")

        return Plain()


# --------------------------------------------------------------------------- helpers


def parse_pages(spec: str | None, pages: list[iiif.Page]) -> list[iiif.Page]:
    """`--pages 1-20,45` -> those pages, in manifest order."""
    if not spec:
        return pages
    wanted: set[int] = set()
    for part in spec.split(","):
        part = part.strip()
        if not part:
            continue
        if "-" in part:
            start, _, end = part.partition("-")
            wanted.update(range(int(start), int(end) + 1))
        else:
            wanted.add(int(part))
    selected = [p for p in pages if p.number in wanted]
    if not selected:
        fail(f"--pages {spec} selected nothing (the book has {len(pages)} pages)")
    return selected


def resolve(target: str, slug: str | None = None, title: str | None = None) -> tuple[Book, iiif.Manifest]:
    """Take a url or a known slug and return the registry entry + its manifest."""
    known = config.find(target)
    if known:
        manifest = iiif.Manifest.load(known.manifest)
    else:
        manifest = iiif.Manifest.load(target)
        # Re-adding a book by url must find the entry it already has, whatever
        # slug someone gave it.
        known = config.find_by_manifest(manifest.identifier)

    book = Book(
        slug=slug or (known.slug if known else config.slugify(title or manifest.label)),
        title=title or (known.title if known else manifest.label),
        manifest=manifest.identifier,
        author=manifest.author,
        year=manifest.year,
        pages=len(manifest.pages),
        source=target if "://" in target else "",
    )
    return config.upsert(book), manifest


def require(slug: str) -> tuple[Book, iiif.Manifest]:
    book = config.find(slug)
    if not book:
        fail(f"unknown book {slug!r} — run `bksh.py list`, or add it with its BKD url")
    return book, iiif.Manifest.load(book.manifest)  # type: ignore[union-attr]


def describe(book: Book) -> str:
    bits = [book.title]
    if book.author:
        bits.append(book.author)
    if book.year:
        bits.append(book.year)
    return " · ".join(bits)


# --------------------------------------------------------------------------- stages


def stage_fetch(book: Book, manifest: iiif.Manifest, pages: list[iiif.Page], force: bool) -> None:
    with progress("shkarkim", len(pages)) as bar:
        manifest.download(
            book.images_dir, pages=pages, force=force, on_page=lambda *_: bar.tick()
        )
    say(f"  scans in {book.images_dir}")


def stage_vision(book: Book, manifest: iiif.Manifest, pages: list[iiif.Page]) -> None:
    with progress("OCR (Vision)", len(pages)) as bar:
        path = vision.annotate(
            book, pages, all_pages=manifest.pages, on_page=lambda *_: bar.tick()
        )
    say(f"  {path.relative_to(config.REPO_ROOT)} — served at /ocr/{book.slug}")


def stage_transcribe(
    book: Book, pages: list[iiif.Page], concurrency: int, force: bool, effort: str | None
) -> None:
    failures: list[tuple[iiif.Page, Exception]] = []
    with progress("transkriptim (Claude)", len(pages)) as bar:
        transcribe.run(
            book,
            pages,
            concurrency=concurrency,
            force=force,
            effort=effort,
            on_page=lambda *_: bar.tick(),
            on_error=lambda page, err: (failures.append((page, err)), bar.tick()),
        )
    say(f"  transcripts in {book.transcript_dir}")
    for page, err in failures:
        say(f"  ! page {page.number} failed: {err}")
    if failures:
        say(f"  {len(failures)} page(s) left untranscribed — re-run to retry just those")


def stage_publish(book: Book, args) -> None:
    pages = transcribe.load(book)
    if not pages:
        fail(f"no transcripts for {book.slug} — run `bksh.py transcribe {book.slug}` first")

    written, skipped, notes = assemble.write(
        book,
        pages,
        include_asides=args.include_front_matter,
        force=args.force,
        dry_run=args.dry_run,
    )

    prefix = "would write" if args.dry_run else "wrote"
    say(f"  {prefix} {len(written)} chapter file(s) to {book.publish_dir}")
    for path in written:
        say(f"    {path.name}")
    if skipped:
        say(f"  kept {len(skipped)} existing file(s) — pass --force to overwrite")
    if notes:
        say(f"  {len(notes)} spot(s) the transcriber was unsure of; see chapters.json")

    if args.register:
        try:
            say("  " + assemble.register(book, dry_run=args.dry_run))
        except ValueError as err:
            say(f"  ! {err}")


# --------------------------------------------------------------------------- commands


def cmd_add(args) -> None:
    book, manifest = resolve(args.url, slug=args.slug, title=args.title)
    say(f"{book.slug}: {describe(book)} — {len(manifest.pages)} pages")
    if not book.publish_dir:
        say("  no publication target yet; set author_folder/book_folder in books.json")


def cmd_list(args) -> None:
    books = config.load_books()
    if not books:
        say("no books registered yet")
        return
    for book in books.values():
        scans = len(list(book.images_dir.glob("*.jpg"))) if book.images_dir.exists() else 0
        done = len(list(book.transcript_dir.glob("page-*.json"))) if book.transcript_dir.exists() else 0
        say(f"{book.slug:<32} {book.pages:>4}p  scans {scans:>4}  transcribed {done:>4}  {describe(book)}")


def cmd_fetch(args) -> None:
    book, manifest = resolve(args.book)
    stage_fetch(book, manifest, parse_pages(args.pages, manifest.pages), args.force)


def cmd_ocr(args) -> None:
    book, manifest = require(args.book)
    stage_vision(book, manifest, parse_pages(args.pages, manifest.pages))


def cmd_transcribe(args) -> None:
    book, manifest = require(args.book)
    stage_transcribe(
        book, parse_pages(args.pages, manifest.pages), args.concurrency, args.force, args.effort
    )


def apply_target(book: Book, args) -> Book:
    """Let --author/--book-folder/--author-name set (and remember) the target."""
    if args.author:
        book.author_folder = args.author
    if args.book_folder:
        book.book_folder = args.book_folder
    if args.author_name:
        book.author_name = args.author_name
    if book.author_folder and not book.book_folder:
        book.book_folder = book.slug
    books = config.load_books()
    books[book.slug] = book
    config.save_books(books)
    return book


def cmd_publish(args) -> None:
    book, _ = require(args.book)
    stage_publish(apply_target(book, args), args)


def cmd_run(args) -> None:
    book, manifest = resolve(args.book, slug=args.slug, title=args.title)
    book = apply_target(book, args)
    pages = parse_pages(args.pages, manifest.pages)
    say(f"{book.slug}: {describe(book)} — {len(pages)} of {len(manifest.pages)} pages")

    stage_fetch(book, manifest, pages, args.force)
    if not args.skip_ocr:
        stage_vision(book, manifest, pages)
    if not args.skip_transcribe:
        stage_transcribe(book, pages, args.concurrency, args.force, args.effort)

    if book.publish_dir:
        stage_publish(book, args)
    else:
        say(
            f"  not publishing: {book.slug} has no author_folder/book_folder. "
            f"Set them in books.json, or run:\n"
            f"    python bksh.py publish {book.slug} --author <folder> --author-name '<Name>'"
        )


# --------------------------------------------------------------------------- argv


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="bksh.py",
        description=__doc__,
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    sub = parser.add_subparsers(dest="command")

    def with_pages(p):
        p.add_argument("--pages", help="restrict to a range, e.g. 1-20,45")
        return p

    def with_publish_flags(p):
        p.add_argument("--author", help="author folder under autore/, e.g. fishta")
        p.add_argument("--book-folder", help="book folder (defaults to the slug)")
        p.add_argument("--author-name", help="byline for each chapter, e.g. 'Gjergj Fishta'")
        p.add_argument("--include-front-matter", action="store_true")
        p.add_argument("--register", action="store_true", help="also add the book to autore/index.json")
        p.add_argument("--dry-run", action="store_true")
        return p

    run = sub.add_parser("run", help="the whole pipeline for one url or slug")
    run.add_argument("book", help="a BKD url, a manifest identifier, or a known slug")
    run.add_argument("--slug")
    run.add_argument("--title")
    run.add_argument("--concurrency", type=int, default=4)
    run.add_argument("--effort", choices=["low", "medium", "high", "xhigh", "max"])
    run.add_argument("--force", action="store_true", help="re-download and re-transcribe")
    run.add_argument("--skip-ocr", action="store_true", help="skip the Vision draft pass")
    run.add_argument("--skip-transcribe", action="store_true")
    with_publish_flags(with_pages(run))
    run.set_defaults(func=cmd_run)

    add = sub.add_parser("add", help="register a book without downloading anything")
    add.add_argument("url")
    add.add_argument("--slug")
    add.add_argument("--title")
    add.set_defaults(func=cmd_add)

    listing = sub.add_parser("list", help="what is registered, and how far along it is")
    listing.set_defaults(func=cmd_list)

    fetch = sub.add_parser("fetch", help="download page scans")
    fetch.add_argument("book")
    fetch.add_argument("--force", action="store_true")
    with_pages(fetch).set_defaults(func=cmd_fetch)

    ocr = sub.add_parser("ocr", help="draft OCR with Apple Vision -> ocr/<slug>.json")
    ocr.add_argument("book")
    with_pages(ocr).set_defaults(func=cmd_ocr)

    tr = sub.add_parser("transcribe", help="high-fidelity transcription with Claude")
    tr.add_argument("book")
    tr.add_argument("--concurrency", type=int, default=4)
    tr.add_argument("--effort", choices=["low", "medium", "high", "xhigh", "max"])
    tr.add_argument("--force", action="store_true")
    with_pages(tr).set_defaults(func=cmd_transcribe)

    pub = sub.add_parser("publish", help="write chapter markdown into autore/")
    pub.add_argument("book")
    pub.add_argument("--force", action="store_true", help="overwrite existing chapter files")
    with_publish_flags(pub).set_defaults(func=cmd_publish)

    return parser


def main(argv: list[str] | None = None) -> None:
    argv = list(sys.argv[1:] if argv is None else argv)
    parser = build_parser()

    # `bksh.py <url>` is the headline case, so treat a bare first argument that
    # isn't a subcommand as `run <that>`.
    commands = {"run", "add", "list", "fetch", "ocr", "transcribe", "publish"}
    if argv and argv[0] not in commands and not argv[0].startswith("-"):
        argv.insert(0, "run")

    args = parser.parse_args(argv)
    if not getattr(args, "func", None):
        parser.print_help()
        raise SystemExit(2)

    try:
        args.func(args)
    except (iiif.ManifestError, transcribe.TranscriptionError, ValueError, FileNotFoundError) as err:
        fail(str(err))


if __name__ == "__main__":
    main()
