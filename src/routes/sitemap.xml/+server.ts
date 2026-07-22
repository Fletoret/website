export const prerender = true;

import { getAuthorsIndex, getAllEntries, getAllBlogEntries } from '$lib/db';
import CONFIG from '$lib/config';
import { addTrailingSlash } from '$lib/utils';

function sitemapUrl(
  relativeUrl: string,
  frequency: string = 'weekly',
  priority: number = 0.7,
) {
  // Ensure all URLs have trailing slashes to match trailingSlash: 'always' config,
  // and avoid a double slash for the homepage (empty relative URL).
  const path = addTrailingSlash(relativeUrl).replace(/^\/+/, '');
  return `<url>
  <loc>${CONFIG.info.base_url}/${path}</loc>
  <changefreq>${frequency}</changefreq>
  <priority>${priority}</priority>
</url>`;
}

export async function GET() {
  // De-duplicate by URL so no page is listed more than once.
  const urlSet = new Map<string, string>();
  const add = (relativeUrl: string, frequency?: string, priority?: number) => {
    const key = addTrailingSlash(relativeUrl);
    if (!urlSet.has(key)) {
      urlSet.set(key, sitemapUrl(relativeUrl, frequency, priority));
    }
  };

  // Homepage + top-level static pages
  add('', 'weekly', 1);
  add('blog', 'weekly', 0.6);
  add('copeza', 'monthly', 0.4);

  const authorsIndex = getAuthorsIndex();

  for (const [name, author] of authorsIndex) {
    if (
      author?.progressState === 'complete' ||
      author?.progressState === 'partial'
    ) {
      // Author page
      add(author.folder, 'daily', 0.9);

      // Book pages
      if (author.books) {
        for (const book of author.books) {
          add(book.folder, 'daily', 0.8);
        }
      }

      // Creative Work pages
      for (const post of getAllEntries(name)) {
        add(post.relativeUrl, 'weekly', 0.7);
      }
    }
  }

  // Blog posts
  for (const post of getAllBlogEntries()) {
    add(post.relativeUrl, 'weekly', 0.6);
  }

  const urls = [...urlSet.values()];

  return new Response(
    `
		<?xml version="1.0" encoding="UTF-8" ?>
		<urlset
			xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
			xmlns:xhtml="http://www.w3.org/1999/xhtml"
			xmlns:mobile="http://www.google.com/schemas/sitemap-mobile/1.0"
			xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
			xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
			xmlns:video="http://www.google.com/schemas/sitemap-video/1.1"
		>
			${urls.join('\n')}
		</urlset>`.trim(),
    {
      headers: {
        'Content-Type': 'application/xml',
      },
    },
  );
}
