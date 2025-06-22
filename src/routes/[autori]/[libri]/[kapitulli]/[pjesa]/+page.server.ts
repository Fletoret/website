import { getAllEntries, getAuthorInfo } from '$lib/db';
import { getUrlParts, strip } from '$lib/utils';

export function load({ url }) {
  const author = getUrlParts(url.pathname)[0];
  const posts = getAllEntries(author);

  const post = posts.filter(
    (p) => p.relativeUrl === strip(url.pathname, '/'),
  )[0];

  let postBefore;
  let postAfter;

  for (const p of posts) {
    if (p.parent == post.parent) {
      if (p.order === post.order - 1) {
        postBefore = p;
        // Drop some attributes that won't be used and are otherwise heavy
        postBefore.body = '';
        postBefore.html = '';
      } else if (p.order === post.order + 1) {
        postAfter = p;
        // Drop some attributes that won't be used and are otherwise heavy
        postAfter.body = '';
        postAfter.html = '';
      }
    }
  }

  return {
    post,
    // postBefore,
    postAfter,
    authorInfo: getAuthorInfo(author),
  };
}
