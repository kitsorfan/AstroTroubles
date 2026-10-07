/** Chapter 3 panels for General Brennus's own level: the lifeboat on its way to Aeëtes's mine, and the golden map. */
import { aeetes, at, backdrop, brennus, C, gascuSprout, gasGiant, glow, glowDef, ink, lin, panel, rad, sparkle, stars, vignette } from '../kit';

/** Aeëtes's mining moon: a dusty grey ball dug into a huge glowing gold pit, with little gold rigs on the rim. */
function miningMoon(id: string, x: number, y: number, r: number): string {
  const defs = `<defs>${rad(id + 'm', [[0, '#c8b8a8'], [0.7, '#8a7a6e'], [1, '#4a3e3a']], 0.35, 0.3, 0.8)}${rad(id + 'p', [[0, '#fff2b0'], [0.5, '#ffb030'], [1, '#a85a10']])}${glowDef(id + 'g', '#ffb030', 0.6)}</defs>`;
  const craters = [
    [-0.5, -0.45, 0.12],
    [0.45, -0.55, 0.09],
    [-0.62, 0.2, 0.08],
    [0.58, 0.35, 0.1],
  ]
    .map(([cx, cy, cr]) => `<circle cx="${cx * r}" cy="${cy * r}" r="${cr * r}" fill="#6a5c54" opacity=".7"/>`)
    .join('');
  const rigs = [-0.32, -0.08, 0.2, 0.42]
    .map((k, i) => `<path d="M${k * r} ${0.02 * r + (i % 2) * 8}l-14 -40h28z" fill="${C.gold}" ${ink(3)}/><path d="M${k * r} ${-0.02 * r - 34 + (i % 2) * 8}v-18" stroke="${C.gold}" stroke-width="4"/>`)
    .join('');
  const body = `${glow(id + 'g', 0, 0.15 * r, r * 0.9, 0.7)}<circle r="${r}" fill="url(#${id}m)" ${ink(6)}/>${craters}
    <ellipse cx="0" cy="${0.18 * r}" rx="${0.55 * r}" ry="${0.28 * r}" fill="url(#${id}p)" ${ink(5)}/>
    <ellipse cx="0" cy="${0.22 * r}" rx="${0.3 * r}" ry="${0.13 * r}" fill="#fff6c8" opacity=".7"/>${rigs}`;
  return defs + at(x, y, 1, body);
}

/** 23. Brennus at the controls of the Gorgon's old lifeboat, Celestia's sprout in its pot on the dashboard, Aeëtes's moon ahead. */
export function ch3Brennus(): string {
  const id = 'ch3-brennus';
  const lights = [0, 1, 2, 3, 4, 5, 6]
    .map((i) => `<circle cx="${980 + i * 46}" cy="770" r="11" fill="${['#ff3a4c', C.gold, '#3dff8a'][i % 3]}" ${ink(3)}/>`)
    .join('');
  return panel(
    backdrop(id + 'b', [[0, '#05061a'], [1, '#1a1236']]) +
      `<defs>${lin(id + 'd', [[0, '#5a6a3a'], [1, '#2a3218']])}</defs>` +
      stars(43, 160, 0, 0, 1600, 700) +
      gasGiant(id + 'j', 260, 210, 120, false) +
      miningMoon(id + 'm', 1060, 330, 230) +
      // The cockpit window: thick olive frame, rivets, and Brennus's red gear in the middle of the top bar.
      `<path d="M0 0H1600V900H0ZM120 90Q800 30 1480 90L1520 640Q800 690 80 640Z" fill="#3a4426" fill-rule="evenodd" ${ink(6)}/>` +
      `<path d="M800 50V666" stroke="#3a4426" stroke-width="26"/><path d="M800 50V666" fill="none" ${ink(4)}/>` +
      [180, 420, 1180, 1420].map((x) => `<circle cx="${x}" cy="${x < 800 ? 96 : 96}" r="9" fill="${C.gold}" ${ink(3)}/>`).join('') +
      at(800, 64, 1, `<circle r="34" fill="${C.red}" ${ink(5)}/><circle r="13" fill="#1a1630"/>`) +
      // The dashboard, with its buttons and a little radar.
      `<path d="M0 700Q800 650 1600 700V900H0Z" fill="url(#${id}d)" ${ink(6)}/>` +
      lights +
      `<circle cx="1420" cy="800" r="60" fill="#0e2a1a" ${ink(5)}/><path d="M1420 800L1470 770" stroke="#3dff8a" stroke-width="5"/><circle cx="1440" cy="780" r="7" fill="${C.gold}"/>` +
      brennus(520, 960, 1.35, { pose: 'hold', face: 'smile', legs: 'none' }) +
      gascuSprout(id + 's', 820, 760, 0.85) +
      sparkle(840, 610, 12, C.pinkLight) +
      sparkle(780, 640, 8, '#fff') +
      vignette(id + 'v', 0.4),
  );
}

/** 24. In Aeëtes's golden office, Brennus holds up the golden map to Colchis; Aeëtes fumes on a hologram screen. */
export function ch3Map(): string {
  const id = 'ch3-map';
  const route = `<path d="M-120 40Q-60 -40 0 10T120 -30" fill="none" stroke="#a8201a" stroke-width="6" stroke-dasharray="14 10"/>
    <circle cx="-120" cy="40" r="14" fill="#5ec8ff" ${ink(3)}/><circle cx="120" cy="-30" r="22" fill="#7dff9a" ${ink(3)}/>
    <path d="M108 -34l12 -10 12 10 -12 10z" fill="${C.gold}" ${ink(2)}/>`;
  const map = `<rect x="-170" y="-110" width="340" height="220" rx="10" fill="#ffe08a" ${ink(6)}/><rect x="-150" y="-92" width="300" height="184" rx="6" fill="none" stroke="#c8901a" stroke-width="5"/>${route}`;
  return panel(
    backdrop(id + 'b', [[0, '#5a3a1a'], [0.6, '#8a5a20'], [1, '#3a2410']]) +
      `<defs>${glowDef(id + 'g', C.gold, 0.6)}${glowDef(id + 'h', '#7fe6ff', 0.5)}</defs>` +
      // Gold wall panels and a gold desk piled with coins.
      [0, 1, 2, 3, 4].map((i) => `<rect x="${60 + i * 300}" y="80" width="240" height="420" rx="16" fill="#c8901a" opacity=".55" ${ink(4)}/>`).join('') +
      `<path d="M0 640H1600V900H0Z" fill="#4a2a10"/>` +
      `<rect x="860" y="600" width="640" height="70" rx="10" fill="${C.gold}" ${ink(6)}/><rect x="900" y="670" width="60" height="230" fill="#c8901a" ${ink(5)}/><rect x="1400" y="670" width="60" height="230" fill="#c8901a" ${ink(5)}/>` +
      [0, 1, 2, 3].map((i) => `<ellipse cx="${1180 + i * 22}" cy="${592 - i * 14}" rx="46" ry="13" fill="${C.gold}" ${ink(3)}/>`).join('') +
      // Aeëtes, cross, on a hologram screen above the desk.
      `<rect x="1060" y="130" width="380" height="330" rx="16" fill="#0b2a3a" opacity=".85" ${ink(5)}/>` +
      glow(id + 'h', 1250, 300, 200, 0.5) +
      `<g opacity=".8">${aeetes(1250, 520, 0.8, { pose: 'fist', face: 'angry' })}</g>` +
      // Brennus holding the map up high, with a grin under the moustache.
      glow(id + 'g', 520, 300, 260, 0.7) +
      at(520, 290, 1, map, false, -6) +
      brennus(500, 960, 1.4, { pose: 'cheer', face: 'grin' }) +
      sparkle(330, 190, 14, '#fff6d0') +
      sparkle(700, 170, 10, '#fff6d0') +
      sparkle(690, 400, 8, '#fff') +
      vignette(id + 'v', 0.35, '#2a1408'),
  );
}
