/** Chapter 2 panels, part 5: Gaia Nova set free, and Brennus planting tomatoes with Jason. */
import * as gn from '../gn';
import * as c2 from '../gn/ch2b';

/** Rolling hills from the points (left to right along the top), filled down past the bottom, with a soft gradient. */
function hill(pen: gn.Pen, top: gn.P[], light: string, dark: string, o: { line?: number; sh?: number } = {}): string {
  const d = gn.dSmooth(top, false) + `L1700 980L-100 980Z`;
  return pen.form(d, light, {
    sh: o.sh ?? 0,
    line: o.line ?? 0,
    paint: pen.lin([
      [0, light],
      [1, dark],
    ]),
  });
}

/** Mount Atlantas far away, calm at last: a hazy cone with one last tired puff of smoke. */
function atlantas(pen: gn.Pen, x: number, y: number, s: number, haze: string): string {
  const puffs = [
    [0, -250, 34],
    [20, -300, 46],
    [-6, -360, 58],
  ]
    .map(([px, py, r], i) => pen.glow(x + px * s, y + py * s, r * s * 1.4, '#ffffff', 0.85 - i * 0.2))
    .join('');
  return gn.silhouette(
    [
      [x - 300 * s, y],
      [x - 140 * s, y - 120 * s],
      [x - 50 * s, y - 210 * s],
      [x + 40 * s, y - 214 * s],
      [x + 150 * s, y - 110 * s],
      [x + 320 * s, y],
    ],
    haze,
  ) + puffs;
}

/** 18. Gaia Nova set free: a valley in bloom, colony shuttles landing and colonists stepping out, Celestia a great happy flower; everyone cheers. */
export function ch2Freed(): string {
  const pen = gn.Pen.scene('ch2-freed', { key: [0.7, -0.65], keyColor: '#fff2cc', rim: [-0.85, -0.35], rimColor: '#bff4ff', shadow: '#5a5aa8', depth: 0.45 });
  const sunX = 1330;
  const sunY = 140;
  const sky =
    gn.sky(pen, [
      [0, '#2a6ac0'],
      [0.38, '#6ab4ea'],
      [0.66, '#d4f0ff'],
    ]) +
    gn.halftone(pen, 'M-80 -60H1680V240H-80Z', '#ffffff', 10, 0.08) +
    gn.godRays(pen, sunX, sunY, [-60, -35, -10, 15, 40, 65], 7, 1300, '#fff6d8', 0.25) +
    gn.bloom(pen, sunX, sunY, 90, '#fff8e0', 1) +
    gn.cloud(pen, 260, 210, 340, '#ffffff', '#b8c8e8', { seed: 3 }) +
    gn.cloud(pen, 900, 150, 260, '#ffffff', '#b8c8e8', { seed: 4 }) +
    gn.cloud(pen, 1560, 260, 280, '#ffffff', '#b8c8e8', { seed: 5 });
  const far =
    atlantas(pen, 230, 500, 1, '#9ab0d0') +
    gn.silhouette(
      [
        [-80, 560],
        [-80, 470],
        [520, 450],
        [760, 476],
        [1100, 440],
        [1400, 470],
        [1680, 446],
        [1680, 560],
      ],
      '#8ab8c8',
    ) +
    gn.haze(pen, 380, 560, '#e8f8ff', 0.6) +
    hill(
      pen,
      [
        [-100, 530],
        [300, 500],
        [700, 532],
        [1100, 500],
        [1700, 524],
      ],
      '#9ad06a',
      '#6aa84a',
    ) +
    c2.meadow(pen, 3, 40, -40, 1640, 520, 600, ['#ff6fcf', '#ffffff', '#ff9ad8'], [0.4, 0.7]);
  // Shuttles coming down, and one landed, its ramp down and colonists walking out into the flowers.
  const ship = (x: number, y: number) => `${c2.shuttle(pen, x, y, 0.5, { landed: true })}`;
  const people = [
    ['#f2f5fa', '#e8bf9a', false],
    ['#c9a66b', '#8a5a3c', true],
    ['#f2f5fa', '#f0cfb0', false],
    ['#8aa65a', '#5a3a28', true],
    ['#5e9bff', '#c8906c', false],
    ['#ff8a3d', '#e0b48e', true],
  ] as const;
  const walkers = people.map(([coat, skin, wave], i) => c2.colonist(pen, 470 + i * 52 + (i % 2) * 10 + (i > 2 ? 90 : 0), 676 + (i % 3) * 8, 0.9 + (i % 3) * 0.05, coat, skin, wave, i % 2 === 1)).join('');
  const mid =
    c2.shuttle(pen, 560, 220, 0.42, { rot: 16 }) +
    c2.shuttle(pen, 880, 100, 0.28, { rot: 18 }) +
    hill(
      pen,
      [
        [-100, 680],
        [400, 650],
        [900, 680],
        [1300, 646],
        [1700, 670],
      ],
      '#7ac04a',
      '#4a8a3a',
      { line: 2.6, sh: 0 },
    ) +
    c2.meadow(pen, 7, 70, -40, 1640, 660, 760, ['#ff6fcf', '#ffffff', '#ffd166', '#ff9ad8'], [0.7, 1.2]) +
    ship(640, 640) +
    walkers +
    c2.celestiaBloom(pen, 880, 730, 0.95, { stem: 430 });
  // Everyone cheering in front: Jason (LUX beside him), Dr. Hypatia with IRIS, and Captain Argus.
  const heroes =
    gn.castShadow(pen, 1410, 902, 130, 13, 0.4) +
    gn.castShadow(pen, 330, 900, 120, 13, 0.4) +
    gn.castShadow(pen, 1090, 904, 120, 13, 0.4) +
    gn.argus(pen.relight({ key: [-0.9, -0.3] }), 1410, 905, 0.8, { pose: 'cheer', mood: 'grin', flip: true }) +
    gn.jason(pen, 330, 900, 0.9, { pose: 'cheer', mood: 'grin', blaster: false }) +
    c2.hypatia(pen.relight({ key: [-0.9, -0.3] }), 1090, 905, 0.82, { pose: 'cheer', mood: 'grin', flip: true }) +
    gn.lux(pen, 540, 440, 0.9, 'happy') +
    gn.iris(pen, 1076, 196, 0.7, 'happy', { flip: true, rot: -6 });
  const fore = gn.grass(pen, -70, 300, 930, 5, 120, '#2a5a2a', '#7ac04a', 4) + gn.grass(pen, 1380, 1680, 930, 5, 120, '#2a5a2a', '#7ac04a', 6) + c2.meadow(pen, 11, 10, -40, 1640, 840, 900, ['#ff6fcf', '#ffffff'], [1.8, 2.4]);
  return pen.svg(gn.layer(0.15, sky) + gn.layer(0.35, far) + gn.layer(0.65, mid) + gn.layer(1, heroes) + gn.layer(1.3, fore) + gn.vignette(pen, 0.35, '#10204a') + gn.grain(pen, 0.07));
}

/** 19. The colony's first morning: old Brennus, cap off and teary-happy, kneels in the garden with a tomato seedling; Jason pats the soil and LUX waters it; Celestia glows gold and the Green Legion plants trees. */
export function ch2Redeemed(): string {
  const pen = gn.Pen.scene('ch2-redeemed', { key: [-0.8, -0.55], keyColor: '#ffe2a8', rim: [0.85, -0.35], rimColor: '#c8f4ff', shadow: '#6a5aa8', depth: 0.45 });
  const sunX = 170;
  const sunY = 210;
  const sky =
    gn.sky(pen, [
      [0, '#4a90d8'],
      [0.4, '#9ad0f0'],
      [0.68, '#ffe8c4'],
    ]) +
    gn.halftone(pen, 'M-80 -60H1680V220H-80Z', '#ffffff', 10, 0.08) +
    gn.godRays(pen, sunX, sunY, [30, 55, 80, 105, 130], 7, 1500, '#fff2c8', 0.28) +
    gn.bloom(pen, sunX, sunY, 100, '#fff6dc', 1) +
    gn.cloud(pen, 760, 160, 300, '#ffffff', '#c8c0e0', { seed: 8 }) +
    gn.cloud(pen, 1420, 210, 260, '#ffffff', '#c8c0e0', { seed: 9 });
  const far =
    gn.silhouette(
      [
        [-80, 540],
        [-80, 470],
        [300, 450],
        [700, 480],
        [1000, 440],
        [1400, 470],
        [1680, 450],
        [1680, 540],
      ],
      '#9ab8c8',
    ) +
    gn.haze(pen, 400, 560, '#fff4e0', 0.55) +
    hill(
      pen,
      [
        [-100, 560],
        [400, 520],
        [900, 556],
        [1300, 516],
        [1700, 540],
      ],
      '#a8d070',
      '#6aa84a',
    ) +
    c2.colonyHouse(pen, 960, 560, 0.42) +
    c2.colonyHouse(pen, 1150, 536, 0.5) +
    c2.colonyHouse(pen, 1350, 548, 0.46) +
    c2.colonyHouse(pen, 1530, 534, 0.42) +
    c2.meadow(pen, 13, 40, -40, 1640, 540, 610, ['#ffd166', '#ffffff', '#ffc94a'], [0.4, 0.7]);
  const mid =
    c2.celestiaBloom(pen, 250, 700, 0.82, { stem: 420, gold: true }) +
    c2.greenBot(pen, 1400, 660, 0.62, { flip: true }) +
    c2.greenBot(pen, 1180, 640, 0.42) +
    hill(
      pen,
      [
        [-100, 690],
        [500, 660],
        [1000, 690],
        [1700, 664],
      ],
      '#86b84e',
      '#5a9a3a',
      { line: 2.6 },
    ) +
    c2.meadow(pen, 17, 50, -40, 1640, 670, 740, ['#ffd166', '#ffffff', '#ffc94a', '#ff9ad8'], [0.7, 1.1]);
  // The garden bed: dark furrowed soil across the front, seedlings in a row, one with a little name tag.
  let furrows = '';
  for (let i = 0; i < 5; i++) furrows += `M-80 ${770 + i * 34}Q800 ${750 + i * 36} 1680 ${770 + i * 34}`;
  const seedling = (x: number, y: number, k: number) =>
    pen.brush([[x, y], [x + 2 * k, y - 26 * k]], 4 * k, '#3f7a3a', [0.05, 0.3]) +
    pen.form(`M${x} ${y - 22 * k}Q${x - 26 * k} ${y - 40 * k} ${x - 30 * k} ${y - 24 * k}Q${x - 14 * k} ${y - 14 * k} ${x} ${y - 22 * k}Z`, '#6ab04a', { line: 1.8, sh: 4 * k }) +
    pen.form(`M${x + 2 * k} ${y - 24 * k}Q${x + 28 * k} ${y - 44 * k} ${x + 32 * k} ${y - 28 * k}Q${x + 16 * k} ${y - 16 * k} ${x + 2 * k} ${y - 24 * k}Z`, '#86c85e', { line: 1.8, sh: 4 * k });
  const bed =
    pen.form('M-80 752Q800 728 1680 752V980H-80Z', '#5a3a26', {
      line: 3,
      paint: pen.lin([
        [0, '#7a5034'],
        [1, '#3a2418'],
      ]),
      inner: `<path d="${furrows}" fill="none" stroke="#2a1810" stroke-width="5" opacity=".7"/>` + pen.brushes([[[[-80, 764], [800, 742], [1680, 764]], 5]], '#a8784a', [0.1, 0.1], 0.7),
    }) +
    [120, 330, 1300, 1500].map((x, i) => seedling(x, 780 + (i % 2) * 6, 1.1)).join('') +
    c2.nameTag(pen, 1330, 744, 0.9, 'Rosie II', 4);
  // Brennus, kneeling, cradles a tomato seedling; Jason kneels across from him, patting the soil.
  const kneel: gn.Pose = { turn: 0.5, lean: 6, tilt: 14, hipTilt: 0, armN: { to: [0.92, 1.0] }, armF: { to: [1.08, 0.86] }, legN: { to: [-0.5, 0.45] }, legF: { to: [0.5, 0.5] }, handN: 'grip', handF: 'grip', wristN: -60, wristF: -70, footN: -110 };
  const bx = 560;
  const by = 850;
  const bs = 1.0;
  const r = gn.rig(gn.STOCKY, kneel);
  const hands = gn.lerp(r.wr[0], r.wr[1], 0.5);
  const sx = bx + (hands[0] + 30) * bs;
  const sy = by + (hands[1] - 14) * bs;
  const cradled =
    pen.form(`M${sx - 22} ${sy}Q${sx - 24} ${sy + 22} ${sx} ${sy + 24}Q${sx + 24} ${sy + 22} ${sx + 22} ${sy}Q${sx} ${sy - 8} ${sx - 22} ${sy}Z`, '#6a4430', { sh: 8, hatch: 1, line: 2.2 }) + seedling(sx, sy - 2, 1.6);
  const F = gn.faceFrame(0.5);
  const tear = c2.facePoint(r, bx, by, bs, [F.eyeN[0] - 3, F.eyeN[1] + 10]);
  const teardrop = pen.form(`M${tear[0]} ${tear[1] - 8}Q${tear[0] + 6} ${tear[1] + 2} ${tear[0]} ${tear[1] + 6}Q${tear[0] - 6} ${tear[1] + 2} ${tear[0]} ${tear[1] - 8}Z`, '#bff4ff', { line: 1.6, inner: `<circle cx="${tear[0] - 1.5}" cy="${tear[1]}" r="1.6" fill="#ffffff"/>` });
  // His cap, set down on the grass beside him.
  const capAt = gn.at(330, 806, 1.1, gn.cap(pen, '#55663a', '#c8282e', '#c8282e'), false, -10);
  const jKneel: gn.Pose = { turn: 0.5, lean: 18, tilt: 6, armN: { to: [1.1, 2.4] }, armF: { to: [0.7, 1.5] }, legN: { to: [-0.5, 0.45] }, legF: { to: [0.5, 0.5] }, handN: 'flat', handF: 'relaxed', wristN: -20, footN: -110 };
  const heroes =
    bed +
    capAt +
    gn.castShadow(pen, 560, 856, 170, 14, 0.4) +
    gn.castShadow(pen, 1040, 860, 150, 14, 0.4) +
    gn.brennus(pen.relight({ key: [0.9, -0.3] }), bx, by, bs, { pose: kneel, capOff: true, mood: 'smile', shield: false, cannon: false, look: [2.6, 2.4] }) +
    cradled +
    teardrop +
    gn.jason(pen, 1040, 856, 0.98, { pose: jKneel, mood: 'grin', flip: true, blaster: false, look: [2.4, 0.5] });
  // LUX hovers over them with his tiny watering can, tipping water onto the seedling.
  const drops = [
    [708, 486],
    [700, 512],
    [712, 532],
  ]
    .map(([dx, dy]) => `M${dx} ${dy - 10}Q${dx + 6} ${dy + 2} ${dx} ${dy + 6}Q${dx - 6} ${dy + 2} ${dx} ${dy - 10}Z`)
    .join('');
  const lux = c2.wateringCan(pen, 762, 402, 0.8, '#5e9bff', { rot: 50, flip: true }) + gn.lux(pen, 776, 356, 0.92, 'happy', { flip: true, look: [4, 6] }) + `<path d="${drops}" fill="#9fe8ff" stroke="${gn.INK}" stroke-width="1.6"/>`;
  const fore = gn.grass(pen, -70, 220, 940, 4, 120, '#2a4a1a', '#86b84e', 3) + gn.grass(pen, 1420, 1680, 940, 4, 120, '#2a4a1a', '#86b84e', 5) + gn.spark(pen, 640, 300, 12, '#fff6d0') + gn.spark(pen, 980, 260, 9, '#fff6d0');
  return pen.svg(gn.layer(0.15, sky) + gn.layer(0.35, far) + gn.layer(0.65, mid) + gn.layer(1, heroes + lux) + gn.layer(1.3, fore) + gn.vignette(pen, 0.35, '#1a2040') + gn.grain(pen, 0.07));
}
