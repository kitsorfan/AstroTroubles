/**
 * Chapter 3 props and machines in the graphic-novel style, for the Sirens' Sea, Scylla's Reef and
 * Talos's Forge panels: the little sub Dolphin (with Jason and LUX in its glass bubble), Aeëtes's siren
 * buoys, LUX's music notes, kelp, the Gardeners' bronze mech and TALOS, the bronze giant.
 *
 * Like the cast, each is `name(pen, x, y, scale, opts)` and is shaded by the pen's light. Import them from
 * this file (`../gn/ch3b`); they are not re-exported from the kit's index.
 */
import { jason, POSES } from './cast';
import { limbD, type Mood, type Pose, rig, TEEN_BOY } from './body';
import { add, at, dSmooth, INK, lerp, mix, mul, type P, type Pen, perp, r1, rng, sub, unit } from './core';
import { lux, type LuxMood } from './droids';
import { spark } from './fx';

/** An ellipse as path data (for `Pen.form`). */
export const ell = (x: number, y: number, rx: number, ry = rx) => `M${r1(x - rx)} ${r1(y)}A${r1(rx)} ${r1(ry)} 0 1 0 ${r1(x + rx)} ${r1(y)}A${r1(rx)} ${r1(ry)} 0 1 0 ${r1(x - rx)} ${r1(y)}Z`;

/** A rounded rectangle as path data (top-left at x, y). */
export const rrect = (x: number, y: number, w: number, h: number, r: number) =>
  `M${r1(x + r)} ${r1(y)}H${r1(x + w - r)}Q${r1(x + w)} ${r1(y)} ${r1(x + w)} ${r1(y + r)}V${r1(y + h - r)}Q${r1(x + w)} ${r1(y + h)} ${r1(x + w - r)} ${r1(y + h)}H${r1(x + r)}Q${r1(x)} ${r1(y + h)} ${r1(x)} ${r1(y + h - r)}V${r1(y + r)}Q${r1(x)} ${r1(y)} ${r1(x + r)} ${r1(y)}Z`;

/** A thin specular streak of light along a curved metal surface. */
const shine = (pen: Pen, pts: P[], w: number, op = 0.75, color = '#fff6dc') => pen.brush(pts, w, color, [0.35, 0.45], op);

/** An almond leaf from a to b (`w` = half width): the Gardeners' light-writing is made of these. */
const leafD = (a: P, b: P, w: number) => {
  const m = lerp(a, b, 0.5);
  const n = mul(perp(unit(sub(b, a))), w);
  return `M${r1(a[0])} ${r1(a[1])}Q${r1(m[0] + n[0])} ${r1(m[1] + n[1])} ${r1(b[0])} ${r1(b[1])}Q${r1(m[0] - n[0])} ${r1(m[1] - n[1])} ${r1(a[0])} ${r1(a[1])}Z`;
};

/**
 * A line of the Gardeners' light-writing: `n` little leaves along a row centred on (x, y), `w` long,
 * glowing `color` at strength `lit` (0 = dark grooves, 1 = bright).
 */
export function lightWords(pen: Pen, x: number, y: number, n: number, w: number, lit = 1, color = '#5ff0d0', rot = 0): string {
  const step = w / Math.max(1, n - 1);
  let d = '';
  for (let i = 0; i < n; i++) {
    const c: P = [x - w / 2 + i * step, y];
    const a = (i % 2 ? 1 : -1) * 32 + rot;
    const h = step * 0.42;
    const t: P = [Math.sin((a * Math.PI) / 180) * h, -Math.cos((a * Math.PI) / 180) * h];
    d += leafD(sub(c, t), add(c, t), h * 0.42);
  }
  const fill = lit > 0.05 ? mix('#2a4a44', color, Math.min(1, lit)) : '#2a3a36';
  return (lit > 0.05 ? pen.glow(x, y, w * 0.7, color, lit * 0.55, step * 0.9) : '') + `<path d="${d}" fill="${fill}" stroke="${INK}" stroke-width="1.6"/>` + (lit > 0.4 ? `<path d="${d}" fill="#ffffff" opacity="${r1(lit * 0.35 * 100) / 100}"/>` : '');
}

/* ---------------- the little sub Dolphin ---------------- */

const SUB = { blue: '#3a8ad8', blueDark: '#24589a', white: '#eef6ff', gold: '#ffc94a', glass: '#bff4ff' };

export interface DolphinOpts {
  /** Jason's mood, where he looks and how he is posed (only his upper body shows). */
  mood?: Mood;
  look?: P;
  pose?: keyof typeof POSES | Pose;
  /** LUX in the bubble (his mood and eye colour; pink while he sings), placed relative to the bubble's centre. */
  lux?: LuxMood;
  luxEye?: string;
  luxLook?: P;
  luxAt?: P;
  /** Where the light on Jason's face comes from, if not the panel's key (a side light keeps his face clear). */
  crewKey?: P;
  /** The canopy is swung open and Jason stands up out of the cockpit. */
  open?: boolean;
  /** The headlight in the beak (with a beam reaching forward). */
  lamp?: boolean;
  /** Tilt (degrees, + noses down). */
  rot?: number;
  /** Rim-light width on the hull. */
  rim?: number;
}

/** The bubble's centre and radii, in the sub's own coordinates. */
const BUB: [number, number, number, number] = [56, -112, 134, 142];

/**
 * The little sub Dolphin, side on and facing right, centred on its hull (about 760 long at scale 1): a
 * blue back and white belly shaped like its name, a beak with a gold ring and a headlight, a curved
 * dorsal fin, side fins and tail flukes, and a big glass bubble on top where Jason steers with LUX
 * beside him.
 */
export function dolphin(pen: Pen, x: number, y: number, s: number, o: DolphinOpts = {}): string {
  const lp = pen.local(false, o.rot ?? 0);
  const rim = o.rim ?? 2.4;
  const [bx, by, brx, bry] = BUB;
  let out = '';
  // The far side fin and the tail flukes (behind the hull).
  out += lp.form('M84 58Q46 104 -6 132Q28 92 34 62Z', SUB.blueDark, { sh: 18, hatch: 2, line: 2.6 });
  out += lp.form('M-312 -10Q-344 -44 -404 -80Q-384 -38 -372 -2Q-386 36 -402 70Q-346 42 -312 12Z', SUB.blue, { sh: 26, hatch: 1, rim, line: 3, inner: lp.brushes([[[[-330, -12], [-372, -48]], 2.4], [[[-330, 10], [-370, 44]], 2.4]], INK, [0.2, 0.5], 0.6) });
  // The dorsal fin, curving back.
  out += lp.form('M-96 -102Q-128 -164 -206 -200Q-186 -146 -206 -84Z', SUB.blue, { sh: 24, hatch: 1, rim, line: 3 });
  // Jason and LUX in the cockpit, clipped to the bubble (the hull hides everything below its rim).
  const crew = cockpitCrew(lp, o);
  const clip = lp.uid();
  const clipD = o.open ? `M${bx - brx - 40} ${by + 30}V${by - bry - 140}H${bx + brx + 60}V${by + 30}Z` : `M${bx - brx} ${by + 26}V${by}A${brx} ${bry} 0 0 1 ${bx + brx} ${by}V${by + 26}Z`;
  pen.def(clip, `<clipPath id="${clip}"><path d="${clipD}"/></clipPath>`);
  if (o.open) {
    // The canopy slid back along its rails, behind Jason.
    out += at(bx - 190, by + 16, 0.9, glassDome(lp.local(false, -7), brx, bry * 0.9, true), false, -7);
  } else {
    out += `<path d="M${bx - brx} ${by + 6}A${brx} ${bry} 0 0 1 ${bx + brx} ${by + 6}Z" fill="#1e5a7a" opacity=".55"/>` + lp.glow(bx, by - 40, brx, '#8fe8ff', 0.35);
  }
  out += `<g clip-path="url(#${clip})">${crew.jason}</g>`;
  if (o.open) out += crew.lux;
  // The hull: blue on top, countershaded white below, a gold stripe and rivets.
  const hull = dSmooth([
    [-262, -30],
    [-200, -76],
    [-100, -106],
    [10, -116],
    [120, -106],
    [214, -70],
    [272, -38],
    [312, -22],
    [346, -12],
    [362, 2],
    [346, 16],
    [300, 22],
    [240, 58],
    [130, 88],
    [0, 100],
    [-130, 86],
    [-226, 54],
    [-300, 18],
    [-330, 0],
    [-306, -14],
  ]);
  const stripe = `<path d="M-300 -14Q-120 -56 80 -54Q220 -50 300 -16" fill="none" stroke="${SUB.gold}" stroke-width="9"/><path d="M-300 -14Q-120 -56 80 -54Q220 -50 300 -16" fill="none" stroke="${INK}" stroke-width="2" opacity=".5" transform="translate(0 6)"/>`;
  const rivets = [-220, -150, -80, 150, 220].map((rx) => `<circle cx="${rx}" cy="${r1(-40 - Math.cos(rx / 180) * 10)}" r="3.6" fill="${INK}" opacity=".55"/>`).join('');
  out += lp.form(hull, SUB.blue, {
    sh: 52,
    hatch: 2,
    rim,
    line: 3.4,
    axis: [1, 0],
    paint: lp.lin([
      [0, '#6ab8ff'],
      [0.6, SUB.blue],
      [1, SUB.blueDark],
    ]),
    inner: stripe + rivets + shine(lp, [[-190, -82], [-60, -104], [40, -108]], 7, 0.55),
  });
  // The white belly, from the beak back to the tail.
  const belly = dSmooth(
    [
      [360, 6],
      [300, 14],
      [210, 30],
      [90, 40],
      [-30, 40],
      [-150, 30],
      [-250, 14],
      [-322, 2],
      [-300, 20],
      [-226, 56],
      [-130, 88],
      [0, 102],
      [130, 90],
      [240, 60],
      [300, 24],
      [346, 18],
    ],
    true,
  );
  out += lp.form(belly, SUB.white, { sh: 26, hatch: 1, rim: 0, line: 2.6, axis: [1, 0] });
  // The near side fin.
  out += lp.form('M118 50Q70 112 -14 150Q24 96 36 58Z', SUB.blue, { sh: 20, hatch: 1, rim, line: 3, inner: lp.brush([[100, 60], [60, 100], [10, 132]], 2.4, INK, [0.2, 0.5], 0.6) });
  // The gold ring round the beak, and the headlight in its tip.
  out += lp.form('M300 -26Q314 0 304 26L322 24Q332 0 318 -24Z', SUB.gold, { sh: 6, line: 2.4 });
  if (o.lamp) out += lp.glow(372, 4, 70, '#fff2b0', 0.8) + lp.glow(372, 4, 24, '#ffffff', 0.9);
  out += `<circle cx="358" cy="3" r="9" fill="#fff6c8" stroke="${INK}" stroke-width="2.4"/>`;
  // The bubble's gold collar, then the glass over the crew.
  out += lp.form(`M${bx - brx - 8} ${by + 8}Q${bx} ${by - 20} ${bx + brx + 8} ${by + 8}L${bx + brx + 2} ${by + 22}Q${bx} ${by - 6} ${bx - brx - 2} ${by + 22}Z`, SUB.gold, { sh: 8, line: 2.6, rim: 1.6 });
  if (!o.open) out += at(bx, by + 6, 1, glassDome(lp, brx, bry, false)) + crew.lux;
  return at(x, y, s, out, false, o.rot ?? 0);
}

/** A glass dome (half an ellipse, base on y = 0, centred on x = 0): a faint tint, a heavy rim and reflections. */
function glassDome(pen: Pen, rx: number, ry: number, open: boolean): string {
  const d = `M${-rx} 0A${rx} ${ry} 0 0 1 ${rx} 0Z`;
  const fill = pen.rad(
    [
      [0, SUB.glass, 0.04],
      [0.75, '#9fdcff', 0.16],
      [1, '#e6fbff', 0.5],
    ],
    0.5,
    1,
    1,
  );
  // Swung open, the lid shows its gold frame along the base and catches more light.
  const frame = open ? `<path d="M${-rx - 6} 0H${rx + 6}" stroke="${INK}" stroke-width="16" stroke-linecap="round"/><path d="M${-rx - 4} 0H${rx + 4}" stroke="${SUB.gold}" stroke-width="9" stroke-linecap="round"/>` : '';
  return (
    `<path d="${d}" fill="${open ? '#dff8ff' : fill}"${open ? ' fill-opacity=".38"' : ''}/><path d="M${-rx} 0A${rx} ${ry} 0 0 1 ${rx} 0" fill="none" stroke="${INK}" stroke-width="3.4"/>` +
    frame +
    pen.brush(
      [
        [-rx * 0.78, -ry * 0.42],
        [-rx * 0.5, -ry * 0.82],
        [-rx * 0.06, -ry * 0.97],
      ],
      9,
      '#ffffff',
      [0.3, 0.4],
      open ? 0.6 : 0.85,
    ) +
    pen.brush(
      [
        [rx * 0.86, -ry * 0.34],
        [rx * 0.7, -ry * 0.62],
      ],
      5,
      '#ffffff',
      [0.4, 0.4],
      0.6,
    ) +
    `<path d="M${r1(-rx * 0.9)} ${r1(-ry * 0.2)}L${r1(-rx * 0.72)} ${r1(-ry * 0.62)}M${r1(-rx * 0.84)} ${r1(-ry * 0.12)}L${r1(-rx * 0.68)} ${r1(-ry * 0.46)}" stroke="#ffffff" stroke-width="3" opacity=".45"/>`
  );
}

/** Jason (upper body) and LUX inside a sub's bubble, positioned from the bubble's centre. */
function cockpitCrew(pen: Pen, o: DolphinOpts): { jason: string; lux: string } {
  const [bx, by, , bry] = BUB;
  const pose: Pose = typeof o.pose === 'string' ? POSES[o.pose] : (o.pose ?? { turn: 0.5, lean: 6, armN: { to: [1.0, 0.95] }, armF: { to: [1.2, 0.85] }, legN: { to: [-0.06, 0.98] }, legF: { to: [0.16, 0.96] }, handN: 'grip', handF: 'grip' });
  const js = 0.82;
  const r = rig(TEEN_BOY, pose);
  // Head centre inside the bubble (higher when he stands up out of the open cockpit).
  const head: P = o.open ? [bx - 6, by - bry * 1.02] : [bx - 20, by - bry * 0.47];
  const feet: P = [head[0] - r.head[0] * js, head[1] - r.head[1] * js];
  const j = jason(o.crewKey ? pen.relight({ key: o.crewKey }) : pen, feet[0], feet[1], js, { pose, mood: o.mood ?? 'determined', look: o.look, blaster: false, rim: 1.2 });
  const la = o.luxAt ?? (o.open ? [180, -300] : [84, -34]);
  const l = o.lux ? lux(pen, bx + la[0], by + la[1], o.open ? 1.1 : 0.68, o.lux, { look: o.luxLook, eye: o.luxEye }) : '';
  return { jason: j, lux: l };
}

/* ---------------- Aeëtes's siren buoys ---------------- */

/**
 * A siren buoy, centred on its gold ball (radius 80 at scale 1): a riveted gold sphere with a crown of
 * fins, one glowing pink lens, a pink speaker horn on its side pointing left (`flip` points it right)
 * and a chain down to the sea floor (`chain` long).
 */
export function sirenBuoy(pen: Pen, x: number, y: number, s: number, o: { chain?: number; flip?: boolean; singing?: boolean } = {}): string {
  const lp = pen.local(!!o.flip);
  const gold = '#f0b840';
  const pink = '#ff6fb0';
  let out = '';
  // The chain: links alternating face-on and edge-on.
  const len = o.chain ?? 420;
  let links = '';
  for (let ly = 84; ly < len; ly += 26) {
    const face = Math.round(ly / 26) % 2 === 0;
    links += face ? `<ellipse cx="0" cy="${ly}" rx="9" ry="15" fill="none" stroke="${INK}" stroke-width="8"/><ellipse cx="0" cy="${ly}" rx="9" ry="15" fill="none" stroke="#8a6a3a" stroke-width="3.4"/>` : `<rect x="-3.5" y="${ly - 15}" width="7" height="30" rx="3.5" fill="#6a4a2a" stroke="${INK}" stroke-width="2.6"/>`;
  }
  out += links;
  // The crown of fins on top.
  const fins: [number, number][] = [
    [-52, -40],
    [-24, -18],
    [8, -2],
    [38, 18],
  ];
  out += fins.map(([fx, a]) => lp.form(`M${fx - 16} -62L${fx - 6 + a * 0.6} -128L${fx + 16} -66Z`, '#e0a030', { sh: 8, line: 2.4, rim: 1.6 })).join('');
  // The horn's glow, and the speaker horn: a pink trumpet bell, its mouth turned toward the left.
  if (o.singing !== false) out += lp.glow(-180, 0, 170, pink, 0.85) + lp.glow(-170, 0, 70, '#ffffff', 0.5);
  out += lp.form('M-58 -26Q-124 -28 -168 -84L-168 84Q-124 28 -58 26Z', pink, { sh: 26, hatch: 1, line: 3, rim: 2, inner: lp.brushes([[[[-70, -14], [-150, -56]], 3], [[[-70, 14], [-150, 56]], 3]], '#c83a80', [0.2, 0.3], 0.8) });
  out += lp.form(ell(-168, 0, 26, 86), '#5a1038', {
    line: 3,
    inner: `<ellipse cx="-164" cy="0" rx="18" ry="70" fill="${lp.rad([
      [0, '#ffffff'],
      [0.35, '#ffb0d8'],
      [1, '#ff3a9a'],
    ])}"/><ellipse cx="-162" cy="0" rx="7" ry="30" fill="#ffffff" opacity=".8"/>`,
  });
  // The ball: riveted gold, with an equator seam and one pink lens.
  const rivets = [-60, -36, -12, 12, 36, 60].map((rx) => `<circle cx="${rx}" cy="${r1(6 + Math.abs(rx) * -0.05)}" r="3.4" fill="${INK}" opacity=".6"/>`).join('');
  out += lp.form(ell(0, 0, 80), gold, {
    sh: 34,
    hatch: 2,
    rim: 2.6,
    line: 3.4,
    paint: lp.rad(
      [
        [0, '#fff2b0'],
        [0.5, '#ffc94a'],
        [1, '#d8941c'],
      ],
      0.35,
      0.3,
      0.75,
    ),
    inner: `<path d="M-80 -4Q0 22 80 -4M-80 10Q0 36 80 10M-10 -80Q-34 0 -10 80" fill="none" stroke="${INK}" stroke-width="3" opacity=".55"/>` + rivets + shine(lp, [[-52, -42], [-22, -64], [14, -70]], 8, 0.8),
  });
  out += lp.glow(22, -24, 44, pink, 0.9) + lp.form(ell(22, -24, 20), '#2a0a1e', { line: 3, inner: `<circle cx="22" cy="-24" r="12" fill="${pink}"/><circle cx="22" cy="-24" r="5" fill="#fff"/><circle cx="16" cy="-30" r="3.4" fill="#fff" opacity=".9"/>` });
  return at(x, y, s, out, o.flip);
}

/** Rings of siren song spreading from a horn at (x, y) along `deg` (as `dir` measures it): pink ellipses, growing and fading. */
export function soundRings(pen: Pen, x: number, y: number, deg: number, n: number, gap: number, color = '#ff6fb0'): string {
  const d: P = [Math.sin((deg * Math.PI) / 180), Math.cos((deg * Math.PI) / 180)];
  let out = '';
  for (let i = 0; i < n; i++) {
    const c = add([x, y], mul(d, gap * (i + 0.6)));
    const ry = 80 + i * 34;
    const rx = 22 + i * 9;
    const op = 0.95 - (i / n) * 0.7;
    const rot = 90 - deg;
    out += `<g transform="translate(${r1(c[0])} ${r1(c[1])}) rotate(${r1(rot)})">${pen.glow(0, 0, rx * 2.2, color, op * 0.5, ry * 1.1)}<ellipse rx="${rx}" ry="${ry}" fill="none" stroke="${INK}" stroke-width="${r1(13 - i)}" opacity="${r1(op * 0.6 * 100) / 100}"/><ellipse rx="${rx}" ry="${ry}" fill="none" stroke="${color}" stroke-width="${r1(9 - i * 0.8)}" opacity="${r1(op * 100) / 100}"/><ellipse rx="${rx}" ry="${ry}" fill="none" stroke="#ffffff" stroke-width="2.4" opacity="${r1(op * 0.7 * 100) / 100}"/></g>`;
  }
  return out;
}

/** A music note (LUX's counter-song): an inked, glowing eighth note, or two beamed together (`pair`). */
export function note(pen: Pen, x: number, y: number, s: number, color: string, rot = 0, pair = false): string {
  const lp = pen.local(false, rot);
  const head = (hx: number, hy: number) => lp.form(`M${hx - 17} ${hy + 4}Q${hx - 18} ${hy - 12} ${hx + 2} ${hy - 13}Q${hx + 19} ${hy - 12} ${hx + 17} ${hy - 2}Q${hx + 14} ${hy + 13} ${hx - 4} ${hy + 13}Q${hx - 16} ${hy + 12} ${hx - 17} ${hy + 4}Z`, color, { sh: 7, line: 2.6, rim: 0, warm: 0 });
  let out = lp.glow(pair ? 22 : 8, -36, pair ? 80 : 60, color, 0.7);
  if (pair) {
    const stems: [P[], number][] = [
      [
        [
          [13, -2],
          [14, -84],
        ],
        7,
      ],
      [
        [
          [61, -14],
          [62, -96],
        ],
        7,
      ],
    ];
    out += lp.brushes(stems, INK, [0, 0]) + lp.brush([[10, -88], [40, -98], [66, -102]], 20, INK, [0.05, 0.05]) + lp.brush([[13, -86], [40, -96], [63, -100]], 11, color, [0.05, 0.05]);
    out += lp.brushes(stems.map(([p]) => [p, 3.2] as [P[], number]), color, [0, 0]);
    out += head(0, 0) + head(48, -12);
  } else {
    out += lp.brush([[13, -2], [14, -86]], 7, INK, [0, 0]) + lp.brush([[13, -84], [32, -64], [36, -36], [28, -24]], 12, INK, [0.05, 0.6]) + lp.brush([[13, -2], [14, -84]], 3.2, color, [0, 0]) + lp.brush([[14, -82], [31, -63], [33, -40]], 6, color, [0.05, 0.6]);
    out += head(0, 0);
  }
  out += `<ellipse cx="-4" cy="-6" rx="5" ry="3" fill="#ffffff" opacity=".9" transform="rotate(-20 -4 -6)"/>`;
  return at(x, y, s, out, false, rot);
}

/**
 * A kelp stalk rising from (x, y) to `h` tall, swaying by `sway`: a tapered stem with long ribbon leaves
 * along it, inked, `color` with a lighter edge facing the light from above.
 */
export function kelp(pen: Pen, x: number, y: number, h: number, sway: number, color: string, seed = 1, o: { line?: number; edge?: string } = {}): string {
  const rand = rng(seed);
  const stem: P[] = [];
  for (let i = 0; i <= 5; i++) {
    const t = i / 5;
    stem.push([x + Math.sin(t * 2.4 + seed) * sway * t, y - h * t]);
  }
  const leaves: [P[], number][] = [];
  for (let i = 1; i < 9; i++) {
    const t = i / 9;
    const k = Math.min(4, Math.floor(t * 5));
    const p = lerp(stem[k], stem[k + 1], t * 5 - k);
    const side = i % 2 ? 1 : -1;
    const l = 60 + rand() * 60;
    leaves.push([[p, add(p, [side * l * 0.45, -l * 0.35]), add(p, [side * l * 0.8 + sway * 0.1, -l * 0.95])], 22 + rand() * 8]);
  }
  const line = o.line ?? 3;
  const edge = o.edge ?? mix(color, '#d8ffe0', 0.4);
  return (
    pen.brushes([[stem, 26 + line * 2], ...leaves.map(([p, w]) => [p, w + line * 2] as [P[], number])], INK, [0.02, 0.9]) +
    pen.brushes([[stem, 26], ...leaves], color, [0.02, 0.9]) +
    pen.brushes(
      leaves.map(([p, w]) => [p.map((q) => add(q, [-w * 0.18, -w * 0.12])), w * 0.28] as [P[], number]),
      edge,
      [0.2, 0.6],
      0.75,
    )
  );
}

/** A loose cluster of air bubbles rising from (x, y): inked rings with a glint. */
export function bubbles(pen: Pen, x: number, y: number, n: number, spread: number, seed = 3, color = '#e8fbff'): string {
  const rand = rng(seed);
  let out = '';
  for (let i = 0; i < n; i++) {
    const r = 4 + rand() * 12;
    const bx = x + (rand() - 0.5) * spread;
    const by = y - rand() * spread * 2.2;
    out += `<circle cx="${r1(bx)}" cy="${r1(by)}" r="${r1(r)}" fill="${color}" fill-opacity=".14" stroke="${color}" stroke-width="${r1(1.4 + r * 0.12)}" opacity=".85"/><circle cx="${r1(bx - r * 0.35)}" cy="${r1(by - r * 0.35)}" r="${r1(r * 0.25)}" fill="#ffffff"/>`;
  }
  return out + (n > 6 ? spark(pen, x, y - spread, 6, color, 0.6) : '');
}

/* ---------------- coral ---------------- */

export type CoralKind = 'fan' | 'brain' | 'tube' | 'stag';

/**
 * A coral, base at (x, y), about 160 tall at scale 1: a sea fan (branching strokes), a brain coral
 * (a grooved dome), a cluster of tube coral, or staghorn (blunt branches). `color` is its lit colour.
 */
export function coral(pen: Pen, x: number, y: number, s: number, kind: CoralKind, color: string, o: { seed?: number; flip?: boolean; line?: number } = {}): string {
  const rand = rng(o.seed ?? 5);
  const line = o.line ?? 3;
  const lit = mix(color, '#ffffff', 0.35);
  let out = '';
  if (kind === 'brain') {
    const grooves: [P[], number][] = [];
    for (let i = 0; i < 6; i++) {
      const gy = -16 - i * 15;
      const w = 80 * Math.sqrt(Math.max(0.05, 1 - ((gy + 50) / 60) ** 2));
      const pts: P[] = [];
      for (let k = 0; k <= 6; k++) pts.push([-w + (k * 2 * w) / 6, gy + (k % 2 ? 6 : -6) * (0.6 + rand() * 0.6)]);
      grooves.push([pts, 2.6]);
    }
    out += pen.form('M-96 0Q-100 -96 0 -106Q100 -96 96 0Z', color, { sh: 40, hatch: 2, rim: 2, line, inner: pen.brushes(grooves, INK, [0.2, 0.3], 0.6) });
  } else if (kind === 'tube') {
    const tubes: [number, number, number][] = [
      [-50, 110, 26],
      [-14, 150, 30],
      [26, 124, 26],
      [58, 86, 22],
    ];
    for (const [tx, th, tw] of tubes) {
      out += pen.form(rrect(tx - tw, -th, tw * 2, th + 6, tw * 0.6), color, { sh: tw * 0.8, hatch: 1, rim: 2, line, axis: [0, 1] });
      out += pen.form(ell(tx, -th + 4, tw * 0.8, tw * 0.32), '#2a0a20', { line: 2 });
    }
  } else if (kind === 'fan') {
    const br: [P[], number][] = [];
    const grow = (p: P, a: number, l: number, w: number, depth: number) => {
      const q = add(p, [Math.sin((a * Math.PI) / 180) * l, -Math.cos((a * Math.PI) / 180) * l]);
      br.push([[p, lerp(p, q, 0.5), q], w]);
      if (depth > 0) {
        grow(q, a - 18 - rand() * 12, l * 0.72, w * 0.7, depth - 1);
        grow(q, a + 18 + rand() * 12, l * 0.72, w * 0.7, depth - 1);
      }
    };
    grow([0, 0], 0, 60, 16, 3);
    out += pen.brushes(br.map(([p, w]) => [p, w + line * 2] as [P[], number]), INK, [0.02, 0.4]) + pen.brushes(br, color, [0.02, 0.4]) + pen.brushes(br.map(([p, w]) => [p.map((q) => add(q, [-w * 0.2, -1])), w * 0.3] as [P[], number]), lit, [0.1, 0.5], 0.8);
  } else {
    const br: [P[], number][] = [
      [
        [
          [0, 0],
          [-6, -70],
          [-28, -136],
        ],
        30,
      ],
      [
        [
          [-4, -60],
          [30, -120],
          [44, -178],
        ],
        24,
      ],
      [
        [
          [-18, -110],
          [-56, -150],
          [-66, -196],
        ],
        18,
      ],
      [
        [
          [30, -120],
          [70, -140],
          [94, -160],
        ],
        15,
      ],
      [
        [
          [-6, -36],
          [-50, -56],
          [-78, -94],
        ],
        17,
      ],
    ];
    const tips = br.map(([p, w]) => `<circle cx="${r1(p[2][0])}" cy="${r1(p[2][1])}" r="${r1(w * 0.42 + line)}" fill="${INK}"/><circle cx="${r1(p[2][0])}" cy="${r1(p[2][1])}" r="${r1(w * 0.42)}" fill="${color}"/>`).join('');
    out += pen.brushes(br.map(([p, w]) => [p, w + line * 2] as [P[], number]), INK, [0.02, 0.2]) + pen.brushes(br, color, [0.02, 0.2]) + tips + pen.brushes(br.map(([p, w]) => [p.map((q) => add(q, [-w * 0.22, -2])), w * 0.26] as [P[], number]), lit, [0.15, 0.4], 0.85);
  }
  return at(x, y, s, out, o.flip);
}

/* ---------------- the sea at the strait ---------------- */

/**
 * CHARYBDIS seen from the side, centred at (cx, cy): a funnel of sea with foam spiralling down into a
 * dark hole and spray over its rim. `calm` draws the gentle little swirl she becomes once Scylla's pumps
 * stop: shallow, light, a few lazy curls of foam.
 */
export function whirlpool(pen: Pen, cx: number, cy: number, rx: number, ry: number, o: { calm?: boolean; seed?: number; water?: string; deep?: string; glint?: string } = {}): string {
  const rand = rng(o.seed ?? 17);
  const calm = !!o.calm;
  const water = o.water ?? '#2ab0c0';
  const deep = o.deep ?? (calm ? '#1a7a9a' : '#021820');
  const bowl = pen.rad(
    calm
      ? [
          [0, deep, 0.7],
          [0.6, mix(deep, water, 0.5), 0.5],
          [1, water, 0],
        ]
      : [
          [0, '#010a10'],
          [0.25, deep],
          [0.6, '#0b5464'],
          [0.85, mix('#1c8a96', water, 0.5)],
          [1, water, 0],
        ],
    0.5,
    0.6,
    0.55,
  );
  let out = `<ellipse cx="${r1(cx)}" cy="${r1(cy)}" rx="${r1(rx * 1.15)}" ry="${r1(ry * 1.25)}" fill="${bowl}"/>`;
  if (!calm) out += `<path d="M${r1(cx - rx * 0.86)} ${r1(cy - ry * 0.1)}Q${r1(cx)} ${r1(cy - ry * 1.05)} ${r1(cx + rx * 0.86)} ${r1(cy - ry * 0.1)}Q${r1(cx + rx * 0.3)} ${r1(cy + ry * 0.05)} ${r1(cx)} ${r1(cy + ry * 0.3)}Q${r1(cx - rx * 0.3)} ${r1(cy + ry * 0.05)} ${r1(cx - rx * 0.86)} ${r1(cy - ry * 0.1)}Z" fill="#02202a" opacity=".85"/>`;
  const arm = (a0: number, turns: number, r0: number, w: number, color: string, op: number) => {
    const pts: P[] = [];
    for (let i = 0; i <= 12; i++) {
      const t = i / 12;
      const ang = a0 + t * turns * Math.PI * 2;
      const r = r0 * (1 - t * (calm ? 0.7 : 0.85)) * (0.985 + rand() * 0.03);
      pts.push([cx + Math.cos(ang) * rx * r, cy + Math.sin(ang) * ry * r + (calm ? 0 : (1 - r) * ry * 0.45)]);
    }
    return pen.brush(pts, w, color, [0.15, 0.85], op);
  };
  if (calm) {
    for (let i = 0; i < 4; i++) out += arm(rand() * 6.3, 0.6 + rand() * 0.4, 0.7 + rand() * 0.3, 5 + rand() * 5, '#e8fbff', 0.6 + rand() * 0.3);
    out += arm(0.5, 0.9, 0.35, 5, '#ffffff', 0.8);
    return out + pen.glow(cx, cy, rx * 0.5, '#e8fbff', 0.3, ry * 0.6);
  }
  for (let i = 0; i < 9; i++) out += arm(rand() * 6.3, 0.5 + rand() * 0.7, 0.75 + rand() * 0.3, 8 + rand() * 8, '#021820', 0.6);
  for (let i = 0; i < 12; i++) out += arm(rand() * 6.3, 0.35 + rand() * 0.7, 0.6 + rand() * 0.45, 4 + rand() * 10, i % 3 ? '#d8f6fa' : '#ffffff', 0.55 + rand() * 0.4);
  for (let i = 0; i < 4; i++) out += arm(3.4 + i * 0.5 + rand() * 0.3, 0.25, 1.02, 7, o.glint ?? '#fff6d8', 0.9);
  out += `<ellipse cx="${r1(cx)}" cy="${r1(cy + ry * 0.36)}" rx="${r1(rx * 0.1)}" ry="${r1(ry * 0.08)}" fill="#000306"/>`;
  out += pen.brush(
    [
      [cx - rx * 1.05, cy + ry * 0.2],
      [cx - rx * 0.5, cy + ry * 1.05],
      [cx + rx * 0.4, cy + ry * 1.08],
      [cx + rx * 1.05, cy + ry * 0.25],
    ],
    12,
    '#f0fcff',
    [0.3, 0.3],
    0.85,
  );
  let drops = '';
  for (let i = 0; i < 46; i++) {
    const a = rand() * Math.PI * 2;
    const rr = 0.9 + rand() * 0.35;
    drops += `M${r1(cx + Math.cos(a) * rx * rr)} ${r1(cy + Math.sin(a) * ry * rr - rand() * 60)}h0`;
  }
  out += `<path d="${drops}" stroke="#f4feff" stroke-width="4" stroke-linecap="round" opacity=".75"/>`;
  return out + pen.glow(cx, cy - ry * 0.4, rx * 1.1, '#e8fbff', 0.3, ry * 1.4);
}

/**
 * Spray flung up where something breaks the surface at (x, y): arcs of white drops and a foam collar `w`
 * wide. `toward` throws all the spray one way (1 right, -1 left) instead of both.
 */
export function splash(pen: Pen, x: number, y: number, w: number, seed = 2, toward = 0): string {
  const rand = rng(seed);
  const arcs: [P[], number][] = [];
  let drops = '';
  for (let i = 0; i < (toward ? 8 : 14); i++) {
    const side = toward || (i % 2 ? 1 : -1);
    const sx = x + side * w * (0.2 + rand() * 0.3);
    const h = 40 + rand() * 80;
    const reach = side * (90 + rand() * 150);
    arcs.push([[[sx, y], [sx + reach * 0.4, y - h], [sx + reach, y - h * 0.6]], 6 + rand() * 8]);
    for (let k = 0; k < 3; k++) drops += `M${r1(sx + reach * (1 + rand() * 0.4))} ${r1(y - h * (0.3 + rand() * 0.6))}h0`;
  }
  return (
    pen.brushes(arcs, '#ffffff', [0.1, 0.8], 0.75) +
    `<path d="${drops}" stroke="#ffffff" stroke-width="7" stroke-linecap="round" opacity=".85"/>` +
    pen.brush(
      [
        [x - w * 0.6, y + 6],
        [x - w * 0.2, y - 8],
        [x + w * 0.2, y - 6],
        [x + w * 0.6, y + 6],
      ],
      22,
      '#ffffff',
      [0.25, 0.25],
      0.9,
    )
  );
}

/* ---------------- the Gardeners' bronze mech ---------------- */

/** The mech's colours (as in the game's model): warm bronze, green patina, dark iron joints, teal light-lines. */
export const MECH = { bronze: '#c8862e', light: '#e8b060', patina: '#5aa88a', iron: '#3a3230', teal: '#5ff0d0' };

/** A shaded metal cylinder from a to b (a limb segment of a machine). */
const pipe = (pen: Pen, a: P, b: P, w0: number, w1: number, color: string, rim: number, shade?: string) => pen.form(limbD(a, b, w0, w1, 0, 1, 0.18), color, { sh: Math.max(w0, w1) * 0.42, hatch: 2, rim, line: 3.4, axis: sub(b, a), shade });

/** A shaded iron ball joint with a glint. */
const ball = (pen: Pen, c: P, r: number, color: string, rim: number) => pen.form(ell(c[0], c[1], r), color, { sh: r * 0.6, hatch: 2, rim, line: 3.2, inner: `<ellipse cx="${r1(c[0] + pen.L[0] * r * 0.45)}" cy="${r1(c[1] + pen.L[1] * r * 0.45)}" rx="${r1(r * 0.22)}" ry="${r1(r * 0.13)}" fill="#ffffff" opacity=".5"/>` });

export interface MechOpts {
  /** Sitting on a bench (seat 330 above its feet), legs hanging, fists resting beside it. */
  sit?: boolean;
  /** How awake it is: 0 asleep (eye and light-lines dark) to 1 fully lit. */
  awake?: number;
  /** Jason in the glass bubble (his mood; leave out for an empty bubble), where he looks and his pose. */
  jason?: Mood;
  jasonLook?: P;
  jasonPose?: keyof typeof POSES | Pose;
  /** Where the light on Jason's face comes from, if not the panel's key (a side light keeps his face clear). */
  jasonKey?: P;
  /** Raise the far fist in a wave. */
  wave?: boolean;
  rim?: number;
}

/** Where a rider sits on the mech's far shoulder pad (its top), in the mech's own coordinates. */
export const mechPerch = (sit = false): P => [372, sit ? -816 : -886];

/**
 * The Gardeners' bronze mech, feet at (x, y), about 1100 tall at scale 1 (twice Jason's height) and
 * turned a little to the right: a round bronze barrel of a body with patina bands and light-word plates,
 * one wide teal eye across its chest, a glass bubble on top (Jason's seat) with a leaf crest, iron ball
 * joints, big box fists and flat feet. Its far shoulder pad is Atalanta's perch (`mechPerch`).
 */
export function mech(pen: Pen, x: number, y: number, s: number, o: MechOpts = {}): string {
  const sit = !!o.sit;
  const rim = o.rim ?? 2.6;
  const awake = o.awake ?? 1;
  const C = MECH;
  const up = sit ? 70 : 0;
  const far = (c: string) => pen.dark(c, 0.7);
  // The arms: shoulder, elbow, wrist for each side (-1 near, 1 far).
  const armPts = (sx: number): [P, P, P] => {
    if (sx > 0 && o.wave) return [[340, -760 + up], [520, -880 + up], [560, -1040 + up]];
    if (sit) return [[sx * 350, -690], [sx * 450, -560], [sx * 452, -470]];
    return [[sx * 350, -760], [sx * 392, -560], [sx * 404, -400]];
  };
  const arm = (sx: number) => {
    const [sh, el, wr] = armPts(sx);
    const k = sx > 0 ? 0.92 : 1;
    const shade = sx > 0 ? far(C.bronze) : undefined;
    const dirFist = unit(sub(wr, el));
    const fc = add(wr, mul(dirFist, 70 * k));
    const fist = at(fc[0], fc[1], 1, pen.local(false, 0).form(rrect(-82 * k, -76 * k, 164 * k, 152 * k, 34 * k), C.light, { sh: 56 * k, hatch: 2, rim, line: 3.6, shade: sx > 0 ? far(C.light) : undefined, inner: `<path d="M${r1(-82 * k)} ${r1(30 * k)}H${r1(82 * k)}V${r1(56 * k)}H${r1(-82 * k)}Z" fill="${C.patina}"/><path d="M${r1(-40 * k)} ${r1(-20 * k)}V${r1(30 * k)}M0 ${r1(-24 * k)}V${r1(30 * k)}M${r1(40 * k)} ${r1(-20 * k)}V${r1(30 * k)}" stroke="${INK}" stroke-width="3.4" opacity=".6"/>` }));
    // The pauldron: high on the body side, curving down over the outside of the shoulder.
    const [ox, oy] = sh;
    const q = (dx: number, dy: number): string => `${r1(ox + sx * dx * k)} ${r1(oy + dy)}`;
    const rivets = [
      [10, -96],
      [70, -84],
      [116, -50],
    ]
      .map(([dx, dy]) => `<circle cx="${r1(ox + sx * dx * k)}" cy="${oy + dy}" r="5" fill="${INK}" opacity=".55"/>`)
      .join('');
    const pad = pen.form(`M${q(-96, -56)}Q${q(-74, -154)} ${q(30, -146)}Q${q(164, -126)} ${q(156, 34)}Q${q(70, -16)} ${q(-96, -56)}Z`, C.light, {
      sh: 46,
      hatch: 2,
      rim,
      line: 3.6,
      shade: sx > 0 ? far(C.light) : undefined,
      inner:
        pen.brush(
          [
            [ox - sx * 92 * k, oy - 50],
            [ox + sx * 60 * k, oy - 22],
            [ox + sx * 150 * k, oy + 28],
          ],
          18,
          C.patina,
          [0.05, 0.05],
        ) +
        rivets +
        shine(
          pen,
          [
            [ox - sx * 50 * k, oy - 112],
            [ox + sx * 30 * k, oy - 132],
            [ox + sx * 100 * k, oy - 112],
          ],
          7,
          0.6,
        ),
    });
    return ball(pen, sh, 92 * k, C.iron, rim) + pipe(pen, sh, el, 122 * k, 104 * k, C.bronze, rim, shade) + ball(pen, el, 62 * k, C.iron, rim) + pipe(pen, el, wr, 108 * k, 124 * k, C.bronze, rim, shade) + fist + pad;
  };
  // The legs.
  const legStand = (sx: number) => {
    const k = sx > 0 ? 0.94 : 1;
    const shade = sx > 0 ? far(C.bronze) : undefined;
    const hip: P = [sx * 160, -430];
    const kn: P = [sx * 165, -205];
    const an: P = [sx * 172, -70];
    const foot = pen.form(`M${an[0] - 110 * k} ${-86}H${an[0] + 60 * k}Q${an[0] + 120 * k} -86 ${an[0] + 130 * k} -30V0H${an[0] - 116 * k}Z`, C.bronze, { sh: 34, hatch: 2, rim, line: 3.6, shade, inner: `<path d="M${an[0] + 50 * k} -86H${an[0] + 140 * k}V0H${an[0] + 50 * k}Z" fill="${C.patina}"/>` });
    return ball(pen, hip, 96 * k, C.iron, rim) + pipe(pen, hip, kn, 190 * k, 168 * k, C.bronze, rim, shade) + pipe(pen, kn, an, 172 * k, 212 * k, C.bronze, rim, shade) + foot + ball(pen, kn, 56 * k, C.iron, rim) + pen.form(`M${kn[0] - 60 * k + 20} ${kn[1] - 30}Q${kn[0] + 20} ${kn[1] - 86} ${kn[0] + 60 * k + 20} ${kn[1] - 30}L${kn[0] + 52 * k + 20} ${kn[1] + 40}Q${kn[0] + 20} ${kn[1] + 62} ${kn[0] - 52 * k + 20} ${kn[1] + 40}Z`, C.light, { sh: 24, line: 3, rim, shade: sx > 0 ? far(C.light) : undefined });
  };
  const legSit = (sx: number) => {
    const k = sx > 0 ? 0.94 : 1;
    const shade = sx > 0 ? far(C.bronze) : undefined;
    const kn: P = [sx * 196, -300];
    const an: P = [sx * 206, -72];
    const thigh = pen.form(ell(sx * 180, -330, 116 * k, 92 * k), C.bronze, { sh: 50, hatch: 2, rim, line: 3.6, shade });
    const foot = pen.form(rrect(an[0] - 128 * k, -92, 256 * k, 92, 26), C.bronze, { sh: 34, hatch: 2, rim, line: 3.6, shade, inner: `<path d="M${an[0] - 130 * k} -34H${an[0] + 130 * k}V2H${an[0] - 130 * k}Z" fill="${C.patina}"/>` });
    return thigh + pipe(pen, kn, an, 176 * k, 214 * k, C.bronze, rim, shade) + foot + ball(pen, kn, 56 * k, C.iron, rim) + pen.form(`M${kn[0] - 70 * k} ${kn[1] - 30}Q${kn[0]} ${kn[1] - 96} ${kn[0] + 70 * k} ${kn[1] - 30}L${kn[0] + 60 * k} ${kn[1] + 44}Q${kn[0]} ${kn[1] + 70} ${kn[0] - 60 * k} ${kn[1] + 44}Z`, C.light, { sh: 26, line: 3, rim, shade: sx > 0 ? far(C.light) : undefined, inner: shine(pen, [[kn[0] - 36 * k, kn[1] - 14], [kn[0] + 30 * k, kn[1] - 18]], 6, 0.6) });
  };
  // The body: hip skirt, the round barrel, its patina band, the light-word plates and the eye.
  const lit = Math.max(0, Math.min(1, awake));
  const plate = (px: number, w: number) => rrect(px - w / 2, -730, w, 150, 22);
  const plates =
    `<path d="${plate(-196, 132)}${plate(206, 104)}" fill="${C.light}" stroke="${INK}" stroke-width="3"/>` +
    `<path d="${plate(-196, 132)}${plate(206, 104)}" fill="${INK}" opacity=".12" transform="translate(-6 8)"/>` +
    lightWords(pen, -196, -670, 4, 92, lit) +
    lightWords(pen, 206, -670, 4, 70, lit * 0.9);
  const band = `<path d="M-340 -560Q0 -456 340 -560V-520Q0 -414 -340 -520Z" fill="${C.patina}"/><path d="M-340 -560Q0 -456 340 -560M-340 -520Q0 -414 -340 -520" fill="none" stroke="${INK}" stroke-width="3"/>`;
  const seams = `<path d="M-60 -918Q-90 -660 -64 -410M150 -900Q180 -660 160 -420" fill="none" stroke="${INK}" stroke-width="3" opacity=".45"/>` + [-280, -230, 230, 280].map((rx) => `<circle cx="${rx}" cy="${r1(-600 + Math.abs(rx) * 0.1)}" r="5" fill="${INK}" opacity=".55"/>`).join('');
  const torso =
    pen.form(ell(0, -656, 330, 272), C.bronze, {
      sh: 120,
      hatch: 2,
      rim,
      line: 4,
      paint: pen.rad(
        [
          [0, '#ffd08a'],
          [0.45, C.bronze],
          [1, '#8a5418'],
        ],
        0.32,
        0.28,
        0.8,
      ),
      inner: band + plates + seams + shine(pen, [[-250, -800], [-150, -880], [-30, -906]], 12, 0.55),
    }) +
    // The eye: one wide visor across the chest.
    (lit > 0.05 ? pen.glow(30, -742, 220 * (0.5 + lit * 0.5), C.teal, 0.8 * lit, 70) : '') +
    pen.form(rrect(-70, -766, 200, 48, 24), lit > 0.05 ? mix('#2a5a52', '#c8fff4', lit) : '#1e3a36', { line: 3.2, inner: lit > 0.3 ? `<path d="M-46 -752H40" stroke="#ffffff" stroke-width="7" stroke-linecap="round" opacity="${r1(lit * 0.8 * 10) / 10}"/>` : `<path d="M-50 -742Q30 -728 110 -742" fill="none" stroke="#3a6a60" stroke-width="5"/>` });
  const skirt = pen.form(ell(0, -430, 236, 82), C.iron, { sh: 40, hatch: 2, rim, line: 3.6 });
  // The head: an iron ring with a light-bronze rim, the glass bubble with Jason in it, and the leaf crest.
  const ring = pen.form('M-206 -884A206 42 0 0 0 206 -884V-842A206 42 0 0 1 -206 -842Z', C.iron, { sh: 16, line: 3.4, rim }) + pen.brush([[-206, -884], [0, -842], [206, -884]], 16, C.light, [0.05, 0.05]) + pen.brush([[-150, -868], [0, -846], [80, -852]], 5, '#fff2d0', [0.3, 0.3], 0.7);
  let crew = '';
  if (o.jason) {
    const pose: Pose = typeof o.jasonPose === 'string' ? POSES[o.jasonPose] : (o.jasonPose ?? { turn: 0.45, lean: 4, armN: { to: [0.9, 1.0] }, armF: { to: [1.1, 0.9] }, legN: { to: [-0.06, 0.98] }, legF: { to: [0.16, 0.96] }, handN: 'grip', handF: 'grip' });
    const r = rig(TEEN_BOY, pose);
    const js = 1;
    const head: P = [6, -990];
    const clip = pen.uid();
    pen.def(clip, `<clipPath id="${clip}"><path d="M-200 -860V-884A200 210 0 0 1 200 -884V-860Z"/></clipPath>`);
    crew = `<g clip-path="url(#${clip})">${jason(o.jasonKey ? pen.relight({ key: o.jasonKey }) : pen, head[0] - r.head[0] * js, head[1] - r.head[1] * js, js, { pose, mood: o.jason, look: o.jasonLook, blaster: false, rim: 1.4 })}</g>`;
  }
  const bubbleBack = `<path d="M-200 -884A200 210 0 0 1 200 -884Z" fill="#2a5060" opacity=".45"/>` + pen.glow(0, -960, 170, '#8fe8ff', 0.3);
  const crest = pen.form('M-22 -1086Q-36 -1170 8 -1236Q40 -1168 24 -1086Z', C.patina, { sh: 16, hatch: 1, line: 3, rim, inner: pen.brush([[2, -1092], [6, -1160], [8, -1220]], 3, INK, [0.2, 0.3], 0.6) });
  const head = bubbleBack + crew + at(0, -884, 1, glassDome(pen, 200, 210, false)) + ring + crest;
  // Back to front.
  const upper = (body: string) => (up ? `<g transform="translate(0 ${up})">${body}</g>` : body);
  let out = '';
  if (sit) {
    out += arm(1) + upper(skirt) + upper(torso) + upper(head) + legSit(1) + legSit(-1) + arm(-1);
  } else {
    out += arm(1) + legStand(1) + legStand(-1) + skirt + torso + head + arm(-1);
  }
  return at(x, y, s, out);
}

/* ---------------- TALOS ---------------- */

/** Talos's colours (as in the game's model): old dark bronze, green patina, iron, golden ichor, and his eye. */
export const TALOS = { bronze: '#a8692a', light: '#d8944a', patina: '#4a9a7a', iron: '#2e2622', ichor: '#ffd04a', calm: '#5ff0d0', angry: '#ff3a2a' };

/** A ring of eight glowing leaves round (x, y): the light-word for "keep safe" carved on Talos's chest. */
function leafRing(pen: Pen, x: number, y: number, r: number, color: string, lit: number): string {
  let d = '';
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const dv: P = [Math.cos(a), Math.sin(a) * 0.86];
    d += leafD(add([x, y], mul(dv, r * 0.55)), add([x, y], mul(dv, r * 1.05)), r * 0.13);
  }
  return pen.glow(x, y, r * 1.6, color, lit * 0.6) + `<path d="${d}" fill="${mix('#2a4a44', color, lit)}" stroke="${INK}" stroke-width="2.4"/>`;
}

export interface TalosOpts {
  /** Aeëtes's red control (default: his own calm teal eye). */
  angry?: boolean;
  /** How far he bows his head (degrees; + nods down toward the left). */
  nod?: number;
  /** Little comic motion arcs in front of his face (he is nodding). */
  nodLines?: boolean;
  rim?: number;
}

/**
 * TALOS, the Gardeners' bronze guardian, sitting, seen from the front and turned to face left; hips at
 * (x, y), about 1000 tall from his crest to his hips at scale 1. A barrel chest with the "keep safe"
 * leaf-ring on its plate, great shoulder domes, iron ball joints, a round helmet head with one wide eye
 * and a leaf crest, fists resting at his sides, thighs coming toward us. His crown is gone.
 */
export function talos(pen: Pen, x: number, y: number, s: number, o: TalosOpts = {}): string {
  const C = TALOS;
  const rim = o.rim ?? 3;
  const eye = o.angry ? C.angry : C.calm;
  const far = (c: string) => pen.dark(c, 0.72);
  const arm = (sx: number) => {
    const k = sx < 0 ? 0.94 : 1;
    const shade = sx < 0 ? far(C.bronze) : undefined;
    const sh: P = sx < 0 ? [-262, -352] : [236, -356];
    const el: P = sx < 0 ? [-318, -160] : [300, -160];
    const wr: P = sx < 0 ? [-326, 24] : [312, 26];
    const fist = pen.form(rrect(wr[0] - 58 * k, wr[1] - 6, 116 * k, 110, 26), C.light, {
      sh: 40,
      hatch: 2,
      rim,
      line: 3.6,
      shade: sx < 0 ? far(C.light) : undefined,
      inner: `<path d="M${r1(wr[0] - 60 * k)} ${wr[1] - 8}H${r1(wr[0] + 60 * k)}V${wr[1] + 16}H${r1(wr[0] - 60 * k)}Z" fill="${C.patina}"/><path d="M${r1(wr[0] - 24 * k)} ${wr[1] + 40}V${wr[1] + 96}M${r1(wr[0] + 8 * k)} ${wr[1] + 40}V${wr[1] + 98}M${r1(wr[0] + 38 * k)} ${wr[1] + 40}V${wr[1] + 96}" stroke="${INK}" stroke-width="3.4" opacity=".55"/>`,
    });
    return ball(pen, sh, 68 * k, C.iron, rim) + pipe(pen, sh, el, 108 * k, 92 * k, C.bronze, rim, shade) + ball(pen, el, 56 * k, C.iron, rim) + pipe(pen, el, wr, 96 * k, 112 * k, C.bronze, rim, shade) + fist;
  };
  // The legs: thighs coming toward us over the ledge, iron knees with plates.
  const leg = (sx: number) => {
    const k = sx < 0 ? 0.95 : 1;
    const shade = sx < 0 ? far(C.bronze) : undefined;
    const hx = sx < 0 ? -120 : 130;
    const kn: P = [hx + sx * 10, 96];
    return (
      pen.form(ell(hx, 50, 92 * k, 74), C.bronze, { sh: 40, hatch: 2, rim, line: 3.6, shade }) +
      pipe(pen, kn, [kn[0] + sx * 8, 330], 104 * k, 90 * k, C.bronze, rim, shade) +
      ball(pen, kn, 58 * k, C.iron, rim) +
      pen.form(`M${kn[0] - 60 * k} ${kn[1] - 34}Q${kn[0]} ${kn[1] - 90} ${kn[0] + 60 * k} ${kn[1] - 34}L${kn[0] + 52 * k} ${kn[1] + 36}Q${kn[0]} ${kn[1] + 60} ${kn[0] - 52 * k} ${kn[1] + 36}Z`, C.light, { sh: 28, hatch: 1, line: 3, rim, shade: sx < 0 ? far(C.light) : undefined })
    );
  };
  // The chest: a barrel of old bronze with a patina band, the carved plate and its ring of leaves.
  const plate = rrect(-160, -350, 180, 140, 26);
  const chestInner =
    `<path d="M-280 -150Q-30 -56 230 -150V-112Q-30 -16 -280 -112Z" fill="${C.patina}"/><path d="M-280 -150Q-30 -56 230 -150M-280 -112Q-30 -16 230 -112" fill="none" stroke="${INK}" stroke-width="3.2"/>` +
    `<path d="${plate}" fill="${C.light}" stroke="${INK}" stroke-width="3.4"/><path d="${plate}" fill="${INK}" opacity=".14" transform="translate(-8 10)"/>` +
    leafRing(pen, -70, -280, 52, eye, 0.9) +
    `<path d="M60 -440Q96 -260 60 -80M-200 -420Q-240 -260 -214 -120" fill="none" stroke="${INK}" stroke-width="3.2" opacity=".45"/>` +
    // Ages of weather: rows of rivets along the seams, green verdigris running down from them, old scratches.
    [-410, -370, -330, -290, -250, -210, -170].map((ry) => `<circle cx="${r1(62 + Math.sin((ry + 440) / 115) * 30)}" cy="${ry}" r="5" fill="${INK}" opacity=".5"/><circle cx="${r1(-206 - Math.sin((ry + 420) / 105) * 26)}" cy="${ry}" r="5" fill="${INK}" opacity=".5"/>`).join('') +
    pen.brushes(
      [
        [[[70, -330], [74, -270], [70, -200]], 12],
        [[[90, -400], [96, -350]], 8],
        [[[-212, -300], [-218, -240], [-214, -170]], 14],
        [[[-150, -206], [-150, -170]], 9],
        [[[0, -206], [2, -160]], 10],
        [[[140, -110], [142, -60]], 10],
        [[[-120, -100], [-118, -50]], 12],
      ],
      C.patina,
      [0.1, 0.9],
      0.7,
    ) +
    pen.brushes(
      [
        [[[110, -300], [160, -330]], 2.6],
        [[[120, -280], [150, -296]], 2.2],
        [[[-150, -420], [-110, -436]], 2.4],
      ],
      INK,
      [0.2, 0.3],
      0.55,
    ) +
    shine(pen, [[-210, -380], [-120, -446], [-20, -462]], 12, 0.4);
  const chest = pen.form(ell(-24, -250, 236, 220), C.bronze, {
    sh: 110,
    hatch: 2,
    rim,
    line: 4,
    paint: pen.rad(
      [
        [0, '#c88a4a'],
        [0.5, C.bronze],
        [1, '#4a2410'],
      ],
      0.3,
      0.3,
      0.85,
    ),
    inner: chestInner,
  });
  const shoulder = (c: P, r: number, isFar: boolean) => pen.form(ell(c[0], c[1], r), mix(C.light, C.bronze, 0.45), { sh: r * 0.5, hatch: 2, rim, line: 3.6, shade: isFar ? far(C.bronze) : undefined, inner: shine(pen, [[c[0] - r * 0.6, c[1] - r * 0.3], [c[0] - r * 0.2, c[1] - r * 0.7], [c[0] + r * 0.2, c[1] - r * 0.78]], 8, 0.6) + pen.brush([[c[0] - r, c[1] + r * 0.2], [c[0], c[1] + r * 0.62], [c[0] + r, c[1] + r * 0.2]], 12, C.patina, [0.05, 0.05], 0.9) });
  const belt = pen.form('M-190 -70Q-30 -26 170 -70V12Q-30 56 -190 12Z', C.iron, { sh: 24, hatch: 2, rim, line: 3.6, inner: `<path d="M-120 -50V30M40 -50V34" stroke="#6a5a52" stroke-width="4"/>` });
  const neck = pipe(pen, [-40, -430], [-48, -500], 130, 120, C.iron, rim);
  // The head: a round helmet, the dark visor with its one wide eye, the brow, a side disc, the leaf crest.
  const nod = o.nod ?? 14;
  const hp = pen.local(false, -nod);
  const visor = `<path d="M-120 -18Q-30 -34 70 -22V30Q-30 20 -120 34Z" fill="${C.iron}" stroke="${INK}" stroke-width="3"/>`;
  const eyeSlit = hp.glow(-40, 6, 150, eye, 0.85, 70) + `<path d="M-100 -4Q-40 -14 30 -6V18Q-40 10 -100 22Z" fill="${mix(eye, '#ffffff', 0.55)}" stroke="${INK}" stroke-width="2.6"/><path d="M-84 6Q-40 0 4 4" stroke="#ffffff" stroke-width="5" stroke-linecap="round"/>`;
  const helmet = hp.form(ell(0, 0, 110), C.bronze, {
    sh: 46,
    hatch: 2,
    rim,
    line: 4,
    paint: hp.rad(
      [
        [0, '#d89a58'],
        [0.5, C.bronze],
        [1, '#4a2410'],
      ],
      0.3,
      0.28,
      0.85,
    ),
    inner: visor + `<path d="M-20 52Q30 74 92 40" fill="none" stroke="${INK}" stroke-width="3" opacity=".55"/><circle cx="-30" cy="66" r="4.5" fill="${INK}" opacity=".6"/><circle cx="50" cy="62" r="4.5" fill="${INK}" opacity=".6"/>` + shine(hp, [[-80, -60], [-30, -92], [30, -96]], 10, 0.6),
  });
  const brow = hp.brush([[-118, -30], [-40, -48], [60, -38]], 16, C.light, [0.1, 0.2]) + hp.brush([[-118, -24], [-40, -40], [60, -30]], 3, INK, [0.1, 0.2], 0.7);
  const disc = hp.form(ell(76, 6, 30, 34), C.light, { sh: 12, line: 3, rim, inner: `<circle cx="76" cy="6" r="10" fill="${C.patina}"/>` });
  const crest = hp.form('M-24 -100Q-40 -196 26 -244Q46 -168 30 -96Z', C.patina, { sh: 18, hatch: 1, line: 3.4, rim, inner: hp.brush([[4, -104], [14, -170], [24, -232]], 3, INK, [0.2, 0.3], 0.6) });
  const head = at(-56, -556, 1, crest + helmet + eyeSlit + brow + disc + (o.nodLines ? hp.brushes([[[[-150, -60], [-176, 0], [-160, 60]], 6], [[[-180, -40], [-200, 6], [-188, 50]], 5]], '#ffffff', [0.2, 0.2], 0.8) : ''), false, -nod);
  const out = arm(-1) + shoulder([-236, -376], 96, true) + chest + belt + leg(-1) + leg(1) + neck + head + arm(1) + shoulder([214, -380], 104, false);
  return at(x, y, s, out);
}

