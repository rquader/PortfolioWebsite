/**
 * Resolved accent for the current scroll section (scroll-spy sets
 * `--companion-color` on <html>). Used by inertial heading reveals —
 * not a per-letter palette.
 */

export function currentSectionAccentColor(): string {
  if (typeof document === 'undefined') return '';
  const v = getComputedStyle(document.documentElement)
    .getPropertyValue('--companion-color')
    .trim();
  return v || getComputedStyle(document.documentElement).getPropertyValue('--accent-default').trim();
}
