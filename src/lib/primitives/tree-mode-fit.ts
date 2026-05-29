/**
 * @file tree-mode-fit.ts
 *
 * Shared "fit the whole tree in frame, scroll as backup" controller for
 * tree-mode, used by BOTH shells (tree-mode.ts desktop + mobile-tree-mode.ts).
 *
 * Behavior (chosen 2026-05-28): on entering tree-mode the whole tree is shrunk
 * to sit fully inside the visible area *above the card/sheet*, centered. The
 * pixel-per-unit scale is fixed at that entry value; if later slider edits grow
 * the tree past the frame, the canvas (scroll content) grows taller than the
 * viewport and native vertical scroll unlocks so every part stays reachable.
 *
 * Mechanism — the tree's pixel scale is `u = canvasCssH / frameHeightUnits`
 * (see tree.ts#makeCanvasMap). To keep `u` constant while the canvas grows, we
 * drive `frameHeightUnits = canvasCssH / U`. The canvas lives inside a fixed,
 * vertically-scrollable wrapper; we set the canvas's CSS height to the content
 * height (≥ viewport) and scroll so the tree centers in the available area.
 *
 * Vertical centering: we shift `TRUNK_BASE_Y` so the tree's unit-space center
 * maps to the canvas's vertical middle (`toY(0) = cssH/2`), then set scrollTop
 * so that middle lands at the center of the visible area (viewport minus the
 * top pills and the bottom card/sheet).
 *
 * Spec: [[decisions/ADR-027-tree-mode-fit-and-scroll]] (companion to ADR-026).
 */

import type { TreeHandle } from '../backdrop/tree';

/** Manim's reference frame height — the ambient base before any per-shell scale. */
const AMBIENT_BASE_Y = -3.5; // = TREE_CONST.TRUNK_BASE_Y

/**
 * The dual-shell breakpoint (ADR-021). Both shells' tree controllers share one
 * canvas + one `TreeHandle`, so each must only drive the fit on its own shell —
 * otherwise they'd fight over the same canvas (same class of bug as ADR-026).
 * Desktop gates its fit on `!isPhoneShell()`, mobile on `isPhoneShell()`.
 */
export const PHONE_QUERY = '(max-width: 720px)';
export function isPhoneShell(): boolean {
  return typeof window !== 'undefined' && window.matchMedia(PHONE_QUERY).matches;
}

export interface FitReserves {
  /** Element occupying the top of the screen (close/reset pills). Measured if given. */
  topEl?: HTMLElement | null;
  /** Element occupying the bottom (slider card / bottom sheet). Measured if given. */
  bottomEl?: HTMLElement | null;
  /** Fallback reserves (px) if the elements aren't measurable yet. */
  topFallbackPx?: number;
  bottomFallbackPx?: number;
}

export interface TreeModeFit {
  /**
   * Re-fit using the tree's current parameters.
   * @param recenter when true (entry), also reset scrollTop to center the tree;
   *   when false (live slider edits), keep the user's current scroll position.
   */
  refit(recenter: boolean): void;
  /** Restore ambient framing (call on exit). Keeps the user's parameter edits. */
  restore(): void;
}

const MARGIN_PX = 20; // breathing room around the tree inside the frame

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

export function createTreeModeFit(
  handle: TreeHandle,
  canvas: HTMLCanvasElement,
  scroller: HTMLElement,
  reserves: FitReserves,
): TreeModeFit {
  // Captured once so restore() puts the ambient framing back exactly.
  const ambientFrameUnits = handle.getFrameHeightUnits();
  // The tree's current TRUNK_BASE_Y. getExtent() reports the silhouette at the
  // *current* base, so to re-zero the center we must subtract the center from
  // the base that's actually in effect — not a constant. Mirrors the handle:
  // only this controller moves the base during tree-mode (applyParams/pushKnobs
  // leave it untouched), and ambient starts at AMBIENT_BASE_Y.
  let currentBase = AMBIENT_BASE_Y;

  function measure(el: HTMLElement | null | undefined, fallback: number): number {
    if (!el) return fallback;
    const h = el.getBoundingClientRect().height;
    return h > 0 ? h : fallback;
  }

  function refit(recenter: boolean): void {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    if (vw < 2 || vh < 2) return;

    const topReserve = measure(reserves.topEl, reserves.topFallbackPx ?? 64);
    const bottomReserve = measure(reserves.bottomEl, reserves.bottomFallbackPx ?? 96);

    const ext = handle.getExtent();
    const treeH = Math.max(0.001, ext.maxY - ext.minY);
    const treeW = Math.max(0.001, ext.maxX - ext.minX);
    const centerY = (ext.minY + ext.maxY) / 2;

    // Visible area available for the tree, and the px-per-unit that fits it.
    const availH = Math.max(140, vh - topReserve - bottomReserve - 2 * MARGIN_PX);
    const availW = Math.max(140, vw - 2 * MARGIN_PX);
    const u = Math.min(availH / treeH, availW / treeW);

    // Content (canvas) height: at least the viewport; taller if the tree +
    // reserves overflow it (that's when scroll becomes useful).
    const treePxH = treeH * u;
    const contentH = Math.max(
      vh,
      Math.ceil(treePxH + topReserve + bottomReserve + 2 * MARGIN_PX),
    );

    // Size the canvas box first so tree.ts#configure() reads the new height,
    // then pin the scale: frameHeightUnits = contentH / u  ⇒  cssH/fhu = u.
    canvas.style.height = `${contentH}px`;
    handle.setFrameHeightUnits(contentH / u);

    // Center the tree in the canvas: shift the base so the unit-space center
    // maps to the canvas middle (toY(0) = contentH/2). `centerY` is measured at
    // the base currently in effect, so newBase = currentBase - centerY drives
    // the silhouette's center to 0 regardless of how many edits preceded this.
    currentBase = currentBase - centerY;
    handle.setOverrides({ TRUNK_BASE_Y: currentBase });

    if (recenter) {
      // Put the canvas middle at the center of the visible (non-reserved) area.
      const availCenterFromTop = topReserve + (vh - topReserve - bottomReserve) / 2;
      scroller.scrollTop = clamp(contentH / 2 - availCenterFromTop, 0, contentH - vh);
    } else {
      // Keep the user where they were, but stay within the new content bounds.
      scroller.scrollTop = clamp(scroller.scrollTop, 0, Math.max(0, contentH - vh));
    }
  }

  function restore(): void {
    canvas.style.height = '';
    handle.setFrameHeightUnits(ambientFrameUnits);
    currentBase = AMBIENT_BASE_Y;
    handle.setOverrides({ TRUNK_BASE_Y: currentBase });
    scroller.scrollTop = 0;
  }

  return { refit, restore };
}
