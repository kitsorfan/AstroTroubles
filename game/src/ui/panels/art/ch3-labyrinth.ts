/** Chapter 3 panels for Medusa's Labyrinth: the Mirror Shield in the Gardeners' shrine, and MEDUSA asleep by the open gate. */
import * as gn from '../gn';
import { blockWall, cableSnake, crystals, LAB, medusaAsleep, mirrorShield, rune, stoneBot, zed } from '../gn/ch3c';

const RUNES = [LAB.gaze, '#5ec8ff', '#ffd166', '#ff8ad8'];

/**
 * A great round-topped arch of pale green stone (inner edges x0, x1, feet at y, the opening's top at
 * `top`): voussoirs round the curve, courses down the pillars, a keystone with a glowing light-word.
 */
function stoneArch(pen: gn.Pen, x0: number, x1: number, y: number, top: number, w: number, color: string, glow: string): string {
  const mid = (x0 + x1) / 2;
  const r = (x1 - x0) / 2;
  const spring = top + r;
  const d = `M${x0 - w} ${y}V${spring}A${r + w} ${r + w} 0 0 1 ${x1 + w} ${spring}V${y}H${x1}V${spring}A${r} ${r} 0 0 0 ${x0} ${spring}V${y}Z`;
  let joints = '';
  for (let yy = y - 90; yy > spring; yy -= 90) joints += `M${x0 - w} ${yy}H${x0}M${x1} ${yy}H${x1 + w}`;
  for (let i = 1; i < 9; i++) {
    const a = Math.PI * (i / 9);
    joints += `M${gn.r1(mid - Math.cos(a) * r)} ${gn.r1(spring - Math.sin(a) * r)}L${gn.r1(mid - Math.cos(a) * (r + w))} ${gn.r1(spring - Math.sin(a) * (r + w))}`;
  }
  const runes = [0, 1, 2].map((i) => rune(pen, x0 - w / 2, y - 140 - i * 120, 0.9, glow, i) + rune(pen, x1 + w / 2, y - 140 - i * 120, 0.9, glow, i + 3)).join('');
  const inner = `<path d="${joints}" fill="none" stroke="${gn.INK}" stroke-width="2.8" opacity=".55"/>` + runes;
  return (
    pen.form(d, color, { sh: 90, hatch: 2, rim: 2.4, line: 3.2, inner }) +
    pen.form(`M${mid - 40} ${top - w - 6}H${mid + 40}L${mid + 30} ${top + 10}H${mid - 30}Z`, gn.mix(color, '#ffffff', 0.15), { sh: 20, hatch: 1, line: 3, rim: 2, inner: rune(pen, mid, top - w / 2, 1, glow, 0) })
  );
}

/** A stone floor from y down, its slab joints running back toward (vx, vy), rune lines glowing in a few. */
function floor(pen: gn.Pen, y: number, vx: number, color: string, glow: string): string {
  let joints = '';
  for (let i = -8; i <= 8; i++) joints += `M${vx + i * 60} ${y}L${vx + i * 420} ${y + 300}`;
  for (const yy of [y + 22, y + 60, y + 120, y + 210]) joints += `M-80 ${yy}H1680`;
  const lines = pen.brushes(
    [
      [
        [
          [vx - 90, y + 6],
          [vx - 520, y + 240],
        ],
        5,
      ],
      [
        [
          [vx + 90, y + 6],
          [vx + 520, y + 240],
        ],
        5,
      ],
    ],
    glow,
    [0.1, 0.1],
    0.7,
  );
  const inner = `<path d="${joints}" fill="none" stroke="${gn.INK}" stroke-width="2.4" opacity=".5"/>` + lines;
  return pen.form(`M-80 ${y}H1680V960H-80Z`, color, { sh: 50, hatch: 1, line: 3.2, inner });
}

/** Ivy hanging from the top of the frame at x: a wavy dark stem with leaves, `l` long. */
function ivy(pen: gn.Pen, x: number, l: number, seed: number, dark: string, light: string): string {
  const rand = gn.rng(seed);
  const pts: gn.P[] = [];
  for (let i = 0; i <= 5; i++) pts.push([x + Math.sin(i * 1.3 + seed) * 18, -60 + (i / 5) * (l + 60)]);
  const leaves: [gn.P[], number][] = [];
  const lit: [gn.P[], number][] = [];
  for (let i = 0; i < 10; i++) {
    const p = gn.lerp(pts[Math.floor(i / 2)], pts[Math.floor(i / 2) + 1], (i % 2) * 0.5 + 0.25);
    const side = i % 2 ? 1 : -1;
    const tip = gn.add(p, [side * (24 + rand() * 16), 16 + rand() * 12]);
    leaves.push([[p, gn.lerp(p, tip, 0.5), tip], 16]);
    lit.push([[gn.add(p, [0, -2]), gn.lerp(p, tip, 0.6)], 4]);
  }
  return pen.brush(pts, 7, gn.INK, [0.02, 0.4]) + pen.brushes(leaves, dark, [0.2, 0.7]) + pen.brushes(lit, light, [0.2, 0.6], 0.8);
}

/** 25. In the Gardeners' shrine Jason lifts the Mirror Shield into a shaft of light from above; it flares and throws the beam across the hall. Atalanta teases, IRIS explains, LUX gapes. */
export function ch3Mirror(): string {
  const pen = gn.Pen.scene('ch3-mirror', { key: [0.3, -1], keyColor: '#e6fff2', rim: [-0.95, -0.25], rimColor: '#8dffc4', shadow: '#2c3a6a', depth: 0.6 });
  const sx = 836;
  const sy = 246;
  const sky = gn.sky(pen, [
    [0, '#04100c'],
    [0.6, '#0b2219'],
    [1, '#123024'],
  ]);
  // The far wall of the shrine, in the gloom.
  const far =
    blockWall(pen.relight({ key: [0, -1] }), -80, -60, 1680, 720, '#2a4536', { seed: 25, bw: 180, bh: 100, runes: RUNES, runeRate: 0.08, line: 2 }) +
    gn.wash(pen, 360, '#020806', 0.55, true) +
    stoneArch(pen.relight({ key: [0.2, -1], depth: 0.7 }), 470, 1130, 720, 70, 110, '#6a8c76', LAB.gaze) +
    // The niche inside the arch: darker, with the crack in its roof the light falls through.
    `<path d="M470 720V400A330 330 0 0 1 1130 400V720Z" fill="#071811" opacity=".55"/>` +
    gn.haze(pen, 560, 760, '#3a6a52', 0.35);
  // The shaft of light from the crack, the dust in it, and its bounce off the shield toward a wall crystal.
  const shaft = pen.lin([
    [0, '#ffffff', 0.85],
    [0.75, '#dfffee', 0.45],
    [1, '#dfffee', 0],
  ]);
  const beam = pen.lin(
    [
      [0, '#ffffff', 0.95],
      [1, '#b8ffd8', 0.25],
    ],
    sx,
    sy,
    1500,
    110,
    true,
  );
  const rand = gn.rng(9);
  let motes = '';
  for (let i = 0; i < 40; i++) {
    const t = rand();
    motes += `M${gn.r1(gn.lerp([760, -40], [sx - 20, sy], t)[0] + (rand() - 0.3) * (40 + t * 120))} ${gn.r1(-40 + t * (sy + 40))}h0`;
  }
  const light =
    `<path d="M736 -60L860 -60L${sx + 90} ${sy - 30}L${sx - 110} ${sy + 20}Z" fill="${shaft}"/>` +
    `<path d="M770 -60L830 -60L${sx + 30} ${sy - 40}L${sx - 50} ${sy - 10}Z" fill="${shaft}"/>` +
    gn.bloom(pen, 800, -10, 70, '#e8fff2', 0.9) +
    `<path d="${motes}" stroke="#ffffff" stroke-width="3" opacity=".7"/>` +
    `<path d="M${sx + 30} ${sy - 50}L1416 118L1410 186L${sx + 50} ${sy + 30}Z" fill="${beam}" opacity=".55"/>` +
    pen.brush(
      [
        [sx + 40, sy - 8],
        [1130, 190],
        [1400, 150],
      ],
      9,
      '#ffffff',
      [0.05, 0.3],
      0.9,
    ) +
    crystals(pen, 1404, 200, 0.6, '#bfffe0', { seed: 4, n: 3, spread: 50, glow: 0.9 }) +
    gn.spark(pen, 1400, 150, 46, '#ffffff') +
    gn.bloom(pen, 1400, 150, 44, '#c8ffe0', 0.8) +
    // The shield's flare throws rays all round.
    gn.godRays(pen, sx - 30, sy - 40, [20, 60, 100, 140, 200, 240, 280, 320], 6, 420, '#e8fff2', 0.35);
  // The statues of Aeëtes's robots (in the gloom, behind a veil of haze), the altar, the floor.
  const dim = pen.relight({ key: [0.5, -0.9], depth: 0.75 });
  const mid =
    gn.castShadow(pen, 150, 724, 120, 12, 0.5) +
    stoneBot(dim, 150, 728, 0.66, { seed: 2, color: '#7a8a7c', moss: '#4a7a40' }) +
    gn.castShadow(pen, 1470, 724, 120, 12, 0.5) +
    stoneBot(dim, 1470, 728, 0.62, { flip: true, seed: 7, color: '#7a8a7c', moss: '#4a7a40' }) +
    gn.haze(pen, 300, 760, '#0e2a1e', 0.55) +
    floor(pen, 720, 800, '#3e5c4a', LAB.gaze) +
    // The pool of light the shaft throws on the floor round Jason.
    pen.glow(720, 800, 480, '#c8ffe0', 0.55, 110) +
    gn.wash(pen, 820, '#03100a', 0.6);
  const altarInner = [580, 660, 740, 820, 900].map((rx, i) => rune(pen, rx, 716, 0.7, LAB.gaze, i)).join('') + `<path d="M520 690H960" stroke="${gn.INK}" stroke-width="2.4" opacity=".5"/>`;
  const altar =
    pen.form('M500 780L530 660H950L980 780Z', LAB.stone, { sh: 34, hatch: 2, line: 3.2, rim: 2, inner: altarInner }) +
    pen.form('M510 668H970V640H510Z', '#c8963a', { sh: 6, line: 2.8, rim: 1.6 }) +
    // The empty cradle where the shield lay, still glowing.
    pen.glow(740, 640, 170, '#dfffee', 0.75, 46) +
    pen.form('M626 640Q640 606 740 604Q840 606 854 640Q740 656 626 640Z', LAB.bronze, { sh: 10, line: 2.6, rim: 1.6, inner: `<path d="M644 634Q740 618 836 634Q740 646 644 634Z" fill="#dfffee" opacity=".85"/>` });
  // The heroes are lit by the shaft and the shield's flare above them (a lower key than the room's).
  const jp = pen.relight({ key: [0.9, -0.42], depth: 0.55 });
  const ap = pen.relight({ key: [-0.92, -0.4], depth: 0.55, rim: [0.9, -0.3] });
  const heroes =
    gn.castShadow(pen, 640, 884, 170, 16, 0.55) +
    gn.lux(jp, 400, 380, 0.95, 'glow', { look: [8, -7] }) +
    gn.jason(jp, 640, 888, 1.15, {
      pose: { turn: 0.5, lean: -4, tilt: -10, hipTilt: 4, armN: { to: [0.95, -0.82] }, armF: { to: [2.15, -0.66] }, legN: { to: [-0.22, 0.96] }, legF: { to: [0.26, 0.95] }, handN: 'grip', handF: 'grip', wristN: -60, wristF: 40 },
      mood: 'grin',
      look: [3, -3.4],
      rim: 2.2,
    }) +
    mirrorShield(pen, sx, sy, 104, { tilt: -14, squash: 0.93, flare: [-0.35, -0.45] }) +
    gn.castShadow(pen, 1150, 884, 150, 14, 0.5) +
    gn.atalanta(ap, 1160, 888, 1.1, { pose: 'hips', mood: 'grin', flip: true, look: [2.6, -2.2], rim: 2 }) +
    gn.iris(ap, 1300, 360, 0.8, 'normal', { flip: true, rot: -8 });
  const fore =
    crystals(pen, 110, 960, 1.4, '#9dffd0', { seed: 2, n: 5, spread: 70 }) +
    crystals(pen, 1500, 960, 1.2, '#9dffd0', { seed: 6, n: 4, spread: 60 }) +
    ivy(pen, 60, 300, 1, '#1e4a2a', '#5fa060') +
    ivy(pen, 1530, 240, 3, '#1e4a2a', '#5fa060');
  return pen.svg(gn.layer(0.15, sky) + gn.layer(0.35, far) + gn.layer(0.5, light) + gn.layer(0.75, mid + altar) + gn.layer(1, heroes) + gn.layer(1.3, fore) + gn.vignette(pen, 0.75, '#020a06') + gn.grain(pen, 0.08));
}

/** 26. MEDUSA asleep on her plinth, her cable snakes curled up like kittens; behind her the old gate of Colchis stands open on daylight, and the heroes tiptoe past. */
export function ch3Medusa(): string {
  const pen = gn.Pen.scene('ch3-medusa', { key: [0.85, -0.5], keyColor: '#fff0c8', rim: [-0.9, -0.3], rimColor: '#7dffc8', shadow: '#2e3a6a', depth: 0.6 });
  const gx0 = 1060;
  const gx1 = 1420;
  const gTop = 150;
  const gMid = (gx0 + gx1) / 2;
  const sky = gn.sky(pen, [
    [0, '#04100c'],
    [0.6, '#0b2219'],
    [1, '#123024'],
  ]);
  // The hall's far wall, and the old gate standing open on the daylight of the shaft beyond.
  const day = pen.lin([
    [0, '#fffbe8'],
    [0.6, '#ffe6a8'],
    [1, '#f0c890'],
  ]);
  const steps = [0, 1, 2, 3, 4, 5].map((i) => `M${gx0} ${620 - i * 46}H${gx1}`).join('');
  const far =
    blockWall(pen.relight({ key: [0, -1] }), -80, -60, 1680, 720, '#2a4536', { seed: 26, bw: 180, bh: 100, runes: RUNES, runeRate: 0.07, line: 2 }) +
    gn.wash(pen, 380, '#020806', 0.5, true) +
    // Daylight in the doorway: the shaft's stairs climbing away, pale in the glare.
    `<path d="M${gx0} 720V${gTop + 180}A180 180 0 0 1 ${gx1} ${gTop + 180}V720Z" fill="${day}"/>` +
    `<path d="${steps}" stroke="#d8b088" stroke-width="5" opacity=".55"/>` +
    gn.bloom(pen, gMid, 300, 150, '#fff6d8', 0.9) +
    stoneArch(pen.relight({ key: [-0.3, -1], depth: 0.75 }), gx0, gx1, 720, gTop, 100, '#6a8c76', '#ffd166') +
    gn.godRays(pen, gMid, 330, [-40, -60, -80, -100, -120, -140], 7, 1300, '#fff0c8', 0.22) +
    gn.haze(pen, 560, 760, '#3a6a52', 0.35);
  // The floor, with the daylight spilling across it and the heroes' long shadows.
  const ground =
    floor(pen, 720, 900, '#3e5c4a', '#7dffc8') +
    pen.glow(gMid, 760, 560, '#fff0c8', 0.55, 90) +
    gn.longShadow(pen, 1000, 880, -62, 520, 70, 0.5) +
    gn.longShadow(pen, 1250, 880, -62, 520, 70, 0.5) +
    gn.wash(pen, 830, '#03100a', 0.6);
  // MEDUSA, asleep, and her snores.
  const med =
    gn.castShadow(pen, 470, 800, 330, 26, 0.55) +
    medusaAsleep(pen, 470, 804, 0.92) +
    zed(pen, 690, 250, 1.1, '#bff4ff') +
    zed(pen, 750, 180, 1.4, '#bff4ff') +
    zed(pen, 820, 96, 1.8, '#bff4ff', 0.8);
  // The heroes tiptoe past toward the gate, backlit by the day. Jason waves goodnight.
  // Atalanta sneaking on tiptoe, wrists up like a cat burglar.
  const tiptoe: gn.Pose = {
    turn: 0.55,
    lean: 12,
    hipTilt: 4,
    armN: [46, 122],
    armF: [16, 118],
    legN: { to: [0.26, 0.88] },
    legF: { to: [-0.28, 0.9] },
    handN: 'relaxed',
    handF: 'relaxed',
    wristN: 60,
    wristF: 60,
    footN: 30,
    footF: 50,
  };
  const heroes =
    gn.castShadow(pen, 900, 880, 130, 12, 0.5) +
    gn.atalanta(pen, 900, 884, 1.04, { pose: tiptoe, mood: 'grin', look: [3, -1], rim: 3 }) +
    gn.iris(pen, 1110, 300, 0.78, 'normal', { flip: true, rot: -6 }) +
    gn.castShadow(pen, 1290, 880, 140, 12, 0.5) +
    gn.jason(pen, 1290, 884, 1.06, { pose: 'wave', mood: 'smile', flip: true, look: [2.4, -1], rim: 3 }) +
    gn.lux(pen, 1480, 540, 0.85, 'happy', { flip: true });
  // A stray cable snake asleep in the foreground, curled like a cat.
  const fore =
    cableSnake(
      pen,
      [
        [-80, 800],
        [80, 790],
        [230, 820],
        [260, 890],
        [170, 930],
        [110, 890],
        [160, 860],
      ],
      44,
      { asleep: true },
    ) +
    ivy(pen, 1560, 260, 5, '#1e4a2a', '#5fa060') +
    ivy(pen, 40, 200, 6, '#1e4a2a', '#5fa060');
  return pen.svg(gn.layer(0.15, sky) + gn.layer(0.35, far) + gn.layer(0.7, ground + med) + gn.layer(1, heroes) + gn.layer(1.3, fore) + gn.vignette(pen, 0.7, '#020a06') + gn.grain(pen, 0.08));
}
