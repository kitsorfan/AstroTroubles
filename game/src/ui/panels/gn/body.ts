/**
 * The graphic-novel figure: a 2D skeleton posed with joint angles or hand/foot targets (two-bone IK),
 * and the pieces drawn along it (limbs, torso, hands, boots, head and face), each shaded and inked by
 * `Pen.form`. Characters (see cast.ts) are built from these pieces.
 *
 * Figures face right (+x) in a three-quarter view; draw them mirrored to face left. They are drawn
 * around their own origin with the feet on y = 0, in units where one head (crown to chin) is 100.
 * "Near" limbs are the ones nearer the viewer (on the left of the figure, drawn in front of the body);
 * "far" limbs are behind it.
 */
import { add, angle, at, dir, dot, dPoly, dSmooth, INK, len, lerp, mix, mul, type P, type Pen, perp, r1, sub, unit } from './core';

/** One head, in local units. */
export const U = 100;

/** Body proportions, in heads (U). Widths are full widths. */
export interface Build {
  /** Chin to the shoulder line. */
  neck: number;
  /** Shoulder line (neck base) to the hip joints. */
  spine: number;
  /** Half the distance between the shoulder joints and between the hip joints. */
  shoulder: number;
  hips: number;
  upperArm: number;
  foreArm: number;
  hand: number;
  thigh: number;
  shin: number;
  /** Ankle joint to the ground. */
  ankle: number;
  foot: number;
  /** Arm widths at the shoulder, elbow and wrist; leg widths at the hip, knee and ankle. */
  arm: [number, number, number];
  leg: [number, number, number];
  /** Torso widths at the chest, waist and hips; the neck's width. */
  chest: number;
  waist: number;
  hipW: number;
  neckW: number;
}

/** Jason: a lean teenage boy, about 5.5 heads tall. */
export const TEEN_BOY: Build = {
  neck: 0.15,
  spine: 1.55,
  shoulder: 0.66,
  hips: 0.3,
  upperArm: 1.08,
  foreArm: 0.98,
  hand: 0.62,
  thigh: 1.27,
  shin: 1.17,
  ankle: 0.16,
  foot: 0.82,
  arm: [0.44, 0.34, 0.27],
  leg: [0.66, 0.42, 0.29],
  chest: 1.36,
  waist: 1.02,
  hipW: 1.06,
  neckW: 0.46,
};

/** Atalanta: an athletic teenage girl, about 5.5 heads tall. */
export const TEEN_GIRL: Build = {
  ...TEEN_BOY,
  shoulder: 0.56,
  hips: 0.32,
  arm: [0.32, 0.25, 0.2],
  leg: [0.56, 0.32, 0.22],
  chest: 1.14,
  waist: 0.84,
  hipW: 1.1,
  neckW: 0.38,
  foot: 0.76,
};

/** A grown-up hero (Captain Argus): about 7 heads tall. */
export const ADULT: Build = {
  neck: 0.22,
  spine: 2.0,
  shoulder: 0.95,
  hips: 0.4,
  upperArm: 1.45,
  foreArm: 1.28,
  hand: 0.74,
  thigh: 1.72,
  shin: 1.66,
  ankle: 0.2,
  foot: 1.0,
  arm: [0.5, 0.38, 0.3],
  leg: [0.74, 0.46, 0.3],
  chest: 1.85,
  waist: 1.45,
  hipW: 1.45,
  neckW: 0.56,
};

/** General Brennus: old, broad and barrel-chested, about 6.5 heads tall. */
export const STOCKY: Build = {
  ...ADULT,
  neck: 0.12,
  spine: 1.95,
  shoulder: 1.02,
  hips: 0.44,
  upperArm: 1.32,
  foreArm: 1.16,
  thigh: 1.5,
  shin: 1.5,
  arm: [0.6, 0.44, 0.36],
  leg: [0.8, 0.52, 0.34],
  chest: 2.1,
  waist: 1.8,
  hipW: 1.6,
  neckW: 0.68,
};

/** Aeëtes: tall and thin, about 7.5 heads tall. */
export const TALL: Build = {
  ...ADULT,
  neck: 0.28,
  spine: 2.15,
  shoulder: 0.82,
  hips: 0.36,
  upperArm: 1.55,
  foreArm: 1.36,
  hand: 0.8,
  thigh: 1.95,
  shin: 1.75,
  arm: [0.4, 0.3, 0.24],
  leg: [0.58, 0.36, 0.26],
  chest: 1.5,
  waist: 1.08,
  hipW: 1.18,
  neckW: 0.4,
};

/** An arm or leg in a pose: the absolute angles of its two bones (as `dir` measures them), or where its hand/foot should go. */
export type LimbPose = [number, number] | { to: P; bend?: 1 | -1 };

export type Hand = 'fist' | 'open' | 'point' | 'flat' | 'grip' | 'relaxed';

/** A pose. Angles are degrees: 0 hangs straight down, 90 points forward (right), 180 straight up, -90 back. */
export interface Pose {
  /** 0 faces us, 1 is a side view (facing right). Default 0.4. */
  turn?: number;
  /** The spine's lean toward the facing direction (degrees). */
  lean?: number;
  /** The head's tilt on top of the lean (degrees, + nods forward). */
  tilt?: number;
  /** Arms: angles, or `{ to }` a wrist target relative to the neck base, in heads. */
  armN: LimbPose;
  armF: LimbPose;
  /**
   * Legs: angles, or `{ to }` an ankle target relative to the pelvis, in leg lengths (so the same pose
   * fits any build): `{ to: [-0.1, 0.97] }` stands with a soft knee.
   */
  legN: LimbPose;
  legF: LimbPose;
  /** Contrapposto: lifts the near hip (and drops the near shoulder) by this many hundredths of a head. */
  hipTilt?: number;
  handN?: Hand;
  handF?: Hand;
  /** Turns each hand at the wrist (degrees). */
  wristN?: number;
  wristF?: number;
  /** Tilts each foot (degrees; + lifts the heel). */
  footN?: number;
  footF?: number;
  /** Lifts the figure off the ground (heads); default 0 puts the lower foot on y = 0. */
  lift?: number;
}

/** A posed skeleton: every joint in local units (feet on y = 0). Index 0 is the near side, 1 the far side. */
export interface Rig {
  b: Build;
  turn: number;
  /** cos and sin of the body's turn. */
  cs: number;
  sn: number;
  lean: number;
  /** Pelvis (between the hip joints) and neck base. */
  P: P;
  N: P;
  /** Up the spine, and across it toward the far side. */
  u: P;
  s: P;
  /** Head centre and its rotation (degrees). */
  head: P;
  headRot: number;
  sh: [P, P];
  el: [P, P];
  wr: [P, P];
  hip: [P, P];
  kn: [P, P];
  an: [P, P];
  /** The forearm and shin angles (as `dir` measures them). */
  foreA: [number, number];
  shinA: [number, number];
  hands: [Hand, Hand];
  wrist: [number, number];
  foot: [number, number];
  /**
   * A point on the torso: `x` across its front (-1 near edge .. 1 far edge), `y` down it (0 the neck
   * base, 1 the hip joints). Use it to place chest panels, buttons and belts.
   */
  tf: (x: number, y: number) => P;
  /** A point on the torso's outline: `x` in heads from the spine (negative = near side), `y` as in `tf`. */
  ts: (x: number, y: number) => P;
  /** The torso's half width (heads) at height y. */
  hw: (y: number) => number;
}

/** Where a two-bone limb's middle joint goes so its end reaches `to` (bend: which side the joint bulges). */
function ik(root: P, to: P, l1: number, l2: number, bend: number): [P, P] {
  const d = sub(to, root);
  const dl = Math.max(Math.abs(l1 - l2) + 1, Math.min(len(d), (l1 + l2) * 0.999));
  const ud = unit(d);
  const a = (l1 * l1 + dl * dl - l2 * l2) / (2 * dl);
  const h = Math.sqrt(Math.max(0, l1 * l1 - a * a));
  const mid = add(add(root, mul(ud, a)), mul(perp(ud), h * bend));
  return [mid, add(root, mul(ud, dl))];
}

/** Poses a skeleton. */
export function rig(b: Build, p: Pose): Rig {
  const turn = p.turn ?? 0.4;
  const th = (turn * Math.PI) / 2;
  const cs = Math.cos(th);
  const sn = Math.sin(th);
  const lean = p.lean ?? 0;
  const u = dir(180 - lean);
  const s: P = [-u[1], u[0]];
  const P0: P = [0, 0];
  const N = add(P0, mul(u, b.spine * U));
  const shBase = add(N, mul(u, -0.13 * U));
  // Contrapposto: the hips tilt one way and the shoulders the other.
  const hipT = (p.hipTilt ?? 0) * U * 0.01;
  const sh: [P, P] = [add(add(shBase, mul(s, -b.shoulder * U * cs)), mul(u, -hipT * 0.6)), add(add(shBase, mul(s, b.shoulder * U * cs * 0.96)), mul(u, hipT * 0.6))];
  const hip: [P, P] = [add(add(P0, mul(s, -b.hips * U * cs)), mul(u, hipT)), add(add(P0, mul(s, b.hips * U * cs * 0.96)), mul(u, -hipT))];
  const legLen = (b.thigh + b.shin) * U;
  const limb = (root: P, base: P, lp: LimbPose, l1: number, l2: number, bend: number, unitLen: number): [P, P] => {
    if (Array.isArray(lp)) {
      const m = add(root, mul(dir(lp[0]), l1));
      return [m, add(m, mul(dir(lp[1]), l2))];
    }
    return ik(root, add(base, mul(lp.to, unitLen)), l1, l2, lp.bend ?? bend);
  };
  const ua = b.upperArm * U;
  const fa = b.foreArm * U;
  const [elN, wrN] = limb(sh[0], N, p.armN, ua, fa, 1, U);
  const [elF, wrF] = limb(sh[1], N, p.armF, ua, fa, 1, U);
  const [knN, anN] = limb(hip[0], P0, p.legN, b.thigh * U, b.shin * U, -1, legLen);
  const [knF, anF] = limb(hip[1], P0, p.legF, b.thigh * U, b.shin * U, -1, legLen);
  const footN = p.footN ?? 0;
  const footF = p.footF ?? 0;
  // The sole under each ankle (tilting the foot lifts the heel and pivots on the toe).
  const sole = (a: P, f: number): number => a[1] + b.ankle * U + Math.max(0, Math.sin((f * Math.PI) / 180)) * b.foot * U * 0.15;
  const ground = Math.max(sole(anN, footN), sole(anF, footF));
  const dy = -ground - (p.lift ?? 0) * U;
  const T = (q: P): P => [q[0], q[1] + dy];
  const headDir = dir(180 - lean - (p.tilt ?? 0) * 0.3);
  const Nn = T(N);
  const Pn = T(P0);
  const hwAt = (y: number) => {
    if (y < 0.34) return lerp([b.neckW / 2 + 0.1, 0], [b.chest / 2, 0], Math.min(1, Math.max(0, y / 0.34)))[0];
    if (y < 0.72) return lerp([b.chest / 2, 0], [b.waist / 2, 0], (y - 0.34) / 0.38)[0];
    return lerp([b.waist / 2, 0], [b.hipW / 2, 0], Math.min(1.2, (y - 0.72) / 0.26))[0];
  };
  const f = cs + 0.3 * sn;
  const ts = (x: number, y: number): P => add(lerp(Nn, Pn, y), mul(s, x * f * U));
  const tf = (x: number, y: number): P => add(lerp(Nn, Pn, y), mul(s, (x * cs + 0.32 * sn) * hwAt(y) * U));
  return {
    b,
    turn,
    cs,
    sn,
    lean,
    P: Pn,
    N: Nn,
    u,
    s,
    head: add(Nn, mul(headDir, (b.neck + 0.5) * U)),
    headRot: lean + (p.tilt ?? 0),
    sh: [T(sh[0]), T(sh[1])],
    el: [T(elN), T(elF)],
    wr: [T(wrN), T(wrF)],
    hip: [T(hip[0]), T(hip[1])],
    kn: [T(knN), T(knF)],
    an: [T(anN), T(anF)],
    foreA: [angle(sub(wrN, elN)), angle(sub(wrF, elF))],
    shinA: [angle(sub(anN, knN)), angle(sub(anF, knF))],
    hands: [p.handN ?? 'relaxed', p.handF ?? 'relaxed'],
    wrist: [p.wristN ?? 0, p.wristF ?? 0],
    foot: [footN, footF],
    tf,
    ts,
    hw: hwAt,
  };
}

/** Shading options shared by the body pieces. */
export interface PieceOpts {
  /** Rim-light width (default 2.2). */
  rim?: number;
  hatch?: 0 | 1 | 2 | 3;
  /** Ink outline width (default 2.4). */
  line?: number;
  /** Shadow depth as a fraction of the piece's width (default 0.36). */
  sh?: number;
  shade?: string;
  inner?: string;
}

/**
 * The outline of a limb segment from a to b, w0 wide at a and w1 at b, with a muscle `bulge` on one
 * `side` (1 = the left of travel, -1 the right). Ends are rounded.
 */
export function limbD(a: P, b: P, w0: number, w1: number, bulge = 0, side = 1, cap = 0.32): string {
  const d = unit(sub(b, a));
  const n = perp(d);
  const L: P[] = [];
  const R: P[] = [];
  for (const t of [0, 0.2, 0.42, 0.64, 0.84, 1]) {
    const c = lerp(a, b, t);
    const w = ((w0 + (w1 - w0) * t) / 2) * 1.1;
    const bl = bulge * Math.sin(Math.PI * Math.min(1, t * 1.2));
    L.push(add(c, mul(n, w + (side > 0 ? bl : bl * 0.2))));
    R.push(add(c, mul(n, -(w + (side < 0 ? bl : bl * 0.2)))));
  }
  return dSmooth([sub(a, mul(d, w0 * cap)), ...L, add(b, mul(d, w1 * cap)), ...R.reverse()]);
}

/** A shaded, inked limb segment. */
export function limb(pen: Pen, a: P, b: P, w0: number, w1: number, color: string, o: PieceOpts & { bulge?: number; side?: number; cap?: number } = {}): string {
  return pen.form(limbD(a, b, w0, w1, o.bulge ?? 0, o.side ?? 1, o.cap), color, {
    sh: Math.max(w0, w1) * (o.sh ?? 0.36),
    hatch: o.hatch ?? 1,
    rim: o.rim ?? 1.6,
    axis: sub(b, a),
    line: o.line ?? 2.4,
    shade: o.shade,
    inner: o.inner,
  });
}

/**
 * The outline of a whole two-bone limb (shoulder, elbow, wrist or hip, knee, ankle) as one shape, so
 * the joint bends like a body instead of two tubes. `w` = widths at the three joints, `bulge` = the
 * muscle swell of each bone and the side it is on (1 = left of travel, -1 = right).
 */
export function chainD(a: P, b: P, c: P, w: [number, number, number], bulge: [number, number] = [0, 0], side: [number, number] = [-1, -1]): string {
  const d1 = unit(sub(b, a));
  const d2 = unit(sub(c, b));
  const n1 = perp(d1);
  const n2 = perp(d2);
  const nb = unit(add(n1, n2));
  const cross = d1[0] * d2[1] - d1[1] * d2[0];
  const bent = Math.abs(cross) > 0.5 || dot(d1, d2) < 0.3;
  // The inner side of a bend (left or right of travel).
  const inner = cross > 0 ? 1 : -1;
  const L: P[] = [];
  const R: P[] = [];
  const push = (q: P, n: P, hw: number, bl: number, sd: number, skipInner: boolean) => {
    const l = hw + (sd > 0 ? bl : bl * 0.2);
    const r = hw + (sd < 0 ? bl : bl * 0.2);
    if (!(skipInner && inner === 1)) L.push(add(q, mul(n, l)));
    if (!(skipInner && inner === -1)) R.push(add(q, mul(n, -r)));
  };
  for (const t of [0, 0.25, 0.5, 0.75]) {
    const sw = Math.sin(Math.PI * Math.min(1, t * 1.25));
    push(lerp(a, b, t), n1, ((w[0] + (w[1] - w[0]) * t) / 2) * 1.08, bulge[0] * sw, side[0], bent && t === 0.75);
  }
  // At the joint itself, offset along the average normal (a little wider so the bend reads).
  const jw = (w[1] / 2) * 1.08 * (bent ? 1.1 : 1);
  L.push(add(b, mul(nb, jw)));
  R.push(add(b, mul(nb, -jw)));
  for (const t of [0.25, 0.5, 0.75, 1]) {
    const sw = Math.sin(Math.PI * Math.min(1, t * 1.25));
    push(lerp(b, c, t), n2, ((w[1] + (w[2] - w[1]) * t) / 2) * 1.08, bulge[1] * sw, side[1], bent && t === 0.25);
  }
  return dSmooth([sub(a, mul(d1, w[0] * 0.34)), ...L, add(c, mul(d2, w[2] * 0.22)), ...R.reverse()]);
}

/** A whole shaded limb (see `chainD`), with a crease at the joint. */
export function chain(pen: Pen, a: P, b: P, c: P, w: [number, number, number], color: string, o: PieceOpts & { bulge?: [number, number]; side?: [number, number] } = {}): string {
  const d2 = unit(sub(c, b));
  const crease = pen.brush([add(b, mul(perp(d2), -w[1] * 0.45)), add(b, mul(d2, w[1] * 0.12)), add(b, mul(perp(d2), w[1] * 0.1))], 2.2, INK, [0.2, 0.6], 0.75);
  return pen.form(chainD(a, b, c, w, o.bulge, o.side), color, {
    sh: Math.max(w[0], w[1]) * (o.sh ?? 0.36),
    hatch: o.hatch ?? 1,
    rim: o.rim ?? 1.6,
    axis: sub(c, a),
    line: o.line ?? 2.4,
    shade: o.shade,
    inner: crease + (o.inner ?? ''),
  });
}

/** Ink creases across a limb at fraction t (folds at elbows and knees): `n` short tapered strokes. */
export function creases(pen: Pen, a: P, b: P, t: number, w: number, n = 2, color = INK): string {
  const d = unit(sub(b, a));
  const nn = perp(d);
  const list: [P[], number][] = [];
  for (let i = 0; i < n; i++) {
    const c = lerp(a, b, t + (i - (n - 1) / 2) * 0.07);
    const o = (i % 2 ? 0.1 : -0.15) * w;
    list.push([[add(c, mul(nn, -w * 0.42 + o)), add(add(c, mul(d, w * 0.08)), mul(nn, o)), add(c, mul(nn, w * 0.2 + o))], 2.2]);
  }
  return pen.brushes(list, color, [0.15, 0.6], 0.85);
}

/** The torso's outline from the neck base down to `bottom` (as in `Rig.tf`; past 1 reaches the crotch). */
export function torsoD(r: Rig, bottom = 1.1, flare = 0): string {
  const b = r.b;
  const sw = (b.shoulder * r.cs + b.arm[0] * 0.35) / (r.cs + 0.3 * r.sn);
  const side = (k: number): P[] => {
    const pts: P[] = [
      r.ts(k * b.neckW * 0.42, -0.07),
      r.ts(k * (b.neckW * 0.5 + (sw - b.neckW * 0.5) * 0.45), 0.0),
      r.ts(k * (sw - b.arm[0] * 0.15), 0.06),
      r.ts(k * sw, 0.14),
      r.ts(k * b.chest * 0.5, 0.36),
      r.ts(k * b.waist * 0.5, Math.min(bottom, 0.72)),
    ];
    if (bottom > 0.8) pts.push(r.ts(k * (r.hw(Math.min(bottom, 0.98)) + flare), Math.min(bottom, 0.98)));
    return pts;
  };
  const near = side(-1);
  const far = side(1).reverse();
  const low = bottom > 1 ? [r.ts(-0.2, bottom), r.ts(0.25 * r.sn, bottom + 0.03), r.ts(0.3, bottom)] : [r.ts(0, bottom + 0.02)];
  // A dip at the neck between the far and near sides.
  return dSmooth([...near, ...low, ...far, r.ts(0.04, 0.0)]);
}

/** The torso as a shaded piece (see `torsoD`). */
export function torso(pen: Pen, r: Rig, color: string, o: PieceOpts & { bottom?: number; flare?: number } = {}): string {
  return pen.form(torsoD(r, o.bottom ?? 1.1, o.flare ?? 0), color, {
    sh: r.b.chest * U * (o.sh ?? 0.28),
    hatch: o.hatch ?? 1,
    rim: o.rim ?? 1.8,
    axis: r.u,
    line: o.line ?? 2.6,
    shade: o.shade,
    inner: o.inner,
  });
}

/** A band across the torso front from y0 to y1 (belts, chest straps), as path data. */
export function bandD(r: Rig, y0: number, y1: number, x0 = -1.15, x1 = 1.15): string {
  const xm = (x0 + x1) / 2;
  return `M${pt(r.tf(x0, y0))}Q${pt(r.tf(xm, y0 + 0.03))} ${pt(r.tf(x1, y0))}L${pt(r.tf(x1, y1))}Q${pt(r.tf(xm, y1 + 0.03))} ${pt(r.tf(x0, y1))}Z`;
}

/** Hand outlines in a hand-local frame: the wrist at (0, 0), the fingers toward +y, the thumb toward +x; 100 long. */
const HAND_D: Record<Hand, string> = {
  fist: 'M-20 2Q-30 26 -28 52Q-28 74 -8 76Q14 78 24 70Q34 58 30 36Q36 26 30 18Q24 8 18 2Z',
  relaxed: 'M-18 2Q-28 30 -24 58Q-20 84 -6 88Q4 90 10 80Q22 66 22 46Q32 40 32 28Q30 14 16 2Z',
  open: 'M-18 2Q-30 30 -30 56L-34 92Q-32 100 -26 96L-18 66L-16 102Q-12 110 -6 102L-4 68L0 104Q6 110 10 100L10 66L18 92Q24 96 24 88L20 56Q24 44 36 34Q42 24 34 20Q24 22 16 2Z',
  point: 'M-20 2Q-30 26 -28 52Q-28 72 -10 74L4 72L6 112Q12 122 20 112L21 70Q32 62 32 40Q36 26 30 18Q24 8 18 2Z',
  flat: 'M-19 2L-23 56L-21 94Q-18 101 -12 99Q-8 104 -3 101Q2 106 7 102Q12 104 15 98L20 58L26 40Q30 28 22 22L17 2Z',
  grip: 'M-20 2Q-30 26 -28 52Q-28 74 -8 76Q14 78 24 70Q34 58 30 36Q36 26 30 18Q24 8 18 2Z',
};
const HAND_LINES: Record<Hand, P[][]> = {
  fist: [
    [
      [-24, 50],
      [-10, 56],
      [2, 54],
    ],
    [
      [-22, 64],
      [-8, 68],
    ],
    [
      [14, 30],
      [22, 44],
      [18, 58],
    ],
  ],
  relaxed: [
    [
      [-14, 56],
      [-10, 74],
    ],
    [
      [0, 58],
      [2, 76],
    ],
  ],
  open: [
    [
      [-12, 40],
      [4, 46],
    ],
  ],
  point: [
    [
      [-24, 54],
      [-12, 60],
      [0, 60],
    ],
    [
      [14, 30],
      [22, 44],
      [18, 58],
    ],
  ],
  flat: [
    [
      [-12, 62],
      [-11, 98],
    ],
    [
      [-3, 62],
      [-2, 100],
    ],
    [
      [6, 62],
      [7, 99],
    ],
    [
      [-21, 56],
      [-2, 61],
      [19, 57],
    ],
    [
      [14, 14],
      [22, 30],
      [19, 48],
    ],
  ],
  grip: [
    [
      [14, 30],
      [22, 44],
      [18, 58],
    ],
  ],
};

/**
 * A gloved or bare hand at a wrist, pointing along `deg` (as `dir` measures it). `mirror` puts the
 * thumb on the other side. `size` is the hand's length.
 */
export function hand(pen: Pen, wrist: P, deg: number, kind: Hand, size: number, color: string, mirror = false, o: PieceOpts = {}): string {
  const rot = mirror ? deg : -deg;
  const lp = pen.local(mirror, rot);
  const k = size / 100;
  const body =
    lp.form(HAND_D[kind], color, { sh: 18, hatch: o.hatch ?? 1, rim: (o.rim ?? 2) / k, line: (o.line ?? 2.2) / k, heavy: 3 / k }) +
    lp.brushes(
      HAND_LINES[kind].map((l) => [l, 2.6 / k] as [P[], number]),
      INK,
      [0.3, 0.5],
      0.8,
    );
  return at(wrist[0], wrist[1], 1, at(0, 0, k, body, mirror, rot));
}

/**
 * A boot or shoe under an ankle: `top` is how far up the shin the boot reaches (heads), drawn as its
 * own piece over the leg. The toe points toward +x (foreshortened by the figure's turn).
 */
export function boot(pen: Pen, r: Rig, side: 0 | 1, color: string, o: PieceOpts & { top?: number; sole?: string; cuff?: string } = {}): string {
  const b = r.b;
  const a = r.an[side];
  const tilt = r.foot[side];
  const fl = b.foot * U * (0.55 + 0.45 * r.sn) * (side ? 0.94 : 1);
  const ah = b.ankle * U;
  const lp = pen.local(false, -tilt);
  const w = b.leg[2] * U;
  // Foot in a frame at the ankle: sole at y = ah, toe toward +x.
  const foot = dSmooth([
    [-w * 0.55, -ah * 0.4],
    [w * 0.5, -ah * 0.6],
    [fl * 0.5, ah * 0.1],
    [fl * 0.82, ah * 0.35],
    [fl * 0.86, ah * 1.05],
    [fl * 0.3, ah * 1.08],
    [-w * 0.62, ah * 1.06],
    [-w * 0.72, ah * 0.4],
  ]);
  let out = '';
  const top = o.top ?? 0;
  if (top > 0) {
    const kn = r.kn[side];
    const up = add(a, mul(unit(sub(kn, a)), top * U));
    out += limb(pen, up, add(a, [0, ah * 0.2]), w * 1.32, w * 1.22, color, { sh: o.sh, rim: o.rim, hatch: o.hatch, cap: 0.2, shade: o.shade });
    if (o.cuff) out += pen.form(limbD(add(up, mul(unit(sub(kn, a)), w * 0.08)), add(up, mul(unit(sub(a, kn)), w * 0.32)), w * 1.42, w * 1.38, 0, 1, 0.1), o.cuff, { sh: w * 0.4, line: 2.2, rim: 1.6 });
  }
  const soleD = `M${r1(-w * 0.72)} ${r1(ah * 0.86)}L${r1(fl * 0.86)} ${r1(ah * 0.86)}L${r1(fl * 0.84)} ${r1(ah * 1.1)}L${r1(-w * 0.66)} ${r1(ah * 1.1)}Z`;
  out += at(a[0], a[1], 1, lp.form(foot, color, { sh: w * 0.45, hatch: o.hatch ?? 1, rim: o.rim ?? 2, line: o.line ?? 2.4, shade: o.shade, inner: `<path d="${soleD}" fill="${o.sole ?? mix(color, INK, 0.6)}"/>` }), false, -tilt);
  return out;
}

/** Facial expressions. */
export type Mood = 'neutral' | 'smile' | 'grin' | 'determined' | 'angry' | 'shout' | 'surprised' | 'worried' | 'proud' | 'sly' | 'scheming' | 'asleep' | 'focus';

type Mouth = 'line' | 'smile' | 'grin' | 'set' | 'shout' | 'o' | 'worried' | 'smirk' | 'wide';

/** Per mood: brow lift [inner, outer] (+ raises), how open the eyes are, and the mouth. */
const MOODS: Record<Mood, { brow: [number, number]; open: number; mouth: Mouth }> = {
  neutral: { brow: [0, 0], open: 0.85, mouth: 'line' },
  smile: { brow: [1.5, 0], open: 0.78, mouth: 'smile' },
  grin: { brow: [2.5, 1], open: 0.72, mouth: 'grin' },
  determined: { brow: [-3.5, 1.5], open: 0.72, mouth: 'set' },
  focus: { brow: [-2.5, 1], open: 0.6, mouth: 'line' },
  angry: { brow: [-6, 2.5], open: 0.75, mouth: 'shout' },
  shout: { brow: [-3, 3], open: 0.9, mouth: 'shout' },
  surprised: { brow: [5, 4], open: 1.12, mouth: 'o' },
  worried: { brow: [5, -1.5], open: 0.95, mouth: 'worried' },
  proud: { brow: [1, 0.5], open: 0.55, mouth: 'smile' },
  sly: { brow: [-1.5, 3.5], open: 0.55, mouth: 'smirk' },
  scheming: { brow: [-2.5, 4], open: 0.6, mouth: 'wide' },
  asleep: { brow: [0, 0], open: 0, mouth: 'line' },
};

/** What a head looks like. All markup options are in head coordinates (centre 0, 0; crown y = -50, chin y = 50). */
export interface HeadOpts {
  skin: string;
  mood?: Mood;
  /** Iris colour. */
  eye?: string;
  brow?: string;
  /** Jaw width and chin length multipliers (1 = average). */
  jaw?: number;
  chin?: number;
  /** Nose size (1 = average). */
  nose?: number;
  /** Lines of age (0..1). */
  age?: number;
  /** Lashes and a softer face. */
  soft?: boolean;
  /** Where the eyes look: a small offset (default a little ahead). */
  look?: P;
  /** Hide the far eye (an eyepatch or monocle is drawn over it in `front`). */
  farEye?: boolean;
  /** Eye size (1 = average; the teenagers' are a little bigger). */
  eyeSize?: number;
  /** Rim-light width on the head (default 1.4). */
  rim?: number;
  /** Markup behind the head (long hair, a braid), over the head and face (hair, hats, moustaches). */
  back?: string;
  front?: string;
  /** Markup over the skin but under the eyes and brows (beards, stubble, scars). */
  skinMarks?: string;
}

/** The head's key outline points at turn 0.2 and 0.8, from the crown clockwise. */
const HEAD_FRONT: P[] = [
  [0, -50],
  [26, -46],
  [38, -28],
  [41, -8],
  [39, 10],
  [34, 28],
  [22, 42],
  [8, 48],
  [-8, 47],
  [-28, 37],
  [-38, 19],
  [-41, -4],
  [-39, -27],
  [-24, -46],
];
const HEAD_SIDE: P[] = [
  [-4, -50],
  [20, -47],
  [34, -30],
  [40, -9],
  [38, 9],
  [37, 25],
  [31, 41],
  [20, 48],
  [4, 47],
  [-16, 37],
  [-32, 17],
  [-45, -6],
  [-41, -30],
  [-24, -47],
];

/** Face layout for a turn: the face's centre line, and so on (head coordinates). */
export function faceFrame(turn: number) {
  const k = Math.min(1.1, Math.max(-0.1, (turn - 0.2) / 0.6));
  const fc = 6 + 24 * k;
  return {
    k,
    fc,
    eyeN: [fc - 17.5 * (1 - 0.3 * k), 2] as P,
    eyeF: [fc + 15.5 * (1 - 0.62 * k), 1.5] as P,
    ear: [-33 + 17 * k, 6] as P,
    mouth: [fc + 3 + 2 * k, 31] as P,
    noseTip: [fc + 6 + 8 * k, 18] as P,
  };
}

/** The head's outline at a turn, with the jaw and chin adjustments. */
export function headD(turn: number, jaw = 1, chin = 1): string {
  const { k } = faceFrame(turn);
  const pts = HEAD_FRONT.map((p, i) => {
    const q = lerp(p, HEAD_SIDE[i], k);
    if (i >= 5 && i <= 10) q[0] = q[0] * jaw + (1 - jaw) * 4;
    if (i >= 5 && i <= 9) q[1] = q[1] + (chin - 1) * (q[1] - 10) * 0.6;
    return q;
  });
  return dSmooth(pts);
}

/** An eye: an almond with an iris clipped to it, a heavy upper lid and a light lower lid. `inner` = which side the nose is on. */
function eyeMarks(pen: Pen, c: P, w: number, open: number, iris: string, look: P, inner: 1 | -1, liftIn: number, soft: boolean): string {
  const hw = w / 2;
  const h = w * 0.36 * open;
  const ix = c[0] + inner * hw;
  const ox = c[0] - inner * hw;
  // The inner end of the lid follows the brow a little (an angry or worried look).
  const iy = c[1] + 1 - liftIn * 0.12;
  const oy = c[1] - 1;
  if (open <= 0.05) {
    return pen.brush(
      [
        [ix, iy],
        [c[0], c[1] + 2.5],
        [ox, oy + 1],
      ],
      3.4,
      INK,
      [0.2, 0.3],
    );
  }
  const top: P = [c[0] - inner * w * 0.08, c[1] - h * 1.5 - liftIn * 0.15];
  const bot: P = [c[0] - inner * w * 0.05, c[1] + h * 0.95];
  const almond = `M${r1(ix)} ${r1(iy)}Q${pt(top)} ${r1(ox)} ${r1(oy)}Q${pt(bot)} ${r1(ix)} ${r1(iy)}Z`;
  const ic: P = [c[0] + look[0], c[1] + look[1] + 0.5];
  const ir = Math.max(2.4, w * 0.27);
  const glint = add(ic, mul(pen.L, ir * 0.45));
  const irisM = `<circle cx="${r1(ic[0])}" cy="${r1(ic[1])}" r="${r1(ir)}" fill="${iris}"/><circle cx="${r1(ic[0])}" cy="${r1(ic[1])}" r="${r1(ir * 0.5)}" fill="${INK}"/><circle cx="${r1(glint[0])}" cy="${r1(glint[1])}" r="${r1(ir * 0.32)}" fill="#fff"/>`;
  // The lid's shadow on the top of the eyeball.
  const lidShade = `<path d="M${r1(ix)} ${r1(iy)}Q${pt(top)} ${r1(ox)} ${r1(oy)}L${r1(ox)} ${r1(oy - 2)}L${r1(ix)} ${r1(iy - 2)}Z" fill="${INK}" opacity=".35" transform="translate(0 ${r1(h * 0.5)})"/>`;
  let out = pen.form(almond, '#f3ede6', { line: 0, inner: irisM + lidShade });
  out += pen.brush([[ix + inner * 1, iy + 0.5], [c[0] - inner * w * 0.05, c[1] - h * 1.32 - liftIn * 0.15], [ox - inner * 1.5, oy - 0.4]], soft ? 3.6 : 3.2, INK, [0.15, 0.1]);
  if (soft) out += pen.brush([[ox + inner * 1.5, oy - 1], [ox - inner * 3, oy - 3.5], [ox - inner * 5.5, oy - 5]], 2.6, INK, [0.1, 0.9]);
  out += pen.brush([[c[0] + inner * hw * 0.6, c[1] + h * 0.7], [c[0], c[1] + h * 0.95 + 0.5], [ox + inner * 1, oy + 1.2]], 1.5, INK, [0.4, 0.4], 0.8);
  return out;
}

const pt = (p: P) => `${r1(p[0])} ${r1(p[1])}`;

/**
 * A head, in head coordinates (scale and place it with `at`), facing right at the given turn. Draws the
 * back markup, the near ear, the shaded skull, the face (eyes, brows, nose, mouth) and the front markup.
 */
export function head(pen: Pen, turn: number, o: HeadOpts): string {
  const F = faceFrame(turn);
  const m = MOODS[o.mood ?? 'neutral'];
  const skin = o.skin;
  const brow = o.brow ?? '#3b2416';
  const iris = o.eye ?? '#5a3a24';
  const look = o.look ?? [1.6, 0];
  const nose = o.nose ?? 1;
  let out = o.back ?? '';
  // The near ear.
  const [ex, ey] = F.ear;
  out += pen.form(`M${r1(ex + 4)} ${r1(ey - 9)}Q${r1(ex - 8)} ${r1(ey - 14)} ${r1(ex - 9)} ${r1(ey - 2)}Q${r1(ex - 8)} ${r1(ey + 12)} ${r1(ex + 3)} ${r1(ey + 13)}Z`, skin, { sh: 4, line: 2.2, rim: (o.rim ?? 1.4) * 0.8 });
  // The skull, with the shadow under the brows and the side plane of the face.
  const sock = `<path d="M${r1(F.eyeN[0] - 12)} -6Q${r1(F.fc)} -16 ${r1(F.eyeF[0] + 10)} -7L${r1(F.eyeF[0] + 9)} -1Q${r1(F.fc)} -8 ${r1(F.eyeN[0] - 11)} 1Z" fill="${pen.dark(skin, 0.6)}" opacity=".45"/>`;
  const plane = `<path d="M${r1(F.eyeN[0] - 14)} 6Q${r1(F.eyeN[0] - 10)} 24 ${r1(F.mouth[0] - 14)} 40" fill="none" stroke="${pen.dark(skin, 0.5)}" stroke-width="6" opacity=".22"/>`;
  out += pen.form(headD(turn, o.jaw, o.chin), skin, { sh: 15, hatch: 1, rim: o.rim ?? 1.4, line: 2.6, inner: sock + plane + (o.skinMarks ?? '') });
  out += pen.brush([[ex - 3, ey - 7], [ex - 5, ey], [ex - 1, ey + 7]], 2.2, INK, [0.2, 0.4], 0.8);
  // Eyes.
  const ew = 16 * (o.eyeSize ?? 1);
  const [bi, bo] = m.brow;
  out += eyeMarks(pen, F.eyeN, ew * (1 - 0.12 * F.k), m.open, iris, look, 1, bi, !!o.soft);
  if (o.farEye !== false) out += eyeMarks(pen, F.eyeF, ew * (1 - 0.55 * F.k), m.open, iris, [look[0] * 0.6, look[1]], -1, bi, !!o.soft);
  // Brows: tapered strokes, the inner ends lifted or knitted by the mood.
  const bw = o.soft ? 3.2 : 4.6;
  const by = -10;
  const bN = F.eyeN[0];
  const bF = F.eyeF[0];
  const fw = ew * (1 - 0.55 * F.k);
  out += pen.brushes(
    [
      [
        [
          [bN - 10, by - bo + 1],
          [bN - 2, by - 2.5 - (bo + bi) * 0.4],
          [bN + 8.5, by - bi],
        ],
        bw,
      ],
      [
        [
          [bF - fw * 0.55, by - bi],
          [bF + fw * 0.1, by - 2.5 - (bo + bi) * 0.4],
          [bF + fw * 0.62, by - bo + 1.5],
        ],
        bw * 0.9,
      ],
    ],
    brow,
    [0.25, 0.55],
  );
  // Nose: the side line, the tip, the nostril and its cast shadow.
  const [nx, ny] = F.noseTip;
  const nk = nose;
  out += pen.brush([[F.fc - 1, -2], [F.fc + 1 * nk, 8], [nx - 1, ny + 1]], 2, INK, [0.6, 0.2], 0.55);
  out += pen.brush([[nx - 9 * nk, ny + 2], [nx - 3, ny + 4.5 * nk], [nx + 1, ny + 1.5]], 2.6, INK, [0.3, 0.3]);
  out += `<path d="M${r1(nx - 7 * nk)} ${r1(ny + 5)}Q${r1(nx - 1)} ${r1(ny + 9 * nk)} ${r1(nx + 2)} ${r1(ny + 4)}Q${r1(nx - 2)} ${r1(ny + 6)} ${r1(nx - 7 * nk)} ${r1(ny + 5)}Z" fill="${pen.dark(skin, 0.7)}" opacity=".6"/>`;
  if (F.k > 0.4) {
    // In a near profile the nose breaks the outline.
    out += `<path d="M${r1(F.fc + 8)} -6Q${r1(nx + 2 * nk)} ${r1(ny - 4)} ${r1(nx + 1.5)} ${r1(ny + 1)}Q${r1(nx - 2)} ${r1(ny + 3)} ${r1(nx - 6)} ${r1(ny + 2)}L${r1(F.fc + 6)} ${r1(ny)}Z" fill="${skin}"/>`;
    out += pen.brush([[F.fc + 9, -6], [nx + 2 * nk, ny - 4], [nx + 1.5, ny + 1], [nx - 3, ny + 3]], 2.4, INK, [0.3, 0.3]);
  }
  out += mouth(pen, F.mouth, m.mouth, F.k, skin);
  // Lines of age: crow's feet and a line from the nose to the mouth.
  if (o.age) {
    const a = o.age;
    out += pen.brushes(
      [
        [
          [
            [F.eyeN[0] - 11, 4],
            [F.eyeN[0] - 15, 8],
          ],
          1.8,
        ],
        [
          [
            [F.eyeN[0] - 10, 8],
            [F.eyeN[0] - 13, 13],
          ],
          1.6,
        ],
        [
          [
            [nx - 12, ny + 2],
            [F.mouth[0] - 14, F.mouth[1] - 4],
            [F.mouth[0] - 15, F.mouth[1] + 2],
          ],
          2.2,
        ],
        [
          [
            [F.fc - 10, -22],
            [F.fc + 4, -23],
          ],
          1.6,
        ],
      ],
      INK,
      [0.3, 0.5],
      0.35 + a * 0.4,
    );
  }
  return out + (o.front ?? '');
}

/** The mouth for a mood, centred at c. */
function mouth(pen: Pen, c: P, kind: Mouth, k: number, skin: string): string {
  const w = 21 * (1 - 0.32 * k);
  const l = c[0] - w * 0.6;
  const rgt = c[0] + w * 0.4;
  const y = c[1];
  const lip = pen.dark(skin, 0.55);
  const lower = (dy = 6) => pen.brush([[c[0] - w * 0.25, y + dy], [c[0] + w * 0.15, y + dy + 1]], 2.2, lip, [0.4, 0.4], 0.8);
  switch (kind) {
    case 'smile':
      return (
        pen.brush([[l - 1, y - 3.5], [c[0] - 2, y + 2.4], [rgt + 1, y - 2.5]], 2.6, INK, [0.25, 0.25]) +
        pen.brush([[l - 3, y - 6], [l - 1, y - 3.5], [l, y - 1]], 1.6, INK, [0.3, 0.3], 0.7) +
        lower(7)
      );
    case 'grin': {
      const d = `M${r1(l - 2)} ${r1(y - 4)}Q${r1(c[0])} ${r1(y + 1)} ${r1(rgt + 2)} ${r1(y - 4)}Q${r1(rgt)} ${r1(y + 10)} ${r1(c[0] - 1)} ${r1(y + 11)}Q${r1(l)} ${r1(y + 9)} ${r1(l - 2)} ${r1(y - 4)}Z`;
      const teeth = `<path d="M${r1(l - 2)} ${r1(y - 4)}Q${r1(c[0])} ${r1(y + 1)} ${r1(rgt + 2)} ${r1(y - 4)}L${r1(rgt + 1)} ${r1(y + 1)}Q${r1(c[0])} ${r1(y + 5)} ${r1(l - 1)} ${r1(y + 1)}Z" fill="#f6f2ea"/>`;
      return pen.form(d, '#6a1e26', { line: 2.2, heavy: 1, inner: teeth }) + pen.brush([[l - 4, y - 7], [l - 2, y - 4], [l - 1, y]], 1.8, INK, [0.3, 0.3], 0.7);
    }
    case 'set':
      return pen.brush([[l, y + 0.5], [c[0], y - 0.6], [rgt, y + 1.5]], 2.8, INK, [0.2, 0.3]) + lower(6);
    case 'shout': {
      const d = `M${r1(l)} ${r1(y - 3)}Q${r1(c[0])} ${r1(y - 6)} ${r1(rgt)} ${r1(y - 2)}Q${r1(rgt + 1)} ${r1(y + 12)} ${r1(c[0])} ${r1(y + 14)}Q${r1(l - 1)} ${r1(y + 12)} ${r1(l)} ${r1(y - 3)}Z`;
      const teeth = `<path d="M${r1(l)} ${r1(y - 3)}Q${r1(c[0])} ${r1(y - 6)} ${r1(rgt)} ${r1(y - 2)}V${r1(y + 1)}Q${r1(c[0])} ${r1(y - 2)} ${r1(l)} ${r1(y)}Z" fill="#f6f2ea"/>`;
      return pen.form(d, '#5a1820', { line: 2.2, heavy: 1, inner: teeth });
    }
    case 'o':
      return pen.form(`M${r1(c[0] - 4)} ${r1(y - 1)}Q${r1(c[0] + 1)} ${r1(y - 4)} ${r1(c[0] + 5)} ${r1(y)}Q${r1(c[0] + 5)} ${r1(y + 8)} ${r1(c[0])} ${r1(y + 8)}Q${r1(c[0] - 5)} ${r1(y + 7)} ${r1(c[0] - 4)} ${r1(y - 1)}Z`, '#5a1820', { line: 2, heavy: 1 });
    case 'worried':
      return pen.brush([[l + 2, y + 2], [c[0], y - 2], [rgt - 1, y + 1]], 2.4, INK, [0.3, 0.3]) + lower(5);
    case 'smirk':
      return pen.brush([[l + 2, y + 1], [c[0] + 2, y + 0.5], [rgt + 3, y - 4]], 2.6, INK, [0.25, 0.2]) + pen.brush([[rgt + 1, y - 6], [rgt + 3, y - 4], [rgt + 3, y - 1]], 1.6, INK, [0.3, 0.3], 0.7);
    case 'wide': {
      const d = `M${r1(l - 8)} ${r1(y - 6)}Q${r1(c[0])} ${r1(y + 2)} ${r1(rgt + 8)} ${r1(y - 7)}Q${r1(rgt + 2)} ${r1(y + 12)} ${r1(c[0])} ${r1(y + 12)}Q${r1(l - 4)} ${r1(y + 10)} ${r1(l - 8)} ${r1(y - 6)}Z`;
      const teeth = `<path d="M${r1(l - 8)} ${r1(y - 6)}Q${r1(c[0])} ${r1(y + 2)} ${r1(rgt + 8)} ${r1(y - 7)}L${r1(rgt + 6)} ${r1(y + 4)}Q${r1(c[0])} ${r1(y + 9)} ${r1(l - 6)} ${r1(y + 3)}Z" fill="#f6f2ea"/>`;
      return pen.form(d, '#5a1820', { line: 2.2, heavy: 1, inner: teeth + `<path d="M${r1(c[0] - 8)} ${r1(y - 2)}V${r1(y + 6)}M${r1(c[0])} ${r1(y - 1)}V${r1(y + 7)}M${r1(c[0] + 8)} ${r1(y - 2)}V${r1(y + 6)}" stroke="${INK}" stroke-width="1" opacity=".5"/>` });
    }
    default:
      return pen.brush([[l, y], [c[0], y + 0.6], [rgt, y - 0.5]], 2.6, INK, [0.25, 0.3]) + lower(6);
  }
}

/** The head placed on a rig: scaled to the build, rotated with the spine, shaded in the panel's light. */
export function headOn(pen: Pen, r: Rig, o: HeadOpts): string {
  const lp = pen.local(false, r.headRot);
  return at(r.head[0], r.head[1], 1, head(lp, r.turn, o), false, r.headRot);
}

/** The neck from the neck base up into the head. */
export function neck(pen: Pen, r: Rig, skin: string): string {
  const top = add(r.head, mul(dir(180 - r.headRot), -22));
  const base = add(r.N, mul(r.u, -6));
  const w = r.b.neckW * U;
  const shadeUnder = `<path d="${limbD(add(top, [0, -10]), add(top, [0, 22]), w * 1.4, w * 1.4)}" fill="${pen.dark(skin, 0.7)}" opacity=".7"/>`;
  return limb(pen, base, top, w * 1.05, w * 0.92, skin, { sh: 0.3, rim: 2, inner: shadeUnder });
}

/** True if a direction faces the key light (for choosing which side gets a highlight). */
export const facesLight = (pen: Pen, n: P) => dot(n, pen.L) > 0;

/** A polygon helper for pieces drawn in torso coordinates (see `Rig.tf`). */
export const tfPoly = (r: Rig, pts: P[], smooth = false) => (smooth ? dSmooth(pts.map(([x, y]) => r.tf(x, y))) : dPoly(pts.map(([x, y]) => r.tf(x, y))));
