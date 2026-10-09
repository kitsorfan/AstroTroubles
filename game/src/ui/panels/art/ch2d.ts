/** Chapter 2 panels, part 4: the Colossus in the volcano, and little Brennus with Grandma on Mars. */
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

/** The greenhouse's vanishing point, at the far end of the aisle. */
const VP: gn.P = [800, 470];

/** A point on one of the dome's cross arches: `t` 0 (left foot) .. 1 (right foot), the arch `k` from far (0) to near. */
function archPt(k: number, t: number): gn.P {
  const floor = 610 + k * 330;
  const rx = 290 + k * 900;
  const ry = 360 + k * 820;
  const a = Math.PI * (1 - t);
  return [VP[0] + Math.cos(a) * rx, floor - Math.sin(a) * ry];
}

/** The greenhouse's glass dome seen from inside, down the aisle: cream metal ribs over the sky and a few glints on the panes. */
function domeFrame(pen: gn.Pen): string {
  const arches = [0, 0.18, 0.42, 0.75];
  const along = [0.12, 0.3, 0.5, 0.7, 0.88];
  const pts = (k: number) => Array.from({ length: 13 }, (_, i) => archPt(k, i / 12));
  let out = '';
  // Ribs along the dome, from the far arch out toward the camera.
  const longs: [gn.P[], number][] = along.map((t) => [[archPt(0, t), archPt(0.42, t), archPt(1.1, t)], 7]);
  out += pen.brushes(longs, gn.INK, [0.02, 0.02], 0.8) + pen.brushes(longs.map(([p]) => [p, 3.4] as [gn.P[], number]), '#fff2dc', [0.02, 0.02]);
  for (const k of arches) {
    const w = 3 + k * 16;
    out += pen.brush(pts(k), w + 3, gn.INK, [0.01, 0.01], 0.85) + pen.brush(pts(k), w, '#fff0d8', [0.01, 0.01]);
    // The shadowed underside of the nearer ribs.
    if (k > 0.3) out += pen.brush(pts(k).map((p) => gn.add(p, [0, w * 0.3])), w * 0.4, '#c89a7a', [0.01, 0.01], 0.9);
  }
  // Light glinting on the panes.
  const glints: [gn.P[], number][] = [
    [[archPt(0.6, 0.18), gn.add(archPt(0.6, 0.18), [90, -60])], 10],
    [[archPt(0.62, 0.24), gn.add(archPt(0.62, 0.24), [60, -40])], 5],
    [[archPt(0.55, 0.78), gn.add(archPt(0.55, 0.78), [-70, -50])], 8],
  ];
  return out + pen.brushes(glints, '#ffffff', [0.3, 0.3], 0.45);
}

/** The aisle's floor, the two raised beds of dark soil in their wooden sides, receding to the far glass wall. */
function greenhouseFloor(pen: gn.Pen): string {
  // Floor: warm terracotta tiles in the aisle.
  let tiles = '';
  for (let i = -5; i <= 5; i++) tiles += `M${800 + i * 14} 612L${800 + i * 150} 960`;
  for (const y of [624, 644, 674, 716, 776, 860]) tiles += `M0 ${y}H1600`;
  const aisle = pen.form('M740 612H860L1220 960H380Z', '#d89a6a', {
    sh: 0,
    line: 2.4,
    paint: pen.lin([
      [0, '#f4c498'],
      [1, '#c8845a'],
    ]),
    inner: `<path d="${tiles}" stroke="#8a4a3a" stroke-width="2.2" opacity=".55"/>` + pen.glow(800, 760, 360, '#fff0c8', 0.6, 160),
  });
  // The beds: soil on top, plank sides facing the aisle.
  const bed = (k: 1 | -1) => {
    const X = (x: number) => 800 + k * (x - 800);
    const soil = gn.dPoly([
      [X(740), 610],
      [X(560), 606],
      [X(-200), 900],
      [X(380), 900],
    ]);
    const side = gn.dPoly([
      [X(740), 610],
      [X(380), 900],
      [X(400), 960],
      [X(746), 622],
    ]);
    const planks = `<path d="M${X(744)} 616L${X(390)} 930M${X(742)} 613L${X(385)} 915" stroke="${gn.INK}" stroke-width="2" opacity=".5"/>`;
    return (
      pen.form(soil, '#5a3424', {
        line: 2.4,
        paint: pen.lin([
          [0, '#7a4a34'],
          [1, '#3a2018'],
        ]),
      }) +
      pen.form(side, '#b8784a', { sh: k > 0 ? 0 : 30, hatch: 1, line: 2.4, rim: 1.6, inner: planks })
    );
  };
  return aisle + bed(1) + bed(-1);
}

/** 17. A warm golden memory: little Brennus holds up a ripe tomato for Grandma in her glass-domed greenhouse on Mars, rows of named tomato plants all round. */
export function ch2Grandma(): string {
  const pen = gn.Pen.scene('ch2-grandma', { key: [0.45, -0.8], keyColor: '#ffdcae', rim: [-0.7, -0.6], rimColor: '#fff0c4', shadow: '#8a4a72', depth: 0.45 });
  const sunX = 330;
  const sunY = 360;
  // Mars at sunset outside the glass: a dusky sky, a small white sun with its blue halo, Phobos, red dunes.
  const sky =
    gn.sky(pen, [
      [0, '#3a2a52'],
      [0.25, '#8a4a6a'],
      [0.48, '#e08a6a'],
      [0.62, '#ffd2a0'],
    ]) +
    gn.starfield(pen, 5, 16, 0, 0, 1600, 160, '#ffe8f0') +
    pen.glow(sunX, sunY, 220, '#9ad0ff', 0.45) +
    gn.bloom(pen, sunX, sunY, 70, '#fff6e0', 1) +
    `<path d="M1236 150a26 26 0 1 0 30 34a20 20 0 1 1 -30 -34Z" fill="#f4e0d0" opacity=".85"/>` +
    gn.silhouette(
      [
        [-80, 560],
        [-80, 500],
        [200, 470],
        [430, 500],
        [640, 476],
        [900, 498],
        [1160, 466],
        [1400, 492],
        [1680, 470],
        [1680, 560],
      ],
      '#e8906a',
    ) +
    gn.silhouette(
      [
        [-80, 620],
        [-80, 540],
        [260, 520],
        [520, 548],
        [860, 528],
        [1180, 552],
        [1480, 524],
        [1680, 540],
        [1680, 620],
      ],
      '#c8603e',
    ) +
    gn.haze(pen, 440, 620, '#ffd8b0', 0.55);
  // Rows of tomato plants down both beds, smaller toward the far wall.
  const plant = (x: number, y: number, s: number, v: 0 | 1) => `<use href="#${c2.tomatoPlantDef(pen, v)}" transform="translate(${x} ${y}) scale(${s})"/>`;
  const row: [number, number, number][] = [
    [700, 614, 0.24],
    [664, 632, 0.3],
    [612, 660, 0.4],
    [536, 702, 0.54],
    [420, 770, 0.76],
    [620, 604, 0.22],
    [560, 622, 0.28],
    [470, 652, 0.38],
    [330, 700, 0.54],
    [110, 780, 0.8],
  ];
  const plants = row.map(([x, y, s], i) => plant(x, y, s, (i % 2) as 0 | 1) + plant(1600 - x, y, s, ((i + 1) % 2) as 0 | 1)).join('');
  const tags = c2.nameTag(pen, 432, 686, 0.9, 'Rosie') + c2.nameTag(pen, 1192, 686, 0.9, 'Big Red', 5) + c2.nameTag(pen, 548, 650, 0.62, 'Tiny Tim') + c2.nameTag(pen, 1066, 650, 0.62, 'Sir Juicy', 4);
  // Two old lamps hanging from the ridge of the dome, already glowing.
  const lamp = (x: number, top: number, bottom: number, k: number) =>
    pen.brush([[x, top], [x, bottom]], 2.4 * k, gn.INK, [0.02, 0.02]) +
    pen.glow(x, bottom + 26 * k, 110 * k, '#ffd28a', 0.8) +
    pen.form(`M${x - 22 * k} ${bottom + 14 * k}Q${x} ${bottom - 8 * k} ${x + 22 * k} ${bottom + 14 * k}Z`, '#c89a52', { sh: 6 * k, line: 2 * k }) +
    pen.form(`M${x - 13 * k} ${bottom + 14 * k}Q${x - 16 * k} ${bottom + 40 * k} ${x} ${bottom + 44 * k}Q${x + 16 * k} ${bottom + 40 * k} ${x + 13 * k} ${bottom + 14 * k}Z`, '#fff2c0', { line: 1.8 * k, inner: pen.glow(x, bottom + 30 * k, 14 * k, '#ffffff', 0.9) });
  const far = gn.godRays(pen, sunX, sunY, [40, 52, 64, 78, 92, 108], 5, 1500, '#fff0c8', 0.22) + domeFrame(pen) + lamp(800, 160, 214, 0.6) + lamp(800, 40, 150, 1.1);
  const mid = greenhouseFloor(pen) + plants + tags + gn.haze(pen, 560, 700, '#ffe4b8', 0.4);
  // Little Brennus and Grandma in the aisle, long shadows stretching toward us.
  // He stands on an upturned fruit crate to be as tall as the tomato plants.
  const crate =
    pen.form('M560 790L586 772H714L700 790Z', '#d8a466', { line: 2.4, inner: `<path d="M572 781H708" stroke="${gn.INK}" stroke-width="2" opacity=".5"/>` }) +
    pen.form('M700 790L714 772V866L700 884Z', '#9a6436', { sh: 8, hatch: 1, line: 2.4 }) +
    pen.form('M560 790H700V884H560Z', '#c08a50', {
      sh: 20,
      hatch: 1,
      line: 2.6,
      rim: 1.6,
      inner: `<path d="M560 820H700M560 852H700" stroke="${gn.INK}" stroke-width="2.4" opacity=".55"/><path d="M572 800V876M688 800V876" stroke="#7a4a24" stroke-width="5"/><text x="598" y="844" font-family="Fredoka, sans-serif" font-weight="700" font-size="22" fill="#7a3a1a" opacity=".75">MARS</text>`,
    });
  const people =
    gn.longShadow(pen, 640, 884, 40, 320, 150, 0.4) +
    gn.longShadow(pen, 990, 890, 40, 340, 140, 0.4) +
    gn.castShadow(pen, 630, 886, 110, 12, 0.45) +
    gn.castShadow(pen, 990, 890, 140, 14, 0.4) +
    crate +
    c2.boyBrennus(pen.relight({ key: [1, 0.08] }), 632, 784, 1.12, { mood: 'grin', look: [2.4, -1] }) +
    c2.grandma(pen.relight({ key: [-1, 0.08] }), 990, 890, 0.98, { flip: true, mood: 'smile', look: [2.6, 1.4] });
  // Big tomato plants right in front, cut by the frame, and dust motes floating in the sunlight.
  const motes = [
    [560, 300, 7],
    [720, 230, 5],
    [880, 330, 6],
    [460, 420, 4],
    [1040, 260, 5],
    [780, 420, 4],
  ]
    .map(([mx, my, mr]) => gn.spark(pen, mx, my, mr, '#fff6dc', 0.8))
    .join('');
  const fore = plant(-20, 990, 1.5, 0) + plant(1630, 1000, 1.6, 1) + motes;
  return pen.svg(gn.layer(0.15, sky) + gn.layer(0.4, far) + gn.layer(0.65, mid) + gn.layer(1, people) + gn.layer(1.3, fore) + gn.wash(pen, 0, '#ffd8a0', 0.25, true) + gn.vignette(pen, 0.5, '#3a1810') + gn.grain(pen, 0.08));
}
