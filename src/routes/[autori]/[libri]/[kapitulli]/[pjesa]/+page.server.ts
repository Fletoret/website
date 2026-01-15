import { getAllEntries, getAuthorInfo } from '$lib/db';
import { getUrlParts } from '$lib/utils';
import { error } from '@sveltejs/kit';
import type { Post } from '$lib/types';

export function load({ url }) {
  const author = getUrlParts(url.pathname)[0];
  const posts = getAllEntries(author);

  const post = posts.find((p) => p.relativeUrl === url.pathname.slice(1));

  if (!post) {
    throw error(404, { message: 'Post not found' });
  }

  let postBefore: Post | undefined;
  let postAfter: Post | undefined;

  for (const p of posts) {
    if (p.parent === post.parent) {
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
