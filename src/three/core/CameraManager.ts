import * as THREE from 'three';

export enum UniverseState {
  ENTERING,
  EXPLORING,
  FOCUSING,
  VIEWING,
}

export interface ControlHandle {
  setEnabled(enabled: boolean): void;
}

/**
 * 摄像机控制权规则（C-04）：
 * - ENTERING  -> OrbitControls 禁用，播放入场引导
 * - EXPLORING -> OrbitControls 启用，FocusController 不得移动摄像机
 * - FOCUSING  -> OrbitControls 禁用，FocusController 独占摄像机直到动画完成
 * - VIEWING   -> OrbitControls 禁用，摄像机静止在聚焦位置
 * 状态切换只能通过 setState 进行，外部不得直接改 controls.enabled。
 */
export class CameraManager {
  private readonly camera: THREE.PerspectiveCamera;
  private controls: ControlHandle | null = null;
  private _state: UniverseState = UniverseState.EXPLORING;
  private _onStateChange: (next: UniverseState) => void = () => {};

  constructor() {
    this.camera = new THREE.PerspectiveCamera(60, 1, 0.1, 2000);
    this.camera.position.set(0, 0, 40);
    this.camera.lookAt(0, 0, 0);
  }

  getCamera(): THREE.PerspectiveCamera {
    return this.camera;
  }

  getState(): UniverseState {
    return this._state;
  }

  bindControls(controls: ControlHandle): void {
    this.controls = controls;
    this.syncControls();
  }

  onStateChange(callback: (next: UniverseState) => void): void {
    this._onStateChange = callback;
  }

  setState(next: UniverseState): void {
    if (next === this._state) return;
    this._state = next;
    this.syncControls();
    this._onStateChange(next);
  }

  private syncControls(): void {
    if (!this.controls) return;
    this.controls.setEnabled(this._state === UniverseState.EXPLORING);
  }
}
