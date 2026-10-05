/**
 * The game's emblem: LUX's eye inside a ring, wrapped in a glowing GaScu vine. Used on the boot
 * splash and rendered to the app's native splash image (scripts/gen-splash.mjs).
 */
export function emblemSvg(size = 220): string {
  const vine = Array.from({ length: 9 }, (_, i) => {
    const a = (i / 9) * Math.PI * 2 - Math.PI / 2;
    const r = 88;
    const x = 100 + Math.cos(a) * r;
    const y = 100 + Math.sin(a) * r;
    return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${i % 3 === 0 ? 7 : 4.5}" fill="#ff6fcf"/>`;
  }).join('');
  return `<svg class="emblem-svg" width="${size}" height="${size}" viewBox="0 0 200 200">
    <defs>
      <radialGradient id="emG" cx="50%" cy="50%" r="50%"><stop offset="0.55" stop-color="#5ee0ff" stop-opacity=".35"/><stop offset="1" stop-color="#5ee0ff" stop-opacity="0"/></radialGradient>
      <radialGradient id="emS" cx="38%" cy="32%" r="75%"><stop offset="0" stop-color="#ffffff"/><stop offset=".7" stop-color="#cfd8e6"/><stop offset="1" stop-color="#8894aa"/></radialGradient>
      <radialGradient id="emI" cx="40%" cy="38%" r="60%"><stop offset="0" stop-color="#e8fdff"/><stop offset=".45" stop-color="#5ee0ff"/><stop offset="1" stop-color="#1f7fd6"/></radialGradient>
    </defs>
    <circle cx="100" cy="100" r="98" fill="url(#emG)"/>
    <circle cx="100" cy="100" r="88" fill="none" stroke="#5ee0ff" stroke-width="3" opacity=".9"/>
    <path d="M100 12a88 88 0 0 1 76 44M180 118a88 88 0 0 1-60 64M52 176A88 88 0 0 1 14 92" fill="none" stroke="#ff6fcf" stroke-width="7" stroke-linecap="round"/>
    ${vine}
    <circle cx="100" cy="104" r="56" fill="url(#emS)"/>
    <rect x="44" y="110" width="112" height="9" fill="#8a96ac"/>
    <circle cx="100" cy="100" r="29" fill="#131b28"/>
    <circle cx="100" cy="100" r="19" fill="url(#emI)"/>
    <circle cx="93" cy="93" r="6" fill="#fff"/>
    <rect x="112" y="30" width="4" height="26" fill="#8a96ac"/><circle cx="114" cy="30" r="7" fill="#ff5e6a"/>
    <circle cx="40" cy="106" r="11" fill="#8a96ac"/><circle cx="160" cy="106" r="11" fill="#8a96ac"/>
  </svg>`;
}
