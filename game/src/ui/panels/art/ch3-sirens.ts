/** Chapter 3 panels for the Sirens' Sea: LUX's counter-song against a siren buoy, and the Dolphin surfacing at the coral strait. */
import { argoShip, at, backdrop, C, glow, glowDef, ink, jasonHead, lin, lux, panel, rad, rng, sparkle, vignette } from '../kit';

/** The little sub Dolphin, side view facing right: blue back, white belly, a beak, fins, and a glass bubble with Jason and LUX. */
function dolphinSub(id: string, x: number, y: number, s: number, o: { face?: 'determined' | 'happy' | 'grin'; luxMood?: 'happy' | 'glow'; luxIris?: string; open?: boolean } = {}): string {
  const defs = `<defs>${lin(id + 'b', [[0, '#5aa8f0'], [1, '#2a6ac0']])}${rad(id + 'g', [[0, '#e8fbff', 0.5], [1, '#7fe6ff', 0.2]])}</defs>`;
  const body = `<path d="M-230 10Q-230 -90 -60 -100Q120 -108 200 -40Q236 -20 290 -6Q300 6 288 16Q230 30 200 40Q120 96 -60 92Q-230 84 -230 10Z" fill="url(#${id}b)" ${ink(6)}/>
    <path d="M-222 30Q-150 86 -60 88Q110 92 200 38Q230 28 286 14Q240 40 200 52Q110 104 -60 98Q-200 92 -222 30Z" fill="#f4f8ff" ${ink(4)}/>
    <path d="M-40 -96Q-10 -170 60 -176Q30 -130 40 -100Z" fill="#3a86d8" ${ink(5)}/>
    <path d="M-226 4Q-290 -60 -330 -54Q-300 -10 -330 40Q-290 50 -226 18Z" fill="#3a86d8" ${ink(5)}/>
    <path d="M10 60Q40 120 100 120Q80 80 90 50Z" fill="#3a86d8" ${ink(4)}/>
    <path d="M-110 -96Q-110 10 -110 92" stroke="${C.gold}" stroke-width="12"/><path d="M-110 -96Q-110 10 -110 92" fill="none" ${ink(3)}/>
    <circle cx="282" cy="4" r="16" fill="#fff6c8" ${ink(4)}/>`;
  const bubble = o.open
    ? `<path d="M-90 -96Q-80 -150 10 -150" fill="none" stroke="#bff4ff" stroke-width="10" opacity=".7"/>`
    : `<ellipse cx="20" cy="-100" rx="120" ry="92" fill="url(#${id}g)" ${ink(5)}/><path d="M-50 -160Q0 -186 60 -170" fill="none" stroke="#fff" stroke-width="8" stroke-linecap="round" opacity=".8"/>`;
  const crew = at(-22, -114, 0.8, jasonHead(o.face ?? 'determined')) + lux(88, -104, 0.62, o.luxMood ?? 'happy', o.luxIris ?? C.cyan);
  return defs + at(x, y, s, body + crew + bubble);
}

/** A siren buoy: a gold ball on a chain, with a pink speaker horn pointing left (at the sub). */
function sirenBuoy(id: string, x: number, y: number, s: number): string {
  const defs = `<defs>${rad(id + 'g', [[0, '#fff2b0'], [0.6, '#ffc23a'], [1, '#b8801a']], 0.35, 0.35, 0.8)}${glowDef(id + 'p', '#ff6fb0')}</defs>`;
  const fins = [-50, -20, 10, 40].map((fx) => `<path d="M${fx} -70l12 -40 12 40z" fill="${C.gold}" ${ink(3)}/>`).join('');
  const body = `<path d="M0 60V420" stroke="#4a3a2a" stroke-width="10" stroke-dasharray="18 8"/>
    ${glow(id + 'p', -110, 0, 140, 0.9)}${fins}
    <circle r="80" fill="url(#${id}g)" ${ink(6)}/>
    <path d="M-60 -30L-160 -70V70L-60 30Z" fill="#ff6fb0" ${ink(5)}/><ellipse cx="-160" cy="0" rx="18" ry="70" fill="#ff3a9a" ${ink(4)}/>
    <circle cx="20" cy="-20" r="20" fill="#3a1a00" ${ink(3)}/><circle cx="26" cy="-26" r="6" fill="#fff"/>`;
  return defs + at(x, y, s, body);
}

/** A music note (LUX's counter-song). */
const note = (x: number, y: number, s: number, color: string, rot = 0) =>
  at(x, y, s, `<path d="M0 0V-70L40 -84V-14" fill="none" stroke="${C.ink}" stroke-width="16" stroke-linejoin="round"/><path d="M0 0V-70L40 -84V-14" fill="none" stroke="${color}" stroke-width="8" stroke-linejoin="round"/><ellipse cx="-12" cy="2" rx="18" ry="13" fill="${color}" ${ink(4)}/><ellipse cx="28" cy="-12" rx="18" ry="13" fill="${color}" ${ink(4)}/>`, false, rot);

/** Kelp stalks swaying up from the bottom edge. */
function kelp(seed: number, x0: number, x1: number, color: string): string {
  const r = rng(seed);
  let out = '';
  for (let x = x0; x < x1; x += 50 + r() * 40) {
    const h = 300 + r() * 360;
    const sway = (r() - 0.5) * 120;
    out += `<path d="M${x} 920Q${x + sway} ${900 - h / 2} ${x + sway * 0.4} ${900 - h}" fill="none" stroke="${C.ink}" stroke-width="30" stroke-linecap="round"/><path d="M${x} 920Q${x + sway} ${900 - h / 2} ${x + sway * 0.4} ${900 - h}" fill="none" stroke="${color}" stroke-width="20" stroke-linecap="round"/>`;
  }
  return out;
}

/** 25. Under the sea: a siren buoy sings pink rings at the Dolphin, and LUX sings cyan notes right back. */
export function ch3Sirens(): string {
  const id = 'ch3-sirens';
  const rays = [200, 520, 900, 1250]
    .map((x, i) => `<path d="M${x} -20L${x + 120} -20L${x + 360 - i * 40} 900L${x + 160 - i * 40} 900Z" fill="#dff8ff" opacity=".1"/>`)
    .join('');
  const pinkRings = [0, 1, 2, 3].map((i) => `<ellipse cx="${1060 - i * 110}" cy="420" rx="${30 + i * 26}" ry="${90 + i * 60}" fill="none" stroke="#ff6fb0" stroke-width="${12 - i * 2}" opacity="${0.9 - i * 0.18}"/>`).join('');
  const rocks = [1040, 1180, 1320, 1440].map((x, i) => `<path d="M${x - 120} 900Q${x - 100} ${640 - i * 20} ${x} ${620 + (i % 2) * 40}Q${x + 110} ${650} ${x + 130} 900Z" fill="#4e6670" ${ink(5)}/>`).join('');
  const coral = [990, 1130, 1260, 1400].map((x, i) => `<circle cx="${x}" cy="${660 + (i % 2) * 30}" r="${26 + i * 4}" fill="${['#ff7a8a', '#ffb84a', '#c87aff', '#ff9ad8'][i]}" ${ink(4)}/>`).join('');
  return panel(
    backdrop(id + 'b', [[0, '#5ad0e8'], [0.45, '#1a6a90'], [1, '#062038']]) +
      `<defs>${glowDef(id + 'c', C.cyan, 0.7)}</defs>` +
      rays +
      kelp(25, -20, 380, '#3f9a4a') +
      rocks +
      coral +
      sirenBuoy(id + 's', 1250, 400, 1) +
      pinkRings +
      glow(id + 'c', 640, 330, 220, 0.6) +
      note(700, 300, 1.1, C.cyan, -10) +
      note(820, 220, 0.9, '#bff8ff', 8) +
      note(600, 190, 0.8, C.cyan, -4) +
      dolphinSub(id + 'd', 420, 520, 1.15, { face: 'determined', luxMood: 'glow', luxIris: '#ff8ad0' }) +
      sparkle(980, 200, 10, '#fff') +
      sparkle(300, 160, 8, '#fff') +
      [140, 330, 760, 1500].map((x, i) => `<circle cx="${x}" cy="${120 + i * 150}" r="${8 + (i % 3) * 4}" fill="none" stroke="#e8fbff" stroke-width="4" opacity=".7"/>`).join('') +
      vignette(id + 'v', 0.4, '#031428'),
  );
}

/** 26. The Dolphin pops up at the coral strait: a tall rock on one side, a whirlpool on the other, and the Argo coming. */
export function ch3Surface(): string {
  const id = 'ch3-surface';
  const swirl = [0, 1, 2, 3, 4]
    .map((i) => `<ellipse cx="1240" cy="640" rx="${300 - i * 56}" ry="${70 - i * 12}" fill="none" stroke="${i % 2 ? '#bff4ff' : '#2a7aa0'}" stroke-width="${14 - i * 2}" transform="rotate(${-4 + i * 3} 1240 640)"/>`)
    .join('');
  // Branching coral poking out of the water along the strait.
  const reef = [430, 520, 600, 690, 960, 1040]
    .map((x, i) => {
      const c = ['#ff7a8a', '#ffb84a', '#c87aff'][i % 3];
      const h = 50 + (i % 3) * 22;
      const d = `M${x} 640V${640 - h}M${x} ${640 - h * 0.5}l-${h * 0.4} -${h * 0.4}M${x} ${640 - h * 0.7}l${h * 0.35} -${h * 0.35}`;
      return `<path d="${d}" stroke="${C.ink}" stroke-width="22" stroke-linecap="round"/><path d="${d}" stroke="${c}" stroke-width="12" stroke-linecap="round"/>`;
    })
    .join('');
  // On top of the tall rock, something gold with long arms is waiting (Scylla, in the next level).
  const crane = at(300, 120, 1, `<rect x="-34" y="-30" width="68" height="50" rx="12" fill="${C.gold}" ${ink(5)}/><circle cx="0" cy="-6" r="10" fill="#ff3a4c" ${ink(3)}/>` +
    [-1, 1].map((sd) => [0, 1, 2].map((k) => `<path d="M${sd * 30} ${0 + k * 8}Q${sd * (70 + k * 10)} ${-40 + k * 30} ${sd * (90 + k * 16)} ${-10 + k * 40}" fill="none" stroke="${C.ink}" stroke-width="13" stroke-linecap="round"/><path d="M${sd * 30} ${0 + k * 8}Q${sd * (70 + k * 10)} ${-40 + k * 30} ${sd * (90 + k * 16)} ${-10 + k * 40}" fill="none" stroke="#e0a830" stroke-width="6" stroke-linecap="round"/>`).join('')).join(''));
  return panel(
    backdrop(id + 'b', [[0, '#ff9a6a'], [0.35, '#ffd08a'], [0.6, '#bfe8f0'], [1, '#bfe8f0']]) +
      `<defs>${glowDef(id + 'sun', '#fff2c8', 0.9)}${lin(id + 'sea', [[0, '#3ab0d0'], [1, '#0a4a70']])}</defs>` +
      glow(id + 'sun', 820, 360, 260, 0.9) +
      `<circle cx="820" cy="360" r="70" fill="#fff6d8"/>` +
      // The tall rock on the left, with something gold and long-armed perched on top.
      `<path d="M120 640L180 260Q220 150 300 140Q380 160 400 300L440 640Z" fill="#6a6a7a" ${ink(6)}/>` +
      crane +
      argoShip(id + 'a', 1180, 210, 0.32, -6) +
      `<rect y="600" width="1600" height="300" fill="url(#${id}sea)"/>` +
      swirl +
      reef +
      [0, 1, 2, 3].map((i) => `<path d="M${i * 420} 620q60 -20 120 0t120 0" fill="none" stroke="#e8fbff" stroke-width="6" opacity=".7"/>`).join('') +
      dolphinSub(id + 'd', 600, 770, 1.05, { face: 'grin', luxMood: 'happy', open: true }) +
      sparkle(700, 600, 12, '#fff') +
      sparkle(980, 520, 9, '#fff') +
      vignette(id + 'v', 0.3, '#2a1a30'),
  );
}
