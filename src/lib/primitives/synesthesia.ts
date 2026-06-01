/**
 * @file synesthesia.ts
 *
 * Portfolio "on me" word emphasis — spec: [[Concept - Synesthesia Goals]].
 *
 * A small set of `[data-syn-word]` spans in the bio reveal site accent
 * pigment on hover (desktop) or tap (touch). The on-me section takes a
 * matching wash. One word color per span (design tokens), not per-letter
 * grapheme colors.
 *
 * Spec: [[Concept - Synesthesia Goals]]; [[03 - Content Model#on me]].
 */

import { isReducedMotion } from '../reduced-motion';
import { THEME_EVENT } from '../theme-toggle';

const GRACE_MS = 700;
const SLOT_COUNT = 4;

export interface SynesthesiaHandle {
  stop(): void;
}

function prefersTap(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(hover: none)').matches ||
    window.matchMedia('(pointer: coarse)').matches
  );
}

function parseSlot(el: HTMLElement, index: number): number {
  const raw = el.getAttribute('data-syn-slot');
  if (raw == null || raw === '') return index % SLOT_COUNT;
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n)) return index % SLOT_COUNT;
  return ((n % SLOT_COUNT) + SLOT_COUNT) % SLOT_COUNT;
}

export function initSynesthesia(section: HTMLElement): SynesthesiaHandle {
  if (typeof document === 'undefined') return { stop: () => {} };

  const words = Array.from(section.querySelectorAll<HTMLElement>('[data-syn-word]'));
  if (words.length === 0) return { stop: () => {} };

  const useTap = prefersTap();
  let graceTimer: ReturnType<typeof setTimeout> | null = null;
  let activeWord: HTMLElement | null = null;

  const clearSection = (): void => {
    section.classList.remove('syn-tinted');
    section.removeAttribute('data-syn-active-slot');
  };

  const deactivateWord = (word: HTMLElement): void => {
    word.removeAttribute('data-syn-active');
  };

  const deactivateAll = (): void => {
    for (const w of words) deactivateWord(w);
    clearSection();
    activeWord = null;
  };

  const activate = (word: HTMLElement, slot: number): void => {
    if (activeWord && activeWord !== word) deactivateWord(activeWord);
    activeWord = word;
    word.setAttribute('data-syn-active', '');
    word.setAttribute('data-syn-slot', String(slot));
    section.classList.add('syn-tinted');
    section.setAttribute('data-syn-active-slot', String(slot));
  };

  const onTheme = (): void => {
    if (!activeWord) return;
    const slot = parseSlot(activeWord, words.indexOf(activeWord));
    activate(activeWord, slot);
  };
  window.addEventListener(THEME_EVENT, onTheme);

  const enterHandlers: Array<[HTMLElement, () => void]> = [];
  const leaveHandlers: Array<[HTMLElement, () => void]> = [];
  const clickHandlers: Array<[HTMLElement, (e: Event) => void]> = [];
  let onDocPointer: ((e: Event) => void) | null = null;

  if (useTap) {
    onDocPointer = (e: Event): void => {
      const target = e.target;
      if (target instanceof Node && words.some((w) => w.contains(target))) return;
      deactivateAll();
    };
    document.addEventListener('pointerdown', onDocPointer);

    words.forEach((word, index) => {
      const onClick = (e: Event): void => {
        e.preventDefault();
        const slot = parseSlot(word, index);
        if (word.hasAttribute('data-syn-active')) {
          deactivateAll();
          return;
        }
        activate(word, slot);
      };
      word.addEventListener('click', onClick);
      clickHandlers.push([word, onClick]);
    });
  } else {
    words.forEach((word, index) => {
      const slot = parseSlot(word, index);

      const onEnter = (): void => {
        if (graceTimer) {
          clearTimeout(graceTimer);
          graceTimer = null;
        }
        activate(word, slot);
      };

      const onLeave = (): void => {
        deactivateWord(word);
        if (activeWord === word) activeWord = null;
        if (graceTimer) clearTimeout(graceTimer);
        graceTimer = setTimeout(() => {
          clearSection();
          graceTimer = null;
        }, GRACE_MS);
      };

      word.addEventListener('pointerenter', onEnter);
      word.addEventListener('pointerleave', onLeave);
      enterHandlers.push([word, onEnter]);
      leaveHandlers.push([word, onLeave]);
    });
  }

  if (isReducedMotion()) {
    section.classList.add('syn-reduced-motion');
  }

  return {
    stop(): void {
      window.removeEventListener(THEME_EVENT, onTheme);
      if (onDocPointer) document.removeEventListener('pointerdown', onDocPointer);
      for (const [w, h] of clickHandlers) w.removeEventListener('click', h);
      for (const [w, h] of enterHandlers) w.removeEventListener('pointerenter', h);
      for (const [w, h] of leaveHandlers) w.removeEventListener('pointerleave', h);
      if (graceTimer) clearTimeout(graceTimer);
      section.classList.remove('syn-reduced-motion');
      deactivateAll();
    },
  };
}
