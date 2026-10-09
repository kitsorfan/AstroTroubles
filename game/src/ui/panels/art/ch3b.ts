/** Chapter 3 panels, part 2: the Harpy Isles. Atalanta and her stripped skiff, and old Phineus's stolen dinner. */
import {
  at,
  atalanta,
  backdrop,
  C,
  cloud,
  gasGiant,
  glow,
  glowDef,
  ink,
  iris,
  jason,
  lux,
  panel,
  person,
  poly,
  r1,
  rng,
  sparkle,
  stars,
  vignette,
} from '../kit';
import * as gn from '../gn';

const GOLD = '#ffc94a';
const GOLD_DARK = '#c8901e';
const SKIFF = '#2fb7a3';
const SKIFF_DARK = '#1d7a6e';
const SNOW = '#eef3f6';

/** The colours of a sky-isle: grass on top, the grass's lip, the rock below, its shadow, and roots. */
interface Tone {
  grass: string;
  edge: string;
  rock: string;
  shade: string;
  root: string;
  tree: string;
}

/**
 * A floating sky-isle: a grassy cap over a rocky underside with dangling roots, a few round trees and
 * (optionally) a little waterfall spilling off the edge at `fall` (-0.5..0.5 of the width). Top centre
 * at (x, y), `w` wide. Far-away isles pass `inked: false`.
 */
function isle(x: number, y: number, w: number, t: Tone, o: { seed?: number; trees?: number; fall?: number; inked?: boolean } = {}): string {
  const rand = rng(o.seed ?? 1);
  const h = w * 0.7;
  const k = w / 200;
  const line = o.inked === false ? '' : ink(Math.max(2, Math.min(6, Math.round(3 * k))));
  const prof = [[-0.5, 0], [-0.44, 0.2], [-0.32, 0.38], [-0.2, 0.62], [-0.06, 0.92], [0.04, 1], [0.14, 0.74], [0.26, 0.5], [0.38, 0.3], [0.5, 0]];
  const pts = prof.map(([fx, fy], i) => [fx * w + (i % 9 ? (rand() - 0.5) * w * 0.05 : 0), fy * h * (i % 9 ? 0.9 + rand() * 0.2 : 1)]);
  let out = `<path d="${poly(pts)}Z" fill="${t.rock}" ${line}/>`;
  out += `<path d="${poly([[w * 0.02, h * 0.1], ...pts.slice(5)])}Z" fill="${t.shade}" opacity=".55"/>`;
  out += `<path d="M${r1(-w * 0.3)} ${r1(h * 0.16)}l${r1(w * 0.08)} ${r1(h * 0.06)}l${r1(w * 0.06)} ${r1(-h * 0.03)}M${r1(-w * 0.12)} ${r1(h * 0.42)}l${r1(w * 0.1)} ${r1(h * 0.04)}" fill="none" stroke="${t.shade}" stroke-width="${r1(3 * k)}" stroke-linecap="round"/>`;
  // Roots dangling from the underside.
  const roots = [
    [-0.33, 0.34],
    [-0.12, 0.72],
    [0.18, 0.6],
    [0.34, 0.32],
  ]
    .map(([fx, fy], i) => {
      const rx = fx * w;
      const ry = fy * h;
      const len = (40 + rand() * 50) * k;
      return `M${r1(rx)} ${r1(ry)}q${r1((i % 2 ? 10 : -10) * k)} ${r1(len * 0.5)} ${r1(-2 * k)} ${r1(len)}t${r1(6 * k)} ${r1(len * 0.6)}`;
    })
    .join('');
  out += `<path d="${roots}" fill="none" stroke="${t.root}" stroke-width="${r1(Math.max(1.5, 3.5 * k))}" stroke-linecap="round"/>`;
  // The grassy cap, its lip hanging over the rock in little scallops.
  const top = `M${r1(-w / 2 - 6 * k)} ${r1(4 * k)}Q${r1(-w * 0.3)} ${r1(-w * 0.1)} 0 ${r1(-w * 0.09)}Q${r1(w * 0.3)} ${r1(-w * 0.1)} ${r1(w / 2 + 6 * k)} ${r1(4 * k)}`;
  let lip = '';
  for (let i = 0; i < 8; i++) lip += `Q${r1(w / 2 - ((i + 0.5) * w) / 8)} ${r1(22 * k)} ${r1(w / 2 - ((i + 1) * w) / 8 - (i === 7 ? 6 * k : 0))} ${r1(6 * k)}`;
  out += `<path d="${top}${lip}Z" fill="${t.edge}" ${line}/>`;
  out += `<path d="${top}Q0 ${r1(10 * k)} ${r1(-w / 2 - 6 * k)} ${r1(4 * k)}Z" fill="${t.grass}"/>`;
  // Round trees on top.
  const n = o.trees ?? 0;
  for (let i = 0; i < n; i++) {
    const tx = (-0.32 + (0.64 * (i + 0.5)) / n + (rand() - 0.5) * 0.08) * w;
    const ty = -w * 0.09 * (1 - ((2 * tx) / w) ** 2) + 2 * k;
    const tr = (12 + rand() * 8) * k;
    out += `<path d="M${r1(tx)} ${r1(ty)}V${r1(ty - tr * 1.4)}" stroke="#6a4a30" stroke-width="${r1(5 * k)}"/><circle cx="${r1(tx)}" cy="${r1(ty - tr * 1.6)}" r="${r1(tr)}" fill="${t.tree}" ${line}/>`;
  }
  // A thin waterfall pouring off the edge into the clouds.
  if (o.fall !== undefined) {
    const a = o.fall * w;
    const L = h * 1.5;
    out += `<path d="M${r1(a)} ${r1(8 * k)}Q${r1(a + 8 * k)} ${r1(24 * k)} ${r1(a + 6 * k)} ${r1(L * 0.6)}H${r1(a + 24 * k)}Q${r1(a + 26 * k)} ${r1(24 * k)} ${r1(a + 18 * k)} ${r1(8 * k)}Z" fill="#e4f8ff" opacity=".85"/>`;
    out += `<path d="M${r1(a + 6 * k)} ${r1(L * 0.6)}L${r1(a + 4 * k)} ${r1(L)}H${r1(a + 26 * k)}L${r1(a + 24 * k)} ${r1(L * 0.6)}Z" fill="#e4f8ff" opacity=".4"/>`;
    out += `<path d="M${r1(a + 12 * k)} ${r1(20 * k)}V${r1(L * 0.5)}" stroke="#fff" stroke-width="${r1(3 * k)}" opacity=".8"/>`;
  }
  return at(x, y, 1, out);
}

/** A sagging rope bridge from (x1, y1) to (x2, y2): a plank deck and a hand-rope above it. */
function bridge(x1: number, y1: number, x2: number, y2: number, sag: number, s = 1, rope = '#6a4a30', wood = '#c89a62'): string {
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2 + sag * 2;
  const q = (t: number, dy = 0) => [(1 - t) ** 2 * x1 + 2 * (1 - t) * t * mx + t * t * x2, (1 - t) ** 2 * y1 + 2 * (1 - t) * t * my + t * t * y2 + dy];
  const n = Math.max(6, Math.round(Math.abs(x2 - x1) / (16 * s)));
  let planks = '';
  let ties = '';
  for (let i = 1; i < n; i++) {
    const [px, py] = q(i / n);
    planks += `M${r1(px)} ${r1(py - 3 * s)}V${r1(py + 5 * s)}`;
    if (i % 3 === 0) ties += `M${r1(px)} ${r1(py)}V${r1(py - 22 * s)}`;
  }
  const curve = (dy: number) => `M${x1} ${y1 + dy}Q${r1(mx)} ${r1(my + dy)} ${x2} ${y2 + dy}`;
  return `<g fill="none" stroke-linecap="round"><path d="${ties}" stroke="${rope}" stroke-width="${r1(2 * s)}"/><path d="${planks}" stroke="${wood}" stroke-width="${r1(8 * s)}"/>
    <path d="${curve(0)}" stroke="${rope}" stroke-width="${r1(3 * s)}"/><path d="${curve(-22 * s)}" stroke="${rope}" stroke-width="${r1(2.5 * s)}"/></g>`;
}

/** The sea of clouds far below: a soft floor of puffy clouds from height y to the bottom. */
function cloudSea(seed: number, y: number, color: string, shade: string): string {
  const rand = rng(seed);
  let back = '';
  let front = '';
  for (let i = 0; i < 11; i++) {
    back += cloud(i * 160 + rand() * 60, y + 30 + rand() * 30, 1.1 + rand() * 0.6, shade);
    front += cloud(i * 170 - 40 + rand() * 60, y + 120 + rand() * 40, 1.3 + rand() * 0.6, color);
  }
  return back + `<rect x="0" y="${y + 20}" width="1600" height="${900 - y}" fill="${shade}"/>` + front + `<rect x="0" y="${y + 110}" width="1600" height="${800 - y}" fill="${color}"/>`;
}

/** What a harpy drone can carry off in its claws (drawn hanging under them). */
type Loot = 'wing' | 'engine' | 'panel' | 'basket' | 'teapot' | 'cake' | 'none';

const LOOT: Record<Loot, string> = {
  wing: `<path d="M-60 0L70 -14L96 16L-40 34Z" fill="${SNOW}" ${ink(4)}/><path d="M-50 12L80 0" stroke="${SKIFF}" stroke-width="9"/><circle cx="86" cy="4" r="6" fill="#ff4a5a" ${ink(2)}/>
    <path d="M-56 18q-14 10 -6 24M-50 24q-6 16 6 22" fill="none" stroke="#ff6a3a" stroke-width="3" stroke-linecap="round"/>`,
  engine: `<rect x="-40" y="-2" width="70" height="44" rx="16" fill="#9aa6ba" ${ink(4)}/><path d="M30 4L54 -6V50L30 40Z" fill="#5a6274" ${ink(4)}/>
    <path d="M-30 6H20" stroke="#fff" stroke-width="4" opacity=".5" stroke-linecap="round"/><ellipse cx="54" cy="22" rx="6" ry="24" fill="${C.cyan}" opacity=".7"/><rect x="-24" y="14" width="30" height="10" rx="4" fill="${SKIFF}" ${ink(2)}/>`,
  panel: `<rect x="-34" y="0" width="68" height="48" rx="6" fill="${SKIFF}" ${ink(4)}/><path d="M-26 10H26" stroke="${SNOW}" stroke-width="6"/><circle cx="-24" cy="38" r="3" fill="${C.ink}"/><circle cx="24" cy="38" r="3" fill="${C.ink}"/>`,
  basket: `<path d="M-30 8Q-16 -26 4 2Q20 -30 34 6" fill="#f0c070" ${ink(4)}/><path d="M-44 6H44L34 50H-34Z" fill="#c8884a" ${ink(4)}/>
    <path d="M-40 20H40M-36 34H36M-20 6V50M0 6V50M20 6V50" stroke="#8a5a2a" stroke-width="3"/><path d="M-30 6Q0 -4 30 6" fill="none" ${ink(5)}/>`,
  teapot: `<path d="M-30 30Q-34 0 0 -2Q34 0 30 30Q28 46 0 46Q-28 46 -30 30Z" fill="#e8f0f8" ${ink(4)}/><path d="M28 16Q50 10 54 -6" fill="none" ${ink(9)}/><path d="M28 16Q50 10 54 -6" fill="none" stroke="#e8f0f8" stroke-width="4"/>
    <path d="M-28 10Q-46 14 -32 34" fill="none" ${ink(4)}/><path d="M-12 -2Q0 -14 12 -2" fill="${C.pink}" ${ink(3)}/><path d="M-24 22Q0 30 24 22" stroke="${C.pink}" stroke-width="5" fill="none"/>`,
  cake: `<path d="M-30 10H30V36Q0 44 -30 36Z" fill="#e8a050" ${ink(4)}/><ellipse cx="0" cy="10" rx="30" ry="9" fill="#ffd166" ${ink(4)}/><path d="M-20 12q2 12 6 4q4 14 8 2q4 10 10 0" fill="none" stroke="#ffb020" stroke-width="4" stroke-linecap="round"/>`,
  none: '',
};

/**
 * One of Aeëtes's harpy drones: a gold metal bird with a round glowing eye, a beak, flapping wings
 * and grabby claws (carrying `loot`). Faces right; centred on its body.
 */
function harpy(x: number, y: number, s: number, o: { eye?: string; up?: boolean; loot?: Loot; flip?: boolean; rot?: number } = {}): string {
  const eye = o.eye ?? C.cyan;
  const wing = (dx: number, dy: number, col: string) =>
    o.up === false
      ? `<path d="M${dx - 14} ${dy}Q${dx - 64} ${dy + 26} ${dx - 50} ${dy + 84}Q${dx - 30} ${dy + 66} ${dx - 16} ${dy + 52}Q${dx - 4} ${dy + 70} ${dx + 10} ${dy + 60}Q${dx + 24} ${dy + 30} ${dx + 18} ${dy}Z" fill="${col}" ${ink(5)}/>`
      : `<path d="M${dx - 18} ${dy - 6}Q${dx - 60} ${dy - 70} ${dx - 40} ${dy - 124}Q${dx - 20} ${dy - 98} ${dx - 6} ${dy - 82}Q${dx + 2} ${dy - 104} ${dx + 18} ${dy - 98}Q${dx + 26} ${dy - 50} ${dx + 18} ${dy - 8}Z" fill="${col}" ${ink(5)}/>
         <path d="M${dx - 30} ${dy - 50}L${dx - 10} ${dy - 30}M${dx - 4} ${dy - 66}L${dx + 6} ${dy - 34}" stroke="${GOLD_DARK}" stroke-width="4" stroke-linecap="round"/>`;
  const body = `${wing(-14, -16, '#e0a830')}
    <path d="M10 22L2 56M26 20L32 56" ${ink(8)}/><path d="M10 22L2 56M26 20L32 56" stroke="#4a4050" stroke-width="3"/>
    ${at(16, 62, 1, LOOT[o.loot ?? 'none'])}
    <path d="M-10 64Q2 46 14 64M20 64Q32 46 44 64" fill="none" ${ink(6)}/>
    <path d="M-44 -6L-112 -36L-98 -10L-116 8L-96 12L-108 34L-42 12Z" fill="${GOLD_DARK}" ${ink(4)}/>
    <path d="M-50 -2Q-34 -34 20 -30Q58 -26 60 0Q52 28 2 28Q-38 26 -50 -2Z" fill="${GOLD}" ${ink(5)}/>
    <path d="M-34 -14Q0 -28 34 -20" fill="none" stroke="#fff" stroke-width="5" opacity=".55" stroke-linecap="round"/><path d="M-6 -26Q-12 2 -4 26" fill="none" stroke="${GOLD_DARK}" stroke-width="3"/>
    <g fill="${GOLD_DARK}"><circle cx="-28" cy="2" r="3.5"/><circle cx="-18" cy="16" r="3.5"/><circle cx="14" cy="14" r="3.5"/><circle cx="30" cy="4" r="3.5"/></g>
    <path d="M40 -46L34 -70L50 -52L56 -78L64 -50Z" fill="${GOLD_DARK}" ${ink(3)}/>
    <circle cx="54" cy="-26" r="26" fill="${GOLD}" ${ink(5)}/>
    <path d="M76 -34L106 -22L76 -12Z" fill="#3a3040" ${ink(4)}/>
    <circle cx="58" cy="-28" r="18" fill="${eye}" opacity=".3"/><circle cx="58" cy="-28" r="12" fill="#1a1630" ${ink(3)}/><circle cx="59" cy="-27" r="7" fill="${eye}"/><circle cx="55" cy="-32" r="3" fill="#fff"/>
    ${wing(10, -10, GOLD)}`;
  return at(x, y, s, body, o.flip, o.rot ?? 0);
}


/** The big floating isle in the front of the picture: grass to stand on, rock and roots below, a waterfall off its left end. */
function mainIsle(t: Tone): string {
  const rock = `<path d="M24 770L56 838L130 886L210 930H1390L1470 886L1544 838L1580 770Z" fill="${t.rock}" ${ink(6)}/><path d="M1000 900L1470 870L1560 790L1300 860Z" fill="${t.shade}" opacity=".5"/>`;
  const roots = `<path d="M80 830q-14 30 0 60t-6 40M140 870q12 20 2 50M1490 860q14 26 0 50M1536 820q-10 30 4 70" fill="none" stroke="${t.root}" stroke-width="5" stroke-linecap="round"/>`;
  const fall = `<path d="M60 790Q72 800 66 930H104Q100 800 92 790Z" fill="#e4f8ff" opacity=".85"/><path d="M78 800V920" stroke="#fff" stroke-width="4" opacity=".8"/>`;
  const top = `M24 770Q40 704 300 694Q800 672 1300 694Q1560 704 1580 770`;
  return (
    rock +
    roots +
    `<path d="${top}Q1500 876 800 884Q100 876 24 770Z" fill="${t.edge}" ${ink(6)}/>` +
    `<path d="${top}Q1500 856 800 864Q100 856 24 770Z" fill="${t.grass}"/>` +
    fall
  );
}


const ROBE = '#34407a';
const BEARD_WHITE = '#f4f4f8';

/** Phineus's face: round dark glasses, bushy white brows, a white moustache and a long white beard (head coordinates). */
const PHINEUS_FACE = `<path d="M-40 6Q-46 60 -22 104Q-4 136 8 160Q14 128 32 104Q52 60 46 6Q38 30 24 38Q6 48 -12 38Q-30 30 -40 6Z" fill="${BEARD_WHITE}" ${ink(4)}/>
  <path d="M-20 62Q-14 92 -4 112M8 56Q10 92 12 130M28 62Q26 86 22 102" fill="none" stroke="#c8c8d8" stroke-width="3" stroke-linecap="round"/>
  <path d="M-18 14Q-4 2 6 10Q16 2 30 14Q38 22 26 22Q16 16 6 18Q-4 16 -12 22Q-28 22 -18 14Z" fill="#fff" ${ink(3)}/>
  <g fill="#2a2440" ${ink(3)}><circle cx="-8.6" cy="-4" r="13"/><circle cx="19.5" cy="-4" r="13"/></g><path d="M4 -6H6M-22 -6L-40 -4" fill="none" ${ink(3)}/>
  <path d="M-15 -10q4 -4 9 -2M13 -10q4 -4 9 -2" stroke="#fff" stroke-width="3" fill="none" opacity=".7" stroke-linecap="round"/>
  <path d="M-24 -22Q-10 -32 2 -21M10 -21Q22 -32 36 -22" fill="none" ${ink(11)}/><path d="M-24 -22Q-10 -32 2 -21M10 -21Q22 -32 36 -22" fill="none" stroke="${BEARD_WHITE}" stroke-width="6" stroke-linecap="round"/>
  <path d="M-10 -44q4 -14 -4 -22M4 -46q6 -12 2 -24" fill="none" stroke="${BEARD_WHITE}" stroke-width="3" stroke-linecap="round"/>`;

/** His patched star robe (body coordinates, already shifted down for sitting), its skirt draped over his folded legs. */
const PHINEUS_ROBE = `<path d="M-48 -100Q-84 -72 -104 -42Q0 -28 104 -42Q84 -72 48 -100Z" fill="${ROBE}" ${ink(5)}/><path d="M-96 -48Q0 -34 96 -48" fill="none" stroke="${C.gold}" stroke-width="4"/>
  <rect x="-30" y="-150" width="26" height="24" fill="#8a5a8a" ${ink(3)} transform="rotate(-8 -17 -138)"/><path d="M-28 -146h22M-26 -130h22" stroke="#f0d0f0" stroke-width="2" stroke-dasharray="4 3"/>
  <rect x="40" y="-86" width="28" height="22" fill="#4a8a6a" ${ink(3)} transform="rotate(10 54 -75)"/><path d="M42 -82h22" stroke="#d0f0e0" stroke-width="2" stroke-dasharray="4 3"/>
  ${[[-28, -110], [20, -150], [-60, -60], [10, -64], [70, -56], [30, -112], [-80, -48]].map(([sx, sy]) => sparkle(sx, sy, 7, C.gold)).join('')}`;

/** Phineus, the blind old star-gazer, sitting with his robe draped round him, laughing and shaking his stick up at the drones. Feet at (x, y). */
function phineus(x: number, y: number, s: number): string {
  const fig = person(0, 0, 1, {
    skin: '#e6b496',
    hair: '#e8e8ee',
    hairStyle: 'bald',
    coat: ROBE,
    long: true,
    pants: ROBE,
    shoes: '#6a4a30',
    legs: 'kneel',
    arms: [
      [
        [-76, -128],
        [-92, -92],
      ],
      [
        [82, -188],
        [100, -236],
      ],
    ],
    face: 'happy',
    headExtra: PHINEUS_FACE,
    bodyExtra: PHINEUS_ROBE,
  });
  // The walking stick through his raised hand (hand at 100, -192 once he's sitting), with shake lines.
  const stick = `<path d="M72 -96L130 -300" ${ink(14)}/><path d="M72 -96L130 -300" stroke="#a0703a" stroke-width="7" stroke-linecap="round"/><circle cx="131" cy="-304" r="12" fill="#c8904a" ${ink(4)}/>
    <circle cx="100" cy="-192" r="12" fill="#e6b496" ${ink(4)}/>
    <path d="M148 -326q14 -6 22 4M156 -296q14 2 18 14M104 -330q-4 -14 6 -22" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".8"/>`;
  return at(x, y, s, fig + stick);
}

/** His little round stone observatory: a domed hut with a star-slit, a glowing doorway and a window. Base centre at (x, y). */
function observatory(x: number, y: number, s: number): string {
  let stones = '';
  for (let r = 0; r < 5; r++) {
    const sy = -34 - r * 36;
    stones += `M-130 ${sy}Q0 ${sy + 14} 130 ${sy}`;
    for (let j = 0; j < 4; j++) {
      const sx = -100 + j * 64 + (r % 2) * 32;
      stones += `M${sx} ${sy + 5}v30`;
    }
  }
  const body = `<path d="M-130 0V-192Q0 -212 130 -192V0Q0 14 -130 0Z" fill="#b8a898" ${ink(6)}/>
    <path d="${stones}" fill="none" stroke="#8a7a70" stroke-width="3"/>
    <path d="M74 -198Q130 -192 130 -192V0Q104 8 74 10Z" fill="#000" opacity=".16"/>
    <path d="M-144 -188Q-142 -332 0 -336Q142 -332 144 -188Q0 -212 -144 -188Z" fill="#4f8a96" ${ink(6)}/>
    <path d="M-72 -200Q-80 -300 0 -336M72 -200Q80 -300 0 -336" fill="none" stroke="#2f6070" stroke-width="4"/>
    <path d="M-100 -230Q-90 -300 -30 -320" fill="none" stroke="#fff" stroke-width="6" opacity=".3" stroke-linecap="round"/>
    <path d="M-16 -198V-324Q0 -334 16 -324V-198Z" fill="#1a1838" ${ink(4)}/><path d="M-4 -300h0M6 -260h0M-6 -230h0" stroke="#fff" stroke-width="4" stroke-linecap="round"/>
    <path d="M0 -336V-372" ${ink(6)}/>${sparkle(0, -382, 16, C.gold)}
    <path d="M-42 0V-100Q-42 -138 0 -138Q42 -138 42 -100V0Z" fill="#ffd98a" ${ink(5)}/>
    <path d="M-42 0V-100Q-42 -138 -8 -138L-22 -126V10Z" fill="#8a5a34" ${ink(4)}/>
    <circle cx="84" cy="-128" r="20" fill="#ffd98a" ${ink(4)}/><path d="M84 -148V-108M64 -128H104" stroke="${C.ink}" stroke-width="3"/>`;
  return at(x, y, s, body);
}

/** A big brass telescope on a wooden tripod, tilted up at the sky toward the right. Feet at (x, y). */
function telescope(x: number, y: number, s: number): string {
  const tube = `<rect x="-110" y="-24" width="230" height="48" rx="10" fill="#d8a040" ${ink(5)}/><rect x="110" y="-34" width="56" height="68" rx="10" fill="#e8b850" ${ink(5)}/>
    <rect x="-150" y="-12" width="44" height="24" rx="6" fill="#b88030" ${ink(4)}/><path d="M-60 -24V24M40 -24V24" stroke="#a87020" stroke-width="6"/>
    <path d="M-96 -12H100" stroke="#fff6c0" stroke-width="6" opacity=".6" stroke-linecap="round"/><ellipse cx="166" cy="0" rx="8" ry="30" fill="#bfeaff" ${ink(3)}/>`;
  const body = `<path d="M0 -150L-70 0M0 -150L70 0M0 -150L10 0" ${ink(14)}/><path d="M0 -150L-70 0M0 -150L70 0M0 -150L10 0" stroke="#8a5a34" stroke-width="7"/>
    <circle cx="0" cy="-150" r="14" fill="#b88030" ${ink(4)}/>${at(0, -160, 1, tube, false, -48)}`;
  return at(x, y, s, body);
}

const DUSK: Tone = { grass: '#5a9a5a', edge: '#3a7a4a', rock: '#8a6a6a', shade: '#5a4a5a', root: '#4a3a40', tree: '#3a7a4a' };
const DUSK_HAZE: Tone = { grass: '#9a8ab8', edge: '#8a7aa8', rock: '#b08aa8', shade: '#8a6a90', root: '#9a7a9a', tree: '#7a7aa8' };

/** Crumbs and bits of dinner tumbling through the air in a box: crumbs, grapes, an apple and a bread roll. */
function crumbs(seed: number, n: number, x0: number, y0: number, w: number, h: number): string {
  const rand = rng(seed);
  let dots = '';
  for (let i = 0; i < n; i++) dots += `<circle cx="${Math.round(x0 + rand() * w)}" cy="${Math.round(y0 + rand() * h)}" r="${(3 + rand() * 4).toFixed(1)}"/>`;
  return `<g fill="#e8b870" ${ink(2)}>${dots}</g>`;
}

const APPLE = `<circle r="18" fill="#ff5a4a" ${ink(4)}/><path d="M0 -16q2 -10 -2 -14" fill="none" ${ink(3)}/><path d="M2 -24q12 -8 16 2q-10 4 -16 -2Z" fill="#5f9a3a" ${ink(2)}/><circle cx="-6" cy="-6" r="4" fill="#fff" opacity=".6"/>`;
const GRAPES = `<g fill="#9a5ac8" ${ink(3)}><circle cx="-10" cy="0" r="9"/><circle cx="8" cy="0" r="9"/><circle cx="0" cy="14" r="9"/><circle cx="-18" cy="-14" r="9"/><circle cx="2" cy="-16" r="9"/></g><path d="M-6 -24l-6 -12" ${ink(4)}/>`;
const ROLL = `<ellipse rx="26" ry="16" fill="#e0a058" ${ink(4)}/><path d="M-10 -12q4 10 0 22M6 -14q4 12 0 26" fill="none" stroke="#a86a30" stroke-width="3"/>`;

/** 24. Dusk on Phineus's isle: harpy drones snatch the old star-gazer's dinner; he laughs and shakes his stick; Jason and Atalanta run to help. */
export function ch3Phineus(): string {
  const id = 'ch3-phineus';
  const checks = [0, 1, 2, 3, 4, 5].map((i) => `M${640 + i * 66} ${828 - i * 3}L${600 + i * 80} ${888 - i * 2}`).join('') + 'M590 850L990 836M574 870L1006 856';
  return panel(
    backdrop(id + 'b', [[0, '#22265a'], [0.4, '#54488a'], [0.68, '#d87e9a'], [0.86, '#ffaa86'], [1, '#ffd0a0']]) +
      `<defs>${glowDef(id + 'w', '#ffc860', 0.8)}</defs>` +
      stars(12, 70, 0, 0, 1600, 380, '#fff6e0') +
      gasGiant(id + 'j', 200, 140, 64) +
      cloudSea(6, 620, '#f6c0b4', '#d898ac') +
      isle(900, 470, 180, DUSK_HAZE, { seed: 11, trees: 2, fall: 0.25, inked: false }) +
      isle(1390, 330, 150, DUSK_HAZE, { seed: 13, trees: 1, inked: false }) +
      bridge(986, 462, 1322, 324, 34, 0.55, '#8a6a8a', '#b898b0') +
      isle(560, 330, 110, DUSK_HAZE, { seed: 15, trees: 1, inked: false }) +
      mainIsle(DUSK) +
      glow(id + 'w', 300, 720, 260, 0.9) +
      observatory(300, 790, 0.95) +
      telescope(500, 800, 0.85) +
      // The picnic blanket, with what's left of dinner.
      `<path d="M600 830L960 812L1020 872L560 892Z" fill="#e05a5a" ${ink(4)}/><path d="${checks}" stroke="#fff" stroke-width="8" opacity=".45"/>` +
      `<ellipse cx="880" cy="846" rx="40" ry="12" fill="#f4f0e8" ${ink(4)}/>` +
      at(950, 846, 1, `<path d="M-14 -10L14 -14L16 10L-12 12Z" fill="#e8f0f8" ${ink(3)}/><ellipse cx="-14" cy="1" rx="4" ry="11" fill="#c87a30"/>`, false, -80) +
      phineus(690, 850, 1.05) +
      // The harpy drones make off with the basket, the teapot and a honey cake; crumbs everywhere.
      crumbs(5, 26, 760, 330, 320, 380) +
      harpy(910, 270, 0.7, { flip: true, loot: 'basket', rot: -14 }) +
      harpy(1080, 160, 0.58, { loot: 'teapot', up: false, eye: '#ff4a5a', rot: -18 }) +
      `<g fill="#c87a30" ${ink(2)}><circle cx="1150" cy="236" r="6"/><circle cx="1166" cy="256" r="4"/><circle cx="1138" cy="262" r="5"/></g>` +
      harpy(960, 620, 0.6, { loot: 'cake', up: true, rot: 12 }) +
      at(740, 470, 1, APPLE, false, 20) +
      at(1030, 420, 1, GRAPES, false, -20) +
      at(780, 400, 1, ROLL, false, 30) +
      // Jason and Atalanta (with LUX and IRIS) come running to help.
      cloud(1270, 880, 0.35, '#f0d0c0', 0.8) +
      cloud(1470, 884, 0.35, '#f0d0c0', 0.8) +
      jason(1130, 870, 0.95, { pose: 'reach', legs: 'run', face: 'determined', flip: true }) +
      at(1370, 870, 1, atalanta(0, 0, 0.95, { pose: 'point', face: 'determined', flip: true }), false, -6) +
      lux(1040, 520, 0.7, 'normal', C.cyan, true) +
      iris(1300, 430, 0.65, 'normal', true) +
      sparkle(160, 520, 6, '#fff2a0') +
      sparkle(470, 560, 5, '#fff2a0') +
      sparkle(420, 470, 4, '#fff2a0') +
      vignette(id + 'v', 0.35, '#1a1030'),
  );
}

/* ---------------- 23. Atalanta, in the graphic-novel style ---------------- */

/** What a harpy drone carries off in its talons. */
type Haul = 'wing' | 'engine' | 'none';

/**
 * One of Aeëtes's harpy drones in the graphic-novel style: a gold metal raptor with blade feathers, a
 * hooked beak and one glowing eye, flying right with a stolen part in its talons. Centred on its body.
 */
function harpyGN(pen: gn.Pen, x: number, y: number, s: number, o: { haul?: Haul; rot?: number; eye?: string } = {}): string {
  const lp = pen.local(false, o.rot ?? 0);
  const eye = o.eye ?? '#7fe6ff';
  const wing = (dx: number, dy: number, color: string, far: boolean) =>
    lp.form(`M${dx} ${dy}L${dx - 40} ${dy - 70}L${dx - 150} ${dy - 150}L${dx - 128} ${dy - 118}L${dx - 170} ${dy - 110}L${dx - 130} ${dy - 86}L${dx - 168} ${dy - 70}L${dx - 120} ${dy - 52}L${dx - 150} ${dy - 30}L${dx - 80} ${dy - 18}L${dx - 60} ${dy + 6}Z`, color, {
      sh: 22,
      hatch: far ? 2 : 1,
      line: 2.6,
      rim: far ? 0 : 1.8,
      inner: lp.brushes(
        [
          [
            [
              [dx - 40, dy - 10],
              [dx - 120, dy - 96],
            ],
            2.4,
          ],
          [
            [
              [dx - 30, dy - 40],
              [dx - 140, dy - 66],
            ],
            2.4,
          ],
        ],
        gn.INK,
        [0.2, 0.4],
        0.7,
      ),
    });
  let out = wing(-6, -16, '#b8861e', true);
  // Tail feathers.
  out += lp.form('M-86 0L-170 -18L-150 4L-176 24L-140 22L-160 46L-84 16Z', '#c8901e', { sh: 14, hatch: 1, line: 2.4 });
  // Talons and the loot.
  out += lp.brushes(
    [
      [
        [
          [6, 26],
          [2, 60],
        ],
        8,
      ],
      [
        [
          [26, 24],
          [32, 60],
        ],
        8,
      ],
    ],
    gn.INK,
    [0.05, 0.05],
  );
  if (o.haul === 'wing') {
    out += lp.form('M-40 62L120 44L150 80L-10 104Z', '#eef3f6', { sh: 16, hatch: 1, line: 2.6, rim: 1.6, inner: `<path d="M-30 80L136 60" stroke="#2fb7a3" stroke-width="12"/><circle cx="140" cy="62" r="7" fill="#ff4a5a"/>` });
    out += lp.brushes(
      [
        [
          [
            [-38, 74],
            [-60, 88],
            [-58, 112],
          ],
          4,
        ],
        [
          [
            [-30, 90],
            [-44, 116],
          ],
          4,
        ],
      ],
      '#ff5e6a',
      [0.1, 0.3],
    );
  } else if (o.haul === 'engine') {
    out += lp.form('M-36 58H48Q70 58 72 82Q70 106 48 106H-36Z', '#9aa6ba', { sh: 18, hatch: 2, line: 2.6, rim: 1.6, inner: `<rect x="-24" y="72" width="40" height="14" fill="#2fb7a3"/><path d="M-30 64H40" stroke="#fff" stroke-width="3" opacity=".6"/>` });
    out += lp.glow(76, 82, 24, '#7fe6ff', 0.8);
  }
  out += lp.brush([[-6, 62], [4, 52], [16, 62]], 4, gn.INK, [0.1, 0.1]) + lp.brush([[22, 62], [32, 52], [42, 62]], 4, gn.INK, [0.1, 0.1]);
  // The body and the head.
  out += lp.form('M-96 4Q-66 -24 16 -26Q74 -22 90 -4Q76 20 12 24Q-64 26 -96 4Z', '#e8b440', {
    sh: 22,
    hatch: 2,
    line: 2.8,
    rim: 2,
    inner: `<path d="M-40 -22Q-46 2 -38 24M0 -26Q-6 0 2 24" fill="none" stroke="${gn.INK}" stroke-width="2.4" opacity=".55"/>`,
  });
  out += lp.form('M74 -36L58 -62L84 -44L88 -70L102 -38Z', '#a8741c', { sh: 6, line: 2.2 });
  out += lp.form('M68 -20a24 20 0 1 0 48 0a24 20 0 1 0 -48 0Z', '#e8b440', { sh: 12, hatch: 1, line: 2.6, rim: 1.8 });
  out += lp.form('M110 -28Q142 -24 142 -4Q126 -10 112 -8Z', '#2a2230', { line: 2.2 });
  out += lp.glow(98, -22, 26, eye, 0.8) + `<circle cx="98" cy="-22" r="9" fill="#1a1630" stroke="${gn.INK}" stroke-width="2"/><circle cx="99" cy="-21" r="5.5" fill="${eye}"/><circle cx="96" cy="-25" r="2" fill="#fff"/>`;
  out += wing(14, -8, '#f0c050', false);
  return gn.at(x, y, s, out, false, o.rot ?? 0);
}

/**
 * Atalanta's scout skiff (teal and white with gold trim) lying wrecked on the grass, nose to the right:
 * its near wing torn off at a jagged stump, the engine bay ripped open, wires sparking. Base at (x, y).
 */
function skiffGN(pen: gn.Pen, x: number, y: number, s: number): string {
  const teal = '#2fb7a3';
  let out = '';
  // The far wing, still there, angled up behind the hull.
  out += pen.form('M-40 -96L-150 -230L-110 -236L60 -110Z', '#eef3f6', { sh: 24, hatch: 2, line: 2.8, inner: `<path d="M-30 -100L-128 -222" stroke="${teal}" stroke-width="12"/><circle cx="-128" cy="-226" r="7" fill="#ff4a5a"/>` });
  // Bent landing struts.
  out += pen.brushes(
    [
      [
        [
          [-150, -20],
          [-176, 6],
        ],
        12,
      ],
      [
        [
          [140, -24],
          [170, 6],
        ],
        12,
      ],
    ],
    gn.INK,
    [0.05, 0.05],
  );
  // The hull.
  const hull = 'M-280 -30Q-286 -84 -200 -100L110 -120Q250 -112 318 -50Q330 -10 270 -2L-250 4Q-280 0 -280 -30Z';
  const deck = `<path d="M-270 -60Q0 -96 300 -70L320 -40Q0 -70 -276 -36Z" fill="#eef3f6"/><path d="M-276 -40Q0 -74 316 -46" fill="none" stroke="#ffc94a" stroke-width="6"/>`;
  const bay = `<path d="M-250 -70L-150 -84L-140 -24L-244 -16Z" fill="#141826"/><path d="M-240 -66L-160 -76M-236 -40L-150 -46" stroke="#3a4258" stroke-width="5"/>`;
  out += pen.form(hull, teal, { sh: 40, hatch: 2, line: 3, rim: 2.2, axis: [1, 0], inner: deck + bay + `<path d="M-60 -30H40V-10H-60Z" fill="#141826"/>` });
  // The torn-off near wing: a jagged stump with sparking wires.
  out += pen.form('M-30 -96L60 -104L76 -76L58 -66L70 -44L44 -52L34 -30L14 -54L-2 -40L-14 -70Z', '#eef3f6', { sh: 14, hatch: 1, line: 2.8, rim: 1.6 });
  const wires: [gn.P[], number][] = [
    [
      [
        [20, -46],
        [6, -16],
        [-20, -4],
      ],
      4,
    ],
    [
      [
        [40, -50],
        [54, -20],
        [44, 6],
      ],
      4,
    ],
    [
      [
        [-180, -50],
        [-210, -10],
        [-240, 0],
      ],
      4,
    ],
  ];
  out += pen.brushes([wires[0]], '#ff5e6a', [0.05, 0.3]) + pen.brushes([wires[1]], '#ffd166', [0.05, 0.3]) + pen.brushes([wires[2]], '#5ec8ff', [0.05, 0.3]);
  out += gn.spark(pen, -20, -4, 18, '#fff6b0') + gn.spark(pen, 44, 8, 12, '#ffe066') + gn.spark(pen, -240, 0, 14, '#bff4ff');
  // The cockpit canopy, cracked.
  out += pen.form('M70 -118Q120 -176 214 -124Z', '#9fe8ff', { sh: 12, line: 2.8, inner: `<path d="M120 -150L140 -132L132 -118M140 -132L160 -138" fill="none" stroke="${gn.INK}" stroke-width="2"/>` + pen.brush([[96, -128], [124, -156], [160, -158]], 6, '#ffffff', [0.3, 0.3], 0.8) });
  // A wisp of smoke from the engine bay.
  out += [
    [-200, -130, 30],
    [-180, -190, 40],
    [-210, -260, 52],
  ]
    .map(([cx, cy, r], i) => pen.glow(cx, cy, r * 1.5, '#d8d0d8', 0.75 - i * 0.18))
    .join('');
  return gn.at(x, y, s, out);
}

/** A floating sky-isle far off in the haze: a grassy cap over a hanging cone of rock, maybe a thread of waterfall. */
function farIsle(pen: gn.Pen, x: number, y: number, w: number, haze: string, fall = false, seed = 1): string {
  const h = w * 0.8;
  const k = w / 200;
  const rock = gn.crag(
    pen,
    [
      [x - w / 2, y],
      [x - w * 0.36, y + h * 0.36],
      [x - w * 0.16, y + h * 0.62],
      [x - w * 0.04, y + h],
      [x + w * 0.1, y + h * 0.66],
      [x + w * 0.3, y + h * 0.42],
      [x + w / 2, y],
    ],
    '#d0bcb4',
    { seed, sh: w * 0.3, cracks: 3, hatch: 1, line: 1.4 * k + 0.4, rim: 0 },
  );
  const cap = pen.form(
    `M${gn.r1(x - w * 0.56)} ${gn.r1(y + 4)}Q${gn.r1(x - w * 0.3)} ${gn.r1(y - w * 0.12)} ${gn.r1(x)} ${gn.r1(y - w * 0.13)}Q${gn.r1(x + w * 0.3)} ${gn.r1(y - w * 0.12)} ${gn.r1(x + w * 0.56)} ${gn.r1(y + 4)}Q${gn.r1(x)} ${gn.r1(y + w * 0.08)} ${gn.r1(x - w * 0.56)} ${gn.r1(y + 4)}Z`,
    '#8ac06a',
    { sh: w * 0.05, line: 1.4 * k + 0.4 },
  );
  let trees = '';
  for (const t of [-0.28, 0.02, 0.26]) {
    const tx = x + t * w;
    const ty = y - w * 0.1 * (1 - t * t * 4);
    trees += pen.form(`M${gn.r1(tx - 12 * k)} ${gn.r1(ty)}L${gn.r1(tx)} ${gn.r1(ty - 46 * k)}L${gn.r1(tx + 12 * k)} ${gn.r1(ty)}Z`, '#6aa05a', { sh: 8 * k, line: 1.4 * k + 0.4 });
  }
  const water = fall ? `<path d="M${gn.r1(x + w * 0.2)} ${gn.r1(y + 4)}V${gn.r1(y + h * 1.5)}" stroke="#f4fbff" stroke-width="${gn.r1(w * 0.035)}" opacity=".8"/>` : '';
  return rock + cap + trees + water + pen.glow(x, y + h * 0.25, w * 0.8, haze, 0.7, h * 0.9);
}

/** 23. On a floating isle at golden hour, Jason and LUX meet Atalanta by her wrecked skiff while harpy drones flap off with its wing and engine; IRIS zooms in, delighted. */
export function ch3Atalanta(): string {
  const pen = gn.Pen.scene('ch3-atalanta', { key: [-0.75, -0.55], keyColor: '#ffe0a8', rim: [0.9, -0.3], rimColor: '#c8f4ff', shadow: '#7a6ab0', depth: 0.5 });
  const sunX = 220;
  const sunY = 190;
  const sky =
    gn.sky(pen, [
      [0, '#2a5aa0'],
      [0.35, '#6aa8dc'],
      [0.62, '#ffd8a0'],
      [0.75, '#ffe8c0'],
    ]) +
    gn.halftone(pen, 'M-80 -60H1680V260H-80Z', '#ffffff', 10, 0.1) +
    gn.gasGiant(pen, 930, 120, 84, { lightDir: [-0.9, 0.2], haze: 0.5, sky: '#8ab8e0' }) +
    gn.godRays(pen, sunX, sunY, [20, 45, 70, 95, 120, 150, 175], 7, 1300, '#fff2c8', 0.28) +
    gn.bloom(pen, sunX, sunY, 120, '#fff6d8', 1) +
    gn.cloud(pen, 600, 210, 300, '#ffffff', '#c8b8d8', { seed: 2 }) +
    gn.cloud(pen, 1380, 170, 260, '#ffffff', '#c8b8d8', { seed: 3 });

  const back = pen.relight({ key: [-0.8, -0.6], rimColor: '#fff2d0', rim: [-0.6, -0.8] });
  const far =
    farIsle(pen, 560, 430, 200, '#f4e6ea', true, 2) +
    farIsle(pen, 880, 350, 130, '#f4eaf4', false, 3) +
    farIsle(pen, 1460, 440, 240, '#f4e6ea', true, 4) +
    `<path d="M640 410Q760 450 812 336" fill="none" stroke="#8a8098" stroke-width="3"/>` +
    [
      [100, 640, 420, 1],
      [520, 660, 460, 2],
      [980, 640, 420, 3],
      [1420, 660, 460, 4],
    ]
      .map(([cx, cy, cw, seed]) => gn.cloud(back, cx, cy, cw, '#fff6ea', '#d8c0d8', { seed, flat: true }))
      .join('') +
    `<rect x="-80" y="640" width="1760" height="320" fill="#f2e0e0"/>` +
    [
      [-40, 720, 520, 5],
      [460, 740, 560, 6],
      [1000, 720, 520, 7],
      [1500, 740, 560, 8],
    ]
      .map(([cx, cy, cw, seed]) => gn.cloud(back, cx, cy, cw, '#fffaf0', '#e0c8d8', { seed, flat: true }))
      .join('') +
    gn.haze(pen, 520, 700, '#fff0d8', 0.6);
  // The harpies flapping away with the skiff's wing and engine, streaks behind them.
  const harpies =
    gn.streaks(pen, 1120, 220, -100, 220, 4, 70, '#ffffff', 0.7, 3) +
    harpyGN(pen, 1200, 210, 0.85, { haul: 'wing', rot: -12 }) +
    gn.streaks(pen, 1380, 330, -100, 180, 4, 60, '#ffffff', 0.6, 4) +
    harpyGN(pen, 1440, 320, 0.7, { haul: 'engine', rot: -18, eye: '#ff6a5a' });
  // The isle they stand on: a grassy top, its rocky edge dropping away into the clouds on the left.
  const ground =
    pen.form('M-80 800Q200 770 600 778Q1100 772 1680 790V960H-80Z', '#6ab04a', {
      sh: 30,
      line: 3,
      rim: 0,
      paint: pen.lin([
        [0, '#9ad06a'],
        [1, '#3a7a3a'],
      ]),
      inner: pen.brushes(
        [
          [
            [
              [120, 820],
              [130, 790],
            ],
            5,
          ],
          [
            [
              [520, 812],
              [530, 784],
            ],
            5,
          ],
          [
            [
              [760, 830],
              [744, 800],
            ],
            5,
          ],
          [
            [
              [1460, 830],
              [1474, 800],
            ],
            5,
          ],
          [
            [
              [1560, 840],
              [1550, 806],
            ],
            5,
          ],
        ],
        '#2a5a2a',
        [0.05, 0.9],
      ),
    }) +
    gn.grass(pen, -40, 1640, 794, 30, 30, '#3a7a3a', '#b8e088', 7) +
    gn.wash(pen, 820, '#1a2a30', 0.6);
  const props =
    gn.castShadow(pen, 1230, 806, 330, 24, 0.4) +
    skiffGN(pen, 1230, 800, 0.95) +
    // A dropped wrench and loose bolts.
    pen.brush(
      [
        [640, 850],
        [700, 838],
      ],
      12,
      gn.INK,
      [0.05, 0.05],
    ) +
    pen.brush(
      [
        [640, 850],
        [700, 838],
      ],
      6,
      '#9aa6ba',
      [0.05, 0.05],
    ) +
    `<g fill="#9aa6ba" stroke="${gn.INK}" stroke-width="2"><circle cx="604" cy="862" r="6"/><circle cx="730" cy="866" r="5"/></g>`;
  // IRIS zooming in on a rainbow streak.
  const trail = gn.RAINBOW.map((c, i) => pen.brush([[420, 160 + i * 8], [580, 262 + i * 7], [748, 388 + i * 5]], 9, c, [0.9, 0.05], 0.8)).join('');
  const heroes =
    gn.castShadow(pen, 1000, 880, 140, 14, 0.45) +
    gn.atalanta(pen, 1000, 884, 1.1, { pose: 'hips', mood: 'grin', flip: true, look: [2, 1] }) +
    trail +
    gn.iris(pen, 776, 408, 0.85, 'happy', { flip: true, rot: 14 }) +
    gn.castShadow(pen, 330, 900, 150, 14, 0.5) +
    gn.jason(pen, 330, 904, 1.12, { pose: 'wave', mood: 'smile', look: [2, 0] }) +
    gn.lux(pen, 150, 470, 0.95, 'normal', { look: [8, -6] });
  const fore = gn.grass(pen, -70, 230, 930, 4, 150, '#10281a', '#4a8a4a', 9) + gn.grass(pen, 1420, 1680, 930, 4, 150, '#10281a', '#4a8a4a', 10);
  return pen.svg(gn.layer(0.15, sky) + gn.layer(0.35, far) + gn.layer(0.6, harpies) + gn.layer(0.85, ground + props) + gn.layer(1, heroes) + gn.layer(1.25, fore) + gn.vignette(pen, 0.45, '#1a1030') + gn.grain(pen, 0.08));
}

