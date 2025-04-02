import fs from 'fs';
import { globSync } from 'glob';
import { parse, parseBlogPost, parseFAQ } from '$lib/markdown';
import type { Post, BlogPost, FAQ, Author } from '$lib/types';

const sortedPosts = (posts: Post[]) => {
  return posts.sort(function (a: Post, b: Post) {
    return a.order - b.order;
  });
};

const sortedFAQ = (posts: FAQ[]) => {
  return posts.sort(function (a: FAQ, b: FAQ) {
    return a.order - b.order;
  });
};

const groupBy = function (xs, key) {
  return xs.reduce(function (rv, x) {
    (rv[x[key]] = rv[x[key]] || []).push(x);
    return rv;
  }, {});
};

export function getAuthorsIndex(excludeEmpty = false): Map<string, Author> {
  const INDEX_AUTHORS_FILEPATH = 'autore/index.json';
  const idx: Record<string, Author> = JSON.parse(
    fs.readFileSync(INDEX_AUTHORS_FILEPATH, 'utf-8'),
  );

  Object.keys(idx).forEach((name) => {
    const author = idx[name];
    author.thumbnailWebp = author.thumbnail.replace('.avif', '.webp');
  });

  const authorIndex: Map<string, Author> = new Map();

  for (const entry of Object.values(idx)) {
    if (entry.books) {
      for (const book of entry.books) {
        book.author = entry.author;
        book.thumbnailWebp = book.thumbnail.replace('.avif', '.webp');
      }
    }

    if (excludeEmpty) {
      if (entry?.progressState !== 'missing') {
        authorIndex.set(entry.folder, entry);
      }
    } else {
      authorIndex.set(entry.folder, entry);
    }
  }

  return authorIndex;
}

export function getAuthorInfo(authorName: string): Author | undefined {
  const index = getAuthorsIndex();

  if (index.has(authorName)) {
    const author = index.get(authorName);
    for (const book of author?.books || []) {
      book.thumbnailWebp = book.thumbnail.replace('.avif', '.webp');
    }

    return author;
  }

  return;
}

function loadEntriesInFolder(author: string, globPattern: string): Post[] {
  const entries: Post[] = [];
  const filepaths = globSync(globPattern);

  filepaths.forEach((filepath: string) => {
    const content = fs.readFileSync(filepath, 'utf-8');
    const entry = parse(author, content);
    if (entry) {
      entries.push(entry);
    }
  });

  return entries;
}

export function getAllEntries(author: string): Post[] {
  const entries: Post[] = loadEntriesInFolder(
    author,
    `autore/${author}/**/*.md`,
  );
  return entries;
}

export function getRandomEntry(): Post {
  const filepaths = globSync('autore/**/*.md');
  const randomFilePath =
    filepaths[Math.floor(Math.random() * filepaths.length)];
  const content = fs.readFileSync(randomFilePath, 'utf-8');

  const author = randomFilePath.split('/')[1];
  const entry = parse(author, content);

  return entry;
}

export function getBookEntries(author: string, book: string) {
  const entries: Post[] = loadEntriesInFolder(
    author,
    `autore/${author}/${book}/**/*.md`,
  );
  return entries;
}

export function getAllBlogEntries() {
  let entries: BlogPost[] = [];

  const filepaths = globSync('blog/*.md');

  filepaths.forEach((filepath: string) => {
    const content = fs.readFileSync(filepath, 'utf-8');
    const entry = parseBlogPost(content);
    if (entry) {
      entries.push(entry);
    }
  });

  return entries.sort(function (a, b) {
    var keyA = new Date(a.date),
      keyB = new Date(b.date);
    // Compare the 2 dates
    if (keyA < keyB) return 1;
    if (keyA > keyB) return -1;
    return 0;
  });
}

export const getEntries = (
  author: string,
  dropUnusedAttributes = false,
  publishedOnly = false,
) => {
  let entries = getAllEntries(author);
  if (publishedOnly) {
    entries = entries.filter((p: Post) => p.published == true);
  }

  let authorInfo = getAuthorInfo(author);

  const _books = [];
  for (const book of authorInfo?.books || []) {
    // console.log(author, book?.folder.split('/')[1]);
    const bp = getBookEntries(author, book?.folder.split('/')[1]);
    const bookEntries = sortedPosts(bp);

    book.thumbnailWebp = book.thumbnail.replace('.avif', '.webp');

    if (dropUnusedAttributes) {
      for (const e of bookEntries) {
        e.html = '';
        e.body = '';
      }
    }

    _books.push([book, groupBy(bookEntries, 'parent')]);
  }

  const chapters = groupBy(entries, 'parent');

  for (let [parent, _entries] of Object.entries(chapters)) {
    _entries = sortedPosts(_entries);
    if (dropUnusedAttributes) {
      for (const e of entries) {
        e.html = '';
        e.body = '';
      }
    }
  }

  return { chapters, books: _books, authorInfo };
};

export const getEntriesForBook = (
  author: string,
  book: string,
  dropUnusedAttributes = false,
  publishedOnly = false,
) => {
  const bookFolder = `${author}/${book}`;
  const nestedBookFolder = `${author}/p/${book}`;

  const entries = getAllEntries(author).filter(
    (p: Post) =>
      p.relativeUrl.startsWith(bookFolder) ||
      p.relativeUrl.startsWith(nestedBookFolder),
  );

  for (const entry of entries) {
    if (dropUnusedAttributes) {
      entry.html = '';
      entry.body = '';
    }
  }

  let authorInfo = getAuthorInfo(author);
  const bookInfo = authorInfo?.books?.filter((x) => x.folder === bookFolder)[0];

  // const book = groupBy(entries, "grandparent");
  const chapters = groupBy(entries, 'parent');

  for (let [_, _entries] of Object.entries(chapters)) {
    _entries = sortedPosts(_entries);
  }

  return { chapters, authorInfo, bookInfo };
};

export const getFAQ = (): FAQ[] => {
  let entries: FAQ[] = [];

  const filepaths = globSync(`faq/**/*.md`);

  filepaths.forEach((filepath: string) => {
    const content = fs.readFileSync(filepath, 'utf-8');
    const entry = parseFAQ(content);
    if (entry) {
      entries.push(entry);
    }
  });

  return sortedFAQ(entries);
};
