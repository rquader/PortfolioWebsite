/**
 * @file obsidian-bolds.ts
 *
 * Wraps each character of `<strong>` inside any `.rp-content` so the
 * existing inertial-type flashlight color reveal applies to bolds —
 * without making them physically wobble. Matches Obsidian's rule that
 * bold draws the eye: weight + warmer color + (now) a quiet light-up
 * on cursor proximity.
 *
 * Idempotent and side-effect only. Runs once at panel mount (panel
 * articles are statically rendered, so DOM never changes after init).
 *
 * Spec: [[specs/2026-05-18-tree-leaves-folders-design#4.5]].
 */

function wrapChars(strong: HTMLElement): void {
  if (strong.dataset.boldsWrapped === 'true') return;
  strong.dataset.boldsWrapped = 'true';
  strong.setAttribute('data-color-letters', '');

  const walker = document.createTreeWalker(strong, NodeFilter.SHOW_TEXT, null);
  const textNodes: Text[] = [];
  let n: Node | null;
  while ((n = walker.nextNode())) textNodes.push(n as Text);

  for (const node of textNodes) {
    const text = node.nodeValue ?? '';
    if (text.length === 0) continue;
    const frag = document.createDocumentFragment();
    for (const ch of text) {
      if (ch === ' ' || ch === '\t' || ch === '\n') {
        frag.appendChild(document.createTextNode(ch));
      } else {
        const span = document.createElement('span');
        // NOTE: deliberately NO `data-inertial` — we want the
        // flashlight color-reveal but not the spring physics. The
        // inertial-type primitive's color-only loop picks this up via
        // the `.syn-letter` class.
        span.className = 'inertial-letter syn-letter';
        span.textContent = ch;
        frag.appendChild(span);
      }
    }
    node.parentNode?.replaceChild(frag, node);
  }
}

export function initObsidianBolds(scope: ParentNode = document): void {
  if (typeof document === 'undefined') return;
  for (const strong of scope.querySelectorAll<HTMLElement>('.rp-content strong')) {
    wrapChars(strong);
  }
}
