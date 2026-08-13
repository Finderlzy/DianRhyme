import { distance3D, randomInRange, type Point3D } from '../utils/MathUtils';

export interface LayoutPoint extends Point3D {}

export interface LayoutConfig {
  count: number;
  bounds: { x: number; y: number; z: number };
  minDistance: number;
  maxRetries: number;
}

function randomPoint(bounds: LayoutConfig['bounds']): LayoutPoint {
  return {
    x: randomInRange(-bounds.x, bounds.x),
    y: randomInRange(-bounds.y, bounds.y),
    z: randomInRange(-bounds.z, bounds.z),
  };
}

function minDistanceTo(p: LayoutPoint, points: LayoutPoint[]): number {
  let best = Infinity;
  for (const q of points) {
    best = Math.min(best, distance3D(p, q));
  }
  return best;
}

/**
 * 生成 count 个不重叠的空间点。
 * 每个点最多重试 maxRetries 次寻找满足 minDistance 的位置；
 * 若仍失败则接受最佳努力位置并 console.warn（不阻断）。
 */
export function generateLayout(config: LayoutConfig): LayoutPoint[] {
  const { count, bounds, minDistance, maxRetries } = config;
  const points: LayoutPoint[] = [];

  for (let i = 0; i < count; i++) {
    if (i === 0) {
      points.push(randomPoint(bounds));
      continue;
    }

    let best = randomPoint(bounds);
    let bestDist = minDistanceTo(best, points);
    let placed = false;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      const candidate = randomPoint(bounds);
      const d = minDistanceTo(candidate, points);
      if (d >= minDistance) {
        points.push(candidate);
        placed = true;
        break;
      }
      if (d > bestDist) {
        best = candidate;
        bestDist = d;
      }
    }

    if (!placed) {
      console.warn(
        `[LayoutGenerator] point ${i} could not satisfy minDistance within ${maxRetries} retries; accepting best-effort position`,
      );
      points.push(best);
    }
  }

  return points;
}
