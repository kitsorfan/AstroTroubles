/**
 * The cast in the graphic-novel style: Jason, Atalanta, General Brennus, Captain Argus and Aeëtes. Each
 * keeps the colours and costume of the storybook kit (so they stay recognisable) on heroic proportions:
 * about 5.5 heads for the teenagers, 6.5 to 7.5 for the grown-ups.
 *
 * Every character is `name(pen, x, y, scale, opts)`: feet at (x, y), facing right unless `flip`. One
 * head is 100 units at scale 1 (Jason is about 550 tall, Brennus 650, Aeëtes 750). Pose them with a
 * `Pose` (see body.ts) or one of the ready-made POSES.
 */
import { add, at, dir, dPoly, dSmooth, INK, lerp, mix, mul, type P, type Pen, perp, r1, rotP, sub, unit } from './core';
import {
  ADULT,
  bandD,
  boot,
  type Build,
  chain,
  hand,
  headOn,
  type HeadOpts,
  limb,
  limbD,
  type Mood,
  neck,
  type Pose,
  rig,
  type Rig,
  STOCKY,
  TALL,
  TEEN_BOY,
  TEEN_GIRL,
  torso,
  U,
} from './body';

/** Ready-made poses (all facing right; flip the character to face left). */
export const POSES = {
  /** Standing easy, arms at the sides. */
  stand: { hipTilt: 6, armN: [-6, 8], armF: [10, 16], legN: { to: [-0.06, 0.985] }, legF: { to: [0.2, 0.95] }, handN: 'relaxed', handF: 'relaxed' },
  /** Feet planted wide, fists down, ready for anything. */
  ready: { turn: 0.38, lean: 4, armN: [-22, 14], armF: [22, 30], legN: { to: [-0.3, 0.92] }, legF: { to: [0.34, 0.9] }, handN: 'fist', handF: 'fist' },
  /** Hands on hips. */
  hips: { hipTilt: 8, armN: { to: [-0.62, 1.42], bend: 1 }, armF: { to: [0.62, 1.4], bend: -1 }, legN: { to: [-0.08, 0.985] }, legF: { to: [0.22, 0.95] }, handN: 'fist', handF: 'fist' },
  /** Pointing ahead with the far arm, the near fist clenched. */
  point: { turn: 0.45, lean: 5, armN: [-14, 10], armF: [100, 106], legN: { to: [-0.26, 0.94] }, legF: { to: [0.3, 0.93] }, handN: 'fist', handF: 'point' },
  /** A wave hello with the near hand. */
  wave: { turn: 0.35, hipTilt: 5, armN: [-140, 176], armF: [10, 16], legN: { to: [-0.08, 0.98] }, legF: { to: [0.2, 0.96] }, handN: 'open', handF: 'relaxed', tilt: -4 },
  /** The salute: the near hand flat at the brim of the cap. */
  salute: { turn: 0.4, armN: { to: [-0.26, -0.84], bend: -1 }, armF: [8, 10], legN: { to: [-0.06, 0.99] }, legF: { to: [0.16, 0.97] }, handN: 'flat', handF: 'fist', wristN: 34 },
  /** Both fists up: a cheer. */
  cheer: { turn: 0.3, tilt: -8, armN: [-150, -175], armF: [150, 172], legN: { to: [-0.14, 0.97] }, legF: { to: [0.18, 0.96] }, handN: 'fist', handF: 'fist' },
  /** Running toward the right, leaning in. */
  run: { turn: 0.6, lean: 14, armN: [50, 140], armF: [-40, 30], legN: { to: [0.42, 0.8] }, legF: { to: [-0.45, 0.78], bend: -1 }, handN: 'fist', handF: 'fist', footF: 35 },
  /** Down on one knee, ready to spring. */
  crouch: { turn: 0.45, lean: 18, armN: [20, 70], armF: [-10, 10], legN: { to: [0.3, 0.6] }, legF: { to: [-0.3, 0.72] }, handN: 'fist', handF: 'open', footF: 50 },
} satisfies Record<string, Pose>;

/** What a character wears: colours for each piece and how far the boots reach. */
export interface Outfit {
  build: Build;
  skin: string;
  top: string;
  sleeve?: string;
  pants: string;
  boots: string;
  /** How far up the shin the boots reach (heads). */
  bootTop?: number;
  bootCuff?: string;
  gloves?: string;
  /** Glove cuffs (a band at the wrist). */
  cuff?: string;
  /** Knee pads. */
  knee?: string;
  /** Where the top ends (as in `Rig.tf`); below it the pants show (default 1.12: one-piece). */
  topBottom?: number;
  /** Rim-light width for this character (bigger in strong backlight). */
  rim?: number;
}

/** Extra markup in the figure's own coordinates, given the posed rig, drawn at each depth. */
export interface Extras {
  /** Behind everything (capes, braids, a slung bow). */
  back?: (r: Rig) => string;
  /** Over the far arm (a shield or bow held in the far hand). */
  farArm?: (r: Rig) => string;
  /** Over the torso (belts, chest panels, medals). */
  torso?: (r: Rig) => string;
  /** Over the near arm (an arm cannon or blaster). */
  nearArm?: (r: Rig) => string;
  /** In front of everything. */
  front?: (r: Rig) => string;
}

/**
 * A dressed, posed figure in its own coordinates (feet at y = 0), drawn far arm first and near arm
 * last. `head` gives the head's options. Returns the markup and the rig.
 */
export function figure(pen: Pen, pose: Pose, o: Outfit, headO: HeadOpts, x: Extras = {}): { svg: string; r: Rig } {
  const b = o.build;
  const r = rig(b, pose);
  const sleeve = o.sleeve ?? o.top;
  const rim = o.rim ?? 1.6;
  const aw = b.arm.map((v) => v * U);
  const lw = b.leg.map((v) => v * U);
  // Far limbs recede: a deeper shadow over more of them.
  const far = (c: string, i: number) => (i ? pen.dark(c, 0.62) : undefined);
  // Rim light only catches the silhouette: the limbs on the side it comes from, not the ones in front of the body.
  const rimFar = pen.R[0] >= 0;
  const rimOf = (i: number) => ((i === 1) === rimFar ? rim : 0);
  const arm = (i: 0 | 1) => {
    const rim = rimOf(i);
    let s = chain(pen, r.sh[i], r.el[i], r.wr[i], [aw[0], aw[1], aw[2]], sleeve, { bulge: [aw[0] * 0.13, aw[1] * 0.12], side: [-1, -1], rim, hatch: i ? 2 : 1, sh: i ? 0.5 : 0.36, shade: far(sleeve, i) });
    const glove = o.gloves ?? o.skin;
    if (o.cuff) s += limb(pen, lerp(r.el[i], r.wr[i], 0.78), lerp(r.el[i], r.wr[i], 1.03), aw[2] * 1.3, aw[2] * 1.26, o.cuff, { rim, cap: 0.12, sh: 0.4, hatch: 0 });
    s += hand(pen, r.wr[i], r.foreA[i] + r.wrist[i], r.hands[i], b.hand * U, glove, false, { rim });
    return s;
  };
  const leg = (i: 0 | 1) => {
    const rim = rimOf(i);
    let s = chain(pen, r.hip[i], r.kn[i], r.an[i], [lw[0], lw[1], lw[2]], o.pants, { bulge: [lw[0] * 0.12, lw[1] * 0.14], side: [-1, 1], rim, hatch: i ? 2 : 1, sh: i ? 0.5 : 0.36, shade: far(o.pants, i) });
    if (o.knee) s += pen.form(limbD(lerp(r.hip[i], r.kn[i], 0.9), lerp(r.kn[i], r.an[i], 0.14), lw[1] * 1.0, lw[1] * 0.85, 0, 1, 0.3), o.knee, { sh: lw[1] * 0.4, rim, line: 2.2, shade: far(o.knee, i) });
    s += boot(pen, r, i, o.boots, { top: o.bootTop ?? 0.35, cuff: o.bootCuff, rim, shade: far(o.boots, i) });
    return s;
  };
  let svg = x.back?.(r) ?? '';
  svg += arm(1) + (x.farArm?.(r) ?? '') + leg(1) + leg(0);
  const tb = o.topBottom ?? 1.12;
  if (tb < 1.05) svg += torso(pen, r, o.pants, { rim });
  svg += torso(pen, r, o.top, { bottom: tb, flare: tb < 1.05 ? 0.04 : 0, rim });
  svg += x.torso?.(r) ?? '';
  svg += neck(pen, r, o.skin) + headOn(pen, r, headO);
  svg += arm(0) + (x.nearArm?.(r) ?? '') + (x.front?.(r) ?? '');
  return { svg, r };
}

/** Options every character takes. */
export interface CastOpts {
  /** A ready-made pose name, or a custom pose. */
  pose?: keyof typeof POSES | Pose;
  mood?: Mood;
  /** Face left instead of right. */
  flip?: boolean;
  /** Where the eyes look (a small offset in head units; default ahead). */
  look?: P;
  /** Rim-light width (bigger in strong backlight). */
  rim?: number;
}

const poseOf = (p: CastOpts['pose'], fallback: keyof typeof POSES): Pose => (typeof p === 'string' ? POSES[p] : (p ?? POSES[fallback]));

/** A point in head coordinates of a rig, in figure coordinates. */
export const headPt = (r: Rig, p: P): P => add(r.head, rotP(p, r.headRot));

/* ---------------- Jason ---------------- */

const J = {
  suit: '#ff8a3d',
  white: '#e9edf3',
  skin: '#d6a07a',
  hair: '#3b2416',
  belt: '#5a6274',
  box: '#1b2330',
  cyan: '#7fe6ff',
  gold: '#ffd166',
};

/** Jason's messy spiky hair (head coordinates, for turns around 0.3 to 0.6). */
function jasonHair(pen: Pen): string {
  const d = dPoly([
    [-35, 4],
    [-43, -12],
    [-55, -24],
    [-45, -34],
    [-56, -50],
    [-36, -52],
    [-36, -70],
    [-18, -60],
    [-6, -76],
    [6, -60],
    [24, -72],
    [28, -56],
    [48, -58],
    [40, -42],
    [54, -32],
    [36, -28],
    [36, -14],
    [24, -24],
    [14, -14],
    [8, -26],
    [-4, -18],
    [-10, -28],
    [-20, -18],
    [-24, -4],
    [-30, -2],
  ]);
  const strands: [P[], number][] = [
    [
      [
        [-30, -48],
        [-14, -40],
        [4, -34],
      ],
      2.6,
    ],
    [
      [
        [-40, -30],
        [-26, -26],
        [-18, -24],
      ],
      2.4,
    ],
    [
      [
        [-6, -60],
        [6, -46],
        [16, -32],
      ],
      2.4,
    ],
    [
      [
        [22, -52],
        [30, -42],
        [36, -30],
      ],
      2.2,
    ],
  ];
  return pen.form(d, J.hair, { sh: 18, hatch: 2, rim: 2.6, line: 2.6, shade: '#160c08', inner: pen.brushes(strands, INK, [0.2, 0.6], 0.9) + pen.brushes(strands.map(([p, w]) => [p.map((q) => add(q, [3, -4])), w * 0.6] as [P[], number]), mix(J.hair, '#ffffff', 0.35), [0.3, 0.6], 0.5) });
}

/** Jason's space helmet: a glass bubble over his head with a white rim and the red-tipped antenna. */
function jasonHelmet(pen: Pen): string {
  const glass = pen.rad([
    [0, '#bfefff', 0.05],
    [0.8, '#9fdcff', 0.18],
    [1, '#dff6ff', 0.45],
  ]);
  return (
    `<circle cx="2" cy="-4" r="70" fill="${glass}" stroke="${INK}" stroke-width="2.6"/>` +
    pen.brush(
      [
        [-40, -40],
        [-12, -62],
        [20, -62],
      ],
      7,
      '#ffffff',
      [0.3, 0.4],
      0.85,
    ) +
    pen.brush(
      [
        [52, 6],
        [44, 34],
        [26, 52],
      ],
      4,
      '#ffffff',
      [0.4, 0.4],
      0.6,
    ) +
    pen.form('M40 -62L50 -96L56 -95L48 -60Z', '#9aa6ba', { sh: 3, line: 2 }) +
    pen.glow(54, -100, 16, '#ff4a5a', 0.7) +
    pen.form('M54 -108A8 8 0 1 1 53.9 -108Z', '#ff4a5a', { sh: 4, line: 2 })
  );
}

export interface JasonOpts extends CastOpts {
  helmet?: boolean;
  /** The blaster on his near forearm (default yes). */
  blaster?: boolean;
}

/** Jason: orange-and-white space suit, white gloves and boots, a blaster on his forearm; helmet optional. */
export function jason(pen: Pen, x: number, y: number, s: number, o: JasonOpts = {}): string {
  const lp = pen.local(!!o.flip);
  const pose = poseOf(o.pose, 'stand');
  const outfit: Outfit = { build: TEEN_BOY, skin: J.skin, top: J.suit, pants: J.suit, boots: J.white, bootTop: 0.62, bootCuff: J.white, gloves: J.white, cuff: J.white, knee: J.white, rim: o.rim };
  const head: HeadOpts = {
    skin: J.skin,
    mood: o.mood ?? 'determined',
    eye: '#6a4428',
    brow: J.hair,
    jaw: 1,
    eyeSize: 1.06,
    look: o.look,
    front: jasonHair(lp) + (o.helmet ? jasonHelmet(lp) : ''),
  };
  const { svg } = figure(lp, pose, outfit, head, {
    torso: (r) => {
      // Grey belt with a buckle, the chest control box, seams, and the white collar ring.
      let t = lp.form(bandD(r, 0.8, 0.9), J.belt, { sh: 6, line: 2.2, rim: 1.6 });
      t += lp.form(dPoly([r.tf(0.12, 0.79), r.tf(0.36, 0.79), r.tf(0.36, 0.92), r.tf(0.12, 0.92)]), '#8a93a6', { sh: 4, line: 2 });
      const bx = [r.tf(0.18, 0.2), r.tf(0.72, 0.21), r.tf(0.72, 0.4), r.tf(0.18, 0.39)];
      t += lp.form(dPoly(bx), J.box, { sh: 5, line: 2.2 });
      const l1 = lerp(bx[0], bx[2], 0.32);
      const l2 = lerp(bx[0], bx[2], 0.68);
      t += lp.glow(l1[0], l1[1], 12, J.cyan, 0.8) + `<circle cx="${r1(l1[0])}" cy="${r1(l1[1])}" r="4.5" fill="${J.cyan}"/><circle cx="${r1(l2[0])}" cy="${r1(l2[1])}" r="3.5" fill="${J.gold}"/>`;
      t += lp.brushes(
        [
          [[r.tf(-0.95, 0.5), r.tf(-0.4, 0.56), r.tf(-0.1, 0.78)], 2.2],
          [[r.tf(-0.5, 0.06), r.tf(-0.62, 0.3), r.tf(-0.86, 0.48)], 2],
          [[r.tf(0.1, 0.45), r.tf(0.16, 0.6), r.tf(0.12, 0.78)], 2],
        ],
        INK,
        [0.3, 0.5],
        0.7,
      );
      const nb = add(r.N, mul(r.u, 4));
      const rw = r.b.neckW * U * 1.25;
      t += lp.form(`M${r1(nb[0] - rw)} ${r1(nb[1])}A${r1(rw)} ${r1(rw * 0.42)} 0 0 0 ${r1(nb[0] + rw)} ${r1(nb[1])}L${r1(nb[0] + rw * 0.9)} ${r1(nb[1] - 12)}A${r1(rw * 0.9)} ${r1(rw * 0.32)} 0 0 1 ${r1(nb[0] - rw * 0.9)} ${r1(nb[1] - 12)}Z`, J.white, { sh: 7, line: 2.4, rim: 2 });
      return t;
    },
    nearArm: (r) => (o.blaster === false ? '' : blaster(lp, r.el[0], r.wr[0])),
  });
  return at(x, y, s, svg, o.flip);
}

/** Jason's chunky grey blaster strapped along a forearm (from the elbow to the wrist). */
export function blaster(pen: Pen, el: P, wr: P): string {
  const d = sub(wr, el);
  const a = (Math.atan2(d[1], d[0]) * 180) / Math.PI;
  const lp = pen.local(false, a);
  const l = Math.hypot(d[0], d[1]);
  const body =
    lp.form(`M${r1(l * 0.12)} -17Q${r1(l * 0.1)} 17 ${r1(l * 0.2)} 18L${r1(l * 0.86)} 16Q${r1(l * 0.94)} 0 ${r1(l * 0.86)} -16Z`, '#8a93a6', { sh: 9, hatch: 1, rim: 2, line: 2.4 }) +
    lp.form(`M${r1(l * 0.84)} -10H${r1(l * 1.05)}V10H${r1(l * 0.84)}Z`, '#4a5262', { sh: 5, line: 2.2 }) +
    lp.brush(
      [
        [l * 0.22, -11],
        [l * 0.5, -12],
        [l * 0.78, -10],
      ],
      4,
      '#d8dee8',
      [0.3, 0.3],
      0.8,
    ) +
    lp.glow(l * 0.4, 5, 10, '#7fe6ff', 0.8) +
    `<circle cx="${r1(l * 0.4)}" cy="5" r="3.6" fill="#7fe6ff"/>`;
  return at(el[0], el[1], 1, body, false, a);
}

/* ---------------- Atalanta ---------------- */

const A = {
  teal: '#2fb7a3',
  tealDark: '#1d7a6e',
  skin: '#c68a5e',
  hair: '#6a2618',
  snow: '#eef3f6',
  gold: '#ffc94a',
  glow: '#8ff8e4',
};

/** Atalanta's hair pulled back, a fringe swept to the far side, and her white visor band (head coordinates). */
function atalantaHair(pen: Pen): string {
  const hair = dSmooth([
    [-34, 6],
    [-44, -14],
    [-44, -34],
    [-30, -52],
    [-6, -58],
    [20, -54],
    [38, -40],
    [44, -24],
    [40, -14],
    [30, -26],
    [18, -20],
    [6, -28],
    [-6, -24],
    [-16, -16],
    [-24, -10],
    [-28, 2],
  ]);
  const strands: [P[], number][] = [
    [
      [
        [-36, -30],
        [-14, -46],
        [16, -48],
      ],
      2.2,
    ],
    [
      [
        [-30, -12],
        [-30, -34],
        [-12, -50],
      ],
      2,
    ],
    [
      [
        [6, -46],
        [22, -38],
        [34, -24],
      ],
      2,
    ],
  ];
  const band = `M-46 -30Q0 -48 44 -30L42 -20Q0 -38 -45 -20Z`;
  const lens = `M-6 -38Q12 -42 28 -34L27 -26Q12 -34 -5 -30Z`;
  return (
    pen.form(hair, A.hair, { sh: 16, hatch: 2, rim: 2.6, line: 2.4, shade: '#2a0c08', inner: pen.brushes(strands, INK, [0.2, 0.6], 0.8) + pen.brushes(strands.map(([p, w]) => [p.map((q) => add(q, [2, -3])), w * 0.7] as [P[], number]), '#c0603a', [0.3, 0.6], 0.6) }) +
    pen.form(band, A.snow, { sh: 4, line: 2.2, rim: 1.6 }) +
    pen.glow(12, -34, 26, A.glow, 0.7) +
    pen.form(lens, A.glow, { line: 2, warm: 0, inner: pen.brush([[0, -35], [14, -38], [24, -33]], 2.4, '#ffffff', [0.3, 0.3], 0.9) })
  );
}

/** Her long braid, from the back of her head down behind the near shoulder (figure coordinates). */
function braid(pen: Pen, r: Rig, sway = 0): string {
  const top = headPt(r, [-36, -6]);
  const pts: P[] = [top, add(top, [-14 + sway * 0.3, 60]), add(top, [-18 + sway * 0.7, 130]), add(top, [-10 + sway, 200])];
  let out = '';
  const n = 9;
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    const seg = Math.min(pts.length - 2, Math.floor(t * (pts.length - 1)));
    const c = lerp(pts[seg], pts[seg + 1], t * (pts.length - 1) - seg);
    const w = 15 - t * 6;
    out += pen.form(`M${r1(c[0] - w)} ${r1(c[1])}Q${r1(c[0] - w * 0.6)} ${r1(c[1] - 16)} ${r1(c[0] + w * 0.4)} ${r1(c[1] - 14)}Q${r1(c[0] + w)} ${r1(c[1] + 2)} ${r1(c[0] + w * 0.3)} ${r1(c[1] + 14)}Q${r1(c[0] - w)} ${r1(c[1] + 12)} ${r1(c[0] - w)} ${r1(c[1])}Z`, A.hair, { sh: 6, line: 2, rim: 1.8, shade: '#2a0c08' });
  }
  const end = pts[pts.length - 1];
  out += pen.form(`M${r1(end[0] - 8)} ${r1(end[1] + 8)}h16v10h-16Z`, A.gold, { sh: 4, line: 2 });
  out += pen.form(`M${r1(end[0] - 7)} ${r1(end[1] + 18)}Q${r1(end[0])} ${r1(end[1] + 44)} ${r1(end[0] + 7)} ${r1(end[1] + 18)}Z`, A.hair, { sh: 4, line: 2, shade: '#2a0c08' });
  return out;
}

/** Her short cape, flowing back from the shoulders (figure coordinates). `wind` pushes it back and up. */
function cape(pen: Pen, r: Rig, wind = 1): string {
  const a = r.ts(0.55, 0.04);
  const b = r.ts(-0.85, 0.08);
  const d = dSmooth(
    [
      a,
      b,
      add(b, [-70 * wind, 30 - 20 * wind]),
      add(b, [-150 * wind, 70 - 30 * wind]),
      add(b, [-120 * wind, 140]),
      add(b, [-70 * wind, 130]),
      add(b, [-40 * wind, 200]),
      r.ts(-0.6, 0.7),
      r.ts(0.2, 0.5),
    ],
    true,
  );
  const hem = pen.brush([add(b, [-150 * wind, 74 - 30 * wind]), add(b, [-120 * wind, 138]), add(b, [-70 * wind, 128]), add(b, [-42 * wind, 196])], 6, A.gold, [0.1, 0.1], 0.95);
  const folds = pen.brushes(
    [
      [[add(b, [-20, 20]), add(b, [-60 * wind, 70]), add(b, [-90 * wind, 120])], 3],
      [[add(b, [-6, 50]), add(b, [-30 * wind, 110]), add(b, [-50 * wind, 170])], 2.6],
    ],
    INK,
    [0.2, 0.6],
    0.7,
  );
  return pen.form(d, A.tealDark, { sh: 30, hatch: 2, rim: 2.6, line: 2.6, inner: hem + folds });
}

/**
 * Her white-and-gold recurve bow, grip at `g`, its limbs across `aim` (the direction the arrow flies);
 * the string is pulled back to `nock` (or rests straight when there is no nock).
 */
export function bow(pen: Pen, g: P, aim: P, nock: P | null, size = 230, arrow = true): string {
  const a = unit(aim);
  const n = perp(a);
  const half = size / 2;
  const tip = (k: number): P => add(add(g, mul(n, k * half)), mul(a, -half * 0.12));
  const rec = (k: number): P => add(add(g, mul(n, k * half * 0.86)), mul(a, half * 0.1));
  const mid = (k: number): P => add(add(g, mul(n, k * half * 0.5)), mul(a, half * 0.16));
  const t1 = tip(1);
  const t2 = tip(-1);
  const limbPath = (k: number) => [g, mid(k), rec(k), tip(k)];
  let out = '';
  const string = nock ? [t1, nock, t2] : [t1, t2];
  out += pen.glow(lerp(t1, t2, 0.5)[0], lerp(t1, t2, 0.5)[1], half * 0.5, A.glow, 0.25);
  out += `<path d="${dPoly(string, false)}" fill="none" stroke="${A.glow}" stroke-width="2.6"/><path d="${dPoly(string, false)}" fill="none" stroke="#ffffff" stroke-width="1" opacity=".8"/>`;
  out += pen.brushes([[limbPath(1), 13], [limbPath(-1), 13]], INK, [0.05, 0.4]);
  out += pen.brushes([[limbPath(1), 8], [limbPath(-1), 8]], A.snow, [0.05, 0.45]);
  out += pen.brushes([[[mid(1), rec(1)], 3], [[mid(-1), rec(-1)], 3]], A.gold, [0.2, 0.2]);
  out += pen.form(dPoly([add(g, add(mul(n, 22), mul(a, -6))), add(g, add(mul(n, 22), mul(a, 10))), add(g, add(mul(n, -22), mul(a, 10))), add(g, add(mul(n, -22), mul(a, -6)))]), A.gold, { sh: 4, line: 2.2 });
  if (arrow && nock) {
    const head = add(g, mul(a, size * 0.42));
    out += `<path d="M${r1(nock[0])} ${r1(nock[1])}L${r1(head[0])} ${r1(head[1])}" stroke="${INK}" stroke-width="6" stroke-linecap="round"/><path d="M${r1(nock[0])} ${r1(nock[1])}L${r1(head[0])} ${r1(head[1])}" stroke="${A.snow}" stroke-width="2.4"/>`;
    out += pen.glow(head[0], head[1], 30, A.glow, 0.9);
    out += pen.form(dPoly([add(head, mul(n, 9)), add(head, mul(a, 26)), add(head, mul(n, -9))]), A.glow, { line: 2, warm: 0 });
    out += pen.brushes(
      [
        [[nock, add(add(nock, mul(a, -16)), mul(n, 12))], 5],
        [[nock, add(add(nock, mul(a, -16)), mul(n, -12))], 5],
      ],
      A.gold,
      [0.1, 0.5],
    );
  }
  return out;
}

export interface AtalantaOpts extends CastOpts {
  /** 'draw': aiming an arrow along `aim` (degrees, as `dir` measures them; default 100 = ahead, a little up); 'hand': bow held low; 'back': slung. */
  bow?: 'draw' | 'hand' | 'back';
  aim?: number;
  /** How hard the wind blows her cape back (default 1). */
  wind?: number;
}

/** Atalanta: teal scout suit with a white chest panel and gold belt, short cape, long braid, visor band, recurve bow. */
export function atalanta(pen: Pen, x: number, y: number, s: number, o: AtalantaOpts = {}): string {
  const lp = pen.local(!!o.flip);
  const mode = o.bow ?? 'back';
  let pose = poseOf(o.pose, 'stand');
  const aimDeg = o.aim ?? 100;
  if (mode === 'draw' && !o.pose) {
    // Bow arm straight out along the aim; the drawing hand pulled back to her cheek.
    const ad = dir(aimDeg);
    pose = {
      turn: 0.55,
      lean: -4,
      tilt: 4,
      armF: { to: add([0.15, -0.18], mul(ad, 2.0)), bend: -1 },
      armN: { to: [-0.12, -0.1], bend: -1 },
      legN: { to: [-0.3, 0.93] },
      legF: { to: [0.32, 0.92] },
      handN: 'grip',
      handF: 'grip',
      wristF: -10,
    };
  }
  const outfit: Outfit = { build: TEEN_GIRL, skin: A.skin, top: A.teal, pants: A.tealDark, boots: A.snow, bootTop: 0.78, bootCuff: A.gold, gloves: A.snow, cuff: A.snow, topBottom: 0.84, rim: o.rim };
  const head: HeadOpts = {
    skin: A.skin,
    mood: o.mood ?? 'grin',
    eye: '#3a6a3a',
    brow: '#4a160e',
    jaw: 0.88,
    chin: 0.95,
    nose: 0.85,
    soft: true,
    eyeSize: 1.1,
    look: o.look,
    front: atalantaHair(lp),
  };
  const { svg } = figure(lp, pose, outfit, head, {
    back: (r) => braid(lp, r, (o.wind ?? 1) * -30) + cape(lp, r, o.wind ?? 1) + (mode === 'back' ? bow(lp, r.ts(0.1, 0.4), dir(-35), null, 260, false) : ''),
    torso: (r) => {
      // The white chest panel and shoulder yoke, the glowing badge, and the gold belt.
      let t = lp.form(dSmooth([r.tf(-0.62, 0.02), r.tf(0.66, 0.02), r.tf(0.5, 0.3), r.tf(0.12, 0.5), r.tf(-0.3, 0.3)]), A.snow, { sh: 10, rim: 1.8, line: 2.2 });
      const badge = r.tf(0.28, 0.2);
      t += lp.glow(badge[0], badge[1], 16, A.glow, 0.9) + `<circle cx="${r1(badge[0])}" cy="${r1(badge[1])}" r="5" fill="${A.glow}" stroke="${INK}" stroke-width="1.8"/>`;
      t += lp.form(bandD(r, 0.74, 0.84), A.gold, { sh: 5, line: 2.2, rim: 1.6 });
      t += lp.brushes(
        [
          [[r.tf(-0.9, 0.42), r.tf(-0.6, 0.55), r.tf(-0.4, 0.72)], 2],
          [[r.tf(0.6, 0.42), r.tf(0.4, 0.6), r.tf(0.3, 0.72)], 1.8],
        ],
        INK,
        [0.3, 0.5],
        0.6,
      );
      return t;
    },
    front: (r) => (mode === 'draw' ? bow(lp, r.wr[1], dir(aimDeg), r.wr[0], 205) : mode === 'hand' ? bow(lp, r.wr[1], dir(100), null, 230, false) : ''),
  });
  return at(x, y, s, svg, o.flip);
}

/* ---------------- the grown-ups ---------------- */

/**
 * A coat's skirt from the waist down past the hips (`hem` = how far down the thighs, 0..1), split at
 * the front and flaring over the legs. Figure coordinates; draw it over the legs and torso.
 */
export function coatSkirt(pen: Pen, r: Rig, color: string, hem: number, o: { trim?: string; rim?: number; open?: boolean } = {}): string {
  const hn = add(lerp(r.hip[0], r.kn[0], hem), mul(perp(unit(sub(r.kn[0], r.hip[0]))), r.b.leg[1] * U * 0.75));
  const hf = add(lerp(r.hip[1], r.kn[1], hem), mul(perp(unit(sub(r.kn[1], r.hip[1]))), -r.b.leg[1] * U * 0.75));
  const split = r.tf(0.25, 0.86);
  if (o.open) {
    // A long coat hangs open: two flaps from the waist, the legs showing between them.
    const flap = (pts: P[], i: number) => pen.form(dPoly(pts), color, { sh: r.b.hipW * U * (i ? 0.4 : 0.25), hatch: 2, rim: o.rim ?? 1.8, line: 2.6, axis: r.u, shade: i ? pen.dark(color, 0.65) : undefined });
    const trim = (a: P, b: P) => (o.trim ? pen.brush([a, lerp(a, b, 0.5), b], 5, o.trim, [0.05, 0.05], 0.95) : '');
    const nIn = lerp(hn, hf, 0.32);
    const fIn = lerp(hn, hf, 0.7);
    return (
      flap([r.ts(r.b.waist * 0.5, 0.6), r.ts(r.b.hipW * 0.6, 0.95), hf, add(fIn, [0, -6]), r.tf(0.45, 0.6)], 1) +
      trim(r.tf(0.45, 0.6), fIn) +
      flap([r.ts(-r.b.waist * 0.5, 0.6), r.ts(-r.b.hipW * 0.6, 0.95), hn, add(nIn, [0, -4]), r.tf(0.05, 0.6)], 0) +
      trim(r.tf(0.05, 0.6), nIn)
    );
  }
  const d = dSmooth([r.ts(-r.b.waist * 0.5, 0.66), r.ts(-r.b.hipW * 0.56, 0.98), hn, lerp(hn, hf, 0.45), add(lerp(hn, hf, 0.5), [0, -8]), lerp(hn, hf, 0.55), hf, r.ts(r.b.hipW * 0.56, 0.98), r.ts(r.b.waist * 0.5, 0.66)]);
  const inner = pen.brush([split, lerp(split, lerp(hn, hf, 0.5), 0.6), lerp(hn, hf, 0.5)], 3, INK, [0.1, 0.4], 0.85) + (o.trim ? pen.brush([lerp(hn, hf, 0.02), lerp(hn, hf, 0.5), lerp(hn, hf, 0.98)], 5, o.trim, [0.1, 0.1], 0.9) : '');
  return pen.form(d, color, { sh: r.b.hipW * U * 0.3, hatch: 2, rim: o.rim ?? 1.8, line: 2.6, axis: r.u, inner });
}

/** A peaked military cap in head coordinates: crown, band, black visor and a badge. */
export function cap(pen: Pen, crown: string, band: string, badge: string, o: { dent?: boolean; braid?: string } = {}): string {
  const top = o.dent ? 'M-48 -34Q-56 -70 -12 -78Q0 -70 10 -76Q54 -76 50 -34Z' : 'M-48 -34Q-56 -74 2 -80Q54 -76 50 -34Z';
  let out = pen.form(top, crown, { sh: 18, hatch: 2, rim: 1.8, line: 2.6 });
  out += pen.form('M-48 -44Q2 -50 50 -44L50 -30Q2 -36 -48 -30Z', band, { sh: 6, line: 2.2, rim: 1.4 });
  if (o.braid) out += pen.brush([[-44, -32], [6, -36], [50, -30]], 3, o.braid, [0.1, 0.1]);
  out += pen.form('M-2 -32Q34 -38 64 -24Q50 -12 -2 -20Z', '#14121c', { sh: 6, line: 2.4 });
  out += pen.brush([[8, -28], [36, -30], [56, -24]], 2.4, '#ffffff', [0.3, 0.3], 0.35);
  out += pen.form('M12 -60a10 10 0 1 0 20 0a10 10 0 1 0 -20 0Z', '#e8b84a', { sh: 5, line: 2, inner: `<circle cx="22" cy="-60" r="4.5" fill="${badge}"/>` });
  return out;
}

/** A gold epaulette with its fringe on a shoulder (figure coordinates). */
function epaulette(pen: Pen, r: Rig, side: 0 | 1, gold: string): string {
  const s = r.sh[side];
  const k = side ? 0.85 : 1;
  const w = r.b.arm[0] * U * 0.75 * k;
  const d = `M${r1(s[0] - w)} ${r1(s[1] - 6)}Q${r1(s[0])} ${r1(s[1] - w * 0.75)} ${r1(s[0] + w)} ${r1(s[1] - 4)}Q${r1(s[0])} ${r1(s[1] + w * 0.3)} ${r1(s[0] - w)} ${r1(s[1] - 6)}Z`;
  const fringe: [P[], number][] = [];
  for (let i = 0; i < 6; i++) {
    const fx = s[0] - w * 0.85 + (i * w * 1.7) / 5;
    fringe.push([
      [
        [fx, s[1] - 2],
        [fx, s[1] + 16],
      ],
      3.2,
    ]);
  }
  return pen.brushes(fringe, gold, [0.05, 0.3]) + pen.form(d, gold, { sh: 8, line: 2.2, rim: 1.4 });
}

const B = {
  skin: '#d4a284',
  olive: '#55663a',
  oliveDark: '#3a4426',
  gold: '#e8b84a',
  red: '#c8282e',
  grey: '#d4d4dc',
  boots: '#2a2018',
  gloves: '#a8783a',
  sprout: '#ff8ad8',
};

/** Brennus's face: grey hair round the back, a great grey moustache, a scar and the red monocle (head coordinates). */
function brennusFace(pen: Pen, o: { plaster?: boolean; cap?: boolean }): { front: string; skinMarks: string; back: string } {
  const back = pen.form('M-44 -6Q-50 -30 -38 -40Q-30 -14 -26 8Z', B.grey, { sh: 6, line: 2.2 });
  const skinMarks = pen.brush([[-26, -2], [-20, 14], [-14, 30]], 3, '#9a5848', [0.2, 0.2], 0.85);
  const tache = 'M-14 22Q-2 14 12 20Q26 12 40 22Q52 34 46 40Q36 30 14 30Q-4 30 -20 42Q-30 38 -24 30Q-20 24 -14 22Z';
  let front = pen.form(tache, B.grey, { sh: 6, line: 2.2, rim: 1.4, inner: pen.brushes([[[[-4, 24], [8, 26]], 1.6], [[[18, 24], [32, 28]], 1.6]], '#8a8a96', [0.3, 0.3]) });
  // Bushy brows over the face's own (grey) brows.
  front += pen.brushes(
    [
      [
        [
          [-10, -16],
          [0, -18],
          [10, -14],
        ],
        6,
      ],
    ],
    B.grey,
    [0.2, 0.4],
  );
  // The monocle on the far eye: a gold rim round a red lens, and its chain.
  front += pen.glow(32, 2, 18, '#ff3a4c', 0.5) + `<circle cx="32" cy="2" r="10" fill="#ff3a4c" fill-opacity=".45" stroke="${INK}" stroke-width="5"/><circle cx="32" cy="2" r="10" fill="none" stroke="#d8b050" stroke-width="2.6"/>`;
  front += pen.brush([[40, 8], [44, 26], [36, 48]], 1.6, '#d8b050', [0.1, 0.1]);
  if (o.plaster) front += pen.form('M-30 18L-12 10L-8 18L-26 26Z', '#f2d0a8', { sh: 3, line: 1.8, inner: `<path d="M-22 14L-16 22M-16 12L-22 22" stroke="#c89a70" stroke-width="1.4"/>` });
  if (o.cap !== false) front += cap(pen, B.olive, B.red, B.red, { dent: o.plaster });
  else front += pen.form('M-36 -30Q-2 -50 30 -40Q6 -44 -36 -30Z', B.grey, { line: 1.8 });
  return { front, skinMarks, back };
}

/** Brennus's big Legion shield (a tall hexagon of dark olive with a gold rim and the red gear), centred at c, turned `rot` degrees. */
export function legionShield(pen: Pen, c: P, size: number, rot = 0, dented = false): string {
  const lp = pen.local(false, rot);
  const hex = 'M0 -100L70 -56V56L0 100L-70 56V-56Z';
  let gear = '';
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    gear += `<rect x="-7" y="-36" width="14" height="14" fill="${B.red}" transform="rotate(${r1((a * 180) / Math.PI)})"/>`;
  }
  const scuffs = dented
    ? lp.brushes(
        [
          [
            [
              [-40, -30],
              [-20, -40],
            ],
            3,
          ],
          [
            [
              [30, 40],
              [44, 20],
            ],
            3,
          ],
          [
            [
              [-30, 50],
              [-10, 40],
              [0, 52],
            ],
            2.6,
          ],
        ],
        '#c8c0a0',
        [0.2, 0.5],
        0.8,
      )
    : '';
  const inner = `<circle r="30" fill="none" stroke="${B.red}" stroke-width="12"/>${gear}<circle r="9" fill="${B.oliveDark}"/>` + scuffs + (dented ? lp.brush([[-60, -10], [-48, 4], [-40, -2]], 4, INK, [0.2, 0.2], 0.7) : '');
  const body = lp.form(hex, B.oliveDark, { sh: 40, hatch: 2, rim: 2.4, line: 3, inner }) + `<path d="${hex}" fill="none" stroke="${B.gold}" stroke-width="7" transform="scale(.9)"/>`;
  return at(c[0], c[1], size / 200, body, false, rot);
}

/** Brennus's brass arm cannon along a forearm (from the elbow to the wrist). */
function armCannon(pen: Pen, el: P, wr: P): string {
  const d = sub(wr, el);
  const a = (Math.atan2(d[1], d[0]) * 180) / Math.PI;
  const lp = pen.local(false, a);
  const l = Math.hypot(d[0], d[1]);
  const rings = [0.3, 0.55, 0.8].map((t) => lp.form(`M${r1(l * t)} -21h9v42h-9Z`, '#c9a24a', { sh: 4, line: 2 })).join('');
  const body = lp.form(`M${r1(l * 0.15)} -18H${r1(l * 1.02)}V18H${r1(l * 0.15)}Z`, '#3a3a32', { sh: 12, hatch: 1, rim: 1.6, line: 2.4 }) + rings + lp.form(`M${r1(l * 1.02)} -13h14v26h-14Z`, '#4a3a30', { sh: 5, line: 2.2 }) + `<circle cx="${r1(l * 1.09)}" cy="0" r="6" fill="#110c08"/>`;
  return at(el[0], el[1], 1, body, false, a);
}

export interface BrennusOpts extends CastOpts {
  /** No cap (bald head and grey fringe). */
  capOff?: boolean;
  /** The big Legion shield on his far arm (default yes). */
  shield?: boolean;
  /** Battered after a fight: a dented cap, a plaster on his cheek and a scuffed shield. */
  dented?: boolean;
  /** The brass arm cannon on his near forearm (default yes; leave it off when that hand salutes or waves). */
  cannon?: boolean;
}

/** General Brennus: old and broad, olive uniform with gold epaulettes and medals, peaked cap, moustache, monocle, arm cannon and shield. */
export function brennus(pen: Pen, x: number, y: number, s: number, o: BrennusOpts = {}): string {
  const lp = pen.local(!!o.flip);
  const pose = poseOf(o.pose, 'stand');
  const face = brennusFace(lp, { plaster: o.dented, cap: !o.capOff });
  const outfit: Outfit = { build: STOCKY, skin: B.skin, top: B.olive, pants: B.oliveDark, boots: B.boots, bootTop: 0.5, gloves: B.gloves, cuff: B.gold, rim: o.rim };
  const head: HeadOpts = { skin: B.skin, mood: o.mood ?? 'proud', eye: '#4a5a6a', brow: '#9a9aa6', jaw: 1.14, chin: 0.96, nose: 1.25, age: 0.9, look: o.look, back: face.back, front: face.front, skinMarks: face.skinMarks, eyeSize: 0.92 };
  const { svg } = figure(lp, pose, outfit, head, {
    torso: (r) => {
      let t = coatSkirt(lp, r, B.olive, 0.42, { rim: o.rim });
      // Buttons, collar tabs, medal ribbons, the belt with its buckle and Celestia's sprout in its pot.
      t += lp.brush([r.tf(0.3, 0.05), r.tf(0.32, 0.4), r.tf(0.3, 0.72)], 3, INK, [0.1, 0.1], 0.7);
      t += [0.16, 0.32, 0.5].map((yy) => {
        const b = r.tf(0.38, yy);
        return `<circle cx="${r1(b[0])}" cy="${r1(b[1])}" r="5" fill="${B.gold}" stroke="${INK}" stroke-width="1.6"/>`;
      }).join('');
      t += lp.form(dPoly([r.tf(-0.1, 0.0), r.tf(0.08, 0.02), r.tf(0.0, 0.1)]), B.red, { line: 1.8 }) + lp.form(dPoly([r.tf(0.5, 0.02), r.tf(0.68, 0.0), r.tf(0.6, 0.1)]), B.red, { line: 1.8 });
      ['#ff3a4c', '#3fb6ff', B.gold].forEach((c, i) => {
        t += lp.form(dPoly([r.tf(-0.62 + i * 0.16, 0.2), r.tf(-0.47 + i * 0.16, 0.2), r.tf(-0.47 + i * 0.16, 0.27), r.tf(-0.62 + i * 0.16, 0.27)]), c, { line: 1.6 });
      });
      const m = r.tf(-0.45, 0.36);
      t += lp.form(`M${r1(m[0] - 7)} ${r1(m[1])}a7 7 0 1 0 14 0a7 7 0 1 0 -14 0Z`, B.gold, { sh: 3, line: 1.6 });
      t += lp.form(bandD(r, 0.68, 0.79), '#4a3018', { sh: 6, line: 2.2, rim: 1.4 });
      t += lp.form(dPoly([r.tf(0.2, 0.67), r.tf(0.42, 0.67), r.tf(0.42, 0.8), r.tf(0.2, 0.8)]), B.gold, { sh: 3, line: 1.8 });
      const pot = r.tf(-0.62, 0.78);
      t += lp.form(`M${r1(pot[0] - 13)} ${r1(pot[1] - 4)}h26l-4 24h-18Z`, '#b8643a', { sh: 6, line: 2 });
      t += lp.glow(pot[0], pot[1] - 14, 16, B.sprout, 0.8) + lp.brushes([[[[pot[0], pot[1] - 4], [pot[0] - 6, pot[1] - 20]], 5], [[[pot[0], pot[1] - 4], [pot[0] + 7, pot[1] - 18]], 5]], B.sprout, [0.1, 0.5]);
      return t + epaulette(lp, r, 1, B.gold);
    },
    farArm: (r) => (o.shield === false ? '' : legionShield(lp, lerp(r.el[1], r.wr[1], 0.55), 230, -6, o.dented)),
    nearArm: (r) => (o.cannon === false ? '' : armCannon(lp, r.el[0], r.wr[0])),
    front: (r) => epaulette(lp, r, 0, B.gold),
  });
  return at(x, y, s, svg, o.flip);
}

const AR = { skin: '#6f4631', navy: '#1c2a4f', navyDark: '#141c36', gold: '#e8b84a', grey: '#d8d8e0', white: '#e6edf7' };

/** Captain Argus: dark skin, short grey hair and beard, navy and gold uniform, captain's cap. */
export function argus(pen: Pen, x: number, y: number, s: number, o: CastOpts & { capOff?: boolean } = {}): string {
  const lp = pen.local(!!o.flip);
  const pose = poseOf(o.pose, 'stand');
  const beard = 'M-34 8Q-36 40 -6 52Q14 58 30 46Q42 34 40 14Q32 30 18 30Q8 24 0 26Q-10 26 -16 32Q-28 28 -34 8Z';
  const front =
    lp.form(beard, AR.grey, { sh: 8, line: 2.2, rim: 1.4, inner: lp.brushes([[[[-20, 36], [-8, 46]], 1.6], [[[6, 40], [14, 48]], 1.6]], '#9a9aa6', [0.3, 0.3]) }) +
    lp.form('M-8 24Q4 18 14 22Q24 18 34 24Q24 30 14 28Q4 30 -8 24Z', '#c4c4ce', { line: 1.8 }) +
    (o.capOff ? lp.form('M-44 -2Q-48 -46 0 -50Q44 -48 44 -14Q30 -36 -2 -36Q-30 -34 -44 -2Z', AR.grey, { sh: 8, line: 2.2, rim: 1.4 }) : cap(lp, AR.navy, '#0f1830', AR.navy, { braid: AR.gold }));
  const head: HeadOpts = { skin: AR.skin, mood: o.mood ?? 'determined', eye: '#3a2418', brow: '#c8c8d2', jaw: 1.06, nose: 1.15, age: 0.6, look: o.look, front, back: lp.form('M-44 -4Q-50 -26 -40 -36Q-32 -14 -28 6Z', AR.grey, { line: 2 }) };
  const outfit: Outfit = { build: ADULT, skin: AR.skin, top: AR.navy, pants: AR.navyDark, boots: '#14121c', bootTop: 0.4, cuff: AR.gold, rim: o.rim };
  const { svg } = figure(lp, pose, outfit, head, {
    torso: (r) => {
      let t = lp.form(dPoly([r.tf(-0.22, -0.02), r.tf(0.32, 0.18), r.tf(0.6, -0.02)]), AR.white, { line: 2 });
      t += [0.26, 0.42, 0.58].map((yy) => {
        const b = r.tf(0.32, yy);
        return `<circle cx="${r1(b[0])}" cy="${r1(b[1])}" r="5" fill="${AR.gold}" stroke="${INK}" stroke-width="1.6"/>`;
      }).join('');
      t += lp.form(bandD(r, 0.74, 0.84), '#0c1224', { sh: 5, line: 2, rim: 1.4 });
      return t + epaulette(lp, r, 1, AR.gold);
    },
    front: (r) => epaulette(lp, r, 0, AR.gold),
  });
  return at(x, y, s, svg, o.flip);
}

const AE = { skin: '#e8c0a0', hair: '#d8dce8', coat: '#e2b23c', trim: '#fff2b0', shirt: '#5a1a4a', pants: '#3a1a34', shoes: '#1a1218', gold: '#ffd166' };

/** Aeëtes's slick silver hair and the gold-rimmed screen he wears over one eye (head coordinates). */
function aeetesHead(pen: Pen): { front: string; back: string } {
  const hair = 'M-42 4Q-50 -36 -22 -52Q8 -62 34 -48Q44 -40 42 -26Q20 -40 -8 -38Q-30 -34 -34 -10Z';
  const shine = pen.brushes(
    [
      [
        [
          [-34, -30],
          [-6, -48],
          [26, -46],
        ],
        3,
      ],
      [
        [
          [-38, -14],
          [-20, -36],
          [10, -40],
        ],
        2.4,
      ],
    ],
    '#ffffff',
    [0.3, 0.5],
    0.7,
  );
  const screen = pen.glow(30, 2, 20, '#7dff9a', 0.4) + pen.form('M18 -10H44V12H18Z', '#12202e', { line: 2.4, inner: `<path d="M21 7L27 2L32 5L41 -5" fill="none" stroke="#7dff9a" stroke-width="2.4"/>` }) + `<path d="M18 -10H44V12H18Z" fill="none" stroke="${AE.gold}" stroke-width="2.6"/><path d="M18 -4L-40 -10" stroke="${INK}" stroke-width="2.2"/>`;
  return { front: pen.form(hair, AE.hair, { sh: 10, hatch: 1, line: 2.4, rim: 1.6, inner: shine }) + screen, back: pen.form('M-40 -6Q-52 20 -40 30Q-34 14 -30 4Z', AE.hair, { line: 2 }) };
}

/** Aeëtes: tall and thin, a long gold coat over a purple shirt, slick silver hair, an eye-screen, rings on every finger, a grin a bit too wide. */
export function aeetes(pen: Pen, x: number, y: number, s: number, o: CastOpts = {}): string {
  const lp = pen.local(!!o.flip);
  const pose = poseOf(o.pose, 'stand');
  const h = aeetesHead(lp);
  const head: HeadOpts = { skin: AE.skin, mood: o.mood ?? 'scheming', eye: '#6a8a3a', brow: '#9a9aa8', jaw: 0.88, chin: 1.12, nose: 1.3, age: 0.4, look: o.look, farEye: false, front: h.front, back: h.back };
  const outfit: Outfit = { build: TALL, skin: AE.skin, top: AE.coat, pants: AE.pants, boots: AE.shoes, bootTop: 0.2, gloves: AE.skin, cuff: AE.trim, rim: o.rim };
  const rings = (r: Rig, i: 0 | 1) => {
    const w = r.wr[i];
    const d = dir(r.foreA[i]);
    const pts = [0.45, 0.6, 0.75].map((t) => add(add(w, mul(d, r.b.hand * U * t)), mul(perp(d), (t - 0.6) * 18)));
    return pts.map((p) => `<circle cx="${r1(p[0])}" cy="${r1(p[1])}" r="4.6" fill="${AE.gold}" stroke="${INK}" stroke-width="1.6"/>`).join('');
  };
  const { svg } = figure(lp, pose, outfit, head, {
    torso: (r) => {
      let t = lp.form(dPoly([r.tf(-0.3, -0.02), r.tf(0.6, -0.02), r.tf(0.45, 0.62), r.tf(0.0, 0.62)]), AE.shirt, { sh: 10, line: 2.2 });
      t += coatSkirt(lp, r, AE.coat, 0.95, { trim: AE.trim, rim: o.rim, open: true });
      t += lp.brushes([[[r.tf(-0.32, 0.0), r.tf(-0.12, 0.4), r.tf(-0.05, 0.9)], 5], [[r.tf(0.62, 0.0), r.tf(0.5, 0.4), r.tf(0.48, 0.9)], 5]], AE.trim, [0.1, 0.1]);
      return t;
    },
    farArm: (r) => rings(r, 1),
    front: (r) => rings(r, 0),
  });
  return at(x, y, s, svg, o.flip);
}
