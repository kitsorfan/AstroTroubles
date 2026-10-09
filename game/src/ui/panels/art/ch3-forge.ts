/** Chapter 3 panels for Talos's Forge: the sleeping bronze mech, and Talos sitting down by the sea, free. */
import * as gn from '../gn';
import { ell, lightWords, mech, MECH, mechPerch, TALOS, talos } from '../gn/ch3b';

/* ---------------- 25. The sleeping mech ---------------- */

/** The forge's furnace: a great arched mouth in the back wall, white-hot inside, its brick arch lit from within. */
function furnace(pen: gn.Pen, x: number, y: number, w: number, h: number): string {
  const arch = `M${x - w / 2} ${y}V${y - h * 0.55}Q${x - w / 2} ${y - h} ${x} ${y - h}Q${x + w / 2} ${y - h} ${x + w / 2} ${y - h * 0.55}V${y}Z`;
  const fire = pen.lin([
    [0, '#fff6d0'],
    [0.45, '#ffb43a'],
    [1, '#ff5a1a'],
  ]);
  const bricks = Array.from({ length: 9 }, (_, i) => {
    const a = Math.PI * (i / 8);
    const ix = x - Math.cos(a) * (w / 2);
    const iy = y - h * 0.55 - Math.sin(a) * h * 0.45;
    const ox = x - Math.cos(a) * (w / 2 + 70);
    const oy = y - h * 0.55 - Math.sin(a) * (h * 0.45 + 70);
    return `M${gn.r1(ix)} ${gn.r1(iy)}L${gn.r1(ox)} ${gn.r1(oy)}`;
  }).join('');
  const surround = `M${x - w / 2 - 70} ${y}V${y - h * 0.55}Q${x - w / 2 - 70} ${y - h - 70} ${x} ${y - h - 70}Q${x + w / 2 + 70} ${y - h - 70} ${x + w / 2 + 70} ${y - h * 0.55}V${y}Z`;
  return (
    pen.form(surround, '#5a3a30', { sh: 40, hatch: 2, line: 3.4, inner: `<path d="${bricks}" stroke="${gn.INK}" stroke-width="3" opacity=".6"/>` + pen.glow(x, y - h * 0.5, w * 0.9, '#ff9a3a', 0.6) }) +
    `<path d="${arch}" fill="${fire}" stroke="${gn.INK}" stroke-width="4"/>` +
    pen.glow(x, y - h * 0.35, w * 0.45, '#ffffff', 0.7) +
    pen.brushes(
      [
        [
          [
            [x - w * 0.3, y],
            [x - w * 0.2, y - h * 0.3],
            [x - w * 0.26, y - h * 0.55],
          ],
          26,
        ],
        [
          [
            [x + w * 0.1, y],
            [x + w * 0.18, y - h * 0.35],
            [x + w * 0.08, y - h * 0.62],
          ],
          30,
        ],
      ],
      '#ffe6a0',
      [0.1, 0.9],
      0.8,
    )
  );
}

/**
 * The deep arched niche in the back wall where the mech was left: a stone frame carved with dim
 * light-words round a dark recess, faintly lit teal by the waking eye. Inner edges x0..x1, floor at y, top at `top`.
 */
function niche(pen: gn.Pen, x0: number, x1: number, y: number, top: number, lit: number): string {
  const w = 70;
  const mid = (x0 + x1) / 2;
  const r = (x1 - x0) / 2;
  const frame = `M${x0 - w} ${y}V${top + r}A${r + w} ${r + w} 0 0 1 ${x1 + w} ${top + r}V${y}H${x1}V${top + r}A${r} ${r} 0 0 0 ${x0} ${top + r}V${y}Z`;
  const hole = `M${x0} ${y}V${top + r}A${r} ${r} 0 0 1 ${x1} ${top + r}V${y}Z`;
  const depth = pen.rad(
    [
      [0, '#1c3a3a'],
      [0.55, '#120c10'],
      [1, '#07040a'],
    ],
    0.5,
    0.62,
    0.6,
  );
  let words = '';
  for (let i = 0; i < 7; i++) {
    const a = -90 + (i / 6) * 180;
    const p = gn.add([mid, top + r], gn.mul(gn.dir(180 - a), r + w / 2));
    words += lightWords(pen, p[0], p[1], 3, w * 0.7, lit * (0.6 + (i % 2) * 0.3), MECH.teal, a);
  }
  for (const px of [x0 - w / 2, x1 + w / 2]) for (let k = 0; k < 3; k++) words += lightWords(pen, px, top + r + 80 + k * 110, 3, w * 0.7, lit * 0.6, MECH.teal, 90);
  let joints = '';
  for (let yy = y - 90; yy > top + r; yy -= 100) joints += `M${x0 - w} ${yy}H${x0}M${x1} ${yy}H${x1 + w}`;
  return `<path d="${hole}" fill="${depth}" stroke="${gn.INK}" stroke-width="4"/>` + pen.form(frame, '#6a5048', { sh: 26, hatch: 2, line: 3.4, rim: 2, inner: `<path d="${joints}" stroke="${gn.INK}" stroke-width="3" opacity=".5"/>` }) + words;
}

/** 25. In the old forge, lit by the furnace, Jason and Atalanta find the Gardeners' bronze mech sitting where it was left, and its teal eye starts to glow. */
export function ch3Mech(): string {
  const pen = gn.Pen.scene('ch3-mech', { key: [-0.75, -0.6], keyColor: '#ffb070', rim: [0.9, -0.3], rimColor: '#7ff8e0', shadow: '#4a2a5a', depth: 0.6 });
  const mx = 820;
  const my = 812;
  const ms = 0.6;
  const sky =
    gn.sky(pen, [
      [0, '#120a10'],
      [0.5, '#2e1612'],
      [1, '#160a0a'],
    ]) +
    pen.glow(250, 420, 520, '#ff7a2a', 0.5) +
    furnace(pen, 240, 600, 240, 330) +
    gn.godRays(pen, 240, 420, [40, 62, 84, 106, 128], 5, 1400, '#ffb070', 0.16) +
    niche(pen, mx - 330, mx + 330, 650, 60, 0.5);
  // Wall columns and hanging chains, half lost in the smoke.
  const chain = (cx: number, len: number) => {
    let d = '';
    for (let cy = -20; cy < len; cy += 26) d += `M${cx - 6} ${cy}h12v20h-12Z`;
    return `<path d="${d}" fill="none" stroke="#1a0e0c" stroke-width="6"/><path d="M${cx - 20} ${len}h40l-6 34h-28Z" fill="#2a1c18"/>`;
  };
  const far =
    gn.silhouette(
      [
        [1250, 640],
        [1250, 120],
        [1330, 100],
        [1330, 640],
      ],
      '#2a1614',
    ) +
    gn.silhouette(
      [
        [1500, 640],
        [1500, 80],
        [1580, 60],
        [1580, 640],
      ],
      '#2a1614',
    ) +
    lightWords(pen, 1290, 300, 4, 50, 0.35, MECH.teal, 90) +
    lightWords(pen, 1540, 260, 4, 50, 0.35, MECH.teal, 90) +
    chain(560, 200) +
    chain(1120, 260) +
    chain(1420, 160) +
    gn.haze(pen, 120, 520, '#ff9a5a', 0.1) +
    gn.starfield(pen, 61, 40, 300, 100, 1200, 500, '#ffb050');
  // The floor and the stone bench the mech sits on, then the mech, its eye just starting to glow.
  let joints = '';
  for (let i = -8; i <= 8; i++) joints += `M${mx + i * 40} 640L${mx + i * 280} 1000`;
  for (const yy of [670, 720, 800, 900]) joints += `M-80 ${yy}H1680`;
  const floor = pen.form('M-80 640H1680V980H-80Z', '#5a3a2c', { sh: 0, line: 3, inner: `<path d="${joints}" stroke="${gn.INK}" stroke-width="2.6" opacity=".4"/>` + pen.glow(240, 660, 420, '#ff8a3a', 0.45, 90) + pen.glow(mx, 700, 360, MECH.teal, 0.25, 80) });
  const seat = my - 330 * ms;
  const bench =
    pen.form(`M${mx - 360} ${seat}H${mx + 360}L${mx + 380} ${seat + 26}V${my + 6}H${mx - 380}V${seat + 26}Z`, '#4e3a36', { sh: 60, hatch: 2, line: 3.4, rim: 2, inner: lightWords(pen, mx - 250, seat + 110, 5, 120, 0.25) + lightWords(pen, mx + 250, seat + 110, 5, 120, 0.25) }) +
    pen.form(`M${mx - 370} ${seat - 16}H${mx + 370}V${seat + 10}H${mx - 370}Z`, '#6a5448', { sh: 8, line: 3, rim: 2 });
  const mid = floor + gn.wash(pen, 820, '#0a0406', 0.7) + gn.castShadow(pen, mx, my + 10, 420, 30, 0.5) + bench + mech(pen, mx, my, ms, { sit: true, awake: 0.75, rim: 3.4 }) + gn.bloom(pen, mx + 18, my - 404, 80, MECH.teal, 0.8) + gn.spark(pen, mx + 60, my - 410, 26, '#e8fff8');
  // IRIS scans the mech with a fan of light; LUX hides by Jason; Jason points at the bubble, Atalanta calls the shoulder.
  const scan = `<path d="M1450 380L${mx + 140} 300L${mx + 160} 560Z" fill="${pen.lin([
    [0, '#c9b8ff', 0.5],
    [1, '#c9b8ff', 0],
  ], 1, 0, 0, 0)}"/>`;
  const heroes =
    scan +
    gn.castShadow(pen, 310, 884, 150, 16, 0.55) +
    gn.jason(pen.relight({ key: [0.95, -0.3], keyColor: '#d8fff0', rim: [-0.9, -0.4], rimColor: '#ffa060' }), 310, 888, 1.1, {
      pose: { turn: 0.45, lean: -4, tilt: -12, hipTilt: 5, armN: [-12, 8], armF: [124, 132], legN: { to: [-0.24, 0.94] }, legF: { to: [0.28, 0.93] }, handN: 'fist', handF: 'point' },
      mood: 'grin',
      look: [2.6, -3],
    }) +
    gn.lux(pen, 196, 560, 0.95, 'scared', { look: [8, -4] }) +
    gn.castShadow(pen, 1310, 884, 150, 16, 0.55) +
    gn.atalanta(pen.relight({ key: [-0.95, -0.3] }), 1310, 888, 1.1, {
      flip: true,
      pose: { turn: 0.38, tilt: -8, hipTilt: 7, armN: [-160, -176], armF: { to: [0.62, 1.4], bend: -1 }, legN: { to: [-0.08, 0.98] }, legF: { to: [0.24, 0.95] }, handN: 'open', handF: 'fist' },
      mood: 'grin',
      look: [2.4, -2.6],
    }) +
    gn.iris(pen, 1470, 380, 0.8, 'normal', { flip: true, rot: -8 });
  const fore =
    gn.starfield(pen, 77, 26, 0, 300, 1600, 500, '#ffb050') +
    gn.silhouette(
      [
        [-80, 980],
        [-80, 800],
        [60, 790],
        [120, 830],
        [160, 980],
      ],
      '#140a0a',
    ) +
    chain(1640, 520);
  return pen.svg(gn.layer(0.15, sky) + gn.layer(0.35, far) + gn.layer(0.65, mid) + gn.layer(1, heroes) + gn.layer(1.3, fore) + gn.vignette(pen, 0.6, '#0a0406') + gn.grain(pen, 0.09));
}

/* ---------------- 26. Talos, free ---------------- */

/** Aeëtes's gold control crown, knocked off and lying tipped over, its red gem gone dark. Centre-bottom at (x, y). */
function fallenCrown(pen: gn.Pen, x: number, y: number, s: number, rot: number): string {
  const lp = pen.local(false, rot);
  const body = lp.form('M-80 0V-46L-54 -16L-28 -62L0 -20L28 -62L54 -16L80 -46V0Q0 16 -80 0Z', '#ffd04a', { sh: 26, hatch: 1, line: 3.2, rim: 2, inner: `<path d="M-80 -10Q0 6 80 -10" stroke="#a8741c" stroke-width="7" fill="none"/>` });
  return gn.at(x, y, s, body + `<circle cx="0" cy="-22" r="11" fill="#5a1a20" stroke="${gn.INK}" stroke-width="3"/>`, false, rot);
}

/** Talos's great forge hammer, laid down and leaning on the rocks: head at (x, y), the haft running down-left. */
function restingHammer(pen: gn.Pen, x: number, y: number, s: number): string {
  const head = pen.form('M-80 -70H80V70H-80Z', TALOS.light, { sh: 50, hatch: 2, line: 3.6, rim: 2.6, inner: `<path d="M-80 -70H80V-44H-80Z" fill="${TALOS.patina}"/><path d="M-80 30H80" stroke="${gn.INK}" stroke-width="3" opacity=".5"/>` });
  const haft = pen.form('M-30 40L-330 330L-306 352L-6 64Z', TALOS.iron, { sh: 10, line: 3.2, rim: 2 });
  return gn.at(x, y, s, haft + head, false, 18);
}

/** Talos's light-words drifting toward the heroes ("Thank you, small friends"): rows of glowing leaves along a curve, fading as they go. */
function lightSpeech(pen: gn.Pen, pts: gn.P[]): string {
  const ribbon = pen.brush(pts, 70, TALOS.calm, [0.05, 0.6], 0.16) + pen.brush(pts, 22, '#d8fff4', [0.05, 0.7], 0.3);
  return ribbon + pts.map((p, i) => lightWords(pen, p[0], p[1], 4, 92 - i * 10, 1 - i * 0.12, TALOS.calm, (i % 2 ? 1 : -1) * 6)).join('') + gn.spark(pen, pts[0][0], pts[0][1] - 30, 16, '#e8fff8');
}

/** 26. Sunset by the sea: TALOS, free, sits down on the rocks and gives the Argonauts a slow nod; Jason in the mech's bubble and Atalanta on its shoulder wave back. */
export function ch3Talos(): string {
  const pen = gn.Pen.scene('ch3-talos', { key: [-0.9, -0.35], keyColor: '#ffc078', rim: [0.7, -0.7], rimColor: '#c8b8ff', shadow: '#5a3a7a', depth: 0.6 });
  const mechPen = pen.relight({ key: [0.9, -0.35], rim: [-0.7, -0.7] });
  const sunX = 740;
  const sunY = 456;
  const sky =
    gn.sky(pen, [
      [0, '#1e1e58'],
      [0.25, '#5a3a7e'],
      [0.42, '#d0688a'],
      [0.52, '#ffb07a'],
      [0.56, '#ffe0a8'],
    ]) +
    gn.starfield(pen, 33, 50, 0, 0, 1600, 220, '#ffe8f4') +
    gn.godRays(pen, sunX, sunY, [-160, -135, -110, -85, -60, 60, 85, 110, 135, 160, 185], 6, 1300, '#ffe0b0', 0.28) +
    gn.cloud(pen, 300, 300, 360, '#ffb8a0', '#7a4a8a', { seed: 3, flat: true }) +
    gn.cloud(pen, 1300, 250, 420, '#ffb8a0', '#7a4a8a', { seed: 5, flat: true }) +
    gn.bloom(pen, sunX, sunY, 96, '#fff0d0', 1);
  // The far sea and the bronze island's volcano, smoking quietly behind the mech.
  const far =
    gn.silhouette(
      [
        [-80, 480],
        [60, 380],
        [150, 330],
        [210, 336],
        [300, 400],
        [440, 480],
      ],
      '#8a4a6a',
      0.95,
    ) +
    pen.glow(180, 250, 90, '#c88aa0', 0.5) +
    pen.glow(140, 170, 120, '#c88aa0', 0.4) +
    gn.silhouette(
      [
        [1380, 480],
        [1480, 446],
        [1600, 452],
        [1690, 480],
      ],
      '#8a5a7a',
      0.9,
    ) +
    gn.sea(pen, 476, '#f0b090', '#2a3a6a', { seed: 12, sunX, ripple: '#ffc8b0', glint: '#fff0c8' }) +
    gn.haze(pen, 420, 540, '#ffc8a8', 0.6);
  // TALOS on his rocks, his crown and hammer laid down; the golden ichor glowing where it ran out into the sea.
  const ledge = gn.crag(
    pen,
    [
      [760, 960],
      [790, 860],
      [880, 820],
      [1060, 800],
      [1300, 806],
      [1500, 790],
      [1690, 820],
      [1700, 960],
    ],
    '#6a4a50',
    { seed: 7, sh: 40, cracks: 8, rim: 2.4, hatch: 2 },
  );
  const tx = 1240;
  const ty = 912;
  const mid =
    restingHammer(pen, 1560, 600, 1) +
    ledge +
    pen.glow(1400, 900, 300, TALOS.ichor, 0.55, 90) +
    pen.brushes(
      [
        [
          [
            [1320, 840],
            [1350, 880],
            [1340, 940],
          ],
          10,
        ],
        [
          [
            [1420, 830],
            [1446, 890],
            [1470, 950],
          ],
          8,
        ],
      ],
      TALOS.ichor,
      [0.1, 0.4],
      0.9,
    ) +
    talos(pen, tx, ty, 1.3, { nod: 16, nodLines: true, rim: 3.6 }) +
    // The golden ichor that ran out of his heel, glowing like warm honey on its way down to the sea.
    pen.glow(880, 846, 230, TALOS.ichor, 0.55, 70) +
    `<path d="M780 852Q800 830 870 832Q960 828 990 846Q970 866 880 868Q800 870 780 852Z" fill="${TALOS.ichor}" stroke="#a8741c" stroke-width="3"/>` +
    pen.brush(
      [
        [806, 846],
        [870, 840],
        [930, 842],
      ],
      7,
      '#fff6c8',
      [0.2, 0.4],
      0.95,
    ) +
    pen.brushes(
      [
        [
          [
            [800, 864],
            [794, 900],
          ],
          10,
        ],
        [
          [
            [850, 868],
            [852, 912],
          ],
          8,
        ],
      ],
      TALOS.ichor,
      [0.05, 0.6],
      0.9,
    ) +
    fallenCrown(pen, 700, 830, 0.8, -24);
  // The mech on the beach, Jason in its bubble, Atalanta on its shoulder waving; LUX and IRIS in the gap; Talos's light-words drifting to them.
  const mx = 300;
  const my = 1080;
  const ms = 0.7;
  const perch = mechPerch(false);
  const seat: gn.P = [mx + perch[0] * ms - 6, my + perch[1] * ms + 4];
  const atS = 0.7;
  const sitPose: gn.Pose = { turn: 0.45, lean: 2, tilt: -6, armN: [-150, -172], armF: { to: [0.3, 1.45] }, legN: { to: [0.5, 0.52] }, legF: { to: [0.62, 0.46] }, handN: 'open', handF: 'flat' };
  const sitRig = gn.rig(gn.TEEN_GIRL, sitPose);
  const heroes =
    lightSpeech(pen, [
      [960, 250],
      [860, 196],
      [760, 170],
      [660, 178],
      [570, 206],
    ]) +
    mech(mechPen, mx, my, ms, { jason: 'grin', jasonLook: [2.4, -2], rim: 3 }) +
    gn.atalanta(mechPen, seat[0] - sitRig.P[0] * atS, seat[1] - sitRig.P[1] * atS, atS, { pose: sitPose, mood: 'grin', look: [2.4, -2.2], wind: 0.6 }) +
    gn.lux(pen, 700, 300, 0.85, 'happy', { flip: true }) +
    gn.iris(pen, 120, 230, 0.72, 'happy', { rot: 12 });
  const fore = gn.crag(
    mechPen,
    [
      [-80, 960],
      [-80, 860],
      [60, 840],
      [200, 870],
      [260, 960],
    ],
    '#3a2a3a',
    { seed: 2, sh: 30, cracks: 4, rim: 2.4 },
  );
  return pen.svg(gn.layer(0.15, sky) + gn.layer(0.35, far) + gn.layer(0.6, mid) + gn.layer(1, heroes) + gn.layer(1.3, fore) + gn.vignette(pen, 0.5, '#1a0c20') + gn.grain(pen, 0.08));
}
