import * as THREE from 'three';

import { glowSprite } from '../entities/models';
import { makeArgo, type ArgoModel } from '../vehicles/argoModel';
import { makeGasGiant, makeStarSky, rockGeometry, rockMaterial, type GasGiant } from '../vehicles/space';
import { Particles } from '../world/particles';
import type { Rig } from './director';

/**
 * Chapter 3's space: the gas giant next door to Gaia Nova with its ring of moons (Colchis among
 * them), the Argo, a scattering of asteroids, and Aeëtes's huge golden salvage ships. The Chapter 3
 * opening and the hops between its levels are staged here.
 */

/**
 * One of Aeëtes's salvage ships: a long golden hull like a giant beetle, with a glowing amber bridge,
 * claw cranes for grabbing wrecks underneath, and a big "A" crest. Points along -Z, about 60 long.
 */
export function makeGoldShip(): THREE.Group {
  const g = new THREE.Group();
  const gold = new THREE.MeshStandardMaterial({ color: '#f0c050', roughness: 0.22, metalness: 0.9, emissive: '#3a2400', emissiveIntensity: 0.4 });
  const dark = new THREE.MeshStandardMaterial({ color: '#2a2230', roughness: 0.4, metalness: 0.7 });
  const hull = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 16), gold);
  hull.scale.set(9, 5, 30);
  g.add(hull);
  const spine = new THREE.Mesh(new THREE.BoxGeometry(3, 3, 44), dark);
  spine.position.y = 4.5;
  g.add(spine);
  const bridge = new THREE.Mesh(new THREE.SphereGeometry(3.2, 20, 12), new THREE.MeshStandardMaterial({ color: '#ffb020', emissive: '#ff9a00', emissiveIntensity: 1.2, roughness: 0.2 }));
  bridge.position.set(0, 4.8, -20);
  bridge.scale.set(1.2, 0.7, 1.4);
  g.add(bridge);
  for (const s of [-1, 1]) {
    for (let i = 0; i < 3; i++) {
      const arm = new THREE.Mesh(new THREE.BoxGeometry(1.2, 9, 1.2), dark);
      arm.position.set(s * 6, -7, -12 + i * 12);
      arm.rotation.z = s * 0.4;
      g.add(arm);
      const claw = new THREE.Mesh(new THREE.ConeGeometry(1.4, 3.5, 5), gold);
      claw.position.set(s * 8, -11.5, -12 + i * 12);
      claw.rotation.z = Math.PI;
      g.add(claw);
    }
    const fin = new THREE.Mesh(new THREE.BoxGeometry(14, 0.8, 10), gold);
    fin.position.set(s * 13, 0, 16);
    fin.rotation.z = s * -0.25;
    g.add(fin);
  }
  // The crest: a big "A" on the side, lit up like a shop sign.
  const sign = new THREE.MeshBasicMaterial({ color: '#fff2b0' });
  for (const s of [-1, 1]) {
    const a = new THREE.Group();
    const l1 = new THREE.Mesh(new THREE.BoxGeometry(0.4, 7, 0.8), sign);
    l1.position.x = -1.3;
    l1.rotation.z = -0.35;
    const l2 = l1.clone();
    l2.position.x = 1.3;
    l2.rotation.z = 0.35;
    const bar = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.4, 0.8), sign);
    bar.position.y = -1;
    a.add(l1, l2, bar);
    a.position.set(s * 9.1, 0, 2);
    a.rotation.y = (s * Math.PI) / 2;
    g.add(a);
  }
  for (const s of [-1, 1]) {
    const e = glowSprite('#ffb020', 14, 0.9);
    e.position.set(s * 4, 0, 31);
    g.add(e);
  }
  return g;
}

export class MoonScene {
  readonly scene = new THREE.Scene();
  readonly camera = new THREE.PerspectiveCamera(45, 16 / 9, 0.5, 6000);
  readonly particles = new Particles(900);
  readonly giant: GasGiant;
  readonly argo: ArgoModel;
  /** Aeëtes's fleet (hidden until he shows up). */
  readonly fleet: THREE.Group[] = [];
  private shakeAmt = 0;
  private t = 0;
  /** How fast the Argo's oars row and its engines burn (0..1). */
  thrust = 0.4;

  constructor() {
    const s = this.scene;
    s.background = new THREE.Color('#03040e');
    s.add(makeStarSky(3000, 8));
    s.add(new THREE.HemisphereLight('#d8d0ff', '#1a1030', 0.7));
    const sun = new THREE.DirectionalLight('#fff0d8', 2.4);
    sun.position.set(600, 300, 500);
    s.add(sun);
    this.giant = makeGasGiant();
    this.giant.group.position.set(-300, -60, -1500);
    this.giant.group.scale.setScalar(420);
    s.add(this.giant.group);
    const mat = rockMaterial();
    for (let i = 0; i < 40; i++) {
      const r = new THREE.Mesh(rockGeometry(100 + i, 1), mat);
      const a = i * 2.4;
      r.position.set(Math.cos(a) * (80 + i * 9), Math.sin(i * 1.7) * 30, -200 - i * 22);
      r.scale.setScalar(2 + (i % 5) * 1.6);
      r.rotation.set(i, i * 0.7, 0);
      s.add(r);
    }
    this.argo = makeArgo();
    s.add(this.argo.root);
    for (let i = 0; i < 3; i++) {
      const f = makeGoldShip();
      f.visible = false;
      s.add(f);
      this.fleet.push(f);
    }
    this.particles.setViewportHeight(window.innerHeight);
    s.add(this.particles.points);
  }

  shake(a: number) {
    this.shakeAmt = Math.max(this.shakeAmt, a);
  }

  resize(w: number, h: number) {
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.particles.setViewportHeight(h);
  }

  update(dt: number, rig: Rig) {
    this.t += dt;
    this.argo.update(this.t, this.thrust);
    this.giant.update(dt);
    this.particles.update(dt);
    const c = this.camera;
    c.position.copy(rig.pos);
    if (this.shakeAmt > 0) {
      c.position.x += (Math.random() - 0.5) * this.shakeAmt;
      c.position.y += (Math.random() - 0.5) * this.shakeAmt;
      this.shakeAmt = Math.max(0, this.shakeAmt - dt * 3);
    }
    if (c.fov !== rig.fov) {
      c.fov = rig.fov;
      c.updateProjectionMatrix();
    }
    c.lookAt(rig.look);
  }
}
