import type { Person, Book, WithContext } from 'schema-dts';

export type Post = {
  title: string;
  subtitle: string;
  author: string;
  date: string;
  tags: Array<string>;
  img: string;
  published: boolean;
  respectLineBreaks: boolean;
  imgWebp: string;
  thumbnail: string;
  thumbnailWebp: string;
  last_update: string;
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
  previewSnippet?: string;
};

export type BlogPost = {
  title: string;
  subtitle: string;
  author: string;
  date: string;
  tags: Array<string>;
  img: string;
  published: boolean;
  respectLineBreaks: boolean;
  imgWebp: string;
  thumbnail: string;
  last_update: string;
  body: string;
  relativeUrl: string;
  url: string;
  html: string;
  human_date: string;
};

export type ProgressState = 'complete' | 'partial' | 'missing';

type ExtendedBookType = WithContext<Book> & {
  publishedFletoret: boolean;
};

export type Author = {
  name: string;
  description: string;
  folder: string;
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
