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
  },
};

export default config;
