import type { SaveData } from '../core/save';
import { LEVELS, LEVEL_ORDER } from '../levels';
import type { BossKind, DeckId, Line } from '../world/levelTypes';

/**
 * The story of HULL BREACH: LEVIATHAN.
 *
 * A glowing space seed, the Bloom, lands on a colony ship and grows over it. It puts the crew to
 * sleep in cocoons and steers the ship toward a star, because the star looks like its long-lost
 * home. Junior engineer Kai Reyes wakes up early, rescues the Captain's scared little drone BOLT,
 * follows the Captain's recorded logs up six decks, saves Aunt Rosa, frees HALCYON (the ship's
 * computer) from Bloom pollen, and learns the truth: the Bloom isn't a monster, it's lost. At the
 * top, Kai can stop the Bloom Heart, or, with every memory shard, BOLT can talk to it in lights.
 */

/** Narration for the opening cinematic, one caption per shot. */
export const PROLOGUE = {
  ship: 'The colony ship <b>LEVIATHAN</b>. Ten thousand people asleep in their pods, on the long journey to a new home.',
  quiet: 'The ship computer, <b>HALCYON</b>, kept watch. For months, everything was quiet...',
  comet: '...until something came flying out of the dark.',
  seed: 'It was not a comet. It was a seed: a glowing space plant called <b style="color:#ff6fcf">THE BLOOM</b>.',
  grow: 'The Bloom grew and grew. It wrapped the crew in soft cocoons and made the robots go haywire.',
  turn: 'Then its roots reached the Bridge... and it turned the ship toward a burning star.',
  wake: 'But deep inside, on the Cryo Deck, one little pod was waking up early.',
};

/** Shown while the camera sweeps over a deck on the first visit. */
export const FLYOVER: Record<DeckId, string> = {
  cryo: '',
  hydro: '<b>Hydroponics</b>: the gardens that feed the whole ship. The Bloom loves it here... a little too much.',
  engine: 'The <b>Engine Core</b>. The coolant pumps are off, the lava is rising, and something big is stomping around.',
  habitat: 'The <b>Habitat Ring</b>, where the colonists live. Home, sweet, gooey home.',
  security: 'The <b>Security Deck</b>. Lasers, cameras... and a voice that does not sound like HALCYON anymore.',
  bridge: '<b>The Bridge</b>. The star fills every window now. At the very top, the Bloom Heart is waiting.',
};

/** What everyone says in the lift between one deck and the next, keyed by the deck being left. */
export const TRANSITIONS: Record<DeckId, Line[]> = {
  cryo: [
    { who: 'halcyon', text: 'Lift engaged! Kai, take a look out of the window.' },
    { who: 'kai', text: 'Whoa. Is that the star? It is SO bright.' },
    { who: 'halcyon', text: 'At this speed we will be too close in three days. Plenty of time! Probably. Maybe.' },
    { who: 'bolt', text: 'Look at the vines on the hull. They all grow toward the Bridge... like roots going home.' },
  ],
  hydro: [
    { who: 'halcyon', text: 'Warning: the ship is speeding up. The engines are running way too hot.' },
    { who: 'kai', text: 'Who turned them up?' },
    { who: 'halcyon', text: 'Not me! Something on the Bridge. The Bloom is in a hurry to reach that star.' },
    { who: 'bolt', text: 'The Engine Core is full of lava. I will stay VERY close to you. Like, super close.' },
  ],
  engine: [
    { who: 'kai', text: 'The Habitat Ring is next... that is where I live. Where Aunt Rosa lives.' },
    { who: 'bolt', text: 'Is she nice? Does she like drones?' },
    { who: 'kai', text: 'She is the Security Chief. She is the bravest person I know. She will be okay. She has to be.' },
    { who: 'halcyon', text: 'Lift to the Habitat Ring. The star is getting... bzzt... closer.' },
  ],
  habitat: [
    { who: 'glitch', text: 'Lift to S-S-Security. The Bloom is so... warm. So... pretty...' },
    { who: 'kai', text: 'HALCYON? HALCYON, what is wrong?' },
    { who: 'bolt', text: 'The pollen! It got into HALCYON’s computer core. That is on the Security Deck!' },
    { who: 'kai', text: 'Then that is where we are going. Hang on, HALCYON.' },
  ],
  security: [
    { who: 'halcyon', text: 'Final lift: the Bridge. Kai, the star is VERY close now. I can feel my circuits sweating.' },
    { who: 'kai', text: 'BOLT... if the Bloom talks in lights, could you talk to it?' },
    { who: 'bolt', text: 'Maybe! If I knew its words. The memory shards are full of its memories...' },
    { who: 'halcyon', text: 'With every memory shard, BOLT might learn its language. If not, you will have to stop the Heart the hard way.' },
  ],
  bridge: [],
};

/** Name cards for boss entrances. */
export const BOSS_CARD: Record<BossKind, { sub: string; color: string }> = {
  warden: { sub: 'Cryo-bay guard robot · frozen and grumpy', color: '#7fe6ff' },
  queen: { sub: 'Ruler of the gardens · very, very thorny', color: '#c6ff7a' },
  golem: { sub: 'Melted engine parts · too hot to touch', color: '#ffa23a' },
  bloblin: { sub: 'The wobbliest king in space', color: '#ff7fd0' },
  wardog: { sub: 'Chief security robot · controlled by the pollen', color: '#ff3a4c' },
  heart: { sub: 'The Bloom itself · steering the ship', color: '#ff6fcf' },
};

/** Narration for the two ending cinematics. */
export const ENDING_CAPTIONS: Record<'saved' | 'friends', string[]> = {
  saved: [
    'With one mighty pull on the wheel, the <b>LEVIATHAN</b> swung away from the star.',
    'The vines let go of the ship. The Bloom Heart curled up into a tiny, sleeping seed.',
    'Weeks later, the pods opened one by one above a green-and-blue world: <b>Nova Terra</b>.',
    'Ten thousand colonists had a new home. And a brand new hero.',
  ],
  friends: [
    'BOLT flashed the words: <b style="color:#5e9bff">hello</b>... <b style="color:#ff6fcf">safe</b>... <b style="color:#ffd166">together</b>. And for the first time, the Bloom flashed back.',
    'Its vines turned gold and burst into flowers. After a long, long time in the dark, the Bloom was not afraid anymore.',
    'Gently, it turned the LEVIATHAN away from the star, toward a warm blue world it had seen in its dreams.',
    'Ten thousand colonists woke up in a garden between the stars. And BOLT was never scared of the dark again, because now something always glows.',
  ],
};

/** The short epilogue on the final stats card. */
export function endingText(kind: 'saved' | 'friends', save: SaveData): string[] {
  const n = save.colonists.length;
  const rosa = save.colonists.includes('security.c1');
  const captain = save.colonists.includes('bridge.c1');
  const out: string[] = [];
  out.push(
    kind === 'friends'
      ? 'The Bloom became the ship’s gardener. Every deck is full of flowers now, and they glow a little brighter whenever BOLT flies by.'
      : 'BOLT kept the little Bloom seed in a flower pot on the Bridge, and whispered to it every night. It always glowed back.',
  );
  if (captain) out.push('Captain Mbeki promoted Kai to Chief Engineer on the spot. BOLT got a medal. He wears it every day.');
  if (rosa) out.push('Aunt Rosa tells everyone the story of the day her Kai saved the ship. Twice a day. Sometimes three times.');
  out.push(n ? `You rescued ${n} of 12 colonists from their cocoons.` : 'The colonists woke up and cheered for the engineer who saved the day.');
  if (kind === 'saved' && save.shards.length < 18) out.push('Psst... the Bloom still has secrets. Find all 18 memory shards and BOLT might learn to talk to it.');
  return out;
}

function colonistNames(save: SaveData): string[] {
  const names: string[] = [];
  for (const id of LEVEL_ORDER) {
    for (const spec of Object.values(LEVELS[id].legend)) {
      if (spec.type === 'cocoon' && save.colonists.includes(`${id}.${spec.id}`)) names.push(spec.name);
    }
  }
  return names;
}

export function creditsHtml(kind: 'saved' | 'friends', save: SaveData): string {
  const rescued = colonistNames(save);
  const p = (s: string) => `<p>${s}</p>`;
  return [
    '<h1>HULL BREACH<br>LEVIATHAN</h1>',
    '<h3>STARRING</h3>',
    p('Kai Reyes, junior engineer'),
    p('BOLT, a very brave little drone'),
    '<h3>WITH</h3>',
    p('HALCYON, the ship computer'),
    p('Captain Ines Mbeki'),
    p('Aunt Rosa Reyes, Security Chief'),
    p('VENDY, the travelling shop'),
    p(kind === 'friends' ? 'The Bloom, as our new friend' : 'The Bloom, as a sleepy seed'),
    '<h3>THE GUARDIANS</h3>',
    p('Frost Warden · Vine Queen · Magma Golem'),
    p('King Bloblin · WARDOG · the Bloom Heart'),
    '<h3>COLONISTS YOU RESCUED</h3>',
    ...(rescued.length ? rescued.map(p) : [p('Everyone woke up safe and sound!')]),
    '<h3>MEMORY SHARDS</h3>',
    p(`${save.shards.length} of 18`),
    `<p class="end">Thank you for playing!</p>`,
  ].join('');
}
