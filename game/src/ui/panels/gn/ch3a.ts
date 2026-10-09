/**
 * Graphic-novel pieces for the opening of chapter 3 and the panels around it: Dr. Hypatia, old
 * Phineus the stargazer, Celestia (fading, or a sprout), the Gardeners' ruin stone, the Golden Fleece,
 * Aeëtes's gold salvage ships and drones, and a film-hologram wrapper. Built from the kit's `figure`
 * and marks like the cast in cast.ts: feet (or bases) at (x, y), facing right unless `flip`.
 */
import { add, at, dir, dPoly, dSmooth, INK, lerp, mix, mul, type P, type Pen, perp, r1, rng, sub, unit } from './core';
import { ADULT, bandD, type Build, faceFrame, type HeadOpts, type Mood, type Pose, rig, type Rig, U } from './body';
import { type CastOpts, coatSkirt, figure, headPt, type Outfit, POSES } from './cast';
import { spark } from './fx';

const poseOf = (p: CastOpts['pose'], fallback: keyof typeof POSES): Pose => (typeof p === 'string' ? POSES[p] : (p ?? POSES[fallback]));

/** A filled circle as path data (for `Pen.form`). */
export const circD = (x: number, y: number, r: number) => `M${r1(x - r)} ${r1(y)}A${r1(r)} ${r1(r)} 0 1 0 ${r1(x + r)} ${r1(y)}A${r1(r)} ${r1(r)} 0 1 0 ${r1(x - r)} ${r1(y)}Z`;

/** An ellipse as path data. */
export const ellD = (x: number, y: number, rx: number, ry: number) => `M${r1(x - rx)} ${r1(y)}A${r1(rx)} ${r1(ry)} 0 1 0 ${r1(x + rx)} ${r1(y)}A${r1(rx)} ${r1(ry)} 0 1 0 ${r1(x - rx)} ${r1(y)}Z`;

/* ---------------- Dr. Hypatia ---------------- */

/** A grown woman: a little slighter than the ADULT build. */
export const WOMAN: Build = {
  ...ADULT,
  spine: 1.9,
  shoulder: 0.8,
  hips: 0.42,
  upperArm: 1.38,
  foreArm: 1.2,
  hand: 0.68,
  thigh: 1.66,
  shin: 1.58,
  foot: 0.86,
  arm: [0.4, 0.31, 0.24],
  leg: [0.66, 0.4, 0.26],
  chest: 1.5,
  waist: 1.12,
  hipW: 1.5,
  neckW: 0.44,
};

const HY = { skin: '#c8906c', hair: '#1c1410', coat: '#eef1f6', shirt: '#3a6ab0', pants: '#2a3248', shoes: '#3a2a22', gold: '#ffd166' };

/** Round glasses over both eyes at a head turn (head coordinates). */
export function glasses(pen: Pen, turn: number, frame = INK, r = 12): string {
  const F = faceFrame(turn);
  const rf = r * (1 - 0.45 * F.k);
  const lens = (c: P, rx: number) => `<ellipse cx="${r1(c[0])}" cy="${r1(c[1])}" rx="${r1(rx)}" ry="${r1(r)}" fill="#dff4ff" fill-opacity=".22" stroke="${frame}" stroke-width="3"/>`;
  const glint = (c: P, rx: number) => pen.brush([[c[0] - rx * 0.5, c[1] - r * 0.3], [c[0] - rx * 0.1, c[1] - r * 0.65]], 2.6, '#ffffff', [0.3, 0.3], 0.85);
  const n = F.eyeN;
  const f = F.eyeF;
  return (
    lens(n, r) +
    lens(f, rf) +
    glint(n, r) +
    pen.brush([[n[0] + r, n[1] - 2], [(n[0] + f[0]) / 2, n[1] - 5], [f[0] - rf, f[1] - 2]], 2.6, frame, [0.1, 0.1]) +
    pen.brush([[n[0] - r, n[1] - 2], [F.ear[0] + 2, F.ear[1] - 8]], 2.6, frame, [0.1, 0.1])
  );
}

/** Hypatia's dark hair swept up into a bun with a gold pin, and her glasses (head coordinates). */
function hypatiaHead(pen: Pen, turn: number): { front: string; back: string } {
  const hair = dSmooth([
    [-40, 8],
    [-46, -18],
    [-38, -42],
    [-14, -56],
    [14, -55],
    [36, -44],
    [44, -26],
    [42, -14],
    [30, -30],
    [12, -34],
    [-6, -30],
    [-22, -20],
    [-30, -4],
  ]);
  const strands: [P[], number][] = [
    [
      [
        [-34, -30],
        [-12, -46],
        [18, -48],
      ],
      2.2,
    ],
    [
      [
        [-36, -10],
        [-32, -32],
        [-14, -44],
      ],
      2,
    ],
    [
      [
        [10, -42],
        [28, -36],
        [38, -24],
      ],
      1.8,
    ],
  ];
  const front =
    pen.form(hair, HY.hair, { sh: 16, hatch: 2, rim: 2.4, line: 2.4, shade: '#0a0606', inner: pen.brushes(strands, '#4a3a34', [0.2, 0.6], 0.8) }) +
    // A loose lock in front of the near ear.
    pen.brush(
      [
        [-30, -8],
        [-34, 12],
        [-28, 30],
      ],
      5,
      HY.hair,
      [0.1, 0.6],
    ) +
    glasses(pen, turn);
  const back =
    pen.form(circD(-30, -52, 24), HY.hair, { sh: 10, hatch: 2, rim: 2.2, line: 2.4, shade: '#0a0606', inner: pen.brush([[-46, -56], [-30, -66], [-14, -58]], 2, '#4a3a34', [0.2, 0.4], 0.8) }) +
    pen.brush(
      [
        [-58, -34],
        [-30, -54],
        [-4, -78],
      ],
      6,
      INK,
      [0.05, 0.05],
    ) +
    pen.brush(
      [
        [-58, -34],
        [-30, -54],
        [-4, -78],
      ],
      3,
      HY.gold,
      [0.05, 0.05],
    ) +
    pen.glow(-4, -78, 8, '#fff2c0', 0.8);
  return { front, back };
}

export interface HypatiaOpts extends CastOpts {
  /** A glowing datapad in her near hand. */
  pad?: boolean;
}

/** Dr. Hypatia: dark hair in a bun with a gold pin, round glasses, a white lab coat over a blue top. */
export function hypatia(pen: Pen, x: number, y: number, s: number, o: HypatiaOpts = {}): string {
  const lp = pen.local(!!o.flip);
  const pose = poseOf(o.pose, 'stand');
  const turn = pose.turn ?? 0.4;
  const h = hypatiaHead(lp, turn);
  // A soft shadow tone over the jaw, so the hatching there reads as shade, not stubble.
  const softJaw = `<path d="M-56 -16L-14 -12Q-8 18 4 34L10 54L-20 62Q-54 46 -56 -16Z" fill="${lp.dark(HY.skin)}"/>`;
  const head: HeadOpts = { skin: HY.skin, mood: o.mood ?? 'smile', eye: '#3a2418', brow: HY.hair, jaw: 0.88, chin: 0.98, nose: 0.95, soft: true, age: 0.15, look: o.look, front: h.front, back: h.back, skinMarks: softJaw };
  const outfit: Outfit = { build: WOMAN, skin: HY.skin, top: HY.coat, pants: HY.pants, boots: HY.shoes, bootTop: 0.22, rim: o.rim };
  const { svg } = figure(lp, pose, outfit, head, {
    torso: (r) => {
      // The blue top in the open coat, the lapels, a pocket with pens and her ID badge, and the coat's skirt.
      let t = lp.form(dPoly([r.tf(-0.25, -0.02), r.tf(0.62, -0.02), r.tf(0.42, 0.66), r.tf(0.02, 0.66)]), HY.shirt, { sh: 10, line: 2.2, rim: 1.4 });
      t += coatSkirt(lp, r, HY.coat, 0.92, { rim: o.rim, open: true });
      t += lp.form(dPoly([r.tf(-0.3, -0.02), r.tf(-0.02, 0.36), r.tf(-0.1, 0.5), r.tf(-0.36, 0.14)]), HY.coat, { sh: 6, line: 2.2 });
      t += lp.form(dPoly([r.tf(0.66, -0.02), r.tf(0.44, 0.36), r.tf(0.52, 0.5), r.tf(0.74, 0.14)]), HY.coat, { sh: 6, line: 2.2 });
      t += lp.brushes(
        [
          [[r.tf(-0.8, 0.3), r.tf(-0.6, 0.5), r.tf(-0.5, 0.8)], 2.2],
          [[r.tf(0.78, 0.35), r.tf(0.6, 0.6), r.tf(0.56, 0.85)], 2],
        ],
        INK,
        [0.3, 0.5],
        0.6,
      );
      const pk = r.tf(-0.62, 0.32);
      t += lp.brushes([[[pk, add(pk, [2, -16])], 4]], '#3a6ab0', [0.05, 0.05]) + lp.brushes([[[add(pk, [8, 0]), add(pk, [9, -14])], 4]], '#d0402a', [0.05, 0.05]);
      t += lp.form(dPoly([add(pk, [-12, 0]), add(pk, [16, 0]), add(pk, [15, 16]), add(pk, [-11, 16])]), HY.coat, { sh: 4, line: 1.8 });
      const b = r.tf(0.66, 0.36);
      t += lp.form(dPoly([add(b, [-8, -10]), add(b, [8, -10]), add(b, [8, 10]), add(b, [-8, 10])]), '#7fe6ff', { line: 1.6, inner: `<path d="M${r1(b[0] - 5)} ${r1(b[1] + 4)}h10" stroke="${INK}" stroke-width="1.6"/>` });
      return t;
    },
    front: (r) => {
      if (!o.pad) return '';
      // The datapad, held in the near hand, its screen glowing with the light-words she is reading.
      const w = r.wr[0];
      const d = dir(r.foreA[0] + r.wrist[0]);
      const c = add(add(w, mul(d, 30)), mul(perp(d), 10));
      const a = (Math.atan2(d[1], d[0]) * 180) / Math.PI - 90;
      const pad = lp.local(false, a);
      const body =
        pad.form('M-38 -26H38V26H-38Z', '#2a3248', { sh: 8, line: 2.4, rim: 1.4 }) +
        pad.glow(0, 0, 50, '#7fe6ff', 0.6) +
        `<rect x="-31" y="-19" width="62" height="38" fill="#9ff0ff"/><path d="M-24 -10h18M-2 -10h10M-24 0h28M-24 10h12M-8 10h20" stroke="#1a5a7a" stroke-width="3"/><circle cx="18" cy="-4" r="5" fill="#ffd166"/>`;
      return at(c[0], c[1], 1, body, false, a);
    },
  });
  return at(x, y, s, svg, o.flip);
}

/* ---------------- Phineus ---------------- */

const PH = { skin: '#e6b496', robe: '#34407a', robeDark: '#222a58', beard: '#f4f4f8', gold: '#ffd166', sandal: '#6a4a30', stick: '#a0703a' };

/** Phineus's face: a bald dome with a white fringe, round dark glasses, wild white brows, moustache and a long beard (head coordinates). */
function phineusHead(pen: Pen, turn: number, shout: boolean): { front: string; back: string; skinMarks: string } {
  const F = faceFrame(turn);
  const m = F.mouth;
  const beardD = `M-30 14Q-40 50 -20 92Q-4 126 ${r1(m[0] + 2)} 150Q${r1(m[0] + 12)} 120 ${r1(m[0] + 26)} 92Q${r1(m[0] + 40)} 50 ${r1(m[0] + 28)} 10Q${r1(m[0] + 18)} 30 ${r1(m[0] + 8)} ${shout ? 46 : 38}Q${r1(m[0] - 6)} ${shout ? 50 : 42} ${r1(m[0] - 16)} 36Q-22 30 -30 14Z`;
  const locks: [P[], number][] = [
    [
      [
        [-14, 54],
        [-8, 90],
        [2, 120],
      ],
      2,
    ],
    [
      [
        [m[0], 60],
        [m[0] + 2, 100],
        [m[0] + 1, 134],
      ],
      2,
    ],
    [
      [
        [m[0] + 18, 54],
        [m[0] + 16, 80],
        [m[0] + 12, 102],
      ],
      1.8,
    ],
  ];
  const tache = `M${r1(m[0] - 22)} ${r1(m[1] - 2)}Q${r1(m[0] - 8)} ${r1(m[1] - 14)} ${r1(m[0] + 2)} ${r1(m[1] - 8)}Q${r1(m[0] + 14)} ${r1(m[1] - 14)} ${r1(m[0] + 26)} ${r1(m[1] - 2)}Q${r1(m[0] + 30)} ${r1(m[1] + 6)} ${r1(m[0] + 22)} ${r1(m[1] + 4)}Q${r1(m[0] + 10)} ${r1(m[1] - 4)} ${r1(m[0] + 2)} ${r1(m[1] - 2)}Q${r1(m[0] - 8)} ${r1(m[1] - 4)} ${r1(m[0] - 18)} ${r1(m[1] + 6)}Q${r1(m[0] - 28)} ${r1(m[1] + 6)} ${r1(m[0] - 22)} ${r1(m[1] - 2)}Z`;
  const n = F.eyeN;
  const f = F.eyeF;
  const rf = 13 * (1 - 0.45 * F.k);
  // Round dark glasses, with a sky-blue glint in each lens.
  const shades =
    `<ellipse cx="${r1(n[0])}" cy="${r1(n[1])}" rx="13" ry="12" fill="#1e1a34" stroke="${INK}" stroke-width="3"/><ellipse cx="${r1(f[0])}" cy="${r1(f[1])}" rx="${r1(rf)}" ry="12" fill="#1e1a34" stroke="${INK}" stroke-width="3"/>` +
    pen.brushes(
      [
        [
          [
            [n[0] - 6, n[1] - 4],
            [n[0] - 1, n[1] - 8],
          ],
          3,
        ],
        [
          [
            [f[0] - rf * 0.5, f[1] - 4],
            [f[0] - rf * 0.1, f[1] - 8],
          ],
          2.6,
        ],
      ],
      '#c8dcff',
      [0.3, 0.3],
      0.9,
    ) +
    pen.brush([[n[0] + 13, n[1] - 3], [(n[0] + f[0]) / 2, n[1] - 6], [f[0] - rf, f[1] - 3]], 2.6, INK, [0.1, 0.1]) +
    pen.brush([[n[0] - 13, n[1] - 3], [F.ear[0] + 2, F.ear[1] - 8]], 2.6, INK, [0.1, 0.1]);
  // Big wild white brows above the glasses.
  const brows = pen.brushes(
    [
      [
        [
          [n[0] - 16, n[1] - 14],
          [n[0] - 2, n[1] - 24],
          [n[0] + 12, n[1] - 16],
        ],
        8,
      ],
      [
        [
          [f[0] - rf, f[1] - 16],
          [f[0], f[1] - 24],
          [f[0] + rf + 4, f[1] - 14],
        ],
        7,
      ],
    ],
    PH.beard,
    [0.2, 0.5],
  );
  const front =
    pen.form(beardD, PH.beard, { sh: 14, hatch: 1, line: 2.4, rim: 1.8, inner: pen.brushes(locks, '#b8b8cc', [0.3, 0.3]) }) +
    pen.form(tache, '#ffffff', { sh: 5, line: 2.2 }) +
    shades +
    brows;
  // A white fringe round the back of his bald head.
  const back = pen.form('M-44 14Q-54 -10 -42 -30Q-34 -6 -24 8Z', PH.beard, { sh: 6, line: 2.2, rim: 1.6 }) + pen.form('M-30 -34Q-50 -46 -46 -60Q-34 -50 -24 -44Z', PH.beard, { line: 2 });
  const skinMarks = `<path d="M-20 -40Q0 -50 24 -40" fill="none" stroke="#ffffff" stroke-width="6" opacity=".35" stroke-linecap="round"/>`;
  return { front, back, skinMarks };
}

/**
 * His long star robe from the waist to the ankles, flaring over the legs, patched, with a gold hem
 * and little gold stars (figure coordinates).
 */
function robeSkirt(pen: Pen, r: Rig): string {
  const lw = r.b.leg[2] * U;
  const aN = r.an[0];
  const aF = r.an[1];
  const lo = Math.max(aN[1], aF[1]) - 6;
  const left = Math.min(aN[0], aF[0]) - lw * 1.6;
  const right = Math.max(aN[0], aF[0]) + lw * 1.6;
  const d = dSmooth([
    r.ts(-r.b.waist * 0.5, 0.62),
    r.ts(-r.b.hipW * 0.58, 0.98),
    [left + 10, lo - 120],
    [left, lo],
    [lerp(aN, aF, 0.5)[0], lo + 8],
    [right, lo - 4],
    [right - 12, lo - 120],
    r.ts(r.b.hipW * 0.58, 0.98),
    r.ts(r.b.waist * 0.5, 0.62),
  ]);
  const folds = pen.brushes(
    [
      [[r.ts(-0.2, 1.0), [left + 40, lo - 60], [left + 30, lo - 4]], 3],
      [[r.ts(0.2, 1.05), lerp(r.kn[1], aF, 0.5), [right - 40, lo - 4]], 3],
      [[r.ts(0, 1.1), lerp(lerp(r.kn[0], r.kn[1], 0.5), [lerp(aN, aF, 0.5)[0], lo], 0.5), [lerp(aN, aF, 0.5)[0] - 6, lo]], 2.6],
    ],
    INK,
    [0.2, 0.5],
    0.7,
  );
  const hem = pen.brush([[left + 2, lo - 10], [lerp(aN, aF, 0.5)[0], lo - 2], [right - 2, lo - 14]], 6, PH.gold, [0.05, 0.05], 0.9);
  const patch = (c: P, col: string, rot: number) => at(c[0], c[1], 1, `<path d="M-14 -12H14V12H-14Z" fill="${col}" stroke="${INK}" stroke-width="2"/><path d="M-12 -8H12M-12 8H12" stroke="#ffffff" stroke-width="1.6" stroke-dasharray="3 3" opacity=".7"/>`, false, rot);
  const stars = [
    [0.3, 0.3],
    [0.62, 0.52],
    [0.4, 0.75],
    [0.18, 0.62],
    [0.75, 0.2],
  ]
    .map(([u, v]) => spark(pen, lerp([left + 30, 0], [right - 30, 0], u)[0], lerp(r.P, [0, lo], v)[1], 7, PH.gold))
    .join('');
  return pen.form(d, PH.robe, { sh: r.b.hipW * U * 0.32, hatch: 2, rim: 2, line: 2.6, inner: folds + hem + stars + patch(lerp(r.P, [right - 30, lo], 0.55), '#4a8a6a', 8) });
}

export interface PhineusOpts extends CastOpts {
  /** His walking stick in the near hand (default yes). */
  stick?: boolean;
}

/** Phineus, the blind old stargazer: bald, a long white beard, round dark glasses, a patched blue star robe, sandals and a walking stick. */
export function phineus(pen: Pen, x: number, y: number, s: number, o: PhineusOpts = {}): string {
  const lp = pen.local(!!o.flip);
  const pose = poseOf(o.pose, 'stand');
  const turn = pose.turn ?? 0.4;
  const mood: Mood = o.mood ?? 'shout';
  const ph = phineusHead(lp, turn, mood === 'shout' || mood === 'grin');
  const build: Build = { ...ADULT, spine: 1.85, shoulder: 0.86, chest: 1.7, waist: 1.6, hipW: 1.5, arm: [0.42, 0.32, 0.25], leg: [0.6, 0.4, 0.28] };
  const head: HeadOpts = { skin: PH.skin, mood, eye: '#6a6a7a', brow: PH.beard, jaw: 1, chin: 1, nose: 1.35, age: 1, look: o.look, farEye: false, front: ph.front, back: ph.back, skinMarks: ph.skinMarks };
  const outfit: Outfit = { build, skin: PH.skin, top: PH.robe, sleeve: PH.robe, pants: PH.robeDark, boots: PH.sandal, bootTop: 0.05, rim: o.rim };
  const { svg } = figure(lp, pose, outfit, head, {
    torso: (r) => {
      let t = robeSkirt(lp, r);
      // A rope belt and a gold sash over the shoulder, with a star.
      t += lp.form(bandD(r, 0.6, 0.67), '#c8a060', { sh: 4, line: 2 });
      t += lp.form(dPoly([r.tf(-0.7, -0.02), r.tf(-0.4, -0.02), r.tf(0.8, 0.6), r.tf(0.6, 0.66)]), PH.gold, { sh: 5, line: 2 });
      const st = r.tf(0.1, 0.32);
      t += spark(lp, st[0], st[1], 12, '#fff6c8');
      t += at(r.tf(-0.5, 0.42)[0], r.tf(-0.5, 0.42)[1], 1, `<path d="M-12 -10H12V10H-12Z" fill="#8a5a8a" stroke="${INK}" stroke-width="2"/><path d="M-10 -6H10M-10 6H10" stroke="#f0d0f0" stroke-width="1.6" stroke-dasharray="3 3"/>`, false, -8);
      return t;
    },
    nearArm: (r) => {
      if (o.stick === false) return '';
      // The stick through the near fist, along the forearm's line and on past it.
      const w = r.wr[0];
      const d = dir(r.foreA[0] + r.wrist[0]);
      const g = add(w, mul(d, r.b.hand * U * 0.45));
      const ax = unit(perp(d));
      const a = add(g, mul(ax, -150));
      const b = add(g, mul(ax, 150));
      return lp.brush([a, g, b], 15, INK, [0.02, 0.02]) + lp.brush([a, g, b], 8, PH.stick, [0.02, 0.02]) + lp.form(circD(b[0], b[1], 13), '#c8904a', { sh: 5, line: 2.4 });
    },
  });
  return at(x, y, s, svg, o.flip);
}

/* ---------------- Celestia ---------------- */

/** Celestia's petal colours (blue, gold, pink, green), as in the storybook kit. */
export const CELESTIA = ['#5e9bff', '#ffd166', '#ff6fcf', '#7dff9a'];

/** A leaf with its midrib, base at b, pointing along `deg` (as `dir` measures it), `l` long. */
export function leafGN(pen: Pen, b: P, deg: number, l: number, color: string, o: { curl?: number; droop?: number } = {}): string {
  const d = dir(deg);
  const w = l * 0.24;
  const c = o.curl ?? 0.15;
  // A pointed lens, its tip bent by the curl and pulled down by the droop; the midrib bows the same way.
  const tip = add(add(b, mul(d, l)), add(mul(perp(d), l * c), [0, o.droop ?? 0]));
  const nn = perp(unit(sub(tip, b)));
  const bow = mul(perp(d), l * c * 0.5);
  const c1 = add(add(lerp(b, tip, 0.42), mul(nn, w * 1.3)), bow);
  const c2 = add(add(lerp(b, tip, 0.55), mul(nn, -w * 1.1)), bow);
  const shape = `M${r1(b[0])} ${r1(b[1])}Q${r1(c1[0])} ${r1(c1[1])} ${r1(tip[0])} ${r1(tip[1])}Q${r1(c2[0])} ${r1(c2[1])} ${r1(b[0])} ${r1(b[1])}Z`;
  const ribMid = add(lerp(b, tip, 0.5), bow);
  const rib = pen.brush([b, ribMid, tip], 3, INK, [0.1, 0.7], 0.7) + pen.brushes([[[lerp(b, ribMid, 0.5), add(lerp(ribMid, c1, 0.4), mul(d, l * 0.08))], 2], [[ribMid, add(lerp(tip, c1, 0.4), mul(d, l * 0.05))], 2]], INK, [0.1, 0.6], 0.45);
  return pen.form(shape, color, { sh: w * 0.6, hatch: 1, rim: 1.8, line: 2.4, inner: rib });
}

export interface CelestiaOpts {
  /** How far the head droops (0 upright, 1 hanging down). */
  droop?: number;
  /** How faded her colours are (0 full colour, 1 grey). */
  fade?: number;
  /** Which way the head leans (-1 left, 1 right). */
  side?: 1 | -1;
}

/**
 * Celestia, the glowing flower of Gaia Nova: a tall curving stem with broad leaves and a great bloom of
 * blue, gold, pink and green petals round a glowing heart. Base at (x, y), about 520 tall at scale 1.
 * Fading, her head hangs, her colours wash out toward grey-lilac and her glow is weak.
 */
export function celestia(pen: Pen, x: number, y: number, s: number, o: CelestiaOpts = {}): string {
  const droop = o.droop ?? 0;
  const fade = o.fade ?? 0;
  const sd = o.side ?? -1;
  const wash = (c: string, k = 0.6) => mix(c, '#b8b0c8', fade * k);
  const stemC = mix('#3f7a3a', '#6a7a5a', fade * 0.4);
  // The stem: up from the base, then arching over toward `side` as the head droops.
  const top: P = [sd * (30 + droop * 120), -440 + droop * 110];
  const sp: P[] = [
    [0, 0],
    [-sd * 16, -160],
    [sd * 4, -320],
    [sd * (14 + droop * 50), -420 + droop * 40],
    top,
  ];
  let out = '';
  // Broad leaves along the stem, hanging a little as she tires.
  const leafC = wash('#5f9a3a', 0.35);
  const leafL = wash('#86b84e', 0.35);
  out += leafGN(pen, [-sd * 12, -110], -sd * 128 + droop * sd * 34, 190, leafC, { curl: -sd * 0.22, droop: droop * 50 });
  out += leafGN(pen, [-sd * 8, -210], sd * 132 - droop * sd * 30, 160, leafL, { curl: sd * 0.22, droop: droop * 40 });
  out += leafGN(pen, [0, -40], sd * 100, 130, leafC, { curl: sd * 0.25, droop: droop * 20 });
  // The stem itself, inked and shaded as a long tapering form.
  const L: P[] = [];
  const R: P[] = [];
  sp.forEach((p, i) => {
    const t = i / (sp.length - 1);
    const tan = unit(sub(sp[Math.min(sp.length - 1, i + 1)], sp[Math.max(0, i - 1)]));
    const nn = perp(tan);
    const w = 17 - t * 7;
    L.push(add(p, mul(nn, w)));
    R.push(add(p, mul(nn, -w)));
  });
  out += pen.form(dSmooth([...L, ...R.reverse()]), stemC, { sh: 12, hatch: 1, rim: 2, line: 2.8, axis: [0, -1], inner: pen.brush(sp.slice(0, 4).map((p) => add(p, [-sd * 6, 0])), 3, '#bfe08a', [0.2, 0.3], 0.5) });
  // The bloom: its face bowed along `face` (toward the ground as she droops), so the disc of petals is
  // seen foreshortened, squashed along that direction. Petals that point down hang longer and limp.
  const face = dir(180 - sd * (100 + droop * 70));
  const ang = (Math.atan2(face[1], face[0]) * 180) / Math.PI;
  const f = 0.42 + 0.3 * (1 - droop);
  const hd = add(top, mul(face, 26));
  const hp = pen.local(false, ang);
  let bloom = '';
  const petal = 'M0 -30Q-40 -74 -18 -128Q0 -146 18 -128Q40 -74 0 -30Z';
  const order = [4, 3, 5, 2, 6, 1, 7, 0];
  for (const i of order) {
    const a0 = i * 45 + 22.5;
    const delta = ((a0 - 90 + 540) % 360) - 180;
    const a = 90 + delta * (1 - 0.28 * droop);
    const back = Math.abs(delta) > 90;
    // How much this petal points at the ground (in screen space), to let it hang.
    const sa = ((ang + a - 90) * Math.PI) / 180;
    const g = Math.max(0, Math.sin(sa));
    const c = wash(CELESTIA[i % 4]);
    const pp = hp.local(false, a);
    const vein = pp.brush([[0, -38], [-3, -84], [0, -122]], 3, '#ffffff', [0.2, 0.3], 0.55);
    bloom += `<g transform="rotate(${r1(a)}) scale(1 ${r1((1 + g * droop * 0.35) * 100) / 100})">${pp.form(petal, back ? pen.dark(c, 0.3) : c, { sh: 14, hatch: back ? 1 : 0, rim: 1.8, line: 2.4, inner: vein })}</g>`;
  }
  const heart = hp.rad(
    [
      [0, '#ffffff'],
      [0.45, mix('#ffe6a0', '#efe6ea', fade * 0.6)],
      [1, mix('#ff6fcf', '#b8a0c8', fade * 0.6)],
    ],
    0.42,
    0.38,
  );
  const heartM = hp.form(circD(0, 0, 44), '#ffd6f2', { sh: 16, line: 2.8, rim: 2, paint: heart }) + `<ellipse cx="-12" cy="-16" rx="12" ry="7" fill="#fff" opacity=".7" transform="rotate(-30 -12 -16)"/>`;
  // The green cup behind the bloom, where the stem joins it.
  const cup = pen.form(dSmooth([add(top, mul(perp(face), 30)), add(hd, mul(perp(face), 40)), add(hd, mul(face, 6)), add(hd, mul(perp(face), -40)), add(top, mul(perp(face), -30)), add(top, mul(face, -30))]), stemC, { sh: 12, line: 2.6, rim: 1.6 });
  out += pen.glow(hd[0], hd[1], 200, mix('#ffb8e8', '#d8d0e8', fade), 0.5 * (1 - fade * 0.5)) + cup;
  out += `<g transform="translate(${r1(hd[0])} ${r1(hd[1])}) rotate(${r1(ang)}) scale(${r1(f * 100) / 100} 1)">${bloom}<g transform="translate(16 0)">${heartM}</g></g>`;
  return at(x, y, s, out);
}

/** A fallen petal lying on the ground at (x, y). */
export function fallenPetal(pen: Pen, x: number, y: number, s: number, color: string, rot: number): string {
  const lp = pen.local(false, rot);
  return at(x, y, s, lp.form('M-40 0Q-10 -18 40 -4Q10 14 -40 0Z', color, { sh: 6, line: 2, rim: 1.2 }), false, rot);
}

/**
 * Celestia's sprout: a curl of stem with two leaves and a small glowing pink bud, in a terracotta pot.
 * Pot bottom at (x, y), about 150 tall at scale 1.
 */
export function sprout(pen: Pen, x: number, y: number, s: number): string {
  let out = pen.glow(0, -140, 90, '#ff8ad8', 0.7);
  out += pen.brush(
    [
      [0, -86],
      [-8, -112],
      [2, -140],
    ],
    12,
    INK,
    [0.05, 0.3],
  );
  out += pen.brush(
    [
      [0, -86],
      [-8, -112],
      [2, -140],
    ],
    7,
    '#5f9a3a',
    [0.05, 0.3],
  );
  out += leafGN(pen, [-6, -108], -120, 48, '#5f9a3a', { curl: -0.2 }) + leafGN(pen, [-2, -122], 120, 42, '#86b84e', { curl: 0.2 });
  out += pen.form(circD(2, -150, 15), '#ff6fcf', { sh: 6, line: 2.4, rim: 1.6 }) + `<circle cx="-3" cy="-155" r="5" fill="#fff" opacity=".85"/>`;
  out += pen.form('M-50 -88H50L38 0H-38Z', '#c8643a', { sh: 22, hatch: 1, line: 2.8, rim: 1.6 });
  out += pen.form('M-58 -100H58V-80H-58Z', '#e07a48', { sh: 8, line: 2.6, rim: 1.6 });
  return at(x, y, s, out);
}

/* ---------------- the Gardeners' stone and the Fleece ---------------- */

/** The Gardeners' standing stone: weathered pale rock carved with a spiral, its light-words glowing in rows. Base at (x, y), 390 tall at scale 1. */
export function ruinStone(pen: Pen, x: number, y: number, s: number, o: { glow?: number; seed?: number } = {}): string {
  const rand = rng(o.seed ?? 12);
  const g = o.glow ?? 1;
  const cols = ['#7fc8ff', '#ff8ad8', '#ffd166'];
  let words = '';
  let halos = '';
  for (let row = 0; row < 6; row++) {
    for (let c = 0; c < 4; c++) {
      if (rand() < 0.25) continue;
      const cx = -42 + c * 28;
      const cy = -300 + row * 40;
      const col = cols[(row + c) % 3];
      halos += pen.glow(cx, cy, 22, col, 0.8 * g);
      const k = Math.floor(rand() * 3);
      words += k === 0 ? `<circle cx="${cx}" cy="${cy}" r="7" fill="none" stroke="${col}" stroke-width="4"/>` : k === 1 ? `<path d="M${cx - 8} ${cy + 5}Q${cx} ${cy - 12} ${cx + 8} ${cy + 5}" fill="none" stroke="${col}" stroke-width="4"/>` : `<circle cx="${cx}" cy="${cy}" r="5" fill="${col}"/>`;
    }
  }
  const cracks = pen.brushes(
    [
      [
        [
          [60, -340],
          [44, -300],
          [52, -260],
        ],
        3,
      ],
      [
        [
          [-70, -120],
          [-50, -100],
          [-58, -70],
        ],
        3,
      ],
      [
        [
          [30, -60],
          [50, -30],
          [44, -4],
        ],
        2.6,
      ],
    ],
    INK,
    [0.2, 0.5],
    0.7,
  );
  const spiral = `<path d="M-8 -60q-22 0 -22 -20t22 -22t26 24t-28 32" fill="none" stroke="#6a6050" stroke-width="5"/>`;
  const moss = pen.brushes(
    [
      [
        [
          [-80, -6],
          [-40, -16],
          [0, -6],
        ],
        14,
      ],
      [
        [
          [-86, -150],
          [-80, -110],
        ],
        10,
      ],
    ],
    '#5f8a4a',
    [0.2, 0.3],
    0.8,
  );
  const inner = cracks + spiral + moss + halos + `<g stroke-linecap="round">${words}</g>`;
  return at(x, y, s, pen.form('M-84 0L-98 -250L-70 -350L-6 -396L30 -372L74 -330L98 -236L86 0Z', '#d8d0c0', { sh: 60, hatch: 2, rim: 2.6, line: 3.2, inner }));
}

/**
 * The Golden Fleece: a whole golden ram's fleece hung out like a cloak, its four leg flaps at the
 * corners, thick with tight curls and a few green seeds, glowing. Centred at (x, y), about 320 across
 * at scale 1. `holo` draws it as a hologram (no ink, see-through, with scan lines).
 */
export function fleece(pen: Pen, x: number, y: number, s: number, o: { holo?: boolean; seed?: number } = {}): string {
  const rand = rng(o.seed ?? 21);
  const outline =
    'M-124 -90Q-60 -104 0 -96Q60 -104 124 -90L160 -100Q168 -80 150 -64L130 -50Q142 10 132 70L148 120Q132 130 116 112L100 92Q50 106 0 98Q-50 106 -100 92L-116 112Q-132 130 -148 120L-132 70Q-142 10 -130 -50L-150 -64Q-168 -80 -160 -100Z';
  // Rows of tight curls: each a little loop, a dark underside and a bright top.
  const curls: [P[], number][] = [];
  const lights: [P[], number][] = [];
  for (let row = 0; row < 6; row++) {
    const cy = -72 + row * 31 + (rand() - 0.5) * 6;
    for (let col = 0; col < 8; col++) {
      const cx = -110 + col * 31 + (row % 2) * 15 + (rand() - 0.5) * 10;
      if (Math.abs(cx) > 122) continue;
      const r = 10 + rand() * 4;
      curls.push([
        [
          [cx - r, cy],
          [cx - r * 0.6, cy + r * 0.8],
          [cx + r * 0.5, cy + r * 0.8],
          [cx + r, cy - r * 0.1],
          [cx + r * 0.2, cy - r * 0.6],
          [cx - r * 0.2, cy - r * 0.1],
        ],
        3.2,
      ]);
      lights.push([
        [
          [cx - r * 0.9, cy - r * 0.2],
          [cx - r * 0.3, cy - r * 0.9],
          [cx + r * 0.6, cy - r * 0.7],
        ],
        3,
      ]);
    }
  }
  const seeds = [
    [-62, -22],
    [44, 32],
    [84, -44],
    [-20, 62],
    [-92, 44],
    [102, 52],
    [10, -50],
  ]
    .map(([sx, sy]) => `<circle cx="${sx}" cy="${sy}" r="6.5" fill="#7dff9a" stroke="${o.holo ? '#ffffff' : INK}" stroke-width="1.8"/>`)
    .join('');
  if (o.holo) {
    const lines = Array.from({ length: 24 }, (_, i) => `M-170 ${-130 + i * 11}H170`).join('');
    const clip = pen.uid();
    pen.def(clip, `<clipPath id="${clip}"><path d="${outline}"/></clipPath>`);
    const body =
      pen.glow(0, 0, 270, '#ffd166', 0.6) +
      `<path d="${outline}" fill="${pen.rad([
        [0, '#fffbe8', 0.9],
        [0.55, '#ffd166', 0.78],
        [1, '#ffa830', 0.55],
      ])}"/>` +
      `<g clip-path="url(#${clip})">${pen.brushes(curls, '#c07010', [0.15, 0.15], 0.75)}${pen.brushes(lights, '#fffbe8', [0.3, 0.3], 0.85)}${seeds}<path d="${lines}" stroke="#fff6d8" stroke-width="2.4" opacity=".35"/></g>` +
      `<path d="${outline}" fill="none" stroke="#fff2c0" stroke-width="4" opacity=".95"/>`;
    return at(x, y, s, body);
  }
  const paint = pen.rad(
    [
      [0, '#fff6d0'],
      [0.6, '#ffd166'],
      [1, '#e09a1a'],
    ],
    0.4,
    0.35,
    0.8,
  );
  const body = pen.glow(0, 0, 270, '#ffd166', 0.6) + pen.form(outline, '#ffd166', { sh: 40, hatch: 1, rim: 2.4, line: 3, paint, inner: pen.brushes(curls, '#b0600e', [0.15, 0.15], 0.85) + pen.brushes(lights, '#fff6d0', [0.3, 0.3], 0.9) + seeds });
  return at(x, y, s, body);
}

/* ---------------- Aeëtes's ships and drones ---------------- */

/**
 * One of Aeëtes's salvage ships: a long gold beetle of a hull with a dark canopy, claw cranes folded
 * under its belly, an amber engine glow at the stern and the glowing "A" crest. Faces left, centred.
 * Far ones pass `line` small.
 */
export function goldShip(pen: Pen, x: number, y: number, s: number, o: { flip?: boolean; line?: number } = {}): string {
  const lp = pen.local(!!o.flip);
  const line = o.line ?? 3;
  let out = lp.glow(330, 0, 150, '#ffb020', 0.8, 80) + lp.glow(330, 0, 50, '#fff2c0', 0.9);
  // Claw cranes under the belly.
  const claws: [P[], number][] = [];
  for (const cx of [-60, 40, 140]) {
    claws.push([
      [
        [cx, 40],
        [cx - 20, 110],
        [cx + 10, 100],
      ],
      14,
    ]);
  }
  out += lp.brushes(claws, INK, [0.05, 0.05]) + lp.brushes(
    claws.map(([p]) => [p, 7] as [P[], number]),
    '#4a3a40',
    [0.05, 0.05],
  );
  const plates = `<path d="M-200 -70Q-180 0 -200 70M-60 -96V76M80 -96V76M220 -96Q240 0 220 76" fill="none" stroke="${INK}" stroke-width="${r1(line * 1.1)}" opacity=".5"/><path d="M-270 -20H300" stroke="#fff6c0" stroke-width="6" opacity=".55"/>`;
  out += lp.form('M-300 0Q-260 -90 -60 -96H220Q320 -80 320 0Q320 70 220 76H-60Q-260 70 -300 0Z', '#f0c050', {
    sh: 60,
    hatch: 2,
    rim: 2.4,
    line,
    axis: [1, 0],
    paint: lp.lin([
      [0, '#fff0b0'],
      [0.5, '#f0c050'],
      [1, '#a87018'],
    ]),
    inner: plates,
  });
  out += lp.form('M-200 -64Q-170 -116 -104 -98L-128 -58Z', '#2a2230', { sh: 10, line: line * 0.8, inner: lp.brush([[-180, -70], [-160, -96], [-130, -100]], 4, '#ffd88a', [0.3, 0.3], 0.8) });
  out += lp.glow(70, 0, 70, '#ffe08a', 0.6) + `<path d="M30 40L70 -40L110 40M48 10H92" fill="none" stroke="#fff6c0" stroke-width="14" stroke-linecap="round" stroke-linejoin="round"/>`;
  return at(x, y, s, out, o.flip);
}

/** A little gold salvage drone: a saucer with a dark dome, an amber eye and two dangling claws. Centred. */
export function saucer(pen: Pen, x: number, y: number, s: number, o: { flip?: boolean; rot?: number; eye?: string } = {}): string {
  const lp = pen.local(!!o.flip, o.rot ?? 0);
  const eye = o.eye ?? '#ffb020';
  let out = lp.glow(0, 30, 60, eye, 0.5, 20);
  const legs: [P[], number][] = [
    [
      [
        [-20, 12],
        [-34, 44],
        [-24, 54],
      ],
      9,
    ],
    [
      [
        [20, 12],
        [34, 44],
        [24, 54],
      ],
      9,
    ],
  ];
  out += lp.brushes(legs, INK, [0.05, 0.05]) + lp.brushes(
    legs.map(([p]) => [p, 4] as [P[], number]),
    '#4a4050',
    [0.05, 0.05],
  );
  out += lp.form('M-30 -8Q-26 -50 0 -52Q26 -50 30 -8Z', '#2a2230', { sh: 10, line: 2.6, inner: lp.brush([[-18, -20], [-12, -38], [2, -44]], 4, '#ffffff', [0.3, 0.3], 0.5) });
  out += lp.form(ellD(0, 0, 62, 20), '#f0c050', { sh: 12, hatch: 1, rim: 2, line: 2.8, inner: `<path d="M-50 -4H48" stroke="#fff6c0" stroke-width="4" opacity=".6"/>` });
  out += lp.glow(20, 4, 20, eye, 0.9) + `<circle cx="20" cy="4" r="8" fill="${eye}" stroke="${INK}" stroke-width="2.4"/><circle cx="18" cy="2" r="2.6" fill="#fff"/>`;
  return at(x, y, s, out, o.flip, o.rot ?? 0);
}

/**
 * Wraps markup as a film hologram: tinted toward `color` (a colour blend inside its own isolated group),
 * see-through, with scan lines over the box (x0, y0, w, h) and a soft glow.
 */
export function hologram(pen: Pen, body: string, box: [number, number, number, number], color = '#7fe6ff', op = 0.82): string {
  const [x0, y0, w, h] = box;
  const id = pen.shared('scan', (id) => `<pattern id="${id}" width="8" height="8" patternUnits="userSpaceOnUse"><path d="M0 1H8" stroke="#000" stroke-width="3" opacity=".55"/></pattern>`);
  return (
    pen.glow(x0 + w / 2, y0 + h / 2, Math.max(w, h) * 0.6, color, 0.35) +
    `<g opacity="${op}" style="isolation:isolate">${body}<rect x="${r1(x0)}" y="${r1(y0)}" width="${r1(w)}" height="${r1(h)}" fill="${color}" style="mix-blend-mode:color"/><rect x="${r1(x0)}" y="${r1(y0)}" width="${r1(w)}" height="${r1(h)}" fill="${color}" opacity=".18" style="mix-blend-mode:screen"/><rect x="${r1(x0)}" y="${r1(y0)}" width="${r1(w)}" height="${r1(h)}" fill="url(#${id})" style="mix-blend-mode:multiply"/></g>`
  );
}

/** The point on a cast member's torso (see `Rig.tf`) in panel coordinates, for a figure drawn at (x, y), scale s. */
export function torsoPoint(b: Build, pose: Pose, x: number, y: number, s: number, flip: boolean, tx: number, ty: number): P {
  const r = rig(b, pose);
  const p = r.tf(tx, ty);
  return [x + (flip ? -p[0] : p[0]) * s, y + p[1] * s];
}

/** The head centre of a posed figure in panel coordinates (for aiming glows and props). */
export function headPoint(b: Build, pose: Pose, x: number, y: number, s: number, flip: boolean, hp: P = [0, 0]): P {
  const r = rig(b, pose);
  const p = headPt(r, hp);
  return [x + (flip ? -p[0] : p[0]) * s, y + p[1] * s];
}
