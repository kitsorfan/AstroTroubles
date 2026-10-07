/**
 * The Colossus: Brennus's giant olive robot with heavy legs, a cannon arm and a claw arm, his red gear
 * emblem, a glass cage in its chest with GaScu glowing inside, and a cockpit dome on top. Feet at
 * (0, 0); about 820 units tall at scale 1. `pilot` is drawn inside the dome, under the glass, in
 * coordinates centred on the dome's floor.
 */
import { at, C, glow, glowDef, ink, lin } from './base';
import { gear } from './ships';

const OL = '#4e5a32';
const OL_DARK = '#2c3418';
const BRASS = '#b08a4a';

export function colossus(id: string, x: number, y: number, s: number, pilot = ''): string {
  const defs = `<defs>${lin(id + 'm', [[0, '#6e7a48'], [0.55, OL], [1, OL_DARK]], 1, 1)}${glowDef(id + 'p', C.pink)}${glowDef(id + 'r', '#ff3a4c')}</defs>`;
  const m = `url(#${id}m)`;
  const leg = (lx: number) => `<rect x="${lx - 60}" y="-300" width="120" height="170" rx="30" fill="${m}" ${ink(7)}/>
    <circle cx="${lx}" cy="-130" r="46" fill="${BRASS}" ${ink(6)}/>
    <path d="M${lx - 54} -120H${lx + 54}L${lx + 64} -40H${lx - 64}Z" fill="${m}" ${ink(7)}/>
    <path d="M${lx - 110} 0Q${lx - 110} -60 ${lx - 40} -60H${lx + 50}Q${lx + 120} -60 ${lx + 120} 0Z" fill="${OL_DARK}" ${ink(7)}/>`;
  const cannon = `<path d="M-250 -520L-330 -380" stroke="${C.ink}" stroke-width="84" stroke-linecap="round"/><path d="M-250 -520L-330 -380" stroke="${OL}" stroke-width="70" stroke-linecap="round"/>
    <g transform="translate(-340 -360) rotate(60)"><rect x="-40" y="-70" width="250" height="140" rx="40" fill="${m}" ${ink(7)}/>
    <rect x="200" y="-48" width="70" height="96" rx="16" fill="#3a3a30" ${ink(6)}/><circle cx="270" cy="0" r="30" fill="#14121c"/>
    <path d="M20 -40H160M20 0H160M20 40H160" stroke="${OL_DARK}" stroke-width="6"/></g>`;
  const claw = `<path d="M250 -520L330 -380L300 -260" fill="none" stroke="${C.ink}" stroke-width="84" stroke-linecap="round" stroke-linejoin="round"/><path d="M250 -520L330 -380L300 -260" fill="none" stroke="${OL}" stroke-width="70" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="330" cy="-380" r="34" fill="${BRASS}" ${ink(6)}/>
    <path d="M260 -250Q220 -170 260 -120L280 -150Q260 -190 290 -230ZM340 -250Q390 -170 350 -120L330 -150Q350 -190 320 -230ZM300 -240V-130" fill="#8a8a7a" ${ink(6)}/>`;
  const torso = `<path d="M-230 -560Q-260 -400 -170 -300H170Q260 -400 230 -560Q0 -620 -230 -560Z" fill="${m}" ${ink(8)}/>
    <path d="M-150 -310H150L120 -250H-120Z" fill="${OL_DARK}" ${ink(6)}/>
    <circle cx="-250" cy="-540" r="70" fill="${m}" ${ink(7)}/><circle cx="250" cy="-540" r="70" fill="${m}" ${ink(7)}/>
    ${gear(250, -540, 34, C.red, OL_DARK)}${gear(-250, -540, 34, C.red, OL_DARK)}
    <path d="M-200 -340H200" stroke="${BRASS}" stroke-width="8" stroke-dasharray="20 14"/>`;
  const cage = `${glow(id + 'p', 0, -440, 240)}<circle cx="0" cy="-440" r="104" fill="#2a0e26" ${ink(7)}/>
    <ellipse cx="0" cy="-424" rx="44" ry="50" fill="${C.pink}" ${ink(5)}/><ellipse cx="-12" cy="-440" rx="14" ry="18" fill="#ffd6f2"/>
    <path d="M-40 -390Q-80 -380 -86 -350M40 -390Q80 -380 86 -350M-20 -380Q-30 -350 -50 -340M20 -380Q30 -350 50 -340" fill="none" stroke="#3a1838" stroke-width="12" stroke-linecap="round"/>
    <circle cx="0" cy="-440" r="104" fill="${C.cyan}" opacity=".12"/>
    <path d="M-60 -524V-356M-20 -542V-338M20 -542V-338M60 -524V-356" stroke="${BRASS}" stroke-width="9"/>
    <circle cx="0" cy="-440" r="104" fill="none" stroke="${BRASS}" stroke-width="14"/><circle cx="0" cy="-440" r="111" fill="none" ${ink(4)}/>
    <path d="M-70 -500Q-40 -526 0 -528" fill="none" stroke="#fff" stroke-width="7" opacity=".6" stroke-linecap="round"/>`;
  const head = `${at(0, -650, 1, pilot)}<rect x="-120" y="-640" width="240" height="70" rx="24" fill="${m}" ${ink(7)}/>
    ${glow(id + 'r', -50, -604, 50)}${glow(id + 'r', 50, -604, 50)}
    <rect x="-80" y="-616" width="60" height="22" rx="10" fill="#ff3a4c" ${ink(4)}/><rect x="20" y="-616" width="60" height="22" rx="10" fill="#ff3a4c" ${ink(4)}/>
    <path d="M-100 -640H100" stroke="${BRASS}" stroke-width="10"/>
    <path d="M-96 -644Q-96 -770 0 -770Q96 -770 96 -644Z" fill="${C.cyan}" fill-opacity=".22" ${ink(6)}/>
    <path d="M-60 -700Q-50 -744 -10 -752" fill="none" stroke="#fff" stroke-width="8" opacity=".7" stroke-linecap="round"/>`;
  const body = leg(-150) + leg(150) + cannon + torso + cage + claw + head;
  return defs + at(x, y, s, body);
}
