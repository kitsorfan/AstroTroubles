/**
 * Graphic-novel pieces for chapter 1, aboard the colony ship SYRACUSIA: GaScu's glowing vines, leaves
 * and flowers, the cryo pods and the sleeping colonists in them, and extras for Jason's face (a yawn)
 * that the cast's moods don't cover. Everything draws through a `Pen` like the rest of the kit.
 */
import { add, at, dir, dSmooth, INK, mix, mul, type P, type Pen, perp, r1, rng, spline, sub, unit } from './core';
import { ADULT, faceFrame, headOn, type HeadOpts, neck, type Pose, rig, type Rig, TEEN_BOY, torso } from './body';
import { jason, type JasonOpts, POSES } from './cast';
import { lux, type LuxMood } from './droids';
import { bloom, godRays, spark } from './fx';

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

/* ---------------- the SYRACUSIA ---------------- */

export interface ShipOpts {
  /** Tilt (degrees, + noses down). */
  rot?: number;
  flip?: boolean;
  /** How far GaScu's vines have grown over the hull (0 = none, 1 = all over). */
  vines?: number;
  /** The vines turned gold and flowering (the happy ending). */
  gold?: boolean;
  /** Engines burning (default yes). */
  engines?: boolean;
  /** Ink weight (default 3.2; thinner when the ship is far away). */
  line?: number;
}

/** Half of an elliptical ring band: the right half (`front`) or the left. */
function ringHalf(cx: number, RX: number, RY: number, rx: number, ry: number, front: boolean): string {
  const f = front ? 1 : 0;
  const b = front ? 0 : 1;
  return `M${cx} ${-RY}A${RX} ${RY} 0 0 ${f} ${cx} ${RY}L${cx} ${ry}A${rx} ${ry} 0 0 ${b} ${cx} ${-ry}Z`;
}

/**
 * The colony ship SYRACUSIA, side-on and facing right: engines at the back, a long white spine with rows
 * of lit windows and a gold stripe, three great habitat rings, and the Bridge module at the nose with its
 * cyan window and dome. About 1300 long and 420 tall at scale 1, centred on the spine.
 */
export function syracusia(pen: Pen, x: number, y: number, s: number, o: ShipOpts = {}): string {
  const lp = pen.local(!!o.flip, o.rot ?? 0);
  const line = (o.line ?? 3.2) / Math.max(0.3, s);
  const white = '#e9edf3';
  const gold = '#ffd166';
  const rings = [-330, -120, 90];
  let out = '';
  if (o.engines !== false) {
    out += lp.glow(-700, 0, 260, '#8fd8ff', 0.8, 110) + lp.glow(-680, 0, 90, '#ffffff', 0.9, 50);
    out += lp.brushes(
      [
        [
          [
            [-680, -26],
            [-980, -34],
          ],
          16,
        ],
        [
          [
            [-680, 26],
            [-1000, 34],
          ],
          16,
        ],
        [
          [
            [-680, 0],
            [-1100, 0],
          ],
          10,
        ],
      ],
      '#bff0ff',
      [0.05, 0.95],
      0.7,
    );
  }
  // The far halves of the rings, behind the spine.
  for (const rx of rings) out += lp.form(ringHalf(rx, 80, 206, 36, 150, false), '#b9c4d4', { sh: 30, hatch: 2, line, shade: lp.dark('#b9c4d4', 0.8) });
  // The engine section: a wide drum with two bell nozzles and radiator fins.
  out += lp.form('M-640 -36L-690 -58V-6L-640 -14Z', '#5a6274', { sh: 10, line }) + lp.form('M-640 14L-690 6V58L-640 36Z', '#5a6274', { sh: 10, line });
  // Radiator wings on the engine section: blue-grey panels ruled with cooling channels.
  const cells = (y0: number, y1: number) => {
    let d = '';
    for (let k = 1; k < 6; k++) d += `M-600 ${r1(y0 + ((y1 - y0) * k) / 6)}H-430`;
    return `<path d="${d}M-540 ${y0}V${y1}" stroke="${INK}" stroke-width="2.6" opacity=".5"/>`;
  };
  const fin = (k: number) => lp.form(`M-600 ${k * 300}L-450 ${k * 300}L-470 ${k * 70}H-560Z`, '#7a8aa8', { sh: 30, hatch: 1, line, rim: 1.6, paint: lp.lin([[0, '#a8b8d4'], [1, '#5a6a8a']]), inner: cells(k * 300, k * 70) });
  out += fin(-1) + fin(1);
  out += lp.form('M-650 -60Q-656 0 -650 60L-460 76Q-450 0 -460 -76Z', '#c9d1dc', {
    sh: 40,
    hatch: 2,
    rim: 2,
    line,
    axis: [1, 0],
    inner: `<path d="M-600 -66V66M-540 -72V72" stroke="${INK}" stroke-width="3" opacity=".5"/><path d="M-640 -30H-470" stroke="#ff8a3d" stroke-width="10"/>`,
  });
  // The long spine, its windows and the gold stripe.
  const windows = `<path d="M-440 -18H300M-440 2H300" stroke="#ffe2a8" stroke-width="6" stroke-dasharray="7 9"/><path d="M-450 22H310" stroke="${gold}" stroke-width="7" stroke-dasharray="20 8"/>`;
  const plates = `<path d="M-380 -48V48M-200 -48V48M-20 -48V48M160 -48V48" stroke="${INK}" stroke-width="3" opacity=".45"/>`;
  out += lp.form('M-470 -48H360Q392 0 360 48H-470Z', white, { sh: 34, hatch: 2, rim: 2.2, line, axis: [1, 0], inner: windows + plates + lp.glow(-80, -10, 400, '#ffe2a8', 0.2, 30) });
  // Greebles: a docking module and a dish antenna on top, a cargo pod underneath, nav lights.
  out += lp.form('M190 -48V-74Q230 -86 270 -74V-48Z', '#c9d1dc', { sh: 10, line, inner: `<path d="M206 -62H254" stroke="#7fe6ff" stroke-width="5"/>` });
  out += lp.brush(
    [
      [-410, -48],
      [-416, -86],
    ],
    6,
    INK,
    [0.05, 0.05],
  );
  out += lp.form('M-456 -104Q-416 -70 -372 -104Q-414 -96 -456 -104Z', '#d8dee8', { sh: 6, line: line * 0.8 });
  out += lp.form('M-60 48V80Q0 96 60 80V48Z', '#9aa6ba', { sh: 14, hatch: 1, line, inner: `<path d="M-40 64H40" stroke="${INK}" stroke-width="3" opacity=".5"/>` });
  out += lp.glow(-640, -64, 24, '#ff4a5a', 0.9) + lp.glow(600, 62, 22, '#7dff9a', 0.9);
  // The Bridge module at the nose: a rounded hull, the long cyan window, the dome on top with its antenna.
  out += lp.brush([[440, -150], [452, -200], [458, -236]], 5, INK, [0.05, 0.05]) + lp.glow(460, -240, 18, '#ff4a5a', 0.9) + `<circle cx="460" cy="-240" r="5" fill="#ff4a5a"/>`;
  out += lp.form('M370 -90Q372 -160 430 -164Q490 -160 492 -100Z', '#bfefff', { sh: 18, line, rim: 1.6, paint: lp.lin([[0, '#e8fbff'], [1, '#7fc8e8']]), inner: lp.brush([[392, -112], [408, -140], [436, -152]], 6, '#ffffff', [0.3, 0.3], 0.8) + `<path d="M372 -118H490" stroke="${INK}" stroke-width="3" opacity=".5"/>` });
  out += lp.form('M330 -80Q500 -120 610 -40Q660 10 600 70Q480 110 330 80Z', white, {
    sh: 46,
    hatch: 2,
    rim: 2.2,
    line,
    inner: `<path d="M330 -40Q480 -76 590 -20" fill="none" stroke="${gold}" stroke-width="8"/>`,
  });
  out += lp.form('M470 -64Q560 -66 616 -8L520 4Q500 -40 470 -64Z', '#7fe6ff', { line: line * 0.8, warm: 0, inner: lp.brush([[492, -56], [540, -50], [588, -20]], 5, '#ffffff', [0.3, 0.3], 0.85) + lp.glow(560, -30, 60, '#ffffff', 0.4) });
  // The near halves of the rings, in front of the spine: lit windows all round, gold trim.
  for (const rx of rings) {
    out += lp.form(ringHalf(rx, 80, 206, 36, 150, true), white, {
      sh: 24,
      hatch: 1,
      rim: 2.4,
      line,
      inner: `<path d="M${rx} -178A58 178 0 0 1 ${rx} 178" fill="none" stroke="#ffe2a8" stroke-width="7" stroke-dasharray="6 10"/><path d="M${rx} -196A72 196 0 0 1 ${rx} 196" fill="none" stroke="${gold}" stroke-width="4"/>`,
    });
  }
  // GaScu's vines, coiling along the spine and round the rings.
  const v = o.vines ?? 0;
  if (v > 0) {
    const color = o.gold ? '#e8a830' : GASCU.stem;
    const vo: VineOpts = { color, glow: o.gold ? GASCU.gold : GASCU.glow, leaves: 3, buds: o.gold ? 0 : 4, budColor: GASCU.glow, curls: 4, line: line * 0.8 };
    const along = (x0: number, x1: number, amp: number, ph: number, n = 9): P[] => {
      const pts: P[] = [];
      for (let i = 0; i <= n; i++) {
        const t = i / n;
        pts.push([x0 + (x1 - x0) * t, Math.sin(t * Math.PI * 3 + ph) * amp]);
      }
      return pts;
    };
    const mid = -60;
    const len = 520 * v;
    out += vine(lp, along(mid - len, mid + len * 0.9, 50, 0), 14, { ...vo, seed: 3 });
    if (v > 0.4) {
      out += vine(lp, along(mid - len * 0.8, mid + len * 0.7, 40, 2.2, 7), 11, { ...vo, seed: 4 });
      for (const rx of rings) {
        if (Math.abs(rx - mid) > len) continue;
        out += vine(
          lp,
          [
            [rx - 10, 40],
            [rx + 50, 110],
            [rx + 40, 180],
            [rx - 6, 214],
          ],
          9,
          { ...vo, leaves: 2, curls: 0, seed: rx },
        );
      }
    }
    if (o.gold) {
      const rf = rng(77);
      for (let i = 0; i < 10; i++) {
        const fx = mid - len + rf() * len * 1.9;
        out += flower(lp, fx, Math.sin(rf() * 6) * 40, 14 + rf() * 8, ['#ff8ad8', '#ffd166', '#5e9bff', '#ffffff'][i % 4]);
      }
    }
  }
  return at(x, y, s, out, o.flip, o.rot ?? 0);
}

/**
 * A star seen close up: its corona and rays, the white-hot disc (darker toward the limb), loops of fire
 * rising off its edge and granules on its face. Centred at (sx, sy), `sr` in radius.
 */
export function sun(pen: Pen, sx: number, sy: number, sr: number): string {
  let out = '';
  // The corona, then the disc with its limb darkening toward the edge.
  out += `<circle cx="${sx}" cy="${sy}" r="${sr * 2.6}" fill="${pen.rad(
    [
      [0, '#ffb060', 0.9],
      [0.4, '#e8501a', 0.55],
      [1, '#8a1a0e', 0],
    ],
    sx,
    sy,
    sr * 2.6,
    true,
  )}"/>`;
  out += godRays(pen, sx, sy, [-130, -100, -70, -40, -10, 30, 60, 100, 140, 175, 210, 240], 5, sr * 2.8, '#ffd890', 0.3);
  out += `<circle cx="${sx}" cy="${sy}" r="${sr}" fill="${pen.rad(
    [
      [0, '#fffbe8'],
      [0.45, '#ffe89a'],
      [0.8, '#ffb050'],
      [1, '#ff7a2a'],
    ],
    sx,
    sy,
    sr,
    true,
  )}"/>`;
  // Loops of fire rising off the limb, and granules on the face.
  const limb = (deg: number, k = 1): P => add([sx, sy], mul(dir(deg), sr * k));
  const loops: [P[], number][] = [
    [[limb(-60), limb(-50, 1.25), limb(-36, 1.2), limb(-30)], 22],
    [[limb(60), limb(72, 1.18), limb(84, 1)], 26],
    [[limb(160), limb(168, 1.22), limb(180, 1.28), limb(188)], 18],
    [[limb(-150), limb(-160, 1.15), limb(-168)], 16],
  ];
  out += pen.brushes(loops, '#ffd166', [0.3, 0.3], 0.75) + pen.brushes(
    loops.map(([p, w]) => [p, w * 0.35] as [P[], number]),
    '#fff6d0',
    [0.3, 0.3],
    0.85,
  );
  const rand = rng(5);
  const gran: [P[], number][] = [];
  for (let i = 0; i < 30; i++) {
    const a = rand() * Math.PI * 2;
    const d = sr * (0.3 + rand() * 0.6);
    const p: P = [sx + Math.cos(a) * d, sy + Math.sin(a) * d];
    gran.push([[p, add(p, [16 + rand() * 26, (rand() - 0.5) * 14])], 7]);
  }
  out += pen.brushes(gran, '#ff9a40', [0.4, 0.4], 0.35);
  return out + bloom(pen, sx, sy, sr * 0.7, '#fffbe8', 0.8);
}

/**
 * Gaia Nova seen from space: blue oceans, green lands, swirls of white cloud, a night side turned away from
 * `light` (the direction toward its sun) and a thin glowing atmosphere. Centred at (x, y), `r` in radius.
 */
export function planet(pen: Pen, x: number, y: number, r: number, light: P = [0.8, -0.3]): string {
  const id = pen.uid();
  pen.def(id, `<clipPath id="${id}"><path d="${circleD(x, y, r)}"/></clipPath>`);
  const k = r / 100;
  const land = (pts: P[]) => `<path d="${dSmooth(pts.map(([px, py]) => [x + px * k, y + py * k] as P))}" fill="#4fae5a"/>`;
  const clouds: [P[], number][] = [
    [
      [
        [-80, -40],
        [-30, -54],
        [20, -44],
      ],
      9,
    ],
    [
      [
        [-40, 30],
        [20, 20],
        [70, 34],
      ],
      8,
    ],
    [
      [
        [10, -80],
        [50, -70],
      ],
      6,
    ],
  ];
  const night = pen.rad(
    [
      [0, '#000010', 0],
      [0.55, '#000010', 0],
      [1, '#05061a', 0.88],
    ],
    0.5 + light[0] * 0.3,
    0.5 + light[1] * 0.3,
    0.75,
  );
  return (
    pen.glow(x, y, r * 1.5, '#7fd0ff', 0.45) +
    `<g clip-path="url(#${id})"><path d="${circleD(x, y, r)}" fill="#2a78c8"/>` +
    land([
      [-70, -30],
      [-30, -60],
      [10, -40],
      [0, 10],
      [-40, 30],
      [-80, 10],
    ]) +
    land([
      [20, 20],
      [70, 0],
      [90, 40],
      [50, 80],
      [10, 60],
    ]) +
    pen.brushes(
      clouds.map(([p, w]) => [p.map(([px, py]) => [x + px * k, y + py * k] as P), w * k] as [P[], number]),
      '#ffffff',
      [0.3, 0.3],
      0.85,
    ) +
    `<path d="${circleD(x, y, r)}" fill="${night}"/></g>` +
    `<path d="${circleD(x, y, r)}" fill="none" stroke="#bfefff" stroke-width="${r1(3 * k + 1)}" opacity=".8"/>` +
    `<path d="${circleD(x, y, r)}" fill="none" stroke="${INK}" stroke-width="${r1(1.6 * k + 1)}" opacity=".6"/>`
  );
}

/* ---------------- GaScu's seed ---------------- */

/**
 * GaScu as it arrived: a seed in a husk of dark magenta plates, pink light blazing through its seams, two
 * little sprouts curling from its tip, flying like a comet toward `deg` (screen degrees, clockwise from
 * +x) with a long tail of light behind it. Centred on the seed; about 180 long at scale 1, the tail `tail` long.
 */
export function seedComet(pen: Pen, x: number, y: number, s: number, deg: number, tail = 900): string {
  const lp = pen.local(false, deg);
  const rand = rng(9);
  let out = '';
  // The tail: a widening plume fading away behind, a hot core along its axis, trailing sparks.
  const plume = (w0: number, w1: number, len: number, color: string, op: number) => {
    const paint = lp.lin(
      [
        [0, color, op],
        [0.5, color, op * 0.4],
        [1, color, 0],
      ],
      0,
      0,
      -len,
      0,
      true,
    );
    return `<path d="M30 ${-w0}Q${r1(-len * 0.5)} ${r1(-w1 * 0.8)} ${-len} ${-w1}L${-len} ${w1}Q${r1(-len * 0.5)} ${r1(w1 * 0.8)} 30 ${w0}Q60 0 30 ${-w0}Z" fill="${paint}"/>`;
  };
  for (let i = 0; i < 12; i++) {
    const t = i / 11;
    out += lp.glow(-tail * t * 0.92, 0, tail * 0.16, i % 2 ? GASCU.glow : '#ffb0ec', 0.8 * (1 - t * 0.75), 70 + 190 * t);
  }
  out += plume(14, 26, tail * 0.75, '#ffffff', 0.75);
  const trails: [P[], number][] = [];
  for (let i = 0; i < 10; i++) {
    const off = (rand() - 0.5) * 2;
    const k0 = 0.12 + rand() * 0.25;
    const k1 = k0 + 0.25 + rand() * 0.45;
    trails.push([
      [
        [-tail * k1, off * 220 * k1],
        [-tail * k0, off * 220 * k0],
      ],
      3 + rand() * 4,
    ]);
  }
  out += lp.brushes(trails, '#ffffff', [0.9, 0.1], 0.55);
  for (let i = 0; i < 8; i++) {
    const k = 0.15 + rand() * 0.7;
    out += spark(lp, -tail * k, (rand() - 0.5) * 300 * k, 6 + rand() * 10, '#ffe6f8', 0.8);
  }
  out += lp.glow(0, 0, 300, GASCU.glow, 0.7, 220) + lp.glow(10, 0, 140, '#ffffff', 0.45);
  // The seed: an almond-shaped husk of dark magenta, split along its length, pink light blazing out of the split.
  const husk = 'M-96 0Q-80 -58 0 -62Q76 -58 104 0Q76 58 0 62Q-80 58 -96 0Z';
  const split: P[] = [
    [-88, 4],
    [-40, -6],
    [10, 4],
    [60, -4],
    [100, 0],
  ];
  const plates: [P[], number][] = [
    [
      [
        [-60, -50],
        [-40, -20],
        [-48, 10],
      ],
      3.4,
    ],
    [
      [
        [-10, -60],
        [8, -26],
        [0, 4],
      ],
      3.4,
    ],
    [
      [
        [44, -50],
        [56, -22],
        [50, 0],
      ],
      3,
    ],
    [
      [
        [-30, 56],
        [-16, 28],
        [-24, 8],
      ],
      3,
    ],
    [
      [
        [30, 56],
        [40, 30],
        [34, 6],
      ],
      3,
    ],
  ];
  out += lp.form(husk, '#6a2260', {
    sh: 34,
    hatch: 2,
    rim: 3.4,
    line: 3.6,
    inner:
      lp.brushes(plates, INK, [0.2, 0.5], 0.6) +
      lp.glow(0, 0, 120, GASCU.glow, 0.55, 40) +
      lp.brush(split, 22, GASCU.glow, [0.1, 0.1], 0.9) +
      lp.brush(split, 10, '#ffe6f8', [0.1, 0.1]) +
      lp.brush(split, 4, '#ffffff', [0.15, 0.15]) +
      lp.brush(
        [
          [-62, -40],
          [-20, -52],
          [30, -48],
        ],
        8,
        '#e08ad0',
        [0.3, 0.3],
        0.8,
      ),
  });
  // Two sprouts uncurling from the split at its tip, leaves and all: it is alive.
  const sprout = (pts: P[], leafDeg: number) => lp.brush(pts, 12, INK, [0.05, 0.6]) + lp.brush(pts, 6, GASCU.leafLight, [0.05, 0.6]) + leafAt(lp, pts[pts.length - 1], leafDeg, 0.62, GASCU.leafLight);
  out += sprout(
    [
      [90, -6],
      [130, -34],
      [136, -70],
      [116, -88],
    ],
    -150,
  );
  out += sprout(
    [
      [92, 6],
      [134, 22],
      [160, 10],
      [164, -8],
    ],
    -60,
  );
  return at(x, y, s, out, false, deg);
}


/* ---------------- the Heart of GaScu ---------------- */

export interface HeartOpts {
  /** Turned gold and happy (after LUX talks to it). */
  gold?: boolean;
  /** How far the petals spread (1 = wide open; default 1). */
  open?: number;
  /** Rotates the whole flower (degrees). */
  rot?: number;
}

/**
 * The Heart of GaScu: a huge glowing bulb in a crown of eight dark pointed petals, green sepals under
 * it, light-veins running through it. Centred on the bulb at (x, y); about 640 across at scale 1.
 */
export function heart(pen: Pen, x: number, y: number, s: number, o: HeartOpts = {}): string {
  const gold = !!o.gold;
  const tint = gold ? GASCU.gold : GASCU.glow;
  const light = gold ? '#fff2c4' : GASCU.light;
  const deep = gold ? GASCU.goldDeep : '#a8287e';
  const petalC = gold ? '#e89a30' : '#5a1a5e';
  const vein = gold ? '#fff0a0' : '#ff8ae0';
  const open = o.open ?? 1;
  let out = pen.glow(0, 0, 560, tint, 0.5) + pen.glow(0, 0, 300, light, 0.5);
  // The petals, behind the bulb: long, pointed, curling a little, glowing veins and a bright edge.
  for (let i = 0; i < 8; i++) {
    const a = i * 45 + 22.5 + (o.rot ?? 0);
    const lp = pen.local(false, a);
    const L = 300 * (0.86 + ((i * 5) % 3) * 0.08) * (0.75 + 0.25 * open);
    const petal = `M-70 -70Q-128 ${r1(-L * 0.62)} -24 ${r1(-L * 0.92)}Q0 ${r1(-L * 1.04)} 18 ${r1(-L)}Q120 ${r1(-L * 0.66)} 70 -70Z`;
    const veins = lp.brushes(
      [
        [
          [
            [0, -90],
            [-6, -L * 0.5],
            [6, -L * 0.9],
          ],
          5,
        ],
        [
          [
            [-20, -L * 0.42],
            [-50, -L * 0.6],
          ],
          3,
        ],
        [
          [
            [12, -L * 0.55],
            [44, -L * 0.7],
          ],
          3,
        ],
      ],
      vein,
      [0.1, 0.5],
      0.75,
    );
    out += at(0, 0, 1, lp.form(petal, petalC, { sh: 46, hatch: 2, rim: 3, line: 3.2, inner: veins + lp.glow(0, -L * 0.3, L * 0.5, tint, 0.35, L * 0.3) }), false, a);
  }
  // Green sepals cupping the bulb from below.
  for (const a of [-150, 150, 180]) {
    const lp = pen.local(false, a);
    out += at(0, 0, 1, lp.form('M-46 -110Q-70 -190 0 -236Q70 -190 46 -110Z', '#3f7a3a', { sh: 22, hatch: 1, rim: 2, line: 3 }), false, a);
  }
  // The bulb: glowing from inside, veins of light, a bright core and a glassy highlight.
  const veins: [P[], number][] = [];
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2 + 0.3;
    const p0: P = [Math.cos(a) * 26, Math.sin(a) * 30];
    const p1: P = [Math.cos(a + 0.25) * 90, Math.sin(a + 0.25) * 104];
    const p2: P = [Math.cos(a + 0.1) * 140, Math.sin(a + 0.1) * 160];
    veins.push([[p0, p1, p2], 4]);
  }
  const paint = pen.rad([
    [0, '#ffffff'],
    [0.3, light],
    [0.72, tint],
    [1, deep],
  ], 0.45, 0.42, 0.62);
  // A slow spiral of light at the core, and specks of pollen glowing under the skin.
  const spiral: P[] = [];
  for (let i = 0; i <= 14; i++) {
    const t = i / 14;
    const a = t * Math.PI * 3.2 + 0.6;
    spiral.push([Math.cos(a) * (8 + t * 96), Math.sin(a) * (8 + t * 106) - 6]);
  }
  const rs = rng(31);
  let specks = '';
  for (let i = 0; i < 16; i++) {
    const a = rs() * Math.PI * 2;
    const d = 40 + rs() * 90;
    specks += `<circle cx="${r1(Math.cos(a) * d)}" cy="${r1(Math.sin(a) * d * 1.1)}" r="${r1(2.5 + rs() * 3.5)}" fill="#ffffff" opacity="${r1(0.4 + rs() * 0.5)}"/>`;
  }
  veins.push([spiral, 6]);
  out += pen.form(ellipseD(0, 0, 150, 170), tint, {
    sh: 18,
    line: 3.6,
    rim: 2.4,
    paint,
    shade: deep,
    inner:
      pen.brushes(veins, '#ffffff', [0.2, 0.7], 0.45) +
      specks +
      pen.glow(-10, -14, 110, '#ffffff', 0.8) +
      pen.brush(
        [
          [-96, -40],
          [-70, -110],
          [-10, -138],
        ],
        14,
        '#ffffff',
        [0.3, 0.4],
        0.75,
      ) +
      pen.brush(
        [
          [-60, 120],
          [0, 150],
          [70, 120],
        ],
        10,
        deep,
        [0.3, 0.3],
        0.6,
      ),
  });
  return at(x, y, s, out);
}

/** One of the Heart's guard pods: a glowing seed-pod on a stalk, ringed with thorns. Base of the stalk at (x, y). */
export function guardPod(pen: Pen, x: number, y: number, s: number, lean = 0, color: string = GASCU.glow): string {
  const lp = pen.local(false, lean);
  const thorns: [P[], number][] = [];
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2;
    const p: P = [Math.cos(a) * 50, -130 + Math.sin(a) * 62];
    thorns.push([[p, add(p, [Math.cos(a) * 26, Math.sin(a) * 30])], 10]);
  }
  const body =
    lp.brush(
      [
        [0, 0],
        [-10, -40],
        [0, -80],
      ],
      26,
      INK,
      [0.02, 0.1],
    ) +
    lp.brush(
      [
        [0, 0],
        [-10, -40],
        [0, -80],
      ],
      17,
      '#3f8a3a',
      [0.02, 0.1],
    ) +
    lp.brushes(thorns, INK, [0.02, 0.9]) +
    lp.brushes(
      thorns.map(([p, w]) => [p, w * 0.55] as [P[], number]),
      '#5a1f3c',
      [0.02, 0.9],
    ) +
    lp.glow(0, -130, 110, color, 0.7) +
    lp.form(ellipseD(0, -130, 52, 66), '#8a2f75', {
      sh: 16,
      line: 3,
      rim: 2,
      paint: lp.rad([
        [0, '#ffffff'],
        [0.4, '#ffc0ec'],
        [1, color],
      ], 0.42, 0.38, 0.6),
      inner: lp.brush(
        [
          [-28, -150],
          [-14, -176],
        ],
        8,
        '#ffffff',
        [0.3, 0.3],
        0.8,
      ),
    });
  return at(x, y, s, body, false, lean);
}

/**
 * What the Heart became: a tiny GaScu sprout asleep in a terracotta flower pot, one closed pink bud
 * glowing softly. Bottom of the pot at (x, y); the pot is 110 wide and 100 tall at scale 1.
 */
export function sproutPot(pen: Pen, x: number, y: number, s: number): string {
  const stem: P[] = [
    [0, -96],
    [-10, -130],
    [4, -168],
    [0, -190],
  ];
  return at(
    x,
    y,
    s,
    pen.glow(0, -190, 90, GASCU.glow, 0.7) +
      pen.brush(stem, 14, INK, [0.05, 0.3]) +
      pen.brush(stem, 8, '#4f9a3a', [0.05, 0.3]) +
      leafAt(pen, [-6, -128], 200, 0.6, GASCU.leafLight) +
      leafAt(pen, [2, -150], -25, 0.55, GASCU.leaf) +
      pen.form('M0 -224Q22 -210 16 -188Q8 -176 0 -176Q-8 -176 -16 -188Q-22 -210 0 -224Z', GASCU.glow, {
        sh: 8,
        line: 2.4,
        rim: 1.4,
        paint: pen.rad([
          [0, '#ffffff'],
          [0.5, '#ffc0ec'],
          [1, GASCU.glow],
        ]),
        inner: pen.brush(
          [
            [0, -220],
            [2, -196],
            [0, -180],
          ],
          2.4,
          '#c2389a',
          [0.2, 0.2],
          0.7,
        ),
      }) +
      pen.form('M-56 -92H56L42 0H-42Z', '#d0683c', { sh: 26, hatch: 1, line: 3, rim: 1.8, inner: pen.brush([[-30, -70], [-24, -20]], 6, '#ffffff', [0.3, 0.3], 0.35) }) +
      pen.form('M-64 -108H64V-84H-64Z', '#e07a48', { sh: 8, line: 3, rim: 1.6 }) +
      `<path d="M-58 -108Q0 -122 58 -108Q0 -98 -58 -108Z" fill="#4a2818"/>`,
  );
}

/**
 * Light-words: arcs of light fanning out from (x, y) toward `deg` (screen degrees, clockwise from +x),
 * one per [radius, colour], each with a soft glow, a bright core and a dotted rhythm of light along it.
 */
export function lightWords(pen: Pen, x: number, y: number, list: [number, string][], spread = 36, deg = 0): string {
  let out = '';
  for (const [r, c] of list) {
    const pts: P[] = [];
    for (let i = 0; i <= 6; i++) {
      const a = ((deg - spread + (i / 6) * spread * 2) * Math.PI) / 180;
      pts.push([x + Math.cos(a) * r, y + Math.sin(a) * r]);
    }
    out += pen.brush(pts, 46, c, [0.25, 0.25], 0.22) + pen.brush(pts, 16, c, [0.15, 0.15]) + pen.brush(pts, 5, '#ffffff', [0.2, 0.2], 0.9);
    const dots: string[] = [];
    for (let i = 1; i < 6; i += 2) dots.push(`<circle cx="${r1(pts[i][0])}" cy="${r1(pts[i][1])}" r="7" fill="#ffffff"/>`);
    out += pen.glow(pts[3][0], pts[3][1], 40, c, 0.7) + dots.join('');
  }
  return out;
}

/* ---------------- LUX ---------------- */

/** LUX with a loose wire dangling from his side pod and sparking (the one Jason fixes when they meet). */
export function luxWith(pen: Pen, x: number, y: number, s: number, mood: LuxMood, o: { flip?: boolean; look?: P; rot?: number } = {}): string {
  const lp = pen.local(!!o.flip);
  const wire: P[] = [
    [-50, 14],
    [-66, 40],
    [-54, 66],
    [-66, 92],
  ];
  const w = lp.brush(wire, 7, INK, [0.05, 0.05]) + lp.brush(wire, 3.4, '#ff5e6a', [0.05, 0.1]) + spark(lp, -66, 96, 16, '#fff6b0') + spark(lp, -80, 84, 8, '#7fe6ff');
  return at(x, y, s, w, o.flip) + lux(pen, x, y, s, mood, o);
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

/**
 * A colonist asleep in one of GaScu's cocoons: a glowing pink pod of silk hanging from its stalk like a
 * lantern, the sleeper's face peeking out at the top. Top of the stalk at (x, y); about 190 wide and 420
 * tall at scale 1.
 */
export function cocoon(pen: Pen, x: number, y: number, s: number, look: Look, o: { gold?: boolean; tilt?: number } = {}): string {
  const glowC = o.gold ? GASCU.gold : GASCU.glow;
  const silk = o.gold ? '#ffe6a0' : '#ffb0e6';
  const deep = o.gold ? '#e09a20' : '#c2389a';
  const shell = 'M0 60Q96 80 96 210Q94 330 0 420Q-94 330 -96 210Q-96 80 0 60Z';
  const clip = pen.uid();
  pen.def(clip, `<clipPath id="${clip}"><path d="${shell}"/></clipPath>`);
  let out = pen.glow(0, 230, 240, glowC, 0.55, 280);
  // The stalk it hangs from.
  out += pen.brush(
    [
      [0, 0],
      [-8, 34],
      [0, 70],
    ],
    16,
    INK,
    [0.02, 0.2],
  );
  out += pen.brush(
    [
      [0, 0],
      [-8, 34],
      [0, 70],
    ],
    9,
    o.gold ? '#e8a830' : GASCU.stem,
    [0.02, 0.2],
  );
  // The back of the pod, glowing from inside, and the sleeper in it.
  out += pen.form(shell, deep, {
    line: 3,
    paint: pen.rad([
      [0, '#fff0fa'],
      [0.55, silk],
      [1, deep],
    ], 0.45, 0.35, 0.7),
    warm: 0,
    inner: sleeper(pen.relight({ key: [-0.85, -0.35], keyColor: '#fff0fa', depth: 0.3 }), 0, 160, 0.9, look, { tilt: o.tilt ?? 10 }),
  });
  // The silk wrapped over the sleeper from the chin down, its strands and a glossy highlight.
  const wrap = 'M-96 210Q-60 196 -40 214Q-14 236 14 214Q40 196 96 210Q94 330 0 420Q-94 330 -96 210Z';
  const strands: [P[], number][] = [
    [
      [
        [-90, 250],
        [-10, 290],
        [80, 240],
      ],
      4,
    ],
    [
      [
        [-80, 310],
        [0, 340],
        [70, 300],
      ],
      4,
    ],
    [
      [
        [-50, 370],
        [10, 380],
        [40, 360],
      ],
      3.4,
    ],
    [
      [
        [-70, 220],
        [-40, 300],
        [-20, 400],
      ],
      3,
    ],
  ];
  out += `<g clip-path="url(#${clip})">${pen.form(wrap, silk, {
    sh: 40,
    line: 2.6,
    rim: 2.4,
    shade: deep,
    inner: pen.brushes(strands, '#ffffff', [0.2, 0.3], 0.55) + pen.brushes(strands.map(([p, w]) => [p.map((q) => add(q, [0, 6])), w * 0.8] as [P[], number]), deep, [0.2, 0.3], 0.45),
  })}</g>`;
  out += `<path d="${shell}" fill="none" stroke="${INK}" stroke-width="3.4"/>`;
  out += pen.brush(
    [
      [-60, 130],
      [-74, 200],
      [-62, 280],
    ],
    10,
    '#ffffff',
    [0.3, 0.4],
    0.6,
  );
  return at(x, y, s, out);
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

