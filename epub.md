# Fletoret — EPUB editions

Reference for anyone (human or agent) turning another book into an EPUB. It
records how the pipeline works, the steps to take a book through it, what is
known about the books not yet done, and why things are the way they are. The
contributor-facing summary (in Albanian) is section 4 of `README.md`.

**To do a book:** follow the `epub` skill:
- `skills/epub/SKILL.md` is the procedure.
- `skills/epub/proofreading.md` covers text cleanup.

In Claude Code, copy it to `.claude/skills/` (see `skills/README.md`), then run
`/epub <author>/<book>` or just ask to convert a book. This file is the
reference the skill leans on.

First book shipped: Konica, *Doktor Gjilpëra* (September 2026). Then Fishta's
three books: *Lahuta e Malcis*, *Mrizi i Zânavet* and *Gomari i Babatasit*. Then Migjeni's two: *Vargjet e lira* and *Novelat e qytetit të veriut*. All
pass EPUBCheck 5.4 with no errors, warnings or infos.

## How it works

| File | Role |
| --- | --- |
| `scripts/epub.mjs` | The builder: markdown → XHTML, package, zip, built-in check. `npm run epub [-- <author>/<book>]`. |
| `scripts/epub.css` | The book's stylesheet, modelled on Standard Ebooks' `core.css`. |
| `src/lib/epub.ts` | URL, `static/` path and download filename. Shared by the builder and the site. |
| `src/lib/components/EpubDownload.svelte` | Download button: `full` on the book profile, `compact` on the author page's book cards. |
| `vite.config.ts` → `EpubPlugin` | Builds every flagged book when `dev` or `build` starts. |
| `autore/index.json` | `"epub": true` opts a book in; optional `"subtitle"` goes on the title page. |

- Output goes to `static/epub/<author>/<book>.epub`, which is **gitignored**. It is
  rebuilt from the markdown on every `dev` or `build`, so a download never lags
  a text fix. It is deterministic: same sources, byte-identical file, with the
  book's last git commit as `dcterms:modified` (or "now" when the book's folder
  has uncommitted edits).
- Chapter order is copied from `src/lib/db.ts`: grouped by `parent`, sorted by
  `order`. One parent means a flat book; several parents mean parts, each with
  a divider page.
- `respectLineBreaks` missing or `true` means verse (the site's default too).
  Verse chapters get `class="verse"`.
- The site's own markup is normalised before parsing (`siteHtmlToXhtml`):
  `<center>` → `<div class="center">`, `<epigraph>` (stage directions) →
  `<div class="epigraph">`, `<caps>` → `<span class="caps">`, bare `<br>` →
  `<br/>`. YouTube embeds (`iframe-container` + `figcaption`) are dropped, and
  the ✱ `divider` becomes a `* * *` section break. Keep these in the sources;
  they're what the site styles. Inside `<center>`, leave a blank line after the
  opening tag, or markdown inside it isn't parsed.

## Taking a book through

1. **Clean the text first.** An EPUB makes OCR damage more visible than the site
   does. See "Text cleanup" below.
2. **Build it without flagging it.** Run `node scripts/epub.mjs <author>/<book>`.
   The built-in check stops the build and names the `.md` file for each problem.
   Fix the sources until it writes the file.
3. **Validate with EPUBCheck.** See the next section. Aim for 0 errors and 0 warnings.
4. **Read it rendered.** Unzip into `tmp/` and screenshot the title page, a chapter
   opening, the endnotes and the colophon. Look for straight quotes left over,
   hyphens that should be dashes (and dashes that should be compound hyphens),
   and odd paragraph breaks.
5. **Flag it.** Add `"epub": true` (and `"subtitle"` if the cover has one) to the
   book's entry in `autore/index.json`. The profile and author-page buttons
   appear on their own.
6. `npm run check` should stay at the baseline error count (10 before any of
   this work, all in `markdown-editor-notes.ts` and `markdown.ts`).

## Validation

**Built-in check (every build, no dependencies).** It covers:
- XHTML well-formedness
- XHTML5-obsolete elements such as `<center>`
- a complete manifest, with spine items that exist
- links that resolve, including fragment ids, and ids usable as link targets
- `<dt>`/`<dd>` inside a `<dl>` (the glossaries' raw HTML)
- table-of-contents entries that point into the spine
- `mimetype` first and stored

It is not the full spec.

**EPUBCheck (authoritative, needs Java).** The maintainer does not want a
system-wide Java install. Use a throwaway runtime in `tmp/`, which is gitignored,
and delete it afterwards. It is about 80 MB to download on Apple Silicon:

```bash
mkdir -p tmp/validate && cd tmp/validate
curl -sL -o jre.tar.gz "https://api.adoptium.net/v3/binary/latest/21/ga/mac/aarch64/jre/hotspot/normal/eclipse"
curl -sL -o epubcheck.zip "https://github.com/w3c/epubcheck/releases/download/v5.4.0/epubcheck-5.4.0.zip"
tar xzf jre.tar.gz && unzip -q epubcheck.zip && cd ../..
tmp/validate/jdk-*/Contents/Home/bin/java -jar tmp/validate/epubcheck-5.4.0/epubcheck.jar static/epub/<author>/<book>.epub
rm -rf tmp/validate
```

**Screenshots.** Playwright can be newer than its cached browser. Point it at
whatever is in the cache:
`chromium.launch({ executablePath: <~/Library/Caches/ms-playwright/chromium_headless_shell-*/…/chrome-headless-shell> })`.

## Known state of the other books

A stress test on 2026-09-25 built each of these without flagging it.

| Book | Result | What blocks it |
| --- | --- | --- |
| `konica/doktor-gjilpera` | **Shipped** | — |
| `fishta/lahuta-e-malcis` | **Shipped** | Proofread against the pipeline's scans; canto 1's last 198 lines were missing and are restored; the print's errata (pp. 510–511) applied. |
| `fishta/mrizi-i-zanave` | **Shipped** | Proofread against the BKSH scans (IIIF URLs in `ocr/mrizi-i-zanave.json`). |
| `fishta/gomari-i-babatasit` | **Shipped** | No scans available; proofread from consistency, corpus and rhyme only, so conservative. A scan pass would still help (akti-3 l.698–772 has lost rhyme). |
| `migjeni/vargjet-e-lira` | **Shipped** | No scans; proofread from the text (~65 fixes). Sections tied at `order` 1 and came out alphabetically; now numbered through the book (Ringjallja, Rinia, Kangë në vete, Mjerimi, Përndimi, Fundi). |
| `migjeni/novelat-e-qytetit-te-veriut` | **Shipped** | No scans; proofread from the text (~250 fixes, mostly `g` for `gj`/`q`/`ç` and damaged `shpirt` (`shirti`, `spirtin`)). Two sketches were one-line-per-paragraph with `respectLineBreaks: true` and are now prose. |
| `grameno/kryengritja-shqiptare` | Fails | `<center>`, bare `<br>`, and images linked from the site's `/images/kryengritja-e-shqiptareve/`, which the EPUB does not package. |
| `leke-dukagjini/kanuni` | Fails | `<center>` throughout, bare `<br>`, unclosed `<em>`/`<p>` (6 fatal errors, 117 errors). |
| `frang-bardhi/skenderbeu` | Refused | Has editor's notes (`shenimet.md`); not supported yet. |
| All others | Not yet tried | — |

**Open work that unblocks books:**
- **Raw HTML in markdown.** Either fix the sources (for example `<br>` → `<br/>`, and
  `<center>` → a class or markdown) or have the builder normalise raw HTML to
  XHTML. Fixing sources also improves the site.
- **Images.** Copy referenced `/images/…` files into `epub/images/`, rewrite the
  `src`, and add them to the manifest.
- **Editor's notes.** `src/lib/markdown-editor-notes.ts` turns `(14)` into site
  buttons. The EPUB needs them mapped onto its endnotes, as it already does for
  footnotes.

## Text cleanup before building

See `skills/epub/proofreading.md`. It covers:
- the order of evidence: scan, then file, then author, then corpus
- the OCR damage table
- the markdown traps that also break the live site
- what not to change
- the `[conjecture]` / `[…]` conventions
- verification greps

## Design decisions (and why)

- **Standard Ebooks as the bar.** Title page, imprint, colophon, popup endnotes,
  semantic `epub:type`, accessibility metadata, and an NCX alongside the EPUB 3
  nav for older readers.
- **No embedded fonts, no colours.** Readers choose their own; the CSS only sets
  rhythm and hierarchy.
- **No cover page in the spine**, following Standard Ebooks. The cover is the
  `cover-image` manifest item, a JPEG cropped just inside `/kopertina`'s
  transparent rounded corners.
- **The landmarks nav lists `bodymatter` only.** A `toc` landmark points outside the
  spine, which EPUBCheck rejects (RSC-011).
- **Typography the site does not (yet) do:**
  - spaced hyphen → en dash, tied to the previous word with a no-break space
  - unpaired straight quotes curled by position
  - stray `'` → `’` (Albanian elision), and known Gheg word-start elisions
    (`'i`, `'imend`, `'izet`, `'dhe`…) set as `’` before smartquotes can pair
    them into a false ‘quotation’
  - Greek runs tagged `grc` (polytonic) or `el` (monotonic)

  Quotes are `“ ”` to match the site; Albanian print often uses `„ “` or `« »`.
  That's an open question for the maintainer.
- **Opt-in per book** (`"epub": true`), so each book is reviewed before it ships.
- **Built at dev/build time, not committed**, so text fixes flow into the download
  automatically. SvelteKit reloads the vite config for its second bundle, so the
  EPUBs are written twice per build. That's harmless, identical and under a second.
- **`scripts/epub.mjs` is `@ts-nocheck`.** It is plain Node like the rest of
  `scripts/`. It only falls under `svelte-check` because `vite.config.ts` imports it.
- **Download UI.** The author page's card header is one `<a>`, and links can't nest,
  so the compact button is a sibling placed under the description. The icon is
  Tabler's `book-download`.
