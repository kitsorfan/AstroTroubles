/**
 * Aeëtes, the salvage tycoon of chapter 3: tall and thin, a long gold coat, slicked-back silver hair,
 * a gold-rimmed eyepatch that is really a little screen, a ring on every finger, and a smile that is a
 * bit too wide. Built on `person`; feet at (x, y).
 */
import { C, ink } from './base';
import type { Expr } from './face';
import { person, type ArmPose } from './people';

const COAT = '#e2b23c';

/** Slick hair shine, the eyepatch screen (with a rising gold line on it) and the too-wide grin (head coordinates). */
const HEAD = `<path d="M-38 -30Q-6 -52 36 -36M-34 -20Q0 -40 40 -24" fill="none" stroke="#fff" stroke-width="3.5" opacity=".55" stroke-linecap="round"/>
  <path d="M-40 -8Q-6 -16 40 -14" fill="none" ${ink(3)}/>
  <rect x="6" y="-15" width="28" height="24" rx="7" fill="#12202e" stroke="${C.gold}" stroke-width="4"/>
  <path d="M10 2L16 -2L21 1L30 -9" fill="none" stroke="#7dff9a" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M-16 20Q6 46 36 18Q8 30 -16 20Z" fill="#7a2630" ${ink(3)}/><path d="M-12 21Q8 30 32 20L30 25Q8 34 -10 25Z" fill="#fff"/>
  <path d="M-22 14Q-18 22 -12 22M38 12Q38 20 32 22" fill="none" ${ink(3)}/>`;

/** A ring of gold on each finger: little gold beads around a hand at (hx, hy) (body coordinates). */
const rings = (hx: number, hy: number) =>
  `<g fill="${C.gold}" ${ink(2)}><circle cx="${hx - 9}" cy="${hy - 8}" r="4.5"/><circle cx="${hx - 2}" cy="${hy - 12}" r="4.5"/><circle cx="${hx + 6}" cy="${hy - 10}" r="4.5"/><circle cx="${hx + 11}" cy="${hy - 3}" r="4.5"/></g>`;

/** The hands' positions for the poses he uses. */
const HANDS: Partial<Record<ArmPose, [number, number][]>> = {
  spread: [
    [-142, -178],
    [142, -178],
  ],
  hips: [
    [-44, -98],
    [44, -98],
  ],
  point: [
    [-58, -90],
    [146, -176],
  ],
  wave: [
    [-58, -90],
    [90, -226],
  ],
};

export function aeetes(x: number, y: number, s: number, o: { pose?: ArmPose; face?: Expr; flip?: boolean } = {}): string {
  const pose = o.pose ?? 'spread';
  const hands = (HANDS[pose] ?? []).map(([hx, hy]) => rings(hx, hy)).join('');
  const coatTails = `<path d="M-46 -60Q-70 -10 -66 -4L-24 -10ZM46 -60Q70 -10 66 -4L24 -10Z" fill="${COAT}" ${ink(5)}/>`;
  const trim = `<path d="M-16 -170L-6 -60M16 -170L6 -60" stroke="#fff2b0" stroke-width="5"/><g fill="#fff6d0" ${ink(2)}><circle cx="-24" cy="-130" r="5"/><circle cx="-24" cy="-104" r="5"/></g>`;
  const body = person(0, 0, 1, {
    skin: '#e8c0a0',
    hair: '#d8dce8',
    hairStyle: 'short',
    coat: COAT,
    shirt: '#5a1a4a',
    long: true,
    pants: '#3a1a34',
    shoes: '#1a1218',
    pose,
    face: o.face ?? 'calm',
    bulk: 0.86,
    bodyExtra: trim,
    headExtra: HEAD,
  });
  // Tall and thin: stretched up a little.
  return `<g transform="translate(${x} ${y}) scale(${o.flip ? -s : s} ${s * 1.14})">${coatTails}${body}${hands}</g>`;
}
