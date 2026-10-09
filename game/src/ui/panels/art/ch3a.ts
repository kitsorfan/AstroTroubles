/** Chapter 3 panels: Celestia fading by the Gardeners' ruins, the Argo being built, and Aeëtes on his golden flagship. */
import {
  aeetes,
  argoShip,
  at,
  backdrop,
  C,
  captain,
  fleece as kitFleece,
  gasGiant,
  glow,
  glowDef,
  goldShip as kitGoldShip,
  ink,
  jason,
  lin,
  lux,
  panel,
  ridge,
  saucer as kitSaucer,
  sparkle,
  stars,
  vignette,
} from '../kit';
import * as gn from '../gn';
import { celestia, fallenPetal, fleece, hypatia, ruinStone } from '../gn/ch3a';

/* ---------------- 20. Celestia fading, in the graphic-novel style ---------------- */

/** A raised garden bed seen in perspective: a wooden frame round dark soil with rows of sprouts. Front edge from x0 to x1 at y. */
function gardenBed(pen: gn.Pen, x0: number, x1: number, y: number, depth: number, seed: number, k = 1): string {
  const rand = gn.rng(seed);
  const h = 22 * k;
  const back = y - depth;
  const sk = depth * 0.35;
  const soil = pen.form(gn.dPoly([[x0 + sk, back], [x1 - sk, back], [x1, y], [x0, y]]), '#4a3020', { sh: depth * 0.4, line: 2.2 * k, hatch: 1 });
  const front = pen.form(gn.dPoly([[x0, y], [x1, y], [x1, y + h], [x0, y + h]]), '#b07a48', { sh: h * 0.5, line: 2.4 * k, rim: 1.4, inner: `<path d="M${x0} ${gn.r1(y + h * 0.5)}H${x1}" stroke="${gn.INK}" stroke-width="${gn.r1(1.6 * k)}" opacity=".5"/>` });
  const leaves: [gn.P[], number][] = [];
  const lit: [gn.P[], number][] = [];
  for (let row = 0; row < 3; row++) {
    const ry = back + depth * (0.3 + row * 0.28);
    const t = (ry - back) / depth;
    const xa = x0 + sk * (1 - t);
    const xb = x1 - sk * (1 - t);
    for (let sx = xa + 20 * k; sx < xb - 10 * k; sx += (36 + rand() * 14) * k) {
      const sz = (14 + t * 10) * k;
      leaves.push([[[sx, ry], [sx - sz * 0.6, ry - sz * 0.8], [sx - sz * 1.1, ry - sz * 0.7]], 6 * k]);
      leaves.push([[[sx, ry], [sx + sz * 0.6, ry - sz * 0.9], [sx + sz * 1.1, ry - sz * 0.8]], 6 * k]);
      lit.push([[[sx, ry], [sx + sz * 0.5, ry - sz * 0.8]], 2.4 * k]);
    }
  }
  return soil + pen.brushes(leaves, '#3f7a3a', [0.1, 0.6]) + pen.brushes(lit, '#b8e088', [0.1, 0.6], 0.8) + front;
}

/** The colony's domes far off on the plain: pale half-spheres with lit windows, flat in the haze. */
function colony(pen: gn.Pen, x: number, y: number, s: number): string {
  const dome = (dx: number, r: number) =>
    `<path d="M${dx - r} 0A${r} ${r * 0.8} 0 0 1 ${dx + r} 0Z" fill="#dfe6f0"/><path d="M${dx - r * 0.2} ${-r * 0.78}A${r} ${r * 0.8} 0 0 1 ${dx + r} 0H${dx + r * 0.3}Z" fill="#9aa8c8" opacity=".55"/><path d="M${dx - r * 0.6} ${-r * 0.2}h${r * 0.2}M${dx - r * 0.1} ${-r * 0.3}h${r * 0.2}" stroke="#ffd98a" stroke-width="5"/>`;
  return gn.at(x, y, s, dome(0, 60) + dome(110, 40) + dome(-90, 34) + `<path d="M-140 0H170" stroke="#9aa8c8" stroke-width="4"/><path d="M30 -48V-110" stroke="#9aa8c8" stroke-width="4"/>` + pen.glow(30, -114, 10, '#ff6a6a', 0.9));
}

/** 20. The colony's first garden at dawn: Celestia droops, pale; Jason reaches for her; Dr. Hypatia reads the Gardeners' stone, its light-words shining up into a picture of the Golden Fleece. */
export function ch3Fading(): string {
  const pen = gn.Pen.scene('ch3-fading', { key: [-0.85, -0.45], keyColor: '#ffe2c0', rim: [0.9, -0.35], rimColor: '#ffd36a', shadow: '#6a6aa8', depth: 0.5 });
  const sunX = 150;
  const sunY = 420;
  const sky =
    gn.sky(pen, [
      [0, '#22385e'],
      [0.32, '#6a88b8'],
      [0.56, '#e8c4b0'],
      [0.68, '#ffe0c0'],
    ]) +
    gn.starfield(pen, 20, 36, 0, 0, 1600, 200, '#e8f0ff') +
    gn.gasGiant(pen, 1330, 150, 104, { lightDir: [-0.95, 0.2], haze: 0.4, sky: '#7a90b8' }) +
    gn.godRays(pen, sunX, sunY, [100, 120, 140, 160, 185], 6, 1300, '#fff0d0', 0.22) +
    gn.bloom(pen, sunX, sunY, 110, '#fff2d8', 0.9) +
    gn.cloud(pen, 560, 200, 280, '#fff4ea', '#b8a8c8', { seed: 4 }) +
    gn.cloud(pen, 1000, 120, 200, '#fff4ea', '#b8a8c8', { seed: 5 });
  const far =
    gn.silhouette(
      [
        [-80, 560],
        [120, 490],
        [360, 520],
        [560, 470],
        [800, 510],
        [1100, 460],
        [1380, 500],
        [1680, 470],
        [1680, 620],
        [-80, 620],
      ],
      '#9aa8c8',
    ) +
    colony(pen, 840, 552, 0.7) +
    gn.silhouette(
      [
        [-80, 600],
        [300, 560],
        [700, 590],
        [1000, 556],
        [1400, 584],
        [1680, 560],
        [1680, 680],
        [-80, 680],
      ],
      '#7a9a88',
    ) +
    gn.haze(pen, 480, 660, '#ffe8d4', 0.65);
  // The garden: grassy ground, beds of sprouts, and Celestia's stone planter in the middle.
  const ground =
    pen.form('M-80 640Q800 610 1680 640V960H-80Z', '#6aa04a', {
      sh: 20,
      line: 0,
      paint: pen.lin([
        [0, '#9ac870'],
        [0.5, '#5a8a40'],
        [1, '#2a4a2a'],
      ]),
    }) +
    gardenBed(pen, 140, 520, 690, 40, 3, 0.7) +
    gardenBed(pen, 980, 1300, 680, 36, 4, 0.7) +
    gn.grass(pen, -40, 1640, 660, 26, 26, '#4a7a3a', '#b8e088', 3) +
    gn.wash(pen, 760, '#1a2030', 0.55);
  const planter = pen.form('M560 742Q700 704 840 742L828 790Q700 810 572 790Z', '#c8bca8', { sh: 26, hatch: 1, line: 3, rim: 2, inner: `<path d="M600 760L616 798M670 752L676 806M740 752L736 806M800 760L792 798" stroke="${gn.INK}" stroke-width="2.4" opacity=".45"/>` });
  const soil = pen.form('M572 744Q700 714 828 744Q700 760 572 744Z', '#3a2618', { line: 2 });
  const fallen = fallenPetal(pen, 560, 812, 0.8, '#b8a8d8', 20) + fallenPetal(pen, 960, 820, 0.9, '#d8c8a8', -30) + fallenPetal(pen, 690, 846, 0.7, '#c8a8c8', 60);
  // Celestia, her head hanging toward Jason, colours washed pale; one petal drifting down.
  const plant = celestia(pen, 700, 744, 1.1, { droop: 0.8, fade: 0.7, side: -1 }) + fallenPetal(pen, 380, 600, 0.8, '#a8b8e0', -50) + gn.spark(pen, 540, 480, 9, '#ffd6f2', 0.8) + gn.spark(pen, 585, 540, 6, '#ffd6f2', 0.6) + gn.spark(pen, 500, 575, 5, '#ffd6f2', 0.45) + soil;
  // The stone, its light-words beaming up into a hologram of the Fleece.
  const beam = `<path d="M1040 400L880 150H1120L1120 400Z" fill="${pen.lin([
    [0, '#ffd166', 0],
    [1, '#ffd166', 0.5],
  ])}"/>`;
  const stone = gn.castShadow(pen, 1120, 776, 120, 14, 0.5) + ruinStone(pen, 1080, 780, 0.95) + beam + fleece(pen, 990, 190, 0.66, { holo: true }) + gn.spark(pen, 1060, 190, 14, '#fff6d0') + gn.spark(pen, 1330, 330, 10, '#fff6d0');
  const heroes =
    gn.castShadow(pen, 300, 880, 150, 14, 0.45) +
    gn.jason(pen, 300, 884, 1.08, {
      pose: { turn: 0.5, lean: 8, tilt: 8, armN: [-10, 26], armF: { to: [1.6, 0.45] }, legN: { to: [-0.24, 0.95] }, legF: { to: [0.3, 0.93] }, handN: 'fist', handF: 'open', footN: 20, wristF: -70 },
      mood: 'worried',
      look: [3, 0],
    }) +
    gn.lux(pen, 610, 200, 0.85, 'scared', { look: [-4, 7], flip: true }) +
    gn.castShadow(pen, 1310, 882, 150, 14, 0.45) +
    hypatia(pen, 1310, 884, 1.0, {
      flip: true,
      pad: true,
      pose: { turn: 0.5, lean: 8, tilt: -10, armF: [138, 146], armN: [30, 80], legN: { to: [-0.42, 0.55] }, legF: { to: [0.42, 0.56] }, handF: 'point', handN: 'grip', footN: 70 },
      mood: 'surprised',
      look: [2, -4],
    });
  const fore = gn.grass(pen, -70, 260, 940, 4, 140, '#10281a', '#4a8a4a', 9) + gn.grass(pen, 1440, 1680, 940, 4, 140, '#10281a', '#4a8a4a', 10);
  return pen.svg(gn.layer(0.15, sky) + gn.layer(0.35, far) + gn.layer(0.7, ground + planter + fallen + plant + stone) + gn.layer(1, heroes) + gn.layer(1.3, fore) + gn.vignette(pen, 0.5, '#141028') + gn.grain(pen, 0.08));
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
      `<defs>${glowDef(id + 'g', C.gold, 0.6)}${glowDef(id + 'h', '#7fe6ff', 0.5)}${lin(id + 'f', [[0, '#5a3a5a'], [1, '#22142a']])}</defs>` +
      stars(31, 140, 0, 0, 1600, 700) +
      gasGiant(id + 'j', 1080, 300, 170) +
      kitGoldShip(id + 's', 420, 260, 0.55) +
      kitGoldShip(id + 't', 1450, 520, 0.4) +
      kitSaucer(760, 180, 0.6) +
      kitSaucer(900, 120, 0.45, true) +
      kitSaucer(250, 470, 0.5) +
      // The window frame of the flagship's bridge.
      `<path d="M0 0H1600V900H0ZM80 70Q800 -10 1520 70L1560 660Q800 720 40 660Z" fill="#2a1a10" fill-rule="evenodd"/>` +
      `<path d="M80 70Q800 -10 1520 70L1560 660Q800 720 40 660Z" fill="none" stroke="${C.gold}" stroke-width="16"/>` +
      `<path d="M800 30V700" stroke="${C.gold}" stroke-width="12"/>` +
      `<path d="M0 700Q800 660 1600 700V900H0Z" fill="url(#${id}f)" ${ink(6)}/><path d="M0 760Q800 724 1600 760" fill="none" stroke="${C.gold}" stroke-width="6" opacity=".5"/>` +
      coins +
      // The hologram table and the Fleece spinning above it.
      `<path d="M1120 900L1160 760H1400L1440 900Z" fill="#3a2a40" ${ink(5)}/><ellipse cx="1280" cy="760" rx="120" ry="20" fill="#7fe6ff" opacity=".6"/>` +
      `<path d="M1180 760L1220 470H1340L1380 760Z" fill="#7fe6ff" opacity=".18"/>` +
      glow(id + 'h', 1280, 520, 200, 0.7) +
      `<g opacity=".85">${kitFleece(id + 'l', 1280, 520, 0.7)}</g>` +
      glow(id + 'g', 600, 560, 340, 0.4) +
      aeetes(600, 960, 1.45, { pose: 'spread' }) +
      sparkle(1170, 420, 14, '#fff6d0') +
      sparkle(1390, 600, 10, '#bff4ff') +
      vignette(id + 'v', 0.45),
  );
}
