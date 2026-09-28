import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

import type { Quality } from '../core/save';

/**
 * Bloom on medium and high quality: light strips, screens, lasers and glowing hazards bleed soft light.
 * Low quality renders straight to the screen.
 */
export class PostFx {
  private composer: EffectComposer | null = null;
  private pass: RenderPass | null = null;
  private bloom: UnrealBloomPass | null = null;
  private quality: Quality = 'medium';
  private strength = 0.7;

  constructor(private renderer: THREE.WebGLRenderer) {}

  configure(quality: Quality) {
    this.quality = quality;
    this.composer?.dispose();
    this.composer = null;
    this.pass = null;
    this.bloom = null;
    if (quality === 'low') return;
    const size = this.renderer.getDrawingBufferSize(new THREE.Vector2());
    const target = new THREE.WebGLRenderTarget(size.x, size.y, { type: THREE.HalfFloatType, samples: quality === 'high' ? 4 : 2 });
    const composer = new EffectComposer(this.renderer, target);
    this.pass = new RenderPass(new THREE.Scene(), new THREE.PerspectiveCamera());
    this.bloom = new UnrealBloomPass(new THREE.Vector2(size.x, size.y), this.strength, 0.35, 1.35);
    composer.addPass(this.pass);
    composer.addPass(this.bloom);
    composer.addPass(new OutputPass());
    this.composer = composer;
    this.resize();
  }

  /** How strongly this scene glows. */
  setStrength(s: number) {
    this.strength = s;
    if (this.bloom) this.bloom.strength = s;
  }

  resize() {
    if (!this.composer || !this.bloom) return;
    const size = new THREE.Vector2();
    this.renderer.getSize(size);
    this.composer.setPixelRatio(this.renderer.getPixelRatio());
    this.composer.setSize(size.x, size.y);
    // Medium quality blurs at a quarter of the screen size instead of half.
    const k = this.quality === 'high' ? 1 : 0.5;
    const buf = this.renderer.getDrawingBufferSize(new THREE.Vector2());
    this.bloom.setSize(Math.max(64, Math.round(buf.x * k)), Math.max(64, Math.round(buf.y * k)));
  }

  render(scene: THREE.Scene, camera: THREE.Camera) {
    if (!this.composer || !this.pass) {
      this.renderer.render(scene, camera);
      return;
    }
    this.pass.scene = scene;
    this.pass.camera = camera;
    this.composer.render();
  }
}
