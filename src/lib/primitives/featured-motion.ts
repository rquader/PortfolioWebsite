/** A bounded, slightly weighted spring. Elapsed time is in seconds. */
export function advanceSpring(position: number, velocity: number, target: number, elapsed: number, limit: number) {
  const max = Math.max(0, limit);
  const destination = Math.min(max, Math.max(0, target));
  if (!max) return { position: 0, velocity: 0, settled: true };
  const dt = Math.min(1 / 30, Math.max(0, elapsed));
  const nextVelocity = velocity + ((destination - position) * 180 - velocity * 25) * dt;
  const nextPosition = Math.min(max, Math.max(0, position + nextVelocity * dt));
  const boundedVelocity = nextPosition === 0 || nextPosition === max ? 0 : nextVelocity;
  const settled = Math.abs(destination - nextPosition) < .4 && Math.abs(boundedVelocity) < 2;
  return settled
    ? { position: destination, velocity: 0, settled: true }
    : { position: nextPosition, velocity: boundedVelocity, settled: false };
}
