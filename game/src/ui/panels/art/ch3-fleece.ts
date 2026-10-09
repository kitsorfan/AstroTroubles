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
import { legionBot, lifeboat, lightWord, rootGN } from '../gn/ch3d';

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

/** 26. Aeëtes wearing the Golden Fleece: gold armour, a crown, gold vines curling out of his shoulders. */
export function ch3GoldenKing(): string {
  const id = 'ch3-goldenking';
  const vines = [
    [[720, 330], [560, 230], [480, 110], [380, 60]],
    [[720, 360], [520, 360], [400, 300], [300, 330]],
    [[880, 330], [1040, 230], [1120, 110], [1220, 60]],
    [[880, 360], [1080, 360], [1200, 300], [1300, 330]],
  ]
    .map((p) => vine(p, 22, false, GOLD_VINE, C.gold))
    .join('');
  const crown = `<path d="M-70 0L-80 -60L-40 -26L0 -80L40 -26L80 -60L70 0Z" fill="${C.gold}" ${ink(5)}/><circle cx="0" cy="-30" r="10" fill="#7dff9a" ${ink(3)}/>`;
  return panel(
    backdrop(id + 'b', [[0, '#2a1440'], [0.6, '#6a3a40'], [1, '#c8783a']]) +
      `<defs>${glowDef(id + 'g', C.gold, 0.7)}${glowDef(id + 'c', '#7dff9a', 0.8)}</defs>` +
      stars(12, 60, 0, 0, 1600, 300) +
      glow(id + 'g', 800, 420, 560, 0.85) +
      vines +
      // The Fleece as his cloak, behind him.
      fleece(id + 'f', 800, 560, 2.2) +
      aeetes(800, 930, 2.05, { pose: 'spread', face: 'grin' }) +
      // Gold armour plates over the coat, the crown, and the glowing seed-core behind its crystal clasp.
      at(800, 585, 0.8, `<path d="M-120 -40Q0 -90 120 -40L100 120Q0 150 -100 120Z" fill="${C.gold}" opacity=".92" ${ink(6)}/><path d="M-90 -10H90M-80 40H80" stroke="#c8801a" stroke-width="6"/>`) +
      glow(id + 'c', 800, 610, 110, 0.9) +
      at(800, 610, 0.9, `<path d="M0 -44L38 0L0 44L-38 0Z" fill="#dfffe8" opacity=".85" ${ink(5)}/><circle r="18" fill="#7dff9a"/>`) +
      at(800, 296, 1.0, crown) +
      // The three heroes far below, looking up, ready.
      jason(290, 905, 0.9, { pose: 'point', face: 'determined' }) +
      atalanta(110, 905, 0.9, { face: 'determined', bow: 'hand' }) +
      brennus(1430, 905, 0.95, { pose: 'hips', face: 'stern' }) +
      sparkle(600, 260, 12, '#fff6d0') +
      sparkle(1010, 240, 14, '#fff6d0') +
      sparkle(820, 700, 10, '#fff') +
      vignette(id + 'v', 0.45, '#1a0820'),
  );
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

/** 27. Home on Gaia Nova: the Argonauts lay the Golden Fleece over Celestia in the colony garden, the Argo behind. */
export function ch3Home(): string {
  const id = 'ch3-home';
  return panel(
    backdrop(id + 'b', [[0, '#5a6ad0'], [0.45, '#ff9a7a'], [0.75, '#ffd8a0'], [1, '#ffe8c0']]) +
      `<defs>${glowDef(id + 'g', C.gold, 0.7)}</defs>` +
      stars(5, 30, 0, 0, 1600, 180, '#fff6e0') +
      gasGiant(id + 'j', 1380, 200, 120) +
      cloud(240, 150, 0.8, '#fff', 0.7) +
      ridge(3, 560, 60, '#c87a6a', 5) +
      ridge(8, 620, 40, '#8a9a5a', 4) +
      argoShip(id + 'a', 1220, 560, 0.55, 0, false) +
      meadow(4, 690, [C.pink, C.gold, C.hello, '#fff']) +
      // Celestia, bright and strong again, with the Fleece draped round her like a golden blanket.
      glow(id + 'g', 800, 430, 380, 0.9) +
      gascuBloom(id + 'c', 800, 400, 1.15, 300) +
      fleece(id + 'f', 800, 700, 1.05) +
      leaf(700, 760, 1.4, 200) +
      leaf(900, 770, 1.3, -20) +
      jason(560, 905, 1.2, { pose: 'cheer', face: 'grin' }) +
      atalanta(380, 905, 1.15, { pose: 'cheer', face: 'happy' }) +
      brennus(1040, 905, 1.2, { pose: 'plant', face: 'smile' }) +
      hypatia(1230, 905, 1.1, { pose: 'cheer', face: 'happy' }) +
      captain(190, 905, 1.1, { pose: 'wave', face: 'smile' }) +
      lux(640, 560, 0.75, 'happy') +
      iris(960, 540, 0.8, 'happy', true) +
      sparkle(800, 240, 16, '#fff6d0') +
      sparkle(620, 360, 10, '#fff') +
      sparkle(990, 330, 12, '#fff6d0') +
      vignette(id + 'v', 0.3, '#2a1030'),
  );
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
