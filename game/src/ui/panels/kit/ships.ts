/**
 * Ships and machines: the colony ship Syracusia, Brennus's warship Gorgon, the little shuttle, the
 * spider drones, the gear emblem and the planet Gaia Nova.
 */
import { at, C, glow, glowDef, ink, lin, rad } from './base';

/** Brennus's gear emblem (teeth made with a dashed ring). */
export const gear = (x: number, y: number, r: number, color: string = C.red, hole = '#1a1630') =>
  `<circle cx="${x}" cy="${y}" r="${r * 0.82}" fill="${color}" stroke="${color}" stroke-width="${r * 0.36}" stroke-dasharray="${((r * Math.PI * 2 * 0.82) / 16).toFixed(1)}"/><circle cx="${x}" cy="${y}" r="${r * 0.3}" fill="${hole}"/>`;

/**
 * The colony ship Syracusia, side view facing right: a long spine, four ring sections like stacked
 * donuts with rows of lit windows, a bulbous bridge at the front and engines at the back.
 */
export function syracusia(id: string, x: number, y: number, s: number, flames = true): string {
  const defs = `<defs>${lin(id + 'h', [[0, '#ffffff'], [0.5, '#d8dee8'], [1, '#8a94a8']])}${glowDef(id + 'e', '#8fd8ff')}</defs>`;
  let rings = '';
  for (const rx of [-300, -110, 80]) {
    // A ring seen a little from the side: an ellipse with a hole the spine shows through.
    rings += `<path d="M${rx - 80} 0A80 190 0 1 0 ${rx + 80} 0A80 190 0 1 0 ${rx - 80} 0ZM${rx - 26} 0A26 116 0 1 1 ${rx + 26} 0A26 116 0 1 1 ${rx - 26} 0Z" fill="url(#${id}h)" fill-rule="evenodd" ${ink(6)}/>
      <ellipse cx="${rx}" cy="0" rx="54" ry="156" fill="none" stroke="#ffd166" stroke-width="9" stroke-dasharray="7 13"/>
      <path d="M${rx + 50} -150A80 190 0 0 1 ${rx + 50} 150" fill="none" stroke="#000" stroke-width="12" opacity=".12"/>`;
  }
  const body = `${flames ? glow(id + 'e', -600, 0, 140, 1, 90) : ''}
    <path d="M-560 -40L-600 -56V56L-560 40ZM-560 -40" fill="#5a6274" ${ink(5)}/>
    <rect x="-570" y="-44" width="1000" height="88" rx="30" fill="url(#${id}h)" ${ink(6)}/>
    <path d="M-540 10H420" stroke="#ffd166" stroke-width="8" stroke-dasharray="6 18"/>
    ${rings}
    <path d="M330 -70Q480 -110 560 -20Q590 30 520 70Q420 100 330 70Z" fill="url(#${id}h)" ${ink(6)}/>
    <path d="M440 -60Q520 -60 552 -16L470 -6Q450 -40 440 -60Z" fill="${C.cyan}" ${ink(4)}/>
    <path d="M462 -48Q500 -46 520 -28" fill="none" stroke="#fff" stroke-width="5" opacity=".8" stroke-linecap="round"/>
    <path d="M-560 -40H420" stroke="#fff" stroke-width="5" opacity=".5"/>`;
  return defs + at(x, y, s, body);
}

/** The warship Gorgon: angular olive and bronze, with Brennus's red gear on its side. */
export function gorgon(id: string, x: number, y: number, s: number, crashed = false): string {
  const defs = `<defs>${lin(id + 'h', [[0, '#7a7a48'], [0.6, C.olive], [1, '#22280f']])}${glowDef(id + 'e', '#ff9a3a')}</defs>`;
  const body = `${crashed ? '' : glow(id + 'e', -440, 10, 110, 1, 60)}
    <path d="M-420 -20L-300 -100L220 -110L440 -30L400 40L-380 60Z" fill="url(#${id}h)" ${ink(6)}/>
    <path d="M-120 -104L-60 -170H120L170 -108Z" fill="#8a6a3a" ${ink(5)}/>
    <path d="M-40 -150H100" stroke="#ffd166" stroke-width="8" stroke-dasharray="14 10"/>
    <path d="M-300 -100L-420 -20L-380 60" fill="none" stroke="#b08a4a" stroke-width="6"/>
    <path d="M-380 10H380M-200 -60L-160 50M100 -100L140 40" stroke="#22280f" stroke-width="4" opacity=".6"/>
    ${gear(10, -20, 46)}
    <path d="M-430 -10H-470V30H-410Z" fill="#4a4a3a" ${ink(4)}/>`;
  return defs + at(x, y, s, body, false, crashed ? 12 : 0);
}

/** The little shuttle: white with an orange stripe and two glowing engines (nose to the right). */
export function shuttle(id: string, x: number, y: number, s: number, rot = 0): string {
  const defs = `<defs>${glowDef(id + 'e', '#8fd8ff')}</defs>`;
  const body = `${glow(id + 'e', -150, -14, 70, 1, 40)}${glow(id + 'e', -150, 26, 70, 1, 40)}
    <path d="M-60 40L-130 80H-40Z" fill="#c9d1dc" ${ink(5)}/>
    <path d="M-130 -30Q-140 0 -130 50H60Q150 40 160 10Q150 -30 60 -40H-90Z" fill="#f4f6fb" ${ink(6)}/>
    <path d="M-132 14H150" stroke="${C.orange}" stroke-width="14"/>
    <path d="M70 -34Q130 -28 148 -6L80 -4Z" fill="${C.cyan}" ${ink(4)}/>
    <rect x="-150" y="-26" width="26" height="28" rx="6" fill="#5a6274" ${ink(4)}/><rect x="-150" y="14" width="26" height="28" rx="6" fill="#5a6274" ${ink(4)}/>`;
  return defs + at(x, y, s, body, false, rot);
}

/** A small black spider-drone with red eyes. */
export function drone(x: number, y: number, s: number, flip = false): string {
  const legs = `<path d="M-20 10L-60 30L-70 70M-10 14L-36 44L-36 84M20 10L60 30L70 70M10 14L36 44L36 84" fill="none" ${ink(7)}/>`;
  const body = `${legs}<ellipse cx="0" cy="0" rx="48" ry="30" fill="#24202e" ${ink(6)}/>
    <ellipse cx="-14" cy="-12" rx="18" ry="8" fill="#5a5470" opacity=".7"/>
    <path d="M-30 -30L-50 -60M30 -30L50 -60" ${ink(5)}/><path d="M-70 -62H-30M30 -62H70" stroke="#5a5470" stroke-width="6" stroke-linecap="round"/>
    <circle cx="16" cy="2" r="14" fill="#ff2a3a" opacity=".35"/><circle cx="16" cy="2" r="7" fill="#ff3a4c"/><circle cx="34" cy="2" r="5" fill="#ff3a4c"/>`;
  return at(x, y, s, body, flip);
}

/**
 * The planet Gaia Nova: blue oceans, green lands, white clouds and a glowing rim. `landRot` turns
 * the continents (degrees) so a close-up can show land at the top.
 */
export function planet(id: string, x: number, y: number, r: number, lit = 0.35, landRot = 0): string {
  const defs = `<defs>${rad(id + 'o', [[0, '#7ac8ff'], [0.6, C.sky], [1, '#123a7a']], 0.36, 0.3, 0.75)}
    ${rad(id + 's', [[0.55, '#0b1030', 0], [1, '#0b1030', 0.85]], lit, 0.25, 0.9)}
    ${glowDef(id + 'a', '#9ad8ff', 0.6)}<clipPath id="${id}c"><circle cx="0" cy="0" r="1"/></clipPath></defs>`;
  const land = `<g transform="rotate(${landRot})"><g fill="${C.green2}"><path d="M-.7 -.5Q-.4 -.75 -.1 -.55Q.1 -.3 -.15 -.15Q-.3 .1 -.55 0Q-.8 -.2 -.7 -.5Z"/>
    <path d="M.15 .05Q.45 -.15 .7 .1Q.8 .4 .5 .55Q.3 .7 .2 .45Q.05 .25 .15 .05Z"/><path d="M-.5 .45Q-.3 .35 -.2 .55Q-.25 .8 -.45 .75Z"/></g>
    <g fill="${C.green}"><path d="M-.6 -.4Q-.4 -.55 -.25 -.42Q-.3 -.25 -.5 -.2Z"/><path d="M.3 .15Q.5 .05 .6 .25Q.5 .45 .35 .35Z"/></g></g>
    <g fill="#fff" opacity=".85"><path d="M-.9 -.2Q-.5 -.3 -.1 -.2Q.2 -.15 .5 -.25Q.3 -.1 0 -.12Q-.4 -.08 -.9 -.2Z"/>
    <path d="M-.3 .25Q.1 .15 .4 .2Q.7 .25 .9 .15Q.6 .35 .2 .3Q-.1 .3 -.3 .25Z"/><path d="M-.2 -.75Q.2 -.85 .5 -.7Q.2 -.68 -.2 -.75Z"/></g>`;
  const body = `${glow(id + 'a', 0, 0, 1.18)}<circle r="1" fill="url(#${id}o)"/><g clip-path="url(#${id}c)">${land}</g>
    <circle r="1" fill="url(#${id}s)"/><circle r="1" fill="none" stroke="#bfe8ff" stroke-width=".012" opacity=".8"/>`;
  return defs + at(x, y, r, body);
}
