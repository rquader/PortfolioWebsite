import test from 'node:test';
import assert from 'node:assert/strict';
import {
  anchorScrollDuration,
  easeInOutCubic,
  isAnchorScrollInterruption,
  startScrollAnimation,
} from '../src/lib/primitives/anchor-navigation.ts';

test('anchor duration stays deliberate without growing with the whole page', () => {
  assert.equal(anchorScrollDuration(0), 650);
  assert.ok(anchorScrollDuration(400) > 650);
  assert.ok(anchorScrollDuration(400) < anchorScrollDuration(1600));
  assert.equal(anchorScrollDuration(100000), 1100);
});

test('anchor easing keeps both ends gentle and reaches the exact target', () => {
  assert.equal(easeInOutCubic(0), 0);
  assert.ok(easeInOutCubic(0.25) < 0.25);
  assert.ok(easeInOutCubic(0.75) > 0.75);
  assert.equal(easeInOutCubic(1), 1);

  let clock = 0;
  let nextHandle = 0;
  const frames = new Map();
  const positions = [];
  let completed = null;
  startScrollAnimation({
    from: 100,
    to: 900,
    duration: 800,
    now: () => clock,
    requestFrame: (callback) => {
      const handle = ++nextHandle;
      frames.set(handle, callback);
      return handle;
    },
    cancelFrame: (handle) => frames.delete(handle),
    scrollTo: (top) => positions.push(top),
    onStop: (didComplete) => { completed = didComplete; },
  });

  for (clock of [0, 400, 800]) {
    const [handle, callback] = frames.entries().next().value;
    frames.delete(handle);
    callback(clock);
  }
  assert.equal(positions.at(-1), 900);
  assert.equal(completed, true);
  assert.equal(frames.size, 0);
});

test('manual cancellation prevents a queued animation from moving again', () => {
  let nextHandle = 0;
  const frames = new Map();
  const positions = [];
  let completed = null;
  const cancel = startScrollAnimation({
    from: 0,
    to: 1000,
    duration: 1000,
    now: () => 0,
    requestFrame: (callback) => {
      const handle = ++nextHandle;
      frames.set(handle, callback);
      return handle;
    },
    cancelFrame: (handle) => frames.delete(handle),
    scrollTo: (top) => positions.push(top),
    onStop: (didComplete) => { completed = didComplete; },
  });

  const [firstHandle, firstFrame] = frames.entries().next().value;
  frames.delete(firstHandle);
  firstFrame(300);
  const positionAtCancel = positions.at(-1);
  cancel();

  assert.equal(completed, false);
  assert.equal(frames.size, 0);
  assert.equal(positions.at(-1), positionAtCancel);
  assert.ok(positionAtCancel > 0 && positionAtCancel < 1000);
});

test('navigation and escape keys interrupt without treating ordinary typing as scroll input', () => {
  assert.equal(isAnchorScrollInterruption({ type: 'keydown', key: 'Tab' }), true);
  assert.equal(isAnchorScrollInterruption({ type: 'keydown', key: 'Escape' }), true);
  assert.equal(isAnchorScrollInterruption({ type: 'keydown', key: 'PageDown' }), true);
  assert.equal(isAnchorScrollInterruption({ type: 'keydown', key: 'a' }), false);
  assert.equal(isAnchorScrollInterruption({ type: 'touchstart' }), true);
});
