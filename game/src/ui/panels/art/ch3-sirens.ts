/** Chapter 3 panels for the Sirens' Sea: LUX's counter-song against a siren buoy, and the Dolphin surfacing at the coral strait. */
import * as gn from '../gn';
import { bubbles, coral, dolphin, kelp, note, sirenBuoy, soundRings, splash, whirlpool } from '../gn/ch3b';

/* ---------------- 25. The siren's song ---------------- */

/** A sunken Gardener ruin far off in the blue: a great round doorway, broken columns and a dome, flat and hazy. */
function ruins(pen: gn.Pen, color: string, op: number): string {
  const ring = `M120 700V430A170 170 0 0 1 460 430V700H400V440A110 110 0 0 0 180 440V700Z`;
  const cols = [560, 640, 720].map((cx, i) => `M${cx - 18} 700V${520 + i * 40}L${cx - 6} ${506 + i * 40}L${cx + 4} ${516 + i * 40}L${cx + 18} ${500 + i * 40}V700Z`).join('');
  const dome = `M1180 700V560Q1180 420 1320 410Q1460 420 1460 560V700Z`;
  const lintel = `M520 520H760V540H520Z`;
  return `<path d="${ring}${cols}${dome}${lintel}" fill="${color}" opacity="${op}"/>` + pen.glow(290, 430, 60, '#7ff0d8', op * 0.5) + `<path d="M270 430h40M290 410v40" stroke="#bffff0" stroke-width="5" opacity="${r2(op * 0.6)}"/>`;
}

const r2 = (n: number) => Math.round(n * 100) / 100;

/** A far school of little fish darting away from the song (flat silhouettes in the haze), around (x, y). */
function fishSchool(pen: gn.Pen, x: number, y: number, n: number, color: string): string {
  const rand = gn.rng(23);
  let d = '';
  for (let i = 0; i < n; i++) {
    const fx = x + (rand() - 0.3) * 320;
    const fy = y + (rand() - 0.5) * 120 + (fx - x) * 0.15;
    const k = 0.6 + rand() * 0.6;
    d += `M${gn.r1(fx)} ${gn.r1(fy)}q${gn.r1(14 * k)} ${gn.r1(-9 * k)} ${gn.r1(30 * k)} 0q${gn.r1(-16 * k)} ${gn.r1(9 * k)} ${gn.r1(-30 * k)} 0zm${gn.r1(30 * k)} 0l${gn.r1(10 * k)} ${gn.r1(-7 * k)}v${gn.r1(14 * k)}z`;
  }
  return `<path d="${d}" fill="${color}" opacity=".8"/>` + pen.glow(x, y, 160, '#8fe8ff', 0.15);
}

/** A burst of light where two songs collide: tapered rays flung out from (x, y), with a glow. */
function burst(pen: gn.Pen, x: number, y: number, r: number, color: string): string {
  const rand = gn.rng(9);
  const rays: [gn.P[], number][] = [];
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * 360 + rand() * 12;
    const d = gn.dir(a);
    const l = r * (0.6 + rand() * 0.6);
    rays.push([[gn.add([x, y], gn.mul(d, r * 0.25)), gn.add([x, y], gn.mul(d, l))], 4 + rand() * 6]);
  }
  return pen.glow(x, y, r * 1.4, '#ffd6f0', 0.6) + pen.brushes(rays, color, [0.1, 0.9], 0.85);
}

/** Wavy caustic light on the underside of the sea's surface (the top of the panel). */
function caustics(pen: gn.Pen): string {
  const rand = gn.rng(41);
  const list: [gn.P[], number][] = [];
  for (let i = 0; i < 26; i++) {
    const x = -60 + rand() * 1720;
    const y = -20 + rand() * 120;
    const l = 60 + rand() * 120;
    list.push([
      [
        [x, y],
        [x + l * 0.35, y - 10 + rand() * 20],
        [x + l * 0.7, y - 6 + rand() * 12],
        [x + l, y + 4],
      ],
      3 + rand() * 5,
    ]);
  }
  return pen.brushes(list, '#effeff', [0.3, 0.3], 0.5);
}

/** 25. Under the sea: a gold siren buoy sings rings of pink song at the Dolphin, and LUX, in the bubble beside Jason, sings bright notes right back. */
export function ch3Sirens(): string {
  const pen = gn.Pen.scene('ch3-sirens', { key: [0.78, -0.6], keyColor: '#d8fbff', rim: [-1, -0.2], rimColor: '#9ff6ff', shadow: '#1c3a78', depth: 0.55, hatchAngle: 30 });
  const sky =
    gn.sky(pen, [
      [0, '#9aeaf2'],
      [0.1, '#3ab4d0'],
      [0.42, '#14648e'],
      [0.78, '#0a2c52'],
      [1, '#051830'],
    ]) +
    caustics(pen) +
    gn.godRays(pen, 900, -200, [-40, -28, -16, -5, 7, 19, 31], 4, 1300, '#e6fdff', 0.24) +
    gn.bloom(pen, 900, -80, 170, '#e8fdff', 0.6) +
    gn.starfield(pen, 52, 90, -40, 60, 1680, 820, '#cfefff');
  const far =
    ruins(pen, '#1a6a8e', 0.7) +
    fishSchool(pen, 1180, 170, 16, '#2a8aac') +
    gn.haze(pen, 420, 760, '#2a88a8', 0.55) +
    gn.silhouette(
      [
        [-80, 760],
        [140, 690],
        [380, 720],
        [620, 700],
        [900, 740],
        [1200, 690],
        [1500, 720],
        [1680, 700],
        [1680, 980],
        [-80, 980],
      ],
      '#0e3e5e',
    ) +
    gn.wash(pen, 640, '#04162c', 0.8);
  // The rocks the song pulls ships onto: a jagged reef with the buoy chained to its spire, coral all over it.
  const rockPen = pen.relight({ key: [0.15, -1], rim: [0.2, -1], rimColor: '#8ff0ff', depth: 0.85 });
  const rocks =
    gn.crag(
      rockPen,
      [
        [1060, 960],
        [1100, 800],
        [1170, 720],
        [1220, 600],
        [1262, 560],
        [1300, 590],
        [1350, 680],
        [1420, 650],
        [1500, 700],
        [1580, 640],
        [1690, 660],
        [1700, 960],
      ],
      '#4a7890',
      { seed: 12, sh: 300, cracks: 10, strata: 3, rim: 3.2, hatch: 2, line: 3.2 },
    ) +
    gn.crag(
      rockPen,
      [
        [860, 960],
        [890, 830],
        [960, 780],
        [1040, 790],
        [1110, 850],
        [1140, 960],
      ],
      '#40688a',
      { seed: 5, sh: 150, cracks: 5, rim: 2.6, hatch: 2, line: 3 },
    ) +
    coral(pen, 960, 790, 0.85, 'fan', '#ff7aa8', { seed: 2 }) +
    coral(pen, 1080, 822, 0.6, 'brain', '#ffb84a') +
    coral(pen, 1440, 664, 0.75, 'tube', '#c87aff') +
    coral(pen, 1350, 690, 0.55, 'brain', '#ff9ad8') +
    coral(pen, 1600, 652, 0.95, 'stag', '#ff9a7a', { flip: true });
  const buoyX = 1300;
  const buoyY = 360;
  const mid = rocks + soundRings(pen, buoyX - 164, buoyY, -90, 4, 70) + sirenBuoy(pen, buoyX, buoyY, 1, { chain: 210 });
  // LUX's counter-song: bright notes streaming from the bubble into the pink rings, and a burst of light where they meet.
  const ribbon = pen.brush(
    [
      [620, 360],
      [700, 300],
      [800, 330],
      [900, 300],
      [990, 340],
    ],
    30,
    '#7fe6ff',
    [0.1, 0.4],
    0.28,
  );
  const song =
    ribbon +
    burst(pen, 1000, 350, 120, '#ffffff') +
    note(pen, 690, 290, 1.1, '#7fe6ff', -12) +
    note(pen, 790, 200, 0.95, '#bff8ff', 10, true) +
    note(pen, 860, 420, 1.0, '#7fe6ff', 6) +
    note(pen, 950, 250, 0.85, '#e8fdff', -8) +
    gn.spark(pen, 1000, 350, 56, '#ffffff', 1) +
    gn.spark(pen, 1060, 220, 20, '#ffd6ec', 0.9) +
    gn.spark(pen, 760, 450, 14, '#bff8ff', 0.9);
  const heroes =
    bubbles(pen, 40, 560, 9, 50, 8) +
    dolphin(pen, 440, 560, 1.2, { mood: 'determined', look: [2.6, -1.2], lux: 'glow', luxEye: '#ff8ad0', luxLook: [8, -3], lamp: true, rot: -3 }) +
    pen.glow(880, 560, 140, '#ff6fb0', 0.25) +
    song;
  const fore =
    kelp(pen, -30, 980, 820, 70, '#1e6a46', 3) +
    kelp(pen, 90, 990, 560, -50, '#2a7a50', 7) +
    kelp(pen, 1650, 990, 700, -60, '#1e6a46', 11) +
    gn.crag(
      pen,
      [
        [-80, 960],
        [-60, 860],
        [60, 830],
        [200, 850],
        [300, 900],
        [330, 960],
      ],
      '#2a4a5a',
      { seed: 4, sh: 30, cracks: 4, rim: 2.4 },
    ) +
    coral(pen, 220, 870, 0.9, 'stag', '#ff7a8a', { seed: 3 }) +
    bubbles(pen, 1500, 560, 7, 40, 12);
  return pen.svg(gn.layer(0.15, sky) + gn.layer(0.35, far) + gn.layer(0.65, mid) + gn.layer(1, heroes) + gn.layer(1.3, fore) + gn.vignette(pen, 0.6, '#020a18') + gn.grain(pen, 0.08));
}

/* ---------------- 26. Surfacing at the coral strait ---------------- */

/**
 * Far off on top of the tall rock: a gold crane robot with six long arms, flat in the haze, one red eye
 * glinting (SCYLLA, waiting for the next level). Base at (x, y).
 */
function craneOnRock(pen: gn.Pen, x: number, y: number, s: number, color: string): string {
  const arms: [gn.P, gn.P, gn.P][] = [
    [[-20, -120], [-90, -170], [-130, -130]],
    [[-16, -100], [-110, -110], [-140, -60]],
    [[-12, -80], [-80, -50], [-110, -10]],
    [[20, -120], [96, -176], [134, -140]],
    [[16, -100], [116, -116], [146, -70]],
    [[12, -80], [86, -56], [116, -16]],
  ];
  const list: [gn.P[], number][] = arms.map(([a, b, c]) => [[a, b, c], 9]);
  const body = `M-50 0Q-50 -26 0 -28Q50 -26 50 0ZM-14 -26L-10 -110H10L14 -26ZM-36 -104H36L44 -128L30 -150H-30L-44 -128Z`;
  return gn.at(
    x,
    y,
    s,
    pen.brushes(list, color, [0.05, 0.3]) + `<path d="${body}" fill="${color}"/>` + arms.map(([, , c]) => `<circle cx="${c[0]}" cy="${c[1]}" r="9" fill="${color}"/>`).join('') + pen.glow(0, -128, 30, '#ff3a4c', 0.9) + `<circle cx="0" cy="-128" r="7" fill="#ff6a5a"/>`,
  );
}

/** 26. The Dolphin bursts up into the sunshine at the coral strait: Jason pops out of the cockpit, LUX zips out after him; a tall rock (with something gold on top) on one side, the great whirlpool on the other, and the Argo coming. */
export function ch3Surface(): string {
  const pen = gn.Pen.scene('ch3-surface', { key: [-0.7, -0.6], keyColor: '#fff0c8', rim: [0.9, -0.3], rimColor: '#bff6ff', shadow: '#5a6ab0', depth: 0.5 });
  const sunX = 110;
  const sunY = 120;
  const sky =
    gn.sky(pen, [
      [0, '#1a5aa8'],
      [0.28, '#4a9ad8'],
      [0.46, '#a8dcf0'],
      [0.52, '#fff0d4'],
    ]) +
    gn.halftone(pen, 'M-80 -60H1680V240H-80Z', '#ffffff', 10, 0.08) +
    gn.gasGiant(pen, 1330, 150, 104, { lightDir: [-0.9, 0.1], haze: 0.55, sky: '#7ab8e0' }) +
    gn.godRays(pen, sunX, sunY, [20, 42, 64, 86, 108, 130, 152], 6, 1500, '#fff4d0', 0.26) +
    gn.bloom(pen, sunX, sunY, 110, '#fff8e0', 1) +
    gn.cloud(pen, 780, 200, 280, '#ffffff', '#b8c0e0', { seed: 4 }) +
    gn.cloud(pen, 1080, 120, 200, '#ffffff', '#b8c0e0', { seed: 6 });
  // The far sea, the Argo coming low over the horizon between the rock and the whirlpool.
  const far =
    gn.silhouette(
      [
        [560, 446],
        [640, 420],
        [720, 430],
        [780, 446],
      ],
      '#8ab0c8',
      0.9,
    ) +
    gn.silhouette(
      [
        [1440, 446],
        [1520, 414],
        [1640, 420],
        [1690, 446],
      ],
      '#8aaac4',
      0.9,
    ) +
    gn.sea(pen, 444, '#c8eef4', '#0e7a96', { seed: 9, sunX, ripple: '#e8fbff' }) +
    gn.argoTrail(pen, 1030, 352, 160, -84, '#ffffff') +
    gn.argo(pen, 1110, 350, 0.17, { rot: -3 }) +
    gn.haze(pen, 400, 500, '#eef8ff', 0.6);
  // The tall rock with something gold on top, and the giant whirlpool on the other side of the strait.
  const rock =
    gn.crag(
      pen,
      [
        [10, 606],
        [44, 520],
        [96, 470],
        [110, 390],
        [158, 330],
        [168, 260],
        [214, 214],
        [262, 200],
        [318, 214],
        [350, 262],
        [342, 318],
        [392, 372],
        [408, 446],
        [462, 512],
        [520, 606],
      ],
      '#9a8a96',
      { seed: 21, sh: 150, cracks: 10, strata: 5, rim: 2.6, hatch: 2, line: 2.6 },
    ) + craneOnRock(pen, 264, 210, 0.5, '#b8904a');
  const mid =
    rock +
    pen.brushes(
      [
        [
          [
            [30, 600],
            [250, 590],
            [480, 604],
          ],
          10,
        ],
      ],
      '#ffffff',
      [0.3, 0.3],
      0.85,
    ) +
    whirlpool(pen, 1270, 588, 380, 80, { seed: 5, water: '#3ab8c8', glint: '#fff6d8' }) +
    coral(pen, 510, 604, 0.45, 'stag', '#ff8a8a', { seed: 1 }) +
    coral(pen, 560, 610, 0.32, 'fan', '#ffb84a', { seed: 4 }) +
    gn.haze(pen, 560, 660, '#e8fbff', 0.35);
  // The Dolphin breaking the surface, canopy open, Jason up out of the cockpit; LUX zipping out above.
  const subX = 700;
  const subY = 720;
  const water = pen.lin([
    [0, '#2aa8c4', 0.82],
    [0.3, '#127a9e', 0.94],
    [1, '#06405e', 1],
  ]);
  const front =
    `<path d="M-80 ${subY - 6}Q200 ${subY - 22} 420 ${subY - 4}Q620 ${subY + 12} 800 ${subY - 2}Q1100 ${subY - 20} 1680 ${subY - 6}V980H-80Z" fill="${water}"/>` +
    pen.brushes(
      [
        [
          [
            [-80, subY - 4],
            [200, subY - 20],
            [400, subY - 4],
          ],
          6,
        ],
        [
          [
            [900, subY - 6],
            [1200, subY - 18],
            [1500, subY - 8],
          ],
          6,
        ],
        [
          [
            [100, subY + 60],
            [300, subY + 52],
            [460, subY + 62],
          ],
          5,
        ],
        [
          [
            [1000, subY + 80],
            [1200, subY + 70],
            [1400, subY + 84],
          ],
          5,
        ],
      ],
      '#e8fbff',
      [0.3, 0.3],
      0.7,
    );
  const heroes =
    dolphin(pen, subX, subY - 70, 1.06, { open: true, mood: 'grin', look: [2.2, -1.6], pose: 'wave', lux: 'happy', luxAt: [190, -250], luxLook: [-4, 2], rot: -11 }) +
    front +
    pen.brush(
      [
        [subX - 380, subY + 6],
        [subX - 120, subY - 6],
        [subX + 140, subY - 4],
        [subX + 360, subY + 4],
      ],
      16,
      '#ffffff',
      [0.2, 0.2],
      0.85,
    ) +
    splash(pen, subX + 330, subY - 4, 150, 3, 1) +
    splash(pen, subX - 330, subY + 2, 160, 7, -1) +
    gn.spark(pen, subX + 420, subY - 160, 14, '#ffffff') +
    gn.spark(pen, subX - 380, subY - 120, 10, '#ffffff');
  const fore = coral(pen, 70, 940, 1.5, 'stag', '#ff7a8a', { seed: 8 }) + coral(pen, 1560, 950, 1.3, 'fan', '#ffb84a', { seed: 2, flip: true }) + coral(pen, 1440, 960, 1, 'brain', '#c87aff');
  return pen.svg(gn.layer(0.15, sky) + gn.layer(0.35, far) + gn.layer(0.6, mid) + gn.layer(1, heroes) + gn.layer(1.3, fore) + gn.vignette(pen, 0.45, '#0a1a30') + gn.grain(pen, 0.08));
}

