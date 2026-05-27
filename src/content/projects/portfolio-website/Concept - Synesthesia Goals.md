---
tags: [concept, primitive, color]
---

# Concept — Synesthesia Goals

> Hover-coloring on a small set of words inside the "on me" paragraph. Each word lights up in its own color when the cursor passes over it. The room takes a faint tint of that color.

## What it is

A scoped version of [[Legendary UI-UX/Concept - Synesthesia]]. In Legendary, synesthesia was its own four-paragraph room with every letter wrapped. Here it's narrower:

- Applied to one paragraph (the user's bio in the "on me" section).
- A small set of words inside that paragraph — wrapped in `<span data-syn-word>` — become hover-active.
- On hover, each word's letters reveal their colors and the room takes a faint tint.

The user picks which words. The default-suggested candidates are the "meaningful" / "applications" / "nudging" trio from his stated objective, but he can pick any.

## Why

The Legendary synesthesia concept's claim is that *words carry hidden weights of pigment*. The portfolio applies that claim narrowly: the *important words* — values, goals — carry pigment that the reader can reveal. Less spectacle, more intent.

This is the second-strongest medium-is-the-argument moment in the site (after the recursive tree). The reader is literally invited to interact with the user's values.

## Algorithm

### Letter palette

Same hand-picked palette as Legendary's synesthesia, lightly tuned for the warm-dark background:

```ts
const synColors: Record<string, string> = {
  a: '#332019', b: '#3956c9', c: '#e0a82a', d: '#664439',
  e: '#e2dac6', f: '#dc7240', g: '#3b6e30', h: '#dbcb6e',
  i: '#c83a3a', j: '#b14274', k: '#7e58c9', l: '#c8c4b8',
  m: '#b04140', n: '#dc8a40', o: '#3a78c8', p: '#39a5dc',
  q: '#8e44b0', r: '#c43030', s: '#dcc23b', t: '#3c8a8a',
  u: '#56a55c', v: '#7e6dc0', w: '#6a40a4', x: '#5a5651',
  y: '#dcae3b', z: '#3cb8c8',
};
```

Same palette as Legendary's. The rationale ([[Legendary UI-UX/Concept - Synesthesia]]) is informed by Rimbaud and Sean Day; we inherit it without changes.

### Word color

Average of letter RGBs, stripped to A–Z:

```ts
function avgWordColor(word: string): { r: number; g: number; b: number } {
  const letters = word.toLowerCase().replace(/[^a-z]/g, '');
  let r = 0, g = 0, b = 0;
  for (const c of letters) {
    const hex = synColors[c];
    r += parseInt(hex.slice(1, 3), 16);
    g += parseInt(hex.slice(3, 5), 16);
    b += parseInt(hex.slice(5, 7), 16);
  }
  const n = Math.max(letters.length, 1);
  return { r: r / n, g: g / n, b: b / n };
}
```

### Hover behavior

```ts
// On pointerenter on a [data-syn-word]:
const { r, g, b } = wordColor;
document.documentElement.style.setProperty('--syn-r', String(r));
document.documentElement.style.setProperty('--syn-g', String(g));
document.documentElement.style.setProperty('--syn-b', String(b));
section.classList.add('syn-tinted');

// On pointerleave: wait 700ms, then remove tint. The 700ms grace
// prevents flicker when the cursor traverses adjacent words.
```

CSS then transitions the section's background tint over ~1.2s:

```css
.on-me {
  background-color: rgb(
    calc(20 + var(--syn-r, 200) * 0.06),
    calc(18 + var(--syn-g, 180) * 0.06),
    calc(16 + var(--syn-b, 160) * 0.06)
  );
  transition: background-color 1.2s ease;
}
.on-me.syn-tinted {
  background-color: rgb(
    calc(30 + var(--syn-r) * 0.22),
    calc(27 + var(--syn-g) * 0.22),
    calc(24 + var(--syn-b) * 0.22)
  );
}
```

### Letter-color reveal

Inside a `[data-syn-word]`, each letter span receives its color via JS-set inline style on hover (default state is the section's body color). A subtle `text-shadow` of the same color provides the "glow" so the letter feels lit:

```ts
function ignite(wordSpan: HTMLElement) {
  for (const letter of wordSpan.querySelectorAll<HTMLElement>('span.syn-letter')) {
    const c = synColors[letter.textContent!.toLowerCase()];
    if (!c) continue;
    letter.style.color = c;
    letter.style.textShadow = `0 0 6px ${c}88`;
  }
}
function quench(wordSpan: HTMLElement) {
  for (const letter of wordSpan.querySelectorAll<HTMLElement>('span.syn-letter')) {
    letter.style.color = '';
    letter.style.textShadow = '';
  }
}
```

### Spectrum strip — *deferred*

Legendary's synesthesia tab includes a per-letter color strip below the passage. We **omit** it here. Reason: in Legendary the strip is part of the room's argument; in a portfolio bio paragraph it would feel like a teaching aid stapled to a personal statement. If the user wants it, easy to add later.

## DOM model

The bio prose has explicit `<span data-syn-word>` markup on user-chosen words. Inside each marked word, letters are wrapped at boot time (similar to inertial typography's split).

```html
<p class="bio">
  [PLACEHOLDER — your bio. Words you want to make hover-colorable get
  wrapped like this:]
  ... I work on
  <span data-syn-word>meaningful</span>
  things, hoping to nudge humanity ...
</p>
```

## Module shape

```ts
// src/lib/primitives/synesthesia.ts
export interface SynHandle { stop: () => void }
export function initSynesthesia(root: HTMLElement): SynHandle { /* ... */ }
```

Called once per scoped section. Inert outside the section.

## Performance

Negligible. A handful of words; hover events are sparse. The CSS transition on the section's background-color is the main "expense" and is browser-cheap (well under one paint frame).

## Edge cases

- **Words crossing line wraps** — fine; the span splits visually.
- **Adjacent words** — 700ms grace timer on `pointerleave` prevents the section tint from flickering when the cursor moves from one synesthesia word to the next.
- **Non-letter characters** — apostrophes, hyphens, etc. — left without color, included in the word's averaged color (their contribution is zero since they don't appear in `synColors`).
- **Reduced motion** — disable the section tint transition; letter reveal still happens (it's not motion, just color). Letter `color` still changes; `text-shadow` is dropped.
- **Mobile / touch** — `pointerenter` events fire from touch; first tap ignites the word and the section tints, second tap on another word switches. Acceptable but consider a `pointertype === 'touch'` branch that ignites on tap-and-hold rather than tap, if the touch behavior feels too sticky.

## See also

- [[Legendary UI-UX/Concept - Synesthesia]] — the parent
- [[Concept - Inertial Headings]] — sister primitive (same DOM wrapping pattern)
- [[03 - Content Model#on me]]
