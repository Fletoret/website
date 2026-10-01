import type { Person, Book, WithContext } from 'schema-dts';
import type { EditionLink } from '$lib/editions';

export type Post = {
  title: string;
  subtitle?: string;
  author?: string;
  date?: string;
  tags: Array<string>;
  img?: string;
  published: boolean;
  respectLineBreaks: boolean;
  imgWebp?: string;
  thumbnail?: string;
  body: string;
  parent: string;
  grandparent: string;
  order: number;
  relativeUrl: string;
  bookName: string;
  relativeUrlBook: string;
  url: string;
  urlBook: string;
  html: string;
  editorNotes?: Record<string, string>;
  /** Language of the text: the book's `inLanguage`, `sq` unless an edition says otherwise. */
  lang: string;
  previewSnippet?: string;
  human_date?: string;
  last_update?: string;
};

export type BlogPost = {
  title: string;
  subtitle?: string;
  author: string;
  date: string;
  tags: Array<string>;
  img?: string;
  published: boolean;
  imgWebp?: string;
  thumbnail?: string;
  last_update: string;
  body: string;
  relativeUrl: string;
  url: string;
  html: string;
  human_date: string;
};

export type ProgressState = 'complete' | 'partial' | 'missing';

export type ExtendedBookType = WithContext<Book> & {
  publishedFletoret: boolean;
  folder: string;
  /**
   * Folders this entry used to live under. They stay reachable as permanent
   * (301) redirects to `folder`, so a rename never orphans an indexed URL.
   */
  redirectPaths?: string[];
  thumbnail?: string;
  thumbnailWebp?: string;
  /** Printed under the title on the cover and the EPUB title page. */
  subtitle?: string;
  /** Build an EPUB of this book and offer it on the profile (scripts/epub.mjs). */
  epub?: boolean;
  /**
   * Folder of the author who compiled the book without being its author (the
   * Kanuni: Lekë Dukagjini's law, compiled by Gjeçovi). The book is then also
   * listed on that author's page.
   */
  compiledBy?: string;
  /** Set by db.ts from `compiledBy`: the compiler's name, for display. */
  compilerName?: string;
  /**
   * Name of the translator, for a book whose text on Fletoret is a translation
   * (Pashko Vasa's French study, in Mehdi Frashëri's Albanian). Credited on the
   * profile, the EPUB title page and colophon, and as schema.org `translator`.
   */
  translatedBy?: string;
  /**
   * How the translation was made, shown in brackets after `translatedBy`:
   * "përkthim i ri me ndihmën e AI-së, 2026" for Fletoret's own translations.
   */
  translationNote?: string;
  /**
   * This book in other languages (src/lib/editions.ts). Written in the index as
   * full book entries; db.ts flattens them into the author's `books` and
   * replaces this with the whole family, this book included.
   */
  editions?: EditionLink[];
  /** Set by db.ts on an edition: the folder of the work it's an edition of. */
  editionOf?: string;
  /** The edition in the language the work was written in. */
  original?: boolean;
};

export type Author = {
  name: string;
  description: string;
  folder: string;
  /** See `ExtendedBookType.redirectPaths`. */
  redirectPaths?: string[];
  progressState?: ProgressState;
  thumbnail: string;
  thumbnailWebp: string;
  author: WithContext<Person>;
  books?: Array<ExtendedBookType>;
};

export type FAQ = {
  title: string;
  answer: string;
  order: number;
};

export type Breadcrumb = {
  thumbnail?: string;
  text: string;
  url: string;
};
