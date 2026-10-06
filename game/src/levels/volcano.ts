import type { LevelDef } from '../world/levelTypes';

/**
 * Region 6 of Gaia Nova — Mount Atlantas, the grand finale of chapter 2. Dodge the lava bombs on the
 * volcano's flank, cross the lava river on floating rocks and grapple rings, climb both guard towers
 * (steam vent and grapple) and hack their terminals to open Brennus's fortress, run up the forge belt
 * past the blinking lasers, beat the guards, free Dr. Hypatia from the prison block, brave the ash
 * gusts and the lava-bomb lane on the crater rim, and face the Colossus with GaScu caged in its chest.
 * With all 18 journal pages, Jason can TALK General Brennus down instead.
 */
export const volcano: LevelDef = {
  id: 'volcano',
  index: 12,
  name: 'Mount Atlantas',
  subtitle: 'Brennus’s fortress',
  music: 'volcano',
  intro: 'intro',
  boss: 'colossus',
  shardIds: ['s1', 's2', 's3'],
  colonistIds: ['c1', 'c2'],
  map: `
          ###########################
          #~~~99y999999y999999y99~~~#
          #~~999999999999999999999~~#
          #~99999999999999999999999~#
          #g99999999999999999999999g#
          #9999999999999999999999999#
          #9999999999999999999999999#
          #9999999999999999999999999#
          #9999999999999999999999999#
          #9999999999999999999999999#
          #9999999999999999999999999#
          #999999999999W999999999999#
          #9999999999999999999999999#
          #9999999999999999999999999#
          #9999999999999999999999999#
          #9999999999999999999999999#
          #9999999999999999999999999#
          #9999999999999999999999999#
          #g99999999999999999999999g#
          #9999999999999999999999999#
          #~99999999999999999999999~#
          #~~999999999999999999999~~#
          #~~~9999999999999999999~~~#
          #~~~9999999999999999999~~~#
          ############999############
              #yo999999999999o9y#
              #oh9999999999999ho#
              #999&9999C9999V999#
              #99999999{99999999#
              #99999999t99999999#
    ##################999##################
    #~~~~~~~~~~~~~~9999999~~~~~y88888888y~#
    #~'777777~~~~~~9o999o9~~~~~88o8888888~#
    #~77)7777~~~~~~a999999A~~~~8888u88888~#
    #~777777a~~~~~~999999a~~~~~8888888888~#
    #~7777777~~~~~~9999k99~~~~~8888888o88~#
    #~~~~~~~~~~~~~~~~~~~~~~~~~~8888888888~#
    #~~~~~~~~~~~~~~~~~~~~~~~~~~~~##LK#~~~~#
    #~~~~~~~~~~~~~~~~~~~~~~~~~~~~##777#~~~#
    #~~~~~~~~~~~~~~666~~~~~~~~~~~##o7#~~~~#
    #~~~~~~~~~~~~~~6a6~~~~~~~~~~~##77#~~~~#
    #~~~~~~~~~~~~~~6?6~~~~~~~~~~~##777#~~~#
    #~~~~~~~~~~~~~~~~~~~~~~~~~~~~##7o#~~~~#
    #~~~~~~~~~~~~~~~~~~~~~~~~~~~~##77#~~~~#
    #g6666666~~~~~~~~~~~~~~~~~666666666666#
    #66666666~~~~~~~~~~~~~~~~~666666666^66#
    #6666r666~~~~~~~~~~~~~~~~~6666s6666666#
    #666666666666z666666666666666666666666#
    #66666666o666o666w666o666o666666666666#
    #666666666666666666666666z666666666666#
    #66/66666~~~~~~~~~~~~~~~~~666666666666#
    #66666666~~~~~~~~~~~~~~~~~6g666666666g#
    ###666#################################
    #445p5444#4yS444444R444444Sy4#4*44X4h4#
    #44444444#44f44J4444444444f44#44444444#
    #44444444N4444444444444444444#m4444444#
    #44444444#44o444o44444o44444444>444444#
    #4444b444#4444444444444444444#44444e44#
    #4o444o44#~~~~~~lccccc~~~~~~~#44X44444#
    #44444444#~~~~~~~ccccc~~~~~~~#4444o444#
    #44444444#~~}~~~~ccccc~~~~~~~#4444444X#
    #####4444#~~~~~~iccccc~~~~~~~##########
    #q44#4444#~~~~~~~ccccc~~~~~~~###33I3###
    #4p4D4444#~~~~~~~ccccc~~}~~~~###3333###
    #4(4#4]44#~~~~~~lccccc~~~~~~~#####O####
    #444#4444#~~~~~~~ccccc~~~~~~~#j333333j#
    #####4444#~~~~~~~ccccc~~~~~~~#33333333#
    #4b444444#y33333;33333333333y#33~~~~33#
    #44444:44#33s3333333333333s33#33~~~~33#
    #4E444444#3333333333333333X33#33~~~~33#
    #444444q4#33o3e33333333333o3333Z~~~~33#
    #4k444444#33X333333C333333X33#<3333333#
    #444444b4#3h33333333333333333#3333j333#
    ##################GGG##################
    #29u999222222222y22[22y222222222999u9'#
    #299T99222222222222222222222222299Y992#
    #29999922222-222222222222-222222999992#
    #2999992o2222222222222222222222299a992#
    #222v222222222222222222222222222222222#
    #22U2222222n222222222222222n2222222222#
    #22222222"2s222222222222222Z2o22222222#
    #'22222222222222222F222222222222222g22#
    #2x2222222222222222C2222222222222222X2#
    #~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~#
    #~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~#
    #~~~~~~~~~~}~~~~~~~~~~~~~~~~~~~~~~~~~~#
    #~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~#
    #~~~~~~~~~~~~~~~~11a11~~~~~~~~~4a~~~~~#
    #~~~~~~~~~~~~~~~~11111Q~~~~~~~~!4~~~~~#
    #~~~~~~~~~~~~~~~~11111~~~~~}~~~~~~~~~~#
    #~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~#
    #~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~#
    #~~~P~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~#
    #~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~#
    #11o1o111111111111111111111111111o1o11#
    #g111111111111M1111C11111111111111111g#
    #############1111111111111#############
    #############B111111111111#############
    #############1111111111111#############
    #$.....e.........d.............e....'.#
    ###....s...............H......n.......#
    #+|................@.................$#
    ###..o.....x.........o.......x.....o..#
    #".'....g.................g..........'#
    #######################################
`,
  legend: {
    /* The crater. */
    W: { type: 'boss', boss: 'colossus', room: 'arena' },
    V: { type: 'vendor' },
    C: { type: 'checkpoint', id: 'cp' },
    '{': { type: 'marker', id: 'crater' },
    t: { type: 'trigger', id: 'rim', w: 17, dialogue: 'crater', event: 'flag:crater' },
    '&': { type: 'sign', text: 'The crater is right ahead. Heal up, visit PANDORA’s shop, and get ready. You can do this, Jason!' },
    /* The crater rim: ash gusts, a lava-bomb lane and grapple rings over the lava lake. */
    a: { type: 'anchor' },
    A: { type: 'platform', path: [[4, 0]], speed: 2.4, wait: 1.2, h: 4, floor: 'hazard' },
    w: { type: 'wind', dx: 0, dz: -1, w: 17, d: 3, period: 5, strength: 3.5 },
    L: { type: 'boulder', axis: 'z', length: 6, period: 4, offset: 0, h: 3.5 },
    K: { type: 'boulder', axis: 'z', length: 6, period: 4, offset: 2, h: 3.5 },
    '/': { type: 'sign', text: 'Hot ash gusts blow across this bridge! When the ash starts to swirl, SPIN to dig in, or walk against the wind.' },
    '^': { type: 'sign', text: 'More lava bombs! Duck into the little nooks in the wall while they roll past.' },
    /* The fortress: guard hall, forge belt, prison block and the treasury. */
    G: { type: 'door', id: 'gate', open: { all: [{ flag: 't1' }, { flag: 't2' }] } },
    N: { type: 'door', id: 'halldoor', open: { clear: 'r1' } },
    R: { type: 'enemy', enemy: 'brute', variant: 'ash', room: 'r1' },
    S: { type: 'enemy', enemy: 'sentry', variant: 'legion', room: 'r1' },
    J: { type: 'enemy', enemy: 'sporeling', variant: 'legion', room: 'r1' },
    c: { type: 'conveyor', dx: 0, dz: 1, speed: 2.4, h: 1.5 },
    l: { type: 'laser', axis: 'x', length: 6, period: 3.2, offset: 0, h: 1.5, floor: 'hazard' },
    i: { type: 'laser', axis: 'x', length: 6, period: 3.2, offset: 1.6, h: 1.5, floor: 'hazard' },
    ';': { type: 'sign', text: 'The forge belt pushes you back! Keep running, and wait for each red laser to blink off.' },
    m: { type: 'laser', axis: 'x', length: 7, always: true },
    '>': { type: 'sign', text: 'These lasers never switch off. Press PULSE: LUX’s force pulse shorts them out for a few seconds!' },
    q: { type: 'switch', flag: 'cell', timed: 10 },
    D: { type: 'door', id: 'celldoor', open: { flag: 'cell' } },
    ':': { type: 'sign', text: 'PRISON BLOCK. GROUND POUND the red switch and the cell door opens for 10 seconds. Run!' },
    ']': { type: 'marker', id: 'hypatia' },
    p: { type: 'trigger', id: 'pastcell', event: 'flag:pastcell', w: 3 },
    j: { type: 'switch', flag: 'vault', timed: 14, together: true },
    O: { type: 'door', id: 'secretvault', open: { flag: 'vault' } },
    I: { type: 'prize', id: 'vault', reward: 'blaster' },
    '<': { type: 'sign', text: 'SECRET VAULT. GROUND POUND all THREE red switches within 14 seconds. The clock starts with the first one!' },
    /* The courtyard and its two guard towers. */
    T: { type: 'terminal', flag: 't1', length: 5, puzzle: 'grid' },
    Y: { type: 'terminal', flag: 't2', length: 5, puzzle: 'lights' },
    v: { type: 'vent', period: 3.2 },
    U: { type: 'sign', text: 'The guard towers are too tall to jump. Step on the steam vent when it puffs, or GRAPPLE up to the glowing ring!' },
    '[': { type: 'marker', id: 'gate' },
    F: { type: 'trigger', id: 'courtyard', w: 37, dialogue: 'gate', event: 'flag:courtyard' },
    /* The lava river and the foothills. */
    P: { type: 'platform', path: [[0, -8, 1]], size: 2, speed: 2.4, wait: 1.4, h: 0.5, floor: 'hazard' },
    Q: { type: 'platform', path: [[8, 0]], speed: 2.6, wait: 1.2, h: 0.5, floor: 'hazard' },
    M: { type: 'sign', text: 'Lava river ahead! Ride the floating rock, or aim at a glowing ring and press GRAPPLE to zip across.' },
    B: { type: 'boulder', axis: 'x', length: 12, period: 4.5 },
    d: { type: 'sign', text: 'Lava bombs roll down the mountain! Wait for one to roll past, then run across. Or JUMP right over it!' },
    H: { type: 'holo', log: 'log', who: 'brennus' },
    '|': { type: 'breakwall' },
    '+': { type: 'canister', id: 'hc' },
    /* Brennus's army. */
    e: { type: 'enemy', enemy: 'sporeling', variant: 'ash' },
    E: { type: 'enemy', enemy: 'sporeling', variant: 'legion' },
    z: { type: 'enemy', enemy: 'buzzer', variant: 'ash' },
    '}': { type: 'enemy', enemy: 'buzzer', variant: 'ash', h: 2, floor: 'hazard' },
    Z: { type: 'enemy', enemy: 'buzzer', variant: 'legion' },
    s: { type: 'enemy', enemy: 'sentry', variant: 'legion' },
    k: { type: 'enemy', enemy: 'sentry', variant: 'ash' },
    u: { type: 'enemy', enemy: 'turret', variant: 'ash' },
    n: { type: 'enemy', enemy: 'snapper', variant: 'ash' },
    r: { type: 'enemy', enemy: 'brute', variant: 'ash' },
    /* Collectibles and people. */
    '!': { type: 'shard', id: 's1' },
    '?': { type: 'shard', id: 's2' },
    '*': { type: 'shard', id: 's3' },
    '(': { type: 'cocoon', id: 'c1', name: 'Dr. Hypatia', line: 'Jason! LUX! I knew someone would come.' },
    ')': { type: 'cocoon', id: 'c2', name: 'Professor Euclid', line: 'I measured the Colossus. It is exactly 47 metres tall. That is VERY tall.' },
    /* Decor. */
    y: { type: 'decor', kind: 'banner' },
    g: { type: 'decor', kind: 'lavarock' },
    '-': { type: 'decor', kind: 'thorns' },
    '"': { type: 'decor', kind: 'wreck' },
    "'": { type: 'decor', kind: 'rock' },
    $: { type: 'decor', kind: 'boulder' },
    b: { type: 'decor', kind: 'bones' },
    f: { type: 'decor', kind: 'pillar' },
  },
  objectives: [
    { until: { flag: 'courtyard' }, text: 'Climb Mount Atlantas to Brennus’s fortress', at: 'gate' },
    { until: { all: [{ flag: 't1' }, { flag: 't2' }] }, text: 'Open the fortress gate: hack the terminals on both guard towers' },
    { until: { flag: 'pastcell' }, text: 'Cross the forge and free Dr. Hypatia from her cell', at: 'hypatia' },
    { until: { flag: 'crater' }, text: 'Climb out onto the crater rim and reach the crater', at: 'crater' },
    { until: { boss: true }, text: 'Stop the Colossus and free GaScu!', at: 'boss' },
    { until: { flag: 'never' }, text: 'Save Gaia Nova!' },
  ],
  dialogues: {
    intro: [
      { who: 'halcyon', text: 'Mount Atlantas. The fortress is built right into the crater wall.' },
      { who: 'bolt', text: 'It is SO hot. My paint is sweating.' },
      { who: 'jason', text: 'Dr. Hypatia and GaScu are up there somewhere. And so is Brennus.' },
      { who: 'brennus', text: 'You came all this way, boy. Very well. Come up and see what forty years of work looks like.' },
    ],
    log: [
      { who: 'brennus', text: 'To whoever is reading my journal, page by page, all over my planet: stop it.' },
      { who: 'brennus', text: 'You do not know me. Nobody knows me.' },
      { who: 'brennus', text: '...Nobody has asked in forty years.' },
    ],
    gate: [
      { who: 'bolt', text: 'Two guard towers, two terminals. If we hack them both, the gate will open!' },
      { who: 'halcyon', text: 'The towers are too tall to climb. Ride the steam vent on the left, and use your grapple on the right.' },
    ],
    crater: [
      { who: 'halcyon', text: 'Jason, I am picking up a HUGE machine in the crater. And GaScu’s signal, right inside it.' },
      { who: 'bolt', text: 'PANDORA’s shop is here too! Let’s get ready first. Very, very ready.' },
    ],
    'colonist:c1': [
      { who: 'hypatia', text: 'Jason! LUX! I knew the {ship} would send someone. I didn’t know it would be someone so SHORT.' },
      { who: 'jason', text: 'Dr. Hypatia! Are you okay? Where is GaScu?' },
      { who: 'hypatia', text: 'Inside the Colossus, right at the top. Brennus put it in the machine’s chest, like a battery.' },
      { who: 'hypatia', text: 'Listen. Brennus is not a monster. He is a lonely old man who forgot how to share. If you have read his journal... maybe you can remind him.' },
    ],
    boss: [
      { who: 'brennus', text: 'Behold, the COLOSSUS! With GaScu as its heart, nothing on this world will ever be taken from me again.' },
      { who: 'gascu', text: '...help...' },
      { who: 'jason', text: 'Let GaScu go, Brennus!' },
      { who: 'brennus', text: 'Come and make me, boy.' },
    ],
    bossDown: [
      { who: 'brennus', text: 'No... no! Forty years... my Colossus...' },
      { who: 'bolt', text: 'The cage is open! GaScu, you are free!' },
      { who: 'gascu', text: '...free... ...together...' },
      { who: 'jason', text: 'It’s over, Brennus. Come home with us. There’s room for everyone on Gaia Nova.' },
      { who: 'brennus', text: '...Everyone? Even me?' },
    ],
    talk: [
      { who: 'jason', text: 'Brennus, wait! Can we talk?' },
      { who: 'brennus', text: 'TALK? Nobody has talked to me in forty years. ...Fine. Help your little robot calm GaScu down, and I will listen.' },
    ],
    redeem: [
      { who: 'jason', text: 'Brennus! I read your journal. All of it.' },
      { who: 'brennus', text: 'Then you know what I am.' },
      { who: 'jason', text: 'I know you had 300 tomato plants, and you gave every single one a name.' },
      { who: 'jason', text: 'I know you still carry your grandma’s seeds. You never stopped loving growing things. You just got scared of losing them.' },
      { who: 'bolt', text: 'We can share, General! Sharing is the best. I share my battery with my flashlight every single day.' },
    ],
    redeemed: [
      { who: 'brennus', text: 'Forty years... and a boy and his little robot remind me what Grandma taught me.' },
      { who: 'brennus', text: 'Colossus, power down. Let GaScu go.' },
      { who: 'gascu', text: '...hello... ...safe... ...together...' },
      { who: 'brennus', text: 'Together. Yes. I think I would like that.' },
    ],
    'shard:s1': [
      { who: 'bolt', text: 'A journal page! “The Colossus is finished. With GaScu as its heart, no one will ever take anything from me again.”' },
      { who: 'jason', text: 'But GaScu was never his to take.' },
    ],
    'shard:s2': [
      { who: 'bolt', text: '“The boy with the robot keeps coming. He is not angry at me. He keeps saying he wants to HELP. Why?”' },
      { who: 'bolt', text: 'Because that is what friends do, General!' },
    ],
    'shard:s3': [
      { who: 'bolt', text: '“If anyone reads this: I was so afraid of losing things that I took everything. I am sorry, Grandma.”' },
      { who: 'jason', text: 'That’s the very last page, LUX. Now we know who he really is.' },
    ],
  },
};
