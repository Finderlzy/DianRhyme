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
import { CameraManager, UniverseState } from '../src/three/core/CameraManager';
import { FocusController } from '../src/three/interaction/FocusController';
import { PhotoNode } from '../src/three/photos/PhotoNode';

const DURATION = 0.9;

function advance(fc: FocusController, seconds: number): void {
  const steps = Math.ceil(seconds / 0.016);
  for (let i = 0; i < steps; i++) fc.update(0.016);
}

describe('FocusController', () => {
  it('focusOn drives FOCUSING -> VIEWING and moves the camera near the photo', () => {
    const cm = new CameraManager();
    const controls = { setEnabled: vi.fn<(enabled: boolean) => void>() };
    cm.bindControls(controls);

    const node = new PhotoNode({ id: 'x', src: 'x.jpg' }, { x: 3, y: 0, z: 0 });
    const fc = new FocusController(cm);

    fc.focusOn(node);
    expect(cm.getState()).toBe(UniverseState.FOCUSING);
    expect(controls.setEnabled).toHaveBeenLastCalledWith(false);

    advance(fc, DURATION + 0.2);
    expect(cm.getState()).toBe(UniverseState.VIEWING);
    const dist = cm.getCamera().position.distanceTo(node.getFocusPosition());
    expect(dist).toBeLessThan(5);
  });

  it('returnToExplore drives back to the default view and ends EXPLORING', () => {
    const cm = new CameraManager();
    const controls = { setEnabled: vi.fn<(enabled: boolean) => void>() };
    cm.bindControls(controls);

    const node = new PhotoNode({ id: 'x', src: 'x.jpg' }, { x: 3, y: 0, z: 0 });
    const fc = new FocusController(cm);

    fc.focusOn(node);
    advance(fc, DURATION + 0.2);
    expect(cm.getState()).toBe(UniverseState.VIEWING);

    fc.returnToExplore();
    expect(cm.getState()).toBe(UniverseState.FOCUSING);
    advance(fc, DURATION + 0.2);

    expect(cm.getState()).toBe(UniverseState.EXPLORING);
    expect(controls.setEnabled).toHaveBeenLastCalledWith(true);
    expect(cm.getCamera().position.distanceTo(new THREE.Vector3(0, 0, 40))).toBeLessThan(0.5);
  });

  it('update is a no-op when not animating', () => {
    const cm = new CameraManager();
    const fc = new FocusController(cm);
    const before = cm.getCamera().position.clone();
    fc.update(0.016);
    expect(cm.getCamera().position.equals(before)).toBe(true);
    expect(cm.getState()).toBe(UniverseState.EXPLORING);
  });
});
