import { describe, expect, it, vi } from 'vitest';
import { generateLayout, type LayoutPoint } from '../src/three/photos/LayoutGenerator';

function distance(a: LayoutPoint, b: LayoutPoint): number {
  return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
}

describe('generateLayout', () => {
  it('returns exactly count points', () => {
    const points = generateLayout({ count: 15, bounds: { x: 20, y: 12, z: 8 }, minDistance: 2, maxRetries: 60 });
    expect(points).toHaveLength(15);
  });

  it('keeps points within bounds', () => {
    const points = generateLayout({ count: 15, bounds: { x: 20, y: 12, z: 8 }, minDistance: 2, maxRetries: 60 });
    for (const p of points) {
      expect(Math.abs(p.x)).toBeLessThanOrEqual(20);
      expect(Math.abs(p.y)).toBeLessThanOrEqual(12);
      expect(Math.abs(p.z)).toBeLessThanOrEqual(8);
    }
  });

  it('keeps pairwise distance >= minDistance when retries are not exhausted', () => {
    const config = { count: 12, bounds: { x: 20, y: 12, z: 8 }, minDistance: 2, maxRetries: 200 };
    const points = generateLayout(config);
    for (let i = 0; i < points.length; i++) {
      for (let j = i + 1; j < points.length; j++) {
        expect(distance(points[i], points[j])).toBeGreaterThanOrEqual(config.minDistance - 1e-9);
      }
    }
  });

  it('falls back gracefully when placement is impossible, still returning count points', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const points = generateLayout({ count: 5, bounds: { x: 0, y: 0, z: 0 }, minDistance: 1, maxRetries: 10 });
    expect(points).toHaveLength(5);
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });
});
