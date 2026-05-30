/**
 * @file photo-lightbox.ts
 *
 * Click-to-enlarge for `[data-lightbox-trigger]` elements.
 * Supports both images (data-lightbox-type absent or "image") and
 * videos (data-lightbox-type="video") — video triggers carry
 * data-lightbox-webm, data-lightbox-poster, and data-lightbox-alt.
 * The video element is created in JS and inserted alongside the existing
 * <img> in the lightbox; Base.astro is not modified.
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

  // Lazily-created video element for video lightbox; reused across opens.
  let lightboxVideo: HTMLVideoElement | null = null;

  function getOrCreateLightboxVideo(): HTMLVideoElement {
    if (!lightboxVideo) {
      lightboxVideo = document.createElement('video');
      lightboxVideo.className = 'photo-lightbox-video';
      lightboxVideo.controls = true;
      lightboxVideo.autoplay = true;
      lightboxVideo.loop = true;
      lightboxVideo.muted = true;
      lightboxVideo.playsInline = true;
      lightboxVideo.style.cssText =
        'max-width:100%;max-height:90vh;display:none;border-radius:2px;background:#000;';
      // Insert next to the img inside the overlay
      img.parentNode?.insertBefore(lightboxVideo, img.nextSibling);
    }
    return lightboxVideo;
  }

  let lastFocus: HTMLElement | null = null;

  function openImage(src: string, alt: string): void {
    lastFocus = (document.activeElement as HTMLElement | null) ?? null;
    // Hide any previous video lightbox
    if (lightboxVideo) {
      lightboxVideo.pause();
      lightboxVideo.style.display = 'none';
    }
    img.src = src;
    img.alt = alt;
    img.style.display = '';
    overlay.dataset.state = 'open';
    overlay.dataset.lightboxType = 'image';
    overlay.removeAttribute('aria-hidden');
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(() => closeBtn.focus());
  }

  function openVideo(mp4: string, webm: string, poster: string, alt: string): void {
    lastFocus = (document.activeElement as HTMLElement | null) ?? null;
    // Hide the image
    img.style.display = 'none';
    img.src = '';

    const vid = getOrCreateLightboxVideo();
    // Clear previous sources
    while (vid.firstChild) vid.removeChild(vid.firstChild);
    if (webm) {
      const s1 = document.createElement('source');
      s1.src = webm;
      s1.type = 'video/webm';
      vid.appendChild(s1);
    }
    const s2 = document.createElement('source');
    s2.src = mp4;
    s2.type = 'video/mp4';
    vid.appendChild(s2);
    if (poster) vid.poster = poster;
    vid.title = alt;
    vid.style.display = '';
    vid.load();
    vid.play().catch(() => {/* autoplay may be blocked without prior interaction */});

    overlay.dataset.state = 'open';
    overlay.dataset.lightboxType = 'video';
    overlay.removeAttribute('aria-hidden');
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(() => closeBtn.focus());
  }

  function close(): void {
    overlay.dataset.state = 'closed';
    overlay.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    // Clean up video
    if (lightboxVideo) {
      lightboxVideo.pause();
      lightboxVideo.style.display = 'none';
      while (lightboxVideo.firstChild) lightboxVideo.removeChild(lightboxVideo.firstChild);
      lightboxVideo.poster = '';
    }
    // Restore image visibility for next open
    img.style.display = '';
    if (lastFocus && document.contains(lastFocus)) lastFocus.focus();
  }

  // Selectors: image triggers are <img data-lightbox-trigger>, video triggers
  // are <video data-lightbox-trigger> (set in ProjectMediaAsset).
  const triggers = document.querySelectorAll<HTMLElement>('[data-lightbox-trigger]');
  const onTriggerClick = (e: Event) => {
    const t = e.currentTarget as HTMLElement;
    const src = t.dataset.lightboxTrigger;
    const alt = t.dataset.lightboxAlt ?? '';
    if (!src) return;
    e.preventDefault();

    const type = t.dataset.lightboxType;
    if (type === 'video') {
      const webm = t.dataset.lightboxWebm ?? '';
      const poster = t.dataset.lightboxPoster ?? '';
      openVideo(src, webm, poster, alt);
    } else {
      openImage(src, alt);
    }
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
