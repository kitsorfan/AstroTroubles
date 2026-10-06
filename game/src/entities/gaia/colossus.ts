import type { World } from '../../game/world';
import { PlaceholderBoss } from './placeholder';

/** THE COLOSSUS (placeholder fight while the real boss is built). */
export class Colossus extends PlaceholderBoss {
  readonly title = 'THE COLOSSUS';

  constructor(world: World, id: string, cx: number, cz: number, h: number) {
    super(world, id, cx, cz, h, 90, '#ff3a4c');
  }
}
