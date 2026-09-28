import * as THREE from 'three';

import { CELL, FLOOR_BOTTOM } from '../core/constants';
import { hash2 } from '../core/math';
import { Grid } from './grid';
import type { ParsedLevel, TileKind } from './levelTypes';
import { panelTexture } from './textures';
import type { Theme } from './themes';

export interface BuiltLevel {
  group: THREE.Group;
  update(dt: number, time: number): void;
  /** Camera and focus positions for the wall cut-away shader. */
  cutaway: { uCam: { value: THREE.Vector3 }; uTarget: { value: THREE.Vector3 } };
}

/** Makes wall fragments between the camera and Kai see-through so walls never hide him. */
export function addCutaway(m: THREE.Material, u: BuiltLevel['cutaway']) {
  m.onBeforeCompile = (shader) => {
    shader.uniforms.uCam = u.uCam;
    shader.uniforms.uTarget = u.uTarget;
    shader.vertexShader = shader.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vCutPos;').replace(
      '#include <project_vertex>',
      `#include <project_vertex>
      #ifdef USE_INSTANCING
        vCutPos = (modelMatrix * instanceMatrix * vec4(transformed, 1.0)).xyz;
      #else
        vCutPos = (modelMatrix * vec4(transformed, 1.0)).xyz;
      #endif`,
    );
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vCutPos;\nuniform vec3 uCam;\nuniform vec3 uTarget;')
      .replace(
        'void main() {',
        `void main() {
        vec2 ab = uTarget.xz - uCam.xz;
        float tt = clamp(dot(vCutPos.xz - uCam.xz, ab) / max(0.001, dot(ab, ab)), 0.0, 1.0);
        float dd = length(vCutPos.xz - (uCam.xz + ab * tt));
        if (tt > 0.2 && tt < 0.985 && vCutPos.y > uTarget.y + 0.25 && dd < 2.4) {
          float n = fract(sin(dot(floor(gl_FragCoord.xy), vec2(12.9898, 78.233))) * 43758.5453);
          if (dd < 1.3 || n < (2.4 - dd) / 1.1) discard;
        }`,
      );
  };
}

const box = new THREE.BoxGeometry(1, 1, 1);
const m4 = new THREE.Matrix4();
const q = new THREE.Quaternion();
const pos = new THREE.Vector3();
const scl = new THREE.Vector3();
const col = new THREE.Color();

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

function instanced(geo: THREE.BufferGeometry, mat: THREE.Material | THREE.Material[], count: number, shadows: boolean) {
  const mesh = new THREE.InstancedMesh(geo, mat, Math.max(1, count));
  mesh.count = 0;
  mesh.castShadow = shadows;
  mesh.receiveShadow = true;
  return mesh;
}

function put(mesh: THREE.InstancedMesh, x: number, y: number, z: number, sx: number, sy: number, sz: number, tint?: THREE.Color) {
  pos.set(x, y, z);
  scl.set(sx, sy, sz);
  m4.compose(pos, q, scl);
  mesh.setMatrixAt(mesh.count, m4);
  if (tint) mesh.setColorAt(mesh.count, tint);
  mesh.count += 1;
}

export function buildLevel(level: ParsedLevel, grid: Grid, theme: Theme, shadows: boolean): BuiltLevel {
  const group = new THREE.Group();
  const cutaway = { uCam: { value: new THREE.Vector3() }, uTarget: { value: new THREE.Vector3() } };
  const W = level.width;
  const D = level.depth;
  const n = W * D;

  const sideMat = new THREE.MeshStandardMaterial({ color: theme.floorSide, roughness: 0.9, metalness: 0.1 });
  const topMats: Record<'floor' | 'grate' | 'ice' | 'hazard', THREE.MeshStandardMaterial> = {
    floor: new THREE.MeshStandardMaterial({
      map: panelTexture(theme.floor, theme.floorLine, level.def.id === 'hydro' ? 'soil' : 'panel'),
      roughness: 0.78,
      metalness: 0.12,
    }),
    grate: new THREE.MeshStandardMaterial({ map: panelTexture(theme.floorSide, theme.floorLine, 'grate'), roughness: 0.6, metalness: 0.5 }),
    ice: new THREE.MeshStandardMaterial({ map: panelTexture(theme.ice, '#ffffff', 'ice'), roughness: 0.15, metalness: 0.1 }),
    hazard: new THREE.MeshStandardMaterial({ color: theme.hazardDeep, roughness: 1 }),
  };
  const meshes: Partial<Record<TileKind, THREE.InstancedMesh>> = {};
  for (const k of ['floor', 'grate', 'ice', 'hazard'] as const) {
    const mats = [sideMat, sideMat, topMats[k], sideMat, sideMat, sideMat];
    meshes[k] = instanced(box, mats, n, false);
  }
  const wallMat = new THREE.MeshStandardMaterial({ color: theme.wall, roughness: 0.62, metalness: 0.25 });
  const walls = instanced(box, wallMat, n, shadows);
  const trimMat = new THREE.MeshStandardMaterial({
    color: theme.wallTrim,
    emissive: theme.wallTrim,
    emissiveIntensity: 0.65,
    roughness: 0.4,
  });
  const caps = instanced(box, trimMat, n, false);
  addCutaway(wallMat, cutaway);
  addCutaway(trimMat, cutaway);
  const edgeMat = new THREE.MeshStandardMaterial({ color: theme.edge, emissive: theme.edge, emissiveIntensity: 0.9 });
  const edges = instanced(box, edgeMat, n * 2, false);
  const stepMat = new THREE.MeshStandardMaterial({ color: theme.floorLine, emissive: theme.accent, emissiveIntensity: 0.18 });
  const steps = instanced(box, stepMat, n * 2, false);
  // Raised floor blocks in front of Kai fade out too; floors at or below his feet are never cut.
  for (const m of [sideMat, ...Object.values(topMats), edgeMat, stepMat]) addCutaway(m, cutaway);
  const lampMat = new THREE.MeshStandardMaterial({ color: theme.accent, emissive: theme.accent, emissiveIntensity: 1.2 });
  const lamps = instanced(box, lampMat, n, false);
  const panelMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(theme.wall).multiplyScalar(0.7), roughness: 0.5, metalness: 0.4 });
  const panels = instanced(box, panelMat, n, false);

  const liquidTex = liquidTexture(theme.hazard, theme.hazardDeep);
  const liquidMat = new THREE.MeshStandardMaterial({
    map: liquidTex,
    emissive: new THREE.Color(theme.hazard),
    emissiveMap: liquidTex,
    emissiveIntensity: 0.9,
    roughness: 0.25,
    transparent: true,
    opacity: 0.92,
  });
  const plane = new THREE.PlaneGeometry(1, 1);
  plane.rotateX(-Math.PI / 2);
  const liquids = instanced(plane, liquidMat, n, false);
  liquids.receiveShadow = false;

  const isWalkable = (k: TileKind) => k === 'floor' || k === 'grate' || k === 'ice';

  for (let z = 0; z < D; z++) {
    for (let x = 0; x < W; x++) {
      const c = grid.cell(x, z);
      const cx = x * CELL + CELL / 2;
      const cz = z * CELL + CELL / 2;
      if (c.kind === 'void') continue;
      if (c.kind === 'wall') {
        const hgt = c.h - FLOOR_BOTTOM;
        put(walls, cx, FLOOR_BOTTOM + hgt / 2, cz, CELL, hgt, CELL);
        let open = false;
        for (const [dx, dz] of [
          [1, 0],
          [-1, 0],
          [0, 1],
          [0, -1],
        ]) {
          const nb = grid.cell(x + dx, z + dz);
          if (nb.kind === 'wall' || nb.kind === 'void') continue;
          open = true;
          const r = hash2(x, z, dx * 3 + dz);
          const fx = cx + dx * (CELL / 2 + 0.03);
          const fz = cz + dz * (CELL / 2 + 0.03);
          if (r < 0.28) {
            put(lamps, fx, nb.h + 1.6, fz, dx ? 0.08 : 1.1, 0.14, dz ? 0.08 : 1.1);
          } else if (r < 0.55) {
            put(panels, fx, nb.h + 1.2, fz, dx ? 0.1 : 1.4, 1.5, dz ? 0.1 : 1.4);
          }
        }
        if (open) put(caps, cx, c.h + 0.05, cz, CELL, 0.1, CELL);
        continue;
      }
      const kind = c.kind === 'hazard' ? 'hazard' : c.kind;
      const top = c.kind === 'hazard' ? -1.1 : c.h;
      const hgt = top - FLOOR_BOTTOM;
      const v = 0.93 + hash2(x, z) * 0.12;
      col.setRGB(v, v, v);
      const mesh = meshes[kind];
      if (mesh) put(mesh, cx, FLOOR_BOTTOM + hgt / 2, cz, CELL, hgt, CELL, col);
      if (c.kind === 'hazard') {
        put(liquids, cx, c.h, cz, CELL, 1, CELL);
        continue;
      }
      if (!isWalkable(c.kind)) continue;
      for (const [dx, dz] of [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ]) {
        const nb = grid.cell(x + dx, z + dz);
        if (nb.kind === 'wall') continue;
        const ex = cx + dx * (CELL / 2 - 0.07);
        const ez = cz + dz * (CELL / 2 - 0.07);
        const lx = dx ? 0.14 : CELL;
        const lz = dz ? 0.14 : CELL;
        if (nb.kind === 'void' || nb.kind === 'hazard') put(edges, ex, c.h + 0.03, ez, lx, 0.07, lz);
        else if (nb.h < c.h - 0.2) put(steps, ex, c.h + 0.02, ez, lx, 0.05, lz);
      }
    }
  }

  for (const m of [...Object.values(meshes), walls, caps, edges, steps, lamps, panels, liquids]) {
    if (!m) continue;
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
    m.computeBoundingSphere();
    group.add(m);
  }

  return {
    group,
    cutaway,
    update(dt: number) {
      liquidTex.offset.x += dt * 0.03;
      liquidTex.offset.y += dt * 0.018;
    },
  };
}
