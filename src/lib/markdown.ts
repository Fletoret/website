import config from '$lib/config';

import { format } from 'date-fns/format';
import { sq } from 'date-fns/locale';
import frontmatter from 'front-matter';
import hljs from 'highlight.js';
import markdown, { type Options as MarkdownItOptions } from 'markdown-it';
import mdAttrs from 'markdown-it-attrs';
import mdFootnote from 'markdown-it-footnote';
import mdImplicitFigures from 'markdown-it-implicit-figures';
import mdLinkAttributes from 'markdown-it-link-attributes';
import slugify from 'slugify';
import { addTrailingSlash } from '$lib/utils';

import type { BlogPost, Post, Author } from '$lib/types';

// Frontmatter attribute types
interface PostFrontmatter {
  title: string;
  subtitle?: string;
  author?: string;
  date?: string;
  tags?: string;
  img?: string;
  published?: boolean;
  respectLineBreaks?: boolean;
  imgWebp?: string;
  thumbnail?: string;
  parent: string;
  grandparent: string;
  order: number;
}

interface BlogPostFrontmatter {
  title: string;
  subtitle?: string;
  author: string;
  date: Date;
  tags?: string;
  img?: string;
  published?: boolean;
  imgWebp?: string;
  thumbnail?: string;
  last_update?: Date;
}

interface FAQFrontmatter {
  title: string;
  order: number;
}

interface MarkdownParserOptions {
  respectLineBreaks?: boolean;
  codeHighlighting?: boolean;
  latex?: boolean;
}

function getMarkdownParser({
  respectLineBreaks = true,
  codeHighlighting = true,
}: MarkdownParserOptions = {}) {
  const mdconfig: MarkdownItOptions = {
    html: true,
    linkify: false,
    typographer: true,
    breaks: respectLineBreaks,
  };

  if (codeHighlighting) {
    mdconfig.highlight = function (code: string, language: string): string {
      if (language && hljs.getLanguage(language)) {
        try {
          return `<pre class="code" data-lang="${language}"><code>${hljs.highlight(code, { language, ignoreIllegals: true }).value}</code></pre>`;
        } catch (ex) {
          console.error('Error parsing code block: ', ex);
        }
      }

      return `<pre class="code" data-lang="${language}"><code>${markdown().utils.escapeHtml(code)}</code></pre>`;
    };
  }

  const parser = markdown(mdconfig);

  parser
    .use(mdFootnote)
    .use(mdAttrs)
    .use(mdLinkAttributes, {
      pattern: /^https?:\/\//,
      attrs: {
        target: '_blank',
        rel: 'noopener noreferrer',
      },
    })
    .use(mdImplicitFigures, {
      figcaption: true,
      link: true,
    });

  return parser;
}

/**
 * Parse a post in raw markdown format. Return an object with all
 * properties of post needed for further generation. This function also takes
 * care of converting markdown to HTML.
 */
export function parse(
  authorFolder: string,
  content: string,
  filepath: string,
  authorIndexEntry: Author,
): Post | undefined {
  // Make sure metadata header is available
  if (frontmatter.test(content) === false) {
    console.warn('mixing metadata block');
    return;
  }

  const book = (authorIndexEntry?.books || []).filter(
    (b) => typeof b.folder === 'string' && filepath.indexOf(b.folder) !== -1,
  )[0];

  if (!book.publishedFletoret) {
    return;
  }

  // Parse metadata and body of post (what comes after metadata)
  const {
    attributes: {
      title,
      subtitle,
      author,
      date,
      tags = '',
      img,
      published,
      respectLineBreaks,
      imgWebp,
      thumbnail,
      parent,
      grandparent,
      order,
    },
    body,
  } = frontmatter<PostFrontmatter>(content);

  let _parts = [grandparent, parent, title];
  const parts: string[] = [];

  _parts.forEach((x) => {
    parts.push(
      slugify(x ? x.toLowerCase() : 'p')
        .replaceAll(' ', '-')
        .replace(/[^\w-]/g, '')
        .replace(/[-]+/g, '-'),
    );
  });

  const relativeUrl = addTrailingSlash(`${authorFolder}/${parts.join('/')}`);

  const md = getMarkdownParser({
    codeHighlighting: false,
    respectLineBreaks: respectLineBreaks,
    latex: false,
  });

  slugify.extend({
    '—': '-',
  });

  const html = md.render(body);
  const tagsArray = tags.trim().split(/\s*,\s*/g);

  const post = {
    // Metadata from post
    author,
    date,
    img,
    imgWebp,
    thumbnail: thumbnail || img,
    published: published === true,
    respectLineBreaks: respectLineBreaks === true,
    subtitle,
    tags: tagsArray,
    hashtags: tagsArray.map((tag) => tag.replace(/[^\w]/g, '')).join(','),
    title,
    parent,
    grandparent,
    order: Number(order),

    // Generated metadata
    // human_date: format(date, 'do MMMM yyyy'),
    // last_update: last_update ? format(last_update, 'do MMMM yyyy') : '',
    bookName: String(book.name || ''),
    relativeUrl,
    relativeUrlBook: addTrailingSlash(`${book.folder}`),
    url: `${config.info.base_url}/${relativeUrl}`,
    urlBook: addTrailingSlash(`${config.info.base_url}/${book.folder}`),
    // Body
    body,
    html,
  };

  // Check if mandatory metadata are specified
  for (const meta of ['title', 'parent', 'grandparent', 'order'] as const) {
    if (post[meta] === undefined) {
      return;
    }
  }

  // Check if images are specified
  if (img !== undefined) {
    if (img.startsWith('images/') === false) {
      return;
    }
  }

  return post;
}

export function parseFAQ(content: string) {
  const {
    attributes: { title, order },
    body,
  } = frontmatter<FAQFrontmatter>(content);

  const md = getMarkdownParser({
    codeHighlighting: false,
    respectLineBreaks: false,
    latex: false,
  });

  slugify.extend({
    '—': '-',
  });

  const answer = md.render(body);

  return { title, order, answer };
}

/**
 * Parse a post in raw markdown format. Return an object with all
 * properties of post needed for further generation. This function also takes
 * care of converting markdown to HTML.
 */
export function parseBlogPost(
  content: string,
  { prefix = 'blog', includeDateInPath = false } = {},
): BlogPost | undefined {
  // Make sure metadata header is available
  if (frontmatter.test(content) === false) {
    console.warn('missing metadata block');
    return;
  }

  // Parse metadata and body of post (what comes after metadata)
  const {
    attributes: {
      title,
      subtitle,
      author,
      date,
      tags = '',
      img,
      published,
      imgWebp,
      thumbnail,
      last_update,
    },
    body,
  } = frontmatter<BlogPostFrontmatter>(content);

  const parts = [prefix];
  if (includeDateInPath) {
    parts.push(format(date, 'yyyy-MM-dd'));
  }
  parts.push(
    slugify(title.toLowerCase())
      .replace(/[^\w-]/g, '')
      .replace(/[-]+/g, '-'),
  );

  const relativeUrl = `${parts.join('/')}`;

  const md = getMarkdownParser({
    codeHighlighting: true,
    respectLineBreaks: false,
    latex: false,
  });

  const html = md.render(body);
  const tagsArray = tags.trim().split(/\s*,\s*/g);

  const post = {
    // Metadata from post
    author,
    date,
    img,
    imgWebp,
    thumbnail: thumbnail || img,
    published: published === true,
    subtitle,
    tags: tagsArray,
    hashtags: tagsArray.map((tag) => tag.replace(/[^\w]/g, '')).join(','),
    title,

    // Generated metadata
    human_date: format(date, 'd MMMM yyyy', { locale: sq }),
    last_update: last_update
      ? format(last_update, 'd MMMM yyyy', { locale: sq })
      : '',
    relativeUrl,
    url: addTrailingSlash(`${config.info.base_url}/${relativeUrl}`),
    // Body
    body,
    html,
  };

  const formattedDate = format(date, 'yyyy-MM-dd');

  // Check if mandatory metadata are specified
  for (const meta of ['author', 'date', 'title'] as const) {
    if (post[meta] === undefined) {
      return;
    }
  }

  // Update date to formatted string
  const finalPost: BlogPost = { ...post, date: formattedDate };

  // Check if images are specified
  if (img !== undefined) {
    if (img.startsWith('images/') === false) {
      return;
    }

    if (imgWebp === undefined) {
      return;
    }
  }

  return finalPost;
}
