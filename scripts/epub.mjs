#!/usr/bin/env node
// @ts-nocheck — a plain-Node build script like the rest of scripts/; it only
// falls under svelte-check because vite.config.ts imports it.
// Build EPUB 3 editions of the books in autore/, modelled on Standard Ebooks:
// semantic XHTML, a title page, imprint and colophon, popup endnotes, proper
// typography, a stylesheet that leaves the typeface to the reader
// (scripts/epub.css), and an EPUB 2 NCX so older readers still get a table of
// contents.
//
// Usage:
//   node scripts/epub.mjs                         every book with "epub": true in autore/index.json
//   node scripts/epub.mjs konica/doktor-gjilpera  just this book, flag or not
//   npm run epub [-- <book-folder>]
//
// Output goes to static/epub/<author>/<book>.epub (gitignored; see
// src/lib/epub.ts). vite.config.ts runs the same build when dev or build
// starts, so the download on a book profile is always the current text.
//
// Output is deterministic: the same sources give a byte-identical file, with
// the book's last git commit as its modification date.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, posix } from 'node:path';
import { execFileSync } from 'node:child_process';
import { crc32, deflateRawSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { globSync } from 'glob';
import frontmatter from 'front-matter';
import markdownIt from 'markdown-it';
import mdAttrs from 'markdown-it-attrs';
import mdFootnote from 'markdown-it-footnote';
import sharp from 'sharp';
import { format } from 'date-fns/format';
import { sq } from 'date-fns/locale';
import { epubStaticPath } from '../src/lib/epub.ts';

const INDEX_PATH = 'autore/index.json';
const BASE_URL = 'https://fletoret.com';
const ISSUES_URL = 'https://github.com/Fletoret/website/issues';
const LICENSE_URL = 'https://creativecommons.org/licenses/by/4.0/deed.sq';
const CSS_PATH = fileURLToPath(new URL('./epub.css', import.meta.url));

// ---------------------------------------------------------------------------
// Markdown → XHTML

const escapeXml = (s) =>
  String(s)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');

const GREEK_RUN =
  /[Ͱ-Ͽἀ-῿]+(?:[\s.,;:!?··'’]+[Ͱ-Ͽἀ-῿]+)*/g;

/**
 * Typography the site's markdown-it typographer leaves undone, applied to text
 * only (never to markup):
 *
 * - The OCR'd corpus sets dashes as spaced hyphens (`fjalë - fjalë`). Those
 *   become en dashes, tied to the preceding word by a no-break space so a line
 *   never opens with one.
 * - Straight quotes markdown-it couldn't pair — dialogue that runs across
 *   paragraphs opens a quote in each but closes only in the last — are curled
 *   by position. Stray single quotes are Albanian elisions: apostrophes.
 * - Greek runs are tagged with their language so readers hyphenate and
 *   pronounce them as Greek: polytonic as Ancient (`grc`), monotonic as `el`.
 */
function typographyRule(state) {
  for (const block of state.tokens) {
    if (block.type !== 'inline' || !block.children) continue;

    const children = [];
    let prevType = null; // type of the previous inline token
    let prevChar = ''; // last character of the previous text token

    for (const token of block.children) {
      if (token.type !== 'text') {
        children.push(token);
        prevType = token.type;
        continue;
      }

      let text = token.content;

      // A dash that opens a wrapped line: move the tie onto the line break.
      if (/^-(?= |$)/.test(text) && prevType === 'softbreak') {
        children.pop();
        text = '\u00A0' + text;
      }
      text = text.replace(/(^|[ \u00A0])-(?= |$)/g, (_, space) =>
        space ? '\u00A0–' : '–',
      );

      // What sits left of the token: nothing at a line start or just inside an
      // opening tag, a word after closing markup such as `_fjalë_"`.
      const opensSomething =
        prevType === null || /break$|_open$/.test(prevType);
      const leftOfToken = opensSomething ? '' : prevType === 'text' ? prevChar : 'x';
      text = text.replace(/"/g, (_, offset) => {
        const left = offset > 0 ? text[offset - 1] : leftOfToken;
        return left === '' || /[\s\u00A0(\[–—]/.test(left) ? '“' : '”';
      });
      text = text.replaceAll("'", '’');

      let last = 0;
      for (const match of text.matchAll(GREEK_RUN)) {
        if (match.index > last) {
          children.push(textToken(state, text.slice(last, match.index)));
        }
        const lang = /[\u1F00-\u1FFF]/.test(match[0]) ? 'grc' : 'el';
        const span = new state.Token('html_inline', '', 0);
        span.content = `<span xml:lang="${lang}" lang="${lang}">${escapeXml(match[0])}</span>`;
        children.push(span);
        last = match.index + match[0].length;
      }
      if (last < text.length) {
        children.push(textToken(state, text.slice(last)));
      }

      prevType = 'text';
      prevChar = text.slice(-1);
    }

    block.children = children;
  }
}

/**
 * Gheg drops the start of a word with an apostrophe: `'i` (nji), `'imend`,
 * `'izet`, `'dhe`. markdown-it's smartquotes would pair that `'` with the next
 * elision as a quotation (‘i dêm … ka’). Set the known elided forms as
 * apostrophes before it runs, and leave real single-quoted text alone.
 */
const WORD_START_ELISION =
  /(^|[\s(«“"—–-])'(?=(?:[iìíîju]|am|[aâ]sht|or|[dD]h[eè]|Madh\p{L}*|[Ff]ort\p{L}*|i(?:m[eê]nd|z[eè]t|qind|her[eë])|m)(?!\p{L}))/gu;

function elisionRule(state) {
  for (const block of state.tokens) {
    if (block.type !== 'inline' || !block.children) continue;
    for (const token of block.children) {
      if (token.type === 'text') token.content = token.content.replace(WORD_START_ELISION, '$1’');
    }
  }
}

function textToken(state, content) {
  const token = new state.Token('text', '', 0);
  token.content = content;
  return token;
}

/**
 * Footnotes become Standard Ebooks-style endnotes: numbered across the whole
 * book, collected in endnotes.xhtml, linked both ways so readers can show them
 * as popups. `env.noteBase` is how many notes earlier chapters used and
 * `env.file` the chapter being rendered.
 */
function endnoteRules(md) {
  const number = (tokens, idx, env) => env.noteBase + tokens[idx].meta.id + 1;
  const rules = md.renderer.rules;

  rules.footnote_ref = (tokens, idx, _options, env) => {
    const n = number(tokens, idx, env);
    const sub = tokens[idx].meta.subId;
    const id = sub > 0 ? `noteref-${n}-${sub + 1}` : `noteref-${n}`;
    return `<a href="endnotes.xhtml#note-${n}" id="${id}" epub:type="noteref">${n}</a>`;
  };
  rules.footnote_block_open = () => '';
  rules.footnote_block_close = () => '';
  rules.footnote_open = (tokens, idx, _options, env) =>
    `<li id="note-${number(tokens, idx, env)}" epub:type="endnote">\n`;
  rules.footnote_close = () => '</li>\n';
  rules.footnote_anchor = (tokens, idx, _options, env) =>
    tokens[idx].meta.subId > 0
      ? ''
      : ` <a href="${env.file}#noteref-${number(tokens, idx, env)}" epub:type="backlink">↩︎</a>`;
}

function makeParser(breaks) {
  const md = markdownIt({ html: true, xhtmlOut: true, typographer: true, breaks });

  // `* * *` is a printed section break across the corpus (see src/lib/markdown.ts).
  const defaultHr = md.renderer.rules.hr;
  md.renderer.rules.hr = (tokens, idx, options, env, self) =>
    (tokens[idx].markup ?? '').startsWith('*')
      ? '<p class="asterism" role="separator">* * *</p>\n'
      : defaultHr
        ? defaultHr(tokens, idx, options, env, self)
        : self.renderToken(tokens, idx, options);

  md.use(mdFootnote).use(mdAttrs);
  md.core.ruler.before('smartquotes', 'epub_elision', elisionRule);
  md.core.ruler.push('epub_typography', typographyRule);
  endnoteRules(md);
  return md;
}

const parsers = { prose: makeParser(false), verse: makeParser(true) };

/**
 * The site's markdown uses a few elements of its own, styled in
 * src/lib/css/blog.css: `<center>` (obsolete in HTML5), `<epigraph>` (stage
 * directions in plays) and `<caps>`. They become classed divs and spans,
 * styled in epub.css. Bare `<br>` gets closed. Web-only extras give way:
 * video embeds are dropped, and the site's ✱ divider becomes a section break.
 */
const SITE_HTML = [
  [/<div class="iframe-container">[\s\S]*?<\/div>\s*(?:<figcaption>[\s\S]*?<\/figcaption>)?/g, ''],
  [/<div class="divider[^"]*" data-content="[^"]*"><\/div>/g, '* * *'],
  [/<(center|epigraph)>/g, '<div class="$1">'],
  [/<\/(center|epigraph)>/g, '</div>'],
  [/<caps>/g, '<span class="caps">'],
  [/<\/caps>/g, '</span>'],
  [/<br\s*>/g, '<br/>'],
];

const siteHtmlToXhtml = (body) =>
  SITE_HTML.reduce((text, [pattern, replacement]) => text.replace(pattern, replacement), body);

/** Render one chapter body; returns its XHTML and the endnotes it defines. */
function renderChapter(body, verse, file, noteBase) {
  const md = verse ? parsers.verse : parsers.prose;
  const env = { file, noteBase };
  const tokens = md.parse(siteHtmlToXhtml(body), env);
  const split = tokens.findIndex((t) => t.type === 'footnote_block_open');
  const bodyTokens = split < 0 ? tokens : tokens.slice(0, split);

  const html = md.renderer
    .render(bodyTokens, md.options, env)
    // A note marker sits against the word it annotates.
    .replace(/[  ]+(<a href="endnotes\.xhtml)/g, '$1');
  const notes = split < 0 ? '' : md.renderer.render(tokens.slice(split), md.options, env);

  return { html, notes, noteCount: env.footnotes?.list?.length ?? 0 };
}

// ---------------------------------------------------------------------------
// Book model

function loadIndex() {
  return JSON.parse(readFileSync(INDEX_PATH, 'utf-8'));
}

/**
 * Read a book's chapters in the order the site shows them (src/lib/db.ts):
 * grouped by `parent`, each group sorted by `order`, groups by their lowest
 * `order`.
 */
/** Titles skip markdown, so give them the body's quotes and apostrophes. */
const typesetTitle = (s) =>
  s == null
    ? s
    : String(s)
        .replace(/"([^"]*)"/g, '“$1”')
        .replaceAll("'", '’');

function loadBook(folder, index = loadIndex()) {
  const authorKey = folder.split('/')[0];
  const author = index[authorKey];
  const book = author?.books?.find((b) => b.folder === folder);
  if (!book) throw new Error(`${folder}: no such book in ${INDEX_PATH}`);

  // Editor's notes render as interactive buttons on the site; they need their
  // own endnote mapping before a book that has them can be built.
  if (existsSync(`autore/${folder}/shenimet.md`)) {
    throw new Error(`${folder}: editor's notes (shenimet.md) are not supported in EPUBs yet`);
  }

  const entries = globSync(`autore/${folder}/**/*.md`)
    .sort()
    .map((file) => {
      const { attributes, body } = frontmatter(readFileSync(file, 'utf-8'));
      return {
        ...attributes,
        title: typesetTitle(attributes.title),
        subtitle: typesetTitle(attributes.subtitle),
        file,
        body,
      };
    });
  if (entries.length === 0) throw new Error(`${folder}: no chapters found`);

  const groups = new Map();
  for (const entry of entries) {
    const key = String(entry.parent);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(entry);
  }
  const firstOrder = (list) => Math.min(...list.map((e) => e.order));
  const parts = [...groups.entries()]
    .map(([title, chapters]) => ({
      title,
      chapters: chapters.sort((a, b) => a.order - b.order),
    }))
    .sort((a, b) => firstOrder(a.chapters) - firstOrder(b.chapters));

  return { folder, author, book, parts, modified: lastModified(folder) };
}

/**
 * When the book's text last changed: its last commit, or now when the working
 * tree has uncommitted edits (or there is no git).
 */
function lastModified(folder) {
  try {
    const path = `autore/${folder}`;
    const dirty = execFileSync('git', ['status', '--porcelain', '--', path], {
      encoding: 'utf-8',
    }).trim();
    if (!dirty) {
      const date = execFileSync('git', ['log', '-1', '--format=%cI', '--', path], {
        encoding: 'utf-8',
      }).trim();
      if (date) return new Date(date);
    }
  } catch {
    // Not a git checkout; fall through.
  }
  return new Date(Math.floor(Date.now() / 1000) * 1000);
}

/** "Faik Konica" → "Konica, Faik", for readers that sort by surname. */
function fileAs(name) {
  const words = name.trim().split(/\s+/);
  return words.length < 2 ? name : `${words.at(-1)}, ${words.slice(0, -1).join(' ')}`;
}

// ---------------------------------------------------------------------------
// Documents

const xhtml = (title, bodyType, content) => `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" xml:lang="sq" lang="sq">
<head>
<title>${escapeXml(title)}</title>
<link href="../css/core.css" rel="stylesheet" type="text/css"/>
</head>
<body epub:type="${bodyType}">
${content}
</body>
</html>
`;

function heading(level, title, subtitle) {
  const h = `<h${level} epub:type="title">${escapeXml(title)}</h${level}>`;
  return subtitle
    ? `<hgroup>\n${h}\n<p epub:type="subtitle">${escapeXml(subtitle)}</p>\n</hgroup>`
    : h;
}

/**
 * Lay the book out as spine documents. Returns
 * `{ docs: [{ file, title, xhtml, toc, landmark? }], notes }`, where `toc` is
 * the nesting depth in the table of contents (0 = not listed).
 */
function composeBook({ folder, author, book, parts, modified }) {
  const title = book.name;
  const subtitle = book.subtitle;
  const url = `${BASE_URL}/${folder}/`;
  const docs = [];

  docs.push({
    file: 'titlepage.xhtml',
    title: 'Faqja e titullit',
    toc: 1,
    xhtml: xhtml(
      title,
      'frontmatter',
      `<section id="titlepage" epub:type="titlepage">
${subtitle ? `<hgroup>\n<h1 epub:type="title">${escapeXml(title)}</h1>\n<p epub:type="subtitle">${escapeXml(subtitle)}</p>\n</hgroup>` : `<h1 epub:type="title">${escapeXml(title)}</h1>`}
<p class="author">${escapeXml(author.name)}</p>
</section>`,
    ),
  });

  docs.push({
    file: 'imprint.xhtml',
    title: 'Për këtë botim',
    toc: 1,
    xhtml: xhtml(
      'Për këtë botim',
      'frontmatter',
      `<section id="imprint" epub:type="imprint" aria-label="Për këtë botim">
<p>Ky libër elektronik vjen nga <a href="${BASE_URL}/">Fletoret</a>, nisma e dixhitalizimit të veprave letrare në shqip që janë në domenin publik. Të plota, falas, kontribuar nga vullnetarë.</p>
<p>Teksti lexohet edhe në <a href="${url}">fletoret.com/${escapeXml(folder)}</a>. Nëse ndeshni gabime, na i tregoni te <a href="${ISSUES_URL}">GitHub</a>.</p>
<p>Vepra origjinale është në domenin publik. Transkriptimi dhe ky botim elektronik shpërndahen nën licencën <a href="${LICENSE_URL}">Creative Commons Attribution 4.0</a> (CC BY 4.0).</p>
</section>`,
    ),
  });

  // A book whose chapters share one parent (usually the book itself) is flat;
  // otherwise each parent is a part with its own divider page.
  const flat = parts.length === 1;
  const notes = [];
  let noteBase = 0;
  let firstBody = true;

  parts.forEach((part, p) => {
    if (!flat) {
      docs.push({
        file: `part-${p + 1}.xhtml`,
        title: part.title,
        toc: 1,
        landmark: firstBody,
        xhtml: xhtml(
          part.title,
          'bodymatter',
          `<section id="part-${p + 1}" epub:type="part">\n${heading(2, part.title)}\n</section>`,
        ),
      });
      firstBody = false;
    }

    part.chapters.forEach((chapter, c) => {
      const id = flat ? `chapter-${c + 1}` : `chapter-${p + 1}-${c + 1}`;
      const file = `${id}.xhtml`;
      const verse = chapter.respectLineBreaks !== false;
      const rendered = renderChapter(chapter.body, verse, file, noteBase);
      noteBase += rendered.noteCount;
      if (rendered.notes) notes.push(rendered.notes);

      const section = `<section id="${id}" epub:type="chapter"${verse ? ' class="verse"' : ''}>
${heading(flat ? 2 : 3, chapter.title, chapter.subtitle)}
${rendered.html.trim()}
</section>`;
      docs.push({
        file,
        source: chapter.file,
        title: chapter.title,
        toc: flat ? 1 : 2,
        landmark: firstBody,
        xhtml: xhtml(
          chapter.title,
          'bodymatter',
          flat ? section : `<section id="part-${p + 1}" epub:type="part">\n${section}\n</section>`,
        ),
      });
      firstBody = false;
    });
  });

  if (notes.length) {
    docs.push({
      file: 'endnotes.xhtml',
      title: 'Shënime',
      toc: 1,
      xhtml: xhtml(
        'Shënime',
        'backmatter',
        `<section id="endnotes" epub:type="endnotes">\n<h2 epub:type="title">Shënime</h2>\n<ol>\n${notes.join('').trim()}\n</ol>\n</section>`,
      ),
    });
  }

  const published = book.datePublished ? ` dhe u botua më ${escapeXml(book.datePublished)}` : '';
  docs.push({
    file: 'colophon.xhtml',
    title: 'Kolofoni',
    toc: 1,
    xhtml: xhtml(
      'Kolofoni',
      'backmatter',
      `<section id="colophon" epub:type="colophon" aria-label="Kolofoni">
<p><i>${escapeXml(title)}</i><br/>u shkrua nga ${escapeXml(author.name)}${published}.</p>
<hr/>
<p>Ky botim elektronik u përgatit nga vullnetarët e <a href="${BASE_URL}/">Fletoreve</a> dhe u përditësua më ${format(modified, 'd MMMM yyyy', { locale: sq }).toLowerCase()}.</p>
<p>Versioni më i ri gjendet gjithmonë te <a href="${url}">fletoret.com/${escapeXml(folder)}</a>.</p>
</section>`,
    ),
  });

  return { docs };
}

function navDocument(title, docs) {
  const items = [];
  let open = 0;
  for (const doc of docs.filter((d) => d.toc > 0)) {
    if (doc.toc > open) {
      if (open > 0) items.push('<ol>');
    } else {
      items.push('</li>');
      if (doc.toc < open) items.push('</ol>\n</li>');
    }
    open = doc.toc;
    items.push(`<li><a href="text/${doc.file}">${escapeXml(doc.title)}</a>`);
  }
  items.push('</li>');
  if (open > 1) items.push('</ol>\n</li>');

  const start = docs.find((d) => d.landmark);
  return `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" xml:lang="sq" lang="sq">
<head>
<title>Përmbajtja</title>
<link href="css/core.css" rel="stylesheet" type="text/css"/>
</head>
<body epub:type="frontmatter">
<nav id="toc" epub:type="toc">
<h2 epub:type="title">Përmbajtja</h2>
<ol>
${items.join('\n')}
</ol>
</nav>
<nav id="landmarks" epub:type="landmarks" hidden="hidden">
<h2 epub:type="title">Pikat kryesore</h2>
<ol>
<li><a href="text/${start.file}" epub:type="bodymatter">${escapeXml(title)}</a></li>
</ol>
</nav>
</body>
</html>
`;
}

function ncxDocument(uid, title, docs) {
  let playOrder = 0;
  const points = [];
  let open = 0;
  for (const doc of docs.filter((d) => d.toc > 0)) {
    if (doc.toc <= open) points.push('</navPoint>');
    if (doc.toc < open) points.push('</navPoint>');
    open = doc.toc;
    playOrder++;
    points.push(
      `<navPoint id="navpoint-${playOrder}" playOrder="${playOrder}">\n<navLabel><text>${escapeXml(doc.title)}</text></navLabel>\n<content src="text/${doc.file}"/>`,
    );
  }
  for (let level = open; level > 0; level--) points.push('</navPoint>');

  return `<?xml version="1.0" encoding="utf-8"?>
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1" xml:lang="sq">
<head>
<meta name="dtb:uid" content="${escapeXml(uid)}"/>
<meta name="dtb:depth" content="${Math.max(...docs.map((d) => d.toc))}"/>
<meta name="dtb:totalPageCount" content="0"/>
<meta name="dtb:maxPageNumber" content="0"/>
</head>
<docTitle><text>${escapeXml(title)}</text></docTitle>
<navMap>
${points.join('\n')}
</navMap>
</ncx>
`;
}

function opfDocument({ folder, author, book, modified }, docs) {
  const uid = `${BASE_URL}/${folder}/`;
  const iso = modified.toISOString().replace(/\.\d{3}Z$/, 'Z');
  const id = (file) => file.replace(/\.xhtml$/, '').replace(/[^\w-]/g, '-');

  const manifest = [
    '<item href="css/core.css" id="core.css" media-type="text/css"/>',
    '<item href="images/cover.jpg" id="cover.jpg" media-type="image/jpeg" properties="cover-image"/>',
    '<item href="toc.xhtml" id="toc.xhtml" media-type="application/xhtml+xml" properties="nav"/>',
    '<item href="toc.ncx" id="ncx" media-type="application/x-dtbncx+xml"/>',
    ...docs.map(
      (d) => `<item href="text/${d.file}" id="${id(d.file)}" media-type="application/xhtml+xml"/>`,
    ),
  ];
  const spine = docs.map((d) => `<itemref idref="${id(d.file)}"/>`);

  return `<?xml version="1.0" encoding="utf-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="uid" xml:lang="sq">
<metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
<dc:identifier id="uid">${escapeXml(uid)}</dc:identifier>
<dc:title id="title">${escapeXml(book.name)}</dc:title>
${book.subtitle ? `<dc:title id="subtitle">${escapeXml(book.subtitle)}</dc:title>\n<meta property="title-type" refines="#subtitle">subtitle</meta>\n<meta property="title-type" refines="#title">main</meta>\n` : ''}<dc:creator id="author">${escapeXml(author.name)}</dc:creator>
<meta property="file-as" refines="#author">${escapeXml(fileAs(author.name))}</meta>
<meta property="role" refines="#author" scheme="marc:relators">aut</meta>
<dc:language>sq</dc:language>
<dc:publisher>Fletoret</dc:publisher>
<dc:date>${iso}</dc:date>
<meta property="dcterms:modified">${iso}</meta>
<dc:source>${escapeXml(uid)}</dc:source>
<dc:rights>Vepra origjinale është në domenin publik. Transkriptimi dhe ky botim elektronik: CC BY 4.0, ${LICENSE_URL}</dc:rights>
${book.abstract ? `<dc:description>${escapeXml(book.abstract)}</dc:description>\n` : ''}<meta property="schema:accessMode">textual</meta>
<meta property="schema:accessModeSufficient">textual</meta>
<meta property="schema:accessibilityFeature">readingOrder</meta>
<meta property="schema:accessibilityFeature">structuralNavigation</meta>
<meta property="schema:accessibilityFeature">tableOfContents</meta>
<meta property="schema:accessibilityHazard">none</meta>
<meta property="schema:accessibilitySummary">Tekst me tituj semantikë, tabelë të përmbajtjes dhe shënime të lidhura në të dy drejtimet.</meta>
<meta name="cover" content="cover.jpg"/>
</metadata>
<manifest>
${manifest.join('\n')}
</manifest>
<spine toc="ncx">
${spine.join('\n')}
</spine>
</package>
`;
}

const CONTAINER_XML = `<?xml version="1.0" encoding="utf-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
<rootfiles>
<rootfile full-path="epub/content.opf" media-type="application/oebps-package+xml"/>
</rootfiles>
</container>
`;

// ---------------------------------------------------------------------------
// Cover

/**
 * The cover from /kopertina, as a JPEG. Those images have rounded, transparent
 * corners for the site's cards; a reader shows the cover edge to edge on its
 * own background, so crop just inside the corner radius.
 */
async function coverJpeg(book) {
  if (!book.thumbnail) throw new Error(`${book.folder}: no cover (thumbnail) in ${INDEX_PATH}`);
  const base = `static${book.thumbnail.replace(/\.\w+$/, '')}`;
  const source = ['.png', '.webp', '.avif', '.jpg'].map((ext) => base + ext).find(existsSync);
  if (!source) throw new Error(`${book.folder}: cover ${book.thumbnail} not found under static/`);

  const { data, info } = await sharp(source)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  // Walk the top row to where the corner turns opaque. Lossy alpha leaves
  // "opaque" a little under 255, and a cover without rounded corners has no
  // transparent pixels at all, so count 200 and up as opaque.
  let radius = 0;
  while (radius < info.width / 4 && data[radius * info.channels + 3] < 200) radius++;

  return sharp(source)
    .extract({
      left: radius,
      top: radius,
      width: info.width - 2 * radius,
      height: info.height - 2 * radius,
    })
    .flatten({ background: '#ffffff' })
    .jpeg({ quality: 90, mozjpeg: true })
    .toBuffer();
}

// ---------------------------------------------------------------------------
// Packaging

/**
 * A minimal ZIP writer. EPUB wants `mimetype` first and stored, and a fixed
 * timestamp keeps the output byte-identical between builds of the same text.
 */
function zip(files, date) {
  const time = (date.getUTCHours() << 11) | (date.getUTCMinutes() << 5) | (date.getUTCSeconds() >> 1);
  const day =
    ((date.getUTCFullYear() - 1980) << 9) | ((date.getUTCMonth() + 1) << 5) | date.getUTCDate();

  const locals = [];
  const centrals = [];
  let offset = 0;

  for (const { name, data, store } of files) {
    const nameBuf = Buffer.from(name, 'utf-8');
    const body = store ? data : deflateRawSync(data, { level: 9 });
    const crc = crc32(data);

    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0x0800, 6);
    local.writeUInt16LE(store ? 0 : 8, 8);
    local.writeUInt16LE(time, 10);
    local.writeUInt16LE(day, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(body.length, 18);
    local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(nameBuf.length, 26);
    local.writeUInt16LE(0, 28);

    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(0x0800, 8);
    central.writeUInt16LE(store ? 0 : 8, 10);
    central.writeUInt16LE(time, 12);
    central.writeUInt16LE(day, 14);
    central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(body.length, 20);
    central.writeUInt32LE(data.length, 24);
    central.writeUInt16LE(nameBuf.length, 28);
    central.writeUInt32LE(offset, 42);

    locals.push(local, nameBuf, body);
    centrals.push(central, nameBuf);
    offset += local.length + nameBuf.length + body.length;
  }

  const centralSize = centrals.reduce((n, b) => n + b.length, 0);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(files.length, 8);
  end.writeUInt16LE(files.length, 10);
  end.writeUInt32LE(centralSize, 12);
  end.writeUInt32LE(offset, 16);

  return Buffer.concat([...locals, ...centrals, end]);
}

// ---------------------------------------------------------------------------
// Checks

// Presentational HTML that XHTML5 dropped; source markdown sometimes has it.
const OBSOLETE_ELEMENTS = new Set(['acronym', 'big', 'center', 'font', 'strike', 'tt']);

const XML_TOKEN =
  /<!--[\s\S]*?-->|<\?[\s\S]*?\?>|<!DOCTYPE[^>]*>|<(\/?)([A-Za-z][\w:.-]*)((?:\s+[\w:.-]+\s*=\s*(?:"[^"<]*"|'[^'<]*'))*)\s*(\/?)>|<|&(?!(?:amp|lt|gt|quot|apos|#\d+|#x[0-9a-fA-F]+);)/g;
const XML_ATTR = /([\w:.-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g;

/**
 * Well-formedness of one XML document, plus what the link checks need: its
 * ids and the href/src/full-path values it points at.
 */
function scanXml(name, text) {
  const problems = [];
  const ids = new Set();
  const refs = [];
  const stack = [];
  const line = (index) => text.slice(0, index).split('\n').length;

  for (const m of text.matchAll(XML_TOKEN)) {
    const [token, closing, tag, attrs, selfClosing] = m;
    const at = `${name}:${line(m.index)}`;

    if (token === '<') {
      problems.push(`${at}: malformed tag`);
    } else if (token === '&') {
      problems.push(`${at}: unescaped & or an entity XML doesn't define`);
    } else if (tag) {
      if (OBSOLETE_ELEMENTS.has(tag.toLowerCase()) && name.endsWith('.xhtml')) {
        problems.push(`${at}: <${tag}> is not valid XHTML`);
      }
      if (closing) {
        const open = stack.at(-1);
        if (open !== tag) problems.push(`${at}: </${tag}> closes <${open ?? 'nothing'}>`);
        // Recover to the matching open tag, so one mistake is one message.
        const match = stack.lastIndexOf(tag);
        if (match >= 0) stack.length = match;
        continue;
      }
      const parent = stack.at(-1);
      if (/^d[td]$/.test(tag) && parent !== 'dl' && parent !== 'div') {
        problems.push(`${at}: <${tag}> outside a <dl>`);
      }
      for (const [, attr, dq, sq] of (attrs ?? '').matchAll(XML_ATTR)) {
        const value = dq ?? sq;
        if (attr === 'id') {
          if (ids.has(value)) problems.push(`${at}: duplicate id "${value}"`);
          if (/["\s<>]/.test(value)) problems.push(`${at}: id "${value}" can't be a link target`);
          ids.add(value);
        }
        if (attr === 'href' || attr === 'src' || attr === 'full-path') {
          refs.push({ at, value, tag });
        }
      }
      if (!selfClosing) stack.push(tag);
    }
  }
  if (stack.length) problems.push(`${name}: <${stack.join('>, <')}> never closed`);

  return { problems, ids, refs };
}

/**
 * The failures epubcheck most often reports, checked on every build without
 * Java: well-formed XML, a complete manifest, and links that resolve — to a
 * file in the package, to an id in it, and for the table of contents to a
 * document in the spine. Returns a list of problems (empty when all is well).
 */
function checkPackage(files) {
  const problems = [];
  const byName = new Map(files.map((f) => [f.name, f]));

  if (files[0]?.name !== 'mimetype' || !files[0].store) {
    problems.push('mimetype must be the first entry, stored uncompressed');
  }

  const scans = new Map();
  for (const f of files) {
    if (!/\.(xhtml|opf|ncx|xml)$/.test(f.name)) continue;
    const scan = scanXml(f.name, f.data.toString('utf-8'));
    scans.set(f.name, scan);
    problems.push(...scan.problems);
  }

  const opf = byName.get('epub/content.opf').data.toString('utf-8');
  const manifest = new Map(); // id -> package path
  for (const [item] of opf.matchAll(/<item\b[^>]*>/g)) {
    const id = item.match(/\bid="([^"]*)"/)?.[1];
    const href = item.match(/\bhref="([^"]*)"/)?.[1];
    manifest.set(id, posix.join('epub', href));
  }
  const listed = new Set(manifest.values());
  const spine = new Set(
    [...opf.matchAll(/<itemref\b[^>]*\bidref="([^"]*)"/g)].map(([, idref]) => {
      if (!manifest.has(idref)) problems.push(`content.opf: spine item "${idref}" is not in the manifest`);
      return manifest.get(idref);
    }),
  );

  const unlisted = ['mimetype', 'META-INF/container.xml', 'epub/content.opf'];
  for (const f of files) {
    if (!listed.has(f.name) && !unlisted.includes(f.name)) {
      problems.push(`${f.name}: in the package but not in the manifest`);
    }
  }
  for (const path of listed) {
    if (!byName.has(path)) problems.push(`content.opf: manifest lists missing ${path}`);
  }

  for (const [name, { refs }] of scans) {
    // container.xml paths are relative to the package root, the rest to the file.
    const base = name.startsWith('META-INF/') ? '' : posix.dirname(name);
    for (const { at, value, tag } of refs) {
      if (/^[a-z][a-z0-9+.-]*:/i.test(value)) continue; // https:, mailto:, …
      const [path, fragment] = value.split('#');
      const target = path ? posix.normalize(posix.join(base, path)) : name;
      if (target.startsWith('..') || path.startsWith('/')) {
        problems.push(`${at}: ${value} points outside the book`);
      } else if (!byName.has(target)) {
        problems.push(`${at}: ${value} is not in the book`);
      } else if (fragment && !scans.get(target)?.ids.has(fragment)) {
        problems.push(`${at}: ${value} names an id that doesn't exist`);
      } else if (name === 'epub/toc.xhtml' && tag === 'a' && !spine.has(target)) {
        problems.push(`${at}: ${value} is not in the spine`);
      }
    }
  }

  return problems;
}

// ---------------------------------------------------------------------------
// Entry points

/** Build one book's EPUB; returns the path written. */
export async function buildEpub(folder, index = loadIndex()) {
  const model = loadBook(folder, index);
  const { docs } = composeBook(model);
  const uid = `${BASE_URL}/${folder}/`;

  const files = [
    { name: 'mimetype', data: Buffer.from('application/epub+zip'), store: true },
    { name: 'META-INF/container.xml', data: Buffer.from(CONTAINER_XML) },
    { name: 'epub/content.opf', data: Buffer.from(opfDocument(model, docs)) },
    { name: 'epub/toc.xhtml', data: Buffer.from(navDocument(model.book.name, docs)) },
    { name: 'epub/toc.ncx', data: Buffer.from(ncxDocument(uid, model.book.name, docs)) },
    { name: 'epub/css/core.css', data: readFileSync(CSS_PATH) },
    { name: 'epub/images/cover.jpg', data: await coverJpeg(model.book), store: true },
    ...docs.map((d) => ({ name: `epub/text/${d.file}`, data: Buffer.from(d.xhtml) })),
  ];

  const problems = checkPackage(files);
  if (problems.length) {
    // Point at the markdown to fix, not just the generated file.
    const sources = new Map(docs.map((d) => [`epub/text/${d.file}`, d.source]));
    const shown = problems
      .slice(0, 20)
      .map((p) => {
        const source = sources.get(p.split(':')[0]);
        return source ? `  ${p}  [${source}]` : `  ${p}`;
      })
      .join('\n');
    const more = problems.length > 20 ? `\n  … and ${problems.length - 20} more` : '';
    throw new Error(`${folder}: the EPUB would be invalid:\n${shown}${more}`);
  }

  const out = epubStaticPath(folder);
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, zip(files, model.modified));
  return out;
}

/** Folders of the books that opt in with `"epub": true`. */
export function epubBookFolders(index = loadIndex()) {
  return Object.values(index)
    .flatMap((author) => author.books ?? [])
    .filter((book) => book.epub === true)
    .map((book) => book.folder);
}

export async function buildAllEpubs() {
  const index = loadIndex();
  const written = [];
  for (const folder of epubBookFolders(index)) {
    written.push(await buildEpub(folder, index));
  }
  return written;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const folders = process.argv.slice(2);
  const run = folders.length
    ? Promise.all(folders.map((f) => buildEpub(f)))
    : buildAllEpubs();
  run
    .then((written) => {
      for (const path of written) console.log(`epub: wrote ${path}`);
      if (written.length === 0) console.log('epub: no books have "epub": true');
    })
    .catch((err) => {
      console.error(`epub: ${err.message}`);
      process.exit(1);
    });
}

