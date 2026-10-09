# Graphic-novel panels: style guide

The storybook panels are being redrawn as **graphic-novel art**: inked lines of varying weight,
cel shadows with hatching, strong coloured light (key + rim), atmosphere and depth, heroic
proportions. It is still a family game: exciting and beautiful, never gory.

Exemplars (copy their structure):

| Panel          | File                     | Shows                                                         |
| -------------- | ------------------------ | ------------------------------------------------------------- |
| `ch3-scylla`   | `art/ch3-reef.ts`        | backlit giant robot, whirlpool, two heroes in action poses     |
| `ch3-atalanta` | `art/ch3b.ts`            | golden-hour meeting, flying drones, sky isles, both droids     |
| `ch3-salute`   | `art/ch3-stand.ts`       | sunset backlight, hero shot of Brennus, the Argo, a machine    |

Check any panel full-screen with `node game/build.mjs` then `game/dist/index.html#panel=<id>`
(add `&caption` or `&talk` to see text over it). Look at 1280x720 **and** 844x390.

## 1. The panel skeleton

```ts
import * as gn from '../gn'; // in files that still use the old kit (`../kit` has the same names)

export function ch3Example(): string {
  // 1. One pen per panel: its id prefixes every SVG id. Set the light once.
  const pen = gn.Pen.scene('ch3-example', {
    key: [0.8, -0.55], keyColor: '#ffd28a', // where the main light comes FROM (screen dir), warm
    rim: [-0.9, -0.35], rimColor: '#8ff0ff', // back/rim light, usually opposite the key, cool
    shadow: '#6a5aa8', depth: 0.55, // shadows are multiplied by this mid-tone tint
  });
  // 2. Build the picture back to front, in parallax layers.
  const sky = gn.sky(pen, [[0, '#0f2440'], [0.6, '#ffd9a4']]) + gn.bloom(pen, 1150, 250, 110, '#fff0c8');
  const far = gn.sea(pen, 516, '#e8c294', '#0c4458', { sunX: 1150 }) + gn.haze(pen, 470, 590, '#ffe2b8', 0.7);
  const mid = gn.crag(pen, [/* outline points */], '#8a7a70', { sh: 200, cracks: 8 });
  const heroes = gn.jason(pen, 640, 888, 1.08, { pose: 'point', mood: 'determined' });
  const fore = gn.grass(pen, -70, 230, 930, 4, 150, '#10281a', '#4a8a4a');
  // 3. Wrap it: layers back to front, then vignette and grain (unlayered, on top).
  return pen.svg(
    gn.layer(0.15, sky) + gn.layer(0.35, far) + gn.layer(0.65, mid) + gn.layer(1, heroes) + gn.layer(1.3, fore) +
      gn.vignette(pen, 0.55) + gn.grain(pen, 0.08),
  );
}
```

- Canvas is 1600x900. It is shown full-screen, **cropped like `cover`** with a slow camera move:
  keep faces and key action inside **x 140..1460, y 130..760**. Let backgrounds and foreground
  props run past the edges (draw sky/ground from -80 to 1680).
- The bottom ~20% sits under a dark gradient with captions and dialogue: no important detail there.
- `gn.layer(depth, ...)`: 2 to 5 top-level layers, back to front. 0.15 sky, 0.35 far, 0.6 mid,
  1 the characters, 1.25-1.35 foreground. The UI splits them and drifts each at its own speed.

## 2. Palette and colour

- Ink `gn.INK` (#0d0a16, a blue-black). Never pure black.
- Keep the characters' storybook colours (they are built into the cast functions).
- Each panel has **one key colour** (warm sun, cold moon, gold glow) and **one rim colour**,
  usually complementary (warm key + cyan rim, or pink sky + pale-blue rim).
- Shadows are not grey: `Light.shadow` is a mid-tone tint (#6a5aa8 purple, #34346a deep blue for
  backlit rock, #7a6ab0 for daylight) that every shadow is multiplied by. `pen.dark(c)` and
  `pen.lit(c)` give you the shadow and lit versions of any colour.
- Atmospheric perspective: far things paler, bluer/warmer toward the haze, thinner lines, less
  contrast; near things saturated with heavy blacks. Put `gn.haze()` bands between depths.

## 3. Line, shading, light

Everything solid is drawn with **`pen.form(d, fill, opts)`**:

| opt     | meaning                                                                                     |
| ------- | ------------------------------------------------------------------------------------------- |
| `sh`    | shadow depth in local units (~1/3 of the width for round forms; 0 = flat)                   |
| `hatch` | 1 lines, 2 cross-hatch, 3 dense: drawn in the shadow                                        |
| `rim`   | rim-light width (1.4-2.4 usual, 3-4 for hard backlight). Shows only on the shadowed edge     |
| `line`  | ink width: 3-3.6 big shapes/foreground, 2.4-2.8 figures, 1.6-2.2 details, 0-1.4 far away     |
| `heavy` | extra ink on the shadow side (automatic for forms with `sh` >= 14)                           |
| `axis`  | for long forms (limbs, hulls, columns): shade across the length, not along it               |
| `inner` | markup clipped inside the shape, drawn on top of the shading (panel lines, decals, glows)   |
| `paint` | a gradient (`pen.lin(...)`) for the lit side instead of the flat colour                     |
| `shade` | override the shadow colour (e.g. darker for far limbs)                                       |

The outline is thin on the lit side and swells on the shadow side by itself. Use
**`pen.brush(points, width)`** (tapered stroke) for creases, cracks, folds, hair strands, grass,
and `pen.brushes([[pts, w], ...])` to put many strokes in one path. Never use plain uniform
`stroke` lines for organic ink.

Shading recipe: one light per panel; big flat shadow shapes (cel) + hatching in them; spot
blacks in the foreground; rim light along silhouettes facing the back light; glows
(`pen.glow`, `gn.bloom`) on light sources, eyes, runes, engines.

For a backlit subject (a giant against the sun) use a second light on the same pen:
`const back = pen.relight({ key: [0, -1], rim: [0, -1], rimColor: '#ffe0a8', depth: 0.8 })` and
give its forms a huge `sh` (most of the shape in shadow, just the top edge lit).

## 4. Effects (`gn.*`)

`sky`, `nebula`, `starfield`, `spark` (four-point glint), `godRays`, `bloom`, `haze`, `wash`
(fade from an edge), `cloud` (puffy, `flat` for cloud seas), `crag` (rocks with cracks and
`strata`), `sea` (ripples + sun glitter), `gasGiant`, `grass`, `halftone` (dot texture, e.g. on
the upper sky at 0.1), `speedLines` (focus lines for shock), `streaks` (motion trails),
`castShadow` (ellipse), `longShadow` (low sun), `vignette`, `grain` (the only filter: once,
last, 0.06-0.1), `silhouette` (flat far shapes).

## 5. The cast

Every character is `name(pen, x, y, scale, opts)`, **feet at (x, y)**, facing right (`flip: true`
faces left). One head = 100 units at scale 1: Jason ~550 tall, Atalanta ~550, Brennus ~650,
Argus ~700, Aeëtes ~750. Scale ~1.0-1.25 for main characters in a full shot.

```ts
gn.jason(pen, x, y, s, { pose, mood, flip, look, rim, helmet: false, blaster: true });
gn.atalanta(pen, x, y, s, { pose, mood, flip, bow: 'back' | 'hand' | 'draw', aim: 110, wind: 1 });
gn.brennus(pen, x, y, s, { pose, mood, dented, capOff, shield: true, cannon: true });
gn.argus(pen, x, y, s, { pose, mood, capOff });
gn.aeetes(pen, x, y, s, { pose, mood }); // mood 'scheming' = his too-wide grin
gn.lux(pen, x, y, s, 'normal' | 'happy' | 'scared' | 'glow', { flip, look: [dx, dy], rot });
gn.iris(pen, x, y, s, 'normal' | 'happy' | 'asleep' | 'sing', { flip, rot });
gn.argo(pen, x, y, s, { rot, lit, sail, flip }) + gn.argoTrail(pen, sternX, sternY, len, deg);
```

- `mood`: `neutral smile grin determined focus angry shout surprised worried proud sly scheming asleep`.
- `look: [x, y]`: where the eyes look (small offsets, e.g. `[2.4, -2]` = ahead and up).
- `pose`: a name from `gn.POSES` (`stand ready hips point wave salute cheer run crouch`) or your own `Pose`:

```ts
const lunge: gn.Pose = {
  turn: 0.45, // 0 faces us, 1 is a side view (toward +x)
  lean: 6, // spine lean toward the facing side (deg); tilt: head nod
  hipTilt: 6, // contrapposto
  armN: [-16, 28], // NEAR arm (in front of the body): [upper arm, forearm] absolute angles
  armF: { to: [1.8, -0.6] }, // FAR arm: or a wrist target in heads from the neck base (IK)
  legN: { to: [-0.3, 0.92] }, // legs: ankle targets in LEG LENGTHS from the pelvis (any build)
  legF: { to: [0.3, 0.93] },
  handN: 'fist', handF: 'point', // fist open point flat grip relaxed; wristN/F rotate them
  footF: 30, // lift a heel (deg)
};
```

Angles (as `gn.dir` measures them): **0 hangs down, 90 points forward (right), 180 straight up,
-90 back**. `{ to, bend }`: `bend: -1` flips which way the elbow/knee goes (e.g. an archer's drawing
elbow out behind). The near limbs are on the left of a right-facing figure.

New characters: build them like `argus` with `gn.figure(pen, pose, outfit, headOpts, extras)` (a
`Build` for proportions, an `Outfit` for colours, `HeadOpts` for face, hair as `front`/`back` markup
in head coordinates, and `extras` callbacks to add belts, capes, weapons at the right depth).
Lower-level pieces: `rig`, `chain`, `limb`, `torso`, `hand`, `boot`, `head`, `cap`, `coatSkirt`.

Rules for figures: heads ~90-140 px tall in the panel for faces that read; show the body's
weight (feet planted, contrapposto, lean into action); don't let a hand or prop cover a face;
characters should overlap meaningfully, never at a tangent.

## 6. Composition

- One clear focal point; lead the eye with light (bloom/god-rays behind the subject), rim light
  on silhouettes, and the vignette.
- Dynamic camera: low angles for heroes and threats, big foreground shapes cut by the frame,
  diagonals (aims, trails, beams) that point at the subject.
- Depth in at least three planes (far / mid / near) separated by haze and value.
- Tell the story beat of the dialogue (who speaks, what they look at, what just happened).

## 7. Budget

- Markup **under ~150 KB** per panel (exemplars: 70-145 KB). `node -e` with `panelSvg(id).length`
  or check the dump. Cost drivers: each `form` ~0.5 KB, each figure 15-28 KB, `grass` and
  `brushes` with many points.
- At most one `grain()`; no other filters; prefer gradients, patterns and glows.
- Ids: only via `pen` (`uid`, `lin`, `rad`, `form`...), never hand-written.

## 8. Checklist

- [ ] Same panel id and function name as before; the story text matches what is drawn.
- [ ] One key + one rim light, shadows tinted, a clear focal point, three depth planes.
- [ ] Faces visible and expressive, hands readable, no prop covering a face.
- [ ] Key content inside x 140..1460, y 130..760; edges overdrawn to -80/1680.
- [ ] 2-5 `gn.layer`s, vignette + grain last.
- [ ] Looked at it at 1280x720 and 844x390 with `&talk`; fixed what looked amateurish.
- [ ] Under 150 KB; `npm run typecheck`, `npx jest --silent`, `npx expo lint` pass.
