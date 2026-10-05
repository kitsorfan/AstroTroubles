import * as THREE from 'three';

import { glowSprite } from './models';

interface Beam {
  group: THREE.Group;
  segs: THREE.Mesh[];
  end: THREE.Sprite;
  life: number;
}

const up = new THREE.Vector3(0, 1, 0);

/** Short-lived jagged electric beams (LUX's zap, hack links). */
export class Beams {
  private pool: Beam[] = [];

  constructor(scene: THREE.Scene) {
    const geo = new THREE.CylinderGeometry(0.045, 0.045, 1, 5);
    geo.translate(0, 0.5, 0);
    for (let i = 0; i < 6; i++) {
      const group = new THREE.Group();
      const m = new THREE.MeshBasicMaterial({ color: '#bff4ff', transparent: true, opacity: 1, blending: THREE.AdditiveBlending, depthWrite: false });
      const segs: THREE.Mesh[] = [];
      for (let k = 0; k < 5; k++) {
        const seg = new THREE.Mesh(geo, m);
        segs.push(seg);
        group.add(seg);
      }
      const end = glowSprite('#7fe6ff', 1.4, 0.9);
      group.add(end);
      group.visible = false;
      scene.add(group);
      this.pool.push({ group, segs, end, life: 0 });
    }
  }

  zap(a: THREE.Vector3, b: THREE.Vector3, color = '#bff4ff') {
    const beam = this.pool.find((p) => p.life <= 0) ?? this.pool[0];
    beam.life = 0.18;
    beam.group.visible = true;
    (beam.segs[0].material as THREE.MeshBasicMaterial).color.set(color);
    const pts: THREE.Vector3[] = [a.clone()];
    for (let k = 1; k < beam.segs.length; k++) {
      const t = k / beam.segs.length;
      pts.push(a.clone().lerp(b, t).add(new THREE.Vector3((Math.random() - 0.5) * 0.6, (Math.random() - 0.5) * 0.6, (Math.random() - 0.5) * 0.6)));
    }
    pts.push(b.clone());
    for (let k = 0; k < beam.segs.length; k++) {
      const seg = beam.segs[k];
      const p0 = pts[k];
      const p1 = pts[k + 1];
      const d = p1.clone().sub(p0);
      seg.position.copy(p0);
      seg.scale.set(1, d.length(), 1);
      seg.quaternion.setFromUnitVectors(up, d.normalize());
    }
    beam.end.position.copy(b);
  }

  update(dt: number) {
    for (const b of this.pool) {
      if (b.life <= 0) continue;
      b.life -= dt;
      (b.segs[0].material as THREE.MeshBasicMaterial).opacity = Math.max(0, b.life / 0.18);
      if (b.life <= 0) b.group.visible = false;
    }
  }
}

/** Expanding ground ring for pounds and boss slams. */
export class Rings {
  private pool: { mesh: THREE.Mesh; life: number; max: number; size: number }[] = [];

  constructor(scene: THREE.Scene) {
    const geo = new THREE.RingGeometry(0.85, 1, 40).rotateX(-Math.PI / 2);
    for (let i = 0; i < 8; i++) {
      const mesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }));
      mesh.visible = false;
      scene.add(mesh);
      this.pool.push({ mesh, life: 0, max: 0.4, size: 3 });
    }
  }

  burst(x: number, y: number, z: number, size: number, color: string, life = 0.4) {
    const r = this.pool.find((p) => p.life <= 0) ?? this.pool[0];
    r.life = life;
    r.max = life;
    r.size = size;
    r.mesh.position.set(x, y + 0.08, z);
    (r.mesh.material as THREE.MeshBasicMaterial).color.set(color);
    r.mesh.visible = true;
  }

  update(dt: number) {
    for (const r of this.pool) {
      if (r.life <= 0) continue;
      r.life -= dt;
      const t = 1 - r.life / r.max;
      r.mesh.scale.setScalar(0.3 + t * r.size);
      (r.mesh.material as THREE.MeshBasicMaterial).opacity = (1 - t) * 0.9;
      if (r.life <= 0) r.mesh.visible = false;
    }
  }
}
