import { describe, expect, it } from 'vitest';
import { clamp, distance3D, lerp, randomInRange, randomSign } from '../src/three/utils/MathUtils';

describe('MathUtils', () => {
  it('randomInRange returns values within [min, max]', () => {
    for (let i = 0; i < 200; i++) {
      const v = randomInRange(-5, 10);
      expect(v).toBeGreaterThanOrEqual(-5);
      expect(v).toBeLessThanOrEqual(10);
    }
  });

  it('distance3D computes Euclidean distance', () => {
    expect(distance3D({ x: 0, y: 0, z: 0 }, { x: 3, y: 4, z: 0 })).toBe(5);
    expect(distance3D({ x: 1, y: 2, z: 2 }, { x: 1, y: 2, z: 2 })).toBe(0);
    expect(distance3D({ x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 7 })).toBe(7);
  });

  it('randomSign returns only -1 or 1', () => {
    for (let i = 0; i < 200; i++) {
      expect([-1, 1]).toContain(randomSign());
    }
  });

  it('clamp bounds the value', () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-3, 0, 10)).toBe(0);
    expect(clamp(42, 0, 10)).toBe(10);
  });

  it('lerp interpolates between a and b', () => {
    expect(lerp(0, 10, 0)).toBe(0);
    expect(lerp(0, 10, 1)).toBe(10);
    expect(lerp(0, 10, 0.5)).toBe(5);
  });
});
