import CONFIG from '$lib/config';
import type { Person } from 'schema-dts';
import type { Author, ExtendedBookType } from '$lib/types';

/**
 * schema.org JSON-LD for books and authors.
 *
 * The entries in autore/index.json carry site fields (folder, epub,
 * publishedFletoret, …) next to their schema.org ones, so they can't be
 * serialised as they are: validators reject every unknown property. These
 * helpers pick out the schema.org fields and make every URL absolute.
 */

const absoluteUrl = (path: unknown) =>
  typeof path === 'string' && path
    ? path.startsWith('http')
      ? path
      : `${CONFIG.info.base_url}${path}`
    : undefined;

/** The author as a schema.org Person. Entries without `author` fall back to their name. */
export function personSchema(entry: Author): Person {
  const { image, ...person } = (entry.author ?? {}) as unknown as Record<string, unknown>;
  return {
    ...person,
    '@type': 'Person',
    name: entry.name,
    image: absoluteUrl(image),
    url: absoluteUrl(`/${entry.folder.replace(/\/$/, '')}/`),
  } as Person;
}

export function bookSchema(book: ExtendedBookType) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Book',
    name: book.name,
    alternativeHeadline: book.subtitle,
    description: book.abstract,
    genre: book.genre,
    datePublished: book.datePublished,
    inLanguage: book.inLanguage,
    image: absoluteUrl(book.thumbnail),
    url: book.url,
    isAccessibleForFree: book.isAccessibleForFree,
    author: book.author,
    editor: book.editor,
    translator: book.translator,
    translationOfWork: book.translationOfWork,
    workTranslation: book.workTranslation,
    workExample: book.workExample,
  };
}

/** A `<script>` tag for `{@html}`; `<` is escaped so text can't close the tag. */
export const jsonLd = (data: object) =>
  `<script type="application/ld+json">${JSON.stringify(data).replace(/</g, '\\u003c')}</script>`;
