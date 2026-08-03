#!/usr/bin/env node
// Verify that a deployment is internally consistent — that every hashed asset
// the prerendered HTML points at is actually there.
//
// Usage:
//   node scripts/verify-deploy.mjs build            check .svelte-kit/cloudflare on disk
//   node scripts/verify-deploy.mjs live             check the deployed site
//   node scripts/verify-deploy.mjs live --url https://preview.example.com
//   node scripts/verify-deploy.mjs live --timeout 240
//
// Why this exists: nothing in the pipeline ever confirmed a deploy was whole.
// Two distinct failure modes both surface to the user as a dead "500 Internal
// Error" page, and both were invisible from the terminal:
//
//   1. The build output itself is inconsistent — HTML referencing a chunk that
//      was never emitted, or that carry-forward-assets.mjs failed to retain.
//      `build` mode catches this before anything ships.
//
//   2. The deployment went live before all of its assets were reachable. Pages
//      flips the manifest as one step, but propagation is not instant; a
//      document served in that window imports chunks that 404. `live` mode
//      waits for the new version to appear, then confirms every referenced
//      asset actually resolves, retrying so ordinary propagation lag is not
//      mistaken for breakage.
//
// Exits non-zero with the offending files listed, so a bad deploy stops the
// script chain instead of being reported as a success.

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, posix, relative, sep } from 'node:path';

const BUILD_DIR = '.svelte-kit/cloudflare';
const DEFAULT_URL = 'https://fletoret.com';

// Assets are content-hashed and referenced relatively (`./_app/...`,
// `../../_app/...`) because SvelteKit's `paths.relative` defaults to true, so
// each reference has to be resolved against the directory of the HTML holding
// it rather than the site root.
const ASSET_REF = /(?:\.{1,2}\/)*_app\/immutable\/[A-Za-z0-9/._-]+\.(?:js|css)/g;

const CONCURRENCY = 12;
const ATTEMPTS = 5;
const RETRY_DELAY_MS = 4000;

const mode = process.argv[2];
const flag = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`);
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
};

const baseUrl = flag('url', DEFAULT_URL).replace(/\/$/, '');
const timeoutMs = Number(flag('timeout', '180')) * 1000;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Every file under `dir` matching `test`, as paths relative to it. */
function walk(dir, test, base = dir, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) walk(full, test, base, out);
    else if (entry.isFile() && test(entry.name)) out.push(relative(base, full));
  }
  return out;
}

/**
 * Map of asset path (relative to the site root) -> the HTML pages that ask for
 * it. Keeping the referrers means a failure can name a page to reproduce with,
 * not just an opaque hash.
 */
function collectReferences() {
  if (!existsSync(BUILD_DIR)) {
    console.error(`verify-deploy: ${BUILD_DIR} not found — run the build first.`);
    process.exit(1);
  }

  const pages = walk(BUILD_DIR, (name) => name.endsWith('.html'));
  const refs = new Map();

  for (const page of pages) {
    const html = readFileSync(join(BUILD_DIR, page), 'utf-8');
    const dir = posix.dirname(page.split(sep).join('/'));

    for (const [match] of html.matchAll(ASSET_REF)) {
      // posix.normalize collapses the leading ./ and ../ segments against the
      // page's own directory, yielding a root-relative path.
      const resolved = posix.normalize(posix.join(dir, match)).replace(/^\/+/, '');
      if (!refs.has(resolved)) refs.set(resolved, []);
      refs.get(resolved).push(page);
    }
  }

  return { pages, refs };
}

/** Run `task` over `items`, at most `CONCURRENCY` in flight. */
async function pool(items, task) {
  const results = [];
  let cursor = 0;
  const workers = Array.from({ length: Math.min(CONCURRENCY, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor++;
      results[index] = await task(items[index]);
    }
  });
  await Promise.all(workers);
  return results;
}

function report(missing, refs, scope) {
  if (!missing.length) return false;

  console.error(`\nverify-deploy: ${missing.length} asset(s) missing from ${scope}:\n`);
  for (const asset of missing.slice(0, 20)) {
    const pages = refs.get(asset) ?? [];
    const shown = pages.slice(0, 3).join(', ');
    const more = pages.length > 3 ? ` (+${pages.length - 3} more pages)` : '';
    console.error(`  ${asset}`);
    console.error(`    referenced by: ${shown}${more}`);
  }
  if (missing.length > 20) console.error(`  … and ${missing.length - 20} more`);
  return true;
}

async function verifyBuild() {
  const { pages, refs } = collectReferences();
  const missing = [...refs.keys()].filter((asset) => !existsSync(join(BUILD_DIR, asset))).sort();

  if (report(missing, refs, `${BUILD_DIR} — refusing to deploy an incomplete build`)) {
    process.exit(1);
  }

  console.log(
    `verify-deploy: build OK — ${refs.size} distinct assets referenced by ${pages.length} pages, all present.`,
  );
}

/** Wait for the deployment carrying `expected` to be the one being served. */
async function waitForVersion(expected) {
  const deadline = Date.now() + timeoutMs;
  let last = null;

  while (Date.now() < deadline) {
    try {
      const res = await fetch(`${baseUrl}/_app/version.json`, { cache: 'no-store' });
      if (res.ok) {
        const { version } = await res.json();
        if (version === expected) return true;
        if (version !== last) {
          console.log(`verify-deploy: serving ${version}, waiting for ${expected}…`);
          last = version;
        }
      }
    } catch (error) {
      console.log(`verify-deploy: ${baseUrl} unreachable (${error.message}), retrying…`);
    }
    await sleep(RETRY_DELAY_MS);
  }

  console.error(
    `verify-deploy: ${baseUrl} still serving ${last ?? 'unknown'} after ${timeoutMs / 1000}s, expected ${expected}.`,
  );
  return false;
}

async function verifyLive() {
  const versionFile = join(BUILD_DIR, '_app/version.json');
  if (!existsSync(versionFile)) {
    console.error(`verify-deploy: ${versionFile} not found — cannot identify the build to verify.`);
    process.exit(1);
  }
  const expected = JSON.parse(readFileSync(versionFile, 'utf-8')).version;

  console.log(`verify-deploy: waiting for ${baseUrl} to serve ${expected}…`);
  if (!(await waitForVersion(expected))) process.exit(1);

  const { refs } = collectReferences();
  const assets = [...refs.keys()].sort();
  console.log(`verify-deploy: checking ${assets.length} assets against ${baseUrl}…`);

  // Propagation lag is normal right after a flip, so a miss is retried rather
  // than failed on. Only assets still absent after every attempt are real.
  let outstanding = assets;

  for (let attempt = 1; attempt <= ATTEMPTS && outstanding.length; attempt++) {
    if (attempt > 1) {
      console.log(
        `verify-deploy: ${outstanding.length} not resolving yet — retry ${attempt}/${ATTEMPTS} in ${RETRY_DELAY_MS / 1000}s…`,
      );
      await sleep(RETRY_DELAY_MS);
    }

    const checked = await pool(outstanding, async (asset) => {
      try {
        const res = await fetch(`${baseUrl}/${asset}`, { method: 'HEAD', cache: 'no-store' });
        return res.ok ? null : asset;
      } catch (error) {
        return asset;
      }
    });

    outstanding = checked.filter(Boolean);
  }

  if (report(outstanding, refs, `${baseUrl} — the live deploy is incomplete`)) {
    console.error(
      '\nVisitors loading the site right now will hit a 500 error page. ' +
        'Re-run the deploy to re-upload the missing assets.',
    );
    process.exit(1);
  }

  console.log(`verify-deploy: live OK — ${assets.length} assets serving from ${baseUrl} at version ${expected}.`);
}

if (mode === 'build') await verifyBuild();
else if (mode === 'live') await verifyLive();
else {
  console.error('Usage: node scripts/verify-deploy.mjs <build|live> [--url <origin>] [--timeout <seconds>]');
  process.exit(1);
}
