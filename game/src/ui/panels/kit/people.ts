/**
 * Grown-ups (and one small boy): a chibi person with a big head, a coat or uniform, arm and leg
 * poses, hair styles and hats. Feet at (0, 0); about 270 units tall at scale 1.
 */
import { at, C, ink, limb, r1 } from './base';
import { face, type Expr } from './face';

export type ArmPose =
  | 'stand'
  | 'cheer'
  | 'wave'
  | 'point'
  | 'shock'
  | 'spread'
  | 'rifle'
  | 'rifleDown'
  | 'plant'
  | 'fist'
  | 'hips'
  | 'hold'
  | 'gear';
export type Hair = 'short' | 'bun' | 'curly' | 'long' | 'bald' | 'pony' | 'crop' | 'boy';
export type Hat = 'none' | 'general' | 'captain';

/** [elbow, hand] for the back arm (left of the picture) and the front arm. */
const ARMS: Record<ArmPose, [number[][], number[][]]> = {
  stand: [[[-54, -122], [-58, -90]], [[54, -122], [58, -90]]],
  cheer: [[[-72, -196], [-84, -240]], [[72, -196], [84, -240]]],
  wave: [[[-54, -122], [-58, -90]], [[80, -180], [90, -226]]],
  point: [[[-54, -122], [-58, -90]], [[92, -166], [146, -176]]],
  shock: [[[-80, -150], [-92, -192]], [[80, -150], [92, -192]]],
  spread: [[[-92, -168], [-142, -178]], [[92, -168], [142, -178]]],
  rifle: [[[20, -128], [62, -144]], [[74, -134], [112, -150]]],
  rifleDown: [[[-24, -118], [6, -100]], [[54, -120], [62, -94]]],
  plant: [[[-20, -112], [20, -76]], [[60, -114], [82, -72]]],
  fist: [[[-70, -130], [-62, -176]], [[70, -130], [66, -178]]],
  hips: [[[-72, -132], [-44, -98]], [[72, -132], [44, -98]]],
  hold: [[[-36, -118], [6, -112]], [[50, -122], [30, -110]]],
  gear: [[[-56, -126], [-60, -94]], [[66, -128], [44, -112]]],
};

export interface PersonOpts {
  skin: string;
  hair: string;
  hairStyle?: Hair;
  coat: string;
  /** The top under an open coat (omit for a closed uniform). */
  shirt?: string;
  /** A long lab coat that reaches the knees. */
  long?: boolean;
  pants?: string;
  shoes?: string;
  hands?: string;
  pose?: ArmPose;
  legs?: 'stand' | 'kneel' | 'none';
  face?: Expr;
  glasses?: boolean;
  hat?: Hat;
  flip?: boolean;
  /** Widens the body (stocky soldiers). */
  bulk?: number;
  /** Head size multiplier (children get a bigger head). */
  head?: number;
  /** Extra markup in head coordinates (moustaches, monocles) and body coordinates (medals). */
  headExtra?: string;
  bodyExtra?: string;
  /** Extra markup drawn behind the head (a bun), in head coordinates. */
  headBack?: string;
}

/** The back half of a hair style (behind the head), in head coordinates. */
function hairBack(style: Hair, c: string): string {
  if (style === 'bun') return `<circle cx="-8" cy="-48" r="19" fill="${c}" ${ink(5)}/>`;
  if (style === 'long') return `<path d="M-46 -6Q-58 50 -36 70H36Q58 50 46 -6Z" fill="${c}" ${ink(5)}/>`;
  if (style === 'pony') return `<path d="M-40 -20Q-76 10 -60 52Q-48 30 -36 0Z" fill="${c}" ${ink(5)}/>`;
  if (style === 'curly') return `<path d="M-50 10Q-66 -10 -50 -30Q-56 -60 -24 -60Q-4 -76 20 -60Q54 -62 50 -30Q66 -10 50 10Z" fill="${c}" ${ink(5)}/>`;
  return '';
}

/** The front half of a hair style (the hairline over the forehead). */
function hairFront(style: Hair, c: string): string {
  switch (style) {
    case 'bald':
      return `<path d="M-43 6Q-46 -12 -38 -22L-34 -2ZM43 6Q46 -12 38 -22L34 -2Z" fill="${c}"/>`;
    case 'crop':
      return `<path d="M-43 -2Q-46 -44 0 -46Q46 -44 43 -2Q38 -26 0 -30Q-38 -26 -43 -2Z" fill="${c}"/>`;
    case 'boy':
      return `<path d="M-44 4Q-50 -46 -4 -48Q46 -48 44 2Q38 -18 28 -24Q22 -14 10 -22Q2 -10 -10 -22Q-20 -10 -28 -20Q-38 -14 -44 4Z" fill="${c}" ${ink(4)}/>`;
    case 'curly':
      return `<path d="M-42 -4Q-44 -40 -6 -44Q40 -46 42 -6Q32 -24 18 -20Q8 -30 -4 -22Q-16 -30 -26 -18Q-36 -20 -42 -4Z" fill="${c}"/>`;
    default:
      return `<path d="M-43 6Q-48 -46 0 -46Q48 -46 43 4Q40 -18 30 -26Q4 -36 -22 -26Q-38 -16 -43 6Z" fill="${c}"/>`;
  }
}

/** A peaked cap in head coordinates: Brennus's olive one or the Captain's navy one. */
function hat(kind: Hat): string {
  if (kind === 'none') return '';
  const general = kind === 'general';
  const crown = general ? C.olive : '#1c2a4f';
  const band = general ? C.red : '#0f1830';
  return `<path d="M-50 -22Q-60 -72 2 -78Q62 -72 52 -22Z" fill="${crown}" ${ink(5)}/>
    <path d="M-50 -34H52V-21H-50Z" fill="${band}" ${ink(3)}/>${general ? '' : `<path d="M-50 -27H52" stroke="${C.gold}" stroke-width="3"/>`}
    <path d="M-46 -22Q8 -2 60 -22L58 -14Q8 8 -46 -14Z" fill="#14121c" ${ink(3)}/>
    <circle cx="4" cy="-52" r="10" fill="${C.gold}" ${ink(3)}/><circle cx="4" cy="-52" r="4" fill="${general ? C.red : crown}"/>
    <path d="M-30 -60Q-10 -72 20 -70" fill="none" stroke="#fff" stroke-width="4" opacity=".25" stroke-linecap="round"/>`;
}

/** A person, feet at (x, y). */
export function person(x: number, y: number, s: number, o: PersonOpts): string {
  const pose = o.pose ?? 'stand';
  const [back, front] = ARMS[pose];
  const dy = o.legs === 'kneel' ? 44 : 0;
  const sh = (p: number[]) => [p[0], p[1] + dy];
  const hands = o.hands ?? o.skin;
  const pants = o.pants ?? '#3a4058';
  const shoes = o.shoes ?? '#2a2430';
  const arm = (side: number, pts: number[][]) =>
    limb([[side * 40, -158 + dy], sh(pts[0]), sh(pts[1])], o.coat, 22) + `<circle cx="${r1(sh(pts[1])[0])}" cy="${r1(sh(pts[1])[1])}" r="12" fill="${hands}" ${ink(4)}/>`;
  const shoe = (fx: number, fy: number, dir = 1) =>
    `<path d="M${fx - 16 * dir} ${fy}Q${fx - 16 * dir} ${fy - 18} ${fx + 4 * dir} ${fy - 18}Q${fx + 26 * dir} ${fy - 14} ${fx + 26 * dir} ${fy}Z" fill="${shoes}" ${ink(4)}/>`;
  let legs = '';
  if (o.legs === 'kneel') {
    legs = limb([[-18, -40], [-30, -8], [-64, -10]], pants, 26) + limb([[20, -40], [58, -46], [62, -16]], pants, 26) + shoe(-76, 0, -1) + shoe(62, 0);
  } else if (o.legs !== 'none') {
    legs = limb([[-18, -84], [-22, -16]], pants, 26) + limb([[18, -84], [22, -16]], pants, 26) + shoe(-24, 0) + shoe(22, 0);
  }
  const bottom = o.long ? -42 : -74;
  const b = (v: number) => v + dy;
  let torso = `<path d="M-44 ${b(bottom - 10)}Q-50 ${b(-168)} 0 ${b(-172)}Q50 ${b(-168)} 44 ${b(bottom - 10)}Q42 ${b(bottom)} 0 ${b(bottom)}Q-42 ${b(bottom)} -44 ${b(bottom - 10)}Z" fill="${o.coat}" ${ink(6)}/>`;
  torso += `<path d="M30 ${b(-160)}Q50 ${b(-120)} 40 ${b(bottom - 6)}Q20 ${b(bottom)} -4 ${b(bottom)}Q30 ${b(-110)} 30 ${b(-160)}Z" fill="#000" opacity=".14"/>`;
  if (o.shirt) {
    torso += `<path d="M-16 ${b(-170)}L0 ${b(-118)}L16 ${b(-170)}Z" fill="${o.shirt}"/><path d="M-16 ${b(-170)}L-2 ${b(-112)}V${b(bottom)}M16 ${b(-170)}L2 ${b(-112)}" fill="none" ${ink(3)}/>`;
  }
  if (o.long) torso += `<path d="M0 ${b(-100)}V${b(bottom)}" ${ink(3)}/>`;
  if (o.bodyExtra) torso += at(0, dy, 1, o.bodyExtra);
  if (o.bulk && o.bulk !== 1) torso = `<g transform="scale(${o.bulk} 1)">${torso}</g>`;
  const style = o.hairStyle ?? 'short';
  const k = 0.85;
  const behind = (o.headBack ?? '') + hairBack(style, o.hair);
  let head = `<ellipse cx="-42" cy="4" rx="8" ry="11" fill="${o.skin}" ${ink(4)}/>`;
  head += `<ellipse cx="0" cy="0" rx="43" ry="45" fill="${o.skin}" ${ink(6)}/>`;
  head += `<path d="M30 -30Q50 10 22 40Q4 50 -18 42Q14 34 28 8Q36 -10 30 -30Z" fill="#000" opacity=".1"/>`;
  head += hairFront(style, o.hair);
  head += face(o.face ?? 'smile', k, 5, style === 'bald' ? o.hair : o.hair === '#e8e8ee' || o.hair === '#d8d8e0' ? '#8a8a96' : o.hair);
  head += `<path d="M6 6Q10 12 6 14" fill="none" ${ink(3)}/>`;
  if (o.glasses) head += `<g fill="${C.cyan}" fill-opacity=".18" ${ink(3)}><circle cx="-8.6" cy="-2" r="12"/><circle cx="19.5" cy="-2" r="12"/></g><path d="M3 -3H8" ${ink(3)}/>`;
  head += o.headExtra ?? '';
  head += at(0, -8, 1, hat(o.hat ?? 'none'));
  const hs = o.head ?? 1;
  const hy = b(-216) + (hs - 1) * 30;
  const neck = at(0, hy, hs, behind) + `<rect x="-10" y="${b(-186)}" width="20" height="20" fill="${o.skin}" ${ink(4)}/>`;
  const headG = at(0, hy, hs, head);
  const backOver = pose === 'cheer' || pose === 'shock' || pose === 'fist' || pose === 'rifle';
  // 'none' legs is a bust (head and shoulders only, for windows and screens): no arms or shadow.
  const bust = o.legs === 'none';
  const shadow = bust ? '' : `<ellipse cx="0" cy="4" rx="${o.legs === 'kneel' ? 92 : 62}" ry="10" fill="#000" opacity=".18"/>`;
  const backArm = bust ? '' : arm(-1, back);
  const frontArm = bust ? '' : arm(1, front);
  const inner = backOver ? shadow + legs + neck + torso + headG + backArm + frontArm : shadow + backArm + legs + neck + torso + headG + frontArm;
  return at(x, y, s, inner, o.flip);
}
