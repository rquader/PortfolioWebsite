/** The tree editor and page backdrop share this event contract. */
export const TREE_ATMOSPHERE_EVENT = 'rq:tree-atmosphere';
export const TREE_LEAF_SOURCES_EVENT = 'rq:tree-leaf-sources';

/** A canopy leaf's position in document CSS pixels, before viewport scrolling. */
export interface TreeLeafSource {
  x: number;
  y: number;
}

export interface TreeLeafSourcesDetail {
  points: TreeLeafSource[];
  /** Document Y coordinates where drifting leaves start and finish fading. */
  fadeStartY?: number;
  fadeEndY?: number;
}

export interface TreeAtmosphereSettings {
  depth: number;
  /** Branch spread in degrees. */
  spread: number;
  /** Branch length taper as a percentage. */
  taper: number;
}

export const DEFAULT_TREE_ATMOSPHERE_SETTINGS: Readonly<TreeAtmosphereSettings> = {
  depth: 8,
  spread: 27,
  taper: 74,
};

export interface LeafAtmosphere {
  densityMultiplier: number;
  sizeMultiplier: number;
  swayMultiplier: number;
  widthMultiplier: number;
  /** Overall alpha, before each leaf's parallax-layer alpha. */
  opacity: number;
}

function boundedNumber(value: unknown, fallback: number, min: number, max: number): number {
  return typeof value === 'number' && Number.isFinite(value)
    ? Math.max(min, Math.min(max, value))
    : fallback;
}

/** Interpolate on either side of the default, including asymmetric slider ranges. */
function mapRange(
  value: number,
  min: number,
  rest: number,
  max: number,
  low: number,
  baseline: number,
  high: number,
): number {
  if (value <= rest) return low + ((value - min) / (rest - min)) * (baseline - low);
  return baseline + ((value - rest) / (max - rest)) * (high - baseline);
}

/**
 * Small visual changes keep the falling leaves readable behind content.
 * Accept unknown because CustomEvent details can arrive from outside the editor.
 */
export function mapTreeAtmosphere(input: unknown): LeafAtmosphere {
  const settings = input !== null && typeof input === 'object' && !Array.isArray(input)
    ? input as Partial<TreeAtmosphereSettings>
    : {};
  const depth = Math.round(boundedNumber(settings.depth, 8, 5, 9));
  const spread = boundedNumber(settings.spread, 27, 18, 38);
  const taper = boundedNumber(settings.taper, 74, 60, 76);
  return {
    densityMultiplier: mapRange(depth, 5, 8, 9, 0.72, 1, 1.28),
    sizeMultiplier: mapRange(taper, 60, 74, 76, 0.84, 1, 1.16),
    swayMultiplier: mapRange(spread, 18, 27, 38, 0.75, 1, 1.25),
    widthMultiplier: mapRange(spread, 18, 27, 38, 0.78, 1, 1.22),
    opacity: mapRange(depth, 5, 8, 9, 0.16, 0.2, 0.24),
  };
}

export interface TreeLeafFallBounds {
  drift: number;
  sway: number;
  fadeStartY: number;
  fadeEndY: number;
}

/** A gentle downward path, fully transparent at both ends of each fall cycle. */
export function resolveTreeLeafFall(
  source: TreeLeafSource,
  progress: number,
  bounds: TreeLeafFallBounds,
): TreeLeafSource & { opacity: number } {
  const p = Math.max(0, Math.min(1, progress));
  const endY = Math.max(source.y + 240, bounds.fadeEndY);
  const startY = Math.min(endY - 120, Math.max(source.y + 80, bounds.fadeStartY));
  const y = source.y + p * (endY - source.y);
  const fade = Math.max(0, Math.min(1, (y - startY) / (endY - startY)));
  const smoothFade = fade * fade * (3 - 2 * fade);
  return {
    x: source.x + bounds.drift * p + bounds.sway * Math.sin(p * Math.PI * 2),
    y,
    opacity: Math.min(1, p / 0.04) * (1 - smoothFade),
  };
}
