export function strip(s: string, char: string): string {
  let x = s;
  if (x.startsWith(char)) x = x.slice(1);
  if (x.endsWith(char)) x = x.slice(0, x.length - 1);
  return x;
}

export function getUrlParts(s: string): string[] {
  let x = s;
  if (x.startsWith('/')) x = x.slice(1);
  if (x.endsWith('/')) x = x.slice(0, x.length - 1);

  return x.split('/');
}
