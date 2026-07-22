#!/usr/bin/env node
// Wrap long lines in Markdown files to a max width, without breaking words.
//
// Usage:
//   node scripts/wrap-md.mjs <file.md> [more.md ...] [--width 80] [--stdout]
//   npm run wrap -- autore/frang-bardhi/skenderbeu/pjesa-1.md
//
// It only re-flows lines that are LONGER than the limit, and only "safe"
// prose lines. It deliberately leaves the following untouched, since
// re-wrapping them would change how the Markdown renders:
//   - YAML front matter (--- ... ---)
//   - fenced code blocks (``` or ~~~)
//   - headings (#, and setext underlines === / ---)
//   - tables (any line containing |)
//   - HTML block lines (starting with <)
//   - horizontal rules
//   - link reference definitions ([id]: http://...)
//   - lines ending in a hard break (two trailing spaces)
//   - lines already within the width limit
//
// Wrapping happens only at spaces, so words, URLs, `[^1]` footnote refs,
// **bold**, [text](url) etc. are never split down the middle. A single
// token longer than the width is left over-long on its own line rather
// than being broken.

import { readFileSync, writeFileSync } from 'node:fs';

function parseArgs(argv) {
  const files = [];
  let width = 70;
  let stdout = false;
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--width' || a === '-w') {
      width = parseInt(argv[++i], 10);
      if (!Number.isFinite(width) || width < 20) {
        throw new Error(`invalid --width: ${argv[i]}`);
      }
    } else if (a === '--stdout') {
      stdout = true;
    } else if (a.startsWith('-')) {
      throw new Error(`unknown flag: ${a}`);
    } else {
      files.push(a);
    }
  }
  return { files, width, stdout };
}

// Split a wrappable line into its structural prefix (indentation, blockquote
// markers, list bullet or footnote marker) and the prose that follows.
// Continuation lines reuse the indentation/blockquote part but pad the
// bullet/marker to spaces so the text stays aligned.
function splitPrefix(line) {
  const indent = line.match(/^\s*/)[0];
  let rest = line.slice(indent.length);

  let bq = '';
  const bqMatch = rest.match(/^(?:>\s?)+/);
  if (bqMatch) {
    bq = bqMatch[0];
    rest = rest.slice(bq.length);
  }

  let marker = '';
  // unordered bullet, ordered list, or footnote/definition marker
  const markerMatch = rest.match(/^(?:[-*+]\s+|\d+[.)]\s+|\[\^[^\]]+\]:\s+)/);
  if (markerMatch) {
    marker = markerMatch[0];
    rest = rest.slice(marker.length);
  }

  const first = indent + bq + marker;
  const cont = indent + bq + ' '.repeat(marker.length);
  return { first, cont, rest };
}

// Should this line be left exactly as-is?
function isProtected(line) {
  const t = line.trim();
  if (t === '') return true;
  if (line.endsWith('  ')) return true; // markdown hard line break
  if (t.includes('|')) return true; // table
  if (/^#{1,6}\s/.test(t)) return true; // ATX heading
  if (/^(={3,}|-{3,}|\*{3,}|_{3,})$/.test(t)) return true; // hr / setext underline
  if (/^</.test(t)) return true; // HTML block
  // link reference definition: [id]: url   (but NOT footnote defs [^id]:)
  if (/^\[[^^\]][^\]]*\]:\s/.test(t)) return true;
  return false;
}

function wrapProse(rest, first, cont, width) {
  const words = rest.split(/\s+/).filter(Boolean);
  const out = [];
  let line = first;
  let empty = true; // no word on the current line yet
  for (const word of words) {
    if (empty) {
      line += word;
      empty = false;
    } else if (line.length + 1 + word.length <= width) {
      line += ' ' + word;
    } else {
      out.push(line);
      line = cont + word;
    }
  }
  out.push(line);
  return out;
}

function wrapContent(content, width) {
  const eol = content.includes('\r\n') ? '\r\n' : '\n';
  const lines = content.split(/\r?\n/);
  const out = [];

  let inFront = false;
  let frontChecked = false;
  let fence = null; // the fence marker string when inside a code block

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // YAML front matter, only at the very top of the file.
    if (!frontChecked) {
      frontChecked = true;
      if (line.trim() === '---') {
        inFront = true;
        out.push(line);
        continue;
      }
    }
    if (inFront) {
      out.push(line);
      if (line.trim() === '---') inFront = false;
      continue;
    }

    // Fenced code blocks.
    const fenceMatch = line.match(/^\s*(```+|~~~+)/);
    if (fence) {
      out.push(line);
      if (fenceMatch && line.trim().startsWith(fence)) fence = null;
      continue;
    }
    if (fenceMatch) {
      fence = fenceMatch[1];
      out.push(line);
      continue;
    }

    if (line.length <= width || isProtected(line)) {
      out.push(line);
      continue;
    }

    const { first, cont, rest } = splitPrefix(line);
    if (rest.trim() === '') {
      out.push(line);
      continue;
    }
    out.push(...wrapProse(rest, first, cont, width));
  }

  return out.join(eol);
}

function main() {
  let opts;
  try {
    opts = parseArgs(process.argv.slice(2));
  } catch (err) {
    console.error(`wrap-md: ${err.message}`);
    process.exit(2);
  }

  if (opts.files.length === 0) {
    console.error('Usage: node scripts/wrap-md.mjs <file.md> [...] [--width 80] [--stdout]');
    process.exit(2);
  }

  let hadError = false;
  for (const file of opts.files) {
    let original;
    try {
      original = readFileSync(file, 'utf8');
    } catch (err) {
      console.error(`wrap-md: cannot read ${file}: ${err.message}`);
      hadError = true;
      continue;
    }

    const wrapped = wrapContent(original, opts.width);

    if (opts.stdout) {
      process.stdout.write(wrapped);
      continue;
    }

    if (wrapped === original) {
      console.log(`unchanged  ${file}`);
      continue;
    }
    writeFileSync(file, wrapped);
    console.log(`wrapped    ${file} (max ${opts.width})`);
  }

  process.exit(hadError ? 1 : 0);
}

main();
