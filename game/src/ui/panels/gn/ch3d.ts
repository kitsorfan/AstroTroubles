/**
 * Graphic-novel pieces for the game's finale (the Golden Fleece panels): Brennus's green Legion robots,
 * the Golden Fleece itself (a living cloak of golden curls with green seeds in it), Celestia in bloom
 * (big or little), the Gardeners' light-words, Captain Argus's science officer Dr. Hypatia, and the
 * Gorgon's old lifeboat. All of them draw through a `Pen` like the rest of the kit.
 */
import { add, at, brushD, dir, dPoly, dSmooth, INK, lerp, mix, mul, type P, type Pen, perp, r1, rng, spline, sub, unit } from './core';
import { bandD, type Build, hand, limb, type Pose, rig, type Rig, torso, U, ADULT } from './body';
import { coatSkirt, figure, type CastOpts, type Outfit, POSES } from './cast';
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

/** A spiral curl (for the Fleece's texture), centred at (x, y), `r` across, as brush-stroke path data. */
function curlStroke(x: number, y: number, r: number, w: number, turn = 1): string {
  const pts: P[] = [];
  for (let i = 0; i <= 8; i++) {
    const t = i / 8;
    const a = Math.PI * (0.9 + t * 1.6 * turn);
    const rr = r * (1 - t * 0.6);
    pts.push([x + Math.cos(a) * rr, y + Math.sin(a) * rr * 0.85]);
  }
  return brushD(pts, w, [0.15, 0.5]);
}

/** The Fleece's curly texture as a pattern fill (`url(#...)`), `size` units per tile. */
export function curlFill(pen: Pen, size = 40): string {
  const id = pen.shared(`curl${size}`, (id) => {
    const k = size / 40;
    const curls = [
      [12, 12],
      [32, 31],
      [-8, 31],
      [52, 12],
    ]
      .map(([cx, cy], i) => curlStroke(cx * k, cy * k, 10 * k, 3.4 * k, i % 2 ? 0.9 : 1.1))
      .join('');
    const lights = [
      [12, 12],
      [32, 31],
      [-8, 31],
      [52, 12],
    ]
      .map(([cx, cy]) => brushD([[cx * k - 9 * k, cy * k - 6 * k], [cx * k - 2 * k, cy * k - 11 * k], [cx * k + 7 * k, cy * k - 9 * k]], 2.6 * k, [0.3, 0.4]))
      .join('');
    return `<pattern id="${id}" width="${size}" height="${r1(size * 0.95)}" patternUnits="userSpaceOnUse" patternTransform="rotate(-10)"><path d="${curls}" fill="#9a5a12" opacity=".75"/><path d="${lights}" fill="#fff6c8" opacity=".8"/></pattern>`;
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
}

/**
 * The Golden Fleece (or a piece of it): a living golden cloak of curls in the shape of `pts` (clockwise
 * on screen), its edge curly, its curls catching the light, green seeds glowing in it.
 */
export function fleeceGN(pen: Pen, pts: P[], o: FleeceOpts = {}): string {
  let minY = Infinity;
  let maxY = -Infinity;
  let cx = 0;
  let cy = 0;
  for (const p of pts) {
    minY = Math.min(minY, p[1]);
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
  const inner = `<path d="${d}" fill="${curlFill(pen, o.curl ?? 40)}"/>` + (folds.length ? pen.brushes(folds, '#7a4208', [0.2, 0.5], 0.55) : '') + seeds;
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
  out += lp.glow(0, 0, 300, '#ffe6a0', 0.55 * g) + lp.glow(0, 0, 200, '#ff8ad8', 0.35 * g);
  // Two rings of petals: the back ring longer and darker, the front ring between them.
  const petal = (deg: number, r0: number, r1v: number, w: number, color: string, back: boolean) => {
    const q = lp.local(false, deg);
    const mid = (r0 + r1v) * 0.5;
    const d = `M0 ${-r0}C${-w} ${-mid + w * 0.3} ${-w * 0.7} ${-r1v + w * 0.4} 0 ${-r1v}C${w * 0.7} ${-r1v + w * 0.4} ${w} ${-mid + w * 0.3} 0 ${-r0}Z`;
    const paint = q.lin(
      [
        [0, mix(color, '#ffffff', back ? 0.25 : 0.55)],
        [1, mix(color, '#ffffff', back ? 0 : 0.1)],
      ],
      0,
      1,
      0,
      0,
    );
    const vein = q.brush([[0, -r0 - 6], [w * 0.08, -mid], [0, -r1v + 16]], mini ? 2 : 3, '#ffffff', [0.1, 0.5], back ? 0.35 : 0.6);
    const veins = mini ? '' : q.brushes([[[[0, -mid + 10], [-w * 0.35, -mid - 30]], 1.6], [[[0, -mid + 30], [w * 0.4, -mid - 6]], 1.6]], mix(color, INK, 0.35), [0.2, 0.5], 0.5);
    return at(0, 0, 1, q.form(d, color, { sh: w * 0.45, hatch: back && !mini ? 1 : 0, line, rim: mini ? 0 : 2, paint, shade: q.dark(color, back ? 0.75 : 0.5), inner: vein + veins }), false, deg);
  };
  const n = mini ? 6 : 8;
  for (let i = 0; i < n; i++) out += petal((i * 360) / n + 180 / n, 30, mini ? 150 : 175, mini ? 62 : 64, PETALS[(i + 1) % 4], true);
  for (let i = 0; i < n; i++) out += petal((i * 360) / n, 26, mini ? 118 : 138, mini ? 56 : 58, PETALS[i % 4], false);
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
    out += lp.brushes(st, '#ffe6a0', [0.1, 0.1]) + beads;
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
  out += lp.form(circ(0, 0, 54), '#ffd8ec', { sh: 10, line: line + 0.4, paint: bulb, shade: '#ff9ad8', inner: `<ellipse cx="-18" cy="-20" rx="15" ry="9" fill="#fff" opacity=".9" transform="rotate(-30 -18 -20)"/>` });
  out += lp.glow(0, 0, 90, '#ffffff', 0.6 * g);
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

/* ---------------- Dr. Hypatia ---------------- */

const HY = { skin: '#c8906c', hair: '#1c1410', coat: '#f2f5fa', top: '#3a6ab0', pants: '#2a3448', shoes: '#3a2a22', gold: '#e8b84a' };

/** Dr. Hypatia: hair up in a bun with a gold pin, round glasses, a white lab coat over a blue top. */
export function hypatia(pen: Pen, x: number, y: number, s: number, o: CastOpts = {}): string {
  const lp = pen.local(!!o.flip);
  const pose = typeof o.pose === 'string' ? POSES[o.pose] : (o.pose ?? POSES.stand);
  const build: Build = { ...ADULT, shoulder: 0.78, hips: 0.42, chest: 1.5, waist: 1.12, hipW: 1.42, neckW: 0.46, arm: [0.4, 0.31, 0.25], leg: [0.62, 0.4, 0.27], spine: 1.9, thigh: 1.66, shin: 1.6 };
  const hair = lp.form('M-44 8Q-52 -40 -10 -52Q34 -56 44 -26Q30 -40 8 -36Q-16 -30 -26 -12Q-34 2 -32 16Z', HY.hair, {
    sh: 12,
    hatch: 2,
    rim: 2.2,
    line: 2.4,
    shade: '#0a0606',
    inner: lp.brushes([[[[-34, -20], [-14, -40], [16, -44]], 2], [[[-40, -4], [-30, -28], [-8, -42]], 1.8]], '#5a4438', [0.3, 0.5], 0.7),
  });
  const bun = lp.form(circ(-40, -46, 22), HY.hair, { sh: 10, hatch: 2, rim: 2.2, line: 2.4, shade: '#0a0606' }) + lp.brush([[-64, -70], [-40, -48], [-22, -30]], 5, HY.gold, [0.1, 0.1]);
  const glasses = `<g fill="none" stroke="${INK}" stroke-width="2.6"><circle cx="-6" cy="3" r="11"/><circle cx="30" cy="2" r="9"/><path d="M5 2Q12 -2 21 2M-17 1L-34 -2"/></g><path d="M-12 -4Q-6 -8 0 -4" stroke="#ffffff" stroke-width="2.4" opacity=".8"/>`;
  const outfit: Outfit = { build, skin: HY.skin, top: HY.coat, sleeve: HY.coat, pants: HY.pants, boots: HY.shoes, bootTop: 0.1, rim: o.rim };
  const { svg } = figure(lp, pose, outfit, { skin: HY.skin, mood: o.mood ?? 'smile', eye: '#3a2418', brow: HY.hair, jaw: 0.86, chin: 0.95, nose: 0.95, soft: true, look: o.look, back: bun, front: hair + glasses }, {
    torso: (r: Rig) => {
      // The blue top under the open coat, the coat's skirt, lapels and a pen in the pocket.
      let t = lp.form(dPoly([r.tf(-0.3, -0.02), r.tf(0.62, -0.02), r.tf(0.5, 0.7), r.tf(-0.1, 0.7)]), HY.top, { sh: 10, line: 2.2 });
      t += coatSkirt(lp, r, HY.coat, 0.78, { open: true, rim: o.rim });
      t += lp.brushes([[[r.tf(-0.34, 0.0), r.tf(-0.16, 0.36), r.tf(-0.1, 0.72)], 3], [[r.tf(0.64, 0.0), r.tf(0.52, 0.36), r.tf(0.5, 0.72)], 3]], INK, [0.1, 0.3], 0.8);
      const pk = r.tf(-0.62, 0.3);
      t += lp.brush([pk, add(pk, [2, -22])], 5, '#ff5a4a', [0.05, 0.05]);
      return t;
    },
  });
  return at(x, y, s, svg, o.flip);
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
