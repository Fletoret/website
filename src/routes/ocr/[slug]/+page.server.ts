import { error } from '@sveltejs/kit';
import { getOcrBook, getOcrBooks, getOcrPages } from '$lib/ocr';

// The site is fully prerendered, so every book needs to be named up front.
export function entries() {
  return getOcrBooks().map((book) => ({ slug: book.slug }));
}

export function load({ params }) {
  const book = getOcrBook(params.slug);

  if (!book) {
    throw error(404, { message: `No OCR output for ${params.slug}` });
  }

  return {
    book,
    content: getOcrPages(book.slug),
  };
}
