import { describe, expect, it } from 'vitest';
import { SceneManager } from '../src/three/core/SceneManager';
import * as THREE from 'three';

describe('SceneManager', () => {
  it('creates a scene with a warm dark background (not pure black)', () => {
    const sm = new SceneManager();
    expect(sm.scene).toBeInstanceOf(THREE.Scene);
    const bg = sm.scene.background as THREE.Color;
    expect(bg).toBeInstanceOf(THREE.Color);
    expect(bg.getHex()).not.toBe(0x000000);
    // 暖色调：红色通道高于蓝色通道
    expect(bg.r).toBeGreaterThan(bg.b);
  });

  it('addObject adds an object to the scene', () => {
    const sm = new SceneManager();
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial());
    sm.addObject(mesh);
    expect(sm.scene.children).toContain(mesh);
  });

  it('addParticles adds a Points object to the scene and returns it', () => {
    const sm = new SceneManager();
    const points = sm.addParticles();
    expect(points).toBeInstanceOf(THREE.Points);
    expect(sm.scene.children).toContain(points);
  });

  it('addAtmosphere adds exactly 2 lights', () => {
    const sm = new SceneManager();
    sm.addAtmosphere();
    const lights = sm.scene.children.filter((c) => (c as THREE.Light).isLight === true);
    expect(lights).toHaveLength(2);
  });
});
