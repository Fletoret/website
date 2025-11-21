import { getEntries } from '$lib/db';
import { getUrlParts } from '$lib/utils';
import { error } from '@sveltejs/kit';

export function load({ url }) {
  let author;

  try {
    author = getUrlParts(url.pathname)[0];
    const { chapters, books, authorInfo } = getEntries(author, true);

    if (!authorInfo) {
      throw error(404, {
        message: `Author '${author}' not found`,
      });
    }

    return {
      chapters,
      books,
      authorInfo,
    };
  } catch (e) {
    console.error('Error loading author:', e);
    throw error(404, {
      message: `Author '${author}' not found`,
    });
  }
}
