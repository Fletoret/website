import { getAllBlogEntries } from '$lib/db';
import { strip } from '$lib/utils';

export function load({ url }) {
  const posts = getAllBlogEntries();
  const post = posts.filter(
    (p) => p.relativeUrl == strip(url.pathname, '/'),
  )[0];

  return { post };
}
