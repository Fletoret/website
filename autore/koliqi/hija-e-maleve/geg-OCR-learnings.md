# Geg OCR cleanup learnings — Koliqi, *Hija e Maleve*

Cleaning macOS-OCR'd scans of interwar Geg Albanian books in `autore/` (Koliqi, *Hija e Maleve*; `nusja-e-mrekullueshme.md`, `gjaku.md`, `kanga-e-re.md`, `se-qofsh-pleqnofsh.md`, `kercimtarja-e-dukagjinit.md`, `miku.md`, `anderr-e-nji-mbasditje-vere.md`, `kur-oret-lajmojne.md`, `kopshti.md`, `ke-tre-lisat.md`, `zana-e-fundme.md`, `diloca.md` done 2026-07-29/30). The scans are pre-1944 Geg — **preserve the dialect, fix only OCR damage**.

**Why:** the same OCR failures recur page after page, and blind "modernising" to standard Albanian would destroy the text.

## Do this FIRST: check the dump is in the right file

`gjaku.md` was an empty stub while the whole OCR of *Gjaku* (pp. 23–64) sat in `kanga-e-re.md`. Before editing, `grep -n "<BOOK TITLE>\|[A-Z]\{4,\}" file.md` — the running headers give it away: **odd pages carry the story title, even pages carry the book title**, so the odd-page header names the story the dump actually belongs to, and the page numbers give its span. Fix the filing before the text, then restore the wrongly-used stub (frontmatter only, keep its own `title`/`order`).

Those header lines (`GJAKU    27`, `4 6     HIJA E MALEVE`, `36    H1JA E  MAI-EVE`) are interleaved through the OCR every ~35 lines and all get deleted.

The check is cheap and sometimes passes: `kanga-e-re.md` really did hold *Kânga e re* (odd-page headers `KÂNGA E RE`, pp. 67–82). **Screenshots the user pastes for calibration need not be the same story** — the p. 86–89 shots were *Se qofsh, pleqnofsh*; they still calibrate the glyphs (ŷ with a clear circumflex, `dý` with an acute, `friga`, `u zbe`). Read them for letterforms, not for filing.

**But when the shots DO cover the file's own pages, transcribe from the image instead of rule-cleaning the OCR.** For `se-qofsh-pleqnofsh.md` the four shots were exactly pp. 85–88, and reading them directly settled things no rule would have: dropped `ç'` (`E do shqyrtim` → `E ç'do shqyrtim`), `pasliè s£t` → `pashë sŷt`, `u h$mi` → `u hŷni`, `Rrezik-zezé` → `Rrezik-zezë`, `vetém per vetém` → `vetëm për vetëm`, plus positive confirmation of `qá` (acute, *not* `qâ`), `dhâmbë`, `shtëpís`, `kêtê`. Rule-clean only the pages no shot covers, then let the shots arbitrate the ambiguous glyph classes for the whole file.

**A "page 12" screenshot that looks miscalibrated can actually be the file's own true opening — cross-check the book's `order` field before assuming it's foreign.** In `diloca.md`, the dump's first block carried a bare page number "12" with no running header, which looked impossible next to chapter II's footer reading "178 HIJA E MALEVE" — a 166-page jump for a 2-day diary gap. But `diloca.md` is `order: 11`, right after `ke-tre-lisat.md` (`order: 10`, pp. 159–174) — so the story must start around p. 175–177, and "12" is simply an OCR misread of a similar 3-digit number (page numbers get the least OCR attention on the page). The content itself clinched it: the "page 12" scene continues without a seam into the "page 178" scene. Same filing check, run in the opposite direction: don't just verify a dump is under the right title, also don't assume a screenshot is foreign just because its visible page number contradicts the neighbours — check the book's own `order` sequence and the narrative seam first.

## `kêtê` (pronoun) vs `kët/këtë/këto` (determiner)

The print distinguishes them and this is *not* a nasal root to sweep flat. Standing alone as the accusative pronoun "this (one)" it is nasal `kêtê`: `Me gjith kêtê Filja vêndoi` (screenshot-confirmed), `gjykonte kêtê për dekë`, `Desht m'e thânë kêtê`, `qi e mbushte kêtê me çudi`, `dij me thânë vetëm kêtê:`. As a determiner in front of a noun it is plain `ë`: `kët herë`, `kët punë`, `kët derë`, `këtë ditë`, `në këto rasa` — and the already-clean pages of the same file set `kët herë` and `me këto fjalë`, which is what proves the split rather than an OCR accident.

**OCR quality alternates page by page, and a file may be half-cleaned already.** In `kanga-e-re.md` pp. 23, 25–27, 30–31, 33, 46–48, 61–63 were clean while their neighbours were raw. Don't infer from a clean opening that the rest is clean; don't re-do pages that are already right (but *do* re-check them — p. 25's "clean" text still hid `inâ e vogla`→`mâ e vogla`, `ç' âsh k o lla`→`ç'â shkolla`, `zhvillim in`→`zhvillimin`, `A bâjmë mirë 11a qi`→`na qi`).

`miku.md` p. 117 is the sharpest example: it arrived with correct `ë â ê ŷ` throughout and *looked* finished, yet the screenshot caught six errors on it — `naît`→`naltë`, `Kishte pâ`→`Kishte pá`, `dÿ`→`dŷ`, `Hÿni`→`Hŷni`, `kutin e duhanit`→`kutín`, and **`forçat`→`forcat`**. That last one matters: a clean-looking page can carry an *over-applied* `ç` where the print has plain `c`, which no `g`→`ç` rule will ever catch and no sweep will flag. Screenshot-check the clean pages too, and specifically distrust their `ç`.

Use `ŷ` (circumflex), never `ÿ` — `ÿ` in a file is unconverted OCR. Verify at the end with `grep -o "[^ -~]" file.md | sort | uniq -c`: the only non-ASCII should be `ë â ê ç í ŷ á û é î ú « » —`. Anything else is residue.

## Character substitutions (OCR → correct)

| OCR | Correct | Notes |
|---|---|---|
| `è é ê(sometimes) S 6 g ß` | `ë` | `pSr`→`për`, `zemgr`→`zemër`, `sof6r`→`sofër`, `shtßpi`→`shtëpi`, `tg`→`të`, `mg`→`më` |
| `à ä á(mid-word)` | `â` | `bà`→`bâ`, `thàne`→`thânë`, `Häna`→`Hâna`, `Kurrgjá`→`Kurrgjâ`, `má`→`mâ` |
| `? 9 g Q ( ¡ ( ¿ <; £` | `ç` | `?as`→`ças`, `9'do`→`ç'do`, `Qa`→`Ça`, `gjithgafes`→`gjithçafes`, `(¿akgirèt`→`çakçirët`, `£'faré`→`Ç'farë`, `agik`→`açik`, `vjeg`→`vjeç`, `ginija`→`çinija`, `gimgakez`→`çamçakëz` |
| `$ ^ £ ÿ` | `ŷ` / `î` | `s$noi`→`sŷnoi`, `s^t`→`sŷt`, `s£`→`sŷ`, `h£`→`hî`, `h^ni`→`hîni`; macOS renders ŷ as ÿ. `£` does double duty as ç and as ŷ/î — pick by the word. |
| `0 O ü fl ù` | `û` | `VOna`→`Vûna`, `v ü`→`vû`, `zflni`→`zûni`, `zù`→`zû`, `Mtì`→`Mû` |
| `I 1 i` | `l` | `Iuejti`→`luejti`, `Iule`→`lule`, `foie`→`folë`, `kaiizue`→`kallzue`, `natta`→`nalta`, `fjaien`→`fjalën` |
| `rn tn in ni` | `m` | `rnik`→`mik`, `tnbas`→`mbas`, `inbulue`→`mbulue`, `inundem`→`mundem`, `Nàinte`→`Nâmte`, `për ni bys`→`përmbys` |
| `ü` | `Gj` | `üjithsa`→`Gjithsa` (same class as `O`→`G`) |
| `f` | `t` | `fregimi`→`tregimi` |
| `g` | `c` | `aluginacjoni`→`alucinacjoni` |
| `O` | `G` | `Oratè`→`Gratë` |
| `1 11` | `n na` | `11a qi`→`na qi` |
| `s` | `ç` | **new, and it bites**: `sàshtjen`→`çâshtjen`, `s'i a sele gojen`→`s'i a çela gojen` |
| `g S 6` | `ë` (word-final) | `frigg`→`frigë`, `ggzue`→`gëzue`, `mirg`→`mirë`, `qartg`→`qartë`, `ardhg`→`ardhë`, `parSn`→`parën`, `K6to`→`Këto` |
| `U` | `ll` | `ngushu-\nUonte`→`ngushullonte`; a doubled letter often drops or capitalises |
| `H1JA MAI-EVE` | `HIJA MALEVE` | running-header noise, just delete the line |

More of the same class, all from `se-qofsh-pleqnofsh.md`: `naît`→`naltë` · `âniës`→`âmës` · `famiies`→`familjes` · `molië`→`mollë` · `uie`→`ulë` · `fjaie`→`fjalë` · `c!ha`→`dha` · `kapug`/`kapu<j`→`kapuç` · `inbërrî`→`mbërrî` · `dañé`→`danë` · `£ue`→`çue` · `s$>sh`→`sŷsh` · `gudi`→`çudi` · `ga`→`ça` · `bän`→`bân` · `mieli`→`miell` · `vegse`→`veçse`.

And from `kercimtarja-e-dukagjinit.md`: `AAbreti`→`Mbreti` (**`AA` = `M`**, new) · `90Í`→`çoi` · `iegiten`→`leçiten` · `piándose`→`plandosë` · `Filad`→`Fllad` · `inbaroi`→`mbaroi` · `shtrtnte`→`shtrînte` · `u prtn`→`u prîn` (**`rt`/`t` swallows a circumflexed vowel entirely**) · `gedhini`→`gëdhîni` · `gèmèndé`→`çmëndë` · `gèmimin`→`çëmimin` · `befé`→`behë` · `meshefshin`→`mshefshin` · `mrekulii`→`mrekulli` · `Uisht`→`llisht` · `bajlozava`→`bajlozave` · `paprulun`→`papërulun`.

And from `miku.md`: `scelte gojé`→`s'çelte gojë` (the negative `s'` fused into the next word) · `rivaia`→`rivalë` · `Ojoka`/`Qjoké`→`Gjoka`/`Gjokë` · `fluiuroi`→`fluturoi` · `uniforinèn`→`uniformën` · `sy>t`→`sŷt` · `Uc¡`→`Uci` · `tue 11 zgjue`→`tue u zgjue` (**`11` = `u`**) · `1 u ngjit`→`I u ngjit` · `tn'a marre`→`m'a marrë` · `läng`→`lânë` · `tS`/`n6`→`të`/`në` · `nisën in' u dridhë`→`nisën m'u dridhë` · `pam byllun`→`pambyllun`.

**`à` is not always `â`.** It is whatever the lexeme takes: `dà`→`dá` (to divide, in the long-`á` list below), `gërgà`→`gërgâ`, `qà`→`qá` (screenshot-confirmed). Decide by word, not by glyph — the OCR only tells you *a diacritic was there*.

## Grep the whole corpus before you guess

This is the highest-value habit. `autore/` holds Fishta, Mjeda, Migjeni, Konica, the Kanun — a large body of already-clean Geg. Before inventing a reading, count the candidates across all of it:

```
grep -roIE 'rr[âáë]z[ëe]|\bkând|përmbys|çini[a-zë]*' . | sed 's/.*://' | sort | uniq -c
```

**Always pass `--exclude=<the-file-you're-cleaning>.md`.** The target file lives *inside* `autore/`, so it matches itself and every reading you're trying to verify comes back with "1 hit" — which looks like corroboration and is nothing but your own guess echoed back. This wasted a whole grep round on `kercimtarja`: `guterr`, `selije`, `hyrija`, `peshtah`, `gjinikoj`, `ersoj` all showed 1 hit, all self-matches. With the exclusion, `selije` turned up in Fishta and `apotheozë` in Migjeni (real corroboration) while the other four went to zero (genuinely unique — leave them).

Third gotcha, and it costs two minutes of wall clock: **once the paragraphs are joined, never run `grep -on '.\{0,24\}é.\{0,20\}'` for context.** Against 90-odd very long single lines the multibyte class backtracks catastrophically and the call has to be killed. Extract context with a three-line Python loop over `re.finditer` instead; plain `grep -o` (no `.{0,n}` padding) is still fine.

Second gotcha: `grep -oE '[a-zA-Zë]*é[a-zA-Zë]*'` for the accented-vowel audit **splits any word carrying two different accents**, because the bracket excludes the accented letters — `âmbëlsí` prints as `âmbëls` + `í`, `kêtê` as `kêt` + `ê`. Harmless once you know, alarming when you don't. Put the whole accent set inside the brackets if you want whole words.

That settled, in one pass: `rrâzë` (4 vs 1 `rrëzë`) · `kând` (15) · `përmbys` (17) · `çinija` (confirming OCR `ginija mezje` = plates of appetisers) · `dikohet` · `gemb` = branch, so OCR `nji gèm jeseminash` is `nji gemb jeseminash` · `flên`, so `flènte` → `flênte` · `hû` = pole/stake (Fishta `nji hû dullije`). Use `-oIE`; zsh chokes on unquoted `--include=*.md`, and a bare `-h` over hundreds of files makes ugrep print the file list instead of matches.

**Narrow the grep to the same author when the corpus is split.** Corpus-wide `dhânë` 46 : `dhanë` 50 decides nothing; `grep -roIE 'dh[âa]n[ëe]\b' koliqi` is 10 : 0 for `dhânë`. Same move settled `më sa pyette për tokë` (= while) — Koliqi uses `më sa` in both `kanga-e-re.md` and `gjaku.md`, so the OCR's `mè sa` is not `me sa`/`mesa`. Whole corpus for *does this word exist*, author subtree for *which variant this print uses*.

**The corpus can overrule the long-`í` rule, so grep before accenting.** `zotsi/zotsin/zotsis` is plain 4 : 0 and `gjini` beats `gjiní` 34 : 2 (the p. 88 screenshot shows `gjini` bare, confirming it) — so not every abstract `-i` noun is accented, and `-si` abstractions in particular are mixed (`mshefsín` accented, `zotsin` not). Corollary: **don't churn an already-clean page to satisfy a rule when no evidence backs it**.

**The corpus overruled the OCR's diacritic five times in `kercimtarja`, so grep even when the OCR looks confident.** OCR `iegiten` → **`leçiten`** (proclaimed) — 20 corpus hits, every one plain `leçit-`, *not* `lëçit-`. OCR `piándose` → **`plandosë`** (8 : 0 plain `plandos-`, no diacritic). OCR `pashmänggt` → **`pashmangët`** (slippers) on the strength of Koliqi's own `pashmangësh`. OCR `váthé` → **`vathë`** (34 plain hits, 0 accented). OCR `mrekulii` in *për mrekulii* → **`për mrekulli`** (Koliqi 4 : 1 against `mrekullí`). The `ä`/`á` in the OCR only means *a diacritic was there*; the corpus says which, and often says "none".

**Cross-file confirmation can close another file's open questions.** `kanga-e-re.md` has `tue i râ njânit partinë qafës` — so `partinë` (a whack/blow) is real and `gjaku.md`'s flagged `m'a ka hjekë nji partinë` was right all along. Likewise `U korita` here plus 9 corpus hits for `kore` back up gjaku's `un s'bâj kore`. When a new file resolves an old flag, go strike the flag.

**`diga` is `diça` (= something) — fully resolved, every carrier in `autore/` fixed as of 2026-07-30 (`ke-tre-lisat.md`'s two instances were the last).** Lesson: when a token recurs in slots that seem to demand different senses, suspect one *very* common substitution before concluding it's two words.

`kercimtarja-e-dukagjinit.md` closed **`vergjilët`** — kanga-e-re's flagged `nji trup të vergjilët` matches this print's `Trupi i vergjilët` exactly, and note it is a plain `e`, not `vërgjilët`. It also confirmed **`hjekë spik`** (= to relieve, `me i hjekë spik gjumit`) against two other corpus hits, and **`përpisë`** (raging: Koliqi's own `duhín përpisë`, so `nji vrellë përpise të luejtunash` stands).

## Reconstructing shattered words (the hard ones)

OCR splits words at random and drops letters, so guess by **word shape + sense**, and prefer a real word over a plausible-looking non-word:

- `kam prité me sa b e r` → `kam pritë me **sabër**` (patience) — not `me sa bé`. Ottoman loans are where OCR damage hides best; expect and recognise `sabër, çajre, hazër, kasavet, açik, qeder, teveqel, kismet, shyhret, marifet, erz, baft, hyqymet, kallabllek, meremet, jestek`.
- `i gjindet gajrja gjithgafes` / `Pare, gajre` → **`çajrja` / `çajre`**, keeping the `j`. I first "corrected" these to the standard `çarja`/`çare` reasoning the `j` was noise; the user reverted it. **A letter the OCR shows consistently in two separate places is in the print** — that repetition is evidence, not coincidence, even when the result isn't the dictionary word you expect.
- `tue true, permbrenda, at të ndeshun` → `tue **prû**` (carrying) — p↔t.
- `qi i a befi tue ngá` → `qi i a **behi**` (turned up) — h read as f.
- `edhe ’i g otérak í` → `edhe 'i **gotë rakí**` — OCR merges/splits across the space, not just within words.
- `Tasli nja dy jave` → `Tash`; `Eni naît` → `Eni naltë`; `si të puthte nji fugure` → `fugurë` (Geg for icon/figure, keep it).
- `A pé! A p é!` → `**Apë! Apë!**` — `apa`/`apë` = father (nominative `apa`, vocative `apë`), recurs constantly in the dream scene.
- `Nàinte qiellin me egërsim` → `Nâmte` (he cursed) — `in`→`m` plus the nasal.
- `nji ndrizè e gjatè rrezesh ishte ndè nè qiell` → `ishte ndê në qiell` (stretched/hung) — the same `ndê` as `me ndê teshat` (hang out the washing) two pages later. **A rare word usually recurs in the same story; search the file for it before treating it as noise.**
- `Arrìni kur po binte kumbona e dytè` → `Arrîni` (he arrived) — Geg `-ij` verbs take nasal `-îni` in the 3sg aorist, exactly like `hîni` from `hyj`. Same family: 1sg present `hŷj` (`qi u hŷj këtyne punve`).
- `nji klithem` / `nji krisem` → `nji klithmë` / `nji krismë` — OCR transposes the final `më` to `em`. The already-clean neighbouring page had `mbas krismës`, which is what proved it (16 corpus hits for `krism`, 4 for `klithm`).
- `me i pré drút shkurt` (to cut the wood short = get to the point) — corpus gives `me pré` 6× and `drû` 9× (Kanun), so `pré` stays acute and `drút`→`drût`.

**Vowel before `nd`/`mb` is nasal often enough to be a default.** `kâmbë, dhâmbë, trêmbë, vênd, mênd, kând, rând, mbrênda, përmbrêndëshëm` — so OCR `mà tè dèndun` → `mâ të dêndun` even though the corpus's only 2 hits are a plain `dendun` from an undiacriticked source. Flag it, but lean nasal.

The `-îni` aorist family (memory of `hîni`, `Arrîni`) extends to any `-ij` verb: `i a shtíni mënderen` → `shtîni` (from `shtij`). But **the file's own diacritics beat the family rule**: for `hyj` this print writes `hŷni`, not `hîni` (`i hÿni krymbi`, `u h$mi ndërmjet` — two independent y-diacritics), so a bare OCR `Sa hyni atje` normalises to `Sa hŷni atje`. Both halves held again in `kercimtarja`: OCR `gedhini` → **`gëdhîni`** (from `gëdhij`, "the day of return dawned"), and OCR `Tyrkina hyni` → **`Tyrkina hŷni`**.

Leave genuinely unresolved spots **exactly as the OCR has them** rather than inventing a word, and say so in the reply.

### Still-open flags by file

- **`miku.md`**: `hoq alititi me dorsë argjendi` (p. 118) · `kish vû roe se miqt mbajshin...` (p. 118) · `he s'nitofta Zâna!` (p. 119) · `gëzon proje` (p. 119) · `Priç të mirë` / `Ndiç, si kjeshe tue thânë` (pp. 119–120) · `u vritëshin mbas si` (p. 115) · `Feja kishte me kênë...` (p. 115).
- **`kercimtarja-e-dukagjinit.md`**: `se hê hê po qesin fletë` (p. 99) · `Mësente nji nga nji skâjet e shtrojës` (p. 104) · `u bâ deshir psim tërbim shpejtije` (p. 104) · `Oborrtarët u renduen rreth e rreth` (p. 103) · `Shatrat e Mbretit e çuen me zgjedhë` (p. 107) · `me përsjellësa u nis për Malsí` (p. 107) · `nji peshtah ari` (p. 107) · `guterr gjarpënues`, `hyrija malsore`, `jerevít`, `gjinikojshin`, `ersojshin`, `Mbëkâmbësit`, `vizava`, `kruetane` (no corpus hits at all).
- **`se-qofsh-pleqnofsh.md`**: `Përpjekjet mâ të censhme` (p. 92) · `si e falisun` (p. 90) · `mjafton nji pushkë e... tu mirë vofsh e qofsh!` (p. 93) · `e xirja emnin e atij` (p. 89) · `t'a ndali veten` (p. 95).
- **`gjaku.md`**: `e ngrehshin kah e mina` (p. 49) · `e vuni kfijin përpara` (p. 56) · `Ka ndeshë...` (p. 41).
- **`kanga-e-re.md`**: `Te Ilakât` (p. 72) · `Ele!?` / `Ele, më kallzó` (p. 73) · `nji hû porosi` (p. 73) · `mbushet unji me drandofille` (p. 79) · `nji gomën helmi` (p. 81) · `si automë` (p. 73).
- **`anderr-e-nji-mbasditje-vere.md`**: `me huj` · `Ämsimi` · `tufen qitë mbi krah` · `njinjishme` · `ndrydhun` (moderate confidence, per screenshot).
- **`kopshti.md`**: `gjallnije`, `urdhi`, `murrëm`, `kalldrâm`, `voglís` (left per print/image, zero corpus hits) · `shatorra` (kept, plausible plural agreement).
- **`kur-oret-lajmojne.md`**: `karathi` (p. 138) · `palamë` (p. 138) · `lînta` (p. 140) · `rrêjshëm` (p. 141).
- **`zana-e-fundme.md`**: `notarak`, `kërcnim`, `sodumë`, `eburi`, `farfurishme`, `zabel` (newly confirmed forms, no corpus support, left as printed) · `grát` (acute, kept — minority spelling + image agreement).
- **`ke-tre-lisat.md`**: `stice` (p. 159) · `krés` (p. 162) · `sqoll` (p. 168) · `dashsit` (p. 167) · `shtrumes` (p. 171) · `print` (p. 169, probably "parents", too thin to force) · `Lâmetênzonë!` (p. 174).
- **`diloca.md`**: `e ndën o i'ï krejt` and `Vc.ni` (ch. XV, kept exactly as raw dump) · `lânduer`, `abolla`, `zbémit` (sense/spelling unconfirmed, kept per OCR's own diacritics) · `u shtrive` (moderate confidence) · `çudnue` (letter substitution high-confidence, word itself unconfirmed).

Resolved-but-worth-recording, `kanga-e-re.md`: `partinë` (blow) · `hû` (pole) · `çinija` (dishes) · `çamçakëz` (bow rosin, Turkish *çamsakızı*) · `dyzen` (tune, Turkish *düzen*) · `gemb` (sprig) · `kore/korit` (shame) · `jeremi` (mad) · `açik`, `kasavet`, `nafakë`, `vesvese`, `maraklije`, `shyreçme` (Ottoman loans). ~~`nji trup të vergjilët`~~ resolved via `kercimtarja`.

From `kercimtarja-e-dukagjinit.md`: **`rrëmaktë` = left** (Koliqi's own `n'anën e rrëmaktë`) · `leçit-` (proclaim, plain `e`) · `shé` (mountain torrent, 8 hits) · `hjedhta` (tall/slender) · `plogtí`/`plogtín` (sluggishness, accented) · `hollake` (slender) · `tekembramja` (at long last) · `selije` (throne seat, also Fishta) · `apotheozë` (also Migjeni) · `jonë` (tune) · `hyrí` (houri) · `pashmangët` (gold slippers) · `mahrama`, `xhamadan`, `dimij`, `kasnec`, `burijë` (Ottoman/costume vocabulary) · `harkate` (arched/curved sleeves).

From `miku.md`: **`behi`** = turned up · `bzâjtë` = to call out to · `prozhmi` · `opânga` (rawhide sandals) · `krraba` (wall-pegs) · `dorsë` (hilt) · `fyshek`, `hatër`, `hejr`, `haili`, `kasavet`, `sabër`, `marifet`, `oxhak`, `togerllek`, `allafranga`, `çarapë` (loans) · `me ndore` = under one's protection · `me i a lâ borxhin` = to pay off a debt · `mesŷj` = to make for/turn to · `kori` = shame.

Two agreement/gender splits worth keeping: **`mëdhâj` (masc. pl., nasal) vs `mëdhá` (fem. pl., long)** — `sŷt e zez të mëdhâj` but `n'arkët e mëdhá`, both screenshot-confirmed. And `zhdërvjellti` is **plain in the nominative** while the accusative is accented `pazhdërvjelltín` / `zhdërvjelltín`.

**Narrow to the author even when the corpus-wide count looks decisive — the Tosk authors swamp it.** Corpus-wide `kuvend-` is 27 plain to 2 nasal; restricted to Koliqi it is **2 `kuvênd` to 0 plain** (every plain hit is Sami/Naim). Same shape for `gjên` (Geg authors 5 : 0 nasal; the 9 `gjën` are all Sami/Naim), `shtrêjt` (Koliqi 1 : 0), and `gjymsë` vs `gjymës` (corpus-wide 44:20:3 looks decisive but Koliqi alone is `gjymsë` 18:0 — same swamping pattern). Filter by *dialect*, not just by file count.

From `miku.md`, plain by the same test — don't accent them: **`zotni`/`zotnin`/`zotnis`** (121 : 8), **`shtëpi`** bare nominative (120 : 7), **`vetmit`** (20 plain `vetmi`, 3 plain `vetmit`), **`gajle`** (Turkish *gaile*, keeps its `g`), `rrenimin`, `hollsin`, `errsi`. But the *oblique* `shtëpís`/`shtëpis` is a genuine 12 : 14 coin-flip in Koliqi, so follow the OCR slot by slot. Same slot-by-slot pattern confirmed again in `ke-tre-lisat.md` (9 plain `shtëpi(n)/(s)`, 1 accented `shtëpín`) and for `shpejtí` vs plain `shpejti` (13 plain : 3 accented even in Koliqi — the abstract-í-noun rule is a strong default, not an override of a corpus majority).

**`kufî` is nasal.** Three separate screenshot instances in `miku.md` settle it; retro-confirmed `gjith kufîjt` in `kercimtarja`, and again 8:1 in `ke-tre-lisat.md`'s `kufîni`.

`nên` beats `nën` 7 : 3 in Koliqi. `ngrî` is nasal in most slots (`ngrîta`, `ngrîmun n'ar`) **but not fixed** — see the `zana-e-fundme.md` note below where `ngrí` (acute) appears once, slot-dependent like `atë`/`atê`. `ruente`, `qeti`, `mirsi`, `njomsi`, `rândësi`, `kufijt`, `mbi` are plain in Koliqi.

## Orthography to preserve (not errors)

- **â/ê/î/û/ŷ = nasal vowels**: `bâ, thânë, nânë, zâ, kâmbë, mêndje, vênë, vêndit, nên, tê, êmnit, kênke, shtrîhet, ngrî, hî, vû, sŷ, dŷ, mâ, â` (=is), `âsht`.
- **á/í/ó = long, non-nasal**: `pá` (to see), `rá`, `dá`, and abstract nouns in **-í**: `madhní, krení, famullís, mjeshtrís, Malsís, granís, njerzín, çudín, bukurín, fuqí, vetmín, mengjí, shpejtín, dhuntít, heshtít, mshefsín, ndiesít`. Vocatives keep `ó`: `djal-ó`, `bir-ó`.
- Geg forms to leave alone: `qi` (not *që*), `nji`, `un`, `tue`, `mbas`, `mbandej`, `me + participle` infinitive, `-ue` verbs, `kenë`, `kje`, `s'` + verb.
- Guillemets `« »` for quoted speech; em-dash `—` opens spoken lines.

## The nasal root carries through the whole word family

`mênd-` (mind) is nasal in **every** derivative, including the ones a screenshot pass reads as clean: `mêndja, mêndsh, mêndojë, mêndon, mêndshëm, mênd, mêndue, mêndim, mênderë, mêndimet, mêndimesh, mêndësi, mêndshëme, mêndoi, mêndojshem, mêndonte, mêndim`, even the compound `mêndesquet` (clever, mênd + squet). Same for `Gjêndarmërí / Gjêndarmerí / gjêndarmerije` — nasal `ê` in every case form and spelling variant, even where the OCR shows a clean `e` or an `ë`. And `vênd`/`vêndim(eve)` — the nasal extends to this derivative too.

This is the one place the "don't over-apply, leave a clean `e` alone" rule does *not* hold: if the root is nasal, the `e` in it is OCR damage no matter how clean it looks, and this holds **even inside a screenshot-transcribed page** (`kopshti.md`'s `mêndimet`, `diloca.md`'s five clean-looking derivatives) and **even inside compounds nobody would think to check**. Sweep at the end with `grep -o "\b[Mm]end[a-zë]*" file.md` and `grep -o "[Gg]j[eë]ndarm[a-zë]*"` and `grep -o "\bv[eë]nd[a-zë]*"` — all should come back empty. **Also sweep your own cleaned draft, not just the raw OCR** — `diloca.md`'s ch. XV had a nasal root left plain (`kambët` for `kâmbë`) purely because the raw glyph was an ambiguous `é`; only re-grepping the draft caught it.

Don't confuse this root with `mëndershëm` / `mëndere` (dread, fearsome) or `mëndafsh` (silk) — different lexemes, genuinely `ë`, leave them.

**Exception inside the vênd/mend family: `ndër mend` (come to mind) stays plain** — 25 plain hits to 8 nasal corpus-wide, the same kind of carve-out as `sênd`.

## On a raw page, a plain `e` proves nothing

The badly-OCR'd pages collapse the vowel system: **both `ë` and `ê` come out as `è`/`é`**, and sometimes the diacritic is dropped outright. So on a raw page:

- `è`/`é` = either ë or ê → decide from the root (`mèndimeve`→`mêndimeve`, `zèmrès`→`zêmrës`, `nè`→`në`, `m'a lèn`→`lên`).
- a plain `e` is *weak* evidence for a plain `e`, not proof. Check the same word on this file's own clean pages, then the corpus.

The same page can use `è` and `é` for ë interchangeably, so don't build a per-page rule out of one line.

Watch for lexemes that look like a nasal root but aren't: `mëndafsh` (silk) is **not** `mênd-` (mind), so OCR `méndafshi` → `mëndafshi`.

## Judgement calls that recur

**`sênd` is not a nasal root to sweep.** The print itself varies. Contrast `mênd-`, which really is nasal everywhere.

**`dŷ` vs `dy`:** the repo has both and the print does too. Use `dŷ` where the OCR shows any y-diacritic and plain `dy` where it doesn't; don't normalise one into the other.

**The long `-í` applies to every case form.** If a noun is abstract and ends in -i, accent it in every slot — but check the corpus first (see `gjini`/`shpejtí` exceptions above).

**Do not over-apply the `e` → `ë` rule.** Convert only where the OCR glyph was visibly a mangled ë (`è S 6 g ß`). Where the OCR already shows a clean `e`, leave it: confirmed `endire` (not *ëndirë*), `vrojshem` (not *vrojshëm*), `flej`, `gjej`. Guessing "it should be ë" is the single most common way to damage the text.

**Do not relocate a vowel to match standard Albanian.** OCR `rrebet` is `rrebët`, not *rrebtë*.

**Do not normalise Geg adjective agreement.** `curilat e artë` is correct — don't "fix" it to *e arta*.

**Do not break long sentences.** Comma splices are normal Koliqi.
- Hyphenated line-end breaks must be re-merged: `gëzho-\njën` → `gëzhojën`.
- Compounds printed with spaced hyphens close up: `fytyrë - bardha` → `fytyrë-bardha`, `buzë - qeshun` → `buzë-qeshun`.
- Repo convention: **no space after apostrophe** (`t'egër`, `s'mund`, `m'u`, `n'at`), though the print sets `t’ egër`. Repo is ~2:1 in favour of no-space. Exception: `an' e kând` is a genuine elision, don't close it up — and the corpus itself is genuinely split on this one (`miku.md`/`se-qofsh-pleqnofsh.md` keep the space, `ke-tre-lisat.md` closes it), so it isn't 100:0 settled either way.

## Words/phrases confirmed (verified against the print, don't re-flag)

`nji tutë e paçansueshme` · `nji aft i erândëshëm` · `prej vesës` · `kaçube … kaçash në lulzim` · `mesŷni me pyetje` · `Animirë` · `Ep e merr` · `Don Marku prani`.

From *Se qofsh, pleqnofsh*: `dangë` = brand/stain · `prroskë` = gully · `murana` = boundary cairn, `dromeve` = paths · `ndŷtë` (accented, follows the `dŷ` rule) · `mënderen` = dread · `çeli gojën` (idiom) · `ke vrá` · `squet` = ablest · `pshtillte` = rolled (cigarettes) · `erz`, `açikshëm`, `hall`, `tagri`, `pretezë`, `hali`, `sarkazëm` (loans). Also **`orokut`/`orokun`/`oroku`** = appointed day/term (cross-file confirmed with `kur-oret-lajmojne.md`).

From *Gjaku*: **`uhá` = Geg for standard `hua` (loan)**, literal and figurative. Also `të vokët` (small), `voksi foleje`, `orë-premi` (fate-cut), `galuc` (squatting, *not* `çaluc`), `dritë-pastë` (of the dead), `gjak-hupët`, `nëmostjetër`, `të hîmen e të dalmen`, `çakçirë`, `sallnisë`, `beçi` (turned up).

From `anderr-e-nji-mbasditje-vere.md`: **`£`/`Q ilja` = `Çilja`** (proper name, not a common noun) · `zojushe` is plain `zojusha` · **`sallman` / `lagjuhera`** = bridal ceremonial headdress and gold ornaments (cross-file confirmed 3× total with `kopshti.md`) · `vênd` (place) nasal 23:5 · `çeluna` (open/opened, resolves `gëluna`/`geluna`/`qeiuna` garbles, confirmed via `nusja-e-mrekullueshme.md`) · `vûni`/`vûme` (placed, nasal 12:5) · `tanuz` (a hat/headwear, Fishta-confirmed) · `prani`/`prâni` genuinely mixed per-file (plain in `nusja-e-mrekullueshme.md`, nasal in `zana-e-fundme.md`) · `habitun` beats bare `habitë` · `axhë` (vocative of `axha`, uncle — corrected from a wrong tag-question guess) · **`atë`/`atê` varies by slot**, same pattern as `kêtê`/`kët` · `né`/`ne` (pronoun "us/we") takes **acute é**, confirmed independently in this file, `kur-oret-lajmojne.md`, and `ke-tre-lisat.md` (three files, settled feature of Koliqi's orthography) · `hali` (carpet) genuinely mixed accent-state even within one page · `farë`, `çardak` (not `gardak`), `ç'nipa`, `njân'anë` (nasal), `mbrênda`/`mbrêndë` (nasal), `parzëm`, `kurrkênd`, `përtrîni`, `âmbëlsí`/`âmbëlsín`, `bukurí`/`melodí` (all image-confirmed).

From `kopshti.md`: **`këmishë`** (10:1 corpus, a clean-looking-page trap like `forçat`→`forcat`) · `tê` (nasal, bare 3rd-person oblique pronoun, second data point after `atë`/`atê`) · `mêndimet` (nasal, family sweep applies even off a screenshot) · `sŷni`/`Sŷni` (nasal, minority 5:9 but image-confirmed) · `branavekë`, `dupa`, `harkate` (costume vocabulary, cross-file confirmed) · `fëmijnís` (accented, in-file consistency over one screenshot read) vs `fëmijnore`/`fëmijnuer` (different lexemes, stay plain).

From `kur-oret-lajmojne.md`: `terratisën` (his eyes glazed, cross-file with `nusja-e-mrekullueshme.md`) · `ushtrí` (long í, matches Fishta/Mjeda) · `kênë` vs `kenë` (genuine corpus coin-flip, not settled — Fishta plain, Kanun nasal).

From `zana-e-fundme.md`: closes the `prani`/`prâni` split as genuinely per-file/per-slot (this file: nasal) · a three-way OCR/vision disagreement (`Jeranej`/`Dërgnej`/unclear) resolved to **`Dridhej`** via corpus (15 hits) + in-file recurring imagery of trembling — when repeated vision passes on one spot disagree, corpus-plus-in-file-vocabulary is the tie-breaker, not majority vote · `bâni` (70:2) and `vërejtje` (15:2) settled by corpus over an ambiguous image read · re-reading the same image at full resolution overturned a first-pass guess twice (`shtŷni`→`shtyni`, kept `shitojë` verbatim despite looking grammatically odd, per preserve-the-dialect rule).

From `ke-tre-lisat.md`: `vrá` (to kill) fixed at long acute everywhere in the book, never nasal/grave, even when a single file shows `vrâ`/`vrà`/`vrá` in different slots — but **`vranë`** (3pl aorist "they killed") takes plain `ë`, the fixed-acute rule is about the citation form only, not every conjugation. `dá` (to part) joins `pá, rá, vrá` on the long-á list, not nasal `dâ` (per "à is not always â"). `Uli` (she lowered) was mis-split by OCR into `U li` — same class as `miku.md`'s `tue 11 zgjue`. A stray duplicate section-numeral (`II` appearing twice, once misplaced) is a real OCR artifact — check the paragraph on either side before trusting a heading-shaped token. `gjallní` accented (2:0). `haré`/`hareja` split — oblique takes accent, definite-nominative doesn't.

From `diloca.md`: **`pëvetë`** (to petition, 4:0 clean, don't confuse with `pyetë`) · **`miset`** (obscure but real, 1 corroborating hit) · **`trût`** (brains, nasal per OCR's own `ü` and 10:6 split) · a genuine 2-page content gap (pp. 190–191, missing end of ch. XII and all of ch. XIII) marked with a user-approved italic Albanian editorial note: `*[Faqet 190–191 mungojnë nga kopja e shqyrtueme: mungon vazhdimi i kreut XII dhe krejt kreu XIII.]*` — reuse this phrasing/placement convention if another file surfaces a similar hole; **ask the user before deciding how to mark a genuine multi-page gap**, don't silently join the seam.

## Final verification (run all of these)

```
grep -o "[^ -~]" file.md | sort | uniq -c          # only ë â ê ç í ŷ á û é î ó ú « » — Â Ç
grep -o "\b[Mm]end[a-zë]*" file.md                 # nasal-root sweeps: must be empty
grep -o "\bv[eë]nd[a-zë]*" file.md                 # ditto (vênd-)
grep -n -- "-$\|[’] \| [;:!?»]\|« " file.md        # line-end hyphens, apostrophe-space, French spacing
grep -n "  \|[0-9]\|HIJA\|MALEVE" file.md          # double spaces, stray page numbers, running headers
grep -o "[a-zA-Zë]*é[a-zA-Zë]*" file.md | sort -u  # audit every é/á/í/î/û/ŷ word individually
grep -oE "\b[kK][eë]t[eë]?\b" file.md | sort | uniq -c   # determiners only; a bare kete = missed kêtê
```

A healthy end-state inventory for a ~3,200-word Koliqi story looks like `« » Â Ç á â ç é ê ë í î û ŷ —` with `é` down to a handful of real words (`bilé, bré, dhé, mué, pré`) and `á` to `dá, grásh, pá, qá, rá, vrá`. If `é` is still in the dozens, the `è/é → ë|ê` pass is unfinished.

The print sets `:` `;` `!` `?` with a French space before it (`Toni bàni :`, `bekueme I`) — close all of those up. Word-by-word audit of the accented vowels is what catches the last few: it's how `notât`→`notat` (a loanword, no nasal) and the leftover `sÿ`→`sŷ` turned up.

Content check: the page-header lines are the only thing deleted, so body word count should land near `(text lines) × ~8.5`. Spot-grep one distinctive token per printed page to prove nothing was dropped while joining paragraphs.

## Recovering lost paragraph breaks

macOS OCR keeps the printed line breaks but drops paragraph indentation. The text is justified, so **a short line marks a paragraph end**. Measure line lengths (`awk '{print length($0)}'`); full lines run ~48–65 chars, paragraph-final lines are typically <45. Narrator interjections (`Don Marku vijoi:`, `Prifti u ndalue…`) are their own paragraphs even when the preceding line is full width. Then join each paragraph to one long line — front matter has `respectLineBreaks: false`.

## House formatting

Roman-numeral sections → `## I`, `## II`, not the `<center>` block some files use.

**An unnumbered `* * *` scene break stays `* * *`** — keep the print's own divider, just **dedent it to column 0**. The OCR indents it ~12 spaces, and >3 spaces of indent turns it into a fenced code block; at column 0 it is a perfectly ordinary CommonMark thematic break. Don't "fix" it to `---` (no mid-file `---` exists anywhere in `autore/` — every hit is a frontmatter close) and don't invent `## I`/`## II` around it. This is the one legitimate hit in the markdown-residue grep, so expect it and don't chase it.

**The output must be valid markdown, and the OCR actively produces invalid markdown.** Chapter-opening drop caps are the worst offender: a two-line initial can OCR into a blockquote (`>`) plus a bullet (`*`) that render as structure and silently swallow the first sentence of the story. **Check the opening paragraph of every section for `>` / `*` / `_` / `#` residue**, and finish with:

```
grep -nE '^[[:space:]]*[>*_#|]|\*|_|\\' file.md     # only the ## headings should hit
```

The drop cap doesn't *always* break: in `kercimtarja-e-dukagjinit.md` the two-line `P` of `Puc` came out as plain text with a hanging indent and no markdown residue at all. Still run the grep — just don't go hunting for a `>` that isn't there.

A page-top line can carry the same ~6-space indent as a real paragraph start, so **indentation alone doesn't mark a paragraph** — check sentence continuity across the header. In `kercimtarja` p. 104 opened with an indented line that was actually the tail of the previous page's last word.

Finish by walking the page breaks explicitly (last words of p. N + first words of p. N+1) and by spot-grepping one distinctive token per printed page. Also confirm the file is NFC and free of combining marks (`python3 -c "...unicodedata.normalize('NFC',t)==t"`); macOS pasteboard text can arrive decomposed and the diacritic greps then silently miss.

## Full-screenshot-coverage files

When every page of a file has a screenshot, transcribe the whole file directly from the images rather than rule-cleaning the OCR (per `geg-OCR-instructions.md` step 3) — confirmed fast and reliable across `kur-oret-lajmojne.md`, `kopshti.md`, `zana-e-fundme.md`, and `ke-tre-lisat.md`. Even then, still run the nasal-root family sweeps on the transcribed text — a screenshot read can still miss a nasal `mênd-`/`vênd-` derivative that looks clean at a glance.
