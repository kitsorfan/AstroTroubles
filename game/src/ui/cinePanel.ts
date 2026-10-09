/**
 * Full-screen storybook panels: the picture fills the screen edge to edge (cropped like `cover`, so a
 * 16:9 panel works on any phone), with a slow Ken Burns camera move (a pan and a gentle zoom that
 * alternate from panel to panel) and, when the panel marks parallax layers, a little depth: each
 * top-level `<g data-depth="...">` group drifts at its own speed.
 *
 * Every layer is its own `<svg>` (each with a copy of the panel's defs, its ids renamed so they stay
 * unique), so the browser rasterises each once and the compositor moves them: nothing is repainted
 * while the camera drifts. Old panels without layers are one layer.
 */

/** How long one camera move takes (ms); a panel is usually read well within it. */
const MOVE_MS = 24000;
/** The camera's pan across the move, in % of the picture's width. */
const PAN = 1.8;

/** One parallax layer: an `<svg>` string and how fast it drifts (1 = with the camera). */
interface Layer {
  svg: string;
  depth: number;
}

/**
 * Splits a panel's SVG into parallax layers at its top-level `data-depth` groups, keeping their order.
 * Unmarked top-level content (a vignette, the grain) rides with the layer before it; `<defs>` and
 * `<style>` go into every layer, with the ids in all but the first renamed.
 */
export function splitLayers(svgText: string): Layer[] {
  const tpl = document.createElement('template');
  tpl.innerHTML = svgText.trim();
  const svg = tpl.content.firstElementChild;
  if (!svg || svg.tagName.toLowerCase() !== 'svg') return [{ svg: svgText, depth: 1 }];
  const kids = [...svg.children];
  if (!kids.some((k) => k.hasAttribute('data-depth'))) return [{ svg: svgText, depth: 1 }];
  const isDef = (k: Element) => k.tagName === 'defs' || k.tagName === 'style';
  const shared = kids
    .filter(isDef)
    .map((k) => k.outerHTML)
    .join('');
  const runs: { depth: number; html: string }[] = [];
  for (const k of kids) {
    if (isDef(k)) continue;
    const marked = k.getAttribute('data-depth');
    const last = runs[runs.length - 1];
    if (marked === null) {
      if (last) last.html += k.outerHTML;
      else runs.push({ depth: 1, html: k.outerHTML });
      continue;
    }
    const d = Number(marked) || 1;
    if (last && last.depth === d) last.html += k.outerHTML;
    else runs.push({ depth: d, html: k.outerHTML });
  }
  const outer = svg.outerHTML;
  const open = outer.slice(0, outer.indexOf('>') + 1);
  return runs.map((r, i) => {
    let s = `${open}${shared}${r.html}</svg>`;
    if (i > 0) s = s.replace(/ id="/g, ` id="L${i}`).replace(/url\(#/g, `url(#L${i}`).replace(/href="#/g, `href="#L${i}`);
    return { svg: s, depth: r.depth };
  });
}

/**
 * Puts a panel into `art` (which fills the screen) and starts its camera move. `n` counts the panels
 * shown so far, so the direction of the pan and zoom alternates. Returns the running animations (to
 * cancel when the next panel comes).
 */
export function showPanel(art: HTMLElement, svgText: string, n: number): Animation[] {
  const layers = splitLayers(svgText);
  art.innerHTML = layers.map((l) => l.svg).join('');
  const svgs = [...art.children].filter((c): c is SVGSVGElement => c.tagName.toLowerCase() === 'svg');
  // Old panels have no preserveAspectRatio: crop them to fill the screen as well.
  for (const s of svgs) s.setAttribute('preserveAspectRatio', 'xMidYMid slice');
  const still = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (still || typeof art.animate !== 'function') return [];
  const dir = n % 2 ? 1 : -1;
  const zoomIn = n % 4 < 2;
  const [s0, s1] = zoomIn ? [1.04, 1.1] : [1.1, 1.04];
  const timing: KeyframeAnimationOptions = { duration: MOVE_MS, easing: 'cubic-bezier(.3,.05,.45,1)', fill: 'forwards' };
  const anims = [
    art.animate(
      [
        { transform: `translate3d(${-dir * PAN}%, 0.5%, 0) scale(${s0})` },
        { transform: `translate3d(${dir * PAN}%, -0.5%, 0) scale(${s1})` },
      ],
      timing,
    ),
  ];
  if (svgs.length > 1) {
    svgs.forEach((s, i) => {
      // Nearer layers slide further than the camera, farther ones lag behind it.
      const extra = (layers[i].depth - 1) * PAN * 1.4;
      if (!extra) return;
      anims.push(
        s.animate(
          [
            { transform: `translate3d(${-dir * extra}%, ${extra * 0.2}%, 0)` },
            { transform: `translate3d(${dir * extra}%, ${-extra * 0.2}%, 0)` },
          ],
          timing,
        ),
      );
    });
  }
  return anims;
}
