import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { build } from 'esbuild';

// Bundle the actual TS modules so Node can resolve the project's extensionless imports.
const bundled = await build({
  stdin: {
    contents: `
      export { TREE_CONST, buildBranches } from './src/lib/backdrop/tree-algorithm.ts';
      export { buildLeaves } from './src/lib/backdrop/leaf.ts';
      export { mulberry32 } from './src/lib/backdrop/rng.ts';
      export { SEPIA_LIGHT } from './src/lib/backdrop/palettes.ts';
    `,
    resolveDir: new URL('..', import.meta.url).pathname,
  },
  bundle: true,
  platform: 'node',
  format: 'esm',
  write: false,
});
const { TREE_CONST, buildBranches, buildLeaves, mulberry32, SEPIA_LIGHT } = await import(
  `data:text/javascript;base64,${Buffer.from(bundled.outputFiles[0].text).toString('base64')}`
);

function buildCanopy(overrides = {}) {
  const constants = { ...TREE_CONST, ...overrides };
  const rng = mulberry32(constants.RNG_SEED);
  const branches = buildBranches(rng, constants);
  const leaves = buildLeaves(rng, branches, SEPIA_LIGHT, constants);
  return { branches, leaves };
}

test('minimum taper retains canopy leaves at depth 8 and 9 when short branches are pruned', () => {
  for (const depth of [8, 9]) {
    const { branches, leaves } = buildCanopy({
      MAX_DEPTH: depth,
      LEAF_DEPTH_MIN: depth,
      LENGTH_RATIO: 0.6,
    });
    assert.ok(Math.max(...branches.map(branch => branch.depth)) < depth);
    const parents = new Set(branches.map(branch => branch.parent));
    const actualTips = branches.flatMap((_branch, index) => parents.has(index) ? [] : [index]);
    assert.ok(actualTips.length > 0);
    for (const [index, branch] of branches.entries()) {
      assert.equal(branch.isTerminal, !parents.has(index), `terminal flag at branch ${index}`);
    }
    assert.deepEqual(leaves.map(leaf => leaf.branchIdx), actualTips);
  }
});

test('every valid depth and taper combination keeps leaves on actual branch tips', () => {
  for (let depth = 5; depth <= 9; depth++) {
    for (let taper = 60; taper <= 76; taper++) {
      const { branches, leaves } = buildCanopy({
        MAX_DEPTH: depth,
        LEAF_DEPTH_MIN: depth,
        LENGTH_RATIO: taper / 100,
      });
      const parents = new Set(branches.map(branch => branch.parent));
      const actualTips = branches.flatMap((_branch, index) => parents.has(index) ? [] : [index]);
      assert.ok(leaves.length > 0, `depth ${depth}, taper ${taper}`);
      assert.deepEqual(leaves.map(leaf => leaf.branchIdx), actualTips);
    }
  }
});

test('the original default tree and seeded canopy remain unchanged', () => {
  const { branches, leaves } = buildCanopy();
  assert.equal(branches.length, 701);
  assert.equal(leaves.length, 374);
  assert.equal(
    createHash('sha256').update(JSON.stringify({ branches, leaves })).digest('hex'),
    '3ed945da210b786a76a75b547546f0a6292c31826221073e1c9e09ae0041797b',
  );
});
