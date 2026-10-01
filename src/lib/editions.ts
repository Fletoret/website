// Language editions of a book. A work is listed once in autore/index.json, as
// its Albanian text; its editions in other languages (the French original of
// Dora d'Istria's «Des femmes, par une femme») go in the work's `editions`
// list. Each edition is a whole book with its own folder, chapters, profile
// page and EPUB. Kept free of imports, like epub.ts: the EPUB build runs this
// under plain Node.

export const DEFAULT_LANGUAGE = 'sq';

type Language = {
  /** The language's name in Albanian, the site's own language. */
  name: string;
  /** What the language calls itself, for the language switch. */
  native: string;
  /** og:locale */
  locale: string;
  /** "Published in 1865." after a book's abstract on its profile. */
  published: (year: string) => string;
};

export const LANGUAGES: Record<string, Language> = {
  sq: { name: 'shqip', native: 'Shqip', locale: 'sq_AL', published: (y) => `Botuar në ${y}.` },
  fr: { name: 'frëngjisht', native: 'Français', locale: 'fr_FR', published: (y) => `Publié en ${y}.` },
  it: { name: 'italisht', native: 'Italiano', locale: 'it_IT', published: (y) => `Pubblicato nel ${y}.` },
  en: { name: 'anglisht', native: 'English', locale: 'en_GB', published: (y) => `Published in ${y}.` },
  de: { name: 'gjermanisht', native: 'Deutsch', locale: 'de_DE', published: (y) => `Erschienen ${y}.` },
};

export const languageInfo = (lang: string) => LANGUAGES[lang] ?? LANGUAGES[DEFAULT_LANGUAGE];

/** One member of a work's family of editions, as the language switch lists it. */
export type EditionLink = {
  name: string;
  folder: string;
  inLanguage: string;
  /** The text the work was written in; the others are translations of it. */
  original?: boolean;
};

type BookLike = {
  name?: unknown;
  folder?: string;
  inLanguage?: unknown;
  original?: boolean;
  editions?: unknown;
  editionOf?: string;
};

/**
 * What an edition takes from its work when it doesn't set it. The rest (name,
 * abstract, cover, translator, EPUB flag, …) belongs to one edition only.
 */
const INHERITED = ['@context', '@type', 'genre', 'datePublished', 'compiledBy', 'publishedFletoret'];

export const languageOf = (book: { inLanguage?: unknown }) =>
  typeof book.inLanguage === 'string' && book.inLanguage ? book.inLanguage : DEFAULT_LANGUAGE;

/**
 * An author's books with each work's editions flattened in right after it, so
 * that everything which looks a book up by folder finds editions too. Every
 * edition gets `editionOf` (the work's folder), and every member of a family
 * gets `editions`: the whole family, itself included, work first.
 */
export function expandEditions<T extends BookLike>(books: T[] = []): T[] {
  const out: T[] = [];
  for (const work of books) {
    const raw = (work.editions ?? []) as BookLike[];
    if (raw.length === 0) {
      out.push(work);
      continue;
    }
    const editions = raw.map((edition) => {
      const inherited = Object.fromEntries(
        INHERITED.filter((key) => key in work && !(key in edition)).map((key) => [
          key,
          (work as Record<string, unknown>)[key],
        ]),
      );
      return { ...inherited, ...edition, editionOf: work.folder } as T;
    });
    const family: EditionLink[] = [work, ...editions].map((book) => ({
      name: String(book.name ?? ''),
      folder: String(book.folder ?? ''),
      inLanguage: languageOf(book),
      ...(book.original ? { original: true } : {}),
    }));
    out.push({ ...work, editions: family });
    for (const edition of editions) out.push({ ...edition, editions: family });
  }
  return out;
}
