/**
 * @file mobile-tree-mode.ts
 *
 * Mobile-shell tree-mode controller — pairs with the existing desktop
 * controller (tree-mode.ts). Both observe `body[data-tree-mode]` and
 * write to the same `TreeHandle`; their UI is gated by
 * `data-shell="mobile|desktop"` so only one renders at a time.
 *
 * Mobile UI (ported from m/tree-mode.jsx):
 *   - Top pills: reset (top-left), close (top-right).
 *   - Bottom sheet with a pull-handle (drag-down ≥80px to dismiss).
 *   - Sheet head: title + cs/botanical label toggle.
 *   - Three knobs (depth, angle, ratio) — same range/step as desktop.
 *
 * The desktop controller already opens tree mode on canvas click; we
 * just react to the `body[data-tree-mode='on']` toggle here.
 *
 * Spec: [[decisions/ADR-021-desktop-overhaul-and-dual-shell-mobile]]
 */

import type { TreeHandle } from '../backdrop/tree';
import { createTreeModeFit, isPhoneShell } from './tree-mode-fit';

// Mobile taper default is 0.64 (vs desktop's 0.74). The lower length-ratio
// shrinks each branch generation faster, so the canopy stays inside the
// narrow phone viewport. See ADR-026 / the threshold mount's overrideConst.
const DEFAULTS = { depth: 8, angleDeg: 27, ratio: 0.64 };
const LABEL_STORAGE_KEY = 'rq-tree-labels';

// The mobile UI elements live in the DOM on *every* viewport — they're only
// CSS-hidden on desktop via `data-shell="mobile"`. So this controller runs on
// desktop too, and because it shares the desktop controller's `TreeHandle`,
// any write here leaks into the desktop tree. Critically, the desktop taper
// (0.74) and the mobile taper (0.64) differ, so a leak is *visible*: entering
// then exiting tree-mode on desktop would strand the desktop tree at 0.64.
// Gate every handle-write behind a live phone-viewport check (`isPhoneShell`,
// shared from tree-mode-fit). Desktop is driven solely by tree-mode.ts.

type LabelMode = 'cs' | 'bot';

export interface MobileTreeModeHandle {
  stop(): void;
}

export function initMobileTreeMode(tree: TreeHandle): MobileTreeModeHandle {
  if (typeof document === 'undefined') return { stop: () => {} };

  const top = document.querySelector<HTMLElement>('[data-mtree-top]');
  const sheet = document.querySelector<HTMLElement>('[data-mtree-sheet]');
  const handle = document.querySelector<HTMLElement>('[data-mtree-handle]');
  const closeBtn = document.querySelector<HTMLElement>('[data-mtree-close]');
  const resetBtn = document.querySelector<HTMLElement>('[data-mtree-reset]');
  const labelsBtn = document.querySelector<HTMLButtonElement>('[data-mtree-labels]');
  const knobs = Array.from(
    document.querySelectorAll<HTMLInputElement>('[data-mtree-knob]'),
  );
  const valueEls = Array.from(
    document.querySelectorAll<HTMLElement>('[data-mtree-value]'),
  );

  // No mobile UI on this page (e.g. /projects) — bail.
  if (!top || !sheet || !handle || !closeBtn || !resetBtn || !labelsBtn) {
    return { stop: () => {} };
  }

  // ─── Fit-first/scroll-backup controller (shared with desktop) ─────
  // Phone-only: the desktop controller owns the fit on wide viewports.
  const canvasEl = document.getElementById('tree-threshold') as HTMLCanvasElement | null;
  const scroller = canvasEl?.closest<HTMLElement>('.threshold-tree-scroll') ?? null;
  const fit =
    canvasEl && scroller
      ? createTreeModeFit(tree, canvasEl, scroller, {
          topEl: top, // top pills (reset/close)
          bottomEl: sheet, // bottom sheet of knobs
          topFallbackPx: 64,
          bottomFallbackPx: 220,
        })
      : null;

  // ─── Label mode (cs ⇄ botanical) ──────────────────────────
  let labelMode: LabelMode = 'cs';
  try {
    const stored = localStorage.getItem(LABEL_STORAGE_KEY);
    if (stored === 'bot' || stored === 'cs') labelMode = stored;
  } catch {
    /* ignore */
  }

  function applyLabelMode(): void {
    sheet!.setAttribute('data-label-mode', labelMode);
    labelsBtn!.setAttribute('aria-pressed', String(labelMode === 'bot'));
    labelsBtn!.textContent = labelMode === 'cs' ? 'cs labels' : 'botanical';
    // Swap visible label text on each knob's label span.
    const labels = document.querySelectorAll<HTMLElement>('.m-tree-knob-label');
    labels.forEach((el) => {
      const cs = el.getAttribute('data-label-cs');
      const bot = el.getAttribute('data-label-bot');
      if (labelMode === 'cs' && cs) el.textContent = cs;
      if (labelMode === 'bot' && bot) el.textContent = bot;
    });
  }
  applyLabelMode();

  labelsBtn.addEventListener('click', () => {
    labelMode = labelMode === 'cs' ? 'bot' : 'cs';
    try {
      localStorage.setItem(LABEL_STORAGE_KEY, labelMode);
    } catch {
      /* ignore */
    }
    applyLabelMode();
  });

  // ─── Knob → tree handle ───────────────────────────────────
  function readKnobs(): { depth: number; angleDeg: number; ratio: number } {
    const get = (id: string): number => {
      const el = knobs.find((k) => k.dataset.mtreeKnob === id);
      return el ? parseFloat(el.value) : 0;
    };
    return {
      depth: get('depth'),
      // 'ratio' input is 60..85 (percent); tree handle expects 0..1
      ratio: get('ratio') / 100,
      angleDeg: get('angleDeg'),
    };
  }

  function syncValues(): void {
    for (const el of valueEls) {
      const id = el.dataset.mtreeValue;
      const knob = knobs.find((k) => k.dataset.mtreeKnob === id);
      if (!knob) continue;
      const v = parseFloat(knob.value);
      if (id === 'ratio') el.textContent = `${Math.round(v)}%`;
      else if (id === 'angleDeg') el.textContent = `${Math.round(v)}°`;
      else el.textContent = String(Math.round(v));
    }
  }

  function pushKnobs(): void {
    // Never write to the shared handle on desktop — that's tree-mode.ts's job.
    // Otherwise the mobile taper (0.64) would clobber the desktop tree (0.74)
    // on tree-mode entry and never get restored on exit.
    if (!isPhoneShell()) return;
    syncValues();
    // ADR-024 — pass the *backdrop algorithm's* constant keys, not the
    // UI's friendly names. The desktop controller (tree-mode.ts) uses
    // MAX_DEPTH / LEAF_DEPTH_MIN / BRANCH_ANGLE / LENGTH_RATIO — those
    // are what `tree-algorithm.ts → buildBranches()` reads from
    // `consts`. The previous shape (`{ depth, angleDeg, ratio }`) was
    // silently merged into `consts` as extra keys and never consumed,
    // so dragging the mobile sliders updated the value labels but had
    // no visible effect on the tree.
    const k = readKnobs();
    tree.setOverrides({
      MAX_DEPTH: k.depth,
      LEAF_DEPTH_MIN: k.depth,
      BRANCH_ANGLE: (k.angleDeg * Math.PI) / 180,
      LENGTH_RATIO: k.ratio,
    });
  }

  // Slider drag: apply params, then re-fit without recentering (the pane grows
  // + scrolls if the edit pushed the tree past the frame).
  function onKnobInput(): void {
    pushKnobs();
    if (isPhoneShell()) fit?.refit(false);
  }
  for (const k of knobs) k.addEventListener('input', onKnobInput);

  // ─── Reset / close ────────────────────────────────────────
  resetBtn.addEventListener('click', () => {
    for (const k of knobs) {
      const id = k.dataset.mtreeKnob;
      if (id === 'depth') k.value = String(DEFAULTS.depth);
      else if (id === 'angleDeg') k.value = String(DEFAULTS.angleDeg);
      else if (id === 'ratio') k.value = String(DEFAULTS.ratio * 100);
    }
    pushKnobs();
    // Re-fit and recenter — reset returns to the fitted default tree.
    if (isPhoneShell()) fit?.refit(true);
  });

  function exitTreeMode(): void {
    // The canonical enter/exit logic (opacity restore, base-Y reset, etc.)
    // lives in the desktop controller (`tree-mode.ts`). On mobile we still
    // render our own UI, but we must trigger the same exit() path —
    // otherwise the tree can remain in its bright/full-opacity state after
    // dismissing the sheet.
    const desktopClose = document.querySelector<HTMLButtonElement>(
      '.tree-mode-ui .tree-mode-close',
    );
    if (desktopClose) {
      desktopClose.click();
      return;
    }
    // Fallback: restore the attribute to the "off" state.
    document.body.dataset.treeMode = 'off';
  }
  closeBtn.addEventListener('click', exitTreeMode);

  // ─── Pull-handle drag-to-dismiss ──────────────────────────
  let dragging = false;
  let startY = 0;
  let dy = 0;

  function onHandleDown(e: PointerEvent): void {
    dragging = true;
    startY = e.clientY;
    dy = 0;
    try {
      handle!.setPointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
  }

  function onMove(e: PointerEvent): void {
    if (!dragging) return;
    dy = Math.max(0, e.clientY - startY);
    sheet!.style.transform = `translateY(${dy}px)`;
  }

  function onUp(): void {
    if (!dragging) return;
    dragging = false;
    sheet!.style.transform = '';
    if (dy > 80) exitTreeMode();
  }

  handle.addEventListener('pointerdown', onHandleDown);
  document.addEventListener('pointermove', onMove);
  document.addEventListener('pointerup', onUp);
  document.addEventListener('pointercancel', onUp);

  // ─── Observe tree-mode state ──────────────────────────────
  let wasOn = false;
  function sync(): void {
    const on = document.body.getAttribute('data-tree-mode') === 'on';
    top!.setAttribute('aria-hidden', String(!on));
    sheet!.setAttribute('aria-hidden', String(!on));
    top!.classList.toggle('is-open', on);
    sheet!.classList.toggle('is-open', on);
    if (on) {
      pushKnobs();
      // On entry only, fit the whole tree in frame, centered. rAF so the
      // sheet + top pills have laid out (their heights feed the fit reserves).
      if (isPhoneShell() && !wasOn) requestAnimationFrame(() => fit?.refit(true));
    } else if (wasOn && isPhoneShell()) {
      // Leaving tree-mode: restore ambient framing (parameter edits are kept).
      fit?.restore();
    }
    wasOn = on;
  }
  sync();
  const observer = new MutationObserver(sync);
  observer.observe(document.body, {
    attributes: true,
    attributeFilter: ['data-tree-mode'],
  });

  return {
    stop(): void {
      observer.disconnect();
      for (const k of knobs) k.removeEventListener('input', onKnobInput);
      handle.removeEventListener('pointerdown', onHandleDown);
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerup', onUp);
      document.removeEventListener('pointercancel', onUp);
    },
  };
}
