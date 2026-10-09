/** Chapter 3 panels for Talos's Forge: the sleeping bronze mech, and Talos sitting down by the sea, free. */
import { at, atalanta, backdrop, C, cloud, glow, glowDef, ink, iris, jason, leaf, lin, lux, panel, rad, ridge, sparkle, vignette } from '../kit';

const BRONZE = '#c8862e';
const BRONZE_LIGHT = '#e8b060';
const BRONZE_DARK = '#7a4a1a';
const PATINA = '#5aa88a';
const IRON = '#3a3230';
const TEAL = '#5ff0d0';

/** A row of little glowing leaves: the Gardeners' light-writing (centred on 0, 0). */
function lightWords(n: number, w: number, color = TEAL): string {
  return Array.from({ length: n }, (_, i) => leaf(-w / 2 + (i * w) / Math.max(1, n - 1), 0, 0.22, i % 2 ? -30 : 30, color, 2)).join('');
}

/**
 * The Gardeners' bronze mech, sitting (feet at 0, 0, about 520 units tall at scale 1): a round bronze
 * body, a glass cockpit bubble on top, big fists, a teal eye across the chest (dim and closed while it
 * sleeps). `awake` lights the eye and the light-words.
 */
function bronzeMech(x: number, y: number, s: number, awake: boolean, cockpit = ''): string {
  const eye = awake ? `<rect x="-80" y="-300" width="160" height="26" rx="13" fill="${TEAL}" ${ink(4)}/><rect x="-60" y="-296" width="40" height="8" rx="4" fill="#fff" opacity=".7"/>` : `<path d="M-70 -286Q0 -270 70 -286" fill="none" stroke="#2a4a44" stroke-width="10" stroke-linecap="round"/>`;
  const leg = (sx: number) =>
    `<path d="M${sx * 70} -150Q${sx * 120} -120 ${sx * 150} -40L${sx * 60} -40Z" fill="${BRONZE}" ${ink(6)}/>
     <rect x="${sx > 0 ? 40 : -200}" y="-46" width="160" height="50" rx="16" fill="${BRONZE}" ${ink(6)}/>
     <rect x="${sx > 0 ? 150 : -200}" y="-30" width="50" height="34" rx="10" fill="${PATINA}" ${ink(4)}/>`;
  const arm = (sx: number) =>
    `<circle cx="${sx * 175}" cy="-330" r="62" fill="${BRONZE_LIGHT}" ${ink(6)}/><path d="M${sx * 175} -300L${sx * 225} -150" ${ink(46)}/><path d="M${sx * 175} -300L${sx * 225} -150" stroke="${BRONZE}" stroke-width="34" stroke-linecap="round"/>
     <rect x="${sx * 225 - 55}" y="-160" width="110" height="100" rx="22" fill="${BRONZE_LIGHT}" ${ink(6)}/><path d="M${sx * 225 - 30} -158v40M${sx * 225} -158v40M${sx * 225 + 30} -158v40" stroke="${BRONZE_DARK}" stroke-width="5"/>`;
  const body = `<ellipse cx="0" cy="8" rx="260" ry="26" fill="#000" opacity=".22"/>
    ${leg(-1)}${leg(1)}
    <ellipse cx="0" cy="-260" rx="185" ry="150" fill="${BRONZE}" ${ink(7)}/>
    <path d="M-150 -170Q0 -110 150 -170" fill="none" stroke="${PATINA}" stroke-width="16" stroke-linecap="round"/>
    <path d="M-120 -360Q-150 -260 -100 -190" fill="none" stroke="#fff" stroke-width="12" opacity=".25" stroke-linecap="round"/>
    ${at(-95, -220, 1, lightWords(4, 70, awake ? TEAL : '#3a6a60'))}${at(95, -220, 1, lightWords(4, 70, awake ? TEAL : '#3a6a60'))}
    ${eye}
    ${arm(-1)}${arm(1)}
    <rect x="-90" y="-420" width="180" height="26" rx="12" fill="${IRON}" ${ink(5)}/>
    ${cockpit}
    <path d="M-92 -410A92 92 0 0 1 92 -410Z" fill="#bff4ff" fill-opacity=".28" ${ink(5)}/>
    <path d="M-60 -460Q-40 -488 -6 -496" fill="none" stroke="#fff" stroke-width="8" opacity=".6" stroke-linecap="round"/>
    <path d="M0 -500l-12 -40 12 -14 12 14z" fill="${PATINA}" ${ink(4)}/>`;
  return at(x, y, s, body);
}

/** 25. In the dark old forge, the heroes find the Gardeners' bronze mech asleep, and its eye starts to glow. */
export function ch3Mech(): string {
  const id = 'ch3-mech';
  const chains = [180, 420, 1180, 1420]
    .map((x, i) => `<path d="M${x} 0V${180 + (i % 2) * 70}" stroke="#2a1a14" stroke-width="10" stroke-dasharray="18 8"/><path d="M${x - 22} ${200 + (i % 2) * 70}h44l-8 30h-28z" fill="${IRON}" ${ink(4)}/>`)
    .join('');
  return panel(
    backdrop(id + 'b', [[0, '#1e120e'], [0.55, '#4a2414'], [1, '#2a160e']]) +
      `<defs>${glowDef(id + 'f', '#ff8a2a', 0.9)}${glowDef(id + 't', TEAL, 0.7)}${lin(id + 'g', [[0, '#3a2418'], [1, '#1a0e0a']])}</defs>` +
      // The great furnace at the back, still glowing, and bronze wall panels carved with leaves.
      glow(id + 'f', 800, 330, 520, 0.85, 300) +
      `<path d="M560 520V250Q800 90 1040 250V520Z" fill="#2a1a14" ${ink(7)}/><path d="M620 520V290Q800 170 980 290V520Z" fill="#ff7a1a"/><path d="M660 520V320Q800 230 940 320V520Z" fill="#ffd166"/>` +
      [80, 330, 1270, 1520].map((x) => `<rect x="${x - 100}" y="170" width="200" height="380" rx="20" fill="${BRONZE_DARK}" opacity=".85" ${ink(5)}/>${at(x, 300, 1.4, lightWords(3, 90, '#4a8a7a'))}`).join('') +
      chains +
      `<path d="M0 560H1600V900H0Z" fill="url(#${id}g)"/><path d="M0 560H1600" ${ink(6)}/>` +
      // The mech, sitting in the middle, waking up.
      glow(id + 't', 800, 600, 260, 0.55) +
      bronzeMech(800, 830, 0.95, true) +
      sparkle(700, 330, 12, TEAL) +
      sparkle(930, 300, 9, '#fff') +
      // Jason and LUX on the left, Atalanta and IRIS on the right, staring up at it.
      jason(330, 860, 1.05, { pose: 'point', face: 'shock', blaster: false }) +
      lux(180, 560, 0.85, 'glow') +
      atalanta(1280, 860, 1.05, { pose: 'cheer', face: 'grin' }) +
      iris(1450, 540, 0.85, 'happy', true) +
      vignette(id + 'v', 0.5, '#0a0604'),
  );
}

/**
 * TALOS sitting by the sea (hips at 0, 0, about 900 units tall at scale 1), free: legs out over the cliff
 * edge, hammer laid down, the gold crown on the ground, his eye teal again, head bowed in a nod.
 */
function talosSitting(id: string): string {
  const leg = (sx: number) =>
    `<path d="M${sx * 120} -40L${sx * 150} 300" ${ink(130)}/><path d="M${sx * 120} -40L${sx * 150} 300" stroke="#a8692a" stroke-width="116" stroke-linecap="round"/>
     <rect x="${sx * 150 - 80}" y="290" width="160" height="70" rx="20" fill="#a8692a" ${ink(6)}/>
     <rect x="${sx * 150 - 54}" y="80" width="108" height="150" rx="16" fill="#d8944a" ${ink(5)}/>`;
  return `<defs>${glowDef(id + 'i', '#ffd04a', 0.9)}</defs>
    ${leg(-1)}${leg(1)}
    <ellipse cx="0" cy="-40" rx="200" ry="70" fill="#2e2622" ${ink(6)}/>
    <ellipse cx="0" cy="-270" rx="250" ry="230" fill="#a8692a" ${ink(7)}/>
    <path d="M-220 -150Q0 -70 220 -150" fill="none" stroke="#4a9a7a" stroke-width="20" stroke-linecap="round"/>
    ${Array.from({ length: 8 }, (_, i) => {
      const a = (i / 8) * Math.PI * 2;
      return leaf(Math.cos(a) * 70, -300 + Math.sin(a) * 60, 0.32, (a * 180) / Math.PI, TEAL, 3);
    }).join('')}
    <circle cx="-270" cy="-400" r="90" fill="#d8944a" ${ink(6)}/><circle cx="270" cy="-400" r="90" fill="#d8944a" ${ink(6)}/>
    <path d="M-280 -380L-330 -60" ${ink(80)}/><path d="M-280 -380L-330 -60" stroke="#a8692a" stroke-width="66" stroke-linecap="round"/>
    <path d="M280 -380L360 -80" ${ink(80)}/><path d="M280 -380L360 -80" stroke="#a8692a" stroke-width="66" stroke-linecap="round"/>
    <rect x="-390" y="-90" width="120" height="110" rx="24" fill="#d8944a" ${ink(6)}/><rect x="300" y="-110" width="120" height="110" rx="24" fill="#d8944a" ${ink(6)}/>
    ${at(0, -560, 1, `<rect x="-60" y="40" width="120" height="50" fill="#2e2622" ${ink(5)}/><circle r="125" fill="#a8692a" ${ink(7)}/>
      <rect x="-90" y="-10" width="180" height="34" rx="17" fill="${TEAL}" ${ink(4)}/><rect x="-70" y="-5" width="50" height="10" rx="5" fill="#fff" opacity=".8"/>
      <path d="M0 -125l-20 -70 20 -26 20 26z" fill="#4a9a7a" ${ink(4)}/><path d="M-60 -90Q-90 -40 -80 10" fill="none" stroke="#fff" stroke-width="12" opacity=".2" stroke-linecap="round"/>`, false, 14)}`;
}

/** 26. Sunset by the sea: Talos sits on the cliff edge, free and calm, and nods to the little mech waving below. */
export function ch3Talos(): string {
  const id = 'ch3-talos';
  const sea = `<defs>${lin(id + 's', [[0, '#3a8aa8'], [1, '#14405a']])}${rad(id + 'u', [[0, '#fff6d8'], [0.4, '#ffd08a'], [1, '#ff9a5a', 0]])}</defs>`;
  const waves = [0, 1, 2, 3, 4].map((i) => `<path d="M${-40 + i * 360} ${640 + (i % 2) * 30}q60 -16 120 0t120 0" fill="none" stroke="#bfe8f4" stroke-width="5" opacity=".6" stroke-linecap="round"/>`).join('');
  const crown = at(1160, 810, 0.8, `<path d="M-70 0V-40L-46 -10L-22 -50L0 -12L22 -50L46 -10L70 -40V0Z" fill="#ffd04a" ${ink(5)}/><circle cx="0" cy="-20" r="10" fill="#ff3a4c" ${ink(3)}/>`, false, 18);
  const hammer = at(420, 800, 1, `<rect x="-240" y="-14" width="380" height="28" rx="12" fill="${IRON}" ${ink(5)}/><rect x="120" y="-70" width="150" height="140" rx="20" fill="#d8944a" ${ink(6)}/><rect x="120" y="-70" width="150" height="26" fill="#4a9a7a" ${ink(4)}/>`, false, -8);
  return panel(
    backdrop(id + 'b', [[0, '#2f6f9a'], [0.55, '#ffb48a'], [1, '#ffd8a8']]) +
      sea +
      `<circle cx="1240" cy="470" r="230" fill="url(#${id}u)"/><circle cx="1240" cy="470" r="80" fill="#fff4d8"/>` +
      cloud(260, 170, 1.1, '#ffe4c8', 0.8) +
      cloud(980, 120, 0.8, '#ffe4c8', 0.7) +
      `<rect y="520" width="1600" height="380" fill="url(#${id}s)"/>` +
      waves +
      // The bronze island's cliff top, with Talos sitting on the edge.
      ridge(7, 760, 60, '#5a3424', 5) +
      `<path d="M0 700Q500 660 900 720Q1300 760 1600 700V900H0Z" fill="#4a2a1c" ${ink(6)}/>` +
      // The cliff he sits on: his legs hang down over its face.
      `<path d="M470 560Q820 530 1150 560L1190 900H430Z" fill="#6a3e28" ${ink(6)}/><path d="M480 572Q820 544 1140 572" fill="none" stroke="#9a6440" stroke-width="10" stroke-linecap="round"/>` +
      at(820, 570, 0.62, talosSitting(id)) +
      glow(id + 'i', 1010, 790, 120, 0.9, 40) +
      hammer +
      crown +
      // The little mech below, with Jason in the bubble and Atalanta waving from the shoulder.
      bronzeMech(1360, 880, 0.42, true, at(0, -420, 1, `<circle cy="-40" r="40" fill="#ffd8b8" ${ink(4)}/><path d="M-40 -50Q0 -100 40 -50" fill="${C.orange}" ${ink(4)}/>`)) +
      atalanta(1440, 760, 0.42, { pose: 'wave', face: 'happy' }) +
      lux(1230, 640, 0.45, 'happy') +
      iris(1500, 630, 0.45, 'happy', true) +
      sparkle(700, 300, 12, '#fff') +
      sparkle(900, 250, 9, TEAL) +
      vignette(id + 'v', 0.35, '#2a1408'),
  );
}
