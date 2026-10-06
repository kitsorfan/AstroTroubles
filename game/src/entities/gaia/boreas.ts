import type { World } from '../../game/world';
import { PlaceholderBoss } from './placeholder';

/** BOREAS (placeholder fight while the real boss is built). */
export class Boreas extends PlaceholderBoss {
  readonly title = 'BOREAS';

  constructor(world: World, id: string, cx: number, cz: number, h: number) {
    super(world, id, cx, cz, h, 28, '#7fe6ff');
  }
}
