---
name: epub
description: Turn a Fletoret book into a clean, Standard Ebooks-quality EPUB and offer it for download on the site. Covers proofreading the text, building, validating with EPUBCheck, reviewing the rendered pages and flagging the book. Use when asked to make, convert or ship an EPUB or e-book of a book in autore/, e.g. "convert fishta/lahuta-e-malcis to epub" or "/epub migjeni/vargjet-e-lira".
argument-hint: <author>/<book> (a "folder" value from autore/index.json)
---

# Make an EPUB of a Fletoret book

The argument is a book folder such as `fishta/lahuta-e-malcis`. If it's missing
or ambiguous, list the candidates from `autore/index.json` and ask.

Read `epub.md` (repo root) first. It covers how the pipeline works, the known
blockers per book and why things are the way they are. For the text, read
`proofreading.md` in this folder. What follows is the procedure; those two
files hold the detail.

The bar is **clean text and a valid, well-formed book**. A book that builds but
still carries OCR damage is not done. Konica's *Doktor Gjilpëra*, the first book,
needed about 310 text fixes before it was right.

## 1. Survey (read only)

- Find the book's entry in `autore/index.json`. Note whether it already has
  `"epub": true`, whether its cover PNG exists next to the `thumbnail`, and
  whether it has a `shenimet.md`. Editor's notes aren't supported yet; see
  `epub.md` → open work.
- Check the known-state table in `epub.md`.
- Look for scans. They change how you proofread:
  - `data-pipeline/work/<slug>/images/` holds page scans. They're gitignored, so
    they exist only on machines that ran the pipeline.
  - `data-pipeline/work/<slug>/pages/` holds the per-page transcriptions, with an
    `uncertain` list for each page.
  - `ocr/<slug>.json` holds the draft OCR.

  The slug is in `data-pipeline/books.json`.
- Run `node scripts/epub.mjs <folder>` once to see what the built-in check reports.

Tell the user in two or three lines what you found and how big the job looks,
then continue.

## 2. Make it build

Fix what the built-in check reports **in the markdown sources**, not in the
builder. Typical fixes: `<br>` → `<br/>`, and `<center>` → markdown or a
`{.class}`. When a book needs builder support instead (images, editor's notes),
say so and ask before extending `scripts/epub.mjs`. Keep any builder change
general and document it in `epub.md`.

## 3. Proofread the whole text

Follow `proofreading.md`. In short:
- Read every chapter. Pattern greps miss most of the damage.
- Where scans exist, the scan wins.
- Preserve dialect and period spelling. Fix only OCR damage.
- Mark conjectures in `[brackets]` and lost text as `[…]`.
- Apply the fixes as exact, asserted replacements, and keep a list of
  unresolved spots.

Stop and ask the user before:
- deciding how to mark a genuine multi-page gap
- changing a reading they have already corrected
- normalising a spelling that the print itself varies

## 4. Build and validate

1. Run `node scripts/epub.mjs <folder>` until the built-in check passes.
2. Run EPUBCheck with the throwaway Java runtime in `tmp/`. The commands are in
   `epub.md` → Validation. Don't install Java system-wide; the maintainer
   declined that. Aim for 0 errors and 0 warnings. Delete `tmp/validate`
   afterwards.

## 5. Look at it

Unzip into `tmp/` and screenshot the title page, a chapter opening, a verse page
(if any), the endnotes and the colophon. Check for:
- straight quotes left over
- compound hyphens turned into dashes
- merged speaker paragraphs
- stray markup or bracket noise
- chapter order and titles

## 6. Ship it

- Add `"epub": true` to the book's entry in `autore/index.json`. If the cover
  prints one, also add `"subtitle"`.
- Run `npm run dev`. Check the download button on `/<author>/<book>/` and on
  `/<author>/`, and that `/epub/<author>/<book>.epub` downloads.
- Run `npm run check`. It must not rise above the baseline noted in `epub.md`.
- Update the known-state table in `epub.md`, and record any new lesson in
  `proofreading.md`.

## 7. Report

Leave the work uncommitted unless the user asks for a commit or PR. Report:
- what was fixed (counts plus the notable readings)
- every bracketed conjecture
- unresolved spots, with file and line
- the EPUBCheck result
- anything that still needs the maintainer's decision
