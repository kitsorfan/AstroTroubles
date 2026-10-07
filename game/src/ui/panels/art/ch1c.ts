/** Chapter 1 panels, part 3: the ship saved from the star, and LUX making friends with the Heart. */
import { at, backdrop, C, flower, gascuHeart, gascuSprout, glow, glowDef, ink, jason, lin, lux, panel, r1, rad, sparkle, stars, syracusia, vignette, vine } from '../kit';

/** Light-word arcs fanning out from (x, y) toward the right (r = radius). */
function arcs(x: number, y: number, list: [number, string][], spread = 38, rot = 0): string {
  return list
    .map(([r, c]) => {
      const a = (spread * Math.PI) / 180;
      const p = (s: number) => `${r1(x + Math.cos(s * a) * r)} ${r1(y + Math.sin(s * a) * r)}`;
      const d = `M${p(-1)}A${r} ${r} 0 0 1 ${p(1)}`;
      return `<g transform="rotate(${rot} ${x} ${y})"><path d="${d}" fill="none" stroke="${c}" stroke-width="40" stroke-linecap="round" opacity=".25"/><path d="${d}" fill="none" stroke="${c}" stroke-width="14" stroke-linecap="round"/><path d="${d}" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".7"/></g>`;
    })
    .join('');
}

/** 7. The Syracusia swinging away from the star on a big curved trail; LUX holding the sprout. */
export function ch1Saved(): string {
  const id = 'ch1-saved';
  return panel(
    backdrop(id + 'b', [[0, '#1a0f3a'], [0.7, '#0b1030'], [1, '#0b1030']]) +
      `<defs>${rad(id + 's', [[0, '#fffbe0'], [0.2, '#ffd166'], [0.45, '#ff8a3d'], [0.75, '#ff4a1a', 0.5], [1, '#ff4a1a', 0]])}
      ${lin(id + 't', [[0, '#bfefff', 0], [0.5, '#bfefff', 0.5], [1, '#ffffff', 0.95]], 1, 0)}${glowDef(id + 'p', C.pink)}${rad(id + 'c', [[0, '#ffffff'], [0.5, '#fff2b0'], [0.85, '#ffc04a'], [1, '#ff8a3d']])}</defs>` +
      stars(41, 90) +
      `<circle cx="1640" cy="640" r="680" fill="url(#${id}s)"/><circle cx="1640" cy="640" r="250" fill="none" stroke="#ffd166" stroke-width="40" opacity=".45"/><circle cx="1640" cy="640" r="230" fill="url(#${id}c)"/>` +
      `<path d="M1340 560Q1280 120 860 170" fill="none" stroke="url(#${id}t)" stroke-width="90" stroke-linecap="round" opacity=".35"/>
      <path d="M1340 560Q1280 120 860 170" fill="none" stroke="url(#${id}t)" stroke-width="26" stroke-linecap="round"/>
      <path d="M1300 620Q1230 220 880 230" fill="none" stroke="url(#${id}t)" stroke-width="10" stroke-linecap="round" opacity=".6"/>` +
      at(615, 190, 1, syracusia(id + 'h', 0, 0, 0.42), true, -4) +
      // The inset: LUX hugging the flower pot with the tiny sprout.
      `<circle cx="330" cy="660" r="216" fill="#2a3470"/>` +
      `<defs><clipPath id="${id}c"><circle cx="330" cy="660" r="216"/></clipPath></defs><g clip-path="url(#${id}c)">${glow(id + 'p', 330, 610, 260, 0.6)}${stars(7, 20, 110, 440, 440, 440)}` +
      lux(330, 610, 1.9, 'happy') +
      gascuSprout(id + 'g', 330, 830, 1.05) +
      at(330, 610, 1.9, `<path d="M-44 6Q-70 60 -40 98M44 6Q70 60 40 98" fill="none" ${ink(14)}/><path d="M-44 6Q-70 60 -40 98M44 6Q70 60 40 98" fill="none" stroke="#9aa6ba" stroke-width="6" stroke-linecap="round"/><circle cx="-40" cy="98" r="8" fill="#9aa6ba" ${ink(4)}/><circle cx="40" cy="98" r="8" fill="#9aa6ba" ${ink(4)}/>`) +
      `</g><circle cx="330" cy="660" r="216" fill="none" stroke="#fff" stroke-width="16"/><circle cx="330" cy="660" r="226" fill="none" ${ink(5)}/>` +
      sparkle(130, 450, 22) +
      sparkle(1000, 80, 14, '#cfe0ff') +
      vignette(id + 'v', 0.3),
  );
}

/** 8. LUX flashing light-words at the Heart, which answers in gold; flowers burst out everywhere. */
export function ch1Friends(): string {
  const id = 'ch1-friends';
  const blooms: [number, number, number, string][] = [
    [120, 140, 30, C.pink],
    [330, 80, 24, C.gold],
    [610, 130, 28, '#fff'],
    [900, 70, 26, C.pink],
    [1250, 90, 30, C.hello],
    [1500, 160, 26, C.gold],
    [1530, 520, 30, C.pink],
    [1380, 760, 28, '#fff'],
    [760, 820, 26, C.gold],
    [560, 700, 22, C.pink],
    [60, 520, 26, C.hello],
    [1100, 820, 30, C.pink],
  ];
  return panel(
    backdrop(id + 'b', [[0, '#5a2a10'], [0.5, '#a8501a'], [1, '#3a1a20']]) +
      `<defs>${glowDef(id + 'g', C.gold, 0.7)}${glowDef(id + 'l', C.cyan, 0.7)}</defs>` +
      glow(id + 'g', 1080, 400, 900, 0.9, 600) +
      [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((i) => `<path d="M1080 400L${r1(1080 + Math.cos(i * 0.5236) * 1300)} ${r1(400 + Math.sin(i * 0.5236) * 1300)}" stroke="#ffe08a" stroke-width="${60 + (i % 2) * 50}" opacity=".12"/>`).join('') +
      vine([[-20, 90], [300, 40], [600, 100], [900, 40], [1300, 80], [1620, 40]], 24) +
      vine([[-20, 620], [140, 480], [80, 300], [180, 200]], 22) +
      vine([[1620, 820], [1450, 700], [1560, 480], [1420, 300]], 22) +
      vine([[500, 920], [640, 780], [880, 840], [1200, 760], [1400, 920]], 22) +
      blooms.map(([x, y, r, c]) => flower(x, y, r, c, c === C.gold ? '#ff8a3d' : C.gold)).join('') +
      gascuHeart(id + 'h', 1080, 400, 0.78, C.gold, false) +
      arcs(1080, 400, [[190, C.gold], [250, C.gold]], 26, 180) +
      glow(id + 'l', 560, 360, 150) +
      arcs(560, 360, [[95, C.hello], [150, C.pink], [205, C.gold]], 34) +
      lux(560, 360, 1.5, 'happy', C.gold) +
      jason(260, 900, 1.35, { pose: 'cheer', face: 'happy' }) +
      [[420, 220], [760, 560], [1320, 200], [960, 660], [200, 360]].map(([x, y], i) => sparkle(x, y, 14 + (i % 3) * 6, i % 2 ? '#fff' : '#fff2b0')).join('') +
      vignette(id + 'v', 0.4, '#2a0e04'),
  );
}
