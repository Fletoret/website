import * as fs from 'fs';

/**
 * The books the OCR editor can show.
 *
 * `data-pipeline/books.json` is the registry the pipeline writes; a book only
 * appears here once its draft OCR has actually landed in `ocr/<slug>.json`.
 */

const BOOKS_REGISTRY = 'data-pipeline/books.json';

export type OcrBook = {
  slug: string;
  title: string;
  author: string;
  year: string;
  pages: number;
};

type RegistryEntry = Partial<OcrBook> & { slug: string };

export function getOcrBooks(): OcrBook[] {
  if (!fs.existsSync(BOOKS_REGISTRY)) {
    return [];
  }

  const registry: { books?: RegistryEntry[] } = JSON.parse(
    fs.readFileSync(BOOKS_REGISTRY, 'utf-8'),
  );

  return (registry.books ?? [])
    .filter((book) => fs.existsSync(`ocr/${book.slug}.json`))
    .map((book) => ({
      slug: book.slug,
      title: book.title ?? book.slug,
      author: book.author ?? '',
      year: book.year ?? '',
      pages: book.pages ?? 0,
    }));
}

export function getOcrBook(slug: string): OcrBook | undefined {
  return getOcrBooks().find((book) => book.slug === slug);
}

/** `[imageUrl, [[line, confidence], ...]][]`, one entry per scanned page. */
export type OcrPage = [string, [string, number][]];

export function getOcrPages(slug: string): OcrPage[] {
  return JSON.parse(fs.readFileSync(`ocr/${slug}.json`, 'utf-8'));
}
