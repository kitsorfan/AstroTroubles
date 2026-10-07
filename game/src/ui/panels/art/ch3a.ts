/** Chapter 3 panels: Celestia fading by the Gardeners' ruins, the Argo being built, and Aeëtes on his golden flagship. */
import {
  aeetes,
  argoShip,
  at,
  backdrop,
  C,
  captain,
  cloud,
  fleece,
  flower,
  gascuBloom,
  gasGiant,
  glow,
  glowDef,
  goldShip,
  hypatia,
  ink,
  jason,
  leaf,
  lin,
  lux,
  panel,
  ridge,
  ruinStone,
  saucer,
  sparkle,
  stars,
  vignette,
} from '../kit';

/** Rows of little sprouts in a garden bed. */
function sprouts(y: number, xs: number[], s: number): string {
  return xs.map((x, i) => `<path d="M${x} ${y}V${y - 26 * s}" stroke="#3f7a3a" stroke-width="${5 * s}"/>${leaf(x, y - 24 * s, 0.4 * s, i % 2 ? -150 : -160)}${leaf(x, y - 24 * s, 0.4 * s, i % 2 ? -30 : -20)}`).join('');
}

/** 20. The colony's first garden: Celestia drooping and pale; Dr. Hypatia reads the glowing ruin stone. */
export function ch3Fading(): string {
  const id = 'ch3-fading';
  return panel(
    backdrop(id + 'b', [[0, '#8ab4d8'], [0.6, '#cfdde6'], [1, '#e8ece4']]) +
      `<defs>${glowDef(id + 'g', C.gold, 0.5)}${glowDef(id + 'p', '#ffd0f0', 0.4)}${lin(id + 'm', [[0, C.gold, 0.55], [1, C.gold, 0]])}</defs>` +
      gasGiant(id + 'j', 1300, 190, 110) +
      cloud(260, 170, 0.9, '#fff', 0.8) +
      cloud(820, 120, 0.7, '#fff', 0.7) +
      ridge(4, 520, 70, '#94b890', 5) +
      ridge(9, 600, 50, '#7aa868', 4) +
      `<path d="M0 690Q800 650 1600 690V900H0Z" fill="#86b84e"/><path d="M40 790Q600 760 1000 790L1020 860Q600 830 20 862Z" fill="#7a4a2a" ${ink(5)}/>` +
      sprouts(808, [120, 230, 340, 760, 870, 960], 1) +
      flower(520, 760, 14, C.pink) +
      flower(600, 730, 11, C.gold) +
      flower(1480, 760, 13, C.hello) +
      // Celestia, drooping, her colours washed pale; a few petals have dropped.
      glow(id + 'p', 700, 390, 260, 0.6) +
      `<g transform="rotate(16 700 690)">${gascuBloom(id + 'c', 700, 390, 0.9, 300)}<circle cx="700" cy="390" r="140" fill="#9a98a8" opacity=".45"/></g>` +
      at(560, 800, 1, `<use href="#sbBp" fill="#d8b8d0" transform="rotate(100) scale(.6)"/>`) +
      at(880, 812, 1, `<use href="#sbBp" fill="#c8c0a0" transform="rotate(-80) scale(.55)"/>`) +
      jason(360, 905, 1.05, { pose: 'reach', face: 'worried' }) +
      lux(520, 520, 0.95, 'scared') +
      // The ruin stone, its light-words shining up into a picture of the Fleece.
      `<path d="M1300 520L1200 300H1420Z" fill="url(#${id}m)" opacity=".7"/>` +
      glow(id + 'g', 1310, 290, 170, 0.8) +
      fleece(id + 'f', 1310, 290, 0.55) +
      ruinStone(id + 'r', 1300, 880, 0.95) +
      hypatia(1110, 905, 1.0, { legs: 'kneel', pose: 'point', face: 'shock' }) +
      sparkle(1200, 220, 12, '#fff6d0') +
      sparkle(1420, 360, 9, '#fff6d0') +
      vignette(id + 'v', 0.3, '#2a2040'),
  );
}

/** 21. Captain Argus rebuilds the shuttle into the Argo, at sunset; Jason cheers, LUX welds. */
export function ch3Argo(): string {
  const id = 'ch3-argo';
  const poles = [380, 640, 1000, 1260].map((x) => `<rect x="${x}" y="200" width="16" height="560" fill="#8a5a34" ${ink(4)}/>`).join('');
  return panel(
    backdrop(id + 'b', [[0, '#5a6ad0'], [0.45, '#ff9a7a'], [0.75, '#ffd8a0'], [1, '#ffe8c0']]) +
      stars(8, 30, 0, 0, 1600, 200, '#fff6e0') +
      gasGiant(id + 'j', 1360, 250, 150) +
      ridge(3, 560, 60, '#c87a6a', 5) +
      ridge(7, 640, 40, '#8a7a5a', 4) +
      `<path d="M0 700Q800 670 1600 700V900H0Z" fill="#6a9a48"/>` +
      // Scaffolding behind the ship.
      poles +
      `<path d="M380 300H1276M380 560H1276" stroke="#8a5a34" stroke-width="14"/><path d="M396 300L640 560M1000 300L1260 560" stroke="#8a5a34" stroke-width="8"/>` +
      argoShip(id + 'a', 830, 500, 0.95, 0, false) +
      // LUX welding a solar oar, sparks flying.
      at(1105, 655, 1, `<path d="M-6 -40L4 -4" ${ink(10)}/><path d="M-6 -40L4 -4" stroke="#9aa6ba" stroke-width="5"/>`) +
      lux(1095, 600, 0.75, 'happy') +
      sparkle(1112, 660, 22, '#fff6b0') +
      sparkle(1130, 640, 10, '#ffd166') +
      sparkle(1094, 676, 8, '#ffffff') +
      // A toolbox and a crate.
      `<rect x="120" y="820" width="140" height="70" rx="10" fill="#d0402a" ${ink(5)}/><path d="M150 820V800H230V820" fill="none" ${ink(6)}/>` +
      `<rect x="1440" y="790" width="120" height="100" rx="6" fill="#b8844a" ${ink(5)}/><path d="M1440 840H1560" ${ink(4)}/>` +
      captain(330, 905, 1.05, { pose: 'point', face: 'happy' }) +
      jason(1280, 905, 1.0, { pose: 'cheer', face: 'grin', flip: true }) +
      vignette(id + 'v', 0.3, '#2a1030'),
  );
}

/** 22. Aeëtes on the bridge of his golden flagship, arms wide, grinning at a hologram of the Fleece. */
export function ch3Aeetes(): string {
  const id = 'ch3-aeetes';
  const coins = [0, 1, 2, 3, 4, 5]
    .map((i) => `<ellipse cx="${150 + (i % 3) * 40}" cy="${850 - Math.floor(i / 3) * 18 - i * 6}" rx="40" ry="12" fill="${C.gold}" ${ink(4)}/>`)
    .join('');
  return panel(
    backdrop(id + 'b', [[0, '#05061a'], [1, '#1a1040']]) +
      `<defs>${glowDef(id + 'g', C.gold, 0.6)}${glowDef(id + 'h', '#7fe6ff', 0.5)}${lin(id + 'f', [[0, '#c8902a'], [1, '#6a4410']])}</defs>` +
      stars(31, 140, 0, 0, 1600, 700) +
      gasGiant(id + 'j', 1080, 300, 170) +
      goldShip(id + 's', 420, 260, 0.55) +
      goldShip(id + 't', 1450, 520, 0.4) +
      saucer(760, 180, 0.6) +
      saucer(900, 120, 0.45, true) +
      saucer(250, 470, 0.5) +
      // The window frame of the flagship's bridge.
      `<path d="M0 0H1600V900H0ZM80 70Q800 -10 1520 70L1560 660Q800 720 40 660Z" fill="#2a1a10" fill-rule="evenodd"/>` +
      `<path d="M80 70Q800 -10 1520 70L1560 660Q800 720 40 660Z" fill="none" stroke="${C.gold}" stroke-width="16"/>` +
      `<path d="M800 30V700" stroke="${C.gold}" stroke-width="12"/>` +
      `<path d="M0 700Q800 660 1600 700V900H0Z" fill="url(#${id}f)" ${ink(6)}/>` +
      coins +
      // The hologram table and the Fleece spinning above it.
      `<path d="M1120 900L1160 760H1400L1440 900Z" fill="#3a2a40" ${ink(5)}/><ellipse cx="1280" cy="760" rx="120" ry="20" fill="#7fe6ff" opacity=".6"/>` +
      `<path d="M1180 760L1220 470H1340L1380 760Z" fill="#7fe6ff" opacity=".18"/>` +
      glow(id + 'h', 1280, 520, 200, 0.7) +
      `<g opacity=".85">${fleece(id + 'l', 1280, 520, 0.7)}</g>` +
      glow(id + 'g', 600, 560, 340, 0.4) +
      aeetes(620, 905, 1.25, { pose: 'spread' }) +
      sparkle(1170, 420, 14, '#fff6d0') +
      sparkle(1390, 600, 10, '#bff4ff') +
      vignette(id + 'v', 0.45),
  );
}
