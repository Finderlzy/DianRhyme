import type * as THREE from 'three';

export interface WebGLRendererLike {
  setSize(width: number, height: number): void;
  setPixelRatio?(ratio: number): void;
  render(scene: THREE.Scene, camera: THREE.Camera): void;
  domElement: HTMLElement;
  dispose?(): void;
}

export type PixelRatioSource = () => number;

function defaultPixelRatioSource(): number {
  return typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
}

/**
 * WebGLRenderer 封装：负责挂载 canvas、响应 resize 并同步 camera 纵横比。
 * renderer 由外部注入（main.ts 创建真正的 WebGLRenderer），便于测试。
 */
export class Renderer {
  readonly domElement: HTMLElement;

  private onResizeHandler: (() => void) | null = null;

  constructor(
    private camera: THREE.PerspectiveCamera,
    private renderer: WebGLRendererLike,
    private pixelRatioCap?: number,
    private pixelRatioSource: PixelRatioSource = defaultPixelRatioSource,
  ) {
    this.domElement = renderer.domElement;
    this.domElement.style.width = '100%';
    this.domElement.style.height = '100%';
    this.domElement.style.display = 'block';
  }

  mount(container: HTMLElement): void {
    container.appendChild(this.domElement);
    this.onResizeHandler = () => {
      const width = container.clientWidth || (typeof window !== 'undefined' ? window.innerWidth : 0) || 1;
      const height = container.clientHeight || (typeof window !== 'undefined' ? window.innerHeight : 0) || 1;
      this.resize(width, height);
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', this.onResizeHandler);
    }
    this.onResizeHandler();
  }

  resize(width: number, height: number): void {
    if (this.pixelRatioCap !== undefined && this.renderer.setPixelRatio) {
      const dpr = Math.max(1, this.pixelRatioSource() || 1);
      this.renderer.setPixelRatio(Math.min(dpr, this.pixelRatioCap));
    }
    this.renderer.setSize(width, height);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  render(scene: THREE.Scene, camera: THREE.Camera): void {
    this.renderer.render(scene, camera);
  }

  dispose(): void {
    if (typeof window !== 'undefined' && this.onResizeHandler) {
      window.removeEventListener('resize', this.onResizeHandler);
    }
    if (this.renderer.dispose) this.renderer.dispose();
  }
}