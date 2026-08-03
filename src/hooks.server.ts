import { dev } from '$app/environment';
import { redirect, type Handle } from '@sveltejs/kit';

/**
 * Dev-only parity with the `_redirects` rules Cloudflare serves in production.
 *
 * The built site is fully prerendered, so retired URLs are answered by
 * Cloudflare's static redirect layer and this hook never runs there. `vite dev`
 * has no such layer, so without this a renamed folder 404s locally and looks
 * broken while you are testing the rename.
 *
 * `$lib/redirects` is imported lazily, inside the `dev` branch, to keep its
 * Node filesystem access out of the deployed worker bundle. It is also read per
 * request rather than cached, so editing autore/index.json takes effect without
 * restarting the dev server.
 */
export const handle: Handle = async ({ event, resolve }) => {
  if (dev) {
    const { getRedirects, matchRedirect } = await import('$lib/redirects');
    const target = matchRedirect(getRedirects(), event.url.pathname);

    if (target) {
      redirect(301, target + event.url.search);
    }
  }

  return resolve(event);
};
