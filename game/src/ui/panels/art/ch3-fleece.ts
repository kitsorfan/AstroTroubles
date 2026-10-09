/**
 * Chapter 3 panels for the game's finale, the Golden Fleece: General Brennus and his little Legion squad
 * join the Argonauts in the tree-temple; Aeëtes in the Fleece armour, the Golden King; the Fleece laid
 * over Celestia at home; and (the secret ending) a valley full of little Celestias.
 */
import {
  aeetes,
  argoShip,
  at,
  atalanta,
  backdrop,
  brennus,
  C,
  captain,
  cloud,
  fleece,
  flower,
  gascuBloom,
  gasGiant,
  glow,
  glowDef,
  hypatia,
  ink,
  iris,
  jason,
  leaf,
  lux,
  panel,
  ridge,
  sparkle,
  stars,
  vignette,
  vine,
} from '../kit';
import * as gn from '../gn';
import { celestia, fleeceGN, goldenKing, legionBot, lifeboat, lightWord, rootGN } from '../gn/ch3d';

const GOLD_VINE = '#e8b030';

/* ---------------- 25. Brennus and his squad, in the graphic-novel style ---------------- */

const BARK = '#6a4a36';
const BARK_DARK = '#3a2630';

/**
 * The far wall of the root hall: dark living wood in tall ribs, Gardener light-words glowing in it, and
 * the ragged hole Brennus's lifeboat punched through it (centre hx, hy, radius hr), the sky showing
 * through. A warm glow at (gx, gy) marks the way on, deeper into the temple.
 */
function hallWall(pen: gn.Pen, hx: number, hy: number, hr: number, gx: number, gy: number): string {
  // The hole: a ragged, torn opening, wider than tall.
  const rand = gn.rng(12);
  const hole: gn.P[] = [];
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    const rr = hr * (0.8 + rand() * 0.32);
    hole.push([hx + Math.cos(a) * rr * 1.2, hy + Math.sin(a) * rr]);
  }
  const wall = `M-80 -60H1680V960H-80Z${gn.dSmooth(hole.slice().reverse())}`;
  // Tall ribs of wood, each a long root growing up the wall.
  let ribs = '';
  const xs = [80, 230, 560, 720, 880, 1040, 1300, 1460, 1600];
  xs.forEach((x, i) => {
    const w = 50 + ((i * 37) % 40);
    ribs += pen.brush([[x, 980], [x + ((i % 3) - 1) * 30, 600], [x - ((i % 2) * 2 - 1) * 40, 260], [x + 20, -80]], w, '#2a1a26', [0.05, 0.05], 0.55);
    ribs += pen.brush([[x - w * 0.3, 980], [x - w * 0.3 + ((i % 3) - 1) * 30, 600], [x - w * 0.3 - ((i % 2) * 2 - 1) * 40, 260], [x - w * 0.3 + 20, -80]], 4, '#c8885a', [0.2, 0.2], 0.35);
  });
  // Light-words carved in the wood, glowing in the four colours.
  const words: [number, number, 'sky' | 'grow' | 'friend' | 'home'][] = [
    [640, 250, 'sky'],
    [820, 170, 'grow'],
    [1010, 240, 'friend'],
    [1420, 210, 'home'],
    [60, 520, 'grow'],
  ];
  const glyphs = words.map(([x, y, w]) => lightWord(pen, x, y, 0.85, w, 0.8)).join('');
  const inner = ribs + pen.glow(gx, gy, 420, '#ffb050', 0.7, 300) + glyphs + gn.halftone(pen, 'M-80 -60H1680V300H-80Z', '#000000', 8, 0.18);
  const fill = pen.lin([
    [0, '#2a1626'],
    [0.5, '#5a3430'],
    [1, '#8a5a3a'],
  ]);
  // Splinters of torn wood sticking into the opening, dark against the sky, their tips lit.
  const c: gn.P = [hx, hy];
  const splinters: [gn.P[], number][] = [];
  const tips: [gn.P[], number][] = [];
  hole.forEach((p, i) => {
    const q = gn.lerp(p, hole[(i + 1) % hole.length], 0.5);
    const inward = gn.unit(gn.sub(c, q));
    const l = 16 + ((i * 29) % 26);
    const bend = gn.mul(gn.perp(inward), ((i % 3) - 1) * 10);
    const root = gn.add(q, gn.mul(inward, -16));
    const tip = gn.add(gn.add(q, gn.mul(inward, l)), bend);
    splinters.push([[root, gn.lerp(root, tip, 0.5), tip], 12 + (i % 3) * 4]);
    tips.push([[gn.lerp(root, tip, 0.45), tip], 4]);
  });
  return (
    `<path d="${wall}" fill="${fill}" fill-rule="evenodd"/>` +
    `<g clip-path="url(#${pen.shared('wallclip', (id) => `<clipPath id="${id}"><path d="${wall}" clip-rule="evenodd"/></clipPath>`)})">${inner}</g>` +
    `<path d="${gn.dSmooth(hole)}" fill="none" stroke="#ffcf98" stroke-width="10" opacity=".6"/>` +
    pen.brushes(splinters, '#3a2224', [0.05, 0.85]) +
    pen.brushes(tips, '#ffc888', [0.2, 0.6], 0.8)
  );
}

/** Smoke curling up from a point: a column of soft grey puffs, darker at the bottom. */
function smoke(pen: gn.Pen, x: number, y: number, h: number, lean: number): string {
  let out = '';
  for (let i = 0; i < 7; i++) {
    const t = i / 6;
    const r = 34 + t * 80;
    out += pen.glow(x + lean * t * t, y - t * h, r * 1.4, i < 3 ? '#4a3a48' : '#7a6a78', 1, r) + pen.glow(x + lean * t * t, y - t * h, r * 0.7, '#3a2a38', 0.7 - t * 0.5, r * 0.6);
  }
  return out;
}

/** Bits of bark and splinters scattered on the floor from the crash. */
function debris(pen: gn.Pen, seed: number, x0: number, x1: number, y0: number, y1: number, n: number): string {
  const rand = gn.rng(seed);
  const list: [gn.P[], number][] = [];
  const lit: [gn.P[], number][] = [];
  for (let i = 0; i < n; i++) {
    const x = x0 + rand() * (x1 - x0);
    const y = y0 + rand() * (y1 - y0);
    const l = 14 + rand() * 30;
    const a = (rand() - 0.5) * 0.7;
    const p: gn.P[] = [
      [x, y],
      [x + l * Math.cos(a), y + l * Math.sin(a)],
    ];
    list.push([p, 6 + rand() * 6]);
    lit.push([p.map((q) => gn.add(q, [0, -2.5])), 2.2]);
  }
  return pen.brushes(list, '#24141a', [0.2, 0.5]) + pen.brushes(lit, '#d8a070', [0.3, 0.5], 0.7);
}

/** 25. In the root hall, under his lifeboat stuck in the wall, General Brennus shakes Jason's hand, his green squad saluting behind him; Atalanta smirks. */
export function ch3Squad(): string {
  const pen = gn.Pen.scene('ch3-squad', { key: [-0.4, -0.92], keyColor: '#ffd9a0', rim: [0.9, -0.4], rimColor: '#a8ffe4', shadow: '#5a4a8a', depth: 0.55 });
  const hx = 250;
  const hy = 250;
  // Through the hole: Colchis's golden twilight and the gas giant.
  const sky =
    gn.sky(pen, [
      [0, '#3a2a6a'],
      [0.2, '#c8708a'],
      [0.42, '#ffc888'],
      [1, '#ffe2b0'],
    ]) +
    gn.gasGiant(pen, 150, 150, 110, { lightDir: [0.8, 0.4], haze: 0.35, sky: '#d88a9a' }) +
    gn.starfield(pen, 4, 20, 0, 60, 500, 120, '#fff0f0') +
    gn.bloom(pen, 330, 330, 90, '#fff2d0', 0.9);
  // The hall's far wall with the hole, light pouring in, and the warm glow of the way on.
  const far =
    hallWall(pen, hx, hy, 190, 1230, 430) +
    gn.godRays(pen, hx + 60, hy + 40, [22, 36, 50, 62, 74], 6, 1300, '#ffe0a8', 0.3) +
    gn.haze(pen, 580, 820, '#c8806a', 0.45);
  // Great roots arching over the hall, the floor, and the lifeboat stuck nose-down in the hole, smoking.
  const back = pen.relight({ key: [-0.3, -1], depth: 0.75 });
  const floor = pen.form('M-80 700Q500 680 900 690Q1300 700 1680 690V960H-80Z', '#5a4a34', {
    sh: 0,
    line: 3,
    paint: pen.lin([
      [0, '#a8804a'],
      [0.35, '#6a6a34'],
      [1, '#2a3020'],
    ]),
    inner:
      pen.brushes(
        [
          [
            [
              [-60, 760],
              [400, 730],
              [900, 744],
            ],
            10,
          ],
          [
            [
              [700, 820],
              [1200, 790],
              [1700, 810],
            ],
            12,
          ],
        ],
        '#2a1a1a',
        [0.2, 0.3],
        0.5,
      ) +
      pen.glow(560, 720, 600, '#ffd9a0', 0.5, 90) +
      debris(pen, 5, 300, 900, 700, 760, 12),
  });
  const mid =
    floor +
    rootGN(back, [[1680, 520], [1520, 260], [1300, 60], [1060, -90]], 170, 100, BARK, { rim: 2.4, grain: 5 }) +
    rootGN(back, [[1500, 980], [1560, 700], [1500, 400], [1580, 120]], 130, 110, BARK_DARK, { rim: 2.4, grain: 4 }) +
    smoke(pen, 120, 160, 260, -40) +
    lifeboat(back, 250, 300, 0.78, 32, { dent: true }) +
    smoke(pen, 440, 410, 330, -80) +
    gn.spark(pen, 446, 420, 26, '#fff2b0') +
    gn.spark(pen, 410, 446, 13, '#ffe080') +
    gn.spark(pen, 470, 456, 9, '#ffffff') +
    rootGN(back, [[-80, 560], [40, 330], [160, 60], [420, -90]], 150, 90, BARK, { rim: 2.4, grain: 5 });
  // The squad, lined up behind their general, each with a sapling to plant (one robot drawn once, the others reuse it).
  const botId = pen.uid();
  const bot = (x: number, y: number, s: number) => gn.castShadow(pen, x + 10, y + 4, 110 * s, 12 * s, 0.4) + `<use href="#${botId}" transform="translate(${x} ${y}) scale(${s})"/>`;
  const squad =
    `<defs><g id="${botId}">${legionBot(pen, 0, 0, 1, { pose: 'carry', gear: 'sapling' })}</g></defs>` +
    bot(30, 790, 0.66) +
    bot(140, 804, 0.71) +
    bot(255, 822, 0.77) +
    gn.legionShield(pen, [500, 806], 180, -16) +
    bot(380, 846, 0.84);
  // The handshake: Brennus and Jason, Atalanta on the right with IRIS, LUX bobbing over Jason.
  const heroes =
    gn.castShadow(pen, 640, 900, 190, 18, 0.5) +
    gn.brennus(pen, 650, 904, 1.08, {
      pose: { turn: 0.62, lean: 5, hipTilt: 6, armN: { to: [1.75, 1.15] }, armF: [10, 6], legN: { to: [-0.16, 0.97] }, legF: { to: [0.24, 0.95] }, handN: 'grip', handF: 'fist', wristN: -6 },
      shield: false,
      cannon: false,
      mood: 'smile',
      look: [3, 0.8],
    }) +
    gn.castShadow(pen, 1045, 900, 150, 16, 0.5) +
    gn.jason(pen, 1040, 904, 1.06, {
      flip: true,
      pose: { turn: 0.58, lean: 3, hipTilt: 5, armN: { to: [1.25, 0.05] }, armF: [-10, 6], legN: { to: [-0.18, 0.97] }, legF: { to: [0.22, 0.96] }, handN: 'grip', handF: 'relaxed', wristN: 6 },
      mood: 'grin',
      look: [2.6, -1.2],
    }) +
    gn.lux(pen, 1140, 290, 0.82, 'happy', { flip: true }) +
    gn.castShadow(pen, 1310, 896, 140, 15, 0.45) +
    gn.atalanta(pen, 1310, 900, 1.04, { pose: 'hips', mood: 'sly', flip: true, look: [2.4, 0.5] }) +
    gn.iris(pen, 1460, 340, 0.72, 'happy', { flip: true, rot: -8 });
  const fore =
    rootGN(pen, [[-90, 990], [60, 900], [200, 880], [330, 960]], 70, 40, '#2a1a1c', { rim: 2.6, grain: 3 }) +
    rootGN(pen, [[1700, 880], [1560, 860], [1460, 920], [1420, 990]], 90, 50, '#2a1a1c', { rim: 2.6, grain: 3 }) +
    [
      [180, 890],
      [1530, 870],
      [1590, 905],
    ]
      .map(([x, y], i) => pen.glow(x, y, 50, '#7dff9a', 0.6) + pen.form(`M${x - 18} ${y}Q${x} ${y - 26 - i * 4} ${x + 18} ${y}Z`, '#bfffd0', { line: 2, sh: 0 }))
      .join('');
  return pen.svg(gn.layer(0.15, sky) + gn.layer(0.35, far) + gn.layer(0.6, mid) + gn.layer(0.85, squad) + gn.layer(1, heroes) + gn.layer(1.3, fore) + gn.vignette(pen, 0.55, '#120a18') + gn.grain(pen, 0.08));
}

/* ---------------- 26. The Golden King, in the graphic-novel style ---------------- */

/**
 * 26. In the Fleece chamber, Aeëtes has put on the Golden Fleece: the Golden King towers on the altar,
 * arms flung wide, gold vines curling from his shoulders and the Fleece spread behind him like wings.
 * Brennus raises his shield in the foreground, Atalanta draws her bow behind him, and Jason takes aim.
 */
export function ch3GoldenKing(): string {
  const pen = gn.Pen.scene('ch3-goldenking', { key: [0.1, -1], keyColor: '#ffd070', rim: [0, -1], rimColor: '#fff0b0', shadow: '#5a2a6a', depth: 0.55 });
  const cx = 800;
  const cy = 430;
  // The domed chamber: dark ribs of root converging overhead, lit gold from below.
  const sky =
    gn.sky(pen, [
      [0, '#0c0616'],
      [0.35, '#2a1236'],
      [0.7, '#7a3436'],
      [1, '#c8702e'],
    ]) +
    gn.halftone(pen, 'M-80 -60H1680V360H-80Z', '#000000', 9, 0.25) +
    gn.godRays(pen, cx, cy, [-170, -145, -120, -98, -76, -54, 54, 76, 98, 120, 145, 170, 192], 6, 1300, '#ffd27a', 0.34) +
    gn.bloom(pen, cx, cy - 60, 220, '#ffd88a', 0.75);
  const ribL = pen.relight({ key: [0.8, 0.5], rim: [1, 0.2], rimColor: '#ffc860', shadow: '#2a1a3a', depth: 0.85 });
  const ribR = pen.relight({ key: [-0.8, 0.5], rim: [-1, 0.2], rimColor: '#ffc860', shadow: '#2a1a3a', depth: 0.85 });
  const far =
    rootGN(ribL, [[-80, 980], [40, 560], [260, 200], [620, -90]], 190, 80, '#3a2230', { rim: 3, grain: 3 }) +
    rootGN(ribR, [[1680, 980], [1560, 560], [1340, 200], [980, -90]], 190, 80, '#3a2230', { rim: 3, grain: 3 }) +
    rootGN(ribL, [[280, 900], [330, 560], [470, 260], [700, -60]], 90, 50, '#4a2a34', { rim: 2.4, grain: 3 }) +
    rootGN(ribR, [[1320, 900], [1270, 560], [1130, 260], [900, -60]], 90, 50, '#4a2a34', { rim: 2.4, grain: 3 }) +
    gn.haze(pen, 560, 900, '#c8702e', 0.55);
  // The altar: a round stone dais veined with gold, a ring of runes glowing round it, gold vines whipping up out of the floor.
  const floor = pen.form('M-80 760Q800 700 1680 760V960H-80Z', '#3a2228', {
    sh: 0,
    line: 3,
    paint: pen.lin([
      [0, '#8a4a2e'],
      [1, '#1a0e16'],
    ]),
  });
  const dais =
    pen.glow(cx, 800, 520, '#ffb040', 0.7, 120) +
    `<ellipse cx="${cx}" cy="812" rx="430" ry="70" fill="none" stroke="#ffd166" stroke-width="5" stroke-dasharray="26 18" opacity=".75"/>` +
    pen.form(`M${cx - 330} 790L${cx - 310} 846Q${cx} 890 ${cx + 310} 846L${cx + 330} 790Z`, '#b89a7a', { sh: 30, hatch: 2, line: 3, rim: 2, shade: '#5a3a4a', inner: `<path d="M${cx - 200} 820L${cx - 150} 870M${cx + 120} 830L${cx + 190} 866" stroke="#ffd166" stroke-width="5"/>` }) +
    pen.form(`M${cx - 330} 790Q${cx} 740 ${cx + 330} 790Q${cx} 840 ${cx - 330} 790Z`, '#e0caa8', {
      line: 3,
      inner: `<path d="M${cx - 220} 790Q${cx - 120} 776 ${cx - 40} 800T${cx + 180} 786M${cx - 120} 808Q${cx} 812 ${cx + 60} 772" fill="none" stroke="#ffc844" stroke-width="5"/>` + pen.glow(cx, 790, 280, '#fff2c0', 0.6, 40),
    });
  const mid = floor + dais;
  // The Golden King, lit gold from the altar beneath him.
  const king =
    goldenKing(pen.relight({ key: [0.15, 0.9], rim: [0, -1], rimColor: '#fff0b0', depth: 0.5 }), cx, 796, 0.84, { mood: 'scheming', look: [0, 2] }) +
    gn.spark(pen, 560, 210, 18, '#fff6d0') +
    gn.spark(pen, 1060, 190, 22, '#fff6d0') +
    gn.spark(pen, 700, 640, 12, '#ffffff');
  // The heroes in the foreground, dark against the gold, rimmed by its light.
  const lt = pen.relight({ key: [1, -0.25], keyColor: '#ffc860', rim: [1, -0.3], rimColor: '#ffe6a0', shadow: '#2a1a4a', depth: 0.8 });
  const rt = pen.relight({ key: [-1, -0.25], keyColor: '#ffc860', rim: [-1, -0.3], rimColor: '#ffe6a0', shadow: '#2a1a4a', depth: 0.8 });
  const heroes =
    gn.atalanta(lt, 560, 930, 0.86, { bow: 'draw', aim: 124, mood: 'focus', look: [2.6, -2.5], wind: 0.6, rim: 3 }) +
    gn.brennus(lt, 210, 1130, 1.3, {
      pose: { turn: 0.72, lean: 8, armF: { to: [1.5, 0.55] }, armN: [62, 96], legN: { to: [-0.35, 0.9] }, legF: { to: [0.35, 0.9] }, handN: 'fist', handF: 'fist' },
      mood: 'determined',
      look: [2.6, -2],
      rim: 3,
    }) +
    gn.jason(rt, 1380, 1060, 1.2, {
      flip: true,
      pose: { turn: 0.62, lean: 6, armN: { to: [1.9, -0.75] }, armF: [-24, 10], legN: { to: [-0.34, 0.9] }, legF: { to: [0.32, 0.92] }, handN: 'fist', handF: 'fist' },
      mood: 'determined',
      look: [2.6, -2.4],
      rim: 3,
    }) +
    gn.lux(rt, 1200, 360, 0.8, 'scared', { flip: true, look: [7, -3] });
  return pen.svg(gn.layer(0.15, sky) + gn.layer(0.35, far) + gn.layer(0.6, mid) + gn.layer(0.8, king) + gn.layer(1.25, heroes) + gn.vignette(pen, 0.6, '#0a0410') + gn.grain(pen, 0.08));
}

/** A rolling meadow at sunset with flowers dotted along it (for the ending pictures). */
function meadow(seed: number, y: number, colors: string[]): string {
  let out = `<path d="M0 ${y}Q400 ${y - 40} 800 ${y}T1600 ${y}V900H0Z" fill="#7ab84a" ${ink(5)}/>`;
  for (let i = 0; i < 16; i++) {
    const x = 40 + ((i * 97 + seed * 31) % 1520);
    const fy = y + 40 + ((i * 53) % 140);
    out += flower(x, fy, 10 + (i % 3) * 4, colors[i % colors.length]);
  }
  return out;
}

/* ---------------- 27 and 28. The endings, in the graphic-novel style ---------------- */

/** Little five-petal wild flowers scattered in a box, bigger toward the bottom (the valley in bloom). */
function wildFlowers(pen: gn.Pen, seed: number, n: number, x0: number, x1: number, y0: number, y1: number, colors: string[], size = 12, line = 1.8): string {
  const rand = gn.rng(seed);
  const byColor: Record<string, string> = {};
  let centres = '';
  for (let i = 0; i < n; i++) {
    const t = rand();
    const x = x0 + rand() * (x1 - x0);
    const y = y0 + t * (y1 - y0);
    const r = size * (0.45 + t * 0.8);
    const c = colors[i % colors.length];
    let d = '';
    for (let k = 0; k < 5; k++) {
      const a = (k / 5) * Math.PI * 2 + rand();
      const px = x + Math.cos(a) * r * 0.62;
      const py = y + Math.sin(a) * r * 0.5;
      d += `M${gn.r1(px - r * 0.42)} ${gn.r1(py)}a${gn.r1(r * 0.42)} ${gn.r1(r * 0.36)} 0 1 0 ${gn.r1(r * 0.84)} 0a${gn.r1(r * 0.42)} ${gn.r1(r * 0.36)} 0 1 0 ${gn.r1(-r * 0.84)} 0`;
    }
    byColor[c] = (byColor[c] ?? '') + d;
    centres += `M${gn.r1(x)} ${gn.r1(y)}h0`;
  }
  return (
    Object.entries(byColor)
      .map(([c, d]) => `<path d="${d}" fill="${c}" stroke="${gn.INK}" stroke-width="${line}"/>`)
      .join('') + `<path d="${centres}" stroke="#ffd166" stroke-width="${gn.r1(size * 0.5)}" stroke-linecap="round"/>`
  );
}

/** Tiny far-off flowers: dots of colour in a box (cheap: one path per colour). */
function flowerDots(seed: number, n: number, x0: number, x1: number, y0: number, y1: number, colors: string[], size: number): string {
  const rand = gn.rng(seed);
  const d = colors.map(() => '');
  for (let i = 0; i < n; i++) {
    const t = rand();
    d[i % colors.length] += `M${Math.round(x0 + rand() * (x1 - x0))} ${Math.round(y0 + t * (y1 - y0))}h0`;
  }
  return colors.map((c, i) => `<path d="${d[i]}" stroke="${c}" stroke-width="${size}" stroke-linecap="round"/>`).join('');
}

/** The Argo landed far off in the valley, a flat silhouette in the haze (hull, mast and sail), centred at (x, y). */
function argoFar(x: number, y: number, s: number, color: string): string {
  const d = 'M-340 -30Q0 -46 300 -36Q370 -30 390 0Q340 50 260 60Q0 76 -250 64Q-330 50 -350 0ZM-300 -30Q-350 -120 -300 -200Q-260 -220 -250 -190Q-290 -150 -270 -40ZM-10 -470H10V-40H-10ZM-166 -446Q-122 -300 -166 -146H178Q222 -300 178 -446Z';
  return gn.at(x, y, s, `<path d="${d}" fill="${color}"/>`);
}

/** A kneeling pose (facing right): the far knee down, the near knee up, both hands reaching down in front. */
const KNEEL: gn.Pose = { turn: 0.5, lean: 12, tilt: -14, legN: { to: [0.4, 0.66] }, legF: { to: [-0.42, 0.66] }, footF: 70, armN: { to: [1.2, 1.25] }, armF: { to: [1.45, 1.1] }, handN: 'flat', handF: 'flat', wristN: -30, wristF: -30 };

/**
 * 27. Home on Gaia Nova at sunset: in the colony garden the Argonauts have laid the Golden Fleece over
 * Celestia like a blanket of sunshine, and she blooms, glowing brighter than ever. Jason and Atalanta kneel
 * at the Fleece's edge, Brennus holds his cap to his heart, Captain Argus beams, the Argo rests in the valley.
 */
export function ch3Home(): string {
  const pen = gn.Pen.scene('ch3-home', { key: [0, -1], keyColor: '#ffe6b0', rim: [0, -1], rimColor: '#ffc8b0', shadow: '#6a4a9a', depth: 0.5 });
  const cx = 800;
  const cy = 320;
  const sky =
    gn.sky(pen, [
      [0, '#2a3a8a'],
      [0.3, '#8a6ab8'],
      [0.52, '#ff9a8a'],
      [0.7, '#ffd0a0'],
    ]) +
    gn.starfield(pen, 6, 30, 0, 0, 1600, 200, '#fff6e0') +
    gn.gasGiant(pen, 200, 150, 84, { lightDir: [0.9, 0.4], haze: 0.5, sky: '#7a6ab0' }) +
    gn.godRays(pen, cx, cy, [-150, -125, -100, -78, -56, 56, 78, 100, 125, 150, 180], 7, 1300, '#fff0c0', 0.3);
  const far =
    gn.silhouette(
      [
        [-80, 600],
        [160, 520],
        [420, 560],
        [640, 500],
        [900, 540],
        [1180, 490],
        [1420, 540],
        [1680, 500],
        [1680, 640],
        [-80, 640],
      ],
      '#b88aa8',
    ) +
    argoFar(1170, 552, 0.22, '#9a6a8e') +
    // The colony's domes on the far hillside.
    [
      [260, 566, 30],
      [320, 572, 20],
      [372, 568, 26],
    ]
      .map(([x, y, r]) => `<path d="M${x - r} ${y}A${r} ${r * 0.8} 0 0 1 ${x + r} ${y}Z" fill="#c8a0b8"/><circle cx="${x}" cy="${y - r * 0.5}" r="3" fill="#fff2c0"/>`)
      .join('') +
    gn.haze(pen, 500, 640, '#ffd0b0', 0.7) +
    gn.silhouette(
      [
        [-80, 660],
        [260, 600],
        [560, 640],
        [1000, 600],
        [1300, 630],
        [1680, 590],
        [1680, 700],
        [-80, 700],
      ],
      '#8a8a9a',
    ) +
    flowerDots(3, 70, -40, 1640, 612, 680, ['#ff6fcf', '#ffd166', '#5e9bff', '#ffffff'], 7) +
    gn.haze(pen, 600, 720, '#ffc8a8', 0.5);
  // The garden: a meadow in bloom; Celestia in the middle with the Fleece draped round her like a blanket.
  const ground = pen.form('M-80 690Q400 660 800 672Q1200 660 1680 690V960H-80Z', '#5a9a4a', {
    line: 3,
    paint: pen.lin([
      [0, '#9ad06a'],
      [0.5, '#4a8a44'],
      [1, '#1e3a2a'],
    ]),
    inner: pen.glow(cx, 700, 700, '#fff0b0', 0.55, 130) + flowerDots(9, 80, -60, 1660, 690, 860, ['#ff6fcf', '#ffd166', '#5e9bff', '#7dff9a'], 11),
  });
  const fleecePts: gn.P[] = [
    [cx - 40, 474],
    [cx + 40, 474],
    [cx + 92, 524],
    [cx + 150, 600],
    [cx + 240, 656],
    [cx + 340, 700],
    [cx + 290, 738],
    [cx + 120, 756],
    [cx - 120, 756],
    [cx - 290, 738],
    [cx - 340, 700],
    [cx - 240, 656],
    [cx - 150, 600],
    [cx - 92, 524],
  ];
  const garden =
    ground +
    gn.bloom(pen, cx, cy, 200, '#fff0c0', 0.8) +
    celestia(pen.relight({ key: [0, -1], rim: [0, 1], rimColor: '#ffffff' }), cx, cy, 1.18, { stem: 380, sway: 16 }) +
    pen.glow(cx, 640, 440, '#ffd166', 0.8, 200) +
    fleeceGN(pen.relight({ key: [0, -1] }), fleecePts, {
      edge: 0.2,
      seeds: [
        [cx - 70, 600],
        [cx + 50, 540],
        [cx + 170, 680],
        [cx - 20, 700],
        [cx - 230, 690],
      ],
      folds: [
        [
          [cx - 14, 490],
          [cx - 50, 600],
          [cx - 110, 750],
        ],
        [
          [cx + 18, 490],
          [cx + 60, 600],
          [cx + 120, 750],
        ],
        [
          [cx - 60, 540],
          [cx - 170, 650],
          [cx - 300, 720],
        ],
        [
          [cx + 60, 540],
          [cx + 170, 650],
          [cx + 300, 720],
        ],
      ],
      sh: 18,
      bump: 13,
      curl: 50,
      glow: 1.1,
    }) +
    pen.glow(cx, 600, 220, '#fff2a0', 0.6, 140) +
    gn.bloom(pen, cx, cy, 130, '#fff6e0', 0.95) +
    gn.spark(pen, cx - 230, 230, 16, '#fff6d0') +
    gn.spark(pen, cx + 250, 190, 20, '#fff6d0') +
    gn.spark(pen, cx + 170, 420, 10, '#ffffff');
  // The Argonauts, lit by Celestia's glow.
  const fromL = pen.relight({ key: [1, -0.45], rim: [-0.7, -0.7], rimColor: '#ffb8a0' });
  const fromR = pen.relight({ key: [-1, -0.45], rim: [0.7, -0.7], rimColor: '#ffb8a0' });
  const heroes =
    gn.castShadow(fromL, 300, 900, 150, 16, 0.4) +
    gn.brennus(fromL, 290, 904, 1.02, {
      capOff: true,
      shield: false,
      cannon: false,
      pose: { turn: 0.5, tilt: -6, hipTilt: 6, armN: { to: [0.5, 1.0] }, armF: [8, 4], legN: { to: [-0.08, 0.985] }, legF: { to: [0.2, 0.96] }, handN: 'flat', handF: 'fist', wristN: 80 },
      mood: 'proud',
      look: [2.4, -2.5],
    }) +
    gn.castShadow(fromR, 1350, 900, 150, 16, 0.4) +
    gn.argus(fromR, 1350, 904, 1.0, { pose: 'hips', mood: 'smile', flip: true, look: [2.4, -2.5] }) +
    gn.castShadow(fromL, 530, 890, 130, 14, 0.45) +
    gn.jason(fromL, 520, 892, 1.0, { pose: KNEEL, mood: 'smile', look: [2.6, -3.5] }) +
    gn.castShadow(fromR, 1080, 890, 130, 14, 0.45) +
    gn.atalanta(fromR, 1090, 892, 1.0, { pose: KNEEL, mood: 'smile', flip: true, look: [2.6, -3.5], wind: 0.4 }) +
    gn.lux(fromL, 600, 330, 0.8, 'happy', { look: [8, -4] }) +
    gn.iris(fromR, 1010, 300, 0.78, 'happy', { flip: true });
  // Petals and motes of light drifting up out of her.
  const motes = [
    [560, 460],
    [700, 180],
    [930, 150],
    [1060, 430],
    [420, 260],
    [1200, 280],
    [880, 520],
  ]
    .map(([x, y], i) => pen.glow(x, y, 22, gn.RAINBOW[i % 6], 0.9) + `<circle cx="${x}" cy="${y}" r="4" fill="#fff"/>`)
    .join('');
  return pen.svg(gn.layer(0.15, sky) + gn.layer(0.35, far) + gn.layer(0.7, garden) + gn.layer(1, heroes + motes) + gn.vignette(pen, 0.45, '#1a0c2a') + gn.grain(pen, 0.08));
}

/** 28. The secret ending: LUX and IRIS sing light-words over a valley full of little Celestias, golden seeds drifting down. */
export function ch3Gardeners(): string {
  const id = 'ch3-gardeners';
  const words = ['#5ec8ff', '#7dff9a', '#ff6fcf', C.gold, '#c37bff']
    .map((c, i) => `<g transform="translate(${470 + i * 165} ${150 + (i % 2) * 50})" fill="none" stroke="${c}" stroke-width="9" stroke-linecap="round"><path d="M-34 0q17 -34 34 0t34 0"/><path d="M-14 26h28"/></g>`)
    .join('');
  let blooms = '';
  const spots = [
    [180, 700, 0.42],
    [360, 760, 0.5],
    [560, 690, 0.38],
    [1050, 690, 0.4],
    [1240, 770, 0.5],
    [1430, 700, 0.42],
    [260, 860, 0.36],
    [1350, 870, 0.36],
  ];
  spots.forEach(([x, y, s], i) => (blooms += gascuBloom(`${id}b${i}`, x, y, s, 160)));
  let seeds = '';
  for (let i = 0; i < 26; i++) seeds += sparkle(60 + ((i * 131) % 1480), 120 + ((i * 89) % 520), 5 + (i % 4) * 2, i % 3 ? C.gold : '#7dff9a');
  return panel(
    backdrop(id + 'b', [[0, '#3a4ab8'], [0.5, '#8a7ad8'], [0.8, '#ffc8a8'], [1, '#ffe8c8']]) +
      `<defs>${glowDef(id + 'g', C.gold, 0.6)}${glowDef(id + 'r', '#ffffff', 0.5)}</defs>` +
      stars(9, 50, 0, 0, 1600, 260, '#fff6e0') +
      ridge(5, 560, 70, '#9a8ac8', 5) +
      meadow(7, 640, ['#7dff9a', C.pink, C.gold, C.hello]) +
      glow(id + 'r', 800, 170, 420, 0.6) +
      words +
      lux(380, 230, 0.85, 'glow') +
      iris(1230, 230, 0.9, 'sing', true) +
      blooms +
      glow(id + 'g', 800, 460, 340, 0.9) +
      gascuBloom(id + 'c', 800, 470, 1.0, 300) +
      seeds +
      vignette(id + 'v', 0.25, '#1a1040'),
  );
}
