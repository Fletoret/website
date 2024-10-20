import { browser } from '$app/environment';

// This function should only be invoked in the client
export function chooseTheme(theme: string | undefined, persist = true) {
  if (!theme) return;

  document.documentElement.setAttribute('data-theme', theme);
  if (persist) {
    localStorage.setItem('theme', theme);
  }

  // Update meta tags
  const bgColor = theme === 'dark' ? '#000' : '#fff';
  const MetaMsApplicationTileColor: HTMLElement | null = document.querySelector(
    'meta[name="msapplication-TileColor"]',
  );
  const MetaThemeColor: HTMLElement | null = document.querySelector(
    'meta[name="theme-color"]',
  );
  if (MetaMsApplicationTileColor) {
    MetaMsApplicationTileColor.setAttribute('content', bgColor);
  }

  if (MetaThemeColor) {
    MetaThemeColor.setAttribute('content', bgColor);
  }
}

export function getAndLoadTheme(): string | undefined {
  let theme;

  if (browser) {
    if (localStorage.getItem('theme') !== null) {
      theme = localStorage.getItem('theme') || undefined;
    }

    // Only if a theme has been chosen from visitor explicitly
    if (theme) {
      chooseTheme(theme);
    } else {
      if (window.matchMedia('(prefers-color-scheme: dark)')) {
        theme = 'dark';
        chooseTheme('dark', false);
      }
    }
  }

  return theme;
}
