/** Chapter 1 panels, part 1: the ship in the nebula, the comet, and the vines growing on board. */
import {
  at,
  backdrop,
  C,
  face,
  flower,
  glow,
  glowDef,
  gascuSeed,
  ink,
  panel,
  person,
  rad,
  sparkle,
  stars,
  syracusia,
  vignette,
  vine,
} from '../kit';

/** Soft nebula clouds: big faint glows. */
function nebula(id: string, blobs: [number, number, number, number, string][]): string {
  const cols = [...new Set(blobs.map((b) => b[4]))];
  const defs = `<defs>${cols.map((c, i) => glowDef(`${id}n${i}`, c, 0.5)).join('')}</defs>`;
  return defs + blobs.map(([x, y, rx, ry, c]) => glow(`${id}n${cols.indexOf(c)}`, x, y, rx, 1, ry)).join('');
}

/** 1. The Syracusia cruising through a starry nebula, with sleeping colonists in their pods. */
export function ch1Ship(): string {
  const id = 'ch1-ship';
  const pods = [0, 1, 2, 3]
    .map((i) => {
      const x = 340 + i * 300;
      const looks = [
        { skin: '#e8bf9a', hair: '#5a3a22', hairStyle: 'long' as const },
        { skin: '#8a5a3c', hair: '#1a1210', hairStyle: 'curly' as const },
        { skin: '#f0cfb0', hair: '#c96a2a', hairStyle: 'pony' as const },
        { skin: '#c8906c', hair: '#2a1a12', hairStyle: 'short' as const },
      ][i];
      const sleeper = person(x, 925, 0.95, { ...looks, coat: '#c9d6e6', face: 'sleep', legs: 'none' });
      return `<clipPath id="${id}c${i}"><rect x="${x - 95}" y="640" width="190" height="210" rx="90"/></clipPath>
        <rect x="${x - 95}" y="640" width="190" height="210" rx="90" fill="#2a3470"/>
        <g clip-path="url(#${id}c${i})">${sleeper}<rect x="${x - 95}" y="640" width="190" height="210" fill="${C.cyan}" opacity=".18"/></g>
        <rect x="${x - 95}" y="640" width="190" height="210" rx="90" fill="none" stroke="#d8dee8" stroke-width="12"/>
        <rect x="${x - 95}" y="640" width="190" height="210" rx="90" fill="none" ${ink(4)}/>
        <path d="M${x - 60} 672Q${x - 30} 652 ${x + 4} 656" fill="none" stroke="#fff" stroke-width="7" opacity=".6" stroke-linecap="round"/>
        <circle cx="${x + 74}" cy="${612 - (i % 2) * 14}" r="9" fill="${C.cyan}" opacity=".5"/><circle cx="${x + 92}" cy="${588 - (i % 2) * 14}" r="6" fill="${C.cyan}" opacity=".4"/>`;
    })
    .join('');
  return panel(
    backdrop(id + 'b', [[0, '#0b1030'], [0.55, '#241a5a'], [1, '#3a1f5a']]) +
      nebula(id, [
        [1250, 180, 520, 260, '#8a4fff'],
        [300, 520, 600, 220, '#3f86d6'],
        [900, 380, 420, 180, C.pink],
      ]) +
      stars(11, 110) +
      `<path d="M120 300Q300 260 560 310" stroke="#8fd8ff" stroke-width="3" opacity=".25" fill="none"/>` +
      syracusia(id + 's', 780, 300, 0.92) +
      // The cut-away: a long hull window strip with four sleeping colonists.
      `<path d="M610 470L210 600M1010 470L1230 600" stroke="#d8dee8" stroke-width="4" stroke-dasharray="12 12" opacity=".7"/>
      <rect x="190" y="596" width="1210" height="282" rx="60" fill="#c9d1dc" ${ink(7)}/>
      <rect x="214" y="618" width="1162" height="238" rx="44" fill="#141a44"/>` +
      pods +
      sparkle(1460, 120, 18) +
      sparkle(160, 160, 12, '#cfe0ff') +
      vignette(id + 'v', 0.45),
  );
}

/** 2. The pink seed-comet streaking toward the ship; the ship small and surprised. */
export function ch1Comet(): string {
  const id = 'ch1-comet';
  const streaks = [0, 1, 2, 3, 4, 5]
    .map((i) => `<path d="M${-100 + i * 260} ${-40 + (i % 3) * 120}l${360 + (i % 2) * 120} ${210 + (i % 2) * 70}" stroke="#cfe0ff" stroke-width="${2 + (i % 3)}" opacity=".18" stroke-linecap="round"/>`)
    .join('');
  return panel(
    backdrop(id + 'b', [[0, '#1a0f3a'], [0.6, '#0b1030'], [1, '#060818']]) +
      `<defs>${rad(id + 'r', [[0, C.pink, 0.35], [1, C.pink, 0]])}</defs><circle cx="1000" cy="520" r="700" fill="url(#${id}r)"/>` +
      stars(23, 90) +
      streaks +
      // The ship, small in the corner, with surprise lines popping off it.
      syracusia(id + 's', 1330, 770, 0.3) +
      `<g stroke="#fff" stroke-width="6" stroke-linecap="round"><path d="M1330 650l0 -40M1260 664l-24 -30M1400 664l24 -30M1450 700l36 -16"/></g>` +
      gascuSeed(id + 'g', 960, 500, 1.55, 33, 760) +
      sparkle(700, 220, 26) +
      sparkle(1180, 380, 16, C.pinkLight) +
      sparkle(560, 420, 12) +
      vignette(id + 'v', 0.5),
  );
}

/** A sleeping colonist in a soft pink cocoon hanging from a vine. */
function cocoon(id: string, x: number, y: number, s: number, skin: string, hair: string): string {
  return at(
    x,
    y,
    s,
    `<path d="M0 -260V-90" stroke="#3f7a3a" stroke-width="8"/>${glow(id + 'g', 0, 0, 170)}
    <path d="M0 -100Q80 -80 76 10Q70 110 0 130Q-70 110 -76 10Q-80 -80 0 -100Z" fill="url(#${id}k)" ${ink(6)}/>
    <ellipse cx="0" cy="-6" rx="44" ry="46" fill="${skin}" ${ink(4)}/><path d="M-44 -6Q-48 -50 0 -52Q48 -50 44 -8Q30 -30 0 -32Q-30 -30 -44 -6Z" fill="${hair}"/>
    <g transform="translate(0 4) scale(.8)">${face('sleep', 0.9, 0, hair)}</g>
    <path d="M-70 40Q0 70 70 40M-74 -10Q-30 20 0 6M74 -10Q30 20 0 6" fill="none" stroke="#ff9ae0" stroke-width="6" opacity=".7"/>
    <path d="M-50 -70Q-30 -90 0 -92" fill="none" stroke="#fff" stroke-width="7" opacity=".55" stroke-linecap="round"/>`,
  );
}

/** 3. Pink glowing vines over the deck walls, colonists asleep in cocoons hanging like lanterns. */
export function ch1Grow(): string {
  const id = 'ch1-grow';
  const panels = [0, 1, 2, 3, 4, 5, 6]
    .map((i) => `<rect x="${i * 240 - 20}" y="80" width="220" height="520" rx="16" fill="#241f52" opacity=".9"/><path d="M${i * 240 + 10} 140H${i * 240 + 170}" stroke="#5a5aa0" stroke-width="6" opacity=".5"/>`)
    .join('');
  const pink = '#c2389a';
  const pollen = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => sparkle(120 + i * 150, 200 + ((i * 137) % 420), 6 + (i % 3) * 4, i % 2 ? C.pinkLight : '#fff', 0.8)).join('');
  return panel(
    backdrop(id + 'b', [[0, '#160f38'], [0.7, '#2a1650'], [1, '#3a1a50']]) +
      `<defs>${glowDef(id + 'g', C.pink, 0.55)}${rad(id + 'k', [[0, '#fff0fa'], [0.5, '#ffb0e6'], [1, C.pink]], 0.4, 0.35, 0.7)}</defs>` +
      panels +
      `<path d="M0 600H1600V900H0Z" fill="#1a1440"/><path d="M0 600H1600" stroke="#5a5aa0" stroke-width="6"/>
      <path d="M200 900L520 600M1400 900L1080 600M800 900V600" stroke="#2c2560" stroke-width="5"/>` +
      glow(id + "g", 800, 330, 760, 0.7, 380) + glow(id + "g", 800, 760, 760, 0.85, 160) +
      vine([[-20, 120], [200, 60], [420, 140], [640, 70], [880, 130], [1100, 60], [1330, 140], [1620, 80]], 26, true, pink, C.pink) +
      vine([[-20, 520], [120, 400], [90, 240], [200, 140]], 20, true, pink, C.pink) +
      vine([[1620, 560], [1480, 420], [1520, 260], [1400, 140]], 20, true, pink, C.pink) +
      vine([[300, 900], [420, 760], [360, 640], [460, 600]], 18, true, pink, C.pink) +
      vine([[1300, 900], [1180, 760], [1240, 640], [1150, 600]], 18, true, pink, C.pink) +
      cocoon(id, 360, 380, 0.95, '#e8bf9a', '#5a3a22') +
      cocoon(id, 800, 420, 1.15, '#8a5a3c', '#1a1210') +
      cocoon(id, 1230, 370, 0.95, '#f0cfb0', '#c96a2a') +
      cocoon(id, 580, 250, 0.6, '#c8906c', '#2a1a12') +
      cocoon(id, 1030, 240, 0.6, '#e0b48e', '#e2c060') +
      pollen + flower(250, 92, 22, C.pink) + flower(760, 92, 18, '#ffb0e6') + flower(1210, 96, 22, C.pink) + flower(420, 640, 18, '#ffb0e6') + flower(1190, 650, 18, C.pink) +
      [[560, 720, 1], [700, 800, 0.8], [960, 760, 1.1], [1080, 690, 0.7], [180, 780, 0.9], [1460, 760, 0.9]]
        .map(([x, y, s]) => glow(id + 'g', x, y, 60 * s) + `<path d="M${x} ${y + 30 * s}V${y}" stroke="#3f7a3a" stroke-width="6"/><circle cx="${x}" cy="${y}" r="${14 * s}" fill="${C.pink}" ${ink(4)}/>`)
        .join('') +
      vignette(id + 'v', 0.42),
  );
}
