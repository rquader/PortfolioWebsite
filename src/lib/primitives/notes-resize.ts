/**
 * @file notes-resize.ts
 *
 * Drag-to-resize for the notes-folio sidebar.
 *
 * The folio CSS reads sidebar width from `--notes-sidebar` on the folio
 * element. This primitive listens for pointerdown on
 * `[data-notes-divider]`, then updates that custom property on the
 * folio while the user drags. Persistence is session-only by design —
 * we don't write to localStorage; closing the popup or reloading the
 * page resets to the CSS-defined default.
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
      return parseFloat(raw) || 272;
    }

    function onDown(e: PointerEvent): void {
      e.preventDefault();
      dragging = true;
      startX = e.clientX;
      startW = readW();
      divider.classList.add('is-dragging');
      divider.setPointerCapture(e.pointerId);
    }

    function onMove(e: PointerEvent): void {
      if (!dragging) return;
      const folioW = folio!.clientWidth;
      const maxW = Math.max(MIN_SIDEBAR + 1, folioW - MIN_READER);
      const next = Math.max(MIN_SIDEBAR, Math.min(maxW, startW + (e.clientX - startX)));
      folio!.style.setProperty('--notes-sidebar', `${next}px`);
    }

    function onUp(e: PointerEvent): void {
      if (!dragging) return;
      dragging = false;
      divider.classList.remove('is-dragging');
      try {
        divider.releasePointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
    }

    // Keyboard alt: arrow keys move by 16px. Honors `prefers-reduced-motion`
    // implicitly via the CSS not animating the property.
    function onKey(e: KeyboardEvent): void {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      e.preventDefault();
      const folioW = folio!.clientWidth;
      const maxW = Math.max(MIN_SIDEBAR + 1, folioW - MIN_READER);
      const cur = readW();
      const next = Math.max(
        MIN_SIDEBAR,
        Math.min(maxW, cur + (e.key === 'ArrowRight' ? 16 : -16)),
      );
      folio!.style.setProperty('--notes-sidebar', `${next}px`);
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
