import type { World } from '../../game/world';
import { PlaceholderBoss } from './placeholder';

/** STHENO (placeholder fight while the real boss is built). */
export class Stheno extends PlaceholderBoss {
  readonly title = 'STHENO';

  constructor(world: World, id: string, cx: number, cz: number, h: number) {
    super(world, id, cx, cz, h, 30, '#ffb347');
  }
}
