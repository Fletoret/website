import { getEntriesForBook } from '$lib/db';
import { getUrlParts } from '$lib/utils';

export function load({ url }) {
  try {
    const [author, book] = getUrlParts(url.pathname).slice(0, 2);

    const { chapters, authorInfo, bookInfo } = getEntriesForBook(
      author,
      book,
      true,
    );
    return { chapters, authorInfo, bookInfo };
  } catch {
    console.log('Author missing');
  }
}
