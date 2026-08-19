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
import { Raycaster, type PickEvent } from '../src/three/interaction/Raycaster';
import { PhotoNode } from '../src/three/photos/PhotoNode';

function makeCamera(): THREE.PerspectiveCamera {
  const camera = new THREE.PerspectiveCamera(60, 800 / 600, 0.1, 100);
  camera.position.set(0, 0, 5);
  camera.lookAt(0, 0, 0);
  return camera;
}

function makeNodes(originId: string, otherId: string): PhotoNode[] {
  return [
    new PhotoNode({ id: originId, src: `${originId}.jpg` }, { x: 0, y: 0, z: 0 }),
    new PhotoNode({ id: otherId, src: `${otherId}.jpg` }, { x: 10, y: 0, z: 0 }),
  ];
}

const centerEvent: PickEvent = { clientX: 400, clientY: 300, target: { clientWidth: 800, clientHeight: 600 } };
const cornerEvent: PickEvent = { clientX: 799, clientY: 599, target: { clientWidth: 800, clientHeight: 600 } };

describe('Raycaster.pick', () => {
  it('returns the node hit at screen center', () => {
    const camera = makeCamera();
    const hit = new Raycaster().pick(centerEvent, camera, makeNodes('a', 'b'));
    expect(hit?.id).toBe('a');
  });

  it('returns the correct node via mesh reverse-lookup when both are in the list', () => {
    const camera = makeCamera();
    const hit = new Raycaster().pick(centerEvent, camera, makeNodes('b', 'a'));
    expect(hit?.id).toBe('b');
  });

  it('returns null when the ray hits nothing', () => {
    const camera = makeCamera();
    const hit = new Raycaster().pick(cornerEvent, camera, makeNodes('a', 'b'));
    expect(hit).toBeNull();
  });

  it('returns null for an empty node list', () => {
    const camera = makeCamera();
    expect(new Raycaster().pick(centerEvent, camera, [])).toBeNull();
  });

  it('accounts for the canvas viewport offset', () => {
    const camera = makeCamera();
    const hit = new Raycaster().pick({
      clientX: 800,
      clientY: 450,
      target: { clientWidth: 800, clientHeight: 600, getBoundingClientRect: () => ({ left: 400, top: 150 }) },
    }, camera, makeNodes('a', 'b'));
    expect(hit?.id).toBe('a');
  });
});
