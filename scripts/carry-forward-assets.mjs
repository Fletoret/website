#!/usr/bin/env node
// Carry the previous builds' hashed assets forward into the current build
// output, so a deploy doesn't retire files that clients are still asking for.
//
// Usage:
//   node scripts/carry-forward-assets.mjs            (runs as part of npm run deploy)
//   node scripts/carry-forward-assets.mjs --dry-run
//
// Why this exists: a Cloudflare Pages deployment is an atomic snapshot. The
// moment production flips to the new deployment, any file not in its manifest
// is gone — a request for it 404s, and because the 404 page is HTML the browser
// reports "Expected a JavaScript module but got text/html" instead of a missing
// file. Clients still holding the previous HTML (a tab mid-navigation, a
// document in flight during the flip) therefore break until they reload.
//
// Filenames under _app/immutable are content hashes, so the same name can never
// mean two different things and re-shipping an old one is always safe. Keeping
// the last few generations alongside the current build closes that window.
//
// Growth is bounded three ways:
//   1. Only the newest GENERATIONS_TO_KEEP generations are retained; older ones
//      are deleted from the cache on every run.
//   2. adapter-cloudflare rimrafs its output dir each build, so a snapshot only
//      ever contains files that build actually produced — carried-forward files
//      never compound into the next generation.
//   3. Content hashing means unchanged files reuse their name, so a generation's
//      real cost is only the files that changed, not the whole asset set.

import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';

const BUILD_DIR = '.svelte-kit/cloudflare';
const IMMUTABLE = '_app/immutable';
const CACHE_ROOT = '.asset-history';

// Current build plus the two before it. Each generation costs only its changed
// files; at time of writing a full asset set is 91 files / 1.3MB.
const GENERATIONS_TO_KEEP = 3;

// Backstop against ever approaching Cloudflare Pages' 20,000-file deployment
// limit. If the carried set somehow exceeds this, skip the merge and warn
// rather than shipping a deployment that gets rejected.
const MAX_CARRIED_FILES = 2000;

const dryRun = process.argv.includes('--dry-run');

/** Every file under `dir`, as paths relative to it. */
function walk(dir, base = dir, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) walk(full, base, out);
    else if (entry.isFile()) out.push(relative(base, full));
  }
  return out;
}

function copyInto(fromDir, toDir, files, { overwrite }) {
  let copied = 0;
  let bytes = 0;
  for (const file of files) {
    const dest = join(toDir, file);
    if (!overwrite && existsSync(dest)) continue;
    if (!dryRun) {
      mkdirSync(dirname(dest), { recursive: true });
      copyFileSync(join(fromDir, file), dest);
    }
    bytes += statSync(join(fromDir, file)).size;
    copied++;
  }
  return { copied, bytes };
}

const kb = (bytes) => `${(bytes / 1024).toFixed(0)}kb`;

const buildImmutable = join(BUILD_DIR, IMMUTABLE);
if (!existsSync(buildImmutable)) {
  console.error(`carry-forward: ${buildImmutable} not found — run the build first.`);
  process.exit(1);
}

// The build stamps its own version into _app/version.json (a Date.now() at
// build time). Reusing it as the generation id keeps generations sortable and
// ties each one to the deployment it shipped with.
const versionFile = join(BUILD_DIR, '_app/version.json');
if (!existsSync(versionFile)) {
  console.error(`carry-forward: ${versionFile} not found — cannot identify this build.`);
  process.exit(1);
}
const currentId = JSON.parse(readFileSync(versionFile, 'utf-8')).version;
if (!/^\d+$/.test(currentId ?? '')) {
  console.error(`carry-forward: unexpected version ${JSON.stringify(currentId)}.`);
  process.exit(1);
}

// 1. Snapshot this build's own assets, before merging anything in.
//
//    The version id is unique per build, so an existing snapshot means this
//    build was already prepared. Re-snapshotting then would fold the files
//    carried in by the earlier run into this generation, and the cache would
//    compound run over run — so reuse it instead. (The deploy flow rebuilds
//    every time, which rimrafs the output, but running this script on its own
//    would otherwise hit exactly that.)
const snapshotDir = join(CACHE_ROOT, currentId);
const alreadySnapshotted = existsSync(snapshotDir);
let ownFiles;
if (alreadySnapshotted) {
  ownFiles = walk(snapshotDir);
  console.log(`carry-forward: snapshot ${currentId} already taken — reusing ${ownFiles.length} files`);
} else {
  ownFiles = walk(buildImmutable);
  if (!dryRun) mkdirSync(snapshotDir, { recursive: true });
  const snapshot = copyInto(buildImmutable, snapshotDir, ownFiles, { overwrite: true });
  console.log(`carry-forward: snapshot ${currentId} — ${snapshot.copied} files (${kb(snapshot.bytes)})`);
}

// 2. Prune to the newest N generations. Anything not a numeric id is cache
//    debris and gets dropped too.
const generations = existsSync(CACHE_ROOT)
  ? readdirSync(CACHE_ROOT, { withFileTypes: true })
      .filter((e) => e.isDirectory())
      .map((e) => e.name)
  : [];
const valid = generations
  .filter((name) => /^\d+$/.test(name))
  // A dry run leaves no snapshot on disk; count it anyway so the summary below
  // reports what a real run would keep.
  .concat(dryRun && !alreadySnapshotted ? [currentId] : [])
  .sort((a, b) => Number(b) - Number(a));
const keep = new Set(valid.slice(0, GENERATIONS_TO_KEEP));
for (const name of generations) {
  if (keep.has(name)) continue;
  if (!dryRun) rmSync(join(CACHE_ROOT, name), { recursive: true, force: true });
  console.log(`carry-forward: pruned generation ${name}`);
}

// 3. Merge the retained older generations into the build output. Newest first,
//    and never overwrite — a file already present is this build's own.
const older = valid.filter((id) => id !== currentId && keep.has(id));
const pending = older.reduce((n, id) => n + walk(join(CACHE_ROOT, id)).length, 0);
if (ownFiles.length + pending > MAX_CARRIED_FILES) {
  console.warn(
    `carry-forward: ${ownFiles.length + pending} files would exceed the ${MAX_CARRIED_FILES} cap — skipping merge.`,
  );
  process.exit(0);
}

let added = 0;
let addedBytes = 0;
for (const id of older) {
  const from = join(CACHE_ROOT, id);
  const result = copyInto(from, buildImmutable, walk(from), { overwrite: false });
  added += result.copied;
  addedBytes += result.bytes;
  console.log(`carry-forward: +${result.copied} files (${kb(result.bytes)}) from ${id}`);
}

if (!older.length) {
  console.log('carry-forward: no previous generations yet — nothing to carry.');
}
console.log(
  `carry-forward: deploying ${ownFiles.length + added} asset files ` +
    `(${added} carried, ${kb(addedBytes)}), keeping ${keep.size} generation(s)${dryRun ? ' [dry run]' : ''}`,
);
