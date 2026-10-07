/** Chapter 2 flashbacks, part 1: the first expedition lands, and Brennus aims at GaScu. */
import { brennus, C, gascuGiant, glow, glowDef, gorgon, ink, limb, panel, scientist, sparkle, VINE } from '../kit';
import { bigLeaf, jungle, sepia, undergrowth } from './scenery';

/** A towering wild plant: a thick curving stalk with huge leaves. */
function stalk(x: number, y: number, h: number, lean: number, color: string, leafColor: string): string {
  return (
    limb([[x, y], [x + lean * 0.3, y - h * 0.5], [x + lean, y - h]], color, 34, 5, true) +
    bigLeaf(x + lean * 0.2, y - h * 0.35, 1.1, -150, leafColor) +
    bigLeaf(x + lean * 0.5, y - h * 0.6, 1.2, -30, leafColor) +
    bigLeaf(x + lean, y - h, 1.3, lean > 0 ? -60 : -120, leafColor)
  );
}

/** 12. Forty years ago: the Gorgon lands in the wild jungle; young Brennus leads the scientists. */
export function pastExpedition(): string {
  const id = 'past-expedition';
  const crew: [number, number, number, number, 'stand' | 'wave' | 'hold' | 'gear' | 'point', 'smile' | 'shock' | 'happy'][] = [
    [330, 790, 0.6, 0, 'hold', 'smile'],
    [460, 780, 0.6, 5, 'stand', 'shock'],
    [600, 786, 0.6, 2, 'wave', 'happy'],
    [400, 850, 0.7, 1, 'point', 'shock'],
    [560, 856, 0.7, 3, 'stand', 'smile'],
    [720, 852, 0.7, 4, 'hold', 'happy'],
  ];
  return panel(
    jungle(id, 5, ['#b8d49a', '#4a7a3a', '#2f5a2a'], 740) +
      // The Gorgon, landed on its legs with the ramp down.
      `<path d="M190 520L150 720M330 540L320 730M560 530L590 720" ${ink(14)}/><path d="M190 520L150 720M330 540L320 730M560 530L590 720" stroke="#5a5a3a" stroke-width="7"/>` +
      gorgon(id + 'g', 400, 470, 0.62) +
      `<path d="M470 520L640 730H560L430 540Z" fill="#6a6a48" ${ink(5)}/>` +
      stalk(1300, 800, 680, 120, VINE, '#3f7a3a') +
      stalk(1500, 820, 560, -80, '#2f6a32', '#4a8a3a') +
      stalk(900, 760, 520, -60, '#2f6a32', '#5f9a3a') +
      crew.map(([x, y, s, i, pose, face]) => scientist(i, x, y, s, { pose, face, lite: s < 0.65 })).join('') +
      brennus(1050, 900, 1.3, { young: true, pose: 'point', face: 'determined' }) +
      undergrowth(12, 880, '#2f5a2a', '#4a8a3a') +
      bigLeaf(-40, 620, 1.6, -20, '#2a4a22') +
      bigLeaf(1640, 560, 1.6, 200, '#2a4a22') +
      sepia(id),
  );
}

/** 13. Young Brennus aims his big blaster rifle at the towering heart-flower; the scientists gasp. */
export function pastOrder(): string {
  const id = 'past-order';
  return panel(
    jungle(id, 8, ['#c8dcaa', '#557f40', '#2f5a2a'], 800) +
      `<defs>${glowDef(id + 'p', C.pink, 0.7)}</defs>` +
      gascuGiant(id + 'h', 1180, 980, 1.12) +
      scientist(2, 110, 820, 0.62, { pose: 'shock', face: 'shock', lite: true }) +
      scientist(4, 230, 830, 0.62, { pose: 'shock', face: 'worried', lite: true }) +
      scientist(0, 340, 826, 0.62, { pose: 'shock', face: 'shock', lite: true }) +
      brennus(560, 960, 1.65, { young: true, rifle: true, pose: 'rifle', aim: -24, face: 'angry' }) +
      undergrowth(31, 900, '#2f5a2a', '#4a8a3a') +
      sepia(id, 0.24) +
      // GaScu still glows pink through the old photo.
      glow(id + 'p', 1180, 365, 360, 0.55) +
      sparkle(1000, 260, 14, '#ffd6f2') +
      sparkle(1340, 160, 10, '#ffd6f2'),
  );
}
