/**
 * Cartoon faces shared by every character: big shiny eyes, brows and a mouth, drawn in head-local
 * coordinates (head centre at 0, 0, looking a little to the right in a three-quarter view).
 */
import { C, ink } from './base';

export type Expr =
  | 'smile'
  | 'grin'
  | 'happy'
  | 'shock'
  | 'yawn'
  | 'determined'
  | 'angry'
  | 'stern'
  | 'worried'
  | 'teary'
  | 'calm'
  | 'sleep';

const MOUTH_DARK = '#7a2630';

/**
 * A face. `k` scales the features (Jason 1, grown-ups ~0.85), `o` shifts them toward where the
 * head is turned, `brow` is the brow colour.
 */
export function face(e: Expr, k = 1, o = 4, brow = '#3b2416', blush = true, lite = false): string {
  const ex = [o - 16 * k, o + 17 * k];
  const ey = -2 * k;
  const my = 22 * k;
  const mx = o + 1;
  // Whole units are plenty at the size faces are drawn.
  const n = (v: number) => Math.round(v);
  let out = '';
  // Eyes: both drawn with one path per layer (whites, pupils, glints) to keep the markup small.
  const ell = (cx: number, cy: number, rx: number, ry: number) =>
    `M${n(cx - rx)} ${n(cy)}a${n(rx)} ${n(ry)} 0 1 0 ${n(2 * rx)} 0a${n(rx)} ${n(ry)} 0 1 0 ${n(-2 * rx)} 0`;
  if (e === 'happy' || e === 'sleep' || e === 'yawn') {
    const d = ex
      .map((x) => (e === 'happy' ? `M${n(x - 8 * k)} ${n(ey + 3 * k)}Q${n(x)} ${n(ey - 9 * k)} ${n(x + 8 * k)} ${n(ey + 3 * k)}` : `M${n(x - 8 * k)} ${n(ey)}Q${n(x)} ${n(ey + 7 * k)} ${n(x + 8 * k)} ${n(ey)}`))
      .join('');
    out += `<path d="${d}" fill="none" ${ink(4 * k)}/>`;
  } else {
    const big = e === 'shock' || e === 'worried';
    const ry = (big ? 13 : 11) * k;
    const rx = (big ? 9.5 : 8.5) * k;
    const pr = big ? 3.8 * k : 5.2 * k;
    // Lite (small, far-away faces): simple dark dot eyes with a glint.
    if (!lite) out += `<path d="${ex.map((x) => ell(x, ey, rx, ry)).join('')}" fill="#fff" ${ink(3 * k)}/>`;
    const pk = lite ? 1.35 : 1;
    out += `<path d="${ex.map((x) => ell(x + 1.8 * k, ey + 1.5 * k, pr * pk, pr * 1.3 * pk)).join('')}" fill="#1c1420"/>`;
    out += `<path d="${ex.map((x) => ell(x - 0.5 * k, ey - 2.5 * k, 2.2 * k, 2.2 * k)).join('')}" fill="#fff"/>`;
    if (e === 'stern' || e === 'angry') {
      // Heavy lids.
      out += `<path d="${ex.map((x) => `M${n(x - 10 * k)} ${n(ey - 4 * k)}Q${n(x)} ${n(ey - 15 * k)} ${n(x + 10 * k)} ${n(ey - 4 * k)}Z`).join('')}" fill="#000" opacity=".22"/>`;
    }
  }
  // Brows.
  const by = ey - 17 * k;
  const bw = 4.2 * k;
  const brows: Record<string, number[]> = {
    // [outer lift, inner lift] per brow: positive raises.
    angry: [4, -6],
    stern: [3, -4],
    determined: [2, -3],
    worried: [-2, 6],
    shock: [6, 6],
    teary: [-1, 4],
  };
  const [lo, li] = brows[e] ?? [2, 2];
  out += `<path d="M${n(ex[0] - 9 * k)} ${n(by - lo * k)}Q${n(ex[0])} ${n(by - 4 * k - (lo + li) * 0.5 * k)} ${n(ex[0] + 8 * k)} ${n(by - li * k)}M${n(ex[1] - 8 * k)} ${n(by - li * k)}Q${n(ex[1])} ${n(by - 4 * k - (lo + li) * 0.5 * k)} ${n(ex[1] + 9 * k)} ${n(by - lo * k)}" fill="none" stroke="${brow}" stroke-width="${n(bw)}" stroke-linecap="round"/>`;
  // Blush.
  if (blush) out += `<g fill="${C.pink}" opacity=".3"><ellipse cx="${n(ex[0] - 6 * k)}" cy="${n(ey + 17 * k)}" rx="${n(8 * k)}" ry="${n(4.5 * k)}"/><ellipse cx="${n(ex[1] + 7 * k)}" cy="${n(ey + 17 * k)}" rx="${n(8 * k)}" ry="${n(4.5 * k)}"/></g>`;
  // Mouth.
  const M = (d: string, fill = false) =>
    fill ? `<path d="${d}" fill="${MOUTH_DARK}" ${ink(3 * k)}/>` : `<path d="${d}" fill="none" ${ink(3.6 * k)}/>`;
  const p = (dx: number, dy: number) => `${n(mx + dx * k)} ${n(my + dy * k)}`;
  if (e === 'smile' || e === 'calm' || e === 'sleep') out += M(`M${p(-10, -1)}Q${p(1, e === 'calm' ? 5 : 8)} ${p(12, -1)}`);
  else if (e === 'teary') {
    out += M(`M${p(-11, -2)}Q${p(1, 9)} ${p(13, -2)}`);
    out += `<path d="M${n(ex[1] + 4 * k)} ${n(ey + 10 * k)}q${n(-5 * k)} ${n(9 * k)} 0 ${n(13 * k)}q${n(5 * k)} ${n(-4 * k)} 0 ${n(-13 * k)}Z" fill="${C.cyan}" ${ink(2 * k)}/>`;
  } else if (e === 'grin' || e === 'happy') {
    out += M(`M${p(-13, -3)}Q${p(1, 20)} ${p(15, -3)}Q${p(1, 1)} ${p(-13, -3)}Z`, true);
    out += `<path d="M${p(-10, -1.6)}Q${p(1, 2)} ${p(12, -1.6)}" fill="none" stroke="#fff" stroke-width="${n(3 * k)}" stroke-linecap="round"/>`;
  } else if (e === 'shock' || e === 'worried') out += `<ellipse cx="${n(mx)}" cy="${n(my + 2 * k)}" rx="${n(6 * k)}" ry="${n((e === 'shock' ? 8 : 5) * k)}" fill="${MOUTH_DARK}" ${ink(3 * k)}/>`;
  else if (e === 'yawn') out += `<ellipse cx="${n(mx)}" cy="${n(my + 3 * k)}" rx="${n(10 * k)}" ry="${n(13 * k)}" fill="${MOUTH_DARK}" ${ink(3 * k)}/>`;
  else if (e === 'determined') out += M(`M${p(-8, 1)}Q${p(2, 4)} ${p(12, -1)}`);
  else out += M(`M${p(-10, 4)}Q${p(1, -4)} ${p(12, 4)}`);
  return out;
}
