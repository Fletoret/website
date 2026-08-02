import { getOcrBooks } from '$lib/ocr';

export function load() {
  return { books: getOcrBooks() };
}
