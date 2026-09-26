# Proofreading a Fletoret book before its EPUB

Most of `autore/` came from OCR of pre-1972 books, mostly Gheg. The job is to
remove OCR damage and nothing else. The transcription rules the pipeline itself
follows are in `data-pipeline/prompts/transcribe.md`, covering Gheg diacritics,
forms to leave alone, layout and footnotes. Read it first; everything there
applies here too.

## Order of evidence

1. **The page scan**, if `data-pipeline/work/<slug>/images/` exists. When scans cover
   the page, transcribe from the image rather than rule-cleaning the OCR.
   "Clean-looking" pages still hide errors, including an over-applied `ç` where
   the print has plain `c`.
2. **The same file.** A letter the OCR shows consistently in two separate places is
   in the print (`çajre`, not the dictionary `çare`). That repetition is evidence.
3. **The same author's other works** (`autore/<author>/`), for *which variant this
   print uses*.
4. **The whole corpus**, for *whether a word exists at all*. Always exclude the file
   you're cleaning, or it corroborates your own guess:
   `grep -roIE 'pattern' autore --exclude=<file>.md`. Filter by dialect, because Tosk
   authors swamp Gheg counts and vice versa.
5. **Sense and syntax**, last. For example, Konica glosses his Greek right after
   quoting it, and the gloss fixed the garbled Greek.

The OCR's diacritic only says *a diacritic was there*, not which one. The corpus
often says "none" (`leçit-`, `vath-`, `plandos-`).

## Before editing

- **Check the book is complete.** Compare the files against the scans or the
  OCR dump page by page, at least at every file's start and end. *Lahuta*'s
  first canto stopped mid-sentence: seven pages had never been assembled.
- **Look for an errata page** ("Gabimet", "Qorto") at the back. The pipeline
  files it as back matter, but it corrects words and restores dropped lines.
  Apply it, placing each restored line where the rhyme wants it.
- **Check the chapter order the site produces.** `order` sorts only within a
  `parent`, and parts sort by their lowest `order`, so two parts both starting
  at 1 come out in filesystem order (*Gomari*'s Part Two came first). Two files
  with the same `order` are also ambiguous. Number through the whole book.
- **Titles are URLs.** The site slugs each chapter from its `title`, so a title
  fix moves the page. Add `slug: <old-slug>` to keep the old URL.
- **A cast list or front page can sit in the wrong file.** A play's "VEHTJE"
  (dramatis personae) is printed before its title page, so a page split can
  hang it on the end of the previous piece.

- **When the markdown was built from `pages/*.json`, diff the two first.** In
  *Lotët e dashtniës* the diff showed every post-processing fault at once:
  dropped closing dashes, shortened ellipses, invented subtitles, a lost preface.
- **Check each chapter's first page against the scan.** The pipeline splits
  chapters at the page, not at the printed heading, so when a heading falls
  mid-page the end of one chapter is filed at the start of the next (twice in
  Grameno's *Kryengritja*).
  When it happens at every chapter (Vasa's *E vërteta*: the translator's
  «Shënime» start mid-page after each chapter), don't patch file by file:
  rebuild the files from `pages/*.json` with a script that takes the split
  point (page, paragraph index) read off each scan.
- **Check the scans are in print order.** Compare each image's printed page
  number with its neighbours, and the rhyme across page joins. In Çajupi's
  *Baba-Tomorri* images 31 and 33 were swapped (pp. 28 and 27).
- **A heading can be misread as a new piece** — lettered or numbered sections
  (`B!`, `IV.`) inside one poem came out as separate files. Use the printed
  table of contents to decide what a piece is.
- **Diff the chapters against each other.** A whole poem can be filed twice
  under two titles (Mjeda's *Juvenilja*: `liria.md` was `dimri.md`).
- **Watch for a change of subject mid-sentence.** It can be a silent gap where
  one chapter runs into another's text (Sami's *Shqipëria*, *Besa e lidhja*).
- **Match every footnote definition to its file.** `grep -n '^\[\^' ` across the
  book: definitions can drift to the end of the last file, far from their
  markers, and the build still passes.
- **Editor's notes (`shenimet.md`):** list the note numbers the text never
  references. Some references had been turned into `[^n]` footnotes repeating
  the note text; others were damaged (`(208.)`). The notes' own
  cross-references ("shiko shën. Nr. 3") settle their order.
- **Headings inside a chapter sit below its title**: `####` and lower in a book
  with parts, since the chapter title is an h3.
- Check the dump is in the right file. Running headers (odd pages carry the piece's
  title) and the book's `order` field tell you. Fix filing before text.
- Check whether the file is half-clean already. Quality alternates page by page.
- Check `respectLineBreaks` against the text. Prose saved one paragraph per line
  with `respectLineBreaks: true` gets the EPUB's verse styling. Put a blank line
  between the paragraphs and set it to `false`. Two of Migjeni's sketches needed this.
- **Read the whole book before applying fixes.** A form that looks wrong on first
  sight (`anëmik`, `shqahisht`) often recurs in later files, which makes it the
  print's.
- **A witness transcription helps.** Wikisource holds independent transcriptions
  of some chapters (the *Kanuni*'s Books 1 and 7). Test a "systematic" swap
  against it before sweeping: that print really spells `giobë`, `zgiedhë`.
- A corpus hapax list (words found once in the book and nowhere else in
  `autore/`) catches typos a read-through misses. Outside Gheg it mostly
  lists vocabulary, so use it as a pointer, not evidence.
- Once you find a systematic misread in one file, sweep the whole book for it.
  In Migjeni's *Novelat* that was `g` for `gj`/`q`/`ç` (`githe`, `shogja`, `gendron`)
  and a dropped `p` in `shpirt` (`shirti`). When several readers split a book,
  each sees the pattern only in their own files.

## Common OCR damage

| Kind | Examples |
| --- | --- |
| Lost diacritics (whole passages) | `perpara` → `përpara`, `cuditshme` → `çuditshme`, `luges` → `Jugës` |
| Gheg `ë` misreads | `è é S 6 g ß` → `ë` (`pSr` → `për`, `tg` → `të`) |
| Nasal `â` misreads | `à ä á` → `â` **only if** the word takes it (`dà` → `dá`, `qà` → `qá`) |
| `ç` misreads | `? 9 g Q ( £ s` → `ç` (`9'do` → `ç'do`, `gudi` → `çudi`, `sàshtjen` → `çâshtjen`) |
| `ŷ î û` misreads | `$ ^ £ ÿ` → `ŷ`/`î`; `0 O ü ù` → `û`. Use `ŷ`, never `ÿ`. |
| `yy` read as `yp`/`ŷ` | where the typeface gives `y` a descender (Gjeçovi 1910): `shtŷn`/`shtypn` → `shtyyn`, `sypt` → `syyt`. Whitelist real `lyp-`, `Shqyp-`, `hyp-`, `shtyp-`. |
| `w` read as `ë` | in foreign names in web-sourced texts: `Neës` → `News`, `Ëien` → `Wien` |
| Modern-text OCR | `ta`/`taa`/`tae` for `b` (`taërë` → `bërë`), `P` for `F` (`Pjala`), in a standard-Albanian translation (Sami's *Proverba*) |
| Print damage kept by scan transcription | turned `n`/`u` (`nukn`, `uga`), a gap for missing type (`k tu` → `këtu`), worn comma read as a full stop before a lowercase word, spaced proclitics (`t' onë` → `t'onë`), blank lines at page turns |
| Letter swaps | `I 1` → `l`; `rn tn in` → `m`; `AA` → `M`; `11` → `u`/`na`; `f` → `t`; `h` read as `f` (`befi` → `behi`) |
| Words fused by the transcriber | a short word run onto the next, most often before `ësht` (`dheësht`, `nukësht`, `vjedhjejeësht` in Vasa 1935). Grep `ësht\b` preceded by a letter. |
| Broken dotless `i` read as `j` | a worn `i` whose dot is lost (Vasa 1935: `Iljrjanët`, `hasjm`, `serjoze`). Check every `j` between consonant and vowel against the scan; the transcriber fixed some silently, not all. |
| `qe`/`që` swapped | Both directions: "Që një çupë" → *Qe* (was); "Ajo qe e quajmë" → *që* (that) |
| Split/merged words | across spaces as well as within words (`g otérak í` → `gotë rakí`; `lanë shtëpi` → `la në shtëpi`) |
| Right-margin loss | line ends turned to garbage (`c mr 1`, `T iii`, `st jriri TË "TI`). Rebuild from syntax and context. |
| Duplicate OCR passes | the same passage twice, garbled differently. Align the copies word by word and they rebuild each other. |
| Footnote in the text | a page footnote lands mid-sentence ("kinina është *Efharistós. Faleminderit.* — specifiku"). Restore it as `[^n]`. |
| Duplicated line | a line from elsewhere pasted into a sentence ("në zemër të dr. *Automobili u nis ngadalë,* Gjëlpërës"). |
| Printer's turnover (`[word` on the next line) | the overflow of a long verse line, set right with a `[`. It is not a conjecture: join the word back onto its line. |
| Indented first line | 4+ spaces after a blank line make a markdown code block. Trim to 2 or fewer. |
| Partial modern normalisation | an earlier online text half-modernised the spelling (`për`, `ndër`, `kanë`, `-shëm`). Where scans exist, restore the print. |
| Running headers, page numbers, drop caps, `* * *` | Delete the headers and page numbers. A drop cap is the word's first letter. `* * *` becomes `***` on its own line. |

## Markdown traps that also break the live site

- **A line starting with `- ` is a bullet list.** Join a wrapped dialogue dash onto
  the previous line. Drop a stray leading dash if the pattern shows it isn't part
  of the text.
- **Spaced hyphens.** The EPUB turns ` - ` into an en dash, so close up a compound
  that OCR spaced (`arkitekti - artist` → `arkitekti-artist`,
  `Protagoras - Dhalla` → `Protagoras Dhalla`).
- **A word hyphenated at a line end** (`Abd-\nel-Katl`) renders with a space. Join
  the lines and keep the hyphen if it belongs to the word.
- **Numbered points (`1. — …`, `1) …`) become an indented ordered list.** Where
  the print sets them as paragraphs, escape the marker: `1\. — …`.
- **Follow the print's layout, not just its words.** A law code's centred § titles
  and the maxims under them take `{.section-heading}` and `{.maxims}` (styled on
  the site and in the EPUB); see the *Kanuni*.
- **Look for the book elsewhere before marking a gap.** Every digital copy of the
  *Kanuni* lacked §§88–98; the BKSH scan of the 1933 print had them. Ask the
  maintainer for a BKSH link.
- **Joined verse lines.** A double space inside an overlong verse line usually
  marks two lines run together; split at the rhyme. Count the rhyme scheme
  before trusting stanza breaks.
- **Speakers merged into one paragraph** because a blank line is missing. Separate
  them.
- **Unbalanced quotes are often correct.** Old dialogue resumes after
  `– tha X, –` with only a closing quote, and long speeches run across
  paragraphs, opening each one. Only fix what is really broken.

## What not to change

- Dialect and period spelling: Gheg forms (`qi, nji, un, tue, mbas, kenë, kje`,
  `me` + participle), and an author's own words (Konica's *mejtuar, dalldis,
  bakalle, tija, posi, nër mend*).
- Slot-dependent spellings the print varies itself. Don't level them:
  `kêtê` (pronoun) vs `kët/këtë` (determiner), `atë`/`atê`, `ngrî`/`ngrí`,
  `hali`/`halí`, `ne`/`né`. A rule is not evidence; don't churn a clean page to
  satisfy one.
- Ottoman, Italian, Turkish and Greek words and phrases in characters' mouths:
  `sabër, hazër, kasavet, çajre, Afedersiniz, qirié jatre`.
- An unfinished text. Konica's novella breaks off mid-speech; don't "close" it.

## Conventions for your edits

- `[word]` means a word supplied by conjecture; `[…]` means text that is lost and
  not recoverable. Anything you can't resolve stays as printed and goes in your
  report with file and line.
- Apply fixes as exact `(old, new)` replacements, each asserted to match exactly
  once. Write only after all of them match. Multi-line matches are fine; hard wraps
  are the usual reason one fails.
- For long runs of damage (Konica pt. 1 lost every `ë`/`ç` for 40 lines), rewrite
  the passage whole instead of patching word by word.

## Verification before building

- `grep -o "[^ -~]" <file> | sort | uniq -c` lists every non-ASCII character. Expect
  only Albanian letters, the dialect's accented vowels, `« » — …`, plus any genuine
  foreign words. Anything else is residue.
- List paragraphs with an odd number of `"` and review each one (most will be the
  convention above).
- Grep for line-starting `- `, for ` - ` inside names or compounds, and for stray
  `)?`, `.."`, `" -` at line ends.
- Once paragraphs are joined, avoid `grep -on '.\{0,24\}é.\{0,20\}'` over long lines,
  which backtracks badly. Use a small Python `re.finditer` loop for context instead.
