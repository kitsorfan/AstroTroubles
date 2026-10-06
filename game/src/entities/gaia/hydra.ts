import type { World } from '../../game/world';
import { PlaceholderBoss } from './placeholder';

/** THE THORN HYDRA (placeholder fight while the real boss is built). */
export class Hydra extends PlaceholderBoss {
  readonly title = 'THE THORN HYDRA';

  constructor(world: World, id: string, cx: number, cz: number, h: number) {
    super(world, id, cx, cz, h, 32, '#ff6fcf');
  }
}
