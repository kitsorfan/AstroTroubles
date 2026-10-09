import type { World } from '../../game/world';
import { Boss } from '../bossBase';

/** THE SLEEPLESS DRAGON (stub while the real one is built). */
export class Dragon extends Boss {
  readonly title = 'THE SLEEPLESS DRAGON';

  constructor(world: World, id: string, cx: number, cz: number, h: number) {
    super(world, id, cx, cz, h, 4);
  }

  update() {}

  reset() {
    this.hp = this.maxHp;
  }
}
