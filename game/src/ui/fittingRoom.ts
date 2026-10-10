import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

import type { OutfitHero, SaveData } from '../core/save';
import { dressAtalanta, makeAtalanta } from '../entities/heroes/atalantaModel';
import { dressJason, makeJason, type HeroModel } from '../entities/models';

/**
 * The shop's fitting room: a small 3D view of a hero wearing an outfit (with the gear they have
 * bought), turning slowly, so you can see it all round before buying. It has its own little WebGL
 * canvas and is thrown away (`dispose`) when it closes; the models share the game's cached materials.
 */
export class FittingRoom {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(30, 1, 0.1, 50);
  private model: HeroModel;
  private raf = 0;
  private t = 0;
  private last = performance.now();

  constructor(canvas: HTMLCanvasElement, hero: OutfitHero, outfit: string | undefined, save: SaveData) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 0.95;
    this.renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    this.renderer.setSize(canvas.clientWidth || 200, canvas.clientHeight || 220, false);
    this.camera.aspect = (canvas.clientWidth || 200) / (canvas.clientHeight || 220);
    this.camera.position.set(0, 1.3, 4.8);
    this.camera.lookAt(0, 1.1, 0);
    this.camera.updateProjectionMatrix();
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    this.scene.environmentIntensity = 0.55;
    pmrem.dispose();
    this.scene.add(new THREE.HemisphereLight('#dff4ff', '#3a3050', 1.4));
    const key = new THREE.DirectionalLight('#fff4e0', 2.2);
    key.position.set(2, 4, 3);
    this.scene.add(key);
    if (hero === 'atalanta') {
      const m = makeAtalanta();
      dressAtalanta(m, save.upgrades.blaster ?? 0, save.ataUpgrades, outfit);
      this.model = m;
    } else {
      const m = makeJason();
      dressJason(m, save.upgrades, save.weapon, outfit);
      this.model = m;
    }
    this.scene.add(this.model.root);
    this.frame();
  }

  /** Turns the hero slowly with a little idle sway, until disposed. */
  private frame = () => {
    const now = performance.now();
    const dt = Math.min(0.05, (now - this.last) / 1000);
    this.last = now;
    this.t += dt;
    const m = this.model;
    m.root.rotation.y = 0.5 + this.t * 0.9;
    m.body.position.y = Math.sin(this.t * 2) * 0.02;
    m.armL.rotation.z = -0.12 - Math.sin(this.t * 1.6) * 0.05;
    m.armR.rotation.z = 0.12 + Math.sin(this.t * 1.6) * 0.05;
    m.head.rotation.y = Math.sin(this.t * 0.8) * 0.2;
    this.renderer.render(this.scene, this.camera);
    this.raf = requestAnimationFrame(this.frame);
  };

  dispose() {
    cancelAnimationFrame(this.raf);
    this.scene.environment?.dispose();
    this.renderer.dispose();
    this.renderer.forceContextLoss();
  }
}
