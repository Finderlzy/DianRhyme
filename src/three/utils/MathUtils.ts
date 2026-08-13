export interface Point3D {
  x: number;
  y: number;
  z: number;
}

export function randomInRange(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

export function distance3D(a: Point3D, b: Point3D): number {
  return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
}

export function randomSign(): number {
  return Math.random() < 0.5 ? -1 : 1;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}
