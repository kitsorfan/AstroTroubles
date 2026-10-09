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
  rock: 0.9,
  boulder: 2.2,
  cactus: 2.4,
  pine: 4.2,
  palm: 4,
  bush: 1,
  grass: 0.6,
  fern: 0.9,
  icespike: 2.6,
  lavarock: 1.2,
  bones: 0.8,
  tent: 2,
  wreck: 1.8,
  thorns: 1.6,
  banner: 3.6,
  pillar: 3.4,
  coral: 1.4,
  seafan: 1.8,
  kelp: 1.2,
  shell: 0.8,
  lighthouse: 10,
  tidepost: 3.2,
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
const D = (r: number) => new THREE.DodecahedronGeometry(r, 0);

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
    /* ---------------- Gaia Nova outdoors ---------------- */
    case 'rock':
      s.push(colored(D(0.6), '#8a8478', 0, 0.35, 0, 0.3, 0.5, 0, 1.2, 0.7, 1));
      s.push(colored(D(0.35), '#6e6a60', 0.55, 0.2, 0.3, 0.8, 0, 0.2));
      r = 0.6;
      break;
    case 'boulder':
      s.push(colored(D(1.2), '#857c70', 0, 1, 0, 0.2, 0.7, 0.1, 1, 0.85, 1));
      s.push(colored(D(0.6), '#6a6258', 0.9, 0.4, 0.5, 0.5, 0, 0.3));
      s.push(colored(S(0.5, 8), '#5f8a3a', -0.4, 1.9, 0.2, 0, 0, 0, 1, 0.3, 1));
      r = 1.2;
      break;
    case 'cactus':
      s.push(colored(C(0.32, 0.36, 2.2, 10), '#3f8a4a', 0, 1.1));
      s.push(colored(S(0.32, 10), '#3f8a4a', 0, 2.2));
      s.push(colored(C(0.18, 0.2, 0.8, 8), '#46944f', 0.55, 1.3, 0, 0, 0, Math.PI / 2));
      s.push(colored(C(0.17, 0.18, 0.7, 8), '#46944f', 0.85, 1.65));
      s.push(colored(C(0.16, 0.18, 0.6, 8), '#46944f', -0.5, 1.0, 0, 0, 0, Math.PI / 2));
      s.push(colored(C(0.15, 0.16, 0.6, 8), '#46944f', -0.75, 1.3));
      g.push(colored(S(0.14, 6), '#ff6fcf', 0, 2.5));
      r = 0.45;
      break;
    case 'pine':
      s.push(colored(C(0.18, 0.26, 1.2, 8), '#5a3a22', 0, 0.6));
      s.push(colored(K(1.3, 1.8, 9), '#2f5a3a', 0, 1.8));
      s.push(colored(K(1.0, 1.6, 9), '#376a44', 0, 2.7));
      s.push(colored(K(0.7, 1.4, 9), '#3f7a4c', 0, 3.5));
      s.push(colored(K(0.95, 0.5, 9), '#f2f6ff', 0, 2.95));
      s.push(colored(K(0.62, 0.45, 9), '#f2f6ff', 0, 3.85));
      r = 0.4;
      break;
    case 'palm':
      for (let i = 0; i < 5; i++) s.push(colored(C(0.2 - i * 0.015, 0.22 - i * 0.015, 0.75, 8), i % 2 ? '#8a6a44' : '#7a5a3a', i * 0.08, 0.38 + i * 0.72, 0, 0, 0, -0.05));
      for (let i = 0; i < 7; i++) {
        const a = (i / 7) * Math.PI * 2;
        s.push(colored(B(1.8, 0.06, 0.45), i % 2 ? '#3f9a4a' : '#4fb05a', 0.4 + Math.cos(a) * 0.85, 3.7, Math.sin(a) * 0.85, 0, -a, -0.45));
      }
      g.push(colored(S(0.16, 6), '#ffd166', 0.45, 3.5, 0.15));
      g.push(colored(S(0.16, 6), '#ffd166', 0.3, 3.5, -0.15));
      r = 0.35;
      break;
    case 'bush':
      s.push(colored(S(0.6, 9), '#3f7a2f', 0, 0.45, 0, 0, 0, 0, 1.2, 0.8, 1));
      s.push(colored(S(0.45, 9), '#4f8a3a', 0.45, 0.4, 0.2));
      s.push(colored(S(0.4, 9), '#356a28', -0.4, 0.38, -0.2));
      g.push(colored(S(0.1, 6), '#ff6fcf', 0.2, 0.85, 0.35));
      g.push(colored(S(0.1, 6), '#ffd166', -0.3, 0.75, 0.4));
      r = 0.6;
      break;
    case 'grass':
      for (let i = 0; i < 9; i++) {
        const a = (i / 9) * Math.PI * 2;
        s.push(colored(K(0.08, 0.7 + (i % 3) * 0.2, 4), i % 2 ? '#7ab84a' : '#5f9a3a', Math.cos(a) * 0.3, 0.35, Math.sin(a) * 0.3, Math.sin(a) * 0.3, 0, -Math.cos(a) * 0.3));
      }
      r = 0;
      break;
    case 'fern':
      for (let i = 0; i < 7; i++) {
        const a = (i / 7) * Math.PI * 2;
        s.push(colored(B(1.2, 0.04, 0.3), i % 2 ? '#2f8a3a' : '#3fa04a', Math.cos(a) * 0.5, 0.45, Math.sin(a) * 0.5, 0, -a, 0.6));
      }
      r = 0;
      break;
    case 'icespike':
      for (let i = 0; i < 4; i++) {
        const a = i * 1.7;
        g.push(colored(K(0.3 + (i % 2) * 0.12, 1.6 + (i % 3) * 0.6, 5), '#bfeaff', Math.cos(a) * 0.3, 0.8 + (i % 3) * 0.3, Math.sin(a) * 0.3, Math.cos(a) * 0.2, 0, Math.sin(a) * 0.2));
      }
      s.push(colored(D(0.45), '#dfefff', 0, 0.2, 0, 0, 0, 0, 1.4, 0.5, 1.4));
      r = 0.6;
      break;
    case 'lavarock':
      s.push(colored(D(0.7), '#2a2224', 0, 0.5, 0, 0.4, 0.2, 0, 1.1, 0.8, 1));
      g.push(colored(B(0.08, 0.6, 0.08), '#ff6a12', 0.2, 0.6, 0.55, 0.3, 0, 0.2));
      g.push(colored(B(0.5, 0.06, 0.08), '#ff8a2a', -0.1, 0.8, 0.6, 0, 0.3, 0));
      r = 0.65;
      break;
    case 'bones':
      s.push(colored(C(0.07, 0.07, 1.4, 6), '#efe6d0', 0, 0.15, 0, 0, 0, Math.PI / 2));
      for (let i = 0; i < 4; i++) s.push(colored(C(0.05, 0.05, 0.9, 6), '#e6dcc4', -0.45 + i * 0.3, 0.45, 0, 0.4, 0, 0));
      s.push(colored(S(0.3, 8), '#efe6d0', 0.85, 0.3, 0, 0, 0, 0, 1.3, 0.9, 1));
      r = 0;
      break;
    case 'tent':
      s.push(colored(K(1.3, 1.9, 4), '#e6dcc4', 0, 0.95, 0, 0, Math.PI / 4, 0));
      s.push(colored(B(0.6, 1, 0.05), '#3a3a44', 0, 0.5, 0.92));
      s.push(colored(C(0.04, 0.04, 2.2, 5), '#6a5a48', 0, 1.1));
      g.push(colored(B(0.5, 0.3, 0.04), accent, 0, 1.3, 0.95));
      r = 1.1;
      break;
    case 'wreck':
      s.push(colored(B(2, 0.9, 1.2), '#5a6070', 0, 0.45, 0, 0.1, 0.3, 0.15));
      s.push(colored(B(1.4, 0.15, 2.2), '#4a505e', 0.6, 0.9, 0.3, 0.3, 0.6, 0));
      s.push(colored(C(0.3, 0.3, 1.2, 10), '#3a3e48', -0.9, 0.5, 0.4, 0, 0, Math.PI / 2));
      g.push(colored(B(0.4, 0.15, 0.05), '#ff5e6a', 0.2, 0.7, 0.62));
      r = 1;
      break;
    case 'thorns':
      // Brennus's Thorn Legion barricade: iron stakes wrapped in angry pink vines.
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2;
        s.push(colored(K(0.12, 1.6, 5), '#3a3036', Math.cos(a) * 0.4, 0.8, Math.sin(a) * 0.4, Math.sin(a) * 0.35, 0, -Math.cos(a) * 0.35));
      }
      s.push(colored(new THREE.TorusGeometry(0.5, 0.08, 6, 14), '#7a2a5a', 0, 0.6, 0, Math.PI / 2, 0, 0));
      g.push(colored(S(0.1, 6), '#ff4fb8', 0.45, 1.1, 0.1));
      g.push(colored(S(0.1, 6), '#ff4fb8', -0.35, 0.9, -0.3));
      r = 0.6;
      break;
    case 'banner':
      // Brennus's flag: a red gear crossed with a thorn, on a tall iron pole.
      s.push(colored(C(0.08, 0.1, 3.6, 6), '#3a3036', 0, 1.8));
      s.push(colored(B(1.2, 1.6, 0.04), '#8a1a24', 0.62, 2.7, 0));
      s.push(colored(B(1.2, 0.12, 0.05), '#2a2026', 0.62, 3.45, 0));
      g.push(colored(new THREE.TorusGeometry(0.28, 0.07, 6, 10), '#ff3a4c', 0.62, 2.75, 0.04));
      g.push(colored(B(0.08, 0.7, 0.03), '#ff3a4c', 0.62, 2.75, 0.06, 0, 0, 0.6));
      r = 0.2;
      break;
    case 'pillar':
      // An ancient pillar of Celestia's long-gone gardeners, with glowing light-words.
      s.push(colored(C(0.55, 0.65, 3, 8), '#d8b88a', 0, 1.5));
      s.push(colored(B(1.5, 0.3, 1.5), '#c8a478', 0, 3.15));
      s.push(colored(B(1.6, 0.3, 1.6), '#c8a478', 0, 0.15));
      g.push(colored(B(0.25, 0.25, 0.05), '#5e9bff', 0, 2.2, 0.6));
      g.push(colored(B(0.25, 0.25, 0.05), '#ff6fcf', 0, 1.7, 0.6));
      g.push(colored(B(0.25, 0.25, 0.05), '#ffd166', 0, 1.2, 0.6));
      r = 0.65;
      break;
    /* ---------------- Scylla's Reef ---------------- */
    case 'coral': {
      // Branching coral: a squat base with knobbly arms in warm pinks and oranges.
      s.push(colored(D(0.45), '#e86a7a', 0, 0.25, 0, 0, 0, 0, 1.3, 0.6, 1.3));
      const arms: [number, number, number, string][] = [
        [0.5, 0.3, 0.2, '#ff8a8a'],
        [-0.45, 0.25, -0.1, '#ff9a6a'],
        [0.1, 0.35, -0.5, '#ff7a9a'],
        [-0.15, 0.4, 0.45, '#ffaa7a'],
        [0, 0.45, 0, '#ff8a8a'],
      ];
      for (const [x, tilt, z, col] of arms) {
        const h = 0.8 + Math.abs(x + z) * 0.6;
        s.push(colored(C(0.08, 0.14, h, 7), col, x * 0.6, 0.35 + h / 2, z * 0.6, z * tilt * 2, 0, -x * tilt * 2));
        g.push(colored(S(0.12, 6), '#ffd8c8', x * 0.6 + x * tilt, 0.35 + h, z * 0.6 + z * tilt));
      }
      r = 0.55;
      break;
    }
    case 'seafan':
      // A purple sea fan: a flat lacy disc on a short stem.
      s.push(colored(C(0.06, 0.1, 0.6, 6), '#5a3a6a', 0, 0.3));
      s.push(colored(new THREE.CircleGeometry(0.85, 14, 0, Math.PI), '#9a5ad8', 0, 0.6, 0, 0, 0, 0, 1, 1.3, 1));
      s.push(colored(new THREE.CircleGeometry(0.85, 14, 0, Math.PI), '#9a5ad8', 0, 0.6, 0, 0, Math.PI, 0, 1, 1.3, 1));
      g.push(colored(S(0.08, 6), '#ff9af0', 0.3, 1.2, 0.03));
      g.push(colored(S(0.08, 6), '#ff9af0', -0.4, 0.9, 0.03));
      r = 0.3;
      break;
    case 'kelp':
      // Seaweed: tall wavy blades (walk straight through them).
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2;
        s.push(colored(B(0.16, 1.1 + (i % 2) * 0.4, 0.03), i % 2 ? '#3a8a4a' : '#6a8a2a', Math.cos(a) * 0.25, 0.55 + (i % 2) * 0.2, Math.sin(a) * 0.25, Math.sin(a) * 0.2, a, Math.cos(a) * 0.2));
      }
      r = 0;
      break;
    case 'shell':
      // A giant spiral seashell, creamy pink.
      s.push(colored(K(0.45, 1.1, 10), '#ffe2cc', 0, 0.4, 0, 0, 0, Math.PI / 2 - 0.25));
      s.push(colored(S(0.42, 10), '#ffc8b0', 0.42, 0.42, 0, 0, 0, 0, 0.9, 1, 1));
      s.push(colored(new THREE.TorusGeometry(0.3, 0.07, 6, 12), '#e8a090', 0.55, 0.42, 0, 0, Math.PI / 2, 0));
      r = 0.5;
      break;
    case 'lighthouse': {
      // An old lighthouse, broken at the top: red and white bands, a balcony and an empty lamp room.
      const bands = 7;
      for (let i = 0; i < bands; i++) {
        const rb = 1.5 - i * 0.12;
        s.push(colored(C(rb - 0.12, rb, 1.15, 14), i % 2 ? '#d84a4a' : '#f4f0e8', 0, 0.575 + i * 1.15, 0));
      }
      const top = bands * 1.15;
      s.push(colored(C(1.05, 0.8, 0.25, 14), '#4a4a52', 0, top + 0.12, 0));
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        s.push(colored(B(0.12, 1.1, 0.12), '#4a4a52', Math.cos(a) * 0.62, top + 0.8, Math.sin(a) * 0.62));
      }
      // Half a roof, the rest blown away long ago.
      s.push(colored(K(0.85, 0.8, 14), '#3a3a42', 0.15, top + 1.65, 0, 0, 0, 0.35));
      g.push(colored(S(0.35, 10), '#fff2b0', 0, top + 0.8, 0));
      s.push(colored(B(0.6, 1.2, 0.08), '#5a3a2a', 0, 0.6, 1.5));
      r = 1.4;
      break;
    }
    case 'tidepost':
      // A tide gauge: a striped pole with a wave sign on top. Half a unit per stripe.
      for (let i = 0; i < 6; i++) s.push(colored(C(0.12, 0.12, 0.5, 8), i % 2 ? '#f4f0e8' : '#3a8ad8', 0, 0.25 + i * 0.5, 0));
      s.push(colored(B(0.7, 0.45, 0.06), '#f4f0e8', 0, 3.1, 0));
      g.push(colored(B(0.5, 0.08, 0.07), '#3fc8e0', 0, 3.1, 0.01));
      g.push(colored(B(0.5, 0.08, 0.07), '#3fc8e0', 0, 2.97, 0.01));
      r = 0.15;
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
