import * as THREE from 'three';

import { Rng } from '../core/math';
import type { Theme } from './themes';

/** Gradient dome, stars and far-off hull structures that give the void some depth. */
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

  const rng = new Rng(42);
  const starCount = 900;
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
