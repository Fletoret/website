// Language-specific typography, shared by the site (markdown.ts) and the EPUB
// build (scripts/epub.mjs). Kept free of imports: the build runs it under
// plain Node.

const NBSP = ' ';
const NNBSP = ' ';

/**
 * French spacing: the space inside « » and before a colon becomes no-break,
 * and the one before ; ! ? a narrow no-break space, so a line never starts
 * with the punctuation. Sources are typed with ordinary spaces.
 */
export function frenchSpacing(text: string): string {
  return text
    .replace(/« +/g, `«${NBSP}`)
    .replace(/ +»/g, `${NBSP}»`)
    .replace(/ +:/g, `${NBSP}:`)
    .replace(/ +([;!?])/g, `${NNBSP}$1`);
}

/** The typography pass for text in `lang`, or undefined when it needs none. */
export const typographyFor = (lang: string) => (lang === 'fr' ? frenchSpacing : undefined);
