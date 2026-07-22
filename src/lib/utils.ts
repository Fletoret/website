import { toPng } from 'html-to-image';

export function strip(s: string, char: string): string {
  let x = s;
  if (x.startsWith(char)) x = x.slice(1);
  if (x.endsWith(char)) x = x.slice(0, x.length - 1);
  return x;
}

/**
 * Turn raw markdown into a clean, single-line snippet suitable for a
 * <meta name="description"> / og:description. Strips common markdown syntax,
 * collapses whitespace and trims to `maxLen` on a word boundary.
 */
export function stripMarkdown(s: string, maxLen = 160): string {
  let text = (s || '')
    .replace(/```[\s\S]*?```/g, ' ') // fenced code blocks
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ') // images
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1') // links -> text
    .replace(/^\s{0,3}#{1,6}\s+/gm, '') // headings
    .replace(/^\s{0,3}>\s?/gm, '') // blockquotes
    .replace(/^\s*[-*+]\s+/gm, '') // list bullets
    .replace(/\[\^[^\]]+\]/g, '') // footnote refs
    .replace(/[*_~`#]+/g, '') // emphasis / inline code marks
    .replace(/\s+/g, ' ') // collapse whitespace
    .trim();

  if (text.length <= maxLen) return text;

  const truncated = text.slice(0, maxLen);
  const lastSpace = truncated.lastIndexOf(' ');
  return (lastSpace > 0 ? truncated.slice(0, lastSpace) : truncated).trimEnd() + '…';
}

export function addTrailingSlash(s: string): string {
  if (s.endsWith('/')) return s;
  return s + '/';
}

export function getUrlParts(s: string): string[] {
  return strip(s, '/').split('/');
}

export async function downloadImage(imageDataUrl: string, filename: string) {
  const response = await fetch(imageDataUrl);
  const blob = await response.blob();
  const file = new File([blob], `${filename}.png`, { type: 'image/png' });

  // Use Web Share API on mobile if available
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({
        files: [file],
      });
      return;
    } catch (err) {
      // User cancelled or share failed, fall back to download
      if ((err as Error).name === 'AbortError') return;
    }
  }

  // Fallback: regular download
  const blobUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = blobUrl;
  link.download = `${filename}.png`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(blobUrl);
}

export async function domToImage(node: HTMLElement, filename: string) {
  if (node) {
    const rect = node.getBoundingClientRect();
    const dataUrl = await toPng(node, {
      width: rect.width,
      height: rect.height,
      style: {
        position: 'static',
        transform: 'none',
        opacity: '1',
      },
    });
    await downloadImage(dataUrl, filename);
  }
}
