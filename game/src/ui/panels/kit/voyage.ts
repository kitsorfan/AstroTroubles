/**
 * Chapter 3's things to draw: the Argo, the gas giant with its ring of moons, Aeëtes's golden salvage
 * ships and drones, the Gardeners' light-word ruins and the Golden Fleece.
 */
import { at, C, glow, glowDef, ink, lin, limb, rad, rng } from './base';

const GOLD = '#ffc94a';
const GOLD_DARK = '#c8901e';

/**
 * The Argo, side view facing right: a white galley with a gold belly, a ram's head on the prow, five
 * oar-like solar fins, one big sail-shaped solar panel, a curling stern post and glowing engines.
 * About 700 wide and 520 tall at scale 1, centred on its hull.
 */
export function argoShip(id: string, x: number, y: number, s: number, rot = 0, engines = true): string {
  const defs = `<defs>${lin(id + 'h', [[0, '#ffffff'], [0.6, '#e6eaf4'], [1, '#b8c0d4']])}${lin(id + 's', [[0, '#7ac8ff'], [1, '#2a5ac8']])}${glowDef(id + 'e', '#8fd8ff')}</defs>`;
  // Oars: shafts down and forward from the hull, each ending in a blue solar blade.
  let oars = '';
  for (let i = 0; i < 5; i++) {
    const ox = -170 + i * 80;
    oars += limb([[ox, 20], [ox + 70, 150]], GOLD_DARK, 10, 4);
    oars += at(ox + 84, 176, 1, `<rect x="-22" y="-44" width="44" height="88" rx="8" fill="url(#${id}s)" ${ink(4)}/><path d="M-22 -14H22M-22 16H22M0 -44V44" stroke="#bfe6ff" stroke-width="3" opacity=".7"/>`, false, -28);
  }
  // The sail: a billowing solar panel in a gold frame, with a sun-and-horns emblem.
  let cells = '';
  for (let i = 1; i < 6; i++) cells += `M${-150 + i * 50} -392Q${-150 + i * 50 + 18} -260 ${-150 + i * 50} -128`;
  for (let j = 1; j < 4; j++) cells += `M-160 ${-392 + j * 66}Q0 ${-392 + j * 66 + 14} 160 ${-392 + j * 66}`;
  const sail = `<path d="M-150 -396Q-110 -260 -150 -124H160Q200 -260 160 -396Z" fill="url(#${id}s)" ${ink(6)}/>
    <path d="${cells}" fill="none" stroke="#bfe6ff" stroke-width="3" opacity=".75"/>
    <circle cx="6" cy="-262" r="34" fill="${GOLD}" ${ink(4)}/><path d="M-10 -280q-26 -10 -20 14M22 -280q26 -10 20 14" fill="none" stroke="${GOLD_DARK}" stroke-width="8" stroke-linecap="round"/>
    <path d="M-150 -396Q-110 -260 -150 -124H160Q200 -260 160 -396Z" fill="none" stroke="${GOLD}" stroke-width="9"/>`;
  const body = `${engines ? glow(id + 'e', -340, 10, 110, 1, 60) : ''}
    ${limb([[-275, -30], [-318, -110], [-322, -170], [-288, -196], [-262, -176]], GOLD, 22, 6, true)}
    <rect x="-8" y="-430" width="16" height="400" rx="6" fill="${GOLD_DARK}" ${ink(4)}/>
    <rect x="-176" y="-410" width="352" height="16" rx="8" fill="${GOLD}" ${ink(4)}/><rect x="-176" y="-130" width="352" height="16" rx="8" fill="${GOLD}" ${ink(4)}/>
    ${sail}
    <path d="M-300 -34H290Q312 20 238 62H-214Q-290 40 -300 -34Z" fill="url(#${id}h)" ${ink(6)}/>
    <path d="M-286 16Q-250 46 -214 62H238Q280 44 300 10Z" fill="${GOLD}" ${ink(5)}/>
    <path d="M-280 -14H286" stroke="${GOLD}" stroke-width="8"/>
    <g fill="${C.cyan}" ${ink(3)}><circle cx="-160" cy="-8" r="9"/><circle cx="-100" cy="-8" r="9"/><circle cx="-40" cy="-8" r="9"/><circle cx="20" cy="-8" r="9"/><circle cx="80" cy="-8" r="9"/></g>
    <path d="M120 -34Q170 -96 230 -34Z" fill="${C.cyan}" ${ink(5)}/><path d="M146 -50Q170 -78 200 -56" fill="none" stroke="#fff" stroke-width="5" opacity=".8" stroke-linecap="round"/>
    ${oars}
    ${limb([[284, -30], [318, -84], [334, -120]], GOLD, 26, 6, true)}
    ${at(352, -150, 1, `<ellipse cx="0" cy="0" rx="40" ry="34" fill="${GOLD}" ${ink(5)}/><ellipse cx="38" cy="14" rx="26" ry="20" fill="${GOLD}" ${ink(5)}/>
      <path d="M-14 -20Q-58 -40 -54 2Q-50 34 -18 22Q-34 6 -22 -6" fill="none" stroke="${GOLD_DARK}" stroke-width="13" stroke-linecap="round"/>
      <circle cx="18" cy="-6" r="7" fill="${C.cyan}" ${ink(2)}/><path d="M48 22h8" ${ink(3)}/>`)}
    <path d="M-300 -34H290" stroke="#fff" stroke-width="4" opacity=".6"/>`;
  return defs + at(x, y, s, body, false, rot);
}

/**
 * The gas giant next door: candy-striped bands, a pink storm, tilted rings, and its ring of moons
 * (Colchis is the green one with a gold glow). Radius `r`.
 */
export function gasGiant(id: string, x: number, y: number, r: number, colchis = true): string {
  const bands = ['#f6d7a8', '#e8a878', '#fbe8c8', '#7fc8c0', '#f0b890', '#fff0d8', '#d88a6a', '#9ad8d0', '#f6d0a0'];
  let stripes = '';
  for (let i = 0; i < 9; i++) stripes += `<path d="M-1.2 ${-1 + i * 0.24}Q0 ${-0.94 + i * 0.24} 1.2 ${-1 + i * 0.24}V${-0.74 + i * 0.24}Q0 ${-0.68 + i * 0.24} -1.2 ${-0.74 + i * 0.24}Z" fill="${bands[i]}"/>`;
  const ring = (half: 'back' | 'front') =>
    `<path d="${half === 'back' ? 'M-1.9 0A1.9 0.42 0 0 1 1.9 0' : 'M1.9 0A1.9 0.42 0 0 1 -1.9 0'}" fill="none" stroke="#f4e0c0" stroke-width=".18" opacity=".75"/>
     <path d="${half === 'back' ? 'M-1.55 0A1.55 0.32 0 0 1 1.55 0' : 'M1.55 0A1.55 0.32 0 0 1 -1.55 0'}" fill="none" stroke="#e0b890" stroke-width=".08" opacity=".7"/>`;
  const defs = `<defs><clipPath id="${id}c"><circle r="1"/></clipPath>${rad(id + 's', [[0.5, '#0b1030', 0], [1, '#0b1030', 0.7]], 0.32, 0.3, 0.9)}${glowDef(id + 'a', '#ffd0a8', 0.5)}${glowDef(id + 'k', C.gold, 0.8)}</defs>`;
  let moons = '';
  const rand = rng(3);
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2 + 0.3;
    const mx = Math.cos(a) * 2.5;
    const my = Math.sin(a) * 0.55 - 0.1;
    const last = i === 6 && colchis;
    const mr = last ? 0.13 : 0.05 + rand() * 0.05;
    moons += `${last ? glow(id + 'k', mx, my, 0.45) : ''}<circle cx="${mx.toFixed(2)}" cy="${my.toFixed(2)}" r="${mr.toFixed(3)}" fill="${last ? '#6ac070' : ['#c8b8a8', '#9ab0d0', '#e0c090', '#b8a0c8'][i % 4]}" stroke="${C.ink}" stroke-width=".02"/>`;
  }
  const body = `${glow(id + 'a', 0, 0, 1.4)}<g transform="rotate(-14)">${ring('back')}</g>
    <g clip-path="url(#${id}c)"><circle r="1" fill="#f6d7a8"/>${stripes}<ellipse cx=".35" cy=".28" rx=".2" ry=".09" fill="#ff8ab8" opacity=".85"/></g>
    <circle r="1" fill="url(#${id}s)"/><circle r="1" fill="none" stroke="${C.ink}" stroke-width=".015"/>
    <g transform="rotate(-14)">${ring('front')}</g>${moons}`;
  return defs + at(x, y, r, body);
}

/** A little gold salvage drone: a saucer with a black dome, an amber eye and two claws (centred). */
export function saucer(x: number, y: number, s: number, flip = false): string {
  const body = `<path d="M-20 14L-34 44M20 14L34 44" ${ink(8)}/><path d="M-20 14L-34 44M20 14L34 44" stroke="#2a2230" stroke-width="4"/>
    <ellipse cx="0" cy="0" rx="60" ry="20" fill="${GOLD}" ${ink(5)}/><path d="M-30 -10Q0 -56 30 -10Z" fill="#2a2230" ${ink(5)}/>
    <circle cx="18" cy="4" r="9" fill="#ffb020" ${ink(3)}/><path d="M-46 -2H44" stroke="#fff" stroke-width="4" opacity=".5"/>`;
  return at(x, y, s, body, flip);
}

/** One of Aeëtes's salvage ships: a long gold beetle with claw cranes and a glowing "A" crest (facing left). */
export function goldShip(id: string, x: number, y: number, s: number): string {
  const defs = `<defs>${lin(id + 'g', [[0, '#fff0b0'], [0.5, '#f0c050'], [1, '#a87018']])}${glowDef(id + 'e', '#ffb020')}</defs>`;
  const body = `${glow(id + 'e', 330, 0, 110, 1, 70)}
    <path d="M-60 40L-80 110L-50 100M40 40L20 120L50 108M140 40L120 112L150 100" fill="none" ${ink(14)}/><path d="M-60 40L-80 110L-50 100M40 40L20 120L50 108M140 40L120 112L150 100" fill="none" stroke="#2a2230" stroke-width="7"/>
    <path d="M-300 0Q-260 -90 -60 -96H220Q320 -80 320 0Q320 70 220 76H-60Q-260 70 -300 0Z" fill="url(#${id}g)" ${ink(7)}/>
    <path d="M-200 -64Q-170 -112 -110 -96L-130 -60Z" fill="#ffb020" ${ink(5)}/>
    <path d="M30 40L70 -40L110 40M48 10H92" fill="none" stroke="#fff6c0" stroke-width="14" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M-270 -10H300" stroke="#fff" stroke-width="5" opacity=".45"/>`;
  return defs + at(x, y, s, body);
}

/** A standing stone of the Gardeners, carved with spirals and glowing light-words (base at x, y). */
export function ruinStone(id: string, x: number, y: number, s: number): string {
  const cols = [C.hello, C.pink, C.gold];
  const rand = rng(12);
  let dots = '';
  for (let r = 0; r < 6; r++) {
    for (let c = 0; c < 4; c++) {
      if (rand() < 0.25) continue;
      const col = cols[(r + c) % 3];
      dots += `<circle cx="${-42 + c * 28}" cy="${-300 + r * 40}" r="9" fill="${col}"/><circle cx="${-42 + c * 28}" cy="${-300 + r * 40}" r="16" fill="${col}" opacity=".3"/>`;
    }
  }
  const defs = `<defs>${lin(id + 'r', [[0, '#e0d8c8'], [1, '#9a9080']])}</defs>`;
  const body = `<path d="M-80 0L-90 -280Q-80 -380 0 -386Q80 -380 90 -280L80 0Z" fill="url(#${id}r)" ${ink(6)}/>
    <path d="M40 -360Q76 -300 70 -80" fill="none" stroke="#000" stroke-width="12" opacity=".1"/>
    <path d="M-8 -60q-22 0 -22 -20t22 -22t26 24t-28 32" fill="none" stroke="#7a7060" stroke-width="5"/>
    ${dots}`;
  return defs + at(x, y, s, body);
}

/** The Golden Fleece: a soft, curly golden cloak of seeds, sparkling (centred). */
export function fleece(id: string, x: number, y: number, s: number): string {
  const defs = `<defs>${rad(id + 'f', [[0, '#fff6d0'], [0.6, '#ffd166'], [1, '#e09a1a']], 0.4, 0.35, 0.8)}${glowDef(id + 'g', C.gold, 0.7)}</defs>`;
  let curls = '';
  const rand = rng(21);
  for (let i = 0; i < 22; i++) {
    const cx = -120 + rand() * 240;
    const cy = -70 + rand() * 150;
    curls += `<path d="M${(cx - 10).toFixed(0)} ${cy.toFixed(0)}q10 -14 20 0q-10 12 -20 0" fill="none" stroke="#c8801a" stroke-width="4" stroke-linecap="round"/>`;
  }
  const body = `${glow(id + 'g', 0, 0, 260)}
    <path d="M-110 -90Q-150 -70 -140 -20Q-170 30 -130 70Q-130 110 -80 104Q-40 130 0 110Q40 130 80 104Q130 110 130 70Q170 30 140 -20Q150 -70 110 -90Q60 -120 0 -100Q-60 -120 -110 -90Z" fill="url(#${id}f)" ${ink(6)}/>
    ${curls}<g fill="#7dff9a"><circle cx="-60" cy="-20" r="6"/><circle cx="40" cy="30" r="6"/><circle cx="80" cy="-40" r="5"/><circle cx="-20" cy="60" r="5"/></g>`;
  return defs + at(x, y, s, body);
}
