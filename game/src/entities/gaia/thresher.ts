import type { World } from '../../game/world';
import { PlaceholderBoss } from './placeholder';

/** THE THRESHER (placeholder fight while the real boss is built). */
export class Thresher extends PlaceholderBoss {
  readonly title = 'THE THRESHER';

  constructor(world: World, id: string, cx: number, cz: number, h: number) {
    super(world, id, cx, cz, h, 24, '#ffd166');
  }
}
