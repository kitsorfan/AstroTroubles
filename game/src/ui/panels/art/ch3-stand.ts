/** Chapter 3 panels for Brennus's Last Stand: the old general on Colchis's sky-dock as the gold fleet comes, and his salute to the Argo. */
import { at, backdrop, brennus, C, cloud, gascuSprout, gasGiant, glow, glowDef, goldShip, ink, lin, panel, sparkle, stars, vignette } from '../kit';
import * as gn from '../gn';

const STONE = '#e8dcc4';
const STONE_DARK = '#b4a48a';
const RUNE = '#5ee0c8';

/** One of Brennus's old Legion robots, olive again, with a green lens: on his side (feet at x, y). */
function legionBot(x: number, y: number, s: number, flip = false): string {
  const body = `<path d="M-30 -10L-34 -60M30 -10L34 -60" stroke="#262e16" stroke-width="18" stroke-linecap="round"/>
    <path d="M-48 -10H-18M18 -10H48" ${ink(8)}/><path d="M-48 -10H-18M18 -10H48" stroke="#3a4426" stroke-width="12" stroke-linecap="round"/>
    <ellipse cx="0" cy="-104" rx="62" ry="54" fill="${C.olive}" ${ink(6)}/>
    <circle cx="0" cy="-96" r="14" fill="${C.red}" ${ink(3)}/>
    <ellipse cx="-58" cy="-134" rx="20" ry="13" fill="#c9a24a" ${ink(4)}/><ellipse cx="58" cy="-134" rx="20" ry="13" fill="#c9a24a" ${ink(4)}/>
    <ellipse cx="0" cy="-176" rx="40" ry="34" fill="${C.olive}" ${ink(5)}/>
    <circle cx="8" cy="-174" r="15" fill="#3dff8a" ${ink(4)}/><circle cx="12" cy="-178" r="5" fill="#fff"/>
    <path d="M-20 -206V-232" ${ink(4)}/><circle cx="-20" cy="-236" r="6" fill="#3dff8a" ${ink(3)}/>
    <rect x="30" y="-118" width="70" height="20" rx="7" fill="#2a2c24" ${ink(4)}/>`;
  return at(x, y, s, body, flip);
}

/** The Gardeners' great arch of pale stone, glowing with teal light-runes (feet of the pillars at y). */
function greatArch(id: string, x0: number, x1: number, y: number, top: number): string {
  const mid = (x0 + x1) / 2;
  const w = 70;
  let runes = '';
  for (let i = 0; i < 6; i++) {
    for (const px of [x0, x1]) runes += `<circle cx="${px}" cy="${y - 60 - i * ((y - top - 120) / 6)}" r="${i % 2 ? 7 : 10}" fill="${RUNE}"/>`;
  }
  return `<defs>${glowDef(id + 'r', RUNE, 0.6)}</defs>${glow(id + 'r', mid, top + 80, (x1 - x0) * 0.55, 0.35)}
    <path d="M${x0 - w} ${y}V${top + 90}Q${x0 - w} ${top - 40} ${mid} ${top - 70}Q${x1 + w} ${top - 40} ${x1 + w} ${top + 90}V${y}H${x1 - w}V${top + 110}Q${x1 - w} ${top + 30} ${mid} ${top + 10}Q${x0 + w} ${top + 30} ${x0 + w} ${top + 110}V${y}Z" fill="${STONE}" ${ink(6)}/>
    <path d="M${x0 + w - 18} ${y}V${top + 120}M${x1 + w - 18} ${y}V${top + 100}" stroke="#000" stroke-width="12" opacity=".08"/>
    ${runes}<circle cx="${mid}" cy="${top - 26}" r="22" fill="${RUNE}" ${ink(4)}/><circle cx="${mid}" cy="${top - 26}" r="9" fill="#fff"/>`;
}

/** The sky-dock's stone floor in front: a slab with glowing rune lines, its edge dropping to the clouds. */
function dockFloor(id: string, y: number): string {
  return `<defs>${lin(id + 'f', [[0, STONE], [1, STONE_DARK]])}</defs>
    <path d="M-20 ${y}Q800 ${y - 30} 1620 ${y}V920H-20Z" fill="url(#${id}f)" ${ink(6)}/>
    <path d="M100 ${y + 60}H700M900 ${y + 70}H1500M300 ${y + 130}H1300" stroke="${RUNE}" stroke-width="6" stroke-linecap="round" opacity=".75"/>`;
}

/** A sea of sunset clouds far below. */
function cloudSea(y: number): string {
  return (
    `<rect x="0" y="${y}" width="1600" height="${900 - y}" fill="#ffd2c0"/>` +
    [0, 1, 2, 3, 4, 5, 6, 7].map((i) => cloud(80 + i * 210, y + 30 + (i % 2) * 24, 1.1, i % 2 ? '#fff0e6' : '#ffe2d4')).join('')
  );
}

/** 25. On Colchis's sky-dock at sunset, Brennus and his Legion stand guard as Aeëtes's gold fleet comes over the clouds. */
export function ch3Stand(): string {
  const id = 'ch3-stand';
  const fleet = (
    [
      [300, 250, 0.32],
      [560, 175, 0.22],
      [140, 400, 0.24],
      [720, 330, 0.17],
      [430, 430, 0.14],
    ] as const
  )
    .map(([x, y, s], i) => at(x, y, 1, goldShip(`${id}g${i}`, 0, 0, s), true))
    .join('');
  return panel(
    backdrop(id + 'b', [[0, '#2a2060'], [0.5, '#9a5a9a'], [1, '#ffb487']]) +
      stars(25, 70, 0, 0, 1600, 300) +
      gasGiant(id + 'j', 1380, 160, 100, false) +
      cloudSea(560) +
      fleet +
      greatArch(id + 'a', 1180, 1460, 780, 220) +
      dockFloor(id + 'd', 720) +
      legionBot(470, 840, 0.95) +
      legionBot(1050, 850, 0.95, true) +
      brennus(760, 880, 1.3, { pose: 'hips', face: 'determined' }) +
      gascuSprout(id + 's', 860, 790, 0.42) +
      sparkle(870, 690, 10, C.pinkLight) +
      vignette(id + 'v', 0.35, '#2a1838'),
  );
}

/* ---------------- 26. The salute, in the graphic-novel style ---------------- */

const ARCH = '#e8dcc4';

/**
 * The Gardeners' great arch: pale stone blocks against the sunset, glowing teal runes up its pillars and a
 * rune-stone at the crown. Inner edges of the pillars at x0 and x1, their feet at y, the opening's top at `top`.
 */
function archGN(pen: gn.Pen, x0: number, x1: number, y: number, top: number): string {
  const w = 96;
  const mid = (x0 + x1) / 2;
  const d = `M${x0 - w} ${y}V${top + 170}Q${x0 - w} ${top - 60} ${mid} ${top - 70}Q${x1 + w} ${top - 60} ${x1 + w} ${top + 170}V${y}H${x1}V${top + 190}Q${x1} ${top + 40} ${mid} ${top + 30}Q${x0} ${top + 40} ${x0} ${top + 190}V${y}Z`;
  // Block joints: courses across the pillars and wedge-shaped stones round the curve.
  let joints = '';
  for (let yy = y - 70; yy > top + 190; yy -= 74) joints += `M${x0 - w} ${yy}H${x0}M${x1} ${yy}H${x1 + w}`;
  for (let i = 1; i < 10; i++) {
    const a = Math.PI * (i / 10);
    const ix = mid - Math.cos(a) * (mid - x0);
    const iy = top + 190 - Math.sin(a) * 160;
    const ox = mid - Math.cos(a) * (mid - x0 + w);
    const oy = top + 170 - Math.sin(a) * 236;
    joints += `M${gn.r1(ix)} ${gn.r1(iy)}L${gn.r1(ox)} ${gn.r1(oy)}`;
  }
  // Light-word runes: rings, dots and arcs glowing in the stone.
  const glyphs = ['M-12 0a12 12 0 1 0 24 0a12 12 0 1 0 -24 0', 'M-12 8Q0 -16 12 8', 'M-12 -10v20M0 -6v12M12 -10v20', 'M-12 0H12M0 -12V12'];
  const runes = [x0 - w / 2, x1 + w / 2]
    .map((px, side) => {
      let r = '';
      for (let i = 0; i < 5; i++) {
        const ry = y - 110 - i * 92;
        r += pen.glow(px, ry, 34, '#5ee0c8', 0.7) + `<path d="${glyphs[(i + side) % 4]}" fill="none" stroke="#bffff0" stroke-width="5" transform="translate(${px} ${ry})"/><circle cx="${px}" cy="${ry}" r="3" fill="#ffffff"/>`;
      }
      return r;
    })
    .join('');
  const cracks = pen.brushes(
    [
      [
        [
          [x0 - w + 10, top + 260],
          [x0 - w / 2, top + 300],
          [x0 - 30, top + 290],
        ],
        3,
      ],
      [
        [
          [x1 + 20, y - 200],
          [x1 + 50, y - 160],
          [x1 + 44, y - 120],
        ],
        3,
      ],
      [
        [
          [mid - 120, top - 30],
          [mid - 90, top + 10],
        ],
        2.6,
      ],
    ],
    gn.INK,
    [0.2, 0.6],
    0.7,
  );
  const inner = `<path d="${joints}" fill="none" stroke="${gn.INK}" stroke-width="3" opacity=".55"/>` + cracks + runes;
  // The underside of the arch and the inside of the far pillar, seen past the near edge.
  const soffit = `M${x1} ${y}V${top + 190}Q${x1} ${top + 40} ${mid} ${top + 30}Q${x0 + 40} ${top + 34} ${x0 + 10} ${top + 120}Q${x0 + 40} ${top + 70} ${mid - 10} ${top + 66}Q${x1 - 40} ${top + 76} ${x1 - 40} ${top + 200}V${y}Z`;
  return (
    pen.form(soffit, '#b8a890', { sh: 30, hatch: 2, line: 3, shade: '#5a4a6a' }) +
    pen.form(d, ARCH, { sh: 560, hatch: 2, rim: 3.6, line: 3.4, inner }) +
    pen.glow(mid, top - 30, 70, '#5ee0c8', 0.9) +
    pen.form(`M${mid - 44} ${top - 72}L${mid + 44} ${top - 72}L${mid + 34} ${top + 34}L${mid - 34} ${top + 34}Z`, '#d8ccb4', { sh: 30, hatch: 1, line: 3, rim: 2.4, inner: `<circle cx="${mid}" cy="${top - 18}" r="18" fill="#5ee0c8" stroke="${gn.INK}" stroke-width="3"/><circle cx="${mid}" cy="${top - 18}" r="7" fill="#fff"/>` })
  );
}

/** The sky-dock's stone floor from y down, its slab joints running toward the arch and lit rune lines in them. */
function dockGN(pen: gn.Pen, y: number, vx: number): string {
  let joints = '';
  for (let i = -6; i <= 8; i++) joints += `M${vx + i * 30} ${y}L${vx + i * 300} ${y + 400}`;
  for (const yy of [y + 26, y + 70, y + 140, y + 240]) joints += `M-80 ${yy}H1680`;
  const runes = pen.brushes(
    [
      [
        [
          [vx - 70, y + 6],
          [vx - 380, y + 140],
        ],
        5,
      ],
      [
        [
          [vx + 70, y + 6],
          [vx + 460, y + 150],
        ],
        5,
      ],
    ],
    '#7ff0d8',
    [0.1, 0.1],
    0.85,
  );
  // A few slabs a shade darker, so the floor reads as worn old stone.
  const rows = [y, y + 26, y + 70, y + 140, y + 240];
  let slabs = '';
  for (let i = -6; i < 8; i++) {
    const ri = (i * 7 + 20) % 4;
    if ((i * 5) % 3) continue;
    const [ya, yb] = [rows[ri], rows[ri + 1]];
    const xa = (yy: number, k: number) => vx + k * 30 + ((k * 300 - k * 30) * (yy - y)) / 400;
    slabs += `M${gn.r1(xa(ya, i))} ${ya}L${gn.r1(xa(ya, i + 1))} ${ya}L${gn.r1(xa(yb, i + 1))} ${yb}L${gn.r1(xa(yb, i))} ${yb}Z`;
  }
  const inner = `<path d="${slabs}" fill="#5a4060" opacity=".14"/><path d="${joints}" fill="none" stroke="${gn.INK}" stroke-width="2.6" opacity=".45"/>` + pen.glow(vx, y + 60, 500, '#ffc890', 0.4, 120) + runes;
  return pen.form(`M-80 ${y}Q800 ${y - 12} 1680 ${y}V960H-80Z`, '#c8b8a0', { sh: 60, hatch: 1, line: 3.4, rim: 2, inner });
}

/**
 * The Golden Ram asleep after the fight: a great gold war machine lying down, its head on its forelegs,
 * eyes shut, smoke curling from its open engine and its curly horns dented. Centre-bottom at (x, y).
 */
function sleepingRam(pen: gn.Pen, x: number, y: number, s: number): string {
  const gold = '#e8b43a';
  let out = '';
  const plate = '#c8901e';
  // Folded hydraulic legs under the body.
  out += pen.form('M-250 -30L-262 4H-150L-140 -30Z', plate, { sh: 16, hatch: 1, line: 3 }) + pen.form('M110 -30L100 4H220L226 -30Z', plate, { sh: 16, hatch: 1, line: 3 });
  // The body: an armoured shell in overlapping plates, embossed with the curls of a fleece.
  const curls = [
    [-200, -140],
    [-100, -172],
    [0, -180],
    [100, -158],
    [-150, -78],
    [-50, -100],
    [50, -96],
  ]
    .map(([cx, cy]) => `M${cx - 18} ${cy + 4}a18 16 0 1 1 30 8a10 9 0 1 1 -14 -6`)
    .join('');
  const seams = 'M-300 -60Q-20 -110 250 -70M-260 -150Q-40 -210 190 -150M-120 -214L-140 -10M60 -212L50 -10';
  const rivets = [-240, -170, -90, -10, 70, 150].map((rx) => `<circle cx="${rx}" cy="${-70 - Math.abs(rx) * 0.05}" r="4" fill="${gn.INK}" opacity=".7"/>`).join('');
  out += pen.form('M-310 -10Q-336 -130 -220 -192Q-60 -246 120 -208Q236 -180 262 -70Q270 -14 240 -6Z', gold, {
    sh: 80,
    hatch: 2,
    line: 3.6,
    rim: 3,
    inner: `<path d="${seams}" fill="none" stroke="${gn.INK}" stroke-width="3.4" opacity=".7"/><path d="${curls}" fill="none" stroke="#8a5a14" stroke-width="3.4" opacity=".75"/>` + rivets,
  });
  // The open engine hatch on its back, still smoking.
  out += pen.form('M-70 -222L40 -232L48 -200L-64 -190Z', '#4a4a54', { sh: 10, line: 2.8, inner: pen.glow(-10, -210, 70, '#ff9a3a', 0.7) });
  out += [
    [-20, -270, 26],
    [10, -320, 34],
    [-14, -384, 42],
    [24, -446, 48],
  ]
    .map(([cx, cy, r], i) => pen.glow(cx, cy, r * 1.6, '#e0d8e8', 0.85 - i * 0.15))
    .join('');
  // The head resting on the deck: an armoured wedge with a dark visor, its eye-lights off.
  const visor = `<path d="M250 -150L340 -168L384 -128L300 -112Z" fill="#2a1e18"/><path d="M262 -140L330 -152" stroke="#6a2a24" stroke-width="5"/>`;
  const headSeams = `<path d="M236 -226L300 -96L418 -58M330 -236L340 -170" fill="none" stroke="${gn.INK}" stroke-width="3" opacity=".6"/>` + [270, 300, 360].map((rx) => `<circle cx="${rx}" cy="-82" r="4" fill="${gn.INK}" opacity=".7"/>`).join('');
  const head = pen.form('M196 -150L236 -226L330 -236L392 -170L428 -96L418 -58L330 -46L236 -70Z', gold, { sh: 40, hatch: 2, line: 3.4, rim: 2.8, inner: visor + headSeams });
  // A great ridged horn curling round the side of its head.
  const horn: gn.P[] = [
    [268, -214],
    [214, -262],
    [150, -226],
    [150, -150],
    [204, -122],
    [244, -150],
    [226, -186],
    [196, -180],
  ];
  const ridges = horn.slice(1, 6).map((p, i): [gn.P[], number] => [[gn.add(p, [-10, -6 + i * 3]), gn.add(p, [10, 6 - i * 3])], 4]);
  out += head + pen.brush(horn, 44, gn.INK, [0.05, 0.7]) + pen.brush(horn, 34, '#c8902a', [0.05, 0.7]) + pen.brushes(ridges, '#6a4410', [0.2, 0.2], 0.8) + pen.brush(horn.slice(0, 4), 8, '#ffe6a0', [0.2, 0.4], 0.6);
  // Snores.
  const z = (zx: number, zy: number, k: number) => pen.brush([[zx, zy], [zx + 30 * k, zy], [zx, zy + 30 * k], [zx + 30 * k, zy + 30 * k]], 7 * k, '#ffffff', [0.05, 0.05], 0.9);
  out += z(420, -250, 1) + z(470, -330, 1.3);
  return gn.at(x, y, s, out);
}

/** 26. The Argo slips through the great arch behind Brennus, who salutes, dented and proud; the Golden Ram sleeps it off beside him. */
export function ch3Salute(): string {
  const pen = gn.Pen.scene('ch3-salute', { key: [0.75, -0.6], keyColor: '#ffc88a', rim: [-0.9, -0.3], rimColor: '#a8e8ff', shadow: '#6a4a9a', depth: 0.55, hatchAngle: 40 });
  const back = pen.relight({ key: [0, -1], rim: [0, -1], rimColor: '#ffe0a8', shadow: '#5a4a8a', depth: 0.8 });
  const sunX = 1180;
  const sunY = 440;
  const sky =
    gn.sky(pen, [
      [0, '#1c1440'],
      [0.3, '#5a2a6a'],
      [0.55, '#d8607a'],
      [0.72, '#ffb07a'],
    ]) +
    gn.starfield(pen, 26, 60, 0, 0, 1600, 240, '#ffe8f0') +
    gn.gasGiant(pen, 230, 170, 150, { lightDir: [0.9, 0.3], haze: 0.35, sky: '#8a4a7a', bands: ['#f6d7a8', '#e8a878', '#fbe8c8', '#c89ab8', '#f0b890', '#fff0d8', '#d88a6a', '#e0b0c8'] }) +
    gn.godRays(pen, sunX, sunY, [-150, -120, -95, -70, 70, 95, 120, 150, 180, 205], 6, 1200, '#ffe0b0', 0.3) +
    gn.bloom(pen, sunX, sunY, 120, '#fff0d0', 1);
  // The sea of clouds far below, lit pink and gold by the sunset.
  let clouds = '';
  [
    [80, 660, 380, 1],
    [460, 690, 420, 2],
    [900, 650, 360, 3],
    [1350, 680, 440, 4],
    [1640, 660, 380, 5],
  ].forEach(([cx, cy, cw, seed]) => (clouds += gn.cloud(back, cx, cy, cw, '#ffc8a8', '#8a5a9a', { seed, flat: true })));
  [
    [-40, 740, 520, 6],
    [420, 760, 560, 7],
    [960, 740, 520, 8],
    [1480, 760, 560, 9],
  ].forEach(([cx, cy, cw, seed]) => (clouds += gn.cloud(back, cx, cy, cw, '#ffb8a0', '#6a4a8a', { seed, flat: true, rim: 2 })));
  const far = `<rect x="-80" y="640" width="1760" height="320" fill="#7a4a8a"/>` + clouds + gn.haze(pen, 560, 720, '#ffc0a0', 0.6);
  // The Argo, backlit, in the arch's opening, with its wake of light behind it.
  const mid =
    archGN(back, 940, 1430, 780, 190) +
    gn.argoTrail(pen, 1000, 480, 260, -86, '#bff0ff') +
    gn.argo(back.relight({ rim: [0.2, -1], rimColor: '#fff0c8' }), 1196, 470, 0.6, { rot: -4 }) +
    gn.haze(pen, 680, 800, '#ffd0b0', 0.35);
  const near = dockGN(pen, 760, 1190) + gn.wash(pen, 770, '#1a0c28', 0.9) + gn.castShadow(pen, 1140, 856, 300, 24, 0.45) + sleepingRam(pen.relight({ key: [0.6, -0.8] }), 1110, 862, 0.85);
  const hero = gn.longShadow(pen, 330, 944, -38, 420, 150, 0.6) + gn.castShadow(pen, 330, 940, 200, 22, 0.5) + gn.brennus(pen, 330, 948, 1.22, { pose: 'salute', cannon: false, dented: true, mood: 'proud', look: [2.2, -1.5], rim: 2.4 });
  // Bits of a defeated ramling in the foreground.
  const fore = gn.crag(pen, [
    [-60, 960],
    [-40, 880],
    [40, 860],
    [110, 890],
    [140, 960],
  ], '#8a7a6a', { seed: 5, sh: 30, cracks: 3, rim: 2.4 });
  return pen.svg(gn.layer(0.15, sky) + gn.layer(0.35, far) + gn.layer(0.6, mid) + gn.layer(0.85, near) + gn.layer(1, hero) + gn.layer(1.25, fore) + gn.vignette(pen, 0.55, '#120a20') + gn.grain(pen, 0.08));
}
