import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

import { CELL } from '../core/constants';
import type { Box } from './physics';

import type { DecorKind } from './levelTypes';

/** How tall each prop's collider is; low props can be stood on. */
const HEIGHT: Record<DecorKind, number> = {
  pod: 2.4,
  console: 1.2,
  crystal: 1.6,
  pipes: 2.4,
  tank: 2.4,
  tree: 3,
  mushroom: 1.6,
  flowers: 0.5,
  crops: 0.45,
  barrel: 1.1,
  generator: 1.4,
  lamp: 3,
  bench: 0.6,
  kiosk: 2.4,
  fountain: 0.6,
  locker: 2.2,
  camera: 2.8,
  barrier: 0.9,
  globe: 2.6,
  bloom: 1.4,
  screen: 3,
};

function colored(geo: THREE.BufferGeometry, color: string, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, sx = 1, sy = 1, sz = 1): THREE.BufferGeometry {
  const g = geo.index ? geo.toNonIndexed() : geo.clone();
  g.applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz)), new THREE.Vector3(sx, sy, sz)));
  const c = new THREE.Color(color);
  const n = g.getAttribute('position').count;
  const cols = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    cols[i * 3] = c.r;
    cols[i * 3 + 1] = c.g;
    cols[i * 3 + 2] = c.b;
  }
  g.setAttribute('color', new THREE.BufferAttribute(cols, 3));
  for (const key of Object.keys(g.attributes)) if (key !== 'position' && key !== 'normal' && key !== 'color') g.deleteAttribute(key);
  return g;
}

const B = (w: number, h: number, d: number) => new THREE.BoxGeometry(w, h, d);
const C = (rt: number, rb: number, h: number, s = 12) => new THREE.CylinderGeometry(rt, rb, h, s);
const S = (r: number, s = 12) => new THREE.SphereGeometry(r, s, Math.max(6, Math.round(s * 0.7)));
const K = (r: number, h: number, s = 8) => new THREE.ConeGeometry(r, h, s);

/** Returns [solid parts, glowing parts] for a prop kind, built around the origin (floor at y = 0). */
function build(kind: DecorKind, accent: string): [THREE.BufferGeometry[], THREE.BufferGeometry[], number] {
  const s: THREE.BufferGeometry[] = [];
  const g: THREE.BufferGeometry[] = [];
  let r = 0.8;
  switch (kind) {
    case 'pod':
      s.push(colored(C(0.72, 0.8, 0.3, 16), '#5a6478', 0, 0.15));
      s.push(colored(S(0.72, 18), '#e6edf7', 0, 1.25, 0, 0, 0, 0, 1, 1.45, 1));
      g.push(colored(S(0.56, 16), '#8fe6ff', 0, 1.35, 0.26, 0, 0, 0, 0.86, 1.2, 0.6));
      g.push(colored(B(0.3, 0.1, 0.05), '#7dff9a', 0, 0.45, 0.72));
      r = 0.85;
      break;
    case 'console':
      s.push(colored(B(1.3, 0.9, 0.8), '#3a4458', 0, 0.45));
      s.push(colored(B(1.3, 0.12, 0.9), '#56637e', 0, 0.95, 0, -0.35));
      g.push(colored(B(1.05, 0.55, 0.05), accent, 0, 1.25, -0.1, -0.35));
      r = 0.75;
      break;
    case 'crystal':
      for (let i = 0; i < 5; i++) {
        const a = i * 1.3;
        g.push(colored(K(0.22 + (i % 2) * 0.1, 1 + (i % 3) * 0.5, 5), '#c8f4ff', Math.cos(a) * 0.35, 0.5 + (i % 3) * 0.25, Math.sin(a) * 0.35, Math.cos(a) * 0.3, 0, Math.sin(a) * 0.3));
      }
      r = 0.6;
      break;
    case 'pipes':
      for (let i = 0; i < 3; i++) s.push(colored(C(0.18, 0.18, 2.6), i === 1 ? '#8a93a6' : '#6d7688', -0.5 + i * 0.5, 1.3));
      s.push(colored(B(1.6, 0.2, 0.5), '#3a4458', 0, 2.0));
      g.push(colored(B(1.6, 0.08, 0.52), accent, 0, 0.6));
      r = 0.9;
      break;
    case 'tank':
      s.push(colored(C(0.8, 0.8, 2.2, 16), '#8a93a6', 0, 1.1));
      g.push(colored(C(0.62, 0.62, 1.6, 16), accent, 0, 1.1, 0.25, 0, 0, 0, 1, 1, 0.7));
      s.push(colored(C(0.85, 0.85, 0.2, 16), '#3a4458', 0, 2.25));
      r = 0.85;
      break;
    case 'tree':
      s.push(colored(C(0.2, 0.3, 1.8, 8), '#6a4a2a', 0, 0.9));
      s.push(colored(S(1.1, 10), '#3f8a3a', 0, 2.3));
      s.push(colored(S(0.8, 10), '#4fa34a', 0.6, 2.8, 0.2));
      s.push(colored(S(0.7, 10), '#357a30', -0.5, 2.7, -0.3));
      g.push(colored(S(0.14, 6), '#ffd166', 0.7, 2.2, 0.8));
      g.push(colored(S(0.14, 6), '#ff6fcf', -0.8, 2.5, 0.4));
      r = 0.5;
      break;
    case 'mushroom':
      s.push(colored(C(0.2, 0.28, 1.4, 10), '#f0e6d0', 0, 0.7));
      g.push(colored(S(0.9, 14), '#ff8ad8', 0, 1.45, 0, 0, 0, 0, 1, 0.45, 1));
      g.push(colored(S(0.14, 6), '#ffffff', 0.4, 1.7, 0.2));
      r = 0.5;
      break;
    case 'flowers':
      for (let i = 0; i < 6; i++) {
        const a = i * 1.05;
        s.push(colored(C(0.03, 0.03, 0.6, 4), '#3f8a3a', Math.cos(a) * 0.5, 0.3, Math.sin(a) * 0.5));
        g.push(colored(S(0.14, 6), ['#ff6fcf', '#ffd166', '#7fe6ff'][i % 3], Math.cos(a) * 0.5, 0.62, Math.sin(a) * 0.5));
      }
      r = 0;
      break;
    case 'crops':
      s.push(colored(B(1.8, 0.4, 1.8), '#5a3a22', 0, 0.2));
      for (let i = 0; i < 9; i++) s.push(colored(K(0.2, 0.7, 5), '#5fae4a', -0.6 + (i % 3) * 0.6, 0.7, -0.6 + Math.floor(i / 3) * 0.6));
      r = 0.95;
      break;
    case 'barrel':
      s.push(colored(C(0.45, 0.45, 1.1, 14), '#c0563a', 0, 0.55));
      s.push(colored(C(0.47, 0.47, 0.1, 14), '#3a2a24', 0, 0.3));
      s.push(colored(C(0.47, 0.47, 0.1, 14), '#3a2a24', 0, 0.8));
      g.push(colored(C(0.2, 0.2, 0.03, 10), '#ffd166', 0, 1.12));
      r = 0.5;
      break;
    case 'generator':
      s.push(colored(B(1.6, 1.4, 1.2), '#4a4450', 0, 0.7));
      s.push(colored(C(0.35, 0.35, 1.3, 12), '#8a93a6', 0, 0.9, 0, 0, 0, Math.PI / 2));
      g.push(colored(B(0.5, 0.5, 0.05), accent, 0.4, 0.9, 0.62));
      g.push(colored(B(0.5, 0.5, 0.05), accent, -0.4, 0.9, 0.62));
      r = 0.9;
      break;
    case 'lamp':
      s.push(colored(C(0.08, 0.12, 3, 8), '#3a4458', 0, 1.5));
      s.push(colored(B(0.6, 0.12, 0.3), '#3a4458', 0.25, 3));
      g.push(colored(S(0.2, 8), '#fff4d0', 0.45, 2.88));
      r = 0.25;
      break;
    case 'bench':
      s.push(colored(B(1.8, 0.12, 0.6), '#a0703a', 0, 0.5));
      s.push(colored(B(1.8, 0.5, 0.1), '#a0703a', 0, 0.8, -0.28));
      s.push(colored(B(0.1, 0.5, 0.5), '#3a4458', -0.8, 0.25));
      s.push(colored(B(0.1, 0.5, 0.5), '#3a4458', 0.8, 0.25));
      r = 0.9;
      break;
    case 'kiosk':
      s.push(colored(B(1.6, 1.1, 1.2), '#e6edf7', 0, 0.55));
      s.push(colored(B(1.9, 0.15, 1.5), accent, 0, 2.4));
      s.push(colored(C(0.05, 0.05, 1.4, 6), '#3a4458', -0.8, 1.7, 0.6));
      s.push(colored(C(0.05, 0.05, 1.4, 6), '#3a4458', 0.8, 1.7, 0.6));
      g.push(colored(B(1.2, 0.3, 0.05), '#ffd166', 0, 0.8, 0.62));
      r = 0.9;
      break;
    case 'fountain':
      s.push(colored(C(1.5, 1.6, 0.6, 20), '#a39fc4', 0, 0.3));
      g.push(colored(C(1.3, 1.3, 0.1, 20), '#7fe6ff', 0, 0.55));
      s.push(colored(C(0.25, 0.35, 1.4, 10), '#a39fc4', 0, 0.9));
      g.push(colored(S(0.35, 10), '#bff4ff', 0, 1.75));
      r = 1.5;
      break;
    case 'locker':
      s.push(colored(B(1.6, 2.2, 0.7), '#56637e', 0, 1.1));
      for (let i = 0; i < 3; i++) s.push(colored(B(0.02, 2, 0.72), '#2a3242', -0.53 + i * 0.53, 1.1));
      g.push(colored(B(0.1, 0.1, 0.05), '#ff5e6a', 0.5, 1.4, 0.36));
      r = 0.8;
      break;
    case 'camera':
      s.push(colored(C(0.08, 0.1, 2.6, 8), '#3a4458', 0, 1.3));
      s.push(colored(B(0.5, 0.35, 0.8), '#e6edf7', 0, 2.7, 0.2));
      g.push(colored(S(0.12, 8), '#ff3040', 0, 2.7, 0.62));
      r = 0.2;
      break;
    case 'barrier':
      s.push(colored(B(1.8, 0.9, 0.4), '#ffd166', 0, 0.45));
      for (let i = 0; i < 3; i++) s.push(colored(B(0.3, 0.92, 0.42), '#2a2f3a', -0.6 + i * 0.6, 0.45, 0, 0, 0, 0.5));
      r = 0.9;
      break;
    case 'globe':
      s.push(colored(C(0.8, 1, 0.8, 16), '#3a4458', 0, 0.4));
      g.push(colored(S(0.9, 20), '#7fe6ff', 0, 1.9));
      r = 1;
      break;
    case 'bloom':
      s.push(colored(C(0.15, 0.3, 1.2, 8), '#3fae4a', 0, 0.6));
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        g.push(colored(S(0.3, 8), '#ff6fcf', Math.cos(a) * 0.4, 1.3, Math.sin(a) * 0.4, 0, 0, 0, 1, 0.4, 1));
      }
      g.push(colored(S(0.2, 8), '#ffe0f4', 0, 1.35));
      r = 0.4;
      break;
    case 'screen':
      s.push(colored(C(0.08, 0.1, 2, 8), '#3a4458', 0, 1));
      s.push(colored(B(2.2, 1.3, 0.12), '#2a3242', 0, 2.3));
      g.push(colored(B(2, 1.1, 0.05), accent, 0, 2.3, 0.07));
      r = 0.2;
      break;
  }
  return [s, g, r];
}

export interface DecorPlacement {
  kind: DecorKind;
  x: number;
  y: number;
  z: number;
  rot: number;
  scale: number;
  solid: boolean;
}

/** Builds all props as one instanced mesh per kind (plus one for glowing parts). */
export function buildDecor(items: DecorPlacement[], accent: string, boxes: Box[]): THREE.Group {
  const group = new THREE.Group();
  const byKind = new Map<DecorKind, DecorPlacement[]>();
  for (const it of items) {
    const list = byKind.get(it.kind);
    if (list) list.push(it);
    else byKind.set(it.kind, [it]);
  }
  const solidMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.6, metalness: 0.2 });
  const glowMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.3, emissive: '#ffffff', emissiveIntensity: 0.5 });
  glowMat.onBeforeCompile = (shader) => {
    // Emissive follows each vertex's own color so every glowing part keeps its hue.
    shader.fragmentShader = shader.fragmentShader.replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n totalEmissiveRadiance *= vColor.rgb;');
  };
  const m4 = new THREE.Matrix4();
  for (const [kind, list] of byKind) {
    const [solid, glow, r] = build(kind, accent);
    for (const [geos, mat, shadow] of [
      [solid, solidMat, true],
      [glow, glowMat, false],
    ] as const) {
      if (!geos.length) continue;
      const merged = mergeGeometries(geos as THREE.BufferGeometry[], false);
      if (!merged) continue;
      const mesh = new THREE.InstancedMesh(merged, mat, list.length);
      mesh.castShadow = shadow;
      mesh.receiveShadow = true;
      list.forEach((it, i) => {
        m4.compose(new THREE.Vector3(it.x, it.y, it.z), new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), it.rot), new THREE.Vector3(it.scale, it.scale, it.scale));
        mesh.setMatrixAt(i, m4);
      });
      mesh.instanceMatrix.needsUpdate = true;
      mesh.computeBoundingSphere();
      group.add(mesh);
    }
    if (r > 0) {
      for (const it of list) {
        if (!it.solid) continue;
        const rr = r * it.scale;
        boxes.push({ minX: it.x - rr, maxX: it.x + rr, minZ: it.z - rr, maxZ: it.z + rr, bottom: it.y, top: it.y + HEIGHT[kind] * it.scale, solid: true, dx: 0, dy: 0, dz: 0 });
      }
    }
  }
  return group;
}

export const cellCenter = (c: number) => c * CELL + CELL / 2;
