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
