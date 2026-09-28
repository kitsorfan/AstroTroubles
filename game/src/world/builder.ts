import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

import { CELL, FLOOR_BOTTOM, WALL_H } from '../core/constants';
import { hash2 } from '../core/math';
import { Grid } from './grid';
import type { Cell, ParsedLevel } from './levelTypes';
import { deckSurfaces, type Surface } from './surfaces';
import type { Theme } from './themes';

export interface BuiltLevel {
  group: THREE.Group;
  update(dt: number, time: number): void;
}

/** How deep the machinery shafts under the walkways go on enclosed decks. */
const ABYSS_Y = -26;
const HAZARD_BED = -1.1;

type V3 = [number, number, number];

/** Collects quads into one indexed BufferGeometry (position, normal, uv, grey vertex colour). */
class Quads {
  private pos: number[] = [];
  private nor: number[] = [];
  private uv: number[] = [];
  private col: number[] = [];
  private idx: number[] = [];

  add(p: V3[], n: V3, uv: [number, number][], shade: number[]) {
    const base = this.pos.length / 3;
    for (let i = 0; i < 4; i++) {
      this.pos.push(...p[i]);
      this.nor.push(...n);
      this.uv.push(...uv[i]);
      this.col.push(shade[i], shade[i], shade[i]);
    }
    // Pick the winding whose face normal agrees with n.
    const ax = p[1][0] - p[0][0];
    const ay = p[1][1] - p[0][1];
    const az = p[1][2] - p[0][2];
    const bx = p[2][0] - p[0][0];
    const by = p[2][1] - p[0][1];
    const bz = p[2][2] - p[0][2];
    const dot = (ay * bz - az * by) * n[0] + (az * bx - ax * bz) * n[1] + (ax * by - ay * bx) * n[2];
    if (dot >= 0) this.idx.push(base, base + 1, base + 2, base, base + 2, base + 3);
    else this.idx.push(base, base + 2, base + 1, base, base + 3, base + 2);
  }

  get empty() {
    return this.idx.length === 0;
  }

  geometry(): THREE.BufferGeometry {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.pos, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(this.nor, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(this.uv, 2));
    g.setAttribute('color', new THREE.Float32BufferAttribute(this.col, 3));
    g.setIndex(this.idx);
    g.computeBoundingSphere();
    return g;
  }
}

/** A primitive baked in place with a flat colour, for merging props like ribs and pipes. */
function part(geo: THREE.BufferGeometry, color: THREE.Color, m: THREE.Matrix4): THREE.BufferGeometry {
  const g = geo.index ? geo.toNonIndexed() : geo.clone();
  g.applyMatrix4(m);
  const n = g.getAttribute('position').count;
  const cols = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    cols[i * 3] = color.r;
    cols[i * 3 + 1] = color.g;
    cols[i * 3 + 2] = color.b;
  }
  g.setAttribute('color', new THREE.BufferAttribute(cols, 3));
  for (const key of Object.keys(g.attributes)) if (key !== 'position' && key !== 'normal' && key !== 'color') g.deleteAttribute(key);
  return g;
}

function liquidTexture(a: string, b: string) {
  const S = 256;
  const c = document.createElement('canvas');
  c.width = S;
  c.height = S;
  const g = c.getContext('2d') as CanvasRenderingContext2D;
  g.fillStyle = b;
  g.fillRect(0, 0, S, S);
  for (let i = 0; i < 26; i++) {
    const x = Math.random() * S;
    const y = Math.random() * S;
    const r = 18 + Math.random() * 46;
    for (const [ox, oy] of [
      [0, 0],
      [S, 0],
      [-S, 0],
      [0, S],
      [0, -S],
    ]) {
      const grad = g.createRadialGradient(x + ox, y + oy, 0, x + ox, y + oy, r);
      grad.addColorStop(0, a);
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = grad;
      g.beginPath();
      g.arc(x + ox, y + oy, r, 0, Math.PI * 2);
      g.fill();
    }
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = THREE.RepeatWrapping;
  t.wrapT = THREE.RepeatWrapping;
  return t;
}

function surfaceMat(s: Surface, opts: { rough: number; metal: number; glow?: number; normal?: number }): THREE.MeshStandardMaterial {
  const m = new THREE.MeshStandardMaterial({
    map: s.map,
    normalMap: s.normalMap,
    normalScale: new THREE.Vector2(opts.normal ?? 1, opts.normal ?? 1),
    roughness: opts.rough,
    metalness: opts.metal,
    vertexColors: true,
  });
  if (s.emissiveMap) {
    m.emissive.set('#ffffff');
    m.emissiveMap = s.emissiveMap;
    m.emissiveIntensity = opts.glow ?? 1.4;
  }
  return m;
}

const DIRS: [number, number][] = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
];

const isWalk = (c: Cell) => c.kind === 'floor' || c.kind === 'grate' || c.kind === 'ice';

export function buildLevel(level: ParsedLevel, grid: Grid, theme: Theme, shadows: boolean): BuiltLevel {
  const group = new THREE.Group();
  const W = level.width;
  const D = level.depth;
  const surf = deckSurfaces(theme, level.def.id);
  const bottomY = theme.space ? FLOOR_BOTTOM : ABYSS_Y;

  const floorQ = [new Quads(), new Quads(), new Quads()];
  const grateQ = new Quads();
  const iceQ = new Quads();
  const bedQ = new Quads();
  const wallQ = [new Quads(), new Quads(), new Quads(), new Quads()];
  const capQ = new Quads();
  const sideQ = new Quads();
  const metalParts: THREE.BufferGeometry[] = [];
  const glowParts: THREE.BufferGeometry[] = [];

  const plane = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2);
  const liquidTex = liquidTexture(theme.hazard, theme.hazardDeep);
  const liquidMat = new THREE.MeshStandardMaterial({
    map: liquidTex,
    emissive: new THREE.Color(theme.hazard),
    emissiveMap: liquidTex,
    emissiveIntensity: 1.1,
    roughness: 0.2,
    metalness: 0.1,
    transparent: true,
    opacity: 0.93,
  });
  const liquids = new THREE.InstancedMesh(plane, liquidMat, Math.max(1, W * D));
  liquids.count = 0;
  const m4 = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const up = new THREE.Vector3(0, 1, 0);
  const box = new THREE.BoxGeometry(1, 1, 1);
  const pipe = new THREE.CylinderGeometry(1, 1, 1, 10, 1).rotateZ(Math.PI / 2);
  const ribColor = new THREE.Color(theme.wall).multiplyScalar(0.7);
  const pipeColor = new THREE.Color(theme.floorSide).multiplyScalar(1.6);
  const pipeColor2 = new THREE.Color(theme.wallTrim).lerp(new THREE.Color('#303640'), 0.7);
  const trimColor = new THREE.Color(theme.wallTrim);
  const edgeColor = new THREE.Color(theme.edge);

  const place = (list: THREE.BufferGeometry[], geo: THREE.BufferGeometry, color: THREE.Color, x: number, y: number, z: number, sx: number, sy: number, sz: number, yaw = 0) => {
    q.setFromAxisAngle(up, yaw);
    m4.compose(new THREE.Vector3(x, y, z), q, new THREE.Vector3(sx, sy, sz));
    list.push(part(geo, color, m4));
  };

  /** Voxel-style ambient occlusion for one corner of a floor tile. */
  const occludes = (c: Cell, x: number, z: number) => {
    const n = grid.cell(x, z);
    return n.kind === 'wall' || (isWalk(n) && n.h > c.h + 0.3) ? 1 : 0;
  };
  const cornerAO = (c: Cell, x: number, z: number, sx: number, sz: number) => {
    const a = occludes(c, x + sx, z);
    const b = occludes(c, x, z + sz);
    const d = occludes(c, x + sx, z + sz);
    const level = a && b ? 0 : 3 - (a + b + d);
    return [0.42, 0.58, 0.78, 1][level];
  };

  for (let z = 0; z < D; z++) {
    for (let x = 0; x < W; x++) {
      const c = grid.cell(x, z);
      if (c.kind === 'void') continue;
      const x0 = x * CELL;
      const z0 = z * CELL;
      const x1 = x0 + CELL;
      const z1 = z0 + CELL;
      const cx = x0 + CELL / 2;
      const cz = z0 + CELL / 2;

      if (c.kind === 'wall') {
        capQ.add(
          [
            [x0, c.h, z0],
            [x1, c.h, z0],
            [x1, c.h, z1],
            [x0, c.h, z1],
          ],
          [0, 1, 0],
          [
            [0, 1],
            [1, 1],
            [1, 0],
            [0, 0],
          ],
          [1, 1, 1, 1],
        );
        for (let di = 0; di < 4; di++) {
          const [dx, dz] = DIRS[di];
          const nb = grid.cell(x + dx, z + dz);
          let y0: number;
          let floorBase = false;
          if (nb.kind === 'wall') {
            if (nb.h >= c.h - 0.01) continue;
            y0 = nb.h;
          } else if (nb.kind === 'void') y0 = bottomY;
          else if (nb.kind === 'hazard') y0 = HAZARD_BED;
          else {
            y0 = nb.h;
            floorBase = true;
          }
          const y1 = c.h;
          // Face centre, outward normal and the direction that reads left-to-right when you face it.
          const fx = cx + (dx * CELL) / 2;
          const fz = cz + (dz * CELL) / 2;
          const tx = dz;
          const tz = -dx;
          const r = hash2(x, z, di + 1);
          const variant = !floorBase ? 0 : r < 0.42 ? 0 : r < 0.64 ? 3 : r < 0.86 ? 1 : 2;
          const v0 = floorBase ? 0 : 1 - (y1 - y0) / WALL_H;
          const v1 = floorBase ? (y1 - y0) / WALL_H : 1;
          const low = floorBase ? 0.5 : nb.kind === 'void' ? 0.18 : 0.45;
          wallQ[variant].add(
            [
              [fx - tx, y0, fz - tz],
              [fx + tx, y0, fz + tz],
              [fx + tx, y1, fz + tz],
              [fx - tx, y1, fz - tz],
            ],
            [dx, 0, dz],
            [
              [0, v0],
              [1, v0],
              [1, v1],
              [0, v1],
            ],
            [low, low, 1, 1],
          );
          if (!floorBase) continue;
          const yaw = Math.atan2(dx, dz);
          // A glowing trim line along the top edge of the wall.
          place(glowParts, box, trimColor, fx + dx * 0.06, y1 - 0.07, fz + dz * 0.06, CELL - 0.04, 0.11, 0.1, yaw);
          // Structural ribs where this wall continues to the right.
          const rx = x + tx;
          const rz = z + tz;
          const right = grid.cell(rx, rz);
          const rightOpen = grid.cell(rx + dx, rz + dz);
          if (right.kind === 'wall' && isWalk(rightOpen) && Math.abs(rightOpen.h - nb.h) < 0.01 && hash2(x, z, di + 11) < 0.6) {
            const top = Math.min(y1, right.h) - y0;
            const ex = fx + tx;
            const ez = fz + tz;
            place(metalParts, box, ribColor, ex + dx * 0.12, y0 + top / 2, ez + dz * 0.12, 0.38, top, 0.24, yaw);
            place(metalParts, box, ribColor.clone().multiplyScalar(0.7), ex + dx * 0.2, y0 + 0.35, ez + dz * 0.2, 0.52, 0.7, 0.28, yaw);
            place(glowParts, box, trimColor, ex + dx * 0.245, y0 + top * 0.55, ez + dz * 0.245, 0.11, top * 0.42, 0.02, yaw);
          }
          // Pipe runs along whole rows of wall.
          const rowA = dz !== 0 ? z : x;
          const rowB = dz !== 0 ? dz + 5 : dx + 9;
          if (hash2(rowA, rowB, 99) < 0.34) {
            const py = y0 + 2.35;
            place(metalParts, pipe, pipeColor, fx + dx * 0.3, py, fz + dz * 0.3, CELL, 0.09, 0.09, yaw);
            if (hash2(rowA, rowB, 98) < 0.55) place(metalParts, pipe, pipeColor2, fx + dx * 0.24, py + 0.24, fz + dz * 0.24, CELL, 0.055, 0.055, yaw);
            place(metalParts, box, ribColor, fx + dx * 0.16, py + 0.1, fz + dz * 0.16, 0.12, 0.42, 0.3, yaw);
          }
        }
        continue;
      }

      if (c.kind === 'hazard') {
        bedQ.add(
          [
            [x0, HAZARD_BED, z0],
            [x1, HAZARD_BED, z0],
            [x1, HAZARD_BED, z1],
            [x0, HAZARD_BED, z1],
          ],
          [0, 1, 0],
          [
            [0, 1],
            [1, 1],
            [1, 0],
            [0, 0],
          ],
          [0.6, 0.6, 0.6, 0.6],
        );
        q.identity();
        m4.compose(new THREE.Vector3(cx, c.h, cz), q, new THREE.Vector3(CELL, 1, CELL));
        liquids.setMatrixAt(liquids.count++, m4);
      } else {
        // Floor tile: pick a plate variant and turn it a random quarter so the pattern never repeats.
        const r = hash2(x, z, 3);
        const target = c.kind === 'grate' ? grateQ : c.kind === 'ice' ? iceQ : floorQ[r < 0.64 ? 0 : r < 0.95 ? 1 : 2];
        const rot = Math.floor(hash2(x, z, 4) * 4);
        const uvs: [number, number][] = [
          [0, 1],
          [1, 1],
          [1, 0],
          [0, 0],
        ];
        const tint = 0.88 + hash2(x, z, 5) * 0.16;
        target.add(
          [
            [x0, c.h, z0],
            [x1, c.h, z0],
            [x1, c.h, z1],
            [x0, c.h, z1],
          ],
          [0, 1, 0],
          [0, 1, 2, 3].map((i) => uvs[(i + rot) % 4]),
          [cornerAO(c, x, z, -1, -1) * tint, cornerAO(c, x, z, 1, -1) * tint, cornerAO(c, x, z, 1, 1) * tint, cornerAO(c, x, z, -1, 1) * tint],
        );
      }

      // Exposed sides of this block.
      const top = c.kind === 'hazard' ? HAZARD_BED : c.h;
      for (let di = 0; di < 4; di++) {
        const [dx, dz] = DIRS[di];
        const nb = grid.cell(x + dx, z + dz);
        if (nb.kind === 'wall') continue;
        let y0: number;
        let low = 0.12;
        if (nb.kind === 'void') y0 = bottomY;
        else if (nb.kind === 'hazard') {
          if (c.kind === 'hazard') continue;
          y0 = HAZARD_BED;
          low = 0.4;
        } else {
          if (nb.h >= top - 0.01) continue;
          y0 = nb.h;
          low = 0.55;
        }
        const fx = cx + (dx * CELL) / 2;
        const fz = cz + (dz * CELL) / 2;
        const tx = dz;
        const tz = -dx;
        sideQ.add(
          [
            [fx - tx, y0, fz - tz],
            [fx + tx, y0, fz + tz],
            [fx + tx, top, fz + tz],
            [fx - tx, top, fz - tz],
          ],
          [dx, 0, dz],
          [
            [0, 1 - (top - y0) / CELL],
            [1, 1 - (top - y0) / CELL],
            [1, 1],
            [0, 1],
          ],
          [low, low, 0.9, 0.9],
        );
        if (isWalk(c)) {
          const yaw = Math.atan2(dx, dz);
          const ex = cx + dx * (CELL / 2 - 0.06);
          const ez = cz + dz * (CELL / 2 - 0.06);
          if (nb.kind === 'void' || nb.kind === 'hazard') {
            // Glowing safety edge where the floor ends.
            place(glowParts, box, edgeColor, ex - dx * 0.04, c.h + 0.02, ez - dz * 0.04, CELL, 0.06, 0.16, yaw);
          } else {
            place(glowParts, box, trimColor.clone().multiplyScalar(0.5), ex - dx * 0.03, c.h + 0.012, ez - dz * 0.03, CELL, 0.04, 0.12, yaw);
          }
        }
      }
    }
  }

  const add = (qd: Quads, mat: THREE.Material, cast: boolean) => {
    if (qd.empty) return;
    const me = new THREE.Mesh(qd.geometry(), mat);
    me.receiveShadow = true;
    me.castShadow = cast && shadows;
    group.add(me);
  };
  // Fairly rough, softly bumped metal: sharp glints on detailed normal maps sparkle as the camera moves.
  surf.floors.forEach((s, i) => add(floorQ[i], surfaceMat(s, { rough: 0.74, metal: 0.25, glow: 0.8, normal: 0.7 }), false));
  add(grateQ, surfaceMat(surf.grate, { rough: 0.62, metal: 0.4, glow: 1.1, normal: 0.8 }), false);
  add(iceQ, surfaceMat(surf.ice, { rough: 0.32, metal: 0.05, normal: 0.5 }), false);
  add(bedQ, new THREE.MeshStandardMaterial({ color: theme.hazardDeep, roughness: 1, vertexColors: true }), false);
  surf.walls.forEach((s, i) => {
    const m = surfaceMat(s, { rough: 0.68, metal: 0.3, glow: 1.5, normal: 0.8 });
    m.shadowSide = THREE.DoubleSide;
    add(wallQ[i], m, true);
  });
  add(capQ, surfaceMat(surf.cap, { rough: 0.72, metal: 0.35, normal: 0.8 }), true);
  const sideMat = surfaceMat(surf.side, { rough: 0.78, metal: 0.3, normal: 0.8 });
  sideMat.shadowSide = THREE.DoubleSide;
  add(sideQ, sideMat, true);

  if (metalParts.length) {
    const me = new THREE.Mesh(mergeGeometries(metalParts), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.55, metalness: 0.5 }));
    me.receiveShadow = true;
    group.add(me);
  }
  if (glowParts.length) {
    const glowMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.5, emissive: '#ffffff', emissiveIntensity: 1.25 });
    glowMat.onBeforeCompile = (shader) => {
      // Each strip glows in its own vertex colour.
      shader.fragmentShader = shader.fragmentShader.replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n totalEmissiveRadiance *= vColor.rgb;');
    };
    group.add(new THREE.Mesh(mergeGeometries(glowParts), glowMat));
  }
  if (liquids.count) {
    liquids.instanceMatrix.needsUpdate = true;
    liquids.computeBoundingSphere();
    group.add(liquids);
  }
  if (!theme.space) {
    // The floor of the machinery shafts far below, with its own dim lights.
    const span = Math.max(W, D) * CELL + 120;
    const s = surf.abyss;
    for (const t of [s.map, s.normalMap, s.emissiveMap]) t?.repeat.set(span / 16, span / 16);
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(span, span).rotateX(-Math.PI / 2),
      new THREE.MeshStandardMaterial({ map: s.map, normalMap: s.normalMap, emissiveMap: s.emissiveMap, emissive: '#ffffff', emissiveIntensity: 1.2, roughness: 0.8, metalness: 0.4 }),
    );
    floor.position.set((W * CELL) / 2, ABYSS_Y, (D * CELL) / 2);
    group.add(floor);
  }

  return {
    group,
    update(dt: number) {
      liquidTex.offset.x += dt * 0.03;
      liquidTex.offset.y += dt * 0.018;
    },
  };
}
