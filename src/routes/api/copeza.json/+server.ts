import { json } from '@sveltejs/kit';
import { globSync } from 'glob';
import * as fs from 'fs';
import { parse } from '$lib/markdown';
import { getAuthorsIndex } from '$lib/db';
import type { RequestHandler } from './$types';

export const prerender = true;

interface CopezaEntry {
  title: string;
  author: string;
  parent: string;
  grandparent: string;
  snippets: string[];
  url: string;
}

export const GET: RequestHandler = () => {
  const filepaths = globSync('autore/**/*.md');
  const index = getAuthorsIndex();
  const entries: CopezaEntry[] = [];

  for (const filepath of filepaths) {
    const content = fs.readFileSync(filepath, 'utf-8');
    const author = filepath.split('/')[1];
    const authorIndex = index.get(author);

    if (!authorIndex) continue;

    const entry = parse(author, content, filepath, authorIndex);
    if (!entry) continue;

    // Split body into paragraphs for random snippet selection
    const snippets = entry.body
      .split('\n\n')
      .filter((s) => s.trim().length > 50); // Only keep substantial paragraphs

    if (snippets.length === 0) continue;

    entries.push({
      title: entry.title,
      author: entry.author ?? '',
      parent: entry.parent,
      grandparent: entry.grandparent,
      snippets,
      url: entry.relativeUrl,
    });
  }

  return json(entries);
};
