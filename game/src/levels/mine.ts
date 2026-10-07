import type { LevelDef } from '../world/levelTypes';

/**
 * Chapter 3, level 3 — Aeëtes's Mine, played as General Brennus alone (a parallel story: while the
 * Argonauts fight on the Harpy Isles, he flies the Gorgon's old lifeboat to Aeëtes's mining moon to
 * steal the map to the Fleece vault on Colchis). Brennus's own moves make the puzzles:
 *
 * 1. The landing: the CANNON, a cracked rock wall only a BIG BLAST smashes, then a CHARGE-LEAP over the
 *    gap into the mine.
 * 2. The conveyor hall: belts carrying ore toward molten gold, and a crate barricade to CHARGE through.
 * 3. The shield gallery: a narrow walkway over molten ore with Aeëtes's guards firing down it. SHIELD up
 *    and march.
 * 4. The plate gate: it only stays open while something heavy stands on its plate. At the COMMAND POST,
 *    one of Brennus's old robots (painted gold by Aeëtes) marches onto the plate for him.
 * 5. The pit: ride an ore cart across; a Legion hauler (another command post) carries him to the vault
 *    island; stepping stones for charge-leaps lead to the heart canister.
 * 6. The depot yard: gold robots and Aeëtes's guard bots. A command post turns the robots back to his side.
 * 7. THE GOLD EXCAVATOR, his own old digging machine with Aeëtes's control box bolted on: shield its
 *    charges (or make it crash into a pillar), blast the box, and finally COMMAND it to stand down.
 * 8. Aeëtes's office: the map to Colchis's Fleece vault. Brennus calls his lifeboat and sends the map to the Argo.
 */
export const mine: LevelDef = {
  id: 'mine',
  index: 14,
  name: 'Aeëtes’s Mine',
  subtitle: 'General Brennus goes alone',
  music: 'mine',
  intro: 'intro',
  boss: 'excavator',
  heroes: ['brennus'],
  // Chapter 3's collectible (the Gardeners' light-stones) comes with the Harpy Isles.
  shardIds: [],
  map: `
     ##############
     #|4444444444|#
     #44L44444M4k4#
     #44444-44N444#
     #444444j44444#
     #444444444444#
     ######B###################################
     #44Y4444444Y44444444444444444Y4444444Y444#
     #4444444444444444444444444444444444444h44#
     #4444444U44444444444444444444444U44444444#
     #4444444444444444444444444444444444444444#
     #4444444444444444444W44444444444444444444#
     #4444444444444444444444444444444444444444#
     #4444444444444444444444444444444444444444#
     #4444444444444444444444444444444444444444#
     #4444444U44444444444444444444444U44444444#
     #4V44444444444444w444444h44444444444444V4#
     #4444444444444444444444444444444444444444#
     ####################G#####################
     #4444444444444444444444444444444444444444#
     #4x44J444K4444444C44444444P44444K44444h44#
     #4x4444444444444o4444444o44444444444S4444#
     #444444T444444444444444444444444444444444#
     #4444444444444444444Z44444444T44444444444#
     #444444444444T444444444444444444444444444#
     #4444444444o44444444444S444444o4444T44444#
     #4444S4444444444444444444444444444444J444#
     #444444444Q44444444444444444444Q444444444#
     #4444444444444444444;444444444444444444x4#
     #44x4444444444K44v44q444444K44444444444x4#
     #4444444444444444444444444444444444444444#
     ##################44:444##################
     #############4444444R44444444#############
       +4
       44                              ###
                                       #I#
                                     44#D#444
         4o                          4"44444"
         44                          444444t4
                                     4o444444
                                     44444o44
       4o
       44
                         c             H
    
     444444444444444444444444444444444444444444
     444e44444}44444444444u44444444y4p444444444
     44444E44444X44444444(444444444444444E44444
     444444444444444o444444444o44Y4444444444x44
     444444444444444444444444444444444444444444
     ####################g#####################
     #4444444444444444444444444444444444444444#
     #4Y444444E4444z44l44444444444E444444444Y4#
     #44444444444444444444444o4o4444444444xx44#
     #444444444444O444444444444444444444444444#
     #4bb4bb444444444444444444444444444a444444#
     #44444b444*4444444444444444444A4444444444#
     #444r44444n444444444F44444444444444444444#
     #44444b4444m444444E444E444444444z44h44444#
     #44444b4444444444444)44444444444444444444#
     ##################33333###################
     #############~~~~~~222~~~~~~##############
     #############~~~~~~111~~~~~~##############
     #############~~~~~~...~~~~~~##############
     #############~~~~~~.o.~~~~~~##############
     #############~~~~~~...~~~~~~##############
     #############~~~~~~.o.~~~~~~##############
     #############~~~~~~...~~~~~~##############
     #############~~~~~~.s.~~~~~~##############
     #############~~~~~~.f.~~~~~~##############
     #############~~~~~~...~~~~~~##############
     ###################xxx####################
     #.x......E..........$..........E......F.J#
     #.......o........d.....{..z......o.......#
     #~~~<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<....#
     #~~~<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<.i..#
     #~~~<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<....#
     #K.........o.V.z..../...h...Vo.........x.#
     ##################.....###################
     ##################     ###################
     ##################     ###################
     ###################%%%####################
     #...................!....................#
     #........&......^......]...........E.....#
     #......z.........[...........o.o.o.......#
     #...........=.......@....................#
     #..K......................&.....&....xx..#
     ##########################################
`,
  legend: {
    // The way through.
    L: { type: 'exit' },
    B: { type: 'door', id: 'office', open: { boss: true } },
    G: { type: 'door', id: 'arenagate', open: { clear: 'yard' } },
    g: { type: 'door', id: 'plategate', open: { flag: 'plate' } },
    W: { type: 'boss', boss: 'excavator', room: 'arena' },
    '{': { type: 'checkpoint', id: 'cp1' },
    A: { type: 'checkpoint', id: 'cp2' },
    '}': { type: 'checkpoint', id: 'cp3' },
    C: { type: 'checkpoint', id: 'cp4' },
    P: { type: 'vendor' },
    a: { type: 'holo', log: 'log', who: 'brennus' },
    '!': { type: 'marker', id: 'tunnel' },
    $: { type: 'marker', id: 'gallery' },
    '*': { type: 'marker', id: 'post1' },
    R: { type: 'marker', id: 'landing' },
    ';': { type: 'marker', id: 'post2' },
    '-': { type: 'marker', id: 'office' },
    '/': { type: 'trigger', id: 'inhall', event: 'flag:hall', w: 5, d: 2 },
    ')': { type: 'trigger', id: 'upper', event: 'flag:upper', w: 5, d: 2 },
    '(': { type: 'trigger', id: 'atpit', event: 'flag:pit', w: 9, d: 3, dialogue: 'pit' },
    ':': { type: 'trigger', id: 'inyard', event: 'flag:yard', w: 6, d: 2, dialogue: 'yard' },
    M: { type: 'trigger', id: 'mapstory', event: 'story:map', w: 5, d: 4, when: { boss: true } },
    N: { type: 'trigger', id: 'mapflag', event: 'flag:map', w: 5, d: 4, when: { boss: true } },
    // General Brennus's puzzles.
    '%': { type: 'cracked' },
    O: { type: 'plate', flag: 'plate' },
    r: { type: 'legionbot', flag: 'march' },
    n: { type: 'post', flag: 'march', order: 'plate' },
    p: { type: 'post', flag: 'haul', order: 'carry' },
    q: { type: 'post', flag: 'turn', order: 'fight', room: 'yard' },
    c: { type: 'platform', path: [[0, -10]], size: 2, speed: 3, wait: 1.6, look: 'cart' },
    H: { type: 'platform', path: [[0, -2]], size: 2, speed: 2.2, wait: 1.6, look: 'hauler', needs: { flag: 'haul' } },
    '<': { type: 'conveyor', dx: -1, dz: 0, speed: 3 },
    // The vault on the island: Brennus's old Legion wrist computer cracks the lock.
    t: { type: 'terminal', flag: 'vault', length: 5, puzzle: 'pattern' },
    D: { type: 'door', id: 'vaultdoor', open: { flag: 'vault' } },
    I: { type: 'prize', id: 'vault', reward: 'blaster' },
    '+': { type: 'canister', id: 'hc' },
    // Aeëtes's gold-painted robots (Brennus's old Legion) and his guard bots.
    E: { type: 'enemy', enemy: 'trooper', variant: 'gold' },
    z: { type: 'enemy', enemy: 'minebot', variant: 'gold' },
    F: { type: 'enemy', enemy: 'bulwark', variant: 'gold' },
    '"': { type: 'enemy', enemy: 'sentry' },
    T: { type: 'enemy', enemy: 'trooper', variant: 'gold', room: 'yard' },
    Q: { type: 'enemy', enemy: 'bulwark', variant: 'gold', room: 'yard' },
    Z: { type: 'enemy', enemy: 'mortar', variant: 'gold', room: 'yard' },
    S: { type: 'enemy', enemy: 'sentry', room: 'yard' },
    // Signs.
    '[': { type: 'sign', text: 'CANNON: tap for a heavy shell that splashes. HOLD it to charge a BIG BLAST. Too many shots in a row and it overheats: then let it cool down.' },
    ']': { type: 'sign', text: 'Cracked rock with gold in the cracks! Shells just bounce off. HOLD the CANNON for a BIG BLAST to smash it.' },
    '^': { type: 'sign', text: 'Too wide to jump? CHARGE (the DASH button), then JUMP while you charge: a CHARGE-LEAP carries you much farther!' },
    d: { type: 'sign', text: 'A crate barricade! CHARGE into it shoulder first and the crates go flying.' },
    i: { type: 'sign', text: 'Conveyor belts carry ore to the furnace. Don’t ride them into the molten gold! Walk straight across.' },
    f: { type: 'sign', text: 'Aeëtes’s guards shoot down this walkway. HOLD the SHIELD button: your shield blocks every shot from the front and bounces it back. Walk slowly behind it.' },
    l: { type: 'sign', text: 'The gate only stays open while something heavy stands on this plate.' },
    m: { type: 'sign', text: 'A Legion COMMAND POST! Walk up to it and press COMMAND. Your old robots still know your voice.' },
    u: { type: 'sign', text: 'Ore cart! Hop in and ride the rails across the pit.' },
    y: { type: 'sign', text: 'A Legion hauler, fast asleep. Give it an order at the command post and it will carry you over to the island.' },
    e: { type: 'sign', text: 'Stepping stones over the pit. Only a CHARGE-LEAP reaches from one to the next.' },
    v: { type: 'sign', text: 'Aeëtes’s depot: his guard bots, and a squad of your old robots painted gold. Use the COMMAND POST and see whose side they are on!' },
    w: { type: 'sign', text: 'The Excavator charges like a bull. Hold up your SHIELD when it hits, or make it crash into a rock pillar. Then BLAST the gold control box on its back!' },
    j: { type: 'sign', text: 'Aeëtes’s office. Everything is gold. Even the pencils.' },
    // Decor.
    '=': { type: 'decor', kind: 'wreck', scale: 1.3, rot: 0.4 },
    Y: { type: 'decor', kind: 'banner' },
    V: { type: 'decor', kind: 'lamp' },
    K: { type: 'decor', kind: 'barrel' },
    J: { type: 'decor', kind: 'generator' },
    U: { type: 'decor', kind: 'boulder', scale: 1.3 },
    '&': { type: 'decor', kind: 'rock' },
    k: { type: 'decor', kind: 'console' },
    '|': { type: 'decor', kind: 'pillar' },
    b: { type: 'decor', kind: 'barrier' },
    X: { type: 'crate', metal: true, loot: 'big' },
  },
  objectives: [
    { until: { flag: 'hall' }, text: 'Blast through the cracked rock and charge-leap into the mine', at: 'tunnel' },
    { until: { flag: 'upper' }, text: 'Charge through the barricade and march up the gallery behind your shield', at: 'gallery' },
    { until: { flag: 'pit' }, text: 'Order one of your old robots onto the heavy plate to open the gate', at: 'post1' },
    { until: { flag: 'yard' }, text: 'Ride the ore cart across the pit', at: 'landing' },
    { until: { clear: 'yard' }, text: 'Take back Aeëtes’s depot: command your old robots!', at: 'post2' },
    { until: { boss: true }, text: 'Stop the Gold Excavator', at: 'boss' },
    { until: { flag: 'map' }, text: 'Find Aeëtes’s map in his office', at: 'office' },
    { until: { flag: 'never' }, text: 'Call the lifeboat and send the map to the Argo', at: 'exit' },
  ],
  stories: {
    // Before the flyover: Brennus on his way, talking to Celestia's little sprout.
    opening: [
      {
        panel: 'ch3-brennus',
        caption: 'While the Argonauts flew to the Harpy Isles, an old lifeboat slipped away toward the ring of moons.',
        lines: [
          { who: 'brennus', text: 'Well, little sprout. Aeëtes’s mining moon. Smell that? Gold dust and greed.' },
          { who: 'celestia', text: '...brave... ...friend...' },
          { who: 'brennus', text: 'Friend. Hmph. Forty years ago I wanted to destroy your whole family. Now I water you every morning.' },
          { who: 'brennus', text: 'Captain Argus gave me a second chance. Brig or garden, an old soldier pays his debts. Aeëtes has something the Argonauts need, and I am going to take it.' },
        ],
      },
    ],
    // After the boss, in Aeëtes's office.
    map: [
      {
        panel: 'ch3-map',
        caption: 'On Aeëtes’s golden desk lay a golden map.',
        lines: [
          { who: 'brennus', text: 'Here it is. The way into the Fleece vault on Colchis... drawn in gold ink, of course.' },
          { who: 'aeetes', text: 'Put that DOWN, old man! That map cost me a fortune!' },
          { who: 'brennus', text: 'Then you should have kept it somewhere safer than your desk. Lifeboat! Come and get me.' },
          { who: 'brennus', text: 'And send a copy of this to the Argo. Top priority. From the General.' },
        ],
      },
    ],
  },
  dialogues: {
    intro: [
      { who: 'brennus', text: 'Gold scaffolds. Gold conveyor belts. Gold paint on EVERYTHING. That man has no taste.' },
      { who: 'aeetes', text: 'General Brennus! The famous old soldier, out of retirement. Did you come shopping? Everything here is for sale.' },
      { who: 'brennus', text: 'I came for your map to Colchis, Aeëtes. And for my robots.' },
      { who: 'aeetes', text: 'YOUR robots? I found them rusting in the snow and painted them gold. Finders keepers!' },
      { who: 'brennus', text: 'We shall see whose voice they remember.' },
    ],
    log: [
      { who: 'brennus', text: 'Legion log, day one. These robots will be the finest machines in the Fleet. Strong, loyal, and they will always know my voice.' },
      { who: 'brennus', text: '...I was so proud of them back then. Now Aeëtes uses them to tear a whole moon apart. That is my fault too.' },
      { who: 'brennus', text: 'Time to fix it. One robot at a time.' },
    ],
    pit: [
      { who: 'aeetes', text: 'Clever trick with the plate, General. But my pit is deep, and my carts don’t take passengers.' },
      { who: 'brennus', text: 'Watch me.' },
    ],
    yard: [
      { who: 'brennus', text: 'My old squad, in gold paint. They look ridiculous.' },
      { who: 'aeetes', text: 'They look EXPENSIVE. Guards! Throw the old man into the pit!' },
    ],
    boss: [
      { who: 'brennus', text: 'Rumble? Is that you? My old digging machine, from the Gorgon!' },
      { who: 'aeetes', text: 'It’s MY Gold Excavator now, with my gold control box on its back. Dig him up, Rumble!' },
      { who: 'brennus', text: 'Easy, old friend. I will get that box off you. Then we talk.' },
    ],
    // The excavator kneels with its control box smashed: Brennus gives it an order.
    command: [
      { who: 'brennus', text: 'Rumble. Legion digger number one. STAND DOWN.' },
      { who: 'brennus', text: '...Good machine. You were never meant to be a weapon. Neither was I.' },
    ],
    bossDown: [
      { who: 'aeetes', text: 'My excavator! Do you know what that paint COST?' },
      { who: 'brennus', text: 'Rumble is going home with me, Aeëtes. So are my robots. And so is your map.' },
      { who: 'brennus', text: 'Your office is right behind this gate. Let us see what you keep in your desk.' },
    ],
  },
};
