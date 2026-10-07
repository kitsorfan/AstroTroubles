/** Chapter 2 panels, part 6: LUX is taken in the tundra, IRIS wakes in the jungle, and LUX comes home. */
import { at, backdrop, C, glow, glowDef, ink, iris, jason, lux, panel, RAINBOW, ridge, rng, snare, sparkle, stars, vignette } from '../kit';
import { jungle, undergrowth } from './scenery';

/** Swirling snowflakes across the whole picture. */
function blizzard(seed: number, n: number): string {
  const rand = rng(seed);
  let out = '<g fill="#ffffff">';
  for (let i = 0; i < n; i++) {
    const x = Math.round(rand() * 1600);
    const y = Math.round(rand() * 900);
    const r = (2 + rand() * 6).toFixed(1);
    out += `<circle cx="${x}" cy="${y}" r="${r}" opacity="${(0.4 + rand() * 0.5).toFixed(2)}"/>`;
  }
  out += '</g><g stroke="#ffffff" stroke-width="3" stroke-linecap="round" opacity=".35">';
  for (let i = 0; i < 18; i++) {
    const x = Math.round(rand() * 1600);
    const y = Math.round(rand() * 900);
    out += `<path d="M${x} ${y}l70 22"/>`;
  }
  return out + '</g>';
}

/** 20. A blizzard at night: Brennus's snare drone flies off toward the volcano with LUX in its cage; Jason runs after it. */
export function ch2LuxTaken(): string {
  const id = 'ch2-luxtaken';
  return panel(
    backdrop(id + 'b', [[0, '#0d1636'], [0.6, '#2a3d6a'], [1, '#6a8ab8']]) +
      stars(31, 40, 0, 0, 1600, 360, '#dfe8ff') +
      `<defs>${glowDef(id + 'r', '#ff4a2a', 0.7)}${glowDef(id + 'c', '#ff3a4c', 0.6)}</defs>` +
      // Far away, the volcano glows red: that is where the drone is heading.
      glow(id + 'r', 1420, 470, 260, 0.8, 140) +
      `<path d="M1230 600L1380 450Q1420 430 1460 450L1610 600Z" fill="#2a2440"/><path d="M1380 450Q1420 470 1460 450" fill="none" stroke="#ff6a2a" stroke-width="6"/>` +
      ridge(7, 590, 60, '#3a4c7a', 5) +
      ridge(8, 660, 50, '#8aa4cc', 6) +
      `<path d="M0 720Q400 690 800 724T1600 712V900H0Z" fill="#e8f2ff"/><path d="M0 760Q500 740 1000 770T1600 760" fill="none" stroke="#b8cce8" stroke-width="10" opacity=".7"/>` +
      // Jason's footprints in the snow, then Jason running and reaching up.
      [160, 250, 340, 430].map((x, i) => `<ellipse cx="${x}" cy="${790 + (i % 2) * 18}" rx="22" ry="8" fill="#b8cce8"/>`).join('') +
      jason(500, 860, 1.3, { pose: 'reach', legs: 'run', face: 'shock' }) +
      // The drone, its cage and LUX.
      `<path d="M640 420Q780 300 880 250" fill="none" stroke="#ffffff" stroke-width="8" stroke-dasharray="20 18" opacity=".35" stroke-linecap="round"/>` +
      glow(id + 'c', 1080, 430, 330, 0.6) +
      snare(1080, 200, 2.2, lux(1080, 430, 1.45, 'scared')) +
      at(1080, 430, 1.45, `<path d="M-60 -40q-10 -14 -2 -26M66 -48q10 -12 2 -26" fill="none" stroke="${C.cyan}" stroke-width="5" stroke-linecap="round"/>`) +
      blizzard(12, 120) +
      vignette(id + 'v', 0.5),
  );
}

/** 21. In the jungle roots: Jason kneels, and IRIS rises out of the vines in a burst of rainbow light. */
export function ch2Iris(): string {
  const id = 'ch2-iris';
  const rays = RAINBOW.map((c, i) => {
    const a = (-150 + i * 24) * (Math.PI / 180);
    const b = a + 0.2;
    const r = 900;
    return `<path d="M960 420L${Math.round(960 + Math.cos(a) * r)} ${Math.round(420 + Math.sin(a) * r)}L${Math.round(960 + Math.cos(b) * r)} ${Math.round(420 + Math.sin(b) * r)}Z" fill="${c}" opacity=".16"/>`;
  }).join('');
  const roots = `<g fill="#5a3a24" ${ink(6)}>
      <path d="M640 900Q700 760 820 700Q900 680 960 720Q1020 680 1110 700Q1230 760 1290 900Z"/>
    </g>
    <path d="M700 900Q760 800 860 760M1230 900Q1170 800 1060 760M900 720Q930 800 920 900" fill="none" stroke="#3a2414" stroke-width="10" stroke-linecap="round"/>
    <path d="M760 820Q860 740 960 760Q1060 740 1170 820" fill="none" stroke="#7a5236" stroke-width="7" opacity=".7" stroke-linecap="round"/>`;
  return panel(
    jungle(id + 'j', 5, ['#163a30', '#24503c', '#123024'], 770) +
      `<defs>${glowDef(id + 'g', '#e6d6ff', 0.85)}</defs>` +
      rays +
      glow(id + 'g', 960, 420, 330, 0.9) +
      roots +
      // Torn vines she was tangled in.
      `<path d="M860 760Q820 700 860 660M1060 760Q1110 700 1070 650" fill="none" stroke="#3f7a3a" stroke-width="12" stroke-linecap="round"/>
      <path d="M860 760Q820 700 860 660M1060 760Q1110 700 1070 650" fill="none" stroke="#86b84e" stroke-width="4" stroke-linecap="round" opacity=".7"/>` +
      iris(960, 420, 1.9, 'happy') +
      jason(470, 860, 1.05, { pose: 'reach', legs: 'kneel', face: 'happy' }) +
      RAINBOW.map((c, i) => sparkle(760 + i * 80, 230 + ((i * 97) % 160), 12 + (i % 3) * 4, c, 0.9)).join('') +
      undergrowth(3, 870, '#2f6a3a', '#4a8a4a') +
      vignette(id + 'v', 0.45),
  );
}

/** 22. The gatehouse in Mount Atlantas: the armour lies in pieces, and Jason hugs LUX tight while IRIS sings. */
export function ch2LuxBack(): string {
  const id = 'ch2-luxback';
  const shard = (x: number, y: number, rot: number, s = 1) =>
    at(x, y, s, `<path d="M-30 10L0 -30L34 8L10 18Z" fill="#2a1e26" ${ink(4)}/><path d="M-10 4L4 -16" stroke="#ff3a4c" stroke-width="4" stroke-linecap="round"/>`, false, rot);
  return panel(
    backdrop(id + 'b', [[0, '#2a0e14'], [0.55, '#5a2014'], [1, '#8a3a14']]) +
      `<defs>${glowDef(id + 'l', C.lava, 0.8)}${glowDef(id + 'h', C.cyan, 0.8)}${glowDef(id + 'i', '#e6d6ff', 0.8)}</defs>` +
      // Fortress walls, with Brennus's banners hanging off them.
      `<path d="M0 0H300V720H0ZM1300 0H1600V720H1300Z" fill="#2a1418"/><path d="M300 0V720M1300 0V720" stroke="#ff6a12" stroke-width="6" opacity=".3"/>
      <path d="M120 60H220V300L170 260L120 300Z" fill="${C.red}" ${ink(5)}/><path d="M1380 60H1480V300L1430 260L1380 300Z" fill="${C.red}" ${ink(5)}/>` +
      glow(id + 'l', 800, 900, 900, 0.8, 300) +
      `<path d="M0 760Q400 730 800 750T1600 740V900H0Z" fill="#3a1a14" ${ink(6)}/>` +
      // The broken armour and the cracked control chip.
      shard(380, 850, -20, 1.3) +
      shard(960, 868, 30, 1.2) +
      shard(1110, 830, 160, 1.1) +
      shard(470, 880, 80, 1) +
      at(860, 870, 1.3, `<rect x="-24" y="-16" width="48" height="32" rx="6" fill="#ff3a4c" ${ink(4)}/><path d="M-10 -16L2 0L-6 6L8 16" fill="none" ${ink(4)}/>`, false, 12) +
      // IRIS sings her light-words.
      glow(id + 'i', 1180, 300, 260, 0.8) +
      `<g fill="none" stroke-linecap="round" stroke-width="12" opacity=".85"><path d="M1050 280Q900 260 800 420" stroke="${C.hello}"/><path d="M1060 340Q930 340 830 470" stroke="${C.pink}"/><path d="M1070 400Q960 420 860 520" stroke="${C.gold}"/></g>` +
      iris(1180, 300, 1.7, 'sing', true) +
      // Jason hugs LUX, smiling through happy tears.
      glow(id + 'h', 640, 640, 320, 0.7) +
      jason(640, 900, 1.9, { pose: 'hold', face: 'teary' }) +
      lux(648, 752, 1.8, 'happy', C.cyan, true) +
      `<circle cx="596" cy="800" r="27" fill="#e9edf3" ${ink(6)}/><circle cx="700" cy="800" r="27" fill="#e9edf3" ${ink(6)}/>` +
      at(800, 440, 1.6, `<path d="M0 0c-14 -22 -44 -10 -30 12l30 26 30 -26c14 -22 -16 -34 -30 -12Z" fill="${C.pink}" ${ink(4)}/>`) +
      sparkle(470, 520, 16, C.cyan, 0.9) +
      sparkle(520, 420, 10, C.gold, 0.9) +
      sparkle(860, 560, 12, C.gold, 0.9) +
      vignette(id + 'v', 0.45),
  );
}

