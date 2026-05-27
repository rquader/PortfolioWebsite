/**
 * @file photo-lightbox.ts
 *
 * Click-to-enlarge for `<img data-lightbox-trigger>`.
 */

export interface PhotoLightboxHandle {
  stop(): void;
}

export function initPhotoLightbox(): PhotoLightboxHandle {
  if (typeof document === 'undefined') return { stop: () => {} };

  const overlayEl = document.getElementById('photo-lightbox');
  if (!(overlayEl instanceof HTMLElement)) return { stop: () => {} };
  const overlay: HTMLElement = overlayEl;

  const imgEl = overlay.querySelector<HTMLImageElement>('.photo-lightbox-image');
  const closeBtnEl = overlay.querySelector<HTMLButtonElement>('.photo-lightbox-close');
  if (!imgEl || !closeBtnEl) return { stop: () => {} };
  const img: HTMLImageElement = imgEl;
  const closeBtn: HTMLButtonElement = closeBtnEl;

  let lastFocus: HTMLElement | null = null;

  function open(src: string, alt: string): void {
    lastFocus = (document.activeElement as HTMLElement | null) ?? null;
    img.src = src;
    img.alt = alt;
    overlay.dataset.state = 'open';
    overlay.removeAttribute('aria-hidden');
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(() => closeBtn.focus());
  }

  function close(): void {
    overlay.dataset.state = 'closed';
    overlay.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    if (lastFocus && document.contains(lastFocus)) lastFocus.focus();
  }

  const triggers = document.querySelectorAll<HTMLImageElement>('img[data-lightbox-trigger]');
  const onTriggerClick = (e: Event) => {
    const t = e.currentTarget as HTMLImageElement;
    const src = t.dataset.lightboxTrigger;
    const alt = t.dataset.lightboxAlt ?? '';
    if (!src) return;
    e.preventDefault();
    open(src, alt);
  };
  for (const t of triggers) t.addEventListener('click', onTriggerClick);

  const onOverlayClick = (e: Event) => {
    const target = e.target as HTMLElement;
    if (target === overlay || target.closest('.photo-lightbox-close')) {
      e.preventDefault();
      close();
    }
  };
  overlay.addEventListener('click', onOverlayClick);

  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && overlay.dataset.state === 'open') {
      e.preventDefault();
      close();
    }
  };
  window.addEventListener('keydown', onKey);

  return {
    stop() {
      for (const t of triggers) t.removeEventListener('click', onTriggerClick);
      overlay.removeEventListener('click', onOverlayClick);
      window.removeEventListener('keydown', onKey);
      close();
    },
  };
}
