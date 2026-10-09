/** Chapter 1 panels, part 1: the ship in the nebula, the comet, and the vines growing on board. */
import * as gn from '../gn';
import * as c1 from '../gn/ch1';

/* ---------------- 1. The ship in the nebula ---------------- */

/** Deep space with a nebula: the gradient, glowing clouds of gas with dark dust lanes, and stars. */
function spaceGN(pen: gn.Pen, seed: number, clouds: [number, number, number, string[]][]): string {
  return (
    gn.sky(pen, [
      [0, '#05081e'],
      [0.55, '#120e3a'],
      [1, '#1a0c30'],
    ]) +
    clouds.map(([x, y, r, cols], i) => gn.nebula(pen, x, y, r, cols, seed + i, 0.7)).join('') +
    gn.starfield(pen, seed, 170, -80, -60, 1760, 1020, '#f4f6ff')
  );
}

/**
 * A comic inset: a framed window (x, y, w, h) with its own picture inside, clipped, under a white border.
 * `body` is drawn in panel coordinates.
 */
function inset(pen: gn.Pen, x: number, y: number, w: number, h: number, body: string): string {
  const id = pen.uid();
  const d = `M${x} ${y}H${x + w}V${y + h}H${x}Z`;
  pen.def(id, `<clipPath id="${id}"><path d="${d}"/></clipPath>`);
  return (
    `<path d="${d}" fill="${gn.INK}" transform="translate(10 12)" opacity=".5"/>` +
    `<g clip-path="url(#${id})">${body}</g>` +
    `<path d="${d}" fill="none" stroke="${gn.INK}" stroke-width="16"/><path d="${d}" fill="none" stroke="#f4f6ff" stroke-width="8"/>`
  );
}

/** 1. The SYRACUSIA cruises through a quiet nebula; in an inset, colonists sleep in their frosted pods while HALCYON's eye keeps watch. */
export function ch1Ship(): string {
  const pen = gn.Pen.scene('ch1-ship', { key: [-0.7, -0.6], keyColor: '#fff0e0', rim: [0.85, 0.45], rimColor: '#8fd8ff', shadow: '#2a2a70', depth: 0.6 });
  const sky =
    spaceGN(pen, 11, [
      [1180, 200, 620, ['#d080ff', '#8a4fff', '#3f3aa6']],
      [260, 620, 560, ['#7ac8ff', '#3f86d6', '#2a2a80']],
      [820, 460, 380, ['#ff8ad8', '#c04fa8']],
    ]) +
    gn.bloom(pen, 110, 90, 60, '#fff4e0', 0.9);
  // The ship, big and slow, sliding across the frame; a faint wake of light behind it.
  const ship = c1.syracusia(pen, 900, 330, 0.92, { rot: -5 });
  // The inset: inside the cryo deck, two colonists asleep in their pods, HALCYON's amber eye on the wall.
  const ix = 990;
  const iy = 396;
  const iw = 470;
  const ih = 320;
  const podPen = pen.relight({ key: [-0.4, -0.8], keyColor: '#e8fbff', rim: [0.9, -0.2], rimColor: '#7fe6ff', depth: 0.6 });
  const inside =
    `<path d="M${ix} ${iy}H${ix + iw}V${iy + ih}H${ix}Z" fill="${pen.lin([
      [0, '#16324c'],
      [1, '#0a1626'],
    ])}"/>` +
    pen.glow(ix + iw / 2, iy + 120, 260, '#7fe6ff', 0.4, 140) +
    c1.pod(podPen, ix + 120, iy + 420, 0.78, { look: c1.COLONISTS[0], frost: 0.4 }) +
    c1.pod(podPen, ix + 350, iy + 430, 0.78, { look: c1.COLONISTS[3], frost: 0.5 }) +
    // HALCYON's eye: an amber lens in a white housing, its light falling on the pods.
    pen.form(c1.circleD(ix + 236, iy + 60, 26), '#d8dee8', { sh: 10, line: 2.6, rim: 1.4 }) +
    pen.glow(ix + 236, iy + 60, 60, '#ffb040', 0.8) +
    `<circle cx="${ix + 236}" cy="${iy + 60}" r="12" fill="#ffb040" stroke="${gn.INK}" stroke-width="2.4"/><circle cx="${ix + 232}" cy="${iy + 56}" r="4" fill="#fff"/>`;
  // A dotted "cut-away" line from the inset up to the ship's habitat ring.
  const callout = `<path d="M${ix + 40} ${iy}L812 470" stroke="#f4f6ff" stroke-width="4" stroke-dasharray="10 10" opacity=".75"/><circle cx="812" cy="470" r="10" fill="none" stroke="#f4f6ff" stroke-width="4" opacity=".85"/>`;
  return pen.svg(
    gn.layer(0.15, sky) +
      gn.layer(0.6, ship) +
      gn.layer(1, callout + inset(pen, ix, iy, iw, ih, inside)) +
      gn.vignette(pen, 0.5, '#04040e') +
      gn.grain(pen, 0.08),
  );
}


/* ---------------- 2. The seed-comet ---------------- */

/** 2. Out of the dark, GaScu's seed streaks toward the ship like a pink comet, sprouts and all; the little SYRACUSIA flashes red. */
export function ch1Comet(): string {
  const pen = gn.Pen.scene('ch1-comet', { key: [-0.75, -0.55], keyColor: '#ffd6f2', rim: [0.8, 0.4], rimColor: '#8fd8ff', shadow: '#2a2060', depth: 0.6 });
  const deg = 27;
  const cx = 700;
  const cy = 380;
  const sky =
    gn.sky(pen, [
      [0, '#160a30'],
      [0.6, '#0a0c2a'],
      [1, '#05061a'],
    ]) +
    gn.nebula(pen, 260, 120, 560, ['#ff6fcf', '#a03a9a', '#3a1a6a'], 4, 0.55) +
    gn.nebula(pen, 1400, 820, 500, ['#3f86d6', '#2a2a80'], 6, 0.5) +
    gn.starfield(pen, 23, 150, -80, -60, 1760, 1020, '#f4f6ff');
  // Everything rushes past: focus lines on the seed and streaks along its path.
  const rush =
    gn.speedLines(cx, cy, 260, 1400, 46, 5, '#ffd6f2', 0.12) +
    gn.streaks(pen, 1500, 900, 180 + 90 - deg, 900, 9, 1400, '#cfe0ff', 0.25, 4);
  // The ship, small and far below, its hull lit pink by the coming seed, alarm lights flashing.
  const shipX = 1300;
  const shipY = 690;
  const alarm =
    pen.glow(shipX, shipY, 200, '#ff3a4c', 0.35) +
    pen.brushes(
      [
        [
          [
            [shipX - 30, shipY - 120],
            [shipX - 36, shipY - 170],
          ],
          9,
        ],
        [
          [
            [shipX + 60, shipY - 110],
            [shipX + 86, shipY - 150],
          ],
          9,
        ],
        [
          [
            [shipX - 120, shipY - 90],
            [shipX - 150, shipY - 126],
          ],
          9,
        ],
        [
          [
            [shipX + 150, shipY - 70],
            [shipX + 190, shipY - 90],
          ],
          9,
        ],
      ],
      '#ffffff',
      [0.2, 0.2],
      0.9,
    );
  const ship = c1.syracusia(pen.relight({ key: [-0.8, -0.5], keyColor: '#ffb0e0' }), shipX, shipY, 0.3, { rot: 4, line: 2 }) + alarm + pen.glow(shipX - 175, shipY - 30, 26, '#ff3a4c', 1) + pen.glow(shipX + 175, shipY + 6, 22, '#ff3a4c', 1);
  // The seed itself, big in the frame, and a few shards of ice breaking off it.
  const seed = c1.seedComet(pen, cx, cy, 1.35, deg, 1100);
  const shards = [
    [880, 300, 14],
    [940, 480, 10],
    [620, 520, 12],
    [980, 380, 8],
  ]
    .map(([x, y, r]) => gn.spark(pen, x, y, r, '#ffe6f8', 0.9))
    .join('');
  return pen.svg(gn.layer(0.15, sky) + gn.layer(0.4, rush) + gn.layer(0.6, ship) + gn.layer(1, seed + shards) + gn.vignette(pen, 0.55, '#04030e') + gn.grain(pen, 0.08));
}


/* ---------------- 3. GaScu grows over the ship ---------------- */

/** A ship's corridor seen down its length: wall panels and door frames converging on the far end at (vx, vy), ceiling lights, a grated floor. */
function corridor(pen: gn.Pen, vx: number, vy: number): string {
  const far = { x0: vx - 170, x1: vx + 170, y0: vy - 120, y1: vy + 110 };
  let out = gn.sky(pen, [
    [0, '#120a26'],
    [0.5, '#24123e'],
    [1, '#0e0820'],
  ]);
  // The far end: a closed bulkhead door glowing faintly pink through its seams.
  out += pen.form(`M${far.x0} ${far.y0}H${far.x1}V${far.y1}H${far.x0}Z`, '#3a2a5a', { line: 2, inner: `<path d="M${vx} ${far.y0}V${far.y1}" stroke="#ff6fcf" stroke-width="5"/>` + pen.glow(vx, vy, 160, '#ff6fcf', 0.6) });
  // Walls, ceiling and floor as four big planes.
  const wall = (pts: gn.P[], c: string, sh = 0) => pen.form(gn.dPoly(pts), c, { line: 3, sh, hatch: 1 });
  out += wall(
    [
      [-80, -60],
      [far.x0, far.y0],
      [far.x0, far.y1],
      [-80, 960],
    ],
    '#2a1e48',
  );
  out += wall(
    [
      [1680, -60],
      [far.x1, far.y0],
      [far.x1, far.y1],
      [1680, 960],
    ],
    '#241a40',
  );
  out += wall(
    [
      [-80, -60],
      [1680, -60],
      [far.x1, far.y0],
      [far.x0, far.y0],
    ],
    '#1a1232',
  );
  out += wall(
    [
      [-80, 960],
      [far.x0, far.y1],
      [far.x1, far.y1],
      [1680, 960],
    ],
    '#1e1636',
  );
  // Door frames and wall ribs receding, lit ceiling panels (one flickering out).
  const lerpP = (a: gn.P, b: gn.P, t: number) => gn.lerp(a, b, t);
  let ribs = '';
  let lamps = '';
  for (const t of [0.12, 0.3, 0.5, 0.68, 0.82]) {
    const tl = lerpP([-80, -60], [far.x0, far.y0], t);
    const bl = lerpP([-80, 960], [far.x0, far.y1], t);
    const tr = lerpP([1680, -60], [far.x1, far.y0], t);
    const br = lerpP([1680, 960], [far.x1, far.y1], t);
    ribs += `M${gn.r1(bl[0])} ${gn.r1(bl[1])}L${gn.r1(tl[0])} ${gn.r1(tl[1])}L${gn.r1(tr[0])} ${gn.r1(tr[1])}L${gn.r1(br[0])} ${gn.r1(br[1])}`;
    const lx = lerpP(tl, tr, 0.38);
    const rx = lerpP(tl, tr, 0.62);
    const w = (1 - t) * 30 + 6;
    lamps += t === 0.3 ? '' : pen.brush([lx, rx], w, '#cfe8ff', [0.05, 0.05], 0.75) + pen.glow((lx[0] + rx[0]) / 2, lx[1] + w, (rx[0] - lx[0]) * 0.6, '#cfe8ff', 0.3, w * 2);
  }
  out += `<path d="${ribs}" fill="none" stroke="${gn.INK}" stroke-width="18"/><path d="${ribs}" fill="none" stroke="#3a2c60" stroke-width="10"/>` + lamps;
  // Floor grating lines running toward the end.
  let grate = '';
  for (let i = -8; i <= 8; i++) grate += `M${vx + i * 20} ${far.y1}L${vx + i * 200} 960`;
  out += `<path d="${grate}" stroke="${gn.INK}" stroke-width="2.4" opacity=".45"/>`;
  return out;
}

/** One of the ship's little maintenance robots gone haywire: a boxy body on treads, a domed head with a spinning red eye, arms flailing, sparks flying. Base at (x, y). */
function haywireBot(pen: gn.Pen, x: number, y: number, s: number): string {
  const body =
    pen.form('M-90 -30H90L80 0H-80Z', '#3a3448', { sh: 8, line: 3, inner: `<path d="M-70 -15H70" stroke="${gn.INK}" stroke-width="10" stroke-dasharray="12 8" opacity=".6"/>` }) +
    // Flailing arms (one bent back over its head, one out with a clamp).
    pen.brush(
      [
        [-60, -150],
        [-130, -210],
        [-110, -290],
      ],
      26,
      gn.INK,
      [0.05, 0.05],
    ) +
    pen.brush(
      [
        [-60, -150],
        [-130, -210],
        [-110, -290],
      ],
      15,
      '#c9d1dc',
      [0.05, 0.05],
    ) +
    pen.form('M-130 -296L-96 -318L-84 -300L-106 -280Z', '#ffb020', { sh: 6, line: 2.6 }) +
    pen.brush(
      [
        [60, -140],
        [150, -150],
        [210, -110],
      ],
      26,
      gn.INK,
      [0.05, 0.05],
    ) +
    pen.brush(
      [
        [60, -140],
        [150, -150],
        [210, -110],
      ],
      15,
      '#c9d1dc',
      [0.05, 0.05],
    ) +
    pen.form('M206 -130L250 -132L246 -116L226 -112L248 -100L244 -86L204 -96Z', '#ffb020', { sh: 6, line: 2.6 }) +
    pen.form('M-80 -30L-70 -190H70L80 -30Z', '#ffb020', {
      sh: 50,
      hatch: 2,
      line: 3.2,
      rim: 2.4,
      inner: `<path d="M-60 -60H60M-62 -150H62" stroke="${gn.INK}" stroke-width="10" stroke-dasharray="18 14" opacity=".75"/><path d="M-36 -130H36V-80H-36Z" fill="#1b2330"/><path d="M-26 -104l10 -12l8 20l10 -26l8 18l10 -6" fill="none" stroke="#ff4a3a" stroke-width="4"/>`,
    }) +
    pen.form('M-60 -186Q-60 -280 0 -282Q60 -280 60 -186Z', '#c9d1dc', { sh: 30, hatch: 1, line: 3, rim: 2 }) +
    // The eye, spinning red.
    pen.glow(10, -232, 70, '#ff3a4c', 0.8) +
    pen.form(c1.circleD(10, -232, 24), '#1a1418', { line: 2.6 }) +
    `<circle cx="10" cy="-232" r="15" fill="#ff3a4c"/><path d="M10 -232m-9 0a9 9 0 1 1 9 9a5 5 0 1 1 -4 -5" fill="none" stroke="#ffe0d0" stroke-width="3"/>` +
    // A GaScu tendril wound round its neck.
    c1.vine(
      pen,
      [
        [-90, -170],
        [-30, -196],
        [40, -170],
        [80, -196],
        [140, -260],
      ],
      9,
      { leaves: 2, buds: 0, curls: 0, seed: 12 },
    ) +
    gn.spark(pen, -40, -290, 26, '#fff6b0') +
    gn.spark(pen, 70, -300, 18, '#7fe6ff') +
    gn.spark(pen, 120, -230, 14, '#fff6b0') +
    pen.brushes(
      [
        [
          [
            [-30, -310],
            [-40, -350],
          ],
          6,
        ],
        [
          [
            [40, -320],
            [56, -356],
          ],
          6,
        ],
        [
          [
            [-90, -260],
            [-128, -282],
          ],
          6,
        ],
      ],
      '#ffffff',
      [0.2, 0.2],
      0.9,
    );
  return gn.at(x, y, s, body);
}

/** 3. GaScu's vines have grown all down a ship's corridor, glowing pink; the crew sleep in cocoons hanging like lanterns, and a robot goes haywire. */
export function ch1Grow(): string {
  const pen = gn.Pen.scene('ch1-grow', { key: [0.3, -0.9], keyColor: '#ffd0f0', rim: [-0.9, -0.3], rimColor: '#7fe6ff', shadow: '#3a1a5a', depth: 0.6 });
  const vx = 820;
  const vy = 380;
  const back = corridor(pen, vx, vy);
  // Vines pouring out of the far end and along the walls and ceiling, glowing.
  const vines =
    c1.vine(
      pen,
      [
        [vx - 80, vy - 100],
        [560, 200],
        [300, 90],
        [60, -20],
      ],
      26,
      { leaves: 3, buds: 4, seed: 1 },
    ) +
    c1.vine(
      pen,
      [
        [vx + 80, vy - 100],
        [1060, 210],
        [1300, 110],
        [1640, 20],
      ],
      26,
      { leaves: 3, buds: 4, seed: 2 },
    ) +
    c1.vine(
      pen,
      [
        [vx - 120, vy + 80],
        [560, 560],
        [360, 640],
        [100, 860],
      ],
      24,
      { leaves: 3, buds: 5, seed: 3 },
    ) +
    c1.vine(
      pen,
      [
        [vx + 130, vy + 60],
        [1040, 520],
        [1260, 560],
        [1660, 760],
      ],
      24,
      { leaves: 3, buds: 5, seed: 4 },
    ) +
    gn.haze(pen, 260, 520, '#ff6fcf', 0.18);
  // The cocoons, hanging from the vines like lanterns: small and far, then big and near.
  const stalk = (x: number, y0: number, y1: number, w: number) =>
    pen.brush(
      [
        [x, y0],
        [x - 6, (y0 + y1) / 2],
        [x, y1],
      ],
      w + 6,
      gn.INK,
      [0.05, 0.05],
    ) +
    pen.brush(
      [
        [x, y0],
        [x - 6, (y0 + y1) / 2],
        [x, y1],
      ],
      w,
      c1.GASCU.stem,
      [0.05, 0.05],
    );
  const far =
    stalk(690, 150, 262, 6) +
    stalk(960, 140, 252, 6) +
    stalk(820, 200, 190, 5) +
    c1.cocoon(pen, 690, 250, 0.42, c1.COLONISTS[4]) +
    c1.cocoon(pen, 960, 240, 0.46, c1.COLONISTS[2]) +
    c1.cocoon(pen, 820, 186, 0.32, c1.COLONISTS[3]);
  const near = c1.cocoon(pen, 340, 70, 0.95, c1.COLONISTS[1]) + c1.cocoon(pen, 1250, 60, 1.05, c1.COLONISTS[0], { tilt: -8 });
  const bot = gn.castShadow(pen, 1110, 770, 170, 18, 0.55) + haywireBot(pen.relight({ key: [-0.6, -0.7] }), 1100, 770, 0.8);
  // Pollen drifting everywhere.
  const rand = gn.rng(8);
  let pollen = '';
  for (let i = 0; i < 18; i++) pollen += gn.spark(pen, 120 + rand() * 1360, 120 + rand() * 600, 4 + rand() * 8, i % 3 ? '#ffd6f2' : '#ffffff', 0.85);
  const fore =
    c1.vine(
      pen,
      [
        [-80, 560],
        [40, 700],
        [20, 860],
        [120, 980],
      ],
      40,
      { leaves: 2, buds: 2, seed: 7 },
    ) +
    c1.vine(
      pen,
      [
        [1700, 400],
        [1560, 560],
        [1600, 760],
        [1500, 980],
      ],
      44,
      { leaves: 2, buds: 2, seed: 8 },
    );
  return pen.svg(gn.layer(0.2, back) + gn.layer(0.45, vines + far) + gn.layer(0.8, bot) + gn.layer(1, near + pollen) + gn.layer(1.3, fore) + gn.vignette(pen, 0.55, '#0a0414') + gn.grain(pen, 0.08));
}

