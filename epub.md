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
three books: *Lahuta e Malcis*, *Mrizi i Zânavet* and *Gomari i Babatasit*. Then Migjeni's two: *Vargjet e lira* and *Novelat e qytetit të veriut*. Then
every remaining book on the site, in one parallel pass (one agent per book).
All pass EPUBCheck 5.4 with no errors, warnings or infos.

## How it works

| File | Role |
| --- | --- |
| `scripts/epub.mjs` | The builder: markdown → XHTML, package, zip, built-in check. `npm run epub [-- <author>/<book>]`. |
| `scripts/epub.css` | The book's stylesheet, modelled on Standard Ebooks' `core.css`. |
| `src/lib/epub.ts` | URL, `static/` path and download filename. Shared by the builder and the site. |
| `src/lib/components/EpubDownload.svelte` | Download button: `full` on the book profile, `compact` on the author page's book cards. |
| SEO | Books with an EPUB get: "lexo online, shkarko EPUB falas" in the page title; a bilingual (sq/en) sentence in the book and author meta descriptions (`EPUB_BLURB` in `src/lib/epub.ts`); `<link rel="alternate" type="application/epub+zip">` on the book and chapter pages; a schema.org `workExample` (`bookFormat: EBook`, `encodingFormat: application/epub+zip`) in the book JSON-LD (`src/lib/db.ts`); a download line under every chapter; and an FAQ entry on the homepage (`faq/a-mund-ti-shkarkoj-librat.md`). |
| `vite.config.ts` → `EpubPlugin` | Builds every flagged book when `dev` or `build` starts. |
| `autore/index.json` | `"epub": true` opts a book in; optional `"subtitle"` goes on the title page; `"compiledBy"` (an author folder) credits a compiler on the title page, colophon and as `dc:contributor` (MARC `com`). |

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
- **Images** the markdown takes from the site (`![caption](/images/…)`) are
  copied from `static/` into `epub/images/` and listed in the manifest. An image
  alone in its paragraph becomes a `<figure>` captioned with its alt text, as
  the site does (a `<br>` in the alt text is a line break in the caption). JPEG,
  PNG, GIF, SVG and WebP only.
- **Editor's notes** (`shenimet.md`, see `src/lib/markdown-editor-notes.ts`): the
  notes file stays a chapter where the site puts it, with each `N.` block made
  a paragraph `id="shenim-N"`, `epub:type="endnote"` (not an ordered list, so a
  gap in the numbering can't shift the numbers). Every bare `(N)` in the text
  whose N is a note becomes `<a class="editor-note" epub:type="noteref">(N)</a>`
  into that chapter, set at text size so it doesn't read as a footnote number.
  A block that doesn't start `N.` (e.g. `7 —`) is not a note, on the site either.

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
| `konica/ese` | **Shipped** | No scans (~145 fixes: `w` read as `ë` in foreign names, Greek restored, footnotes rewritten). |
| `leke-dukagjini/kanuni` | **Shipped** | Re-transcribed in full from the 1933 first edition's scans (BKSH `libra1!HASH0ea3.dir`, pipeline slug `kanuni`): the print's spelling and accents, every § (the web edition had lost §§88–98, §75, §281…), ~95 footnotes. Front matter added (title page, Bardhi's biography with Gjeçovi's portrait, Fishta's Parathânë, Konica's recollection) and the appendix *Shtojcë* (`shtojce.md`). Listed under Gjeçovi too via `"compiledBy"`. Layout follows the print: `{.section-heading}` for § titles, `{.maxims}` for the maxims under them, `1\.` for numbered points. |
| `sami-frasheri/shqiperia` | **Shipped** | No scans (~236 fixes). All three parts started at `order` 1 and came out reversed; now numbered through. **Gap:** the end of *Besa e lidhja* and chapters V–XIII (*Qëllim' i Shqipëtarëvet* … *Diturija*) are missing from every edition found (the Albaniana 2015 text lacks the same pages); the start of *Punërat' e përgjithçime* was restored from the pashtriku.org anthology. Needs the 1899 print. |
| `sami-frasheri/proverba` | **Shipped** | No scans; a modern-standard translation (~224 fixes, `ta`→`b`, `P`→`F`). Chapter titles now `Vëllimi N` (old slugs kept). |
| `naim-frasheri/bageti-e-bujqesi` | **Shipped** | No scans (58 fixes); a few lines lack a rhyme partner and may be lost. |
| `frang-bardhi/skenderbeu` | **Shipped** | First book with editor's notes. No scans (~300 fixes; `hyrje.md` rewritten). 224 of 228 notes referenced; notes 2, 5, 6 belong to the original title page, which isn't in the text. |
| `ndre-mjeda/juvenilja` | **Shipped** | Checked against the 1928 second edition's scans (BKSH `libra1!HASH01f0.dir`, slug `juvenilia`); the print's spelling restored, the translations re-set. The duplicate `liria.md` was removed. Ten poems come from the Librashqip 2023 edition, not the print (Lissus, Scodra, Vjollcës, Ëndërro dashuno…). |
| `ndre-mjeda/lirija` | **Shipped** | 5 fixes. |
| `haki-stermilli/sikur-te-isha-djale` | **Shipped** | No scans (~336 fixes); the Prolog's quotations of the diary cross-check the later text. |
| `zef-serembe/vjersha` | **Shipped** | No scans (~45 fixes; merged verse lines split at the rhyme). |
| `grameno/kryengritja-shqiptare` | **Shipped** | Proofread against all 214 scans (~195 fixes). Two chapter openings filed in the wrong chapter, moved back. First book with images. Four Vol. II photo plates aren't in the text. |
| `gjecovi/agimi-i-gjytetniis` | **Shipped** | Proofread against the scans (~1,000 fixes: `yy` read as `yp`/`ŷ`, spaced proclitics, quotes). The index of cited authors (pp. 143–148) the `(n.)` citations point to isn't in the edition. |
| `hil-mosi/lotet-e-dashtnies` | **Shipped** | Proofread against the scans for pp. 5–92; pp. 93–122 (files `order` 106–141) only against the page transcriptions, with 43 `uncertain` items left, so a scan pass there is still due. The markdown's post-processor had dropped the closing dashes, cut ellipses, invented subtitles and lost the preface (now `parathanje.md`). |
| `fan-noli/albumi` | **Shipped** | Its author's index key is `noli`, not `fan-noli`, which the builder used to assume (now it finds a book by folder). No scans (~65 fixes); `order` tie between two poems resolved. `fan-noli/vjershat-e-para` is unpublished. |

**Raw HTML in markdown** that isn't valid XHTML is fixed in the sources (for
example `<br>` → `<br/>`, balanced tags), which also improves the site.

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
