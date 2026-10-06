import {
  gridConflicts,
  gridPlan,
  gridPuzzle,
  gridSolved,
  lightsPlan,
  lightsPuzzle,
  patternPlan,
  patternRound,
  toggleLights,
  tokenKey,
} from '../src/game/puzzles';
import { LEVELS, LEVEL_ORDER } from '../src/levels';

/** A small seeded random generator, so every run checks the same puzzles. */
function seeded(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

describe('pattern puzzle', () => {
  it('always offers four different choices, exactly one of them right', () => {
    for (let tier = 0; tier <= 2; tier++) {
      for (let seed = 1; seed <= 200; seed++) {
        const r = patternRound(tier, seeded(seed * 7 + tier));
        const keys = r.choices.map(tokenKey);
        expect(new Set(keys).size).toBe(4);
        expect(keys.filter((k) => k === tokenKey(r.answer))).toHaveLength(1);
        expect(r.shown.length).toBeGreaterThanOrEqual(3);
      }
    }
  });

  it('gets longer and harder on harder terminals', () => {
    expect(patternPlan(4)).toEqual([0, 1, 2]);
    expect(patternPlan(7).length).toBeGreaterThan(patternPlan(4).length);
    expect(Math.min(...patternPlan(7))).toBeGreaterThan(0);
  });
});

describe('lights puzzle', () => {
  /** Fewest taps that light every tile (brute force over every set of tiles). */
  function fewestTaps(on: boolean[], size: number): number {
    let best = Infinity;
    for (let mask = 0; mask < 1 << (size * size); mask++) {
      let taps = 0;
      let cur = on;
      for (let i = 0; i < size * size; i++) {
        if (!(mask & (1 << i))) continue;
        cur = toggleLights(cur, size, i);
        taps += 1;
      }
      if (taps < best && cur.every(Boolean)) best = taps;
    }
    return best;
  }

  it('flips a tile and its neighbours only', () => {
    const on = toggleLights(Array<boolean>(9).fill(true), 3, 0);
    expect(on).toEqual([false, false, true, false, true, true, true, true, true]);
  });

  it('starts unsolved and can always be solved in the promised number of taps', () => {
    for (const length of [3, 4, 5]) {
      const { size, taps } = lightsPlan(length);
      for (let seed = 1; seed <= 30; seed++) {
        const on = lightsPuzzle(size, taps, seeded(seed + length * 100));
        expect(on.every(Boolean)).toBe(false);
        expect(fewestTaps(on, size)).toBeLessThanOrEqual(taps);
      }
    }
  });
});

describe('colour square puzzle', () => {
  function solve(cells: (number | null)[], size: number): boolean {
    const i = cells.indexOf(null);
    if (i < 0) return gridSolved(cells, size);
    for (let v = 0; v < size; v++) {
      cells[i] = v;
      if (gridConflicts(cells, size).size === 0 && solve(cells, size)) return true;
    }
    cells[i] = null;
    return false;
  }

  it('spots repeated colours in a row or column', () => {
    // Row 0 repeats colour 0.
    expect([...gridConflicts([0, 0, 1, 1, 2, 0, 2, 1, null], 3)].sort()).toEqual([0, 1]);
    // Colour 2 twice in the bottom row and twice in the right column.
    expect([...gridConflicts([0, 1, 2, 1, 2, 0, 2, 0, 2], 3)].sort()).toEqual([2, 6, 8]);
  });

  it('has the right number of gaps, clean givens, and a solution', () => {
    for (const length of [5, 6, 7]) {
      const { size, holes } = gridPlan(length);
      for (let seed = 1; seed <= 40; seed++) {
        const g = gridPuzzle(size, holes, seeded(seed + length * 1000));
        expect(g.cells.filter((c) => c === null)).toHaveLength(holes);
        expect(g.given.filter((x) => !x)).toHaveLength(holes);
        expect(gridConflicts(g.cells, size).size).toBe(0);
        expect(solve([...g.cells], size)).toBe(true);
      }
    }
  });
});

describe('puzzles in the decks', () => {
  it('uses more than just the memory lights', () => {
    const kinds = new Set<string>();
    for (const id of LEVEL_ORDER) {
      for (const s of Object.values(LEVELS[id].legend)) if (s.type === 'terminal') kinds.add(s.puzzle ?? 'memory');
    }
    expect([...kinds].sort()).toEqual(['grid', 'lights', 'memory', 'pattern']);
  });
});
