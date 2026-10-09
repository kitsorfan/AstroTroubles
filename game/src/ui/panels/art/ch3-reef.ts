/** Chapter 3 panels for Scylla's Reef: Scylla on her rock above Charybdis, and the Argo sailing through the calm strait. */
import { argoShip, at, atalanta, backdrop, C, cloud, glow, glowDef, ink, iris, jason, lin, lux, panel, rad, ridge, sparkle, vignette } from '../kit';
import * as gn from '../gn';

const GOLD = '#ffc94a';
const GOLD_DARK = '#c8901e';
const ROCK = '#6e625c';
const ROCK_DARK = '#4a403c';

/** The bright tropical sky with a few puffy clouds and a far hazy island. */
function sky(id: string): string {
  return (
    backdrop(id + 'b', [
      [0, '#2a8ad8'],
      [0.55, '#8fd0f4'],
      [1, '#e6f8ff'],
    ]) +
    cloud(250, 150, 1.1, '#ffffff', 0.9) +
    cloud(1250, 110, 0.8, '#ffffff', 0.85) +
    cloud(760, 210, 0.6, '#ffffff', 0.7) +
    ridge(31, 470, 30, '#7aa6bc', 5, 980, 1640)
  );
}

/** The sea from height y down: turquoise, darker far away, with sparkling ripple lines. */
function sea(id: string, y: number): string {
  let ripples = '';
  for (let i = 0; i < 16; i++) {
    const rx = (i * 263) % 1600;
    const ry = y + 30 + ((i * 97) % (900 - y - 40));
    ripples += `<path d="M${rx - 40} ${ry}q20 -10 40 0t40 0" fill="none" stroke="#e6fbff" stroke-width="4" opacity=".6" stroke-linecap="round"/>`;
  }
  return `<defs>${lin(id + 's', [[0, '#3fb0d0'], [0.4, '#2ac0d0'], [1, '#7fe6e0']])}</defs><path d="M0 ${y}H1600V900H0Z" fill="url(#${id}s)"/>${ripples}`;
}

/** The great rock of the strait: a tall, craggy stack rising out of the sea, foam at its foot. */
function bigRock(x: number, y: number, s: number): string {
  const body = `<path d="M-260 0L-230 -180L-180 -260L-150 -420L-60 -470L40 -450L130 -400L170 -260L230 -170L270 0Z" fill="${ROCK}" ${ink(6)}/>
    <path d="M-150 -420L-120 -300L-170 -150M40 -450L60 -330L20 -200M130 -400L110 -280L160 -150" fill="none" stroke="${ROCK_DARK}" stroke-width="10" stroke-linecap="round"/>
    <path d="M-60 -470L40 -450L130 -400L60 -420Z" fill="#8a7e76"/>
    <path d="M-280 4Q0 -30 290 4" fill="none" stroke="#f4fdff" stroke-width="16" stroke-linecap="round"/>`;
  return at(x, y, s, body);
}

/** SCYLLA on top of the rock: a gold turret, a tall neck, a cab with one big red eye, and six crane arms. */
function scylla(id: string, x: number, y: number, s: number, folded = false): string {
  const defs = `<defs>${glowDef(id + 'e', '#ff3a4c', 0.8)}${glowDef(id + 'j', C.cyan, 0.7)}</defs>`;
  let arms = '';
  for (let i = 0; i < 6; i++) {
    const side = i < 3 ? -1 : 1;
    const k = i % 3;
    const sx = side * 60;
    const sy = -250 + k * 20;
    // Raised: the elbows high and the claws out wide; folded: everything hangs down, tucked in.
    const ex = folded ? side * (90 + k * 20) : side * (170 + k * 70);
    const ey = folded ? -170 + k * 30 : -360 + k * 50;
    const cx = folded ? side * (110 + k * 26) : side * (260 + k * 90);
    const cy = folded ? -40 + k * 20 : -230 + k * 90;
    arms += `<path d="M${sx} ${sy}L${ex} ${ey}" stroke="${GOLD}" stroke-width="26" stroke-linecap="round" ${ink(5)}/><path d="M${sx} ${sy}L${ex} ${ey}" stroke="${GOLD}" stroke-width="18" stroke-linecap="round"/>`;
    arms += `<path d="M${ex} ${ey}L${cx} ${cy}" stroke="#8a5a2a" stroke-width="18" stroke-linecap="round"/>`;
    if (!folded) arms += `${glow(id + 'j', ex, ey, 34, 0.8)}`;
    arms += `<circle cx="${ex}" cy="${ey}" r="16" fill="${folded ? '#6a7a80' : '#bff4ff'}" ${ink(4)}/>`;
    // The claw: a gold wrist with two little red eyes, and three fingers.
    const claw = `<rect x="-24" y="-20" width="48" height="34" rx="8" fill="${GOLD}" ${ink(4)}/>
      <circle cx="-9" cy="-6" r="5" fill="${folded ? '#5a2a2a' : '#ff3a4c'}"/><circle cx="9" cy="-6" r="5" fill="${folded ? '#5a2a2a' : '#ff3a4c'}"/>
      <path d="M-18 14L-26 ${folded ? 40 : 52}M0 14V${folded ? 44 : 58}M18 14L26 ${folded ? 40 : 52}" stroke="#3a2c22" stroke-width="9" stroke-linecap="round"/>`;
    arms += at(cx, cy, 1, claw);
  }
  const body = `<ellipse cx="0" cy="-10" rx="110" ry="34" fill="#6a4a2a" ${ink(5)}/><rect x="-100" y="-56" width="200" height="46" rx="10" fill="${GOLD}" ${ink(5)}/>
    <rect x="-34" y="-230" width="68" height="180" fill="#8a5a2a" ${ink(5)}/>
    <path d="M-34 -190H34M-34 -150H34M-34 -110H34" stroke="${GOLD}" stroke-width="8"/>
    ${arms}
    <g transform="rotate(${folded ? 14 : 0} 0 -270)"><rect x="-90" y="-320" width="180" height="96" rx="18" fill="${GOLD}" ${ink(6)}/>
    <rect x="-96" y="-330" width="192" height="18" rx="6" fill="#3a2c22" ${ink(3)}/>
    ${folded ? '' : glow(id + 'e', 0, -268, 60, 0.9)}<circle cx="0" cy="-268" r="28" fill="#1a1418" ${ink(4)}/><circle cx="0" cy="-268" r="16" fill="${folded ? '#5a2a2a' : '#ff3a4c'}"/>
    ${folded ? `<path d="M-14 -268h28" stroke="#ff8a8a" stroke-width="5" stroke-linecap="round"/>` : ''}
    <circle cx="-74" cy="-340" r="12" fill="#fff2b0" ${ink(3)}/><circle cx="74" cy="-340" r="12" fill="#fff2b0" ${ink(3)}/></g>`;
  return defs + at(x, y, s, body);
}

/** CHARYBDIS: a great spiral of foam in a dark swirl of sea (calm = a small, gentle one). */
function whirlpool(id: string, x: number, y: number, s: number, calm = false): string {
  const defs = `<defs>${rad(id + 'w', [[0, '#04263a'], [0.6, '#0e5a7a'], [1, '#2ac0d0']])}</defs>`;
  let arms = '';
  const n = calm ? 3 : 5;
  for (let a = 0; a < n; a++) {
    let d = '';
    for (let i = 0; i <= 30; i++) {
      const k = i / 30;
      const ang = (a / n) * Math.PI * 2 + k * Math.PI * 2.2;
      const r = 10 + k * 190;
      d += `${i ? 'L' : 'M'}${Math.round(Math.cos(ang) * r)} ${Math.round(Math.sin(ang) * r * 0.32)}`;
    }
    arms += `<path d="${d}" fill="none" stroke="#e6fbff" stroke-width="${calm ? 5 : 8}" stroke-linecap="round" opacity=".85"/>`;
  }
  const body = `<ellipse cx="0" cy="0" rx="210" ry="68" fill="url(#${id}w)" ${ink(5)}/>${arms}`;
  return defs + at(x, y, s, body);
}

/** 26. The Argo sails through the calm strait past Scylla, her arms folded; the heroes wave from the pier. */
export function ch3Strait(): string {
  const id = 'ch3-strait';
  const fish = [
    [380, 560],
    [430, 590],
    [880, 640],
  ]
    .map(([fx, fy], i) => at(fx, fy, 1, `<path d="M0 0Q20 -18 40 0Q20 18 0 0ZM40 0l16 -12v24z" fill="${i % 2 ? '#ffb347' : '#ff7a8a'}" ${ink(3)}/>`, i % 2 === 1, -20))
    .join('');
  return panel(
    sky(id) +
      `<defs>${glowDef(id + 'g', '#fff4c0', 0.7)}</defs>` +
      glow(id + 'g', 1400, 150, 140, 0.9) +
      `<circle cx="1400" cy="150" r="60" fill="#fffbe8"/>` +
      sea(id, 480) +
      whirlpool(id + 'c', 300, 640, 0.5, true) +
      bigRock(1260, 640, 0.9) +
      scylla(id + 's', 1260, 230, 0.56, true) +
      argoShip(id + 'a', 720, 560, 0.62, -2) +
      fish +
      // The heroes on the pier, waving.
      `<path d="M820 900V780H1160V900Z" fill="#b0835a" ${ink(5)}/><path d="M840 780V900M900 780V900M960 780V900M1020 780V900M1080 780V900" stroke="#7a5636" stroke-width="5"/>` +
      jason(920, 800, 0.8, { pose: 'wave', face: 'grin' }) +
      atalanta(1060, 800, 0.8, { pose: 'cheer', face: 'happy' }) +
      lux(860, 600, 0.55, 'happy') +
      iris(1140, 610, 0.55, 'happy') +
      sparkle(560, 420, 12, '#fff') +
      sparkle(860, 380, 9, GOLD) +
      sparkle(300, 600, 8, '#fff') +
      vignette(id + 'v', 0.25, GOLD_DARK),
  );
}

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
