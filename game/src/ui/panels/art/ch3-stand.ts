/** Chapter 3 panels for Brennus's Last Stand: the old general on Colchis's sky-dock as the gold fleet comes, and his salute to the Argo. */
import { argoShip, at, backdrop, brennus, C, cloud, gascuSprout, gasGiant, glow, glowDef, goldShip, ink, lin, panel, sparkle, stars, vignette } from '../kit';

const STONE = '#e8dcc4';
const STONE_DARK = '#b4a48a';
const RUNE = '#5ee0c8';

/** One of Brennus's old Legion robots, olive again, with a green lens: on his side (feet at x, y). */
function legionBot(x: number, y: number, s: number, flip = false): string {
  const body = `<path d="M-30 -10L-34 -60M30 -10L34 -60" stroke="#262e16" stroke-width="18" stroke-linecap="round"/>
    <path d="M-48 -10H-18M18 -10H48" ${ink(8)}/><path d="M-48 -10H-18M18 -10H48" stroke="#3a4426" stroke-width="12" stroke-linecap="round"/>
    <ellipse cx="0" cy="-104" rx="62" ry="54" fill="${C.olive}" ${ink(6)}/>
    <circle cx="0" cy="-96" r="14" fill="${C.red}" ${ink(3)}/>
    <ellipse cx="-58" cy="-134" rx="20" ry="13" fill="#c9a24a" ${ink(4)}/><ellipse cx="58" cy="-134" rx="20" ry="13" fill="#c9a24a" ${ink(4)}/>
    <ellipse cx="0" cy="-176" rx="40" ry="34" fill="${C.olive}" ${ink(5)}/>
    <circle cx="8" cy="-174" r="15" fill="#3dff8a" ${ink(4)}/><circle cx="12" cy="-178" r="5" fill="#fff"/>
    <path d="M-20 -206V-232" ${ink(4)}/><circle cx="-20" cy="-236" r="6" fill="#3dff8a" ${ink(3)}/>
    <rect x="30" y="-118" width="70" height="20" rx="7" fill="#2a2c24" ${ink(4)}/>`;
  return at(x, y, s, body, flip);
}

/** The Gardeners' great arch of pale stone, glowing with teal light-runes (feet of the pillars at y). */
function greatArch(id: string, x0: number, x1: number, y: number, top: number): string {
  const mid = (x0 + x1) / 2;
  const w = 70;
  let runes = '';
  for (let i = 0; i < 6; i++) {
    for (const px of [x0, x1]) runes += `<circle cx="${px}" cy="${y - 60 - i * ((y - top - 120) / 6)}" r="${i % 2 ? 7 : 10}" fill="${RUNE}"/>`;
  }
  return `<defs>${glowDef(id + 'r', RUNE, 0.6)}</defs>${glow(id + 'r', mid, top + 80, (x1 - x0) * 0.55, 0.35)}
    <path d="M${x0 - w} ${y}V${top + 90}Q${x0 - w} ${top - 40} ${mid} ${top - 70}Q${x1 + w} ${top - 40} ${x1 + w} ${top + 90}V${y}H${x1 - w}V${top + 110}Q${x1 - w} ${top + 30} ${mid} ${top + 10}Q${x0 + w} ${top + 30} ${x0 + w} ${top + 110}V${y}Z" fill="${STONE}" ${ink(6)}/>
    <path d="M${x0 + w - 18} ${y}V${top + 120}M${x1 + w - 18} ${y}V${top + 100}" stroke="#000" stroke-width="12" opacity=".08"/>
    ${runes}<circle cx="${mid}" cy="${top - 26}" r="22" fill="${RUNE}" ${ink(4)}/><circle cx="${mid}" cy="${top - 26}" r="9" fill="#fff"/>`;
}

/** The sky-dock's stone floor in front: a slab with glowing rune lines, its edge dropping to the clouds. */
function dockFloor(id: string, y: number): string {
  return `<defs>${lin(id + 'f', [[0, STONE], [1, STONE_DARK]])}</defs>
    <path d="M-20 ${y}Q800 ${y - 30} 1620 ${y}V920H-20Z" fill="url(#${id}f)" ${ink(6)}/>
    <path d="M100 ${y + 60}H700M900 ${y + 70}H1500M300 ${y + 130}H1300" stroke="${RUNE}" stroke-width="6" stroke-linecap="round" opacity=".75"/>`;
}

/** A sea of sunset clouds far below. */
function cloudSea(y: number): string {
  return (
    `<rect x="0" y="${y}" width="1600" height="${900 - y}" fill="#ffd2c0"/>` +
    [0, 1, 2, 3, 4, 5, 6, 7].map((i) => cloud(80 + i * 210, y + 30 + (i % 2) * 24, 1.1, i % 2 ? '#fff0e6' : '#ffe2d4')).join('')
  );
}

/** 25. On Colchis's sky-dock at sunset, Brennus and his Legion stand guard as Aeëtes's gold fleet comes over the clouds. */
export function ch3Stand(): string {
  const id = 'ch3-stand';
  const fleet = (
    [
      [300, 250, 0.32],
      [560, 175, 0.22],
      [140, 400, 0.24],
      [720, 330, 0.17],
      [430, 430, 0.14],
    ] as const
  )
    .map(([x, y, s], i) => at(x, y, 1, goldShip(`${id}g${i}`, 0, 0, s), true))
    .join('');
  return panel(
    backdrop(id + 'b', [[0, '#2a2060'], [0.5, '#9a5a9a'], [1, '#ffb487']]) +
      stars(25, 70, 0, 0, 1600, 300) +
      gasGiant(id + 'j', 1380, 160, 100, false) +
      cloudSea(560) +
      fleet +
      greatArch(id + 'a', 1180, 1460, 780, 220) +
      dockFloor(id + 'd', 720) +
      legionBot(470, 840, 0.95) +
      legionBot(1050, 850, 0.95, true) +
      brennus(760, 880, 1.3, { pose: 'hips', face: 'determined' }) +
      gascuSprout(id + 's', 860, 790, 0.42) +
      sparkle(870, 690, 10, C.pinkLight) +
      vignette(id + 'v', 0.35, '#2a1838'),
  );
}

/** The Golden Ram, lying down for a nap: gold curls, curly horns, eyes shut, smoke puffing from its engine (centre-bottom at x, y). */
function sleepyRam(x: number, y: number, s: number): string {
  const curls = [
    [-150, -90, 60],
    [-70, -120, 66],
    [20, -122, 66],
    [100, -100, 58],
    [-110, -40, 56],
    [60, -50, 60],
  ]
    .map(([cx, cy, r]) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#ffd870" ${ink(5)}/>`)
    .join('');
  const body = `<ellipse cx="0" cy="-30" rx="210" ry="60" fill="#c8901a" ${ink(6)}/>${curls}
    <rect x="-40" y="-200" width="80" height="50" rx="10" fill="#8a8f9a" ${ink(5)}/><path d="M-40 -200l-40 -40M40 -200l40 -40" stroke="#e8b43a" stroke-width="16" stroke-linecap="round"/>
    <circle cx="-20" cy="-250" r="22" fill="#9a9aa8" opacity=".8"/><circle cx="10" cy="-290" r="30" fill="#b0b0bc" opacity=".6"/><circle cx="-10" cy="-340" r="36" fill="#c8c8d2" opacity=".4"/>
    <g transform="translate(220 -70)"><rect x="-50" y="-60" width="110" height="96" rx="24" fill="#e8b43a" ${ink(6)}/>
      <path d="M-30 -10q12 10 24 0M20 -10q12 10 24 0" fill="none" ${ink(5)}/><rect x="-36" y="-34" width="90" height="12" rx="6" fill="${C.red}" opacity=".5"/>
      <path d="M-50 -40q-60 -30 -50 30q20 40 50 0" fill="none" stroke="#a8761c" stroke-width="22" stroke-linecap="round"/>
      <path d="M60 -40q60 -30 50 30q-20 40 -50 0" fill="none" stroke="#a8761c" stroke-width="22" stroke-linecap="round"/></g>
    <text x="300" y="-190" font-family="Fredoka, Nunito, sans-serif" font-weight="800" font-size="64" fill="#fff" ${ink(4)}>z</text>
    <text x="350" y="-250" font-family="Fredoka, Nunito, sans-serif" font-weight="800" font-size="84" fill="#fff" ${ink(4)}>Z</text>`;
  return at(x, y, s, body);
}

/** 26. The Argo slips through the great arch behind Brennus, who salutes, dented and proud; the Golden Ram naps beside him. */
export function ch3Salute(): string {
  const id = 'ch3-salute';
  // A sticking plaster on Brennus's cheek and a dent in his cap: he's fine, just a bit battered.
  const plaster = at(432, 584, 1.3, `<rect x="-22" y="-8" width="44" height="16" rx="6" fill="#ffd8b0" ${ink(3)} transform="rotate(-20)"/><path d="M-6 -4l12 8M6 -4l-12 8" stroke="#c89a70" stroke-width="2" transform="rotate(-20)"/>`);
  return panel(
    backdrop(id + 'b', [[0, '#3a2a7a'], [0.55, '#c86a8a'], [1, '#ffc08a']]) +
      stars(26, 50, 0, 0, 1600, 240) +
      cloudSea(620) +
      greatArch(id + 'a', 640, 1260, 760, 140) +
      argoShip(id + 's', 960, 330, 0.62, -6) +
      sparkle(1300, 250, 14, '#fff') +
      sparkle(620, 300, 10, '#fff') +
      dockFloor(id + 'd', 740) +
      sleepyRam(1130, 870, 1.0) +
      brennus(470, 900, 1.6, { pose: 'salute', face: 'smile' }) +
      plaster +
      gascuSprout(id + 'p', 600, 800, 0.5) +
      vignette(id + 'v', 0.35, '#2a1838'),
  );
}
