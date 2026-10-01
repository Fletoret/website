// A chapter's URL path, shared by the site (markdown.ts) and the EPUB build
// (scripts/epub.mjs), which turns links between chapters into links inside the
// book. The URL comes from the frontmatter, not the folders: book, part and
// title (or `slug`), each slugified.
import slugify from 'slugify';

slugify.extend({ '—': '-' });

export const toSlug = (x: string | undefined | null) =>
  slugify(x ? String(x).toLowerCase() : 'p')
    .replaceAll(' ', '-')
    .replace(/[^\w-]/g, '')
    .replace(/[-]+/g, '-');

type ChapterMeta = { grandparent?: string | null; parent?: string | null; title?: string | null; slug?: string | null };

/** `dora-distria/per-grate-nga-nje-grua/shoqeria-latine/letra-i/` (no leading slash). */
export const chapterPath = (authorFolder: string, meta: ChapterMeta) =>
  `${authorFolder}/${[toSlug(meta.grandparent), toSlug(meta.parent), toSlug(meta.slug || meta.title)].join('/')}/`;
