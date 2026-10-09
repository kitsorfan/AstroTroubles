import * as THREE from 'three';

import { glowSprite } from '../../entities/models';
import { rockGeometry, rockMaterial } from '../space';
import { DIVE, type DiveThing, type Door } from './dive';
import type { BuoyState } from './swim';
import { makeBuoy, type BuoyModel } from './subModel';

/**
 * Draws the stretch of the dive in front of the Dolphin: reefs with coral, kelp, sunken Gardener columns,
 * gold rings, bolts, hidden pearls (only while a PING lights them), Gardener gates, siren buoys and the
 * checkpoint lanterns. Like the Argo's course view, everything sits at world z = -(its s - the sub's s).
 */

const AHEAD = 150;
const CORAL = ['#ff7a8a', '#ffb84a', '#c87aff', '#ff9ad8'].map((c) => new THREE.Color(c));
const BEHIND = 8;
/** The seabed, in corridor y. */
export const SEABED = -DIVE.halfH - 2;

/** First index in a list sorted by `s` whose s is >= v. */
export function firstAt(things: { s: number }[], v: number): number {
  let lo = 0;
  let hi = things.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (things[mid].s < v) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

interface DoorView {
  d: Door;
  group: THREE.Group;
  /** One light-membrane per doorway, and the frame glows. */
  skins: THREE.MeshBasicMaterial[];
  frames: THREE.MeshBasicMaterial[];
}

interface BeaconView {
  s: number;
  group: THREE.Group;
  orb: THREE.MeshBasicMaterial;
}

/** The wall of a Gardener gate: old stone across the whole corridor, with its round doorways cut out. */
function gateWall(d: Door): THREE.BufferGeometry {
  const w = DIVE.halfW + 9;
  const shape = new THREE.Shape();
  shape.moveTo(-w, SEABED - 1);
  shape.lineTo(w, SEABED - 1);
  shape.lineTo(w, DIVE.halfH + 7);
  shape.lineTo(-w, DIVE.halfH + 7);
  shape.closePath();
  for (const [x, y] of d.holes) {
    const hole = new THREE.Path();
    hole.absarc(x, y, DIVE.doorR + 0.25, 0, Math.PI * 2, true);
    shape.holes.push(hole);
  }
  return new THREE.ExtrudeGeometry(shape, { depth: 1.6, bevelEnabled: false, curveSegments: 28 }).translate(0, 0, -0.8);
}

export class SeaView {
  readonly group = new THREE.Group();
  private rocks: THREE.InstancedMesh[];
  private corals: THREE.InstancedMesh;
  private kelp: THREE.InstancedMesh;
  private pillars: THREE.InstancedMesh;
  private bolts: THREE.InstancedMesh;
  private pearls: THREE.InstancedMesh;
  private rings: THREE.Mesh[] = [];
  private doors: DoorView[] = [];
  private beacons: BeaconView[] = [];
  readonly buoys = new Map<BuoyState, BuoyModel>();
  private m = new THREE.Matrix4();
  private q = new THREE.Quaternion();
  private e = new THREE.Euler();
  private p = new THREE.Vector3();
  private sc = new THREE.Vector3();

  constructor(private things: DiveThing[]) {
    const mat = rockMaterial('#5e7480');
    this.rocks = [1, 2, 3].map((seed) => new THREE.InstancedMesh(rockGeometry(seed * 5 + 2), mat, 60));
    this.corals = new THREE.InstancedMesh(new THREE.DodecahedronGeometry(0.5, 0), new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.7, emissive: '#ff6a7a', emissiveIntensity: 0.12 }), 200);
    const kelpG = new THREE.PlaneGeometry(0.9, 1, 1, 8).translate(0, 0.5, 0);
    this.kelp = new THREE.InstancedMesh(kelpG, new THREE.MeshStandardMaterial({ color: '#3f9a4a', emissive: '#1a4a20', emissiveIntensity: 0.3, roughness: 0.8, side: THREE.DoubleSide }), 160);
    const colG = new THREE.CylinderGeometry(1, 1.1, 1, 12).translate(0, 0.5, 0);
    this.pillars = new THREE.InstancedMesh(colG, new THREE.MeshStandardMaterial({ color: '#a8c0b8', roughness: 0.85, flatShading: true }), 30);
    this.bolts = new THREE.InstancedMesh(
      new THREE.CylinderGeometry(0.42, 0.42, 0.14, 6).rotateX(Math.PI / 2),
      new THREE.MeshStandardMaterial({ color: '#ffd166', emissive: '#ffb020', emissiveIntensity: 0.6, roughness: 0.25, metalness: 0.8 }),
      60,
    );
    this.pearls = new THREE.InstancedMesh(new THREE.SphereGeometry(0.5, 16, 12), new THREE.MeshStandardMaterial({ color: '#fff4fb', emissive: '#ffb0e0', emissiveIntensity: 0.9, roughness: 0.15, metalness: 0.2 }), 20);
    for (const im of [...this.rocks, this.corals, this.kelp, this.pillars, this.bolts, this.pearls]) {
      im.frustumCulled = false;
      im.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      im.count = 0;
      this.group.add(im);
    }
    this.corals.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(200 * 3), 3);
    const ringG = new THREE.TorusGeometry(2.2, 0.2, 10, 40);
    const ringM = new THREE.MeshStandardMaterial({ color: '#ffd166', emissive: '#ffb020', emissiveIntensity: 1.1, roughness: 0.2, metalness: 0.7 });
    for (let i = 0; i < 14; i++) {
      const r = new THREE.Mesh(ringG, ringM);
      r.add(glowSprite('#ffd166', 5.5, 0.22));
      r.visible = false;
      this.rings.push(r);
      this.group.add(r);
    }
    for (const t of things) {
      if (t.kind === 'door') this.doors.push(this.makeDoor(t));
      else if (t.kind === 'checkpoint') this.beacons.push(this.makeBeacon(t.s));
    }
  }

  private makeDoor(d: Door): DoorView {
    const group = new THREE.Group();
    const wall = new THREE.Mesh(gateWall(d), new THREE.MeshStandardMaterial({ color: '#7f9c98', roughness: 0.9, flatShading: true }));
    group.add(wall);
    const skins: THREE.MeshBasicMaterial[] = [];
    const frames: THREE.MeshBasicMaterial[] = [];
    for (const [x, y] of d.holes) {
      const frame = new THREE.MeshBasicMaterial({ color: '#4ae0d8' });
      const ring = new THREE.Mesh(new THREE.TorusGeometry(DIVE.doorR + 0.25, 0.22, 8, 36), frame);
      ring.position.set(x, y, 0.85);
      const skin = new THREE.MeshBasicMaterial({ color: '#2a8a9a', transparent: true, opacity: 0.55, depthWrite: false, side: THREE.DoubleSide });
      const disc = new THREE.Mesh(new THREE.CircleGeometry(DIVE.doorR + 0.25, 32), skin);
      disc.position.set(x, y, 0);
      // Gardener light-words round each doorway.
      for (let k = 0; k < 6; k++) {
        const a = (k / 6) * Math.PI * 2;
        const word = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.18, 0.1), frame);
        word.position.set(x + Math.cos(a) * (DIVE.doorR + 0.9), y + Math.sin(a) * (DIVE.doorR + 0.9), 0.85);
        word.rotation.z = a;
        group.add(word);
      }
      group.add(ring, disc);
      skins.push(skin);
      frames.push(frame);
    }
    group.visible = false;
    this.group.add(group);
    return { d, group, skins, frames };
  }

  private makeBeacon(s: number): BeaconView {
    const group = new THREE.Group();
    const orb = new THREE.MeshBasicMaterial({ color: '#4ae0d8' });
    for (const side of [-1, 1]) {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.7, DIVE.halfH * 2 + 4, 8), new THREE.MeshStandardMaterial({ color: '#a8c0b8', roughness: 0.85, flatShading: true }));
      post.position.set(side * (DIVE.halfW + 1.5), SEABED + DIVE.halfH + 2, 0);
      const ball = new THREE.Mesh(new THREE.SphereGeometry(0.9, 14, 10), orb);
      ball.position.set(side * (DIVE.halfW + 1.5), DIVE.halfH + 3.5, 0);
      ball.add(glowSprite('#4ae0d8', 6, 0.6));
      group.add(post, ball);
    }
    group.visible = false;
    this.group.add(group);
    return { s, group, orb };
  }

  /** Adds a buoy's model (the course's buoys, and the ones the Siren Organ raises). */
  addBuoy(b: BuoyState): BuoyModel {
    const m = makeBuoy();
    m.root.visible = false;
    this.group.add(m.root);
    this.buoys.set(b, m);
    return m;
  }

  removeBuoy(b: BuoyState) {
    const m = this.buoys.get(b);
    if (m) this.group.remove(m.root);
    this.buoys.delete(b);
  }

  private place(im: THREE.InstancedMesh, i: number, x: number, y: number, z: number, sx: number, sy = sx, sz = sx, rx = 0, ry = 0, rz = 0) {
    this.q.setFromEuler(this.e.set(rx, ry, rz));
    this.m.compose(this.p.set(x, y, z), this.q, this.sc.set(sx, sy, sz));
    im.setMatrixAt(i, this.m);
  }

  /** Draws everything near distance `s` at time `t`; `reveal` (0..1) is how brightly the last PING still glows. */
  update(s: number, t: number, gone: Set<number>, reveal: number, singer: BuoyState | null, passedBeacons: (b: number) => boolean) {
    const things = this.things;
    const n = { rocks: [0, 0, 0], coral: 0, kelp: 0, pillar: 0, bolt: 0, pearl: 0, ring: 0 };
    for (let i = firstAt(things, s - BEHIND); i < things.length; i++) {
      const th = things[i];
      if (th.s > s + AHEAD) break;
      if (gone.has(i)) continue;
      const z = -(th.s - s);
      switch (th.kind) {
        case 'rock': {
          const set = i % 3;
          if (n.rocks[set] >= 60) break;
          this.place(this.rocks[set], n.rocks[set]++, th.x, th.y, z, th.r, th.r * 0.8, th.r, i, i * 0.7, 0);
          // A couple of coral tufts on top of each rock.
          for (let k = 0; k < 2 && n.coral < 200; k++) {
            const cx = th.x + (k ? -0.4 : 0.5) * th.r;
            this.place(this.corals, n.coral, cx, th.y + th.r * 0.7, z + (k ? 0.3 : -0.3) * th.r, 0.5 + th.r * 0.25, 1 + th.r * 0.4, 0.5 + th.r * 0.25, 0, i, 0);
            this.corals.setColorAt(n.coral++, CORAL[(i + k) % 4]);
          }
          break;
        }
        case 'kelp': {
          if (n.kelp >= 160) break;
          const h = th.top - SEABED;
          const sway = Math.sin(t * 1.3 + th.s * 0.21) * 0.12;
          this.place(this.kelp, n.kelp++, th.x, SEABED, z, 1, h, 1, 0, th.s, sway);
          if (n.kelp < 160) this.place(this.kelp, n.kelp++, th.x + 0.3, SEABED, z + 0.4, 0.8, h * 0.8, 0.8, 0, th.s + 1.2, -sway);
          break;
        }
        case 'pillar':
          if (n.pillar < 30) this.place(this.pillars, n.pillar++, th.x, SEABED - 1, z, th.r, DIVE.halfH * 2 + 9, th.r, 0, 0, 0);
          break;
        case 'bolt':
          if (n.bolt < 60) this.place(this.bolts, n.bolt++, th.x, th.y, z, 1, 1, 1, 0, t * 3 + th.s, 0);
          break;
        case 'pearl':
          if (reveal > 0 && n.pearl < 20) this.place(this.pearls, n.pearl++, th.x, th.y + Math.sin(t * 2 + th.s) * 0.15, z, 0.6 + reveal * 0.4);
          break;
        case 'ring': {
          const r = this.rings[n.ring++];
          if (!r) break;
          r.visible = true;
          r.position.set(th.x, th.y, z);
          r.rotation.z = t * 0.6 + th.s;
          break;
        }
      }
    }
    this.rocks.forEach((im, k) => {
      im.count = n.rocks[k];
      im.instanceMatrix.needsUpdate = true;
    });
    for (const [im, c] of [
      [this.corals, n.coral],
      [this.kelp, n.kelp],
      [this.pillars, n.pillar],
      [this.bolts, n.bolt],
      [this.pearls, n.pearl],
    ] as [THREE.InstancedMesh, number][]) {
      im.count = c;
      im.instanceMatrix.needsUpdate = true;
    }
    if (this.corals.instanceColor) this.corals.instanceColor.needsUpdate = true;
    for (let i = n.ring; i < this.rings.length; i++) this.rings[i].visible = false;

    // Gardener gates: the light-membranes all look alike until a PING shows the open doorway.
    for (const v of this.doors) {
      const rel = v.d.s - s;
      v.group.visible = rel < AHEAD && rel > -BEHIND;
      if (!v.group.visible) continue;
      v.group.position.z = -rel;
      v.d.holes.forEach((_, k) => {
        const open = k === v.d.open;
        const lit = reveal > 0;
        v.skins[k].opacity = lit && open ? 0.04 : 0.55;
        v.skins[k].color.set(lit ? (open ? '#7dff9a' : '#ff8a4a') : '#2a8a9a');
        v.frames[k].color.set(lit ? (open ? '#7dff9a' : '#ff7a3a') : '#4ae0d8');
      });
    }
    for (const b of this.beacons) {
      const rel = b.s - s;
      b.group.visible = rel < AHEAD && rel > -BEHIND;
      b.group.position.z = -rel;
      b.orb.color.set(passedBeacons(b.s) ? '#ffd166' : '#4ae0d8');
    }
    for (const [st, m] of this.buoys) {
      const rel = st.b.s - s;
      m.root.visible = rel < AHEAD && rel > -BEHIND;
      if (!m.root.visible) continue;
      m.root.position.set(st.b.x, st.b.y, -rel);
      m.update(t, singer === st, !!st.quiet);
    }
  }
}
