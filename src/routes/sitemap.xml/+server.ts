export const prerender = true;

import { getAuthorsIndex, getAllEntries, getBookEntries } from '$lib/db';
import CONFIG from '$lib/config';

function sitemapUrl(
  relativeUrl: string,
  frequency: string = 'weekly',
  priority: number = 0.7,
) {
  // NOTE: Trailing slash is handled when the relativeUrl is created
  return `<url>
  <loc>${CONFIG.info.base_url}/${relativeUrl}</loc>
  <changefreq>${frequency}</changefreq>
  <priority>${priority}</priority>
</url>`;
}

export async function GET() {
  const authorURLs = [];
  const postURLs = [];
  // TODO: Add book pages to sitemap.xml
  // const bookURLs = [];
  // console.log('getBookEntries: ', getBookEntries());

  const authorsIndex = getAuthorsIndex();

  for (const [name, author] of authorsIndex) {
    if (
      author?.progressState === 'complete' ||
      author?.progressState === 'partial'
    ) {
      authorURLs.push(sitemapUrl(author.folder));

      const authorWorks = getAllEntries(name);

      // Book pages
      if (author.books) {
        for (const book of author.books) {
          postURLs.push(sitemapUrl(book.folder, 'daily', 1));
        }
      }

      // Author page
      postURLs.push(sitemapUrl(name, 'daily', 1));

      // Creative Work pages
      for (const post of authorWorks) {
        postURLs.push(sitemapUrl(post.relativeUrl, 'weekly', 1));
      }
    }
  }

  const urls = authorURLs.concat(postURLs);

  return new Response(
    `
		<?xml version="1.0" encoding="UTF-8" ?>
		<urlset
			xmlns="https://www.sitemaps.org/schemas/sitemap/0.9"
			xmlns:xhtml="https://www.w3.org/1999/xhtml"
			xmlns:mobile="https://www.google.com/schemas/sitemap-mobile/1.0"
			xmlns:news="https://www.google.com/schemas/sitemap-news/0.9"
			xmlns:image="https://www.google.com/schemas/sitemap-image/1.1"
			xmlns:video="https://www.google.com/schemas/sitemap-video/1.1"
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
