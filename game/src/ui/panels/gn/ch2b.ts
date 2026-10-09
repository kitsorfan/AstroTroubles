/**
 * Graphic-novel pieces for the end of chapter 2: the Colossus (General Brennus's giant war machine),
 * Celestia (caged in its chest, and blooming free), little Brennus and his grandmother in her greenhouse
 * on Mars, Dr. Hypatia, the colony shuttles and a Green Legion robot. Built from the kit's marks and
 * `figure`, like the cast in cast.ts.
 */
import { add, at, dir, dPoly, dSmooth, INK, lerp, mul, type P, type Pen, perp, r1, sub, unit } from './core';
import { type Pose, rig, STOCKY } from './body';
import { brennus } from './cast';

/** A filled circle path (for `Pen.form`). */
export const circleD = (x: number, y: number, r: number) => `M${r1(x - r)} ${r1(y)}A${r1(r)} ${r1(r)} 0 1 0 ${r1(x + r)} ${r1(y)}A${r1(r)} ${r1(r)} 0 1 0 ${r1(x - r)} ${r1(y)}Z`;

/* ---------------- Celestia ---------------- */

const PINK = '#ff6fcf';
const PINK_LIGHT = '#ffd6f2';

/**
 * Celestia as a bulb of light in a ring of petals, centred at (x, y), `r` the bulb's radius. `tint` is
 * her light (pink, or gold when she says "together"); `droop` folds the petals in (0 open .. 1 shut).
 */
export function celestiaBulb(pen: Pen, x: number, y: number, r: number, o: { tint?: string; light?: string; deep?: string; droop?: number; petals?: string[] } = {}): string {
  const tint = o.tint ?? PINK;
  const light = o.light ?? PINK_LIGHT;
  const deep = o.deep ?? '#b02a86';
  const droop = o.droop ?? 0;
  const cols = o.petals ?? ['#7a2a6a'];
  let out = pen.glow(x, y, r * 3.2, tint, 0.65);
  // Petals all round, behind the bulb.
  for (let i = 0; i < 8; i++) {
    const a = i * 45 + 22.5;
    const len = r * (1.75 - droop * 0.5);
    const w = r * 0.55;
    const d = dir(a);
    const n = perp(d);
    const base: P = [x, y];
    const tip = add(base, mul(d, len));
    const bend = mul(n, w * droop * 0.6);
    const pts: P[] = [add(base, mul(n, w * 0.45)), add(add(base, mul(d, len * 0.55)), add(mul(n, w), bend)), add(tip, bend), add(add(base, mul(d, len * 0.55)), add(mul(n, -w), bend)), add(base, mul(n, -w * 0.45))];
    out += pen.form(dSmooth(pts), cols[i % cols.length], { sh: w * 0.5, hatch: 1, line: 2.4, rim: 1.6, inner: pen.brush([base, add(base, mul(d, len * 0.5)), add(tip, mul(d, -len * 0.18))], 2.2, INK, [0.2, 0.6], 0.5) });
  }
  const fill = pen.rad(
    [
      [0, '#ffffff'],
      [0.35, light],
      [0.75, tint],
      [1, deep],
    ],
    0.42,
    0.36,
    0.62,
  );
  out += pen.form(`M${r1(x - r * 0.9)} ${r1(y)}A${r1(r * 0.9)} ${r1(r)} 0 1 0 ${r1(x + r * 0.9)} ${r1(y)}A${r1(r * 0.9)} ${r1(r)} 0 1 0 ${r1(x - r * 0.9)} ${r1(y)}Z`, tint, {
    line: 2.6,
    paint: fill,
    inner: pen.brush([[x - r * 0.5, y - r * 0.5], [x - r * 0.1, y - r * 0.82], [x + r * 0.3, y - r * 0.74]], r * 0.12, '#ffffff', [0.3, 0.3], 0.8),
  });
  return out + pen.glow(x, y, r * 1.1, '#ffffff', 0.45);
}

/* ---------------- the Colossus ---------------- */

const OL = '#5c6c3a';
const OL_DARK = '#34401e';
const BRASS = '#c09a52';
const RED = '#c8282e';

/** Brennus's red gear emblem (centred, radius r), drawn flat into a plate. */
function gearMark(x: number, y: number, r: number): string {
  let teeth = '';
  for (let i = 0; i < 8; i++) teeth += `<rect x="${r1(-r * 0.2)}" y="${r1(-r * 1.18)}" width="${r1(r * 0.4)}" height="${r1(r * 0.4)}" transform="rotate(${i * 45})"/>`;
  return `<g transform="translate(${r1(x)} ${r1(y)})" fill="${RED}" stroke="${INK}" stroke-width="2">${teeth}<circle r="${r1(r * 0.86)}"/><circle r="${r1(r * 0.34)}" fill="${OL_DARK}"/></g>`;
}

/** A row of rivets along a line. */
function rivets(a: P, b: P, n: number, rr = 4.5): string {
  let out = '';
  for (let i = 0; i < n; i++) {
    const p = lerp(a, b, n > 1 ? i / (n - 1) : 0.5);
    out += `<circle cx="${r1(p[0])}" cy="${r1(p[1])}" r="${rr}"/>`;
  }
  return `<g fill="${INK}" opacity=".6">${out}</g>`;
}

/** A thick armoured limb from a to b (w0 wide at a, w1 at b), in olive plates with a seam and rivets. */
function armour(pen: Pen, a: P, b: P, w0: number, w1: number, color = OL): string {
  const d = unit(sub(b, a));
  const n = perp(d);
  const ed = (t: number, k: number): P => add(lerp(a, b, t), mul(n, ((w0 + (w1 - w0) * t) / 2) * k));
  const pts: P[] = [ed(0, 1), ed(0.5, 1.06), ed(1, 1), ed(1, -1), ed(0.5, -1.06), ed(0, -1)];
  const inner = `<path d="${dPoly([ed(0.18, 1.2), ed(0.18, -1.2)], false)}${dPoly([ed(0.82, 1.2), ed(0.82, -1.2)], false)}" stroke="${INK}" stroke-width="3" opacity=".6"/>` + rivets(ed(0.3, 0.55), ed(0.3, -0.55), 3) + rivets(ed(0.7, 0.55), ed(0.7, -0.55), 3);
  return pen.form(dPoly(pts), color, { sh: Math.max(w0, w1) * 0.6, hatch: 2, line: 3, rim: 2.4, axis: sub(b, a), inner, warm: 0.3, shade: pen.dark(color, 0.42) });
}

/** A brass ball joint. */
function joint(pen: Pen, p: P, r: number): string {
  return pen.form(circleD(p[0], p[1], r), BRASS, { sh: r * 0.6, hatch: 1, line: 3, rim: 2.2, inner: `<circle cx="${r1(p[0])}" cy="${r1(p[1])}" r="${r1(r * 0.35)}" fill="${INK}" opacity=".55"/>` });
}

export interface ColossusOpts {
  /** The pilot drawn in the cockpit dome (its own markup, in the Colossus's coordinates). */
  pilot?: string;
  /** Where the cannon arm points (degrees, as `dir` measures them; default -40 = down and to the left). */
  aim?: number;
  /** Tilt (degrees, clockwise; negative leans it to the left). */
  rot?: number;
}

/**
 * THE COLOSSUS: Brennus's giant olive war machine. A barrel chest on thick legs, round pauldrons with
 * his red gear, a brass arm cannon on the left and a three-fingered claw raised on the right, a visor
 * with two red eye-slits, a glass cockpit dome on top (with `pilot` in it), and in its chest a barred
 * glass cage with Celestia glowing inside. Origin at the waist; the dome's top is about 690 above it.
 */
export function colossus(pen: Pen, x: number, y: number, s: number, o: ColossusOpts = {}): string {
  const lp = pen.local(false, o.rot ?? 0);
  let back = '';
  let out = '';
  // The claw arm, raised (behind the body: its shoulder is on the far side).
  const shR: P = [262, -360];
  const elR: P = [430, -420];
  const wrR: P = [452, -600];
  back += armour(lp, shR, elR, 112, 96) + joint(lp, elR, 52) + armour(lp, elR, wrR, 96, 84);
  // The claw: a brass wrist and three hooked steel fingers, spread open.
  const cl = (a: number, l: number): [P[], number] => {
    const d0 = dir(a);
    const base = add(wrR, mul(d0, 40));
    return [[base, add(base, mul(dir(a + 8), l * 0.55)), add(base, add(mul(dir(a + 22), l), mul(perp(d0), -l * 0.1)))], 30];
  };
  const fingers = [cl(150, 130), cl(185, 140), cl(215, 120)];
  back += lp.brushes(fingers, INK, [0.05, 0.85]) + lp.brushes(fingers.map(([p, w]) => [p, w * 0.62] as [P[], number]), '#8a8a90', [0.05, 0.85]) + lp.brushes(fingers.map(([p]) => [p.map((q) => add(q, [-5, 2])), 5] as [P[], number]), lp.light.rimColor, [0.2, 0.7], 0.8);
  back += lp.form(dPoly([add(wrR, [-46, 10]), add(wrR, [46, 4]), add(wrR, [52, -46]), add(wrR, [-50, -40])]), BRASS, { sh: 26, hatch: 2, line: 3, rim: 2.4, inner: `<circle cx="${wrR[0]}" cy="${wrR[1] - 18}" r="7" fill="#ff3a4c"/>` }) + lp.glow(wrR[0], wrR[1] - 18, 20, '#ff3a4c', 0.8);
  // Hips and the tops of the legs, wading into the lava.
  out += armour(lp, [-130, 40], [-150, 330], 170, 150, OL_DARK) + armour(lp, [130, 40], [150, 330], 170, 150, OL_DARK);
  out += lp.form('M-190 -10H190L170 90Q0 120 -170 90Z', OL_DARK, { sh: 50, hatch: 2, line: 3.2, rim: 2.4, inner: rivets([-150, 40], [150, 40], 9) });
  // The barrel chest.
  const chest = 'M-180 -398Q-276 -384 -266 -300Q-254 -130 -172 0H172Q254 -130 266 -300Q276 -384 180 -398Q0 -420 -180 -398Z';
  const plates =
    `<path d="M-250 -150Q0 -110 250 -150M-120 -405L-150 -300Q-160 -200 -110 -90M120 -405L150 -300Q160 -200 110 -90M-200 -60Q0 -30 200 -60" fill="none" stroke="${INK}" stroke-width="3.4" opacity=".6"/>` +
    `<path d="M-230 -48Q0 -14 230 -48" fill="none" stroke="${BRASS}" stroke-width="9" stroke-dasharray="22 14"/>` +
    rivets([-236, -270], [-212, -110], 5) +
    rivets([236, -270], [212, -110], 5) +
    lp.brushes([[[[-250, -154], [0, -114], [250, -154]], 3], [[[-200, -64], [0, -34], [200, -64]], 3]], '#ff9ad8', [0.2, 0.2], 0.45) +
    lp.glow(0, -230, 330, '#ff6fcf', 0.75);
  out += lp.form(chest, OL, { sh: 210, hatch: 2, line: 3.6, rim: 3.2, inner: plates, warm: 0.3, shade: lp.dark(OL, 0.42) });
  // The cage: a dark glass porthole with Celestia inside, brass bars and a brass ring.
  const cy = -232;
  const cr = 116;
  out += lp.form(circleD(0, cy, cr + 18), BRASS, { sh: 20, hatch: 1, line: 3.4, rim: 2.4 });
  out += `<circle cx="0" cy="${cy}" r="${cr}" fill="#2a0e26"/>`;
  out += celestiaBulb(lp, 0, cy + 10, 46, { droop: 0.55, petals: ['#7a2a6a', '#5a1a52'] });
  // Thorny clamps holding her vines down.
  out += lp.brushes(
    [
      [[[-30, cy + 50], [-70, cy + 70], [-96, cy + 92]], 12],
      [[[30, cy + 50], [70, cy + 72], [96, cy + 90]], 12],
      [[[-10, cy + 54], [-20, cy + 90], [-30, cy + 112]], 10],
    ],
    '#3a5a2a',
    [0.1, 0.4],
  );
  let bars = '';
  for (const bx of [-78, -40, 0, 40, 78]) {
    const h = Math.sqrt(cr * cr - bx * bx);
    bars += `M${bx} ${r1(cy - h)}V${r1(cy + h)}`;
  }
  out += `<path d="${bars}" stroke="${INK}" stroke-width="15"/><path d="${bars}" stroke="${BRASS}" stroke-width="8"/>`;
  out += `<circle cx="0" cy="${cy}" r="${cr}" fill="#7fe6ff" opacity=".08"/>`;
  out += lp.brush([[-78, cy - 70], [-40, cy - 100], [6, cy - 106]], 9, '#ffffff', [0.3, 0.3], 0.55);
  out += `<circle cx="0" cy="${cy}" r="${cr}" fill="none" stroke="${INK}" stroke-width="5"/>`;
  // Pauldrons with the red gear.
  for (const k of [-1, 1]) {
    out += lp.form(`M${k * 190} -420Q${k * 260} -470 ${k * 330} -420Q${k * 372} -360 ${k * 340} -300Q${k * 262} -270 ${k * 196} -320Z`, OL, { sh: 90, hatch: 2, line: 3.4, rim: 3, warm: 0.3, shade: lp.dark(OL, 0.42), inner: gearMark(k * 268, -372, 30) + rivets([k * 212, -330], [k * 320, -330], 4) });
  }
  // The neck collar, the visor block with its two red eye-slits, and the cockpit dome.
  out += lp.form('M-120 -392H120L110 -440H-110Z', OL_DARK, { sh: 20, hatch: 2, line: 3 });
  const domeD = 'M-138 -478Q-146 -690 0 -694Q146 -690 138 -478Z';
  out += lp.form(domeD, '#1a2a3a', { line: 3.2 });
  out += lp.glow(0, -500, 160, '#ff3a4c', 0.35, 70);
  if (o.pilot) {
    const clip = lp.uid();
    lp.def(clip, `<clipPath id="${clip}"><path d="${domeD}"/></clipPath>`);
    out += `<g clip-path="url(#${clip})">${o.pilot}</g>`;
  }
  const glass = lp.rad(
    [
      [0, '#bfefff', 0.04],
      [0.75, '#7fd8ff', 0.18],
      [1, '#dff6ff', 0.5],
    ],
    0.5,
    0.75,
    0.7,
  );
  out += `<path d="${domeD}" fill="${glass}" stroke="${INK}" stroke-width="5"/>`;
  out += lp.brush([[-104, -540], [-92, -630], [-30, -676]], 12, '#ffffff', [0.3, 0.3], 0.7) + lp.brush([[100, -520], [110, -580]], 6, '#ffffff', [0.3, 0.3], 0.5);
  const slits = `<path d="M-110 -446H-24L-30 -424H-104ZM24 -446H110L104 -424H30Z" fill="#ff3a4c"/><path d="M-100 -440H-40M40 -440H100" stroke="#ffd0c8" stroke-width="4"/>`;
  out += lp.form('M-160 -404L-170 -462Q-160 -486 -120 -488H120Q160 -486 170 -462L160 -404Z', OL, { sh: 44, hatch: 2, line: 3.4, rim: 2.6, inner: slits + `<path d="M-166 -476H166" stroke="${BRASS}" stroke-width="10"/>` + rivets([-140, -414], [140, -414], 8, 3.6) });
  out += lp.glow(-66, -436, 70, '#ff3a4c', 0.7, 34) + lp.glow(66, -436, 70, '#ff3a4c', 0.7, 34);
  // The cannon arm, near side, swung down toward the ledge, its muzzle glowing as it charges.
  const shL: P = [-262, -360];
  const elL: P = [-372, -170];
  out += armour(lp, shL, elL, 120, 100) + joint(lp, elL, 56);
  const aim = o.aim ?? -40;
  const ad = dir(aim);
  const a = (Math.atan2(ad[1], ad[0]) * 180) / Math.PI;
  const cp = lp.local(false, a);
  const L = 220;
  const rings = [0.28, 0.5, 0.72].map((t) => cp.form(`M${r1(L * t)} -66h22v132h-22Z`, BRASS, { sh: 10, hatch: 1, line: 2.6, rim: 2 })).join('');
  const cannon =
    cp.form(`M10 -60Q-10 0 10 60H${L}V-60Z`, OL, { sh: 56, hatch: 2, line: 3.4, rim: 2.6, axis: [1, 0], inner: `<path d="M40 -30H${L - 20}M40 30H${L - 20}" stroke="${INK}" stroke-width="3" opacity=".5"/>` }) +
    rings +
    cp.form(`M${L} -46H${L + 70}V46H${L}Z`, '#3a3a32', { sh: 24, hatch: 2, line: 3, rim: 2 }) +
    cp.glow(L + 72, 0, 90, '#ff9a3a', 0.9) +
    `<ellipse cx="${L + 72}" cy="0" rx="14" ry="34" fill="#ffd27a" stroke="${INK}" stroke-width="3"/>` +
    cp.glow(L + 74, 0, 30, '#ffffff', 0.9);
  out += at(elL[0], elL[1], 1, cannon, false, a);
  return at(x, y, s, back + out, false, o.rot ?? 0);
}

/**
 * General Brennus as the Colossus's pilot: from the chest up behind the dome's glass, shaking his fist.
 * Returns markup in the Colossus's coordinates (head near (0, -590)).
 */
export function colossusPilot(pen: Pen, k = 0.9): string {
  const pose: Pose = { turn: 0.36, lean: 4, tilt: 4, armN: [40, 100], armF: [150, 178], legN: { to: [-0.06, 0.99] }, legF: { to: [0.16, 0.97] }, handN: 'fist', handF: 'fist' };
  const r = rig(STOCKY, pose);
  // Facing left, toward Jason, so the head's x flips.
  const hx = -r.head[0] * k;
  const hy = r.head[1] * k;
  return brennus(pen, -hx + 4, -592 - hy, k, { pose, flip: true, mood: 'angry', shield: false, cannon: false, look: [2.4, 2], rim: 2.2 });
}

