/**
 * Graphic-novel pieces for chapter 1, aboard the colony ship SYRACUSIA: GaScu's glowing vines, leaves
 * and flowers, the cryo pods and the sleeping colonists in them, and extras for Jason's face (a yawn)
 * that the cast's moods don't cover. Everything draws through a `Pen` like the rest of the kit.
 */
import { add, angle, at, dSmooth, INK, lerp, mix, mul, type P, type Pen, perp, r1, rng, spline, sub, unit } from './core';
import { ADULT, faceFrame, headOn, type HeadOpts, neck, type Pose, rig, type Rig, TEEN_BOY, torso } from './body';
import { jason, type JasonOpts, POSES } from './cast';

/* ---------------- GaScu: vines, leaves, buds and flowers ---------------- */

/** GaScu's colours: the magenta stem, its pink glow, the leaves, and the gold it turns when it is happy. */
export const GASCU = {
  stem: '#b8308c',
  glow: '#ff6fcf',
  light: '#ffd6f2',
  leaf: '#4f9a3a',
  leafLight: '#8ccc5a',
  gold: '#ffd166',
  goldDeep: '#e09a20',
};

/** A leaf shape pointing along +x from its base at (0, 0), 60 long. */
const LEAF_D = 'M0 0Q16 -15 44 -9Q58 -4 62 0Q58 4 44 9Q16 15 0 0Z';

/** One leaf at p, pointing along `deg` (screen degrees, clockwise from +x), `k` times 60 long. */
export function leafAt(pen: Pen, p: P, deg: number, k: number, color: string = GASCU.leaf): string {
  const lp = pen.local(false, deg);
  const rib = lp.brush(
    [
      [4, 0],
      [30, -1],
      [54, 0],
    ],
    2.4 / k,
    INK,
    [0.1, 0.6],
    0.7,
  );
  return at(p[0], p[1], k, lp.form(LEAF_D, color, { sh: 7, line: 2.2 / k, rim: 1.4 / k, inner: rib }), false, deg);
}

export interface VineOpts {
  /** Stem colour (default GaScu magenta). */
  color?: string;
  /** Glow colour around the stem (false for none). */
  glow?: string | false;
  /** A leaf every this many samples along the stem (0 for none; default 3). */
  leaves?: number;
  /** Leaf size (default from the stem width). */
  leaf?: number;
  leafColor?: string;
  /** Glowing buds along the stem: one every this many samples (0 for none). */
  buds?: number;
  budColor?: string;
  /** Curly tendrils off the stem: one every this many samples (0 for none). */
  curls?: number;
  seed?: number;
  /** Ink weight (default from the width). */
  line?: number;
}

/**
 * A GaScu vine along the points: a glowing, inked, tapered stem with a lit edge, leaves, little curling
 * tendrils and glowing buds.
 */
export function vine(pen: Pen, pts: P[], w: number, o: VineOpts = {}): string {
  const color = o.color ?? GASCU.stem;
  const glowC = o.glow === undefined ? GASCU.glow : o.glow;
  const rand = rng(o.seed ?? 3);
  const s = spline(pts, 4);
  const line = o.line ?? Math.max(2.4, w * 0.22);
  let out = '';
  if (glowC) out += pen.brush(pts, w * 4.2, glowC, [0.15, 0.2], 0.16) + pen.brush(pts, w * 2.2, glowC, [0.15, 0.2], 0.22);
  // Tendrils first, so the stem covers their roots.
  const curls: [P[], number][] = [];
  const every = o.curls ?? 5;
  if (every) {
    for (let i = 2; i < s.length - 2; i += every) {
      const t = unit(sub(s[i + 1], s[i - 1]));
      const n = mul(perp(t), i % 2 ? 1 : -1);
      const L = w * (1.6 + rand());
      const base = s[i];
      const a = add(base, add(mul(n, L * 0.6), mul(t, L * 0.3)));
      const b = add(base, add(mul(n, L * 1.0), mul(t, L * 0.7)));
      const c = add(base, add(mul(n, L * 0.75), mul(t, L * 0.95)));
      const d = add(base, add(mul(n, L * 0.6), mul(t, L * 0.75)));
      curls.push([[base, a, b, c, d], Math.max(2, w * 0.28)]);
    }
  }
  if (curls.length) out += pen.brushes(curls, INK, [0.05, 0.9]) + pen.brushes(curls.map(([p, ww]) => [p, ww * 0.45] as [P[], number]), mix(color, '#ffffff', 0.3), [0.1, 0.9], 0.9);
  out += pen.brush(pts, w + line * 2, INK, [0.04, 0.12]) + pen.brush(pts, w, color, [0.04, 0.12]);
  // The shadow side and the lit edge, offset across the stem by the light.
  const L = pen.L;
  const off = (k: number) => pts.map((p) => add(p, mul(L, w * k)) as P);
  out += pen.brush(off(-0.26), w * 0.42, pen.dark(color, 0.7), [0.1, 0.2], 0.85);
  out += pen.brush(off(0.26), w * 0.22, mix(color, '#ffffff', 0.55), [0.2, 0.3], 0.85);
  // Leaves, alternating sides, pointing a little ahead along the stem.
  const le = o.leaves ?? 3;
  if (le) {
    for (let i = 1; i < s.length - 1; i += le) {
      const t = sub(s[i + 1], s[i - 1]);
      const deg = (Math.atan2(t[1], t[0]) * 180) / Math.PI + (i % 2 ? -55 : 55) + (rand() - 0.5) * 20;
      out += leafAt(pen, s[i], deg, (o.leaf ?? w / 18) * (0.75 + rand() * 0.4), i % 3 ? (o.leafColor ?? GASCU.leaf) : GASCU.leafLight);
    }
  }
  const bu = o.buds ?? 0;
  if (bu) {
    for (let i = 2; i < s.length - 1; i += bu) out += bud(pen, s[i], w * (0.55 + rand() * 0.25), o.budColor ?? GASCU.glow);
  }
  return out;
}

/** A glowing round bud on a vine. */
export function bud(pen: Pen, p: P, r: number, color: string = GASCU.glow): string {
  return pen.glow(p[0], p[1], r * 3, color, 0.7) + pen.form(circleD(p[0], p[1], r), color, { line: 2, warm: 0, inner: `<circle cx="${r1(p[0] - r * 0.3)}" cy="${r1(p[1] - r * 0.35)}" r="${r1(r * 0.38)}" fill="#ffffff" opacity=".85"/>` });
}

/** A circle as path data (for `Pen.form`). */
export const circleD = (x: number, y: number, r: number) => `M${r1(x - r)} ${r1(y)}A${r1(r)} ${r1(r)} 0 1 0 ${r1(x + r)} ${r1(y)}A${r1(r)} ${r1(r)} 0 1 0 ${r1(x - r)} ${r1(y)}Z`;

/** An ellipse as path data (for `Pen.form`). */
export const ellipseD = (x: number, y: number, rx: number, ry: number) => `M${r1(x - rx)} ${r1(y)}A${r1(rx)} ${r1(ry)} 0 1 0 ${r1(x + rx)} ${r1(y)}A${r1(rx)} ${r1(ry)} 0 1 0 ${r1(x - rx)} ${r1(y)}Z`;

/** An elliptical ring `w` thick (outer radii rx, ry) as path data: the hole is wound the other way, so it stays open. */
export const ringD = (x: number, y: number, rx: number, ry: number, w: number) =>
  ellipseD(x, y, rx, ry) + `M${r1(x - rx + w)} ${r1(y)}A${r1(rx - w)} ${r1(ry - w)} 0 1 1 ${r1(x + rx - w)} ${r1(y)}A${r1(rx - w)} ${r1(ry - w)} 0 1 1 ${r1(x - rx + w)} ${r1(y)}Z`;

/** A five-petal flower facing us, `r` across its petals, with a glowing centre. */
export function flower(pen: Pen, x: number, y: number, r: number, color: string, center: string = GASCU.gold, rot = 0): string {
  let d = '';
  const n = 5;
  for (let i = 0; i < n; i++) {
    const a0 = ((i - 0.5) / n) * Math.PI * 2 + (rot * Math.PI) / 180;
    const a1 = ((i + 0.5) / n) * Math.PI * 2 + (rot * Math.PI) / 180;
    const p0: P = [x + Math.cos(a0) * r * 0.32, y + Math.sin(a0) * r * 0.32];
    const p1: P = [x + Math.cos(a1) * r * 0.32, y + Math.sin(a1) * r * 0.32];
    const am = (a0 + a1) / 2;
    const tip: P = [x + Math.cos(am) * r * 1.15, y + Math.sin(am) * r * 1.15];
    const c0: P = [x + Math.cos(a0 + 0.1) * r * 1.05, y + Math.sin(a0 + 0.1) * r * 1.05];
    const c1: P = [x + Math.cos(a1 - 0.1) * r * 1.05, y + Math.sin(a1 - 0.1) * r * 1.05];
    d += `${i ? 'L' : 'M'}${r1(p0[0])} ${r1(p0[1])}Q${r1(c0[0])} ${r1(c0[1])} ${r1(tip[0])} ${r1(tip[1])}Q${r1(c1[0])} ${r1(c1[1])} ${r1(p1[0])} ${r1(p1[1])}`;
  }
  d += 'Z';
  const veins: [P[], number][] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + (rot * Math.PI) / 180;
    veins.push([
      [
        [x + Math.cos(a) * r * 0.36, y + Math.sin(a) * r * 0.36],
        [x + Math.cos(a) * r * 0.8, y + Math.sin(a) * r * 0.8],
      ],
      Math.max(1.4, r * 0.06),
    ]);
  }
  return (
    pen.glow(x, y, r * 2, color, 0.45) +
    pen.form(d, color, { sh: r * 0.35, line: Math.max(1.8, r * 0.09), rim: 1.4, inner: pen.brushes(veins, pen.dark(color, 0.8), [0.2, 0.6], 0.7) }) +
    pen.glow(x, y, r * 0.7, '#ffffff', 0.6) +
    pen.form(circleD(x, y, r * 0.3), center, { sh: r * 0.12, line: Math.max(1.6, r * 0.07) })
  );
}

/* ---------------- Jason's face extras ---------------- */

/** Jason, with extra markup drawn over his head (in head coordinates, given his pen and rig): a yawn, a tear. */
export function jasonWith(pen: Pen, x: number, y: number, s: number, o: JasonOpts, extra: (hp: Pen, r: Rig) => string): string {
  const pose: Pose = typeof o.pose === 'string' ? POSES[o.pose] : (o.pose ?? POSES.stand);
  const r = rig(TEEN_BOY, pose);
  const lp = pen.local(!!o.flip);
  const over = at(r.head[0], r.head[1], 1, extra(lp.local(false, r.headRot), r), false, r.headRot);
  return jason(pen, x, y, s, o) + at(x, y, s, over, o.flip);
}

/** A big yawn over a sleepy (eyes-shut) face at this turn: a tall open mouth with a tongue, and a sleepy tear. */
export function yawn(pen: Pen, turn: number): string {
  const F = faceFrame(turn);
  const [mx, my] = F.mouth;
  const d = `M${r1(mx - 12)} ${r1(my - 3)}Q${r1(mx - 2)} ${r1(my - 10)} ${r1(mx + 9)} ${r1(my - 4)}Q${r1(mx + 13)} ${r1(my + 12)} ${r1(mx)} ${r1(my + 19)}Q${r1(mx - 14)} ${r1(my + 13)} ${r1(mx - 12)} ${r1(my - 3)}Z`;
  const tongue = `<ellipse cx="${r1(mx - 1)}" cy="${r1(my + 13)}" rx="8" ry="5" fill="#e2687a"/>` + `<path d="M${r1(mx - 10)} ${r1(my - 3)}Q${r1(mx - 2)} ${r1(my - 7)} ${r1(mx + 8)} ${r1(my - 3)}L${r1(mx + 7)} ${r1(my)}Q${r1(mx - 2)} ${r1(my - 4)} ${r1(mx - 9)} ${r1(my)}Z" fill="#f6f2ea"/>`;
  const tear = pen.form(`M${r1(F.eyeN[0] - 11)} ${r1(F.eyeN[1] + 3)}Q${r1(F.eyeN[0] - 16)} ${r1(F.eyeN[1] + 10)} ${r1(F.eyeN[0] - 12)} ${r1(F.eyeN[1] + 13)}Q${r1(F.eyeN[0] - 7)} ${r1(F.eyeN[1] + 10)} ${r1(F.eyeN[0] - 11)} ${r1(F.eyeN[1] + 3)}Z`, '#bff4ff', { line: 1.4, warm: 0 });
  return pen.form(d, '#5a1820', { line: 2.2, heavy: 1.2, inner: tongue }) + tear;
}

/* ---------------- the colonists ---------------- */

export type HairStyle = 'short' | 'long' | 'curly' | 'pony' | 'bun';

/** How a colonist looks. */
export interface Look {
  skin: string;
  hair: string;
  style: HairStyle;
}

/** The sleeping colonists (the same faces as the storybook pods). */
export const COLONISTS: Look[] = [
  { skin: '#e8bf9a', hair: '#5a3a22', style: 'long' },
  { skin: '#8a5a3c', hair: '#1a1210', style: 'curly' },
  { skin: '#f0cfb0', hair: '#c96a2a', style: 'pony' },
  { skin: '#c8906c', hair: '#2a1a12', style: 'short' },
  { skin: '#e0b48e', hair: '#e2c060', style: 'bun' },
];

/** A colonist's hair for a near-front face (head coordinates): `back` goes behind the head, `front` over it. */
export function hair(pen: Pen, look: Look): { front: string; back: string } {
  const c = look.hair;
  const shade = pen.dark(c, 0.75);
  const o = { sh: 10, hatch: 1 as const, rim: 0.6, line: 2.4, shade };
  const hi = mix(c, '#ffffff', 0.4);
  const strands = (list: P[][], w = 2.2) => pen.brushes(list.map((p) => [p, w] as [P[], number]), INK, [0.2, 0.6], 0.55) + pen.brushes(list.map((p) => [p.map((q) => add(q, [2, -2])), w * 0.8] as [P[], number]), hi, [0.3, 0.5], 0.6);
  // Strands sweeping from a parting at x = px over each side of the head.
  const sweep = (px: number, long = false): P[][] => [
    [
      [px, -50],
      [px - 20, -44],
      [-36, -24],
    ],
    [
      [px - 4, -40],
      [px - 24, -32],
      [-40, -6 + (long ? 30 : 0)],
    ],
    [
      [px + 2, -48],
      [px + 20, -44],
      [38, -24],
    ],
    [
      [px + 6, -38],
      [px + 24, -30],
      [42, -4 + (long ? 30 : 0)],
    ],
  ];
  const form = (pts: P[], extra = {}) => pen.form(dSmooth(pts), c, { ...o, ...extra });
  switch (look.style) {
    case 'long':
      return {
        back: form(
          [
            [-46, -24],
            [-58, 30],
            [-54, 96],
            [-20, 104],
            [20, 104],
            [56, 96],
            [58, 30],
            [46, -24],
          ],
          { sh: 26 },
        ),
        front:
          form([
            [-44, 40],
            [-50, -10],
            [-44, -40],
            [-20, -58],
            [8, -60],
            [34, -52],
            [48, -28],
            [50, 6],
            [46, 44],
            [40, 8],
            [34, -16],
            [18, -32],
            [6, -40],
            [-6, -32],
            [-26, -22],
            [-38, 0],
          ]) + strands(sweep(6, true)),
      };
    case 'curly': {
      let d = '';
      const n = 11;
      for (let i = 0; i <= n; i++) {
        const a = Math.PI * (0.97 + (i / n) * 1.06);
        const p: P = [Math.cos(a) * 56, -8 + Math.sin(a) * 60];
        d += i ? `A12 12 0 0 1 ${r1(p[0])} ${r1(p[1])}` : `M${r1(p[0])} ${r1(p[1])}`;
      }
      d += 'Q44 -16 34 -24Q22 -30 8 -28Q-8 -32 -24 -26Q-40 -18 -42 0Z';
      const coils: [P[], number][] = [];
      for (let i = 0; i < 9; i++) {
        const a = Math.PI * (1.1 + (i / 8) * 0.8);
        const p: P = [Math.cos(a) * 36, -14 + Math.sin(a) * 36];
        coils.push([[add(p, [-5, 3]), add(p, [0, -4]), add(p, [5, 2])], 2.2]);
      }
      return {
        back: form(
          [
            [-54, -16],
            [-60, 20],
            [-44, 46],
            [44, 46],
            [60, 20],
            [54, -16],
          ],
          { sh: 20 },
        ),
        front: pen.form(d, c, { ...o, hatch: 2, inner: pen.brushes(coils, hi, [0.3, 0.3], 0.55) }),
      };
    }
    case 'pony':
      return {
        back: pen.form('M-36 -34Q-76 -30 -72 30Q-70 76 -58 104Q-50 70 -44 40Q-38 0 -30 -20Z', c, { ...o, sh: 12 }),
        front:
          form([
            [-44, 6],
            [-48, -26],
            [-34, -50],
            [-6, -60],
            [24, -56],
            [44, -38],
            [46, -10],
            [42, 2],
            [36, -18],
            [22, -30],
            [2, -34],
            [-18, -30],
            [-34, -18],
          ]) +
          strands([
            [
              [30, -46],
              [0, -50],
              [-30, -36],
            ],
            [
              [36, -26],
              [6, -38],
              [-36, -20],
            ],
          ]) +
          pen.form(circleD(-40, -26, 8), '#e05a8a', { line: 2, sh: 4 }),
      };
    case 'bun':
      return {
        back: pen.form(circleD(-4, -62, 24), c, { ...o, sh: 14, inner: pen.brushes([[[[-20, -66], [-4, -78], [14, -66]], 2.2]], INK, [0.2, 0.4], 0.5) }),
        front:
          form([
            [-44, 6],
            [-48, -26],
            [-30, -52],
            [0, -60],
            [30, -54],
            [46, -30],
            [44, 2],
            [38, -16],
            [26, -28],
            [4, -34],
            [-16, -30],
            [-34, -18],
          ]) + strands(sweep(2)),
      };
    default:
      return {
        back: '',
        front:
          pen.form(
            dSmooth([
              [-43, 4],
              [-48, -24],
              [-36, -48],
              [-10, -60],
              [18, -58],
              [40, -46],
              [47, -24],
              [44, -2],
              [38, -18],
              [26, -26],
              [14, -24],
              [6, -36],
              [-8, -30],
              [-26, -30],
              [-38, -16],
            ]),
            c,
            { ...o, hatch: 2 },
          ) +
          strands([
            [
              [6, -50],
              [-14, -46],
              [-34, -30],
            ],
            [
              [10, -50],
              [26, -46],
              [40, -30],
            ],
          ]),
      };
  }
}


/** The pale blue of the colonists' cryo suits. */
export const CRYO_SUIT = '#c9d6e6';

/**
 * A sleeping colonist's head and shoulders (no arms: for inside a pod window or a cocoon), the head
 * centred at (x, y) and `k` times life size. `mood` defaults to asleep.
 */
export function sleeper(pen: Pen, x: number, y: number, k: number, look: Look, o: { turn?: number; tilt?: number; mood?: HeadOpts['mood']; suit?: string } = {}): string {
  const r = rig(ADULT, { turn: o.turn ?? 0.16, tilt: o.tilt ?? 6, armN: [-6, 8], armF: [6, 8], legN: { to: [-0.05, 0.99] }, legF: { to: [0.1, 0.99] } });
  const h = hair(pen, look);
  const suit = o.suit ?? CRYO_SUIT;
  const collar = pen.brush([r.tf(-0.6, 0.02), r.tf(0, 0.1), r.tf(0.6, 0.02)], 7, '#7fe6ff', [0.1, 0.1], 0.8);
  const body =
    torso(pen, r, suit, { rim: 1, inner: `<path d="M${r1(r.tf(0.1, 0.12)[0])} ${r1(r.tf(0.1, 0.12)[1])}V${r1(r.tf(0.1, 0.9)[1])}" stroke="${INK}" stroke-width="2.4" opacity=".5"/>` }) +
    collar +
    neck(pen, r, look.skin) +
    headOn(pen, r, { skin: look.skin, mood: o.mood ?? 'asleep', brow: pen.dark(look.hair, 0.4), back: h.back, front: h.front, rim: 0.8 });
  return at(x - r.head[0] * k, y - r.head[1] * k, k, body);
}

/* ---------------- cryo pods ---------------- */

export interface PodOpts {
  /** Who sleeps inside (none = an empty pod). */
  look?: Look;
  /** How frosted the glass is (0..1, default 0.5). */
  frost?: number;
  /** The interior light (default cryo cyan). */
  light?: string;
  /** Ink weight (default 3). */
  line?: number;
  /** Status lamp colour (default green). */
  lamp?: string;
}

/**
 * An upright cryo pod: a white pill-shaped frame on a plinth, a frosted window with a sleeping colonist
 * behind it, lit cyan from inside. Bottom centre at (x, y); 220 wide and 520 tall at scale 1.
 */
export function pod(pen: Pen, x: number, y: number, s: number, o: PodOpts = {}): string {
  const light = o.light ?? '#7fe6ff';
  const line = (o.line ?? 3) / s;
  const lp = pen;
  const frame = 'M-110 -60V-380Q-110 -520 0 -520Q110 -520 110 -380V-60Z';
  const win = 'M-80 -90V-376Q-80 -488 0 -488Q80 -488 80 -376V-90Z';
  const clip = lp.uid();
  lp.def(clip, `<clipPath id="${clip}"><path d="${win}"/></clipPath>`);
  const frost = o.frost ?? 0.5;
  let inside = `<path d="${win}" fill="${lp.lin([
    [0, '#1a3a5a'],
    [1, '#0c1a30'],
  ])}"/>`;
  inside += lp.glow(0, -300, 150, light, 0.6, 220);
  if (o.look) inside += sleeper(lp.relight({ key: [-0.6, -0.45], keyColor: '#e8fbff', depth: 0.35 }), 0, -360, 1, o.look, { tilt: 8 });
  // Frost and cold light over the glass: a pale wash from the edges, crystals and a highlight.
  inside += `<path d="${win}" fill="${lp.rad(
    [
      [0.45, '#e8f8ff', 0],
      [1, '#e8f8ff', 0.25 + frost * 0.6],
    ],
    0.5,
    0.5,
    0.62,
  )}"/><path d="${win}" fill="${light}" opacity=".12"/>`;
  const rand = rng(Math.round(x + y));
  const crystals: [P[], number][] = [];
  for (let i = 0; i < 10 * frost + 2; i++) {
    const side = i % 2 ? 1 : -1;
    const cy = -120 - rand() * 340;
    const cx = side * (60 + rand() * 18);
    crystals.push([
      [
        [cx, cy],
        [cx - side * (10 + rand() * 18), cy - 8 - rand() * 14],
      ],
      2.4,
    ]);
  }
  inside += lp.brushes(crystals, '#ffffff', [0.1, 0.6], 0.7);
  inside += lp.brush(
    [
      [-56, -360],
      [-40, -440],
      [0, -468],
    ],
    9,
    '#ffffff',
    [0.3, 0.4],
    0.55,
  );
  let out = lp.form(frame, '#d8dee8', {
    sh: 60,
    hatch: 1,
    rim: 2,
    line: line,
    axis: [0, 1],
    paint: lp.lin(
      [
        [0, '#f4f7fb'],
        [1, '#b9c4d4'],
      ],
      0,
      0,
      1,
      0,
    ),
  });
  out += `<g clip-path="url(#${clip})">${inside}</g><path d="${win}" fill="none" stroke="${INK}" stroke-width="${r1(line * 1.6)}"/>`;
  // The plinth with its status lights.
  out += lp.form('M-124 -70H124L114 0H-114Z', '#5a6274', { sh: 20, hatch: 1, line, rim: 1.6, inner: `<path d="M-100 -40H100" stroke="${light}" stroke-width="5" opacity=".8"/>` });
  const lamp = o.lamp ?? '#7dff9a';
  out += lp.glow(-70, -40, 22, lamp, 0.8) + `<circle cx="-70" cy="-40" r="6" fill="${lamp}"/>` + `<circle cx="-48" cy="-40" r="5" fill="#ffd166"/>`;
  return at(x, y, s, out);
}

export { angle, dSmooth, lerp };
