import type { World } from '../../game/world';
import { PlaceholderBoss } from './placeholder';

/** DUNE DRILLER (placeholder fight while the real boss is built). */
export class Driller extends PlaceholderBoss {
  readonly title = 'DUNE DRILLER';

  constructor(world: World, id: string, cx: number, cz: number, h: number) {
    super(world, id, cx, cz, h, 26, '#ff9a3a');
  }
}
