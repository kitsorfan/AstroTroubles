/** Chapter 1 panels, part 1: the ship in the nebula, the comet, and the vines growing on board. */
import {
  at,
  backdrop,
  C,
  face,
  flower,
  glow,
  glowDef,
  gascuSeed,
  ink,
  panel,
  person,
  rad,
  sparkle,
  stars,
  syracusia,
  vignette,
  vine,
} from '../kit';
import * as gn from '../gn';
import * as c1 from '../gn/ch1';

/* ---------------- 1. The ship in the nebula ---------------- */

/** Deep space with a nebula: the gradient, glowing clouds of gas with dark dust lanes, and stars. */
function spaceGN(pen: gn.Pen, seed: number, clouds: [number, number, number, string[]][]): string {
  return (
    gn.sky(pen, [
      [0, '#05081e'],
      [0.55, '#120e3a'],
      [1, '#1a0c30'],
    ]) +
    clouds.map(([x, y, r, cols], i) => gn.nebula(pen, x, y, r, cols, seed + i, 0.7)).join('') +
    gn.starfield(pen, seed, 170, -80, -60, 1760, 1020, '#f4f6ff')
  );
}

/**
 * A comic inset: a framed window (x, y, w, h) with its own picture inside, clipped, under a white border.
 * `body` is drawn in panel coordinates.
 */
function inset(pen: gn.Pen, x: number, y: number, w: number, h: number, body: string): string {
  const id = pen.uid();
  const d = `M${x} ${y}H${x + w}V${y + h}H${x}Z`;
  pen.def(id, `<clipPath id="${id}"><path d="${d}"/></clipPath>`);
  return (
    `<path d="${d}" fill="${gn.INK}" transform="translate(10 12)" opacity=".5"/>` +
    `<g clip-path="url(#${id})">${body}</g>` +
    `<path d="${d}" fill="none" stroke="${gn.INK}" stroke-width="16"/><path d="${d}" fill="none" stroke="#f4f6ff" stroke-width="8"/>`
  );
}

/** 1. The SYRACUSIA cruises through a quiet nebula; in an inset, colonists sleep in their frosted pods while HALCYON's eye keeps watch. */
export function ch1Ship(): string {
  const pen = gn.Pen.scene('ch1-ship', { key: [-0.7, -0.6], keyColor: '#fff0e0', rim: [0.85, 0.45], rimColor: '#8fd8ff', shadow: '#2a2a70', depth: 0.6 });
  const sky =
    spaceGN(pen, 11, [
      [1180, 200, 620, ['#d080ff', '#8a4fff', '#3f3aa6']],
      [260, 620, 560, ['#7ac8ff', '#3f86d6', '#2a2a80']],
      [820, 460, 380, ['#ff8ad8', '#c04fa8']],
    ]) +
    gn.bloom(pen, 110, 90, 60, '#fff4e0', 0.9);
  // The ship, big and slow, sliding across the frame; a faint wake of light behind it.
  const ship = c1.syracusia(pen, 900, 330, 0.92, { rot: -5 });
  // The inset: inside the cryo deck, two colonists asleep in their pods, HALCYON's amber eye on the wall.
  const ix = 990;
  const iy = 396;
  const iw = 470;
  const ih = 320;
  const podPen = pen.relight({ key: [-0.4, -0.8], keyColor: '#e8fbff', rim: [0.9, -0.2], rimColor: '#7fe6ff', depth: 0.6 });
  const inside =
    `<path d="M${ix} ${iy}H${ix + iw}V${iy + ih}H${ix}Z" fill="${pen.lin([
      [0, '#16324c'],
      [1, '#0a1626'],
    ])}"/>` +
    pen.glow(ix + iw / 2, iy + 120, 260, '#7fe6ff', 0.4, 140) +
    c1.pod(podPen, ix + 120, iy + 420, 0.78, { look: c1.COLONISTS[0], frost: 0.4 }) +
    c1.pod(podPen, ix + 350, iy + 430, 0.78, { look: c1.COLONISTS[3], frost: 0.5 }) +
    // HALCYON's eye: an amber lens in a white housing, its light falling on the pods.
    pen.form(c1.circleD(ix + 236, iy + 60, 26), '#d8dee8', { sh: 10, line: 2.6, rim: 1.4 }) +
    pen.glow(ix + 236, iy + 60, 60, '#ffb040', 0.8) +
    `<circle cx="${ix + 236}" cy="${iy + 60}" r="12" fill="#ffb040" stroke="${gn.INK}" stroke-width="2.4"/><circle cx="${ix + 232}" cy="${iy + 56}" r="4" fill="#fff"/>`;
  // A dotted "cut-away" line from the inset up to the ship's habitat ring.
  const callout = `<path d="M${ix + 40} ${iy}L812 470" stroke="#f4f6ff" stroke-width="4" stroke-dasharray="10 10" opacity=".75"/><circle cx="812" cy="470" r="10" fill="none" stroke="#f4f6ff" stroke-width="4" opacity=".85"/>`;
  return pen.svg(
    gn.layer(0.15, sky) +
      gn.layer(0.6, ship) +
      gn.layer(1, callout + inset(pen, ix, iy, iw, ih, inside)) +
      gn.vignette(pen, 0.5, '#04040e') +
      gn.grain(pen, 0.08),
  );
}


/** 2. The pink seed-comet streaking toward the ship; the ship small and surprised. */
export function ch1Comet(): string {
  const id = 'ch1-comet';
  const streaks = [0, 1, 2, 3, 4, 5]
    .map((i) => `<path d="M${-100 + i * 260} ${-40 + (i % 3) * 120}l${360 + (i % 2) * 120} ${210 + (i % 2) * 70}" stroke="#cfe0ff" stroke-width="${2 + (i % 3)}" opacity=".18" stroke-linecap="round"/>`)
    .join('');
  return panel(
    backdrop(id + 'b', [[0, '#1a0f3a'], [0.6, '#0b1030'], [1, '#060818']]) +
      `<defs>${rad(id + 'r', [[0, C.pink, 0.35], [1, C.pink, 0]])}</defs><circle cx="1000" cy="520" r="700" fill="url(#${id}r)"/>` +
      stars(23, 90) +
      streaks +
      // The ship, small in the corner, with surprise lines popping off it.
      syracusia(id + 's', 1330, 770, 0.3) +
      `<g stroke="#fff" stroke-width="6" stroke-linecap="round"><path d="M1330 650l0 -40M1260 664l-24 -30M1400 664l24 -30M1450 700l36 -16"/></g>` +
      gascuSeed(id + 'g', 960, 500, 1.55, 33, 760) +
      sparkle(700, 220, 26) +
      sparkle(1180, 380, 16, C.pinkLight) +
      sparkle(560, 420, 12) +
      vignette(id + 'v', 0.5),
  );
}

/** A sleeping colonist in a soft pink cocoon hanging from a vine. */
function cocoon(id: string, x: number, y: number, s: number, skin: string, hair: string): string {
  return at(
    x,
    y,
    s,
    `<path d="M0 -260V-90" stroke="#3f7a3a" stroke-width="8"/>${glow(id + 'g', 0, 0, 170)}
    <path d="M0 -100Q80 -80 76 10Q70 110 0 130Q-70 110 -76 10Q-80 -80 0 -100Z" fill="url(#${id}k)" ${ink(6)}/>
    <ellipse cx="0" cy="-6" rx="44" ry="46" fill="${skin}" ${ink(4)}/><path d="M-44 -6Q-48 -50 0 -52Q48 -50 44 -8Q30 -30 0 -32Q-30 -30 -44 -6Z" fill="${hair}"/>
    <g transform="translate(0 4) scale(.8)">${face('sleep', 0.9, 0, hair)}</g>
    <path d="M-70 40Q0 70 70 40M-74 -10Q-30 20 0 6M74 -10Q30 20 0 6" fill="none" stroke="#ff9ae0" stroke-width="6" opacity=".7"/>
    <path d="M-50 -70Q-30 -90 0 -92" fill="none" stroke="#fff" stroke-width="7" opacity=".55" stroke-linecap="round"/>`,
  );
}

/** 3. Pink glowing vines over the deck walls, colonists asleep in cocoons hanging like lanterns. */
export function ch1Grow(): string {
  const id = 'ch1-grow';
  const panels = [0, 1, 2, 3, 4, 5, 6]
    .map((i) => `<rect x="${i * 240 - 20}" y="80" width="220" height="520" rx="16" fill="#241f52" opacity=".9"/><path d="M${i * 240 + 10} 140H${i * 240 + 170}" stroke="#5a5aa0" stroke-width="6" opacity=".5"/>`)
    .join('');
  const pink = '#c2389a';
  const pollen = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => sparkle(120 + i * 150, 200 + ((i * 137) % 420), 6 + (i % 3) * 4, i % 2 ? C.pinkLight : '#fff', 0.8)).join('');
  return panel(
    backdrop(id + 'b', [[0, '#160f38'], [0.7, '#2a1650'], [1, '#3a1a50']]) +
      `<defs>${glowDef(id + 'g', C.pink, 0.55)}${rad(id + 'k', [[0, '#fff0fa'], [0.5, '#ffb0e6'], [1, C.pink]], 0.4, 0.35, 0.7)}</defs>` +
      panels +
      `<path d="M0 600H1600V900H0Z" fill="#1a1440"/><path d="M0 600H1600" stroke="#5a5aa0" stroke-width="6"/>
      <path d="M200 900L520 600M1400 900L1080 600M800 900V600" stroke="#2c2560" stroke-width="5"/>` +
      glow(id + "g", 800, 330, 760, 0.7, 380) + glow(id + "g", 800, 760, 760, 0.85, 160) +
      vine([[-20, 120], [200, 60], [420, 140], [640, 70], [880, 130], [1100, 60], [1330, 140], [1620, 80]], 26, true, pink, C.pink) +
      vine([[-20, 520], [120, 400], [90, 240], [200, 140]], 20, true, pink, C.pink) +
      vine([[1620, 560], [1480, 420], [1520, 260], [1400, 140]], 20, true, pink, C.pink) +
      vine([[300, 900], [420, 760], [360, 640], [460, 600]], 18, true, pink, C.pink) +
      vine([[1300, 900], [1180, 760], [1240, 640], [1150, 600]], 18, true, pink, C.pink) +
      cocoon(id, 360, 380, 0.95, '#e8bf9a', '#5a3a22') +
      cocoon(id, 800, 420, 1.15, '#8a5a3c', '#1a1210') +
      cocoon(id, 1230, 370, 0.95, '#f0cfb0', '#c96a2a') +
      cocoon(id, 580, 250, 0.6, '#c8906c', '#2a1a12') +
      cocoon(id, 1030, 240, 0.6, '#e0b48e', '#e2c060') +
      pollen + flower(250, 92, 22, C.pink) + flower(760, 92, 18, '#ffb0e6') + flower(1210, 96, 22, C.pink) + flower(420, 640, 18, '#ffb0e6') + flower(1190, 650, 18, C.pink) +
      [[560, 720, 1], [700, 800, 0.8], [960, 760, 1.1], [1080, 690, 0.7], [180, 780, 0.9], [1460, 760, 0.9]]
        .map(([x, y, s]) => glow(id + 'g', x, y, 60 * s) + `<path d="M${x} ${y + 30 * s}V${y}" stroke="#3f7a3a" stroke-width="6"/><circle cx="${x}" cy="${y}" r="${14 * s}" fill="${C.pink}" ${ink(4)}/>`)
        .join('') +
      vignette(id + 'v', 0.42),
  );
}
