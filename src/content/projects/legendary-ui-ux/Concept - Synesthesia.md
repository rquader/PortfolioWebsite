---
tags: [concept, primitive, synesthesia]
---

# synesthesia

> words have weights and colours we never agree on.

## what it does

In the synesthesia tab, a passage of prose has every word wrapped in a `<span class="syn-word">` and every letter in a nested `<span class="syn-letter">`. Each letter has a colour I assigned to it; each word has an averaged colour derived from its letters'.

Default state: each letter is paper-grey (a calm gauze). On hover of a word:

1. the room's background colour shifts toward the word's average colour (CSS transition over 1.4s)
2. the letters of the hovered word lift their gauze and reveal their true colours (text-shadow glow on the matching hue)
3. the hero heading's gradient slides
4. a spectrum strip below the passage shows the per-letter colour breakdown, with each swatch labelled

The words are also *inertial* — each word is a node in a smaller word-physics system, and the pointer pushes them aside as it moves. This is the spirit of [pretext](https://github.com/chenglou/pretext) by Cheng Lou: text geometry as arithmetic, not the DOM's accident. I did not import pretext (the page is one file with no network); I implemented the technique inline.

## why

Synesthesia is a real and varied condition; grapheme–colour is the most famous kind. Researchers collect self-reports; the answers disagree letter by letter. There is no universal chart — only private ones. The site's mapping is therefore a *fiction*: a palette chosen so the room can show what averaging feels like when you hover a word.

The argument is small. Interfaces pretend to be temperature-neutral; language is not. *Subway*, *lemon*, *midnight* each tug pigment before you finish the sentence. This room makes that suggestion legible for about sixty seconds.

## copy (pass 3)

The tab prose no longer uses Rimbaud, herons, or river dawn imagery. Room intro cites synesthesia research disagreement; the passage talks about flat screens, late-night tabs, and words that blush the room on hover.

## implementation

### the letter palette

A hand-picked palette of 26 colours, informed by:
- Sean Day's compiled grapheme-colour synesthesia statistics (directionality, not authority)
- legibility against the warm-dark background
- character — then nudged until each letter reads on the warm-dark page

```js
const synColors = {
  a: '#332019', b: '#3956c9', c: '#e0a82a', d: '#664439',
  e: '#e2dac6', f: '#dc7240', g: '#3b6e30', h: '#dbcb6e',
  i: '#c83a3a', j: '#b14274', k: '#7e58c9', l: '#c8c4b8',
  m: '#b04140', n: '#dc8a40', o: '#3a78c8', p: '#39a5dc',
  q: '#8e44b0', r: '#c43030', s: '#dcc23b', t: '#3c8a8a',
  u: '#56a55c', v: '#7e6dc0', w: '#6a40a4', x: '#5a5651',
  y: '#dcae3b', z: '#3cb8c8'
};
```

### word colour

Average of letter RGBs, stripped to A–Z:

```js
function avgWordColor(word) {
  // strip to letters, average each channel
}
```

### hover

```js
function synHoverWord(w) {
  document.documentElement.style.setProperty('--syn-r', w.dataset.r);
  document.documentElement.style.setProperty('--syn-g', w.dataset.g);
  document.documentElement.style.setProperty('--syn-b', w.dataset.b);
  document.body.classList.add('syn-tinted');
}
```

CSS interpolates the body's background-color over 1.4s; the tint is felt as ambient, not as a flash. A 700ms grace timer on `pointerleave` prevents flickering when traversing between adjacent words.

### word physics

A second inertial-node array (`wordInertialNodes`) is registered on tab prepare. Each word has its own spring toward `(0, 0)` and pointer repulsion within 220px. Constants are softer than the letter physics (`k = 56`, `c = 11`) because words are larger and a stronger spring would feel jittery.

## pitfalls

- **whitespace preservation.** The passage spans paragraphs separated by `\n\n` in the source. Splitting on `/(\s+)/` and inspecting the captured runs lets me preserve sentence flow while still detecting paragraph breaks (replace `\n\n` runs with `<br><br>`).
- **`background` shorthand vs `background-color`.** Initial version used `background:` which triggered a re-paint of the whole body each frame. Specifying `background-color` alone with a long ease is cheaper and feels more like a tide than a switch.
- **gradient text on the hero.** Using `background-clip: text` with `-webkit-text-fill-color: transparent` to gradient-paint the heading. Required setting `color: transparent` on the same element to prevent fallback colour from showing through.
- **`pointerleave` timing.** Without the 700ms grace, moving cursor between two adjacent words made the tint flicker on/off. With it, the tint persists across small gaps.

## priors

- **Sean Day** — long-term collector of grapheme-colour synesthesia self-reports. His statistical compilations informed the directionality of my mapping (which letters tend to be red, which yellow, etc.). The room copy no longer cites him by name on the page; the palette still carries the debt.
- **Cheng Lou, [pretext](https://github.com/chenglou/pretext)** — the conviction that text layout can be arithmetic instead of DOM reflow. I did not import pretext (file is dependency-free); the word-physics here is implemented *in pretext's spirit*: lay out positions once, animate with offsets, never reflow.
- **Background-tint-on-hover** as a visual idiom is folk knowledge. Mine differs in that the tint is *averaged from letter colours*, not arbitrary.

## related

- [[Concept - Inertial Typography]] — same physics primitive, applied to words instead of letters
- [[Sources & Inspirations]] — full credits, including pretext
