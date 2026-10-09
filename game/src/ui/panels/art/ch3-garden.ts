/** Chapter 3 panels for the Garden of Colchis: arriving in the Gardeners' garden, and the Sleepless Dragon sung to sleep. */
import * as gn from '../gn';
import { crystalTree, DRAGON, dragonHead, GARDEN, giantFlower, lightFountain, lightNote, pylon, seedSprite, smoothShade, treeTemple, tube, weeder } from '../gn/ch3c';

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
    smoothShade(pen, 'ch3-garden-at', (p) => gn.atalanta(p, 340, 884, 0.94, { pose: wonder, mood: 'smile', look: [2.4, -2.6], wind: 0.5 })) +
    gn.castShadow(pen, 590, 884, 140, 12, 0.45) +
    smoothShade(pen, 'ch3-garden-ja', (p) => gn.jason(p, 590, 888, 0.97, { pose: 'point', mood: 'surprised', look: [2.6, -2.4] })) +
    gn.lux(pen, 470, 330, 0.85, 'happy', { look: [8, -4] }) +
    gn.iris(pen, 330, 210, 0.7, 'happy', { rot: 10 });
  const fore = gn.grass(pen, -70, 300, 930, 5, 150, '#10281a', '#4a8a4a', 9) + gn.grass(pen, 1300, 1680, 940, 5, 150, '#10281a', '#4a8a4a', 10);
  return pen.svg(gn.layer(0.15, sky) + gn.layer(0.35, far) + gn.layer(0.6, garden) + gn.layer(0.85, big) + gn.layer(1, heroes) + gn.layer(1.25, fore) + gn.vignette(pen, 0.45, '#1a1030') + gn.grain(pen, 0.08));
}

/**
 * 26. Night in the garden: the four lullaby pylons beam their colours into the sky, LUX and IRIS sing,
 * and the Sleepless Dragon curls up around its crystal tree, its eyes closing and a smile on its face.
 * Jason and Atalanta watch, hardly daring to breathe.
 */
export function ch3Dragon(): string {
  const pen = gn.Pen.scene('ch3-dragon', { key: [-0.6, -0.8], keyColor: '#d8e4ff', rim: [0.8, -0.5], rimColor: '#8fffd8', shadow: '#2a2a6a', depth: 0.6 });
  const sky =
    gn.sky(pen, [
      [0, '#070720'],
      [0.5, '#1a1a52'],
      [0.75, '#3a2a6a'],
    ]) +
    pen.glow(1100, 180, 460, '#5a4ab0', 0.45, 200) +
    gn.starfield(pen, 37, 160, -80, -60, 1760, 620, '#f4f0ff') +
    // A thin crescent moon.
    gn.bloom(pen, 220, 140, 60, '#e8eeff', 0.7) +
    `<circle cx="220" cy="140" r="44" fill="#f4f6ff"/><circle cx="238" cy="128" r="40" fill="#0d0c2c"/>`;
  // The pylons beaming into the sky, dark hills, the meadow round the tree.
  const far =
    pylon(pen, 120, 640, 0.9, '#5ec8ff') +
    pylon(pen, 390, 610, 0.7, '#7dff9a') +
    pylon(pen, 1220, 610, 0.7, '#ff6fcf') +
    pylon(pen, 1490, 640, 0.9, '#ffd166') +
    gn.silhouette(
      [
        [-80, 640],
        [260, 600],
        [600, 620],
        [1000, 604],
        [1340, 620],
        [1680, 600],
        [1680, 700],
        [-80, 700],
      ],
      '#1a2448',
    ) +
    gn.haze(pen, 540, 700, '#3a3a8a', 0.5);
  const ground =
    pen.form('M-80 670Q800 630 1680 670V980H-80Z', '#1e3a3a', {
      line: 3,
      paint: pen.lin([
        [0, '#2a5a4a'],
        [1, '#0a1a1a'],
      ]),
    }) + pen.glow(800, 720, 620, DRAGON.glow, 0.45, 150);
  // The dragon: the coil behind the tree, the tree, then the tail and the neck in front, and the head on top.
  const back = tube(
    pen,
    [
      [1110, 744],
      [1060, 664],
      [920, 618],
      [760, 614],
      [620, 642],
      [530, 702],
      [520, 762],
    ],
    56,
    56,
    { spikes: 7, seed: 2 },
  );
  const tail = tube(
    pen,
    [
      [520, 762],
      [600, 838],
      [800, 868],
      [1010, 852],
      [1150, 812],
      [1236, 822],
      [1244, 864],
      [1196, 880],
      [1176, 852],
    ],
    60,
    10,
    { spikes: 7, seed: 3 },
  );
  const neck = tube(
    pen,
    [
      [1110, 744],
      [1000, 782],
      [820, 794],
      [640, 778],
      [480, 738],
      [396, 660],
      [394, 572],
      [450, 516],
      [530, 520],
      [556, 548],
    ],
    62,
    46,
    { spikes: 7, seed: 5 },
  );
  // Drawn a size up round the foot of the tree (840, 880), so it dwarfs the heroes. Its head rests on the coil behind.
  const dragon = gn.at(-168, -176, 1.2, back + crystalTree(pen, 800, 730, 1.1, { seed: 4, glow: 0.85 }) + tail + neck + dragonHead(pen, 540, 616, 1.1, { lid: 0.72 }));
  // LUX and IRIS singing, notes and ribbons of light drifting down to the dragon.
  const ribbon = (pts: gn.P[], c: string) => pen.brush(pts, 14, c, [0.1, 0.8], 0.25) + pen.brush(pts, 5, c, [0.1, 0.8], 0.9);
  const song =
    ribbon(
      [
        [290, 300],
        [380, 250],
        [500, 300],
        [620, 400],
      ],
      '#7fe6ff',
    ) +
    gn.RAINBOW.map((c, i) =>
      ribbon(
        [
          [1110, 320 + i * 6],
          [1000, 350 + i * 8],
          [900, 410 + i * 6],
          [790, 440 + i * 4],
        ],
        c,
      ),
    ).join('') +
    lightNote(pen, 330, 190, 0.9, '#7fe6ff', -10) +
    lightNote(pen, 470, 220, 0.7, '#bff4ff', 8) +
    lightNote(pen, 1000, 300, 0.9, '#ffe066', 10) +
    lightNote(pen, 930, 420, 0.75, '#ff9ad8', -8) +
    lightNote(pen, 1060, 470, 0.6, '#7dff9a', 4) +
    gn.lux(pen, 230, 320, 0.95, 'happy', { look: [8, 2] }) +
    gn.iris(pen, 1160, 300, 0.9, 'sing', { flip: true, rot: -6 });
  // The heroes face the glowing tree, so it lights their faces from the front (a low, level key keeps the
  // kit's face hatching off their jaws).
  const hp = pen.relight({ key: [-0.94, -0.34], keyColor: '#c8fff0', rim: [0.9, -0.4], rimColor: '#c8d8ff' });
  const heroes =
    gn.castShadow(pen, 1370, 766, 110, 10, 0.5) +
    smoothShade(hp, 'ch3-dragon-ja', (p) => gn.jason(p, 1370, 770, 0.82, { pose: 'point', mood: 'smile', flip: true, look: [2.4, 1] })) +
    gn.castShadow(pen, 1490, 774, 110, 10, 0.5) +
    smoothShade(hp, 'ch3-dragon-at', (p) => gn.atalanta(p, 1490, 778, 0.8, { pose: 'stand', mood: 'smile', flip: true, look: [2.6, 1.4], wind: 0.3 }));
  // Glow-flowers and dark grass in front.
  const rand = gn.rng(12);
  let flies = '';
  for (let i = 0; i < 5; i++) flies += gn.spark(pen, rand() * 1600, 560 + rand() * 300, 6 + rand() * 8, i % 2 ? DRAGON.glow : '#fff6c0', 0.9);
  const fore = flies + gn.grass(pen, -70, 320, 930, 5, 150, '#06120e', '#2a5a4a', 9) + gn.grass(pen, 1280, 1680, 940, 5, 150, '#06120e', '#2a5a4a', 10);
  return pen.svg(gn.layer(0.15, sky) + gn.layer(0.35, far) + gn.layer(0.7, ground + dragon) + gn.layer(0.85, song) + gn.layer(1, heroes) + gn.layer(1.25, fore) + gn.vignette(pen, 0.55, '#05040f') + gn.grain(pen, 0.08));
}
