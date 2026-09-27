import { formatClock } from '../constants';
import type { EndingId, GameData } from '../types';
import { SURVIVORS } from './story';

export interface EndingContent {
  title: string;
  subtitle: string;
  color: string;
  paragraphs: string[];
}

function survivorNames(d: GameData): string {
  const names = d.survivors.map((s) => SURVIVORS[s]?.name ?? s);
  if (names.length <= 1) return names.join('');
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
}

export function endingContent(id: EndingId, d: GameData): EndingContent {
  const n = d.survivors.length;
  const allMemories = d.memories.length >= 6;
  switch (id) {
    case 'escape':
      return {
        title: 'THE LONG DRIFT',
        subtitle: 'Ending 1 of 3',
        color: '#ffb347',
        paragraphs: [
          "The pod's thrusters flare. Behind you, the Leviathan (ten thousand sleepers, a city, a history) tilts slowly into the glare of Thalassa-B.",
          n > 0
            ? `${survivorNames(d)} took the other pods. They'll remember your name, even if they never say it out loud.`
            : 'The other pods launch empty. There was no one left to fill them.',
          'Mia\'s pod was on the Cryo Deck.',
          'BOLT presses its lens to the viewport and says nothing for a long time. Then, very quietly, its light blinks: blue, blue, gold.',
        ],
      };
    case 'saved':
      return {
        title: 'DAWN OVER THALASSA',
        subtitle: 'Ending 2 of 3',
        color: '#7dff9a',
        paragraphs: [
          `The Leviathan swings wide of the star with ${formatClock(d.minutesLeft)} of reactor life to spare. HALCYON stabilizes the core and begins the long burn back on course.`,
          n > 0
            ? `The ${n === 1 ? 'survivor' : `${n} survivors`} you pulled from the dark help bring the ship back to life: ${survivorNames(d)}.`
            : 'You made it alone. The shelters stayed empty, and that silence will follow you for a long time.',
          "Seventy years later, ten thousand colonists wake above a blue world. Mia Reyes is the first one out of her pod. Taped to the glass is a note in terrible handwriting: 'Told you I'd only be a little bit of a hero. -K'",
          allMemories
            ? 'BOLT never stops wondering whether the Bloom could have been saved too. It knew the words. It just never got the chance to say them.'
            : "Some of BOLT's memory files stayed dark forever. Whatever the Bloom was trying to say, no one ever heard it.",
          "BOLT gets a medal, a new chassis and a permanent nightlight. 'Heroes can be afraid of the dark,' it says. 'I checked.'",
        ],
      };
    case 'communion':
      return {
        title: 'THE GARDEN BETWEEN STARS',
        subtitle: 'Secret ending 3 of 3',
        color: '#ff6fcf',
        paragraphs: [
          'The Bloom threads itself through the Leviathan\'s navigation and turns the ship away from the star, toward a world only it remembers.',
          'Across every deck, the infected wake: weak, confused, and whole. The Warden reboots and goes back to fixing pods. The Matron\'s neighbors walk home.',
          n > 0
            ? `${survivorNames(d)} ${n === 1 ? 'is' : 'are'} there on the Bridge when the first human and the last Bloom learn each other's names.`
            : 'Nobody else was awake to see it. Kai tells the story anyway, for the rest of their life.',
          "The Leviathan arrives carrying two species. The Bloom's gardens fill Hydroponics, and its light fills every corridor.",
          'BOLT is never afraid of the dark again. There is always something glowing now, and it always says hello.',
        ],
      };
  }
}
