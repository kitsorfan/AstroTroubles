/**
 * The heroes: Jason (orange space suit, white helmet, blaster on his right arm) and LUX (a small
 * white robot sphere with one big cyan eye). Both are drawn around their own origin and placed with
 * `at(...)`: Jason stands with his feet at (0, 0) and is about 260 units tall at scale 1; LUX is
 * centred on (0, 0) with a body radius of 40.
 */
import { at, C, ink, limb, r1 } from './base';
import { face, type Expr } from './face';

export type Pose = 'stand' | 'cheer' | 'wave' | 'point' | 'shock' | 'torch' | 'rub' | 'plant' | 'reach' | 'hold';
export type Legs = 'stand' | 'kneel' | 'run' | 'none';

const SUIT = C.orange;
const SUIT_DARK = '#c85a1e';
const LIGHT = '#e9edf3';
const LIGHT_DARK = '#b9c2d2';
const SKIN = '#d6a07a';
const HAIR = '#3b2416';

/** Arm poses: [elbow, hand] for the back arm (left of the picture) and the front arm. */
const ARMS: Record<Pose, [number[][], number[][]]> = {
  stand: [[[-56, -88], [-60, -58]], [[56, -88], [62, -58]]],
  cheer: [[[-74, -150], [-88, -198]], [[74, -150], [90, -198]]],
  wave: [[[-56, -88], [-60, -58]], [[80, -136], [92, -186]]],
  point: [[[-56, -88], [-60, -58]], [[92, -124], [142, -132]]],
  shock: [[[-80, -112], [-92, -152]], [[80, -112], [92, -152]]],
  torch: [[[-56, -88], [-60, -58]], [[74, -100], [118, -108]]],
  rub: [[[-60, -146], [-26, -178]], [[64, -170], [78, -232]]],
  plant: [[[-30, -82], [6, -46]], [[60, -84], [74, -40]]],
  reach: [[[-56, -88], [-60, -58]], [[84, -140], [130, -170]]],
  hold: [[[-50, -86], [-20, -70]], [[50, -86], [20, -70]]],
};

/** A gloved hand. */
const hand = (p: number[]) => `<circle cx="${r1(p[0])}" cy="${r1(p[1])}" r="14" fill="${LIGHT}" ${ink(5)}/>`;

/** The chunky grey blaster strapped along a forearm. */
function blaster(e: number[], h: number[]): string {
  const a = (Math.atan2(h[1] - e[1], h[0] - e[0]) * 180) / Math.PI;
  const x = e[0] + (h[0] - e[0]) * 0.55;
  const y = e[1] + (h[1] - e[1]) * 0.55;
  return at(
    x,
    y,
    1,
    `<rect x="-26" y="-17" width="56" height="34" rx="12" fill="#8a93a6" ${ink(5)}/><rect x="-18" y="-17" width="30" height="10" rx="4" fill="#b8c0ce"/>
    <rect x="26" y="-10" width="14" height="20" rx="5" fill="#4a5262" ${ink(4)}/><circle cx="-8" cy="6" r="4" fill="${C.cyan}"/>`,
    false,
    r1(a),
  );
}

/** A small flashlight in the hand (for dark rooms). */
function torch(e: number[], h: number[]): string {
  const a = (Math.atan2(h[1] - e[1], h[0] - e[0]) * 180) / Math.PI;
  return at(h[0], h[1], 1, `<rect x="-6" y="-10" width="40" height="20" rx="5" fill="#5a6274" ${ink(4)}/><rect x="30" y="-13" width="10" height="26" rx="3" fill="#fff6c8" ${ink(4)}/>`, false, r1(a));
}

/** Jason's head (local coordinates, centred). With `helmet: false` his messy hair sticks up. */
export function jasonHead(e: Expr, helmet = true): string {
  const features = face(e, 1, 5, HAIR);
  if (!helmet) {
    return `<path d="M-46 -20Q-62 -40 -40 -44Q-48 -70 -18 -62Q-10 -88 12 -66Q30 -84 40 -58Q66 -62 52 -36Q64 -24 50 -10Z" fill="${HAIR}" ${ink(5)}/>
      <ellipse cx="-46" cy="6" rx="10" ry="14" fill="${SKIN}" ${ink(5)}/>
      <ellipse cx="3" cy="4" rx="48" ry="47" fill="${SKIN}" ${ink(6)}/>
      <path d="M-46 -4Q-50 -44 -8 -46Q34 -52 50 -12Q40 -22 32 -14Q26 -30 12 -22Q4 -36 -10 -24Q-22 -34 -30 -18Q-40 -20 -46 -4Z" fill="${HAIR}"/>
      <path d="M-20 -60L-28 -84L-8 -64M18 -64L22 -92L32 -62" fill="${HAIR}" ${ink(4)}/>${features}`;
  }
  return `<circle cx="0" cy="-4" r="66" fill="#f4f6fb" ${ink(6)}/>
    <path d="M60 -26Q70 26 30 54Q-10 70 -44 46Q10 58 40 26Q58 4 60 -26Z" fill="${LIGHT_DARK}" opacity=".7"/>
    <circle cx="-58" cy="6" r="15" fill="${LIGHT}" ${ink(4)}/>
    <path d="M40 -60L56 -94" ${ink(10)}/><path d="M40 -60L56 -94" stroke="#9aa6ba" stroke-width="4" stroke-linecap="round"/>
    <circle cx="57" cy="-97" r="15" fill="#ff4a5a" opacity=".3"/><circle cx="57" cy="-97" r="8" fill="#ff4a5a" ${ink(3)}/>
    <ellipse cx="5" cy="5" rx="47" ry="45" fill="${SKIN}"/>
    <path d="M-41 -6Q-44 -40 -8 -42Q30 -46 50 -10Q40 -20 32 -12Q26 -28 14 -20Q6 -34 -8 -22Q-18 -32 -27 -16Q-36 -20 -41 -6Z" fill="${HAIR}"/>
    ${features}
    <ellipse cx="5" cy="5" rx="47" ry="45" fill="${C.cyan}" opacity=".08"/>
    <ellipse cx="5" cy="5" rx="49" ry="47" fill="none" stroke="#cfd6e2" stroke-width="7"/>
    <ellipse cx="5" cy="5" rx="53" ry="51" fill="none" ${ink(3)}/>
    <path d="M-28 -30Q4 -52 36 -32" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".75"/>`;
}

export interface JasonOpts {
  pose?: Pose;
  legs?: Legs;
  face?: Expr;
  helmet?: boolean;
  flip?: boolean;
  /** Draw the blaster on the front arm (default yes, unless he holds a flashlight). */
  blaster?: boolean;
}

/** Jason, feet at (x, y). */
export function jason(x: number, y: number, s: number, o: JasonOpts = {}): string {
  const pose = o.pose ?? 'stand';
  const legs = o.legs ?? 'stand';
  const [back, front] = ARMS[pose];
  const dy = legs === 'kneel' ? 40 : 0;
  const sh = (p: number[]) => [p[0], p[1] + dy];
  const arm = (side: number, pts: number[][]) => limb([[side * 40, -118 + dy], sh(pts[0]), sh(pts[1])], SUIT, 24, 6);
  let legsSvg = '';
  const boot = (p: number[], dir = 1) =>
    `<path d="M${p[0] - 18 * dir} ${p[1] + 2}Q${p[0] - 20 * dir} ${p[1] - 26} ${p[0]} ${p[1] - 26}Q${p[0] + 26 * dir} ${p[1] - 24} ${p[0] + 26 * dir} ${p[1] + 2}Z" fill="${LIGHT}" ${ink(5)}/>`;
  if (legs === 'stand' || legs === 'run') {
    const lf = legs === 'run' ? [-48, -6] : [-24, -16];
    const rf = legs === 'run' ? [36, -30] : [24, -16];
    legsSvg = limb([[-20, -64], lf], SUIT, 30) + limb([[20, -64], rf], SUIT, 30) + boot([lf[0], lf[1] + 16]) + boot([rf[0], rf[1] + 16]);
  } else if (legs === 'kneel') {
    legsSvg =
      limb([[-20, -24], [-34, -6], [-76, -8]], SUIT, 30) +
      limb([[22, -24], [58, -36], [60, -16]], SUIT, 30) +
      boot([-90, 2], -1) +
      boot([62, 2]);
  }
  const body = `<path d="M-46 ${-60 + dy}Q-52 ${-132 + dy} 0 ${-134 + dy}Q52 ${-132 + dy} 46 ${-60 + dy}Q42 ${-44 + dy} 0 ${-44 + dy}Q-42 ${-44 + dy} -46 ${-60 + dy}Z" fill="${SUIT}" ${ink(6)}/>
    <path d="M30 ${-122 + dy}Q48 ${-96 + dy} 40 ${-56 + dy}Q20 ${-48 + dy} -6 ${-48 + dy}Q30 ${-70 + dy} 30 ${-122 + dy}Z" fill="${SUIT_DARK}" opacity=".45"/>
    <path d="M-44 ${-68 + dy}Q0 ${-56 + dy} 44 ${-68 + dy}" fill="none" stroke="#5a6274" stroke-width="9"/>
    <rect x="4" y="${-112 + dy}" width="26" height="18" rx="4" fill="#1b2330" ${ink(3)}/><circle cx="12" cy="${-103 + dy}" r="4" fill="${C.cyan}"/><circle cx="23" cy="${-103 + dy}" r="3" fill="${C.gold}"/>
    <path d="M-38 ${-82 + dy}Q-30 ${-120 + dy} -10 ${-126 + dy}" fill="none" stroke="#ffc59a" stroke-width="5" stroke-linecap="round" opacity=".6"/>
    <ellipse cx="0" cy="${-134 + dy}" rx="36" ry="12" fill="${LIGHT}" ${ink(5)}/>`;
  const head = at(0, -192 + dy, 1, jasonHead(o.face ?? 'smile', o.helmet ?? true));
  const useBlaster = (o.blaster ?? true) && pose !== 'torch';
  const frontArm =
    arm(1, front) + hand(sh(front[1])) + (pose === 'torch' ? torch(sh(front[0]), sh(front[1])) : useBlaster ? blaster(sh(front[0]), sh(front[1])) : '');
  const backArm = arm(-1, back) + hand(sh(back[1]));
  const backOver = pose === 'rub' || pose === 'cheer' || pose === 'shock';
  const shadow = `<ellipse cx="0" cy="4" rx="${legs === 'kneel' ? 90 : 60}" ry="10" fill="#000" opacity=".18"/>`;
  const inner = backOver
    ? shadow + legsSvg + body + head + backArm + frontArm
    : shadow + backArm + legsSvg + body + head + frontArm;
  return at(x, y, s, inner, o.flip);
}

export type LuxMood = 'normal' | 'happy' | 'scared' | 'glow';

/** LUX, centred at (x, y). `iris` recolours its eye (for its light-words). */
export function lux(x: number, y: number, s: number, mood: LuxMood = 'normal', iris: string = C.cyan, flip = false): string {
  let eye = `<circle cx="6" cy="-4" r="23" fill="#0c131e" ${ink(3)}/>`;
  if (mood === 'happy') {
    eye += `<path d="M-6 2Q6 -18 18 2" fill="none" stroke="${iris}" stroke-width="8" stroke-linecap="round"/>`;
  } else {
    const ir = mood === 'scared' ? 9 : mood === 'glow' ? 17 : 15;
    eye += `<circle cx="6" cy="-4" r="${ir}" fill="${iris}"/><circle cx="${mood === 'scared' ? 4 : 8}" cy="-3" r="${mood === 'scared' ? 3.5 : 6}" fill="#062536"/><circle cx="1" cy="-10" r="4" fill="#fff" opacity=".9"/>`;
  }
  const extra =
    mood === 'scared'
      ? `<path d="M-58 -30q6 -8 0 -16M-66 -18q6 -8 0 -16M60 -40q-6 -8 0 -16" fill="none" stroke="${C.cyan}" stroke-width="3" stroke-linecap="round" opacity=".7"/><path d="M34 -40q6 10 0 14q-6 -4 0 -14Z" fill="${C.cyan}" ${ink(2)}/>`
      : '';
  const body = `<ellipse cx="0" cy="62" rx="34" ry="7" fill="#000" opacity=".12"/>
    <path d="M-44 20q-4 14 2 26M44 20q4 14 -2 26" fill="none" stroke="${C.cyan}" stroke-width="7" stroke-linecap="round" opacity=".55"/>
    <circle cx="-44" cy="6" r="13" fill="#9aa6ba" ${ink(4)}/><circle cx="44" cy="6" r="13" fill="#9aa6ba" ${ink(4)}/>
    <path d="M10 -38L20 -70" ${ink(9)}/><path d="M10 -38L20 -70" stroke="#9aa6ba" stroke-width="3.5" stroke-linecap="round"/>
    <circle cx="21" cy="-74" r="14" fill="#ff4a5a" opacity=".25"/><circle cx="21" cy="-74" r="8" fill="#ff4a5a" ${ink(3)}/>
    <circle cx="0" cy="0" r="40" fill="#f2f5fa" ${ink(6)}/>
    <path d="M30 -24Q46 8 22 32Q-2 46 -28 30Q10 34 26 10Q34 -6 30 -24Z" fill="${LIGHT_DARK}" opacity=".8"/>
    <path d="M-37 14Q0 34 37 14" fill="none" stroke="#7b8699" stroke-width="5"/>
    <ellipse cx="-20" cy="-22" rx="10" ry="6" fill="#fff" transform="rotate(-35 -20 -22)"/>
    ${eye}${extra}`;
  return at(x, y, s, body, flip);
}
