/**
 * Atalanta, the scout who joins the Argonauts in chapter 3: about 13, warm light-brown skin, a long
 * dark-auburn braid, a light visor band, a teal-and-white scout suit with a short cape and gold trim,
 * and a white-and-gold recurve bow with a glowing string. Built on `person`, feet at (0, 0).
 */
import { at, C, ink, r1 } from './base';
import type { CastOpts } from './cast';
import { person } from './people';

const TEAL = '#2fb7a3';
const TEAL_DARK = '#1d7a6e';
const HAIR = '#6a2618';
const SNOW = '#eef3f6';
const GLOW = '#8ff8e4';

/** The braid hanging down behind her shoulder (head coordinates). */
const BRAID = `${[0, 1, 2, 3, 4, 5, 6]
  .map((i) => `<ellipse cx="${30 + i * 3}" cy="${34 + i * 15}" rx="${r1(13 - i * 0.8)}" ry="11" fill="${HAIR}" ${ink(4)}/>`)
  .join('')}<rect x="40" y="130" width="16" height="8" rx="3" fill="${C.gold}" ${ink(3)}/>`;

/** A side-swept fringe and the visor band with its glowing lens (head coordinates). */
const HEAD = `<path d="M-44 4Q-50 -46 0 -48Q48 -46 44 2Q40 -16 26 -26Q4 -22 -14 -32Q-30 -16 -44 4Z" fill="${HAIR}" ${ink(4)}/>
  <path d="M-30 -36Q-6 -50 20 -42" fill="none" stroke="#fff" stroke-width="4" opacity=".25" stroke-linecap="round"/>
  <path d="M-45 -16Q0 -36 45 -16L44 -6Q0 -26 -44 -6Z" fill="${SNOW}" ${ink(3)}/>
  <path d="M-26 -22Q0 -32 26 -22L25 -15Q0 -25 -25 -15Z" fill="${GLOW}" opacity=".9"/>`;

/** The scout suit's details over the body: a white chest panel, gold belt and the bow's strap. */
const SUIT = `<path d="M-22 -168H22L18 -112H-18Z" fill="${SNOW}" ${ink(3)}/><circle cx="8" cy="-150" r="5" fill="${GLOW}" ${ink(2)}/>
  <rect x="-46" y="-92" width="92" height="12" fill="${C.gold}" ${ink(3)}/>
  <path d="M-34 -172Q0 -150 34 -172L30 -160Q0 -140 -30 -160Z" fill="${SNOW}" ${ink(3)}/>`;

/** A recurve bow standing upright, grip at (0, 0), its string drawn back `pull` units behind the grip. */
function bow(pull = 18): string {
  return `<path d="M-12 -96L${-pull} 0L-12 96" fill="none" stroke="${GLOW}" stroke-width="3"/>
    <path d="M-12 -96Q-24 -104 -10 -80Q22 -44 14 0Q22 44 -10 80Q-24 104 -12 96" fill="none" ${ink(12)}/>
    <path d="M-12 -96Q-24 -104 -10 -80Q22 -44 14 0Q22 44 -10 80Q-24 104 -12 96" fill="none" stroke="${SNOW}" stroke-width="7" stroke-linecap="round"/>
    <rect x="6" y="-14" width="14" height="28" rx="5" fill="${C.gold}" ${ink(3)}/>`;
}

/** An arrow pointing right, nock at (0, 0). */
const ARROW = `<path d="M0 0H120" ${ink(7)}/><path d="M0 0H120" stroke="${SNOW}" stroke-width="3"/>
  <path d="M120 -9L140 0L120 9Z" fill="${GLOW}" ${ink(3)}/><path d="M2 0L-12 -10M2 0L-12 10" stroke="${C.gold}" stroke-width="6" stroke-linecap="round"/>`;

/**
 * Atalanta, feet at (x, y). `bow: 'hand'` has her drawing the bow toward the right of the picture
 * (an arrow on the string); otherwise the bow is slung across her back.
 */
export function atalanta(x: number, y: number, s: number, o: CastOpts & { bow?: 'back' | 'hand' } = {}): string {
  const aiming = o.bow === 'hand';
  const arms: [number[][], number[][]] | undefined = aiming
    ? [
        [
          [-34, -150],
          [22, -164],
        ],
        [
          [84, -168],
          [136, -170],
        ],
      ]
    : undefined;
  const slung = aiming ? '' : at(-6, -118, 1, bow(14), false, 38);
  const figure = person(0, 0, 1, {
    skin: '#c68a5e',
    hair: HAIR,
    hairStyle: 'crop',
    coat: TEAL,
    pants: TEAL_DARK,
    shoes: SNOW,
    hands: SNOW,
    pose: o.pose,
    arms,
    legs: o.legs,
    face: o.face ?? 'smile',
    flip: false,
    head: 1.22,
    headBack: BRAID,
    headExtra: HEAD,
    bodyExtra: slung + SUIT,
    lite: o.lite,
  });
  // The short cape flaps out behind her.
  const cape = `<path d="M-40 -168Q-86 -130 -78 -84Q-60 -96 -40 -92Z" fill="${TEAL_DARK}" ${ink(5)}/><path d="M-78 -84Q-60 -96 -40 -92" fill="none" stroke="${C.gold}" stroke-width="4"/>`;
  const held = aiming ? at(136, -170, 1, bow(114)) + at(22, -166, 1, ARROW) : '';
  return at(x, y, s, cape + figure + held, o.flip);
}
