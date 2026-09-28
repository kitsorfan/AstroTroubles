import { CELL } from '../game/src/core/constants';
import { Grid, parseLevel } from '../game/src/world/grid';
import type { LevelDef } from '../game/src/world/levelTypes';
import { makeBody, moveBody, type Box } from '../game/src/world/physics';

function grid(map: string): Grid {
  const def: LevelDef = { id: 'cryo', index: 1, name: 'test', subtitle: '', music: 'cryo', map, legend: {}, objectives: [], shardIds: [], dialogues: {} };
  const p = parseLevel(def);
  return new Grid(p.width, p.depth, p.cells);
}

/** Runs the body for `seconds` in 60 Hz steps. */
function run(g: Grid, b: ReturnType<typeof makeBody>, seconds: number, boxes: Box[] = []) {
  for (let t = 0; t < seconds; t += 1 / 60) moveBody(b, 1 / 60, g, boxes);
}

const at = (c: number) => c * CELL + CELL / 2;

describe('moveBody', () => {
  const g = grid(`
#######
#.....#
#..1..#
#..3. #
#.@...#
#######
`);

  it('lands on the floor and stays there', () => {
    const b = makeBody(at(2), 2, at(4), 0.42, 1.7);
    run(g, b, 1);
    expect(b.grounded).toBe(true);
    expect(b.y).toBeCloseTo(0, 3);
  });

  it('walks up a small step but not a tall ledge', () => {
    const small = makeBody(at(3), 0, at(1), 0.42, 1.7);
    small.vz = 5;
    run(g, small, 0.35);
    expect(small.y).toBeCloseTo(0.5, 2);

    const tall = makeBody(at(3), 0, at(4), 0.42, 1.7);
    tall.vz = -5;
    run(g, tall, 0.5);
    expect(tall.y).toBeCloseTo(0, 2);
    expect(tall.z).toBeGreaterThan(at(3));
  });

  it('never walks through walls', () => {
    const b = makeBody(at(1), 0, at(4), 0.42, 1.7);
    b.vx = -20;
    run(g, b, 1);
    expect(b.x).toBeGreaterThanOrEqual(CELL + 0.42 - 1e-6);
  });

  it('falls into the void', () => {
    const b = makeBody(at(5), 0, at(3), 0.42, 1.7);
    run(g, b, 1);
    expect(b.grounded).toBe(false);
    expect(b.y).toBeLessThan(-3);
  });

  it('stands on boxes such as platforms and crates', () => {
    const box: Box = { minX: at(1) - 1, maxX: at(1) + 1, minZ: at(1) - 1, maxZ: at(1) + 1, bottom: 0.5, top: 1, solid: true, dx: 0, dy: 0, dz: 0 };
    const b = makeBody(at(1), 1.2, at(1), 0.42, 1.7);
    run(g, b, 0.5, [box]);
    expect(b.grounded).toBe(true);
    expect(b.ground?.box).toBe(box);
    expect(b.y).toBeCloseTo(1, 2);
  });
});
