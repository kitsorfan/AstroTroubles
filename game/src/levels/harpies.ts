import type { LevelDef } from '../world/levelTypes';

/** Chapter 3, level 2 — the Harpy Isles (being built). */
export const harpies: LevelDef = {
  id: 'harpies',
  index: 14,
  name: 'Harpy Isles',
  subtitle: 'Islands in the sky',
  music: 'isles',
  intro: 'intro',
  boss: 'aello',
  shardIds: [],
  map: `
.....
..@..
.....
`,
  legend: {},
  objectives: [],
  dialogues: { intro: [{ who: 'jason', text: 'Whoa.' }] },
  heroes: ['jason', 'atalanta'],
};
