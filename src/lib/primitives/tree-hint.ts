/**
 * @file tree-hint.ts
 *
 * First-load click-hint sticker on the threshold tree.
 */

const STORAGE_KEY = 'rq-tree-hint-seen';
const APPEAR_DELAY_MS = 800;
const HOLD_MS = 4000;
const FADE_MS = 240;

export interface TreeHintHandle {
  stop(): void;
}

let activeHandle: TreeHintHandle | null = null;

export function initTreeHint(): TreeHintHandle {
  activeHandle?.stop();

  if (typeof document === 'undefined') {
    const noop = { stop: () => {} };
    activeHandle = noop;
    return noop;
  }

  const stickerEl = document.querySelector<HTMLButtonElement>('.tree-hint');
  if (!stickerEl) {
    const noop = { stop: () => {} };
    activeHandle = noop;
    return noop;
  }
  const sticker: HTMLButtonElement = stickerEl;

  try {
    if (localStorage.getItem(STORAGE_KEY) === '1') {
      sticker.setAttribute('hidden', '');
      const noop = { stop: () => {} };
      activeHandle = noop;
      return noop;
    }
  } catch {
    /* localStorage disabled */
  }

  let dismissed = false;
  let appearTimer: ReturnType<typeof setTimeout> | null = null;
  let holdTimer: ReturnType<typeof setTimeout> | null = null;
  let hideTimer: ReturnType<typeof setTimeout> | null = null;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function cleanup(): void {
    window.removeEventListener('scroll', onScrollDismiss);
    sticker.removeEventListener('click', onStickerClick);
  }

  function dismiss(): void {
    if (dismissed) return;
    dismissed = true;
    sticker.setAttribute('data-state', 'gone');
    if (appearTimer) clearTimeout(appearTimer);
    if (holdTimer) clearTimeout(holdTimer);
    try {
      localStorage.setItem(STORAGE_KEY, '1');
    } catch {
      /* ignore */
    }
    const hideDelay = reducedMotion ? 0 : FADE_MS + 50;
    hideTimer = setTimeout(() => sticker.setAttribute('hidden', ''), hideDelay);
    cleanup();
  }

  function onStickerClick(): void {
    dismiss();
  }

  function onScrollDismiss(): void {
    if (window.scrollY > 24) dismiss();
  }

  appearTimer = setTimeout(() => {
    if (dismissed) return;
    sticker.setAttribute('data-state', 'visible');
    holdTimer = setTimeout(dismiss, HOLD_MS);
    window.addEventListener('scroll', onScrollDismiss, { passive: true });
    sticker.addEventListener('click', onStickerClick);
  }, APPEAR_DELAY_MS);

  const handle: TreeHintHandle = {
    stop() {
      if (appearTimer) clearTimeout(appearTimer);
      if (holdTimer) clearTimeout(holdTimer);
      if (hideTimer) clearTimeout(hideTimer);
      cleanup();
      dismissed = true;
    },
  };

  activeHandle = handle;
  return handle;
}
