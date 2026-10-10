import type { AtalantaUpgradeId } from '../core/save';
import type { Outfit } from '../entities/outfits';
import { ICON } from './icons';

/** Pictures for chapter 3's shop: Atalanta's upgrade icons, the Outfits tab, and each outfit worn. */

/** Each of Atalanta's upgrades' icons. */
export const ATA_ICON: Record<AtalantaUpgradeId, string> = {
  bow: ICON.bow,
  draw: `<svg viewBox="0 0 24 24"><circle cx="11" cy="13" r="7.5" fill="none" stroke="#fff" stroke-width="2.2"/><path d="M11 13V8.5M11 13l3 2" stroke="#fff" stroke-width="2.2" stroke-linecap="round"/><path d="M15 3h7M17 6.5h5" stroke="#8ff8e4" stroke-width="2" stroke-linecap="round"/></svg>`,
  sandals: `<svg viewBox="0 0 24 24"><path d="M4 17h11q4 0 5 3H4z" fill="#fff"/><path d="M6 17V9l4 2v6" fill="#cfe9ff" stroke="#fff" stroke-width="1.2" stroke-linejoin="round"/><path d="M11 12q5-6 11-7-3 3-4 5 2 0 4-1-3 4-8 5" fill="#ffd166" stroke="#fff" stroke-width="1.2" stroke-linejoin="round"/></svg>`,
  gloves: `<svg viewBox="0 0 24 24"><path d="M7 21v-8L5 9.5a1.4 1.4 0 0 1 2.4-1.4L9 10V4.5a1.5 1.5 0 0 1 3 0V9V3.5a1.5 1.5 0 0 1 3 0V9V5a1.5 1.5 0 0 1 3 0v10q0 6-6 6z" fill="#c08a4a" stroke="#fff" stroke-width="1.5" stroke-linejoin="round"/><path d="M7 18h11" stroke="#ffd166" stroke-width="2.4"/></svg>`,
  kick: ICON.kick,
  triple: `<svg viewBox="0 0 24 24"><g stroke="#fff" stroke-width="2" stroke-linecap="round"><path d="M3 12h16M4 18L18 7M4 6l14 11"/></g><g fill="#ffd166"><path d="M22 12l-4-2.6v5.2z"/><path d="M20.5 5.6l-4.6.4 2.8 3.9z"/><path d="M20.5 18.4l-1.8-4.3-2.8 3.9z"/></g></svg>`,
};

/** The Outfits tab: a tunic on a hanger. */
export const OUTFITS_ICON = `<svg viewBox="0 0 24 24"><path d="M12 5.5a2 2 0 1 1 2-2" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/><path d="M12 5.5L3 10h18z" fill="none" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/><path d="M8 10l-3 3 2 2 1.5-1.5V22h7v-8.5L17 15l2-2-3-3z" fill="#ff7ac8" stroke="#fff" stroke-width="1.3" stroke-linejoin="round"/><path d="M9 17h6" stroke="#ffd166" stroke-width="1.6"/></svg>`;

/**
 * A little full-length picture of the hero in an outfit (40 x 52): body, legs, boots and gloves in its
 * colours, Jason's helmet or Atalanta's braid, and the outfit's own extra (crest, cape, wreath...).
 */
export function outfitFigure(o: Outfit): string {
  const L = o.look;
  const jason = o.hero === 'jason';
  const skin = jason ? '#e8b48c' : '#c68a5e';
  const line = 'stroke="#10142a" stroke-width="1" stroke-linejoin="round"';
  const back: string[] = [];
  const front: string[] = [];
  if (L.cape) back.push(`<path d="M11 21h18l5 25H6z" fill="${L.cape}" ${line}/>`);
  if (!jason) back.push(`<path d="M24 12q6 5 4 17" fill="none" stroke="#6a2618" stroke-width="4" stroke-linecap="round"/>`);
  switch (o.icon) {
    case 'crest':
      front.push(`<path d="M11.5 7Q20-2 28.5 7" fill="none" stroke="${L.extra}" stroke-width="4.5" stroke-linecap="round"/>`, `<path d="M8 33h24l-1 4H9z" fill="#7a4a24"/>`);
      break;
    case 'fleece':
      front.push(`<path d="M12 21q8 4 16 0" fill="none" stroke="${L.extra}" stroke-width="4" stroke-linecap="round"/>`, `<circle cx="16" cy="23.5" r="1.4" fill="#ffcf5a"/><circle cx="24" cy="23.5" r="1.4" fill="#ffcf5a"/>`);
      break;
    case 'stars':
      front.push(
        `<circle cx="16" cy="25" r=".8" fill="#fff"/><circle cx="24" cy="29" r="1" fill="#ffe8a8"/><circle cx="19" cy="32" r=".7" fill="#bfe0ff"/><circle cx="15" cy="40" r=".7" fill="#fff"/><circle cx="25" cy="38" r=".8" fill="#fff"/>`,
        `<path d="M8 22.5h4M28 22.5h4" stroke="${L.accent}" stroke-width="1.6"/>`,
        `<ellipse cx="20" cy="13" rx="15" ry="4" fill="none" stroke="${L.extra}" stroke-width="1.4" transform="rotate(-12 20 13)"/>`,
      );
      break;
    case 'coat':
      back.push(`<path d="M13 33h6l-1 12h-6zM21 33h6l1 12h-6z" fill="${L.suit}" ${line}/>`);
      front.push(`<ellipse cx="10" cy="21.5" rx="4" ry="2" fill="${L.extra}"/><ellipse cx="30" cy="21.5" rx="4" ry="2" fill="${L.extra}"/>`, [24, 27.5, 31].map((y) => `<circle cx="18" cy="${y}" r=".9" fill="${L.extra}"/><circle cx="22" cy="${y}" r=".9" fill="${L.extra}"/>`).join(''));
      break;
    case 'moon':
      front.push(`<path d="M17.5 6.5a3 3 0 1 0 5 0a2.4 2.4 0 1 1-5 0z" fill="${L.extra}"/>`, `<circle cx="14" cy="38" r=".9" fill="#fff"/><circle cx="27" cy="42" r=".9" fill="#fff"/>`);
      break;
    case 'wreath':
      front.push(`<path d="M11 10q1-6 5-7M29 10q-1-6-5-7" fill="none" stroke="${L.extra}" stroke-width="2.6" stroke-linecap="round" stroke-dasharray="2.2 1.2"/>`, `<path d="M17 21l3 6 3-6" fill="none" stroke="#2a5aff" stroke-width="1.6"/><circle cx="20" cy="28" r="2.2" fill="${L.accent}" ${line}/>`);
      break;
    case 'hood':
      back.push(`<path d="M11 19q9-6 18 0l-2 4H13z" fill="${L.cape}" ${line}/>`);
      front.push(`<ellipse cx="23.5" cy="23" rx="2.2" ry="1.2" fill="${L.extra}" transform="rotate(-30 23.5 23)"/>`);
      break;
    case 'crystal':
      front.push(`<path d="M13 33h14l5 9H8z" fill="#d8fbff" fill-opacity=".7" stroke="${L.extra}" stroke-width="1"/>`, `<path d="M16.5 5.5l1 -2.6 1 2.6M19 4.8l1-3.2 1 3.2M21.5 5.5l1-2.6 1 2.6" fill="#ff9af0" stroke="#fff" stroke-width=".6"/>`);
      break;
  }
  const head = jason
    ? `<circle cx="20" cy="12" r="10" fill="${L.head ?? '#dfe6f0'}" ${line}/><circle cx="20" cy="13" r="6.6" fill="${skin}"/><path d="M14.5 10q5.5-4 11 0" fill="#4a2a18"/>`
    : `<circle cx="20" cy="12" r="8" fill="#6a2618" ${line}/><circle cx="20" cy="13.4" r="6.3" fill="${skin}"/><path d="M13.8 11q6-6 12.4-.5" fill="#6a2618"/><path d="M12.4 11h15.2" stroke="${L.trim}" stroke-width="1.6"/>`;
  return `<svg viewBox="0 0 40 52">
    ${back.join('')}
    <rect x="13" y="33" width="5.5" height="12" rx="2" fill="${L.legs}" ${line}/><rect x="21.5" y="33" width="5.5" height="12" rx="2" fill="${L.legs}" ${line}/>
    <rect x="11.5" y="44" width="7.5" height="4.5" rx="1.6" fill="${L.trim}" ${line}/><rect x="21" y="44" width="7.5" height="4.5" rx="1.6" fill="${L.trim}" ${line}/>
    <rect x="7.5" y="21" width="5" height="12" rx="2.5" fill="${L.suit}" ${line}/><rect x="27.5" y="21" width="5" height="12" rx="2.5" fill="${L.suit}" ${line}/>
    <circle cx="10" cy="34" r="2.6" fill="${L.trim}" ${line}/><circle cx="30" cy="34" r="2.6" fill="${L.trim}" ${line}/>
    <rect x="11.5" y="20" width="17" height="16" rx="6" fill="${L.suit}" ${line}/>
    <rect x="11.5" y="33" width="17" height="2.4" fill="${L.accent}"/>
    ${head}
    <circle cx="17.6" cy="13.4" r=".9" fill="#1a1020"/><circle cx="22.4" cy="13.4" r=".9" fill="#1a1020"/>
    ${front.join('')}
  </svg>`;
}
