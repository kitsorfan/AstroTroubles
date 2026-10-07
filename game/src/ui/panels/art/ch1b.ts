/** Chapter 1 panels, part 2: Jason wakes up, meets LUX, and finds the Heart in front of the star. */
import { backdrop, C, gascuHeart, glow, glowDef, ink, jason, lin, lux, panel, rad, sparkle, stars, vignette } from '../kit';

/** A rolling bank of cryo mist. */
const mist = (pts: number[][], op = 0.55) =>
  `<g fill="#e8f6ff">${pts
    .map(([x, y, s]) => `<ellipse cx="${x}" cy="${y}" rx="${260 * s}" ry="${46 * s}" opacity="${op}"/><ellipse cx="${x + 40 * s}" cy="${y - 30 * s}" rx="${150 * s}" ry="${40 * s}" opacity="${op * 0.7}"/>`)
    .join('')}</g>`;

/** 4. Jason sitting up in his opening cryo pod, yawning and rubbing an eye, in the quiet deck. */
export function ch1Wake(): string {
  const id = 'ch1-wake';
  const backPods = [0, 1, 2]
    .map((i) => {
      const x = 180 + i * 240;
      return `<rect x="${x}" y="300" width="150" height="260" rx="70" fill="#2a4a6a" ${ink(4)}/><rect x="${x + 18}" y="320" width="114" height="210" rx="56" fill="#9adfff" opacity=".25"/><path d="M${x + 30} 350Q${x + 50} 330 ${x + 80} 334" fill="none" stroke="#fff" stroke-width="5" opacity=".4" stroke-linecap="round"/>`;
    })
    .join('');
  return panel(
    backdrop(id + 'b', [[0, '#0e2a40'], [0.6, '#16405a'], [1, '#0a1a2c']]) +
      `<defs>${glowDef(id + 'g', C.cyan, 0.6)}${lin(id + 'm', [[0, '#e9eef5'], [0.6, '#b9c4d4'], [1, '#7d8aa0']])}</defs>
      <path d="M0 120H1600" stroke="#7fe6ff" stroke-width="10" opacity=".35"/><path d="M0 590H1600V900H0Z" fill="#0c2236"/><path d="M0 590H1600" stroke="#2f5a7a" stroke-width="6"/>` +
      glow(id + 'g', 400, 120, 420, 0.5, 60) +
      backPods +
      `<rect x="1180" y="250" width="300" height="200" rx="20" fill="#0c1c2c" ${ink(4)}/><rect x="1200" y="270" width="260" height="160" rx="12" fill="#1f5a7a"/><path d="M1220 380l50 -40 40 30 60 -70 60 40" fill="none" stroke="${C.cyan}" stroke-width="6" opacity=".7"/>` +
      // The open glass lid behind him.
      `<path d="M330 620Q300 330 640 250Q960 190 1150 520" fill="#bfefff" fill-opacity=".16" stroke="#cfefff" stroke-width="10" stroke-opacity=".7"/>
      <path d="M400 480Q440 320 620 290" fill="none" stroke="#fff" stroke-width="10" opacity=".45" stroke-linecap="round"/>` +
      glow(id + 'g', 760, 560, 520, 0.6, 200) +
      mist([[560, 610, 1], [1000, 610, 0.9]], 0.3) +
      jason(780, 700, 1.45, { pose: 'rub', face: 'yawn', helmet: false, legs: 'none', blaster: false }) +
      // The pod's tub in front of him.
      `<path d="M300 610H1180Q1210 610 1200 660L1170 820Q1160 850 1120 850H360Q320 850 310 820L280 660Q272 610 300 610Z" fill="url(#${id}m)" ${ink(7)}/>
      <path d="M330 660H1150" stroke="${C.cyan}" stroke-width="12" stroke-linecap="round"/><path d="M330 660H1150" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".7"/>
      <rect x="640" y="700" width="200" height="80" rx="14" fill="#1b2330" ${ink(4)}/><circle cx="690" cy="740" r="14" fill="#7dff9a"/><circle cx="740" cy="740" r="14" fill="${C.gold}"/><circle cx="790" cy="740" r="14" fill="${C.cyan}"/>` +
      mist([[300, 640, 0.8], [1180, 650, 0.8], [520, 850, 1.3], [1050, 870, 1.4], [200, 820, 0.9], [1420, 840, 1]], 0.22) +
      sparkle(980, 300, 14, '#fff', 0.8) +
      sparkle(1060, 420, 9, '#fff', 0.6) +
      vignette(id + 'v', 0.5),
  );
}

/** A storage crate with a lid line and corner bands. */
const crate = (x: number, y: number, w: number, h: number, c = '#8a5a34') =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="8" fill="${c}" ${ink(6)}/><path d="M${x + 14} ${y + 20}H${x + w - 14}M${x + 14} ${y + h - 20}H${x + w - 14}" stroke="#000" stroke-width="6" opacity=".2"/><path d="M${x} ${y}L${x + w} ${y + h}" stroke="#000" stroke-width="8" opacity=".12"/>`;

/** 5. A dark storeroom: Jason's flashlight finds LUX hiding behind the boxes, its eye just switching on. */
export function ch1Lux(): string {
  const id = 'ch1-lux';
  const shelves = [0, 1, 2]
    .map((i) => `<path d="M60 ${240 + i * 170}H1540" stroke="#2a2440" stroke-width="16"/>` + [0, 1, 2, 3, 4, 5].map((j) => `<rect x="${110 + j * 240 + (i % 2) * 70}" y="${168 + i * 170}" width="${90 + ((i + j) % 3) * 20}" height="64" rx="6" fill="#221c36"/>`).join(''))
    .join('');
  return panel(
    backdrop(id + 'b', [[0, '#120e22'], [1, '#1c1428']]) +
      `<defs>${lin(id + 'l', [[0, '#fff2b0', 0.75], [1, '#ffd166', 0.08]], 1, 0)}${glowDef(id + 'w', '#ffc870', 0.5)}${glowDef(id + 'c', C.cyan, 0.8)}</defs>` +
      shelves +
      `<path d="M0 720H1600V900H0Z" fill="#0e0a1a"/>` +
      glow(id + 'w', 1150, 600, 380, 0.9, 260) +
      crate(980, 620, 260, 200) +
      crate(1260, 560, 240, 260, '#7a4e2e') +
      crate(1290, 400, 180, 160, '#9a6a3e') +
      glow(id + 'c', 1130, 470, 130) +
      lux(1130, 500, 1.25, 'scared') +
      crate(1040, 560, 190, 140, '#a06a3a') +
      jason(380, 830, 1.45, { pose: 'torch', face: 'smile', legs: 'kneel' }) +
      // The flashlight beam.
      `<path d="M610 700L1460 380L1500 860Z" fill="url(#${id}l)"/>` +
      sparkle(1060, 470, 10, C.cyan, 0.9) +
      sparkle(1215, 470, 8, C.cyan, 0.7) +
      vignette(id + 'v', 0.55),
  );
}

/** 6. The Bridge: the huge Heart of GaScu before a giant window full of a burning star. */
export function ch1Heart(): string {
  const id = 'ch1-heart';
  const mullions = [400, 800, 1200].map((x) => `<path d="M${x} 40V680" stroke="#1a1630" stroke-width="22"/>`).join('');
  return panel(
    backdrop(id + 'b', [[0, '#3a0e10'], [1, '#120608']]) +
      `<defs>${rad(id + 's', [[0, '#fffbe0'], [0.25, '#ffe08a'], [0.5, '#ff8a3d'], [0.8, '#ff4a1a', 0.6], [1, '#ff4a1a', 0]])}
      <clipPath id="${id}w"><rect x="80" y="40" width="1440" height="640" rx="70"/></clipPath>${glowDef(id + 'o', C.orange, 0.5)}</defs>
      <g clip-path="url(#${id}w)"><rect x="80" y="40" width="1440" height="640" fill="#4a1408"/>${stars(5, 40, 80, 40, 1440, 640, '#ffd8b0')}
      <circle cx="1180" cy="300" r="720" fill="url(#${id}s)"/>
      <path d="M700 120Q900 60 1100 140M560 480Q760 560 980 500" fill="none" stroke="#ffd166" stroke-width="14" opacity=".35" stroke-linecap="round"/></g>
      ${mullions}<rect x="80" y="40" width="1440" height="640" rx="70" fill="none" stroke="#2a2440" stroke-width="40"/><rect x="60" y="20" width="1480" height="680" rx="86" fill="none" ${ink(8)}/>` +
      `<path d="M0 680H1600V900H0Z" fill="#1a1020"/><path d="M0 680H1600" stroke="#ff8a3d" stroke-width="6" opacity=".6"/>
      <path d="M60 900L220 760H520L600 900ZM1000 900L1080 760H1380L1540 900Z" fill="#2a1a30" ${ink(5)}/><path d="M250 790H490M1110 790H1350" stroke="${C.cyan}" stroke-width="8" opacity=".6"/>` +
      glow(id + 'o', 800, 760, 800, 0.6, 140) +
      gascuHeart(id + 'h', 800, 380, 1.08) +
      jason(300, 870, 0.55, { pose: 'shock', face: 'shock' }) +
      lux(390, 700, 0.6, 'scared') +
      vignette(id + 'v', 0.45),
  );
}

