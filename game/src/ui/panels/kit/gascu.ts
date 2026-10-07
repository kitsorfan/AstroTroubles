/**
 * GaScu, the glowing space plant, in all its shapes (seed-comet, the Heart, a happy bloom, a sprout
 * in a pot, the giant flower of Gaia Nova), plus the leaves, vines, flowers and sparkles around it.
 * Shapes with gradients take an `id` prefix so their ids stay unique on the page.
 */
import { at, C, glow, glowDef, ink, limb, lin, r1, rad, smooth } from './base';

export const VINE = '#3f7a3a';
export const LEAF = '#5f9a3a';
export const LEAF_LIGHT = '#86b84e';

/** A four-pointed twinkle. */
export const sparkle = (x: number, y: number, r: number, color: string = '#fff', op = 1) =>
  `<path d="M${r1(x)} ${r1(y - r)}Q${r1(x + r * 0.15)} ${r1(y - r * 0.15)} ${r1(x + r)} ${r1(y)}Q${r1(x + r * 0.15)} ${r1(y + r * 0.15)} ${r1(x)} ${r1(y + r)}Q${r1(x - r * 0.15)} ${r1(y + r * 0.15)} ${r1(x - r)} ${r1(y)}Q${r1(x - r * 0.15)} ${r1(y - r * 0.15)} ${r1(x)} ${r1(y - r)}Z" fill="${color}"${op < 1 ? ` opacity="${op}"` : ''}/>`;

/** A leaf pointing along `rot` degrees, base at (x, y). */
export const leaf = (x: number, y: number, s: number, rot: number, color: string = LEAF, outline = 4) =>
  outline === 4
    ? `<use href="#sbLf" transform="translate(${r1(x)} ${r1(y)}) scale(${r1(s * 100) / 100}) rotate(${Math.round(rot)})" fill="${color}"/>`
    : at(x, y, s, `<path d="M0 0Q30 -28 76 0Q30 28 0 0Z" fill="${color}" ${ink(outline)}/><path d="M6 0Q36 -4 64 0" fill="none" stroke="#fff" stroke-width="3" opacity=".3" stroke-linecap="round"/>`, false, rot);

/** A simple five-petal flower. */
export function flower(x: number, y: number, r: number, color: string, center: string = C.gold, outline = 3): string {
  if (outline === 3) return `<use href="#sbFl" transform="translate(${r1(x)} ${r1(y)}) scale(${r1((r / 20) * 100) / 100})" fill="${color}" color="${center}"/>`;
  let p = '';
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
    p += `<circle cx="${r1(x + Math.cos(a) * r * 0.62)}" cy="${r1(y + Math.sin(a) * r * 0.62)}" r="${r1(r * 0.48)}"/>`;
  }
  return `<g fill="${color}" ${ink(outline)}>${p}</g><circle cx="${r1(x)}" cy="${r1(y)}" r="${r1(r * 0.36)}" fill="${center}" ${ink(outline)}/>`;
}

/** A curly vine along points with leaves every so often. */
export function vine(pts: number[][], w: number, leaves = true, color = VINE, glowColor = ''): string {
  const d = smooth(pts);
  let out = glowColor
    ? `<g class="sbL" stroke="${glowColor}"><path d="${d}" stroke-width="${w * 4.5}" opacity=".08"/><path d="${d}" stroke-width="${w * 3}" opacity=".12"/><path d="${d}" stroke-width="${w * 1.9}" opacity=".2"/></g>`
    : '';
  out += limb(pts, color, w, 5, true);
  if (leaves) {
    for (let i = 1; i < pts.length; i++) {
      const [x, y] = pts[i];
      const a = (Math.atan2(pts[i][1] - pts[i - 1][1], pts[i][0] - pts[i - 1][0]) * 180) / Math.PI;
      out += leaf(x, y, w / 20, a + (i % 2 ? -60 : 60), i % 3 ? LEAF : LEAF_LIGHT);
    }
  }
  return out;
}

/** GaScu as a seed-comet, flying toward `rot` degrees, with a long pink tail behind it. */
export function gascuSeed(id: string, x: number, y: number, s: number, rot = 0, tail = 620): string {
  const defs = `<defs>${glowDef(id + 'g', C.pink)}${lin(id + 't', [[0, C.pink, 0], [0.7, C.pink, 0.55], [1, '#ffd6f2', 0.95]], 1, 0)}${rad(id + 'o', [[0, '#fff'], [0.45, '#ffd6f2'], [1, C.pink]], 0.4, 0.38)}</defs>`;
  const body = `${glow(id + 'g', 0, 0, 170)}
    <path d="M0 -40Q${-tail * 0.5} -46 ${-tail} 0Q${-tail * 0.5} 46 0 40Z" fill="url(#${id}t)"/>
    <path d="M0 -16Q${-tail * 0.4} -12 ${-tail * 0.8} 0Q${-tail * 0.4} 12 0 16Z" fill="url(#${id}t)"/>
    <circle r="40" fill="url(#${id}o)" stroke="#b02a86" stroke-width="5"/>
    <ellipse cx="-12" cy="-14" rx="12" ry="7" fill="#fff" opacity=".8" transform="rotate(-30 -12 -14)"/>
    ${sparkle(-tail * 0.3, -50, 14)}${sparkle(-tail * 0.55, 36, 10, C.pinkLight)}${sparkle(-tail * 0.75, -22, 8)}`;
  return defs + at(x, y, s, body, false, rot);
}

/**
 * GaScu as the Heart: a huge glowing bulb in a ring of dark petals, wrapped in vines. `tint`
 * recolours its light (gold when it says "together").
 */
export function gascuHeart(id: string, x: number, y: number, s: number, tint: string = C.pink, vines = true): string {
  const light = tint === C.pink ? '#ffd6f2' : '#fff2c4';
  const deep = tint === C.pink ? '#c2389a' : '#e09a20';
  const defs = `<defs>${glowDef(id + 'g', tint, 0.8)}${rad(id + 'b', [[0, '#fff'], [0.35, light], [0.75, tint], [1, deep]], 0.42, 0.36, 0.62)}</defs>`;
  let v = '';
  if (vines) {
    v += vine([[-60, 60], [-220, 120], [-330, 60], [-470, 140], [-560, 100]], 30);
    v += vine([[60, 60], [230, 130], [340, 70], [480, 150], [580, 110]], 30);
    v += vine([[-80, -40], [-240, -160], [-380, -120], [-460, -240]], 24);
    v += vine([[80, -40], [250, -170], [390, -110], [470, -230]], 24);
    v += vine([[-30, 120], [-120, 260], [-60, 340]], 26);
    v += vine([[30, 120], [140, 250], [90, 340]], 26);
  }
  let petals = `<g color="${tint}">`;
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * 360 + 22.5;
    petals += `<use href="#sbPt" transform="rotate(${a})"/>`;
  }
  petals += '</g>';
  const bulb = `<ellipse cx="0" cy="0" rx="118" ry="134" fill="url(#${id}b)" ${ink(6)}/>
    <path d="M-60 -70Q-20 -110 30 -96M-80 10Q-70 -40 -40 -60" fill="none" stroke="#fff" stroke-width="8" opacity=".7" stroke-linecap="round"/>
    <path d="M-40 60Q0 90 50 50" fill="none" stroke="${deep}" stroke-width="6" opacity=".5" stroke-linecap="round"/>`;
  return defs + at(x, y, s, glow(id + 'g', 0, 0, 420) + v + petals + bulb);
}

/** GaScu as a happy blooming flower (blue, gold, pink and green petals around a glowing heart). */
export function gascuBloom(id: string, x: number, y: number, s: number, stem = 220): string {
  const defs = `<defs>${glowDef(id + 'g', C.gold, 0.7)}${rad(id + 'c', [[0, '#fff'], [0.5, '#ffe6a0'], [1, C.pink]], 0.42, 0.38)}</defs>`;
  const cols = [C.hello, C.gold, C.pink, '#7dff9a'];
  let petals = '';
  for (let i = 0; i < 8; i++) {
    petals += `<use href="#sbBp" transform="rotate(${i * 45})" fill="${cols[i % 4]}"/>`;
  }
  const body = `${glow(id + 'g', 0, 0, 320)}${limb([[0, stem], [-20, stem * 0.5], [0, 40]], VINE, 26, 5, true)}
    ${leaf(-12, stem * 0.6, 1.6, 200)}${leaf(-6, stem * 0.75, 1.4, -20, LEAF_LIGHT)}
    ${petals}<circle r="52" fill="url(#${id}c)" ${ink(6)}/><ellipse cx="-16" cy="-18" rx="14" ry="9" fill="#fff" opacity=".8"/>`;
  return defs + at(x, y, s, body);
}

/** A tiny glowing GaScu sprout in a flower pot (pot bottom at x, y). */
export function gascuSprout(id: string, x: number, y: number, s: number): string {
  const defs = `<defs>${glowDef(id + 'g', C.pink)}</defs>`;
  const body = `${glow(id + 'g', 0, -150, 110)}
    ${limb([[0, -90], [-8, -120], [0, -150]], VINE, 10, 4, true)}
    ${leaf(-4, -112, 0.7, 200)}${leaf(2, -124, 0.7, -25, LEAF_LIGHT)}
    <circle cx="0" cy="-158" r="17" fill="${C.pink}" ${ink(4)}/><circle cx="-5" cy="-163" r="6" fill="#fff" opacity=".85"/>
    <path d="M-54 -92H54L40 0H-40Z" fill="#d0683c" ${ink(5)}/><rect x="-62" y="-104" width="124" height="24" rx="8" fill="#e07a48" ${ink(5)}/>
    <path d="M20 -78L12 -6" stroke="#000" stroke-width="10" opacity=".12"/>`;
  return defs + at(x, y, s, body);
}

/**
 * GaScu on Gaia Nova forty years ago: the giant heart of all the flora, a towering glowing bulb on
 * a thick stem with huge leaves (base at x, y).
 */
export function gascuGiant(id: string, x: number, y: number, s: number): string {
  const body = `${limb([[0, 0], [-40, -180], [20, -360], [0, -470]], VINE, 70, 6, true)}
    ${leaf(-30, -120, 3.6, 200)}${leaf(-10, -200, 3.2, -30, LEAF_LIGHT)}${leaf(20, -320, 2.6, 210, LEAF_LIGHT)}${leaf(10, -380, 2.4, -20)}`;
  return at(x, y, s, body) + gascuHeart(id, x, y - 560 * s, s * 0.9, C.pink, false);
}
