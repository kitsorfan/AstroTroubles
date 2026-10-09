/**
 * Graphic-novel props for chapter 2 on Gaia Nova: the colony ship Syracusia, the planet itself,
 * Brennus's black spider-drones and his snare drone with its cage, Celestia's sprout in her pot, and
 * the jungle and fortress pieces (big leaves, roots, thorny armour, banners). Everything draws through
 * a `Pen`, so the panel's light shades it; positions and sizes are noted on each function.
 */
import { add, at, brushD, dPoly, dSmooth, INK, lerp, mix, mul, type P, type Pen, r1, rng, unit } from './core';
import { spark } from './fx';

/** A filled ellipse path (for `Pen.form`). */
export const ellipseD = (x: number, y: number, rx: number, ry: number) => `M${r1(x - rx)} ${r1(y)}A${r1(rx)} ${r1(ry)} 0 1 0 ${r1(x + rx)} ${r1(y)}A${r1(rx)} ${r1(ry)} 0 1 0 ${r1(x - rx)} ${r1(y)}Z`;

/** A clip path from path data, returning its `url(#...)`. */
export function clipUrl(pen: Pen, d: string): string {
  const id = pen.uid();
  pen.def(id, `<clipPath id="${id}"><path d="${d}"/></clipPath>`);
  return `url(#${id})`;
}

/* ---------------- the Syracusia ---------------- */

const HULL = '#e6eaf2';
const HULL_GREY = '#9aa4b8';
const SHIP_GOLD = '#ffd166';

/**
 * The colony ship Syracusia, side-on and facing right, seen a little from the front: a long spine,
 * three great habitat rings (tall ellipses, their windows lit), a glass garden dome on top where
 * Celestia lives, a bulbous bridge at the prow and three engines at the stern. About 1200 long at
 * scale 1, centred on its spine.
 */
export function syracusia(pen: Pen, x: number, y: number, s: number, o: { rot?: number; engines?: boolean } = {}): string {
  const lp = pen.local(false, o.rot ?? 0);
  let out = '';
  // Engine glow and exhaust trailing behind.
  if (o.engines !== false) {
    out += lp.glow(-640, 0, 260, '#6fd0ff', 0.7, 110) + lp.glow(-610, 0, 90, '#ffffff', 0.9, 60);
    out += lp.brushes(
      [
        [
          [
            [-600, -30],
            [-900, -40],
          ],
          16,
        ],
        [
          [
            [-600, 32],
            [-940, 40],
          ],
          14,
        ],
        [
          [
            [-600, 0],
            [-1000, 0],
          ],
          10,
        ],
      ],
      '#c8f2ff',
      [0.05, 0.95],
      0.75,
    );
  }
  // The engine block and its three bells.
  for (const ey of [-34, 0, 34]) out += lp.form(`M-560 ${ey - 12}L-610 ${ey - 22}V${ey + 22}L-560 ${ey + 12}Z`, '#5a6274', { sh: 8, line: 2.4, rim: 1.6 });
  out += lp.form('M-580 -62Q-590 0 -580 62H-500V-62Z', '#c4cad8', { sh: 34, hatch: 2, line: 3, rim: 2, axis: [0, 1], inner: `<path d="M-560 -62V62M-530 -62V62" stroke="${INK}" stroke-width="2.4" opacity=".5"/>` });
  // The spine, with panel seams and its gold running lights.
  const seams = [-460, -380, -230, -30, 170, 300].map((sx) => `M${sx} -40V40`).join('');
  const spine = 'M-520 -40Q-530 0 -520 40H430Q446 0 430 -40Z';
  out += lp.form(spine, HULL, {
    sh: 26,
    hatch: 1,
    line: 3,
    rim: 2.4,
    axis: [1, 0],
    paint: lp.lin([
      [0, '#ffffff'],
      [1, '#c8d0de'],
    ]),
    inner: `<path d="${seams}" stroke="${INK}" stroke-width="2" opacity=".45"/><path d="M-510 12H420" stroke="${SHIP_GOLD}" stroke-width="7" stroke-dasharray="6 16"/><path d="M-500 -18H420" stroke="#2a3458" stroke-width="5" stroke-dasharray="3 9" opacity=".7"/>`,
  });
  // Radiator fins along the spine between the rings.
  for (const fx of [-440, -230, -30]) out += lp.form(`M${fx} -40L${fx + 20} -96H${fx + 70}L${fx + 60} -40Z`, HULL_GREY, { sh: 10, line: 2.2, rim: 1.4, inner: `<path d="M${fx + 16} -50L${fx + 30} -90M${fx + 32} -50L${fx + 46} -90" stroke="${INK}" stroke-width="1.6" opacity=".5"/>` });
  // The habitat rings: each a tall ellipse with a hole the spine runs through, and lit windows.
  for (const rx of [-330, -130, 70]) {
    // The ring is a short drum: its rim (the back ellipse, showing as a band on the far side) with a
    // row of windows, and its front face, a flat annulus round the hole.
    const fx = rx + 8;
    const hole = ellipseD(fx + 4, 0, 38, 130);
    out += lp.form(ellipseD(rx - 18, 0, 74, 186), HULL_GREY, {
      sh: 40,
      hatch: 2,
      line: 3,
      rim: 2.4,
      inner: `<ellipse cx="${rx - 22}" cy="0" rx="70" ry="168" fill="none" stroke="${SHIP_GOLD}" stroke-width="10" stroke-dasharray="4 10"/>`,
    });
    out += lp.glow(rx - 70, 0, 30, SHIP_GOLD, 0.35, 160);
    out += lp.form(ellipseD(fx, 0, 72, 184), HULL, {
      sh: 30,
      hatch: 1,
      line: 3,
      rim: 2,
      paint: lp.lin([
        [0, '#ffffff'],
        [0.6, '#e4e9f2'],
        [1, '#c0c8d8'],
      ]),
      inner: `<ellipse cx="${fx}" cy="0" rx="55" ry="157" fill="none" stroke="${INK}" stroke-width="2" opacity=".4"/><path d="M${fx - 72} 0H${fx - 36}M${fx + 36} 0H${fx + 72}M${fx} -184V-130M${fx} 130V184" stroke="${INK}" stroke-width="2.2" opacity=".45"/>`,
    });
    // Inside the ring: its shadowed inner wall, the spokes to the hub, and the spine running through.
    const wall = lp.rad(
      [
        [0, '#34406a'],
        [1, '#0c1024'],
      ],
      0.25,
      0.5,
      0.75,
    );
    const spokes = `<path d="M${fx - 6} -40V-140M${fx - 6} 40V140" stroke="${INK}" stroke-width="16"/><path d="M${fx - 6} -40V-140M${fx - 6} 40V140" stroke="#8a94a8" stroke-width="9"/><path d="M${fx - 9} -40V-140M${fx - 9} 40V140" stroke="#dfe5ef" stroke-width="2.4"/>`;
    const lights = `<ellipse cx="${fx - 18}" cy="0" rx="30" ry="118" fill="none" stroke="${SHIP_GOLD}" stroke-width="6" stroke-dasharray="3 12" opacity=".8"/>`;
    out += `<path d="${hole}" fill="${wall}" stroke="${INK}" stroke-width="3"/>`;
    out += `<g clip-path="${clipUrl(lp, hole)}">${lights}${spokes}<path d="M${rx - 60} -40H${rx + 60}V40H${rx - 60}Z" fill="#b4bccc"/><path d="M${rx - 60} -40H${rx + 60}" stroke="#ffffff" stroke-width="6" opacity=".7"/><path d="M${rx - 60} 40H${rx + 60}" stroke="${INK}" stroke-width="5"/><path d="M${rx - 60} 12H${rx + 60}" stroke="${SHIP_GOLD}" stroke-width="7" stroke-dasharray="6 16"/><path d="M${rx - 60} 26H${rx + 60}V40H${rx - 60}Z" fill="#3a3a8a" opacity=".35"/></g>`;
  }
  // The garden dome: a glass bubble full of green, with Celestia's pink glow in the middle.
  const dome = 'M180 -38Q186 -150 270 -152Q354 -150 360 -38Z';
  const plants =
    `<path d="M186 -40Q230 -90 270 -60Q310 -96 356 -40Z" fill="#3f8a4a"/><path d="M200 -40Q236 -70 262 -52Q300 -80 340 -40Z" fill="#5fb05a"/>` +
    lp.glow(270, -78, 46, '#ff6fcf', 0.9) +
    `<circle cx="270" cy="-80" r="9" fill="#ffd6f2"/>`;
  out += lp.form(dome, '#9fdcff', {
    sh: 18,
    line: 2.8,
    rim: 2,
    warm: 0,
    paint: lp.lin([
      [0, '#cfefff'],
      [1, '#6ab8e8'],
    ]),
    inner: plants + `<path d="M196 -60Q270 -100 344 -60M270 -150V-40" fill="none" stroke="#ffffff" stroke-width="2.4" opacity=".55"/>` + lp.brush([[204, -70], [222, -120], [262, -140]], 7, '#ffffff', [0.3, 0.4], 0.8),
  });
  out += lp.form('M170 -46H370V-34H170Z', HULL_GREY, { sh: 4, line: 2.2 });
  // The bridge: a bulbous prow with a wide cyan window and a mast.
  out += lp.brush(
    [
      [460, -84],
      [470, -150],
    ],
    6,
    INK,
    [0.05, 0.05],
  );
  out += lp.glow(472, -156, 22, '#ff4a5a', 0.9) + `<circle cx="472" cy="-156" r="7" fill="#ff4a5a" stroke="${INK}" stroke-width="2"/>`;
  const prow = 'M400 -76Q520 -110 586 -30Q608 18 556 62Q470 96 400 76Q384 0 400 -76Z';
  out += lp.form(prow, HULL, {
    sh: 44,
    hatch: 2,
    line: 3.2,
    rim: 2.6,
    paint: lp.lin([
      [0, '#ffffff'],
      [1, '#c8d0de'],
    ]),
    inner: `<path d="M420 40Q500 54 580 20" fill="none" stroke="${SHIP_GOLD}" stroke-width="7"/><path d="M430 -60Q440 0 430 70" fill="none" stroke="${INK}" stroke-width="2.2" opacity=".45"/>`,
  });
  out += lp.form('M478 -66Q548 -66 576 -22L496 -12Q486 -40 478 -66Z', '#7fe6ff', { sh: 8, line: 2.4, warm: 0, inner: lp.brush([[492, -56], [530, -54], [556, -32]], 5, '#ffffff', [0.3, 0.3], 0.9) + lp.glow(526, -40, 40, '#ffffff', 0.4) });
  // Navigation lights.
  out += lp.glow(586, -10, 16, '#7dff9a', 0.9) + lp.glow(-520, -40, 14, '#ff4a5a', 0.9);
  return at(x, y, s, out, false, o.rot ?? 0);
}

/* ---------------- Gaia Nova ---------------- */

type V3 = [number, number, number];
const norm3 = (v: V3): V3 => {
  const l = Math.hypot(v[0], v[1], v[2]) || 1;
  return [v[0] / l, v[1] / l, v[2] / l];
};

/**
 * The planet Gaia Nova from orbit, centred at (cx, cy) with radius r (usually far below the panel, so
 * only its great curved top shows): blue oceans, green continents with darker forests and tan
 * deserts, long bands of white cloud, a night side turned away from `sun` (a screen direction toward
 * the light), and a glowing blue atmosphere on the limb. Continents and clouds sit on the sphere, so
 * they flatten toward the horizon. `band` is the visible part of the sphere (view-space heights, 1 =
 * the top of the limb) to scatter them over.
 */
export function gaiaNova(pen: Pen, cx: number, cy: number, r: number, o: { sun?: P; seed?: number; band?: [number, number]; lands?: number } = {}): string {
  const rand = rng(o.seed ?? 3);
  const sun = unit(o.sun ?? [0.7, -0.6]);
  const [y0, y1] = o.band ?? [0.8, 0.995];
  const proj = (v: V3): P => {
    let [x, y, z] = v;
    if (z < 0) {
      const l = Math.hypot(x, y) || 1;
      x /= l;
      y /= l;
      z = 0;
    }
    return [cx + r * x, cy - r * y];
  };
  const onSphere = (x: number, y: number): V3 => [x, y, Math.sqrt(Math.max(0.0001, 1 - x * x - y * y))];
  // A tangent frame at c: t1 runs "east" (along the horizon), t2 "north" (toward the limb).
  const frame = (c: V3): [V3, V3] => {
    const t1 = norm3([c[2], 0, -c[0]]);
    const t2 = norm3([c[1] * t1[2] - c[2] * t1[1], c[2] * t1[0] - c[0] * t1[2], c[0] * t1[1] - c[1] * t1[0]]);
    return [t1, t2];
  };
  const off = (c: V3, t: [V3, V3], u: number, w: number): P => proj(norm3([c[0] + t[0][0] * u + t[1][0] * w, c[1] + t[0][1] * u + t[1][1] * w, c[2] + t[0][2] * u + t[1][2] * w]));
  // A coastline: a wobbly loop around c with bays and capes (two waves of noise plus jitter).
  const coast = (c: V3, a: number, n: number, stretch: number): P[] => {
    const t = frame(c);
    const [p1, p2] = [rand() * 6.3, rand() * 6.3];
    const [k1, k2] = [2 + Math.floor(rand() * 2), 4 + Math.floor(rand() * 3)];
    const pts: P[] = [];
    for (let i = 0; i < n; i++) {
      const f = (i / n) * Math.PI * 2;
      const k = a * (1 + 0.28 * Math.sin(k1 * f + p1) + 0.14 * Math.sin(k2 * f + p2) + (rand() - 0.5) * 0.12);
      pts.push(off(c, t, Math.cos(f) * k * stretch, Math.sin(f) * k));
    }
    return pts;
  };
  const disc = ellipseD(cx, cy, r, r);
  const clip = clipUrl(pen, disc);
  const ocean = pen.lin(
    [
      [0, '#bfeeff'],
      [0.06, '#5ab8ec'],
      [0.35, '#2a7ccc'],
      [1, '#0f2f6a'],
    ],
    cx,
    cy - r,
    cx,
    cy - r * 0.78,
    true,
  );
  let inner = `<path d="${disc}" fill="${ocean}"/>`;
  // Continents.
  let land = '';
  let forest = '';
  let desert = '';
  let snow = '';
  const n = o.lands ?? 14;
  for (let i = 0; i < n; i++) {
    const lx = -0.75 + (1.5 * (i + 0.2 + rand() * 0.6)) / n;
    // More of them toward the horizon, where the sphere packs more surface into each row.
    const ly = y0 + 0.02 + Math.sqrt(rand()) * (y1 - y0 - 0.03);
    const c = onSphere(lx, ly);
    const a = 0.03 + rand() * 0.045;
    const st = 1.2 + rand() * 1.2;
    land += dSmooth(coast(c, a, 26, st));
    forest += dSmooth(coast(c, a * 0.55, 14, st));
    if (rand() < 0.55) desert += dSmooth(coast(norm3([c[0] + (rand() - 0.5) * a, c[1] - a * 0.2, c[2]]), a * 0.32, 10, st));
    if (ly > 0.94) snow += dSmooth(coast(norm3([c[0], c[1] + a * 0.4, c[2]]), a * 0.3, 10, st));
  }
  inner += `<path d="${land}" fill="none" stroke="#8fe4f4" stroke-width="10" opacity=".45"/>`;
  inner += `<path d="${land}" fill="#62ae4c" stroke="${INK}" stroke-width="1.6" stroke-opacity=".55"/>`;
  inner += `<path d="${forest}" fill="#2f7a3e"/><path d="${forest}" fill="${pen.hatch(1, '#163a22')}" opacity=".7"/>`;
  inner += `<path d="${desert}" fill="#dcc27c" opacity=".9"/>` + (snow ? `<path d="${snow}" fill="#f4fbff" opacity=".9"/>` : '');
  // Cloud bands: long soft streaks running along the horizon, and puffy clumps.
  const bands: [P[], number][] = [];
  const thin: [P[], number][] = [];
  for (let i = 0; i < 34; i++) {
    const c = onSphere(-0.95 + rand() * 1.9, y0 + Math.sqrt(rand()) * (y1 - y0));
    const t = frame(c);
    const L = 0.04 + rand() * 0.1;
    const bend = (rand() - 0.5) * 0.8;
    const pts: P[] = [];
    for (let j = 0; j <= 6; j++) {
      const u = -1 + j / 3;
      pts.push(off(c, t, u * L, bend * u * u * L * 0.4));
    }
    // Width shrinks toward the horizon, as the sphere turns away.
    const k = 0.35 + c[2] * 1.4;
    bands.push([pts, (14 + rand() * 22) * k]);
    thin.push([pts.slice(1, 6).map((p) => add(p, [0, -3 * k])), (4 + rand() * 5) * k]);
  }
  inner += pen.brushes(bands, '#ffffff', [0.45, 0.45], 0.5) + pen.brushes(thin, '#ffffff', [0.4, 0.4], 0.9);
  for (let i = 0; i < 12; i++) {
    const c = onSphere(-0.9 + rand() * 1.8, y0 + 0.03 + Math.sqrt(rand()) * (y1 - y0 - 0.04));
    const p = proj(c);
    inner += pen.glow(p[0], p[1], 40 + rand() * 60, '#ffffff', 0.75, (8 + rand() * 10) * (0.4 + c[2] * 2));
  }
  // The night side, turned away from the sun, and the bright haze of air near the limb.
  const night = pen.lin(
    [
      [0, '#06081e', 0],
      [0.4, '#06081e', 0.1],
      [0.75, '#06081e', 0.6],
      [1, '#06081e', 0.85],
    ],
    cx + sun[0] * 900,
    cy - r,
    cx - sun[0] * 900,
    cy - r,
    true,
  );
  inner += `<path d="${disc}" fill="${night}"/>`;
  const air = pen.lin(
    [
      [0, '#e8fbff', 0.95],
      [0.05, '#9ad8ff', 0.6],
      [0.3, '#7fc8ff', 0.12],
      [1, '#7fc8ff', 0],
    ],
    cx,
    cy - r,
    cx,
    cy - r * 0.85,
    true,
  );
  inner += `<path d="${disc}" fill="${air}"/>`;
  // The atmosphere above the limb: soft glowing layers, hottest toward the sun.
  const limb = pen.lin(
    [
      [0, '#3a5ab0', 0.5],
      [0.55, '#8fd8ff', 0.9],
      [1, '#fff2d0', 1],
    ],
    cx - sun[0] * 900,
    cy,
    cx + sun[0] * 900,
    cy,
    true,
  );
  let out = `<path d="${disc}" fill="none" stroke="${limb}" stroke-width="60" opacity=".18"/><path d="${disc}" fill="none" stroke="${limb}" stroke-width="26" opacity=".35"/>`;
  out += `<g clip-path="${clip}">${inner}</g>`;
  out += `<path d="${disc}" fill="none" stroke="${limb}" stroke-width="5"/>`;
  return out;
}

/* ---------------- Brennus's drones ---------------- */

/**
 * One of Brennus's little black spider-drones: a glossy armoured body, a cluster of red eyes, two
 * humming rotors on struts and four jointed legs (curled to grab, or `carry` hanging straight down to a
 * tether point). Faces right; centred on its body, about 140 across at scale 1.
 */
export function spiderDrone(pen: Pen, x: number, y: number, s: number, o: { flip?: boolean; rot?: number; legs?: 'grab' | 'carry' | 'none' } = {}): string {
  const lp = pen.local(!!o.flip, o.rot ?? 0);
  const body = '#2a2636';
  let out = '';
  // Rotors: blurred discs on short struts.
  for (const k of [-1, 1]) {
    const rx = k * 50;
    out += lp.brushes(
      [
        [
          [
            [k * 20, -22],
            [rx, -50],
          ],
          7,
        ],
      ],
      INK,
      [0.05, 0.05],
    );
    out += `<ellipse cx="${rx}" cy="-54" rx="44" ry="7" fill="#9ab0d0" opacity=".28"/><ellipse cx="${rx}" cy="-54" rx="44" ry="7" fill="none" stroke="#cfe0ff" stroke-width="1.6" opacity=".5"/>`;
    out += lp.form(ellipseD(rx, -54, 8, 6), '#3a3648', { line: 2 });
  }
  // Legs: far pair first, a little darker.
  const grab = o.legs !== 'carry';
  const leg = (sx: number, k: number, far: boolean): [P[], number] => {
    const pts: P[] = grab
      ? [
          [sx, 14],
          [sx + k * 46, 30],
          [sx + k * 54, 66],
          [sx + k * 38, 86],
        ]
      : [
          [sx, 14],
          [sx + k * 30, 36],
          [sx + k * 18, 70],
          [sx + k * 8, 96],
        ];
    return [pts, far ? 9 : 11];
  };
  const legs = o.legs !== 'none';
  const far = [leg(-14, -0.7, true), leg(14, 0.7, true)];
  const near = [leg(-26, -1, false), leg(26, 1, false)];
  if (legs) out += lp.brushes(far, INK, [0.05, 0.4]) + lp.brushes(far.map(([p, w]) => [p, w * 0.45] as [P[], number]), '#4a4660', [0.1, 0.5]);
  // The body: a glossy rounded shell with a plate seam, a gloss highlight and the eye cluster.
  out += lp.form('M-52 2Q-50 -32 -6 -34Q46 -34 56 -2Q54 26 6 30Q-46 30 -52 2Z', body, {
    sh: 20,
    hatch: 2,
    line: 2.8,
    rim: 2.4,
    inner: `<path d="M-20 -32Q-28 0 -18 28" fill="none" stroke="#4a4660" stroke-width="3"/>` + lp.brush([[-38, -14], [-16, -26], [14, -26]], 6, '#8a86a8', [0.3, 0.4], 0.75),
  });
  out += lp.form('M18 -20Q40 -24 54 -8Q56 12 40 18Q20 18 18 -20Z', '#141220', { line: 2.2 });
  out += lp.glow(38, -2, 34, '#ff3a4c', 0.8);
  out += `<circle cx="40" cy="-4" r="7" fill="#ff3a4c"/><circle cx="28" cy="6" r="4.5" fill="#ff3a4c"/><circle cx="48" cy="9" r="4" fill="#ff3a4c"/><circle cx="38" cy="-7" r="2.4" fill="#ffd0d0"/>`;
  if (legs) out += lp.brushes(near, INK, [0.05, 0.4]) + lp.brushes(near.map(([p, w]) => [p, w * 0.45] as [P[], number]), '#5a5670', [0.1, 0.5]);
  return at(x, y, s, out, o.flip, o.rot ?? 0);
}

/**
 * Brennus's snare drone: a bigger spider-drone with a cage of red-glowing bars hanging under it, and
 * `inside` (drawn in the cage's coordinates: the cage's centre is at (0, 108), about 120 across inside)
 * between the back and front bars. The drone flies at (x, y - 40 * s); the cage hangs below (x, y).
 */
export function snareDrone(pen: Pen, x: number, y: number, s: number, inside = '', o: { rot?: number } = {}): string {
  const lp = pen.local(false, o.rot ?? 0);
  const red = '#ff4a5a';
  // The cage: a dome-topped barrel of bars from y 40 to 176, 128 across.
  const bars = (xs: number[], w: number, color: string, op = 1) =>
    lp.brushes(
      xs.map((bx): [P[], number] => [
        [
          [bx * 0.7, 34],
          [bx, 70],
          [bx, 130],
          [bx * 0.94, 172],
        ],
        w,
      ]),
      color,
      [0.02, 0.02],
      op,
    );
  let out = '';
  // Chains from the drone to the cage's top.
  out += lp.brushes(
    [
      [
        [
          [-24, -10],
          [0, 30],
        ],
        6,
      ],
      [
        [
          [24, -10],
          [0, 30],
        ],
        6,
      ],
    ],
    INK,
    [0.05, 0.05],
  );
  // The back of the cage: its far bars, dimmer.
  out += bars([-40, 0, 40], 8, INK) + bars([-40, 0, 40], 3.4, mix(red, '#3a1020', 0.4));
  out += lp.glow(0, 108, 120, red, 0.35);
  out += inside;
  // The front of the cage, its rings and its base.
  out += bars([-64, -28, 28, 64], 10, INK) + bars([-64, -28, 28, 64], 4.4, red) + bars([-60, -24, 32, 68], 1.4, '#ffd0d6', 0.8);
  for (const ry of [70, 130]) out += `<path d="M-66 ${ry}Q0 ${ry + 16} 66 ${ry}" fill="none" stroke="${INK}" stroke-width="9"/><path d="M-66 ${ry}Q0 ${ry + 16} 66 ${ry}" fill="none" stroke="${red}" stroke-width="3.6"/>`;
  out += lp.form('M-26 34Q0 20 26 34L20 42Q0 34 -20 42Z', '#3a3648', { line: 2.4 });
  out += lp.form('M-64 170Q0 192 64 170L58 186Q0 208 -58 186Z', '#3a3648', { sh: 8, line: 2.6, rim: 1.6 });
  out += lp.glow(0, 182, 70, red, 0.45, 22);
  out += spiderDrone(lp, 0, -40, 1.25, { legs: 'none' });
  return at(x, y, s, out, false, o.rot ?? 0);
}

/* ---------------- Celestia ---------------- */

/**
 * Celestia as a little sprout in a terracotta pot: a curling stem with two leaves and a glowing pink
 * bud, and a halo of pollen sparkles. Pot bottom at (x, y); about 180 tall at scale 1.
 */
export function celestiaPot(pen: Pen, x: number, y: number, s: number, o: { rot?: number } = {}): string {
  const lp = pen.local(false, o.rot ?? 0);
  const pink = '#ff6fcf';
  let out = lp.glow(0, -150, 120, pink, 0.6) + lp.glow(0, -150, 40, '#ffffff', 0.6);
  // Stem and leaves.
  out += lp.brush(
    [
      [0, -86],
      [-10, -116],
      [2, -146],
    ],
    12,
    INK,
    [0.05, 0.3],
  );
  out += lp.brush(
    [
      [0, -86],
      [-10, -116],
      [2, -146],
    ],
    6,
    '#5f9a3a',
    [0.05, 0.3],
  );
  const leafD = (k: number) => `M${-4 * k} -110Q${-40 * k} -140 ${-62 * k} -112Q${-36 * k} -96 ${-4 * k} -110Z`;
  out += lp.form(leafD(1), '#5f9a3a', { sh: 8, line: 2.2, rim: 1.6, inner: lp.brush([[-6, -110], [-30, -118], [-54, -114]], 2, INK, [0.2, 0.4], 0.6) });
  out += lp.form(leafD(-1), '#86b84e', { sh: 8, line: 2.2, rim: 1.6, inner: lp.brush([[6, -110], [30, -118], [54, -114]], 2, INK, [0.2, 0.4], 0.6) });
  // The bud: five pink petals round a bright heart.
  let petals = '';
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * 360 - 90;
    petals += at(2, -160, 1, lp.local(false, a).form('M0 0Q-14 -14 0 -30Q14 -14 0 0Z', pink, { sh: 5, line: 2, warm: 0 }), false, a);
  }
  out += petals + `<circle cx="2" cy="-160" r="9" fill="#fff4fb" stroke="${INK}" stroke-width="2"/>`;
  // The pot.
  out += lp.form('M-52 -86H52L40 0H-40Z', '#c8643a', { sh: 22, hatch: 1, line: 2.8, rim: 2, axis: [0, 1], inner: `<path d="M-30 -60Q0 -50 30 -60" fill="none" stroke="#8a3a1a" stroke-width="4" opacity=".7"/>` });
  out += lp.form('M-62 -104H62V-80H-62Z', '#e07a48', { sh: 9, line: 2.6, rim: 1.6 });
  out += lp.form('M-58 -104Q0 -118 58 -104Q0 -96 -58 -104Z', '#3a2418', { line: 1.8 });
  out += spark(lp, -40, -190, 9, '#ffd6f2') + spark(lp, 44, -170, 7, '#ffd6f2') + spark(lp, 20, -222, 6, '#ffffff');
  return at(x, y, s, out, false, o.rot ?? 0);
}

/* ---------------- the jungle ---------------- */

/**
 * A big tropical leaf from its stalk base (x, y), pointing along `deg` (as `dir` measures it: 180 is
 * straight up), `l` long: a pointed blade with a midrib and veins, shaded by the panel's light.
 */
export function bigLeaf(pen: Pen, x: number, y: number, l: number, deg: number, color: string, o: { line?: number; rim?: number; hatch?: 0 | 1 | 2 | 3; shade?: string } = {}): string {
  const lp = pen.local(false, -deg);
  const w = l * 0.36;
  // In leaf space: the stalk at (0, 0), the tip at (0, l).
  const d = `M0 0Q${r1(-w * 1.1)} ${r1(l * 0.3)} ${r1(-w * 0.7)} ${r1(l * 0.66)}Q${r1(-w * 0.3)} ${r1(l * 0.9)} 0 ${r1(l)}Q${r1(w * 0.36)} ${r1(l * 0.88)} ${r1(w * 0.8)} ${r1(l * 0.62)}Q${r1(w * 1.1)} ${r1(l * 0.26)} 0 0Z`;
  const veins: [P[], number][] = [
    [
      [
        [0, l * 0.04],
        [w * 0.06, l * 0.5],
        [0, l * 0.96],
      ],
      l * 0.03,
    ],
  ];
  for (let i = 1; i < 6; i++) {
    const t = i / 6.4;
    const c: P = [w * 0.05 * Math.sin(t * 3), l * t];
    veins.push([[c, add(c, [-w * 0.55 * (1 - t * 0.5), l * 0.12])], l * 0.014]);
    veins.push([[c, add(c, [w * 0.6 * (1 - t * 0.5), l * 0.1])], l * 0.014]);
  }
  const body = lp.form(d, color, {
    sh: w * 0.5,
    hatch: o.hatch ?? 1,
    line: o.line ?? 2.6,
    rim: o.rim ?? 1.8,
    shade: o.shade,
    inner: lp.brushes(veins, mix(color, INK, 0.45), [0.1, 0.5], 0.7) + lp.brushes([[veins[0][0].map((q) => add(q, [-l * 0.012, 0])), l * 0.012]], mix(color, '#ffffff', 0.4), [0.1, 0.5], 0.6),
  });
  return at(x, y, 1, body, false, -deg);
}

/**
 * A thick tapered root or vine as a shaded form along the points (w wide in the middle), with bark
 * grooves along it. Points run from the thick end.
 */
export function root(pen: Pen, pts: P[], w: number, color: string, o: { line?: number; rim?: number; grooves?: number; seed?: number } = {}): string {
  const rand = rng(o.seed ?? 5);
  const d = brushD(pts, w, [0.04, 0.85]);
  const grooves: [P[], number][] = [];
  for (let i = 0; i < (o.grooves ?? 3); i++) {
    const off = (rand() - 0.5) * w * 0.5;
    const t0 = rand() * 0.3;
    const t1 = t0 + 0.3 + rand() * 0.3;
    const a = pts[Math.floor(t0 * (pts.length - 1))];
    const b = pts[Math.min(pts.length - 1, Math.ceil(t1 * (pts.length - 1)))];
    const n = unit([b[1] - a[1], a[0] - b[0]]);
    grooves.push([[add(a, mul(n, off)), add(lerp(a, b, 0.5), mul(n, off * 0.8)), add(b, mul(n, off * 0.5))], 2.6]);
  }
  const a = pts[0];
  const b = pts[pts.length - 1];
  return pen.form(d, color, { sh: w * 0.4, hatch: 2, line: o.line ?? 3, rim: o.rim ?? 2, axis: [b[0] - a[0], b[1] - a[1]], inner: pen.brushes(grooves, INK, [0.2, 0.5], 0.6) });
}

/* ---------------- Brennus's fortress ---------------- */

/** Brennus's red gear emblem: a toothed ring round a hole (centre (x, y), radius r). */
export function gearMark(x: number, y: number, r: number, color = '#c8282e', hole = '#1a1218'): string {
  let teeth = '';
  for (let i = 0; i < 10; i++) teeth += `<rect x="${r1(-r * 0.17)}" y="${r1(-r * 1.12)}" width="${r1(r * 0.34)}" height="${r1(r * 0.4)}" transform="rotate(${i * 36})"/>`;
  return `<g transform="translate(${r1(x)} ${r1(y)})" fill="${color}">${teeth}<circle r="${r1(r * 0.86)}" fill="${color}"/><circle r="${r1(r * 0.36)}" fill="${hole}"/></g>`;
}

/** A tall cloth banner hanging from a pole, with the gear emblem; top centre at (x, y), `w` wide and `h` long, swaying a little. */
export function banner(pen: Pen, x: number, y: number, w: number, h: number, color = '#a8202a', sway = 0): string {
  const d = dSmooth(
    [
      [x - w / 2, y],
      [x + w / 2, y],
      [x + w / 2 + sway * 0.5, y + h * 0.5],
      [x + w / 2 + sway, y + h],
      [x + sway, y + h * 0.84],
      [x - w / 2 + sway, y + h],
      [x - w / 2 + sway * 0.5, y + h * 0.5],
    ],
    true,
  );
  const folds = pen.brushes(
    [
      [
        [
          [x - w * 0.2, y + 10],
          [x - w * 0.24 + sway * 0.3, y + h * 0.5],
          [x - w * 0.2 + sway * 0.8, y + h * 0.9],
        ],
        4,
      ],
      [
        [
          [x + w * 0.24, y + 10],
          [x + w * 0.28 + sway * 0.3, y + h * 0.5],
          [x + w * 0.3 + sway * 0.8, y + h * 0.9],
        ],
        3,
      ],
    ],
    INK,
    [0.2, 0.5],
    0.55,
  );
  const trim = `<path d="M${r1(x - w / 2 + 8)} ${y}V${r1(y + h)}M${r1(x + w / 2 - 8)} ${y}V${r1(y + h)}" stroke="#e8b84a" stroke-width="5" opacity=".9"/>`;
  return (
    pen.form(d, color, { sh: w * 0.3, hatch: 2, line: 2.8, rim: 2, inner: trim + gearMark(x + sway * 0.3, y + h * 0.36, w * 0.24, '#e8b84a', mix(color, INK, 0.5)) + folds }) +
    pen.form(`M${r1(x - w / 2 - 16)} ${r1(y - 8)}H${r1(x + w / 2 + 16)}V${r1(y + 6)}H${r1(x - w / 2 - 16)}Z`, '#3a3040', { sh: 6, line: 2.4, rim: 1.4 })
  );
}

/**
 * A piece of LUX's thorny shadow armour, broken off and lying on the floor: a curved black plate with
 * thorn spikes along its edge and a dead red seam. Centred at (x, y), turned `rot` degrees.
 */
export function armourShard(pen: Pen, x: number, y: number, s: number, rot: number, seed = 1): string {
  const rand = rng(seed);
  const lp = pen.local(false, rot);
  // An angular plate: a smooth outer edge with thorns, and a jagged broken edge on the right.
  const pts: P[] = [
    [-64, 16],
    [-58, -10],
    [-30, -30],
    [10, -34],
    [40, -26],
    [34, -12],
    [52, -4],
    [36, 6],
    [48, 18],
    [20, 16],
    [-20, 24],
  ];
  const thorns = [
    [1, 2],
    [2, 3],
    [3, 4],
  ].map(([i, j]): string => {
    const p = lerp(pts[i], pts[j], 0.5);
    const h = 20 + rand() * 18;
    return lp.form(dPoly([add(p, [-9, 6]), add(p, [rand() * 8 - 10, -h]), add(p, [9, 6])]), '#3a3048', { sh: 6, line: 2.2, rim: 1.6 });
  });
  const inner =
    lp.brush([[-50, 8], [-20, -8], [24, -14]], 6, '#9a2030', [0.2, 0.2], 0.9) +
    lp.brush([[-46, -6], [-16, -22], [16, -26]], 4, '#8a8aa8', [0.3, 0.4], 0.6) +
    `<path d="M-6 -30L0 20" stroke="${INK}" stroke-width="2.4" opacity=".6"/>`;
  return at(x, y, s, thorns.join('') + lp.form(dPoly(pts), '#3a3048', { sh: 18, hatch: 2, line: 2.8, rim: 2.2, inner }), false, rot);
}
