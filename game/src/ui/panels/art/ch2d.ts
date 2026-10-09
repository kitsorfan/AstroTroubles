/** Chapter 2 panels, part 4: the Colossus in the volcano, and little Brennus with Grandma on Mars. */
import { backdrop, boyBrennus, glow, glowDef, grandma, ink, panel, rad, ridge, sparkle } from '../kit';
import * as gn from '../gn';
import * as c2 from '../gn/ch2b';

/** A column of smoke rising and spreading from (x, y): soft overlapping puffs. */
function smoke(pen: gn.Pen, x: number, y: number, h: number, w: number, color: string, seed: number): string {
  const rand = gn.rng(seed);
  let out = '';
  for (let i = 0; i < 9; i++) {
    const t = i / 8;
    const cx = x + (rand() - 0.5) * w * 0.4 + t * w * 0.3;
    const cy = y - t * h;
    const r = w * (0.25 + t * 0.5) * (0.8 + rand() * 0.4);
    out += pen.glow(cx, cy, r, color, 0.55 + rand() * 0.25, r * 0.7);
  }
  return out;
}

/** Embers rising on the heat: little tapered streaks of orange and gold in a box. */
function embers(pen: gn.Pen, seed: number, n: number, x0: number, y0: number, w: number, h: number): string {
  const rand = gn.rng(seed);
  const a: [gn.P[], number][] = [];
  const b: [gn.P[], number][] = [];
  for (let i = 0; i < n; i++) {
    const x = x0 + rand() * w;
    const y = y0 + rand() * h;
    const l = 8 + rand() * 22;
    const drift = (rand() - 0.3) * 10;
    (i % 3 ? a : b).push([
      [
        [x, y],
        [x + drift, y - l],
      ],
      3 + rand() * 3,
    ]);
  }
  return pen.brushes(a, '#ffb050', [0.5, 0.5], 0.9) + pen.brushes(b, '#fff2b0', [0.5, 0.5]);
}

/** 16. Inside the crater: the Colossus looms over the lava, Celestia caged in its chest and Brennus in the dome; Jason shouts up at him from a ledge. */
export function ch2Colossus(): string {
  const pen = gn.Pen.scene('ch2-colossus', { key: [0.3, 1], keyColor: '#ffb066', rim: [-0.65, -0.75], rimColor: '#ff9ad8', shadow: '#3a1e50', depth: 0.62, hatchAngle: 40 });
  // The sky through the crater's mouth: smoke lit red from below.
  const sky =
    gn.sky(pen, [
      [0, '#12060e'],
      [0.35, '#3a0e16'],
      [0.7, '#8a2a12'],
      [1, '#d8581a'],
    ]) +
    smoke(pen, 760, 300, 320, 520, '#2a1018', 11) +
    smoke(pen, 1140, 260, 300, 420, '#3a1418', 12) +
    gn.bloom(pen, 980, 860, 260, '#ff8a2a', 0.8);
  // The crater walls: dark basalt with glowing lava veins, rimmed by the glow.
  const veins = (pts: gn.P[][]) => pen.brushes(pts.map((p) => [p, 7] as [gn.P[], number]), '#ff7a1a', [0.2, 0.3], 0.95) + pen.brushes(pts.map((p) => [p, 2.4] as [gn.P[], number]), '#ffe08a', [0.3, 0.4]);
  // The far wall of the crater across the lava lake, hazy with heat, lava spilling down it in falls.
  const falls = [480, 620, 1180, 1250]
    .map((fx, i) => {
      const top = 360 + ((i * 53) % 90);
      return pen.brush([[fx, top], [fx + 6, top + 120], [fx - 4, 800]], 16 + (i % 2) * 8, '#ff8a2a', [0.05, 0.1], 0.85) + pen.brush([[fx, top + 10], [fx + 4, top + 140], [fx - 2, 790]], 5, '#fff0a0', [0.1, 0.1], 0.9) + pen.glow(fx, top + 200, 60, '#ff7a1a', 0.5, 220);
    })
    .join('');
  const back =
    gn.silhouette(
      [
        [-80, 820],
        [-80, 420],
        [200, 380],
        [420, 400],
        [600, 340],
        [800, 380],
        [1000, 330],
        [1240, 380],
        [1440, 350],
        [1680, 400],
        [1680, 820],
      ],
      '#5a2224',
    ) +
    pen.brushes(
      [
        [
          [
            [100, 470],
            [360, 450],
            [640, 470],
          ],
          5,
        ],
        [
          [
            [900, 420],
            [1200, 440],
            [1500, 420],
          ],
          5,
        ],
        [
          [
            [200, 600],
            [600, 590],
            [900, 610],
          ],
          4,
        ],
      ],
      '#3a1418',
      [0.3, 0.3],
      0.7,
    ) +
    falls +
    gn.haze(pen, 300, 760, '#c84a20', 0.45);
  const far =
    back +
    gn.crag(
      pen.relight({ key: [1, 0.25], rim: [0.9, -0.2], rimColor: '#ff7a3a' }),
      [
        [-80, -60],
        [330, -60],
        [300, 120],
        [350, 260],
        [290, 420],
        [340, 560],
        [300, 960],
        [-80, 960],
      ],
      '#24141c',
      { seed: 4, sh: 120, cracks: 9, strata: 4, rim: 3, hatch: 2, line: 3 },
    ) +
    veins([
      [
        [310, 170],
        [262, 240],
        [280, 330],
      ],
      [
        [320, 520],
        [270, 600],
        [250, 700],
      ],
    ]) +
    gn.crag(
      pen.relight({ key: [-1, 0.25], rim: [-0.9, -0.2], rimColor: '#ff7a3a' }),
      [
        [1680, -60],
        [1290, -60],
        [1330, 140],
        [1280, 320],
        [1350, 470],
        [1300, 640],
        [1340, 960],
        [1680, 960],
      ],
      '#24141c',
      { seed: 5, sh: 120, cracks: 9, strata: 4, rim: 3, hatch: 2, line: 3 },
    ) +
    veins([
      [
        [1310, 380],
        [1360, 450],
        [1352, 540],
      ],
      [
        [1330, 700],
        [1380, 760],
        [1400, 860],
      ],
    ]) +
    gn.haze(pen, 560, 900, '#ff6a2a', 0.45);
  // The Colossus, lit from the lava below, wading in it.
  const giant = c2.colossus(pen, 1010, 690, 0.8, { pilot: c2.colossusPilot(pen.local(false, -4)), rot: -4 });
  const lava =
    `<rect x="-80" y="790" width="1760" height="200" fill="${pen.lin([
      [0, '#fff0a0'],
      [0.25, '#ffb030'],
      [1, '#e0400a'],
    ])}"/>` +
    pen.brushes(
      [
        [
          [
            [420, 812],
            [600, 806],
            [760, 814],
          ],
          6,
        ],
        [
          [
            [1180, 816],
            [1380, 808],
            [1560, 818],
          ],
          6,
        ],
        [
          [
            [860, 840],
            [1000, 832],
            [1160, 842],
          ],
          8,
        ],
      ],
      '#fff4c0',
      [0.4, 0.4],
      0.85,
    ) +
    // Where the legs wade in: rings of hot ripples and a glare up the armour.
    [898, 1122]
      .map((lx) => pen.glow(lx, 796, 150, '#ffe08a', 0.8, 34) + pen.brushes([[[[lx - 110, 800], [lx, 812], [lx + 110, 800]], 7], [[[lx - 150, 818], [lx, 834], [lx + 150, 818]], 5]], '#fff4c0', [0.3, 0.3], 0.9))
      .join('') +
    gn.wash(pen, 700, '#ff8a2a', 0.35);
  // The ledge in front: black basalt, its edge glowing over the lava.
  const ledge = gn.crag(
    pen.relight({ key: [0.5, 0.85] }),
    [
      [-80, 960],
      [-80, 846],
      [120, 830],
      [330, 844],
      [520, 858],
      [640, 900],
      [700, 960],
    ],
    '#2a1a22',
    { seed: 9, sh: 30, cracks: 6, rim: 2.6, hatch: 2, line: 3.2 },
  );
  const heroes =
    ledge +
    gn.castShadow(pen, 330, 868, 150, 14, 0.5) +
    gn.jason(pen, 320, 872, 1.04, {
      pose: { turn: 0.42, lean: -2, tilt: -6, armN: [-18, 22], armF: [128, 136], legN: { to: [-0.3, 0.92] }, legF: { to: [0.3, 0.93] }, handN: 'fist', handF: 'point' },
      mood: 'shout',
      look: [2.6, -3],
    }) +
    gn.lux(pen, 560, 470, 0.85, 'scared', { look: [8, -6] }) +
    gn.iris(pen, 120, 330, 0.66, 'normal', { rot: 10 });
  // A black spur of rock cutting into the bottom right corner, its edge lit by the lava.
  const spur = gn.crag(
    pen.relight({ key: [-0.8, 0.6] }),
    [
      [1380, 960],
      [1430, 860],
      [1500, 800],
      [1590, 770],
      [1680, 760],
      [1680, 960],
    ],
    '#1c1018',
    { seed: 13, sh: 40, cracks: 3, rim: 3, hatch: 2, line: 3.4 },
  );
  const fore = spur + embers(pen, 21, 60, -40, 80, 1680, 760);
  return pen.svg(gn.layer(0.15, sky) + gn.layer(0.4, far) + gn.layer(0.7, giant + lava) + gn.layer(1, heroes) + gn.layer(1.3, fore) + gn.vignette(pen, 0.6, '#0a0410') + gn.grain(pen, 0.08));
}


/** A tomato plant: a stake, leafy bush and ripe red tomatoes (a shape the panel reuses). */
const TOMATO = `<path d="M0 0V-120" stroke="#8a6a3a" stroke-width="6"/><g fill="#4a8a3a" ${ink(4)}><circle cx="-26" cy="-60" r="30"/><circle cx="24" cy="-70" r="32"/><circle cx="0" cy="-100" r="30"/></g>
  <g fill="#e8402a" ${ink(3)}><circle cx="-24" cy="-44" r="13"/><circle cx="20" cy="-50" r="14"/><circle cx="6" cy="-92" r="12"/><circle cx="-14" cy="-78" r="10"/></g>
  <g fill="#fff" opacity=".6"><circle cx="-28" cy="-48" r="4"/><circle cx="16" cy="-55" r="4"/></g>`;

/** 17. Warm golden memory: little Brennus and Grandma in a glass-domed greenhouse on red Mars. */
export function ch2Grandma(): string {
  const id = 'ch2-grandma';
  const plant = (x: number, y: number, s: number) => `<use href="#${id}t" transform="translate(${x} ${y}) scale(${s})"/>`;
  const rows = [
    [240, 688, 0.5],
    [360, 688, 0.5],
    [480, 688, 0.5],
    [1120, 688, 0.5],
    [1240, 688, 0.5],
    [1360, 688, 0.5],
    [120, 822, 0.85],
    [330, 822, 0.85],
    [1270, 822, 0.85],
    [1480, 822, 0.85],
    [40, 960, 1.4],
    [1560, 960, 1.4],
  ]
    .map(([x, y, s]) => plant(x, y, s))
    .join('');
  return panel(
    backdrop(id + 'b', [[0, '#ffd8a8'], [0.55, '#f6a878'], [1, '#e07a4a']]) +
      `<defs>${glowDef(id + 's', '#fff6dc', 0.95)}<g id="${id}t">${TOMATO}</g>${rad(id + 'g', [[0, '#fff2c0', 0.7], [1, '#ffd166', 0]])}
      ${rad(id + 'z', [[0.6, '#a8501a', 0], [1, '#a8501a', 0.45]])}</defs>` +
      // Mars outside: a small sun and red dunes.
      glow(id + 's', 330, 170, 170) +
      `<circle cx="330" cy="170" r="32" fill="#fffbe8"/>` +
      ridge(9, 560, 60, '#e07848', 5) +
      ridge(4, 610, 40, '#c85a32', 6) +
      // Inside the dome: the path, the planter rows and the plants.
      `<path d="M40 640Q800 600 1560 640V900H40Z" fill="#d89a62"/><path d="M640 640L560 900H1040L960 640Z" fill="#ecc08a"/>
      <path d="M180 670H560L530 700H150ZM1040 670H1420L1450 700H1070ZM40 800H420L380 850H0ZM1180 800H1560L1600 850H1220Z" fill="#a8683c" ${ink(4)}/>` +
      rows +
      `<ellipse cx="800" cy="640" rx="560" ry="300" fill="url(#${id}g)"/>` +
      grandma(980, 900, 1.15, { pose: 'hold', face: 'happy' }) +
      boyBrennus(660, 900, 1.0, { pose: 'wave', face: 'grin' }) +
      // The tomato he holds up proudly.
      `<circle cx="750" cy="666" r="30" fill="#e8402a" ${ink(5)}/><path d="M736 640L750 648L764 640M750 648V630" fill="none" stroke="#3f7a3a" stroke-width="6" stroke-linecap="round"/><circle cx="740" cy="656" r="8" fill="#fff" opacity=".6"/>` +
      sparkle(800, 610, 16, '#fff') +
      sparkle(700, 600, 10, '#fff6d0') +
      // The glass dome over everything.
      `<path d="M30 900V640Q60 40 800 30Q1540 40 1570 640V900" fill="#e8f6ff" fill-opacity=".08" stroke="#fff6e6" stroke-width="16"/>
      <path d="M300 900V420Q420 120 800 30Q1180 120 1300 420V900M800 30V600M60 460Q800 340 1540 460M140 260Q800 150 1460 260" fill="none" stroke="#fff6e6" stroke-width="6" opacity=".55"/>
      <path d="M200 520Q260 260 480 140" fill="none" stroke="#fff" stroke-width="14" opacity=".35" stroke-linecap="round"/>` +
      `<rect width="1600" height="900" fill="url(#${id}z)"/>` +
      `<rect x="14" y="14" width="1572" height="872" rx="26" fill="none" stroke="#fff2d0" stroke-width="16" opacity=".9"/>`,
  );
}
