/**
 * LUX's terminal puzzles. `memory` is the Simon-says light pattern; the others need thinking rather
 * than remembering:
 * - `pattern`: "what comes next?" Spot the rule in a row of shapes and pick the missing one.
 * - `lights`: a power grid. Tapping a tile flips it and its neighbours; light up every tile.
 * - `grid`: a colour square. Fill the gaps so no row or column has the same colour twice.
 * A terminal's `length` sets how hard its puzzle is, whatever the kind.
 */
export type PuzzleKind = 'memory' | 'pattern' | 'lights' | 'grid';

type Rng = () => number;

const pickIndex = (rng: Rng, n: number) => Math.min(n - 1, Math.floor(rng() * n));

function shuffle<T>(rng: Rng, list: T[]): T[] {
  for (let i = list.length - 1; i > 0; i--) {
    const j = pickIndex(rng, i + 1);
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
}

/* ---------------- What comes next? ---------------- */

export type Shape = 'circle' | 'square' | 'triangle' | 'star' | 'arrow' | 'dots';

/** One picture in a pattern: a coloured shape, an arrow turned `rot` quarter turns, or `n` dots. */
export interface Token {
  color: number;
  shape: Shape;
  rot?: number;
  n?: number;
}

export const tokenKey = (t: Token) => `${t.color}|${t.shape}|${t.rot ?? 0}|${t.n ?? 0}`;

export interface PatternRound {
  shown: Token[];
  answer: Token;
  /** Four options, the answer among them. */
  choices: Token[];
}

const SHAPES: Shape[] = ['circle', 'square', 'triangle', 'star'];
/** The colour square gives colour `k` shape `k` too, so it can be solved without telling colours apart. */
export const PUZZLE_SHAPES: readonly Shape[] = SHAPES;
/** The four LUX colours (blue, gold, pink, green), the same as the memory pads. */
export const PUZZLE_COLORS = ['#3fb6ff', '#ffd166', '#ff6fcf', '#7dff9a'];

/**
 * One "what comes next?" round. Tier 0 is a simple repeat, a turning arrow or counting up; tier 1 an
 * uneven repeat or counting in twos; tier 2 has two rules at once (colour and shape change on
 * different beats).
 */
export function patternRound(tier: number, rng: Rng = Math.random): PatternRound {
  const colors = shuffle(rng, [0, 1, 2, 3]);
  const shapes = shuffle(rng, [...SHAPES]);
  const tok = (k: number): Token => ({ color: colors[k], shape: shapes[k] });
  const repeat = (unit: Token[], len: number) => Array.from({ length: len }, (_, i) => unit[i % unit.length]);
  const arrows = (len: number, rotAt: (i: number) => number, colorAt: (i: number) => number) => {
    const start = pickIndex(rng, 4);
    return Array.from({ length: len }, (_, i): Token => ({ color: colors[colorAt(i)], shape: 'arrow', rot: (start + rotAt(i)) % 4 }));
  };
  const dots = (len: number, start: number, step: number, colorAt: (i: number) => number) =>
    Array.from({ length: len }, (_, i): Token => ({ color: colors[colorAt(i)], shape: 'dots', n: start + i * step }));
  const rules: (() => Token[])[][] = [
    [
      () => repeat([tok(0), tok(1)], 6),
      () => repeat([tok(0), tok(1), tok(2)], 6),
      () => arrows(6, (i) => i, () => 0),
      () => dots(5, 1, 1, () => 0),
    ],
    [
      () => repeat([tok(0), tok(0), tok(1)], 6),
      () => repeat([tok(0), tok(1), tok(1), tok(2)], 8),
      () => arrows(7, (i) => Math.floor(i / 2), () => 0),
      () => dots(4, 1 + pickIndex(rng, 2), 2, () => 0),
    ],
    [
      () => Array.from({ length: 7 }, (_, i): Token => ({ color: colors[i % 2], shape: shapes[i % 3] })),
      () => dots(6, 1, 1, (i) => i % 2),
      () => arrows(7, (i) => i, (i) => i % 3),
    ],
  ];
  const tierRules = rules[Math.max(0, Math.min(rules.length - 1, tier))];
  const seq = tierRules[pickIndex(rng, tierRules.length)]();
  const answer = seq[seq.length - 1];
  const shown = seq.slice(0, -1);
  return { shown, answer, choices: patternChoices(answer, shown, rng) };
}

/** The answer plus three tempting wrong answers: pictures from the row, and near misses of the answer. */
function patternChoices(answer: Token, shown: Token[], rng: Rng): Token[] {
  const near: Token[] = [];
  for (let c = 0; c < 4; c++) if (c !== answer.color) near.push({ ...answer, color: c });
  if (answer.shape === 'arrow') {
    for (let r = 1; r < 4; r++) near.push({ ...answer, rot: ((answer.rot ?? 0) + r) % 4 });
  } else if (answer.shape === 'dots') {
    const n = answer.n ?? 1;
    for (const d of [-2, -1, 1, 2]) if (n + d >= 1) near.push({ ...answer, n: n + d });
  } else {
    for (const s of SHAPES) if (s !== answer.shape) near.push({ ...answer, shape: s });
  }
  const seen = new Set([tokenKey(answer)]);
  const wrong: Token[] = [];
  for (const t of [...shuffle(rng, [...shown]), ...shuffle(rng, near)]) {
    if (wrong.length >= 3) break;
    const k = tokenKey(t);
    if (seen.has(k)) continue;
    seen.add(k);
    wrong.push(t);
  }
  return shuffle(rng, [answer, ...wrong]);
}

/** How many rounds a pattern terminal has, and how hard each one is. */
export function patternPlan(length: number): number[] {
  const rounds = length <= 4 ? 3 : length <= 6 ? 4 : 5;
  const bonus = length >= 6 ? 1 : 0;
  return Array.from({ length: rounds }, (_, r) => Math.min(2, Math.floor((r / rounds) * 3) + bonus));
}

/* ---------------- Power grid (lights) ---------------- */

/** Flips tile `i` and the tiles directly above, below, left and right of it. */
export function toggleLights(on: boolean[], size: number, i: number): boolean[] {
  const out = [...on];
  const r = Math.floor(i / size);
  const c = i % size;
  for (const [dr, dc] of [
    [0, 0],
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ]) {
    const rr = r + dr;
    const cc = c + dc;
    if (rr >= 0 && rr < size && cc >= 0 && cc < size) out[rr * size + cc] = !out[rr * size + cc];
  }
  return out;
}

/** A scrambled grid: every tile lit, then `taps` different tiles tapped, so it can always be solved in `taps` moves. */
export function lightsPuzzle(size: number, taps: number, rng: Rng = Math.random): boolean[] {
  for (;;) {
    let on = Array<boolean>(size * size).fill(true);
    for (const i of shuffle(rng, Array.from({ length: size * size }, (_, k) => k)).slice(0, taps)) on = toggleLights(on, size, i);
    if (on.some((x) => !x)) return on;
  }
}

export function lightsPlan(length: number): { size: number; taps: number } {
  return length >= 6 ? { size: 4, taps: Math.min(5, length - 2) } : { size: 3, taps: Math.max(2, Math.min(5, length - 1)) };
}

/* ---------------- Colour square (grid) ---------------- */

export interface GridPuzzle {
  size: number;
  /** A colour index per cell, row by row; null for a gap. */
  cells: (number | null)[];
  /** Cells that start filled in and can't be changed. */
  given: boolean[];
}

/** A shuffled Latin square with `holes` gaps punched in it (so at least one answer always exists). */
export function gridPuzzle(size: number, holes: number, rng: Rng = Math.random): GridPuzzle {
  const rows = shuffle(rng, Array.from({ length: size }, (_, k) => k));
  const cols = shuffle(rng, Array.from({ length: size }, (_, k) => k));
  const sym = shuffle(rng, Array.from({ length: size }, (_, k) => k));
  const cells: (number | null)[] = [];
  for (let r = 0; r < size; r++) for (let c = 0; c < size; c++) cells.push(sym[(rows[r] + cols[c]) % size]);
  const given = cells.map(() => true);
  for (const i of shuffle(rng, cells.map((_, k) => k)).slice(0, Math.min(holes, size * size - 1))) {
    cells[i] = null;
    given[i] = false;
  }
  return { size, cells, given };
}

/** Cells that share a colour with another cell in the same row or column. */
export function gridConflicts(cells: (number | null)[], size: number): Set<number> {
  const bad = new Set<number>();
  for (let a = 0; a < cells.length; a++) {
    if (cells[a] === null) continue;
    for (let b = a + 1; b < cells.length; b++) {
      if (cells[b] !== cells[a]) continue;
      const sameRow = Math.floor(a / size) === Math.floor(b / size);
      const sameCol = a % size === b % size;
      if (sameRow || sameCol) (bad.add(a), bad.add(b));
    }
  }
  return bad;
}

export function gridSolved(cells: (number | null)[], size: number): boolean {
  return cells.every((c) => c !== null) && gridConflicts(cells, size).size === 0;
}

export function gridPlan(length: number): { size: number; holes: number } {
  return length >= 6 ? { size: 4, holes: Math.min(10, length + 2) } : { size: 3, holes: Math.max(3, Math.min(6, length)) };
}
