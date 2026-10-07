import type { LevelDef } from '../world/levelTypes';

/**
 * Region 4 of Gaia Nova — the Titan Rockies, one long climb. Cross the plank bridge at the bottom of
 * the canyon, grapple from ring to ring up the cliffs, dodge the boulders rolling across the high
 * plateau and clear the Thorn Legion camp, zip over the rapids gorge, brave the windy ledges and the
 * cable car, and stop STHENO, the Gorgon's last gunship, on the pass beside the wreck.
 */
export const rockies: LevelDef = {
  id: 'rockies',
  index: 10,
  name: 'Titan Rockies',
  subtitle: 'The wreck of the Gorgon',
  music: 'rockies',
  intro: 'intro',
  boss: 'stheno',
  shardIds: ['s1', 's2', 's3'],
  colonistIds: ['c1', 'c2'],
  map: `
                  #############
                  #6H666L666H6#
                  #666o666o666#
            ############B#################
            66666o666666666666666Y666H66x#
            996666666666666666666666M6666#
            9A6666666666666666666H6666666#
            66666666&6666666666666666666M#
            6666666666666666666666;66:6Y6#
            666666666666666666666666:6666#
            9A666666666666W66666666:6:666#
            996666<66666666666666666:6:6Y#
            666666666666666666666;6666666#
            6666666666&666666666666666H66#
            9A666666666666666666666M66666#
            9966666666666666666666Y6666Y6#
            66666o666666666666666h666666x#
            ##################666#########
                         #Y66y666h66#6Y66#
                         #66V666666TD66I6#
                         #6666666]66#6666#
                         #666666(666######
                         #H6666C66v6666s6#
                         #6x6666;6666o66x#
                         ##########&999&9^#
                         ##########99s9999#
    ###############################9o9o9t9#
    #^99;999999    99n             9999999#
    #99999o9o9oFFFF9o9         99999999x99#
    #99t9999999FFFFu99P        99e99w999=9#
    #99999&9999    z99         9o9o;99;99^#
    #^99C9999q99~~~~~~~~~~~~~~~~~~~~~~~~~~~#
    #99999)999~~~~~~~~~~~~~~~~~~~~~~~~~~~~~#
    #9K99h999~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~#
    #99^999A~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~#
    #~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~#
    #~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~#
    #~~~~~~~~~~~~~o5o5~~~~~~~~~~~~~~~~~~5!5#
    #~~~~~~~~~~~~~555A~~~~~~~~~~~~~~~~~~A55#
    #~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~#
    #~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~#
    #~~~~~~~~~~~~~~~~~~~~~~~o11o11~~~~~~~~~#
    #~~~~~~~~~~~~~~~~~~~~~~~1111e1~~~~~~~~~#
    #~~~+111~~~~~~~~~~~~~~~~&11111~~~~~~~~~#
    #~~~11e1~~~~~~~~~~~~~~~~~~,,~~~~~~~~~~~#
    #~~~111x~~~~~~~~~~~~~~~~~~,,~~~~~~~~~~~#
    #~~~~,,~~~~~~~~~~~~~~~~~~~,m~~~~~~~~~~~#
    #~~~~,,~~~~~~~~~~~~~~~~~~~,,~~~~~~~~~~~#
    #111111111111;1111;1111111111>111111111#
    #1^111o1o1e11111z1111o1o1p111C1111z111^#
    #&111;11111111111111&11111111111o111&11#
    ############################33h33#######
    ############################55555#######
    ############################77777#######
            ######################G########
            #999o999o999^999H999-99999;99# #
            #9t999999999x9999999999o9999d# #
            #9999999999999&#99S999999E999# #
            #J99999o9999999#9999999i99999# #
            #999999999e9999#x999o9999999H# #
            #99999999999999#9c9999U9999X9# #
            #N99999o9999999#99999999c9999# #
            #99999e99999;99#999E999999S99# #
            #9;9999999999x9#9d;9999Z999Q9# #
            #O99999o9999999#9999d99999999# #
            #99999999999999############### #
            #999;99l9h99                   #
            #99>999999                     #
            #999C999                       #
            #99[9999                       #
            #^9999A                      9*#
    ########                             A9#
    ########                              ##
    ########             o6z6             ##
    ########             6o6A             ##
    ########                              ##
    ########                              ##
    ########                       o333   ##
    ########                       3Ao3   ##
    ########                              ##
    ########                              ##
    ########                              ##
    ########                              ##
    ########                              ##
    ########                              ##
    ########                              ##
    #.^......o...................o..a.....^#
    #^.....;........>.............k.o....x.#
    #...e..............o......s.....o......#
    #............z.....o....r..;...........#
    #^...;................................^#
    #                 ,,,                  #
    #                 ,,,                  #
    #                 ,,,                  #
    #......<....>...........&.....>...9?...#
    #<...............j.o..............A9...#
    #..........;...............&........h..#
    #..&....e..........o..................^#
    #.............;........................#
    #....^.................g.......e.......#
    #^.........oo.............oo...........#
    #..................@..........;......^.#
    #..xx....................;.............#
    #.........&....>......^..........^..<..#
    ########################################
`,
  legend: {
    // The way through.
    L: { type: 'exit' },
    B: { type: 'door', id: 'bossdoor', open: { boss: true } },
    W: { type: 'boss', boss: 'stheno', room: 'arena' },
    C: { type: 'checkpoint', id: 'cp' },
    V: { type: 'vendor' },
    g: { type: 'holo', log: 'log', who: 'hypatia' },
    G: { type: 'door', id: 'campgate', open: { clear: 'r1' } },
    a: { type: 'marker', id: 'climb' },
    i: { type: 'marker', id: 'camp' },
    m: { type: 'marker', id: 'gorge' },
    ']': { type: 'marker', id: 'pass' },
    '[': { type: 'trigger', id: 'onplateau', event: 'flag:plateau', w: 13, d: 5 },
    ')': { type: 'trigger', id: 'onrim', event: 'flag:rim', w: 9, d: 5 },
    '(': { type: 'trigger', id: 'onpass', event: 'flag:pass', w: 17, d: 6 },
    // Mountain gadgets.
    A: { type: 'anchor' },
    O: { type: 'boulder', axis: 'x', length: 13, period: 5, offset: 0 },
    N: { type: 'boulder', axis: 'x', length: 13, period: 5, offset: 1.7 },
    J: { type: 'boulder', axis: 'x', length: 13, period: 5, offset: 3.4 },
    u: { type: 'wind', dx: 0, dz: 1, w: 6, d: 4, period: 4.5, strength: 3 },
    w: { type: 'wind', dx: 0, dz: 1, w: 11, d: 3, period: 5, offset: 2.5, strength: 3 },
    F: { type: 'faller', h: 4.5 },
    P: { type: 'platform', path: [[7, 0]], size: 2, speed: 2.4, wait: 1.4, h: 4.5 },
    // The Gorgon's cargo hold (the vault).
    T: { type: 'terminal', flag: 'vault', length: 5, puzzle: 'grid' },
    D: { type: 'door', id: 'secretvault', open: { flag: 'vault' } },
    I: { type: 'prize', id: 'vault', reward: 'rapid' },
    // Brennus's army.
    e: { type: 'enemy', enemy: 'sporeling', variant: 'legion' },
    z: { type: 'enemy', enemy: 'buzzer', variant: 'legion' },
    s: { type: 'enemy', enemy: 'sentry', variant: 'legion' },
    r: { type: 'enemy', enemy: 'brute', variant: 'rock' },
    t: { type: 'enemy', enemy: 'turret', variant: 'sand' },
    E: { type: 'enemy', enemy: 'sporeling', variant: 'legion', room: 'r1' },
    S: { type: 'enemy', enemy: 'sentry', variant: 'legion', room: 'r1' },
    U: { type: 'enemy', enemy: 'brute', variant: 'rock', room: 'r1' },
    Z: { type: 'enemy', enemy: 'buzzer', variant: 'legion', room: 'r1' },
    // Collectibles.
    '?': { type: 'shard', id: 's1' },
    '!': { type: 'shard', id: 's2' },
    '*': { type: 'shard', id: 's3' },
    K: { type: 'cocoon', id: 'c1', name: 'Astronomer Hipparchus', line: 'From up here you can see all of Gaia Nova. It is too beautiful to be anyone’s prisoner.' },
    Q: { type: 'cocoon', id: 'c2', name: 'Medic Phoebe', line: 'Brennus has a bad cough. I tried to give him medicine. He pretended he didn’t need it.' },
    '+': { type: 'canister', id: 'hc' },
    // Signs.
    j: { type: 'sign', text: 'A rickety plank bridge! It creaks and wobbles, but it holds. Probably.' },
    k: { type: 'sign', text: 'GRAPPLE RINGS! Face a glowing ring and press GRAPPLE to zip right up to it. Ring to ring, all the way up the cliff!' },
    l: { type: 'sign', text: 'Rolling boulders! A rumble and a puff of dust mean one is coming. JUMP over it, or wait for it to roll past.' },
    '-': { type: 'sign', text: 'Thorn Legion camp. The gate down to the gorge stays shut until every guard is beaten.' },
    p: { type: 'sign', text: 'The rapids are fast and freezing! Cross the plank bridge to the big rock, then GRAPPLE from rock to rock.' },
    q: { type: 'sign', text: 'Windy ledge! When dust streaks blow past, a gust is coming: walk into the wind, or SPIN to dig in. The loose stones fall when you step on them, so keep moving!' },
    n: { type: 'sign', text: 'All aboard the cable car! Hop on and ride it across the gap.' },
    v: { type: 'sign', text: 'The Gorgon’s old cargo hold is still locked. HACK the terminal to open it!' },
    y: { type: 'sign', text: 'STHENO flies on three glowing ENGINES. Zip up to the rings at the edge of the pass, get close, and BLAST the engines!' },
    // Decor.
    M: { type: 'decor', kind: 'wreck', scale: 1.8, rot: 0.6 },
    Y: { type: 'decor', kind: 'wreck', rot: 2.2 },
    H: { type: 'decor', kind: 'banner' },
    ':': { type: 'decor', kind: 'flowers' },
    ';': { type: 'decor', kind: 'grass' },
    '&': { type: 'decor', kind: 'rock' },
    '^': { type: 'decor', kind: 'pine' },
    '<': { type: 'decor', kind: 'boulder' },
    '>': { type: 'decor', kind: 'bush' },
    d: { type: 'decor', kind: 'tent' },
    c: { type: 'decor', kind: 'thorns' },
  },
  objectives: [
    { until: { flag: 'plateau' }, text: 'Grapple from ring to ring up the canyon cliffs', at: 'climb' },
    { until: { clear: 'r1' }, text: 'Dodge the boulders and clear the Thorn Legion camp', at: 'camp' },
    { until: { flag: 'rim' }, text: 'Cross the rapids gorge', at: 'gorge' },
    { until: { flag: 'pass' }, text: 'Brave the windy ledges and ride the cable car up to the pass', at: 'pass' },
    { until: { boss: true }, text: 'Stop STHENO at the wreck of the Gorgon', at: 'boss' },
    { until: { flag: 'never' }, text: 'Fly the shuttle to the Thornwood Jungle', at: 'exit' },
  ],
  dialogues: {
    intro: [
      { who: 'halcyon', text: 'The Titan Rockies. The Gorgon’s wreck is at the very top of the pass.' },
      { who: 'bolt', text: 'Up? We have to go UP? Okay. Okay okay okay.' },
      { who: 'jason', text: 'We have the grapple. We can climb anything.' },
      { who: 'halcyon', text: 'Careful: Brennus’s last gunship, STHENO, guards the pass. And the rocks up here like to roll.' },
    ],
    log: [
      { who: 'hypatia', text: 'Field log, Dr. Hypatia, written in secret. Brennus is taking me to his fortress in the volcano.' },
      { who: 'hypatia', text: 'He asked me to help him put GaScu inside his machine. I said no. He did not shout. He just looked... tired.' },
      { who: 'hypatia', text: 'If anyone finds the Gorgon: his journal pages are scattered all over these mountains. Read them. There is a person in there.' },
    ],
    boss: [
      { who: 'brennus', text: 'STHENO, sister of the Gorgon! Blow them off my mountain!' },
      { who: 'bolt', text: 'A flying gunship! Jason, it is shooting MISSILES!' },
      { who: 'jason', text: 'Then we go up and meet it. Grapple, LUX!' },
    ],
    bossDown: [
      { who: 'bolt', text: 'Stheno is going down... into the clouds!' },
      { who: 'jason', text: 'Look, LUX. Brennus planted a little garden in the wreck.' },
      { who: 'bolt', text: 'Dead flowers. Forty years of dead flowers.' },
      { who: 'halcyon', text: 'GaScu’s signal is getting stronger. It is coming from the east: through the jungle, and on to the volcano.' },
    ],
    'shard:s1': [
      { who: 'bolt', text: 'A journal page! “The Gorgon fell on the mountains in the storm that night. I built a fortress inside the volcano. Warm. Safe. MINE.”' },
      { who: 'jason', text: 'He keeps saying MINE. Like a little kid with a toy.' },
    ],
    'shard:s2': [
      { who: 'bolt', text: '“The colony ship is coming at last. And GaScu is riding on it. After forty years, it came BACK.”' },
      { who: 'bolt', text: 'GaScu did not come back on purpose! It tried as hard as it could to steer us AWAY!' },
    ],
    'shard:s3': [
      { who: 'bolt', text: '“I will not destroy it this time. I will cage it, and its power will make my Legion unstoppable. ...So why do I feel worse?”' },
      { who: 'jason', text: 'Maybe because deep down, he knows it’s wrong.' },
    ],
  },
};
