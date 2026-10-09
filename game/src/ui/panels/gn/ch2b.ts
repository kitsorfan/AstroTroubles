/**
 * Graphic-novel pieces for the end of chapter 2: the Colossus (General Brennus's giant war machine),
 * Celestia (caged in its chest, and blooming free), little Brennus and his grandmother in her greenhouse
 * on Mars, Dr. Hypatia, the colony shuttles and a Green Legion robot. Built from the kit's marks and
 * `figure`, like the cast in cast.ts.
 */
import { add, at, dir, dPoly, dSmooth, INK, lerp, mix, mul, type P, type Pen, perp, r1, sub, unit } from './core';
import { bandD, type Build, faceFrame, type HeadOpts, type Pose, rig, type Rig, STOCKY, U } from './body';
import { brennus, type CastOpts, figure, headPt, type Outfit } from './cast';

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

/* ---------------- props ---------------- */

/** A ripe tomato centred at (x, y), radius r: shaded red, a green star of sepals on top, a shine. */
export function tomato(pen: Pen, x: number, y: number, r: number, color = '#e8402a'): string {
  const sepals: [P[], number][] = [-150, -100, -40, 20, 70].map((a) => {
    const d = dir(a + 180);
    return [[[x, y - r * 0.82], add([x, y - r * 0.82], mul(d, r * 0.55))], r * 0.2];
  });
  return (
    pen.form(`M${r1(x - r)} ${r1(y)}Q${r1(x - r)} ${r1(y - r * 0.95)} ${r1(x)} ${r1(y - r * 0.85)}Q${r1(x + r)} ${r1(y - r * 0.95)} ${r1(x + r)} ${r1(y)}Q${r1(x + r * 0.9)} ${r1(y + r)} ${r1(x)} ${r1(y + r)}Q${r1(x - r * 0.9)} ${r1(y + r)} ${r1(x - r)} ${r1(y)}Z`, color, {
      sh: r * 0.5,
      hatch: 1,
      line: r > 16 ? 2.4 : 1.6,
      rim: r > 16 ? 1.8 : 0,
      inner: `<ellipse cx="${r1(x - r * 0.35)}" cy="${r1(y - r * 0.38)}" rx="${r1(r * 0.24)}" ry="${r1(r * 0.14)}" fill="#fff" opacity=".75" transform="rotate(-30 ${r1(x - r * 0.35)} ${r1(y - r * 0.38)})"/>`,
    }) +
    pen.brushes(sepals, '#2f6a2a', [0.05, 0.6]) +
    pen.brush([[x, y - r * 0.8], [x + 1, y - r * 1.15], [x + r * 0.2, y - r * 1.3]], r * 0.14, '#2f6a2a', [0.1, 0.3])
  );
}

/** A watering can whose handle is held at (0, 0) (local coordinates, can below, spout toward +x). */
export function wateringCan(pen: Pen, x: number, y: number, s: number, color: string, o: { flip?: boolean; rot?: number } = {}): string {
  const lp = pen.local(!!o.flip, o.rot ?? 0);
  const body = 'M-36 22L36 22L32 86Q0 94 -32 86Z';
  let out = lp.brush([[-30, 26], [-26, -4], [0, -10], [26, -4], [30, 26]], 9, INK, [0.05, 0.05]) + lp.brush([[-30, 26], [-26, -4], [0, -10], [26, -4], [30, 26]], 4.5, mix(color, '#ffffff', 0.3), [0.05, 0.05]);
  out += lp.brush([[28, 70], [62, 46], [92, 14]], 16, INK, [0.05, 0.05]) + lp.brush([[28, 70], [62, 46], [92, 14]], 9, color, [0.05, 0.05]);
  out += lp.form('M84 4L104 -10L112 20L94 28Z', mix(color, '#000000', 0.2), { sh: 6, line: 2.2 });
  out += lp.form(body, color, { sh: 22, hatch: 1, line: 2.6, rim: 2, inner: `<path d="M-34 40Q0 46 34 40" stroke="${INK}" stroke-width="2" opacity=".5" fill="none"/>` + lp.brush([[-24, 34], [-22, 60], [-18, 80]], 4, '#ffffff', [0.3, 0.3], 0.6) });
  out += lp.form('M-38 18Q0 10 38 18L36 26Q0 20 -36 26Z', mix(color, '#ffffff', 0.25), { line: 2.2 });
  return at(x, y, s, out, o.flip, o.rot ?? 0);
}

/**
 * One tomato plant on its cane, for reusing with `<use>`: a stake, twine, a leafy bush and ripe and
 * green tomatoes. Defined once per variant (0 or 1); returns its id. Base at (0, 0), about 260 tall.
 */
export function tomatoPlantDef(pen: Pen, variant: 0 | 1): string {
  return pen.shared(`tomato${variant}`, (id) => {
    const flip = variant ? -1 : 1;
    const leaf = (x: number, y: number, a: number, l: number, c: string) => {
      const d = dir(a);
      const n = perp(d);
      const tip = add([x, y], mul(d, l));
      const m = add([x, y], mul(d, l * 0.45));
      const pts: P[] = [[x, y], add(m, mul(n, l * 0.3)), add(add([x, y], mul(d, l * 0.78)), mul(n, l * 0.16)), tip, add(add([x, y], mul(d, l * 0.78)), mul(n, -l * 0.18)), add(m, mul(n, -l * 0.3))];
      return pen.form(dSmooth(pts), c, { sh: l * 0.18, hatch: 1, line: 2, rim: 1.4, inner: pen.brush([[x, y], m, add([x, y], mul(d, l * 0.85))], 2, INK, [0.2, 0.6], 0.45) });
    };
    let out = pen.brush([[4, 6], [6, -130], [8, -262]], 9, INK, [0.02, 0.02]) + pen.brush([[4, 6], [6, -130], [8, -262]], 5, '#a8804a', [0.02, 0.02]);
    out += pen.brushes(
      [
        [[[0, 0], [-6 * flip, -90], [4, -170], [0, -236]], 9],
        [[[-4 * flip, -70], [-40 * flip, -110], [-62 * flip, -150]], 6],
        [[[2, -120], [40 * flip, -150], [64 * flip, -186]], 6],
        [[[2, -170], [-34 * flip, -200], [-50 * flip, -230]], 5],
      ],
      '#2f6a2a',
      [0.05, 0.7],
    );
    const L: [number, number, number, number, string][] = [
      [-6, -60, -120, 70, '#3f7a3a'],
      [2, -80, 110, 74, '#4a8a3a'],
      [-30, -110, -150, 66, '#5f9a3a'],
      [30, -140, 140, 70, '#3f7a3a'],
      [-8, -150, -160, 64, '#4a8a3a'],
      [50, -170, 165, 56, '#5f9a3a'],
      [-40, -190, -140, 60, '#3f7a3a'],
      [4, -200, 175, 58, '#5f9a3a'],
      [-10, -230, -170, 50, '#4a8a3a'],
      [20, -236, 150, 48, '#3f7a3a'],
      [-56, -146, -100, 48, '#4a8a3a'],
      [62, -186, 120, 44, '#4a8a3a'],
    ];
    for (const [lx, ly, la, ll, lc] of L) out += leaf(lx * flip, ly, la * flip, ll, lc);
    const T: [number, number, number, string][] = [
      [-30, -96, 17, '#e8402a'],
      [-12, -84, 15, '#e8402a'],
      [38, -126, 16, '#ff6a2a'],
      [22, -112, 13, '#e8402a'],
      [-44, -170, 14, '#e8402a'],
      [44, -200, 12, '#9ac04a'],
      [-14, -206, 13, '#ff8a3a'],
    ];
    for (const [tx, ty, tr, tc] of T) out += tomato(pen, tx * flip, ty, tr, tc);
    out += pen.brushes(
      [
        [[[-4, -60], [12, -64]], 3],
        [[[-2, -150], [14, -154]], 3],
      ],
      '#d8c090',
      [0.1, 0.1],
    );
    return `<g id="${id}">${out}</g>`;
  });
}

/** A little hand-written name tag hung on a plant's cane at (x, y). */
export function nameTag(pen: Pen, x: number, y: number, s: number, name: string, rot = -6): string {
  const card = pen.form('M-34 -14H34L40 0L34 14H-34Z', '#fff8e8', { sh: 6, line: 2, inner: `<circle cx="30" cy="0" r="3" fill="${INK}"/>` });
  const text = `<text x="-26" y="6" font-family="Fredoka, sans-serif" font-weight="600" font-size="17" fill="#7a3a24">${name}</text>`;
  return at(x, y, s, pen.brush([[30, 0], [40, -12], [46, -24]], 2, '#8a6a3a', [0.1, 0.1]) + card + text, false, rot);
}

/* ---------------- little Brennus and his grandmother ---------------- */

/** A child of about ten: about 4 heads tall, a big head on a small body. */
export const CHILD: Build = {
  neck: 0.12,
  spine: 1.02,
  shoulder: 0.5,
  hips: 0.26,
  upperArm: 0.7,
  foreArm: 0.64,
  hand: 0.52,
  thigh: 0.8,
  shin: 0.72,
  ankle: 0.14,
  foot: 0.68,
  arm: [0.34, 0.27, 0.22],
  leg: [0.5, 0.34, 0.25],
  chest: 1.06,
  waist: 0.94,
  hipW: 0.96,
  neckW: 0.38,
};

/** An old lady: about 6.3 heads tall, narrow shoulders and a soft, round figure. */
export const GRANNY: Build = {
  neck: 0.16,
  spine: 1.82,
  shoulder: 0.74,
  hips: 0.4,
  upperArm: 1.3,
  foreArm: 1.16,
  hand: 0.64,
  thigh: 1.56,
  shin: 1.48,
  ankle: 0.18,
  foot: 0.86,
  arm: [0.42, 0.33, 0.26],
  leg: [0.52, 0.36, 0.26],
  chest: 1.62,
  waist: 1.5,
  hipW: 1.7,
  neckW: 0.44,
};

/** Little Brennus's mop of dark hair with a cowlick sticking up (head coordinates). */
function boyHair(pen: Pen): string {
  const hair = '#3b2416';
  const d = dSmooth([
    [-36, 8],
    [-46, -14],
    [-44, -38],
    [-26, -56],
    [0, -62],
    [24, -58],
    [42, -42],
    [46, -22],
    [38, -18],
    [32, -30],
    [24, -18],
    [16, -30],
    [6, -20],
    [-4, -30],
    [-12, -18],
    [-22, -22],
    [-28, -8],
    [-30, 6],
  ]);
  const strands: [P[], number][] = [
    [[[-32, -46], [-10, -52], [14, -48]], 2.4],
    [[[-40, -22], [-30, -36], [-14, -42]], 2.2],
    [[[10, -54], [28, -46], [38, -32]], 2.2],
  ];
  return (
    pen.form(d, hair, { sh: 16, hatch: 2, rim: 2.4, line: 2.4, shade: '#160c08', inner: pen.brushes(strands, INK, [0.2, 0.6], 0.85) + pen.brushes(strands.map(([p, w]) => [p.map((q) => add(q, [2, -3])), w * 0.6] as [P[], number]), mix(hair, '#ffffff', 0.35), [0.3, 0.6], 0.5) }) +
    pen.form('M-10 -58Q-10 -74 6 -78Q0 -70 2 -60Z', hair, { sh: 4, line: 2.2, rim: 1.6, shade: '#160c08' })
  );
}

export interface BoyOpts extends CastOpts {
  /** Hold a big ripe tomato up in both hands (default yes). */
  tomato?: boolean;
}

/** Little Brennus at about ten, on Mars: dark hair, Brennus's grey-blue eyes, a striped red sweater and rosy cheeks. */
export function boyBrennus(pen: Pen, x: number, y: number, s: number, o: BoyOpts = {}): string {
  const lp = pen.local(!!o.flip);
  const skin = '#e6b494';
  const pose: Pose =
    typeof o.pose === 'object'
      ? o.pose
      : { turn: 0.42, lean: -5, tilt: -8, hipTilt: 4, armN: { to: [0.92, 0.22] }, armF: { to: [1.02, 0.06] }, legN: { to: [-0.12, 0.98] }, legF: { to: [0.18, 0.96] }, handN: 'grip', handF: 'grip', wristN: -60, wristF: -70 };
  const F = faceFrame(pose.turn ?? 0.4);
  // Rosy cheeks.
  const blush = `<g fill="#ff8a7a" opacity=".35"><ellipse cx="${r1(F.eyeN[0] - 3)}" cy="17" rx="8" ry="4.5"/><ellipse cx="${r1(F.eyeF[0] + 3)}" cy="16" rx="${r1(6 * (1 - 0.4 * F.k))}" ry="4"/></g>`;
  const head: HeadOpts = { skin, mood: o.mood ?? 'grin', eye: '#4a5a6a', brow: '#3b2416', jaw: 0.86, chin: 0.78, nose: 0.7, eyeSize: 1.3, look: o.look, front: boyHair(lp), skinMarks: blush };
  const outfit: Outfit = { build: CHILD, skin, top: '#c0392b', pants: '#3a5a8a', boots: '#5a3a24', bootTop: 0.2, cuff: '#a02a22', topBottom: 0.88, rim: o.rim };
  const { svg } = figure(lp, pose, outfit, head, {
    torso: (r) => {
      // The sweater's two pale stripes, its ribbed hem and collar.
      let t = lp.form(bandD(r, 0.3, 0.37), '#f08a6a', { line: 1.6, sh: 4 }) + lp.form(bandD(r, 0.44, 0.5), '#f08a6a', { line: 1.6, sh: 4 });
      t += lp.form(bandD(r, 0.8, 0.9), '#a02a22', { sh: 5, line: 2, inner: '' });
      const nb = add(r.N, mul(r.u, 2));
      const rw = r.b.neckW * U * 1.1;
      t += lp.form(`M${r1(nb[0] - rw)} ${r1(nb[1])}A${r1(rw)} ${r1(rw * 0.45)} 0 0 0 ${r1(nb[0] + rw)} ${r1(nb[1])}L${r1(nb[0] + rw * 0.85)} ${r1(nb[1] - 9)}A${r1(rw * 0.85)} ${r1(rw * 0.3)} 0 0 1 ${r1(nb[0] - rw * 0.85)} ${r1(nb[1] - 9)}Z`, '#a02a22', { sh: 5, line: 2 });
      // The tomato he holds up, between his hands.
      if (o.tomato !== false) {
        const c = add(lerp(r.wr[0], r.wr[1], 0.5), [r.b.hand * U * 0.55, -r.b.hand * U * 0.35]);
        t += lp.glow(c[0], c[1], 70, '#fff2c0', 0.5) + tomato(lp, c[0], c[1], 36);
      }
      return t;
    },
  });
  return at(x, y, s, svg, o.flip);
}

/** Grandma's white hair, swept up into a bun, and her round gold glasses (head coordinates, for a turn). */
function grannyHead(pen: Pen, turn: number): { front: string; back: string } {
  const hair = '#f2f0f4';
  const F = faceFrame(turn);
  // Soft white waves swept back from the face over the ear, full at the temples.
  const cap = dSmooth([
    [-34, 18],
    [-50, 8],
    [-54, -18],
    [-46, -44],
    [-22, -62],
    [10, -64],
    [36, -54],
    [50, -36],
    [50, -18],
    [42, -12],
    [36, -24],
    [26, -20],
    [16, -30],
    [2, -24],
    [-10, -26],
    [-18, -14],
    [-24, -4],
    [-24, 8],
  ]);
  const waves: [P[], number][] = [
    [[[-40, -32], [-20, -50], [6, -54]], 2.2],
    [[[-46, -8], [-36, -30], [-16, -42]], 2],
    [[[12, -50], [30, -44], [42, -30]], 2],
    [[[-44, 8], [-40, -6], [-30, -16]], 1.8],
    [[[18, -36], [30, -30], [36, -22]], 1.6],
  ];
  const front = pen.form(cap, hair, { sh: 12, hatch: 1, rim: 2, line: 2.2, shade: '#a8a4c0', inner: pen.brushes(waves, '#9a96b0', [0.2, 0.6], 0.9) });
  const back = pen.form('M-58 -56a24 22 0 1 0 48 0a24 22 0 1 0 -48 0Z', hair, { sh: 10, hatch: 1, rim: 2, line: 2.2, shade: '#a8a4c0', inner: pen.brush([[-52, -60], [-34, -72], [-18, -62]], 1.8, '#9a96b0', [0.2, 0.4]) }) + pen.brush([[-40, -78], [-24, -86]], 3, '#e8b84a', [0.1, 0.1]);
  // Round glasses: two gold rims, the far one foreshortened, a bridge, the arm back to the ear, and a glint.
  const [nx, ny] = F.eyeN;
  const [fx, fy] = F.eyeF;
  const fr = 12 * (1 - 0.5 * F.k);
  const rims = `M${r1(nx - 13)} ${ny}a13 13 0 1 0 26 0a13 13 0 1 0 -26 0ZM${r1(fx - fr)} ${fy}a${r1(fr)} 12.5 0 1 0 ${r1(fr * 2)} 0a${r1(fr)} 12.5 0 1 0 ${r1(-fr * 2)} 0ZM${r1(nx + 13)} ${ny - 2}Q${r1((nx + fx) / 2 + 1)} ${ny - 5} ${r1(fx - fr)} ${fy - 2}M${r1(nx - 13)} ${ny - 2}L${r1(F.ear[0] + 4)} ${F.ear[1] - 6}`;
  const glasses = `<path d="${rims}" fill="#d8f4ff" fill-opacity=".12" stroke="${INK}" stroke-width="4.4"/><path d="${rims}" fill="none" stroke="#d8a840" stroke-width="2"/>` + pen.brush([[nx - 7, ny - 6], [nx - 2, ny - 9]], 2.4, '#ffffff', [0.3, 0.3], 0.9);
  const earring = `<circle cx="${r1(F.ear[0] - 1)}" cy="${r1(F.ear[1] + 15)}" r="3.6" fill="#fff8ee" stroke="${INK}" stroke-width="1.6"/>`;
  return { front: front + glasses + earring, back };
}

export interface GrannyOpts extends CastOpts {
  /** What her near hand holds (default a watering can). */
  can?: boolean;
}

/** Grandma: white hair in a bun, round glasses, a flowery purple dress, a cream apron with a pink pocket (and a seed packet in it), green gardening gloves. */
export function grandma(pen: Pen, x: number, y: number, s: number, o: GrannyOpts = {}): string {
  const lp = pen.local(!!o.flip);
  const pose: Pose =
    typeof o.pose === 'object'
      ? o.pose
      : { turn: 0.4, lean: 6, tilt: 10, hipTilt: 4, armN: [-4, 14], armF: { to: [0.95, 0.75] }, legN: { to: [-0.08, 0.98] }, legF: { to: [0.16, 0.97] }, handN: 'grip', handF: 'open', wristF: -30 };
  const skin = '#e8b898';
  const dress = '#8a5aa8';
  const h = grannyHead(lp, pose.turn ?? 0.4);
  const head: HeadOpts = { skin, mood: o.mood ?? 'smile', eye: '#5a7a9a', brow: '#c8c4d4', jaw: 0.94, chin: 0.92, nose: 1.0, age: 0.85, soft: true, eyeSize: 0.95, look: o.look, front: h.front, back: h.back };
  const outfit: Outfit = { build: GRANNY, skin, top: dress, pants: '#e2c8bc', boots: '#6a4030', bootTop: 0.14, gloves: '#5f9a3a', cuff: '#4a7a2a', rim: o.rim };
  // Little cream-and-pink flowers on the dress.
  const flowers = lp.shared('granny-print', (id) => `<pattern id="${id}" width="44" height="40" patternUnits="userSpaceOnUse" patternTransform="rotate(12)"><g fill="#f4c8e8"><circle cx="8" cy="6" r="3.4"/><circle cx="14" cy="8" r="3.4"/><circle cx="12" cy="14" r="3.4"/><circle cx="6" cy="13" r="3.4"/></g><circle cx="10" cy="10" r="2.2" fill="#ffd166"/><g fill="#fff4e0" opacity=".8"><circle cx="30" cy="28" r="2.6"/><circle cx="35" cy="30" r="2.6"/><circle cx="33" cy="35" r="2.6"/><circle cx="28" cy="34" r="2.6"/></g></pattern>`);
  const print = (d: string) => `<path d="${d}" fill="url(#${flowers})" opacity=".55"/>`;
  const { svg } = figure(lp, pose, outfit, head, {
    torso: (r: Rig) => {
      // The dress's skirt, flaring to below the knees.
      const kn0 = r.kn[0];
      const kn1 = r.kn[1];
      const hy = Math.max(kn0[1], kn1[1]) + r.b.shin * U * 0.3;
      const x0 = Math.min(kn0[0], kn1[0]) - r.b.leg[1] * U * 1.1;
      const x1 = Math.max(kn0[0], kn1[0]) + r.b.leg[1] * U * 1.1;
      const skirt = dSmooth([
        r.ts(-r.b.waist * 0.5, 0.64),
        r.ts(-r.b.hipW * 0.6, 0.98),
        [x0 - 6, hy - 14],
        [x0 + 10, hy + 6],
        [lerp([x0, 0], [x1, 0], 0.3)[0], hy + 12],
        [lerp([x0, 0], [x1, 0], 0.55)[0], hy + 4],
        [lerp([x0, 0], [x1, 0], 0.8)[0], hy + 12],
        [x1 + 6, hy - 4],
        r.ts(r.b.hipW * 0.6, 0.98),
        r.ts(r.b.waist * 0.5, 0.64),
      ]);
      const folds: [P[], number][] = [0.25, 0.5, 0.75].map((k) => [[r.tf(-0.8 + k * 1.6, 0.9), [lerp([x0, 0], [x1, 0], k)[0], hy]], 3]);
      let t = lp.form(skirt, dress, { sh: r.b.hipW * U * 0.32, hatch: 2, rim: o.rim ?? 1.8, line: 2.6, axis: r.u, inner: print(skirt) + lp.brushes(folds, INK, [0.1, 0.5], 0.7) });
      // The apron: a bib on straps, a skirt panel, ties at the waist, and the pink pocket with Grandma's seed packet.
      const ay = lerp(r.ts(0, 0.7), [0, hy], 0.78)[1];
      const a0 = r.tf(-0.62, 0.68);
      const a1 = r.tf(0.72, 0.68);
      const apronSkirt = dSmooth([a0, a1, [a1[0] + 16, ay - 10], [lerp(a0, a1, 0.5)[0], ay + 8], [a0[0] - 16, ay - 10]]);
      const pk = lerp([a0[0], ay], [a1[0], ay], 0.58);
      const pocket = `M${r1(pk[0] - 26)} ${r1(pk[1] - 72)}H${r1(pk[0] + 26)}L${r1(pk[0] + 22)} ${r1(pk[1] - 30)}H${r1(pk[0] - 22)}Z`;
      const packet = `<path d="M${r1(pk[0] - 14)} ${r1(pk[1] - 66)}l4 -30h24l-2 30Z" fill="#fff4d8" stroke="${INK}" stroke-width="2"/><circle cx="${r1(pk[0] + 2)}" cy="${r1(pk[1] - 84)}" r="6" fill="#e8402a"/>`;
      t += lp.form(apronSkirt, '#fff4e4', { sh: 16, hatch: 1, rim: 1.6, line: 2.4, axis: r.u, inner: packet + `<path d="${pocket}" fill="#ffc8dc" stroke="${INK}" stroke-width="2.2"/><path d="M${r1(pk[0] - 24)} ${r1(pk[1] - 64)}H${r1(pk[0] + 24)}" stroke="#ffffff" stroke-width="2" stroke-dasharray="4 3"/>` });
      t += lp.form(dPoly([r.tf(-0.5, 0.12), r.tf(0.6, 0.12), r.tf(0.56, 0.68), r.tf(-0.46, 0.68)]), '#fff4e4', { sh: 10, line: 2.2, rim: 1.4 });
      t += lp.form(bandD(r, 0.64, 0.71), '#fff4e4', { sh: 4, line: 2 });
      t += lp.brushes(
        [
          [[r.tf(-0.48, 0.13), r.ts(-0.18, -0.02)], 5],
          [[r.tf(0.58, 0.13), r.ts(0.22, -0.02)], 5],
        ],
        '#fff4e4',
        [0.1, 0.1],
      );
      // A lace collar and a little cameo brooch.
      const nb = add(r.N, mul(r.u, 4));
      t += lp.form(`M${r1(nb[0] - 30)} ${r1(nb[1] - 4)}Q${r1(nb[0] - 22)} ${r1(nb[1] + 18)} ${r1(nb[0])} ${r1(nb[1] + 14)}Q${r1(nb[0] + 22)} ${r1(nb[1] + 18)} ${r1(nb[0] + 30)} ${r1(nb[1] - 4)}Z`, '#fffaf2', { sh: 4, line: 2 });
      t += `<circle cx="${r1(nb[0] + 2)}" cy="${r1(nb[1] + 12)}" r="6" fill="#e8b84a" stroke="${INK}" stroke-width="1.8"/>`;
      // The watering can hangs from her near hand (drawn under the hand, over the dress).
      if (o.can !== false) t += wateringCan(lp, r.wr[0][0] + 4, r.wr[0][1] + 30, 0.9, '#9aa6ba');
      return t;
    },
  });
  return at(x, y, s, svg, o.flip);
}

/** A point on a figure's face placed in the panel (for tears, sweat drops): `p` in head coordinates. */
export function facePoint(r: Rig, x: number, y: number, s: number, p: P, flip = false): P {
  const q = headPt(r, p);
  return [x + (flip ? -q[0] : q[0]) * s, y + q[1] * s];
}

