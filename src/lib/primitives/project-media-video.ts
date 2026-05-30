/**
 * @file project-media-video.ts
 *
 * Manages `.project-media-video` elements that live OUTSIDE a carousel
 * (i.e. in single/stack mode). Uses IntersectionObserver to play when
 * in view and pause when out of view.
 *
 * Respects `prefers-reduced-motion: reduce` — if the user has requested
 * reduced motion, videos are left paused at the poster frame (ADR-019
 * noted this gap for GIFs; this primitive closes it for video).
 *
 * No-op if no matching elements are present (e.g. on non-/projects pages).
 */

export interface ProjectMediaVideoHandle {
  stop(): void;
}

export function initProjectMediaVideo(): ProjectMediaVideoHandle {
  if (typeof document === 'undefined') return { stop: () => {} };

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Only target video elements NOT inside a carousel (carousel controller
  // handles those independently via setVideoSlideActive).
  const allVideos = [
    ...document.querySelectorAll<HTMLVideoElement>(
      'video.project-media-video',
    ),
  ].filter((v) => !v.closest('[data-project-media-carousel]'));

  if (allVideos.length === 0) return { stop: () => {} };

  // If reduced-motion, leave all videos paused at poster — do not attach
  // the observer.
  if (reducedMotion) {
    for (const v of allVideos) {
      v.pause();
    }
    return { stop: () => {} };
  }

  const observers: IntersectionObserver[] = [];

  for (const video of allVideos) {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const v = entry.target as HTMLVideoElement;
          if (entry.isIntersecting) {
            v.play().catch(() => {/* blocked by browser policy — poster stays */});
          } else {
            v.pause();
          }
        }
      },
      // Start/stop playback when the video is at least 20% visible.
      { threshold: 0.2 },
    );
    observer.observe(video);
    observers.push(observer);
  }

  return {
    stop() {
      for (const observer of observers) observer.disconnect();
      for (const video of allVideos) video.pause();
    },
  };
}
