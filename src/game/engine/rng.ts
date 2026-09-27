/** mulberry32 step: returns [value in 0..1, nextState]. */
export function nextRandom(state: number): [number, number] {
  const a = (state + 0x6d2b79f5) | 0;
  let t = a;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return [((t ^ (t >>> 14)) >>> 0) / 4294967296, a];
}

export function randomSeed(): number {
  return (Math.random() * 0xffffffff) >>> 0;
}
