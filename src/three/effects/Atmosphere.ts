import * as THREE from 'three';

const GLOW_COLOR = 0xffaa66;
const AMBIENT_COLOR = 0xffe0c0;
const AMBIENT_INTENSITY = 0.4;

export class Atmosphere {
  static addGlow(scene: THREE.Scene): void {
    const pointLight = new THREE.PointLight(GLOW_COLOR, 1.2, 200);
    pointLight.position.set(0, 0, 20);
    scene.add(pointLight);

    const ambient = new THREE.AmbientLight(AMBIENT_COLOR, AMBIENT_INTENSITY);
    scene.add(ambient);
  }
}
