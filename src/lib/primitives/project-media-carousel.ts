/**
 * @file project-media-carousel.ts
 *
 * Lazy-loaded project media carousels on /projects.
 * Defers init until the carousel intersects the viewport; only visible
 * slides load their image src (GIF/PNG/video) on demand.
 * Video slides: active slide plays, inactive slides pause + unload sources.
 */

export interface ProjectMediaCarouselHandle {
  stop(): void;
}

function setVideoSlideActive(video: HTMLVideoElement, active: boolean): void {
  if (active) {
    // Load sources from data-* if not yet loaded
    if (!video.src && !video.querySelector('source')) {
      const webm = video.dataset.webm;
      const mp4 = video.dataset.mp4;
      if (webm) {
        const s1 = document.createElement('source');
        s1.src = webm;
        s1.type = 'video/webm';
        video.appendChild(s1);
      }
      if (mp4) {
        const s2 = document.createElement('source');
        s2.src = mp4;
        s2.type = 'video/mp4';
        video.appendChild(s2);
      }
      video.load();
    }
    video.play().catch(() => {/* autoplay blocked — poster stays visible */});
  } else {
    video.pause();
  }
}

function setSlideLoaded(slide: HTMLElement, loaded: boolean): void {
  // Video slide
  const video = slide.querySelector<HTMLVideoElement>('video.project-media-video');
  if (video) {
    setVideoSlideActive(video, loaded);
    return;
  }

  // Image slide (GIF / photo-img)
  const img = slide.querySelector<HTMLImageElement>('img.project-media-gif, img.photo-img');
  if (!img) return;
  if (loaded) {
    const dataSrc = img.dataset.src ?? img.getAttribute('data-lightbox-trigger');
    if (dataSrc && !img.src) img.src = dataSrc;
    img.loading = 'eager';
  } else if (img.classList.contains('project-media-gif')) {
    img.removeAttribute('src');
  }
}

function preloadAdjacent(root: HTMLElement, index: number): void {
  const slides = [...root.querySelectorAll<HTMLElement>('[data-carousel-slide]')];
  for (const offset of [-1, 1]) {
    const slide = slides[index + offset];
    if (!slide) continue;
    // For image slides: preload src. For video slides: do NOT preload —
    // loading a hidden video would start downloading unnecessarily.
    const video = slide.querySelector<HTMLVideoElement>('video.project-media-video');
    if (video) continue;
    const img = slide.querySelector<HTMLImageElement>('img.project-media-gif, img.photo-img');
    if (img) {
      const dataSrc = img.dataset.src ?? img.getAttribute('data-lightbox-trigger');
      if (dataSrc && !img.src) img.src = dataSrc;
      img.loading = 'eager';
    }
  }
}

function initCarousel(root: HTMLElement): () => void {
  const slides = [...root.querySelectorAll<HTMLElement>('[data-carousel-slide]')];
  if (slides.length === 0) return () => {};

  const labelEl = root.querySelector<HTMLElement>('[data-carousel-label]');
  const prevBtn = root.querySelector<HTMLButtonElement>('[data-carousel-prev]');
  const nextBtn = root.querySelector<HTMLButtonElement>('[data-carousel-next]');
  const dots = [...root.querySelectorAll<HTMLButtonElement>('[data-carousel-dot]')];

  let index = Number(root.dataset.defaultIndex ?? '0');
  index = Math.min(Math.max(index, 0), slides.length - 1);

  function show(next: number): void {
    index = (next + slides.length) % slides.length;
    root.dataset.activeIndex = String(index);

    for (const slide of slides) {
      const slideIndex = Number(slide.dataset.slideIndex);
      const active = slideIndex === index;
      slide.hidden = !active;
      slide.setAttribute('aria-hidden', active ? 'false' : 'true');
      slide.classList.toggle('is-active', active);
      setSlideLoaded(slide, active);
    }

    preloadAdjacent(root, index);

    const label = slides[index]?.dataset.slideLabel ?? `slide ${index + 1}`;
    if (labelEl) labelEl.textContent = label;

    for (const dot of dots) {
      const dotIndex = Number(dot.dataset.carouselDot);
      const active = dotIndex === index;
      dot.classList.toggle('is-active', active);
      dot.setAttribute('aria-selected', active ? 'true' : 'false');
    }
  }

  // Normalize GIF data-src (video slides use data-webm/data-mp4, already set by template)
  for (const slide of slides) {
    const img = slide.querySelector<HTMLImageElement>('img.project-media-gif');
    if (img && !img.dataset.src) {
      const resolved = img.getAttribute('src') ?? img.dataset.lightboxTrigger;
      if (resolved) img.dataset.src = resolved;
    }
  }

  for (const slide of slides) setSlideLoaded(slide, false);
  show(index);

  const onPrev = () => show(index - 1);
  const onNext = () => show(index + 1);
  prevBtn?.addEventListener('click', onPrev);
  nextBtn?.addEventListener('click', onNext);

  const dotHandlers = dots.map((dot) => {
    const onDot = () => show(Number(dot.dataset.carouselDot));
    dot.addEventListener('click', onDot);
    return { dot, onDot };
  });

  const onKey = (e: KeyboardEvent) => {
    if (!root.contains(document.activeElement) && document.activeElement !== root) return;
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      onPrev();
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      onNext();
    }
  };
  root.addEventListener('keydown', onKey);
  root.tabIndex = 0;

  return () => {
    prevBtn?.removeEventListener('click', onPrev);
    nextBtn?.removeEventListener('click', onNext);
    for (const { dot, onDot } of dotHandlers) dot.removeEventListener('click', onDot);
    root.removeEventListener('keydown', onKey);
  };
}

export function initProjectMediaCarousels(): ProjectMediaCarouselHandle {
  if (typeof document === 'undefined') return { stop: () => {} };

  const roots = [...document.querySelectorAll<HTMLElement>('[data-project-media-carousel]')];
  const cleanups: Array<() => void> = [];
  const observers: IntersectionObserver[] = [];

  for (const root of roots) {
    let started = false;
    let cleanup = () => {};

    const start = () => {
      if (started) return;
      started = true;
      cleanup = initCarousel(root);
    };

    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              start();
              observer.disconnect();
            }
          }
        },
        { rootMargin: '120px 0px' },
      );
      observer.observe(root);
      observers.push(observer);
    } else {
      start();
    }

    cleanups.push(() => cleanup());
  }

  return {
    stop() {
      for (const observer of observers) observer.disconnect();
      for (const cleanup of cleanups) cleanup();
    },
  };
}
