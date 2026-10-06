import * as THREE from 'three';

import { Rng } from '../core/math';
import { glowTexture } from './textures';
import type { Outdoor, Theme } from './themes';

/** Direction toward the sun in the outdoor regions (the same way the shadows fall). */
const SUN_DIR = new THREE.Vector3(12, 30, 8).normalize();

/**
 * The open sky of Gaia Nova: a sun low enough to see, soft clouds drifting around the horizon, and a
 * ring of far mountains (or dunes) whose colour fades into the haze.
 */
function outdoorSky(theme: Theme, o: Outdoor, center: THREE.Vector3, span: number, group: THREE.Group) {
  const rng = new Rng(17);
  // The sun's disc and halo sit lower than the light itself so the camera can catch them.
  const toward = new THREE.Vector3(SUN_DIR.x, 0.32, SUN_DIR.z).normalize();
  const sun = new THREE.Group();
  sun.add(new THREE.Mesh(new THREE.CircleGeometry(16, 32), new THREE.MeshBasicMaterial({ color: o.sunDisc, fog: false, toneMapped: false })));
  for (const [size, op] of [
    [90, 0.55],
    [190, 0.25],
  ] as const) {
    const halo = new THREE.Mesh(
      new THREE.PlaneGeometry(size, size),
      new THREE.MeshBasicMaterial({ map: glowTexture(), color: o.sunDisc, transparent: true, opacity: op, depthWrite: false, fog: false, blending: THREE.AdditiveBlending }),
    );
    sun.add(halo);
  }
  sun.position.copy(center).addScaledVector(toward, 380);
  sun.lookAt(center);
  sun.renderOrder = -9;
  group.add(sun);

  // Far mountains: a ring of low-poly peaks, already tinted toward the horizon haze.
  const peak = new THREE.ConeGeometry(1, 1, 5, 1).translate(0, 0.5, 0);
  const count = 46;
  const hills = new THREE.InstancedMesh(peak, new THREE.MeshBasicMaterial({ fog: false }), count);
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const col = new THREE.Color();
  const haze = new THREE.Color(theme.skyBottom);
  const flat = o.ground === 'sand';
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2 + rng.range(-0.05, 0.05);
    const dist = span * 0.75 + 150 + rng.range(0, 60);
    const w = rng.range(50, 110);
    const h = flat ? rng.range(14, 34) : rng.range(40, 120);
    q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), rng.range(0, Math.PI));
    m.compose(new THREE.Vector3(center.x + Math.cos(a) * dist, -30, center.z + Math.sin(a) * dist), q, new THREE.Vector3(w, h, w));
    hills.setMatrixAt(i, m);
    hills.setColorAt(i, col.set(o.hills).lerp(haze, 0.25 + rng.next() * 0.3));
  }
  hills.instanceMatrix.needsUpdate = true;
  if (hills.instanceColor) hills.instanceColor.needsUpdate = true;
  hills.computeBoundingSphere();
  group.add(hills);

  if (o.clouds) {
    // Puffy clouds: clusters of soft sprites, blended normally so they can be grey or smoky too.
    const cloudMat = new THREE.SpriteMaterial({ map: glowTexture(), color: o.clouds, transparent: true, opacity: 0.55, depthWrite: false, fog: false });
    for (let i = 0; i < 22; i++) {
      const a = rng.next() * Math.PI * 2;
      const dist = span * 0.5 + rng.range(90, 220);
      const cx = center.x + Math.cos(a) * dist;
      const cz = center.z + Math.sin(a) * dist;
      const cy = rng.range(30, 90);
      for (let k = 0; k < 5; k++) {
        const s = new THREE.Sprite(cloudMat);
        const size = rng.range(30, 60);
        s.scale.set(size * 1.6, size, 1);
        s.position.set(cx + rng.range(-30, 30), cy + rng.range(-6, 8), cz + rng.range(-30, 30));
        group.add(s);
      }
    }
  }
}

/** Gradient dome, stars and far-off hull structures that give the void some depth (or Gaia Nova's open sky). */
export function buildSky(theme: Theme, center: THREE.Vector3, span: number): THREE.Group {
  const group = new THREE.Group();
  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(420, 32, 16),
    new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      fog: false,
      uniforms: {
        top: { value: new THREE.Color(theme.skyTop) },
        bottom: { value: new THREE.Color(theme.skyBottom) },
      },
      vertexShader: `varying vec3 vPos; void main(){ vPos = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
      fragmentShader: `uniform vec3 top; uniform vec3 bottom; varying vec3 vPos;
        void main(){ float h = normalize(vPos).y; float t = smoothstep(-0.6, 0.5, h);
        vec3 c = mix(bottom, top, t); gl_FragColor = vec4(c, 1.0); }`,
    }),
  );
  dome.position.copy(center);
  dome.renderOrder = -10;
  group.add(dome);

  if (theme.outdoor) {
    outdoorSky(theme, theme.outdoor, center, span, group);
    if (!theme.outdoor.stars) return group;
  }

  const rng = new Rng(42);
  const starCount = theme.outdoor ? 400 : 900;
  const starPos = new Float32Array(starCount * 3);
  for (let i = 0; i < starCount; i++) {
    const u = rng.next() * 2 - 1;
    const a = rng.next() * Math.PI * 2;
    const r = 380;
    const s = Math.sqrt(1 - u * u);
    starPos[i * 3] = center.x + Math.cos(a) * s * r;
    starPos[i * 3 + 1] = center.y + u * r;
    starPos[i * 3 + 2] = center.z + Math.sin(a) * s * r;
  }
  const starGeo = new THREE.BufferGeometry();
  starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
  const stars = new THREE.Points(starGeo, new THREE.PointsMaterial({ color: '#ffffff', size: 1.6, sizeAttenuation: false, fog: false, transparent: true, opacity: 0.85 }));
  group.add(stars);
  if (theme.outdoor) return group;

  // Distant chunks of the ship's hull with lit windows.
  const hullMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(theme.wall).multiplyScalar(0.55), roughness: 0.8, metalness: 0.3 });
  const winMat = new THREE.MeshBasicMaterial({ color: theme.accent, fog: false });
  const hullGeo = new THREE.BoxGeometry(1, 1, 1);
  const count = 26;
  const hulls = new THREE.InstancedMesh(hullGeo, hullMat, count);
  const wins = new THREE.InstancedMesh(hullGeo, winMat, count * 6);
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const p = new THREE.Vector3();
  const s = new THREE.Vector3();
  let wi = 0;
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2 + rng.range(-0.1, 0.1);
    const dist = span * 0.7 + rng.range(40, 120);
    const w = rng.range(8, 26);
    const h = rng.range(10, 60);
    const d = rng.range(8, 26);
    p.set(center.x + Math.cos(a) * dist, rng.range(-50, 10), center.z + Math.sin(a) * dist);
    q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), rng.range(0, Math.PI));
    s.set(w, h, d);
    m.compose(p, q, s);
    hulls.setMatrixAt(i, m);
    for (let k = 0; k < 6; k++) {
      const wp = p.clone().add(new THREE.Vector3(rng.range(-w / 2, w / 2), rng.range(-h / 2, h / 2), 0).applyQuaternion(q));
      wp.add(new THREE.Vector3(0, 0, d / 2 + 0.2).applyQuaternion(q));
      m.compose(wp, q, new THREE.Vector3(rng.range(0.6, 2.5), 0.5, 0.2));
      wins.setMatrixAt(wi++, m);
    }
  }
  wins.count = wi;
  group.add(hulls, wins);
  return group;
}
