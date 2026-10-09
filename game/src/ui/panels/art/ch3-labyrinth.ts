/** Chapter 3 panels for Medusa's Labyrinth: the Mirror Shield in the Gardeners' shrine, and MEDUSA asleep by the open gate. */
import { at, atalanta, backdrop, C, glow, glowDef, ink, iris, jason, lin, lux, panel, rad, rng, sparkle, vignette } from '../kit';

const STONE = '#5f7f6a';
const STONE_DARK = '#2e4438';
const STONE_LIGHT = '#8aa890';
const GAZE = '#7dff9a';
const GOLD = '#f0c25a';

/** Big carved blocks of green stone filling a wall, with a few glowing Gardener light-words. */
function stoneWall(seed: number, y0: number, y1: number): string {
  const r = rng(seed);
  let out = '';
  for (let y = y0, row = 0; y < y1; y += 90, row++) {
    for (let x = (row % 2) * -70; x < 1600; x += 140) {
      const shade = r() < 0.5 ? STONE : '#58786a';
      out += `<rect x="${x + 4}" y="${y + 4}" width="132" height="82" rx="10" fill="${shade}" opacity=".9"/>`;
      if (r() < 0.12) {
        const c = ['#5e9bff', C.pink, C.gold, GAZE][Math.floor(r() * 4)];
        out += `<rect x="${x + 56}" y="${y + 30}" width="24" height="24" rx="4" fill="${c}" opacity=".85"/>`;
      }
    }
  }
  return `<rect x="0" y="${y0}" width="1600" height="${y1 - y0}" fill="${STONE_DARK}"/>${out}`;
}

/** A round arch of carved stone (the shrine, or the old gate), centred at x with its feet on y. */
function arch(x: number, y: number, w: number, h: number, inside: string): string {
  const r = w / 2;
  return `<path d="M${x - r - 60} ${y}V${y - h + r}A${r + 60} ${r + 60} 0 0 1 ${x + r + 60} ${y - h + r}V${y}Z" fill="${STONE_LIGHT}" ${ink(6)}/>
    <path d="M${x - r} ${y}V${y - h + r}A${r} ${r} 0 0 1 ${x + r} ${y - h + r}V${y}Z" fill="${inside}" ${ink(5)}/>
    ${[0.15, 0.5, 0.85].map((k) => `<rect x="${x - 14 + (k - 0.5) * (w + 60)}" y="${y - h - 40 + Math.abs(k - 0.5) * 120}" width="28" height="28" rx="5" fill="${GAZE}" opacity=".9" ${ink(3)}/>`).join('')}`;
}

/** The Mirror Shield, centred at (x, y): polished silver-blue glass in a bronze rim, with a golden sun of light-words. */
function mirrorShield(id: string, x: number, y: number, r: number, tilt = 0): string {
  const rays = [0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
    const a = (i / 8) * Math.PI * 2;
    return `<path d="M${Math.cos(a) * r * 0.22} ${Math.sin(a) * r * 0.22}L${Math.cos(a) * r * 0.36} ${Math.sin(a) * r * 0.36}" stroke="${C.gold}" stroke-width="${r * 0.06}" stroke-linecap="round"/>`;
  });
  const body = `<defs>${rad(id, [[0, '#ffffff'], [0.5, '#cff6ff'], [1, '#7ab8d0']], 0.38, 0.32, 0.75)}</defs>
    <circle r="${r * 1.08}" fill="#b07a3a" ${ink(6)}/>
    <circle r="${r * 0.94}" fill="url(#${id})" ${ink(4)}/>
    <path d="M${-r * 0.6} ${-r * 0.35}Q${-r * 0.2} ${-r * 0.8} ${r * 0.35} ${-r * 0.62}" fill="none" stroke="#fff" stroke-width="${r * 0.1}" stroke-linecap="round" opacity=".8"/>
    <circle r="${r * 0.16}" fill="${C.gold}" ${ink(3)}/>${rays.join('')}`;
  return at(x, y, 1, body, false, tilt);
}

/** One of Aeëtes's robots turned to mossy stone, arms up in surprise. Feet at (x, y). */
function statue(x: number, y: number, s: number, flip = false): string {
  const body = `<rect x="-70" y="-26" width="140" height="26" rx="6" fill="${STONE_DARK}" ${ink(4)}/>
    <rect x="-40" y="-110" width="26" height="86" rx="8" fill="#8e9a8c" ${ink(4)}/><rect x="14" y="-110" width="26" height="86" rx="8" fill="#8e9a8c" ${ink(4)}/>
    <rect x="-50" y="-200" width="100" height="96" rx="18" fill="#9aa69a" ${ink(5)}/>
    <path d="M-48 -190L-96 -262M48 -190L96 -262" ${ink(26)}/><path d="M-48 -190L-96 -262M48 -190L96 -262" stroke="#8e9a8c" stroke-width="18" stroke-linecap="round"/>
    <circle cx="0" cy="-238" r="42" fill="#9aa69a" ${ink(5)}/>
    <circle cx="-15" cy="-240" r="8" fill="${GAZE}" opacity=".5"/><circle cx="15" cy="-240" r="8" fill="${GAZE}" opacity=".5"/>
    <ellipse cx="0" cy="-218" rx="10" ry="12" fill="#56625a"/>
    <path d="M-30 -150q20 10 40 -4M10 -60q12 6 22 -4" fill="none" stroke="#5f8a4a" stroke-width="10" stroke-linecap="round"/>`;
  return at(x, y, s, body, flip);
}

/** MEDUSA's head on her plinth: a gold mask with one great eye (shut when `asleep`) and a crown of cable snakes. */
function medusa(id: string, x: number, y: number, s: number, asleep: boolean): string {
  const snakes = [-150, -115, -80, -45, -10, 25, 60, 95, 130, 165]
    .map((deg, i) => {
      const a = (deg * Math.PI) / 180;
      const bx = Math.sin(a) * 150;
      const by = -170 - Math.cos(a) * 60;
      // Awake they rear up; asleep they curl down over the plinth like sleepy kittens.
      const tx = asleep ? Math.sign(bx || 1) * (200 + Math.abs(bx) * 0.6) : bx * 1.5 + Math.sin(i) * 20;
      const ty = asleep ? 150 + (i % 3) * 30 : by - 140 - (i % 2) * 40;
      const cx1 = bx * 1.25;
      const cy1 = asleep ? by - 30 : by - 40;
      const path = `M${bx} ${by}Q${cx1} ${cy1} ${tx} ${ty}`;
      const head = `<ellipse cx="${tx}" cy="${ty}" rx="22" ry="15" fill="#4a3a1a" ${ink(4)} transform="rotate(${asleep ? 80 : deg * 0.4} ${tx} ${ty})"/>` +
        (asleep ? `<path d="M${tx - 8} ${ty - 2}q4 3 8 0M${tx + 2} ${ty - 2}q4 3 8 0" stroke="${GAZE}" stroke-width="3" fill="none"/>` : `<circle cx="${tx - 7}" cy="${ty - 4}" r="4" fill="${GAZE}"/><circle cx="${tx + 7}" cy="${ty - 4}" r="4" fill="${GAZE}"/>`);
      return `<path d="${path}" fill="none" ${ink(30)}/><path d="${path}" fill="none" stroke="${GOLD}" stroke-width="22" stroke-linecap="round" stroke-dasharray="26 8"/>${head}`;
    })
    .join('');
  const eye = asleep
    ? `<path d="M-70 0Q0 40 70 0" fill="none" ${ink(10)}/><path d="M-50 22l-12 18M0 34v22M50 22l12 18" ${ink(6)}/>`
    : `<ellipse rx="78" ry="58" fill="#f2fbf4" ${ink(6)}/><circle r="40" fill="${GAZE}" ${ink(4)}/><rect x="-7" y="-28" width="14" height="56" rx="7" fill="#08140c"/><circle cx="-14" cy="-14" r="8" fill="#fff"/>`;
  const body = `<defs>${rad(id + 'g', [[0, '#fff2b8'], [0.5, GOLD], [1, '#9a6a1a']], 0.4, 0.3, 0.8)}${glowDef(id + 'h', asleep ? '#5ec8ff' : GAZE, 0.7)}</defs>
    ${glow(id + 'h', 0, -40, 330, asleep ? 0.35 : 0.6)}
    <path d="M-230 260L-200 150H200L230 260Z" fill="${STONE_DARK}" ${ink(6)}/>
    <path d="M-170 160L-150 70H150L170 160Z" fill="${STONE}" ${ink(6)}/>
    ${[-120, -40, 40, 120].map((rx) => `<rect x="${rx - 12}" y="190" width="24" height="24" rx="4" fill="${asleep ? '#5ec8ff' : GAZE}" opacity=".85"/>`).join('')}
    ${snakes}
    <ellipse cx="0" cy="-40" rx="190" ry="210" fill="url(#${id}g)" ${ink(7)}/>
    <path d="M-150 -110Q0 -170 150 -110" fill="none" stroke="#a8743a" stroke-width="18" stroke-linecap="round"/>
    <path d="M-110 -70Q-60 -100 -20 -80M20 -80Q60 -100 110 -70" fill="none" ${ink(10)}/>
    ${at(0, -20, 1, eye)}
    <path d="M-40 110Q0 ${asleep ? 130 : 122} 40 110" fill="none" ${ink(7)}/>
`;
  return at(x, y, s, body);
}

/** 25. In the Gardeners' shrine, Jason lifts the Mirror Shield; a beam of light from above bounces off it, and the others gasp. */
export function ch3Mirror(): string {
  const id = 'ch3-mirror';
  const sx = 800;
  const sy = 410;
  return panel(
    backdrop(id + 'b', [[0, '#04120c'], [0.6, '#0e2a20'], [1, '#1a3a2c']]) +
      `<defs>${glowDef(id + 'g', '#e8fff0', 0.9)}${glowDef(id + 'c', GAZE, 0.7)}${lin(id + 'r', [[0, '#ffffff', 0.85], [1, '#bff4ff', 0]])}</defs>` +
      stoneWall(25, 0, 700) +
      arch(800, 700, 520, 620, '#0a2018') +
      // The shaft of light from a crack high above, and its bounce off the shield toward the dark.
      `<path d="M690 0L760 ${sy - 40}L840 ${sy - 40}L910 0Z" fill="url(#${id}r)" opacity=".7"/>` +
      `<path d="M${sx + 60} ${sy}L1600 120L1600 260Z" fill="${GAZE}" opacity=".25"/><path d="M${sx + 60} ${sy}L1600 190" stroke="#e8fff0" stroke-width="10" stroke-linecap="round" opacity=".8"/>` +
      glow(id + 'g', sx, sy, 260, 0.8) +
      // The floor and the altar.
      `<path d="M0 700H1600V900H0Z" fill="#3a5446"/><path d="M0 700H1600" ${ink(6)}/>` +
      `<path d="M620 760L660 640H940L980 760Z" fill="${STONE_LIGHT}" ${ink(6)}/><rect x="650" y="620" width="300" height="34" rx="8" fill="${STONE}" ${ink(5)}/>` +
      [690, 760, 840, 910].map((x) => `<rect x="${x - 10}" y="690" width="20" height="20" rx="4" fill="${GAZE}" opacity=".9"/>`).join('') +
      // Crystals glowing in the corners.
      [
        [120, 760, 1.2],
        [1480, 780, 1],
        [300, 820, 0.8],
      ]
        .map(([x, y, s]) => glow(id + 'c', x, y - 60 * s, 120 * s, 0.7) + at(x, y, s, `<path d="M-40 0L-20 -120L0 0ZM0 0L20 -150L46 0ZM-10 0L-56 -70L-30 0Z" fill="#c8ffd8" ${ink(4)}/>`))
        .join('') +
      statue(230, 700, 0.75) +
      statue(1390, 700, 0.7, true) +
      // Jason lifts the shield high, between his hands.
      jason(sx, 900, 1.05, { pose: 'cheer', face: 'grin' }) +
      mirrorShield(id + 'm', sx, sy, 105, -8) +
      sparkle(sx - 120, sy - 90, 16, '#fff') +
      sparkle(sx + 130, sy - 120, 12, '#fff') +
      sparkle(sx + 80, sy + 110, 9, GAZE) +
      atalanta(430, 895, 0.95, { pose: 'point', face: 'happy' }) +
      at(1170, 470, 1, iris(0, 0, 0.85, 'happy'), false, -10) +
      lux(1250, 640, 0.85, 'glow', C.cyan, true) +
      vignette(id + 'v', 0.45, '#020a06'),
  );
}

/** 26. MEDUSA asleep on her plinth, snakes curled up; behind her the old gate of Colchis stands open, and the heroes tiptoe past. */
export function ch3Medusa(): string {
  const id = 'ch3-medusa';
  return panel(
    backdrop(id + 'b', [[0, '#04120c'], [1, '#14322a']]) +
      `<defs>${lin(id + 's', [[0, '#fff6d8', 0.95], [1, '#fff6d8', 0]])}${glowDef(id + 'd', '#fff6d8', 0.8)}</defs>` +
      stoneWall(26, 0, 690) +
      // The open gate, and daylight pouring down the shaft beyond it.
      arch(1220, 690, 420, 600, '#fff2c8') +
      `<path d="M1040 690L1120 0H1320L1400 690Z" fill="url(#${id}s)" opacity=".8"/>` +
      glow(id + 'd', 1220, 420, 260, 0.6) +
      `<path d="M0 690H1600V900H0Z" fill="#3a5446"/><path d="M0 690H1600" ${ink(6)}/>` +
      medusa(id + 'm', 520, 640, 1, true) +
      // Zzz from MEDUSA.
      `<g fill="#bff4ff" ${ink(3)} font-family="sans-serif" font-weight="900"><text x="760" y="250" font-size="64">z</text><text x="820" y="180" font-size="80">z</text><text x="900" y="100" font-size="96">Z</text></g>` +
      statue(1500, 690, 0.6, true) +
      // The heroes tiptoeing past toward the gate.
      atalanta(1010, 895, 0.9, { pose: 'hips', face: 'grin' }) +
      jason(1300, 895, 0.95, { pose: 'wave', face: 'smile', flip: true }) +
      at(1150, 520, 1, iris(0, 0, 0.7, 'happy')) +
      lux(1420, 600, 0.7, 'happy', C.cyan, true) +
      sparkle(1220, 300, 16, '#fff') +
      sparkle(1300, 420, 10, '#fff') +
      vignette(id + 'v', 0.4, '#020a06'),
  );
}
