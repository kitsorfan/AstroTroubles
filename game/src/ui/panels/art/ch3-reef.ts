/** Chapter 3 panels for Scylla's Reef: Scylla on her rock above Charybdis, and the Argo sailing through the calm strait. */
import * as gn from '../gn';
import { coral, splash, whirlpool } from '../gn/ch3b';

/* ---------------- 25. SCYLLA, in the graphic-novel style ---------------- */

const SC_GOLD = '#e8b440';
const SC_STEEL = '#3a3a48';

/** A lattice crane boom from a to b (w0 wide at a, w1 at b): two rails and zigzag braces, rimmed by the light. */
function boom(pen: gn.Pen, a: gn.P, b: gn.P, w0: number, w1: number, rim: string): string {
  const d = gn.unit(gn.sub(b, a));
  const n = gn.perp(d);
  const l = gn.len(gn.sub(b, a));
  const k = Math.max(3, Math.round(l / ((w0 + w1) * 0.42)));
  const edge = (t: number, side: number): gn.P => gn.add(gn.lerp(a, b, t), gn.mul(n, (side * (w0 + (w1 - w0) * t)) / 2));
  const zig: gn.P[] = [];
  for (let i = 0; i <= k; i++) zig.push(edge(i / k, i % 2 ? 1 : -1));
  const rails = gn.dPoly([edge(0, 1), edge(1, 1)], false) + gn.dPoly([edge(0, -1), edge(1, -1)], false);
  const lit = gn.dPoly([edge(0.02, 1), edge(0.98, 1)], false);
  return (
    `<path d="${gn.dPoly(zig, false)}" fill="none" stroke="${gn.INK}" stroke-width="5"/><path d="${rails}" fill="none" stroke="${gn.INK}" stroke-width="9"/>` +
    `<path d="${gn.dPoly(zig, false)}" fill="none" stroke="${SC_GOLD}" stroke-width="1.6" opacity=".55"/><path d="${rails}" fill="none" stroke="#8a6020" stroke-width="3.4"/>` +
    `<path d="${lit}" fill="none" stroke="${rim}" stroke-width="2.6"/>` +
    pen.form(gn.dPoly([edge(0, 1.25), edge(0.07, 1.25), edge(0.07, -1.25), edge(0, -1.25)]), SC_GOLD, { line: 2.4, rim: 1.6 }) +
    pen.form(gn.dPoly([edge(0.93, 1.2), edge(1, 1.2), edge(1, -1.2), edge(0.93, -1.2)]), SC_GOLD, { line: 2.4, rim: 1.6 })
  );
}

/** A glowing elbow joint: the crane joints Atalanta means to jam. */
function joint(pen: gn.Pen, p: gn.P, r: number): string {
  return (
    pen.glow(p[0], p[1], r * 3.4, '#7fe6ff', 0.75) +
    pen.form(`M${p[0] - r} ${p[1]}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0Z`, SC_STEEL, { sh: r * 0.6, line: 2.6, rim: 2 }) +
    `<circle cx="${p[0]}" cy="${p[1]}" r="${gn.r1(r * 0.45)}" fill="#dffbff"/>` +
    pen.glow(p[0], p[1], r * 1.2, '#ffffff', 0.8)
  );
}

/** A three-fingered grabber claw at the end of an arm, its fingers reaching along `deg` (as `gn.dir` measures it). */
function claw(pen: gn.Pen, p: gn.P, deg: number, s: number, open = 1): string {
  const lp = pen.local(false, -deg);
  const finger = (k: number): gn.P[] => [
    [k * 12, 20],
    [k * (26 + 14 * open), 52],
    [k * (22 + 10 * open), 84],
    [k * (8 + 4 * open), 98],
  ];
  const mid: gn.P[] = [
    [0, 20],
    [0, 60],
    [-4, 96],
  ];
  const fingers =
    lp.brushes(
      [
        [finger(-1), 22],
        [finger(1), 22],
        [mid, 20],
      ],
      gn.INK,
      [0.05, 0.85],
    ) +
    lp.brushes(
      [
        [finger(-1), 12],
        [finger(1), 12],
        [mid, 10],
      ],
      '#5a5a6a',
      [0.05, 0.85],
    );
  const wrist = lp.form('M-26 -24H26L30 22H-30Z', SC_GOLD, { sh: 14, hatch: 1, line: 2.6, rim: 2, inner: `<circle cx="-10" cy="-2" r="5" fill="#ff3a4c"/><circle cx="10" cy="-2" r="5" fill="#ff3a4c"/>` });
  return gn.at(p[0], p[1], s, fingers + wrist + lp.glow(-10, -2, 12, '#ff3a4c', 0.8) + lp.glow(10, -2, 12, '#ff3a4c', 0.8), false, -deg);
}

/** One of the Argo's crates, stolen, swinging in Scylla's claw. */
function crate(pen: gn.Pen, x: number, y: number, s: number, rot: number): string {
  const lp = pen.local(false, rot);
  const planks = `<path d="M-50 -16H50M-50 16H50M-50 -50L50 50" stroke="${gn.INK}" stroke-width="3" opacity=".6"/><circle cx="0" cy="0" r="16" fill="none" stroke="#5a2a10" stroke-width="5" opacity=".7"/>`;
  return gn.at(x, y, s, lp.form('M-50 -50H50V50H-50Z', '#b0784a', { sh: 30, hatch: 2, line: 3, rim: 2.4, inner: planks }), false, rot);
}

/**
 * SCYLLA: a gold turret on the rock, a tall lattice mast, a cab with one big red eye, and six lattice
 * crane arms with glowing elbows and grabber claws, raised and spread against the sun. Base at (x, y).
 */
function scyllaGN(pen: gn.Pen, x: number, y: number, s: number): string {
  // Backlit by the low sun behind her: mostly in shadow, with hot rims along the top edges.
  const body = pen.relight({ key: [0.2, -1], keyColor: '#ffd9a0', rim: [0, -1], rimColor: '#ffe8b0', shadow: '#4a4a8a', depth: 0.9 });
  const rimC = '#ffe2a6';
  const arms: [gn.P, gn.P, gn.P, number][] = [
    // shoulder, elbow, claw, the claw's angle (as dir measures it)
    [[-80, -360], [-280, -500], [-390, -420], 210],
    [[-60, -300], [-360, -340], [-470, -220], 150],
    [[-46, -220], [-300, -150], [-380, -20], 160],
    [[80, -360], [270, -540], [380, -470], 130],
    [[60, -300], [370, -380], [480, -270], 200],
    [[46, -220], [330, -190], [430, -70], 190],
  ];
  let back = '';
  let front = '';
  arms.forEach(([sh, el, cl, ca], i) => {
    const g = boom(body, sh, el, 46, 40, rimC) + boom(body, el, cl, 36, 28, rimC);
    const c = i === 3 ? crate(body, cl[0] + 40, cl[1] + 110, 1, 12) + claw(body, cl, 190, 1, 0.5) : claw(body, cl, ca, 1, 1);
    const part = g + joint(body, el, 20) + c;
    if (i % 3 === 1) back += part;
    else front += part;
  });
  // The body: a riveted column on a slewing turret, braced with lattice, with a collar where the arms are mounted.
  const plates = (xs: number[], y0: number, y1: number) => xs.map((px) => `M${px} ${y0}L${px * 0.92} ${y1}`).join('');
  const column = body.form('M-62 -96L-42 -300H42L62 -96Z', SC_GOLD, {
    sh: 70,
    hatch: 2,
    line: 3,
    rim: 3,
    axis: [0, 1],
    inner: `<path d="M-52 -110L40 -200L-44 -290M52 -110L-40 -200L44 -290" fill="none" stroke="${gn.INK}" stroke-width="4" opacity=".55"/><path d="M-60 -200H60" stroke="${gn.INK}" stroke-width="3" opacity=".6"/>`,
  });
  const skirt = body.form('M-128 -92L-66 -150H66L128 -92Z', SC_GOLD, { sh: 60, hatch: 2, line: 3, rim: 3 });
  const collar = body.form('M-76 -318H76L88 -268H-88Z', SC_GOLD, { sh: 40, hatch: 2, line: 3, rim: 2.6 });
  const turret = body.form('M-160 -50Q-160 -100 0 -104Q160 -100 160 -50V0Q160 26 0 28Q-160 26 -160 0Z', '#c89030', {
    sh: 90,
    hatch: 2,
    line: 3.2,
    rim: 3,
    inner: `<path d="M-160 -40Q0 -4 160 -40${plates([-120, -70, -20, 30, 80, 130], -30, 16)}" fill="none" stroke="${gn.INK}" stroke-width="3.4" opacity=".7"/>`,
  });
  const mast = skirt + column;
  const cab = body.form('M-112 -300H112L132 -350L96 -412H-96L-132 -350Z', SC_GOLD, { sh: 82, hatch: 2, line: 3.2, rim: 3.4, inner: `<path d="M-128 -350H128M-60 -412L-70 -300M60 -412L70 -300" stroke="${gn.INK}" stroke-width="3" opacity=".7"/>` });
  const eye =
    body.glow(0, -352, 170, '#ff3a4c', 0.6) +
    body.form('M-40 -352a40 40 0 1 0 80 0a40 40 0 1 0 -80 0Z', '#1a1418', { line: 3.2 }) +
    `<circle cx="0" cy="-352" r="26" fill="#ff3a4c"/><circle cx="0" cy="-352" r="12" fill="#ffe0d0"/>` +
    body.glow(0, -352, 46, '#ffffff', 0.7) +
    `<path d="M-100 -322H-50M50 -322H100" stroke="#ff3a4c" stroke-width="6"/>` +
    body.glow(-76, -418, 20, '#ff3a4c', 0.95) +
    body.glow(76, -418, 20, '#ff3a4c', 0.95);
  return gn.at(x, y, s, back + turret + mast + collar + cab + eye + front);
}

/**
 * CHARYBDIS: a great funnel of sea centred at (cx, cy): the far inner wall dark and streaked, ragged foam
 * spiralling down into the hole, spray in the air above the rim.
 */
function charybdis(pen: gn.Pen, cx: number, cy: number, rx: number, ry: number): string {
  const rand = gn.rng(17);
  const bowl = pen.rad(
    [
      [0, '#010a10'],
      [0.25, '#032430'],
      [0.6, '#0b5464'],
      [0.85, '#1c8a96'],
      [1, '#2a9aa4', 0],
    ],
    0.5,
    0.6,
    0.55,
  );
  let out = `<ellipse cx="${cx}" cy="${cy}" rx="${gn.r1(rx * 1.15)}" ry="${gn.r1(ry * 1.25)}" fill="${bowl}"/>`;
  // The far wall of the funnel, seen down into it.
  out += `<path d="M${cx - rx * 0.86} ${cy - ry * 0.1}Q${cx} ${cy - ry * 1.05} ${cx + rx * 0.86} ${cy - ry * 0.1}Q${cx + rx * 0.3} ${cy + ry * 0.05} ${cx} ${cy + ry * 0.3}Q${cx - rx * 0.3} ${cy + ry * 0.05} ${cx - rx * 0.86} ${cy - ry * 0.1}Z" fill="#02202a" opacity=".85"/>`;
  const arm = (a0: number, turns: number, r0: number, w: number, color: string, op: number) => {
    const pts: gn.P[] = [];
    for (let i = 0; i <= 12; i++) {
      const t = i / 12;
      const ang = a0 + t * turns * Math.PI * 2;
      const r = r0 * (1 - t * 0.85) * (0.985 + rand() * 0.03);
      pts.push([cx + Math.cos(ang) * rx * r, cy + Math.sin(ang) * ry * r + (1 - r) * ry * 0.45]);
    }
    return pen.brush(pts, w, color, [0.15, 0.85], op);
  };
  for (let i = 0; i < 9; i++) out += arm(rand() * 6.3, 0.5 + rand() * 0.7, 0.75 + rand() * 0.3, 8 + rand() * 8, '#021820', 0.6);
  for (let i = 0; i < 12; i++) out += arm(rand() * 6.3, 0.35 + rand() * 0.7, 0.6 + rand() * 0.45, 4 + rand() * 10, i % 3 ? '#d8f6fa' : '#ffffff', 0.55 + rand() * 0.4);
  // Foam catching the sun on the far rim.
  for (let i = 0; i < 4; i++) out += arm(3.4 + i * 0.5 + rand() * 0.3, 0.25, 1.02, 7, '#ffe6b8', 0.9);
  // The hole.
  out += `<ellipse cx="${cx}" cy="${gn.r1(cy + ry * 0.36)}" rx="${gn.r1(rx * 0.1)}" ry="${gn.r1(ry * 0.08)}" fill="#000306"/>`;
  // The near rim: a lip of white water, and spray above it.
  out += pen.brush(
    [
      [cx - rx * 1.05, cy + ry * 0.2],
      [cx - rx * 0.5, cy + ry * 1.05],
      [cx + rx * 0.4, cy + ry * 1.08],
      [cx + rx * 1.05, cy + ry * 0.25],
    ],
    12,
    '#f0fcff',
    [0.3, 0.3],
    0.85,
  );
  let drops = '';
  for (let i = 0; i < 46; i++) {
    const a = rand() * Math.PI * 2;
    const rr = 0.9 + rand() * 0.35;
    drops += `M${gn.r1(cx + Math.cos(a) * rx * rr)} ${gn.r1(cy + Math.sin(a) * ry * rr - rand() * 60)}h0`;
  }
  out += `<path d="${drops}" stroke="#f4feff" stroke-width="4" opacity=".75"/>`;
  return out + pen.glow(cx, cy - ry * 0.4, rx * 1.1, '#e8fbff', 0.3, ry * 1.4);
}

/** A branching coral, black against the light with a warm rim, base at (x, y). */
function coralGN(pen: gn.Pen, x: number, y: number, s: number, flip: boolean): string {
  const branches: [gn.P[], number][] = [
    [
      [
        [0, 0],
        [-6, -80],
        [-30, -150],
      ],
      30,
    ],
    [
      [
        [-4, -70],
        [30, -130],
        [44, -190],
      ],
      22,
    ],
    [
      [
        [-20, -120],
        [-60, -170],
        [-70, -220],
      ],
      18,
    ],
    [
      [
        [30, -130],
        [70, -150],
        [96, -170],
      ],
      14,
    ],
    [
      [
        [-6, -40],
        [-50, -60],
        [-80, -100],
      ],
      16,
    ],
  ];
  // Staghorn coral: blunt rounded tips, a warm rim on the sunward side.
  const tips = branches.map(([p, w]) => `<circle cx="${p[2][0]}" cy="${p[2][1]}" r="${gn.r1(w * 0.32)}"/>`).join('');
  const lit: [gn.P[], number][] = branches.map(([p, w]) => [p.map((q) => gn.add(q, [w * 0.3, -2])), w * 0.2]);
  const body = pen.brushes(
    branches.map(([p, w]) => [p, w] as [gn.P[], number]),
    '#240a26',
    [0.02, 0.25],
  );
  return gn.at(x, y, s, body + `<g fill="#240a26">${tips}</g>` + pen.brushes(lit, '#ff7aa8', [0.15, 0.4], 0.85), flip);
}

/** 25. Low over the reef at sunset: SCYLLA spreads her six arms on her rock against the sun, CHARYBDIS churns below, and the heroes stand ready. */
export function ch3Scylla(): string {
  const pen = gn.Pen.scene('ch3-scylla', { key: [0.8, -0.55], keyColor: '#ffd28a', rim: [-0.9, -0.35], rimColor: '#8ff0ff', shadow: '#6a5aa8', depth: 0.55 });
  const sunX = 1150;
  const sunY = 250;
  const sky =
    gn.sky(pen, [
      [0, '#0f2440'],
      [0.32, '#2a5c80'],
      [0.56, '#d9a072'],
      [0.64, '#ffd9a4'],
    ]) +
    gn.gasGiant(pen, 200, 130, 118, { lightDir: [0.9, 0.2], haze: 0.55, sky: '#5a86a4' }) +
    gn.starfield(pen, 11, 40, 0, 0, 1600, 200, '#e8f0ff') +
    gn.godRays(pen, sunX, sunY, [-160, -125, -100, -70, -45, 45, 70, 100, 125, 160, 200], 7, 1100, '#ffe2a8', 0.32) +
    gn.bloom(pen, sunX, sunY, 110, '#fff0c8', 0.95);
  const far =
    gn.silhouette(
      [
        [-40, 520],
        [60, 488],
        [170, 476],
        [260, 494],
        [330, 520],
      ],
      '#9a8a98',
      0.9,
    ) +
    gn.silhouette(
      [
        [1420, 520],
        [1520, 492],
        [1660, 500],
        [1680, 524],
      ],
      '#a89090',
      0.8,
    ) +
    gn.sea(pen, 516, '#e8c294', '#0c4458', { seed: 6, sunX, ripple: '#7fd0d8', glint: '#fff2cc' }) +
    gn.haze(pen, 470, 590, '#ffe2b8', 0.7);
  // The great rock: a craggy stack, dark against the sun, rimmed gold on its sunward edges.
  const rockPen = pen.relight({ key: [1, -0.25], rim: [0.15, -1], rimColor: '#ffd890', shadow: '#34346a', depth: 0.9 });
  const rock = gn.crag(
    rockPen,
    [
      [900, 940],
      [930, 820],
      [975, 760],
      [990, 690],
      [1030, 640],
      [1020, 590],
      [1060, 540],
      [1110, 505],
      [1170, 492],
      [1250, 496],
      [1300, 520],
      [1330, 560],
      [1362, 620],
      [1350, 670],
      [1395, 720],
      [1430, 790],
      [1480, 850],
      [1540, 940],
    ],
    '#8a7a70',
    { seed: 8, sh: 470, cracks: 10, strata: 5, rim: 3.6, hatch: 2, line: 3.4 },
  );
  const surf = pen.brushes(
    [
      [
        [
          [900, 800],
          [980, 782],
          [1100, 790],
        ],
        14,
      ],
      [
        [
          [1360, 790],
          [1460, 778],
          [1560, 800],
        ],
        14,
      ],
    ],
    '#f4fdff',
    [0.3, 0.3],
    0.9,
  );
  const mid =
    charybdis(pen, 840, 690, 300, 80) +
    rock +
    surf +
    scyllaGN(pen, 1195, 512, 0.86) +
    // IRIS's scan: a reticle on the elbow Atalanta is aiming at.
    `<g fill="none" stroke="#9fffe8" stroke-width="3" opacity=".9"><circle cx="885" cy="220" r="32"/><path d="M885 178V198M885 242V262M843 220H863M907 220H927"/></g>` +
    gn.haze(pen, 700, 860, '#d8f2f4', 0.35);
  // The reef ledge the heroes stand on: dark coral rock, its top edge catching the sun.
  const ledge = gn.crag(
    pen.relight({ key: [0.6, -0.8] }),
    [
      [-80, 940],
      [-80, 836],
      [100, 822],
      [300, 840],
      [480, 834],
      [700, 852],
      [860, 890],
      [900, 940],
    ],
    '#4a3c4c',
    { seed: 3, sh: 22, cracks: 8, rim: 2.4, hatch: 2 },
  );
  const heroes =
    ledge +
    gn.castShadow(pen, 250, 880, 150, 14, 0.5) +
    gn.castShadow(pen, 620, 886, 140, 14, 0.5) +
    gn.atalanta(pen, 250, 884, 1.08, { bow: 'draw', aim: 110, mood: 'focus', look: [2.6, -2.5], wind: 0.7 }) +
    gn.iris(pen, 108, 300, 0.74, 'normal', { rot: 8 }) +
    gn.lux(pen, 486, 610, 0.85, 'scared', { look: [7, -4] }) +
    gn.jason(pen, 640, 888, 1.08, {
      pose: { turn: 0.42, lean: 3, armN: [-16, 28], armF: [112, 114], legN: { to: [-0.3, 0.92] }, legF: { to: [0.3, 0.93] }, handN: 'fist', handF: 'point' },
      mood: 'determined',
      look: [2.4, -2.5],
    });
  const fore = coralGN(pen, 10, 990, 2.0, false) + coralGN(pen, 1610, 990, 2.3, true);
  return pen.svg(gn.layer(0.15, sky) + gn.layer(0.35, far) + gn.layer(0.65, mid) + gn.layer(1, heroes) + gn.layer(1.3, fore) + gn.vignette(pen, 0.55, '#0a0a1c') + gn.grain(pen, 0.08));
}

/* ---------------- 26. Through the calm strait ---------------- */

/** A switched-off elbow joint: plain steel, no glow. */
function dimJoint(pen: gn.Pen, p: gn.P, r: number): string {
  return pen.form(`M${p[0] - r} ${p[1]}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0Z`, '#6a6a7a', { sh: r * 0.6, line: 2.6, rim: 1.6, inner: `<circle cx="${p[0]}" cy="${p[1]}" r="${gn.r1(r * 0.4)}" fill="#3a3a48"/>` });
}

/** A grabber claw shut tight and hanging straight down, its little eyes dark. */
function shutClaw(pen: gn.Pen, p: gn.P, s: number): string {
  const fingers: [gn.P[], number][] = [
    [
      [
        [-12, 20],
        [-18, 56],
        [-6, 84],
      ],
      20,
    ],
    [
      [
        [12, 20],
        [18, 56],
        [6, 84],
      ],
      20,
    ],
  ];
  const body =
    pen.brushes(fingers, gn.INK, [0.05, 0.8]) +
    pen.brushes(
      fingers.map(([pts, w]) => [pts, w * 0.55] as [gn.P[], number]),
      '#5a5a6a',
      [0.05, 0.8],
    ) +
    pen.form('M-24 -22H24L28 22H-28Z', SC_GOLD, { sh: 12, hatch: 1, line: 2.6, rim: 1.8, inner: `<path d="M-15 -2h10M5 -2h10" stroke="#4a1a1a" stroke-width="4"/>` });
  return gn.at(p[0], p[1], s, body);
}

/**
 * SCYLLA after the fight, folded up like a tired spider on her rock: all six arms tucked down round her
 * mast, claws shut, the cab drooping and its big eye dark, a curl of smoke from her pumps. Base at (x, y).
 */
function scyllaFolded(pen: gn.Pen, x: number, y: number, s: number): string {
  const rimC = pen.light.rimColor;
  const arms: [gn.P, gn.P, gn.P][] = [
    [
      [-80, -360],
      [-196, -404],
      [-236, -214],
    ],
    [
      [-60, -300],
      [-194, -300],
      [-212, -132],
    ],
    [
      [-46, -220],
      [-150, -186],
      [-160, -52],
    ],
    [
      [80, -360],
      [196, -404],
      [236, -214],
    ],
    [
      [60, -300],
      [194, -300],
      [212, -132],
    ],
    [
      [46, -220],
      [150, -186],
      [160, -52],
    ],
  ];
  let back = '';
  let front = '';
  arms.forEach(([sh, el, cl], i) => {
    const part = boom(pen, sh, el, 40, 34, rimC) + boom(pen, el, cl, 32, 26, rimC) + dimJoint(pen, el, 17) + shutClaw(pen, cl, 0.85);
    if (i % 3 === 1) back += part;
    else front += part;
  });
  const column = pen.form('M-62 -96L-42 -300H42L62 -96Z', SC_GOLD, { sh: 34, hatch: 2, line: 3, rim: 2.4, axis: [0, 1], inner: `<path d="M-52 -110L40 -200L-44 -290M52 -110L-40 -200L44 -290" fill="none" stroke="${gn.INK}" stroke-width="4" opacity=".55"/>` });
  const skirt = pen.form('M-128 -92L-66 -150H66L128 -92Z', SC_GOLD, { sh: 24, hatch: 2, line: 3, rim: 2.4 });
  const turret = pen.form('M-160 -50Q-160 -100 0 -104Q160 -100 160 -50V0Q160 26 0 28Q-160 26 -160 0Z', '#c89030', { sh: 50, hatch: 2, line: 3.2, rim: 2.4, inner: `<path d="M-160 -40Q0 -4 160 -40" fill="none" stroke="${gn.INK}" stroke-width="3.4" opacity=".7"/>` });
  const collar = pen.form('M-76 -318H76L88 -268H-88Z', SC_GOLD, { sh: 20, hatch: 2, line: 3, rim: 2.4 });
  const cabPen = pen.local(false, 16);
  const cab =
    cabPen.form('M-112 50H112L132 0L96 -62H-96L-132 0Z', SC_GOLD, { sh: 40, hatch: 2, line: 3.2, rim: 2.6, inner: `<path d="M-128 0H128" stroke="${gn.INK}" stroke-width="3" opacity=".7"/>` }) +
    cabPen.form('M-40 -2a40 40 0 1 0 80 0a40 40 0 1 0 -80 0Z', '#1a1418', { line: 3.2, inner: `<circle cx="0" cy="-2" r="24" fill="#4a1a20"/><path d="M-40 -8Q0 -30 40 -8V-44H-40Z" fill="${SC_GOLD}" stroke="${gn.INK}" stroke-width="3"/>` });
  const smoke = [
    [70, -420, 22],
    [96, -470, 30],
    [80, -530, 38],
  ]
    .map(([cx, cy, r], i) => pen.glow(cx, cy, r * 1.6, '#e8e4ec', 0.75 - i * 0.18))
    .join('');
  return gn.at(x, y, s, back + turret + skirt + column + collar + gn.at(0, -350, 1, cab, false, 16) + front + smoke);
}

/** A little fish leaping out of the water along an arc: orange or pink, inked, a splash where it left. */
function leapingFish(pen: gn.Pen, x: number, y: number, s: number, rot: number, color: string): string {
  const lp = pen.local(false, rot);
  const fish = lp.form('M-40 0Q-10 -24 30 -6Q40 0 30 6Q-10 24 -40 0Z', color, { sh: 10, line: 2.6, rim: 1.6, inner: `<circle cx="18" cy="-3" r="3.4" fill="${gn.INK}"/><path d="M-6 -14Q2 0 -6 14" fill="none" stroke="${gn.INK}" stroke-width="2" opacity=".6"/>` }) + lp.form('M-36 0L-62 -20L-56 0L-62 20Z', color, { sh: 6, line: 2.4 });
  return gn.at(x, y, s, fish, false, rot);
}

/** 26. Afternoon at the strait: the Argo slips past Scylla, folded up on her rock, and the little swirl Charybdis has become; Atalanta points at the fish coming back, Jason waves from the pier. */
export function ch3Strait(): string {
  const pen = gn.Pen.scene('ch3-strait', { key: [-0.75, -0.6], keyColor: '#ffe6b0', rim: [0.9, -0.3], rimColor: '#bff6ff', shadow: '#6a6ab0', depth: 0.5 });
  const sunX = 90;
  const sunY = 100;
  const sky =
    gn.sky(pen, [
      [0, '#2058a8'],
      [0.3, '#58a4dc'],
      [0.46, '#b8e2f2'],
      [0.5, '#fff0d0'],
    ]) +
    gn.halftone(pen, 'M-80 -60H1680V240H-80Z', '#ffffff', 10, 0.08) +
    gn.gasGiant(pen, 1180, 120, 80, { lightDir: [-0.9, 0.2], haze: 0.55, sky: '#7ab8e0' }) +
    gn.godRays(pen, sunX, sunY, [30, 52, 74, 96, 118, 140], 6, 1700, '#fff4d0', 0.24) +
    gn.bloom(pen, sunX, sunY, 100, '#fff8e0', 1) +
    gn.cloud(pen, 820, 200, 300, '#ffffff', '#b8c0e0', { seed: 8 }) +
    gn.cloud(pen, 1480, 230, 220, '#ffffff', '#b8c0e0', { seed: 9 });
  // The far sea, the next island on the horizon (bronze, a thread of smoke from its volcano).
  const far =
    gn.silhouette(
      [
        [560, 432],
        [640, 404],
        [680, 368],
        [706, 372],
        [740, 406],
        [840, 432],
      ],
      '#a89088',
      0.95,
    ) +
    pen.glow(694, 330, 36, '#e8dcd8', 0.6) +
    pen.glow(706, 286, 50, '#e8dcd8', 0.45) +
    gn.sea(pen, 430, '#c8eef4', '#127a96', { seed: 14, sunX: 300, ripple: '#e8fbff' }) +
    gn.haze(pen, 390, 480, '#f0faff', 0.6);
  // Across the strait: Scylla's rock, Scylla folded up on top; the Argo gliding past; the little swirl with fish leaping round it.
  const rock = gn.crag(
    pen,
    [
      [-60, 720],
      [-20, 600],
      [60, 520],
      [90, 430],
      [150, 380],
      [240, 352],
      [330, 362],
      [392, 410],
      [420, 480],
      [480, 540],
      [530, 620],
      [600, 720],
    ],
    '#8a7a80',
    { seed: 8, sh: 120, cracks: 10, strata: 4, rim: 2.6, hatch: 2, line: 3 },
  );
  const mid =
    rock +
    scyllaFolded(pen, 248, 370, 0.56) +
    pen.brush(
      [
        [-60, 716],
        [260, 700],
        [610, 718],
      ],
      14,
      '#f4fdff',
      [0.3, 0.3],
      0.85,
    ) +
    gn.argoTrail(pen, 640, 488, 260, -86, '#e8fbff') +
    gn.argo(pen, 820, 470, 0.34, { rot: -2 }) +
    whirlpool(pen, 870, 590, 210, 40, { calm: true, seed: 3, water: '#2ab0c0', deep: '#1a7a9a' }) +
    leapingFish(pen, 720, 556, 0.9, -34, '#ff9a4a') +
    leapingFish(pen, 990, 566, 0.75, 28, '#ff7a9a') +
    coral(pen, 640, 600, 0.45, 'stag', '#ff8a8a', { seed: 2 }) +
    gn.haze(pen, 620, 740, '#e8fbff', 0.3);
  // The pier at the foot of the reef: Atalanta points at the swirl and the fish, Jason waves to the Argo.
  let planks = '';
  for (let px = 1040; px < 1720; px += 64) planks += `M${px} 800L${px + (px - 1360) * 0.22} 980`;
  const pier =
    pen.brushes(
      [
        [
          [
            [1070, 820],
            [1070, 960],
          ],
          26,
        ],
        [
          [
            [1260, 820],
            [1260, 960],
          ],
          26,
        ],
      ],
      '#3a2418',
      [0, 0],
    ) +
    pen.form('M1040 800H1700V880H1004Z', '#b08058', { sh: 14, hatch: 1, line: 3.2, rim: 2, inner: `<path d="${planks}" stroke="${gn.INK}" stroke-width="2.6" opacity=".55"/>` }) +
    pen.form('M1004 880H1700V912H1008Z', '#7a5236', { sh: 8, line: 3 });
  const heroPen = pen.relight({ key: [-0.95, -0.3] });
  const heroes =
    pier +
    gn.castShadow(pen, 1130, 868, 130, 14, 0.45) +
    gn.atalanta(heroPen, 1130, 872, 1.04, {
      flip: true,
      pose: { turn: 0.45, lean: 6, hipTilt: 6, armN: [-12, 6], armF: [74, 78], legN: { to: [-0.22, 0.95] }, legF: { to: [0.26, 0.94] }, handN: 'fist', handF: 'point' },
      mood: 'grin',
      look: [2.4, 1.4],
      wind: 0.8,
    }) +
    gn.castShadow(pen, 1410, 868, 140, 14, 0.45) +
    gn.jason(heroPen, 1410, 872, 1.08, { flip: true, pose: 'wave', mood: 'grin', look: [2.2, -1] }) +
    gn.lux(pen, 1300, 250, 0.85, 'happy', { flip: true }) +
    gn.iris(pen, 1010, 250, 0.72, 'happy', { flip: true, rot: -10 });
  const fore = coral(pen, -20, 960, 1.4, 'stag', '#ff7a8a', { seed: 6 }) + coral(pen, 160, 960, 1, 'fan', '#ffb84a', { seed: 5 });
  return pen.svg(gn.layer(0.15, sky) + gn.layer(0.35, far) + gn.layer(0.6, mid) + gn.layer(1, heroes) + gn.layer(1.3, fore) + gn.vignette(pen, 0.45, '#0a1a30') + gn.grain(pen, 0.08));
}
