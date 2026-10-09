/** Chapter 3 panels: Celestia fading by the Gardeners' ruins, the Argo being built, and Aeëtes on his golden flagship. */
import * as gn from '../gn';
import { celestia, ellD, fallenPetal, fleece, goldShip, hypatia, ruinStone, saucer } from '../gn/ch3a';

/* ---------------- 20. Celestia fading, in the graphic-novel style ---------------- */

/** A raised garden bed seen in perspective: a wooden frame round dark soil with rows of sprouts. Front edge from x0 to x1 at y. */
function gardenBed(pen: gn.Pen, x0: number, x1: number, y: number, depth: number, seed: number, k = 1): string {
  const rand = gn.rng(seed);
  const h = 22 * k;
  const back = y - depth;
  const sk = depth * 0.35;
  const soil = pen.form(gn.dPoly([[x0 + sk, back], [x1 - sk, back], [x1, y], [x0, y]]), '#4a3020', { sh: depth * 0.4, line: 2.2 * k, hatch: 1 });
  const front = pen.form(gn.dPoly([[x0, y], [x1, y], [x1, y + h], [x0, y + h]]), '#b07a48', { sh: h * 0.5, line: 2.4 * k, rim: 1.4, inner: `<path d="M${x0} ${gn.r1(y + h * 0.5)}H${x1}" stroke="${gn.INK}" stroke-width="${gn.r1(1.6 * k)}" opacity=".5"/>` });
  const leaves: [gn.P[], number][] = [];
  const lit: [gn.P[], number][] = [];
  for (let row = 0; row < 3; row++) {
    const ry = back + depth * (0.3 + row * 0.28);
    const t = (ry - back) / depth;
    const xa = x0 + sk * (1 - t);
    const xb = x1 - sk * (1 - t);
    for (let sx = xa + 20 * k; sx < xb - 10 * k; sx += (36 + rand() * 14) * k) {
      const sz = (14 + t * 10) * k;
      leaves.push([[[sx, ry], [sx - sz * 0.6, ry - sz * 0.8], [sx - sz * 1.1, ry - sz * 0.7]], 6 * k]);
      leaves.push([[[sx, ry], [sx + sz * 0.6, ry - sz * 0.9], [sx + sz * 1.1, ry - sz * 0.8]], 6 * k]);
      lit.push([[[sx, ry], [sx + sz * 0.5, ry - sz * 0.8]], 2.4 * k]);
    }
  }
  return soil + pen.brushes(leaves, '#3f7a3a', [0.1, 0.6]) + pen.brushes(lit, '#b8e088', [0.1, 0.6], 0.8) + front;
}

/** The colony's domes far off on the plain: pale half-spheres with lit windows, flat in the haze. */
function colony(pen: gn.Pen, x: number, y: number, s: number): string {
  const dome = (dx: number, r: number) =>
    `<path d="M${dx - r} 0A${r} ${r * 0.8} 0 0 1 ${dx + r} 0Z" fill="#dfe6f0"/><path d="M${dx - r * 0.2} ${-r * 0.78}A${r} ${r * 0.8} 0 0 1 ${dx + r} 0H${dx + r * 0.3}Z" fill="#9aa8c8" opacity=".55"/><path d="M${dx - r * 0.6} ${-r * 0.2}h${r * 0.2}M${dx - r * 0.1} ${-r * 0.3}h${r * 0.2}" stroke="#ffd98a" stroke-width="5"/>`;
  return gn.at(x, y, s, dome(0, 60) + dome(110, 40) + dome(-90, 34) + `<path d="M-140 0H170" stroke="#9aa8c8" stroke-width="4"/><path d="M30 -48V-110" stroke="#9aa8c8" stroke-width="4"/>` + pen.glow(30, -114, 10, '#ff6a6a', 0.9));
}

/** 20. The colony's first garden at dawn: Celestia droops, pale; Jason reaches for her; Dr. Hypatia reads the Gardeners' stone, its light-words shining up into a picture of the Golden Fleece. */
export function ch3Fading(): string {
  const pen = gn.Pen.scene('ch3-fading', { key: [-0.85, -0.45], keyColor: '#ffe2c0', rim: [0.9, -0.35], rimColor: '#ffd36a', shadow: '#6a6aa8', depth: 0.5 });
  const sunX = 150;
  const sunY = 420;
  const sky =
    gn.sky(pen, [
      [0, '#22385e'],
      [0.32, '#6a88b8'],
      [0.56, '#e8c4b0'],
      [0.68, '#ffe0c0'],
    ]) +
    gn.starfield(pen, 20, 36, 0, 0, 1600, 200, '#e8f0ff') +
    gn.gasGiant(pen, 1330, 150, 104, { lightDir: [-0.95, 0.2], haze: 0.4, sky: '#7a90b8' }) +
    gn.godRays(pen, sunX, sunY, [100, 120, 140, 160, 185], 6, 1300, '#fff0d0', 0.22) +
    gn.bloom(pen, sunX, sunY, 110, '#fff2d8', 0.9) +
    gn.cloud(pen, 560, 200, 280, '#fff4ea', '#b8a8c8', { seed: 4 }) +
    gn.cloud(pen, 1000, 120, 200, '#fff4ea', '#b8a8c8', { seed: 5 });
  const far =
    gn.silhouette(
      [
        [-80, 560],
        [120, 490],
        [360, 520],
        [560, 470],
        [800, 510],
        [1100, 460],
        [1380, 500],
        [1680, 470],
        [1680, 620],
        [-80, 620],
      ],
      '#9aa8c8',
    ) +
    colony(pen, 840, 552, 0.7) +
    gn.silhouette(
      [
        [-80, 600],
        [300, 560],
        [700, 590],
        [1000, 556],
        [1400, 584],
        [1680, 560],
        [1680, 680],
        [-80, 680],
      ],
      '#7a9a88',
    ) +
    gn.haze(pen, 480, 660, '#ffe8d4', 0.65);
  // The garden: grassy ground, beds of sprouts, and Celestia's stone planter in the middle.
  const ground =
    pen.form('M-80 640Q800 610 1680 640V960H-80Z', '#6aa04a', {
      sh: 20,
      line: 0,
      paint: pen.lin([
        [0, '#9ac870'],
        [0.5, '#5a8a40'],
        [1, '#2a4a2a'],
      ]),
    }) +
    gardenBed(pen, 140, 520, 690, 40, 3, 0.7) +
    gardenBed(pen, 980, 1300, 680, 36, 4, 0.7) +
    gn.grass(pen, -40, 1640, 660, 26, 26, '#4a7a3a', '#b8e088', 3) +
    gn.wash(pen, 760, '#1a2030', 0.55);
  const planter = pen.form('M560 742Q700 704 840 742L828 790Q700 810 572 790Z', '#c8bca8', { sh: 26, hatch: 1, line: 3, rim: 2, inner: `<path d="M600 760L616 798M670 752L676 806M740 752L736 806M800 760L792 798" stroke="${gn.INK}" stroke-width="2.4" opacity=".45"/>` });
  const soil = pen.form('M572 744Q700 714 828 744Q700 760 572 744Z', '#3a2618', { line: 2 });
  const fallen = fallenPetal(pen, 560, 812, 0.8, '#b8a8d8', 20) + fallenPetal(pen, 960, 820, 0.9, '#d8c8a8', -30) + fallenPetal(pen, 690, 846, 0.7, '#c8a8c8', 60);
  // Celestia, her head hanging toward Jason, colours washed pale; one petal drifting down.
  const plant = celestia(pen, 700, 744, 1.1, { droop: 0.8, fade: 0.7, side: -1 }) + fallenPetal(pen, 380, 600, 0.8, '#a8b8e0', -50) + gn.spark(pen, 540, 480, 9, '#ffd6f2', 0.8) + gn.spark(pen, 585, 540, 6, '#ffd6f2', 0.6) + gn.spark(pen, 500, 575, 5, '#ffd6f2', 0.45) + soil;
  // The stone, its light-words beaming up into a hologram of the Fleece.
  const beam = `<path d="M1040 400L880 150H1120L1120 400Z" fill="${pen.lin([
    [0, '#ffd166', 0],
    [1, '#ffd166', 0.5],
  ])}"/>`;
  const stone = gn.castShadow(pen, 1120, 776, 120, 14, 0.5) + ruinStone(pen, 1080, 780, 0.95) + beam + fleece(pen, 990, 190, 0.66, { holo: true }) + gn.spark(pen, 1060, 190, 14, '#fff6d0') + gn.spark(pen, 1330, 330, 10, '#fff6d0');
  const heroes =
    gn.castShadow(pen, 300, 880, 150, 14, 0.45) +
    gn.jason(pen, 300, 884, 1.08, {
      pose: { turn: 0.5, lean: 8, tilt: 8, armN: [-10, 26], armF: { to: [1.6, 0.45] }, legN: { to: [-0.24, 0.95] }, legF: { to: [0.3, 0.93] }, handN: 'fist', handF: 'open', footN: 20, wristF: -70 },
      mood: 'worried',
      look: [3, 0],
    }) +
    gn.lux(pen, 610, 200, 0.85, 'scared', { look: [-4, 7], flip: true }) +
    gn.castShadow(pen, 1310, 882, 150, 14, 0.45) +
    hypatia(pen, 1310, 884, 1.0, {
      flip: true,
      pad: true,
      pose: { turn: 0.5, lean: 8, tilt: -10, armF: [138, 146], armN: [30, 80], legN: { to: [-0.42, 0.55] }, legF: { to: [0.42, 0.56] }, handF: 'point', handN: 'grip', footN: 70 },
      mood: 'surprised',
      look: [2, -4],
    });
  const fore = gn.grass(pen, -70, 260, 940, 4, 140, '#10281a', '#4a8a4a', 9) + gn.grass(pen, 1440, 1680, 940, 4, 140, '#10281a', '#4a8a4a', 10);
  return pen.svg(gn.layer(0.15, sky) + gn.layer(0.35, far) + gn.layer(0.7, ground + planter + fallen + plant + stone) + gn.layer(1, heroes) + gn.layer(1.3, fore) + gn.vignette(pen, 0.5, '#141028') + gn.grain(pen, 0.08));
}

/* ---------------- 21. The Argo built, in the graphic-novel style ---------------- */

/** A steel beam of the building dock from a to b, `w` wide: shaded along its length, with rivets. */
function beam(pen: gn.Pen, a: gn.P, b: gn.P, w: number, color = '#5a5a72'): string {
  const d = gn.unit(gn.sub(b, a));
  const n = gn.mul(gn.perp(d), w / 2);
  const l = gn.len(gn.sub(b, a));
  let rivets = '';
  for (let t = 40; t < l - 20; t += 70) {
    const p = gn.add(a, gn.mul(d, t));
    rivets += `M${gn.r1(p[0])} ${gn.r1(p[1])}h0`;
  }
  return pen.form(gn.dPoly([gn.add(a, n), gn.add(b, n), gn.sub(b, n), gn.sub(a, n)]), color, { sh: w * 0.45, hatch: 1, line: 2.4, rim: 1.6, axis: d, inner: `<path d="${rivets}" stroke="${gn.INK}" stroke-width="5" stroke-linecap="round" opacity=".6"/>` });
}

/** A work lamp on a pole: a hooded lamp with a warm cone of light pointing along `deg` (as `gn.dir` measures it). */
function lamp(pen: gn.Pen, x: number, y: number, deg: number): string {
  const d = gn.dir(deg);
  const end = gn.add([x, y], gn.mul(d, 420));
  const n = gn.perp(d);
  const cone = `<path d="${gn.dPoly([gn.add([x, y], gn.mul(n, 12)), gn.add(end, gn.mul(n, 160)), gn.add(end, gn.mul(n, -160)), gn.add([x, y], gn.mul(n, -12))])}" fill="${pen.lin(
    [
      [0, '#fff2c8', 0.4],
      [1, '#fff2c8', 0],
    ],
    gn.r1(x),
    gn.r1(y),
    gn.r1(end[0]),
    gn.r1(end[1]),
    true,
  )}"/>`;
  return cone + pen.glow(x, y, 50, '#fff2c8', 0.9) + gn.at(x, y, 1, pen.local(false, deg - 90).form('M-16 -14L18 -10L18 10L-16 14Z', '#3a3a4a', { sh: 6, line: 2.2 }), false, deg - 90) + `<circle cx="${x}" cy="${y}" r="7" fill="#fffbe8"/>`;
}

/** A red toolbox with its lid open, base at (x, y). */
function toolbox(pen: gn.Pen, x: number, y: number, s: number): string {
  const body =
    pen.form('M-70 -20L-60 -70L60 -70L70 -20Z', '#a02a20', { sh: 10, line: 2.6, rim: 1.6 }) +
    pen.form('M-80 0V-56H80V0Z', '#d0402a', { sh: 30, hatch: 1, line: 3, rim: 2, inner: `<path d="M-80 -36H80" stroke="${gn.INK}" stroke-width="2.6" opacity=".6"/><rect x="-14" y="-46" width="28" height="12" fill="#e8c060" stroke="${gn.INK}" stroke-width="2"/>` }) +
    pen.brushes(
      [
        [
          [
            [-30, -72],
            [-34, -100],
          ],
          9,
        ],
        [
          [
            [20, -72],
            [36, -96],
          ],
          9,
        ],
      ],
      gn.INK,
      [0.05, 0.05],
    ) +
    pen.brush([[-30, -72], [-34, -100]], 4, '#c8ccd8', [0.05, 0.05]) +
    pen.brush([[20, -72], [36, -96]], 4, '#e8b84a', [0.05, 0.05]);
  return gn.at(x, y, s, body);
}

/** 21. Sunset in the Whispering Plains: the Argo stands finished in its building dock; Captain Argus shows her off, Jason cheers, LUX welds the last oar of light. */
export function ch3Argo(): string {
  const pen = gn.Pen.scene('ch3-argo', { key: [-0.8, -0.5], keyColor: '#ffc890', rim: [0.9, -0.3], rimColor: '#9ff0ff', shadow: '#5a4a9a', depth: 0.55 });
  const sunX = 200;
  const sunY = 500;
  const sky =
    gn.sky(pen, [
      [0, '#1e1e52'],
      [0.32, '#6a4a98'],
      [0.56, '#f08a7a'],
      [0.7, '#ffd0a0'],
    ]) +
    gn.starfield(pen, 8, 50, 0, 0, 1600, 260, '#fff0e8') +
    gn.gasGiant(pen, 1340, 190, 130, { lightDir: [-0.95, 0.3], haze: 0.3, sky: '#8a5a9a' }) +
    gn.godRays(pen, sunX, sunY, [110, 130, 150, 170, 195, 215], 6, 1400, '#ffe0b8', 0.25) +
    gn.bloom(pen, sunX, sunY, 120, '#fff0d0', 0.95) +
    gn.cloud(pen, 640, 240, 320, '#ffd8c0', '#8a5a9a', { seed: 6, flat: true }) +
    gn.cloud(pen, 1000, 150, 220, '#ffd8c0', '#8a5a9a', { seed: 7, flat: true });
  const far =
    gn.silhouette(
      [
        [-80, 610],
        [80, 560],
        [180, 566],
        [240, 520],
        [380, 524],
        [430, 580],
        [700, 590],
        [900, 540],
        [1000, 536],
        [1060, 580],
        [1400, 560],
        [1520, 510],
        [1680, 520],
        [1680, 680],
        [-80, 680],
      ],
      '#a07890',
    ) +
    gn.haze(pen, 520, 660, '#ffd0b0', 0.7) +
    gn.silhouette(
      [
        [-80, 650],
        [400, 630],
        [900, 650],
        [1300, 630],
        [1680, 645],
        [1680, 720],
        [-80, 720],
      ],
      '#6a6a6a',
      0.6,
    );
  // The dock: a packed-earth pad with landing marks, steel gantries behind the ship, lamps and a crane.
  const ground =
    pen.form('M-80 660Q800 640 1680 660V960H-80Z', '#8a7a68', {
      sh: 20,
      line: 0,
      paint: pen.lin([
        [0, '#c8a888'],
        [0.5, '#7a6a68'],
        [1, '#3a3040'],
      ]),
      inner: `<path d="M200 760Q800 720 1400 760M380 840Q800 800 1220 840" fill="none" stroke="#ffd166" stroke-width="10" stroke-dasharray="40 30" opacity=".55"/>`,
    }) +
    gn.grass(pen, -60, 1660, 668, 24, 30, '#5a6a3a', '#d8c888', 4) +
    gn.wash(pen, 780, '#120c20', 0.6);
  const frame =
    beam(pen, [470, 700], [470, 40], 30) +
    beam(pen, [1250, 700], [1250, 40], 30) +
    beam(pen, [420, 80], [1300, 80], 24) +
    beam(pen, [470, 420], [600, 80], 16) +
    beam(pen, [1250, 420], [1120, 80], 16) +
    lamp(pen, 490, 120, 50) +
    lamp(pen, 1230, 120, -50);
  // The Argo, finished, standing in her cradle; three oars already glow, LUX is welding the fourth.
  // She faces left, her ram's head toward the Captain.
  const ax = 940;
  const ay = 470;
  const as = 1.1;
  const at = (lx: number, ly: number): gn.P => [ax - lx * as, ay + ly * as];
  const oar = (i: number) => {
    const ox = -170 + i * 86;
    const b = at(ox - 70, 170);
    const tip = at(ox - 116, 262);
    const m = gn.lerp(b, tip, 0.5);
    return pen.glow(m[0], m[1], 56, '#8ff0ff', 0.6, 32) + pen.brush([b, m, tip], 22 * as, '#8ff0ff', [0.1, 0.8], 0.85) + pen.brush([b, m, tip], 8 * as, '#ffffff', [0.1, 0.8], 0.9);
  };
  const cradle = beam(pen, [600, 700], [680, 540], 26, '#7a6a5a') + beam(pen, [760, 700], [680, 540], 26, '#7a6a5a') + beam(pen, [1040, 700], [1120, 540], 26, '#7a6a5a') + beam(pen, [1200, 700], [1120, 540], 26, '#7a6a5a');
  const ship = gn.argo(pen, ax, ay, as, { lit: false, flip: true }) + oar(0) + oar(2) + oar(3) + oar(4) + pen.brush([at(-84, 30), at(-119, 100), at(-154, 170)], 14 * as, gn.INK, [0.05, 0.05]) + pen.brush([at(-84, 30), at(-119, 100), at(-154, 170)], 7 * as, '#f0b840', [0.05, 0.05]);
  // LUX, hovering under the hull, welds the last oar to its socket: a hot white spark and a spray of sparks.
  const weld = at(-90, 44);
  const luxAt = gn.add(weld, [78, 62]);
  const sprayD: [gn.P[], number][] = [];
  const rand = gn.rng(5);
  for (let i = 0; i < 12; i++) {
    const a = -40 + rand() * 120;
    const l = 30 + rand() * 80;
    const p = gn.add(weld, gn.mul(gn.dir(a), 10));
    sprayD.push([[p, gn.add(p, gn.mul(gn.dir(a), l))], 3]);
  }
  const torch: gn.P = gn.add(luxAt, [-30, -20]);
  const welding =
    gn.lux(pen, luxAt[0], luxAt[1], 0.8, 'happy', { flip: true }) +
    pen.brush([torch, weld], 9, gn.INK, [0.05, 0.05]) +
    pen.brush([torch, weld], 4.5, '#9aa6ba', [0.05, 0.05]) +
    pen.brushes(sprayD, '#ffe08a', [0.05, 0.9]) +
    pen.glow(weld[0], weld[1], 90, '#bff4ff', 0.9) +
    gn.spark(pen, weld[0], weld[1], 30, '#ffffff');
  const heroes =
    gn.castShadow(pen, 220, 924, 170, 16, 0.5) +
    gn.argus(pen, 220, 930, 1.12, { pose: { turn: 0.42, lean: 3, hipTilt: 6, armN: { to: [-0.6, 1.4], bend: 1 }, armF: [124, 128], legN: { to: [-0.1, 0.98] }, legF: { to: [0.26, 0.95] }, handN: 'fist', handF: 'point' }, mood: 'proud', look: [2.4, -2] }) +
    toolbox(pen, 560, 870, 0.9) +
    gn.castShadow(pen, 1420, 924, 150, 14, 0.5) +
    gn.jason(pen, 1420, 930, 1.12, { pose: 'cheer', mood: 'grin', flip: true, look: [2, -2] });
  const fore = gn.crag(
    pen,
    [
      [1500, 960],
      [1520, 880],
      [1600, 860],
      [1690, 880],
      [1690, 960],
    ],
    '#5a4a50',
    { seed: 4, sh: 30, cracks: 3, rim: 2.4 },
  ) + gn.grass(pen, -70, 220, 950, 4, 120, '#1a1a20', '#6a6a4a', 11);
  return pen.svg(gn.layer(0.15, sky) + gn.layer(0.35, far) + gn.layer(0.7, ground + frame + cradle + ship + welding) + gn.layer(1, heroes) + gn.layer(1.3, fore) + gn.vignette(pen, 0.5, '#120a20') + gn.grain(pen, 0.08));
}

/* ---------------- 22. Aeëtes, in the graphic-novel style ---------------- */

/** A pile of gold coins on the floor, base centre at (x, y), `w` wide: stacked shaded discs with glints. */
function coins(pen: gn.Pen, x: number, y: number, w: number, seed: number): string {
  const rand = gn.rng(seed);
  let out = pen.form(`M${x - w / 2} ${y}Q${x - w * 0.3} ${y - w * 0.32} ${x} ${y - w * 0.36}Q${x + w * 0.3} ${y - w * 0.32} ${x + w / 2} ${y}Q${x} ${y + w * 0.06} ${x - w / 2} ${y}Z`, '#e8b43a', { sh: w * 0.16, hatch: 1, line: 2.6, rim: 1.8 });
  for (let i = 0; i < 9; i++) {
    const cx = x + (rand() - 0.5) * w * 0.8;
    const cy = y - w * 0.04 - rand() * w * 0.26 * (1 - Math.abs(cx - x) / w);
    out += pen.form(ellD(cx, cy, 16, 6), '#ffd166', { sh: 3, line: 1.8 });
  }
  return out + gn.spark(pen, x - w * 0.15, y - w * 0.3, 12, '#fff6d0') + gn.spark(pen, x + w * 0.22, y - w * 0.16, 8, '#fff6d0');
}

/** 22. On the bridge of his golden flagship, Aeëtes throws his arms wide before a hologram of the Fleece, its light gold on his grin; his fleet and drones wait for orders. */
export function ch3Aeetes(): string {
  const pen = gn.Pen.scene('ch3-aeetes', { key: [0.55, 0.7], keyColor: '#ffd27a', rim: [-0.75, -0.6], rimColor: '#7ff0ff', shadow: '#4a2a6a', depth: 0.6 });
  // Space through the great window: a nebula, the gas giant, and Aeëtes's gold fleet.
  const space =
    gn.sky(pen, [
      [0, '#05061a'],
      [0.6, '#1a1040'],
      [1, '#2a1438'],
    ]) +
    gn.starfield(pen, 31, 160, 0, 0, 1600, 700) +
    gn.nebula(pen, 900, 260, 420, ['#7a3aa8', '#2a7a9a', '#c84a8a'], 3, 0.55) +
    gn.gasGiant(pen, 330, 560, 220, { lightDir: [0.8, -0.4], haze: 0.15, sky: '#1a1040' });
  // Out there the sun lights the ships from above.
  const sun = pen.relight({ key: [-0.6, -0.75], keyColor: '#fff0d8', rim: [0.8, 0.3], rimColor: '#b89aff', depth: 0.5 });
  const fleet = goldShip(sun, 290, 420, 0.3, { line: 2 }) + goldShip(sun, 790, 330, 0.18, { line: 1.4 }) + goldShip(sun, 1390, 130, 0.15, { line: 1.2 });
  // The bridge: a gold-ribbed wall round an arched window, a dark polished floor with gold inlay.
  const win = 'M150 660L1450 660L1450 260Q1430 90 800 60Q170 90 150 260Z';
  const wall = pen.form(`M-80 -60H1680V960H-80Z${win}`, '#3a2030', {
    sh: 0,
    line: 0,
    paint: pen.lin([
      [0, '#2a1428'],
      [1, '#4a2a34'],
    ]),
  });
  const ribs = [
    [460, 75],
    [800, 60],
    [1140, 75],
  ]
    .map(([rx, ry]) => pen.form(`M${rx - 14} ${ry}Q${rx - 20} 360 ${rx - 16} 660H${rx + 16}Q${rx + 20} 360 ${rx + 14} ${ry}Z`, '#c8901e', { sh: 10, hatch: 1, line: 2.6, rim: 2, axis: [0, 1] }))
    .join('');
  const frame = pen.form(`M120 690L118 250Q140 56 800 26Q1460 56 1482 250L1480 690H1450L1450 260Q1430 90 800 60Q170 90 150 260L150 690Z`, '#e8b43a', { sh: 14, hatch: 1, line: 3, rim: 2.4 });
  // Art-deco sunburst panels on the wall either side.
  const deco = (cx: number) =>
    `<path d="M${cx} 820L${cx - 60} 300M${cx} 820L${cx - 20} 290M${cx} 820L${cx + 20} 290M${cx} 820L${cx + 60} 300" stroke="#c8901e" stroke-width="5" opacity=".55"/>`;
  const floor =
    pen.form('M-80 690Q800 660 1680 690V960H-80Z', '#2a1828', {
      sh: 0,
      line: 3,
      paint: pen.lin([
        [0, '#5a3438'],
        [1, '#140a14'],
      ]),
      inner: `<path d="M-80 760Q800 724 1680 760M300 960L700 690M1300 960L900 690" fill="none" stroke="#e8b43a" stroke-width="5" opacity=".5"/>`,
    }) + `<ellipse cx="1180" cy="740" rx="320" ry="40" fill="#ffd27a" opacity=".22"/>`;
  // The hologram projector: a gold pedestal casting a cone of light up into the turning Fleece.
  const hx = 1190;
  const cone = `<path d="M${hx - 60} 650L${hx - 200} 230H${hx + 200}L${hx + 60} 650Z" fill="${pen.lin([
    [0, '#ffd27a', 0.05],
    [1, '#ffd27a', 0.45],
  ])}"/>`;
  const projector =
    gn.godRays(pen, hx, 640, [-170, -160, -150, 150, 160, 170, 180, 190], 4, 600, '#fff0c0', 0.25) +
    cone +
    pen.form(`M${hx - 110} 790L${hx - 80} 660H${hx + 80}L${hx + 110} 790Z`, '#c8901e', { sh: 30, hatch: 2, line: 3, rim: 2.2, inner: `<path d="M${hx - 96} 720H${hx + 96}" stroke="${gn.INK}" stroke-width="3" opacity=".5"/>` }) +
    pen.form(ellD(hx, 660, 90, 18), '#ffe9a0', { line: 2.6, inner: pen.glow(hx, 660, 80, '#ffffff', 0.9) }) +
    `<ellipse cx="${hx}" cy="380" rx="190" ry="40" fill="none" stroke="#fff2c0" stroke-width="3" opacity=".5"/><ellipse cx="${hx}" cy="380" rx="230" ry="52" fill="none" stroke="#ffd27a" stroke-width="2" opacity=".35" stroke-dasharray="18 12"/>` +
    fleece(pen, hx, 360, 0.82, { holo: true }) +
    gn.spark(pen, hx - 170, 250, 14, '#fff6d0') +
    gn.spark(pen, hx + 180, 470, 10, '#fff6d0');
  const drones = saucer(pen, 1450, 230, 0.75, { flip: true, rot: -8 }) + saucer(pen, 1470, 560, 0.85, { flip: true, rot: 4 });
  const villain =
    gn.castShadow(pen, 600, 954, 230, 20, 0.6) +
    pen.glow(560, 400, 260, '#ffd27a', 0.25) +
    gn.aeetes(pen, 600, 960, 1.14, {
      pose: { turn: 0.3, lean: -4, tilt: -8, hipTilt: 4, armN: [-104, -124], armF: [110, 128], legN: { to: [-0.2, 0.96] }, legF: { to: [0.24, 0.95] }, handN: 'open', handF: 'open', wristN: 20, wristF: -20 },
      mood: 'scheming',
      look: [3, -1],
      rim: 2.4,
    }) +
    // The hologram's gold light spilling over him from the right.
    `<ellipse cx="900" cy="460" rx="520" ry="420" fill="${pen.rad([
      [0, '#ffd27a', 0.28],
      [1, '#ffd27a', 0],
    ])}" style="mix-blend-mode:screen"/>`;
  const fore = coins(pen, 150, 900, 300, 2) + coins(pen, 260, 940, 220, 3) + coins(pen, 1480, 930, 280, 4);
  return pen.svg(gn.layer(0.15, space) + gn.layer(0.3, fleet) + gn.layer(0.8, wall + ribs + frame + deco(70) + deco(1530) + floor + projector + drones) + gn.layer(1, villain) + gn.layer(1.3, fore) + gn.vignette(pen, 0.55, '#08040c') + gn.grain(pen, 0.08));
}

