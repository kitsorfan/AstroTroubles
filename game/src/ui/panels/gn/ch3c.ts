/**
 * Graphic-novel pieces for the last stretch of chapter 3: Medusa's Labyrinth (green Gardener stone, robots
 * turned to statues, the Mirror Shield, MEDUSA and her cable snakes), Brennus's Last Stand (his Legion
 * robots and Aeëtes's gold fleet) and the Garden of Colchis (giant flowers, crystal trees, seed-sprites,
 * weeder drones and the Sleepless Dragon). Built from the kit's marks like the rest of `gn`.
 */
import { add, angle, at, dir, dPoly, dSmooth, INK, lerp, mix, mul, type P, type Pen, perp, r1, rng, spline, sub, unit } from './core';
import { spark } from './fx';
import { chain, hand, type Hand } from './body';

/** A circle as path data (for `Pen.form`). */
export const circD = (x: number, y: number, r: number) => `M${r1(x - r)} ${r1(y)}A${r1(r)} ${r1(r)} 0 1 0 ${r1(x + r)} ${r1(y)}A${r1(r)} ${r1(r)} 0 1 0 ${r1(x - r)} ${r1(y)}Z`;
/** An ellipse as path data. */
export const ellD = (x: number, y: number, rx: number, ry: number) => `M${r1(x - rx)} ${r1(y)}A${r1(rx)} ${r1(ry)} 0 1 0 ${r1(x + rx)} ${r1(y)}A${r1(rx)} ${r1(ry)} 0 1 0 ${r1(x - rx)} ${r1(y)}Z`;

/* ---------------- Medusa's Labyrinth ---------------- */

/** The labyrinth's colours: Gardener green stone, MEDUSA's gold and bronze, her gaze green. */
export const LAB = { stone: '#5a7a66', stoneDark: '#2e4438', stoneLight: '#8aa890', gold: '#f0c25a', bronze: '#a8743a', gaze: '#7dff9a', sleep: '#5ec8ff' };

/** Little Gardener light-word glyphs (centred on 0, 0, about 24 across). */
const GLYPHS = ['M-12 0a12 12 0 1 0 24 0a12 12 0 1 0 -24 0', 'M-12 8Q0 -16 12 8', 'M-12 -10v20M0 -6v12M12 -10v20', 'M-12 0H12M0 -12V12', 'M-10 -10L10 10M-10 10L10 -10', 'M-12 6L0 -10L12 6Z'];

/** A glowing light-word carved in stone at (x, y): a soft glow, the glyph in bright light, a white-hot dot. */
export function rune(pen: Pen, x: number, y: number, k: number, color: string, i: number, op = 1): string {
  return pen.glow(x, y, 30 * k, color, 0.75 * op) + `<path d="${GLYPHS[i % GLYPHS.length]}" fill="none" stroke="${mix(color, '#ffffff', 0.55)}" stroke-width="${r1(4.5 / k)}" transform="translate(${r1(x)} ${r1(y)}) scale(${r1(k * 100) / 100})"${op < 1 ? ` opacity="${op}"` : ''}/>`;
}

/**
 * A wall of big carved stone blocks from (x0, y0) to (x1, y1): staggered courses with inked joints and a
 * lit lower bevel on each, a few blocks a shade darker, and (optionally) glowing light-words in some of them.
 */
export function blockWall(
  pen: Pen,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  color: string,
  o: { seed?: number; bw?: number; bh?: number; line?: number; runes?: string[]; runeRate?: number; bevel?: string; sh?: number; hatch?: 0 | 1 | 2 | 3 } = {},
): string {
  const rand = rng(o.seed ?? 4);
  const bw = o.bw ?? 150;
  const bh = o.bh ?? 90;
  let joints = '';
  let tint = '';
  let glyphs = '';
  for (let y = y0, row = 0; y < y1; y += bh, row++) {
    joints += `M${r1(x0)} ${r1(y)}H${r1(x1)}`;
    const off = (row % 2) * (bw / 2) + (rand() - 0.5) * bw * 0.2;
    for (let x = x0 - off; x < x1; x += bw * (0.8 + rand() * 0.4)) {
      joints += `M${r1(x)} ${r1(y)}V${r1(y + bh)}`;
      const r = rand();
      if (r < 0.28) tint += `M${r1(x + 4)} ${r1(y + 4)}h${r1(bw * 0.8)}v${r1(bh - 8)}h${r1(-bw * 0.8)}Z`;
      if (o.runes && rand() < (o.runeRate ?? 0.1)) glyphs += rune(pen, x + bw * 0.45, y + bh / 2, 0.8, o.runes[Math.floor(rand() * o.runes.length)], Math.floor(rand() * 6), 0.85);
    }
  }
  const line = o.line ?? 2.6;
  const inner =
    `<path d="${tint}" fill="${INK}" opacity=".13"/>` +
    `<path d="${joints}" fill="none" stroke="${o.bevel ?? mix(color, '#ffffff', 0.35)}" stroke-width="${r1(line * 0.9)}" opacity=".35" transform="translate(2 ${r1(line * 1.2)})"/>` +
    `<path d="${joints}" fill="none" stroke="${INK}" stroke-width="${line}" opacity=".6"/>` +
    glyphs;
  return pen.form(`M${x0} ${y0}H${x1}V${y1}H${x0}Z`, color, { sh: o.sh ?? 0, hatch: o.hatch ?? 0, line: 0, inner });
}

/**
 * One of Aeëtes's gold robots, turned to mossy stone by MEDUSA's gaze mid-step: arms flung up, eyes
 * round with surprise. Feet at (x, y), about 600 tall at scale 1.
 */
export function stoneBot(pen: Pen, x: number, y: number, s: number, o: { flip?: boolean; color?: string; moss?: string; line?: number; seed?: number } = {}): string {
  const lp = pen.local(!!o.flip);
  const c = o.color ?? '#8e9a8c';
  const moss = o.moss ?? '#5f8a4a';
  const line = o.line ?? 2.6;
  const farC = lp.dark(c, 0.7);
  const rand = rng(o.seed ?? 3);
  const arm = (sh: P, el: P, wr: P, far: boolean, kind: Hand) =>
    chain(lp, sh, el, wr, [58, 48, 40], c, { shade: far ? farC : undefined, line, hatch: far ? 2 : 1, sh: far ? 0.5 : 0.38, rim: far ? 0 : 1.6 }) + hand(lp, wr, angle(sub(wr, el)), kind, 76, c, false, { line, rim: far ? 0 : 1.6 });
  const leg = (h: P, k: P, a: P, far: boolean) =>
    chain(lp, h, k, a, [80, 62, 54], c, { shade: far ? farC : undefined, line, hatch: far ? 2 : 1, sh: far ? 0.5 : 0.38, side: [-1, 1], rim: far ? 0 : 1.6 }) +
    lp.form(`M${a[0] - 36} ${a[1] - 16}L${a[0] + 54} ${a[1] - 18}Q${a[0] + 74} ${a[1] + 8} ${a[0] + 60} ${a[1] + 20}H${a[0] - 40}Z`, c, { sh: 14, line, shade: far ? farC : undefined, hatch: 1 });
  let out = '';
  out += arm([70, -420], [160, -470], [190, -580], true, 'open');
  out += leg([40, -240], [80, -130], [96, -20], true);
  out += leg([-40, -240], [-70, -128], [-90, -20], false);
  // The barrel torso with its chest plate and a dead power core.
  const core = `<circle cx="16" cy="-350" r="26" fill="${lp.dark(c, 0.9)}"/><circle cx="16" cy="-350" r="26" fill="none" stroke="${INK}" stroke-width="3" opacity=".7"/>`;
  const plate = `<path d="M-60 -400H86L74 -290H-46Z" fill="none" stroke="${INK}" stroke-width="2.6" opacity=".55"/>`;
  out += lp.form('M-96 -430Q-104 -460 -60 -466H80Q120 -460 112 -430L96 -250Q90 -226 60 -222H-50Q-80 -226 -84 -250Z', c, { sh: 60, hatch: 2, line: line + 0.4, rim: 2, axis: [0, 1], inner: plate + core });
  // The round head: a dome, a visor slot with two round, startled eyes, an O of a mouth, an antenna stub.
  const face = `<path d="M-46 -526H62Q66 -500 60 -486H-44Q-50 -500 -46 -526Z" fill="${lp.dark(c, 0.85)}"/><circle cx="-14" cy="-506" r="12" fill="${mix(c, '#ffffff', 0.35)}" stroke="${INK}" stroke-width="3"/><circle cx="30" cy="-506" r="12" fill="${mix(c, '#ffffff', 0.35)}" stroke="${INK}" stroke-width="3"/><circle cx="-12" cy="-505" r="4" fill="${INK}"/><circle cx="32" cy="-505" r="4" fill="${INK}"/><ellipse cx="10" cy="-470" rx="9" ry="11" fill="${INK}" opacity=".75"/>`;
  out += lp.form('M14 -580L16 -616', c, { line: 7 }) + lp.form(circD(16, -620, 9), c, { line: 2.2, sh: 4 });
  out += lp.form('M-62 -500Q-66 -582 10 -586Q84 -582 80 -500Q78 -456 10 -452Q-60 -456 -62 -500Z', c, { sh: 34, hatch: 2, line: line + 0.2, rim: 2, inner: face });
  // The near arm, flung up and back.
  out += arm([-84, -420], [-170, -476], [-196, -582], false, 'open');
  // Cracks and moss.
  const cracks: [P[], number][] = [];
  for (let i = 0; i < 6; i++) {
    const sx = -60 + rand() * 140;
    const sy = -430 + rand() * 200;
    cracks.push([[[sx, sy], [sx + (rand() - 0.5) * 30, sy + 26], [sx + (rand() - 0.5) * 40, sy + 50]], 2.4 + rand() * 1.6]);
  }
  out += lp.brushes(cracks, INK, [0.2, 0.6], 0.6);
  const mossy: [P[], number][] = [
    [[[-60, -566], [-20, -586], [30, -584], [70, -560]], 12],
    [[[-92, -432], [-60, -446], [-20, -440]], 10],
    [[[70, -444], [100, -436]], 9],
    [[[-40, -580], [-46, -540]], 6],
    [[[-84, -430], [-86, -400]], 6],
    [[[-150, -470], [-120, -450]], 8],
  ];
  out += lp.brushes(mossy, moss, [0.2, 0.3], 0.95) + lp.brushes(mossy.slice(0, 3).map(([p, w]) => [p.map((q) => add(q, [0, -4])), w * 0.35] as [P[], number]), mix(moss, '#ffffff', 0.4), [0.3, 0.4], 0.7);
  return at(x, y, s, out, o.flip);
}

/**
 * The Gardeners' Mirror Shield, centred at (x, y), radius r, tilted `tilt` degrees and foreshortened
 * (`squash` < 1): a bronze rim engraved with light-words round polished silver-blue glass, bright as a
 * pool of water, with a little gold sun at its heart. `flare` is where (in shield units, -1..1) the
 * light hits it.
 */
export function mirrorShield(pen: Pen, x: number, y: number, r: number, o: { tilt?: number; squash?: number; flare?: P; tint?: string[] } = {}): string {
  const tilt = o.tilt ?? 0;
  const sq = o.squash ?? 1;
  const lp = pen.local(false, tilt);
  const ry = r * sq;
  const engr = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
    .map((i) => {
      const a = (i / 12) * 360 + 15;
      const p = mul(dir(a), 1);
      return `<path d="${GLYPHS[i % GLYPHS.length]}" fill="none" stroke="#5a3410" stroke-width="3.4" transform="translate(${r1(p[0] * r * 0.92)} ${r1(p[1] * ry * 0.92)}) scale(${r1((r / 260) * 100) / 100})"/>`;
    })
    .join('');
  let out = lp.form(ellD(0, 0, r, ry), '#b88238', { sh: r * 0.18, hatch: 1, rim: 2.4, line: 3, inner: engr + `<ellipse cx="0" cy="0" rx="${r1(r * 0.985)}" ry="${r1(ry * 0.985)}" fill="none" stroke="#ffe0a0" stroke-width="2.4" opacity=".6"/>` });
  const fr = o.flare ?? [-0.3, -0.4];
  const fx = fr[0] * r * 0.8;
  const fy = fr[1] * ry * 0.8;
  const glass = lp.rad(
    [
      [0, '#ffffff'],
      [0.35, '#d8f8ff'],
      [0.75, '#86c4dc'],
      [1, '#4a86a8'],
    ],
    0.5 + fr[0] * 0.3,
    0.5 + fr[1] * 0.3,
    0.75,
  );
  // The reflection: the dark room round the edge, a smear of the heroes (orange, teal) low down, glare streaks.
  const tint = o.tint ?? ['#ff8a3d', '#2fb7a3'];
  const refl =
    `<ellipse cx="${r1(-r * 0.2)}" cy="${r1(ry * 0.5)}" rx="${r1(r * 0.16)}" ry="${r1(ry * 0.3)}" fill="${tint[0]}" opacity=".35"/>` +
    `<ellipse cx="${r1(r * 0.25)}" cy="${r1(ry * 0.52)}" rx="${r1(r * 0.13)}" ry="${r1(ry * 0.26)}" fill="${tint[1]}" opacity=".3"/>` +
    `<path d="${ellD(0, 0, r * 0.84, ry * 0.84)}" fill="none" stroke="#1a3a40" stroke-width="${r1(r * 0.16)}" opacity=".35"/>` +
    lp.brush(
      [
        [-r * 0.62, ry * 0.18],
        [-r * 0.2, -ry * 0.42],
        [r * 0.32, -ry * 0.66],
      ],
      r * 0.12,
      '#ffffff',
      [0.3, 0.4],
      0.85,
    ) +
    lp.brush(
      [
        [-r * 0.4, ry * 0.42],
        [r * 0.1, -ry * 0.1],
        [r * 0.56, -ry * 0.34],
      ],
      r * 0.05,
      '#ffffff',
      [0.4, 0.4],
      0.7,
    );
  // The little gold sun of light-words at its heart.
  let rays = '';
  for (let i = 0; i < 8; i++) {
    const d = dir(i * 45 + 22.5);
    rays += `M${r1(d[0] * r * 0.17)} ${r1(d[1] * ry * 0.17)}L${r1(d[0] * r * 0.28)} ${r1(d[1] * ry * 0.28)}`;
  }
  const sun = `<path d="${rays}" stroke="${INK}" stroke-width="${r1(r * 0.07)}"/><path d="${rays}" stroke="#ffd166" stroke-width="${r1(r * 0.04)}"/>`;
  out += lp.form(ellD(0, 0, r * 0.84, ry * 0.84), '#cfefff', { paint: glass, line: 2.6, inner: refl + sun });
  out += lp.form(ellD(0, 0, r * 0.13, ry * 0.13), '#ffd166', { sh: r * 0.04, line: 2.2 });
  out += lp.glow(fx, fy, r * 0.9, '#ffffff', 0.75) + spark(lp, fx, fy, r * 0.55, '#ffffff');
  return at(x, y, 1, out, false, tilt);
}

/**
 * A cable snake along the points (from its root to its head): a ribbed gold cable, shaded and banded,
 * with a flat snake head at the end, its eyes shut (`asleep`) or glowing green.
 */
export function cableSnake(pen: Pen, pts: P[], w: number, o: { asleep?: boolean; gold?: string; band?: string; far?: boolean } = {}): string {
  const gold = o.gold ?? LAB.gold;
  const dark = o.far ? pen.dark(gold, 0.42) : gold;
  const band = o.band ?? '#3a2408';
  const s = spline(pts, 4);
  const L = pen.L;
  const tp: [number, number] = [0.04, 0.08];
  let out = pen.brush(pts, w + 6, INK, tp);
  out += pen.brush(pts, w, dark, tp);
  out += pen.brush(
    pts.map((p) => add(p, mul(L, -w * 0.26))),
    w * 0.4,
    pen.dark(gold, o.far ? 0.9 : 0.62),
    tp,
  );
  out += `<path d="${dPoly(s, false)}" fill="none" stroke="${band}" stroke-width="${r1(w * 0.94)}" stroke-dasharray="${r1(w * 0.12)} ${r1(w * 0.46)}" stroke-linecap="butt" opacity=".55"/>`;
  if (!o.far) out += pen.brush(pts.map((p) => add(p, mul(L, w * 0.24))), w * 0.16, '#fff2c0', [0.15, 0.2], 0.8);
  // The head: a flat wedge along the last stretch of the cable.
  const end = pts[pts.length - 1];
  const d = unit(sub(end, s[s.length - 3]));
  const rot = (Math.atan2(d[1], d[0]) * 180) / Math.PI;
  const k = w / 24;
  const hp = pen.local(false, rot);
  const eyes = o.asleep
    ? hp.brushes(
        [
          [
            [
              [10, -9],
              [16, -6],
              [22, -9],
            ],
            2.6,
          ],
          [
            [
              [10, 9],
              [16, 6],
              [22, 9],
            ],
            2.6,
          ],
        ],
        INK,
        [0.2, 0.2],
      )
    : hp.glow(18, 0, 18, LAB.gaze, 0.8) + `<circle cx="16" cy="-8" r="4" fill="#c8ffd8"/><circle cx="16" cy="8" r="4" fill="#c8ffd8"/>`;
  const head =
    hp.form('M-8 -12Q8 -21 28 -17Q48 -10 50 0Q48 10 28 17Q8 21 -8 12Z', o.far ? dark : '#e0b048', {
      sh: 8,
      line: 2.6,
      rim: 1.4,
      inner: `<path d="M44 -4Q47 0 44 4" fill="none" stroke="${INK}" stroke-width="2.4"/>`,
    }) + eyes;
  out += at(end[0], end[1], 1, at(0, 0, k, head), false, rot);
  return out;
}

/**
 * MEDUSA asleep on her plinth: a giant gold mask with one great eye shut, a calm little smile, dim green
 * gems and a crown of cable snakes drooping round her and curled up on the steps like kittens. The
 * plinth's light-runes have dimmed to a sleepy blue. Plinth base centred at (x, y); about 760 tall.
 */
export function medusaAsleep(pen: Pen, x: number, y: number, s: number): string {
  const hy = -470;
  // The snakes, drawn for the left side and mirrored (with a nudge so the sides differ): [points, width, front?].
  // Back ones grow from the back of the crown and flop down to the steps and the floor; front ones come
  // over the edge of the mask and curl up on the top step, heads tucked in.
  const left: [P[], number, boolean][] = [
    [[[-36, -664], [-84, -740], [-180, -760], [-256, -704], [-280, -600], [-272, -480], [-280, -360], [-274, -250], [-252, -168], [-212, -120], [-176, -114], [-170, -140], [-196, -150]], 30, false],
    [[[-140, -610], [-224, -644], [-304, -600], [-332, -500], [-326, -380], [-332, -260], [-322, -160], [-298, -106], [-262, -98], [-250, -120], [-272, -134]], 28, false],
    [[[-84, -642], [-136, -704], [-204, -704], [-232, -640], [-226, -540], [-212, -440], [-204, -340], [-180, -258], [-138, -204], [-90, -194], [-74, -220], [-100, -234]], 34, true],
  ];
  const snakes: [P[], number, boolean][] = [];
  left.forEach(([p, w, f], i) => {
    snakes.push([p, w, f]);
    snakes.push([p.map(([px, py], j) => [-px + (j % 3 === 1 ? 5 : -4) * (i + 1), py + (j > 3 ? 6 * (i - 1) : 0)] as P), w - 2, f]);
  });
  // Two short ones on top, flopped forward over the crown band.
  snakes.push([[[-10, -666], [-26, -734], [-80, -760], [-130, -734], [-144, -684], [-126, -650]], 26, true]);
  snakes.push([[[30, -664], [56, -728], [110, -748], [158, -718], [168, -668], [150, -636]], 24, true]);
  let back = '';
  let front = '';
  for (const [p, w, f] of snakes) {
    if (f) front += cableSnake(pen, p, w, { asleep: true });
    else back += cableSnake(pen, p, w, { asleep: true, far: true });
  }
  // The plinth: two carved steps of dark green stone with a gold band and sleepy blue runes, and a short column.
  let runes = '';
  [-200, -100, 0, 100, 200].forEach((rx, i) => (runes += rune(pen, rx, -40, 0.9, LAB.sleep, i, 0.8)));
  const steps =
    pen.form('M-320 0L-290 -84H290L320 0Z', LAB.stoneDark, { sh: 40, hatch: 2, line: 3.2, rim: 2, inner: runes + `<path d="M-300 -60H300" stroke="${INK}" stroke-width="2.4" opacity=".5"/>` }) +
    pen.form('M-300 -78H300V-96H-300Z', '#c8963a', { sh: 6, line: 2.6, rim: 1.6 }) +
    pen.form('M-240 -96L-220 -156H220L240 -96Z', LAB.stone, { sh: 30, hatch: 2, line: 3, rim: 2, inner: [-150, -50, 50, 150].map((rx, i) => rune(pen, rx, -126, 0.7, LAB.sleep, i + 2, 0.75)).join('') }) +
    pen.form('M-120 -150L-100 -300H100L120 -150Z', LAB.stone, { sh: 50, hatch: 2, line: 3, rim: 2, axis: [0, 1], inner: `<path d="M-110 -200H110M-104 -250H104" stroke="${INK}" stroke-width="2.4" opacity=".5"/>` });
  // The mask.
  const gold = pen.rad(
    [
      [0, '#fff3c0'],
      [0.4, '#f6cc62'],
      [1, '#c08a2a'],
    ],
    0.66,
    0.32,
    0.8,
  );
  const fy = (v: number) => hy + v;
  const lidSeam: P[] = [
    [-82, fy(-8)],
    [-40, fy(18)],
    [0, fy(26)],
    [40, fy(18)],
    [82, fy(-8)],
  ];
  const lashes: [P[], number][] = [-56, -28, 0, 28, 56].map((lx) => {
    const t = (lx + 82) / 164;
    const py = fy(-8) + Math.sin(t * Math.PI) * 34;
    return [
      [
        [lx, py],
        [lx + lx * 0.12, py + 14],
      ],
      4,
    ];
  });
  const seams = `<path d="M0 ${fy(-195)}V${fy(-108)}M-150 ${fy(60)}Q-120 ${fy(130)} -70 ${fy(170)}M150 ${fy(60)}Q120 ${fy(130)} 70 ${fy(170)}" fill="none" stroke="${INK}" stroke-width="3" opacity=".5"/>`;
  const rivets = [-130, -66, 66, 130].map((rx) => `<circle cx="${rx}" cy="${r1(fy(-118) + Math.abs(rx) * 0.12)}" r="5" fill="${INK}" opacity=".55"/>`).join('');
  const faceInner =
    seams +
    rivets +
    // The crown band across the brow.
    pen.brush(
      [
        [-168, fy(-92)],
        [0, fy(-150)],
        [168, fy(-92)],
      ],
      30,
      INK,
      [0.02, 0.02],
    ) +
    pen.brush(
      [
        [-168, fy(-96)],
        [0, fy(-154)],
        [168, fy(-96)],
      ],
      22,
      LAB.bronze,
      [0.02, 0.02],
    ) +
    pen.brush(
      [
        [-150, fy(-104)],
        [0, fy(-160)],
        [150, fy(-104)],
      ],
      4,
      '#ffd890',
      [0.2, 0.2],
      0.7,
    ) +
    // The eye socket, the closed lids and their seam, lashes.
    `<path d="${ellD(0, fy(4), 104, 74)}" fill="#8a5a1a" opacity=".55"/>` +
    pen.form(ellD(0, fy(4), 92, 64), '#f0c050', { sh: 20, line: 3, rim: 1.8, inner: `<path d="${ellD(0, fy(4), 92, 64)}" fill="none" stroke="${LAB.bronze}" stroke-width="12"/>` }) +
    pen.brush(lidSeam, 9, INK, [0.15, 0.15]) +
    pen.brushes(lashes, INK, [0.1, 0.6]) +
    pen.brush(
      [
        [-60, fy(-30)],
        [0, fy(-44)],
        [60, fy(-30)],
      ],
      5,
      '#fff6d0',
      [0.3, 0.3],
      0.7,
    ) +
    // Brows, a hint of a nose, the calm little smile and the dim cheek gems.
    pen.brushes(
      [
        [
          [
            [-140, fy(-56)],
            [-90, fy(-74)],
            [-34, fy(-66)],
          ],
          14,
        ],
        [
          [
            [34, fy(-66)],
            [90, fy(-74)],
            [140, fy(-56)],
          ],
          14,
        ],
      ],
      LAB.bronze,
      [0.2, 0.4],
    ) +
    pen.brush(
      [
        [8, fy(70)],
        [12, fy(92)],
        [-2, fy(100)],
      ],
      4,
      INK,
      [0.3, 0.3],
      0.6,
    ) +
    pen.brush(
      [
        [-40, fy(128)],
        [0, fy(142)],
        [40, fy(128)],
      ],
      7,
      '#6a3e10',
      [0.25, 0.25],
    ) +
    pen.brush(
      [
        [-46, fy(122)],
        [-40, fy(128)],
        [-36, fy(134)],
      ],
      3,
      INK,
      [0.3, 0.3],
      0.6,
    ) +
    [-112, 112].map((gx) => pen.glow(gx, fy(62), 24, LAB.sleep, 0.6) + `<circle cx="${gx}" cy="${fy(62)}" r="9" fill="#4aa8a0" stroke="${INK}" stroke-width="2.6"/><circle cx="${gx - 3}" cy="${fy(59)}" r="3" fill="#dffcff"/>`).join('');
  const mask = `M0 ${fy(-200)}Q124 ${fy(-198)} 162 ${fy(-112)}Q184 ${fy(-30)} 164 ${fy(56)}Q136 ${fy(150)} 62 ${fy(192)}Q0 ${fy(214)} -62 ${fy(192)}Q-136 ${fy(150)} -164 ${fy(56)}Q-184 ${fy(-30)} -162 ${fy(-112)}Q-124 ${fy(-198)} 0 ${fy(-200)}Z`;
  const face = pen.form(mask, '#f0c25a', { paint: gold, sh: 52, hatch: 2, line: 4, rim: 3, inner: faceInner });
  // The ear-fins either side.
  const fins =
    pen.form(`M-160 ${fy(-30)}L-212 ${fy(-60)}L-200 ${fy(40)}L-160 ${fy(60)}Z`, LAB.bronze, { sh: 14, hatch: 1, line: 3, rim: 1.8 }) +
    pen.form(`M160 ${fy(-30)}L212 ${fy(-60)}L200 ${fy(40)}L160 ${fy(60)}Z`, LAB.bronze, { sh: 14, hatch: 1, line: 3, rim: 1.8 });
  return at(x, y, s, steps + back + fins + face + front);
}

/** A soft "z" of sleep, drawn with the brush. */
export function zed(pen: Pen, x: number, y: number, k: number, color = '#ffffff', op = 0.9): string {
  return pen.brush(
    [
      [x, y],
      [x + 30 * k, y],
      [x, y + 30 * k],
      [x + 30 * k, y + 30 * k],
    ],
    7 * k,
    color,
    [0.05, 0.05],
    op,
  );
}

/** A cluster of glowing crystals growing from (x, y): long faceted prisms fanning up, with a soft glow. */
export function crystals(pen: Pen, x: number, y: number, s: number, color: string, o: { seed?: number; n?: number; spread?: number; line?: number; glow?: number } = {}): string {
  const rand = rng(o.seed ?? 5);
  const n = o.n ?? 5;
  const spread = o.spread ?? 60;
  let out = pen.glow(x, y - 80 * s, 150 * s, color, o.glow ?? 0.6);
  const order = Array.from({ length: n }, (_, i) => i).sort((a, b) => Math.abs(b - (n - 1) / 2) - Math.abs(a - (n - 1) / 2));
  for (const i of order) {
    const a = 180 + (i / Math.max(1, n - 1) - 0.5) * spread + (rand() - 0.5) * 12;
    const l = (1 - Math.abs(i / Math.max(1, n - 1) - 0.5) * 0.9) * (130 + rand() * 90) * s;
    const w = (18 + rand() * 12) * s;
    const d = dir(a);
    const nn = perp(d);
    const b: P = add([x, y], mul(nn, (i - (n - 1) / 2) * w * 0.7));
    const tip = add(b, mul(d, l));
    const sh0 = add(b, mul(d, l * 0.8));
    const pts: P[] = [add(b, mul(nn, -w / 2)), add(sh0, mul(nn, -w / 2)), tip, add(sh0, mul(nn, w / 2)), add(b, mul(nn, w / 2))];
    const facet = `<path d="${dPoly([add(b, mul(nn, w * 0.05)), add(sh0, mul(nn, w * 0.05)), tip], false)}" fill="none" stroke="#ffffff" stroke-width="${r1(2 * s + 0.6)}" opacity=".7"/>`;
    out += pen.form(dPoly(pts), color, { sh: w * 0.45, line: o.line ?? 2.4 * s + 0.6, rim: 1.6, warm: 0.05, inner: facet });
  }
  return out;
}

/* ---------------- Brennus's Last Stand ---------------- */

const OLIVE = '#55663a';
const OLIVE_DARK = '#3a4426';

/**
 * One of General Brennus's old Legion robots, olive again (no more gold paint): a barrel body with the
 * red gear on its chest, gold shoulder pads, a dome head with one big green lens and an antenna, a claw
 * on the far arm and a cannon on the near one. Facing right; feet at (x, y), about 340 tall at scale 1.
 */
export function legionBot(pen: Pen, x: number, y: number, s: number, o: { flip?: boolean; aim?: number; rim?: number } = {}): string {
  const lp = pen.local(!!o.flip);
  const rim = o.rim ?? 2;
  const farC = lp.dark(OLIVE_DARK, 0.7);
  let out = '';
  // The far arm and its claw.
  out += chain(lp, [64, -210], [96, -156], [108, -104], [34, 28, 24], OLIVE_DARK, { shade: farC, hatch: 2, sh: 0.5, rim: 0 });
  out += lp.brushes(
    [
      [
        [
          [104, -104],
          [96, -80],
          [104, -66],
        ],
        9,
      ],
      [
        [
          [112, -104],
          [124, -82],
          [118, -66],
        ],
        9,
      ],
    ],
    INK,
    [0.05, 0.5],
  );
  // Legs and feet.
  const leg = (h: P, k: P, a: P, far: boolean) =>
    chain(lp, h, k, a, [44, 36, 32], OLIVE_DARK, { shade: far ? farC : undefined, hatch: far ? 2 : 1, sh: far ? 0.5 : 0.38, side: [-1, 1], rim: far ? 0 : rim }) +
    lp.form(`M${a[0] - 26} ${a[1] - 8}L${a[0] + 36} ${a[1] - 10}Q${a[0] + 50} ${a[1] + 6} ${a[0] + 42} ${a[1] + 16}H${a[0] - 28}Z`, '#2a2e1c', { sh: 10, line: 2.4, shade: far ? farC : undefined });
  out += leg([30, -112], [42, -64], [40, -18], true) + leg([-30, -112], [-38, -62], [-36, -18], false);
  // The barrel body with the red gear, rivets and plate seams.
  let gear = '';
  for (let i = 0; i < 8; i++) gear += `<rect x="-6" y="-32" width="12" height="12" fill="#c8282e" transform="translate(14 -168) rotate(${i * 45})"/>`;
  const bodyInner =
    `<path d="M-74 -150Q0 -128 80 -150M-60 -212Q0 -226 70 -212" fill="none" stroke="${INK}" stroke-width="2.6" opacity=".55"/>` +
    gear +
    `<circle cx="14" cy="-168" r="22" fill="none" stroke="#c8282e" stroke-width="9"/><circle cx="14" cy="-168" r="8" fill="${OLIVE_DARK}"/>` +
    [-56, -20, 44, 70].map((rx) => `<circle cx="${rx}" cy="${r1(-128 - Math.abs(rx) * 0.06)}" r="3.4" fill="${INK}" opacity=".6"/>`).join('');
  out += lp.form(ellD(0, -170, 80, 72), OLIVE, { sh: 46, hatch: 2, line: 3, rim, inner: bodyInner });
  // Head: dome, the green lens, an antenna.
  out += lp.brush(
    [
      [-18, -290],
      [-22, -316],
      [-24, -334],
    ],
    5,
    INK,
    [0.05, 0.05],
  );
  out += lp.glow(-24, -338, 16, '#3dff8a', 0.8) + lp.form(circD(-24, -338, 6), '#3dff8a', { line: 2 });
  out += lp.form(ellD(6, -262, 48, 38), OLIVE, { sh: 22, hatch: 1, line: 2.8, rim, inner: `<path d="M-40 -252Q6 -236 52 -252" fill="none" stroke="${INK}" stroke-width="2.4" opacity=".5"/>` });
  out += lp.glow(28, -262, 34, '#3dff8a', 0.85) + lp.form(circD(28, -262, 16), '#12301c', { line: 2.6, inner: `<circle cx="30" cy="-262" r="10" fill="#3dff8a"/><circle cx="26" cy="-266" r="3.6" fill="#eaffef"/>` });
  // Gold shoulder pads.
  out += lp.form(ellD(70, -214, 24, 15), '#c9a24a', { sh: 8, line: 2.4, rim: 1.4 }) + lp.form(ellD(-68, -216, 28, 17), '#d8b050', { sh: 9, line: 2.6, rim });
  // The near arm: a short upper arm and a cannon along the forearm, aimed by `aim` (degrees up from level).
  const aim = o.aim ?? 0;
  const el: P = [16, -146];
  const cl = pen.local(!!o.flip, -aim);
  const barrel =
    cl.form('M-14 -18H130V18H-14Z', '#3a3a32', { sh: 12, hatch: 1, line: 2.6, rim, inner: [24, 60, 96].map((bx) => `<rect x="${bx}" y="-18" width="10" height="36" fill="#c9a24a"/>`).join('') }) +
    cl.form('M130 -13H152V13H130Z', '#4a3a30', { sh: 4, line: 2.2 }) +
    `<circle cx="148" cy="0" r="5" fill="#110c08"/>`;
  out += chain(lp, [-66, -206], el, add(el, [10, 6]), [34, 30, 30], OLIVE_DARK, { rim }) + at(el[0], el[1], 1, barrel, false, -aim);
  return at(x, y, s, out, o.flip);
}

/**
 * One of Aeëtes's gold warships, facing right, centred on its hull: a long gold hull with a ram's horn
 * curling off the prow, a violet glass bridge, swept fins, a row of lit windows, orange engines and the
 * drop-claws it lowers robots with. `far` draws it thin-lined and hazed. About 680 long at scale 1.
 */
export function goldShip(pen: Pen, x: number, y: number, s: number, o: { flip?: boolean; far?: number; haze?: string; rot?: number } = {}): string {
  const lp = pen.local(!!o.flip, o.rot ?? 0);
  const far = o.far ?? 0;
  const line = (3 - far * 1.6) / Math.max(0.35, s);
  const gold = '#e8b440';
  let out = lp.glow(-330, 0, 150, '#ffa030', 0.85, 60) + lp.glow(-318, 0, 50, '#fff0c0', 0.9, 26);
  out += lp.brushes(
    [
      [
        [
          [-310, -12],
          [-470, -20],
        ],
        14,
      ],
      [
        [
          [-310, 18],
          [-450, 26],
        ],
        10,
      ],
    ],
    '#ffd890',
    [0.05, 0.9],
    0.7,
  );
  // Drop-claws hanging under the hull.
  const claws: [P[], number][] = [-120, 0, 120].map((cx) => [
    [
      [cx, 40],
      [cx - 14, 92],
      [cx + 6, 112],
    ],
    12,
  ]);
  out += lp.brushes(claws, INK, [0.05, 0.3]) + lp.brushes(claws.map(([p]) => [p, 6] as [P[], number]), '#6a5a40', [0.05, 0.3]);
  // The far fin, the hull, the near fin.
  out += lp.form('M-170 -60L-280 -150L-230 -150L-80 -70Z', lp.dark(gold, 0.6), { sh: 20, hatch: 2, line });
  const windows = [-200, -150, -100, -50, 0, 50, 100, 150]
    .map((wx) => `<rect x="${wx}" y="-8" width="22" height="10" rx="4" fill="#fff2b0"/>`)
    .join('');
  const plates = `<path d="M-300 -10Q0 -26 320 -8M-120 -84L-130 54M90 -80L84 52" fill="none" stroke="${INK}" stroke-width="${r1(line)}" opacity=".5"/>`;
  out += lp.form('M-310 0Q-270 -74 -90 -88L190 -82Q300 -62 336 -6Q306 42 196 56L-80 60Q-262 54 -310 0Z', gold, {
    sh: 46,
    hatch: far > 0.5 ? 1 : 2,
    line,
    rim: far > 0.5 ? 0 : 2.4,
    axis: [1, 0],
    inner: plates + windows + `<path d="M-310 12Q0 30 330 6" stroke="#a8741c" stroke-width="10" fill="none" opacity=".6"/>`,
  });
  out += lp.form('M-60 -84Q-30 -150 60 -150Q120 -140 130 -84Z', '#7a4aa8', {
    sh: 16,
    line,
    inner: lp.brush(
      [
        [-30, -98],
        [10, -134],
        [70, -136],
      ],
      8,
      '#e8d0ff',
      [0.3, 0.3],
      0.7,
    ),
  });
  out += lp.form('M-150 20L-270 110L-220 112L-60 40Z', gold, { sh: 20, hatch: 1, line, rim: far > 0.5 ? 0 : 1.8 });
  // The ram's horn curling off the prow.
  const horn: P[] = [
    [250, -60],
    [290, -120],
    [356, -112],
    [372, -56],
    [336, -24],
    [306, -48],
    [326, -72],
  ];
  out += lp.brush(horn, 34, INK, [0.05, 0.75]) + lp.brush(horn, 26, '#c8902a', [0.05, 0.75]) + lp.brush(horn.slice(0, 4), 7, '#ffe6a0', [0.2, 0.4], 0.7);
  // A red eye-light on the prow.
  out += lp.glow(300, -14, 30, '#ff3a4c', 0.85) + `<circle cx="300" cy="-14" r="8" fill="#ff6a6a"/>`;
  if (o.haze) out += lp.glow(-40, -10, 470, o.haze, far * 0.9, 190);
  return at(x, y, s, out, o.flip, o.rot ?? 0);
}

/**
 * A Legion dock gun on its turret: a stone-and-olive drum on a pedestal with a long twin barrel aimed up
 * along `aim` (degrees above level, toward +x). Base centred at (x, y), about 300 tall.
 */
export function dockGun(pen: Pen, x: number, y: number, s: number, o: { flip?: boolean; aim?: number } = {}): string {
  const lp = pen.local(!!o.flip);
  const aim = o.aim ?? 20;
  let out = lp.form('M-120 0L-96 -90H96L120 0Z', '#8a7a6a', { sh: 40, hatch: 2, line: 3.2, rim: 2.4, inner: `<path d="M-108 -46H108" stroke="${INK}" stroke-width="2.6" opacity=".5"/>` });
  const bp = pen.local(!!o.flip, -aim);
  const barrels =
    bp.form('M0 -40H300V-14H0Z', '#3a3a32', { sh: 10, hatch: 1, line: 3, rim: 2, inner: `<rect x="220" y="-42" width="14" height="30" fill="#c9a24a"/>` }) +
    bp.form('M0 4H300V30H0Z', '#3a3a32', { sh: 10, hatch: 1, line: 3, rim: 2, inner: `<rect x="220" y="2" width="14" height="30" fill="#c9a24a"/>` }) +
    bp.form('M296 -46H330V-8H296ZM296 -2H330V36H296Z', '#2a2a24', { sh: 6, line: 2.6 });
  out += at(20, -150, 1, barrels, false, -aim);
  out += lp.form('M-90 -90Q-96 -200 0 -206Q96 -200 90 -90Z', OLIVE, {
    sh: 50,
    hatch: 2,
    line: 3.2,
    rim: 2.4,
    inner: `<path d="M-84 -150H84" stroke="${INK}" stroke-width="2.6" opacity=".55"/><circle cx="10" cy="-150" r="18" fill="none" stroke="#c8282e" stroke-width="8"/>`,
  });
  out += lp.glow(-40, -176, 18, '#3dff8a', 0.9) + `<circle cx="-40" cy="-176" r="6" fill="#3dff8a"/>`;
  return at(x, y, s, out, o.flip);
}
