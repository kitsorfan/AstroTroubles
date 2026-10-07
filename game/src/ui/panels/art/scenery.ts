/**
 * Shared scenery for the Gaia Nova panels: wild jungle layers, and the warm sepia wash and photo
 * edge that mark the flashbacks to forty years ago.
 */
import { H, leaf, lin, r1, rad, rng, W } from '../kit';

/** A big jungle leaf (monstera-like), pointing along `rot` from its base (the shared `#sbBl`). */
export const bigLeaf = (x: number, y: number, s: number, rot: number, color: string) =>
  `<use href="#sbBl" transform="translate(${r1(x)} ${r1(y)}) scale(${r1(s * 100) / 100}) rotate(${Math.round(rot)})" fill="${color}"/>`;

/**
 * Layered jungle: misty light at the back, tall trunks with hanging vines, and huge leaves. `tone`
 * picks the colours ([far, mid, near]).
 */
export function jungle(id: string, seed: number, tone: [string, string, string], groundY = 760): string {
  const rand = rng(seed);
  let out = `<defs>${lin(id + 'j', [[0, tone[0]], [1, tone[1]]])}${rad(id + 'q', [[0, '#fff6d0', 0.55], [1, '#fff6d0', 0]])}</defs>
    <rect width="${W}" height="${H}" fill="url(#${id}j)"/><ellipse cx="${W / 2}" cy="${groundY - 200}" rx="700" ry="360" fill="url(#${id}q)"/>`;
  // Far trunks.
  for (let i = 0; i < 7; i++) {
    const x = r1(60 + i * 240 + rand() * 80);
    const w = r1(40 + rand() * 40);
    out += `<rect x="${x}" y="-20" width="${w}" height="${groundY + 40}" fill="${tone[1]}" opacity=".7"/>`;
    out += `<path d="M${x + w / 2} -10Q${x + w / 2 + 40} ${r1(groundY * 0.3)} ${x + w / 2 - 10} ${r1(groundY * (0.4 + rand() * 0.3))}" fill="none" stroke="${tone[2]}" stroke-width="6" opacity=".6"/>`;
  }
  // Leaves along the top (the canopy).
  for (let i = 0; i < 9; i++) out += bigLeaf(r1(-60 + i * 200 + rand() * 60), r1(-30 + rand() * 40), 0.9 + rand() * 0.5, 40 + rand() * 100, tone[2]);
  // The ground.
  out += `<path d="M0 ${groundY}Q400 ${groundY - 30} 800 ${groundY}T1600 ${groundY}V${H}H0Z" fill="${tone[2]}"/>`;
  return out;
}

/** Ground ferns and bushes along the bottom edge, framing the picture. */
export function undergrowth(seed: number, y: number, color: string, light: string): string {
  const rand = rng(seed);
  let out = '';
  for (let i = 0; i < 10; i++) {
    const x = r1(-40 + i * 175 + rand() * 40);
    const c = i % 3 ? color : light;
    out += leaf(x, y + 20, 1.6 + rand(), -150 + rand() * 60, c) + leaf(x, y + 20, 1.4 + rand(), -60 - rand() * 50, c);
  }
  return out;
}

/** The flashback look: a warm sepia wash, a brown vignette and a soft photo edge. */
export function sepia(id: string, strength = 0.28): string {
  return `<defs>${rad(id + 'z', [[0.5, '#3a2210', 0], [1, '#3a2210', 0.7]])}</defs>
    <rect width="${W}" height="${H}" fill="#c08a50" opacity="${strength}"/><rect width="${W}" height="${H}" fill="url(#${id}z)"/>
    <rect x="14" y="14" width="${W - 28}" height="${H - 28}" rx="26" fill="none" stroke="#f3e2c0" stroke-width="16" opacity=".85"/>`;
}
