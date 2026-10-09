/** Chapter 1 panels, part 3: the ship saved from the star, and LUX making friends with the Heart. */
import * as gn from '../gn';
import * as c1 from '../gn/ch1';

/** A circular comic inset at (cx, cy), radius r: its own picture inside (in panel coordinates), clipped, under a white ring. */
function roundInset(pen: gn.Pen, cx: number, cy: number, r: number, body: string): string {
  const id = pen.uid();
  pen.def(id, `<clipPath id="${id}"><path d="${c1.circleD(cx, cy, r)}"/></clipPath>`);
  return (
    `<circle cx="${cx + 10}" cy="${cy + 12}" r="${r}" fill="${gn.INK}" opacity=".5"/>` +
    `<g clip-path="url(#${id})">${body}</g>` +
    `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${gn.INK}" stroke-width="18"/><circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#f4f6ff" stroke-width="9"/>`
  );
}

/** LUX holding something in two little grabber arms that reach down from his side pods to (hx, hy) (his own coordinates, unflipped). */
function luxArms(pen: gn.Pen, x: number, y: number, s: number, hx: number, hy: number): string {
  const arm = (k: number) => {
    const pts: gn.P[] = [
      [k * 44, 14],
      [k * 66, 50],
      [k * (hx + 6), hy - 20],
      [k * hx, hy],
    ];
    return pen.brush(pts, 14, gn.INK, [0.05, 0.05]) + pen.brush(pts, 7, '#9aa6ba', [0.05, 0.05]) + pen.form(c1.circleD(k * hx, hy, 9), '#9aa6ba', { sh: 4, line: 2.4 });
  };
  return gn.at(x, y, s, arm(-1) + arm(1));
}

/* ---------------- 7. The ship saved ---------------- */

/** 7. The SYRACUSIA swings away from the star on a great curving trail toward Gaia Nova; in an inset, Jason grins and LUX hugs the sleeping sprout. */
export function ch1Saved(): string {
  const pen = gn.Pen.scene('ch1-saved', { key: [0.95, 0.2], keyColor: '#ffc890', rim: [-0.8, -0.5], rimColor: '#8fd8ff', shadow: '#2a2060', depth: 0.6 });
  const sky =
    gn.sky(pen, [
      [0, '#070b26'],
      [0.6, '#0e0c30'],
      [1, '#1a0c24'],
    ]) +
    gn.nebula(pen, 420, 160, 520, ['#5ec8ff', '#3f5ad6', '#2a2a80'], 3, 0.5) +
    gn.starfield(pen, 41, 160, -80, -60, 1760, 1020, '#f4f6ff');
  // The star, burning at the right edge; Gaia Nova waiting, small and blue, far away to the upper left.
  const far = c1.sun(pen, 1760, 640, 460) + c1.planet(pen, 230, 170, 74, [0.9, 0.4]);
  // The trail: a great swoosh of light from the star's edge round and up to the ship.
  const trail: gn.P[] = gn.spline([
    [1330, 760],
    [1250, 470],
    [1080, 300],
    [880, 240],
    [720, 236],
  ], 8);
  const wake =
    pen.brush(trail, 120, '#8fd8ff', [0.9, 0.1], 0.18) +
    pen.brush(trail, 54, '#bff0ff', [0.9, 0.08], 0.4) +
    pen.brush(trail, 16, '#ffffff', [0.9, 0.06], 0.9) +
    [
      [1200, 400, 12],
      [1000, 270, 9],
      [1290, 600, 10],
      [880, 210, 7],
    ]
      .map(([x, y, r]) => gn.spark(pen, x, y, r, '#ffffff', 0.9))
      .join('');
  const ship = c1.syracusia(pen, 560, 232, 0.4, { flip: true, rot: 8, line: 2.4 });
  // The inset: Jason, proud, one fist up; LUX beside him hugging the flower pot with the sleeping sprout.
  const cx = 360;
  const cy = 530;
  const r = 205;
  const inPen = pen.relight({ key: [1, -0.12], keyColor: '#ffe0b0', rim: [-0.9, -0.3], rimColor: '#7fe6ff', depth: 0.55 });
  const inside =
    `<path d="${c1.circleD(cx, cy, r)}" fill="${pen.lin([
      [0, '#2a3a6a'],
      [1, '#141a3a'],
    ])}"/>` +
    gn.starfield(pen, 7, 26, cx - r, cy - r, r * 2, r * 2) +
    pen.glow(cx + 60, cy - 30, 220, '#ffd890', 0.4) +
    gn.jason(inPen, cx - 70, cy + 470, 1.05, {
      pose: { turn: 0.32, tilt: -4, hipTilt: 6, armN: { to: [-0.62, 1.42], bend: 1 }, armF: [150, 186], legN: { to: [-0.08, 0.985] }, legF: { to: [0.22, 0.95] }, handN: 'fist', handF: 'fist' },
      mood: 'grin',
      look: [2.6, -0.5],
      rim: 2,
    }) +
    gn.lux(inPen, cx + 110, cy - 110, 1.25, 'happy', { flip: true }) +
    c1.sproutPot(inPen, cx + 110, cy + 110, 0.7) +
    luxArms(inPen, cx + 110, cy - 110, 1.25, 40, 122);
  return pen.svg(gn.layer(0.15, sky) + gn.layer(0.35, far) + gn.layer(0.7, wake + ship) + gn.layer(1, roundInset(pen, cx, cy, r, inside)) + gn.vignette(pen, 0.45, '#04040e') + gn.grain(pen, 0.08));
}

/* ---------------- 8. Friends ---------------- */

/** 8. On the Bridge, LUX flashes light-words at the Heart and it flashes back in gold; its vines burst into flowers and Jason cheers. */
export function ch1Friends(): string {
  const pen = gn.Pen.scene('ch1-friends', { key: [0.85, -0.35], keyColor: '#ffd890', rim: [-0.9, -0.3], rimColor: '#7fe6ff', shadow: '#5a2a50', depth: 0.55 });
  const hx = 1130;
  const hy = 360;
  // Through the Bridge window: stars, and the warm blue world the ship is turning back toward.
  const sky =
    gn.sky(pen, [
      [0, '#0c1030'],
      [0.6, '#1a1640'],
      [1, '#2a1830'],
    ]) +
    gn.starfield(pen, 51, 120, -80, -60, 1760, 760) +
    c1.planet(pen, 300, 200, 120, [0.9, -0.2]);
  const win =
    `<path d="M-80 -60H1680V700H-80ZM70 60Q70 20 110 20H1490Q1530 20 1530 60V620H70Z" fill="#3a2440" fill-rule="evenodd"/>` +
    [430, 800, 1170].map((mx) => pen.form(`M${mx - 16} 20H${mx + 16}V640H${mx - 16}Z`, '#3a2440', { sh: 30, hatch: 1, line: 3, rim: 2.4 })).join('') +
    pen.form('M-80 640H1680V960H-80Z', '#3a2030', { line: 3, paint: pen.lin([[0, '#8a5a3a'], [1, '#2a1424']]) });
  // The Heart, gold now, its vines turned gold and flowering everywhere; gold light pouring off it.
  const goldVine: c1.VineOpts = { color: '#e8a830', glow: c1.GASCU.gold, leaves: 3, buds: 0, curls: 4 };
  const vines =
    c1.vine(
      pen,
      [
        [hx - 100, hy - 60],
        [880, 120],
        [560, 90],
        [260, 20],
        [-60, 60],
      ],
      26,
      { ...goldVine, seed: 1 },
    ) +
    c1.vine(
      pen,
      [
        [hx + 120, hy - 60],
        [1360, 120],
        [1700, 160],
      ],
      26,
      { ...goldVine, seed: 2 },
    ) +
    c1.vine(
      pen,
      [
        [hx + 110, hy + 90],
        [1360, 470],
        [1460, 620],
        [1700, 700],
      ],
      26,
      { ...goldVine, seed: 3 },
    ) +
    c1.vine(
      pen,
      [
        [hx - 60, hy + 140],
        [960, 600],
        [760, 680],
        [520, 760],
        [200, 900],
      ],
      28,
      { ...goldVine, seed: 4 },
    );
  const blooms: [number, number, number, string][] = [
    [190, 40, 30, '#ff8ad8'],
    [420, 96, 26, '#ffd166'],
    [700, 110, 32, '#ffffff'],
    [960, 100, 26, '#5e9bff'],
    [1320, 120, 34, '#ff8ad8'],
    [1560, 170, 28, '#ffd166'],
    [1420, 520, 32, '#ffffff'],
    [1560, 660, 30, '#ff8ad8'],
    [900, 620, 28, '#5e9bff'],
    [640, 720, 30, '#ffd166'],
    [1240, 220, 22, '#ffffff'],
    [1020, 680, 24, '#ff8ad8'],
  ];
  const flowers = blooms.map(([x, y, r, c], i) => c1.flower(pen, x, y, r, c, c === '#ffd166' ? '#ff8a3d' : c1.GASCU.gold, i * 17)).join('');
  const heart =
    gn.godRays(pen, hx, hy, [-160, -130, -100, -70, -40, -10, 20, 50, 80, 110, 140, 170, 200, 230, 260], 7, 1300, '#ffe08a', 0.3) +
    c1.heart(pen, hx, hy, 0.8, { gold: true }) +
    c1.lightWords(pen, hx, hy, [
      [230, c1.GASCU.gold],
      [290, '#fff2b0'],
    ], 24, 180);
  // LUX, glowing, flashing his words: hello (blue), safe (pink), together (gold).
  const lx = 600;
  const ly = 330;
  const luxWords =
    gn.bloom(pen, lx, ly, 120, '#bff8ff', 0.6) +
    c1.lightWords(pen, lx, ly, [
      [110, '#5e9bff'],
      [165, '#ff6fcf'],
      [220, '#ffd166'],
    ], 30, 0) +
    gn.lux(pen, lx, ly, 1.6, 'happy', { eye: '#ffd166' });
  // Jason cheering at the left, both fists up, lit gold.
  const hero = gn.castShadow(pen, 270, 900, 190, 18, 0.5) + gn.jason(pen.relight({ key: [1, -0.1] }), 270, 904, 1.12, { pose: 'cheer', mood: 'grin', look: [2.6, -1.5], rim: 2.2 });
  const rand = gn.rng(13);
  let petals = '';
  for (let i = 0; i < 22; i++) petals += gn.spark(pen, 80 + rand() * 1440, 60 + rand() * 640, 4 + rand() * 9, i % 3 ? '#fff2b0' : '#ffffff', 0.9);
  return pen.svg(gn.layer(0.15, sky) + gn.layer(0.4, win) + gn.layer(0.7, vines + heart + flowers) + gn.layer(1, luxWords + hero + petals) + gn.vignette(pen, 0.45, '#2a0e04') + gn.grain(pen, 0.08));
}
