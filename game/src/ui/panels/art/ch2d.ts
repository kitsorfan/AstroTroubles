/** Chapter 2 panels, part 4: the Colossus in the volcano, and little Brennus with Grandma on Mars. */
import { backdrop, boyBrennus, brennus, C, colossus, glow, glowDef, grandma, ink, jason, lin, lux, panel, rad, ridge, sparkle } from '../kit';


/** 16. Inside the crater: the Colossus looms over the lava, GaScu caged in its chest, Brennus on top. */
export function ch2Colossus(): string {
  const id = 'ch2-colossus';
  const embers = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => `<circle cx="${80 + i * 160 + ((i * 53) % 70)}" cy="${300 + ((i * 97) % 380)}" r="${3 + (i % 3) * 2}"/>`).join('');
  return panel(
    backdrop(id + 'b', [[0, '#2a0e14'], [0.5, '#4a1a14'], [1, '#7a2a10']]) +
      `<defs>${glowDef(id + 'l', C.lava, 0.8)}${lin(id + 'v', [[0, '#ffd166'], [0.4, C.lava], [1, '#a8200a']])}${rad(id + 's', [[0, '#5a2a2a'], [1, '#2a0e14', 0]])}</defs>` +
      `<ellipse cx="800" cy="40" rx="520" ry="160" fill="url(#${id}s)"/>` +
      // Crater walls.
      `<path d="M0 0H360Q300 200 340 380Q260 600 300 900H0Z" fill="#2a1210"/><path d="M1600 0H1260Q1330 220 1280 420Q1350 640 1300 900H1600Z" fill="#2a1210"/>
      <path d="M360 0Q300 200 340 380Q260 600 300 900M1260 0Q1330 220 1280 420Q1350 640 1300 900" fill="none" stroke="#ff6a12" stroke-width="8" opacity=".35"/>` +
      glow(id + 'l', 800, 900, 1000, 0.9, 380) +
      colossus(id + 'c', 870, 900, 1.02, brennus(0, 100, 0.7, { face: 'angry', legs: 'none' })) +
      // The lava river and the rock ledge where Jason and LUX stand.
      `<path d="M0 820Q400 790 800 830T1600 810V900H0Z" fill="url(#${id}v)"/>
      <path d="M100 850Q300 840 420 860M900 860Q1100 846 1300 858" fill="none" stroke="#fff2b0" stroke-width="6" opacity=".7" stroke-linecap="round"/>` +
      `<path d="M-20 900V800Q120 760 300 780Q420 800 460 900Z" fill="#1c0c0c" ${ink(6)}/>` +
      jason(250, 800, 0.62, { pose: 'point', face: 'determined' }) +
      lux(360, 640, 0.6, 'scared', C.cyan, true) +
      `<g fill="#ffb060" opacity=".8">${embers}</g>` +
      sparkle(870, 540, 16, C.pinkLight, 0.8),
  );
}

/** A tomato plant: a stake, leafy bush and ripe red tomatoes (a shape the panel reuses). */
const TOMATO = `<path d="M0 0V-120" stroke="#8a6a3a" stroke-width="6"/><g fill="#4a8a3a" ${ink(4)}><circle cx="-26" cy="-60" r="30"/><circle cx="24" cy="-70" r="32"/><circle cx="0" cy="-100" r="30"/></g>
  <g fill="#e8402a" ${ink(3)}><circle cx="-24" cy="-44" r="13"/><circle cx="20" cy="-50" r="14"/><circle cx="6" cy="-92" r="12"/><circle cx="-14" cy="-78" r="10"/></g>
  <g fill="#fff" opacity=".6"><circle cx="-28" cy="-48" r="4"/><circle cx="16" cy="-55" r="4"/></g>`;

/** 17. Warm golden memory: little Brennus and Grandma in a glass-domed greenhouse on red Mars. */
export function ch2Grandma(): string {
  const id = 'ch2-grandma';
  const plant = (x: number, y: number, s: number) => `<use href="#${id}t" transform="translate(${x} ${y}) scale(${s})"/>`;
  const rows = [
    [240, 688, 0.5],
    [360, 688, 0.5],
    [480, 688, 0.5],
    [1120, 688, 0.5],
    [1240, 688, 0.5],
    [1360, 688, 0.5],
    [120, 822, 0.85],
    [330, 822, 0.85],
    [1270, 822, 0.85],
    [1480, 822, 0.85],
    [40, 960, 1.4],
    [1560, 960, 1.4],
  ]
    .map(([x, y, s]) => plant(x, y, s))
    .join('');
  return panel(
    backdrop(id + 'b', [[0, '#ffd8a8'], [0.55, '#f6a878'], [1, '#e07a4a']]) +
      `<defs>${glowDef(id + 's', '#fff6dc', 0.95)}<g id="${id}t">${TOMATO}</g>${rad(id + 'g', [[0, '#fff2c0', 0.7], [1, '#ffd166', 0]])}
      ${rad(id + 'z', [[0.6, '#a8501a', 0], [1, '#a8501a', 0.45]])}</defs>` +
      // Mars outside: a small sun and red dunes.
      glow(id + 's', 330, 170, 170) +
      `<circle cx="330" cy="170" r="32" fill="#fffbe8"/>` +
      ridge(9, 560, 60, '#e07848', 5) +
      ridge(4, 610, 40, '#c85a32', 6) +
      // Inside the dome: the path, the planter rows and the plants.
      `<path d="M40 640Q800 600 1560 640V900H40Z" fill="#d89a62"/><path d="M640 640L560 900H1040L960 640Z" fill="#ecc08a"/>
      <path d="M180 670H560L530 700H150ZM1040 670H1420L1450 700H1070ZM40 800H420L380 850H0ZM1180 800H1560L1600 850H1220Z" fill="#a8683c" ${ink(4)}/>` +
      rows +
      `<ellipse cx="800" cy="640" rx="560" ry="300" fill="url(#${id}g)"/>` +
      grandma(980, 900, 1.15, { pose: 'hold', face: 'happy' }) +
      boyBrennus(660, 900, 1.0, { pose: 'wave', face: 'grin' }) +
      // The tomato he holds up proudly.
      `<circle cx="750" cy="666" r="30" fill="#e8402a" ${ink(5)}/><path d="M736 640L750 648L764 640M750 648V630" fill="none" stroke="#3f7a3a" stroke-width="6" stroke-linecap="round"/><circle cx="740" cy="656" r="8" fill="#fff" opacity=".6"/>` +
      sparkle(800, 610, 16, '#fff') +
      sparkle(700, 600, 10, '#fff6d0') +
      // The glass dome over everything.
      `<path d="M30 900V640Q60 40 800 30Q1540 40 1570 640V900" fill="#e8f6ff" fill-opacity=".08" stroke="#fff6e6" stroke-width="16"/>
      <path d="M300 900V420Q420 120 800 30Q1180 120 1300 420V900M800 30V600M60 460Q800 340 1540 460M140 260Q800 150 1460 260" fill="none" stroke="#fff6e6" stroke-width="6" opacity=".55"/>
      <path d="M200 520Q260 260 480 140" fill="none" stroke="#fff" stroke-width="14" opacity=".35" stroke-linecap="round"/>` +
      `<rect width="1600" height="900" fill="url(#${id}z)"/>` +
      `<rect x="14" y="14" width="1572" height="872" rx="26" fill="none" stroke="#fff2d0" stroke-width="16" opacity=".9"/>`,
  );
}
