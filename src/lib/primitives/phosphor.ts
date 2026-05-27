/**
 * @file phosphor.ts
 *
 * Phosphor touch trail — small soft dots spawn along the cursor path
 * and fade out over ~0.6 seconds. The trail picks up `--companion-color`
 * so it shifts with the section (same per-section accent system as the
 * cursor companion). Hard-capped at 200 particles for perf safety.
 *
 * Hidden on coarse pointers (touch). Inert under reduced motion.
 *
 * Spec: [[Open Questions#Phosphor touch trail]] in the Obsidian docs.
 * Inherited in spirit from Legendary UI/UX's phosphor touch trail.
 *
 * Architecture: full-viewport fixed canvas at z-index 90 (above page
 * content, below cursor companion at 100). `pointer-events: none` so it
 * never blocks clicks.
 */

import { registerTick } from '../boot';
import { isReducedMotion } from '../reduced-motion';

const MAX_PARTICLES = 200;
const FADE_S = 0.65;
const DOT_R_MIN = 1.4;
const DOT_R_MAX = 2.6;
// Skip spawn if pointer hasn't moved far — keeps the trail tight,
// avoids clustering when the cursor is stationary or moving slowly.
const MIN_SPAWN_DIST = 5;

interface Particle {
  x: number;
  y: number;
  age: number;
  maxAge: number;
  size: number;
}

export interface PhosphorHandle {
  stop(): void;
}

export function initPhosphor(): PhosphorHandle {
  if (typeof document === 'undefined' || typeof window === 'undefined') {
    return { stop: () => {} };
  }
  // Touch: no continuous pointermove → no trail. Skip entirely.
  if (window.matchMedia('(pointer: coarse)').matches) {
    return { stop: () => {} };
  }

  const canvas = document.createElement('canvas');
  canvas.id = 'phosphor-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  document.body.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    canvas.remove();
    return { stop: () => {} };
  }

  let cssW = window.innerWidth;
  let cssH = window.innerHeight;
  let dpr = window.devicePixelRatio || 1;

  function configure(): void {
    dpr = window.devicePixelRatio || 1;
    cssW = window.innerWidth;
    cssH = window.innerHeight;
    canvas.width = Math.floor(cssW * dpr);
    canvas.height = Math.floor(cssH * dpr);
    canvas.style.width = `${cssW}px`;
    canvas.style.height = `${cssH}px`;
    ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  configure();

  const particles: Particle[] = [];
  let lastX = -10000;
  let lastY = -10000;

  function readAccent(): string {
    const v = getComputedStyle(document.documentElement)
      .getPropertyValue('--companion-color')
      .trim();
    return v || '#E8DEC5';
  }

  function spawnAlong(x0: number, y0: number, x1: number, y1: number): void {
    const dx = x1 - x0;
    const dy = y1 - y0;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < MIN_SPAWN_DIST) return;
    if (dist > 1200) return; // pointer jumped — don't carpet the screen

    const steps = Math.min(6, Math.max(1, Math.floor(dist / 18)));
    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      particles.push({
        x: x0 + dx * t + (Math.random() - 0.5) * 1.5,
        y: y0 + dy * t + (Math.random() - 0.5) * 1.5,
        age: 0,
        maxAge: FADE_S * (0.7 + Math.random() * 0.6),
        size: DOT_R_MIN + Math.random() * (DOT_R_MAX - DOT_R_MIN),
      });
    }
    // Cap from the oldest end.
    while (particles.length > MAX_PARTICLES) particles.shift();
  }

  const onMove = (e: PointerEvent) => {
    if (isReducedMotion()) return;
    if (lastX < -1000) {
      lastX = e.clientX;
      lastY = e.clientY;
      return;
    }
    spawnAlong(lastX, lastY, e.clientX, e.clientY);
    lastX = e.clientX;
    lastY = e.clientY;
  };
  window.addEventListener('pointermove', onMove, { passive: true });

  const onResize = () => configure();
  window.addEventListener('resize', onResize);

  const unregister = registerTick((dt) => {
    // Always advance + clear, even under reduced motion, so any
    // already-spawned particles drain rather than freezing on screen.
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i] as Particle;
      p.age += dt;
      if (p.age >= p.maxAge) particles.splice(i, 1);
    }

    ctx!.clearRect(0, 0, cssW, cssH);
    if (particles.length === 0) return;

    const color = readAccent();
    ctx!.fillStyle = color;
    ctx!.shadowColor = color;

    for (const p of particles) {
      const lifeLeft = 1 - p.age / p.maxAge;
      const alpha = lifeLeft * lifeLeft * 0.55;
      ctx!.globalAlpha = alpha;
      ctx!.shadowBlur = 6 * lifeLeft;
      ctx!.beginPath();
      ctx!.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx!.fill();
    }
    ctx!.globalAlpha = 1.0;
    ctx!.shadowBlur = 0;
  });

  return {
    stop(): void {
      unregister();
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('resize', onResize);
      canvas.remove();
    },
  };
}
