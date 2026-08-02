"""High-fidelity transcription of page scans with Claude.

One request per page. The page image goes in, a structured transcription comes
back, and it is written to `work/<slug>/pages/page-NNNN.json` — so a run that
dies halfway resumes for free, and a page an editor is unhappy with can be
re-done on its own.

The system prompt (`prompts/transcribe.md`) carries the Gheg orthography rules
and is marked for prompt caching, so the per-page cost is essentially the image
plus the transcription.
"""

from __future__ import annotations

import base64
import json
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

from . import iiif
from .config import PROMPTS_DIR, Book

MODEL = "claude-opus-5"
MAX_TOKENS = 16000

# Opt into server-side refusal fallbacks: if a safety classifier declines a
# page, the API re-runs it on the recommended fallback model in the same call
# instead of handing us an empty response.
FALLBACK_BETA = "server-side-fallback-2026-07-01"

PAGE_SCHEMA = {
    "type": "object",
    "properties": {
        "printed_page": {
            "type": "string",
            "description": "The page number printed on the page, as printed. Empty if there is none.",
        },
        "kind": {
            "type": "string",
            "enum": ["body", "front-matter", "back-matter", "toc", "plate", "blank"],
        },
        "starts_piece": {
            "type": "boolean",
            "description": "True if this page begins a new titled piece.",
        },
        "piece_title": {
            "type": "string",
            "description": "Title of the piece begun on this page; empty otherwise.",
        },
        "form": {"type": "string", "enum": ["verse", "prose", "mixed", "none"]},
        "text": {"type": "string", "description": "The transcription, as markdown."},
        "uncertain": {
            "type": "array",
            "items": {"type": "string"},
            "description": "Short notes on anything you could not read with confidence.",
        },
    },
    "required": [
        "printed_page",
        "kind",
        "starts_piece",
        "piece_title",
        "form",
        "text",
        "uncertain",
    ],
    "additionalProperties": False,
}


class TranscriptionError(RuntimeError):
    pass


def system_prompt() -> str:
    return (PROMPTS_DIR / "transcribe.md").read_text(encoding="utf-8")


def _media_type(data: bytes) -> str:
    if data.startswith(b"\x89PNG"):
        return "image/png"
    return "image/jpeg"


def _text_block(response) -> str:
    for block in response.content:
        if block.type == "text":
            return block.text
    raise TranscriptionError("response carried no text block")


class Transcriber:
    def __init__(self, effort: str | None = None):
        try:
            import anthropic
        except ImportError as err:
            raise TranscriptionError(
                "transcription needs the Anthropic SDK (pip install anthropic)"
            ) from err

        self._anthropic = anthropic
        self.client = anthropic.Anthropic()
        self.effort = effort
        self.system = system_prompt()
        # Flipped off the first time the API rejects the fallback beta, so an
        # older SDK or an account without the beta degrades once instead of
        # failing every page.
        self._fallbacks = True

    def _request(self, image: bytes, page: iiif.Page) -> dict:
        output_config: dict = {"format": {"type": "json_schema", "schema": PAGE_SCHEMA}}
        if self.effort:
            output_config["effort"] = self.effort

        kwargs = dict(
            model=MODEL,
            max_tokens=MAX_TOKENS,
            system=[
                {
                    "type": "text",
                    "text": self.system,
                    "cache_control": {"type": "ephemeral"},
                }
            ],
            output_config=output_config,
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "image",
                            "source": {
                                "type": "base64",
                                "media_type": _media_type(image),
                                "data": base64.standard_b64encode(image).decode(),
                            },
                        },
                        {
                            "type": "text",
                            "text": (
                                f"Scan {page.number} of this book "
                                f"(the library labels it “{page.label}”). "
                                "Transcribe it."
                            ),
                        },
                    ],
                }
            ],
        )

        try:
            if self._fallbacks:
                try:
                    response = self.client.beta.messages.create(
                        betas=[FALLBACK_BETA], fallbacks="default", **kwargs
                    )
                except self._anthropic.BadRequestError as err:
                    if "fallback" not in str(err).lower():
                        raise
                    self._fallbacks = False
                    response = self.client.messages.create(**kwargs)
            else:
                response = self.client.messages.create(**kwargs)
        except TypeError as err:
            if "authentication" not in str(err).lower():
                raise
            raise TranscriptionError(
                "no Anthropic credentials — set ANTHROPIC_API_KEY, or run `ant auth login`"
            ) from err

        if response.stop_reason == "refusal":
            raise TranscriptionError(
                f"page {page.number} was declined by the safety classifiers "
                f"({getattr(response.stop_details, 'category', 'unknown')})"
            )

        return json.loads(_text_block(response))

    def page(self, book: Book, page: iiif.Page) -> dict:
        image_path = book.images_dir / page.filename
        if not image_path.exists():
            raise FileNotFoundError(f"missing scan for page {page.number}: {image_path}")

        result = self._request(image_path.read_bytes(), page)
        result["page"] = page.number
        result["image"] = page.url(iiif.DISPLAY_SIZE)
        return result


def transcript_path(book: Book, page: iiif.Page) -> Path:
    return book.transcript_dir / f"page-{page.number:04d}.json"


def run(
    book: Book,
    pages: list[iiif.Page],
    concurrency: int = 4,
    force: bool = False,
    effort: str | None = None,
    on_page=None,
    on_error=None,
) -> list[Path]:
    """Transcribe `pages`, skipping any already on disk. Returns written paths."""
    book.transcript_dir.mkdir(parents=True, exist_ok=True)

    todo = [p for p in pages if force or not transcript_path(book, p).exists()]
    written = []
    for page in pages:
        path = transcript_path(book, page)
        if path.exists():
            written.append(path)
            if page not in todo and on_page:
                on_page(page, None)  # already done; keep the caller's count honest
    if not todo:
        return written

    transcriber = Transcriber(effort=effort)

    def do(page: iiif.Page) -> Path:
        result = transcriber.page(book, page)
        path = transcript_path(book, page)
        path.write_text(json.dumps(result, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
        if on_page:
            on_page(page, result)
        return path

    # The first page alone, so it writes the prompt cache. Fanning out
    # immediately would have every request miss a cache the others are still
    # writing, and pay full price for the system prompt N times over.
    first, rest = todo[0], todo[1:]
    written.append(do(first))

    failures: list[tuple[iiif.Page, Exception]] = []
    if rest:
        with ThreadPoolExecutor(max_workers=max(1, concurrency)) as pool:
            futures = {pool.submit(do, page): page for page in rest}
            for future in as_completed(futures):
                page = futures[future]
                try:
                    written.append(future.result())
                except Exception as err:  # noqa: BLE001 - reported, not swallowed
                    failures.append((page, err))
                    if on_error:
                        on_error(page, err)

    if failures and not on_error:
        raise TranscriptionError(
            f"{len(failures)} page(s) failed, first: page {failures[0][0].number}: {failures[0][1]}"
        )

    return sorted(set(written))


def load(book: Book) -> list[dict]:
    """Every transcribed page for `book`, in reading order."""
    if not book.transcript_dir.exists():
        return []
    pages = []
    for path in sorted(book.transcript_dir.glob("page-*.json")):
        pages.append(json.loads(path.read_text(encoding="utf-8")))
    return sorted(pages, key=lambda p: p.get("page", 0))
