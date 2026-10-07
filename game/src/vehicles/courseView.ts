import * as THREE from 'three';

import { glowSprite } from '../entities/models';
import { CLASH, clashState, type Clash, type CourseThing } from './course';
import { rockGeometry, rockMaterial } from './space';

/**
 * Draws the stretch of the course in front of the Argo: asteroids, crystals, bolts, rings, the
 * Clashing Rocks, the checkpoint beacons and the gate of the moons. Everything sits at world z =
 * -(its s - the Argo's s), so the course streams toward the camera while the Argo stays near the origin.
 */

/** How far ahead (and behind) things are drawn. */
const AHEAD = 330;
const BEHIND = 16;

/** First index in a list sorted by `s` whose s is >= v. */
export function lowerBound(things: CourseThing[], v: number): number {
  let lo = 0;
  let hi = things.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (things[mid].s < v) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

interface ClashView {
  c: Clash;
  group: THREE.Group;
  a: THREE.Mesh;
  b: THREE.Mesh;
  mat: THREE.MeshStandardMaterial;
  glows: THREE.Sprite[];
}

export class CourseView {
  readonly group = new THREE.Group();
  private rockSets: THREE.InstancedMesh[];
  private crystals: THREE.InstancedMesh;
  private bolts: THREE.InstancedMesh;
  private rings: THREE.Mesh[] = [];
  private clashes: ClashView[] = [];
  private beacons: { s: number; obj: THREE.Group; lit: THREE.MeshBasicMaterial }[] = [];
  private gate: { s: number; obj: THREE.Group; disc: THREE.Mesh } | null = null;
  private m = new THREE.Matrix4();
  private q = new THREE.Quaternion();
  private e = new THREE.Euler();
  private p = new THREE.Vector3();
  private sc = new THREE.Vector3();

  constructor(private things: CourseThing[]) {
    const mat = rockMaterial();
    this.rockSets = [1, 2, 3].map((seed) => {
      const im = new THREE.InstancedMesh(rockGeometry(seed * 7), mat, 90);
      im.frustumCulled = false;
      im.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      return im;
    });
    this.crystals = new THREE.InstancedMesh(
      new THREE.OctahedronGeometry(1, 0),
      new THREE.MeshStandardMaterial({ color: '#ff8ae0', emissive: '#ff4fc0', emissiveIntensity: 0.9, roughness: 0.15, metalness: 0.3, flatShading: true }),
      40,
    );
    this.bolts = new THREE.InstancedMesh(
      new THREE.CylinderGeometry(0.42, 0.42, 0.14, 6).rotateX(Math.PI / 2),
      new THREE.MeshStandardMaterial({ color: '#ffd166', emissive: '#ffb020', emissiveIntensity: 0.6, roughness: 0.25, metalness: 0.8 }),
      90,
    );
    for (const im of [...this.rockSets, this.crystals, this.bolts]) {
      im.frustumCulled = false;
      im.count = 0;
      this.group.add(im);
    }
    const ringG = new THREE.TorusGeometry(2.3, 0.2, 10, 44);
    const ringM = new THREE.MeshStandardMaterial({ color: '#ffd166', emissive: '#ffb020', emissiveIntensity: 1.1, roughness: 0.2, metalness: 0.7 });
    for (let i = 0; i < 18; i++) {
      const r = new THREE.Mesh(ringG, ringM);
      r.add(glowSprite('#ffd166', 6, 0.25));
      r.visible = false;
      this.rings.push(r);
      this.group.add(r);
    }
    for (const th of things) {
      if (th.kind === 'clash') this.clashes.push(this.makeClash(th));
      else if (th.kind === 'checkpoint') this.beacons.push(this.makeBeacon(th.s));
      else if (th.kind === 'gate') this.gate = this.makeGate(th.s);
    }
  }

  private makeClash(c: Clash): ClashView {
    const group = new THREE.Group();
    const mat = new THREE.MeshStandardMaterial({ color: '#8a7a6a', roughness: 0.85, flatShading: true, emissive: '#ff5a1a', emissiveIntensity: 0 });
    const seed = Math.round(c.s);
    const a = new THREE.Mesh(rockGeometry(seed, 2), mat);
    const b = new THREE.Mesh(rockGeometry(seed + 1, 2), mat);
    for (const m of [a, b]) {
      if (c.axis === 'x') m.scale.set(8, 13, CLASH.depth / 2);
      else m.scale.set(16, 7, CLASH.depth / 2);
      group.add(m);
    }
    const glows = [0, 1].map(() => {
      const g = glowSprite('#ff7a2a', 9, 0);
      group.add(g);
      return g;
    });
    group.visible = false;
    this.group.add(group);
    return { c, group, a, b, mat, glows };
  }

  /** A checkpoint beacon: a big hoop of light around the corridor, cyan until the Argo passes it. */
  private makeBeacon(s: number) {
    const obj = new THREE.Group();
    const lit = new THREE.MeshBasicMaterial({ color: '#5ee0ff', transparent: true, opacity: 0.85 });
    const hoop = new THREE.Mesh(new THREE.TorusGeometry(12, 0.25, 8, 64), lit);
    hoop.scale.y = 0.62;
    obj.add(hoop);
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const lamp = glowSprite('#bff4ff', 3.2, 0.8);
      lamp.position.set(Math.cos(a) * 12, Math.sin(a) * 12 * 0.62, 0);
      obj.add(lamp);
    }
    obj.visible = false;
    this.group.add(obj);
    return { s, obj, lit };
  }

  /** The gate of the moons: a ring of ancient standing stones glowing with Celestia's light-words. */
  private makeGate(s: number) {
    const obj = new THREE.Group();
    const stone = new THREE.MeshStandardMaterial({ color: '#d8d0c0', roughness: 0.8, flatShading: true });
    const colors = ['#5e9bff', '#ff6fcf', '#ffd166'];
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      const pillar = new THREE.Mesh(new THREE.BoxGeometry(2.2, 5.5, 2.2), stone);
      pillar.position.set(Math.cos(a) * 15, Math.sin(a) * 11, 0);
      pillar.rotation.z = a + Math.PI / 2;
      obj.add(pillar);
      const glyph = new THREE.Mesh(new THREE.CircleGeometry(0.7, 12), new THREE.MeshBasicMaterial({ color: colors[i % 3] }));
      glyph.position.set(Math.cos(a) * 13.85, Math.sin(a) * 10.1, 0.2);
      obj.add(glyph);
      const g = glowSprite(colors[i % 3], 5, 0.7);
      g.position.copy(glyph.position);
      obj.add(g);
    }
    const disc = new THREE.Mesh(
      new THREE.CircleGeometry(14, 48),
      new THREE.MeshBasicMaterial({ color: '#ffe6a0', transparent: true, opacity: 0.12, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }),
    );
    disc.scale.y = 0.75;
    obj.add(disc);
    obj.visible = false;
    this.group.add(obj);
    return { s, obj, disc };
  }

  /** Places everything for the Argo at distance `s` at time `t`; `gone` holds the things already taken or broken. */
  update(s: number, t: number, gone: Set<number>) {
    const things = this.things;
    const counts = [0, 0, 0];
    let nc = 0;
    let nb = 0;
    let nr = 0;
    for (let i = lowerBound(things, s - BEHIND); i < things.length; i++) {
      const th = things[i];
      const rel = th.s - s;
      if (rel > AHEAD) break;
      if (gone.has(i)) continue;
      if (th.kind === 'rock') {
        const set = i % 3;
        if (counts[set] >= 90) continue;
        this.e.set(i * 1.7 + t * 0.15 * ((i % 2) * 2 - 1), i * 0.9 + t * 0.1, i * 0.3);
        this.m.compose(this.p.set(th.x, th.y, -rel), this.q.setFromEuler(this.e), this.sc.setScalar(th.r));
        this.rockSets[set].setMatrixAt(counts[set]++, this.m);
      } else if (th.kind === 'crystal' && nc < 40) {
        this.e.set(0.3, t * 1.4 + i, 0.2);
        this.m.compose(this.p.set(th.x, th.y, -rel), this.q.setFromEuler(this.e), this.sc.set(0.9, 1.4, 0.9));
        this.crystals.setMatrixAt(nc++, this.m);
      } else if (th.kind === 'bolt' && nb < 90) {
        this.e.set(0, t * 3 + i, 0);
        this.m.compose(this.p.set(th.x, th.y + Math.sin(t * 3 + i) * 0.15, -rel), this.q.setFromEuler(this.e), this.sc.setScalar(1));
        this.bolts.setMatrixAt(nb++, this.m);
      } else if (th.kind === 'ring' && nr < this.rings.length) {
        const r = this.rings[nr++];
        r.visible = true;
        r.position.set(th.x, th.y, -rel);
        r.rotation.z = t * 0.6 + i;
      }
    }
    this.rockSets.forEach((im, k) => {
      im.count = counts[k];
      im.instanceMatrix.needsUpdate = true;
    });
    this.crystals.count = nc;
    this.crystals.instanceMatrix.needsUpdate = true;
    this.bolts.count = nb;
    this.bolts.instanceMatrix.needsUpdate = true;
    for (let i = nr; i < this.rings.length; i++) this.rings[i].visible = false;

    for (const v of this.clashes) {
      const rel = v.c.s - s;
      v.group.visible = rel > -CLASH.depth - 10 && rel < AHEAD;
      if (!v.group.visible) continue;
      const st = clashState(v.c, t);
      // A rumble you can see: the rocks shiver and glow hotter and hotter before they slam.
      const jitter = st.warn > 0 && st.gap > 0.5 ? Math.sin(t * 60) * 0.25 * st.warn : 0;
      const reach = (v.c.axis === 'x' ? 7.4 : 6.6) + st.gap;
      v.group.position.set(0, 0, -rel);
      if (v.c.axis === 'x') {
        v.a.position.set(-reach + jitter, 0, 0);
        v.b.position.set(reach - jitter, 0, 0);
      } else {
        v.a.position.set(0, -reach + jitter, 0);
        v.b.position.set(0, reach - jitter, 0);
      }
      v.a.rotation.z = 0.15 + Math.sin(t * 0.3) * 0.02;
      v.b.rotation.z = -0.2 + Math.cos(t * 0.3) * 0.02;
      v.mat.emissiveIntensity = st.warn * 0.9;
      v.glows.forEach((g, k) => {
        const side = k ? 1 : -1;
        g.position.set(v.c.axis === 'x' ? side * (st.gap + 0.5) : 0, v.c.axis === 'y' ? side * (st.gap + 0.5) : 0, 0);
        g.material.opacity = st.warn * 0.9;
        g.scale.setScalar(6 + st.warn * 6);
      });
    }
    for (const b of this.beacons) {
      const rel = b.s - s;
      b.obj.visible = rel > -20 && rel < AHEAD;
      b.obj.position.set(0, 0, -rel);
      b.obj.rotation.z = t * 0.3;
      b.lit.color.set(rel < 0 ? '#ffd166' : '#5ee0ff');
    }
    if (this.gate) {
      const rel = this.gate.s - s;
      this.gate.obj.visible = rel > -30 && rel < AHEAD + 120;
      this.gate.obj.position.set(0, 0, -rel);
      this.gate.obj.rotation.z = t * 0.08;
      (this.gate.disc.material as THREE.MeshBasicMaterial).opacity = 0.1 + Math.sin(t * 2) * 0.05;
    }
  }

  /** The clash pairs drawn right now (for the dust and rumble effects). */
  get visibleClashes(): Clash[] {
    return this.clashes.filter((v) => v.group.visible).map((v) => v.c);
  }
}
