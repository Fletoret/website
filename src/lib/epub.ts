// Where a book's EPUB is served. Shared by the build (scripts/epub.mjs) and the
// download link on the book profile, so the two can't drift apart. Kept free of
// imports: the build runs it under plain Node, the profile ships it to browsers.

/** URL path of the EPUB for a book folder, e.g. `/epub/konica/doktor-gjilpera.epub`. */
export const epubHref = (bookFolder: string) => `/epub/${bookFolder}.epub`;

/** File under static/ that `epubHref` serves. */
export const epubStaticPath = (bookFolder: string) =>
  `static${epubHref(bookFolder)}`;

/**
 * Name the downloaded file after author and book, Standard Ebooks style:
 * `faik-konica_doktor-gjilpera.epub`.
 */
export const epubDownloadName = (authorName: string, bookFolder: string) => {
  const author = authorName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return `${author}_${bookFolder.split('/')[1]}.epub`;
};

/**
 * What pages say about a book's e-book, in Albanian and English, for meta
 * descriptions and titles (the site is Albanian; English catches searches like
 * "download albanian epub").
 */
export const EPUB_BLURB =
  'Lexoje online ose shkarkoje falas si e-book (EPUB). Read online or download the free EPUB ebook.';
/** The same for a page listing several books (an author's). */
export const EPUB_BLURB_PLURAL =
  'Lexoji online ose shkarkoji falas si e-book (EPUB). Read online or download the free EPUB ebooks.';
export const EPUB_TITLE_SUFFIX = 'lexo online, shkarko EPUB falas';
