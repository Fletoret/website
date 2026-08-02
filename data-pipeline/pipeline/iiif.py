"""A small IIIF Presentation v2 client for bibliotekadigjitale.bksh.al.

Replaces the vendored copy of yaledhlab/iiif-downloader. We need three things
that library didn't give us: the page order and book metadata that live in the
manifest, resumable downloads, and a way to get from a url pasted out of the
BKD viewer's address bar to the manifest it is showing.
"""

from __future__ import annotations

import re
import time
from dataclasses import dataclass
from html import unescape
from pathlib import Path
from urllib.parse import parse_qs, urlparse

import requests

HOST = "https://bibliotekadigjitale.bksh.al"
MANIFEST_BASE = f"{HOST}/iiif/Manifester/IIIF"
IMAGE_BASE = f"{HOST}/iiif/Scaler/IIIF"

# IIIF size parameter for the copies we download and read. `full` is the native
# scan resolution (~1500px wide); anything smaller costs transcription accuracy.
OCR_SIZE = "full"
# ...and the one baked into the urls the site serves, where the scan sits in a
# 600px column next to the text.
DISPLAY_SIZE = ",1500"

TIMEOUT = 60
RETRIES = 3


class ManifestError(RuntimeError):
    pass


def manifest_url(text: str) -> str:
    """Return the manifest url for `text`.

    Accepts a url copied from the BKD viewer's address bar, a bare manifest
    url, or just the identifier (`libra1!HASH8b45!94a869fc.dir`).
    """
    text = text.strip().strip("\"'")
    if not text:
        raise ManifestError("empty url")

    if "://" in text:
        parsed = urlparse(text)
        # The viewer keeps the manifest in a (percent-encoded) query parameter;
        # parse_qs decodes it for us.
        embedded = parse_qs(parsed.query).get("manifest", [None])[0]
        if embedded:
            return _strip_canvas(embedded)
        if "/iiif/Manifester/" in parsed.path:
            return _strip_canvas(text)
        raise ManifestError(
            f"no IIIF manifest in {text!r} — paste the url from the BKD viewer's "
            "address bar, or the manifest identifier itself"
        )

    return f"{MANIFEST_BASE}/{_strip_canvas(text)}"


def _strip_canvas(url: str) -> str:
    """Drop a trailing `/canvas/p12`, which points at one page, not the book."""
    return re.sub(r"/canvas/p?\d+/?$", "", url.rstrip("/"))


def _plain_text(value: str) -> str:
    """BKD wraps metadata values in anchor tags; we want the label."""
    return unescape(re.sub(r"<[^>]+>", "", value or "")).strip()


@dataclass(frozen=True)
class Page:
    number: int  # 1-based position in the manifest, not the printed page number
    label: str  # the manifest's own label, e.g. "Faqe 7"
    identifier: str  # e.g. libra1!HASH8b45!94a869fc.dir!page7

    def url(self, size: str = DISPLAY_SIZE) -> str:
        # {prefix}/{identifier}/{region}/{size}/{rotation}/{quality}
        return f"{IMAGE_BASE}/{self.identifier}/full/{size}/0/default"

    @property
    def filename(self) -> str:
        return f"{self.identifier}.jpg"


class Manifest:
    def __init__(self, data: dict, url: str):
        self.data = data
        self.url = url
        self.pages = self._read_pages()

    @classmethod
    def load(cls, url_or_identifier: str, session: requests.Session | None = None) -> "Manifest":
        url = manifest_url(url_or_identifier)
        session = session or requests
        response = session.get(url, timeout=TIMEOUT)
        if response.status_code == 404:
            raise ManifestError(
                f"no manifest at {url} — check the identifier (BKD uses `libra1!...`, "
                "and an old `libra!...` id will 404)"
            )
        response.raise_for_status()
        return cls(response.json(), url)

    def _read_pages(self) -> list[Page]:
        pages: list[Page] = []
        for sequence in self.data.get("sequences", []):
            for canvas in sequence.get("canvases", []):
                for image in canvas.get("images", []):
                    resource_id = image.get("resource", {}).get("@id", "")
                    # .../IIIF/<identifier>/<region>/<size>/<rotation>/<quality>
                    identifier = resource_id.split("/")[-5] if resource_id else ""
                    if not identifier:
                        continue
                    pages.append(
                        Page(
                            number=len(pages) + 1,
                            label=canvas.get("label", ""),
                            identifier=identifier,
                        )
                    )
        if not pages:
            raise ManifestError(f"manifest at {self.url} lists no images")
        return pages

    @property
    def identifier(self) -> str:
        return self.data.get("@id", self.url).rstrip("/").split("/")[-1]

    @property
    def label(self) -> str:
        return _plain_text(self.data.get("label", "")) or self.identifier

    @property
    def metadata(self) -> dict[str, str]:
        out: dict[str, str] = {}
        for entry in self.data.get("metadata", []) or []:
            label = _plain_text(entry.get("label", ""))
            if label:
                out[label] = _plain_text(entry.get("value", ""))
        return out

    @property
    def author(self) -> str:
        return self.metadata.get("Autorët", "")

    @property
    def year(self) -> str:
        return self.metadata.get("Viti i botimit", "")

    def download(
        self,
        dest: Path,
        pages: list[Page] | None = None,
        force: bool = False,
        on_page=None,
    ) -> list[Path]:
        """Fetch page images into `dest`, skipping ones already on disk."""
        dest.mkdir(parents=True, exist_ok=True)
        session = requests.Session()
        paths = []

        for page in pages if pages is not None else self.pages:
            path = dest / page.filename
            if force or not (path.exists() and path.stat().st_size > 0):
                _download(session, page.url(OCR_SIZE), path)
            paths.append(path)
            if on_page:
                on_page(page, path)

        return paths


def _download(session: requests.Session, url: str, path: Path) -> None:
    last: Exception | None = None
    for attempt in range(RETRIES):
        try:
            response = session.get(url, timeout=TIMEOUT)
            response.raise_for_status()
            if not response.content:
                raise ManifestError(f"empty response for {url}")
            # Write via a temp name so an interrupted run doesn't leave a
            # truncated file that the resume check would happily skip.
            tmp = path.with_suffix(path.suffix + ".part")
            tmp.write_bytes(response.content)
            tmp.replace(path)
            return
        except Exception as err:  # noqa: BLE001 - retried below, re-raised at the end
            last = err
            time.sleep(2**attempt)
    raise ManifestError(f"could not download {url}: {last}")
