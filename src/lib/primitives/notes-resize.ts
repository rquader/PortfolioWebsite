/**
 * @file notes-resize.ts
 *
 * Drag-to-resize for the notes-folio sidebar.
 *
 * The folio CSS reads sidebar width from `--notes-sidebar` on the folio
 * element. This primitive listens for pointerdown on
 * `[data-notes-divider]`, then updates that custom property on the
 * folio while the user drags. The width is persisted per-project in
 * localStorage (best-effort; failures are ignored) so the folio feels
 * “set” across reloads.
 *
 * Width is clamped to a minimum of 180px and a maximum of the folio
 * width minus 320px (so the reader pane always has room).
 *
 * Spec: [[decisions/ADR-021-desktop-overhaul-and-dual-shell-mobile]]
 */

export interface NotesResizeHandle {
  stop(): void;
}

const MIN_SIDEBAR = 180;
const MIN_READER = 320;
const DEFAULT_SIDEBAR = 272;
const STORAGE_PREFIX = 'notes:sidebarWidth:';
const PX_STEP = 16;
const PX_STEP_LG = 48;

let active: NotesResizeHandle | null = null;

export function initNotesResize(): NotesResizeHandle {
  active?.stop();

  if (typeof document === 'undefined') {
    const noop = { stop: () => {} };
    active = noop;
    return noop;
  }

  const dividers = Array.from(
    document.querySelectorAll<HTMLElement>('[data-notes-divider]'),
  );
  if (dividers.length === 0) {
    const noop = { stop: () => {} };
    active = noop;
    return noop;
  }

  const cleanups: Array<() => void> = [];

  for (const divider of dividers) {
    const folio = divider.closest<HTMLElement>('.notes-popup-folio');
    if (!folio) continue;

    let dragging = false;
    let startX = 0;
    let startW = 0;

    function readW(): number {
      const raw = getComputedStyle(folio!).getPropertyValue('--notes-sidebar');
      return parseFloat(raw) || DEFAULT_SIDEBAR;
    }

    function maxW(): number {
      const folioW = folio!.clientWidth;
      return Math.max(MIN_SIDEBAR + 1, folioW - MIN_READER);
    }

    function clampW(w: number): number {
      return Math.max(MIN_SIDEBAR, Math.min(maxW(), w));
    }

    function storageKey(): string | null {
      const popup = divider.closest<HTMLElement>('[data-notes-popup]');
      const slug = popup?.getAttribute('data-project-slug')?.trim();
      return slug ? `${STORAGE_PREFIX}${slug}` : null;
    }

    function isPersistenceEnabled(): boolean {
      const popup = divider.closest<HTMLElement>('[data-notes-popup]');
      return Boolean(
        divider.hasAttribute('data-notes-resize-persist') ||
          popup?.hasAttribute('data-notes-resize-persist'),
      );
    }

    function persist(w: number): void {
      if (!isPersistenceEnabled()) return;
      try {
        const key = storageKey();
        if (!key) return;
        localStorage.setItem(key, String(Math.round(w)));
      } catch {
        /* ignore */
      }
    }

    function applyW(w: number, { persistValue }: { persistValue: boolean }): void {
      const next = clampW(w);
      folio!.style.setProperty('--notes-sidebar', `${next}px`);
      divider.setAttribute('aria-valuemin', String(MIN_SIDEBAR));
      divider.setAttribute('aria-valuemax', String(Math.round(maxW())));
      divider.setAttribute('aria-valuenow', String(Math.round(next)));
      if (persistValue) persist(next);
    }

    // Initialize ARIA value attributes (and optionally restore persisted width)
    // after layout exists (clientWidth must be non-zero).
    requestAnimationFrame(() => {
      if (isPersistenceEnabled()) {
        try {
          const key = storageKey();
          const raw = key ? localStorage.getItem(key) : null;
          const saved = raw ? Number.parseFloat(raw) : Number.NaN;
          if (Number.isFinite(saved)) {
            applyW(saved, { persistValue: false });
            return;
          }
        } catch {
          /* ignore */
        }
      }
      applyW(readW(), { persistValue: false });
    });

    function onDown(e: PointerEvent): void {
      if (e.button !== 0) return;
      e.preventDefault();
      dragging = true;
      startX = e.clientX;
      startW = readW();
      divider.classList.add('is-dragging');
      divider.focus({ preventScroll: true });
      document.documentElement.classList.add('is-notes-resizing');
      divider.setPointerCapture(e.pointerId);
    }

    function onMove(e: PointerEvent): void {
      if (!dragging) return;
      applyW(startW + (e.clientX - startX), { persistValue: false });
    }

    function onUp(e: PointerEvent): void {
      if (!dragging) return;
      dragging = false;
      divider.classList.remove('is-dragging');
      document.documentElement.classList.remove('is-notes-resizing');
      persist(readW());
      try {
        divider.releasePointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
    }

    // Keyboard alt: arrow keys move by 16px. Honors `prefers-reduced-motion`
    // implicitly via the CSS not animating the property.
    function onKey(e: KeyboardEvent): void {
      const cur = readW();
      const step = e.shiftKey ? PX_STEP_LG : PX_STEP;

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        applyW(cur - step, { persistValue: true });
        return;
      }

      if (e.key === 'ArrowRight') {
        e.preventDefault();
        applyW(cur + step, { persistValue: true });
        return;
      }

      if (e.key === 'Home') {
        e.preventDefault();
        applyW(MIN_SIDEBAR, { persistValue: true });
        return;
      }

      if (e.key === 'End') {
        e.preventDefault();
        applyW(maxW(), { persistValue: true });
        return;
      }
    }

    divider.addEventListener('pointerdown', onDown);
    divider.addEventListener('pointermove', onMove);
    divider.addEventListener('pointerup', onUp);
    divider.addEventListener('pointercancel', onUp);
    divider.addEventListener('keydown', onKey);

    cleanups.push(() => {
      divider.removeEventListener('pointerdown', onDown);
      divider.removeEventListener('pointermove', onMove);
      divider.removeEventListener('pointerup', onUp);
      divider.removeEventListener('pointercancel', onUp);
      divider.removeEventListener('keydown', onKey);
      document.documentElement.classList.remove('is-notes-resizing');
    });
  }

  const handle: NotesResizeHandle = {
    stop(): void {
      for (const c of cleanups) c();
    },
  };
  active = handle;
  return handle;
}
