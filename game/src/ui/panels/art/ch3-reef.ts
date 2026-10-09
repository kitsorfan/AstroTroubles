/** Chapter 3 panels for Scylla's Reef: Scylla on her rock above Charybdis, and the Argo sailing through the calm strait. */
import { argoShip, at, atalanta, backdrop, C, cloud, glow, glowDef, ink, iris, jason, lin, lux, panel, rad, ridge, sparkle, vignette } from '../kit';

const GOLD = '#ffc94a';
const GOLD_DARK = '#c8901e';
const ROCK = '#6e625c';
const ROCK_DARK = '#4a403c';

/** The bright tropical sky with a few puffy clouds and a far hazy island. */
function sky(id: string): string {
  return (
    backdrop(id + 'b', [
      [0, '#2a8ad8'],
      [0.55, '#8fd0f4'],
      [1, '#e6f8ff'],
    ]) +
    cloud(250, 150, 1.1, '#ffffff', 0.9) +
    cloud(1250, 110, 0.8, '#ffffff', 0.85) +
    cloud(760, 210, 0.6, '#ffffff', 0.7) +
    ridge(31, 470, 30, '#7aa6bc', 5, 980, 1640)
  );
}

/** The sea from height y down: turquoise, darker far away, with sparkling ripple lines. */
function sea(id: string, y: number): string {
  let ripples = '';
  for (let i = 0; i < 16; i++) {
    const rx = (i * 263) % 1600;
    const ry = y + 30 + ((i * 97) % (900 - y - 40));
    ripples += `<path d="M${rx - 40} ${ry}q20 -10 40 0t40 0" fill="none" stroke="#e6fbff" stroke-width="4" opacity=".6" stroke-linecap="round"/>`;
  }
  return `<defs>${lin(id + 's', [[0, '#3fb0d0'], [0.4, '#2ac0d0'], [1, '#7fe6e0']])}</defs><path d="M0 ${y}H1600V900H0Z" fill="url(#${id}s)"/>${ripples}`;
}

/** The great rock of the strait: a tall, craggy stack rising out of the sea, foam at its foot. */
function bigRock(x: number, y: number, s: number): string {
  const body = `<path d="M-260 0L-230 -180L-180 -260L-150 -420L-60 -470L40 -450L130 -400L170 -260L230 -170L270 0Z" fill="${ROCK}" ${ink(6)}/>
    <path d="M-150 -420L-120 -300L-170 -150M40 -450L60 -330L20 -200M130 -400L110 -280L160 -150" fill="none" stroke="${ROCK_DARK}" stroke-width="10" stroke-linecap="round"/>
    <path d="M-60 -470L40 -450L130 -400L60 -420Z" fill="#8a7e76"/>
    <path d="M-280 4Q0 -30 290 4" fill="none" stroke="#f4fdff" stroke-width="16" stroke-linecap="round"/>`;
  return at(x, y, s, body);
}

/** SCYLLA on top of the rock: a gold turret, a tall neck, a cab with one big red eye, and six crane arms. */
function scylla(id: string, x: number, y: number, s: number, folded = false): string {
  const defs = `<defs>${glowDef(id + 'e', '#ff3a4c', 0.8)}${glowDef(id + 'j', C.cyan, 0.7)}</defs>`;
  let arms = '';
  for (let i = 0; i < 6; i++) {
    const side = i < 3 ? -1 : 1;
    const k = i % 3;
    const sx = side * 60;
    const sy = -250 + k * 20;
    // Raised: the elbows high and the claws out wide; folded: everything hangs down, tucked in.
    const ex = folded ? side * (90 + k * 20) : side * (170 + k * 70);
    const ey = folded ? -170 + k * 30 : -360 + k * 50;
    const cx = folded ? side * (110 + k * 26) : side * (260 + k * 90);
    const cy = folded ? -40 + k * 20 : -230 + k * 90;
    arms += `<path d="M${sx} ${sy}L${ex} ${ey}" stroke="${GOLD}" stroke-width="26" stroke-linecap="round" ${ink(5)}/><path d="M${sx} ${sy}L${ex} ${ey}" stroke="${GOLD}" stroke-width="18" stroke-linecap="round"/>`;
    arms += `<path d="M${ex} ${ey}L${cx} ${cy}" stroke="#8a5a2a" stroke-width="18" stroke-linecap="round"/>`;
    if (!folded) arms += `${glow(id + 'j', ex, ey, 34, 0.8)}`;
    arms += `<circle cx="${ex}" cy="${ey}" r="16" fill="${folded ? '#6a7a80' : '#bff4ff'}" ${ink(4)}/>`;
    // The claw: a gold wrist with two little red eyes, and three fingers.
    const claw = `<rect x="-24" y="-20" width="48" height="34" rx="8" fill="${GOLD}" ${ink(4)}/>
      <circle cx="-9" cy="-6" r="5" fill="${folded ? '#5a2a2a' : '#ff3a4c'}"/><circle cx="9" cy="-6" r="5" fill="${folded ? '#5a2a2a' : '#ff3a4c'}"/>
      <path d="M-18 14L-26 ${folded ? 40 : 52}M0 14V${folded ? 44 : 58}M18 14L26 ${folded ? 40 : 52}" stroke="#3a2c22" stroke-width="9" stroke-linecap="round"/>`;
    arms += at(cx, cy, 1, claw);
  }
  const body = `<ellipse cx="0" cy="-10" rx="110" ry="34" fill="#6a4a2a" ${ink(5)}/><rect x="-100" y="-56" width="200" height="46" rx="10" fill="${GOLD}" ${ink(5)}/>
    <rect x="-34" y="-230" width="68" height="180" fill="#8a5a2a" ${ink(5)}/>
    <path d="M-34 -190H34M-34 -150H34M-34 -110H34" stroke="${GOLD}" stroke-width="8"/>
    ${arms}
    <g transform="rotate(${folded ? 14 : 0} 0 -270)"><rect x="-90" y="-320" width="180" height="96" rx="18" fill="${GOLD}" ${ink(6)}/>
    <rect x="-96" y="-330" width="192" height="18" rx="6" fill="#3a2c22" ${ink(3)}/>
    ${folded ? '' : glow(id + 'e', 0, -268, 60, 0.9)}<circle cx="0" cy="-268" r="28" fill="#1a1418" ${ink(4)}/><circle cx="0" cy="-268" r="16" fill="${folded ? '#5a2a2a' : '#ff3a4c'}"/>
    ${folded ? `<path d="M-14 -268h28" stroke="#ff8a8a" stroke-width="5" stroke-linecap="round"/>` : ''}
    <circle cx="-74" cy="-340" r="12" fill="#fff2b0" ${ink(3)}/><circle cx="74" cy="-340" r="12" fill="#fff2b0" ${ink(3)}/></g>`;
  return defs + at(x, y, s, body);
}

/** CHARYBDIS: a great spiral of foam in a dark swirl of sea (calm = a small, gentle one). */
function whirlpool(id: string, x: number, y: number, s: number, calm = false): string {
  const defs = `<defs>${rad(id + 'w', [[0, '#04263a'], [0.6, '#0e5a7a'], [1, '#2ac0d0']])}</defs>`;
  let arms = '';
  const n = calm ? 3 : 5;
  for (let a = 0; a < n; a++) {
    let d = '';
    for (let i = 0; i <= 30; i++) {
      const k = i / 30;
      const ang = (a / n) * Math.PI * 2 + k * Math.PI * 2.2;
      const r = 10 + k * 190;
      d += `${i ? 'L' : 'M'}${Math.round(Math.cos(ang) * r)} ${Math.round(Math.sin(ang) * r * 0.32)}`;
    }
    arms += `<path d="${d}" fill="none" stroke="#e6fbff" stroke-width="${calm ? 5 : 8}" stroke-linecap="round" opacity=".85"/>`;
  }
  const body = `<ellipse cx="0" cy="0" rx="210" ry="68" fill="url(#${id}w)" ${ink(5)}/>${arms}`;
  return defs + at(x, y, s, body);
}

/** A clump of coral in the foreground: pink and orange branches. */
function coral(x: number, y: number, s: number): string {
  const body = `<path d="M0 0V-70M0 -40L-30 -80M0 -50L28 -96M-30 -80L-40 -110M28 -96L44 -120" stroke="#ff7a8a" stroke-width="16" stroke-linecap="round" ${ink(5)}/>
    <path d="M0 0V-70M0 -40L-30 -80M0 -50L28 -96M-30 -80L-40 -110M28 -96L44 -120" stroke="#ff8a8a" stroke-width="12" stroke-linecap="round"/>
    <path d="M40 0V-50M40 -30L62 -66" stroke="#ffaa6a" stroke-width="12" stroke-linecap="round"/>`;
  return at(x, y, s, body);
}

/** 25. The heroes on a coral ledge, looking out at SCYLLA on her rock, arms raised, and CHARYBDIS spinning below. */
export function ch3Scylla(): string {
  const id = 'ch3-scylla';
  return panel(
    sky(id) +
      sea(id, 470) +
      whirlpool(id + 'c', 760, 640, 1.05) +
      bigRock(1210, 680, 0.8) +
      scylla(id + 's', 1210, 310, 0.66) +
      // The coral ledge in front, with the two heroes and their droids.
      `<path d="M-20 900V760Q120 700 330 720Q520 740 640 800L700 900Z" fill="#f0d8bc" ${ink(6)}/><path d="M-20 790Q200 750 420 770" fill="none" stroke="#d4b28c" stroke-width="6"/>` +
      coral(560, 800, 1) +
      coral(40, 780, 0.8) +
      jason(200, 860, 1.05, { pose: 'point', face: 'determined' }) +
      atalanta(380, 870, 1.05, { bow: 'hand', face: 'determined' }) +
      lux(120, 560, 0.75, 'scared') +
      iris(520, 520, 0.75, 'normal') +
      sparkle(1000, 120, 10, '#fff') +
      sparkle(1300, 160, 8, '#fff') +
      vignette(id + 'v', 0.3, '#0a3a5a'),
  );
}

/** 26. The Argo sails through the calm strait past Scylla, her arms folded; the heroes wave from the pier. */
export function ch3Strait(): string {
  const id = 'ch3-strait';
  const fish = [
    [380, 560],
    [430, 590],
    [880, 640],
  ]
    .map(([fx, fy], i) => at(fx, fy, 1, `<path d="M0 0Q20 -18 40 0Q20 18 0 0ZM40 0l16 -12v24z" fill="${i % 2 ? '#ffb347' : '#ff7a8a'}" ${ink(3)}/>`, i % 2 === 1, -20))
    .join('');
  return panel(
    sky(id) +
      `<defs>${glowDef(id + 'g', '#fff4c0', 0.7)}</defs>` +
      glow(id + 'g', 1400, 150, 140, 0.9) +
      `<circle cx="1400" cy="150" r="60" fill="#fffbe8"/>` +
      sea(id, 480) +
      whirlpool(id + 'c', 300, 640, 0.5, true) +
      bigRock(1260, 640, 0.9) +
      scylla(id + 's', 1260, 230, 0.56, true) +
      argoShip(id + 'a', 720, 560, 0.62, -2) +
      fish +
      // The heroes on the pier, waving.
      `<path d="M820 900V780H1160V900Z" fill="#b0835a" ${ink(5)}/><path d="M840 780V900M900 780V900M960 780V900M1020 780V900M1080 780V900" stroke="#7a5636" stroke-width="5"/>` +
      jason(920, 800, 0.8, { pose: 'wave', face: 'grin' }) +
      atalanta(1060, 800, 0.8, { pose: 'cheer', face: 'happy' }) +
      lux(860, 600, 0.55, 'happy') +
      iris(1140, 610, 0.55, 'happy') +
      sparkle(560, 420, 12, '#fff') +
      sparkle(860, 380, 9, GOLD) +
      sparkle(300, 600, 8, '#fff') +
      vignette(id + 'v', 0.25, GOLD_DARK),
  );
}
