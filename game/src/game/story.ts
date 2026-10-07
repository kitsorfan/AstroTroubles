import { GAME_NAME } from '../core/brand';
import { tr, upper } from '../core/i18n';
import type { SaveData } from '../core/save';
import { CHAPTER_DECKS, LEVELS, chapterTotals, inChapter, type Chapter } from '../levels';
import type { BadgeKind } from '../entities/badges';
import type { BossKind, DeckId, EndingKind, Line } from '../world/levelTypes';

/**
 * The story of ASTROTROUBLES!
 *
 * A glowing space seed, GaScu, lands on a colony ship and grows over it. It puts the crew to
 * sleep in cocoons and steers the ship toward a star, because it would rather burn than be carried
 * to the planet the ship is flying to. Junior engineer Jason wakes up early, rescues the Captain's
 * scared little drone LUX, follows the Captain's recorded logs up six decks, saves Aunt Rosa, frees
 * HALCYON (the ship's computer) from GaScu pollen, and learns the truth: GaScu isn't a monster,
 * it's terrified. At the top, Jason can stop the Heart of GaScu, or, with every memory shard, LUX
 * can talk to it in lights.
 *
 * Chapter 2, GAIA NOVA. Forty years ago General Brennus led the first expedition, in the warship
 * Gorgon, to make Gaia Nova ready for the colony ship. The planet fought back, so he decided to
 * destroy the heart of all its plants, the great flower the scientists named Celestia; they mutinied
 * and launched it into space. Celestia IS GaScu (which is why, when it met the colony ship flying to
 * Gaia Nova, it turned the ship away), and chapter 2 calls it by that real name: Brennus reveals it
 * in his broadcast. Brennus captures Dr. Hypatia's science team, and his drones steal Celestia so he
 * can force its pollen into a Thorn Legion of machines and build the Colossus inside the volcano
 * Mount Atlantas. Jason and LUX cross six regions to free the scientists and Celestia. The
 * 18 pages of Brennus's journal tell how a boy who loved his grandmother's greenhouse became a man
 * who tries to own everything; with all of them, Jason can talk him down instead of beating him.
 */

/** Narration for the opening cinematic, one caption per shot. */
export const PROLOGUE = {
  ship: 'The colony ship <b>{ship}</b>. Ten thousand people asleep in their pods, on the long journey to a new home.',
  quiet: 'The ship computer, <b>HALCYON</b>, kept watch. For months, everything was quiet...',
  comet: '...until something came flying out of the dark.',
  seed: 'It was not a comet. It was a seed: a glowing space vine called the <b>Galactic Cuscuta Echinochloa</b>. <b style="color:#ff6fcf">GASCU</b>, for short.',
  grow: 'GaScu grew and grew. It wrapped the crew in soft cocoons and made the robots go haywire.',
  turn: 'Then its roots reached the Bridge... and it turned the ship toward a burning star.',
  wake: 'But deep inside, on the Cryo Deck, one little pod was waking up early.',
};

/** Shown while the camera sweeps over a deck on the first visit. */
export const FLYOVER: Record<DeckId, string> = {
  cryo: '',
  hydro: '<b>Hydroponics</b>: the gardens that feed the whole ship. GaScu loves it here... a little too much.',
  engine: 'The <b>Engine Core</b>. The coolant pumps are off, the lava is rising, and something big is stomping around.',
  habitat: 'The <b>Habitat Ring</b>, where the colonists live. Home, sweet, gooey home.',
  security: 'The <b>Security Deck</b>. Lasers, cameras... and a voice that does not sound like HALCYON anymore.',
  bridge: '<b>The Bridge</b>. The star fills every window now. At the very top, the Heart of GaScu is waiting.',
  plains: 'The <b>Whispering Plains</b> of Gaia Nova. Golden grass as far as you can see... and the science team’s camp, empty.',
  desert: 'The <b>Glass Desert</b>. Sand that sparkles like sugar, ruins older than anyone remembers, and Brennus’s drills chewing through it all.',
  snow: 'The <b>Frostpeak Tundra</b>. Somewhere in this blizzard is Brennus’s prison camp, and the scientists he captured.',
  rockies: 'The <b>Titan Rockies</b>. Cliffs taller than the {ship}, rickety bridges, and up at the very top... the wreck of the Gorgon.',
  jungle: 'The <b>Thornwood Jungle</b>. Something is wrong here: the trees are grey, and Celestia’s pollen hangs in the air like fog.',
  volcano: '<b>Mount Atlantas</b>. Brennus built his fortress right inside the volcano. Celestia is in there. So is the end of this.',
};

/** What everyone says in the lift between one deck and the next, keyed by the deck being left. */
export const TRANSITIONS: Record<DeckId, Line[]> = {
  cryo: [
    { who: 'halcyon', text: 'Lift engaged! Jason, take a look out of the window.' },
    { who: 'jason', text: 'Whoa. Is that the star? It is SO bright.' },
    { who: 'halcyon', text: 'At this speed we will be too close in three days. Plenty of time! Probably. Maybe.' },
    { who: 'bolt', text: 'Look at the vines on the hull. They all grow toward the Bridge... like roots going home.' },
  ],
  hydro: [
    { who: 'halcyon', text: 'Warning: the ship is speeding up. The engines are running way too hot.' },
    { who: 'jason', text: 'Who turned them up?' },
    { who: 'halcyon', text: 'Not me! Something on the Bridge. GaScu is in a hurry to reach that star.' },
    { who: 'bolt', text: 'The Engine Core is full of lava. I will stay VERY close to you. Like, super close.' },
  ],
  engine: [
    { who: 'jason', text: 'The Habitat Ring is next... that is where I live. Where Aunt Rosa lives.' },
    { who: 'bolt', text: 'Is she nice? Does she like drones?' },
    { who: 'jason', text: 'She is the Security Chief. She is the bravest person I know. She will be okay. She has to be.' },
    { who: 'halcyon', text: 'Lift to the Habitat Ring. The star is getting... bzzt... closer.' },
  ],
  habitat: [
    { who: 'glitch', text: 'Lift to S-S-Security. GaScu is so... warm. So... pretty...' },
    { who: 'jason', text: 'HALCYON? HALCYON, what is wrong?' },
    { who: 'bolt', text: 'The pollen! It got into HALCYON’s computer core. That is on the Security Deck!' },
    { who: 'jason', text: 'Then that is where we are going. Hang on, HALCYON.' },
  ],
  security: [
    { who: 'halcyon', text: 'Final lift: the Bridge. Jason, the star is VERY close now. I can feel my circuits sweating.' },
    { who: 'jason', text: 'LUX... if GaScu talks in lights, could you talk to it?' },
    { who: 'bolt', text: 'Maybe! If I knew its words. The memory shards are full of its memories...' },
    { who: 'halcyon', text: 'With every memory shard, LUX might learn its language. If not, you will have to stop the Heart the hard way.' },
  ],
  bridge: [],
  plains: [
    { who: 'halcyon', text: 'Shuttle systems online. Next stop: the Glass Desert. Dr. Hypatia’s team was digging there before the radio went quiet.' },
    { who: 'jason', text: 'The scientists we freed said Brennus took the others south. Why would he want a bunch of scientists?' },
    { who: 'bolt', text: 'Maybe he needs someone clever. He does not seem clever. He seems... grumpy.' },
    { who: 'halcyon', text: 'Grumpy AND dangerous. His drills are all over the desert. Please land somewhere soft.' },
  ],
  desert: [
    { who: 'bolt', text: 'Jason, those ruins! The lights on the walls were Celestia’s light-words. Hello, safe, together!' },
    { who: 'jason', text: 'So Celestia’s people were here once? A long, long time ago?' },
    { who: 'halcyon', text: 'That would explain why Celestia dreamed of a warm blue world. It was not a dream. It was a memory.' },
    { who: 'jason', text: 'And now Brennus wants to turn it into a weapon. Not if we can help it. North, to the tundra!' },
  ],
  snow: [
    { who: 'halcyon', text: 'Dr. Galen is safe on board the {ship}. He slept for forty years and woke up very hungry. He has eaten eleven pancakes.' },
    { who: 'jason', text: 'Did the others hear anything about Brennus’s plans?' },
    { who: 'halcyon', text: 'Engineer Ariadne did: “Brennus is building something called the COLOSSUS. And he writes everything in his journal. Find the pages, and you will understand him.”' },
    { who: 'bolt', text: 'A journal? Brennus has FEELINGS? ...Should I be more scared or less scared?' },
  ],
  rockies: [
    { who: 'jason', text: 'The Gorgon crashed up there forty years ago. Brennus has been alone on this planet ever since.' },
    { who: 'bolt', text: 'Forty years alone. I was alone in a dark storeroom for ONE day, and I did not like it at all.' },
    { who: 'halcyon', text: 'Warning: the jungle ahead is thick with Celestia pollen. Something has gone very wrong down there.' },
    { who: 'jason', text: 'Then we fix it. Hang on, Celestia. We’re coming.' },
  ],
  jungle: [
    { who: 'celestia', text: '...Jason... ...LUX... ...hot... ...trapped... ...please...' },
    { who: 'bolt', text: 'That was Celestia! It flashed to me through the pollen. It is inside the volcano!' },
    { who: 'halcyon', text: 'Mount Atlantas. Brennus’s fortress. The Colossus will be waiting for you.' },
    { who: 'jason', text: 'So will we. One last climb, LUX.' },
    { who: 'bolt', text: 'One last climb. I will be brave if you are brave.' },
  ],
  volcano: [],
};

/** Narration for the opening of chapter 2, one caption per shot. */
export const PROLOGUE2 = {
  arrive: 'After months between the stars, the <b>{ship}</b> reached its new home: a green and blue world called <b>Gaia Nova</b>.',
  team: 'Captain Argus sent the science team down first. Their leader, <b>Dr. Hypatia</b>, would find the perfect place to land.',
  quiet: 'Three days later, their radio went quiet...',
  signal: '...and then a message came up from the planet.',
  snatch: 'That night, little black drones swooped onto the {ship}, grabbed Celestia and flew it down to the planet.',
  down: 'So Jason and LUX climbed into the shuttle and flew down to Gaia Nova.',
};

/** General Brennus's broadcast, and what the ship says back. */
export const BROADCAST: Line[] = [
  { who: 'brennus', text: 'Attention, colony ship. This is General Brennus, of the warship Gorgon.' },
  { who: 'brennus', text: 'I reached Gaia Nova forty years before you. This world is MINE. Every tree, every river, every rock.' },
  { who: 'brennus', text: 'Your scientists came poking around my planet. They will be my guests for a while.' },
  { who: 'brennus', text: 'And you have brought back something of mine. That little plant you call GaScu. Its real name is CELESTIA.' },
  { who: 'captain', text: 'Brennus... my first commander. He led the first expedition here, forty years ago. We all thought he was lost.' },
  { who: 'brennus', text: 'Hello, Argus. Turn your ship around and fly away, or meet my THORN LEGION.' },
];

/** After the drones steal Celestia. */
export const STOLEN: Line[] = [
  { who: 'bolt', text: 'GaScu! I mean... Celestia! They took it! Jason, they TOOK it!' },
  { who: 'captain', text: 'Celestia: the name the first expedition gave it. He wants its pollen for his army. Jason, LUX: take the shuttle down. Find the scientists, and bring Celestia back.' },
  { who: 'jason', text: 'We will, Captain. Come on, LUX. Gaia Nova needs us.' },
];

/** Name cards for boss entrances. */
export const BOSS_CARD: Record<BossKind, { sub: string; color: string }> = {
  warden: { sub: 'Cryo-bay guard robot · frozen and grumpy', color: '#7fe6ff' },
  queen: { sub: 'Ruler of the gardens · very, very thorny', color: '#c6ff7a' },
  golem: { sub: 'Melted engine parts · too hot to touch', color: '#ffa23a' },
  bloblin: { sub: 'The wobbliest king in space', color: '#ff7fd0' },
  wardog: { sub: 'Chief security robot · controlled by the pollen', color: '#ff3a4c' },
  heart: { sub: 'GaScu itself · steering the ship', color: '#ff6fcf' },
  reborn: { sub: 'Every vine on the ship · its very last stand', color: '#ff2a8a' },
  thresher: { sub: 'Brennus’s giant harvester · it mows down everything', color: '#ffd166' },
  driller: { sub: 'A mining machine as long as a river · and twice as loud', color: '#ff9a3a' },
  boreas: { sub: 'Warden of the prison camp · colder than the tundra', color: '#7fe6ff' },
  stheno: { sub: 'Last gunship of the Gorgon · guards the mountain pass', color: '#ffb347' },
  hydra: { sub: 'The jungle’s sickness · three heads, zero manners', color: '#ff6fcf' },
  colossus: { sub: 'General Brennus’s war machine · with Celestia caged inside', color: '#ff3a4c' },
};

/**
 * What each kind of enemy is, and what it's trying to do. GaScu's plan is simple: keep growing
 * toward the Bridge, keep the ship pointed at the star, and keep everyone asleep. Every creature
 * (and every robot the pollen got to) has a job in that plan.
 */
export const INTEL: Record<BadgeKind | 'elite', { name: string; tip: string }> = {
  sporeling: { name: 'Spore Crawler', tip: 'Hunts in packs and tries to surround you. Keep moving!' },
  snapper: { name: 'Maw Plant', tip: 'Hides in the roots and bites up close. Watch its jaws!' },
  buzzer: { name: 'Stinger Wasp', tip: 'Circles you and dives in while you reload.' },
  sentry: { name: 'Warden Bot', tip: 'Shield in front, weak spot behind: hit the glowing pack on its back!' },
  turret: { name: 'Spitter Pod', tip: 'Lobs acid where you are going. Change direction to dodge.' },
  brute: { name: 'Horned Brute', tip: 'Charges in straight lines. Dodge, then hit it while it’s dizzy.' },
  blob: { name: 'Bloblin', tip: 'Splits when popped. Pop the big ones, then the little ones.' },
  trooper: { name: 'Legion Trooper', tip: 'Its red eye glows, then it fires three slow shots. Run sideways!' },
  minebot: { name: 'Roller Mine', tip: 'It beeps and flashes before it pops. Blast it early, or run out of the red circle!' },
  bulwark: { name: 'Shield Bulwark', tip: 'The shield only covers its front. Hit it from behind, or ground-pound to knock the shield down!' },
  mortar: { name: 'Mortar Bot', tip: 'Shells land on the red circles. Step out, then run up close: it can’t aim at its own feet!' },
  elite: { name: 'Elite!', tip: 'A gold crown means bigger, tougher and more bolts.' },
};

/** Narration for the ending cinematics. */
export const ENDING_CAPTIONS: Record<EndingKind, string[]> = {
  saved: [
    'With one mighty pull on the wheel, the <b>{ship}</b> swung away from the star.',
    'The vines let go of the ship. The Heart of GaScu curled up into a tiny, sleeping seed.',
    'Weeks later, the pods opened one by one above a green-and-blue world: <b>Gaia Nova</b>.',
    'Ten thousand colonists had a new home. And a brand new hero.',
  ],
  friends: [
    'LUX flashed the words: <b style="color:#5e9bff">hello</b>... <b style="color:#ff6fcf">safe</b>... <b style="color:#ffd166">together</b>. And for the first time, GaScu flashed back.',
    'Its vines turned gold and burst into flowers. After a long, long time in the dark, GaScu was not afraid anymore.',
    'Gently, it turned the {ship} away from the star and back toward the warm blue world it had run from. It was not scared anymore: now it had friends.',
    'Ten thousand colonists woke up in a garden between the stars. And LUX was never scared of the dark again, because now something always glows.',
  ],
  freed: [
    'The Colossus crashed down into the crater, and Mount Atlantas let out one last, tired puff of smoke.',
    'Celestia’s vines slipped free of the machines. All over Gaia Nova, the Thorn Legion switched off and went quiet.',
    'General Brennus was taken up to the {ship} to explain himself to Captain Argus. It was going to be a VERY long talk.',
    'And at last, the colonists stepped out onto <b>Gaia Nova</b>: a brand new home that belonged to everyone.',
  ],
  redeemed: [
    'Brennus read the very first page of his journal, the one he wrote when he was twelve... and lowered his hands.',
    '“I came here to make this world obey me,” he said. “I forgot that the best gardens are the ones you share.”',
    'Together, Brennus, the scientists and Celestia turned the Thorn Legion into the <b>Green Legion</b>: robots that plant forests instead of fighting.',
    'On the colony’s first morning, Celestia bloomed across the whole valley. Gaia Nova was home at last, for everyone.',
  ],
};

/** Which chapter an ending belongs to. */
export const endingChapter = (kind: EndingKind): Chapter => (kind === 'saved' || kind === 'friends' ? 1 : 2);

/** The short epilogue on the final stats card. */
export function endingText(kind: EndingKind, save: SaveData): string[] {
  if (endingChapter(kind) === 2) return endingText2(kind, save);
  const n = inChapter(save.colonists, 1);
  const rosa = save.colonists.includes('security.c1');
  const captain = save.colonists.includes('bridge.c1');
  const out: string[] = [];
  out.push(
    kind === 'friends'
      ? tr('GaScu became the ship’s gardener. Every deck is full of flowers now, and they glow a little brighter whenever LUX flies by.')
      : tr('LUX kept the little GaScu seed in a flower pot on the Bridge, and whispered to it every night. It always glowed back.'),
  );
  if (captain) out.push(tr('Captain Argus promoted Jason to Chief Engineer on the spot. LUX got a medal. He wears it every day.'));
  if (rosa) out.push(tr('Aunt Rosa tells everyone the story of the day her Jason saved the ship. Twice a day. Sometimes three times.'));
  out.push(n ? tr('You rescued {n} of {total} colonists from their cocoons.', { n, total: chapterTotals(1).colonists }) : tr('The colonists woke up and cheered for the engineer who saved the day.'));
  if (kind === 'saved' && inChapter(save.shards, 1) < chapterTotals(1).shards) out.push(tr('Psst... GaScu still has secrets. Find all 18 memory shards and LUX might learn to talk to it.'));
  return out;
}

function endingText2(kind: EndingKind, save: SaveData): string[] {
  const n = inChapter(save.colonists, 2);
  const hypatia = save.colonists.includes('volcano.c1');
  const out: string[] = [];
  out.push(
    kind === 'redeemed'
      ? tr('Brennus planted his grandmother’s tomato seeds in the colony’s very first garden. He gave every single plant a name.')
      : tr('Celestia planted itself in the middle of the Whispering Plains. By spring, the whole valley was in flower.'),
  );
  if (hypatia) out.push(tr('Dr. Hypatia named a brand new flower after LUX. It glows in the dark, of course.'));
  out.push(tr('Captain Argus made Jason the colony’s first Chief Explorer. LUX got a second medal. He wears both.'));
  out.push(n ? tr('You freed {n} of {total} scientists from Brennus’s camps.', { n, total: chapterTotals(2).colonists }) : tr('The scientists found their own way home, and told everyone about the boy and his robot.'));
  if (kind === 'freed' && inChapter(save.shards, 2) < chapterTotals(2).shards) out.push(tr('Psst... Brennus’s journal still has missing pages. Find all 18 and you might reach the man inside the machine.'));
  return out;
}

function colonistNames(save: SaveData, ch: Chapter): string[] {
  const names: string[] = [];
  for (const id of CHAPTER_DECKS[ch]) {
    for (const spec of Object.values(LEVELS[id].legend)) {
      if (spec.type === 'cocoon' && save.colonists.includes(`${id}.${spec.id}`)) names.push(spec.name);
    }
  }
  return names;
}

export function creditsHtml(kind: EndingKind, save: SaveData): string {
  const p = (s: string) => `<p>${tr(s)}</p>`;
  const head = (s: string) => `<h3>${tr(s)}</h3>`;
  if (endingChapter(kind) === 2) {
    const rescued = colonistNames(save, 2);
    return [
      `<h1>${upper(tr(GAME_NAME))}</h1>`,
      `<h2>${upper(tr('Gaia Nova'))}</h2>`,
      head('STARRING'),
      p('Jason, junior engineer'),
      p('LUX, a very brave little drone'),
      head('WITH'),
      p('HALCYON, the ship computer'),
      p('Captain Argus'),
      p('Dr. Hypatia, chief scientist'),
      p('PANDORA, the travelling shop'),
      p('Celestia, home at last'),
      kind === 'redeemed' ? p('General Brennus, a gardener at last') : p('General Brennus, a very grumpy old general'),
      head('THE THORN LEGION'),
      p('Thresher · Dune Driller · Boreas'),
      p('Stheno · the Thorn Hydra · the Colossus'),
      head('SCIENTISTS YOU FREED'),
      ...(rescued.length ? rescued.map(p) : [p('Everyone made it home safe and sound!')]),
      head('JOURNAL PAGES'),
      `<p>${tr('{n} of 18', { n: inChapter(save.shards, 2) })}</p>`,
      `<p class="end">${tr('Thank you for playing!')}</p>`,
    ].join('');
  }
  const rescued = colonistNames(save, 1);
  return [
    `<h1>${upper(tr(GAME_NAME))}</h1>`,
    head('STARRING'),
    p('Jason, junior engineer'),
    p('LUX, a very brave little drone'),
    head('WITH'),
    p('HALCYON, the ship computer'),
    p('Captain Argus'),
    p('Aunt Rosa, Security Chief'),
    p('PANDORA, the travelling shop'),
    kind === 'friends' ? p('GaScu, as our new friend') : p('GaScu, as a sleepy seed'),
    head('THE GUARDIANS'),
    p('Frost Warden · Vine Queen · Magma Golem'),
    p('King Bloblin · CERBERUS · the Heart of GaScu'),
    head('COLONISTS YOU RESCUED'),
    ...(rescued.length ? rescued.map(p) : [p('Everyone woke up safe and sound!')]),
    head('MEMORY SHARDS'),
    `<p>${tr('{n} of 18', { n: inChapter(save.shards, 1) })}</p>`,
    `<p class="end">${tr('Thank you for playing!')}</p>`,
  ].join('');
}
