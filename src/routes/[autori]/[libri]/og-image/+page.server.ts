export const prerender = true;

import fs from 'fs';
import { error } from '@sveltejs/kit';
import { dev } from '$app/environment';

import { getAuthorInfo, getAuthorsIndex } from '$lib/db';

/**
 * The frames themselves are rendered offline by `npm run og:images`
 * (scripts/og-images.py) and committed under static/images/og/. This route only
 * serves what that run produced, so the page and the picture can never disagree
 * about a count.
 */
const MANIFEST = 'static/images/og/manifest.json';

type ManifestEntry = {
  image: string;
  width: number;
  height: number;
  alt: string;
  unit: string;
  unitCount: number;
  words: number;
  pieces: number;
  lines: number;
};

let cached: Record<string, ManifestEntry> | undefined;

function manifest(): Record<string, ManifestEntry> {
  // Cached for the build, re-read in dev so a fresh `npm run og:images` shows
  // up without restarting the server.
  if (!cached || dev) {
    cached = fs.existsSync(MANIFEST)
      ? JSON.parse(fs.readFileSync(MANIFEST, 'utf-8'))
      : {};
  }
  return cached as Record<string, ManifestEntry>;
}

/**
 * Nothing links here from the site, so the prerenderer's crawler would never
 * find these pages. Hand it the published books explicitly — but only those the
 * generator has actually rendered, so a book added to the index before its
 * image is made leaves this route out rather than failing the build.
 */
export function entries() {
  const rendered = manifest();
  const params: { autori: string; libri: string }[] = [];

  for (const author of getAuthorsIndex().values()) {
    for (const book of author.books || []) {
      if (!book.publishedFletoret || !book.folder) continue;
      if (!rendered[book.folder]) continue;
      const [autori, libri] = book.folder.split('/');
      if (autori && libri) params.push({ autori, libri });
    }
  }

  return params;
}

export function load({ params }) {
  const folder = `${params.autori}/${params.libri}`;
  const image = manifest()[folder];

  if (!image) {
    error(404, `S'ka pamje për ${folder}. Ekzekuto: npm run og:images`);
  }

  const authorInfo = getAuthorInfo(params.autori);
  const bookInfo = authorInfo?.books?.find((b) => b.folder === folder);

  if (!authorInfo || !bookInfo) {
    error(404, `Libri ${folder} nuk u gjet.`);
  }

  return {
    image,
    bytes: fs.statSync(`static${image.image}`).size,
    book: {
      name: String(bookInfo.name ?? params.libri),
      folder,
      datePublished: String(bookInfo.datePublished ?? ''),
    },
    author: { name: authorInfo.name, folder: params.autori },
  };
}
