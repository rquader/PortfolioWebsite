/**
 * @file tree-mode.ts
 *
 * Threshold tree "open the canvas" interaction. Click anywhere on the
 * threshold's tree canvas (away from the hero content) → enter
 * tree-mode: hero fades, tree canvas teleports to fixed full-viewport
 * at full opacity + full sway, a small paper card with three live
 * parameter sliders (depth · angle · ratio — CS-canonical) slides up
 * bottom-center, a × close button + esc hint sit top-right.
 *
 * Exit on: Esc · click anywhere outside the card (including the tree
 * canvas itself) · click the × button.
 *
 * Phase 5 (2026-05-19) additions:
 *   - LENGTH_SHRINK → LENGTH_RATIO refactor (CS-canonical naming).
 *   - Slider labels are clickable. Click any label → swap all three
 *     between CS (`depth · angle · ratio`) and botanical (`generations
 *     · spread · taper`). Persists under `rq-tree-labels`.
 *
 * This primitive replaces the deleted OnRecursion section — the
 * sliders' behavior lives here now. The visual model: the threshold
 * IS the recursion room when you ask it to be.
 *
 * Spec: [[Concept - Threshold Hero#tree mode]];
 *       [[decisions/ADR-010-tree-slider-labels]];
 *       [[specs/2026-05-18-tree-leaves-folders-design#4.1-tree-mode-update]].
 */

import type { TreeHandle } from '../backdrop/tree';
import { createTreeModeFit, isPhoneShell } from './tree-mode-fit';

const DEFAULT_DEPTH = 8;
const DEFAULT_ANGLE_DEG = 27;
const DEFAULT_RATIO_PCT = 74;

const LABEL_STORAGE_KEY = 'rq-tree-labels';
type LabelMode = 'cs' | 'bot';

export interface TreeModeHandle {
  stop(): void;
}

export function initTreeMode(canvas: HTMLCanvasElement, tree: TreeHandle): TreeModeHandle {
  if (typeof document === 'undefined') return { stop: () => {} };

  const body = document.body;
  const uiRoot = document.querySelector<HTMLElement>('.tree-mode-ui');
  if (!uiRoot) return { stop: () => {} };
  const ui: HTMLElement = uiRoot; // non-null after the guard; survives into closures

  const depthInput = ui.querySelector<HTMLInputElement>('[data-knob="depth"]');
  const angleInput = ui.querySelector<HTMLInputElement>('[data-knob="angle"]');
  const ratioInput = ui.querySelector<HTMLInputElement>('[data-knob="ratio"]');
  const depthVal = ui.querySelector<HTMLElement>('[data-value="depth"]');
  const angleVal = ui.querySelector<HTMLElement>('[data-value="angle"]');
  const ratioVal = ui.querySelector<HTMLElement>('[data-value="ratio"]');
  const closeBtn = ui.querySelector<HTMLButtonElement>('.tree-mode-close');
  const resetBtn = ui.querySelector<HTMLButtonElement>('.tree-mode-reset');
  const card = ui.querySelector<HTMLElement>('.tree-mode-card');
  const labelToggles = Array.from(
    ui.querySelectorAll<HTMLButtonElement>('[data-label]'),
  );

  // Fit-first/scroll-backup controller (shared with the mobile shell).
  const scroller = canvas.closest<HTMLElement>('.threshold-tree-scroll');
  const fit = scroller
    ? createTreeModeFit(tree, canvas, scroller, {
        bottomEl: card, // slider card sits bottom-center
        topFallbackPx: 72, // close/esc pills top-right
        bottomFallbackPx: 96,
      })
    : null;

  function applyParams(): void {
    if (!depthInput || !angleInput || !ratioInput) return;
    const depth = parseInt(depthInput.value, 10);
    const angleDeg = parseInt(angleInput.value, 10);
    const ratioPct = parseInt(ratioInput.value, 10);
    tree.setOverrides({
      MAX_DEPTH: depth,
      LEAF_DEPTH_MIN: depth,
      BRANCH_ANGLE: (angleDeg * Math.PI) / 180,
      LENGTH_RATIO: ratioPct / 100,
    });
    if (depthVal) depthVal.textContent = String(depth);
    if (angleVal) angleVal.textContent = `${angleDeg}°`;
    if (ratioVal) ratioVal.textContent = `${ratioPct}%`;
  }

  // ---------- Label mode (CS / botanical) ----------

  function applyLabelMode(mode: LabelMode): void {
    if (card) card.setAttribute('data-label-mode', mode);
    for (const t of labelToggles) {
      const next = t.getAttribute(mode === 'cs' ? 'data-label-cs' : 'data-label-bot');
      if (next != null) t.textContent = next;
    }
  }

  function currentLabelMode(): LabelMode {
    return (card?.getAttribute('data-label-mode') as LabelMode) ?? 'cs';
  }

  function loadLabelMode(): LabelMode {
    try {
      const stored = localStorage.getItem(LABEL_STORAGE_KEY);
      if (stored === 'cs' || stored === 'bot') return stored;
    } catch (_) {
      /* ignore */
    }
    return 'cs';
  }

  function persistLabelMode(mode: LabelMode): void {
    try {
      localStorage.setItem(LABEL_STORAGE_KEY, mode);
    } catch (_) {
      /* ignore */
    }
  }

  function toggleLabels(): void {
    const next: LabelMode = currentLabelMode() === 'cs' ? 'bot' : 'cs';
    applyLabelMode(next);
    persistLabelMode(next);
  }

  // Initialize labels from storage (default: cs).
  applyLabelMode(loadLabelMode());

  // ---------- Mode entry/exit ----------

  // Capture the ambient opacity on *each* entry so exit() can restore
  // the value the mount (or shell) actually wants. This replaces the old
  // hard-coded reset that clobbered phone/desktop-specific opacity.
  let ambientOpacity = tree.getOpacity();

  function enter(): void {
    if (body.dataset.treeMode === 'on') return;
    ambientOpacity = tree.getOpacity();
    body.dataset.treeMode = 'on';
    ui.removeAttribute('aria-hidden');
    tree.setOpacity(1.0);
    // Apply current slider values, then fit the whole tree in frame, centered.
    // rAF so the card has laid out and its height is measurable by the fit.
    applyParams();
    requestAnimationFrame(() => {
      // The mobile shell runs its own fit (and focus) — this controller owns
      // the canvas click + body toggle on both shells, but only fits desktop.
      if (isPhoneShell()) return;
      fit?.refit(true);
      closeBtn?.focus();
    });
  }

  function exit(): void {
    if (body.dataset.treeMode !== 'on') return;
    body.dataset.treeMode = 'off';
    ui.setAttribute('aria-hidden', 'true');
    tree.setOpacity(ambientOpacity);
    // Restore ambient framing (the user's parameter edits are kept). On a phone
    // the mobile controller owns the restore (its sync() reacts to the toggle).
    if (!isPhoneShell()) fit?.restore();
  }

  // Re-apply params from a slider drag, then re-fit *without* recentering the
  // scroll (keeps the user where they are; the pane grows + scrolls if their
  // edit pushed the tree past the frame).
  function onSliderInput(): void {
    applyParams();
    if (body.dataset.treeMode === 'on' && !isPhoneShell()) fit?.refit(false);
  }

  function onCanvasClick(): void {
    // Click the tree to toggle: enter from ambient, exit from tree-mode.
    // (A scroll gesture drags rather than clicks, so it won't fire this.)
    if (body.dataset.treeMode === 'on') exit();
    else enter();
  }

  function onCanvasKey(e: KeyboardEvent): void {
    if (body.dataset.treeMode === 'on') return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      enter();
    }
  }

  const openTriggers = document.querySelectorAll<HTMLElement>('[data-tree-open]');
  function onOpenTrigger(e: Event): void {
    e.preventDefault();
    enter();
  }

  function onUiClick(e: Event): void {
    const target = e.target as HTMLElement | null;
    if (!target) return;
    if (target.closest('.tree-mode-card')) return; // card swallows
    if (target.closest('.tree-mode-close')) return; // close handled below
    exit();
  }

  // Label-toggle clicks must be bound directly to each label button —
  // the card stops propagation defensively (so card clicks don't exit
  // tree-mode), and that swallows any bubble-style handler we'd put
  // higher up.
  function onLabelClick(e: Event): void {
    e.preventDefault();
    e.stopPropagation();
    toggleLabels();
  }

  function onKey(e: KeyboardEvent): void {
    if (e.key === 'Escape' && body.dataset.treeMode === 'on') {
      e.preventDefault();
      exit();
    }
  }

  function onReset(): void {
    if (depthInput) depthInput.value = String(DEFAULT_DEPTH);
    if (angleInput) angleInput.value = String(DEFAULT_ANGLE_DEG);
    if (ratioInput) ratioInput.value = String(DEFAULT_RATIO_PCT);
    onSliderInput();
  }

  canvas.addEventListener('click', onCanvasClick);
  canvas.addEventListener('keydown', onCanvasKey);
  ui.addEventListener('click', onUiClick);
  closeBtn?.addEventListener('click', exit);
  resetBtn?.addEventListener('click', onReset);
  window.addEventListener('keydown', onKey);
  for (const inp of [depthInput, angleInput, ratioInput]) {
    inp?.addEventListener('input', onSliderInput);
  }
  for (const t of openTriggers) t.addEventListener('click', onOpenTrigger);
  for (const lbl of labelToggles) lbl.addEventListener('click', onLabelClick);
  // Stop card clicks from bubbling to ui (defensive — onUiClick already filters).
  card?.addEventListener('click', (e: Event) => e.stopPropagation());

  return {
    stop(): void {
      canvas.removeEventListener('click', onCanvasClick);
      canvas.removeEventListener('keydown', onCanvasKey);
      ui.removeEventListener('click', onUiClick);
      closeBtn?.removeEventListener('click', exit);
      resetBtn?.removeEventListener('click', onReset);
      window.removeEventListener('keydown', onKey);
      for (const inp of [depthInput, angleInput, ratioInput]) {
        inp?.removeEventListener('input', onSliderInput);
      }
      for (const t of openTriggers) t.removeEventListener('click', onOpenTrigger);
      for (const lbl of labelToggles) lbl.removeEventListener('click', onLabelClick);
      exit();
    },
  };
}
