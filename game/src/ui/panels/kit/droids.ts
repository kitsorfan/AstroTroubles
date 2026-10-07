/**
 * The other droids of chapter 2 for the storybook: IRIS (the rainbow droid from the jungle) and
 * Brennus's snare drone with its cage. Same flat-fill, ink-outline style
 * as `lux` in heroes.ts.
 */
import { at, C, ink } from './base';
import { drone } from './ships';

/** The colours of IRIS's visor-eye, left to right. */
export const RAINBOW = ['#ff5e6a', '#ffb347', '#ffe066', '#7dff9a', '#5ec8ff', '#c37bff'];

const PEARL = '#f1f0fb';
const PEARL_DARK = '#c9c2e6';
const LILAC = '#b9a8e8';

export type IrisMood = 'normal' | 'happy' | 'asleep' | 'sing';

/** IRIS, centred at (x, y): a pearl teardrop, a visor with a rainbow eye, fins and a golden halo. */
export function iris(x: number, y: number, s: number, mood: IrisMood = 'normal', flip = false): string {
  const fin = (sx: number) =>
    `<path d="M${sx * 34} 4Q${sx * 70} -14 ${sx * 84} 10Q${sx * 66} 22 ${sx * 36} 22Z" fill="${LILAC}" ${ink(4)}/><path d="M${sx * 44} 8Q${sx * 62} 2 ${sx * 74} 10" fill="none" stroke="#fff" stroke-width="3" opacity=".5" stroke-linecap="round"/>`;
  const halo =
    mood === 'asleep'
      ? `<ellipse cx="0" cy="-74" rx="24" ry="7" fill="none" stroke="#8a7cc0" stroke-width="5" opacity=".6"/>`
      : `<ellipse cx="0" cy="-74" rx="34" ry="12" fill="${C.gold}" opacity=".25"/><ellipse cx="0" cy="-74" rx="24" ry="7" fill="none" stroke="${C.gold}" stroke-width="6"/>`;
  let eye: string;
  if (mood === 'asleep') eye = `<path d="M-18 -8Q0 0 18 -8" fill="none" stroke="#5a5470" stroke-width="5" stroke-linecap="round"/>`;
  else if (mood === 'happy') eye = `<path d="M-20 -2Q0 -18 20 -2" fill="none" stroke="${RAINBOW[4]}" stroke-width="7" stroke-linecap="round"/><path d="M-12 -8Q0 -14 12 -8" fill="none" stroke="${RAINBOW[1]}" stroke-width="3" stroke-linecap="round"/>`;
  else eye = RAINBOW.map((c, i) => `<rect x="${-24 + i * 8}" y="-12" width="8" height="12" fill="${c}"/>`).join('') + `<rect x="-24" y="-12" width="48" height="12" rx="6" fill="none" ${ink(2)}/><circle cx="-14" cy="-9" r="3" fill="#fff" opacity=".9"/>`;
  const notes =
    mood === 'sing'
      ? `<g stroke-linecap="round" fill="none" stroke-width="6"><path d="M50 -40q16 -10 30 0" stroke="${C.hello}"/><path d="M60 -60q20 -14 40 0" stroke="${C.pink}"/><path d="M70 -80q24 -18 50 0" stroke="${C.gold}"/></g>`
      : '';
  const body = `<ellipse cx="0" cy="96" rx="30" ry="6" fill="#000" opacity=".12"/>
    ${fin(-1)}${fin(1)}
    <path d="M0 -60V-40" ${ink(7)}/><path d="M0 -60V-40" stroke="${LILAC}" stroke-width="3"/>
    ${halo}
    <path d="M0 -44C30 -44 44 -22 44 4C44 32 26 52 0 80C-26 52 -44 32 -44 4C-44 -22 -30 -44 0 -44Z" fill="${PEARL}" ${ink(6)}/>
    <path d="M30 -30Q46 6 26 40Q12 60 0 72Q20 40 26 10Q30 -12 30 -30Z" fill="${PEARL_DARK}" opacity=".8"/>
    <path d="M-40 24Q0 40 40 24" fill="none" stroke="${LILAC}" stroke-width="5"/>
    <rect x="-34" y="-20" width="68" height="28" rx="14" fill="#141428" ${ink(4)}/>
    ${eye}
    <ellipse cx="-20" cy="-30" rx="9" ry="5" fill="#fff" transform="rotate(-30 -20 -30)"/>
    ${notes}`;
  return at(x, y, s, body, flip);
}

/** Brennus's snare drone, centred at (x, y), with its cage of red bars hanging below (and `inside` drawn in it). */
export function snare(x: number, y: number, s: number, inside = '', flip = false): string {
  const bars = [-44, -22, 0, 22, 44].map((bx) => `<path d="M${bx} 40V156" stroke="#ff4a5a" stroke-width="7" stroke-linecap="round"/>`).join('');
  const cage = `<ellipse cx="0" cy="40" rx="52" ry="12" fill="none" ${ink(7)}/>
    <path d="M-48 40V156M-24 40V158M0 40V160M24 40V158M48 40V156" ${ink(11)}/>${bars}
    <path d="M-52 156Q0 176 52 156" fill="none" ${ink(9)}/><path d="M-52 156Q0 176 52 156" fill="none" stroke="#ff4a5a" stroke-width="4"/>`;
  return at(x, y, s, `<path d="M-40 10L-46 40M40 10L46 40" ${ink(6)}/>`, flip) + inside + at(x, y, s, cage, flip) + drone(x, y, s * 0.9, flip);
}
