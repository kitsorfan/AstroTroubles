/** Chapter 3 panels for the Garden of Colchis: arriving in the Gardeners' garden, and the Sleepless Dragon sung to sleep. */
import { at, atalanta, backdrop, C, flower, gasGiant, glow, glowDef, ink, iris, jason, lin, lux, panel, ridge, sparkle, stars, vignette, vine } from '../kit';

const CRYSTAL = '#9fe8ff';
const VIOLET = '#c9a0ff';
const MINT = '#7dffc8';
const BARK = '#e8e0f4';

/** A tree of living crystal: a pale twisty trunk and branches tipped with glowing shards. Feet at (x, y). */
function crystalTree(x: number, y: number, s: number, flip = false): string {
  const shard = (sx: number, sy: number, rot: number, c: string, h = 70) =>
    at(sx, sy, 1, `<path d="M0 0L-14 -${h * 0.6}L0 -${h}L14 -${h * 0.6}Z" fill="${c}" ${ink(3)}/><path d="M0 -6L-5 -${h * 0.6}L0 -${h - 10}" fill="none" stroke="#fff" stroke-width="3" opacity=".6"/>`, false, rot);
  const body =
    `<path d="M-24 0Q-10 -120 -30 -220Q-6 -250 10 -220Q-4 -120 24 0Z" fill="${BARK}" ${ink(5)}/>` +
    `<path d="M-14 -170Q-80 -200 -110 -260M2 -200Q60 -240 90 -300M-20 -230Q-20 -290 -10 -330" fill="none" ${ink(16)}/>` +
    `<path d="M-14 -170Q-80 -200 -110 -260M2 -200Q60 -240 90 -300M-20 -230Q-20 -290 -10 -330" fill="none" stroke="${BARK}" stroke-width="10" stroke-linecap="round"/>` +
    shard(-110, -258, -40, CRYSTAL) +
    shard(-96, -250, 10, VIOLET, 54) +
    shard(90, -298, 30, VIOLET) +
    shard(74, -288, -20, CRYSTAL, 50) +
    shard(-10, -328, 0, CRYSTAL, 80) +
    shard(-26, -322, -30, VIOLET, 50);
  return at(x, y, s, body, flip);
}

/** A Gardener flower taller than a house: a curvy stem, two leaves and a big ring of petals. Feet at (x, y). */
function giantFlower(x: number, y: number, s: number, petal: string, flip = false): string {
  let petals = '';
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * 360;
    petals += at(0, -400, 1, `<ellipse cx="0" cy="-58" rx="34" ry="60" fill="${petal}" ${ink(4)}/>`, false, a);
  }
  const body =
    `<path d="M0 0Q-30 -200 0 -400" fill="none" ${ink(26)}/><path d="M0 0Q-30 -200 0 -400" fill="none" stroke="#4fae4a" stroke-width="18"/>` +
    `<path d="M-14 -150Q-90 -190 -120 -150Q-70 -130 -14 -150Z" fill="#5fbf5a" ${ink(4)}/>` +
    `<path d="M-8 -250Q70 -300 100 -260Q50 -230 -8 -250Z" fill="#4fae4a" ${ink(4)}/>` +
    petals +
    `<circle cx="0" cy="-400" r="40" fill="${C.gold}" ${ink(4)}/><circle cx="-10" cy="-412" r="12" fill="#fff6c8" opacity=".8"/>`;
  return at(x, y, s, body, flip);
}

/** A seed-sprite: a glowing seed with a leaf on its head, two dot eyes and little leaf wings. Centred at (x, y). */
export function seedSprite(x: number, y: number, s: number, color = MINT): string {
  const body =
    `<path d="M-30 -4Q-56 -26 -62 2Q-44 10 -30 -4ZM30 -4Q56 -26 62 2Q44 10 30 -4Z" fill="#8fe07a" ${ink(3)}/>` +
    `<ellipse cx="0" cy="0" rx="30" ry="36" fill="#f4ffe8" ${ink(4)}/>` +
    `<ellipse cx="0" cy="4" rx="22" ry="26" fill="${color}" opacity=".35"/>` +
    `<circle cx="-10" cy="-4" r="5" fill="${C.ink}"/><circle cx="10" cy="-4" r="5" fill="${C.ink}"/>` +
    `<path d="M-8 10Q0 16 8 10" fill="none" stroke="${C.ink}" stroke-width="3" stroke-linecap="round"/>` +
    `<path d="M0 -36Q20 -66 34 -54Q22 -40 0 -36Z" fill="#5fbf5a" ${ink(3)}/>`;
  return at(x, y, s, body);
}

/** One of Aeëtes's weeder drones: a gold dome, a red eye, a rotor and garden shears. Centred at (x, y). */
function weeder(x: number, y: number, s: number, flip = false): string {
  const body =
    `<path d="M-60 -50H60M0 -50V-30" ${ink(8)}/><path d="M-60 -50H60" stroke="#6a5a3a" stroke-width="4"/>` +
    `<path d="M-46 0Q-46 -36 0 -36Q46 -36 46 0Z" fill="${C.gold}" ${ink(5)}/>` +
    `<rect x="-50" y="-2" width="100" height="12" rx="6" fill="#b8862a" ${ink(4)}/>` +
    `<circle cx="18" cy="-14" r="9" fill="#ff3a4c" ${ink(3)}/>` +
    `<ellipse cx="0" cy="26" rx="18" ry="14" fill="#cfe86a" ${ink(4)}/>` +
    `<path d="M40 10L86 0M40 14L84 28" stroke="#d8dde6" stroke-width="7" stroke-linecap="round"/><circle cx="42" cy="12" r="5" fill="#6a5a3a"/>`;
  return at(x, y, s, body, flip);
}

/** A Gardener light-word fountain: a stone bowl with ribbons of coloured light rising out of it. Feet at (x, y). */
function lightFountain(id: string, x: number, y: number, s: number): string {
  const ribbons = ['#5ec8ff', '#7dff9a', '#ff6fcf', C.gold]
    .map((c, i) => `<path d="M${-30 + i * 20} -80Q${-60 + i * 40} -160 ${-20 + i * 14} -240" fill="none" stroke="${c}" stroke-width="10" stroke-linecap="round" opacity=".85"/>`)
    .join('');
  const body =
    glow(id, 0, -150, 130, 0.6) +
    `<path d="M-30 0L-20 -60H20L30 0Z" fill="#d8c8a8" ${ink(4)}/>` +
    `<path d="M-110 -60Q-100 -100 0 -100Q100 -100 110 -60Q60 -40 0 -40Q-60 -40 -110 -60Z" fill="#e8dcc0" ${ink(5)}/>` +
    `<ellipse cx="0" cy="-86" rx="86" ry="12" fill="${MINT}" opacity=".7"/>` +
    ribbons +
    sparkle(-40, -200, 10, '#fff') +
    sparkle(40, -250, 8, '#fff');
  return at(x, y, s, body);
}

/** 25. The Argonauts step out into the Gardeners' garden at dusk: giant flowers, crystal trees, a light-word fountain, seed-sprites, and a weeder drone snipping a flower. */
export function ch3Garden(): string {
  const id = 'ch3-garden';
  return panel(
    backdrop(id + 'b', [[0, '#2c2266'], [0.45, '#7a4a9a'], [0.75, '#ffa08a'], [1, '#ffd0a0']]) +
      `<defs>${glowDef(id + 'g', MINT, 0.6)}${glowDef(id + 'f', '#fff2c0', 0.7)}${glowDef(id + 't', '#ffe8b0', 0.8)}${lin(id + 'h', [[0, '#3f8f4a'], [1, '#2a6a36']])}</defs>` +
      stars(91, 90, 0, 0, 1600, 360) +
      gasGiant(id + 'j', 1340, 170, 90, false) +
      // The great tree-temple far away, its canopy glowing.
      glow(id + 't', 800, 300, 260, 0.7) +
      `<path d="M730 540Q760 420 740 300H860Q840 420 870 540Z" fill="#c8b8e0" ${ink(4)}/>` +
      `<path d="M780 540V470Q800 440 820 470V540Z" fill="#fff2c0" ${ink(3)}/>` +
      [
        [690, 300, 80],
        [800, 250, 100],
        [910, 300, 80],
        [740, 210, 70],
        [870, 210, 70],
      ]
        .map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#b89ae8" ${ink(4)}/>`)
        .join('') +
      `<g fill="${CRYSTAL}" ${ink(2)}><circle cx="720" cy="260" r="8"/><circle cx="830" cy="200" r="9"/><circle cx="900" cy="290" r="7"/><circle cx="780" cy="300" r="6"/></g>` +
      ridge(3, 560, 60, '#4a6a8a', 7) +
      ridge(5, 640, 50, `url(#${id}h)`, 6) +
      crystalTree(250, 690, 0.9) +
      crystalTree(1300, 700, 0.8, true) +
      giantFlower(120, 900, 1.15, '#ff9ad8') +
      giantFlower(1480, 900, 1.05, '#ffb3e8', true) +
      `<path d="M0 760Q400 720 800 750Q1200 780 1600 740V900H0Z" fill="#5aa848" ${ink(5)}/>` +
      lightFountain(id + 'g', 800, 790, 1) +
      vine([[1000, 900], [1040, 820], [1100, 800], [1160, 760]], 12) +
      flower(420, 830, 14, C.pink) +
      flower(1150, 860, 12, C.gold) +
      flower(620, 870, 11, '#fff') +
      flower(980, 850, 13, CRYSTAL) +
      seedSprite(560, 420, 0.8) +
      seedSprite(1020, 470, 0.65, C.gold) +
      seedSprite(700, 300, 0.5, '#ff9ad8') +
      weeder(1420, 330, 0.9, true) +
      sparkle(1360, 400, 10, C.gold) +
      jason(470, 900, 1.0, { pose: 'point', face: 'happy' }) +
      atalanta(640, 900, 1.0, { pose: 'spread', face: 'grin' }) +
      lux(330, 560, 0.75, 'happy') +
      iris(1090, 600, 0.75, 'happy', true) +
      vignette(id + 'v', 0.3, '#2a1a40'),
  );
}

const BODY = '#3f8f4a';
const BODY_DARK = '#2a6a36';

/** One fat loop of the dragon's coil, with a vine band and a crystal spike. */
function coil(x: number, y: number, rx: number, ry: number, spike = true): string {
  return (
    `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${BODY}" ${ink(5)}/>` +
    `<path d="M${x - rx * 0.9} ${y + ry * 0.2}Q${x} ${y + ry * 0.9} ${x + rx * 0.9} ${y + ry * 0.2}" fill="none" stroke="#8fd07a" stroke-width="10" opacity=".7"/>` +
    `<path d="M${x - rx * 0.3} ${y - ry * 0.95}Q${x - rx * 0.2} ${y} ${x - rx * 0.3} ${y + ry * 0.95}" fill="none" stroke="${BODY_DARK}" stroke-width="8"/>` +
    (spike ? `<path d="M${x + rx * 0.1} ${y - ry * 0.85}L${x + rx * 0.2} ${y - ry * 1.7}L${x + rx * 0.4} ${y - ry * 0.75}Z" fill="${CRYSTAL}" ${ink(3)}/>` : '')
  );
}

/** A music note of light. */
const note = (x: number, y: number, s: number, c: string) =>
  at(x, y, s, `<ellipse cx="0" cy="0" rx="16" ry="12" fill="${c}" ${ink(3)} transform="rotate(-20)"/><path d="M14 -4V-62Q30 -54 36 -40" fill="none" stroke="${c}" stroke-width="6" stroke-linecap="round"/>`);

/** A soft "z" of sleep. */
const zed = (x: number, y: number, s: number) =>
  at(x, y, s, `<path d="M-16 -16H16L-16 16H16" fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" opacity=".9"/>`);

/** 26. Night in the garden: the Sleepless Dragon curled up asleep around its crystal tree, smiling; LUX and IRIS sing; Jason and Atalanta tiptoe past; four pylons beam light into the sky. */
export function ch3Dragon(): string {
  const id = 'ch3-dragon';
  const beams = [
    [180, '#5ec8ff'],
    [470, '#ff6fcf'],
    [1150, '#7dff9a'],
    [1440, C.gold],
  ]
    .map(([x, c]) => `<path d="M${Number(x) - 14} 650L${Number(x) - 40} 0H${Number(x) + 40}L${Number(x) + 14} 650Z" fill="${c}" opacity=".22"/><rect x="${Number(x) - 22}" y="560" width="44" height="110" rx="8" fill="#d8c8a8" ${ink(4)}/><path d="M${x} 520l-24 30 24 30 24 -30Z" fill="${c}" ${ink(3)}/>`)
    .join('');
  const head =
    `<path d="M0 0Q-20 -90 70 -110Q190 -120 230 -60Q250 -10 200 10Q120 30 0 0Z" fill="${BODY}" ${ink(6)}/>` +
    `<path d="M120 4Q190 0 228 -30Q236 0 200 14Q150 26 120 4Z" fill="#8fd07a" ${ink(4)}/>` +
    // Closed, happy eyes and a sleepy smile.
    `<path d="M92 -72Q112 -58 132 -72" fill="none" stroke="${C.ink}" stroke-width="7" stroke-linecap="round"/>` +
    `<path d="M170 -20Q190 -8 210 -22" fill="none" stroke="${C.ink}" stroke-width="5" stroke-linecap="round"/>` +
    `<circle cx="214" cy="-60" r="5" fill="${C.ink}"/>` +
    // Crystal horns and the glowing brow gem.
    `<path d="M40 -96L-40 -170L60 -112ZM70 -108L20 -190L96 -116Z" fill="${CRYSTAL}" ${ink(4)}/>` +
    `<path d="M112 -110l12 -16 12 16 -12 16Z" fill="${MINT}" ${ink(3)}/>`;
  return panel(
    backdrop(id + 'b', [[0, '#0e0c30'], [0.55, '#2c2266'], [1, '#4a3a7a']]) +
      `<defs>${glowDef(id + 'g', MINT, 0.6)}${glowDef(id + 'm', '#fff6d0', 0.8)}</defs>` +
      stars(37, 160, 0, 0, 1600, 520) +
      glow(id + 'm', 1350, 140, 90) +
      `<circle cx="1350" cy="140" r="46" fill="#fff6d0" ${ink(4)}/><circle cx="1370" cy="128" r="40" fill="#0e0c30" opacity=".85"/>` +
      beams +
      `<path d="M0 640Q800 600 1600 640V900H0Z" fill="#2f6a3a" ${ink(5)}/>` +
      // The crystal tree in the middle, glowing softly.
      glow(id + 'g', 800, 330, 330, 0.8) +
      crystalTree(800, 700, 1.25) +
      // The coils, back to front, then the tail curling round and the head resting on top.
      coil(560, 650, 150, 70) +
      coil(1040, 650, 150, 70) +
      coil(800, 690, 240, 90) +
      `<path d="M1180 700Q1350 760 1300 820Q1260 860 1180 830" fill="none" ${ink(46)}/><path d="M1180 700Q1350 760 1300 820Q1260 860 1180 830" fill="none" stroke="${BODY}" stroke-width="34" stroke-linecap="round"/>` +
      `<path d="M1180 830l-40 -10 30 -24Z" fill="${CRYSTAL}" ${ink(3)}/>` +
      at(560, 610, 1.15, head) +
      zed(500, 520, 0.9) +
      zed(450, 450, 1.2) +
      zed(390, 370, 1.5) +
      // LUX and IRIS singing above it.
      lux(560, 300, 0.8, 'happy') +
      iris(1050, 290, 0.85, 'sing', true) +
      note(650, 250, 1, MINT) +
      note(720, 330, 0.8, '#ff9ad8') +
      note(960, 220, 0.9, C.gold) +
      note(900, 300, 0.7, CRYSTAL) +
      sparkle(500, 200, 10, '#fff') +
      sparkle(1120, 180, 12, '#fff') +
      // Jason and Atalanta tiptoeing past, grinning.
      jason(260, 900, 0.95, { pose: 'cheer', face: 'smile' }) +
      atalanta(1360, 900, 0.95, { pose: 'wave', face: 'happy', flip: true }) +
      vignette(id + 'v', 0.45, '#0b0820'),
  );
}
