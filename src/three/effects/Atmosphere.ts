import * as THREE from 'three';

const GLOW_COLOR = 0x8c332d;
const AMBIENT_COLOR = 0x8f786c;
const AMBIENT_INTENSITY = 0.18;

export class Atmosphere {
  static addGlow(scene: THREE.Scene): void {
    const pointLight = new THREE.PointLight(GLOW_COLOR, 0.45, 200);
    pointLight.position.set(0, 0, 20);
    scene.add(pointLight);

    const ambient = new THREE.AmbientLight(AMBIENT_COLOR, AMBIENT_INTENSITY);
    scene.add(ambient);
  }
}
