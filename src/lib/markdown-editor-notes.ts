import type MarkdownIt from 'markdown-it';

// Tabler's "note" outline icon (see @tabler/icons-svelte's note.svelte),
// inlined as raw markup since this HTML is produced by markdown-it at
// build time, outside of Svelte's component tree.
const NOTE_ICON_SVG =
  '<svg class="editor-note-icon" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M13 20l7 -7" /><path d="M13 20v-6a1 1 0 0 1 1 -1h6v-7a2 2 0 0 0 -2 -2h-12a2 2 0 0 0 -2 2v12a2 2 0 0 0 2 2h7" /></svg>';

/**
 * Parses a "shenimet.md" notes file (a flat numbered list, e.g.
 * `14. — *Term*. — Explanation...`) into a map of note id -> rendered HTML.
 * Blocks that don't start with a bare integer (headings, trailing errata,
 * footnote defs) are ignored.
 */
export function parseEditorNotesFile(
  body: string,
  renderer: MarkdownIt,
): Record<string, string> {
  const notes: Record<string, string> = {};
  const blocks = body.split(/\n{2,}/);

  for (const block of blocks) {
    const trimmed = block.trim();
    const match = trimmed.match(/^(\d+)\.\s*([\s\S]*)$/);
    if (!match) {
      continue;
    }

    const [, id, rest] = match;
    notes[id] = renderer.render(rest.trim());
  }

  return notes;
}

/**
 * markdown-it plugin: turns bare `(N)` references into clickable buttons,
 * but only when N is a known editor-note id (and within the notes file's
 * numeric range) — this is what keeps unrelated parenthesized numbers
 * (years, page numbers) from becoming buttons.
 */
export function editorNotesPlugin(
  md: MarkdownIt,
  noteIds: Set<string>,
): void {
  if (noteIds.size === 0) {
    return;
  }

  const maxNoteId = Math.max(...[...noteIds].map(Number));

  md.core.ruler.push('editor_notes', (state) => {
    for (const blockToken of state.tokens) {
      if (blockToken.type !== 'inline' || !blockToken.children) {
        continue;
      }

      const newChildren: InstanceType<typeof state.Token>[] = [];

      for (const token of blockToken.children) {
        if (token.type !== 'text' || !token.content.includes('(')) {
          newChildren.push(token);
          continue;
        }

        const parts = token.content.split(/\((\d+)\)/g);

        parts.forEach((part, i) => {
          // Even indices are the plain-text segments between matches;
          // odd indices are the captured digits from `(N)`.
          if (i % 2 === 0) {
            if (part) {
              const textToken = new state.Token('text', '', 0);
              textToken.content = part;
              newChildren.push(textToken);
            }
            return;
          }

          if (!noteIds.has(part) || Number(part) > maxNoteId) {
            const textToken = new state.Token('text', '', 0);
            textToken.content = `(${part})`;
            newChildren.push(textToken);
            return;
          }

          const openToken = new state.Token('editor_note_open', 'button', 1);
          openToken.attrSet('type', 'button');
          openToken.attrSet('class', 'editor-note-ref');
          openToken.attrSet('data-note-id', part);
          openToken.attrSet(
            'aria-label',
            `Shënimi i redaktorit nr. ${part}`,
          );
          newChildren.push(openToken);

          const textToken = new state.Token('text', '', 0);
          textToken.content = part;
          newChildren.push(textToken);

          newChildren.push(new state.Token('editor_note_close', 'button', -1));
        });
      }

      blockToken.children = newChildren;
    }
  });

  md.renderer.rules.editor_note_open = (tokens, idx) => {
    const attrs =
      tokens[idx].attrs
        ?.map(([name, value]) => ` ${name}="${md.utils.escapeHtml(value)}"`)
        .join('') ?? '';
    return `<button${attrs}>${NOTE_ICON_SVG}`;
  };
  md.renderer.rules.editor_note_close = () => '</button>';
}
