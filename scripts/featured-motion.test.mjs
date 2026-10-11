import test from 'node:test';
import assert from 'node:assert/strict';
import { advanceSpring } from '../src/lib/primitives/featured-motion.ts';

test('a released scrubber settles exactly and stops requesting animation', () => {
  let state = { position: 0, velocity: 0, settled: false };
  for (let frame = 0; frame < 180 && !state.settled; frame++) {
    state = advanceSpring(state.position, state.velocity, 500, 1 / 60, 500);
    assert.ok(state.position >= 0 && state.position <= 500);
  }
  assert.equal(state.position, 500);
  assert.equal(state.velocity, 0);
  assert.equal(state.settled, true);
});

test('rapidly reversing the handle stays inside the scroll bounds', () => {
  let state = { position: 10, velocity: -1000 };
  for (let frame = 0; frame < 120; frame++) {
    state = advanceSpring(state.position, state.velocity, frame < 30 ? 0 : 300, 1 / 60, 300);
    assert.ok(state.position >= 0 && state.position <= 300);
  }
  assert.equal(state.position, 300);
});

test('a stalled frame cannot launch the track beyond its bounds', () => {
  const state = advanceSpring(100, 400, 250, 5, 250);
  assert.ok(Number.isFinite(state.position));
  assert.ok(state.position >= 0 && state.position <= 250);
});

test('resizing to no overflow finishes at zero', () => {
  assert.deepEqual(advanceSpring(250, 200, 500, 1 / 60, 0), {position: 0, velocity: 0, settled: true});
});
