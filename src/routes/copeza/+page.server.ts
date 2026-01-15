import type { PageServerLoad } from './$types';
import { getRandomEntry } from '$lib/db';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = () => {
  const entry = getRandomEntry();

  if (!entry) {
    throw error(404, { message: 'No entry found' });
  }

  const parts = entry.body.split('\n\n');
  const part = parts[Math.floor(Math.random() * parts.length)];

  // Ignore:
  // <div class="divider text-center" data-content="✱"></div>

  entry.previewSnippet = part;

  return {
    entry,
  };
};
