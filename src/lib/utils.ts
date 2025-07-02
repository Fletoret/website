import { toPng } from 'html-to-image';

export function strip(s: string, char: string): string {
  let x = s;
  if (x.startsWith(char)) x = x.slice(1);
  if (x.endsWith(char)) x = x.slice(0, x.length - 1);
  return x;
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
  const blobUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = blobUrl;
  link.download = `${filename.replaceAll(' ', '-').toLowerCase()}.png`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export async function domToImage(node: HTMLElement, filename: string) {
  if (node) {
    const dataUrl = await toPng(node);
    await downloadImage(dataUrl, filename);
  }
}
