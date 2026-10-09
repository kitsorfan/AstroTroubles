/** Chapter 3 panels for General Brennus's own level: the lifeboat on its way to Aeëtes's mine, and the golden map. */
import * as gn from '../gn';
import { circD, ellD, hologram, torsoPoint, wristPoint } from '../gn/ch3a';

/* ---------------- 23. Brennus in the lifeboat ---------------- */

/** Aeëtes's mining moon: a dusty grey ball with craters, dug into a huge glowing gold pit, little gold rigs on its rim. */
function miningMoon(pen: gn.Pen, x: number, y: number, r: number): string {
  const rand = gn.rng(9);
  let craters = '';
  for (const [cx, cy, cr] of [
    [-0.52, -0.42, 0.12],
    [0.42, -0.58, 0.09],
    [-0.66, 0.22, 0.08],
    [0.6, 0.36, 0.1],
    [-0.2, -0.7, 0.06],
  ]) {
    craters += pen.form(ellD(x + cx * r, y + cy * r, cr * r, cr * r * 0.8), '#8a7a6e', { sh: cr * r * 0.5, line: 1.8, shade: '#4a3e46' });
  }
  const pit = pen.rad(
    [
      [0, '#fff6c8'],
      [0.35, '#ffd060'],
      [0.75, '#e08a20'],
      [1, '#7a3a10'],
    ],
    0.5,
    0.6,
    0.6,
  );
  let rigs = '';
  for (let i = 0; i < 5; i++) {
    const a = -0.42 + i * 0.2 + rand() * 0.05;
    const rx = x + a * r * 1.25;
    const ry = y + 0.12 * r - Math.sqrt(Math.max(0, 1 - (a * 1.25 / 0.6) ** 2)) * 0.26 * r;
    rigs += `<path d="M${gn.r1(rx - 12)} ${gn.r1(ry)}L${gn.r1(rx)} ${gn.r1(ry - 40)}L${gn.r1(rx + 12)} ${gn.r1(ry)}M${gn.r1(rx)} ${gn.r1(ry - 40)}V${gn.r1(ry - 58)}" fill="none" stroke="#3a2a1a" stroke-width="5"/>` + pen.glow(rx, ry - 58, 10, '#ffb020', 0.9);
  }
  return (
    pen.glow(x, y + r * 0.15, r * 1.6, '#ffb030', 0.45) +
    pen.form(circD(x, y, r), '#a89888', { sh: r * 0.5, hatch: 2, rim: 2.4, line: 3, shade: '#3a3046', inner: craters }) +
    pen.form(ellD(x, y + 0.14 * r, 0.6 * r, 0.3 * r), '#ffd060', { line: 3, paint: pit, inner: `<path d="M${x - 0.5 * r} ${y + 0.12 * r}Q${x} ${y + 0.36 * r} ${x + 0.5 * r} ${y + 0.12 * r}M${x - 0.36 * r} ${y + 0.04 * r}Q${x} ${y + 0.22 * r} ${x + 0.36 * r} ${y + 0.04 * r}" fill="none" stroke="#a85a10" stroke-width="4" opacity=".6"/>` }) +
    pen.glow(x, y + 0.2 * r, 0.4 * r, '#fff6c8', 0.7) +
    rigs
  );
}

/** A row of round console lights, inked, each with its glow. */
function lights(pen: gn.Pen, x: number, y: number, n: number, gap: number, colors: string[], r = 10): string {
  let out = '';
  for (let i = 0; i < n; i++) {
    const c = colors[i % colors.length];
    out += pen.glow(x + i * gap, y, r * 2.4, c, 0.6) + `<circle cx="${x + i * gap}" cy="${y}" r="${r}" fill="${c}" stroke="${gn.INK}" stroke-width="2.4"/>`;
  }
  return out;
}

/** 23. Brennus at the controls of the Gorgon's old lifeboat, smiling down at Celestia's sprout in its pot on his belt; Aeëtes's mining moon glows gold through the window. */
export function ch3Brennus(): string {
  const pen = gn.Pen.scene('ch3-brennus', { key: [0.85, -0.3], keyColor: '#ffc860', rim: [-0.8, -0.45], rimColor: '#7fffc0', shadow: '#3a3a6a', depth: 0.6 });
  const space =
    gn.sky(pen, [
      [0, '#05061a'],
      [1, '#1a1236'],
    ]) +
    gn.starfield(pen, 43, 150, 0, 0, 1600, 700) +
    gn.nebula(pen, 600, 220, 380, ['#3a4aa8', '#7a3a8a'], 5, 0.45) +
    gn.gasGiant(pen, 300, 230, 120, { lightDir: [0.95, 0.1], haze: 0.15, sky: '#1a1236' }) +
    miningMoon(pen.relight({ key: [-0.6, -0.6], rim: [0.7, 0.4], rimColor: '#ffd890' }), 1140, 340, 220);
  // The cockpit: an olive metal frame round the window, a strut, rivets and Brennus's red gear on the top bar.
  const win = 'M120 640L1480 640L1420 130Q800 70 180 130Z';
  const frame = pen.form(`M-80 -60H1680V960H-80Z${win}`, '#3a4426', {
    sh: 0,
    line: 0,
    paint: pen.lin([
      [0, '#2a3218'],
      [1, '#4a5432'],
    ]),
  });
  const rivets = [
    [170, 160],
    [440, 112],
    [1160, 112],
    [1430, 160],
    [140, 600],
    [1460, 600],
  ]
    .map(([rx, ry]) => `<circle cx="${rx}" cy="${ry}" r="8" fill="#c9a24a" stroke="${gn.INK}" stroke-width="2.4"/>`)
    .join('');
  const rim =
    pen.form('M100 660L1500 660L1440 112Q800 50 160 112ZM120 640L180 130Q800 70 1420 130L1480 640Z', '#55663a', { sh: 12, line: 3, rim: 2 }) +
    pen.form('M846 82L874 80L890 644L858 644Z', '#4a5432', { sh: 12, hatch: 1, line: 3, rim: 2, axis: [0, 1] }) +
    rivets +
    pen.form(circD(800, 70, 36), '#c8282e', { sh: 14, line: 3, rim: 2, inner: `<circle cx="800" cy="70" r="13" fill="#1a1630"/>` });
  // An overhead panel of switches and the console in front of him, with a joystick and a little green radar.
  const console =
    pen.form('M620 960L660 620Q700 600 760 600H1180Q1260 600 1300 640L1360 960Z', '#4a5432', {
      sh: 40,
      hatch: 2,
      line: 3.2,
      rim: 2.2,
      inner: lights(pen, 760, 650, 6, 52, ['#ff3a4c', '#ffd166', '#3dff8a'], 10) + `<path d="M700 690H1300" stroke="${gn.INK}" stroke-width="3" opacity=".5"/>`,
    }) +
    pen.form(circD(1150, 720, 56), '#0e2a1a', { line: 3, inner: `<path d="M1150 720L1196 690" stroke="#3dff8a" stroke-width="5"/><circle cx="1150" cy="720" r="34" fill="none" stroke="#3dff8a" stroke-width="2" opacity=".6"/><circle cx="1172" cy="700" r="7" fill="#ffd166"/>` + pen.glow(1150, 720, 60, '#3dff8a', 0.35) }) +
    pen.form(ellD(720, 636, 46, 12), '#2a3020', { line: 2.4 }) +
    pen.brush([[720, 636], [700, 612], [676, 592]], 18, gn.INK, [0.05, 0.05]) +
    pen.brush([[720, 636], [700, 612], [676, 592]], 10, '#6a6a60', [0.05, 0.05]) +
    pen.form(circD(672, 586, 18), '#c8282e', { sh: 8, line: 2.6 });
  const dash =
    pen.form('M-80 960V780Q800 740 1680 780V960Z', '#3a4426', { sh: 20, line: 3.2, rim: 2, inner: lights(pen, 120, 830, 5, 46, ['#3dff8a', '#ffd166'], 9) + lights(pen, 1300, 830, 5, 46, ['#ffd166', '#ff3a4c'], 9) }) +
    gn.wash(pen, 800, '#05040c', 0.5);
  // Brennus, one hand on the joystick, smiling down at the sprout on his belt; its pink glow answers.
  const pose: gn.Pose = { turn: 0.4, lean: 4, tilt: 14, hipTilt: 4, armN: { to: [1.6, 2.0] }, armF: { to: [0.66, 1.42], bend: -1 }, legN: { to: [-0.1, 0.98] }, legF: { to: [0.2, 0.96] }, handN: 'grip', handF: 'fist' };
  const bx = 480;
  const by = 940;
  const bs = 1.12;
  const pot = torsoPoint(gn.STOCKY, pose, bx, by, bs, false, -0.62, 0.72);
  const glowUp = pen.glow(pot[0], pot[1] - 20, 170, '#ff8ad8', 0.6) + gn.spark(pen, pot[0] - 40, pot[1] - 90, 10, '#ffd6f2') + gn.spark(pen, pot[0] + 20, pot[1] - 130, 7, '#ffd6f2', 0.8) + gn.spark(pen, pot[0] - 70, pot[1] - 40, 6, '#ffd6f2', 0.7);
  const hero = gn.brennus(pen, bx, by, bs, { pose, mood: 'smile', look: [1, 3.5], shield: false, rim: 2.2 }) + glowUp;
  return pen.svg(gn.layer(0.15, space) + gn.layer(0.7, frame + rim) + gn.layer(1, hero) + gn.layer(1.2, console + dash) + gn.vignette(pen, 0.5, '#05040c') + gn.grain(pen, 0.08));
}

/* ---------------- 24. The golden map ---------------- */

/** The golden map to the Fleece vault: a gold sheet with a dotted red route from a blue start to the green vault on Colchis. Centred at (x, y). */
function goldenMap(pen: gn.Pen, x: number, y: number, s: number, rot: number): string {
  const lp = pen.local(false, rot);
  const route = `<path d="M-120 40Q-60 -40 0 10T120 -30" fill="none" stroke="#a8201a" stroke-width="6" stroke-dasharray="14 10"/><circle cx="-120" cy="40" r="13" fill="#5ec8ff" stroke="${gn.INK}" stroke-width="2.6"/><circle cx="120" cy="-30" r="20" fill="#7dff9a" stroke="${gn.INK}" stroke-width="2.6"/><path d="M108 -34l12 -10 12 10 -12 10z" fill="#ffd166" stroke="${gn.INK}" stroke-width="2"/><path d="M-150 -70Q-130 -82 -110 -70M-60 64Q-40 54 -20 64M60 50Q80 40 100 50" fill="none" stroke="#a8741c" stroke-width="3"/>`;
  const body =
    lp.glow(0, 0, 230, '#ffd166', 0.7) +
    lp.form('M-170 -104Q-100 -116 0 -108Q100 -116 170 -104L176 104Q100 116 0 108Q-100 116 -176 104Z', '#ffd86a', {
      sh: 30,
      hatch: 1,
      rim: 2.4,
      line: 3,
      paint: lp.lin([
        [0, '#fff2b0'],
        [1, '#e8a830'],
      ]),
      inner: `<path d="M-150 -88Q0 -98 150 -88L156 88Q0 98 -156 88Z" fill="none" stroke="#c8901a" stroke-width="5"/>` + route,
    }) +
    gn.spark(lp, -140, -96, 16, '#ffffff') +
    gn.spark(lp, 150, 80, 10, '#fff6d0');
  return gn.at(x, y, s, body, false, rot);
}

/** A gold wall panel: an arched recess with a sunburst and a glowing "A" crest at its top. */
function wallPanel(pen: gn.Pen, x: number, w: number, top: number, bottom: number): string {
  const d = `M${x - w / 2} ${bottom}V${top + w / 2}Q${x - w / 2} ${top} ${x} ${top}Q${x + w / 2} ${top} ${x + w / 2} ${top + w / 2}V${bottom}Z`;
  const rays = Array.from({ length: 7 }, (_, i) => {
    const a = -60 + i * 20;
    const p = gn.add([x, bottom], gn.mul(gn.dir(180 + a), (bottom - top) * 0.9));
    return `M${x} ${bottom}L${gn.r1(p[0])} ${gn.r1(p[1])}`;
  }).join('');
  return pen.form(d, '#a8741c', { sh: w * 0.3, hatch: 1, line: 2.6, rim: 1.6, shade: '#5a3418', inner: `<path d="${rays}" stroke="#ffd166" stroke-width="4" opacity=".35"/>` });
}

/** 24. In Aeëtes's golden office, Brennus holds the golden map up high with a grin; Aeëtes fumes on a hologram over his desk. */
export function ch3Map(): string {
  const pen = gn.Pen.scene('ch3-map', { key: [-0.6, -0.8], keyColor: '#ffd890', rim: [0.9, -0.25], rimColor: '#7fe6ff', shadow: '#5a3a6a', depth: 0.55 });
  const room =
    gn.sky(pen, [
      [0, '#3a200e'],
      [0.6, '#6a4018'],
      [1, '#2a160a'],
    ]) +
    [140, 450, 760, 1070, 1380].map((px) => wallPanel(pen, px, 220, 90, 600)).join('') +
    pen.glow(300, 160, 320, '#ffd890', 0.5) +
    // The great "A" crest over it all.
    pen.glow(760, 170, 90, '#ffd166', 0.8) +
    `<path d="M720 220L760 120L800 220M734 186H786" fill="none" stroke="${gn.INK}" stroke-width="20" stroke-linecap="round" stroke-linejoin="round"/><path d="M720 220L760 120L800 220M734 186H786" fill="none" stroke="#fff2b0" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/>` +
    pen.form('M-80 620H1680V960H-80Z', '#3a2010', {
      sh: 0,
      line: 3,
      paint: pen.lin([
        [0, '#6a3a18'],
        [1, '#1a0c06'],
      ]),
      inner: `<path d="M-80 680H1680M200 960L520 620M1400 960L1080 620" stroke="#e8b43a" stroke-width="4" opacity=".35"/>`,
    });
  // The desk, piled with coins, and the projector on it throwing Aeëtes's furious hologram into the air.
  const desk =
    pen.form('M900 960V700H1520V960Z', '#c8901e', { sh: 60, hatch: 2, line: 3.2, rim: 2.2, inner: `<path d="M960 760H1460V900H960Z" fill="none" stroke="${gn.INK}" stroke-width="3" opacity=".5"/><path d="M1210 760V900" stroke="${gn.INK}" stroke-width="3" opacity=".5"/><circle cx="1180" cy="830" r="8" fill="#ffd166" stroke="${gn.INK}" stroke-width="2"/><circle cx="1240" cy="830" r="8" fill="#ffd166" stroke="${gn.INK}" stroke-width="2"/>` }) +
    pen.form('M860 700L900 650H1520L1560 700Z', '#ffd166', { sh: 12, line: 3, rim: 2 }) +
    [0, 1, 2, 3].map((i) => pen.form(ellD(1400 + i * 14, 660 - i * 13, 44, 12), '#ffd166', { sh: 4, line: 2.2 })).join('') +
    pen.form(ellD(1100, 656, 50, 12), '#3a3a4a', { line: 2.4, inner: pen.glow(1100, 652, 46, '#bff4ff', 0.9) });
  const holoBox: [number, number, number, number] = [960, 130, 480, 520];
  const cone = `<path d="M1060 652L960 380V130H1440V380L1140 652Z" fill="${pen.lin([
    [0, '#7fe6ff', 0.06],
    [1, '#7fe6ff', 0.3],
  ])}"/>`;
  const angry = gn.aeetes(pen, 1220, 650, 0.6, {
    flip: true,
    pose: { turn: 0.35, lean: 10, tilt: 4, armN: [60, 100], armF: [125, 150], legN: { to: [-0.18, 0.97] }, legF: { to: [0.22, 0.96] }, handN: 'point', handF: 'fist' },
    mood: 'angry',
    look: [2, 0],
  });
  const holo = cone + hologram(pen, `<rect x="960" y="130" width="480" height="520" fill="#0b2a3a" opacity=".55"/>` + angry, holoBox) + `<rect x="960" y="130" width="480" height="520" fill="none" stroke="#bff4ff" stroke-width="3" opacity=".7"/>`;
  // Brennus, the golden map held high, grinning under his moustache.
  const pose: gn.Pose = { turn: 0.45, lean: -2, tilt: -4, hipTilt: 5, armN: { to: [-0.62, 1.42], bend: 1 }, armF: { to: [0.7, -1.75] }, legN: { to: [-0.16, 0.97] }, legF: { to: [0.24, 0.95] }, handN: 'fist', handF: 'grip' };
  const bx = 470;
  const by = 940;
  const bs = 1.0;
  const hand = wristPoint(gn.STOCKY, pose, bx, by, bs, false, 1);
  const hero = gn.castShadow(pen, bx, by - 6, 200, 18, 0.5) + gn.brennus(pen, bx, by, bs, { pose, mood: 'grin', look: [3, -1], shield: false, rim: 2.2 }) + goldenMap(pen, hand.p[0] + 30, hand.p[1] - 62, 0.74, -6);
  const fore = gn.castShadow(pen, 120, 940, 200, 20, 0.5) + [0, 1, 2].map((i) => pen.form(ellD(100 + i * 40, 930 - i * 16, 52, 14), '#ffd166', { sh: 4, line: 2.4 })).join('');
  return pen.svg(gn.layer(0.3, room) + gn.layer(0.8, desk + holo) + gn.layer(1, hero) + gn.layer(1.25, fore) + gn.vignette(pen, 0.5, '#140804') + gn.grain(pen, 0.08));
}

