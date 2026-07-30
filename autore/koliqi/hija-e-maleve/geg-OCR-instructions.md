Clean the OCR of autore/koliqi/hija-e-maleve/<FILE>.md (interwar Geg, Koliqi).
Screenshots of pp. <N–M> attached.

Read ~/.claude/projects/-Users-ak-nwork-sites-fletoret/memory/geg-lessons.md in
full before touching the file — substitution table, orthography rules, resolved
vocabulary, verification greps. Follow it; don't re-derive it.

Order of work:
1. Confirm the dump is in the right file from the running headers (odd page =
   story title, even = book title) and note the page span.
2. Map clean vs raw pages — quality alternates, and "clean" pages still hide
   errors, so re-audit them too.
3. Where a screenshot covers a page, transcribe from the image instead of
   rule-cleaning the OCR. Use the shots to arbitrate the ambiguous glyph classes
   (ŷ vs y, â vs á, ê vs ë) for the whole file.
4. Before guessing any word, batch corpus greps in one Bash call: `grep -roIE`
   over autore/ for whether the word exists, then narrow to autore/koliqi for
   which variant this author uses. Show the counts.
5. Merge line-end hyphen breaks, join each paragraph to one line, sections as
   `## I`, `## II`. The chapter drop cap OCRs into a `>` blockquote and a `*`
   bullet — check the opening paragraph.
6. Run every grep in the memory's final-verification section, plus the
   markdown-residue grep.
7. Reply with: structural changes, what the corpus greps settled, and an explicit
   list of spots left exactly as the print has them. Never invent a word.
8. Update geg-lessons.md with what's new — substitutions, resolved vocabulary,
   judgement calls, still-open flags — and keep the MEMORY.md line current.

Preserve the dialect. Fix only OCR damage.

Two notes on why it's shaped this way: step 4 is the highest-leverage instruction — batching the greps into one call is what made this pass fast, since each guess otherwise costs a round trip. And step 8 matters because the memory file is what lets the next session skip steps 1–4 for words already settled.
