/** Chapter 2 panels, part 1: arriving at Gaia Nova, Brennus's broadcast, and the drones' raid. */
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
  sparkle,
  stars,
  syracusia,
  vignette,
} from '../kit';

/** 9. The Syracusia in orbit over the big green-and-blue planet, with sunrise on its edge. */
export function ch2Arrival(): string {
  const id = 'ch2-arrival';
  // The planet's centre and radius, and the sun rising on its edge.
  const [px, py, pr] = [820, 1320, 780];
  const sx = 400;
  const sy = Math.round(py - Math.sqrt(pr * pr - (sx - px) ** 2));
  const top = Math.round(py - Math.sqrt(pr * pr - 380 * 380));
  const limbArc = `M${px - pr} ${py}A${pr} ${pr} 0 0 1 ${px + 380} ${top}`;
  return panel(
    backdrop(id + 'b', [[0, '#070a24'], [0.5, '#141a4a'], [1, '#2a3a7a']]) +
      `<defs>${glowDef(id + 's', '#ffd9a0', 0.95)}${rad(id + 'h', [[0, '#ffd166', 0.6], [1, '#ffd166', 0]])}</defs>` +
      stars(77, 120, 0, 0, 1600, 560) +
      planet(id + 'p', px, py, pr, 0.3, 50) +
      `<path d="${limbArc}" fill="none" stroke="#ffd166" stroke-width="48" opacity=".25"/><path d="${limbArc}" fill="none" stroke="#ffe7b0" stroke-width="12" opacity=".9"/>` +
      `<ellipse cx="${sx}" cy="${sy}" rx="720" ry="320" fill="url(#${id}h)"/>` +
      glow(id + 's', sx, sy, 300) +
      `<circle cx="${sx}" cy="${sy}" r="46" fill="#fffbea"/>` +
      sparkle(sx, sy, 110, '#fff6dc', 0.9) +
      `<g fill="#ffe7b0" opacity=".4"><circle cx="${sx + 200}" cy="${sy - 110}" r="22"/><circle cx="${sx + 330}" cy="${sy - 180}" r="12"/></g>` +
      syracusia(id + 'h', 1090, 230, 0.5) +
      sparkle(1460, 90, 16) +
      sparkle(160, 140, 12, '#cfe0ff') +
      vignette(id + 'v', 0.35),
  );
}

/** 10. The Bridge: Brennus scowling on the big screen; the Captain, Jason and LUX watching in shock. */
export function ch2Broadcast(): string {
  const id = 'ch2-broadcast';
  const lines = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13].map((i) => `M270 ${100 + i * 38}H1330`).join('');
  return panel(
    backdrop(id + 'b', [[0, '#0e1230'], [1, '#1a0e20']]) +
      `<defs>${glowDef(id + 'r', '#ff3a4c', 0.6)}${rad(id + 's', [[0, '#7a2030'], [1, '#2a0810']], 0.5, 0.4, 0.7)}
      <clipPath id="${id}c"><rect x="270" y="80" width="1060" height="540" rx="24"/></clipPath></defs>` +
      glow(id + 'r', 800, 350, 900, 0.8, 520) +
      `<rect x="240" y="50" width="1120" height="600" rx="40" fill="#1a1630" ${ink(8)}/>` +
      `<g clip-path="url(#${id}c)"><rect x="270" y="80" width="1060" height="540" fill="url(#${id}s)"/>` +
      `<circle cx="800" cy="330" r="300" fill="#ff3a4c" opacity=".12"/>` +
      brennus(800, 940, 2.3, { legs: 'none', face: 'angry' }) +
      `<path d="${lines}" stroke="#000" stroke-width="8" opacity=".18"/><rect x="270" y="80" width="1060" height="540" fill="#ff3a4c" opacity=".08"/></g>` +
      `<path d="M300 110Q500 90 640 100" fill="none" stroke="#fff" stroke-width="8" opacity=".25" stroke-linecap="round"/>` +
      `<path d="M0 700H1600V900H0Z" fill="#141a3a"/><path d="M0 700H1600" stroke="#ff3a4c" stroke-width="5" opacity=".5"/>` +
      `<defs>${glowDef(id + 'k', '#ff8a9a', 0.5)}</defs>${glow(id + 'k', 300, 780, 300, 0.7, 260)}${glow(id + 'k', 1200, 780, 320, 0.7, 260)}` +
      captain(300, 1010, 1.35, { face: 'shock', pose: 'shock' }) +
      jason(1170, 1000, 1.25, { face: 'shock', pose: 'shock', flip: true }) +
      lux(1420, 610, 1.15, 'scared', '#7fe6ff', true) +
      vignette(id + 'v', 0.5),
  );
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
