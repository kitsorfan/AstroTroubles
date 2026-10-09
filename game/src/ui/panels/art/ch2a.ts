/** Chapter 2 panels, part 1: arriving at Gaia Nova, Brennus's broadcast, and the drones' raid. */
import * as gn from '../gn';
import { clipUrl, gaiaNova, gearMark, syracusia } from '../gn/ch2a';
import {
  at,
  backdrop,
  brennus,
  C,
  captain,
  drone,
  gascuSprout,
  glow,
  glowDef,
  ink,
  jason,

  lux,
  panel,
  planet,
  rad,
  stars,
  sparkle,
  vignette,
} from '../kit';

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
    gn.spark(pen, sunX, sunY, 110, '#ffffff', 0.95) +
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
    gn.jason(right, 1290, 1028, 1.2, {
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

/** A long pot tether from a drone's legs to the pot rim. */
const tether = (x1: number, y1: number, x2: number, y2: number) => `<path d="M${x1} ${y1}L${x2} ${y2}" stroke="#9aa6ba" stroke-width="4" stroke-dasharray="10 6"/>`;

/** 11. Night on the garden deck: spider-drones carry GaScu off through a broken window; LUX reaching out. */
export function ch2Drones(): string {
  const id = 'ch2-drones';
  const hole = 'M1250 110L1330 190L1420 160L1400 260L1470 330L1370 360L1390 440L1290 390L1200 430L1210 330L1150 280L1230 230Z';
  const bush = (x: number, y: number, s: number) =>
    at(x, y, s, `<g fill="#244a32" ${ink(5)}><circle cx="-50" cy="-30" r="50"/><circle cx="40" cy="-36" r="56"/><circle cx="-4" cy="-80" r="56"/></g><path d="M-80 -60Q-60 -110 -10 -126M20 -120Q70 -110 86 -60" fill="none" stroke="#6a9ad0" stroke-width="6" opacity=".45" stroke-linecap="round"/>`);
  return panel(
    backdrop(id + 'b', [[0, '#0a0f2a'], [1, '#1a1f4a']]) +
      `<defs>${glowDef(id + 'm', '#9ad0ff', 0.5)}${glowDef(id + 'l', C.cyan, 0.7)}</defs>` +
      // The big window, with a jagged hole where the drones broke in.
      `<defs><clipPath id="${id}w"><rect x="640" y="50" width="920" height="600" rx="30"/></clipPath></defs>
      <g clip-path="url(#${id}w)"><rect x="640" y="50" width="920" height="600" fill="#05081c"/>${stars(9, 50, 640, 50, 920, 600)}
      ${planet(id + 'p', 1420, 600, 220, 0.25)}
      <path d="M640 50H1560V650H640Z${hole}" fill="#9ad0ff" fill-rule="evenodd" opacity=".2"/></g>
      <path d="${hole}" fill="none" stroke="#e8f6ff" stroke-width="5" stroke-linejoin="round"/>
      <path d="M1150 280L1060 240M1210 330L1100 400M1200 430L1180 520M1390 440L1440 540M1470 330L1540 320M1420 160L1490 90M1250 110L1240 60" stroke="#e8f6ff" stroke-width="3" opacity=".8"/>
      <path d="M950 50V650M1255 50V110M1255 430V650M640 350H1150M1470 350H1560" stroke="#2a3060" stroke-width="18"/>
      <rect x="640" y="50" width="920" height="600" rx="30" fill="none" stroke="#3a4278" stroke-width="22"/>
      <g fill="#cfe8ff" opacity=".8" ${ink(3)}><path d="M1500 220l30 -14 -8 34Z"/><path d="M1080 170l26 6 -20 22Z"/><path d="M1460 470l20 -20 6 26Z"/></g>
      <path d="M640 650L380 900H900L1000 650ZM1150 650L1200 900H1560L1450 650Z" fill="#9ad0ff" opacity=".07"/>` +
      `<path d="M0 690H1600V900H0Z" fill="#121838"/><path d="M0 690H1600" stroke="#2a3060" stroke-width="6"/>` +
      `<rect x="30" y="700" width="560" height="110" rx="14" fill="#4a3428" ${ink(5)}/><path d="M50 730H570" stroke="#000" stroke-width="6" opacity=".2"/>` +
      bush(120, 712, 1.1) +
      bush(330, 716, 1.3) +
      bush(520, 712, 0.95) +
      // The drones carrying the pot off.
      tether(1100, 360, 1100, 450) +
      tether(1210, 290, 1150, 450) +
      tether(1330, 340, 1200, 450) +
      gascuSprout(id + 'g', 1150, 580, 0.95) +
      drone(1100, 330, 0.8) +
      drone(1330, 310, 0.8) +
      drone(1210, 250, 0.9) +
      // LUX reaching out with a little arm.
      glow(id + 'l', 400, 400, 170) +
      at(400, 400, 1.5, `<path d="M44 0Q100 -16 140 -24" fill="none" ${ink(16)}/><path d="M44 0Q100 -16 140 -24" fill="none" stroke="#9aa6ba" stroke-width="7" stroke-linecap="round"/><circle cx="144" cy="-26" r="11" fill="#9aa6ba" ${ink(4)}/>`) +
      lux(400, 400, 1.5, 'scared') +
      sparkle(900, 420, 12, C.pinkLight, 0.8) +
      sparkle(1000, 560, 8, C.pinkLight, 0.7) +
      vignette(id + 'v', 0.5),
  );
}
