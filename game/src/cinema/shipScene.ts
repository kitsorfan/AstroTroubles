import * as THREE from 'three';

import { Rng } from '../core/math';
import { glowSprite } from '../entities/models';
import { Particles } from '../world/particles';
import type { Rig } from './director';
import { Leviathan } from './leviathan';

/** Canvas texture for a friendly ocean world with green continents and swirling clouds. */
function planetTextures(): [THREE.Texture, THREE.Texture] {
  const W = 1024;
  const H = 512;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const g = c.getContext('2d') as CanvasRenderingContext2D;
  const grad = g.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, '#dff4ff');
  grad.addColorStop(0.12, '#2a7ad8');
  grad.addColorStop(0.5, '#1d5fc0');
  grad.addColorStop(0.88, '#2a7ad8');
  grad.addColorStop(1, '#eef8ff');
  g.fillStyle = grad;
  g.fillRect(0, 0, W, H);
  const rng = new Rng(11);
  for (let i = 0; i < 22; i++) {
    const x = rng.next() * W;
    const y = H * 0.2 + rng.next() * H * 0.6;
    const blobs = 5 + Math.floor(rng.next() * 8);
    for (let k = 0; k < blobs; k++) {
      const r = 18 + rng.next() * 50;
      const bx = x + (rng.next() - 0.5) * 120;
      const by = y + (rng.next() - 0.5) * 60;
      const gg = g.createRadialGradient(bx, by, 0, bx, by, r);
      gg.addColorStop(0, rng.next() < 0.3 ? '#c8b070' : '#4aa84a');
      gg.addColorStop(0.7, '#3d9040');
      gg.addColorStop(1, 'rgba(61,144,64,0)');
      g.fillStyle = gg;
      for (const ox of [0, W, -W]) {
        g.beginPath();
        g.arc(bx + ox, by, r, 0, Math.PI * 2);
        g.fill();
      }
    }
  }
  const cc = document.createElement('canvas');
  cc.width = W;
  cc.height = H;
  const gc = cc.getContext('2d') as CanvasRenderingContext2D;
  for (let i = 0; i < 90; i++) {
    const x = rng.next() * W;
    const y = rng.next() * H;
    const r = 10 + rng.next() * 40;
    const gg = gc.createRadialGradient(x, y, 0, x, y, r);
    gg.addColorStop(0, 'rgba(255,255,255,0.8)');
    gg.addColorStop(1, 'rgba(255,255,255,0)');
    gc.fillStyle = gg;
    gc.fillRect(x - r * 2, y - r, r * 4, r * 2);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  const tc = new THREE.CanvasTexture(cc);
  tc.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = tc.wrapS = THREE.RepeatWrapping;
  return [t, tc];
}

/**
 * Deep space around the LEVIATHAN: the prologue, the rides between decks and both endings are
 * staged here.
 */
export class ShipScene {
  readonly scene = new THREE.Scene();
  readonly camera = new THREE.PerspectiveCamera(45, 16 / 9, 0.5, 4000);
  readonly ship = new Leviathan();
  readonly particles = new Particles(900);
  readonly star = new THREE.Group();
  readonly planet = new THREE.Group();
  readonly comet = new THREE.Group();
  private starLight: THREE.DirectionalLight;
  private flashLight = new THREE.PointLight('#ff9ae0', 0, 160, 1.4);
  private flashT = 0;
  private shakeAmt = 0;
  private clouds: THREE.Mesh;
  private starCore: THREE.Mesh;
  private t = 0;

  constructor() {
    const s = this.scene;
    s.background = new THREE.Color('#02030a');
    // Starfield and a soft nebula.
    const rng = new Rng(5);
    const n = 2600;
    const pos = new Float32Array(n * 3);
    const col = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const u = rng.next() * 2 - 1;
      const a = rng.next() * Math.PI * 2;
      const r = 2000;
      const q = Math.sqrt(1 - u * u);
      pos.set([Math.cos(a) * q * r, u * r, Math.sin(a) * q * r], i * 3);
      const c = new THREE.Color().setHSL(0.55 + rng.next() * 0.35, 0.5, 0.75 + rng.next() * 0.25);
      col.set([c.r, c.g, c.b], i * 3);
    }
    const sg = new THREE.BufferGeometry();
    sg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    sg.setAttribute('color', new THREE.BufferAttribute(col, 3));
    s.add(new THREE.Points(sg, new THREE.PointsMaterial({ size: 2, sizeAttenuation: false, vertexColors: true, fog: false })));
    for (let i = 0; i < 7; i++) {
      const neb = glowSprite(['#3a1a6a', '#1a2a6a', '#5a1a4a'][i % 3], 900 + rng.next() * 700, 0.28);
      neb.position.set((rng.next() - 0.5) * 3000, (rng.next() - 0.5) * 1200, -1400 - rng.next() * 400);
      s.add(neb);
    }

    s.add(new THREE.HemisphereLight('#8aa0ff', '#1a1030', 0.5));
    const rim = new THREE.DirectionalLight('#6fa8ff', 0.9);
    rim.position.set(-60, 40, 80);
    s.add(rim);
    this.starLight = new THREE.DirectionalLight('#ffd0a0', 2.4);
    s.add(this.starLight, this.starLight.target);
    s.add(this.flashLight);

    // The star.
    this.starCore = new THREE.Mesh(new THREE.SphereGeometry(40, 40, 24), new THREE.MeshBasicMaterial({ color: '#fff0c8', toneMapped: false }));
    this.star.add(this.starCore);
    for (const [c, size, o] of [
      ['#ffcf7a', 190, 0.95],
      ['#ff8a3a', 420, 0.6],
      ['#ff5a2a', 800, 0.3],
    ] as const) {
      this.star.add(glowSprite(c, size, o));
    }
    s.add(this.star);

    // The new home world for the endings.
    const [map, cloudMap] = planetTextures();
    this.planet.add(new THREE.Mesh(new THREE.SphereGeometry(90, 64, 40), new THREE.MeshStandardMaterial({ map, roughness: 0.8, metalness: 0 })));
    this.clouds = new THREE.Mesh(new THREE.SphereGeometry(91.5, 64, 40), new THREE.MeshStandardMaterial({ map: cloudMap, transparent: true, depthWrite: false, opacity: 0.9 }));
    this.planet.add(this.clouds);
    this.planet.add(glowSprite('#7fc8ff', 260, 0.45));
    this.planet.visible = false;
    s.add(this.planet);

    // The Bloom seed: a pink fireball with a long tail.
    const head = new THREE.Mesh(new THREE.SphereGeometry(1.8, 20, 14), new THREE.MeshBasicMaterial({ color: '#ffd6f4', toneMapped: false }));
    this.comet.add(head, glowSprite('#ff4fd8', 16, 0.95));
    const tail = new THREE.Mesh(
      new THREE.ConeGeometry(2.4, 44, 16, 1, true).translate(0, -22, 0).rotateZ(Math.PI / 2),
      new THREE.MeshBasicMaterial({ color: '#ff5fd0', transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, toneMapped: false }),
    );
    tail.position.x = -1;
    this.comet.add(tail);
    this.comet.visible = false;
    s.add(this.comet);

    s.add(this.ship.group);
    this.particles.setViewportHeight(window.innerHeight);
    s.add(this.particles.points);
    this.setChapter(0);
  }

  /** How close the star is and how far the Bloom has spread. 0 = before the seed, 6 = the Bridge. */
  setChapter(ch: number) {
    const d = 1500 - ch * 190;
    this.setStar(d);
    this.ship.setGrowth(ch === 0 ? 0 : 0.35 + ch * 0.11);
  }

  /** Places the star straight ahead of the ship's nose (world +X, slightly up) at a distance. */
  setStar(distance: number) {
    this.star.position.set(distance, distance * 0.08, -distance * 0.18);
    const near = THREE.MathUtils.clamp(1 - (distance - 300) / 1200, 0, 1);
    this.starLight.intensity = 1.6 + near * 2.4;
    this.starLight.position.copy(this.star.position);
    this.starLight.target.position.set(0, 0, 0);
  }

  get starDistance() {
    return this.star.position.x;
  }

  flash(x: number, y: number, z: number, color: string, power = 400) {
    this.flashLight.position.set(x, y, z);
    this.flashLight.color.set(color);
    this.flashLight.intensity = power;
    this.flashT = 1;
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
    this.ship.update(dt);
    this.particles.update(dt);
    this.starCore.scale.setScalar(1 + Math.sin(this.t * 2.2) * 0.01);
    this.clouds.rotation.y += dt * 0.01;
    this.planet.rotation.y += dt * 0.004;
    this.flashT = Math.max(0, this.flashT - dt * 1.6);
    this.flashLight.intensity *= this.flashT > 0 ? 0.9 : 0;
    const c = this.camera;
    c.position.copy(rig.pos);
    if (this.shakeAmt > 0) {
      c.position.x += (Math.random() - 0.5) * this.shakeAmt;
      c.position.y += (Math.random() - 0.5) * this.shakeAmt;
      c.position.z += (Math.random() - 0.5) * this.shakeAmt;
      this.shakeAmt = Math.max(0, this.shakeAmt - dt * 3);
    }
    if (c.fov !== rig.fov) {
      c.fov = rig.fov;
      c.updateProjectionMatrix();
    }
    c.lookAt(rig.look);
  }
}
