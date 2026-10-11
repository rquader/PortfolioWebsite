import { advanceSpring } from './featured-motion';

export function initFeaturedWork(): () => void {
  const root = document.querySelector<HTMLElement>('[data-featured-work]');
  const viewport = root?.querySelector<HTMLElement>('[data-featured-viewport]');
  const range = root?.querySelector<HTMLInputElement>('[data-featured-range]');
  const controls = root?.querySelector<HTMLElement>('[data-featured-controls]');
  const previous = root?.querySelector<HTMLButtonElement>('[data-featured-prev]');
  const next = root?.querySelector<HTMLButtonElement>('[data-featured-next]');
  if (!root || !viewport || !range || !controls || !previous || !next) return () => {};
  const cards = [...root.querySelectorAll<HTMLElement>('[data-featured-card]')];
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const mobile = window.matchMedia('(max-width: 720px)');
  const abort = new AbortController();
  const options = { signal: abort.signal };
  let frame = 0;
  let scrollFrame = 0;
  let swingFrame = 0;
  let swing = 0;
  let swingTarget = 0;
  let previousScroll = viewport.scrollLeft;
  let previousScrollTime = performance.now();
  let target = viewport.scrollLeft;
  let position = target;
  let velocity = 0;
  let lastTime = 0;
  const limit = () => Math.max(0, viewport.scrollWidth - viewport.clientWidth);
  const stops = () => {
    const padding = parseFloat(getComputedStyle(viewport).paddingLeft);
    return cards.map(card => Math.max(0, Math.min(limit(), card.offsetLeft - padding)));
  };

  function sync() {
    const lastCard = cards.at(-1);
    const padding = parseFloat(getComputedStyle(viewport!).paddingLeft);
    const lineLength = lastCard ? lastCard.offsetLeft + lastCard.offsetWidth - padding : 0;
    root!.style.setProperty('--featured-length', `${lineLength}px`);
    const max = limit();
    const left = viewport!.scrollLeft;
    for (const card of cards) {
      const distance = Math.abs(card.offsetLeft - padding - left) / card.offsetWidth;
      card.style.setProperty('--featured-scale', String(reduced.matches ? 1 : .95 + .05 * Math.max(0, 1 - distance)));
    }
    controls!.hidden = max < 2;
    previous!.disabled = left < 2;
    next!.disabled = left > max - 2;
    if (!frame) range!.value = String(max ? Math.round(left / max * 1000) : 0);
    const index = left >= max - 2 ? cards.length - 1 : stops().reduce((best, value, i, all) => Math.abs(value - left) < Math.abs(all[best]! - left) ? i : best, 0);
    const name = cards[index]?.querySelector('h3')?.innerText.replace('↗', '').replace(/\s+/g, ' ').trim() ?? '';
    range!.setAttribute('aria-valuetext', `${name}, ${index + 1} of ${cards.length}`);
  }

  function stop() {
    cancelAnimationFrame(frame);
    frame = 0;
    velocity = 0;
    viewport!.removeAttribute('data-settling');
  }

  function tick(now: number) {
    const state = advanceSpring(position, velocity, target, (now - lastTime) / 1000, limit());
    position = state.position;
    velocity = state.velocity;
    lastTime = now;
    viewport!.scrollLeft = position;
    if (state.settled) {
      stop();
      sync();
    } else frame = requestAnimationFrame(tick);
  }

  function moveTo(value: number) {
    target = Math.max(0, Math.min(limit(), value));
    if (reduced.matches) {
      stop();
      viewport!.scrollLeft = target;
      sync();
      return;
    }
    viewport!.setAttribute('data-settling', '');
    if (!frame) {
      position = viewport!.scrollLeft;
      lastTime = performance.now();
      frame = requestAnimationFrame(tick);
    }
  }

  function advance(direction: number) {
    const current = frame ? target : viewport!.scrollLeft;
    const points = stops();
    const destination = direction > 0
      ? points.find(value => value > current + 3) ?? limit()
      : points.findLast(value => value < current - 3) ?? 0;
    moveTo(destination);
  }

  function updateLift() {
    scrollFrame = 0;
    const top = root!.getBoundingClientRect().top;
    const progress = reduced.matches || mobile.matches ? 0 : Math.max(-1, Math.min(1, -top / window.innerHeight));
    for (let i = 0; i < cards.length; i++) {
      cards[i]!.style.setProperty('--featured-lift', `${progress * (i % 2 ? -12 : 9)}px`);
    }
  }
  function settleSwing() {
    swing += (swingTarget - swing) * .2;
    swingTarget *= .87;
    if (reduced.matches || (Math.abs(swing) < .015 && Math.abs(swingTarget) < .015)) {
      swing = 0;
      swingTarget = 0;
      swingFrame = 0;
    } else swingFrame = requestAnimationFrame(settleSwing);
    cards.forEach((card, index) => card.style.setProperty('--featured-swing', `${swing * (index % 2 ? .8 : 1)}deg`));
  }
  function onTrackScroll() {
    const now = performance.now();
    const speed = (viewport!.scrollLeft - previousScroll) / Math.max(16, now - previousScrollTime);
    previousScroll = viewport!.scrollLeft;
    previousScrollTime = now;
    if (!reduced.matches) {
      swingTarget = Math.max(-2.5, Math.min(2.5, -speed * .7));
      if (!swingFrame) swingFrame = requestAnimationFrame(settleSwing);
    }
    sync();
  }
  function onScroll() { if (!scrollFrame) scrollFrame = requestAnimationFrame(updateLift); }
  function onPreferenceChange() { if (frame) moveTo(target); sync(); updateLift(); }
  range.addEventListener('input', () => moveTo(Number(range.value) / 1000 * limit()), options);
  previous.addEventListener('click', () => advance(-1), options);
  next.addEventListener('click', () => advance(1), options);
  viewport.addEventListener('scroll', onTrackScroll, { ...options, passive: true });
  viewport.addEventListener('pointerdown', stop, options);
  viewport.addEventListener('wheel', stop, { ...options, passive: true });
  viewport.addEventListener('keydown', (event) => {
    if (event.target !== viewport || event.altKey || event.ctrlKey || event.metaKey) return;
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    if (event.key === 'Home') moveTo(0);
    else if (event.key === 'End') moveTo(limit());
    else advance(event.key === 'ArrowRight' ? 1 : -1);
  }, options);
  window.addEventListener('scroll', onScroll, { ...options, passive: true });
  reduced.addEventListener('change', onPreferenceChange, options);
  mobile.addEventListener('change', updateLift, options);
  const observer = new ResizeObserver(() => { stop(); sync(); updateLift(); });
  observer.observe(viewport);
  for (const card of cards) observer.observe(card);
  sync();
  updateLift();
  const cleanup = () => { stop(); cancelAnimationFrame(scrollFrame); cancelAnimationFrame(swingFrame); observer.disconnect(); abort.abort(); };
  document.addEventListener('astro:before-swap', cleanup, { once: true, signal: abort.signal });
  return cleanup;
}
