import type { SaveData } from '../core/save';

export const STORY: string[] = [
  'The giant colony ship <b style="color:#7fe6ff">LEVIATHAN</b> is carrying ten thousand sleeping people to a brand new world.',
  'But on the way, something came aboard: a glowing space plant called <b style="color:#ff6fcf">THE BLOOM</b>. It grew... and grew... and GREW.',
  'Now vines cover every deck, the robots have gone haywire, and the ship is drifting toward a star!',
  'Only one crew member woke up: junior engineer <b style="color:#ffb07a">KAI REYES</b>. Time to climb six decks, reach the Bridge, and save everyone!',
];

export function endingText(kind: 'saved' | 'friends', save: SaveData): string[] {
  const colonists = save.colonists.length;
  if (kind === 'friends') {
    return [
      'BOLT flashed the words he remembered: <b>hello</b>... <b>safe</b>... <b>together</b>. The Bloom Heart glowed back, soft and gold.',
      'It was never a monster. It was lost and scared, just like BOLT in the dark. Now it had friends.',
      'The Bloom wrapped its vines around the steering controls and gently turned the Leviathan away from the star, toward a bright blue planet it knew.',
      `Ten thousand colonists woke up to gardens everywhere. ${colonists ? `The ${colonists} colonists you rescued told everyone your story.` : ''} And BOLT? He was never afraid of the dark again, because now something always glows.`,
    ];
  }
  return [
    'With a final flash, the Bloom Heart shrank into a tiny, sleepy seed. The vines let go of the ship.',
    'Kai grabbed the steering controls and pulled. The Leviathan swung away from the star just in time!',
    `Ten thousand colonists woke up above their new home. ${colonists ? `The ${colonists} colonists you rescued threw you a HUGE party.` : 'Everyone cheered for the engineer who saved the day.'}`,
    save.shards.length < 18
      ? 'BOLT kept the little seed in a flower pot. Somewhere in its memory shards is a secret... maybe the Bloom just needed a friend?'
      : 'BOLT kept the little seed in a flower pot and whispered to it every night. It always glowed back.',
  ];
}
