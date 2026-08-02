# data-pipeline

From a url pasted out of the [Biblioteka Kombëtare Dixhitale][bkd] to markdown
in `autore/`.

```sh
python bksh.py 'https://bibliotekadigjitale.bksh.al/?view=ThumbnailsView&manifest=https%3A%2F%2Fbibliotekadigjitale.bksh.al%2Fiiif%2FManifester%2FIIIF%2Flibra1%21HASH8b45%2194a869fc.dir&canvas=...'
```

That registers the book, downloads every page scan, runs both transcription
passes and — once the book has somewhere to go — writes the chapter files.
Every stage is resumable: re-run the same command after an interruption and it
picks up the pages it hasn't done.

## Setup

```sh
python3 -m venv venv
venv/bin/pip install -r requirements.txt
export ANTHROPIC_API_KEY=...        # or: ant auth login
```

`ocrmac` is macOS-only (it wraps Apple's Vision framework). Elsewhere the draft
OCR pass is unavailable — use `--skip-ocr`; everything else works.

## The stages

| Stage | Command | Output |
| --- | --- | --- |
| Register | `add <url>` | an entry in `books.json` |
| Download | `fetch <slug>` | `work/<slug>/images/*.jpg`, at native scan resolution |
| Draft OCR | `ocr <slug>` | `../ocr/<slug>.json` — feeds the editor at `/ocr/<slug>` |
| Transcribe | `transcribe <slug>` | `work/<slug>/pages/page-NNNN.json` |
| Publish | `publish <slug>` | `../autore/<author>/<book>/*.md` |

`run` (the default) does all five. Each also takes `--pages 1-20,45` to work on
part of a book — useful when you are tuning the prompt and don't want to pay
for 200 pages to find out.

### Why two transcription passes

They answer different questions. The **draft OCR** pass is free and instant, and
its line-by-line output is what a volunteer editor sees beside the scan at
`fletoret.com/ocr`. The **Claude** pass is slower and costs money, and it is the
one whose output we publish — it gets the Gheg diacritics right, which is the
part machine OCR reliably fails (`â ê î û ŷ` are nasal vowels, `á í ó` are long
ones, and confusing them changes the word).

Run `ocr` alone if all you want is the editor view; run `transcribe` alone if
you're going straight to publication.

## Configuration

`books.json` is the registry — slug, title, IIIF manifest identifier, and where
the book should be published. Hand-editing it is fine; `bksh.py` fills in blanks
but never overwrites what's already there.

```json
{
  "slug": "mrizi-i-zanave",
  "title": "Mrizi i Zânavet",
  "manifest": "libra1!HASHae57.dir",
  "author": "Fishta, Gjergj",
  "year": "1931",
  "pages": 155,
  "author_folder": "fishta",
  "book_folder": "mrizi-i-zanave",
  "author_name": "Gjergj Fishta"
}
```

`author_folder` / `book_folder` are the publication target under `autore/`, and
`author_name` is the byline written into each chapter's frontmatter. Without
them the pipeline stops after transcription and tells you so — deciding where a
book belongs isn't something it should guess. Set them once:

```sh
python bksh.py publish kryengritja-e-shqiptareve \
    --author grameno --author-name 'Mihal Grameno' --register
```

`--register` adds a stub entry to `autore/index.json` (you still fill in the
genre, thumbnail and abstract, then flip `publishedFletoret`). It refuses to
invent an *author* entry — those carry a biography and portrait.

`prompts/transcribe.md` is the transcription system prompt: the orthography
rules, the layout conventions, and the instruction not to modernise the text.
It's the highest-leverage file here — if transcriptions come back wrong in a
consistent way, fix it there rather than post-processing.

## How it works

**IIIF.** BKD serves scans over the [IIIF][iiif] Presentation API. The viewer
url carries the manifest url in a query parameter; `pipeline/iiif.py` pulls it
out, and also accepts a bare manifest url or identifier. The manifest gives page
order, the book's title, author and year, and per-page image identifiers, so
nothing is inferred from filenames.

This replaced the vendored copy of `iiif-downloader`, which couldn't give us
page order or manifest metadata and re-downloaded everything on each run. One
consequence worth knowing: the old code appended `.png` to image identifiers
that are actually JPEGs, so existing urls in `ocr/*.json` carry a spurious
`.png`. Both forms resolve, and regenerating a file drops it.

**Transcription.** One request per page, image plus the system prompt, returning
a structured result (`printed_page`, `kind`, `starts_piece`, `piece_title`,
`form`, `text`, `uncertain`) rather than free text — so `assemble.py` can find
chapter boundaries without guessing at headings. The system prompt is cached, and
the first page is transcribed alone so the rest read that cache instead of each
writing their own copy.

**Assembly.** Pages become chapters on the `starts_piece` flag. Page joins are
mechanical: a trailing hyphen closes a split word, a page ending mid-sentence
joins with a space (prose) or newline (verse), anything else gets a paragraph
break. `respectLineBreaks` follows the dominant `form`. Front matter, tables of
contents and colophons are skipped unless you pass `--include-front-matter`.

`work/<slug>/chapters.json` records which pages went into which file and every
spot the transcriber flagged as uncertain. Read it before publishing.

## What still needs a human

The output is a good draft, not a finished text. An editor should still read it
against the scans — the `uncertain` notes are where to start, and clean-looking
pages hide errors too. Chapter boundaries and titles come from a per-page
judgement call and are worth skimming. Nothing here decides that a book is ready
to publish: `publishedFletoret` stays `false` until someone says otherwise.

## Files

```
bksh.py                 CLI
books.json              the registry
prompts/transcribe.md   transcription system prompt
pipeline/config.py      paths, Book, books.json IO, slugify
pipeline/iiif.py        manifest resolution and image download
pipeline/vision.py      draft OCR  -> ocr/<slug>.json
pipeline/transcribe.py  Claude     -> work/<slug>/pages/
pipeline/assemble.py    pages      -> autore/<author>/<book>/*.md
work/                   scans and transcripts (gitignored)
```

[bkd]: https://bibliotekadigjitale.bksh.al/
[iiif]: https://iiif.io/
