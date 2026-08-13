import * as THREE from 'three';
import { Atmosphere } from '../effects/Atmosphere';
import { DEFAULT_PARTICLE_COUNT, Particles, type Bounds3 } from '../effects/Particles';

const BACKGROUND = 0x35291e;
const PARTICLES_BOUNDS: Bounds3 = { x: 20, y: 12, z: 16 };

export class SceneManager {
  readonly scene: THREE.Scene;

  constructor() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(BACKGROUND);
  }

  addObject(obj: THREE.Object3D): void {
    this.scene.add(obj);
  }

  addParticles(count: number = DEFAULT_PARTICLE_COUNT): THREE.Points {
    const points = Particles.create(count, PARTICLES_BOUNDS);
    this.scene.add(points);
    return points;
  }

  addAtmosphere(): void {
    Atmosphere.addGlow(this.scene);
  }
}
