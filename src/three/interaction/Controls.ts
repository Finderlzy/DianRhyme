import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export class Controls {
  private readonly controls: OrbitControls;

  constructor(camera: THREE.Camera, domElement: HTMLElement) {
    this.controls = new OrbitControls(camera, domElement);
    // D016: Orbit 轨道探索,拖动旋转 + 滚轮缩放;禁用平移,不做 Fly
    this.controls.enablePan = false;
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.minDistance = 5;
    this.controls.maxDistance = 100;
  }

  getControls(): OrbitControls {
    return this.controls;
  }

  setEnabled(enabled: boolean): void {
    this.controls.enabled = enabled;
  }

  update(): void {
    this.controls.update();
  }

  dispose(): void {
    this.controls.dispose();
  }
}
