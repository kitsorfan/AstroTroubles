/** Chapter 1 panels, part 2: Jason wakes up, meets LUX, and finds the Heart in front of the star. */
import { backdrop, C, gascuHeart, glow, glowDef, ink, jason, lin, lux, panel, rad, sparkle, stars, vignette } from '../kit';
import * as gn from '../gn';
import * as c1 from '../gn/ch1';

/* ---------------- 4. The cryo wake-up ---------------- */

/** Soft rolling cryo mist: overlapping white glows along a line, with a few curling wisps. */
function mistGN(pen: gn.Pen, pts: [number, number, number][], op = 0.6, seed = 1): string {
  const rand = gn.rng(seed);
  let out = '';
  const wisps: [gn.P[], number][] = [];
  for (const [x, y, s] of pts) {
    out += pen.glow(x, y, 220 * s, '#e8f8ff', op, 60 * s) + pen.glow(x + 60 * s, y - 30 * s, 130 * s, '#ffffff', op * 0.7, 46 * s);
    const w = 90 * s * (0.7 + rand() * 0.6);
    wisps.push([
      [
        [x - w, y + 6],
        [x - w * 0.3, y - 18 * s],
        [x + w * 0.4, y - 6 * s],
        [x + w * 0.2, y - 30 * s],
      ],
      5 * s,
    ]);
  }
  return out + pen.brushes(wisps, '#ffffff', [0.3, 0.6], op * 0.7);
}

/** The cryo deck behind: a dark hall, ceiling ribs with light strips, and a long row of pods along the far wall, GaScu's vines creeping in. */
function cryoHall(pen: gn.Pen): string {
  const far = pen.relight({ depth: 0.75 });
  let out = gn.sky(pen, [
    [0, '#050c18'],
    [0.45, '#0c2236'],
    [0.7, '#123048'],
    [1, '#081422'],
  ]);
  // Ceiling ribs converging toward the far end of the hall (top right).
  const ribs: [gn.P[], number][] = [];
  for (let i = 0; i < 7; i++) {
    const x = -60 + i * 290;
    ribs.push([
      [
        [x, -40],
        [x + 60, 120],
        [x + 90, 220],
      ],
      40 - i * 3,
    ]);
  }
  out += pen.brushes(ribs, '#0a1626', [0.02, 0.02]);
  out += pen.brushes(
    ribs.map(([p, w]) => [p.map((q) => gn.add(q, [w * 0.35, 0])), 4] as [gn.P[], number]),
    '#7fe6ff',
    [0.1, 0.1],
    0.5,
  );
  // The far wall's light strip.
  out += pen.form('M-80 222H1680V236H-80Z', '#7fe6ff', { line: 0, warm: 0 }) + gn.haze(pen, 170, 290, '#7fe6ff', 0.25);
  // The row of pods along the far wall: small, hazy, lit from inside.
  for (let i = 0; i < 9; i++) {
    const x = 20 + i * 196;
    out += c1.pod(far, x, 600, 0.6, { frost: 0.9, line: 2, lamp: i % 3 === 1 ? '#ff6fcf' : '#7dff9a' });
  }
  // A GaScu vine has crept along the wall above them, glowing pink, a bud or two on it.
  out += c1.vine(
    far,
    [
      [1700, 300],
      [1500, 250],
      [1340, 310],
      [1150, 262],
      [980, 300],
      [860, 270],
    ],
    14,
    { leaves: 4, buds: 6, curls: 6, seed: 4 },
  );
  out += c1.vine(
    far,
    [
      [1340, 312],
      [1300, 420],
      [1346, 520],
      [1310, 600],
    ],
    10,
    { leaves: 3, buds: 0, curls: 0, seed: 5 },
  );
  out += gn.haze(pen, 300, 640, '#16405a', 0.55);
  // The floor: dark plates, their seams running toward us.
  let seams = '';
  for (let i = -6; i <= 10; i++) seams += `M${800 + i * 110} 600L${800 + i * 330} 960`;
  out += pen.form('M-80 600H1680V960H-80Z', '#0e2234', { line: 0, inner: `<path d="${seams}M-80 680H1680M-80 800H1680" stroke="#1c4058" stroke-width="3" fill="none"/>` });
  out += pen.form('M-80 596H1680V606H-80Z', '#2f5a7a', { line: 0 });
  return out;
}

/** 4. On the Cryo Deck, one pod has opened under its wake-up lamp: Jason sits up in the cold mist, yawning, rubbing an eye. */
export function ch1Wake(): string {
  const pen = gn.Pen.scene('ch1-wake', { key: [-0.5, -0.85], keyColor: '#fff0d0', rim: [0.95, -0.2], rimColor: '#7fe6ff', shadow: '#2e3a80', depth: 0.6 });
  const lampX = 720;
  const back = cryoHall(pen);
  // Two closed pods nearby on the right, with colonists still asleep in them.
  const mid =
    c1.pod(pen.relight({ depth: 0.7 }), 1330, 700, 0.88, { look: c1.COLONISTS[2], frost: 0.6 }) +
    c1.pod(pen.relight({ depth: 0.7 }), 1560, 760, 1.0, { look: c1.COLONISTS[1], frost: 0.5 }) +
    c1.vine(
      pen,
      [
        [1700, 640],
        [1600, 700],
        [1470, 690],
        [1420, 600],
        [1460, 470],
      ],
      16,
      { leaves: 3, buds: 5, seed: 7 },
    ) +
    gn.haze(pen, 560, 760, '#16405a', 0.5);
  // The pod Jason is in: a white tub, its opening glowing cyan, its glass lid raised behind him.
  const tubC: gn.P = [760, 660];
// The glass lid, flipped up on its pistons behind him: we look into its frosted bowl, framed by its white rim.
  const lidC: gn.P = [760, 404];
  const piston = (a: gn.P, b: gn.P) => {
    const m = gn.lerp(a, b, 0.55);
    return (
      pen.brush([a, m], 30, gn.INK, [0.02, 0.02]) +
      pen.brush([a, m], 21, '#4a5468', [0.02, 0.02]) +
      pen.brush(
        [a, m].map((p) => gn.add(p, [-5, 0]) as gn.P),
        5,
        '#8a96ac',
        [0.1, 0.1],
      ) +
      pen.brush([gn.lerp(a, b, 0.5), b], 15, gn.INK, [0.02, 0.02]) +
      pen.brush([gn.lerp(a, b, 0.5), b], 8, '#e8eef6', [0.02, 0.02]) +
      pen.form(c1.circleD(b[0], b[1], 14), '#9aa6ba', { sh: 6, line: 2.6, rim: 1.4 }) +
      pen.form(c1.circleD(a[0], a[1], 16), '#5a6274', { sh: 6, line: 2.6 })
    );
  };
  const rand = gn.rng(12);
  const frost: [gn.P[], number][] = [];
  for (let i = 0; i < 26; i++) {
    const a = rand() * Math.PI * 2;
    const p: gn.P = [lidC[0] + Math.cos(a) * 380, lidC[1] + Math.sin(a) * 172];
    const q = gn.lerp(p, lidC, 0.08 + rand() * 0.1);
    frost.push([[p, gn.add(q, [(rand() - 0.5) * 30, (rand() - 0.5) * 20])], 2.6]);
  }
  const lid =
    pen.form(c1.ellipseD(lidC[0], lidC[1], 410, 194), '#bfefff', {
      line: 0,
      warm: 0,
      paint: pen.rad([
        [0, '#dff6ff', 0.05],
        [0.65, '#cfefff', 0.2],
        [1, '#ffffff', 0.62],
      ]),
      inner:
        pen.brushes(frost, '#ffffff', [0.1, 0.7], 0.75) +
        pen.brush(
          [
            [430, 470],
            [470, 320],
            [600, 250],
          ],
          16,
          '#ffffff',
          [0.3, 0.4],
          0.5,
        ) +
        pen.brush(
          [
            [1090, 340],
            [1110, 420],
            [1070, 500],
          ],
          9,
          '#ffffff',
          [0.3, 0.4],
          0.4,
        ),
    }) +
    pen.form(c1.ringD(lidC[0], lidC[1], 430, 212, 30), '#e8eef6', {
      sh: 18,
      hatch: 1,
      rim: 2,
      line: 3,
      inner: `<ellipse cx="${lidC[0]}" cy="${lidC[1]}" rx="404" ry="188" fill="none" stroke="#7fe6ff" stroke-width="5"/>` + [-150, -30, 30, 150].map((a) => `<circle cx="${gn.r1(lidC[0] + Math.cos((a * Math.PI) / 180) * 417)}" cy="${gn.r1(lidC[1] + Math.sin((a * Math.PI) / 180) * 200)}" r="4" fill="${gn.INK}" opacity=".6"/>`).join(''),
    }) +
    pen.glow(lidC[0], lidC[1] + 190, 380, '#7fe6ff', 0.6, 50) +
    piston([318, 700], [376, 470]) +
    piston([1202, 700], [1144, 470]);

  const rim = `M${tubC[0] - 440} ${tubC[1]}A440 56 0 0 1 ${tubC[0] + 440} ${tubC[1]}`;
  const hollow =
    pen.form(c1.ellipseD(tubC[0], tubC[1], 440, 56), '#0e3048', { line: 3, inner: pen.glow(tubC[0], tubC[1] + 20, 420, '#7fe6ff', 0.9, 60) }) +
    `<path d="${rim}" fill="none" stroke="#e8eef6" stroke-width="12"/><path d="${rim}" fill="none" stroke="${gn.INK}" stroke-width="3"/>`;
  const pose: gn.Pose = {
    turn: 0.18,
    lean: 5,
    tilt: -9,
    armN: { to: [-0.36, -0.5], bend: 1 },
    armF: [158, 230],
    legN: { to: [0.99, 0.05] },
    legF: { to: [0.99, 0.08] },
    handN: 'fist',
    handF: 'fist',
    wristN: -20,
  };
  const s = 1.5;
  const r = gn.rig(gn.TEEN_BOY, pose);
  const jx = 760;
  const jy = 770 - r.P[1] * s;
  const hero = c1.jasonWith(pen, jx, jy, s, { pose, mood: 'asleep', blaster: false, rim: 1.4 }, (hp) => c1.yawn(hp, pose.turn ?? 0.4));
  // The front of the tub: brushed metal, a cyan light strip under the lip, a control panel, frost.
  const front =
    pen.form(`M${tubC[0] - 446} ${tubC[1]}A446 62 0 0 0 ${tubC[0] + 446} ${tubC[1]}L1150 960H370Z`, '#c9d1dc', {
      sh: 40,
      hatch: 1,
      line: 3.4,
      rim: 2.4,
      paint: pen.lin(
        [
          [0, '#f2f5fa'],
          [0.5, '#c9d1dc'],
          [1, '#8a94a8'],
        ],
        0,
        0,
        0,
        1,
      ),
      inner:
        `<path d="M${tubC[0] - 430} ${tubC[1] + 34}Q${tubC[0]} ${tubC[1] + 110} ${tubC[0] + 430} ${tubC[1] + 34}" fill="none" stroke="${gn.INK}" stroke-width="3" opacity=".5"/>` +
        pen.brush(
          [
            [tubC[0] - 420, tubC[1] + 24],
            [tubC[0], tubC[1] + 96],
            [tubC[0] + 420, tubC[1] + 24],
          ],
          9,
          '#7fe6ff',
          [0.05, 0.05],
        ) +
        pen.brush(
          [
            [tubC[0] - 420, tubC[1] + 24],
            [tubC[0], tubC[1] + 96],
            [tubC[0] + 420, tubC[1] + 24],
          ],
          3,
          '#ffffff',
          [0.05, 0.05],
          0.8,
        ) +
        pen.glow(tubC[0], tubC[1] + 90, 440, '#7fe6ff', 0.35, 40) +
        pen.brush(
          [
            [420, 760],
            [560, 800],
            [640, 790],
          ],
          10,
          '#ffffff',
          [0.3, 0.5],
          0.35,
        ),
    }) +
    pen.form('M650 780H870L862 850H658Z', '#1b2330', {
      line: 2.6,
      sh: 8,
      inner: [
        [690, '#7dff9a'],
        [740, '#ffd166'],
        [790, '#7fe6ff'],
      ]
        .map(([cx, c]) => pen.glow(+cx, 812, 22, c as string, 0.8) + `<circle cx="${cx}" cy="812" r="9" fill="${c}"/>`)
        .join(''),
    }) +
    // A name plate with the pod's number in light-bars, and frost along the lip.
    pen.form('M430 770H580L576 806H434Z', '#2a3448', { line: 2.4, sh: 6, inner: `<path d="M448 788H486M498 788H512M524 788H560" stroke="#7fe6ff" stroke-width="6" opacity=".8"/>` }) +
    pen.brushes(
      Array.from({ length: 14 }, (_, i): [gn.P[], number] => {
        const x = 360 + i * 60 + (i % 3) * 9;
        const t = (x - tubC[0]) / 446;
        const y = tubC[1] + 62 * Math.sqrt(Math.max(0, 1 - t * t));
        return [
          [
            [x, y + 2],
            [x + 6 - (i % 2) * 12, y + 14 + (i % 4) * 6],
          ],
          3.2,
        ];
      }),
      '#ffffff',
      [0.1, 0.7],
      0.8,
    );
  const light =
    gn.godRays(pen, lampX, -80, [-12, -6, 0, 5, 11], 6, 900, '#fff4d8', 0.3) +
    pen.form('M600 -20H840L812 40H628Z', '#2a3a4e', { line: 3, sh: 10 }) +
    gn.bloom(pen, lampX, 44, 70, '#fff4d8', 0.9);
  const fore = mistGN(
    pen,
    [
      [330, 700, 0.9],
      [1180, 700, 0.9],
      [470, 730, 0.8],
      [1060, 736, 0.8],
      [200, 860, 1.4],
      [1400, 860, 1.4],
      [760, 900, 1.6],
    ],
    0.5,
    3,
  );
  // Cold mist spilling over the front lip of the tub and pooling on the floor.
  const spill = pen.brushes(
    [
      [
        [
          [430, 700],
          [420, 760],
          [380, 820],
        ],
        36,
      ],
      [
        [
          [620, 724],
          [630, 790],
          [600, 860],
        ],
        30,
      ],
      [
        [
          [930, 722],
          [922, 800],
          [960, 860],
        ],
        32,
      ],
      [
        [
          [1100, 700],
          [1112, 770],
          [1150, 830],
        ],
        30,
      ],
    ],
    '#eaf8ff',
    [0.1, 0.9],
    0.32,
  );
  return pen.svg(
    gn.layer(0.2, back) +
      gn.layer(0.55, mid) +
      gn.layer(1, light + lid + hollow + hero + front + mistGN(pen, [[760, 676, 1.1]], 0.35, 2)) +
      gn.layer(1.3, spill + fore) +
      gn.vignette(pen, 0.6, '#020814') +
      gn.grain(pen, 0.08),
  );
}


/* ---------------- 5. LUX in the storeroom ---------------- */

/**
 * A cargo crate seen a little from above and from the left: the front face (`w` x `h`, bottom-left at
 * x, y), the left side face `d` deep and the top. `lit` = how strongly the flashlight catches it.
 */
function crateGN(pen: gn.Pen, x: number, y: number, w: number, h: number, d: number, color: string, lit = 0.5, stripe?: string): string {
  const dx = -d * 0.62;
  const dy = -d * 0.36;
  const side = gn.dPoly([
    [x, y - h],
    [x + dx, y - h + dy],
    [x + dx, y + dy],
    [x, y],
  ]);
  const top = gn.dPoly([
    [x, y - h],
    [x + dx, y - h + dy],
    [x + w + dx, y - h + dy],
    [x + w, y - h],
  ]);
  const front = `M${x} ${y - h}H${x + w}V${y}H${x}Z`;
  let planks = '';
  for (let k = 1; k < 4; k++) planks += `M${x} ${gn.r1(y - (h * k) / 4)}H${x + w}`;
  const metal = '#9aa6ba';
  const corner = (cx: number, cy: number, sx: number, sy: number) => `M${cx} ${cy + sy * 34}V${cy}H${cx + sx * 34}`;
  const corners = `<path d="${corner(x + 4, y - h + 4, 1, 1)}${corner(x + w - 4, y - h + 4, -1, 1)}${corner(x + 4, y - 4, 1, -1)}${corner(x + w - 4, y - 4, -1, -1)}" fill="none" stroke="${gn.INK}" stroke-width="14"/><path d="${corner(x + 4, y - h + 4, 1, 1)}${corner(x + w - 4, y - h + 4, -1, 1)}${corner(x + 4, y - 4, 1, -1)}${corner(x + w - 4, y - 4, -1, -1)}" fill="none" stroke="${metal}" stroke-width="8"/>`;
  const marks = stripe
    ? `<path d="M${x + w * 0.3} ${y - h * 0.62}H${x + w * 0.7}V${y - h * 0.46}H${x + w * 0.3}Z" fill="${stripe}"/><path d="M${x + w * 0.36} ${y - h * 0.46}l16 -${gn.r1(h * 0.16)}M${x + w * 0.48} ${y - h * 0.46}l16 -${gn.r1(h * 0.16)}M${x + w * 0.6} ${y - h * 0.46}l16 -${gn.r1(h * 0.16)}" stroke="${gn.INK}" stroke-width="7"/>`
    : '';
  const scuffs = pen.brushes(
    [
      [
        [
          [x + w * 0.2, y - h * 0.84],
          [x + w * 0.34, y - h * 0.8],
        ],
        3,
      ],
      [
        [
          [x + w * 0.62, y - h * 0.3],
          [x + w * 0.8, y - h * 0.34],
        ],
        3,
      ],
    ],
    gn.INK,
    [0.3, 0.3],
    0.4,
  );
  const litSide = gn.mix(color, '#ffe6b0', lit * 0.55);
  return (
    pen.form(side, litSide, { line: 3, inner: `<path d="M${x + dx * 0.5} ${y - h + dy * 0.5}V${y + dy * 0.5}" stroke="${gn.INK}" stroke-width="3" opacity=".35"/>` + pen.brush([[x - 4, y - h + 6], [x - 4, y - 6]], 5, '#fff2d0', [0.1, 0.1], lit * 0.8) }) +
    pen.form(top, gn.mix(color, '#ffe6b0', lit * 0.25), { line: 3 }) +
    pen.form(front, color, {
      sh: 0,
      line: 3.2,
      paint: pen.lin([
        [0, gn.mix(color, '#ffd890', lit * 0.3)],
        [1, pen.dark(color, 0.5)],
      ], 0, 0, 1, 0.3),
      inner: `<path d="${planks}" stroke="${gn.INK}" stroke-width="3" opacity=".4"/>` + marks + scuffs + corners,
    })
  );
}

/** 5. A dark storeroom: Jason kneels with his flashlight and holds out a hand; LUX peeks out from behind the crates, his eye just lighting up. */
export function ch1Lux(): string {
  const pen = gn.Pen.scene('ch1-lux', { key: [-0.9, -0.3], keyColor: '#ffd890', rim: [0.8, -0.5], rimColor: '#7fe6ff', shadow: '#2a2050', depth: 0.75 });
  // Jason is lit by the light bouncing back off the crates, and rimmed blue by the corridor behind him.
  const jPen = pen.relight({ key: [0.8, -0.45], keyColor: '#ffc880', rim: [-0.9, -0.3], rimColor: '#7aa8ff', depth: 0.65 });
  const back =
    gn.sky(pen, [
      [0, '#0a0716'],
      [0.6, '#151028'],
      [1, '#0a0716'],
    ]) +
    // The open door far behind: a frame, the half-open sliding door, and blue corridor light spilling in.
    pen.form('M70 150H290V650H70Z', '#8ab4ff', { line: 3, warm: 0, paint: pen.lin([[0, '#e0f0ff'], [0.6, '#7aa0e8'], [1, '#3a5ab0']]) }) +
    pen.form('M50 130H310V650H290V150H70V650H50Z', '#2a2840', { line: 3, sh: 8 }) +
    pen.form('M70 170H150V650H70Z', '#3a3a58', { line: 2.6, sh: 20, inner: `<path d="M92 300H128M92 330H128" stroke="#7aa8ff" stroke-width="4"/>` }) +
    `<path d="M150 650L290 650L640 900L-40 900Z" fill="${pen.lin([[0, '#7aa0ff', 0.35], [1, '#7aa0ff', 0]])}"/>` +
    gn.godRays(pen, 220, 260, [25, 40, 55], 8, 800, '#9ab8ff', 0.18);
  // Tall racks of boxes fading into the dark.
  let shelves = '';
  for (let i = 0; i < 3; i++) {
    const y = 250 + i * 150;
    for (let j = 0; j < 7; j++) {
      const bx = 380 + j * 190 + (i % 2) * 50;
      const bw = 90 + ((i + j) % 3) * 28;
      const bh = 56 + ((i * 3 + j) % 4) * 18;
      shelves += pen.form(`M${bx} ${y - bh}H${bx + bw}V${y}H${bx}Z`, ['#2a2244', '#242a46', '#2e243c'][(i + j) % 3], { line: 1.6, sh: bw * 0.3, hatch: 1 });
    }
    shelves += pen.form(`M340 ${y}H1680V${y + 14}H340Z`, '#3a3458', { line: 1.8, sh: 5 });
  }
  for (const ux of [350, 1010]) shelves += pen.form(`M${ux} 80H${ux + 18}V700H${ux}Z`, '#2a2440', { line: 1.8, sh: 6 });
  // A vent with GaScu's vine curling out of it, glowing.
  const vent =
    pen.form('M1240 70H1420V160H1240Z', '#2a2a40', { line: 3, sh: 20, inner: `<path d="M1250 90H1410M1250 110H1410M1250 130H1410M1250 150H1410" stroke="${gn.INK}" stroke-width="6"/>` }) +
    c1.vine(
      pen,
      [
        [1300, 140],
        [1270, 210],
        [1330, 270],
        [1300, 340],
      ],
      12,
      { leaves: 3, buds: 4, seed: 9 },
    ) +
    c1.vine(
      pen,
      [
        [1390, 140],
        [1460, 190],
        [1540, 170],
        [1640, 230],
      ],
      10,
      { leaves: 3, buds: 6, seed: 10 },
    );
  const far = shelves + vent + gn.haze(pen, 480, 800, '#140e26', 0.75);
  const pose: gn.Pose = {
    turn: 0.5,
    lean: 12,
    tilt: 2,
    armN: [56, 82],
    armF: [100, 110],
    legN: { to: [0.34, 0.62] },
    legF: { to: [-0.34, 0.72] },
    handN: 'grip',
    handF: 'open',
    wristF: -30,
    footF: 60,
  };
  const s = 1.34;
  const jx = 330;
  const jy = 884;
  const r = gn.rig(gn.TEEN_BOY, pose);
  const wr = r.wr[0];
  const fd = gn.dir(r.foreA[0]);
  const hand: gn.P = [jx + (wr[0] + fd[0] * 30) * s, jy + (wr[1] + fd[1] * 30) * s];
  // LUX, where the beam points.
  const luxX = 1070;
  const luxY = 446;
  const aim = gn.unit(gn.sub([luxX - 40, luxY + 90], hand));
  const aimDeg = (Math.atan2(aim[1], aim[0]) * 180) / Math.PI;
  const torchHead = gn.add(hand, gn.mul(aim, 64));
  const torch =
    gn.at(
      hand[0],
      hand[1],
      1,
      pen.local(false, aimDeg).form('M-30 -12H40L54 -19V19L40 12H-30Z', '#4a5468', { sh: 9, line: 2.6, rim: 1.6, inner: `<path d="M-16 -12V12M-4 -12V12" stroke="${gn.INK}" stroke-width="2.4" opacity=".6"/>` }) +
        pen.local(false, aimDeg).form('M52 -19Q60 0 52 19', '#fff6d8', { line: 2 }),
      false,
      aimDeg,
    ) + gn.bloom(pen, torchHead[0], torchHead[1], 34, '#fff2c0', 1);
  // The beam: warm, widening toward the crates, full of floating dust.
  const beamLen = 1000;
  const n = gn.perp(aim);
  const end = gn.add(torchHead, gn.mul(aim, beamLen));
  const beamD = gn.dPoly([gn.add(torchHead, gn.mul(n, 14)), gn.add(end, gn.mul(n, 300)), gn.add(end, gn.mul(n, -280)), gn.add(torchHead, gn.mul(n, -14))]);
  const beamPaint = (op: number) =>
    pen.lin(
      [
        [0, '#fff6d0', op],
        [0.55, '#ffd890', op * 0.45],
        [1, '#ffd890', 0],
      ],
      gn.r1(torchHead[0]),
      gn.r1(torchHead[1]),
      gn.r1(end[0]),
      gn.r1(end[1]),
      true,
    );
  const coreD = gn.dPoly([gn.add(torchHead, gn.mul(n, 6)), gn.add(end, gn.mul(n, 110)), gn.add(end, gn.mul(n, -100)), gn.add(torchHead, gn.mul(n, -6))]);
  const rand = gn.rng(21);
  let motes = '';
  for (let i = 0; i < 46; i++) {
    const t = 0.08 + rand() * 0.7;
    const p = gn.add(gn.add(torchHead, gn.mul(aim, beamLen * t)), gn.mul(n, (rand() - 0.5) * 520 * t));
    motes += `M${gn.r1(p[0])} ${gn.r1(p[1])}h0`;
  }
  const beam = `<path d="${beamD}" fill="${beamPaint(0.5)}"/><path d="${coreD}" fill="${beamPaint(0.55)}"/><path d="${motes}" stroke="#fff6d8" stroke-width="3.4" stroke-linecap="round" opacity=".75"/>`;
  // The crates LUX hides behind, lit where the beam lands, and LUX peeking over them, a loose wire sparking.
  const crates =
    crateGN(pen, 1190, 430, 300, 250, 120, '#5a5480', 0.35) +
    crateGN(pen, 1290, 880, 360, 450, 150, '#a8743c', 0.55, '#ffd166') +
    pen.glow(luxX, luxY, 190, '#7fe6ff', 0.6) +
    c1.luxWith(pen, luxX, luxY, 2.05, 'scared', { flip: true, look: [-10, 3] }) +
    gn.bloom(pen, luxX - 22, luxY - 4, 26, '#bff8ff', 0.7) +
    crateGN(pen, 860, 880, 420, 330, 150, '#56688a', 0.9) +
    pen.glow(1000, 640, 300, '#ffe0a0', 0.4, 150) +
    crateGN(pen, 640, 880, 200, 130, 90, '#2f7a7a', 0.9);
  const hero = gn.castShadow(jPen, 400, 880, 240, 18, 0.55) + gn.jason(jPen, jx, jy, s, { pose, mood: 'smile', look: [3, 0.5], rim: 2.2, blaster: false }) + torch;
  // A coil of cable on the floor in the near corner.
  const fore =
    pen.brush(
      [
        [-80, 820],
        [60, 800],
        [140, 860],
        [60, 920],
        [-60, 900],
      ],
      30,
      gn.INK,
      [0.02, 0.02],
    ) +
    pen.brush(
      [
        [-80, 820],
        [60, 800],
        [140, 860],
        [60, 920],
        [-60, 900],
      ],
      18,
      '#3a3450',
      [0.02, 0.02],
    ) +
    pen.brush(
      [
        [-60, 812],
        [56, 794],
        [130, 846],
      ],
      4,
      '#7aa8ff',
      [0.2, 0.3],
      0.6,
    );
  return pen.svg(gn.layer(0.2, back) + gn.layer(0.5, far) + gn.layer(1, crates + beam + hero) + gn.layer(1.3, fore) + gn.vignette(pen, 0.6, '#05030c') + gn.grain(pen, 0.08));
}


/** 6. The Bridge: the huge Heart of GaScu before a giant window full of a burning star. */
export function ch1Heart(): string {
  const id = 'ch1-heart';
  const mullions = [400, 800, 1200].map((x) => `<path d="M${x} 40V680" stroke="#1a1630" stroke-width="22"/>`).join('');
  return panel(
    backdrop(id + 'b', [[0, '#3a0e10'], [1, '#120608']]) +
      `<defs>${rad(id + 's', [[0, '#fffbe0'], [0.25, '#ffe08a'], [0.5, '#ff8a3d'], [0.8, '#ff4a1a', 0.6], [1, '#ff4a1a', 0]])}
      <clipPath id="${id}w"><rect x="80" y="40" width="1440" height="640" rx="70"/></clipPath>${glowDef(id + 'o', C.orange, 0.5)}</defs>
      <g clip-path="url(#${id}w)"><rect x="80" y="40" width="1440" height="640" fill="#4a1408"/>${stars(5, 40, 80, 40, 1440, 640, '#ffd8b0')}
      <circle cx="1180" cy="300" r="720" fill="url(#${id}s)"/>
      <path d="M700 120Q900 60 1100 140M560 480Q760 560 980 500" fill="none" stroke="#ffd166" stroke-width="14" opacity=".35" stroke-linecap="round"/></g>
      ${mullions}<rect x="80" y="40" width="1440" height="640" rx="70" fill="none" stroke="#2a2440" stroke-width="40"/><rect x="60" y="20" width="1480" height="680" rx="86" fill="none" ${ink(8)}/>` +
      `<path d="M0 680H1600V900H0Z" fill="#1a1020"/><path d="M0 680H1600" stroke="#ff8a3d" stroke-width="6" opacity=".6"/>
      <path d="M60 900L220 760H520L600 900ZM1000 900L1080 760H1380L1540 900Z" fill="#2a1a30" ${ink(5)}/><path d="M250 790H490M1110 790H1350" stroke="${C.cyan}" stroke-width="8" opacity=".6"/>` +
      glow(id + 'o', 800, 760, 800, 0.6, 140) +
      gascuHeart(id + 'h', 800, 380, 1.08) +
      jason(300, 870, 0.55, { pose: 'shock', face: 'shock' }) +
      lux(390, 700, 0.6, 'scared') +
      vignette(id + 'v', 0.45),
  );
}

