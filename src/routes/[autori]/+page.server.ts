import { getEntries } from '$lib/db';
import { getUrlParts } from '$lib/utils';

export function load({ url }) {
  let author;

  try {
    author = getUrlParts(url.pathname)[0];

    const { chapters, books, authorInfo } = getEntries(author, true);
    return {
      chapters,
      books,
      authorInfo,
    };
  } catch (e) {
    console.log(e);
    console.log('Author missing');
  }
}
