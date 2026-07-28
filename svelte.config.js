import adapter from '@sveltejs/adapter-cloudflare';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  // Consult https://kit.svelte.dev/docs/integrations#preprocessors
  // for more information about preprocessors
  preprocess: [vitePreprocess()],

  kit: {
    adapter: adapter({
      routes: {
        // Site is fully prerendered, no routes need Cloudflare Functions.
        // Using a non-matching pattern (/_nonexistent) because:
        // - include: [] is not allowed (must have at least one route)
        // - exclude: ['<all>'] expands to 480+ rules, exceeding _routes.json limits
        include: ['/_nonexistent'],
        exclude: [],
      },
    }),
    // inline all stylesheets smaller than 3kb
    inlineStyleThreshold: 3000,
    version: {
      // Open tabs poll /_app/version.json so they notice a deploy *before*
      // navigating into chunks the new deployment retired. Without this
      // (pollInterval defaults to 0) recovery only happens after a failed
      // import, which surfaces as MIME-type errors in the console first.
      // Paired with the beforeNavigate reload in src/routes/+layout.svelte.
      pollInterval: 300_000,
    },
  },
};

export default config;
