/** Chapter 2 flashbacks, part 2: the scientists stand up for GaScu, and send it away to safety. */
import { at, backdrop, brennus, C, cloud, gascuGiant, glow, glowDef, gorgon, ink, lin, panel, ridge, scientist, sparkle, stars } from '../kit';
import { jungle, sepia, undergrowth } from './scenery';

/** 14. The scientists stand in a line between Brennus and GaScu, arms spread wide, brave and calm. */
export function pastMutiny(): string {
  const id = 'past-mutiny';
  const line: [number, number, 'determined' | 'calm' | 'smile'][] = [
    [600, 5, 'determined'],
    [745, 1, 'calm'],
    [890, 3, 'determined'],
    [1035, 0, 'calm'],
    [1180, 6, 'determined'],
  ];
  return panel(
    jungle(id, 14, ['#c0d8a0', '#4f7a3c', '#2f5a2a'], 780) +
      `<defs>${glowDef(id + 'p', C.pink, 0.6)}</defs>` +
      gascuGiant(id + 'h', 1290, 1010, 0.98) +
      line.map(([x, i, face]) => scientist(i, x, 880, 0.74, { pose: 'spread', face, flip: true, lite: true })).join('') +
      brennus(250, 900, 1.35, { young: true, rifle: true, pose: 'rifleDown', face: 'angry' }) +
      undergrowth(44, 900, '#2f5a2a', '#4a8a3a') +
      sepia(id, 0.24) +
      glow(id + 'p', 1290, 460, 380, 0.5) +
      sparkle(1100, 330, 12, '#ffd6f2') +
      sparkle(1480, 260, 9, '#ffd6f2'),
  );
}

/** 15. Night: the escape pod blasts off with GaScu on a pink trail; the scientists wave goodbye. */
export function pastLaunch(): string {
  const id = 'past-launch';
  const trail = 'M640 640Q760 420 980 300Q1100 236 1170 190';
  const wavers: [number, number, number, 'wave' | 'cheer'][] = [
    [150, 600, 1, 'wave'],
    [260, 590, 3, 'cheer'],
    [370, 588, 5, 'wave'],
    [480, 596, 2, 'wave'],
    [580, 612, 7, 'cheer'],
  ];
  const pod = `<path d="M-70 -30Q-70 -60 -30 -60H30Q80 -60 90 0Q80 60 30 60H-30Q-70 60 -70 30Z" fill="#e8e2d0" ${ink(6)}/>
    <circle cx="20" cy="0" r="30" fill="${C.pink}" ${ink(5)}/><circle cx="12" cy="-8" r="10" fill="#fff" opacity=".8"/>
    <path d="M-70 -34L-100 -50V50L-70 34Z" fill="#8a8a7a" ${ink(5)}/>`;
  return panel(
    backdrop(id + 'b', [[0, '#0b1030'], [0.6, '#24204a'], [1, '#3a2a40']]) +
      `<defs>${glowDef(id + 'p', C.pink, 0.8)}${lin(id + 't', [[0, C.pink, 0.1], [1, '#ffd6f2', 0.95]], 1, 0)}${glowDef(id + 'l', '#ffd166', 0.8)}</defs>` +
      stars(15, 100, 0, 0, 1600, 560) +
      // Storm clouds over the crashed Gorgon far away.
      cloud(1260, 420, 1.6, '#2a2438') +
      cloud(1460, 440, 1.3, '#332c44') +
      cloud(1120, 450, 1.1, '#2a2438') +
      `<path d="M1330 450L1300 520H1330L1300 590" fill="none" stroke="#ffd166" stroke-width="7" stroke-linejoin="round"/>` +
      glow(id + 'l', 1310, 520, 80, 0.5) +
      ridge(3, 720, 50, '#1a1830', 5) +
      gorgon(id + 'g', 1300, 690, 0.3, true) +
      cloud(1340, 650, 0.5, '#5a5468', 0.7) +
      brennus(1120, 728, 0.3, { young: true, pose: 'fist', face: 'angry', lite: true }) +
      // The pink trail and the pod.
      glow(id + 'p', 1170, 190, 230) +
      `<path d="${trail}" fill="none" stroke="${C.pink}" stroke-width="70" stroke-linecap="round" opacity=".18"/>
      <path d="${trail}" fill="none" stroke="url(#${id}t)" stroke-width="22" stroke-linecap="round"/>` +
      at(1190, 180, 0.9, pod, false, -35) +
      sparkle(900, 260, 14, '#ffd6f2') +
      sparkle(800, 420, 10, '#fff') +
      sparkle(1060, 330, 9, '#ffd6f2') +
      // The hilltop with the scientists waving goodbye.
      `<path d="M-40 900V640Q160 560 420 580Q640 600 760 700Q820 760 840 900Z" fill="#141a2a"/>` +
      glow(id + 'p', 400, 580, 420, 0.35, 160) +
      wavers.map(([x, y, i, pose]) => scientist(i, x, y, 0.5, { pose, face: 'smile', lite: true })).join('') +
      sepia(id, 0.16) +
      glow(id + 'p', 1170, 190, 120, 0.7),
  );
}
