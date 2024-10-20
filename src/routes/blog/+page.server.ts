import { getAllBlogEntries } from '$lib/db';

export function load({ url }) {
  const posts = getAllBlogEntries();

  // Remove body, and html attributes to make them smaller
  for (const p of posts) {
    p.body = '';
  }

  return { posts };
}
