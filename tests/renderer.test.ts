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

  it('applies pixelRatio capped by the source DPR before setSize when provided', () => {
    const camera = new THREE.PerspectiveCamera();
    const fake = makeFakeWebGL() as ReturnType<typeof makeFakeWebGL> & { setPixelRatio: (r: number) => void; ratios: number[] };
    fake.ratios = [];
    fake.setPixelRatio = (r: number) => {
      fake.ratios.push(r);
    };
    const renderer = new Renderer(camera, fake, 2, () => 2);
    renderer.resize(1920, 1080);
    expect(fake.ratios).toEqual([2]);
    expect(fake.sizes).toContainEqual([1920, 1080]);
  });

  it('uses the source DPR when it is below the cap', () => {
    const fake = makeFakeWebGL() as ReturnType<typeof makeFakeWebGL> & { setPixelRatio: (r: number) => void; ratios: number[] };
    fake.ratios = [];
    fake.setPixelRatio = (r: number) => {
      fake.ratios.push(r);
    };
    const renderer = new Renderer(new THREE.PerspectiveCamera(), fake, 2, () => 1);
    renderer.resize(1920, 1080);
    expect(fake.ratios).toEqual([1]);
  });

  it('caps the ratio at the cap when the source DPR exceeds it', () => {
    const fake = makeFakeWebGL() as ReturnType<typeof makeFakeWebGL> & { setPixelRatio: (r: number) => void; ratios: number[] };
    fake.ratios = [];
    fake.setPixelRatio = (r: number) => {
      fake.ratios.push(r);
    };
    const renderer = new Renderer(new THREE.PerspectiveCamera(), fake, 2, () => 3);
    renderer.resize(800, 600);
    expect(fake.ratios).toEqual([2]);
  });

  it('does not call setPixelRatio when pixelRatio is undefined', () => {
    const fake = makeFakeWebGL() as ReturnType<typeof makeFakeWebGL> & { setPixelRatio: (r: number) => void; ratios: number[] };
    fake.ratios = [];
    fake.setPixelRatio = (r: number) => {
      fake.ratios.push(r);
    };
    const renderer = new Renderer(new THREE.PerspectiveCamera(), fake);
    renderer.resize(800, 600);
    expect(fake.ratios).toEqual([]);
  });

  it('does not call setPixelRatio when the renderer lacks the method', () => {
    const fake = makeFakeWebGL();
    const renderer = new Renderer(new THREE.PerspectiveCamera(), fake, 2);
    expect(() => renderer.resize(800, 600)).not.toThrow();
  });
});
