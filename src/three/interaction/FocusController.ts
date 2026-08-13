import * as THREE from 'three';
import { CameraManager, UniverseState } from '../core/CameraManager';
import type { PhotoNode } from '../photos/PhotoNode';

const FOCUS_DURATION = 0.9;
const VIEW_DISTANCE = 4;
const DEFAULT_POSITION = new THREE.Vector3(0, 0, 40);
const DEFAULT_LOOK_AT = new THREE.Vector3(0, 0, 0);

/**
 * 点击照片后的镜头动画（C-05）。
 * 只负责摄像机移动，不创建或持有 PhotoNode。
 */
export class FocusController {
  private animating: 'focus' | 'return' | null = null;
  private readonly startPos = new THREE.Vector3();
  private readonly endPos = new THREE.Vector3();
  private readonly lookTarget = new THREE.Vector3();
  private readonly focusDuration: number;
  private elapsed = 0;

  constructor(private cameraManager: CameraManager, reducedMotion = false) {
    this.focusDuration = reducedMotion ? 0.25 : FOCUS_DURATION;
  }

  focusOn(node: PhotoNode): void {
    this.cameraManager.setState(UniverseState.FOCUSING);
    this.startPos.copy(this.cameraManager.getCamera().position);

    const photoPos = node.getFocusPosition();
    const dir = new THREE.Vector3().subVectors(this.startPos, photoPos);
    if (dir.lengthSq() < 1e-6) dir.set(0, 0, 1);
    dir.normalize();
    this.endPos.copy(photoPos).addScaledVector(dir, VIEW_DISTANCE);
    this.lookTarget.copy(photoPos);

    this.animating = 'focus';
    this.elapsed = 0;
  }

  returnToExplore(): void {
    this.cameraManager.setState(UniverseState.FOCUSING);
    this.startPos.copy(this.cameraManager.getCamera().position);
    this.endPos.copy(DEFAULT_POSITION);
    this.lookTarget.copy(DEFAULT_LOOK_AT);
    this.animating = 'return';
    this.elapsed = 0;
  }

  update(deltaTime: number): void {
    if (!this.animating) return;
    this.elapsed += deltaTime;

    const t = Math.min(this.elapsed / this.focusDuration, 1);
    const eased = t * t * (3 - 2 * t); // smoothstep
    this.cameraManager.getCamera().position.lerpVectors(this.startPos, this.endPos, eased);
    this.cameraManager.getCamera().lookAt(this.lookTarget);

    if (t >= 1) {
      if (this.animating === 'focus') {
        this.cameraManager.setState(UniverseState.VIEWING);
      } else {
        this.cameraManager.setState(UniverseState.EXPLORING);
      }
      this.animating = null;
    }
  }
}
