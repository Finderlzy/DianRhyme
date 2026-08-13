import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { Atmosphere } from '../src/three/effects/Atmosphere';
import { MAX_PARTICLE_COUNT, Particles } from '../src/three/effects/Particles';

const bounds = { x: 20, y: 12, z: 16 };

describe('Particles', () => {
  it('create(count=400) returns Points with exactly 400 positions', () => {
    const points = Particles.create(400, bounds);
    expect(points).toBeInstanceOf(THREE.Points);
    expect(points.geometry.attributes.position.count).toBe(400);
  });

  it('create(0) does not throw and returns an empty Points object', () => {
    const points = Particles.create(0, bounds);
    expect(points.geometry.attributes.position.count).toBe(0);
  });

  it('caps count at MAX_PARTICLE_COUNT (1000)', () => {
    const points = Particles.create(5000, bounds);
    expect(points.geometry.attributes.position.count).toBe(MAX_PARTICLE_COUNT);
  });

  it('update drifts positions without throwing', () => {
    const points = Particles.create(400, bounds);
    const arr = points.geometry.attributes.position.array as Float32Array;
    const before = arr.slice(0, 6);
    Particles.update(points, 0.016);
    Particles.update(points, 0.016);
    const after = arr.slice(0, 6);
    expect(after.some((v, i) => Math.abs(v - before[i]) > 1e-6)).toBe(true);
  });
});

describe('Atmosphere', () => {
  it('adds exactly 2 lights: one PointLight and one AmbientLight', () => {
    const scene = new THREE.Scene();
    Atmosphere.addGlow(scene);
    const lights = scene.children.filter((c) => (c as THREE.Light).isLight === true);
    expect(lights).toHaveLength(2);
    expect(lights.some((l) => (l as THREE.PointLight).isPointLight === true)).toBe(true);
    expect(lights.some((l) => (l as THREE.AmbientLight).isAmbientLight === true)).toBe(true);
  });
});
