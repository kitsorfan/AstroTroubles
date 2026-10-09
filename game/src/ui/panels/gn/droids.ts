/**
 * The droids in the graphic-novel style: LUX (Jason's little white sphere with one big cyan eye, side
 * pods and a red-tipped antenna) and IRIS (Atalanta's pearl teardrop with a rainbow visor, lilac fins and
 * a golden halo). Both are centred on (x, y); LUX's body is 40 across at scale 1, IRIS's 90 tall.
 */
import { at, INK, type P, type Pen, r1 } from './core';
import { spark } from './fx';

/** The colours of IRIS's visor, left to right. */
export const RAINBOW = ['#ff5e6a', '#ffb347', '#ffe066', '#7dff9a', '#5ec8ff', '#c37bff'];

export type LuxMood = 'normal' | 'happy' | 'scared' | 'glow';

/** A filled circle path (for `Pen.form`). */
const circ = (x: number, y: number, r: number) => `M${r1(x - r)} ${r1(y)}A${r1(r)} ${r1(r)} 0 1 0 ${r1(x + r)} ${r1(y)}A${r1(r)} ${r1(r)} 0 1 0 ${r1(x - r)} ${r1(y)}Z`;

/** LUX, centred at (x, y). `look` turns his eye a little (x, y in body units). */
export function lux(pen: Pen, x: number, y: number, s: number, mood: LuxMood = 'normal', o: { flip?: boolean; look?: P; rot?: number; eye?: string } = {}): string {
  const lp = pen.local(!!o.flip, o.rot ?? 0);
  const eyeC = o.eye ?? '#7fe6ff';
  const [lx, ly] = o.look ?? [6, -2];
  let out = lp.glow(0, 52, 34, eyeC, 0.5, 14);
  // The thruster glow underneath, and the antenna.
  out += lp.brush(
    [
      [10, -36],
      [16, -56],
      [20, -70],
    ],
    5,
    INK,
    [0.05, 0.05],
  );
  out += lp.glow(21, -74, 18, '#ff4a5a', 0.7) + lp.form(circ(21, -74, 7), '#ff4a5a', { sh: 3, line: 2 });
  // Side pods.
  out += lp.form(circ(-43, 6, 12), '#9aa6ba', { sh: 6, line: 2.2, rim: 1.4 }) + lp.form(circ(43, 6, 12), '#9aa6ba', { sh: 6, line: 2.2, rim: 1.4 });
  // The body: a white sphere, its equator band, a gloss highlight.
  const band = `<path d="M-38 14Q0 32 38 14" fill="none" stroke="#7b8699" stroke-width="4"/>`;
  out += lp.form(circ(0, 0, 40), '#f2f5fa', { sh: 15, hatch: 1, rim: 1.8, line: 2.6, inner: band });
  out += `<ellipse cx="-18" cy="-22" rx="9" ry="5" fill="#fff" transform="rotate(-35 -18 -22)"/>`;
  // The eye: a dark lens ring with a glowing iris.
  out += lp.form(circ(6, -4, 21), '#0c131e', { line: 2.2 });
  if (mood === 'happy') {
    out += lp.glow(6 + lx * 0.3, -4, 22, eyeC, 0.7) + lp.brush([[-6, 2], [6, -12], [18, 2]], 6, eyeC, [0.15, 0.15]);
  } else {
    const ir = mood === 'scared' ? 8 : mood === 'glow' ? 16 : 13;
    const cx = 6 + lx * 0.6;
    const cy = -4 + ly * 0.6;
    out += lp.glow(cx, cy, ir * 2.2, eyeC, 0.8) + `<circle cx="${r1(cx)}" cy="${r1(cy)}" r="${ir}" fill="${eyeC}"/><circle cx="${r1(cx + 1)}" cy="${r1(cy + 1)}" r="${r1(ir * 0.42)}" fill="#062536"/><circle cx="${r1(cx - ir * 0.35)}" cy="${r1(cy - ir * 0.4)}" r="${r1(ir * 0.28)}" fill="#fff"/>`;
  }
  if (mood === 'scared') {
    out += lp.brushes(
      [
        [
          [
            [-56, -34],
            [-60, -44],
          ],
          3,
        ],
        [
          [
            [-64, -20],
            [-70, -28],
          ],
          3,
        ],
        [
          [
            [58, -42],
            [64, -50],
          ],
          3,
        ],
      ],
      '#ffffff',
      [0.3, 0.3],
      0.9,
    );
    out += lp.form('M34 -44Q42 -30 34 -24Q26 -30 34 -44Z', '#bff4ff', { line: 1.8 });
  }
  return at(x, y, s, out, o.flip, o.rot ?? 0);
}

export type IrisMood = 'normal' | 'happy' | 'asleep' | 'sing';

/** IRIS, centred at (x, y): a pearl teardrop with a rainbow visor, lilac fins and a golden halo. */
export function iris(pen: Pen, x: number, y: number, s: number, mood: IrisMood = 'normal', o: { flip?: boolean; rot?: number } = {}): string {
  const lp = pen.local(!!o.flip, o.rot ?? 0);
  const pearl = '#f1f0fb';
  const lilac = '#b9a8e8';
  const gold = '#ffd166';
  let out = lp.glow(0, 96, 30, '#c9b8ff', 0.5, 10);
  const fin = (k: number) => `M${k * 34} 4Q${k * 72} -16 ${k * 88} 10Q${k * 68} 24 ${k * 36} 22Z`;
  out += lp.form(fin(-1), lilac, { sh: 8, line: 2.2, rim: 1.4 }) + lp.form(fin(1), lilac, { sh: 8, line: 2.2, rim: 1.4 });
  // The halo on its stalk.
  out += lp.brush(
    [
      [0, -44],
      [0, -62],
    ],
    5,
    INK,
    [0.05, 0.05],
  );
  if (mood === 'asleep') out += `<ellipse cx="0" cy="-74" rx="24" ry="7" fill="none" stroke="#8a7cc0" stroke-width="5" opacity=".7"/>`;
  else out += lp.glow(0, -74, 40, gold, 0.6, 18) + `<ellipse cx="0" cy="-74" rx="25" ry="7.5" fill="none" stroke="${INK}" stroke-width="8"/><ellipse cx="0" cy="-74" rx="25" ry="7.5" fill="none" stroke="${gold}" stroke-width="4.5"/>`;
  const band = `<path d="M-40 26Q0 42 40 26" fill="none" stroke="${lilac}" stroke-width="5"/>`;
  out += lp.form('M0 -44C30 -44 44 -22 44 4C44 32 26 52 0 82C-26 52 -44 32 -44 4C-44 -22 -30 -44 0 -44Z', pearl, { sh: 16, hatch: 1, rim: 1.8, line: 2.6, inner: band });
  out += `<ellipse cx="-20" cy="-28" rx="9" ry="5" fill="#fff" transform="rotate(-30 -20 -28)"/>`;
  // The visor and its eye.
  out += lp.form('M-34 -6Q-34 -20 -20 -20H20Q34 -20 34 -6Q34 8 20 8H-20Q-34 8 -34 -6Z', '#141428', { line: 2.2 });
  if (mood === 'asleep') out += lp.brush([[-18, -6], [0, 0], [18, -6]], 4, '#6a6488', [0.2, 0.2]);
  else if (mood === 'happy' || mood === 'sing') {
    out += lp.glow(0, -6, 30, RAINBOW[4], 0.5) + lp.brush([[-20, -1], [0, -16], [20, -1]], 6, RAINBOW[4], [0.15, 0.15]) + lp.brush([[-12, -6], [0, -13], [12, -6]], 3, RAINBOW[1], [0.2, 0.2]);
  } else {
    out += lp.glow(0, -6, 34, '#ffffff', 0.35);
    out += RAINBOW.map((c, i) => `<rect x="${-24 + i * 8}" y="-12" width="8" height="12" fill="${c}"/>`).join('');
    out += `<rect x="-24" y="-12" width="48" height="12" rx="6" fill="none" stroke="${INK}" stroke-width="2"/><circle cx="-14" cy="-9" r="2.6" fill="#fff"/>`;
  }
  if (mood === 'sing') out += spark(lp, 60, -50, 10, RAINBOW[2]) + spark(lp, 78, -20, 7, RAINBOW[5]) + spark(lp, 52, 10, 6, RAINBOW[3]);
  return at(x, y, s, out, o.flip, o.rot ?? 0);
}
