import { CH1_ART } from './ch1';
import { CH2_ART } from './ch2';
import { PANEL_H, PANEL_W, type PanelId } from './ids';

export { PANEL_IDS, type PanelId } from './ids';

/** A simple stand-in while a panel's real illustration is being painted. */
function sketch(id: PanelId): string {
  const hue = [...id].reduce((a, c) => a + c.charCodeAt(0), 0) % 360;
  return `<svg viewBox="0 0 ${PANEL_W} ${PANEL_H}" xmlns="http://www.w3.org/2000/svg">
    <defs><linearGradient id="sk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="hsl(${hue},60%,30%)"/><stop offset="1" stop-color="hsl(${(hue + 40) % 360},60%,12%)"/></linearGradient></defs>
    <rect width="${PANEL_W}" height="${PANEL_H}" fill="url(#sk)"/>
    <circle cx="800" cy="430" r="190" fill="none" stroke="#fff" stroke-width="10" opacity=".35"/>
    <text x="800" y="450" font-size="64" font-family="sans-serif" fill="#fff" opacity=".6" text-anchor="middle">${id}</text>
  </svg>`;
}

/** The painted illustrations; any panel missing here falls back to `sketch`. */
const ART: Partial<Record<PanelId, () => string>> = { ...CH1_ART, ...CH2_ART };

/** The illustration for a panel, as an SVG string (16:9). */
export function panelSvg(id: PanelId): string {
  return (ART[id] ?? (() => sketch(id)))();
}
