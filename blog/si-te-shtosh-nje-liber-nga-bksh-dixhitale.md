---
title: Si të shtosh një libër nga BKSH Dixhitale
subtitle: Udhëzues teknik, nga një URL e bibliotekës te një libër i lexueshëm për $12
author: Editori
date: 2026-08-02
tags: liber, fletoret, programim
thumbnail:
published: true
---

Bibliotekat dixhitale e fshehin mirë një gjë: largësinë mes "e kemi
skanuar" dhe "mund ta lexosh". Biblioteka Kombëtare e Shqipërisë ka
skanuar mjaft vepra në domen publik[^1] dhe i ofron nëpërmjet
[bibliotekadigjitale.bksh.al](https://bibliotekadigjitale.bksh.al/) —
Biblioteka Kombëtare Dixhitale, më poshtë **BKD**. Por "i ofron" këtu
do të thotë: një shfletues me miniatura, jo tekst. Nëse s'e nxjerr
vetë tekstin, libri mbetet publik dhe praktikisht i palexueshëm.

Nëpërmjet këtij shkrimi, dokumentojmë procesin nëpermjet të cilit 
shndërrojmë nje tufë imazhesh në tekst. Shembulli që
përdorim gjatë gjithë kohës është **Kryengritja Shqiptare** e Mihal
Gramenos (1925, 214 faqe), tashmë i
[lexueshëm këtu](/grameno/kryengritja-e-shqiptareve/). Grameno e luftoi këtë histori para se ta shkruante. Kryengritës me
çetën e Çerçiz Topullit, ai e rrëfen lirinë e Shqipërisë nga
brenda — me barut, uri e besë. Një perspektivë e rrallë: luftëtari
që merr penën.

Në lidhje me metodologjinë, libri nuk është i veçantë. Çdo libër nga katalogu i BKD mund t'i nënshtrohet të njëjtit proces. 

Për parimet e përgjithshme të IIIF-it dhe të Kopjuesit kemi shkruar më
parë[^2]; këtu merremi vetëm me procesin.

### 0. Çfarë të duhet para se të fillosh

Nuk të duhet të njohësh IIIF-in, as arkitekturën e pipeline-it. Të
duhet:

- **Python 3** dhe **Node.js**.
- **ImageMagick** (komanda `magick`) — për kopertinën dhe portretin e
  autorit.
- **Akses programatik te një API i nje modeli (LLM) që lexon imazhe.** Kodi ynë
  përdor SDK-në e Anthropic-ut; te seksioni 4 tregojmë saktësisht se
  çfarë duhet zëvendësuar nëse përdor një tjetër.

```sh
git clone https://github.com/Fletoret/website
cd website/data-pipeline
python3 -m venv venv
venv/bin/pip install -r requirements.txt
export ANTHROPIC_API_KEY=...
```

Për dy skriptet e imazheve për krijimin e kopertinës dhe fotos se autorit, nga rrënja e projektit: `npm install` (kjo
shkarkon edhe Chromium-in për Playwright; nëse jo, `npx playwright
install chromium`).

Një kufizim që vlen ta dish që tani: paketa `ocrmac`, që përdoret për
OCR-in draft, mbështillet mbi kuadrin Vision të Apple-it dhe punon
vetëm në macOS. Jashtë macOS-it ai kalim nuk është i disponueshëm —
shto `--skip-ocr` dhe gjithçka tjetër funksionon njësoj.

### 1. Gjej librin dhe nxirr manifestin

Faqja e librit tek BKD s'të jep kurrë një URL të pastër. Të jep diçka
të tillë:

```
https://bibliotekadigjitale.bksh.al/?view=ThumbnailsView&manifest=https%3A%2F%2Fbibliotekadigjitale.bksh.al%2Fiiif%2FManifester%2FIIIF%2Flibra1%21HASH8b45%2194a869fc.dir&canvas=...
```

E shëmtuar, plot `%2F` dhe `%3A`, por brenda saj fshihet gjithçka që
na duhet: adresa e manifestit IIIF (International Image
Interoperability Framework) — dokumenti që rendit çdo faqe të librit
si imazh, në rendin e duhur, bashkë me titullin, autorin dhe vitin.
Nuk na duhet ta analizojmë vetë këtë URL; `bksh.py` e pranon ashtu siç
është, ose vetëm identifikuesin e manifestit nëse e ke tashmë të
veçuar.

Kjo është gjëja e vetme që kopjohet me dorë. Gjithçka pas kësaj është
komandë.

### 2. Pesë hapa

`data-pipeline/bksh.py` e ndan punën në pesë hapa, secili i
ekzekutueshëm më vete:

| Hapi | Komanda | Prodhon |
|---|---|---|
| Regjistrim | `add <url>` | një zë në `books.json` |
| Shkarkim | `fetch <slug>` | `work/<slug>/images/*.jpg`, në rezolucionin origjinal të skanimit |
| OCR draft | `ocr <slug>` | `../ocr/<slug>.json` — ushqen redaktorin tek `/ocr/<slug>` |
| Transkriptim | `transcribe <slug>` | `work/<slug>/pages/page-NNNN.json` |
| Botim | `publish <slug>` | `../autore/<autor>/<libër>/*.md` |

`run` është parazgjedhja dhe i kryen të pesta njëherësh. Një argument
i parë që nuk është nënkomandë trajtohet si `run`, ndaj mjafton:

```sh
venv/bin/python bksh.py 'https://bibliotekadigjitale.bksh.al/?view=ThumbnailsView&manifest=...'
```

Çdo hap mban mend ku ka mbetur. Nëse shkarkimi ndërpritet te faqja
80, e rinis të njëjtën komandë dhe vazhdon me faqet që s'i ka bërë.
Kjo s'është elegancë e panevojshme, është kusht: një libër me 200+
faqe do të ndërpritet dikur, dhe rifillimi nga zero e bën çmimin e çdo
ndërprerjeje të "papranueshëm".

Për të parë ku je:

```sh
venv/bin/python bksh.py list
```

që liston çdo libër të regjistruar me numrin e skanimeve të shkarkuara
dhe të faqeve të transkriptuara.

Flamujt që vlejnë gjatë punës:

- `--pages 1-20,45` kufizon çdo fazë te një pjesë e librit — i
  domosdoshëm kur po rregullon prompt-in dhe s'do të paguash për 200
  faqe që të mësosh nëse ndryshimi funksionoi.
- `--concurrency` (parazgjedhje 4) kontrollon sa faqe transkriptohen
  njëkohësisht.
- `--effort` (`low`, `medium`, `high`, `xhigh`, `max`) kontrollon sa
  "mendon" modeli për secilën faqe.
- `--force` rishkarkon dhe ritranskripton atë që ekziston tashmë; pa
  të, faza kalon përtej asaj që e ka bërë.
- `--skip-ocr` / `--skip-transcribe` heqin nga `run` kalimin që s'të
  duhet.
- `--dry-run` te `publish` të tregon çfarë do të shkruhej, pa e
  shkruar.

### 3. Regjistri: `books.json`

`books.json` është regjistri qendror — slug, titull, identifikuesi i
manifestit IIIF, dhe ku duhet të botohet libri:

```json
{
  "slug": "kryengritja-e-shqiptareve",
  "title": "Kryengritja Shqiptare",
  "manifest": "libra1!HASH8b45!94a869fc.dir",
  "author": "Grameno, Mihal",
  "year": "1925",
  "pages": 214,
  "author_folder": "grameno",
  "book_folder": "kryengritja-e-shqiptareve",
  "author_name": "Mihal Grameno"
}
```

Ta ndryshosh me dorë është krejt në rregull; `bksh.py` i plotëson
boshllëqet, por s'e mbishkruan asnjëherë atë që ke vendosur ti.
`author_folder` dhe `book_folder` janë destinacioni i botimit nën
`autore/`, ndërsa `author_name` është emri që shkruhet në ballinën e
çdo kapitulli. Pa to, pipeline-i ndalet pas transkriptimit dhe të
njofton — të vendosësh ku i përket një libër s'është diçka që duhet ta
hamendësojë vetë:

```sh
venv/bin/python bksh.py publish kryengritja-e-shqiptareve \
    --author grameno --author-name 'Mihal Grameno' --register
```

`--register` shton një zë fillestar te `autore/index.json`. Mbetet ti
të plotësosh zhanrin, abstraktin dhe rrugën e kopertinës. Zërin e një
**autori** të ri nuk e shpik kurrë vetë — ai kërkon biografi dhe
portret, dhe ato s'i nxjerr asnjë manifest IIIF.

### 4. Dy kalime transkriptimi, jo një

Pipeline-i lexon të njëjtat imazhe dy herë, sepse u përgjigjet dy
pyetjeve të ndryshme.

**OCR-i draft** (Apple Vision, nëpërmjet `ocrmac`) është falas dhe i
menjëhershëm. Prodhon tekstin rresht për rresht që redaktori vullnetar
sheh krah skanimit tek `/ocr/<slug>` — mjaftueshëm i saktë sa të
orientojë syrin, jo aq sa të botohet.

**Kalimi me model** është më i ngadaltë, ka kosto, dhe është ai që
botojmë. Për secilën faqe dërgohet imazhi bashkë me një system prompt
(`prompts/transcribe.md`: rregullat drejtshkrimore, konventat e
strukturës, udhëzimi për të mos e modernizuar tekstin), dhe kërkohet
jo tekst i lirë, por një objekt sipas një skeme:

| Fusha | Përmban |
|---|---|
| `printed_page` | numri i faqes siç është shtypur |
| `kind` | `body`, `front-matter`, `back-matter`, `toc`, `plate`, `blank` |
| `starts_piece` | a nis një copë e re me titull në këtë faqe |
| `piece_title` | titulli i asaj cope |
| `form` | `verse`, `prose`, `mixed`, `none` |
| `text` | transkriptimi, si markdown |
| `uncertain` | shënime për çdo gjë që s'u lexua me siguri |

Përgjigjja e strukturuar është ajo që i lejon `assemble.py` të gjejë
kufijtë e kapitujve pa hamendësuar mbi titujt. Çdo faqe shkruhet veç,
te `work/<slug>/pages/page-NNNN.json`, që një ekzekutim i ndërprerë të
vazhdojë falas dhe një faqe e keqe të ribëhet vetëm ajo.

Dallimi mes dy kalimeve nuk është vetëm saktësia, është *lloji* i
gabimit. OCR-i klasik i ngatërron sistematikisht `â`, `ê`, `î` me `a`,
`e`, `i` — dhe në gegnishten e shkruar para njëqind vjetësh kjo
ndryshon vetë fjalën, jo drejtshkrimin e saj. Një gabim i tillë, i
botuar, është i padallueshëm nga teksti i saktë pa e krahasuar rresht
për rresht me skanimin. Prandaj kalimi i lirë mbetet mjet orientimi,
dhe kurrë tekst përfundimtar.

**Nëse përdor një API tjetër.** I vetmi file që di diçka për modelin
është `pipeline/transcribe.py`: aty janë konstantja `MODEL`, skema
`PAGE_SCHEMA` e tabelës më sipër, dhe thirrja që e shënon system
prompt-in për ruajtje në cache. Pjesa tjetër e pipeline-it nuk di
asgjë tjetër veç faktit që çdo faqe kthen një objekt me ato fusha.
Zëvendëso atë thirrje me API-në tënde — mjafton të lexojë imazhe dhe
të kthejë JSON sipas skemës — dhe hapat e tjerë nuk e vënë re
ndryshimin.

Dy hollësi që ia vlejnë sido që të jetë modeli: system prompt-i mbahet
në cache, dhe faqja e parë transkriptohet e vetme, që pjesa tjetër ta
lexojë atë cache në vend që secila ta shkruajë kopjen e vet. Dhe nëse
transkriptimet dalin gabim në një mënyrë të përsëritur, rregullo
`prompts/transcribe.md`, jo rezultatin: të ndreqësh rezultatin është punë
që përsëritet për çdo libër, të ndreqësh prompt-in është punë që bëhet
një herë.

### 5. Nga faqet te kapitujt

`assemble.py` i ndan kapitujt sipas flamurit `starts_piece`. Bashkimi
i faqeve është mekanik, jo interpretativ: një vizë në fund të faqes
mbyll një fjalë të ndarë; një faqe që përfundon në mes të fjalisë
bashkohet me hapësirë (prozë) ose me rresht të ri (vargje), sipas
`form`-it mbizotërues; çdo gjë tjetër merr ndarje paragrafi.
Parathëniet, tabelat e përmbajtjes dhe kolofonët kapërcehen, veç nëse
jep `--include-front-matter`.

`work/<slug>/chapters.json` mban shënim se cilat faqe shkuan në cilin
file dhe çdo vend ku transkriptuesi shënoi pasiguri. Ky është
dokumenti i parë që lexon redaktori, jo teksti i botuar.

### 6. Kopertina dhe portreti i autorit

**Radha ka rëndësi këtu.** Të dy skriptet e nxjerrin rrugën e daljes
nga fusha `thumbnail` përkatëse te `autore/index.json`, dhe dalin me
gabim nëse ajo mungon. Pra plotëso `thumbnail` te zëri i librit dhe te
zëri i autorit para se t'i ekzekutosh — p.sh.
`/images/covers/kryengritja-e-shqiptareve.avif` dhe
`/images/mihal-grameno.avif`.

Kopertina nuk gjenerohet nga ndonjë algoritëm i ri grafik. Gjenerohet
duke i thënë Playwright-it të hapë faqen tonë ekzistuese `/kopertina`
— të njëjtën që përdor një njeri me dorë — ta plotësojë me titull,
autor, temë e paletë, dhe të bëjë një screenshot:

```sh
npm run cover -- grameno/kryengritja-e-shqiptareve \
    --theme vintage --palette burgundy --font alegreyaSC
```

Argumenti i parë duhet të përputhet me fushën `folder` të librit.
Rezultati shkruhet si `.avif` dhe `.webp` te rruga e `thumbnail`-it.
Përfitimi i kësaj mënyre s'është vetëm shpejtësia — është që rezultati
vjen nga *e njëjta* komponentë Svelte që përdor njeriu, jo nga një
rikrijim i saj që rrezikon të dalë ndryshe.

Portreti i autorit ndjek të njëjtin parim, me një URL burimi:

```sh
npm run author-image -- grameno https://.../mihal-grameno.jpg
```

Kjo e shkarkon foton, e drejton sipas orientimit të regjistruar në
EXIF, i ndryshon përmasat (parazgjedhje: 1024px ana më e gjatë, pa e
deformuar), dhe e ruan po ashtu si `.avif` dhe `.webp`. Zgjidh një
foto që është vërtet në domen publik — për autorët që na interesojnë,
kjo zakonisht nuk është problem.

### 7. Çfarë mbetet për njeriun

Asgjë këtu nuk vendos vetë që një libër është gati:
`publishedFletoret` mbetet `false` derisa ta ndryshojë dikush.
Rezultati i pipeline-it është draft i mirë, jo tekst përfundimtar.
Shënimet `uncertain` janë ku fillon leximi i redaktorit, dhe kufijtë e
kapitujve me titujt e tyre — që vijnë nga një vendim i marrë faqe për
faqe — vlen të kalohen edhe një herë me sy. Faqet që duken "të pastra"
nuk janë garanci: ato thjesht e fshehin gabimin më mirë se faqet me
njolla të dukshme.

### 8. Fatura

Sesioni i Claude Code që bashkoi këto pjesë — përgatiti librin për
botim dhe shkroi këtë udhëzues — kushtoi kaq:

| Zëri | Vlera |
|---|---|
| Kosto totale | **$11.98** |
| Kohë API | 34 min 29 sek |
| claude-haiku-4-5 | 25.0k input · 1.0k output · 2 kërkime web — $0.05 |
| claude-sonnet-5 | 7.5k input · 136.0k output · 23.2M cache read · 779.0k cache write — $11.93 |

Pjesa dërrmuese e këtyre $11.98-ve nuk shkoi për të shkruar kod, por
për të nxjerrë transkriptimin e saktë — për të lexuar skanime,
transkriptime dhe rezultate, dhe për t'i kontrolluar. Ka gjasa që kjo
pjesë e punës të bëhet edhe më lirë me një model më të vogël.

### Përmbledhje

1. Gjej librin tek
   [bibliotekadigjitale.bksh.al](https://bibliotekadigjitale.bksh.al/)
   dhe sigurohu që autori ka vdekur para më shumë se 70 vjetësh[^1].
2. Kopjo URL-në e shfletuesit (atë me `manifest=...` brenda).
3. `venv/bin/python bksh.py '<url>'` — shkarkon, bën OCR-in draft dhe
   transkriptimin. Jashtë macOS-it, shto `--skip-ocr`.
4. Cakto destinacionin: `venv/bin/python bksh.py publish <slug>
   --author <folder> --author-name '<Emri>' --register`.
5. Plotëso `thumbnail` te `autore/index.json`, pastaj `npm run cover
   -- <folder>/<libri>` dhe `npm run author-image -- <folder> <url e
   fotos>`.
6. Lexo `work/<slug>/chapters.json` dhe shënimet `uncertain`,
   krahasuar me skanimet.
7. Ndryshoje `publishedFletoret` në `true` vetëm kur je bindur nga
   leximi, jo kur je lodhur nga pritja.

### Dërgoje te Fletoret

Nëse e ekzekuton këtë mbi librin tënd të preferuar, mos e mbaj për
vete. Hap një pull request te
[github.com/Fletoret/website](https://github.com/Fletoret/website) me:

- kapitujt e gjeneruar te `autore/<autor>/<libri>/`,
- zërin e librit (dhe të autorit, nëse është i ri) te
  `autore/index.json`,
- kopertinën dhe portretin te `static/images/`.

Nga aty deri te botimi ka një hap të vetëm: dikush e lexon kundrejt
skanimeve dhe `publishedFletoret` bëhet `true`. Nuk kërkohet leje
paraprake dhe nuk kërkohet që teksti të jetë i përsosur — kërkohet
vetëm që të jetë i lexuar. Nëse ke bërë vetëm një pjesë të librit,
dërgoje atë pjesë; gjysma e një libri të lexueshëm vlen më shumë se
një libër i plotë që rri i skanuar.

Veprat e të gjithë autorëve shqiptarë që kanë vdekur para më shumë se
70 vjetësh janë në domen publik[^1]: nuk i zotëron askush, dhe
pikërisht prandaj nuk kujdeset askush t'i mbajë të lexueshme. Kushdo
është i mirëpritur të sjellë libra — nëpërmjet një pull request-i, ose
thjesht duke na treguar cili libër mungon.

[^1]: Sipas ligjit Nr. 35/2016: Për të drejtat e autorit dhe të
      drejtat e tjera të lidhura me to, veprat e shkrimtarëve që kanë
      vdekur para 70 vjetësh janë pasuri publike (domen publik). —
      [kultura.gov.al](https://kultura.gov.al/e-drejta-e-autorit/)
[^2]: Shkrimi ynë i mëparshëm mbi Bibliotekën Dixhitale, IIIF-in dhe
      Kopjuesin: [Biblioteka Dixhitale](/blog/biblioteka-dixhitale/).
