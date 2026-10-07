/**
 * The named grown-ups of the story, built on `person`: General Brennus (old and young), Captain
 * Atalanta, Dr. Hypatia, the scientists of the first expedition, Grandma and little Brennus.
 */
import { at, C, ink } from './base';
import type { Expr } from './face';
import { person, type ArmPose } from './people';

export interface CastOpts {
  pose?: ArmPose;
  face?: Expr;
  legs?: 'stand' | 'kneel' | 'none';
  flip?: boolean;
  /** Simpler drawing for small figures in the background. */
  lite?: boolean;
}

const OLIVE_DARK = '#262e16';

/** Gold epaulettes, red collar tabs, medals and a belt on an olive uniform (body coordinates). */
const UNIFORM = `<path d="M-58 -166Q-40 -180 -20 -168L-24 -154Q-42 -160 -56 -152ZM58 -166Q40 -180 20 -168L24 -154Q42 -160 56 -152Z" fill="${C.gold}" ${ink(3)}/>
  <path d="M-54 -152v10M-46 -155v10M-38 -157v10M54 -152v10M46 -155v10M38 -157v10" stroke="${C.gold}" stroke-width="3"/>
  <path d="M-16 -172L-4 -150L-20 -156ZM16 -172L4 -150L20 -156Z" fill="${C.red}" ${ink(2)}/>
  <path d="M0 -150V-80" stroke="${OLIVE_DARK}" stroke-width="3"/><g fill="${C.gold}"><circle cx="0" cy="-134" r="3"/><circle cx="0" cy="-114" r="3"/></g>
  <rect x="-46" y="-92" width="92" height="12" fill="#3a2a18" ${ink(3)}/><rect x="-8" y="-94" width="16" height="16" rx="3" fill="${C.gold}" ${ink(2)}/>`;
const MEDALS = `<g ${ink(2)}><rect x="-38" y="-142" width="8" height="12" fill="#ff3a4c"/><rect x="-28" y="-142" width="8" height="12" fill="#3fb6ff"/><rect x="-18" y="-142" width="8" height="12" fill="${C.gold}"/></g>
  <g fill="${C.gold}" ${ink(2)}><circle cx="-34" cy="-124" r="5"/><circle cx="-16" cy="-124" r="5"/></g>`;

/** Brennus's grey moustache, scar and glowing red monocle (head coordinates). */
const OLD_FACE = `<path d="M-30 -6L-14 30" stroke="#9a5848" stroke-width="3.5" stroke-linecap="round" opacity=".8"/>
  <path d="M-20 15Q-6 4 6 12Q18 4 34 15Q46 26 30 26Q18 19 6 21Q-6 19 -18 26Q-34 26 -20 15Z" fill="#d8d8e0" ${ink(3)}/>
  <circle cx="19.5" cy="-2" r="20" fill="#ff3a4c" opacity=".18"/><circle cx="19.5" cy="-2" r="13" fill="#ff3a4c" fill-opacity=".3" stroke="#d8b050" stroke-width="3.5"/>
  <path d="M32 2Q40 24 30 44" fill="none" stroke="#d8b050" stroke-width="2"/>
  <path d="M-44 4Q-46 -14 -40 -22L-36 2ZM44 4Q46 -14 40 -22L36 2Z" fill="#c8c8d2"/>`;

/**
 * General Brennus. `young`: forty years ago (dark hair, no moustache); `capOff`: no cap; `rifle`:
 * holding his big blaster rifle, aimed `aim` degrees (negative = up) in the 'rifle' pose.
 */
export function brennus(
  x: number,
  y: number,
  s: number,
  o: CastOpts & { young?: boolean; capOff?: boolean; rifle?: boolean; aim?: number } = {},
): string {
  const young = !!o.young;
  const pose = o.pose ?? 'stand';
  const aim = o.aim ?? -8;
  let rifle = '';
  let arms: [number[][], number[][]] | undefined;
  if (o.rifle && pose === 'rifle') {
    // Both hands on the rifle, wherever it points.
    const a = (aim * Math.PI) / 180;
    const along = (d: number, off: number) => [40 + Math.cos(a) * d - Math.sin(a) * off, -148 + Math.sin(a) * d + Math.cos(a) * off];
    const bh = along(4, 10);
    const fh = along(74, 10);
    arms = [[[bh[0] - 26, bh[1] + 36], bh], [[fh[0] - 30, fh[1] + 34], fh]];
  }
  if (o.rifle) {
    // A big chunky cartoon blaster rifle (no muzzle flash, nobody hurt).
    const r = `<rect x="-40" y="-14" width="150" height="28" rx="10" fill="#4a4f3a" ${ink(5)}/><rect x="104" y="-9" width="34" height="18" rx="5" fill="#2a2c24" ${ink(4)}/>
      <rect x="-70" y="-8" width="40" height="30" rx="8" fill="#5a3a22" ${ink(5)}/><rect x="10" y="-26" width="44" height="14" rx="5" fill="#2a2c24" ${ink(4)}/><circle cx="80" cy="0" r="5" fill="#ff3a4c"/>`;
    rifle = pose === 'rifleDown' ? at(10, -98, 1, r, false, 30) : at(40, -148, 1, r, false, aim);
  }
  const body = person(0, 0, 1, {
    skin: '#d4a284',
    hair: young ? '#3b2416' : '#c8c8d2',
    hairStyle: young ? 'crop' : 'bald',
    coat: C.olive,
    pants: OLIVE_DARK,
    shoes: '#1a1410',
    pose,
    arms,
    legs: o.legs,
    face: o.face ?? (young ? 'stern' : 'angry'),
    hat: o.capOff ? 'none' : 'general',
    bulk: young ? 1.05 : 1.15,
    bodyExtra: UNIFORM + (young ? '' : MEDALS),
    headExtra: young ? '' : OLD_FACE,
    lite: o.lite,
  });
  return at(x, y, s, body + rifle, o.flip);
}

/** Captain Atalanta: dark skin, short grey hair, navy and gold uniform, captain's cap. */
export function captain(x: number, y: number, s: number, o: CastOpts = {}): string {
  return person(x, y, s, {
    skin: '#6f4631',
    hair: '#d8d8e0',
    hairStyle: 'crop',
    coat: '#1c2a4f',
    pants: '#141c36',
    pose: o.pose,
    legs: o.legs,
    face: o.face ?? 'determined',
    flip: o.flip,
    hat: 'captain',
    bodyExtra: `<path d="M-58 -166Q-40 -180 -20 -168L-24 -156Q-42 -160 -56 -152ZM58 -166Q40 -180 20 -168L24 -156Q42 -160 56 -152Z" fill="${C.gold}" ${ink(3)}/><path d="M-16 -172L0 -146L16 -172" fill="#e6edf7" ${ink(3)}/><g fill="${C.gold}"><circle cx="0" cy="-128" r="3.5"/><circle cx="0" cy="-108" r="3.5"/><circle cx="0" cy="-88" r="3.5"/></g>`,
  });
}

/** Dr. Hypatia: hair in a bun with a gold pin, round glasses, white lab coat over a blue top. */
export function hypatia(x: number, y: number, s: number, o: CastOpts = {}): string {
  return person(x, y, s, {
    skin: '#c8906c',
    hair: '#1c1410',
    hairStyle: 'bun',
    coat: '#f2f5fa',
    shirt: '#3a6ab0',
    long: true,
    pose: o.pose,
    legs: o.legs,
    face: o.face ?? 'smile',
    glasses: true,
    flip: o.flip,
    headBack: `<path d="M8 -62L26 -76" stroke="${C.gold}" stroke-width="5" stroke-linecap="round"/>`,
  });
}

/** The twelve scientists of the first expedition: varied looks, all in lab coats or field vests. */
const CREW = [
  { skin: '#e8bf9a', hair: '#5a3a22', hairStyle: 'long', coat: '#f2f5fa', shirt: '#5fa86a' },
  { skin: '#8a5a3c', hair: '#1a1210', hairStyle: 'curly', coat: '#c9a66b', shirt: '#e8e2d0', glasses: true },
  { skin: '#f0cfb0', hair: '#c96a2a', hairStyle: 'pony', coat: '#f2f5fa', shirt: '#d65a5a' },
  { skin: '#b07850', hair: '#e8e8ee', hairStyle: 'bald', coat: '#f2f5fa', shirt: '#6a7ab8', glasses: true },
  { skin: '#5a3a28', hair: '#1a1210', hairStyle: 'short', coat: '#8aa65a', shirt: '#e8e2d0' },
  { skin: '#e0b48e', hair: '#e2c060', hairStyle: 'bun', coat: '#f2f5fa', shirt: '#ff9a5a' },
  { skin: '#c8906c', hair: '#2a1a12', hairStyle: 'boy', coat: '#c9a66b', shirt: '#4a8ac8' },
  { skin: '#9a6440', hair: '#3a2418', hairStyle: 'curly', coat: '#f2f5fa', shirt: '#b85ac8' },
] as const;

/** Scientist number `i` (0-7) of the first expedition. */
export function scientist(i: number, x: number, y: number, s: number, o: CastOpts = {}): string {
  const c = CREW[i % CREW.length];
  return person(x, y, s, { ...c, long: c.coat === '#f2f5fa', pants: '#4a4a5a', pose: o.pose, legs: o.legs, face: o.face ?? 'smile', flip: o.flip, lite: o.lite });
}

/** Grandma: white hair in a bun, a flowery dress with an apron, green gardening gloves. */
export function grandma(x: number, y: number, s: number, o: CastOpts = {}): string {
  return person(x, y, s, {
    skin: '#e8b898',
    hair: '#f2f2f6',
    hairStyle: 'bun',
    coat: '#8a5aa8',
    long: true,
    hands: '#5f9a3a',
    pants: '#8a5aa8',
    pose: o.pose,
    legs: o.legs,
    face: o.face ?? 'happy',
    flip: o.flip,
    glasses: true,
    bodyExtra: `<path d="M-30 -150H30L36 -48H-36Z" fill="#fff8ec" ${ink(4)}/><rect x="-16" y="-104" width="32" height="22" rx="4" fill="#ffd6e6" ${ink(3)}/><path d="M-30 -150Q0 -172 30 -150" fill="none" stroke="#fff8ec" stroke-width="6"/>`,
  });
}

/** Little Brennus at about eight: dark hair, a cosy red sweater, a big proud smile. */
export function boyBrennus(x: number, y: number, s: number, o: CastOpts = {}): string {
  return person(x, y, s, {
    skin: '#e6b494',
    hair: '#3b2416',
    hairStyle: 'boy',
    coat: '#c0392b',
    pants: '#3a5a8a',
    pose: o.pose,
    face: o.face ?? 'grin',
    flip: o.flip,
    head: 1.3,
    bodyExtra: `<path d="M-40 -130H40M-42 -110H42" stroke="#e8705a" stroke-width="5" opacity=".7"/>`,
  });
}
