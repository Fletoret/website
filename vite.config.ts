import { sveltekit } from '@sveltejs/kit/vite';
// import { imagetools } from 'vite-imagetools';

function ReloadOnContentChangePlugin() {
  return {
    name: 'reload-content-change',
    enforce: 'post',
    // HMR
    handleHotUpdate({ file, server }) {
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
