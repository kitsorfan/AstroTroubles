/** Chapter 3 panels, part 2: the Harpy Isles. Atalanta and her stripped skiff, and old Phineus's stolen dinner. */
import * as gn from '../gn';
import { ellD, phineus } from '../gn/ch3a';

/* ---------------- 23. Atalanta, in the graphic-novel style ---------------- */

/** What a harpy drone carries off in its talons. */
type Haul = 'wing' | 'engine' | 'basket' | 'teapot' | 'cake' | 'none';

/**
 * One of Aeëtes's harpy drones in the graphic-novel style: a gold metal raptor with blade feathers, a
 * hooked beak and one glowing eye, flying right with a stolen part in its talons. Centred on its body.
 */
function harpyGN(pen: gn.Pen, x: number, y: number, s: number, o: { haul?: Haul; rot?: number; eye?: string } = {}): string {
  const lp = pen.local(false, o.rot ?? 0);
  const eye = o.eye ?? '#7fe6ff';
  const wing = (dx: number, dy: number, color: string, far: boolean) =>
    lp.form(`M${dx} ${dy}L${dx - 40} ${dy - 70}L${dx - 150} ${dy - 150}L${dx - 128} ${dy - 118}L${dx - 170} ${dy - 110}L${dx - 130} ${dy - 86}L${dx - 168} ${dy - 70}L${dx - 120} ${dy - 52}L${dx - 150} ${dy - 30}L${dx - 80} ${dy - 18}L${dx - 60} ${dy + 6}Z`, color, {
      sh: 22,
      hatch: far ? 2 : 1,
      line: 2.6,
      rim: far ? 0 : 1.8,
      inner: lp.brushes(
        [
          [
            [
              [dx - 40, dy - 10],
              [dx - 120, dy - 96],
            ],
            2.4,
          ],
          [
            [
              [dx - 30, dy - 40],
              [dx - 140, dy - 66],
            ],
            2.4,
          ],
        ],
        gn.INK,
        [0.2, 0.4],
        0.7,
      ),
    });
  let out = wing(-6, -16, '#b8861e', true);
  // Tail feathers.
  out += lp.form('M-86 0L-170 -18L-150 4L-176 24L-140 22L-160 46L-84 16Z', '#c8901e', { sh: 14, hatch: 1, line: 2.4 });
  // Talons and the loot.
  out += lp.brushes(
    [
      [
        [
          [6, 26],
          [2, 60],
        ],
        8,
      ],
      [
        [
          [26, 24],
          [32, 60],
        ],
        8,
      ],
    ],
    gn.INK,
    [0.05, 0.05],
  );
  if (o.haul === 'wing') {
    out += lp.form('M-40 62L120 44L150 80L-10 104Z', '#eef3f6', { sh: 16, hatch: 1, line: 2.6, rim: 1.6, inner: `<path d="M-30 80L136 60" stroke="#2fb7a3" stroke-width="12"/><circle cx="140" cy="62" r="7" fill="#ff4a5a"/>` });
    out += lp.brushes(
      [
        [
          [
            [-38, 74],
            [-60, 88],
            [-58, 112],
          ],
          4,
        ],
        [
          [
            [-30, 90],
            [-44, 116],
          ],
          4,
        ],
      ],
      '#ff5e6a',
      [0.1, 0.3],
    );
  } else if (o.haul === 'engine') {
    out += lp.form('M-36 58H48Q70 58 72 82Q70 106 48 106H-36Z', '#9aa6ba', { sh: 18, hatch: 2, line: 2.6, rim: 1.6, inner: `<rect x="-24" y="72" width="40" height="14" fill="#2fb7a3"/><path d="M-30 64H40" stroke="#fff" stroke-width="3" opacity=".6"/>` });
    out += lp.glow(76, 82, 24, '#7fe6ff', 0.8);
  } else if (o.haul === 'basket') {
    // Phineus's dinner basket, a loaf and a bunch of grapes poking out.
    out += lp.brush([[-10, 60], [14, 26], [40, 58]], 11, gn.INK, [0.05, 0.05]) + lp.brush([[-10, 60], [14, 26], [40, 58]], 5, '#c8884a', [0.05, 0.05]);
    out += lp.form('M-4 62Q12 40 30 58Q20 70 -4 62Z', '#e0a058', { sh: 6, line: 2.2 }) + lp.form('M26 50a9 9 0 1 0 18 0a9 9 0 1 0 -18 0ZM34 62a9 9 0 1 0 18 0a9 9 0 1 0 -18 0Z', '#9a5ac8', { sh: 5, line: 2 });
    out += lp.form('M-28 58H66L56 104H-18Z', '#c8884a', { sh: 16, hatch: 1, line: 2.6, rim: 1.6, inner: `<path d="M-24 74H62M-22 90H58M0 58V104M22 58V104M44 58V104" stroke="#8a5a2a" stroke-width="3"/>` });
  } else if (o.haul === 'teapot') {
    out += lp.brush([[50, 80], [76, 72], [84, 52]], 12, gn.INK, [0.05, 0.3]) + lp.brush([[50, 80], [76, 72], [84, 52]], 6, '#e8f0f8', [0.05, 0.3]);
    out += lp.form('M-14 98Q-20 62 18 60Q56 62 50 98Q46 112 18 112Q-10 112 -14 98Z', '#e8f0f8', { sh: 14, hatch: 1, line: 2.6, rim: 1.6, inner: `<path d="M-10 84Q18 94 48 84" stroke="#ff6fcf" stroke-width="5" fill="none"/>` });
    out += lp.form('M4 62Q18 48 32 62Z', '#ff6fcf', { line: 2 }) + lp.brush([[30, 104], [36, 124], [30, 140]], 5, '#d8f0ff', [0.1, 0.6], 0.8);
  } else if (o.haul === 'cake') {
    out += lp.form('M-20 76H56V96Q18 106 -20 96Z', '#e8a050', { sh: 10, line: 2.6, rim: 1.6 }) + lp.form('M-20 76Q18 62 56 76Q18 88 -20 76Z', '#ffd166', { line: 2.2, inner: `<path d="M-8 78q4 10 8 2q4 10 8 0q4 10 10 0" fill="none" stroke="#ffb020" stroke-width="4"/>` });
  }
  out += lp.brush([[-6, 62], [4, 52], [16, 62]], 4, gn.INK, [0.1, 0.1]) + lp.brush([[22, 62], [32, 52], [42, 62]], 4, gn.INK, [0.1, 0.1]);
  // The body and the head.
  out += lp.form('M-96 4Q-66 -24 16 -26Q74 -22 90 -4Q76 20 12 24Q-64 26 -96 4Z', '#e8b440', {
    sh: 22,
    hatch: 2,
    line: 2.8,
    rim: 2,
    inner: `<path d="M-40 -22Q-46 2 -38 24M0 -26Q-6 0 2 24" fill="none" stroke="${gn.INK}" stroke-width="2.4" opacity=".55"/>`,
  });
  out += lp.form('M74 -36L58 -62L84 -44L88 -70L102 -38Z', '#a8741c', { sh: 6, line: 2.2 });
  out += lp.form('M68 -20a24 20 0 1 0 48 0a24 20 0 1 0 -48 0Z', '#e8b440', { sh: 12, hatch: 1, line: 2.6, rim: 1.8 });
  out += lp.form('M110 -28Q142 -24 142 -4Q126 -10 112 -8Z', '#2a2230', { line: 2.2 });
  out += lp.glow(98, -22, 26, eye, 0.8) + `<circle cx="98" cy="-22" r="9" fill="#1a1630" stroke="${gn.INK}" stroke-width="2"/><circle cx="99" cy="-21" r="5.5" fill="${eye}"/><circle cx="96" cy="-25" r="2" fill="#fff"/>`;
  out += wing(14, -8, '#f0c050', false);
  return gn.at(x, y, s, out, false, o.rot ?? 0);
}

/**
 * Atalanta's scout skiff (teal and white with gold trim) lying wrecked on the grass, nose to the right:
 * its near wing torn off at a jagged stump, the engine bay ripped open, wires sparking. Base at (x, y).
 */
function skiffGN(pen: gn.Pen, x: number, y: number, s: number): string {
  const teal = '#2fb7a3';
  let out = '';
  // The far wing, still there, angled up behind the hull.
  out += pen.form('M-40 -96L-150 -230L-110 -236L60 -110Z', '#eef3f6', { sh: 24, hatch: 2, line: 2.8, inner: `<path d="M-30 -100L-128 -222" stroke="${teal}" stroke-width="12"/><circle cx="-128" cy="-226" r="7" fill="#ff4a5a"/>` });
  // Bent landing struts.
  out += pen.brushes(
    [
      [
        [
          [-150, -20],
          [-176, 6],
        ],
        12,
      ],
      [
        [
          [140, -24],
          [170, 6],
        ],
        12,
      ],
    ],
    gn.INK,
    [0.05, 0.05],
  );
  // The hull.
  const hull = 'M-280 -30Q-286 -84 -200 -100L110 -120Q250 -112 318 -50Q330 -10 270 -2L-250 4Q-280 0 -280 -30Z';
  const deck = `<path d="M-270 -60Q0 -96 300 -70L320 -40Q0 -70 -276 -36Z" fill="#eef3f6"/><path d="M-276 -40Q0 -74 316 -46" fill="none" stroke="#ffc94a" stroke-width="6"/>`;
  const bay = `<path d="M-250 -70L-150 -84L-140 -24L-244 -16Z" fill="#141826"/><path d="M-240 -66L-160 -76M-236 -40L-150 -46" stroke="#3a4258" stroke-width="5"/>`;
  out += pen.form(hull, teal, { sh: 40, hatch: 2, line: 3, rim: 2.2, axis: [1, 0], inner: deck + bay + `<path d="M-60 -30H40V-10H-60Z" fill="#141826"/>` });
  // The torn-off near wing: a jagged stump with sparking wires.
  out += pen.form('M-30 -96L60 -104L76 -76L58 -66L70 -44L44 -52L34 -30L14 -54L-2 -40L-14 -70Z', '#eef3f6', { sh: 14, hatch: 1, line: 2.8, rim: 1.6 });
  const wires: [gn.P[], number][] = [
    [
      [
        [20, -46],
        [6, -16],
        [-20, -4],
      ],
      4,
    ],
    [
      [
        [40, -50],
        [54, -20],
        [44, 6],
      ],
      4,
    ],
    [
      [
        [-180, -50],
        [-210, -10],
        [-240, 0],
      ],
      4,
    ],
  ];
  out += pen.brushes([wires[0]], '#ff5e6a', [0.05, 0.3]) + pen.brushes([wires[1]], '#ffd166', [0.05, 0.3]) + pen.brushes([wires[2]], '#5ec8ff', [0.05, 0.3]);
  out += gn.spark(pen, -20, -4, 18, '#fff6b0') + gn.spark(pen, 44, 8, 12, '#ffe066') + gn.spark(pen, -240, 0, 14, '#bff4ff');
  // The cockpit canopy, cracked.
  out += pen.form('M70 -118Q120 -176 214 -124Z', '#9fe8ff', { sh: 12, line: 2.8, inner: `<path d="M120 -150L140 -132L132 -118M140 -132L160 -138" fill="none" stroke="${gn.INK}" stroke-width="2"/>` + pen.brush([[96, -128], [124, -156], [160, -158]], 6, '#ffffff', [0.3, 0.3], 0.8) });
  // A wisp of smoke from the engine bay.
  out += [
    [-200, -130, 30],
    [-180, -190, 40],
    [-210, -260, 52],
  ]
    .map(([cx, cy, r], i) => pen.glow(cx, cy, r * 1.5, '#d8d0d8', 0.75 - i * 0.18))
    .join('');
  return gn.at(x, y, s, out);
}

/** A floating sky-isle far off in the haze: a grassy cap over a hanging cone of rock, maybe a thread of waterfall. */
function farIsle(pen: gn.Pen, x: number, y: number, w: number, haze: string, fall = false, seed = 1): string {
  const h = w * 0.8;
  const k = w / 200;
  const rock = gn.crag(
    pen,
    [
      [x - w / 2, y],
      [x - w * 0.36, y + h * 0.36],
      [x - w * 0.16, y + h * 0.62],
      [x - w * 0.04, y + h],
      [x + w * 0.1, y + h * 0.66],
      [x + w * 0.3, y + h * 0.42],
      [x + w / 2, y],
    ],
    '#d0bcb4',
    { seed, sh: w * 0.3, cracks: 3, hatch: 1, line: 1.4 * k + 0.4, rim: 0 },
  );
  const cap = pen.form(
    `M${gn.r1(x - w * 0.56)} ${gn.r1(y + 4)}Q${gn.r1(x - w * 0.3)} ${gn.r1(y - w * 0.12)} ${gn.r1(x)} ${gn.r1(y - w * 0.13)}Q${gn.r1(x + w * 0.3)} ${gn.r1(y - w * 0.12)} ${gn.r1(x + w * 0.56)} ${gn.r1(y + 4)}Q${gn.r1(x)} ${gn.r1(y + w * 0.08)} ${gn.r1(x - w * 0.56)} ${gn.r1(y + 4)}Z`,
    '#8ac06a',
    { sh: w * 0.05, line: 1.4 * k + 0.4 },
  );
  let trees = '';
  for (const t of [-0.28, 0.02, 0.26]) {
    const tx = x + t * w;
    const ty = y - w * 0.1 * (1 - t * t * 4);
    trees += pen.form(`M${gn.r1(tx - 12 * k)} ${gn.r1(ty)}L${gn.r1(tx)} ${gn.r1(ty - 46 * k)}L${gn.r1(tx + 12 * k)} ${gn.r1(ty)}Z`, '#6aa05a', { sh: 8 * k, line: 1.4 * k + 0.4 });
  }
  const water = fall ? `<path d="M${gn.r1(x + w * 0.2)} ${gn.r1(y + 4)}V${gn.r1(y + h * 1.5)}" stroke="#f4fbff" stroke-width="${gn.r1(w * 0.035)}" opacity=".8"/>` : '';
  return rock + cap + trees + water + pen.glow(x, y + h * 0.25, w * 0.8, haze, 0.7, h * 0.9);
}

/** 23. On a floating isle at golden hour, Jason and LUX meet Atalanta by her wrecked skiff while harpy drones flap off with its wing and engine; IRIS zooms in, delighted. */
export function ch3Atalanta(): string {
  const pen = gn.Pen.scene('ch3-atalanta', { key: [-0.75, -0.55], keyColor: '#ffe0a8', rim: [0.9, -0.3], rimColor: '#c8f4ff', shadow: '#7a6ab0', depth: 0.5 });
  const sunX = 220;
  const sunY = 190;
  const sky =
    gn.sky(pen, [
      [0, '#2a5aa0'],
      [0.35, '#6aa8dc'],
      [0.62, '#ffd8a0'],
      [0.75, '#ffe8c0'],
    ]) +
    gn.halftone(pen, 'M-80 -60H1680V260H-80Z', '#ffffff', 10, 0.1) +
    gn.gasGiant(pen, 930, 120, 84, { lightDir: [-0.9, 0.2], haze: 0.5, sky: '#8ab8e0' }) +
    gn.godRays(pen, sunX, sunY, [20, 45, 70, 95, 120, 150, 175], 7, 1300, '#fff2c8', 0.28) +
    gn.bloom(pen, sunX, sunY, 120, '#fff6d8', 1) +
    gn.cloud(pen, 600, 210, 300, '#ffffff', '#c8b8d8', { seed: 2 }) +
    gn.cloud(pen, 1380, 170, 260, '#ffffff', '#c8b8d8', { seed: 3 });

  const back = pen.relight({ key: [-0.8, -0.6], rimColor: '#fff2d0', rim: [-0.6, -0.8] });
  const far =
    farIsle(pen, 560, 430, 200, '#f4e6ea', true, 2) +
    farIsle(pen, 880, 350, 130, '#f4eaf4', false, 3) +
    farIsle(pen, 1460, 440, 240, '#f4e6ea', true, 4) +
    `<path d="M640 410Q760 450 812 336" fill="none" stroke="#8a8098" stroke-width="3"/>` +
    [
      [100, 640, 420, 1],
      [520, 660, 460, 2],
      [980, 640, 420, 3],
      [1420, 660, 460, 4],
    ]
      .map(([cx, cy, cw, seed]) => gn.cloud(back, cx, cy, cw, '#fff6ea', '#d8c0d8', { seed, flat: true }))
      .join('') +
    `<rect x="-80" y="640" width="1760" height="320" fill="#f2e0e0"/>` +
    [
      [-40, 720, 520, 5],
      [460, 740, 560, 6],
      [1000, 720, 520, 7],
      [1500, 740, 560, 8],
    ]
      .map(([cx, cy, cw, seed]) => gn.cloud(back, cx, cy, cw, '#fffaf0', '#e0c8d8', { seed, flat: true }))
      .join('') +
    gn.haze(pen, 520, 700, '#fff0d8', 0.6);
  // The harpies flapping away with the skiff's wing and engine, streaks behind them.
  const harpies =
    gn.streaks(pen, 1120, 220, -100, 220, 4, 70, '#ffffff', 0.7, 3) +
    harpyGN(pen, 1200, 210, 0.85, { haul: 'wing', rot: -12 }) +
    gn.streaks(pen, 1380, 330, -100, 180, 4, 60, '#ffffff', 0.6, 4) +
    harpyGN(pen, 1440, 320, 0.7, { haul: 'engine', rot: -18, eye: '#ff6a5a' });
  // The isle they stand on: a grassy top, its rocky edge dropping away into the clouds on the left.
  const ground =
    pen.form('M-80 800Q200 770 600 778Q1100 772 1680 790V960H-80Z', '#6ab04a', {
      sh: 30,
      line: 3,
      rim: 0,
      paint: pen.lin([
        [0, '#9ad06a'],
        [1, '#3a7a3a'],
      ]),
      inner: pen.brushes(
        [
          [
            [
              [120, 820],
              [130, 790],
            ],
            5,
          ],
          [
            [
              [520, 812],
              [530, 784],
            ],
            5,
          ],
          [
            [
              [760, 830],
              [744, 800],
            ],
            5,
          ],
          [
            [
              [1460, 830],
              [1474, 800],
            ],
            5,
          ],
          [
            [
              [1560, 840],
              [1550, 806],
            ],
            5,
          ],
        ],
        '#2a5a2a',
        [0.05, 0.9],
      ),
    }) +
    gn.grass(pen, -40, 1640, 794, 30, 30, '#3a7a3a', '#b8e088', 7) +
    gn.wash(pen, 820, '#1a2a30', 0.6);
  const props =
    gn.castShadow(pen, 1230, 806, 330, 24, 0.4) +
    skiffGN(pen, 1230, 800, 0.95) +
    // A dropped wrench and loose bolts.
    pen.brush(
      [
        [640, 850],
        [700, 838],
      ],
      12,
      gn.INK,
      [0.05, 0.05],
    ) +
    pen.brush(
      [
        [640, 850],
        [700, 838],
      ],
      6,
      '#9aa6ba',
      [0.05, 0.05],
    ) +
    `<g fill="#9aa6ba" stroke="${gn.INK}" stroke-width="2"><circle cx="604" cy="862" r="6"/><circle cx="730" cy="866" r="5"/></g>`;
  // IRIS zooming in on a rainbow streak.
  const trail = gn.RAINBOW.map((c, i) => pen.brush([[420, 160 + i * 8], [580, 262 + i * 7], [748, 388 + i * 5]], 9, c, [0.9, 0.05], 0.8)).join('');
  const heroes =
    gn.castShadow(pen, 1000, 880, 140, 14, 0.45) +
    gn.atalanta(pen, 1000, 884, 1.1, { pose: 'hips', mood: 'grin', flip: true, look: [2, 1] }) +
    trail +
    gn.iris(pen, 776, 408, 0.85, 'happy', { flip: true, rot: 14 }) +
    gn.castShadow(pen, 330, 900, 150, 14, 0.5) +
    gn.jason(pen, 330, 904, 1.12, { pose: 'wave', mood: 'smile', look: [2, 0] }) +
    gn.lux(pen, 150, 470, 0.95, 'normal', { look: [8, -6] });
  const fore = gn.grass(pen, -70, 230, 930, 4, 150, '#10281a', '#4a8a4a', 9) + gn.grass(pen, 1420, 1680, 930, 4, 150, '#10281a', '#4a8a4a', 10);
  return pen.svg(gn.layer(0.15, sky) + gn.layer(0.35, far) + gn.layer(0.6, harpies) + gn.layer(0.85, ground + props) + gn.layer(1, heroes) + gn.layer(1.25, fore) + gn.vignette(pen, 0.45, '#1a1030') + gn.grain(pen, 0.08));
}


/* ---------------- 24. Phineus, in the graphic-novel style ---------------- */

/** Phineus's little round stone observatory: a drum of stone blocks under a copper dome with a star-slit, its doorway glowing. Base centre at (x, y). */
function observatoryGN(pen: gn.Pen, x: number, y: number, s: number): string {
  let joints = '';
  for (let r = 0; r < 5; r++) {
    const sy = -34 - r * 36;
    joints += `M-130 ${sy}Q0 ${sy + 14} 130 ${sy}`;
    for (let j = 0; j < 4; j++) joints += `M${-100 + j * 64 + (r % 2) * 32} ${sy + 4}v30`;
  }
  let out = pen.form('M-130 0V-196Q0 -214 130 -196V0Q0 14 -130 0Z', '#b8a898', { sh: 90, hatch: 2, rim: 2.2, line: 3, inner: `<path d="${joints}" fill="none" stroke="${gn.INK}" stroke-width="2.6" opacity=".45"/>` });
  out += pen.form('M-148 -190Q-144 -336 0 -340Q144 -336 148 -190Q0 -214 -148 -190Z', '#4f8a96', {
    sh: 70,
    hatch: 2,
    rim: 2.4,
    line: 3,
    inner: `<path d="M-72 -202Q-80 -300 0 -340M72 -202Q80 -300 0 -340" fill="none" stroke="#2f6070" stroke-width="4"/>` + pen.brush([[-104, -232], [-90, -300], [-34, -322]], 8, '#bff0f0', [0.3, 0.4], 0.5),
  });
  out += pen.form('M-16 -200V-328Q0 -338 16 -328V-200Z', '#1a1838', { line: 2.4, inner: gn.spark(pen, -2, -300, 6, '#fff6d0') + gn.spark(pen, 6, -256, 5, '#fff6d0') });
  out += pen.brush([[0, -338], [0, -380]], 6, gn.INK, [0.05, 0.05]) + gn.spark(pen, 0, -392, 16, '#ffd166');
  // The open doorway, warm lamplight spilling out, and a round window.
  out += pen.glow(0, -60, 120, '#ffc860', 0.7);
  out += pen.form('M-44 0V-100Q-44 -140 0 -140Q44 -140 44 -100V0Z', '#ffd98a', { line: 2.8, inner: pen.glow(0, -50, 60, '#fff6d8', 0.9) });
  out += pen.form('M-44 0V-100Q-44 -140 -8 -140L-22 -126V10Z', '#8a5a34', { sh: 8, line: 2.4 });
  out += pen.form('M64 -128a20 20 0 1 0 40 0a20 20 0 1 0 -40 0Z', '#ffd98a', { line: 2.6, inner: `<path d="M84 -148V-108M64 -128H104" stroke="${gn.INK}" stroke-width="3"/>` });
  return gn.at(x, y, s, out);
}

/** A brass telescope on a wooden tripod, tilted up at the sky toward the right. Feet at (x, y). */
function telescopeGN(pen: gn.Pen, x: number, y: number, s: number): string {
  const legs: [gn.P[], number][] = [
    [
      [
        [0, -150],
        [-70, 0],
      ],
      14,
    ],
    [
      [
        [0, -150],
        [70, 0],
      ],
      14,
    ],
    [
      [
        [0, -150],
        [12, 0],
      ],
      12,
    ],
  ];
  let out = pen.brushes(legs, gn.INK, [0.02, 0.02]) + pen.brushes(
    legs.map(([p, w]) => [p, w * 0.5] as [gn.P[], number]),
    '#8a5a34',
    [0.02, 0.02],
  );
  const tp = pen.local(false, -48);
  const tube =
    tp.form('M-150 -12H-106V12H-150Z', '#b88030', { sh: 6, line: 2.4 }) +
    tp.form('M-110 -24H112V24H-110Z', '#d8a040', { sh: 16, hatch: 1, line: 2.6, rim: 1.8, inner: `<path d="M-60 -24V24M40 -24V24" stroke="#a87020" stroke-width="6"/><path d="M-96 -12H100" stroke="#fff6c0" stroke-width="5" opacity=".6"/>` }) +
    tp.form('M110 -34H166V34H110Z', '#e8b850', { sh: 16, line: 2.6, rim: 1.8 }) +
    `<ellipse cx="166" cy="0" rx="8" ry="30" fill="#bfeaff" stroke="${gn.INK}" stroke-width="2.4"/>`;
  out += pen.form('M-14 -150a14 14 0 1 0 28 0a14 14 0 1 0 -28 0Z', '#b88030', { sh: 6, line: 2.4 }) + gn.at(0, -160, 1, tube, false, -48);
  return gn.at(x, y, s, out);
}

/** A checked picnic blanket on the grass with what is left of dinner: a plate, a tipped cup and crumbs. */
function picnic(pen: gn.Pen): string {
  const checks = [0, 1, 2, 3, 4, 5].map((i) => `M${640 + i * 66} ${828 - i * 3}L${600 + i * 80} ${888 - i * 2}`).join('') + 'M590 850L990 836M574 870L1006 856';
  return (
    pen.form('M600 830L960 812L1020 872L560 892Z', '#d84a4a', { sh: 10, line: 2.8, rim: 1.6, inner: `<path d="${checks}" stroke="#fff" stroke-width="8" opacity=".45"/>` }) +
    pen.form(ellD(880, 846, 42, 12), '#f4f0e8', { sh: 5, line: 2.4 }) +
    gn.at(950, 846, 1, pen.local(false, -80).form('M-14 -10L14 -14L16 10L-12 12Z', '#e8f0f8', { sh: 6, line: 2.2 }), false, -80) +
    `<g fill="#e8b870" stroke="${gn.INK}" stroke-width="1.6"><circle cx="760" cy="840" r="4"/><circle cx="800" cy="852" r="3"/><circle cx="700" cy="860" r="4"/></g>`
  );
}

/** A bit of dinner tumbling through the air: an apple, a bunch of grapes or a bread roll. */
function food(pen: gn.Pen, kind: 'apple' | 'grapes' | 'roll', x: number, y: number, rot: number): string {
  const lp = pen.local(false, rot);
  let out = '';
  if (kind === 'apple') out = lp.form('M-18 0a18 18 0 1 0 36 0a18 18 0 1 0 -36 0Z', '#ff5a4a', { sh: 8, line: 2.4, rim: 1.4 }) + lp.form('M2 -24q12 -8 16 2q-10 4 -16 -2Z', '#5f9a3a', { line: 1.8 });
  else if (kind === 'grapes') out = [[-10, 0], [8, 0], [0, 14], [-18, -14], [2, -16]].map(([gx, gy]) => lp.form(`M${gx - 9} ${gy}a9 9 0 1 0 18 0a9 9 0 1 0 -18 0Z`, '#9a5ac8', { sh: 4, line: 2 })).join('');
  else out = lp.form(ellD(0, 0, 26, 16), '#e0a058', { sh: 7, line: 2.4, inner: `<path d="M-10 -12q4 10 0 22M6 -14q4 12 0 26" fill="none" stroke="#a86a30" stroke-width="3"/>` });
  return gn.at(x, y, 1, out, false, rot);
}

/** 24. Dusk on Phineus's isle: harpy drones flap off with the old stargazer's dinner; he shakes his stick at them and shouts; Jason and Atalanta come running. */
export function ch3Phineus(): string {
  const pen = gn.Pen.scene('ch3-phineus', { key: [0.85, -0.4], keyColor: '#ffb890', rim: [-0.9, -0.35], rimColor: '#a8c8ff', shadow: '#5a4a9a', depth: 0.55 });
  const sunX = 1300;
  const sunY = 540;
  const sky =
    gn.sky(pen, [
      [0, '#1e2258'],
      [0.36, '#54488a'],
      [0.58, '#d87e9a'],
      [0.7, '#ffb088'],
      [0.8, '#ffd0a0'],
    ]) +
    gn.starfield(pen, 12, 40, 0, 0, 1600, 300, '#fff6e0') +
    gn.gasGiant(pen, 190, 150, 90, { lightDir: [0.9, 0.2], haze: 0.25, sky: '#3a3a7a' }) +
    gn.godRays(pen, sunX, sunY, [-150, -125, -100, 100, 125, 150, 180, 205], 6, 1200, '#ffd8b0', 0.25) +
    gn.bloom(pen, sunX, sunY, 110, '#fff0d0', 0.9);
  const back = pen.relight({ key: [0.8, -0.6], rimColor: '#ffe0c8', rim: [0.6, -0.8] });
  const far =
    farIsle(pen, 520, 430, 170, '#f4d0d8', true, 2) +
    farIsle(pen, 960, 340, 120, '#f4d4e0', false, 3) +
    farIsle(pen, 1490, 380, 210, '#f4d0d8', true, 4) +
    [
      [100, 650, 420, 1],
      [520, 670, 460, 2],
      [980, 650, 420, 3],
      [1420, 670, 460, 4],
    ]
      .map(([cx, cy, cw, seed]) => gn.cloud(back, cx, cy, cw, '#ffd8c8', '#b878a0', { seed, flat: true }))
      .join('') +
    `<rect x="-80" y="650" width="1760" height="320" fill="#e0a8b0"/>` +
    gn.haze(pen, 520, 700, '#ffd8c0', 0.6);
  // The isle they stand on: dusk grass, the observatory and telescope, and the picnic blanket.
  const ground =
    pen.form('M-80 780Q300 740 800 752Q1250 748 1680 770V960H-80Z', '#4a8a4a', {
      sh: 30,
      line: 3,
      paint: pen.lin([
        [0, '#7ab060'],
        [1, '#24402a'],
      ]),
    }) +
    gn.grass(pen, -40, 1640, 768, 18, 28, '#2a5a30', '#c8d890', 6) +
    gn.wash(pen, 820, '#140c24', 0.6);
  const home = pen.glow(230, 720, 300, '#ffc860', 0.35) + observatoryGN(pen, 210, 790, 1.0) + telescopeGN(pen, 410, 800, 0.85) + picnic(pen);
  // The harpies make off with the basket, the teapot and a honey cake; dinner tumbles through the air.
  const harpies =
    gn.streaks(pen, 760, 250, -110, 180, 4, 60, '#ffffff', 0.6, 3) +
    harpyGN(pen, 860, 230, 0.8, { haul: 'basket', rot: -14 }) +
    gn.streaks(pen, 1080, 170, -110, 140, 3, 50, '#ffffff', 0.5, 4) +
    harpyGN(pen, 1160, 150, 0.6, { haul: 'teapot', rot: -20, eye: '#ff6a5a' }) +
    gn.streaks(pen, 760, 470, -120, 120, 3, 40, '#ffffff', 0.5, 5) +
    harpyGN(pen, 850, 470, 0.62, { haul: 'cake', rot: -26 }) +
    food(pen, 'apple', 760, 360, 20) +
    food(pen, 'grapes', 1010, 320, -20) +
    food(pen, 'roll', 720, 600, 30) +
    gn.spark(pen, 980, 420, 8, '#fff2a0') +
    gn.spark(pen, 560, 260, 6, '#fff2a0');
  // Phineus, shaking his stick at them; Jason and Atalanta come running from the right.
  const heroes =
    gn.castShadow(pen, 540, 884, 150, 16, 0.5) +
    phineus(pen, 540, 890, 0.86, {
      pose: { turn: 0.45, lean: 4, tilt: -14, hipTilt: 4, armN: [-168, 168], armF: [96, 120], legN: { to: [-0.16, 0.97] }, legF: { to: [0.2, 0.96] }, handN: 'fist', handF: 'open', wristF: -20 },
      mood: 'shout',
      stickTilt: 40,
    });
  const shake = pen.brushes(
    [
      [
        [
          [470, 150],
          [490, 130],
        ],
        5,
      ],
      [
        [
          [520, 120],
          [548, 112],
        ],
        5,
      ],
      [
        [
          [430, 200],
          [446, 176],
        ],
        4,
      ],
    ],
    '#ffffff',
    [0.3, 0.3],
    0.85,
  );
  const runners =
    gn.castShadow(pen, 1150, 886, 130, 12, 0.45) +
    gn.jason(pen, 1150, 890, 0.92, { pose: { ...gn.POSES.run, armF: [135, 150], armN: [-50, 10], handF: 'point', handN: 'fist' }, flip: true, mood: 'shout', look: [2, -3] }) +
    gn.lux(pen, 900, 600, 0.7, 'normal', { flip: true, look: [6, -6] }) +
    gn.castShadow(pen, 1470, 880, 130, 12, 0.45) +
    gn.atalanta(pen, 1470, 884, 0.9, { pose: { ...gn.POSES.run, armN: [30, 120] }, flip: true, mood: 'determined', look: [2, -2], bow: 'back', wind: 1.2 }) +
    gn.iris(pen, 1360, 400, 0.6, 'normal', { flip: true, rot: -8 });
  const fore = gn.grass(pen, -70, 220, 940, 4, 140, '#10201a', '#4a7a4a', 9) + gn.grass(pen, 1460, 1680, 940, 4, 140, '#10201a', '#4a7a4a', 10);
  return pen.svg(gn.layer(0.15, sky) + gn.layer(0.35, far) + gn.layer(0.75, ground + home) + gn.layer(0.9, harpies) + gn.layer(1, heroes + shake + runners) + gn.layer(1.3, fore) + gn.vignette(pen, 0.5, '#140c24') + gn.grain(pen, 0.08));
}
