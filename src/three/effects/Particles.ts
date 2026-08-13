import * as THREE from 'three';
import { randomInRange } from '../utils/MathUtils';

export interface Bounds3 {
  x: number;
  y: number;
  z: number;
}

export const DEFAULT_PARTICLE_COUNT = 400;
export const MAX_PARTICLE_COUNT = 1000;

const basePositions = new WeakMap<THREE.Points, Float32Array>();
let elapsed = 0;

export class Particles {
  static create(count: number, bounds: Bounds3): THREE.Points {
    const safeCount = Math.max(0, Math.min(Math.floor(count), MAX_PARTICLE_COUNT));
    const positions = new Float32Array(safeCount * 3);
    for (let i = 0; i < safeCount; i++) {
      positions[i * 3] = randomInRange(-bounds.x, bounds.x);
      positions[i * 3 + 1] = randomInRange(-bounds.y, bounds.y);
      positions[i * 3 + 2] = randomInRange(-bounds.z, bounds.z);
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const material = new THREE.PointsMaterial({
      color: 0xffd9a0,
      size: 0.05,
      transparent: true,
      opacity: 0.65,
      depthWrite: false,
    });

    const points = new THREE.Points(geometry, material);
    basePositions.set(points, positions.slice());
    return points;
  }

  static update(points: THREE.Points, deltaTime: number): void {
    elapsed += deltaTime;
    const base = basePositions.get(points);
    if (!base) return;

    const attr = points.geometry.getAttribute('position') as THREE.BufferAttribute;
    const arr = attr.array as Float32Array;
    for (let i = 0; i < attr.count; i++) {
      const ix = i * 3;
      const phase = (i * 12.9898) % (Math.PI * 2);
      arr[ix] = base[ix] + Math.sin(elapsed * 0.4 + phase) * 0.5;
      arr[ix + 1] = base[ix + 1] + Math.sin(elapsed * 0.3 + phase * 1.7) * 0.4;
      arr[ix + 2] = base[ix + 2] + Math.cos(elapsed * 0.25 + phase) * 0.5;
    }
    attr.needsUpdate = true;
  }
}
