// Type declarations for markdown-it plugins without @types packages
declare module 'markdown-it-attrs' {
  import type MarkdownIt from 'markdown-it';
  const plugin: MarkdownIt.PluginSimple;
  export default plugin;
}

declare module 'markdown-it-footnote' {
  import type MarkdownIt from 'markdown-it';
  const plugin: MarkdownIt.PluginSimple;
  export default plugin;
}

declare module 'markdown-it-implicit-figures' {
  import type MarkdownIt from 'markdown-it';
  interface ImplicitFiguresOptions {
    figcaption?: boolean;
    link?: boolean;
  }
  const plugin: MarkdownIt.PluginWithOptions<ImplicitFiguresOptions>;
  export default plugin;
}

declare module 'markdown-it-link-attributes' {
  import type MarkdownIt from 'markdown-it';
  interface LinkAttributesOptions {
    pattern?: RegExp;
    attrs?: Record<string, string>;
  }
  const plugin: MarkdownIt.PluginWithOptions<LinkAttributesOptions>;
  export default plugin;
}
