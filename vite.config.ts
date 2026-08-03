import { sveltekit } from '@sveltejs/kit/vite';
import type { Plugin, HmrContext } from 'vite';
import { writeFileSync } from 'node:fs';
import { getRedirects, renderRedirects } from './src/lib/redirects';
// import { imagetools } from 'vite-imagetools';

function ReloadOnContentChangePlugin(): Plugin {
  return {
    name: 'reload-content-change',
    enforce: 'post',
    // HMR
    handleHotUpdate({ file, server }: HmrContext) {
      if (file.endsWith('.md')) {
        console.log(`${file} update ...`);
        server.ws.send({
          type: 'full-reload',
          path: '*',
        });
      }
    },
  };
}

/**
 * Turn the `redirectPaths` fields in autore/index.json into a `_redirects`
 * file, so folders a page has been renamed away from keep answering with a
 * permanent (301) redirect to the canonical one.
 *
 * The file goes in the project root rather than static/: adapter-cloudflare
 * copies a root `_redirects` into the deployed output (and rejects one under
 * static/), appending its own prerendered redirects to it. Written at
 * buildStart so it is in place long before the adapter runs.
 */
function CanonicalRedirectsPlugin(): Plugin {
  return {
    name: 'canonical-redirects',
    apply: 'build',
    buildStart() {
      // Deliberately unguarded: getRedirects() throws on a mapping that would
      // be wrong in production, and failing the build beats shipping it.
      const redirects = getRedirects();
      writeFileSync('_redirects', renderRedirects(redirects));
      console.log(
        `canonical-redirects: ${redirects.length} mapping(s) written to _redirects`,
      );
    },
  };
}

/** @type {import('vite').UserConfig} */
const config = {
  plugins: [
    // NOTE: Look into this
    // imagetools({
    //   removeMetadata: true,
    //   defaultDirectives: () => {
    //     return new URLSearchParams({
    //       format: 'avif;webp;',
    //     });
    //   }
    // }),

    ReloadOnContentChangePlugin(),
    CanonicalRedirectsPlugin(),
    sveltekit(),
  ],
  cssTarget: 'inline',
};

export default config;
