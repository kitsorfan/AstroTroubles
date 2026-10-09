/** Chapter 3 panels for the Garden of Colchis: arriving in the Gardeners' garden, and the Sleepless Dragon sung to sleep. */
import * as gn from '../gn';
import { crystalTree, GARDEN, giantFlower, lightFountain, seedSprite, treeTemple, weeder } from '../gn/ch3c';

/** A meadow from y down: a gentle rise of grass, lit along its crest, with tufts and a pale stone path toward (vx, y). */
function meadow(pen: gn.Pen, y: number, vx: number, seed: number): string {
  const path = `M${vx - 30} ${y + 4}Q${vx - 40} ${y + 120} ${vx - 260} 980H${vx + 160}Q${vx + 30} ${y + 120} ${vx + 30} ${y + 4}Z`;
  const rand = gn.rng(seed);
  let stones = '';
  for (let i = 0; i < 9; i++) {
    const t = (i + 0.5) / 9;
    const cy = y + 10 + t * t * 330;
    const cx = vx - 10 - t * t * 70 + (rand() - 0.5) * 30 * t;
    stones += `<ellipse cx="${gn.r1(cx)}" cy="${gn.r1(cy)}" rx="${gn.r1(16 + t * 70)}" ry="${gn.r1(5 + t * 20)}" fill="#e8dcc8" stroke="${gn.INK}" stroke-width="${gn.r1(1 + t * 2)}"/>`;
  }
  const inner = `<path d="${path}" fill="#3a6a3a" opacity=".35"/>` + stones;
  return pen.form(`M-80 ${y + 30}Q400 ${y - 20} 800 ${y}Q1200 ${y + 20} 1680 ${y - 10}V980H-80Z`, '#5aa848', {
    sh: 40,
    line: 3,
    paint: pen.lin([
      [0, '#9ad06a'],
      [0.5, '#4a9a48'],
      [1, '#1e4a2a'],
    ]),
    inner,
  });
}

/** 25. The Argonauts step out into the Gardeners' garden at dusk: flowers as tall as houses, trees of living crystal, a fountain of light-words, seed-sprites, the tree-temple far off, and a weeder drone up to no good. */
export function ch3Garden(): string {
  const pen = gn.Pen.scene('ch3-garden', { key: [0.85, -0.45], keyColor: '#ffc890', rim: [-0.9, -0.35], rimColor: '#9fffe0', shadow: '#6a4a9a', depth: 0.5 });
  const back = pen.relight({ key: [0.6, -0.8], depth: 0.6 });
  const sunX = 1300;
  const sunY = 540;
  const sky =
    gn.sky(pen, [
      [0, '#221a5a'],
      [0.35, '#6a4a9a'],
      [0.58, '#ff9a8a'],
      [0.68, '#ffd0a0'],
    ]) +
    gn.starfield(pen, 91, 60, 0, 0, 1600, 260, '#fff0f8') +
    gn.gasGiant(pen, 300, 150, 110, { lightDir: [0.9, 0.3], haze: 0.3, sky: '#7a5aa8' }) +
    gn.godRays(pen, sunX, sunY, [-160, -140, -120, 120, 140, 160, 180, 200], 6, 1200, '#ffe0c0', 0.25) +
    gn.bloom(pen, sunX, sunY, 110, '#fff0d0', 0.9);
  // The tree-temple far off, low hills, and the haze of the evening.
  const far =
    treeTemple(pen, 1000, 590, 0.62, '#ffc8b8') +
    gn.silhouette(
      [
        [-80, 600],
        [200, 540],
        [480, 568],
        [760, 552],
        [1100, 572],
        [1400, 540],
        [1680, 570],
        [1680, 640],
        [-80, 640],
      ],
      '#8a6aa8',
      0.95,
    ) +
    gn.silhouette(
      [
        [-80, 610],
        [300, 586],
        [700, 604],
        [1100, 596],
        [1680, 612],
        [1680, 660],
        [-80, 660],
      ],
      '#6a8a7a',
    ) +
    gn.haze(pen, 500, 660, '#ffc8a8', 0.6);
  // The garden: crystal trees, the light fountain, a glowing pond, the parked Argo.
  const garden =
    meadow(pen, 620, 1000, 4) +
    `<ellipse cx="1150" cy="706" rx="170" ry="26" fill="${GARDEN.mint}" opacity=".75"/><ellipse cx="1140" cy="702" rx="120" ry="14" fill="#e8fff4" opacity=".7"/>` +
    pen.glow(1150, 696, 260, GARDEN.mint, 0.5, 70) +
    crystalTree(back, 760, 650, 0.62, { seed: 1 }) +
    crystalTree(pen, 1150, 700, 0.9, { flip: true, seed: 2 }) +
    lightFountain(pen, 930, 712, 0.62) +
    giantFlower(pen, 110, 760, 520, '#c9a0ff', { bend: 0.14, seed: 4, n: 7, tilt: 8 }) +
    gn.wash(pen, 760, '#10281a', 0.5);
  // The big flower on the right, and a weeder drone snipping at it; seed-sprites everywhere.
  const big =
    giantFlower(pen, 1480, 960, 620, '#ff9ad8', { bend: -0.14, seed: 7, tilt: -10 }) +
    gn.streaks(pen, 1120, 250, -110, 140, 3, 40, '#ffffff', 0.5, 3) +
    weeder(pen, 1190, 270, 0.8, { snip: true, rot: 8 }) +
    seedSprite(pen, 790, 400, 0.7, GARDEN.mint, { rot: -8 }) +
    seedSprite(pen, 900, 250, 0.55, '#ff9ad8', { rot: 10 }) +
    seedSprite(pen, 1040, 470, 0.5, GARDEN.gold, { flip: true });
  // The heroes, just off the ramp, gazing at it all.
  const wonder: gn.Pose = { turn: 0.38, lean: -3, tilt: -8, hipTilt: 5, armN: [-28, -48], armF: [34, 60], legN: { to: [-0.08, 0.98] }, legF: { to: [0.24, 0.95] }, handN: 'open', handF: 'open' };
  const heroes =
    gn.castShadow(pen, 340, 880, 130, 12, 0.45) +
    gn.atalanta(pen, 340, 884, 0.94, { pose: wonder, mood: 'smile', look: [2.4, -2.6], wind: 0.5 }) +
    gn.castShadow(pen, 590, 884, 140, 12, 0.45) +
    gn.jason(pen, 590, 888, 0.97, { pose: 'point', mood: 'surprised', look: [2.6, -2.4] }) +
    gn.lux(pen, 470, 330, 0.85, 'happy', { look: [8, -4] }) +
    gn.iris(pen, 330, 210, 0.7, 'happy', { rot: 10 });
  const fore = gn.grass(pen, -70, 300, 930, 5, 150, '#10281a', '#4a8a4a', 9) + gn.grass(pen, 1300, 1680, 940, 5, 150, '#10281a', '#4a8a4a', 10);
  return pen.svg(gn.layer(0.15, sky) + gn.layer(0.35, far) + gn.layer(0.6, garden) + gn.layer(0.85, big) + gn.layer(1, heroes) + gn.layer(1.25, fore) + gn.vignette(pen, 0.45, '#1a1030') + gn.grain(pen, 0.08));
}

/** 26. Night in the garden: the Sleepless Dragon curls up around its crystal tree as LUX and IRIS sing it to sleep. */
export function ch3Dragon(): string {
  const pen = gn.Pen.scene('ch3-dragon', { key: [-0.6, -0.8], keyColor: '#d8e4ff', rim: [0.8, -0.5], rimColor: '#8fffd8', shadow: '#2a2a6a', depth: 0.6 });
  return pen.svg(gn.sky(pen, [[0, '#0e0c30'], [1, '#2c2266']]));
}
