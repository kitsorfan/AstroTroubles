import type { LevelDef } from '../world/levelTypes';
import { GUIDE, SIRENS_THINGS } from './sirensCourse';

/**
 * Chapter 3, level 4 — the Sirens' Sea, swum in the little sub Dolphin (Jason steers, LUX sings). Brennus's
 * map says the way to Colchis runs under the ocean of a water moon, through a sunken Gardener gate. The
 * sub swims forward on its own: steer, torpedo (BLAST), and PING the sonar to find open doorways, hidden
 * pearls, and to stun piranha drones. Aeëtes's siren buoys sing and pull the sub onto the rocks until
 * LUX sings back on the beat (or the buoy is torpedoed). At the bottom waits THE SIREN ORGAN. Four
 * checkpoint beacons; losing every hull heart restarts the stretch. The course is in sirensCourse.ts.
 */
export const sirens: LevelDef = {
  id: 'sirens',
  index: 16,
  name: 'Sirens’ Sea',
  subtitle: 'Dive to the sunken Gardener gate',
  music: 'sirens',
  intro: 'intro',
  shardIds: [],
  boss: 'organ',
  vehicle: 'sub',
  dive: { things: SIRENS_THINGS, guide: GUIDE },
  // The dive happens on the course; the map only holds the start.
  map: `
...
.@.
...
`,
  legend: { '@': { type: 'spawn', facing: Math.PI } },
  objectives: [
    { until: { flag: 'sub:cp1' }, text: 'Dive into the Sirens’ Sea' },
    { until: { flag: 'sub:cp2' }, text: 'Swim through the sunken ruins: PING to find the open doorways' },
    { until: { flag: 'sub:cp3' }, text: 'Get past the siren buoys: SING on the beat!' },
    { until: { flag: 'sub:cp4' }, text: 'Down the dark trench to the great Gardener gate' },
    { until: { flag: 'boss' }, text: 'Silence THE SIREN ORGAN' },
    { until: { flag: 'sub:surface' }, text: 'Swim up to the light' },
    { until: { flag: 'never' }, text: 'On to Scylla’s Reef' },
  ],
  dialogues: {
    intro: [
      { who: 'captain', text: 'Argo to Dolphin. You are under the waves of the water moon now. How does she handle, Jason?' },
      { who: 'jason', text: 'Like a dream! A bubbly, blue, wiggly dream.' },
      { who: 'bolt', text: 'I have never been underwater before. Is it supposed to look this... wet?' },
      { who: 'hypatia', text: 'Brennus’s map says the way to Colchis goes through a sunken Gardener gate, deep in this sea. Follow the old ruins down.' },
      { who: 'atalanta', text: 'And if you meet anything with teeth, swim faster. That is my advice for everything.' },
    ],
    steer: [
      { who: 'halcyon', text: 'Steer with the stick, Jason. The Dolphin swims forward all by herself.' },
      { who: 'bolt', text: 'And BLAST fires torpedoes! Tiny gold ones. With bubbles!' },
    ],
    rings: [{ who: 'halcyon', text: 'Gold rings! The Gardeners left them to mark the old sea road. Swim through them!' }],
    kelp: [{ who: 'bolt', text: 'A kelp forest! Like seaweed spaghetti. It slows us down, so swim around it if you can.' }],
    ping: [
      { who: 'bolt', text: 'Something is coming! Little gold fish... with TEETH!' },
      { who: 'halcyon', text: 'Piranha drones. Aeëtes’s, of course. Press PING: the sonar makes them dizzy for a moment. Then torpedo them!' },
    ],
    ruins: [
      { who: 'hypatia', text: 'Look at those columns! A whole Gardener city, sunk under the sea. These are the ruins on the map.' },
      { who: 'bolt', text: 'The light-words on them say... “mind the current”. Huh. Good advice.' },
    ],
    current: [{ who: 'halcyon', text: 'A strong current is pushing us sideways. Steer against it!' }],
    door: [
      { who: 'bolt', text: 'A Gardener gate! Lots of round doorways, but most of them are sealed with a skin of light.' },
      { who: 'jason', text: 'They all look the same! Which one is open?' },
      { who: 'bolt', text: 'PING! The sonar shows the open doorway in GREEN. Then swim through that one.' },
    ],
    dark: [
      { who: 'jason', text: 'It is getting so dark down here...' },
      { who: 'bolt', text: 'Headlight on! And I bet the Gardeners hid pearls in the dark. A PING lights them up!' },
    ],
    buoys: [
      { who: 'halcyon', text: 'Gold buoys ahead on the sonar. They are... humming?' },
      { who: 'captain', text: 'Aeëtes’s siren buoys. Sailors tell stories about them: their song pulls ships onto the rocks.' },
    ],
    sirens: [
      { who: 'bolt', text: 'That song! It is pulling us toward the rocks! And it makes my circuits feel all sleepy...' },
      { who: 'jason', text: 'LUX, in the old story Orpheus played a louder, happier song, so the sailors stopped listening to the sirens!' },
      { who: 'bolt', text: 'A counter-song! I can do that! Tap SING every time a note reaches the ring, and I will sing on the beat!' },
      { who: 'bolt', text: 'Four good notes and the buoy goes quiet. Or just torpedo it. Whatever works!' },
    ],
    aeetes: [
      { who: 'aeetes', text: 'Who is that, wiggling past my lovely buoys? Don’t you like my music, little fish?' },
      { who: 'jason', text: 'It is a very bad song, Aeëtes! LUX sings it better!' },
      { who: 'aeetes', text: 'Hmph. Wait until you hear my ORGAN. The biggest instrument ever built. I built it myself. Well... I PAID for it.' },
    ],
    rush: [
      { who: 'halcyon', text: 'A fast current, straight ahead! It will carry us along very quickly. Hold on!' },
      { who: 'bolt', text: 'Wheeeee! I mean... wheee, safely.' },
    ],
    trench: [
      { who: 'hypatia', text: 'This is the trench on the map. The great Gardener gate is at the very bottom.' },
      { who: 'bolt', text: 'Dark water, sealed doorways, sirens AND piranhas. All at once. My favourite. Not.' },
    ],
    organAhead: [
      { who: 'halcyon', text: 'A huge sound is coming from the gate. Something big is singing down there...' },
      { who: 'bolt', text: 'Is it a whale? Please be a whale.' },
    ],
    boss: [
      { who: 'aeetes', text: 'Welcome to my concert! THE SIREN ORGAN: a hundred speakers, six golden pipes, and one song nobody can swim away from.' },
      { who: 'bolt', text: 'It is not a whale.' },
      { who: 'jason', text: 'LUX, the glowing pipe is the one singing! I’ll torpedo it. You get ready to sing back!' },
      { who: 'bolt', text: 'And swim through the HOLES in the middle of those sound rings!' },
    ],
    bossDown: [
      { who: 'bolt', text: 'La-la-LAAAA! ...Did I win? I won! I out-sang a whole organ!' },
      { who: 'aeetes', text: 'My organ! Do you know how much that COST? ...Fine. Keep your silly song. The Fleece will still be mine!' },
      { who: 'jason', text: 'The gate is open, and I can see light up there. Let’s go up!' },
    ],
    finish: [
      { who: 'jason', text: 'We made it! Fresh air! ...Well, fresh-ish. It smells like seaweed.' },
      { who: 'captain', text: 'Well done, Dolphin! We can see you from the Argo. You came up right at the coral strait.' },
      { who: 'hypatia', text: 'Look: a tall rock on one side, and a giant whirlpool on the other. The way to Colchis goes right between them.' },
      { who: 'bolt', text: 'I am never singing again. ...Okay, maybe a little bit. In the bath.' },
    ],
  },
};
