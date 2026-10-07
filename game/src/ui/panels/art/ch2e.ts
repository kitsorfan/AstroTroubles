/** Chapter 2 panels, part 5: Gaia Nova set free, and Brennus planting tomatoes with Jason. */
import { at, backdrop, brennus, C, captain, cloud, flower, gascuBloom, glow, glowDef, hypatia, ink, jason, leaf, lux, panel, ridge, rng, shuttle, sparkle } from '../kit';

/** Flowers scattered over a band of the meadow (bigger toward the front). */
function meadow(seed: number, n: number, y0: number, y1: number): string {
  const rand = rng(seed);
  const cols = [C.pink, C.gold, '#fff', C.hello, '#ff8a3d'];
  let out = '';
  for (let i = 0; i < n; i++) {
    const y = y0 + rand() * (y1 - y0);
    out += flower(Math.round(rand() * 1600), Math.round(y), 8 + ((y - y0) / (y1 - y0)) * 16, cols[i % cols.length]);
  }
  return out;
}

/** 18. Gaia Nova set free: a valley in bloom, shuttles landing, GaScu a big happy flower; everyone cheers. */
export function ch2Freed(): string {
  const id = 'ch2-freed';
  return panel(
    backdrop(id + 'b', [[0, '#5aa8ec'], [0.6, '#a8dcff'], [1, '#e8f6ff']]) +
      `<defs>${glowDef(id + 's', '#fff6d0', 0.9)}</defs>` +
      glow(id + 's', 1300, 120, 260) +
      `<circle cx="1300" cy="120" r="50" fill="#fffbe8"/>` +
      cloud(260, 170, 1, '#fff', 0.9) +
      cloud(980, 120, 0.8, '#fff', 0.85) +
      `<path d="M900 470L1100 250L1180 300L1260 240L1460 470Z" fill="#8aa0c8"/><path d="M1100 250L1180 300L1260 240L1230 290L1180 330L1130 290Z" fill="#fff" opacity=".8"/>` +
      ridge(21, 470, 80, '#7ab878', 6) +
      ridge(5, 560, 70, '#6aaa4a', 5) +
      ridge(8, 660, 60, C.green2, 4) +
      meadow(3, 18, 520, 700) +
      shuttle(id + 'a', 360, 330, 0.55, 12) +
      shuttle(id + 'c', 1180, 380, 0.4, 8) +
      shuttle(id + 'd', 560, 200, 0.32, 14) +
      gascuBloom(id + 'g', 800, 430, 1.0, 270) +
      `<path d="M0 760Q400 720 800 750T1600 740V900H0Z" fill="#5f9a3a"/>` +
      meadow(9, 10, 770, 880) +
      captain(300, 930, 1.0, { pose: 'cheer', face: 'happy' }) +
      jason(560, 920, 0.95, { pose: 'cheer', face: 'grin' }) +
      lux(1040, 560, 1.05, 'happy') +
      hypatia(1280, 930, 1.0, { pose: 'cheer', face: 'grin', flip: true }) +
      sparkle(700, 300, 16) +
      sparkle(920, 240, 12) +
      sparkle(640, 520, 10, '#fff6d0'),
  );
}

/** A small colony house: round walls, an orange dome roof and a round window. */
const house = (x: number, y: number, s: number) =>
  at(
    x,
    y,
    s,
    `<rect x="-60" y="-90" width="120" height="90" rx="14" fill="#f4f0e8" ${ink(5)}/><path d="M-70 -86Q0 -170 70 -86Z" fill="${C.orange}" ${ink(5)}/>
    <circle cx="-22" cy="-50" r="16" fill="${C.cyan}" ${ink(4)}/><rect x="14" y="-56" width="28" height="56" rx="10" fill="#8a5a34" ${ink(4)}/>`,
  );

/** 19. A sunny colony garden: old Brennus, cap off and teary-happy, plants tomatoes with Jason. */
export function ch2Redeemed(): string {
  const id = 'ch2-redeemed';
  const seedlings = [150, 680, 900, 1250, 1440]
    .map((x, i) => `<path d="M${x} 830V800" stroke="#3f7a3a" stroke-width="6"/>${leaf(x, 802, 0.42, i % 2 ? -150 : -160)}${leaf(x, 802, 0.42, i % 2 ? -30 : -20)}`)
    .join('');
  return panel(
    backdrop(id + 'b', [[0, '#7ec4f4'], [0.6, '#cfeaff'], [1, '#fff4dc']]) +
      `<defs>${glowDef(id + 's', '#fff2c0', 0.9)}${glowDef(id + 'g', C.gold, 0.6)}</defs>` +
      glow(id + 's', 260, 110, 220) +
      `<circle cx="260" cy="110" r="44" fill="#fffbe8"/>` +
      cloud(700, 130, 0.8, '#fff', 0.9) +
      cloud(1420, 180, 0.7, '#fff', 0.85) +
      ridge(14, 520, 70, '#8ac070', 5) +
      house(980, 470, 0.7) +
      house(1440, 486, 0.62) +
      house(140, 500, 0.6) +
      house(370, 494, 0.55) +
      ridge(6, 600, 50, '#6aaa4a', 4) +
      glow(id + 'g', 1220, 350, 420, 0.8) +
      gascuBloom(id + 'f', 1220, 340, 0.85, 300) +
      // The garden bed.
      `<path d="M0 700Q800 660 1600 700V900H0Z" fill="#86b84e"/><path d="M60 800Q800 770 1540 800L1580 880Q800 850 20 880Z" fill="#7a4a2a" ${ink(5)}/>` +
      seedlings +
      meadow(17, 8, 700, 760) +
      // Brennus's cap, set down on the grass.
      at(290, 806, 0.6, `<path d="M-50 0Q-60 -50 2 -56Q62 -50 52 0Z" fill="${C.olive}" ${ink(5)}/><path d="M-50 -12H52V0H-50Z" fill="${C.red}" ${ink(3)}/><path d="M-46 0Q8 20 60 0L58 8Q8 30 -46 8Z" fill="#14121c" ${ink(3)}/><circle cx="4" cy="-32" r="9" fill="${C.gold}" ${ink(3)}/>`) +
      brennus(530, 885, 1.3, { capOff: true, legs: 'kneel', pose: 'plant', face: 'teary' }) +
      jason(1060, 885, 1.15, { legs: 'kneel', pose: 'plant', face: 'grin', flip: true, blaster: false }) +
      // LUX with its tiny watering can.
      at(740, 400, 1.15, `<path d="M40 30L70 40" ${ink(10)}/><path d="M40 30L70 40" stroke="#9aa6ba" stroke-width="5"/><rect x="62" y="28" width="56" height="44" rx="10" fill="#5e9bff" ${ink(5)}/><path d="M118 40L156 26" ${ink(10)}/><path d="M118 40L156 26" stroke="#5e9bff" stroke-width="5"/>`) +
      lux(740, 400, 1.15, 'happy') +
      `<g fill="${C.cyan}" ${ink(2)}><path d="M924 470q-6 10 0 14q6 -4 0 -14Z"/><path d="M932 540q-6 10 0 14q6 -4 0 -14Z"/><path d="M920 620q-6 10 0 14q6 -4 0 -14Z"/><path d="M906 700q-6 10 0 14q6 -4 0 -14Z"/></g>` +
      sparkle(1080, 220, 14, '#fff6d0') +
      sparkle(1380, 300, 10, '#fff6d0'),
  );
}
