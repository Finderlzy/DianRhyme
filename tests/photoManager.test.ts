import { describe, expect, it, vi } from 'vitest';

vi.mock('three', async (importOriginal) => {
  const actual = await importOriginal<typeof import('three')>();
  return {
    ...actual,
    TextureLoader: class {
      load(src: string) {
        return { src, colorSpace: '', minFilter: 0, generateMipmaps: false };
      }
    },
  };
});

import * as THREE from 'three';
import type { Moment } from '../src/data/moments';
import { PhotoManager } from '../src/three/photos/PhotoManager';
import { PhotoNode } from '../src/three/photos/PhotoNode';

const moments: Moment[] = [
  { id: 'a', src: 'images/a.jpg' },
  { id: 'b', src: 'images/b.jpg' },
  { id: 'c', src: 'images/c.jpg' },
];

const baseConfig = { count: 3, bounds: { x: 10, y: 10, z: 10 }, minDistance: 3, maxRetries: 30 };

describe('PhotoManager', () => {
  it('creates exactly one node per moment and adds meshes to the scene', () => {
    const scene = new THREE.Scene();
    const pm = new PhotoManager(scene, moments, baseConfig);
    expect(pm.nodes).toHaveLength(3);
    expect(pm.nodes.map((n) => n.id)).toEqual(['a', 'b', 'c']);
    for (const node of pm.nodes) {
      expect(scene.children).toContain(node.mesh);
    }
  });

  it('nodes.length always equals moments.length even when layout fails to separate points', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const scene = new THREE.Scene();
    const pm = new PhotoManager(scene, moments, {
      count: 3,
      bounds: { x: 0.1, y: 0.1, z: 0.1 },
      minDistance: 10,
      maxRetries: 5,
    });
    expect(pm.nodes).toHaveLength(3);
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it('node positions respect the layout min distance', () => {
    const scene = new THREE.Scene();
    const pm = new PhotoManager(scene, moments, baseConfig);
    const positions = pm.nodes.map((n) => n.mesh.position.clone());
    for (let i = 0; i < positions.length; i++) {
      for (let j = i + 1; j < positions.length; j++) {
        expect(positions[i].distanceTo(positions[j])).toBeGreaterThanOrEqual(3 - 1e-9);
      }
    }
  });

  it('floats each node within the ±0.3 amplitude around its baseY (D009)', () => {
    const scene = new THREE.Scene();
    const pm = new PhotoManager(scene, moments, baseConfig);
    const baseYs = pm.nodes.map((n) => n.mesh.position.y);
    const camera = new THREE.PerspectiveCamera();
    for (let t = 0; t <= 40; t += 0.5) {
      pm.update(0.016, t, camera);
      pm.nodes.forEach((node, i) => {
        expect(Math.abs(node.mesh.position.y - baseYs[i])).toBeLessThanOrEqual(0.3 + 1e-9);
      });
    }
  });

  it('float animation changes y over time (not static)', () => {
    const scene = new THREE.Scene();
    const pm = new PhotoManager(scene, moments, baseConfig);
    const camera = new THREE.PerspectiveCamera();
    const ys = new Set<number>();
    for (let t = 0; t <= 40; t += 0.5) {
      pm.update(0.016, t, camera);
      ys.add(pm.nodes[0].mesh.position.y);
    }
    expect(ys.size).toBeGreaterThan(1);
  });
});

describe('PhotoNode animation (Phase 4)', () => {
  function makeNodeAtOrigin(): PhotoNode {
    return new PhotoNode({ id: 'x', src: 'images/x.jpg' }, { x: 0, y: 0, z: 0 });
  }

  it('faces the camera when within the distance threshold (D012 near)', () => {
    const node = makeNodeAtOrigin();
    node.mesh.rotation.y = Math.PI; // 先背向镜头
    const camera = new THREE.PerspectiveCamera();
    camera.position.set(0, 0, 3);

    node.update(0.016, 0);
    node.faceCamera(camera, 8);

    const dir = node.mesh.getWorldDirection(new THREE.Vector3());
    const toCamera = new THREE.Vector3().subVectors(camera.position, node.mesh.position).normalize();
    expect(dir.dot(toCamera)).toBeGreaterThan(0.99);
  });

  it('keeps random orientation when beyond the distance threshold (D012 far)', () => {
    const node = makeNodeAtOrigin();
    node.mesh.rotation.y = Math.PI; // 明确背向镜头
    const camera = new THREE.PerspectiveCamera();
    camera.position.set(0, 0, 50);

    node.update(0.016, 0);
    node.faceCamera(camera, 8);

    const dir = node.mesh.getWorldDirection(new THREE.Vector3());
    const toCamera = new THREE.Vector3().subVectors(camera.position, node.mesh.position).normalize();
    expect(dir.dot(toCamera)).toBeLessThan(-0.9);
  });
});

describe('PhotoNode bloom-on-ready (D010)', () => {
  const INTRO_DURATION = 0.8;
  const INTRO_MAX_DELAY = 0.35;

  function deferredLoader(): {
    promise: Promise<THREE.Texture>;
    resolve: (t: THREE.Texture) => void;
    reject: () => void;
  } {
    let resolve!: (t: THREE.Texture) => void;
    let reject!: () => void;
    const promise = new Promise<THREE.Texture>((res, rej) => {
      resolve = res;
      reject = rej;
    });
    return { promise, resolve, reject };
  }

  function makeNode(options: {
    reducedMotion?: boolean;
    loader?: (src: string) => THREE.Texture | Promise<THREE.Texture>;
  } = {}) {
    return new PhotoNode(
      { id: 'x', src: 'images/x.jpg' },
      { x: 0, y: 0, z: 0 },
      { textureLoader: options.loader, reducedMotion: options.reducedMotion },
    );
  }

  it('sync-ready texture (default loader) shows immediately at scale 1', () => {
    const node = makeNode();
    expect(node.mesh.scale.x).toBe(1);
  });

  it('async-ready texture starts hidden and blooms to scale 1 once resolved', async () => {
    const d = deferredLoader();
    const node = makeNode({ loader: () => d.promise });
    expect(node.mesh.scale.x).toBe(0);

    d.resolve(new THREE.Texture());
    await Promise.resolve(); // 让 then 处理器执行
    expect(node.mesh.scale.x).toBe(0); // 已触发绽放,但尚未推进

    const until = INTRO_DURATION + INTRO_MAX_DELAY + 0.2;
    for (let s = 0; s <= until; s += 0.05) {
      node.update(0.016, s);
    }
    expect(node.mesh.scale.x).toBe(1);
  });

  it('easeOutBack overshoots past 1 before settling', async () => {
    const d = deferredLoader();
    const node = makeNode({ loader: () => d.promise });
    d.resolve(new THREE.Texture());
    await Promise.resolve();

    let maxSeen = 0;
    for (let s = 0; s <= 2; s += 0.02) {
      node.update(0.016, s);
      expect(node.mesh.scale.x).toBeGreaterThanOrEqual(0);
      maxSeen = Math.max(maxSeen, node.mesh.scale.x);
    }
    expect(node.mesh.scale.x).toBe(1);
    expect(maxSeen).toBeGreaterThan(1);
  });

  it('failed async texture still blooms (placeholder shows)', async () => {
    const d = deferredLoader();
    const node = makeNode({ loader: () => d.promise });
    expect(node.mesh.scale.x).toBe(0);

    d.reject();
    await Promise.resolve();
    expect(node.mesh.scale.x).toBe(0);

    const until = INTRO_DURATION + INTRO_MAX_DELAY + 0.2;
    for (let s = 0; s <= until; s += 0.05) {
      node.update(0.016, s);
    }
    expect(node.mesh.scale.x).toBe(1);
  });

  it('reducedMotion skips the bloom and shows the photo once ready', async () => {
    const d = deferredLoader();
    const node = makeNode({ reducedMotion: true, loader: () => d.promise });
    expect(node.mesh.scale.x).toBe(0);

    d.resolve(new THREE.Texture());
    await Promise.resolve();
    expect(node.mesh.scale.x).toBe(1);

    node.update(0.016, 1);
    expect(node.mesh.scale.x).toBe(1);
  });

  it('forceReady blooms a node whose texture stays pending', () => {
    const d = deferredLoader();
    const node = makeNode({ loader: () => d.promise });
    expect(node.mesh.scale.x).toBe(0);
    node.forceReady();
    node.forceReady(); // 幂等

    const until = INTRO_DURATION + INTRO_MAX_DELAY + 0.2;
    for (let s = 0; s <= until; s += 0.05) {
      node.update(0.016, s);
    }
    expect(node.mesh.scale.x).toBe(1);
  });
});
