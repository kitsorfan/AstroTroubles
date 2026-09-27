import { parseDeck } from '../src/game/engine/mapParser';

const which = process.env.DECK ?? 'cryo';

test(`print ${which}`, () => {
  const mod = require(`../src/game/data/decks/${which}`);
  const def = mod[which];
  const lines = def.map.split('\n').filter((l: string, i: number, a: string[]) => !(l.trim() === '' && (i === 0 || i === a.length - 1)));
  const widths = new Set(lines.map((l: string) => l.length));
  const deck = parseDeck(def);
  let out = `${which}: ${deck.width}x${deck.height} row widths=${[...widths].join(',')}\n`;
  const ruler = (n: number) => Array.from({ length: n }, (_, i) => String(i % 10)).join('');
  out += '    ' + Array.from({ length: deck.width }, (_, i) => (i % 10 === 0 ? String(i / 10) : ' ')).join('') + '\n';
  out += '    ' + ruler(deck.width) + '\n';
  lines.forEach((l: string, y: number) => {
    out += `${String(y).padStart(3)} ${l}${l.length !== deck.width ? `   <-- width ${l.length}` : ''}\n`;
  });
  out += '\nDark tiles:\n';
  for (let y = 0; y < deck.height; y++) {
    let row = '';
    for (let x = 0; x < deck.width; x++) row += deck.dark[y * deck.width + x] ? 'x' : lines[y][x] === '#' ? '#' : ' ';
    out += `${String(y).padStart(3)} ${row}\n`;
  }
  out += '\nEntities:\n' + deck.entities.map((e) => `  ${e.id} (${e.x},${e.y}) ${e.def.kind}`).join('\n');
  console.log(out);
});
