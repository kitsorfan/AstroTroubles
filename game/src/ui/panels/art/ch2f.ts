/** Chapter 2 panels, part 6: LUX is taken in the tundra, IRIS wakes in the jungle, and LUX comes home. */
import * as gn from '../gn';
import { armourShard, banner, bigLeaf, clipUrl, gearMark, root, snareDrone } from '../gn/ch2a';

/* ---------------- 20. LUX is taken ---------------- */

/** Driving snow across the whole picture: long wind-blown streaks and flakes of every size (bigger = nearer). */
function blizzard(pen: gn.Pen, seed: number, n: number, near = false): string {
  const rand = gn.rng(seed);
  const streaks: [gn.P[], number][] = [];
  let flakes = '';
  for (let i = 0; i < n; i++) {
    const x = -80 + rand() * 1760;
    const y = -60 + rand() * 1020;
    const l = (near ? 120 : 60) + rand() * (near ? 160 : 90);
    streaks.push([
      [
        [x, y],
        [x + l * 0.5, y + l * 0.14],
        [x + l, y + l * 0.22],
      ],
      near ? 3 + rand() * 4 : 1.4 + rand() * 2,
    ]);
    const fx = -80 + rand() * 1760;
    const fy = -60 + rand() * 1020;
    flakes += `M${Math.round(fx)} ${Math.round(fy)}h0`;
  }
  return pen.brushes(streaks, '#ffffff', [0.4, 0.6], near ? 0.5 : 0.4) + `<path d="${flakes}" stroke="#ffffff" stroke-width="${near ? 9 : 4}" stroke-linecap="round" opacity="${near ? 0.75 : 0.7}"/>`;
}

/** A snow drift: a smooth white mound along the points, shaded blue on the side away from the moon, with a few wind ripples. */
function drift(pen: gn.Pen, pts: gn.P[], color = '#e8f0ff', o: { line?: number; sh?: number } = {}): string {
  const top = gn.dSmooth(pts, false);
  const last = pts[pts.length - 1];
  const d = `${top}L${last[0]} 960L${pts[0][0]} 960Z`;
  const ripples: [gn.P[], number][] = [];
  for (let i = 1; i < pts.length - 2; i += 2) {
    const a = pts[i];
    ripples.push([
      [
        [a[0] - 60, a[1] + 26],
        [a[0], a[1] + 20],
        [a[0] + 80, a[1] + 30],
      ],
      2.4,
    ]);
  }
  return pen.form(d, color, { sh: o.sh ?? 40, hatch: 1, line: o.line ?? 2.6, rim: 2.2, shade: '#8aa0d8', inner: pen.brushes(ripples, '#8aa0d8', [0.3, 0.5], 0.7) });
}

/** 20. A blizzard at night: Brennus's snare drone carries LUX off in its cage toward the far volcano; Jason runs after it, reaching up. */
export function ch2LuxTaken(): string {
  const pen = gn.Pen.scene('ch2-luxtaken', { key: [-0.6, -0.8], keyColor: '#dfeaff', rim: [0.9, -0.25], rimColor: '#ff6a5a', shadow: '#3a4a8a', depth: 0.55 });
  const sky =
    gn.sky(pen, [
      [0, '#070c24'],
      [0.45, '#1c2c5a'],
      [0.7, '#5a7aaa'],
    ]) +
    gn.starfield(pen, 31, 50, -80, -60, 1760, 300, '#dfe8ff') +
    gn.bloom(pen, 250, 150, 70, '#e8f0ff', 0.9) +
    `<circle cx="250" cy="150" r="46" fill="#f4f8ff"/><circle cx="236" cy="140" r="9" fill="#d8e2f4"/><circle cx="264" cy="166" r="6" fill="#d8e2f4"/>` +
    gn.cloud(pen, 330, 210, 420, '#3a4c7a', '#22305a', { seed: 4, flat: true }) +
    gn.cloud(pen, 1100, 160, 520, '#3a4c7a', '#22305a', { seed: 8, flat: true });
  // The volcano far away on the right, glowing red at its crater: where the drone is taking LUX.
  const far =
    pen.glow(1400, 470, 260, '#ff4a2a', 0.7, 150) +
    gn.silhouette(
      [
        [1100, 650],
        [1250, 540],
        [1340, 448],
        [1376, 430],
        [1424, 432],
        [1470, 456],
        [1560, 540],
        [1700, 650],
      ],
      '#2e2c4e',
    ) +
    pen.brush(
      [
        [1366, 438],
        [1400, 446],
        [1436, 438],
      ],
      7,
      '#ff7a3a',
      [0.2, 0.2],
    ) +
    pen.brushes(
      [
        [
          [
            [1390, 446],
            [1370, 520],
            [1350, 580],
          ],
          5,
        ],
        [
          [
            [1416, 446],
            [1440, 510],
            [1470, 560],
          ],
          4,
        ],
      ],
      '#ff5a2a',
      [0.1, 0.8],
      0.8,
    ) +
    [
      [1410, 380, 60],
      [1440, 300, 84],
      [1490, 210, 110],
    ]
      .map(([cx, cy, r], i) => pen.glow(cx, cy, r, '#6a3a4a', 0.75 - i * 0.18))
      .join('') +
    // Snowy crags in the middle distance.
    gn.crag(
      pen,
      [
        [-80, 640],
        [-40, 520],
        [60, 470],
        [150, 500],
        [230, 440],
        [330, 500],
        [420, 560],
        [520, 640],
      ],
      '#8a9ac8',
      { seed: 3, sh: 80, cracks: 5, hatch: 1, line: 1.8, rim: 1.6, shade: '#4a5a8a' },
    ) +
    gn.crag(
      pen,
      [
        [760, 640],
        [840, 560],
        [930, 530],
        [1010, 570],
        [1100, 640],
      ],
      '#7a8ab8',
      { seed: 5, sh: 50, cracks: 3, hatch: 1, line: 1.4, rim: 1.4, shade: '#4a5a8a' },
    ) +
    gn.silhouette(
      [
        [-80, 620],
        [120, 560],
        [300, 590],
        [520, 540],
        [760, 600],
        [980, 560],
        [1200, 630],
        [1200, 700],
        [-80, 700],
      ],
      '#4a5c8a',
    ) +
    gn.haze(pen, 520, 700, '#9ab0d8', 0.55) +
    drift(pen, [
      [-80, 680],
      [300, 650],
      [700, 690],
      [1100, 660],
      [1680, 690],
    ], '#c8d6f0', { line: 1.6, sh: 20 });
  // The snare drone flying off with LUX in its cage, its tracks of light behind it.
  const inside = gn.lux(pen, 0, 112, 1.08, 'scared', { flip: true, look: [7, 2] });
  const drone =
    gn.streaks(pen, 880, 340, -100, 320, 5, 150, '#ffffff', 0.5, 5) +
    pen.glow(1070, 420, 280, '#ff4a5a', 0.35) +
    snareDrone(pen, 1070, 268, 1.3, inside, { rot: -8 });
  // The near snow: deep drifts, Jason's footprints, and Jason running after the drone.
  const prints = [
    [120, 846],
    [200, 868],
    [270, 840],
    [340, 862],
  ]
    .map(([px, py]) => `<ellipse cx="${px}" cy="${py}" rx="24" ry="8" fill="#7a90c8" opacity=".7"/>`)
    .join('');
  const near =
    drift(pen, [
      [-80, 800],
      [260, 770],
      [620, 800],
      [1000, 780],
      [1400, 810],
      [1680, 790],
    ]) +
    prints +
    gn.castShadow(pen, 520, 870, 150, 14, 0.4, '#3a4a8a') +
    gn.jason(pen, 520, 880, 1.18, {
      mood: 'shout',
      look: [2.8, -3],
      rim: 2.6,
      pose: { turn: 0.62, lean: 16, tilt: -16, armN: [-60, -30], armF: { to: [2.25, -0.9] }, legN: { to: [0.46, 0.74] }, legF: { to: [-0.52, 0.76], bend: -1 }, handN: 'fist', handF: 'open', wristF: -10, footF: 50 },
    }) +
    // Snow kicked up by his boots.
    [
      [400, 852, 30],
      [440, 830, 20],
      [370, 820, 16],
    ]
      .map(([cx, cy, r]) => pen.glow(cx, cy, r * 1.8, '#ffffff', 0.8, r))
      .join('');
  // A snow-capped boulder cut by the frame, bottom right.
  const rock =
    gn.crag(
      pen,
      [
        [1260, 960],
        [1300, 820],
        [1380, 760],
        [1500, 740],
        [1620, 780],
        [1700, 960],
      ],
      '#3a4470',
      { seed: 9, sh: 120, cracks: 5, hatch: 2, line: 3.2, rim: 2.6 },
    ) + pen.form('M1296 826Q1330 760 1400 752Q1500 726 1620 770Q1660 790 1680 800Q1600 790 1520 772Q1440 786 1380 780Q1330 800 1296 826Z', '#f0f6ff', { sh: 10, line: 2.6, rim: 1.6, shade: '#9ab0e0' });
  const fore = rock + blizzard(pen, 12, 80) + blizzard(pen, 19, 18, true);
  return pen.svg(gn.layer(0.15, sky) + gn.layer(0.35, far) + gn.layer(0.7, drone) + gn.layer(1, near) + gn.layer(1.3, fore) + gn.vignette(pen, 0.55, '#05061a') + gn.grain(pen, 0.08));
}

/* ---------------- 21. IRIS wakes ---------------- */

/** A curtain of hanging jungle vines from the top edge, from x0 to x1, with leaves along them. */
function hangingVines(pen: gn.Pen, x0: number, x1: number, n: number, seed: number, color: string, leaf: string): string {
  const rand = gn.rng(seed);
  let out = '';
  for (let i = 0; i < n; i++) {
    const vx = x0 + ((x1 - x0) * (i + rand())) / n;
    const vl = 160 + rand() * 300;
    const sway = (rand() - 0.5) * 80;
    const pts: gn.P[] = [
      [vx, -60],
      [vx + sway * 0.4, vl * 0.5],
      [vx + sway, vl],
    ];
    out += pen.brush(pts, 9, gn.INK, [0.02, 0.6]) + pen.brush(pts, 4.6, color, [0.02, 0.6]);
    for (let k = 1; k < 5; k++) {
      const p = gn.lerp(gn.lerp(pts[0], pts[1], k / 5), gn.lerp(pts[1], pts[2], k / 5), k / 5);
      out += bigLeaf(pen, p[0], p[1], 60 - k * 5, k % 2 ? 60 : -60, k % 2 ? leaf : color, { line: 2.2, rim: 1.8, hatch: 0 });
    }
  }
  return out;
}

/** 21. Deep in the jungle roots: IRIS rises out of the vines in a burst of rainbow light, and Jason, kneeling, looks up at her in wonder. */
export function ch2Iris(): string {
  const pen = gn.Pen.scene('ch2-iris', { key: [0.85, -0.35], keyColor: '#fff2e0', rim: [-0.8, -0.45], rimColor: '#7dffb8', shadow: '#1a3a4a', depth: 0.6 });
  const [ix, iy] = [1010, 360];
  // The jungle: dim green depths, trunks in the haze, shafts of green light from the canopy.
  const sky =
    gn.sky(pen, [
      [0, '#06140f'],
      [0.5, '#123a2c'],
      [1, '#0a2018'],
    ]) +
    gn.godRays(pen, 300, -60, [10, 22, 34], 4, 900, '#9affc8', 0.18) +
    [
      [120, 50],
      [330, 70],
      [610, 40],
      [1340, 80],
      [1530, 56],
    ]
      .map(([tx, w], i) => {
        const bark: [gn.P[], number][] = [-0.5, -0.1, 0.3].map((k): [gn.P[], number] => [
          [
            [tx + k * w, -60],
            [tx + k * w * 1.1 + 6, 300],
            [tx + k * w * 1.3, 760],
          ],
          3,
        ]);
        return pen.form(`M${tx - w} -60Q${tx - w * 0.9} 400 ${tx - w * 1.5} 760H${tx + w * 1.5}Q${tx + w * 0.9} 400 ${tx + w} -60Z`, i % 2 ? '#1c4a38' : '#22523e', { sh: w * 0.6, hatch: 1, line: 1.6, axis: [0, 1], shade: '#0e2a20', inner: pen.brushes(bark, '#0e2a20', [0.2, 0.2], 0.6) });
      })
      .join('') +
    gn.haze(pen, 300, 760, '#2a6a4a', 0.6);
  // Her burst of light: rainbow beams fanning out behind her, and the bloom.
  const burst =
    gn.RAINBOW.map((c, i) => gn.godRays(pen, ix, iy, [-150 + i * 50, -125 + i * 50], 6, 1100, c, 0.32)).join('') +
    gn.bloom(pen, ix, iy, 190, '#fff8e8', 1);
  // The great roots she was tangled in, arching over the hollow.
  const roots =
    root(pen, [[1600, 760], [1380, 700], [1200, 720], [1080, 800], [1040, 960]], 110, '#4a3424', { seed: 2, grooves: 4 }) +
    root(pen, [[-80, 600], [160, 640], [420, 720], [640, 790], [760, 960]], 120, '#5a4030', { seed: 4, grooves: 4 }) +
    root(pen, [[1680, 520], [1500, 560], [1360, 640], [1300, 760]], 70, '#3a2a1e', { seed: 6 }) +
    root(pen, [[620, 960], [760, 820], [900, 750], [990, 700]], 64, '#5a3e2a', { seed: 8 }) +
    pen.form('M-80 800Q400 760 800 790Q1200 770 1680 800V960H-80Z', '#1a3a26', { sh: 30, line: 3, rim: 2 }) +
    gn.grass(pen, -40, 1640, 800, 26, 60, '#12301e', '#4a8a4a', 4) +
    // Glowing mushrooms in the roots.
    [
      [200, 650, 1],
      [240, 660, 0.7],
      [1240, 744, 0.9],
      [1450, 600, 0.8],
      [880, 760, 0.7],
    ]
      .map(([mx, my, ms]) => pen.glow(mx, my - 14 * ms, 30 * ms, '#7dffd8', 0.7) + pen.form(`M${mx - 3 * ms} ${my}V${my - 12 * ms}H${mx + 3 * ms}V${my}Z`, '#cfe8d8', { line: 1.6 }) + pen.form(`M${mx - 13 * ms} ${my - 10 * ms}Q${mx} ${my - 30 * ms} ${mx + 13 * ms} ${my - 10 * ms}Z`, '#7dffd8', { line: 1.8, warm: 0 }))
      .join('');
  // Torn vines falling away from her, a few still clinging, and rainbow sparks.
  const torn: [gn.P[], number][] = [
    [
      [
        [ix - 60, iy + 120],
        [ix - 130, iy + 220],
        [ix - 120, iy + 330],
      ],
      14,
    ],
    [
      [
        [ix + 50, iy + 110],
        [ix + 130, iy + 200],
        [ix + 110, iy + 320],
      ],
      14,
    ],
    [
      [
        [ix - 90, iy - 20],
        [ix - 200, iy + 40],
        [ix - 250, iy + 150],
      ],
      11,
    ],
  ];
  const vines =
    pen.brushes(torn, gn.INK, [0.1, 0.5]) +
    pen.brushes(
      torn.map(([p, w]) => [p, w * 0.55] as [gn.P[], number]),
      '#4f8a3a',
      [0.1, 0.5],
    ) +
    torn.map(([p], i) => bigLeaf(pen, p[2][0], p[2][1], 50, i % 2 ? 30 : -30, '#4f8a3a', { line: 2.2, rim: 2 })).join('') +
    gn.RAINBOW.map((c, i) => gn.spark(pen, ix - 260 + i * 100, iy - 200 + ((i * 97) % 180), 10 + (i % 3) * 5, c, 0.95)).join('');
  // One last vine still looped loosely round her, slipping off.
  const loop: gn.P[] = [
    [ix - 110, iy + 10],
    [ix - 20, iy + 60],
    [ix + 90, iy + 30],
    [ix + 150, iy + 90],
    [ix + 170, iy + 200],
  ];
  const heroes =
    vines +
    gn.iris(pen, ix, iy, 2.3, 'happy', { flip: true, rot: -6 }) +
    pen.brush(loop, 15, gn.INK, [0.1, 0.4]) +
    pen.brush(loop, 8, '#5a9a40', [0.1, 0.4]) +
    bigLeaf(pen, ix - 30, iy + 62, 54, 200, '#5a9a40', { line: 2.2, rim: 2 }) +
    bigLeaf(pen, ix + 170, iy + 200, 48, 20, '#4f8a3a', { line: 2.2, rim: 2 }) +
    gn.castShadow(pen, 470, 840, 160, 16, 0.5) +
    gn.jason(pen, 470, 850, 1.22, {
      mood: 'surprised',
      look: [2.8, -3.2],
      rim: 2.6,
      pose: { turn: 0.5, lean: 6, tilt: -16, armN: { to: [1.25, -0.25] }, armF: [10, 40], legN: { to: [0.32, 0.62] }, legF: { to: [-0.32, 0.7] }, handN: 'open', handF: 'relaxed', wristN: -20, footF: 60 },
    });
  const fore =
    hangingVines(pen, -80, 360, 4, 3, '#2f5a2a', '#3f7a3a') +
    hangingVines(pen, 1360, 1680, 3, 7, '#2f5a2a', '#3f7a3a') +
    bigLeaf(pen, -60, 980, 440, 140, '#0e2a18', { line: 3, rim: 2.4 }) +
    bigLeaf(pen, 60, 1000, 380, 165, '#123020', { line: 3, rim: 2.4 }) +
    bigLeaf(pen, 1660, 990, 460, 215, '#0e2a18', { line: 3, rim: 2.4 }) +
    bigLeaf(pen, 1520, 1010, 360, 190, '#123020', { line: 3, rim: 2.4 });
  return pen.svg(gn.layer(0.2, sky) + gn.layer(0.45, burst) + gn.layer(0.7, roots) + gn.layer(1, heroes) + gn.layer(1.3, fore) + gn.vignette(pen, 0.6, '#02080a') + gn.grain(pen, 0.08));
}

/* ---------------- 22. LUX comes home ---------------- */

/** IRIS's song: rainbow ribbons of light-words curling from (x0, y0) toward (x1, y1). */
function lightWords(pen: gn.Pen, x0: number, y0: number, x1: number, y1: number): string {
  let out = '';
  const a: gn.P = [x0, y0];
  const b: gn.P = [x1, y1];
  const nrm = gn.perp(gn.unit(gn.sub(b, a)));
  gn.RAINBOW.forEach((c, i) => {
    const k = (i - 2.5) * 14;
    const pts: gn.P[] = [];
    for (let j = 0; j <= 8; j++) {
      const t = j / 8;
      // An arc bowing upward, a gentle wave along it, and the ribbons fanning out toward the end.
      const off = Math.sin(t * Math.PI) * 90 + Math.sin(t * Math.PI * 2 + i * 0.5) * 18 + k * (0.3 + t);
      pts.push(gn.add(gn.lerp(a, b, t), gn.mul(nrm, off)));
    }
    out += pen.brush(pts, 18, c, [0.05, 0.7], 0.25) + pen.brush(pts, 6, c, [0.05, 0.7], 0.95);
  });
  // Little glyphs riding the ribbons: rings, dots and arcs.
  const glyphs = ['M-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0', 'M-10 6Q0 -12 10 6', 'M-8 -8v16M0 -5v10M8 -8v16'];
  [0.35, 0.55, 0.75].forEach((t, i) => {
    const p = gn.lerp([x0, y0 - 40], [x1, y1 - 60], t);
    out += pen.glow(p[0], p[1], 26, gn.RAINBOW[i * 2], 0.8) + `<path d="${glyphs[i]}" fill="none" stroke="#ffffff" stroke-width="3.4" transform="translate(${gn.r1(p[0])} ${gn.r1(p[1])})"/>`;
  });
  return out;
}

/** 22. The gatehouse in Mount Atlantas: LUX's thorny armour lies broken round them, Jason kneels and hugs LUX tight, and IRIS sings. */
export function ch2LuxBack(): string {
  const pen = gn.Pen.scene('ch2-luxback', { key: [0.8, -0.5], keyColor: '#f2e8ff', rim: [-0.9, -0.2], rimColor: '#ff8a3a', shadow: '#3a1a4a', depth: 0.6 });
  // Basalt walls, a broken gate onto the lava glow, and Brennus's banners.
  let blocks = '';
  for (let yy = 80, row = 0; yy < 760; yy += 90, row++) {
    blocks += `M-80 ${yy}H1680`;
    for (let xx = -80 + (row % 2) * 70; xx < 1680; xx += 140) blocks += `M${xx} ${yy}V${yy + 90}`;
  }
  // The gate: an arched opening onto a river of lava far below, its iron doors blasted half away.
  const [gx, gw] = [1000, 200];
  const opening = `M${gx - gw} 760V330Q${gx - gw} 150 ${gx} 140Q${gx + gw} 150 ${gx + gw} 330V760Z`;
  const beyond =
    `<path d="${opening}" fill="${pen.lin([
      [0, '#5a1a10'],
      [0.5, '#ff6a12'],
      [1, '#ffc04a'],
    ])}"/>` +
    gn.silhouette(
      [
        [gx - gw, 520],
        [gx - 120, 430],
        [gx - 20, 470],
        [gx + 80, 400],
        [gx + gw, 460],
        [gx + gw, 620],
        [gx - gw, 620],
      ],
      '#3a1410',
    ) +
    gn.godRays(pen, gx, 780, [150, 165, 180, 195, 210], 5, 600, '#fff0a0', 0.45) +
    pen.glow(gx, 700, 240, '#ffd06a', 0.9, 120);
  const arch = `M${gx - gw - 60} 760V320Q${gx - gw - 60} 80 ${gx} 70Q${gx + gw + 60} 80 ${gx + gw + 60} 320V760H${gx + gw}V330Q${gx + gw} 150 ${gx} 140Q${gx - gw} 150 ${gx - gw} 330V760Z`;
  const back =
    gn.sky(pen, [
      [0, '#120810'],
      [1, '#2a1018'],
    ]) +
    pen.form('M-80 -60H1680V770H-80Z', '#3a2630', { sh: 0, line: 0, inner: `<path d="${blocks}" stroke="${gn.INK}" stroke-width="3" opacity=".45"/>` + pen.glow(gx, 500, 760, '#ff6a12', 0.45, 420) }) +
    `<g clip-path="${clipUrl(pen, opening)}">${beyond}</g>` +
    pen.form(`M${gx - gw} 760V560L${gx - gw + 60} 520L${gx - gw + 80} 600L${gx - gw + 130} 580V760Z`, '#2a1c24', { sh: 30, hatch: 2, line: 3, rim: 2.4 }) +
    pen.form(`M${gx + gw} 760V600L${gx + gw - 50} 620L${gx + gw - 70} 560L${gx + gw - 120} 640V760Z`, '#2a1c24', { sh: 30, hatch: 2, line: 3, rim: 2.4 }) +
    pen.form(arch, '#4a3038', { sh: 50, hatch: 2, line: 3.2, rim: 2.6, inner: pen.glow(gx, 330, 300, '#ff8a3a', 0.35) }) +
    pen.form(`M${gx - 40} 66H${gx + 40}L${gx + 30} 150H${gx - 30}Z`, '#5a3a40', { sh: 20, line: 2.8, rim: 2, inner: gearMark(gx, 104, 24, '#c8282e', '#2a1218') }) +
    banner(pen, 210, 40, 150, 420, '#a8202a', 10) +
    banner(pen, 1440, 40, 150, 420, '#a8202a', -10) +
    gn.haze(pen, 500, 800, '#ff6a3a', 0.25);
  // The floor: dark stone with glowing cracks.
  const floor =
    pen.form('M-80 760H1680V960H-80Z', '#2a1a22', {
      sh: 30,
      line: 3,
      inner:
        pen.brushes(
          [
            [
              [
                [140, 800],
                [300, 830],
                [380, 900],
              ],
              5,
            ],
            [
              [
                [1100, 790],
                [1260, 840],
                [1500, 830],
              ],
              5,
            ],
          ],
          '#ff7a2a',
          [0.1, 0.3],
          0.85,
        ) + pen.glow(760, 770, 500, '#ff6a12', 0.4, 50),
    }) +
    gn.wash(pen, 820, '#120610', 0.6);
  // The broken thorny armour all round, and the cracked control chip, still sparking.
  const chip =
    gn.at(
      1000,
      836,
      1,
      pen.local(false, 14).form('M-30 -20H30V20H-30Z', '#7a1a24', { sh: 10, line: 2.6, rim: 1.6, inner: `<path d="M-30 -20H30V20H-30Z" fill="none" stroke="#ff3a4c" stroke-width="3"/><path d="M-6 -20L4 -2L-4 4L8 20" fill="none" stroke="${gn.INK}" stroke-width="3.4"/>` }),
      false,
      14,
    ) + gn.spark(pen, 1012, 812, 14, '#ffd0d6');
  const shards = armourShard(pen, 300, 850, 1.2, -16, 1) + armourShard(pen, 880, 870, 1.1, 24, 2) + armourShard(pen, 1180, 820, 1, 170, 3) + armourShard(pen, 420, 900, 0.9, 70, 4) + chip;
  // Jason, down on one knee, hugging LUX to his chest; the near arm wraps round LUX in front.
  const [jx, jy, js] = [520, 880, 1.3];
  const pose: gn.Pose = { turn: 0.48, lean: 10, tilt: 16, armN: { to: [0.86, 0.7], bend: 1 }, armF: { to: [1.12, 0.28], bend: 1 }, legN: { to: [0.32, 0.62] }, legF: { to: [-0.3, 0.72] }, handN: 'relaxed', handF: 'relaxed', wristN: 55, wristF: 30, footF: 60 };
  const r = gn.rig(gn.TEEN_BOY, pose);
  const P = (q: gn.P): gn.P => [jx + q[0] * js, jy + q[1] * js];
  const lux: gn.P = P(gn.add(r.N, [82, 26]));
  const boy = gn.jason(pen, jx, jy, js, { pose, mood: 'smile', look: [1.6, 3.6], rim: 2.6, blaster: false });
  // The near forearm and hand, drawn again over LUX (clipped to a band round them).
  const el = P(r.el[0]);
  const wr = P(r.wr[0]);
  const tip = gn.add(wr, gn.mul(gn.unit(gn.sub(wr, el)), 64 * js));
  const n = gn.mul(gn.perp(gn.unit(gn.sub(tip, el))), 36 * js);
  const band = gn.dPoly([gn.add(gn.lerp(el, wr, 0.3), n), gn.add(tip, n), gn.sub(tip, n), gn.sub(gn.lerp(el, wr, 0.3), n)]);
  const tear = P(gn.headPt(r, [6, 14]));
  const hug =
    gn.castShadow(pen, jx + 40, jy, 200, 18, 0.5) +
    boy +
    pen.glow(lux[0], lux[1], 150, '#7fe6ff', 0.55) +
    gn.lux(pen, lux[0], lux[1], 1.6, 'happy', { rot: 8 }) +
    `<g clip-path="${clipUrl(pen, band)}">${boy}</g>` +
    pen.form(`M${gn.r1(tear[0])} ${gn.r1(tear[1])}q-6 12 0 16q6 -4 0 -16Z`, '#bff4ff', { line: 1.6, warm: 0 });
  const song = lightWords(pen, 1130, 300, 690, 400) + gn.iris(pen, 1210, 290, 1.75, 'sing', { flip: true, rot: 6 });
  const embers = [
    [180, 300],
    [420, 180],
    [1460, 520],
    [1300, 640],
    [700, 140],
    [1500, 240],
  ]
    .map(([ex, ey], i) => pen.glow(ex, ey, 10 + (i % 3) * 4, '#ffb04a', 0.9))
    .join('');
  return pen.svg(gn.layer(0.3, back) + gn.layer(0.7, floor + shards) + gn.layer(1, hug + song) + gn.layer(1.25, embers) + gn.vignette(pen, 0.6, '#0a0408') + gn.grain(pen, 0.08));
}

