import * as THREE from 'three';
import { moments } from '../data/moments';
import { AnimationLoop } from './core/AnimationLoop';
import { CameraManager, UniverseState } from './core/CameraManager';
import { Renderer } from './core/Renderer';
import { SceneManager } from './core/SceneManager';
import { Particles } from './effects/Particles';
import { Controls } from './interaction/Controls';
import { FocusController } from './interaction/FocusController';
import { Raycaster } from './interaction/Raycaster';
import { PhotoManager } from './photos/PhotoManager';
import type { PhotoNode, TextureLoaderFn } from './photos/PhotoNode';
import { resolveTier } from './utils/DeviceTier';
import { createPacedTextureLoader } from './utils/LoadScaledTexture';

const MAX_DIRECT_LOAD = 30;
const LOAD_CONCURRENCY = 6;
const ENTERING_DURATION_MS = 2000;
const LOADING_TIMEOUT_MS = 4000;

export interface UniverseOptions {
  guideElement?: HTMLElement | null;
  captionElement?: HTMLElement | null;
  hintElement?: HTMLElement | null;
  backButton?: HTMLElement | null;
  loadingElement?: HTMLElement | null;
}

function formatDate(iso: string): string {
  return iso.replace(/-/g, '.');
}

function populateCaption(el: HTMLElement, node: PhotoNode): void {
  const moment = moments.find((m) => m.id === node.id);
  const title = el.querySelector('.caption-title');
  const meta = el.querySelector('.caption-meta');
  const desc = el.querySelector('.caption-desc');
  if (title) title.textContent = moment?.title ?? node.id;
  const parts: string[] = [];
  if (moment?.date) parts.push(formatDate(moment.date));
  if (moment?.location) parts.push(moment.location);
  if (meta) meta.textContent = parts.join(' · ');
  if (desc) desc.textContent = moment?.description ?? '';
}

export function initUniverse(container: HTMLElement, options: UniverseOptions = {}): void {
  const { guideElement, captionElement, hintElement, backButton, loadingElement } = options;

  const tier = resolveTier({
    dpr: window.devicePixelRatio || 1,
    width: document.documentElement.clientWidth || window.innerWidth,
    coarsePointer: window.matchMedia('(pointer: coarse)').matches,
    reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  });

  const sceneManager = new SceneManager();
  const cameraManager = new CameraManager();

  if (moments.length === 0) return; // 空态卡由 Astro 端渲染

  if (moments.length > MAX_DIRECT_LOAD) {
    console.warn(`[Moments] 照片数量(${moments.length})超过 ${MAX_DIRECT_LOAD},由并发队列按 ${LOAD_CONCURRENCY} 张/批限流加载。`);
  }

  const gl = new THREE.WebGLRenderer({ antialias: tier.antialias, powerPreference: 'high-performance' });
  const renderer = new Renderer(cameraManager.getCamera(), gl, tier.pixelRatioCap);
  renderer.mount(container);
  renderer.domElement.setAttribute('role', 'img');
  renderer.domElement.setAttribute('aria-label', '和音滇韵实践团照片宇宙，拖动旋转查看照片，点击照片查看详情');

  const controls = new Controls(cameraManager.getCamera(), renderer.domElement);
  cameraManager.bindControls(controls);
  // D013: 进场引导阶段禁用镜头控制
  cameraManager.setState(UniverseState.ENTERING);

  const particles = sceneManager.addParticles(tier.particleCount);
  sceneManager.addAtmosphere();

  const total = moments.length;
  let readyCount = 0;
  const hideLoading = (): void => {
    loadingElement?.classList.add('is-hidden');
  };
  const onNodeReady = (): void => {
    readyCount += 1;
    if (readyCount >= total) hideLoading();
  };

  // 并发限流的离屏 loader:createImageBitmap 在 worker 解码缩放,主线程不做 drawImage;最多同时 6 张在途
  const textureLoader: TextureLoaderFn = createPacedTextureLoader({
    maxEdge: tier.maxTextureEdge,
    concurrency: LOAD_CONCURRENCY,
  });

  const photoManager = new PhotoManager(sceneManager.scene, moments, {
    count: moments.length,
    bounds: { x: 18, y: 10, z: 12 },
    minDistance: 4,
    maxRetries: 50,
  }, {
    textureLoader,
    onReady: onNodeReady,
    reducedMotion: tier.reducedMotion,
  });

  const startLoadingHint = (): void => {
    if (loadingElement) {
      loadingElement.classList.remove('is-hidden');
    }
  };
  startLoadingHint();
  // 兜底:超时仍未全部就绪则隐藏加载提示并点亮剩余占位照片
  window.setTimeout(() => {
    hideLoading();
    photoManager.nodes.forEach((node) => node.forceReady());
  }, LOADING_TIMEOUT_MS);

  const raycaster = new Raycaster();
  const focusController = new FocusController(cameraManager, tier.reducedMotion);
  let focusedNode: PhotoNode | null = null;

  renderer.domElement.addEventListener('click', (event) => {
    const state = cameraManager.getState();
    if (state !== UniverseState.EXPLORING && state !== UniverseState.VIEWING) return;

    const hit = raycaster.pick(event, cameraManager.getCamera(), photoManager.nodes);
    if (hit) {
      if (state === UniverseState.EXPLORING) {
        focusedNode = hit;
        focusController.focusOn(hit);
      }
    } else if (state === UniverseState.VIEWING) {
      focusController.returnToExplore();
    }
  });

  cameraManager.onStateChange((state) => {
    const viewing = state === UniverseState.VIEWING;
    backButton?.classList.toggle('is-hidden', !viewing);
    hintElement?.classList.toggle('is-hidden', state !== UniverseState.EXPLORING);
    if (viewing) {
      if (captionElement && focusedNode) populateCaption(captionElement, focusedNode);
      captionElement?.classList.remove('is-hidden');
    } else {
      captionElement?.classList.add('is-hidden');
    }
  });
  backButton?.addEventListener('click', () => focusController.returnToExplore());
  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && cameraManager.getState() === UniverseState.VIEWING) {
      focusController.returnToExplore();
    }
  });

  // D013 触屏设备提示双指缩放
  if (hintElement) {
    hintElement.textContent = tier.isTouch
      ? '拖动旋转 · 双指缩放 · 点击查看'
      : '拖动旋转 · 滚轮缩放 · 点击查看';
  }

  window.setTimeout(() => {
    guideElement?.classList.add('is-hidden');
    cameraManager.setState(UniverseState.EXPLORING);
  }, ENTERING_DURATION_MS);

  const loop = new AnimationLoop();
  loop.start((delta, elapsed) => {
    if (cameraManager.getState() === UniverseState.EXPLORING) {
      controls.update();
    }
    if (!tier.reducedMotion) {
      Particles.update(particles, delta);
    }
    Particles.syncViewport(particles, gl.domElement.height);
    focusController.update(delta);
    photoManager.update(delta, elapsed, cameraManager.getCamera());
    renderer.render(sceneManager.scene, cameraManager.getCamera());
  });
}