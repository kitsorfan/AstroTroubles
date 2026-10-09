/**
 * Graphic-novel pieces for the game's finale (the Golden Fleece panels): Brennus's green Legion robots,
 * the Golden Fleece itself (a living cloak of golden curls with green seeds in it), Celestia in bloom
 * (big or little), the Gardeners' light-words, the Golden King, the tree-temple's roots and the
 * Gorgon's old lifeboat. All of them draw through a `Pen` like the rest of the kit.
 */
import { add, at, brushD, dir, dPoly, dSmooth, INK, lerp, mix, mul, type P, type Pen, perp, r1, rng, spline, sub, unit } from './core';
import { bandD, type Build, hand, limb, type Pose, rig, torso, U, TALL } from './body';
import { aeetes, type CastOpts, POSES } from './cast';
import { spark } from './fx';

/* ---------------- Brennus's green Legion robots ---------------- */

/** A Legion trooper robot: squat and sturdy, about 4.5 heads (helmets) tall. */
export const BOT: Build = {
  neck: 0.1,
  spine: 1.3,
  shoulder: 0.78,
  hips: 0.34,
  upperArm: 0.95,
  foreArm: 0.88,
  hand: 0.52,
  thigh: 0.92,
  shin: 0.9,
  ankle: 0.2,
  foot: 0.86,
  arm: [0.34, 0.3, 0.34],
  leg: [0.44, 0.36, 0.42],
  chest: 1.6,
  waist: 1.0,
  hipW: 1.1,
  neckW: 0.4,
};

const LG = { olive: '#62783e', plate: '#7a9450', dark: '#3a4a26', joint: '#4c5058', gold: '#d2a648', visor: '#0c2418', lens: '#3dff8a', pot: '#c06a3c' };

/** Ready-made poses for the robots (facing right). */
export const BOT_POSES = {
  /** At attention: arms straight down, fists closed. */
  attention: { turn: 0.32, armN: [-6, 0], armF: [8, 4], legN: { to: [-0.1, 0.99] }, legF: { to: [0.14, 0.98] }, handN: 'fist', handF: 'fist' },
  /** Saluting, the flat hand at the helmet. */
  salute: { turn: 0.36, armN: { to: [-0.05, -0.92], bend: -1 }, armF: [8, 4], legN: { to: [-0.1, 0.99] }, legF: { to: [0.14, 0.98] }, handN: 'flat', handF: 'fist', wristN: 40 },
  /** Holding something in front of the chest with both hands (a potted sapling). */
  carry: { turn: 0.4, armN: { to: [0.7, 0.95] }, armF: { to: [0.95, 0.78] }, legN: { to: [-0.12, 0.99] }, legF: { to: [0.16, 0.98] }, handN: 'grip', handF: 'grip', wristN: -60, wristF: -50 },
  /** Leaning on a spade planted beside it. */
  spade: { turn: 0.3, hipTilt: 5, armN: [-10, 4], armF: { to: [1.0, 0.7] }, legN: { to: [-0.1, 0.99] }, legF: { to: [0.18, 0.97] }, handN: 'fist', handF: 'grip', wristF: -80 },
} satisfies Record<string, Pose>;

export interface BotOpts {
  pose?: keyof typeof BOT_POSES | Pose;
  flip?: boolean;
  /** What it carries: a potted sapling (with the `carry` pose) or a spade (with the `spade` pose). */
  gear?: 'sapling' | 'spade';
  rim?: number;
  /** Shadow depth for the whole robot (deeper for robots farther back). */
  far?: number;
}

/** A filled circle path. */
const circ = (x: number, y: number, r: number) => `M${r1(x - r)} ${r1(y)}A${r1(r)} ${r1(r)} 0 1 0 ${r1(x + r)} ${r1(y)}A${r1(r)} ${r1(r)} 0 1 0 ${r1(x - r)} ${r1(y)}Z`;

/** A ball joint (shoulder, elbow, knee): a dark steel sphere. */
function ball(pen: Pen, p: P, r: number, rim: number): string {
  return pen.form(circ(p[0], p[1], r), LG.joint, { sh: r * 0.7, line: 2.2, rim, hatch: 1 });
}

/** A potted sapling (a little Celestia bud on a curly stem), its pot centred at the origin. */
function sapling(pen: Pen): string {
  return (
    pen.glow(4, -88, 40, '#ff8ad8', 0.85) +
    pen.brush(
      [
        [0, -26],
        [-10, -50],
        [4, -72],
        [2, -84],
      ],
      7,
      '#2e6a2e',
      [0.05, 0.4],
    ) +
    leafD(pen, [-4, -46], -120, 30, '#5fae4a') +
    leafD(pen, [2, -62], 110, 26, '#7cc85a') +
    pen.form(circ(3, -90, 11), '#ff7ad0', { sh: 5, line: 2, inner: `<circle cx="0" cy="-94" r="3.6" fill="#fff" opacity=".85"/>` }) +
    pen.form('M-30 -30H30L22 22H-22Z', LG.pot, { sh: 14, hatch: 1, line: 2.4, rim: 1.6 }) +
    pen.form('M-36 -38H36V-24H-36Z', '#d8804a', { sh: 5, line: 2.2 })
  );
}

/** A gardener's spade: shaft from the grip `g` down to the blade in the ground at `foot`. */
function spadeD(pen: Pen, g: P, foot: P): string {
  const d = unit(sub(foot, g));
  const n = perp(d);
  const top = add(g, mul(d, -40));
  const neck = add(foot, mul(d, -64));
  const blade = dPoly([add(neck, mul(n, 22)), add(foot, mul(n, 20)), add(foot, mul(d, 14)), add(foot, mul(n, -20)), add(neck, mul(n, -22))]);
  return (
    pen.brush([top, lerp(top, neck, 0.5), neck], 16, INK, [0.02, 0.02]) +
    pen.brush([top, lerp(top, neck, 0.5), neck], 9, '#b07a44', [0.02, 0.02]) +
    pen.brush([add(top, mul(n, -14)), add(top, mul(n, 14))], 14, INK, [0.1, 0.1]) +
    pen.form(blade, '#a8b0bc', { sh: 10, line: 2.4, rim: 1.6 })
  );
}

/**
 * One of General Brennus's own Legion robots, painted olive-green again: a domed helmet with a dark
 * visor and one big green lens, gold shoulder pads, a leaf painted on its chest plate where the red gear
 * used to be, and a green ring over its head that means "friend". Feet at (x, y), facing right.
 */
export function legionBot(pen: Pen, x: number, y: number, s: number, o: BotOpts = {}): string {
  const lp = pen.local(!!o.flip);
  const pose: Pose = typeof o.pose === 'string' ? BOT_POSES[o.pose] : (o.pose ?? BOT_POSES.attention);
  const r = rig(BOT, pose);
  const rim = o.rim ?? 1.8;
  const deep = o.far ?? 0;
  const rimFar = lp.R[0] >= 0;
  const rimOf = (i: number) => ((i === 1) === rimFar ? rim : 0);
  const sh = (c: string, i: number) => (i || deep ? lp.dark(c, Math.min(1, (i ? 0.62 : 0.5) + deep)) : undefined);
  const aw = BOT.arm.map((v) => v * U);
  const lw = BOT.leg.map((v) => v * U);
  const arm = (i: 0 | 1) => {
    const rm = rimOf(i);
    let out = limb(lp, r.sh[i], r.el[i], aw[0], aw[1], LG.dark, { rim: rm, hatch: i ? 2 : 1, sh: 0.45, shade: sh(LG.dark, i), cap: 0.3 });
    out += ball(lp, r.el[i], aw[1] * 0.62, rm);
    // The forearm: a chunky armoured gauntlet.
    out += limb(lp, lerp(r.el[i], r.wr[i], 0.08), r.wr[i], aw[1] * 1.35, aw[2] * 1.4, LG.olive, { rim: rm, hatch: i ? 2 : 1, sh: 0.4, shade: sh(LG.olive, i), cap: 0.18, inner: '' });
    out += hand(lp, r.wr[i], r.foreA[i] + r.wrist[i], r.hands[i], BOT.hand * U, LG.joint, false, { rim: rm });
    return out;
  };
  const leg = (i: 0 | 1) => {
    const rm = rimOf(i);
    let out = limb(lp, r.hip[i], r.kn[i], lw[0], lw[1], LG.dark, { rim: rm, hatch: i ? 2 : 1, sh: 0.45, shade: sh(LG.dark, i) });
    out += ball(lp, r.kn[i], lw[1] * 0.62, rm);
    // The shin: a thick armoured greave flaring into a big flat foot.
    const a = r.an[i];
    const kn = r.kn[i];
    const fwd = 0.55 + 0.45 * r.sn;
    const foot = dPoly([add(kn, mul(perp(unit(sub(a, kn))), lw[1] * 0.62)), add(a, [lw[2] * 0.62, -6]), add(a, [BOT.foot * U * fwd * 0.9, BOT.ankle * U * 0.4]), add(a, [BOT.foot * U * fwd * 0.92, BOT.ankle * U]), add(a, [-lw[2] * 0.85, BOT.ankle * U]), add(a, [-lw[2] * 0.82, -10]), add(kn, mul(perp(unit(sub(a, kn))), -lw[1] * 0.62))]);
    out += lp.form(foot, LG.olive, { sh: lw[2] * 0.42, hatch: i ? 2 : 1, rim: rm, line: 2.6, shade: sh(LG.olive, i), inner: `<path d="M${r1(a[0] - lw[2])} ${r1(a[1] + BOT.ankle * U * 0.62)}H${r1(a[0] + BOT.foot * U)}" stroke="${LG.joint}" stroke-width="${r1(BOT.ankle * U * 0.7)}"/>` });
    return out;
  };
  let out = '';
  if (o.gear === 'spade') out += spadeD(lp, r.wr[1], [r.wr[1][0] + 30, 0]);
  out += arm(1) + leg(1) + leg(0);
  // Hips and torso: a barrel chest with a lighter chest plate, the leaf emblem and a belt.
  out += lp.form(dSmooth([r.tf(-1.05, 0.72), r.tf(1.05, 0.72), r.tf(0.9, 1.05), r.tf(0, 1.12), r.tf(-0.9, 1.05)]), LG.dark, { sh: 18, hatch: 1, line: 2.4, rim: 1.6 });
  out += torso(lp, r, LG.olive, { bottom: 0.84, sh: 0.3, rim, hatch: deep ? 2 : 1 });
  const em = r.tf(0.3, 0.3);
  const plate = lp.form(dSmooth([r.tf(-0.8, 0.1), r.tf(0.9, 0.1), r.tf(0.8, 0.46), r.tf(0.2, 0.6), r.tf(-0.7, 0.46)]), LG.plate, {
    sh: 16,
    line: 2.4,
    rim: 1.6,
    shade: deep ? lp.dark(LG.plate, 0.5 + deep) : undefined,
    inner: lp.glow(em[0], em[1], 30, LG.lens, 0.6) + leafD(lp, add(em, [-8, 12]), 40, 34, '#4cd870', 1.6),
  });
  out += plate + lp.form(bandD(r, 0.74, 0.86), LG.joint, { sh: 5, line: 2.2 }) + `<circle cx="${r1(r.tf(0.3, 0.8)[0])}" cy="${r1(r.tf(0.3, 0.8)[1])}" r="6" fill="${LG.gold}" stroke="${INK}" stroke-width="1.8"/>`;
  // Neck and the helmeted head.
  out += limb(lp, r.N, r.head, BOT.neckW * U, BOT.neckW * U * 0.9, LG.joint, { sh: 0.4, rim: 1.4 });
  const hp = lp.local(false, r.headRot);
  const fc = 6 + 24 * Math.min(1, Math.max(0, (r.turn - 0.2) / 0.6));
  const helm = hp.form('M-46 14Q-54 -46 -2 -52Q50 -50 48 6L42 30Q2 44 -40 32Z', LG.olive, {
    sh: 22,
    hatch: deep ? 2 : 1,
    rim,
    line: 2.8,
    shade: deep ? hp.dark(LG.olive, 0.5 + deep) : undefined,
    inner: `<path d="M-50 -14Q0 -28 50 -14" fill="none" stroke="${LG.dark}" stroke-width="5"/>` + hp.brush([[-30, -36], [-6, -46], [20, -44]], 6, '#c8e098', [0.3, 0.4], 0.5),
  });
  const visor = hp.form(`M${fc - 40} -6Q${fc} -14 ${fc + 34} -8Q${fc + 40} 6 ${fc + 32} 18Q${fc} 24 ${fc - 38} 18Z`, LG.visor, { line: 2.4 });
  const lens = hp.glow(fc + 6, 4, 34, LG.lens, 0.85) + `<circle cx="${fc + 6}" cy="4" r="11" fill="${LG.lens}"/><circle cx="${fc + 6}" cy="4" r="4.5" fill="#eafff0"/>`;
  const antenna = hp.brush([[-24, -48], [-28, -66], [-30, -80]], 4.5, INK, [0.05, 0.05]) + hp.glow(-30, -84, 14, LG.lens, 0.8) + `<circle cx="-30" cy="-84" r="5" fill="${LG.lens}" stroke="${INK}" stroke-width="1.8"/>`;
  const halo = hp.glow(4, -100, 52, LG.lens, 0.55, 20) + `<ellipse cx="4" cy="-100" rx="36" ry="9" fill="none" stroke="${LG.lens}" stroke-width="5"/><ellipse cx="4" cy="-100" rx="36" ry="9" fill="none" stroke="#e8fff0" stroke-width="1.6"/>`;
  out += at(r.head[0], r.head[1], 1, antenna + helm + visor + lens + halo, false, r.headRot);
  // Gold shoulder pads, the far one first.
  const pad = (i: 0 | 1) => {
    const p = r.sh[i];
    const w = aw[0] * (i ? 0.95 : 1.1);
    return lp.form(`M${r1(p[0] - w)} ${r1(p[1] + 8)}Q${r1(p[0] - w)} ${r1(p[1] - w * 0.9)} ${r1(p[0])} ${r1(p[1] - w * 0.92)}Q${r1(p[0] + w)} ${r1(p[1] - w * 0.9)} ${r1(p[0] + w)} ${r1(p[1] + 8)}Q${r1(p[0])} ${r1(p[1] - 6)} ${r1(p[0] - w)} ${r1(p[1] + 8)}Z`, LG.gold, { sh: w * 0.5, hatch: 1, line: 2.4, rim: rimOf(i), shade: i || deep ? lp.dark(LG.gold, 0.62) : undefined });
  };
  out += pad(1);
  out += arm(0) + pad(0);
  if (o.gear === 'sapling') out += at(lerp(r.wr[0], r.wr[1], 0.5)[0] + 10, lerp(r.wr[0], r.wr[1], 0.5)[1] + 4, 0.9, sapling(lp));
  return at(x, y, s, out, o.flip);
}

/** A leaf from its base `b` along `deg` (as `dir` measures it), `l` long, with a midrib. */
export function leafD(pen: Pen, b: P, deg: number, l: number, color: string, line = 2): string {
  const d = dir(deg);
  const n = perp(d);
  const tip = add(b, mul(d, l));
  const m1 = add(add(b, mul(d, l * 0.45)), mul(n, l * 0.3));
  const m2 = add(add(b, mul(d, l * 0.45)), mul(n, -l * 0.3));
  const shape = `M${r1(b[0])} ${r1(b[1])}Q${r1(m1[0])} ${r1(m1[1])} ${r1(tip[0])} ${r1(tip[1])}Q${r1(m2[0])} ${r1(m2[1])} ${r1(b[0])} ${r1(b[1])}Z`;
  return pen.form(shape, color, { sh: l * 0.12, line, inner: pen.brush([b, lerp(b, tip, 0.5), tip], Math.max(1.4, l * 0.04), mix(color, INK, 0.45), [0.1, 0.6], 0.7) });
}

/* ---------------- the Golden Fleece ---------------- */

/**
 * A closed outline through `pts` (clockwise on screen) with a curly, scalloped edge: bumps about `bump`
 * across, like the edge of a fleece.
 */
export function curlyD(pts: P[], bump: number, seed = 3): string {
  const rand = rng(seed);
  const ring: P[] = [];
  const n = pts.length;
  for (let i = 0; i < n; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % n];
    const k = Math.max(1, Math.round(Math.hypot(b[0] - a[0], b[1] - a[1]) / (bump * 1.5)));
    for (let j = 0; j < k; j++) ring.push(lerp(a, b, j / k));
  }
  let d = `M${r1(ring[0][0])} ${r1(ring[0][1])}`;
  for (let i = 1; i <= ring.length; i++) {
    const q = ring[i % ring.length];
    const p = ring[i - 1];
    const rr = Math.max(4, Math.hypot(q[0] - p[0], q[1] - p[1]) * (0.52 + rand() * 0.18));
    d += `A${r1(rr)} ${r1(rr)} 0 0 1 ${r1(q[0])} ${r1(q[1])}`;
  }
  return d + 'Z';
}

/** One hanging lock of fleece from (x, y), `l` long, swaying `sway` sideways and ending in a little hook. */
function lockPts(x: number, y: number, l: number, sway: number): P[] {
  return [
    [x, y],
    [x + sway * 0.5, y + l * 0.3],
    [x - sway * 0.4, y + l * 0.62],
    [x + sway * 0.2, y + l * 0.9],
    [x + sway * 0.9, y + l],
    [x + sway * 1.1, y + l * 0.86],
  ];
}

/** The Fleece's texture as a pattern fill (`url(#...)`): wavy hanging locks, `size` units per tile. */
export function curlFill(pen: Pen, size = 40): string {
  const id = pen.shared(`curl${size}`, (id) => {
    const k = size / 40;
    const spots: [number, number, number][] = [
      [8, 2, 1],
      [28, 20, -1],
      [-12, 20, -1],
      [48, 2, 1],
      [8, 38, 1],
      [48, 38, 1],
    ];
    const dark = spots.map(([x, y, sw]) => brushD(lockPts(x * k, y * k, 30 * k, 8 * sw * k), 4.2 * k, [0.1, 0.4])).join('');
    const lit = spots.map(([x, y, sw]) => brushD(lockPts(x * k - 4 * k, y * k + 2 * k, 22 * k, 7 * sw * k).slice(0, 4), 2.4 * k, [0.3, 0.4])).join('');
    return `<pattern id="${id}" width="${size}" height="${r1(size * 0.9)}" patternUnits="userSpaceOnUse"><path d="${dark}" fill="#9a5a12" opacity=".55"/><path d="${lit}" fill="#fff6c8" opacity=".7"/></pattern>`;
  });
  return `url(#${id})`;
}

export interface FleeceOpts {
  /** Shadow depth (default a quarter of the shape's height). */
  sh?: number;
  rim?: number;
  line?: number;
  /** Curl size (default 40). */
  curl?: number;
  /** The green seeds glowing in it (positions, in the same coordinates). */
  seeds?: P[];
  /** Seeds awake: brighter and with glints (the secret ending). */
  awake?: boolean;
  /** Glow around it (0 none). */
  glow?: number;
  seed?: number;
  bump?: number;
  /** Fold lines (brush strokes) across it. */
  folds?: P[][];
  /** How much its edges darken (default 0.55). */
  edge?: number;
}

/**
 * The Golden Fleece (or a piece of it): a living golden cloak of curls in the shape of `pts` (clockwise
 * on screen), its edge curly, its curls catching the light, green seeds glowing in it.
 */
export function fleeceGN(pen: Pen, pts: P[], o: FleeceOpts = {}): string {
  let minY = Infinity;
  let maxY = -Infinity;
  let minX = Infinity;
  let maxX = -Infinity;
  let cx = 0;
  let cy = 0;
  for (const p of pts) {
    minY = Math.min(minY, p[1]);
    minX = Math.min(minX, p[0]);
    maxX = Math.max(maxX, p[0]);
    maxY = Math.max(maxY, p[1]);
    cx += p[0] / pts.length;
    cy += p[1] / pts.length;
  }
  const h = maxY - minY;
  const d = curlyD(pts, o.bump ?? 22, o.seed ?? 3);
  const seedC = '#7dff9a';
  let seeds = '';
  for (const [sx, sy] of o.seeds ?? []) {
    seeds += pen.glow(sx, sy, o.awake ? 30 : 18, seedC, o.awake ? 1 : 0.8) + `<circle cx="${r1(sx)}" cy="${r1(sy)}" r="${o.awake ? 6 : 4.5}" fill="${o.awake ? '#e8fff0' : seedC}" stroke="#1a5a2a" stroke-width="1.4"/>`;
    if (o.awake) seeds += spark(pen, sx, sy, 16, '#f0fff4', 0.9);
  }
  const folds = (o.folds ?? []).map((f) => [f, 4] as [P[], number]);
  const edge = pen.rad([[0.55, "#7a3a08", 0], [1, "#7a3a08", o.edge ?? 0.55]], 0.5, 0.45, 0.62);
  const box = `x="${r1(minX - 40)}" y="${r1(minY - 40)}" width="${r1(maxX - minX + 80)}" height="${r1(h + 80)}"`;
  const inner = `<rect ${box} fill="${curlFill(pen, o.curl ?? 40)}"/><rect ${box} fill="${edge}"/>` + (folds.length ? pen.brushes(folds, '#7a4208', [0.2, 0.5], 0.55) : '') + seeds;
  const paint = pen.rad(
    [
      [0, '#fff6c8'],
      [0.45, '#ffd45a'],
      [1, '#e8a22a'],
    ],
    0.45,
    0.35,
    0.75,
  );
  return (o.glow ? pen.glow(cx, cy, h * 1.2 * o.glow, '#ffd166', 0.7) : '') + pen.form(d, '#ffc844', { sh: o.sh ?? h * 0.25, hatch: 1, rim: o.rim ?? 2.2, line: o.line ?? 3, paint, shade: '#c47a1c', inner });
}

/**
 * A living gold vine of the Fleece along `pts`, `w` thick, ending in a curl (`curl` = its radius, turning
 * `spin` = 1 clockwise or -1 the other way), with a glow and a few gold leaves.
 */
export function goldVine(pen: Pen, pts: P[], w: number, o: { curl?: number; spin?: 1 | -1; leaves?: number; glow?: number } = {}): string {
  const p = pts.slice();
  const c = o.curl ?? w * 2.4;
  const spin = o.spin ?? 1;
  if (c > 0) {
    const last = p[p.length - 1];
    const dv = unit(sub(last, p[p.length - 2]));
    const ctr = add(last, mul(perp(dv), c * spin));
    const a0 = Math.atan2(last[1] - ctr[1], last[0] - ctr[0]);
    for (let i = 1; i <= 5; i++) {
      const t = i / 5;
      const a = a0 - spin * t * Math.PI * 1.5;
      const rr = c * (1 - t * 0.55);
      p.push([ctr[0] + Math.cos(a) * rr, ctr[1] + Math.sin(a) * rr]);
    }
  }
  let out = o.glow ? pen.brush(p, w * 3.2, '#ffc844', [0.05, 0.6], 0.22 * o.glow) : '';
  out += pen.brush(p, w + 5, INK, [0.03, 0.85]) + pen.brush(p, w, '#e8a828', [0.03, 0.85]) + pen.brush(p.map((q) => add(q, [-w * 0.18, -w * 0.18])), w * 0.34, '#fff2b0', [0.1, 0.8], 0.85);
  const n = o.leaves ?? 2;
  for (let i = 0; i < n; i++) {
    const k = Math.floor(((i + 1) * pts.length) / (n + 1));
    const a = pts[Math.min(pts.length - 1, k)];
    const b = pts[Math.max(0, k - 1)];
    const d = unit(sub(a, b));
    const deg = (Math.atan2(d[0], d[1]) * 180) / Math.PI + (i % 2 ? 60 : -60);
    out += leafD(pen, a, deg, w * 2.6, '#f0c040', 2);
  }
  return out;
}

/** Aeëtes's pose as the Golden King: arms flung up and wide, head back, laughing. */
export const KING_SPREAD: Pose = { turn: 0.18, tilt: -6, armN: [-128, -160], armF: [128, 160], legN: { to: [-0.3, 0.94] }, legF: { to: [0.32, 0.93] }, handN: 'open', handF: 'open' };

/**
 * AEËTES, THE GOLDEN KING: Aeëtes wearing the Golden Fleece. The Fleece spreads behind him like a great
 * golden cloak, gold vines curl out of his shoulders, and over his gold coat he wears the Fleece's armour:
 * a breastplate with the crystal clasp over the glowing green seed-core, spiked pauldrons and a spiky
 * crown with a green gem. Feet at (x, y), facing right (he is drawn nearly from the front).
 */
export function goldenKing(pen: Pen, x: number, y: number, s: number, o: CastOpts = {}): string {
  const pose = typeof o.pose === 'string' ? POSES[o.pose] : (o.pose ?? KING_SPREAD);
  const r = rig(TALL, pose);
  const [L, R] = r.sh;
  // The Fleece as a cloak, spreading out behind him from the shoulders to the floor.
  const cloakPts: P[] = [
    [L[0] - 300, L[1] - 170],
    [L[0] - 150, L[1] - 80],
    [L[0] + 10, L[1] - 18],
    [R[0] - 10, R[1] - 18],
    [R[0] + 150, R[1] - 80],
    [R[0] + 300, R[1] - 170],
    [R[0] + 410, R[1] + 40],
    [R[0] + 470, R[1] + 260],
    [R[0] + 400, -40],
    [R[0] + 250, 0],
    [R[0] + 100, -50],
    [36, -260],
    [-36, -260],
    [L[0] - 100, -50],
    [L[0] - 250, 0],
    [L[0] - 400, -40],
    [L[0] - 470, L[1] + 260],
    [L[0] - 410, L[1] + 40],
  ];
  const seeds: P[] = [
    [L[0] - 240, L[1] + 40],
    [L[0] - 160, L[1] + 230],
    [L[0] - 300, L[1] + 300],
    [R[0] + 230, R[1] + 30],
    [R[0] + 170, R[1] + 250],
    [R[0] + 300, R[1] + 300],
    [L[0] - 90, -120],
    [R[0] + 120, -100],
  ];
  const folds: P[][] = [
    [
      [L[0] - 30, L[1] + 20],
      [L[0] - 120, L[1] + 200],
      [L[0] - 170, -60],
    ],
    [
      [R[0] + 30, R[1] + 20],
      [R[0] + 120, R[1] + 200],
      [R[0] + 170, -60],
    ],
    [
      [L[0] - 200, L[1] - 30],
      [L[0] - 280, L[1] + 150],
      [L[0] - 300, L[1] + 330],
    ],
    [
      [R[0] + 200, R[1] - 30],
      [R[0] + 280, R[1] + 150],
      [R[0] + 300, R[1] + 330],
    ],
  ];
  let out = fleeceGN(pen, cloakPts, { seeds, folds, sh: 90, rim: 3, line: 3.4, curl: 40, bump: 16, glow: 0.9, seed: 7 });
  // Gold vines curling out of his shoulders.
  const v = (base: P, k: number, spin: 1 | -1, offs: P[], w: number) => goldVine(pen, [base, ...offs.map((q) => add(base, [q[0] * k, q[1]]))], w, { spin, curl: w * 2.2, leaves: 1 });
  for (const [base, k] of [
    [L, -1],
    [R, 1],
  ] as [P, number][]) {
    const spin = (k > 0 ? 1 : -1) as 1 | -1;
    out += v(base, k, spin, [
      [60, -26],
      [130, 14],
      [200, -34],
      [270, 4],
    ], 20);
    out += v(add(base, [0, 30]), k, (-spin) as 1 | -1, [
      [50, 60],
      [110, 150],
      [190, 160],
      [250, 230],
    ], 16);
  }
  out += aeetes(pen, 0, 0, 1, { pose, mood: o.mood ?? 'scheming', look: o.look, rim: o.rim ?? 2.6 });
  // The armour: a gold breastplate engraved with fleece curls, the crystal clasp over the seed-core.
  const gold = '#ffd166';
  const plateGrad = pen.lin(
    [
      [0, '#fff4c0'],
      [0.5, '#ffd166'],
      [1, '#c88a1a'],
    ],
    0,
    0,
    1,
    1,
  );
  const core = r.tf(0.12, 0.3);
  const curls = [
    [-0.6, 0.18],
    [0.75, 0.2],
    [-0.45, 0.48],
    [0.6, 0.5],
  ]
    .map(([a, b]) => {
      const q = r.tf(a, b);
      return `M${r1(q[0] - 10)} ${r1(q[1] + 3)}a10 9 0 1 1 17 6a6 5 0 1 1 -8 -4`;
    })
    .join('');
  out += pen.form(dSmooth([r.tf(-1.05, 0.04), r.tf(1.05, 0.04), r.tf(0.95, 0.38), r.tf(0.7, 0.66), r.tf(0.12, 0.76), r.tf(-0.55, 0.66), r.tf(-0.95, 0.38)]), gold, {
    sh: 26,
    hatch: 1,
    line: 3,
    rim: 2.4,
    paint: plateGrad,
    shade: '#b8741a',
    inner: `<path d="${curls}" fill="none" stroke="#9a5a12" stroke-width="3.4" opacity=".75"/>` + pen.brush([r.tf(-0.8, 0.12), r.tf(-0.2, 0.08), r.tf(0.5, 0.14)], 6, '#ffffff', [0.3, 0.4], 0.7),
  });
  out += pen.glow(core[0], core[1], 90, '#7dff9a', 0.9) + pen.glow(core[0], core[1], 40, '#ffffff', 0.7);
  const cs = 30;
  out += pen.form(dPoly([add(core, [0, -cs * 1.25]), add(core, [cs, 0]), add(core, [0, cs * 1.25]), add(core, [-cs, 0])]), '#e8fff0', {
    line: 2.8,
    inner: `<circle cx="${r1(core[0])}" cy="${r1(core[1])}" r="13" fill="#7dff9a"/><circle cx="${r1(core[0] - 4)}" cy="${r1(core[1] - 4)}" r="5" fill="#ffffff"/><path d="M${r1(core[0] - cs)} ${r1(core[1])}L${r1(core[0] + cs)} ${r1(core[1])}M${r1(core[0])} ${r1(core[1] - cs * 1.25)}L${r1(core[0] + cs * 0.4)} ${r1(core[1])}L${r1(core[0])} ${r1(core[1] + cs * 1.25)}" fill="none" stroke="#9ad8b0" stroke-width="2"/>`,
  });
  // Spiked pauldrons on both shoulders.
  for (const i of [1, 0] as const) {
    const p = r.sh[i];
    const k = i ? 1 : -1;
    const w = 52;
    const spikes = [-0.55, 0, 0.55].map((t) => {
      const bx = p[0] + t * w * 0.9;
      const by = p[1] - w * 0.55 * (1 - Math.abs(t) * 0.4);
      const tip: P = [bx + k * 18 + t * 30, by - 46 + Math.abs(t) * 12];
      return `M${r1(bx - 11)} ${r1(by + 6)}L${r1(tip[0])} ${r1(tip[1])}L${r1(bx + 11)} ${r1(by + 6)}Z`;
    });
    out += pen.form(spikes.join(''), gold, { sh: 8, line: 2.4, rim: 1.8, shade: '#b8741a' });
    out += pen.form(`M${r1(p[0] - w)} ${r1(p[1] + 26)}Q${r1(p[0] - w * 1.05)} ${r1(p[1] - w * 0.75)} ${r1(p[0])} ${r1(p[1] - w * 0.78)}Q${r1(p[0] + w * 1.05)} ${r1(p[1] - w * 0.75)} ${r1(p[0] + w)} ${r1(p[1] + 26)}Q${r1(p[0])} ${r1(p[1] + 6)} ${r1(p[0] - w)} ${r1(p[1] + 26)}Z`, gold, {
      sh: 22,
      hatch: 1,
      line: 2.8,
      rim: 2.2,
      paint: plateGrad,
      shade: '#b8741a',
      inner: `<path d="M${r1(p[0] - w * 0.9)} ${r1(p[1] + 4)}Q${r1(p[0])} ${r1(p[1] - 16)} ${r1(p[0] + w * 0.9)} ${r1(p[1] + 4)}" fill="none" stroke="#9a5a12" stroke-width="3" opacity=".7"/>`,
    });
  }
  // The crown: tall gold spikes and a green gem, set on his silver hair.
  const hp = pen.local(false, r.headRot);
  const crown =
    hp.glow(4, -74, 70, '#ffd166', 0.6) +
    hp.form('M-40 -38L-50 -84L-26 -62L-14 -104L0 -68L14 -106L28 -64L50 -86L42 -38Q0 -50 -40 -38Z', gold, {
      sh: 14,
      hatch: 1,
      line: 2.8,
      rim: 2.2,
      paint: plateGrad,
      shade: '#b8741a',
      inner: `<path d="M-42 -46Q0 -58 44 -46" fill="none" stroke="#9a5a12" stroke-width="4"/>`,
    }) +
    hp.glow(1, -58, 22, '#7dff9a', 0.9) +
    hp.form('M1 -70L10 -58L1 -46L-8 -58Z', '#7dff9a', { line: 2.2, inner: '<circle cx="-1" cy="-61" r="2.6" fill="#fff"/>' });
  out += at(r.head[0], r.head[1], 1, crown, false, r.headRot);
  return at(x, y, s, out);
}

/* ---------------- Celestia ---------------- */

/** Celestia's petal colours, round the flower: hello-blue, gold, pink and green. */
export const PETALS = ['#5e9bff', '#ffd166', '#ff6fcf', '#7dff9a'];

export interface CelestiaOpts {
  /** Stem length below the flower (0 = no stem). */
  stem?: number;
  /** A little one: fewer, simpler petals, no hatching. */
  mini?: boolean;
  /** How strongly she glows (default 1). */
  glow?: number;
  /** Tilt of the flower (degrees). */
  rot?: number;
  /** The ink line weight (thinner far away). */
  line?: number;
  /** Bend of the stem (sideways, in units). */
  sway?: number;
}

/**
 * Celestia in bloom: a glowing bulb (white, pale gold and pink) in two rings of long petals in her four
 * colours, on a thick curling vine stem with big leaves. The bulb is centred at (x, y); the flower is
 * about 360 across at scale 1, seen a little from below.
 */
export function celestia(pen: Pen, x: number, y: number, s: number, o: CelestiaOpts = {}): string {
  const lp = pen.local(false, o.rot ?? 0);
  const g = o.glow ?? 1;
  const mini = !!o.mini;
  const line = o.line ?? (mini ? 2.6 : 3);
  let out = '';
  // The stem: a thick vine curling down to the ground, with leaves.
  const stem = o.stem ?? 0;
  if (stem) {
    const sw = o.sway ?? 30;
    const pts: P[] = [
      [0, 40],
      [-sw, stem * 0.35],
      [sw * 0.6, stem * 0.7],
      [0, stem],
    ];
    out += lp.brush(pts, mini ? 30 : 44, INK, [0.02, 0.02]) + lp.brush(pts, mini ? 22 : 34, '#2f7a3a', [0.02, 0.02]) + lp.brush(pts.map((p) => add(p, [-6, 0])), mini ? 6 : 9, '#7cd06a', [0.1, 0.2], 0.7);
    if (!mini) {
      out += leafD(lp, [-sw * 0.6, stem * 0.45], -70, 150, '#3e9a48', 3) + leafD(lp, [sw * 0.4, stem * 0.62], 64, 170, '#4aae52', 3) + leafD(lp, [-4, stem * 0.88], -110, 120, '#358a40', 3);
    } else out += leafD(lp, [-sw * 0.6, stem * 0.5], -70, 100, '#3e9a48', 2.6) + leafD(lp, [sw * 0.4, stem * 0.7], 64, 110, '#4aae52', 2.6);
  }
  out += lp.glow(0, 0, 320, '#ffe6a0', 0.6 * g) + lp.glow(0, 0, 210, '#ff8ad8', 0.4 * g);
  // Two rings of long glowing petals (the back ring longer and deeper in colour), each a little different,
  // their tips curling; the whole flower seen a little from below (squashed).
  let head = '';
  const petal = (deg: number, r0: number, r1v: number, w: number, color: string, back: boolean, curl: number) => {
    const q = lp.local(false, deg);
    const mid = (r0 + r1v) * 0.5;
    const tx = curl * w * 0.22;
    const d = `M0 ${-r0}C${r1(-w)} ${r1(-mid + w * 0.3)} ${r1(-w * 0.6 + tx)} ${r1(-r1v + w * 0.5)} ${r1(tx)} ${-r1v}C${r1(w * 0.75 + tx)} ${r1(-r1v + w * 0.45)} ${r1(w)} ${r1(-mid + w * 0.2)} 0 ${-r0}Z`;
    // Petals glow from the heart outward: pale at the base, full colour at the tip (one gradient per colour).
    const gid = q.shared(`pt${color.slice(1)}${back ? 'b' : ''}`, (id) => `<linearGradient id="${id}" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="${mix(color, '#ffffff', back ? 0.35 : 0.7)}"/><stop offset=".55" stop-color="${mix(color, '#ffffff', back ? 0.1 : 0.25)}"/><stop offset="1" stop-color="${color}"/></linearGradient>`);
    const vein = q.brush([[0, -r0 - 6], [w * 0.08, -mid], [tx * 0.8, -r1v + 18]], mini ? 2 : 3, '#ffffff', [0.1, 0.5], back ? 0.4 : 0.7);
    const veins = mini || back ? '' : q.brushes([[[[0, -mid + 10], [-w * 0.35, -mid - 30]], 1.6], [[[0, -mid + 30], [w * 0.4, -mid - 6]], 1.6]], mix(color, INK, 0.35), [0.2, 0.5], 0.45);
    return at(0, 0, 1, q.form(d, color, { sh: w * (back ? 0.5 : 0.35), hatch: back && !mini ? 1 : 0, line: back ? line : line * 0.85, rim: mini ? 0 : 2.4, paint: `url(#${gid})`, shade: q.dark(color, back ? 0.7 : 0.45), inner: vein + veins }), false, deg);
  };
  const n = mini ? 6 : 8;
  for (let i = 0; i < n; i++) head += petal((i * 360) / n + 180 / n + ((i * 7) % 5) - 2, 30, (mini ? 150 : 178) * (0.9 + ((i * 37) % 7) / 30), mini ? 62 : 64, PETALS[(i + 1) % 4], true, (i % 3) - 1);
  for (let i = 0; i < n; i++) head += petal((i * 360) / n + ((i * 5) % 4) - 1.5, 26, (mini ? 118 : 140) * (0.92 + ((i * 53) % 5) / 30), mini ? 56 : 58, PETALS[i % 4], false, ((i + 1) % 3) - 1);
  // Stamens: little glowing beads on fine stalks round the bulb.
  if (!mini) {
    const st: [P[], number][] = [];
    let beads = '';
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2 + 0.2;
      const e: P = [Math.cos(a) * 78, Math.sin(a) * 78];
      st.push([[[Math.cos(a) * 40, Math.sin(a) * 40], e], 3]);
      beads += `<circle cx="${r1(e[0])}" cy="${r1(e[1])}" r="5.5" fill="#fff6c8" stroke="${INK}" stroke-width="1.6"/>`;
    }
    head += lp.brushes(st, '#ffe6a0', [0.1, 0.1]) + beads;
  }
  // The bulb: white at the heart, pale gold, then pink at the edge.
  const bulb = lp.rad(
    [
      [0, '#ffffff'],
      [0.45, '#fff0b8'],
      [0.8, '#ffb0e0'],
      [1, '#ff6fcf'],
    ],
    0.42,
    0.38,
    0.62,
  );
  head += lp.form(circ(0, 0, 54), '#ffd8ec', { sh: 10, line: line + 0.4, paint: bulb, shade: '#ff9ad8', inner: `<ellipse cx="-18" cy="-20" rx="15" ry="9" fill="#fff" opacity=".9" transform="rotate(-30 -18 -20)"/>` });
  head += lp.glow(0, 0, 110, '#ffffff', 0.75 * g);
  out += `<g transform="scale(1 .84)">${head}</g>`;
  return at(x, y, s, out, false, o.rot ?? 0);
}

/* ---------------- the Gardeners' light-words ---------------- */

export type LightWord = 'sky' | 'grow' | 'friend' | 'home';

/** The colours of the four light-words of the secret ending. */
export const WORD_COLORS: Record<LightWord, string> = { sky: '#5ec8ff', grow: '#7dff9a', friend: '#ff6fcf', home: '#ffd166' };

const WORD_D: Record<LightWord, string> = {
  sky: 'M-26 10Q-26 -24 0 -26Q26 -24 26 10M-12 10Q-12 -10 0 -11Q12 -10 12 10M0 22V22',
  grow: 'M0 26V-10M0 6Q-20 0 -22 -18Q-4 -16 0 -2M0 -10Q2 -26 18 -30Q20 -12 2 -6',
  friend: 'M-8 0A14 14 0 1 1 -8 0.1M8 0A14 14 0 1 0 8 0.1',
  home: 'M-26 2L0 -24L26 2M-16 -6V24H16V-6M-4 24V10H4V24',
};

/** A Gardener light-word written in the air in glowing light, centred at (x, y), about 60 across at scale 1. */
export function lightWord(pen: Pen, x: number, y: number, s: number, word: LightWord, op = 1): string {
  const c = WORD_COLORS[word];
  const d = word === 'friend' ? `${circ(-10, 0, 15)}${circ(10, 0, 15)}` : WORD_D[word];
  const body = pen.glow(0, 0, 60, c, 0.75) + `<path d="${d}" fill="none" stroke="${c}" stroke-width="9" opacity=".85"/><path d="${d}" fill="none" stroke="#ffffff" stroke-width="3"/>`;
  return at(x, y, s, `<g${op < 1 ? ` opacity="${op}"` : ''}>${body}</g>`);
}

/* ---------------- the tree-temple's roots ---------------- */

/** The outline of a root along a smooth curve through `pts`, `w0` wide at the start and `w1` at the end. */
export function rootOutline(pts: P[], w0: number, w1: number): { d: string; mid: P[]; side: (t: number) => P[] } {
  const s = spline(pts, 5);
  const n = s.length;
  const cum = [0];
  for (let i = 1; i < n; i++) cum.push(cum[i - 1] + Math.hypot(s[i][0] - s[i - 1][0], s[i][1] - s[i - 1][1]));
  const total = cum[n - 1] || 1;
  const nrm = (i: number) => perp(unit(sub(s[Math.min(n - 1, i + 1)], s[Math.max(0, i - 1)])));
  const half = (i: number) => (w0 + (w1 - w0) * (cum[i] / total)) / 2;
  // `side(t)`: the curve offset across the root (t = -1 one edge, 1 the other).
  const side = (t: number) => s.map((p, i) => add(p, mul(nrm(i), half(i) * t)));
  return { d: dPoly([...side(1), ...side(-1).reverse()]), mid: s, side };
}

/**
 * A great gnarled root of the tree-temple (or any big organic limb): a tapered shape along `pts`, shaded
 * across its length, with bark grain running along it and a lit edge.
 */
export function rootGN(pen: Pen, pts: P[], w0: number, w1: number, color: string, o: { rim?: number; line?: number; hatch?: 0 | 1 | 2 | 3; shade?: string; grain?: number; glow?: string; sh?: number } = {}): string {
  const { d, side } = rootOutline(pts, w0, w1);
  const grain: [P[], number][] = [];
  const k = o.grain ?? 4;
  for (let i = 0; i < k; i++) {
    const t = -0.75 + (1.5 * (i + 0.5)) / k;
    const line = side(t);
    const a = Math.floor(line.length * ((i * 0.37) % 0.3));
    const b = Math.min(line.length, a + Math.floor(line.length * 0.7));
    grain.push([line.slice(a, b).filter((_, j) => j % 2 === 0), Math.max(w0, w1) * 0.05 + 1.4]);
  }
  const inner = pen.brushes(grain, INK, [0.25, 0.45], 0.45) + (o.glow ? pen.brushes(grain.slice(0, 2).map(([p, w]) => [p, w * 0.7] as [P[], number]), o.glow, [0.3, 0.5], 0.55) : '');
  const ax = sub(pts[pts.length - 1], pts[0]);
  return pen.form(d, color, { sh: o.sh ?? Math.max(w0, w1) * 0.42, hatch: o.hatch ?? 2, rim: o.rim ?? 2.2, line: o.line ?? 3, axis: ax, shade: o.shade, inner });
}

/* ---------------- the Gorgon's old lifeboat ---------------- */

/**
 * The Gorgon's old lifeboat (Brennus's ride): a stubby olive capsule with a big round porthole, the red
 * Legion gear on its nose and a battered engine at the back. Centred at (x, y), nose to the right, about
 * 520 long at scale 1; `rot` tilts it (+ noses down).
 */
export function lifeboat(pen: Pen, x: number, y: number, s: number, rot = 0, o: { dent?: boolean } = {}): string {
  const lp = pen.local(false, rot);
  const olive = '#5a6a3a';
  let out = '';
  // The engine pod at the back, its nozzle scorched and dark.
  out += lp.form('M-300 -56L-236 -70V70L-300 56Z', '#3a3a34', { sh: 30, hatch: 2, line: 3, rim: 2 });
  out += lp.form('M-326 -44H-296V44H-326Z', '#2a2620', { sh: 10, line: 2.6, inner: lp.glow(-312, 0, 40, '#ff8a3a', 0.6) });
  const seams = `<path d="M-150 -96V96M-40 -104V104M120 -92V92" fill="none" stroke="${INK}" stroke-width="3" opacity=".55"/><path d="M-250 30Q0 50 250 26" fill="none" stroke="#a8202a" stroke-width="12"/>`;
  const rivets = [-200, -120, -70, 0, 70, 160].map((rx) => `<circle cx="${rx}" cy="-62" r="4" fill="${INK}" opacity=".6"/>`).join('');
  const scorch = o.dent ? `<path d="M120 -40Q200 -60 250 -10Q220 40 150 50Q170 0 120 -40Z" fill="${INK}" opacity=".35"/>` + lp.brushes([[[[60, -80], [100, -50], [96, -20]], 3], [[[180, 40], [210, 60]], 3]], INK, [0.2, 0.5], 0.7) : '';
  out += lp.form('M-250 -80Q-100 -112 120 -104Q250 -96 284 -20Q296 20 268 52Q220 100 60 106Q-120 108 -250 82Q-268 0 -250 -80Z', olive, {
    sh: 70,
    hatch: 2,
    line: 3.4,
    rim: 2.6,
    axis: [1, 0],
    inner: seams + rivets + scorch + lp.brush([[-220, -78], [-40, -96], [140, -90]], 8, '#b8c890', [0.2, 0.3], 0.55),
  });
  // The porthole, glowing a little from inside.
  out += lp.form(circ(30, -18, 40), '#3a4426', { sh: 10, line: 3, rim: 1.6 }) + lp.form(circ(30, -18, 28), '#8fd8ff', { line: 2.6, inner: lp.brush([[12, -30], [24, -40], [40, -38]], 6, '#ffffff', [0.3, 0.3], 0.9) });
  // The red gear on its nose.
  let gear = '';
  for (let i = 0; i < 8; i++) gear += `<rect x="-5" y="-27" width="10" height="10" fill="#c8282e" transform="translate(236 4) rotate(${i * 45})"/>`;
  out += gear + `<circle cx="236" cy="4" r="20" fill="#c8282e" stroke="${INK}" stroke-width="2.6"/><circle cx="236" cy="4" r="7" fill="#2a2018"/>`;
  return at(x, y, s, out, false, rot);
}
