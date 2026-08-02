#!/usr/bin/env node
// Generate a book cover image (AVIF + WEBP) for a book listed in
// autore/index.json, by driving the interactive /kopertina generator with a
// headless browser instead of a person. Reusing the real Svelte component
// (rather than reimplementing its gradients/grain-filter/fonts in Node) keeps
// CLI output identical to what a person would get by hand from /kopertina.
//
// Usage:
//   node scripts/generate-cover.mjs <book-folder> [options]
//   npm run cover -- migjeni/vargjet-e-lira --theme vintage --palette burgundy --font alegreyaSC
//
// <book-folder> must match a book's "folder" field in autore/index.json.
// Output files are written next to the path in that book's "thumbnail" field
// (e.g. thumbnail "/images/covers/x.avif" writes static/images/covers/x.avif
// and static/images/covers/x.webp), since src/lib/db.ts derives the webp
// variant by replacing the ".avif" extension on that same field.
//
// Options (all optional; each falls back to the book/author's existing data):
//   --title <string>          default: book.name
//   --subtitle <string>       default: '' (kopertina/index.json has no field for this)
//   --author <string>         default: author.name
//   --theme <modern|vintage>  default: modern
//   --palette <id>            default: classic        (see PALETTE_IDS below)
//   --font <id>               default: instrumentSerif (see FONT_IDS below)
//   --title-size <rem>        default: 4
//   --subtitle-size <rem>     default: 0.95
//   --author-size <rem>       default: 1.05
//   --keep-png                also keep the intermediate PNG alongside avif/webp

import { readFileSync, writeFileSync, unlinkSync, mkdirSync } from 'node:fs';
import { join, dirname, extname } from 'node:path';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { createServer } from 'vite';
import { chromium } from 'playwright';

const PALETTE_IDS = [
  'classic',
  'light',
  'green',
  'coral',
  'sepia',
  'parchment',
  'oldBook',
  'burgundy',
  'ink',
  'linen',
];
const FONT_IDS = [
  'instrumentSerif',
  'sourceSerif',
  'crimsonText',
  'alegreyaSC',
  'imFellEnglishSC',
  'charter',
  'inter',
];

function parseArgs(argv) {
  const [folder, ...rest] = argv;
  if (!folder || folder.startsWith('--')) {
    console.error('Usage: node scripts/generate-cover.mjs <book-folder> [options]');
    process.exit(1);
  }

  const options = {
    title: null,
    subtitle: '',
    author: null,
    theme: 'modern',
    palette: 'classic',
    font: 'instrumentSerif',
    titleSize: 4,
    subtitleSize: 0.95,
    authorSize: 1.05,
    keepPng: false,
  };
  const setters = {
    '--title': (v) => (options.title = v),
    '--subtitle': (v) => (options.subtitle = v),
    '--author': (v) => (options.author = v),
    '--theme': (v) => (options.theme = v),
    '--palette': (v) => (options.palette = v),
    '--font': (v) => (options.font = v),
    '--title-size': (v) => (options.titleSize = Number(v)),
    '--subtitle-size': (v) => (options.subtitleSize = Number(v)),
    '--author-size': (v) => (options.authorSize = Number(v)),
  };

  for (let i = 0; i < rest.length; i++) {
    const arg = rest[i];
    if (arg === '--keep-png') {
      options.keepPng = true;
      continue;
    }
    const setter = setters[arg];
    if (!setter) {
      console.error(`Unknown option: ${arg}`);
      process.exit(1);
    }
    setter(rest[++i]);
  }

  if (!['modern', 'vintage'].includes(options.theme)) {
    console.error(`--theme must be "modern" or "vintage", got ${JSON.stringify(options.theme)}`);
    process.exit(1);
  }
  if (!PALETTE_IDS.includes(options.palette)) {
    console.error(`--palette must be one of ${PALETTE_IDS.join(', ')}, got ${JSON.stringify(options.palette)}`);
    process.exit(1);
  }
  if (!FONT_IDS.includes(options.font)) {
    console.error(`--font must be one of ${FONT_IDS.join(', ')}, got ${JSON.stringify(options.font)}`);
    process.exit(1);
  }

  return { folder, options };
}

/** Finds a book (and its author entry) by "folder" across autore/index.json. */
function findBook(folder) {
  const index = JSON.parse(readFileSync('autore/index.json', 'utf-8'));
  for (const authorEntry of Object.values(index)) {
    const book = authorEntry.books?.find((b) => b.folder === folder);
    if (book) return { author: authorEntry, book };
  }
  return null;
}

async function fillCover(page, { title, subtitle, author, theme, palette, font, titleSize, subtitleSize, authorSize }) {
  await page.locator(`.theme-btn[data-id="${theme}"]`).click();
  await page.locator(`.palette[data-id="${palette}"]`).click();
  await page.locator(`.font[data-id="${font}"]`).click();

  await page.locator('#book-cover .title[contenteditable]').fill(title);
  await page.locator('#book-cover .subtitle[contenteditable]').fill(subtitle);
  await page.locator('#book-cover .author[contenteditable]').fill(author);

  for (const [id, value] of [
    ['title-size', titleSize],
    ['subtitle-size', subtitleSize],
    ['author-size', authorSize],
  ]) {
    await page.locator(`#${id}`).evaluate((el, v) => {
      el.value = String(v);
      el.dispatchEvent(new Event('input', { bubbles: true }));
    }, value);
  }

  // Filling leaves the last field focused, and focus/hover styling (caret,
  // box-shadow) isn't part of the cover a person would export either.
  await page.evaluate(() => document.activeElement?.blur());
  await page.evaluate(() => document.fonts.ready);
}

async function main() {
  const { folder, options } = parseArgs(process.argv.slice(2));

  const found = findBook(folder);
  if (!found) {
    console.error(`generate-cover: no book with folder ${JSON.stringify(folder)} in autore/index.json`);
    process.exit(1);
  }
  const { author, book } = found;
  if (!book.thumbnail) {
    console.error(`generate-cover: book ${folder} has no "thumbnail" field to derive an output path from`);
    process.exit(1);
  }

  const title = options.title ?? book.name;
  const authorName = options.author ?? author.name;
  const ext = extname(book.thumbnail);
  const outBase = join('static', book.thumbnail).slice(0, -ext.length);
  const tmpPng = join(tmpdir(), `cover-${folder.replace(/\//g, '-')}-${process.pid}.png`);

  console.log(`generate-cover: ${folder} -> ${outBase}.{avif,webp}`);

  const server = await createServer({
    configFile: join(process.cwd(), 'vite.config.ts'),
    server: { port: 0 },
    logLevel: 'warn',
  });
  await server.listen();
  const port = server.httpServer.address().port;

  const browser = await chromium.launch();
  try {
    const context = await browser.newContext({
      viewport: { width: 1280, height: 900 },
      deviceScaleFactor: 3,
    });
    const page = await context.newPage();
    page.setDefaultTimeout(15000);
    await page.goto(`http://localhost:${port}/kopertina`, { waitUntil: 'networkidle' });

    await fillCover(page, { ...options, title, author: authorName });

    await page.locator('#book-cover').screenshot({ path: tmpPng });
  } finally {
    await browser.close();
    await server.close();
  }

  mkdirSync(dirname(outBase), { recursive: true });
  execFileSync('magick', [tmpPng, `${outBase}.webp`]);
  execFileSync('magick', [tmpPng, '-depth', '10', '-define', 'heic:speed=2', `${outBase}.avif`]);

  if (options.keepPng) {
    writeFileSync(`${outBase}.png`, readFileSync(tmpPng));
  }
  unlinkSync(tmpPng);

  console.log(`generate-cover: wrote ${outBase}.avif and ${outBase}.webp`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
