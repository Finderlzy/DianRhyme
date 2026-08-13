import { describe, expect, it, vi } from 'vitest';
import { CameraManager, UniverseState } from '../src/three/core/CameraManager';
import * as THREE from 'three';

function makeFakeControls(): { setEnabled: ReturnType<typeof vi.fn<(enabled: boolean) => void>> } {
  return { setEnabled: vi.fn<(enabled: boolean) => void>() };
}

describe('CameraManager', () => {
  it('getCamera returns a PerspectiveCamera positioned to look at the origin', () => {
    const cm = new CameraManager();
    const camera = cm.getCamera();
    expect(camera).toBeInstanceOf(THREE.PerspectiveCamera);
    expect(camera.position.z).toBe(40);
    expect(camera.position.x).toBe(0);
    expect(camera.position.y).toBe(0);
  });

  it('starts in EXPLORING state', () => {
    const cm = new CameraManager();
    expect(cm.getState()).toBe(UniverseState.EXPLORING);
  });

  it('FOCUSING disables controls', () => {
    const cm = new CameraManager();
    const controls = makeFakeControls();
    cm.bindControls(controls);
    cm.setState(UniverseState.FOCUSING);
    expect(controls.setEnabled).toHaveBeenLastCalledWith(false);
  });

  it('EXPLORING enables controls', () => {
    const cm = new CameraManager();
    const controls = makeFakeControls();
    cm.bindControls(controls);
    cm.setState(UniverseState.EXPLORING);
    expect(controls.setEnabled).toHaveBeenLastCalledWith(true);
  });

  it('ENTERING disables controls (C-04, Phase 8 entry guard)', () => {
    const cm = new CameraManager();
    const controls = makeFakeControls();
    cm.bindControls(controls);
    cm.setState(UniverseState.ENTERING);
    expect(controls.setEnabled).toHaveBeenLastCalledWith(false);
  });

  it('loose state machine: ENTERING -> VIEWING jump allowed, enabled follows target state', () => {
    const cm = new CameraManager();
    const controls = makeFakeControls();
    cm.bindControls(controls);
    cm.setState(UniverseState.ENTERING);
    cm.setState(UniverseState.VIEWING);
    expect(cm.getState()).toBe(UniverseState.VIEWING);
    expect(controls.setEnabled).toHaveBeenLastCalledWith(false);
  });

  it('binding controls syncs enabled immediately to the current state', () => {
    const cm = new CameraManager();
    const controls = makeFakeControls();
    cm.bindControls(controls);
    expect(controls.setEnabled).toHaveBeenCalledWith(true);
  });

  it('onStateChange fires on each real transition', () => {
    const cm = new CameraManager();
    const spy = vi.fn();
    cm.onStateChange(spy);
    cm.setState(UniverseState.FOCUSING);
    cm.setState(UniverseState.FOCUSING);
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(UniverseState.FOCUSING);
  });
});
