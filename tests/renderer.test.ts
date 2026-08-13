import { describe, expect, it } from 'vitest';
import { Renderer, type WebGLRendererLike } from '../src/three/core/Renderer';
import { SceneManager } from '../src/three/core/SceneManager';
import * as THREE from 'three';

class FakeContainer {
  clientWidth = 800;
  clientHeight = 600;
  children: unknown[] = [];
  appendChild(node: unknown): void {
    this.children.push(node);
  }
}

function makeFakeWebGL(): WebGLRendererLike & { renders: number; sizes: Array<[number, number]>; disposed: boolean } {
  const r = {
    domElement: { style: {} as CSSStyleDeclaration } as unknown as HTMLElement,
    setSize: (w: number, h: number) => r.sizes.push([w, h]),
    render: () => r.renders++,
    dispose: () => {
      r.disposed = true;
    },
    sizes: [] as Array<[number, number]>,
    renders: 0,
    disposed: false,
  };
  return r;
}

describe('Renderer', () => {
  it('mount appends the canvas and performs an initial resize from container dims', () => {
    const container = new FakeContainer();
    const fake = makeFakeWebGL();
    const renderer = new Renderer(new THREE.PerspectiveCamera(), fake);
    renderer.mount(container as never);
    expect(container.children).toContain(fake.domElement);
    expect(fake.sizes).toContainEqual([800, 600]);
  });

  it('resize updates size and camera aspect and projection matrix', () => {
    const camera = new THREE.PerspectiveCamera();
    const fake = makeFakeWebGL();
    const renderer = new Renderer(camera, fake);
    renderer.resize(1920, 1080);
    expect(fake.sizes).toContainEqual([1920, 1080]);
    expect(camera.aspect).toBeCloseTo(1920 / 1080);
  });

  it('render delegates to the underlying renderer', () => {
    const fake = makeFakeWebGL();
    const renderer = new Renderer(new THREE.PerspectiveCamera(), fake);
    const scene = new SceneManager().scene;
    const camera = new THREE.PerspectiveCamera();
    renderer.render(scene, camera);
    expect(fake.renders).toBe(1);
  });

  it('dispose calls underlying dispose', () => {
    const fake = makeFakeWebGL();
    const renderer = new Renderer(new THREE.PerspectiveCamera(), fake);
    renderer.dispose();
    expect(fake.disposed).toBe(true);
  });
});
