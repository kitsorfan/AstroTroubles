/** Chapter 2 panels, part 1: arriving at Gaia Nova, Brennus's broadcast, and the drones' raid. */
import * as gn from '../gn';
import { bigLeaf, celestiaPot, clipUrl, gaiaNova, gearMark, jasonSmooth, spiderDrone, syracusia } from '../gn/ch2a';

/** 9. The Syracusia in orbit over the great green-and-blue curve of Gaia Nova, the sun rising ahead of it. */
export function ch2Arrival(): string {
  const pen = gn.Pen.scene('ch2-arrival', { key: [0.85, -0.45], keyColor: '#fff0cc', rim: [-0.6, 0.8], rimColor: '#8fd8ff', shadow: '#3a3a8a', depth: 0.6 });
  // The sun is just rising over the planet's edge, ahead of the ship.
  const [sunX, sunY] = [1440, 486];
  const sky =
    gn.sky(pen, [
      [0, '#03041a'],
      [0.35, '#0a1238'],
      [0.55, '#1a2a62'],
    ]) +
    gn.nebula(pen, 420, 140, 560, ['#7a4ab8', '#2a6ab0', '#1a2a6a'], 4, 0.4) +
    gn.starfield(pen, 21, 160, -80, -60, 1760, 560, '#eef2ff') +
    gn.halftone(pen, 'M-80 -60H1680V280H-80Z', '#9ab0ff', 10, 0.08) +
    gn.gasGiant(pen, 196, 150, 40, { lightDir: [0.9, 0.2], haze: 0.45, sky: '#14204a' }) +
    gn.godRays(pen, sunX, sunY, [-160, -135, -115, -95, -75, -55, 200, 225], 4, 1500, '#fff0c8', 0.22) +
    gn.bloom(pen, sunX, sunY, 150, '#fff2d0', 1);
  const planet = gaiaNova(pen, 760, 2830, 2400, { sun: [0.9, -0.4], seed: 5 }) + pen.glow(sunX - 40, sunY + 46, 420, '#ffe6b0', 0.7, 60) + pen.glow(sunX, sunY + 40, 160, '#ffffff', 0.9, 26);
  const ship = syracusia(pen, 700, 318, 0.8, { rot: -3 });
  // The sun's glint, and lens flares strung back from it across the picture.
  const flare =
    pen.brush(
      [
        [sunX - 620, sunY + 6],
        [sunX, sunY],
        [sunX + 400, sunY - 4],
      ],
      7,
      '#fff6e0',
      [0.5, 0.5],
      0.75,
    ) +
    gn.spark(pen, sunX, sunY, 76, '#ffffff', 0.85) +
    gn.spark(pen, sunX, sunY, 40, '#fff6d8', 1);
  return pen.svg(gn.layer(0.15, sky) + gn.layer(0.3, planet) + gn.layer(0.8, ship) + gn.layer(1.15, flare) + gn.vignette(pen, 0.5, '#02030e') + gn.grain(pen, 0.07));
}

/** The bridge's console along the bottom of the picture: an angled desk with glowing panels and buttons, from x0 to x1 with its top edge at y. */
function console(pen: gn.Pen, x0: number, x1: number, y: number): string {
  const top = `M${x0} ${y + 40}L${x0 + 60} ${y}H${x1 - 60}L${x1} ${y + 40}V${y + 300}H${x0}Z`;
  let keys = '';
  const rand = gn.rng(7);
  for (let i = 0; i < 26; i++) {
    const kx = x0 + 90 + rand() * (x1 - x0 - 180);
    const ky = y + 12 + rand() * 22;
    const c = ['#7fe6ff', '#ffd166', '#ff5a6a', '#7dff9a'][i % 4];
    keys += `<rect x="${gn.r1(kx)}" y="${gn.r1(ky)}" width="16" height="7" rx="2" fill="${c}" opacity=".9"/>`;
  }
  const screens = [0.22, 0.5, 0.78]
    .map((t) => {
      const sx = x0 + (x1 - x0) * t;
      return `<path d="M${sx - 70} ${y + 48}H${sx + 70}L${sx + 60} ${y + 110}H${sx - 60}Z" fill="#0c2a3a" stroke="${gn.INK}" stroke-width="3"/><path d="M${sx - 54} ${y + 66}H${sx + 10}M${sx - 50} ${y + 82}H${sx + 30}M${sx - 46} ${y + 98}H${sx - 4}" stroke="#7fe6ff" stroke-width="4" opacity=".75"/>`;
    })
    .join('');
  return pen.form(top, '#232a4a', { sh: 40, hatch: 2, line: 3.2, rim: 2.4, inner: `<path d="M${x0 + 60} ${y + 4}H${x1 - 60}" stroke="#ff7a8a" stroke-width="4" opacity=".7"/>` + keys + screens + pen.glow((x0 + x1) / 2, y + 30, (x1 - x0) * 0.5, '#7fe6ff', 0.25, 40) });
}

/**
 * The broadcast on the big screen: Brennus leaning in, pointing at the Captain, in front of his gear
 * emblem in a dark war room; scan lines, a glitch band and a red cast over it. The screen's glass is
 * x0..x1, y0..y1.
 */
function broadcastScreen(pen: gn.Pen, x0: number, y0: number, x1: number, y1: number): string {
  const w = x1 - x0;
  const h = y1 - y0;
  const glass = `M${x0} ${y0}H${x1}V${y1}H${x0}Z`;
  const clip = clipUrl(pen, glass);
  const room = pen.rad(
    [
      [0, '#6a2a2a'],
      [0.6, '#2a0e18'],
      [1, '#12060c'],
    ],
    0.55,
    0.4,
    0.75,
  );
  // Brennus's own light: a hard key from the front (he faces left), a red rim from his war room.
  const studio = pen.relight({ key: [-0.75, -0.55], keyColor: '#ffd8c0', rim: [0.85, -0.3], rimColor: '#ff6a5a', shadow: '#4a1a3a', depth: 0.6 });
  let lines = '';
  for (let yy = y0 + 4; yy < y1; yy += 7) lines += `M${x0} ${yy}H${x1}`;
  const mid = x0 + w * 0.5;
  const inside =
    `<path d="${glass}" fill="${room}"/>` +
    pen.glow(mid + 60, y0 + h * 0.42, 260, '#ff3a2a', 0.5) +
    gearMark(mid + 250, y0 + h * 0.4, 170, '#7a1c22', '#2a0a10') +
    `<path d="M${x0} ${y0 + h * 0.86}H${x1}" stroke="#ff5a3a" stroke-width="4" opacity=".4"/>` +
    gn.brennus(studio, mid + 50, y0 + 1180, 1.75, {
      flip: true,
      mood: 'angry',
      shield: false,
      cannon: false,
      look: [3, 0.5],
      rim: 2.6,
      pose: { turn: 0.32, lean: 9, tilt: 4, armN: { to: [2.3, 0.82], bend: -1 }, armF: [10, 24], legN: { to: [-0.1, 0.97] }, legF: { to: [0.2, 0.95] }, handN: 'point', handF: 'fist', wristN: -6 },
    }) +
    // The broadcast's scan lines, a torn glitch band and its red cast.
    `<path d="${lines}" stroke="#000" stroke-width="2.4" opacity=".28"/>` +
    `<path d="M${x0} ${y0 + h * 0.62}H${x1}V${y0 + h * 0.66}H${x0}Z" fill="#ff8a7a" opacity=".22"/><path d="M${x0} ${y0 + h * 0.18}H${x1}V${y0 + h * 0.2}H${x0}Z" fill="#9ae8ff" opacity=".2"/>` +
    `<path d="${glass}" fill="${pen.rad(
      [
        [0.5, '#000000', 0],
        [1, '#000000', 0.6],
      ],
      0.5,
      0.5,
      0.72,
    )}"/>` +
    `<path d="${glass}" fill="#ff2a3a" opacity=".07"/>`;
  // The frame: a heavy bezel with rivets and red alert lights.
  const bezel = `M${x0 - 34} ${y0 - 30}H${x1 + 34}V${y1 + 40}H${x0 - 34}Z`;
  let rivets = '';
  for (let i = 0; i <= 10; i++) rivets += `<circle cx="${gn.r1(x0 - 10 + ((w + 20) * i) / 10)}" cy="${y0 - 16}" r="4" fill="${gn.INK}" opacity=".6"/>`;
  return (
    pen.glow(mid, y0 + h * 0.5, w * 0.8, '#ff3a3a', 0.55, h * 0.95) +
    pen.form(bezel, '#2a2c44', { sh: 30, hatch: 2, line: 3.4, rim: 2.4, inner: rivets + `<path d="M${x0 - 20} ${y1 + 22}H${x1 + 20}" stroke="#ff5a6a" stroke-width="4" opacity=".6"/>` }) +
    `<g clip-path="${clip}">${inside}</g>` +
    `<path d="${glass}" fill="none" stroke="${gn.INK}" stroke-width="5"/>` +
    `<path d="M${x0} ${y0 + 120}L${x0 + 120} ${y0}H${x0 + 200}L${x0} ${y0 + 200}Z" fill="#ffffff" opacity=".06"/>` +
    [x0 - 4, x1 + 4].map((lx) => pen.glow(lx, y0 - 36, 40, '#ff3a4c', 0.95) + `<circle cx="${lx}" cy="${y0 - 36}" r="9" fill="#ffd0d6" stroke="${gn.INK}" stroke-width="2.4"/>`).join('')
  );
}

/** 10. The Bridge: Brennus on the big screen, pointing at the Captain; Captain Argus and Jason stare up in shock, LUX hides behind Jason. */
export function ch2Broadcast(): string {
  const pen = gn.Pen.scene('ch2-broadcast', { key: [0.85, -0.4], keyColor: '#ff9a8a', rim: [-0.85, 0.2], rimColor: '#7fe6ff', shadow: '#2a2060', depth: 0.6 });
  // Jason and LUX stand on the screen's other side: the same red light, from their left.
  const right = pen.relight({ key: [-0.85, -0.4], rim: [0.85, 0.2] });
  const [x0, y0, x1, y1] = [380, 96, 1220, 566];
  // The bridge: dark walls, the great front window on space and Gaia Nova, its struts, and the ceiling.
  const win = 'M60 40H1540V700H60Z';
  const room =
    gn.sky(pen, [
      [0, '#0a0a1e'],
      [1, '#1a0c22'],
    ]) +
    `<g clip-path="${clipUrl(pen, win)}">` +
    gn.sky(pen, [
      [0, '#02030e'],
      [0.6, '#0c1440'],
    ]) +
    gn.starfield(pen, 33, 90, 60, 40, 1480, 500) +
    gaiaNova(pen, 800, 2900, 2300, { sun: [-0.9, -0.3], seed: 9, band: [0.85, 0.995], lands: 10 }) +
    '</g>' +
    pen.form('M-80 -60H1680V40H-80Z', '#141632', { sh: 30, hatch: 2, line: 3, rim: 2 }) +
    [60, 330, 1270, 1540].map((sx) => pen.form(`M${sx - 26} 30H${sx + 26}L${sx + 34} 720H${sx - 34}Z`, '#1c1e3a', { sh: 22, hatch: 2, line: 3, rim: 2, axis: [0, 1] })).join('') +
    [200, 800, 1400].map((lx) => pen.glow(lx, 20, 70, '#9ae0ff', 0.6, 20)).join('') +
    gn.haze(pen, 560, 760, '#3a1a3a', 0.6);
  const screen = broadcastScreen(pen, x0, y0, x1, y1) + pen.glow(800, 780, 760, '#ff4a4a', 0.35, 200);
  // The crew: the Captain on the left, Jason on the right with LUX hiding behind his shoulder.
  const crew =
    console(pen, -80, 1680, 760) +
    gn.argus(pen, 290, 1046, 1.08, {
      mood: 'worried',
      look: [2.6, -2.4],
      rim: 2.4,
      pose: { turn: 0.55, lean: -5, tilt: -6, hipTilt: 4, armN: { to: [0.62, 0.95] }, armF: [14, 24], legN: { to: [-0.2, 0.95] }, legF: { to: [0.22, 0.95] }, handN: 'open', handF: 'fist', wristN: -30 },
    }) +
    gn.lux(right, 1418, 540, 1.35, 'scared', { flip: true, look: [7, -3] }) +
    // A near-level light on Jason's face, so its shadow side falls on his hair, not his jaw (no stubble).
    jasonSmooth(right.relight({ key: [-0.97, -0.1] }), 1290, 1028, 1.2, {
      flip: true,
      mood: 'surprised',
      look: [2.6, -2.6],
      rim: 2.4,
      pose: { turn: 0.45, lean: -4, tilt: -8, hipTilt: 3, armN: [-24, 14], armF: [20, 34], legN: { to: [-0.28, 0.93] }, legF: { to: [0.3, 0.92] }, handN: 'fist', handF: 'fist' },
    }) +
    // The screen's red light spilling over them.
    pen.glow(420, 560, 300, '#ff3a3a', 0.22, 420) +
    pen.glow(1180, 600, 300, '#ff3a3a', 0.22, 420);
  return pen.svg(gn.layer(0.3, room) + gn.layer(0.6, screen) + gn.layer(1, crew) + gn.vignette(pen, 0.6, '#06030c') + gn.grain(pen, 0.08));
}

/** A jagged hole punched through glass, round (cx, cy), about r across: points of broken glass all round. */
function holeD(cx: number, cy: number, r: number, seed: number): string {
  const rand = gn.rng(seed);
  const pts: gn.P[] = [];
  const n = 18;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const k = i % 2 ? 0.55 + rand() * 0.3 : 0.9 + rand() * 0.35;
    pts.push([cx + Math.cos(a) * r * k, cy + Math.sin(a) * r * k * 1.1]);
  }
  return gn.dPoly(pts);
}

/** A planter box of the garden deck with its leafy plants and a few glowing flowers; box top centre at (x, y), `w` wide. */
function planter(pen: gn.Pen, x: number, y: number, w: number, seed: number): string {
  const rand = gn.rng(seed);
  let leaves = '';
  for (let i = 0; i < 7; i++) {
    const lx = x - w * 0.4 + (w * 0.8 * i) / 6 + (rand() - 0.5) * 20;
    const deg = 180 + (lx - x) * 0.18 + (rand() - 0.5) * 30;
    leaves += bigLeaf(pen, lx, y + 6, 110 + rand() * 90, deg, i % 2 ? '#3f7a4a' : '#2f6a3e', { line: 2.4, rim: 2 });
  }
  let flowers = '';
  for (let i = 0; i < 4; i++) {
    const fx = x - w * 0.3 + rand() * w * 0.6;
    const fy = y - 60 - rand() * 90;
    const c = ['#7fe6ff', '#ffd166', '#c8a8ff', '#7dff9a'][i];
    flowers += pen.glow(fx, fy, 30, c, 0.6) + `<circle cx="${gn.r1(fx)}" cy="${gn.r1(fy)}" r="7" fill="${c}" stroke="${gn.INK}" stroke-width="2"/>`;
  }
  const box = pen.form(`M${x - w / 2} ${y}H${x + w / 2}L${x + w / 2 - 14} ${y + 120}H${x - w / 2 + 14}Z`, '#5a3a2a', {
    sh: 40,
    hatch: 2,
    line: 3,
    rim: 2.4,
    inner: `<path d="M${x - w / 2} ${y + 40}H${x + w / 2}M${x - w / 2} ${y + 80}H${x + w / 2}" stroke="${gn.INK}" stroke-width="2.6" opacity=".5"/>`,
  });
  return leaves + flowers + box + pen.form(`M${x - w / 2 - 10} ${y - 8}H${x + w / 2 + 10}V${y + 12}H${x - w / 2 - 10}Z`, '#7a5238', { sh: 8, line: 2.6, rim: 2 });
}

/** 11. Night on the garden deck: three spider-drones carry Celestia's pot out through a smashed window; LUX races after them. */
export function ch2Drones(): string {
  const pen = gn.Pen.scene('ch2-drones', { key: [-0.45, -0.9], keyColor: '#cfe4ff', rim: [0.9, -0.25], rimColor: '#ff8ad8', shadow: '#2a2a6a', depth: 0.6 });
  const [hx, hy] = [1230, 250];
  const hole = holeD(hx, hy, 190, 4);
  // The deck's great window: space and Gaia Nova outside, the glass panes, a jagged hole and its cracks.
  const win = 'M520 -60H1680V700H520Z';
  const cracks: [gn.P[], number][] = [];
  const rand = gn.rng(12);
  for (let i = 0; i < 11; i++) {
    const a = (i / 11) * Math.PI * 2 + rand() * 0.3;
    const r0 = 150 + rand() * 30;
    const l = 40 + rand() * 90;
    const p0: gn.P = [hx + Math.cos(a) * r0, hy + Math.sin(a) * r0 * 1.1];
    const p1: gn.P = [hx + Math.cos(a + 0.08) * (r0 + l * 0.5), hy + Math.sin(a + 0.08) * (r0 + l * 0.5) * 1.1];
    const p2: gn.P = [hx + Math.cos(a - 0.05) * (r0 + l), hy + Math.sin(a - 0.05) * (r0 + l) * 1.1];
    cracks.push([[p0, p1, p2], 1.8 + rand() * 1.4]);
  }
  const outside =
    gn.sky(pen, [
      [0, '#02030e'],
      [0.7, '#0a1238'],
    ]) +
    gn.starfield(pen, 5, 120, 520, -60, 1160, 620) +
    gaiaNova(pen, 1080, 2560, 2000, { sun: [0.9, -0.3], seed: 11, band: [0.9, 0.995], lands: 9 });
  const glass = pen.lin([
    [0, '#9ad0ff', 0.16],
    [0.5, '#9ad0ff', 0.04],
    [1, '#9ad0ff', 0.12],
  ]);
  const mullions = [880, 1500].map((mx) => `M${mx - 16} -60H${mx + 16}V700H${mx - 16}Z`).join('') + 'M520 486H1680V510H520Z';
  const room =
    gn.sky(pen, [
      [0, '#0c0e26'],
      [1, '#1a1838'],
    ]) +
    `<g clip-path="${clipUrl(pen, win)}">${outside}</g>` +
    `<path d="${win}${hole}" fill="${glass}" fill-rule="evenodd"/>` +
    `<g clip-path="${clipUrl(pen, win)}"><path d="M560 640L760 -60H860L660 640ZM1360 640L1560 -60H1600L1400 640Z" fill="#ffffff" opacity=".05"/></g>` +
    pen.form(`${mullions}`, '#232848', { sh: 12, hatch: 1, line: 3, rim: 2 }) +
    pen.brushes(cracks, '#e8f6ff', [0.1, 0.8], 0.85) +
    `<path d="${hole}" fill="none" stroke="#e8f6ff" stroke-width="4"/><path d="${hole}" fill="none" stroke="${gn.INK}" stroke-width="1.6" opacity=".6"/>` +
    pen.form('M480 -60H560V720H480Z', '#1a1e3a', { sh: 30, hatch: 2, line: 3, rim: 2 }) +
    // The deck floor, shining with the window's light.
    pen.form('M-80 700H1680V960H-80Z', '#1a1c38', {
      sh: 40,
      line: 3,
      inner: `<path d="M-80 760H1680M-80 840H1680M200 700L60 960M600 700L540 960M1000 700L1040 960M1400 700L1520 960" stroke="${gn.INK}" stroke-width="2.4" opacity=".45"/><path d="M560 704L1680 704L1680 900L760 900Z" fill="#9ad0ff" opacity=".07"/>`,
    }) +
    gn.haze(pen, 600, 760, '#3a3a7a', 0.4);
  // The empty pedestal where Celestia stood, its glass bell smashed, and her pollen trailing toward the hole.
  const sparkles = [
    [820, 600, 9],
    [900, 560, 7],
    [960, 600, 6],
    [1010, 540, 8],
    [1080, 560, 6],
    [1120, 500, 9],
    [860, 520, 5],
  ]
    .map(([sx, sy, sr]) => gn.spark(pen, sx, sy, sr, '#ffd6f2', 0.9))
    .join('');
  const deck =
    planter(pen, 200, 740, 380, 3) +
    gn.castShadow(pen, 760, 800, 130, 16, 0.5) +
    // A round pedestal; on it the broken glass bell, and the empty ring where her pot stood.
    pen.form('M690 650Q760 672 830 650V786Q760 808 690 786Z', '#3a3e5e', { sh: 40, hatch: 2, line: 3, rim: 2.2, axis: [0, 1], inner: `<path d="M690 676Q760 698 830 676M690 760Q760 782 830 760" fill="none" stroke="${gn.INK}" stroke-width="2.4" opacity=".5"/>` }) +
    pen.form('M676 650Q760 676 844 650Q760 624 676 650Z', '#5a5e80', { line: 2.6, inner: `<ellipse cx="760" cy="650" rx="34" ry="9" fill="none" stroke="#ff8ad8" stroke-width="4" opacity=".8"/>` }) +
    pen.glow(760, 650, 60, '#ff6fcf', 0.5, 20) +
    `<path d="M682 652L690 590L704 612L716 570L730 606L736 640M790 640L798 600L810 622L818 580L832 616L840 652" fill="#bfe6ff" fill-opacity=".35" stroke="#e8f8ff" stroke-width="3"/>` +
    [
      [690, 690, 20],
      [840, 694, -30],
      [870, 708, 60],
      [660, 712, 120],
    ]
      .map(([sx, sy, rot]) => gn.at(sx, sy, 1, `<path d="M-14 6L0 -14L16 4Z" fill="#cfefff" stroke="${gn.INK}" stroke-width="2"/>`, false, rot))
      .join('') +
    pen.brush(
      [
        [760, 640],
        [900, 590],
        [1060, 560],
        [1190, 470],
      ],
      26,
      '#ff8ad8',
      [0.2, 0.2],
      0.3,
    ) +
    sparkles +
    planter(pen, 1460, 760, 360, 5);
  // The drones, flying the pot out through the hole on tethers.
  const pot: gn.P = [1180, 520];
  const drones: [number, number, number, number][] = [
    [1080, 300, 0.95, -6],
    [1300, 210, 1.05, -12],
    [1360, 380, 0.9, -4],
  ];
  const tethers = drones.map(([dx, dy, ds], i): [gn.P[], number] => [[[dx, dy + 80 * ds], gn.lerp([dx, dy + 80 * ds], [pot[0] - 40 + i * 40, pot[1] - 96], 0.5), [pot[0] - 40 + i * 40, pot[1] - 96]], 4]);
  const raid =
    pen.glow(pot[0], pot[1] - 150, 280, '#ff6fcf', 0.55) +
    pen.brushes(
      tethers.map(([p]) => [p, 6] as [gn.P[], number]),
      gn.INK,
      [0.02, 0.02],
    ) +
    pen.brushes(
      tethers.map(([p]) => [p, 2.6] as [gn.P[], number]),
      '#e0e6f4',
      [0.02, 0.02],
    ) +
    celestiaPot(pen, pot[0], pot[1], 0.95, { rot: -10 }) +
    drones.map(([dx, dy, ds, rot]) => spiderDrone(pen, dx, dy, ds, { rot, legs: 'carry' })).join('') +
    // Shards of glass blown out into space.
    [
      [1420, 120, 30, 1.2],
      [1460, 300, -40, 0.9],
      [1360, 60, 70, 0.8],
      [1500, 200, 10, 1],
      [1130, 80, -20, 0.7],
    ]
      .map(([sx, sy, rot, s]) => gn.at(sx, sy, s, pen.local(false, rot).form('M-20 10L0 -26L24 6L6 18Z', '#cfefff', { sh: 6, line: 2.2, rim: 1.6, warm: 0 }), false, rot))
      .join('') +
    gn.spark(pen, 1420, 120, 14, '#ffffff') +
    gn.spark(pen, 1060, 140, 10, '#ffffff');
  // LUX racing after them, streaks behind him.
  const hero = gn.streaks(pen, 400, 430, -95, 300, 5, 90, '#bfefff', 0.6, 3) + gn.lux(pen, 470, 410, 1.7, 'scared', { look: [9, -2], rot: 10 });
  // Ivy hanging from the deck's ceiling.
  let ivy = '';
  [
    [40, 330, 30],
    [150, 230, -20],
    [260, 300, 20],
    [380, 170, -10],
  ].forEach(([vx, vl, sway], i) => {
    const pts: gn.P[] = [
      [vx, -60],
      [vx + sway * 0.4, vl * 0.4],
      [vx + sway, vl],
    ];
    ivy += pen.brush(pts, 7, gn.INK, [0.02, 0.6]) + pen.brush(pts, 3.4, '#3f7a4a', [0.02, 0.6]);
    for (let k = 1; k < 5; k++) {
      const p = gn.lerp(gn.lerp(pts[0], pts[1], k / 5), gn.lerp(pts[1], pts[2], k / 5), k / 5);
      ivy += bigLeaf(pen, p[0], p[1], 46 - k * 3, (k + i) % 2 ? 50 : -50, (k + i) % 2 ? '#2f6a3e' : '#3f7a4a', { line: 2, rim: 1.6, hatch: 0 });
    }
  });
  const fore = ivy + bigLeaf(pen, -40, 980, 420, 150, '#14301e', { line: 3, rim: 2.4 }) + bigLeaf(pen, 40, 1000, 360, 120, '#1a3a24', { line: 3, rim: 2.4 }) + bigLeaf(pen, 1660, 990, 400, 205, '#14301e', { line: 3, rim: 2.4 });
  return pen.svg(gn.layer(0.3, room) + gn.layer(0.7, deck) + gn.layer(0.85, raid) + gn.layer(1, hero) + gn.layer(1.3, fore) + gn.vignette(pen, 0.6, '#04030e') + gn.grain(pen, 0.08));
}
