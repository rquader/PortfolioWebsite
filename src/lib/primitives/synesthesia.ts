/**
 * @file synesthesia.ts
 *
 * Hover-coloring on selected words inside the "on me" paragraph.
 * Each hover-active word is wrapped in `<span data-syn-word>`; on
 * hover, the word's letters reveal hand-picked colors and the section
 * takes a faint tint of the averaged word color.
 *
 * Palette inherited from Legendary's synesthesia (informed by Rimbaud
 * and Sean Day). The room tint transitions slowly via CSS — primitive
 * just sets the `--syn-r/g/b` variables and a `syn-tinted` class.
 *
 * Reduced motion: section-tint transition still works (it's a color
 * change, not motion); letter `text-shadow` glow is dropped.
 *
 * Spec: [[Concept - Synesthesia Goals]] in the Obsidian docs.
 */

import { isReducedMotion } from '../reduced-motion';
import { activeSynPalette } from '../palette/syn-colors';

const GRACE_MS = 700; // ms — pointerleave delay before removing tint

export interface SynesthesiaHandle {
  stop(): void;
}

interface AvgRgb { r: number; g: number; b: number; }

function avgWordColor(word: string): AvgRgb {
  const palette = activeSynPalette();
  const letters = word.toLowerCase().replace(/[^a-z]/g, '');
  let r = 0, g = 0, b = 0, n = 0;
  for (const c of letters) {
    const hex = palette[c];
    if (!hex) continue;
    r += parseInt(hex.slice(1, 3), 16);
    g += parseInt(hex.slice(3, 5), 16);
    b += parseInt(hex.slice(5, 7), 16);
    n++;
  }
  if (n === 0) return { r: 200, g: 180, b: 160 };
  return { r: r / n, g: g / n, b: b / n };
}

function splitWordIntoLetters(wordSpan: HTMLElement): HTMLElement[] {
  const text = wordSpan.textContent ?? '';
  wordSpan.textContent = '';
  const out: HTMLElement[] = [];
  for (const ch of text) {
    const span = document.createElement('span');
    span.className = 'syn-letter';
    span.textContent = ch;
    wordSpan.appendChild(span);
    out.push(span);
  }
  return out;
}

function ignite(wordSpan: HTMLElement, letters: HTMLElement[]): void {
  const reduced = isReducedMotion();
  const palette = activeSynPalette();
  for (const letter of letters) {
    const c = palette[(letter.textContent ?? '').toLowerCase()];
    if (!c) continue;
    letter.style.color = c;
    if (!reduced) letter.style.textShadow = `0 0 6px ${c}88`;
  }
  void wordSpan;
}

function quench(letters: HTMLElement[]): void {
  for (const letter of letters) {
    letter.style.color = '';
    letter.style.textShadow = '';
  }
}

export function initSynesthesia(section: HTMLElement): SynesthesiaHandle {
  if (typeof document === 'undefined') return { stop: () => {} };

  // Coarse-pointer guard: synesthesia is driven by pointer hover (pointerenter /
  // pointerleave on words). Touch screens never fire hover events in the same
  // way, and splitting words into per-letter spans on mobile would be pure DOM
  // overhead with no effect the user could trigger. Early-return before any DOM
  // mutation or event registration.
  if (typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches) {
    return { stop: () => {} };
  }

  const words = Array.from(section.querySelectorAll<HTMLElement>('[data-syn-word]'));
  if (words.length === 0) return { stop: () => {} };

  // Wrap each word's letters once.
  const lettersByWord = new WeakMap<HTMLElement, HTMLElement[]>();
  for (const w of words) {
    lettersByWord.set(w, splitWordIntoLetters(w));
  }

  let graceTimer: ReturnType<typeof setTimeout> | null = null;
  const enterHandlers: Array<[HTMLElement, (e: PointerEvent) => void]> = [];
  const leaveHandlers: Array<[HTMLElement, (e: PointerEvent) => void]> = [];

  for (const word of words) {
    const onEnter = () => {
      if (graceTimer) {
        clearTimeout(graceTimer);
        graceTimer = null;
      }
      const text = word.textContent ?? '';
      const { r, g, b } = avgWordColor(text);
      const root = document.documentElement;
      root.style.setProperty('--syn-r', String(Math.round(r)));
      root.style.setProperty('--syn-g', String(Math.round(g)));
      root.style.setProperty('--syn-b', String(Math.round(b)));
      section.classList.add('syn-tinted');
      ignite(word, lettersByWord.get(word) ?? []);
    };
    const onLeave = () => {
      quench(lettersByWord.get(word) ?? []);
      if (graceTimer) clearTimeout(graceTimer);
      graceTimer = setTimeout(() => {
        section.classList.remove('syn-tinted');
        graceTimer = null;
      }, GRACE_MS);
    };
    word.addEventListener('pointerenter', onEnter);
    word.addEventListener('pointerleave', onLeave);
    enterHandlers.push([word, onEnter]);
    leaveHandlers.push([word, onLeave]);
  }

  return {
    stop(): void {
      for (const [w, h] of enterHandlers) w.removeEventListener('pointerenter', h);
      for (const [w, h] of leaveHandlers) w.removeEventListener('pointerleave', h);
      if (graceTimer) clearTimeout(graceTimer);
    },
  };
}
