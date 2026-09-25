#!/usr/bin/env node
// Publish agent skills: refresh the public copies in skills/ from the working
// copies in .claude/skills/, leaving out anything that shouldn't be disclosed.
//
// Usage:
//   node scripts/sync-skills.mjs          write skills/ (npm run skills:sync)
//   node scripts/sync-skills.mjs --check  exit 1 if skills/ is out of date (npm run skills:check)
//
// .claude/skills/ is gitignored: this repo is public, so the working copy
// would otherwise be published as-is. The public copy is what gets committed.
//
// What is left out:
// - skills not listed in PUBLISH below (a new skill is private until listed);
// - files named *.private.* (e.g. notes.private.md);
// - text between <!-- private --> and <!-- /private --> lines, markers included.
//
// Before writing, the output is scanned for things that must never be
// published (home-directory paths, keys, tokens, email addresses, leftover
// private markers). A hit stops the sync and names file and line. Fix the
// working copy (mark the passage private, or reword it) and run again.

import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join, relative } from 'node:path';

const SOURCE = '.claude/skills';
const TARGET = 'skills';

/** Skills published to skills/. Anything else in .claude/skills stays private. */
const PUBLISH = ['epub'];

/** Files in skills/ that are maintained by hand, not by this script. */
const HAND_MAINTAINED = ['README.md'];

const PRIVATE_BLOCK = /^[ \t]*<!--\s*private\s*-->[\s\S]*?^[ \t]*<!--\s*\/private\s*-->[ \t]*\n?/gm;

const FORBIDDEN = [
  [/\/Users\/[^/\s]+|\/home\/[^/\s]+|[A-Z]:\\Users\\/, 'absolute home-directory path'],
  [/~\/\.claude|\.claude\/projects/, 'path into the local Claude config or memory'],
  [/sk-ant-[\w-]{8,}|sk-[A-Za-z0-9]{20,}/, 'API key'],
  [/gh[pousr]_[A-Za-z0-9]{20,}|github_pat_\w{20,}/, 'GitHub token'],
  [/AKIA[0-9A-Z]{16}/, 'AWS access key'],
  [/-----BEGIN [A-Z ]*PRIVATE KEY-----/, 'private key'],
  [/\b[A-Z][A-Z0-9_]*(?:KEY|TOKEN|SECRET|PASSWORD)\s*=\s*['"]?[^\s'".]{6,}/, 'credential assignment'],
  [/[\w.+-]+@[\w-]+\.[\w.-]+/, 'email address'],
  [/<!--\s*\/?private\s*-->/, 'unmatched private marker'],
];

const walk = (dir) =>
  readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });

/** The public tree as { 'epub/SKILL.md': Buffer }, or throws on a forbidden hit. */
function build() {
  const out = {};
  const hits = [];

  for (const skill of PUBLISH) {
    const root = join(SOURCE, skill);
    if (!existsSync(join(root, 'SKILL.md'))) {
      throw new Error(`${root}/SKILL.md not found (listed in PUBLISH)`);
    }
    for (const file of walk(root)) {
      const rel = relative(SOURCE, file);
      if (/\.private\./.test(rel) || /(^|\/)\.DS_Store$/.test(rel)) continue;

      const raw = readFileSync(file);
      const text = raw.toString('utf-8');
      const isText = !text.includes('\u0000');
      if (!isText) {
        out[rel] = raw;
        continue;
      }

      // Scan the source lines that will be published, so a hit names the line
      // to fix in the working copy.
      let inPrivate = false;
      text.split('\n').forEach((line, i) => {
        if (/^[ \t]*<!--\s*private\s*-->/.test(line)) inPrivate = true;
        const skip = inPrivate;
        if (/^[ \t]*<!--\s*\/private\s*-->/.test(line)) inPrivate = false;
        if (skip) return;
        for (const [pattern, what] of FORBIDDEN) {
          if (pattern.test(line)) hits.push(`${file}:${i + 1}: ${what}`);
        }
      });
      if (inPrivate) hits.push(`${file}: <!-- private --> block never closed`);
      out[rel] = Buffer.from(text.replace(PRIVATE_BLOCK, ''));
    }
  }

  if (hits.length) {
    throw new Error(`refusing to publish:\n  ${hits.join('\n  ')}`);
  }
  return out;
}

/** What skills/ holds now, minus hand-maintained files. */
function current() {
  if (!existsSync(TARGET)) return {};
  return Object.fromEntries(
    walk(TARGET)
      .map((file) => relative(TARGET, file))
      .filter((rel) => !HAND_MAINTAINED.includes(rel) && !/(^|\/)\.DS_Store$/.test(rel))
      .map((rel) => [rel, readFileSync(join(TARGET, rel))]),
  );
}

function main() {
  const check = process.argv.includes('--check');
  const want = build();
  const have = current();

  const changed = Object.keys(want).filter((rel) => !have[rel]?.equals(want[rel]));
  const removed = Object.keys(have).filter((rel) => !(rel in want));

  if (check) {
    if (changed.length || removed.length) {
      for (const rel of changed) console.log(`skills: out of date  ${TARGET}/${rel}`);
      for (const rel of removed) console.log(`skills: not published  ${TARGET}/${rel}`);
      console.log('skills: run `npm run skills:sync` to refresh the public copies');
      process.exit(1);
    }
    console.log(`skills: ${TARGET}/ matches ${SOURCE}/ (${PUBLISH.join(', ')})`);
    return;
  }

  for (const rel of changed) {
    const path = join(TARGET, rel);
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, want[rel]);
    console.log(`skills: wrote ${path}`);
  }
  for (const rel of removed) {
    rmSync(join(TARGET, rel));
    console.log(`skills: removed ${TARGET}/${rel}`);
  }
  if (!changed.length && !removed.length) console.log('skills: already up to date');
}

try {
  main();
} catch (err) {
  console.error(`skills: ${err.message}`);
  process.exit(1);
}
