/**
 * The Argo in the graphic-novel style: Captain Argus's Greek galley turned spaceship, side-on and facing
 * right. A long white hull with a gold belly and a row of glowing portholes, a gold ram's head on the
 * prow, a curling stern post, a mast carrying a great solar sail (blue cells in a gold frame with the
 * sun-and-horns emblem), five oars whose blades are made of light, and blue engines at the stern.
 * About 760 long and 560 tall at scale 1, centred on its hull.
 */
import { add, at, dPoly, dSmooth, INK, lerp, mul, type P, type Pen, r1 } from './core';

const WHITE = '#eef1f8';
const GOLD = '#f0b840';
const GOLD_DARK = '#a8741c';
const CELL = '#3a78d0';
const LIGHT = '#8ff0ff';

export interface ArgoOpts {
  /** Tilt (degrees, + noses down). */
  rot?: number;
  /** Engines and oars of light lit (default yes). */
  lit?: boolean;
  /** Draw the sail (default yes). */
  sail?: boolean;
  flip?: boolean;
}

/** The Argo, centred on its hull at (x, y). */
export function argo(pen: Pen, x: number, y: number, s: number, o: ArgoOpts = {}): string {
  const lp = pen.local(!!o.flip, o.rot ?? 0);
  const lit = o.lit ?? true;
  let out = '';
  // Engine glow and exhaust trailing behind.
  if (lit) {
    out += lp.glow(-390, 4, 190, '#6fd0ff', 0.75, 70) + lp.glow(-372, 4, 60, '#ffffff', 0.9, 30);
    out += lp.brushes(
      [
        [
          [
            [-380, -6],
            [-560, -14],
          ],
          10,
        ],
        [
          [
            [-380, 14],
            [-600, 20],
          ],
          8,
        ],
        [
          [
            [-380, 4],
            [-660, 2],
          ],
          6,
        ],
      ],
      '#bff0ff',
      [0.05, 0.95],
      0.7,
    );
  }
  // Oars of light: gold shafts from the hull, each ending in a long blade of glowing light.
  let oars = '';
  for (let i = 0; i < 5; i++) {
    const ox = -170 + i * 86;
    const a: P = [ox, 30];
    const b: P = [ox - 70, 170];
    oars += lp.brush([a, lerp(a, b, 0.5), b], 14, INK, [0.05, 0.05]) + lp.brush([a, lerp(a, b, 0.5), b], 7, GOLD, [0.05, 0.05]);
    if (lit) {
      const tip = add(b, [-46, 92]);
      oars += lp.glow(lerp(b, tip, 0.5)[0], lerp(b, tip, 0.5)[1], 70, LIGHT, 0.6, 40);
      oars += lp.brush([b, lerp(b, tip, 0.5), tip], 26, LIGHT, [0.1, 0.8], 0.85) + lp.brush([b, lerp(b, tip, 0.5), tip], 9, '#ffffff', [0.1, 0.8], 0.9);
    }
  }
  out += oars;
  // The stern post, curling up and over like a wave.
  const stern = dSmooth(
    [
      [-300, -20],
      [-352, -110],
      [-344, -196],
      [-290, -226],
      [-250, -196],
      [-262, -160],
      [-292, -170],
      [-300, -130],
      [-270, -40],
    ],
    true,
  );
  out += lp.form(stern, GOLD, { sh: 22, hatch: 1, rim: 2, line: 3 });
  // Mast and sail.
  if (o.sail !== false) {
    out += lp.form('M-10 -470H10V-30H-10Z', GOLD_DARK, { sh: 8, line: 2.6 });
    let cells = '';
    for (let i = 1; i < 6; i++) cells += `M${-160 + i * 54} -440Q${-160 + i * 54 + 22} -300 ${-160 + i * 54} -150`;
    for (let j = 1; j < 4; j++) cells += `M-170 ${-440 + j * 72}Q0 ${-440 + j * 72 + 16} 180 ${-440 + j * 72}`;
    const sail = 'M-166 -446Q-122 -300 -166 -146H178Q222 -300 178 -446Z';
    const emblem =
      `<circle cx="10" cy="-296" r="38" fill="${GOLD}" stroke="${INK}" stroke-width="3"/>` +
      `<path d="M-8 -318q-30 -12 -24 16M28 -318q30 -12 24 16" fill="none" stroke="${GOLD_DARK}" stroke-width="9"/>` +
      lp.glow(10, -296, 70, '#fff2c0', 0.5);
    out += lp.form(sail, CELL, {
      sh: 120,
      hatch: 1,
      rim: 2.4,
      line: 3,
      paint: lp.lin([
        [0, '#7ac8ff'],
        [1, '#2a5ac8'],
      ]),
      inner: `<path d="${cells}" fill="none" stroke="#bfe6ff" stroke-width="2.4" opacity=".7"/>` + emblem + lp.brush([[-120, -420], [-90, -330], [-118, -200]], 10, '#ffffff', [0.3, 0.4], 0.35),
    });
    out += `<path d="${sail}" fill="none" stroke="${GOLD}" stroke-width="10"/><path d="${sail}" fill="none" stroke="${INK}" stroke-width="2"/>`;
    out += lp.form('M-190 -470H200V-450H-190Z', GOLD, { sh: 8, line: 2.4, rim: 1.4 }) + lp.form('M-190 -150H200V-132H-190Z', GOLD, { sh: 8, line: 2.4 });
  }
  // The hull: white above, a gold belly below, portholes and the cockpit canopy.
  const hull = 'M-330 -36Q0 -50 300 -40Q360 -34 384 0Q350 50 270 66Q0 84 -250 70Q-322 56 -340 10Z';
  const portholes = [-200, -130, -60, 10, 80, 150]
    .map((px) => `<circle cx="${px}" cy="-6" r="10" fill="${LIGHT}" stroke="${INK}" stroke-width="2.6"/><circle cx="${px - 3}" cy="-9" r="3" fill="#fff"/>`)
    .join('');
  const stripe = `<path d="M-330 -22Q0 -34 320 -24" fill="none" stroke="${GOLD}" stroke-width="7"/>`;
  out += lp.form(hull, WHITE, { sh: 34, hatch: 2, rim: 2.6, line: 3.2, axis: [1, 0], inner: stripe + portholes + lp.glow(-20, -6, 220, LIGHT, 0.25, 30) });
  out += lp.form('M-342 22Q0 40 384 4Q350 50 270 66Q0 84 -250 70Q-322 56 -342 22Z', GOLD, { sh: 22, hatch: 2, rim: 2.2, line: 3, axis: [1, 0] });
  out += lp.form('M150 -42Q196 -108 262 -42Z', '#5ad0f0', { sh: 12, line: 2.6, inner: lp.brush([[176, -62], [200, -86], [230, -72]], 6, '#ffffff', [0.3, 0.3], 0.85) });
  // The ram's head on the prow: gold, with curling horns and a glowing eye.
  const ram =
    lp.form('M-34 -10Q-40 -50 0 -54Q42 -52 46 -14Q70 -6 72 18Q60 36 30 30Q0 34 -26 22Z', GOLD, { sh: 18, hatch: 1, rim: 2, line: 2.8 }) +
    lp.brush(
      [
        [-6, -38],
        [-46, -54],
        [-60, -20],
        [-36, 4],
        [-18, -12],
      ],
      14,
      INK,
      [0.1, 0.3],
    ) +
    lp.brush(
      [
        [-6, -38],
        [-46, -54],
        [-60, -20],
        [-36, 4],
        [-18, -12],
      ],
      8,
      GOLD_DARK,
      [0.1, 0.3],
    ) +
    lp.glow(26, -16, 16, LIGHT, 0.9) +
    `<circle cx="26" cy="-16" r="5.5" fill="${LIGHT}" stroke="${INK}" stroke-width="1.8"/>`;
  out += lp.brush([[330, -30], [360, -80], [380, -110]], 30, INK, [0.05, 0.05]) + lp.brush([[330, -30], [360, -80], [380, -110]], 22, GOLD, [0.05, 0.05]);
  out += at(400, -136, 1, ram);
  return at(x, y, s, out, o.flip, o.rot ?? 0);
}

/** A soft trail of light behind the Argo, from its stern at (x, y) back along `deg` (as `dir` measures it). */
export function argoTrail(pen: Pen, x: number, y: number, len: number, deg: number, color = '#bff0ff'): string {
  const d: P = [Math.sin((deg * Math.PI) / 180), Math.cos((deg * Math.PI) / 180)];
  const end = add([x, y], mul(d, len));
  return `<path d="${dPoly([add([x, y], [r1(-d[1] * 22), r1(d[0] * 22)]), end, add([x, y], [r1(d[1] * 22), r1(-d[0] * 22)])])}" fill="${color}" opacity=".3"/>` + pen.glow(x, y, 60, color, 0.7);
}
