import type { LevelDef } from '../world/levelTypes';

/**
 * Chapter 3, level 2 — the Harpy Isles: grassy sky-islands floating in the windy upper air of the
 * first moon, high above a sea of clouds. The Argo can't land near the beacon, so Jason (with LUX, and
 * IRIS tagging along) crosses a gusty rope bridge, the Gust Garden (updrafts, harpy drones that snatch
 * bolts, Aeëtes's scrap robots) and a grapple pillar to a stripped scout skiff, where he meets
 * ATALANTA (cutscene + storybook panel); from then on the player can switch between them, and IRIS
 * becomes Atalanta's droid. Together they open the ruins gate with a power-arrow bullseye, climb the
 * ruined tower (Atalanta wall-jumps up, Jason ground-pounds the red switch on top), wall-run and slide to
 * hidden corners, cross to blind old PHINEUS's star garden (rune pads for the vault, PANDORA's shop),
 * and climb the windy storm steps to the nest gate (a red switch for Jason, a bullseye for Atalanta).
 * In the nest waits AELLO, the Harpy Queen: Atalanta's power arrows knock her out of the sky, and
 * Jason cracks her core while she's down. Side quests: three gold harpy nets full of Phineus's
 * stolen things, three Gardener light-stones, a heart canister on the tower and the star-garden vault.
 */
export const harpies: LevelDef = {
  id: 'harpies',
  index: 14,
  name: 'Harpy Isles',
  subtitle: 'Atalanta joins the Argonauts',
  music: 'isles',
  intro: 'intro',
  boss: 'aello',
  shardIds: ['s1', 's2', 's3'],
  colonistIds: ['c1', 'c2', 'c3'],
  heroes: ['jason', 'atalanta'],
  // Atalanta joins when Jason reaches her skiff (the `join:atalanta` trigger sets the flag).
  joins: { atalanta: 'atalanta' },
  map: `

   ###########################       9"
   #6666666666666666666666666#       99
   #6/6666666666E6666666666/6#              999
   #666666-66666666666-666666#              9<9
   #6666666666666666666666666#999999        9A9
   #6666666666666666666666666#9999y9        999
   #6666666666666666666666666#99z999
   #6666666666666666666666666G9999oq
   #666666666666$6666666666h6#9o9A99
   #6666666666666666666666666#999999
   #6666666666666666666666666#        55555
   #6666-66666666666666666666#       55r%5X5
   #66666666666666666666-6666#       555N555
   #6666666666666666666666666#       5C55m55
   #6/666666666666666666666/6#        55=55
   #6666666666666666666666666#
   ###########################         33

                                      11111111
                             999     111o1Q1111
                             9*9     1:11111e11
              ###############999##   1111111111
              1111111111111111v11#   11{11111q1
              1+9&11#11111o111Q11#   111111]111
  #####RRRRRRR19P&11#1o1111111111#   1S11}11111
  11111       199&11#11111111r1m1#   111|1111:1
  1o1o1       1###11#11Q111111111#   111b1o1111
  11111       s11111H111111Q11111#,,,1q11111111
  1)111       11111a11111u1111111d,,,111Ff1####
  11111       11111111q1111111o11#,,,11o111#1o#
  111o1       11111111111111;1111#   1M1111OI1#
  >1111       111;111r11111q11111#   111[:1#1o#
              11111o1111c111111Z1#   11V11z#11#
              1111111111111111111#    11111####
             ###########D#########
              4444444444444444444
            #4444r44444444444444>4
       ######44q444o4444444444Y444    444
       #44o4#444:444444444j444444t    4T4
       #4444#44444444U4444444444k4    444
       #4?44l4444o4444444444444444
       #o444#4444444444:444444o444
       #44o4#444444444444444444444
       ######4>444L44444J444o44q44
            #44444444444444:444444
              4444444444A44444444



                       444
                       4A4
                       444



             111111111111111111111
            1(11111111>1B1>11111111
            11111111111111111z11m11
            111x1111r1111;111111111 9999
    o6o     1111111111111111r111111 9o99
    6A6     11111:1111111111111111v 99!9
    h66     >11111111111111:111p111 9o99
            1111q1111111111111111;1 9999
            111111o1o1o1o1o1o1o1111
            111:11111111111111q1111
            111111z111111111111111>
            11m111111:1111111111111
            111111111111K1111111x11
            1h11111;111111111:11111
             111111111111111111111
                       ,,,
                       ,,,
                       ,W,
                       ,,,
                       ,,,
                       ,,,
                       ,w,
                       ,,,
                       ,,,
                ................
               .^.....n..o.....^.
               ...q......o....q..
               ..:...............
               .......:...oo.;...
               ...g..............
               .....oo.;....i....
               .^................
               .....;...@..:...x.
               .x..:.........:.x.
                ................
`,
  legend: {
    // The way through.
    E: { type: 'exit' },
    $: { type: 'boss', boss: 'aello', room: 'arena' },
    D: { type: 'door', id: 'ruinsgate', open: { flag: 'tA' }, h: 2 },
    d: { type: 'door', id: 'eastgate', open: { flag: 'sw1' }, h: 0.5 },
    G: { type: 'door', id: 'nestgate', open: { all: [{ flag: 'tB' }, { flag: 'sw2' }] }, h: 4.5 },
    K: { type: 'checkpoint', id: 'cp1' },
    L: { type: 'checkpoint', id: 'cp2' },
    M: { type: 'checkpoint', id: 'cp3' },
    N: { type: 'checkpoint', id: 'cp4' },
    V: { type: 'vendor' },
    g: { type: 'holo', log: 'log', who: 'atalanta' },
    j: { type: 'marker', id: 'atalanta' },
    t: { type: 'marker', id: 'bull' },
    a: { type: 'marker', id: 'tower' },
    b: { type: 'marker', id: 'phineus' },
    '%': { type: 'marker', id: 'storm' },
    J: { type: 'trigger', id: 'meet', event: 'join:atalanta', w: 19, d: 3 },
    c: { type: 'trigger', id: 'ruins', dialogue: 'teamwork', w: 19, d: 3, when: { flag: 'atalanta' } },
    F: { type: 'trigger', id: 'stargazer', event: 'story:phineus', w: 9, d: 5 },
    f: { type: 'trigger', id: 'stargazerFlag', event: 'flag:phineus', w: 9, d: 5 },
    // Sky gadgets.
    A: { type: 'anchor' },
    v: { type: 'vent', period: 2.8 },
    w: { type: 'wind', dx: 1, dz: 0, w: 5, d: 3, period: 4.5, strength: 2.5 },
    W: { type: 'wind', dx: -1, dz: 0, w: 5, d: 3, period: 4.5, offset: 2.25, strength: 2.5 },
    X: { type: 'wind', dx: -1, dz: 0, w: 7, d: 5, period: 5, offset: 1, strength: 2 },
    // Hero puzzles: bullseyes, low gaps, a wall-run and a cliff to climb for Atalanta, red switches for Jason.
    T: { type: 'target', flag: 'tA' },
    '"': { type: 'target', flag: 'tB' },
    P: { type: 'switch', flag: 'sw1' },
    '<': { type: 'switch', flag: 'sw2' },
    R: { type: 'wallrun' },
    '&': { type: 'climb', h: 4.5 },
    l: { type: 'lowgap', axis: 'x' },
    // Phineus's star garden (the vault): hottest star to coolest.
    '{': { type: 'rune', group: 'vault', order: 1, color: '#5ec8ff' },
    '}': { type: 'rune', group: 'vault', order: 2, color: '#ffffff' },
    ']': { type: 'rune', group: 'vault', order: 3, color: '#ffd166' },
    '|': { type: 'rune', group: 'vault', order: 4, color: '#ff5e6a' },
    O: { type: 'door', id: 'vaultdoor', open: { flag: 'vault' } },
    I: { type: 'prize', id: 'vault', reward: 'magnet' },
    // Aeëtes's thieves, and the old Legion robots he bought for scrap.
    q: { type: 'enemy', enemy: 'harpy' },
    z: { type: 'enemy', enemy: 'buzzer', variant: 'sand' },
    r: { type: 'enemy', enemy: 'trooper' },
    m: { type: 'enemy', enemy: 'minebot' },
    u: { type: 'enemy', enemy: 'bulwark' },
    Z: { type: 'enemy', enemy: 'mortar' },
    // Collectibles: Gardener light-stones, harpy nets full of Phineus's things, a heart canister.
    '!': { type: 'shard', id: 's1' },
    '?': { type: 'shard', id: 's2' },
    '*': { type: 'shard', id: 's3' },
    '(': { type: 'cocoon', id: 'c1', name: 'Phineus’s honey cakes', line: 'My honey cakes! Still warm, too. Well, warm-ish.' },
    ')': { type: 'cocoon', id: 'c2', name: 'Phineus’s teapot', line: 'My teapot! Fifty years old and not a single chip. Unlike me.' },
    '[': { type: 'cocoon', id: 'c3', name: 'Phineus’s star charts', line: 'My star charts! I can’t read them, but I do love the crinkly sound.' },
    '+': { type: 'canister', id: 'hc' },
    // Signs.
    i: { type: 'sign', text: 'HARPY DRONES! These gold thieves swoop down and snatch your bolts. When an eye flashes red, dodge, or SPIN to bat it away. Blast one and it drops everything it stole!' },
    n: { type: 'sign', text: 'Windy bridge! When white streaks blow past, a gust is coming. Walk into the wind, or SPIN to dig in.' },
    p: { type: 'sign', text: 'An UPDRAFT! When the warm air puffs up, step in and it carries you sky-high.' },
    B: { type: 'sign', text: 'Too far to jump? Face the glowing ring and GRAPPLE across!' },
    U: {
      type: 'sign',
      text: 'TWO HEROES! Tap the switch button above your buttons to play as Jason or Atalanta, wherever they are. You travel together: if one of you can’t get past something, open a way for them, or help them up from above. Atalanta CLIMBS, wall-jumps, wall-runs, SLIDES under low gaps and shoots a bow. Jason grapples, ground-pounds, dashes and blasts.',
    },
    k: { type: 'sign', text: 'Bullseye targets only take Atalanta’s POWER ARROW. Hold BOW to charge it, then let go!' },
    H: { type: 'sign', text: 'This tower is too high to jump. As Atalanta, CLIMB the handholds: keep pushing into the wall. Up top, stand by the edge above Jason and she pulls him up. The red switch up there needs his GROUND POUND!' },
    s: { type: 'sign', text: 'Teal stripes mean WALL-RUN! As Atalanta, jump at the striped wall and keep running along it. Her SLIDE also fits under walls with yellow-and-black stripes.' },
    S: { type: 'sign', text: 'Phineus’s star garden: “The hottest stars shine blue, then white, then gold, and the coolest glow red. Step on my stars from hottest to coolest, and my old treasure box will open.”' },
    C: { type: 'sign', text: 'The nest gate needs BOTH of you: a red switch out on that rock for Jason, and a bullseye beyond the high step for Atalanta.' },
    y: { type: 'sign', text: 'AELLO’S NEST. Her gold armour stops blasts while she flies. Knock her down with a POWER ARROW, then switch to Jason and hit her glowing core!' },
    // Decor.
    Y: { type: 'decor', kind: 'wreck', scale: 1.3, rot: 0.5 },
    '-': { type: 'decor', kind: 'wreck', scale: 0.7, rot: 1.2, solid: false },
    '/': { type: 'decor', kind: 'pillar', scale: 1.2 },
    Q: { type: 'decor', kind: 'pillar' },
    e: { type: 'decor', kind: 'tent', rot: 3.6 },
    '^': { type: 'decor', kind: 'tree' },
    '>': { type: 'decor', kind: 'bush' },
    ':': { type: 'decor', kind: 'flowers' },
    ';': { type: 'decor', kind: 'grass' },
  },
  objectives: [
    { until: { flag: 'atalanta' }, text: 'Follow the distress beacon across the windy isles', at: 'atalanta' },
    { until: { flag: 'tA' }, text: 'Open the ruins gate: hit the bullseye with Atalanta’s POWER ARROW', at: 'bull' },
    { until: { flag: 'sw1' }, text: 'Wall-jump up the ruined tower as Atalanta, then GROUND-POUND the red switch as Jason', at: 'tower' },
    { until: { flag: 'phineus' }, text: 'Cross the bridge to the stargazer’s island', at: 'phineus' },
    { until: { all: [{ flag: 'tB' }, { flag: 'sw2' }] }, text: 'Open the nest gate: a bullseye for Atalanta, a red switch for Jason', at: 'storm' },
    { until: { boss: true }, text: 'Bring AELLO, the Harpy Queen, down to earth', at: 'boss' },
    { until: { flag: 'never' }, text: 'Sail the Argo on to Aeëtes’s Mine', at: 'exit' },
  ],
  dialogues: {
    intro: [
      { who: 'captain', text: 'This is as close as the Argo can land: the wind up here is wild. We will wait for you on this island.' },
      { who: 'halcyon', text: 'The distress beacon is coming from the far side of the isles. Somebody’s skiff is stranded up there.' },
      { who: 'iris', text: 'I know that blinking. Fast, then faster, then very impatient. It is my friend Atalanta’s skiff!' },
      { who: 'captain', text: 'Atalanta, our youngest scout? She left a note saying she was going “to look at a few moons”. That girl!' },
      { who: 'bolt', text: 'Also, something gold just flew past the window. Twice. It had CLAWS.' },
      { who: 'jason', text: 'Then we’d better hurry. Come on, LUX! IRIS, you show us the way.' },
    ],
    log: [
      { who: 'atalanta', text: 'Scout log, Atalanta here. Day three. I flew ahead to find Colchis first. It was going GREAT.' },
      { who: 'atalanta', text: 'Then a flock of gold bird-drones landed on my skiff and took it apart. The wings. The engine. My SANDWICH.' },
      { who: 'atalanta', text: 'I’m fine! Totally fine. If anyone hears this: I’m on the big island past the windy bridges. Bring a spanner. And a sandwich.' },
    ],
    'meet:atalanta': [
      { who: 'atalanta', text: 'Stop right there! One more step and... oh. You’re not a harpy.' },
      { who: 'jason', text: 'I’m Jason, from the Argo. We got your distress beacon!' },
      { who: 'atalanta', text: 'Distress? I wasn’t in distress. I was... resting. Next to my broken skiff. For three days.' },
    ],
    'joined:atalanta': [
      { who: 'iris', text: 'Atalanta, may I fly with you? Your arrows and my rainbows would make a fine team.' },
      { who: 'atalanta', text: 'Deal! Jason, LUX: try to keep up.' },
      { who: 'halcyon', text: 'Atalanta has joined the Argonauts! Tap the switch button to play as her. IRIS goes with Atalanta, and LUX stays with Jason.' },
    ],
    teamwork: [
      { who: 'atalanta', text: 'Old ruins! Look at the gate on the far side: it only opens with that red switch up on the tower.' },
      { who: 'jason', text: 'That’s too high for my jet boots... and there’s no grapple ring anywhere near it.' },
      { who: 'atalanta', text: 'Not too high for me! I’ll wall-jump up there. Then you take over and stomp on it.' },
      { who: 'bolt', text: 'Teamwork! I love teamwork. It means I don’t have to do anything.' },
    ],
    boss: [
      { who: 'aeetes', text: 'Ah, my little explorers. Meet my very best thief: AELLO! She has stolen eleven ships, nine satellites and one very nice hat.' },
      { who: 'atalanta', text: 'And my skiff!' },
      { who: 'aeetes', text: 'And your skiff. Aello, darling: grab their bolts, their ship, and anything else that shines!' },
      { who: 'jason', text: 'Atalanta, you knock her out of the sky. I’ll do the rest!' },
    ],
    bossDown: [
      { who: 'bolt', text: 'She’s down for good! And look: everything she stole is spilling out of her nest!' },
      { who: 'atalanta', text: 'My wing! My engine! ...My sandwich. Ew. Never mind the sandwich.' },
      { who: 'halcyon', text: 'Phineus is on the radio. He says: “Thank you, young heroes. Sail past the third moon, then follow the brightest gold star. Colchis is waiting.”' },
      { who: 'captain', text: 'Well done, Argonauts! Back to the Argo, all of you. Atalanta too: your skiff can ride in the cargo hold.' },
    ],
    'shard:s1': [
      { who: 'bolt', text: 'A Gardener light-stone! It glows in Celestia’s colours: blue, then gold, then blue again. It’s a WORD!' },
      { who: 'iris', text: 'The Gardeners wrote with light. This one means “sky”. We will teach it to Celestia when we bring her the Fleece.' },
    ],
    'shard:s2': [
      { who: 'iris', text: 'Another light-stone, hidden where only a slider could go. This word glows pink and green: “grow”.' },
      { who: 'bolt', text: 'Sky... grow... Celestia’s people must have planted gardens in the sky!' },
    ],
    'shard:s3': [
      { who: 'bolt', text: 'This one flickers through the whole rainbow! It means... “friend who flies beside you”.' },
      { who: 'iris', text: 'One word for all of that. I like Gardener words.' },
    ],
  },
  stories: {
    'meet:atalanta': [
      {
        panel: 'ch3-atalanta',
        lines: [
          { who: 'iris', text: 'Atalanta! It IS you! I knew that beacon blinked just like you: fast and impatient.' },
          { who: 'atalanta', text: 'IRIS! My rainbow racing buddy! Did you come all this way to rescue me?' },
          { who: 'iris', text: 'We came for the Golden Fleece. Rescuing you is a bonus.' },
          { who: 'bolt', text: 'Hello! I am LUX. The harpies are still up there. They have your wing. And your engine. And possibly your sandwich.' },
          { who: 'atalanta', text: 'Then let’s get it all back. I’m the fastest runner in the colony, and the best shot. What can you do?' },
          { who: 'jason', text: 'Jet boots, a grapple, a blaster and a very good ground pound. And LUX is very brave.' },
          { who: 'bolt', text: '...Mostly brave.' },
        ],
      },
    ],
    phineus: [
      {
        panel: 'ch3-phineus',
        lines: [
          { who: 'phineus', text: 'Shoo! Shoo, you greedy tin chickens! That was my DINNER!' },
          { who: 'phineus', text: 'Ah, visitors! I can’t see you, but I can hear you: one boy, one girl and two humming droids. I am Phineus, the stargazer of the Harpy Isles.' },
          { who: 'jason', text: 'You watch the stars? But... how, if you can’t see them?' },
          { who: 'phineus', text: 'I listen to them, my boy. And I remember every single one. I have lived under this sky for fifty years.' },
          { who: 'phineus', text: 'Every evening those harpies steal my food and fly it to their queen, AELLO. She keeps everything she grabs.' },
          { who: 'atalanta', text: 'She’s got my skiff’s wing and engine too. We’ll get it all back, Phineus!' },
          { who: 'phineus', text: 'You are sailing to Colchis, aren’t you? Then you passed the Clashing Rocks already! Ha! It took me three tries, back in my day.' },
          { who: 'phineus', text: 'Win back my things from the harpy nets, beat that greedy queen, and I will tell you the way to Colchis.' },
        ],
      },
    ],
  },
};
