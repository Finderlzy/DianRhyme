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
import type { PhotoNode } from './photos/PhotoNode';

const MAX_DIRECT_LOAD = 30;
const ENTERING_DURATION_MS = 2000;

export interface UniverseOptions {
  guideElement?: HTMLElement | null;
  captionElement?: HTMLElement | null;
  hintElement?: HTMLElement | null;
  backButton?: HTMLElement | null;
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
  const { guideElement, captionElement, hintElement, backButton } = options;

  const sceneManager = new SceneManager();
  const cameraManager = new CameraManager();

  if (moments.length > MAX_DIRECT_LOAD) {
    console.warn(`[Moments] 照片数量(${moments.length})超过 ${MAX_DIRECT_LOAD},建议分批加载;当前仍直接加载。`);
  }

  const renderer = new Renderer(cameraManager.getCamera(), new THREE.WebGLRenderer({ antialias: true }));
  renderer.mount(container);

  const controls = new Controls(cameraManager.getCamera(), renderer.domElement);
  cameraManager.bindControls(controls);
  // D013: 进场引导阶段禁用镜头控制
  cameraManager.setState(UniverseState.ENTERING);

  const particles = sceneManager.addParticles();
  sceneManager.addAtmosphere();

  const photoManager = new PhotoManager(sceneManager.scene, moments, {
    count: moments.length,
    bounds: { x: 18, y: 10, z: 12 },
    minDistance: 4,
    maxRetries: 50,
  });

  const raycaster = new Raycaster();
  const focusController = new FocusController(cameraManager);
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

  window.setTimeout(() => {
    guideElement?.classList.add('is-hidden');
    cameraManager.setState(UniverseState.EXPLORING);
  }, ENTERING_DURATION_MS);

  const loop = new AnimationLoop();
  loop.start((delta, elapsed) => {
    if (cameraManager.getState() === UniverseState.EXPLORING) {
      controls.update();
    }
    Particles.update(particles, delta);
    focusController.update(delta);
    photoManager.update(delta, elapsed, cameraManager.getCamera());
    renderer.render(sceneManager.scene, cameraManager.getCamera());
  });
}
