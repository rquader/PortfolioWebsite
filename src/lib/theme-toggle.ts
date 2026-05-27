/**
 * @file theme-toggle.ts
 *
 * Light/dark mode controller. The FOUC-prevention inline script in
 * Base.astro reads `rq-theme` from localStorage and sets
 * `data-theme="light|dark"` on <html> BEFORE first paint. This module
 * runs after hydration: it wires the [data-theme-toggle] button in
 * TopNav so clicking swaps the attribute + writes storage + emits a
 * `rq:theme` event so canvas-rendered primitives can re-read palette
 * tokens and re-paint without polling.
 *
 * Storage key + event name are public so other modules can subscribe.
 *
 * Spec: [[02 - Architecture#mode mechanic]];
 *       [[decisions/ADR-009-light-dark-mode-toggle]].
 */
export const THEME_STORAGE_KEY = 'rq-theme';
export const THEME_EVENT = 'rq:theme';

export type ThemeName = 'light' | 'dark';

export interface ThemeToggleHandle {
  stop(): void;
}

export function getTheme(): ThemeName {
  if (typeof document === 'undefined') return 'light';
  return document.documentElement.getAttribute('data-theme') === 'dark'
    ? 'dark'
    : 'light';
}

export function setTheme(next: ThemeName): void {
  if (typeof document === 'undefined') return;
  document.documentElement.setAttribute('data-theme', next);
  try {
    localStorage.setItem(THEME_STORAGE_KEY, next);
  } catch {
    /* storage may be unavailable in private mode — gracefully degrade */
  }
  window.dispatchEvent(new CustomEvent(THEME_EVENT, { detail: { theme: next } }));
}

export function initThemeToggle(): ThemeToggleHandle {
  if (typeof document === 'undefined') return { stop: () => {} };

  const btn = document.querySelector<HTMLButtonElement>('[data-theme-toggle]');
  if (!btn) return { stop: () => {} };

  const sync = (): void => {
    const t = getTheme();
    btn.setAttribute('aria-pressed', t === 'dark' ? 'true' : 'false');
    btn.setAttribute('data-theme-state', t);
  };
  sync();

  const onClick = (): void => {
    setTheme(getTheme() === 'light' ? 'dark' : 'light');
    sync();
  };
  btn.addEventListener('click', onClick);

  // Cross-tab sync — if the same site is open in another tab and the
  // theme changes there, mirror it here.
  const onStorage = (e: StorageEvent): void => {
    if (e.key !== THEME_STORAGE_KEY) return;
    if (e.newValue === 'light' || e.newValue === 'dark') {
      setTheme(e.newValue);
      sync();
    }
  };
  window.addEventListener('storage', onStorage);

  return {
    stop(): void {
      btn.removeEventListener('click', onClick);
      window.removeEventListener('storage', onStorage);
    },
  };
}
