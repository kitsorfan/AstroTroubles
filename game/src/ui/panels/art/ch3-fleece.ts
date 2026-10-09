/**
 * Chapter 3 panels for the game's finale, the Golden Fleece: General Brennus and his little Legion squad
 * join the Argonauts in the tree-temple; Aeëtes in the Fleece armour, the Golden King; the Fleece laid
 * over Celestia at home; and (the secret ending) a valley full of little Celestias.
 */
import {
  aeetes,
  argoShip,
  at,
  atalanta,
  backdrop,
  brennus,
  C,
  captain,
  cloud,
  fleece,
  flower,
  gascuBloom,
  gasGiant,
  glow,
  glowDef,
  hypatia,
  ink,
  iris,
  jason,
  leaf,
  lin,
  lux,
  panel,
  rad,
  ridge,
  sparkle,
  stars,
  vignette,
  vine,
} from '../kit';

const GOLD_VINE = '#e8b030';

/** One of Brennus's own Legion robots, painted green again: a round helmet, a green eye and a green ring above (feet at x, y). */
function squadBot(x: number, y: number, s: number, salute = false): string {
  const arm = salute ? `<path d="M34 -118L62 -150L48 -176" fill="none" stroke="#3e5a2a" stroke-width="16" stroke-linecap="round"/>` : `<path d="M34 -118L46 -70" fill="none" stroke="#3e5a2a" stroke-width="16" stroke-linecap="round"/>`;
  const body = `<ellipse cx="0" cy="-2" rx="54" ry="10" fill="#000" opacity=".2"/>
    <rect x="-26" y="-60" width="18" height="58" rx="6" fill="#2e3a22" ${ink(4)}/><rect x="8" y="-60" width="18" height="58" rx="6" fill="#2e3a22" ${ink(4)}/>
    <path d="M-34 -118L-46 -70" fill="none" stroke="#3e5a2a" stroke-width="16" stroke-linecap="round"/>${arm}
    <rect x="-40" y="-140" width="80" height="86" rx="20" fill="#5a7a3a" ${ink(5)}/><path d="M-22 -110H22" stroke="#86b84e" stroke-width="6"/>
    <circle cx="0" cy="-172" r="38" fill="#4a6a32" ${ink(5)}/><rect x="-24" y="-182" width="48" height="16" rx="8" fill="#0e2a1a" ${ink(3)}/><circle cx="0" cy="-174" r="7" fill="#3dff8a"/>
    <ellipse cx="0" cy="-226" rx="30" ry="9" fill="none" stroke="#3dff8a" stroke-width="6"/>`;
  return at(x, y, s, body);
}

/** Giant roots arching across the top and sides of a tree-temple room, with glowing gold light-words. */
function roots(id: string): string {
  const words = [
    [300, 210, '#5ec8ff'],
    [700, 140, '#7dff9a'],
    [1100, 160, '#ff6fcf'],
    [1350, 260, C.gold],
  ]
    .map(([x, y, c]) => `<g transform="translate(${x} ${y})" fill="none" stroke="${c}" stroke-width="7" stroke-linecap="round"><path d="M-30 0q15 -30 30 0t30 0M-10 22h20"/></g>`)
    .join('');
  return (
    `<defs>${lin(id + 'w', [[0, '#5a4630'], [1, '#2a2018']])}</defs>` +
    `<path d="M-20 -20H1620V260Q1400 120 1180 230Q1000 90 800 210Q600 80 420 220Q220 110 -20 260Z" fill="url(#${id}w)" ${ink(6)}/>` +
    `<path d="M-20 240Q120 420 60 900H-20Z" fill="#4a3a28" ${ink(6)}/><path d="M1620 240Q1480 420 1540 900H1620Z" fill="#4a3a28" ${ink(6)}/>` +
    words
  );
}

/** 25. In the root hall, Brennus stands by his smoking lifeboat with his green squad, and meets the Argonauts. */
export function ch3Squad(): string {
  const id = 'ch3-squad';
  return panel(
    backdrop(id + 'b', [[0, '#ffcf8a'], [0.6, '#f0b070'], [1, '#c88a50']]) +
      `<defs>${glowDef(id + 'g', C.gold, 0.6)}${rad(id + 's', [[0, '#e8e8e0'], [1, '#8a8a80']])}</defs>` +
      glow(id + 'g', 800, 380, 520, 0.6) +
      roots(id + 'r') +
      `<path d="M0 700Q800 660 1600 700V900H0Z" fill="#7aa24a" ${ink(5)}/>` +
      // The lifeboat, nose-down in the floor, smoking.
      `<g transform="translate(300 560) rotate(-18)"><rect x="-170" y="-70" width="340" height="140" rx="70" fill="#5a6a3a" ${ink(6)}/><circle cx="90" cy="-10" r="34" fill="#8fd8ff" ${ink(5)}/><path d="M-120 -70V70M-40 -70V70" stroke="#3e4a2a" stroke-width="6"/><circle cx="-150" cy="0" r="18" fill="${C.red}" ${ink(4)}/></g>` +
      [0, 1, 2].map((i) => `<circle cx="${180 + i * 40}" cy="${420 - i * 70}" r="${40 + i * 14}" fill="url(#${id}s)" opacity="${0.75 - i * 0.2}"/>`).join('') +
      squadBot(250, 820, 0.95, true) +
      squadBot(420, 860, 1.05, true) +
      squadBot(110, 870, 0.9) +
      brennus(640, 900, 1.65, { pose: 'hips', face: 'grin' }) +
      atalanta(1050, 900, 1.5, { pose: 'wave', face: 'grin' }) +
      jason(1300, 905, 1.45, { pose: 'cheer', face: 'happy', flip: true }) +
      lux(1180, 520, 0.8, 'happy') +
      iris(940, 470, 0.9, 'happy') +
      sparkle(820, 300, 12, '#fff6d0') +
      sparkle(1480, 420, 9, '#fff6d0') +
      vignette(id + 'v', 0.3, '#3a2010'),
  );
}

/** 26. Aeëtes wearing the Golden Fleece: gold armour, a crown, gold vines curling out of his shoulders. */
export function ch3GoldenKing(): string {
  const id = 'ch3-goldenking';
  const vines = [
    [[720, 330], [560, 230], [480, 110], [380, 60]],
    [[720, 360], [520, 360], [400, 300], [300, 330]],
    [[880, 330], [1040, 230], [1120, 110], [1220, 60]],
    [[880, 360], [1080, 360], [1200, 300], [1300, 330]],
  ]
    .map((p) => vine(p, 22, false, GOLD_VINE, C.gold))
    .join('');
  const crown = `<path d="M-70 0L-80 -60L-40 -26L0 -80L40 -26L80 -60L70 0Z" fill="${C.gold}" ${ink(5)}/><circle cx="0" cy="-30" r="10" fill="#7dff9a" ${ink(3)}/>`;
  return panel(
    backdrop(id + 'b', [[0, '#2a1440'], [0.6, '#6a3a40'], [1, '#c8783a']]) +
      `<defs>${glowDef(id + 'g', C.gold, 0.7)}${glowDef(id + 'c', '#7dff9a', 0.8)}</defs>` +
      stars(12, 60, 0, 0, 1600, 300) +
      glow(id + 'g', 800, 420, 560, 0.85) +
      vines +
      // The Fleece as his cloak, behind him.
      fleece(id + 'f', 800, 560, 2.2) +
      aeetes(800, 930, 2.05, { pose: 'spread', face: 'grin' }) +
      // Gold armour plates over the coat, the crown, and the glowing seed-core behind its crystal clasp.
      at(800, 585, 0.8, `<path d="M-120 -40Q0 -90 120 -40L100 120Q0 150 -100 120Z" fill="${C.gold}" opacity=".92" ${ink(6)}/><path d="M-90 -10H90M-80 40H80" stroke="#c8801a" stroke-width="6"/>`) +
      glow(id + 'c', 800, 610, 110, 0.9) +
      at(800, 610, 0.9, `<path d="M0 -44L38 0L0 44L-38 0Z" fill="#dfffe8" opacity=".85" ${ink(5)}/><circle r="18" fill="#7dff9a"/>`) +
      at(800, 296, 1.0, crown) +
      // The three heroes far below, looking up, ready.
      jason(290, 905, 0.9, { pose: 'point', face: 'determined' }) +
      atalanta(110, 905, 0.9, { face: 'determined', bow: 'hand' }) +
      brennus(1430, 905, 0.95, { pose: 'hips', face: 'stern' }) +
      sparkle(600, 260, 12, '#fff6d0') +
      sparkle(1010, 240, 14, '#fff6d0') +
      sparkle(820, 700, 10, '#fff') +
      vignette(id + 'v', 0.45, '#1a0820'),
  );
}

/** A rolling meadow at sunset with flowers dotted along it (for the ending pictures). */
function meadow(seed: number, y: number, colors: string[]): string {
  let out = `<path d="M0 ${y}Q400 ${y - 40} 800 ${y}T1600 ${y}V900H0Z" fill="#7ab84a" ${ink(5)}/>`;
  for (let i = 0; i < 16; i++) {
    const x = 40 + ((i * 97 + seed * 31) % 1520);
    const fy = y + 40 + ((i * 53) % 140);
    out += flower(x, fy, 10 + (i % 3) * 4, colors[i % colors.length]);
  }
  return out;
}

/** 27. Home on Gaia Nova: the Argonauts lay the Golden Fleece over Celestia in the colony garden, the Argo behind. */
export function ch3Home(): string {
  const id = 'ch3-home';
  return panel(
    backdrop(id + 'b', [[0, '#5a6ad0'], [0.45, '#ff9a7a'], [0.75, '#ffd8a0'], [1, '#ffe8c0']]) +
      `<defs>${glowDef(id + 'g', C.gold, 0.7)}</defs>` +
      stars(5, 30, 0, 0, 1600, 180, '#fff6e0') +
      gasGiant(id + 'j', 1380, 200, 120) +
      cloud(240, 150, 0.8, '#fff', 0.7) +
      ridge(3, 560, 60, '#c87a6a', 5) +
      ridge(8, 620, 40, '#8a9a5a', 4) +
      argoShip(id + 'a', 1220, 560, 0.55, 0, false) +
      meadow(4, 690, [C.pink, C.gold, C.hello, '#fff']) +
      // Celestia, bright and strong again, with the Fleece draped round her like a golden blanket.
      glow(id + 'g', 800, 430, 380, 0.9) +
      gascuBloom(id + 'c', 800, 400, 1.15, 300) +
      fleece(id + 'f', 800, 700, 1.05) +
      leaf(700, 760, 1.4, 200) +
      leaf(900, 770, 1.3, -20) +
      jason(560, 905, 1.2, { pose: 'cheer', face: 'grin' }) +
      atalanta(380, 905, 1.15, { pose: 'cheer', face: 'happy' }) +
      brennus(1040, 905, 1.2, { pose: 'plant', face: 'smile' }) +
      hypatia(1230, 905, 1.1, { pose: 'cheer', face: 'happy' }) +
      captain(190, 905, 1.1, { pose: 'wave', face: 'smile' }) +
      lux(640, 560, 0.75, 'happy') +
      iris(960, 540, 0.8, 'happy', true) +
      sparkle(800, 240, 16, '#fff6d0') +
      sparkle(620, 360, 10, '#fff') +
      sparkle(990, 330, 12, '#fff6d0') +
      vignette(id + 'v', 0.3, '#2a1030'),
  );
}

/** 28. The secret ending: LUX and IRIS sing light-words over a valley full of little Celestias, golden seeds drifting down. */
export function ch3Gardeners(): string {
  const id = 'ch3-gardeners';
  const words = ['#5ec8ff', '#7dff9a', '#ff6fcf', C.gold, '#c37bff']
    .map((c, i) => `<g transform="translate(${470 + i * 165} ${150 + (i % 2) * 50})" fill="none" stroke="${c}" stroke-width="9" stroke-linecap="round"><path d="M-34 0q17 -34 34 0t34 0"/><path d="M-14 26h28"/></g>`)
    .join('');
  let blooms = '';
  const spots = [
    [180, 700, 0.42],
    [360, 760, 0.5],
    [560, 690, 0.38],
    [1050, 690, 0.4],
    [1240, 770, 0.5],
    [1430, 700, 0.42],
    [260, 860, 0.36],
    [1350, 870, 0.36],
  ];
  spots.forEach(([x, y, s], i) => (blooms += gascuBloom(`${id}b${i}`, x, y, s, 160)));
  let seeds = '';
  for (let i = 0; i < 26; i++) seeds += sparkle(60 + ((i * 131) % 1480), 120 + ((i * 89) % 520), 5 + (i % 4) * 2, i % 3 ? C.gold : '#7dff9a');
  return panel(
    backdrop(id + 'b', [[0, '#3a4ab8'], [0.5, '#8a7ad8'], [0.8, '#ffc8a8'], [1, '#ffe8c8']]) +
      `<defs>${glowDef(id + 'g', C.gold, 0.6)}${glowDef(id + 'r', '#ffffff', 0.5)}</defs>` +
      stars(9, 50, 0, 0, 1600, 260, '#fff6e0') +
      ridge(5, 560, 70, '#9a8ac8', 5) +
      meadow(7, 640, ['#7dff9a', C.pink, C.gold, C.hello]) +
      glow(id + 'r', 800, 170, 420, 0.6) +
      words +
      lux(380, 230, 0.85, 'glow') +
      iris(1230, 230, 0.9, 'sing', true) +
      blooms +
      glow(id + 'g', 800, 460, 340, 0.9) +
      gascuBloom(id + 'c', 800, 470, 1.0, 300) +
      seeds +
      vignette(id + 'v', 0.25, '#1a1040'),
  );
}
