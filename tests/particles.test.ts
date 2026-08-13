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

  it('update advances uTime and leaves base positions static (GPU-driven drift)', () => {
    const points = Particles.create(400, bounds);
    const arr = points.geometry.attributes.position.array as Float32Array;
    const before = arr.slice();
    const mat = points.material as THREE.ShaderMaterial;
    const initial = mat.uniforms.uTime.value as number;

    Particles.update(points, 0.016);
    Particles.update(points, 0.016);

    expect(arr.slice()).toEqual(before);
    expect(mat.uniforms.uTime.value as number).toBeGreaterThan(initial);
  });

  it('uses ShaderMaterial with additive blending, per-vertex colors and size 0.07', () => {
    const points = Particles.create(10, bounds);
    const mat = points.material as THREE.ShaderMaterial;
    expect(mat).toBeInstanceOf(THREE.ShaderMaterial);
    expect(mat.blending).toBe(THREE.AdditiveBlending);
    expect(mat.transparent).toBe(true);
    expect(mat.depthWrite).toBe(false);
    expect(mat.uniforms.uSize.value).toBe(0.07);
  });

  it('provides a color attribute matching position count', () => {
    const points = Particles.create(64, bounds);
    const colorAttr = points.geometry.getAttribute('color');
    const posAttr = points.geometry.getAttribute('position');
    expect(colorAttr).toBeTruthy();
    expect(colorAttr.count).toBe(posAttr.count);
    expect(colorAttr.itemSize).toBe(3);
  });

  it('update breathes opacity within [0.50, 0.80]', () => {
    const points = Particles.create(10, bounds);
    const mat = points.material as THREE.ShaderMaterial;
    for (let i = 0; i < 60; i++) {
      Particles.update(points, 0.016);
    }
    const v = mat.uniforms.uOpacity.value as number;
    expect(v).toBeGreaterThanOrEqual(0.5);
    expect(v).toBeLessThanOrEqual(0.8);
  });

  it('syncViewport updates the viewport-height uniform (default 1080)', () => {
    const points = Particles.create(10, bounds);
    const mat = points.material as THREE.ShaderMaterial;
    expect(mat.uniforms.uViewportHeight.value).toBe(1080);
    Particles.syncViewport(points, 2400);
    expect(mat.uniforms.uViewportHeight.value).toBe(2400);
  });

  it('vertex shader animates drift from uTime and sizes points by projection', () => {
    const points = Particles.create(10, bounds);
    const mat = points.material as THREE.ShaderMaterial;
    expect(mat.vertexShader).toContain('sin(uTime * 0.4 + phase) * 0.5');
    expect(mat.vertexShader).toContain('sin(uTime * 0.3 + phase * 1.7) * 0.4');
    expect(mat.vertexShader).toContain('cos(uTime * 0.25 + phase) * 0.5');
    expect(mat.vertexShader).not.toContain('${');
    expect(mat.vertexShader).toContain('gl_PointSize');
    expect(mat.vertexShader).toContain('projectionMatrix[1][1]');
    expect(mat.fragmentShader).toContain('gl_PointCoord');
  });

  it('does not redeclare position/normal/uv that three auto-declares in the prefix', () => {
    const points = Particles.create(10, bounds);
    const mat = points.material as THREE.ShaderMaterial;
    expect(mat.vertexShader).not.toContain('attribute vec3 position;');
    expect(mat.vertexShader).not.toContain('attribute vec3 normal;');
    expect(mat.vertexShader).not.toContain('attribute vec2 uv;');
    expect(mat.vertexShader).toContain('attribute vec3 color;');
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