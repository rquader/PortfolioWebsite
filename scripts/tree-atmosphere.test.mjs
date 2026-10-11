import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_TREE_ATMOSPHERE_SETTINGS,
  TREE_ATMOSPHERE_EVENT,
  mapTreeAtmosphere,
  resolveTreeLeafFall,
} from '../src/lib/backdrop/tree-atmosphere.ts';

test('the default tree keeps the familiar leaf proportions and a subtle opacity', () => {
  assert.equal(TREE_ATMOSPHERE_EVENT, 'rq:tree-atmosphere');
  assert.deepEqual(DEFAULT_TREE_ATMOSPHERE_SETTINGS, { depth: 8, spread: 27, taper: 74 });
  assert.deepEqual(mapTreeAtmosphere(DEFAULT_TREE_ATMOSPHERE_SETTINGS), {
    densityMultiplier: 1,
    sizeMultiplier: 1,
    swayMultiplier: 1,
    widthMultiplier: 1,
    opacity: 0.2,
  });
});

test('extreme trees produce bounded leaf changes that stay readable behind text', () => {
  const sparse = mapTreeAtmosphere({ depth: 5, spread: 18, taper: 60 });
  const full = mapTreeAtmosphere({ depth: 9, spread: 38, taper: 76 });
  assert.deepEqual(sparse, {
    densityMultiplier: 0.72,
    sizeMultiplier: 0.84,
    swayMultiplier: 0.75,
    widthMultiplier: 0.78,
    opacity: 0.16,
  });
  assert.deepEqual(full, {
    densityMultiplier: 1.28,
    sizeMultiplier: 1.16,
    swayMultiplier: 1.25,
    widthMultiplier: 1.22,
    opacity: 0.24,
  });
});

test('each tree control changes its intended leaf property independently', () => {
  const defaults = mapTreeAtmosphere(DEFAULT_TREE_ATMOSPHERE_SETTINGS);
  const deep = mapTreeAtmosphere({ depth: 9, spread: 27, taper: 74 });
  const wide = mapTreeAtmosphere({ depth: 8, spread: 38, taper: 74 });
  const long = mapTreeAtmosphere({ depth: 8, spread: 27, taper: 76 });
  assert.ok(deep.densityMultiplier > defaults.densityMultiplier);
  assert.equal(deep.sizeMultiplier, defaults.sizeMultiplier);
  assert.ok(wide.widthMultiplier > defaults.widthMultiplier);
  assert.ok(wide.swayMultiplier > defaults.swayMultiplier);
  assert.equal(wide.densityMultiplier, defaults.densityMultiplier);
  assert.ok(long.sizeMultiplier > defaults.sizeMultiplier);
  assert.equal(long.swayMultiplier, defaults.swayMultiplier);
});

test('out-of-range values clamp and malformed event data uses safe defaults', () => {
  assert.deepEqual(
    mapTreeAtmosphere({ depth: -100, spread: 10000, taper: 10000 }),
    mapTreeAtmosphere({ depth: 5, spread: 38, taper: 76 }),
  );
  const defaults = mapTreeAtmosphere(DEFAULT_TREE_ATMOSPHERE_SETTINGS);
  for (const input of [undefined, null, [], 'autumn', true, 7]) {
    assert.deepEqual(mapTreeAtmosphere(input), defaults);
  }
  assert.deepEqual(mapTreeAtmosphere({ depth: NaN, spread: Infinity, taper: '76' }), defaults);
  assert.deepEqual(mapTreeAtmosphere({ depth: 9 }), mapTreeAtmosphere({ depth: 9, spread: 27, taper: 74 }));
  assert.deepEqual(mapTreeAtmosphere({ depth: 8.6 }), mapTreeAtmosphere({ depth: 9 }));
});

test('a tree leaf begins at its canopy source and descends before fading out', () => {
  const source = { x: 700, y: 300 };
  const bounds = { drift: -200, sway: 20, fadeStartY: 800, fadeEndY: 1200 };
  const start = resolveTreeLeafFall(source, 0, bounds);
  const middle = resolveTreeLeafFall(source, 0.5, bounds);
  const end = resolveTreeLeafFall(source, 1, bounds);
  assert.deepEqual(start, { x: 700, y: 300, opacity: 0 });
  assert.equal(middle.x, 600);
  assert.equal(middle.y, 750);
  assert.equal(middle.opacity, 1);
  assert.deepEqual(end, { x: 500, y: 1200, opacity: 0 });
  assert.ok(resolveTreeLeafFall(source, 0.8, bounds).opacity < middle.opacity);
});

test('source paths move downward even if content fade bounds precede the canopy', () => {
  const source = { x: 800, y: 1000 };
  const bounds = { drift: 100, sway: 15, fadeStartY: 100, fadeEndY: 200 };
  const middle = resolveTreeLeafFall(source, 0.5, bounds);
  const end = resolveTreeLeafFall(source, 1, bounds);
  assert.ok(middle.y > source.y);
  assert.ok(end.y > middle.y);
  assert.equal(end.opacity, 0);
  assert.deepEqual(resolveTreeLeafFall(source, -1, bounds), resolveTreeLeafFall(source, 0, bounds));
  assert.deepEqual(resolveTreeLeafFall(source, 2, bounds), end);
});
