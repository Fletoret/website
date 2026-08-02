#!/usr/bin/env node
// Download, resize, and convert an author portrait (AVIF + WEBP) for an
// author listed in autore/index.json.
//
// Usage:
//   node scripts/fetch-author-image.mjs <author-folder> <image-url> [options]
//   npm run author-image -- grameno https://example.com/mihal-grameno.jpg
//
// <author-folder> must match an author's "folder" field in autore/index.json.
// Output files are written next to the path in that author's "thumbnail" field
// (e.g. thumbnail "/images/mihal-grameno.avif" writes
// static/images/mihal-grameno.avif and static/images/mihal-grameno.webp),
// since src/lib/db.ts derives the webp variant by replacing the ".avif"
// extension on that same field.
//
// Options:
//   --max-size <px>   longest edge cap, preserves aspect ratio (default: 1024)
//   --keep-source     also keep the original downloaded file alongside avif/webp

import { writeFileSync, unlinkSync, mkdirSync, readFileSync } from 'node:fs';
import { join, dirname, extname } from 'node:path';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';

function parseArgs(argv) {
  const [folder, url, ...rest] = argv;
  if (!folder || !url || folder.startsWith('--') || url.startsWith('--')) {
    console.error('Usage: node scripts/fetch-author-image.mjs <author-folder> <image-url> [options]');
    process.exit(1);
  }

  const options = { maxSize: 1024, keepSource: false };
  for (let i = 0; i < rest.length; i++) {
    const arg = rest[i];
    if (arg === '--keep-source') {
      options.keepSource = true;
      continue;
    }
    if (arg === '--max-size') {
      options.maxSize = Number(rest[++i]);
      continue;
    }
    console.error(`Unknown option: ${arg}`);
    process.exit(1);
  }
  if (!Number.isFinite(options.maxSize) || options.maxSize <= 0) {
    console.error(`--max-size must be a positive number`);
    process.exit(1);
  }

  return { folder, url, options };
}

/** Finds an author entry by "folder" in autore/index.json. */
function findAuthor(folder) {
  const index = JSON.parse(readFileSync('autore/index.json', 'utf-8'));
  return Object.values(index).find((entry) => entry.folder === folder) ?? null;
}

async function download(url, destPath) {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`failed to download ${url}: ${res.status} ${res.statusText}`);
  }
  writeFileSync(destPath, Buffer.from(await res.arrayBuffer()));
}

async function main() {
  const { folder, url, options } = parseArgs(process.argv.slice(2));

  const author = findAuthor(folder);
  if (!author) {
    console.error(`fetch-author-image: no author with folder ${JSON.stringify(folder)} in autore/index.json`);
    process.exit(1);
  }
  if (!author.thumbnail) {
    console.error(`fetch-author-image: author ${folder} has no "thumbnail" field to derive an output path from`);
    process.exit(1);
  }

  const ext = extname(author.thumbnail);
  const outBase = join('static', author.thumbnail).slice(0, -ext.length);
  const srcExt = extname(new URL(url).pathname);
  const tmpSrc = join(tmpdir(), `author-image-${folder.replace(/\//g, '-')}-${process.pid}${srcExt}`);

  console.log(`fetch-author-image: ${folder} <- ${url}`);
  console.log(`fetch-author-image: -> ${outBase}.{avif,webp}`);

  await download(url, tmpSrc);

  mkdirSync(dirname(outBase), { recursive: true });
  const resize = `${options.maxSize}x${options.maxSize}>`;
  execFileSync('magick', [tmpSrc, '-auto-orient', '-resize', resize, `${outBase}.webp`]);
  execFileSync('magick', [
    tmpSrc,
    '-auto-orient',
    '-resize',
    resize,
    '-depth',
    '10',
    '-define',
    'heic:speed=2',
    `${outBase}.avif`,
  ]);

  if (options.keepSource) {
    writeFileSync(`${outBase}${srcExt || '.jpg'}`, readFileSync(tmpSrc));
  }
  unlinkSync(tmpSrc);

  console.log(`fetch-author-image: wrote ${outBase}.avif and ${outBase}.webp`);
}

main().catch((err) => {
  console.error(err.message ?? err);
  process.exit(1);
});
