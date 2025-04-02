import type { PageServerLoad, Actions } from './$types';
import { getRandomEntry } from '$lib/db';


function snippet() {
  const entry = getRandomEntry();
  const parts = entry.body.split('\n\n');
  const part = parts[Math.floor(Math.random() * parts.length)];

  // Ignore:
  // <div class="divider text-center" data-content="✱"></div>

  entry.previewSnippet = part;

  return entry;

}

export const load: PageServerLoad = () => {
  const entry = getRandomEntry();
  const parts = entry.body.split('\n\n');
  const part = parts[Math.floor(Math.random() * parts.length)];

  // Ignore:
  // <div class="divider text-center" data-content="✱"></div>

  entry.previewSnippet = part;

  return {
    entry
  };
}
