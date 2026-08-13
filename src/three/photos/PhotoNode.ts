import * as THREE from 'three';
import { randomInRange } from '../utils/MathUtils';
import type { Moment } from '../../data/moments';
import type { LayoutPoint } from './LayoutGenerator';

const PLACEHOLDER_COLOR = 0x6b5b4e;
const FLOAT_AMPLITUDE = 0.3;
const ROTATION_Z_SPEED = 0.3;
const ROTATION_Z_AMPLITUDE = 0.05;

export class PhotoNode {
  readonly id: string;
  readonly mesh: THREE.Mesh;

  private readonly baseY: number;
  private readonly floatSpeed: number;
  private readonly floatOffset: number;

  constructor(moment: Moment, position: LayoutPoint) {
    this.id = moment.id;

    const material = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide });
    this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
    this.mesh.position.set(position.x, position.y, position.z);

    this.baseY = position.y;
    this.floatSpeed = randomInRange(0.2, 0.5);
    this.floatOffset = randomInRange(0, Math.PI * 2);
    // D012: 远处保持随机角度
    this.mesh.rotation.y = randomInRange(0, Math.PI * 2);

    this.loadTexture(moment.src, material);
  }

  update(_deltaTime: number, elapsedTime: number): void {
    this.mesh.position.y = this.baseY + Math.sin(elapsedTime * this.floatSpeed + this.floatOffset) * FLOAT_AMPLITUDE;
    this.mesh.rotation.z = Math.sin(elapsedTime * ROTATION_Z_SPEED + this.floatOffset) * ROTATION_Z_AMPLITUDE;
  }

  faceCamera(camera: THREE.Camera, distanceThreshold: number): void {
    if (this.mesh.position.distanceTo(camera.position) <= distanceThreshold) {
      this.mesh.lookAt(camera.position);
    }
  }

  getFocusPosition(): THREE.Vector3 {
    return new THREE.Vector3(this.mesh.position.x, this.baseY, this.mesh.position.z);
  }

  private loadTexture(src: string, material: THREE.MeshBasicMaterial): void {
    const loader = new THREE.TextureLoader();
    const texture = loader.load(
      src,
      undefined,
      undefined,
      () => {
        console.error(`[PhotoNode] 纹理加载失败,使用占位色兜底: ${src}`);
        material.map = null;
        material.color.set(PLACEHOLDER_COLOR);
        material.needsUpdate = true;
      },
    );
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.minFilter = THREE.LinearFilter;
    texture.generateMipmaps = false;
    material.map = texture;
  }
}
