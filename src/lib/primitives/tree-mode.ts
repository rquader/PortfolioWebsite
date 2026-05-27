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

const DEFAULT_DEPTH = 8;
const DEFAULT_ANGLE_DEG = 27;
const DEFAULT_RATIO_PCT = 74;
const DEFAULT_OPACITY = 0.12;
// Threshold (backdrop) anchor — base near the viewport bottom so the
// canopy fills the top of the hero. Tree-mode wants more vertical
// centering, so the base shifts up.
const BASE_Y_THRESHOLD = -3.5;
const BASE_Y_TREE_MODE = -2.5;

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

  function enter(): void {
    if (body.dataset.treeMode === 'on') return;
    body.dataset.treeMode = 'on';
    ui.removeAttribute('aria-hidden');
    tree.setOpacity(1.0);
    // Recenter the tree in the now-fullscreen viewport.
    tree.setOverrides({ TRUNK_BASE_Y: BASE_Y_TREE_MODE });
    // Apply current slider values on top of the recenter.
    applyParams();
    requestAnimationFrame(() => closeBtn?.focus());
  }

  function exit(): void {
    if (body.dataset.treeMode !== 'on') return;
    body.dataset.treeMode = 'off';
    ui.setAttribute('aria-hidden', 'true');
    tree.setOpacity(DEFAULT_OPACITY);
    tree.setOverrides({ TRUNK_BASE_Y: BASE_Y_THRESHOLD });
  }

  function onCanvasClick(): void {
    if (body.dataset.treeMode === 'on') return;
    enter();
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
    applyParams();
  }

  canvas.addEventListener('click', onCanvasClick);
  canvas.addEventListener('keydown', onCanvasKey);
  ui.addEventListener('click', onUiClick);
  closeBtn?.addEventListener('click', exit);
  resetBtn?.addEventListener('click', onReset);
  window.addEventListener('keydown', onKey);
  for (const inp of [depthInput, angleInput, ratioInput]) {
    inp?.addEventListener('input', applyParams);
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
        inp?.removeEventListener('input', applyParams);
      }
      for (const t of openTriggers) t.removeEventListener('click', onOpenTrigger);
      for (const lbl of labelToggles) lbl.removeEventListener('click', onLabelClick);
      exit();
    },
  };
}
