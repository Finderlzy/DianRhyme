import * as THREE from 'three';
import { easeOutBack, randomInRange } from '../utils/MathUtils';
import type { Moment } from '../../data/moments';
import type { LayoutPoint } from './LayoutGenerator';

const PLACEHOLDER_COLOR = 0x6b5b4e;
const FLOAT_AMPLITUDE = 0.3;
const ROTATION_Z_SPEED = 0.3;
const ROTATION_Z_AMPLITUDE = 0.05;
const INTRO_DURATION = 0.8;
const INTRO_MAX_DELAY = 0.35;

export type TextureLoaderFn = (src: string) => THREE.Texture | Promise<THREE.Texture>;

export interface StagedTextureSource {
  thumbnail: Promise<THREE.Texture>;
  full: Promise<THREE.Texture>;
}

export type StagedTextureLoaderFn = (src: string) => StagedTextureSource;

export interface PhotoNodeOptions {
  textureLoader?: TextureLoaderFn;
  stagedTextureLoader?: StagedTextureLoaderFn;
  onReady?: (node: PhotoNode) => void;
  reducedMotion?: boolean;
}

function defaultTextureLoader(): TextureLoaderFn {
  const loader = new THREE.TextureLoader();
  return (src) => loader.load(src);
}

export class PhotoNode {
  readonly id: string;
  readonly mesh: THREE.Mesh;

  private readonly baseY: number;
  private readonly floatSpeed: number;
  private readonly floatOffset: number;
  private readonly introDelay: number;
  private readonly reducedMotion: boolean;
  private readonly onReady?: (node: PhotoNode) => void;

  private introActive = false;
  private bloomed = false;
  private readyFired = false;
  private introStartedAt: number | null = null;
  private thumbnailTexture: THREE.Texture | null = null;
  private fullApplied = false;

  constructor(moment: Moment, position: LayoutPoint, options: PhotoNodeOptions = {}) {
    this.id = moment.id;
    this.reducedMotion = options.reducedMotion ?? false;
    this.onReady = options.onReady;

    const material = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide, color: PLACEHOLDER_COLOR });
    this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
    this.mesh.position.set(position.x, position.y, position.z);
    // D010 就绪即绽放:未就绪前隐藏
    this.mesh.scale.setScalar(0);

    this.baseY = position.y;
    this.floatSpeed = randomInRange(0.2, 0.5);
    this.floatOffset = randomInRange(0, Math.PI * 2);
    this.introDelay = randomInRange(0, INTRO_MAX_DELAY);
    // D012: 远处保持随机角度
    this.mesh.rotation.y = randomInRange(0, Math.PI * 2);

    this.loadTexture(moment.src, material, options);
  }

  update(_deltaTime: number, elapsedTime: number): void {
    this.mesh.position.y = this.baseY + Math.sin(elapsedTime * this.floatSpeed + this.floatOffset) * FLOAT_AMPLITUDE;
    this.mesh.rotation.z = Math.sin(elapsedTime * ROTATION_Z_SPEED + this.floatOffset) * ROTATION_Z_AMPLITUDE;

    if (this.introActive && !this.bloomed) {
      if (this.introStartedAt === null) this.introStartedAt = elapsedTime;
      const t = (elapsedTime - this.introStartedAt - this.introDelay) / INTRO_DURATION;
      if (t <= 0) {
        this.mesh.scale.setScalar(0);
      } else if (t < 1) {
        this.mesh.scale.setScalar(easeOutBack(t));
      } else {
        this.mesh.scale.setScalar(1);
        this.bloomed = true;
      }
    }
  }

  faceCamera(camera: THREE.Camera, distanceThreshold: number): void {
    if (this.mesh.position.distanceTo(camera.position) <= distanceThreshold) {
      this.mesh.lookAt(camera.position);
    }
  }

  getFocusPosition(): THREE.Vector3 {
    return new THREE.Vector3(this.mesh.position.x, this.baseY, this.mesh.position.z);
  }

  forceReady(): void {
    this.beginIntro();
  }

  dispose(): void {
    this.mesh.geometry.dispose();
    const material = this.mesh.material;
    if (material instanceof THREE.Material) material.dispose();
    if (material instanceof THREE.MeshBasicMaterial && material.map) material.map.dispose();
    if (this.thumbnailTexture && this.thumbnailTexture !== (material as THREE.MeshBasicMaterial).map) {
      this.thumbnailTexture.dispose();
    }
  }

  private loadTexture(src: string, material: THREE.MeshBasicMaterial, options: PhotoNodeOptions): void {
    if (options.stagedTextureLoader) {
      this.loadStaged(src, material, options.stagedTextureLoader);
      return;
    }
    const loader: TextureLoaderFn = options.textureLoader ?? defaultTextureLoader();
    let result: THREE.Texture | Promise<THREE.Texture>;
    try {
      result = loader(src);
    } catch {
      this.setPlaceholder(material, true);
      return;
    }
    if (result instanceof Promise || (result as { then?: unknown }).then) {
      (result as Promise<THREE.Texture>).then(
        (texture) => this.applyTexture(texture, material, false),
        () => this.setPlaceholder(material, false),
      );
    } else {
      // 同步就绪(测试/兜底):直接显示,不走绽放
      this.applyTexture(result, material, true);
    }
  }

  private loadStaged(src: string, material: THREE.MeshBasicMaterial, loader: StagedTextureLoaderFn): void {
    let staged: StagedTextureSource;
    try {
      staged = loader(src);
    } catch {
      this.setPlaceholder(material, true);
      return;
    }
    staged.thumbnail.then(
      (texture) => this.applyThumbnail(texture, material),
      () => {
        // 缩略图失败不阻断,全图仍可能到达
      },
    );
    staged.full.then(
      (texture) => this.applyFull(texture, material),
      () => this.setPlaceholder(material, false),
    );
  }

  private applyThumbnail(texture: THREE.Texture, material: THREE.MeshBasicMaterial): void {
    if (this.fullApplied) {
      texture.dispose();
      return;
    }
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.generateMipmaps = false;
    texture.anisotropy = 1;
    texture.needsUpdate = true;
    material.color.set(0xffffff);
    material.map = texture;
    material.needsUpdate = true;
    this.thumbnailTexture = texture;
    this.fireReady(false);
  }

  private applyFull(texture: THREE.Texture, material: THREE.MeshBasicMaterial): void {
    this.fullApplied = true;
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.generateMipmaps = true;
    texture.anisotropy = 2;
    texture.needsUpdate = true;
    material.color.set(0xffffff);
    material.map = texture;
    material.needsUpdate = true;
    if (this.thumbnailTexture && this.thumbnailTexture !== texture) {
      this.thumbnailTexture.dispose();
    }
    this.thumbnailTexture = null;
    this.fireReady(false);
  }

  private applyTexture(texture: THREE.Texture, material: THREE.MeshBasicMaterial, instant: boolean): void {
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.generateMipmaps = true;
    texture.anisotropy = 2;
    material.color.set(0xffffff);
    material.map = texture;
    material.needsUpdate = true;
    this.fireReady(instant);
  }

  private setPlaceholder(material: THREE.MeshBasicMaterial, instant: boolean): void {
    material.color.set(PLACEHOLDER_COLOR);
    material.needsUpdate = true;
    this.fireReady(instant);
  }

  private fireReady(instant: boolean): void {
    if (this.readyFired) return;
    this.readyFired = true;
    this.beginIntro(instant);
    this.onReady?.(this);
  }

  private beginIntro(instant = false): void {
    if (this.introActive || this.bloomed) return;
    if (instant || this.reducedMotion) {
      this.mesh.scale.setScalar(1);
      this.bloomed = true;
      return;
    }
    this.introActive = true;
  }
}