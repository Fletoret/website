import { sveltekit } from '@sveltejs/kit/vite';
import type { Plugin, HmrContext } from 'vite';
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
    sveltekit(),
  ],
  cssTarget: 'inline',
};

export default config;
