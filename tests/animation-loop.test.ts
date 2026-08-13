import { describe, expect, it } from 'vitest';
import { AnimationLoop } from '../src/three/core/AnimationLoop';

describe('AnimationLoop', () => {
  it('calls the callback each frame with non-negative delta and elapsed', async () => {
    const calls: Array<{ delta: number; elapsed: number }> = [];
    const loop = new AnimationLoop();
    loop.start((delta, elapsed) => calls.push({ delta, elapsed }));
    await new Promise((r) => setTimeout(r, 60));
    loop.stop();

    expect(calls.length).toBeGreaterThan(0);
    for (const c of calls) {
      expect(typeof c.delta).toBe('number');
      expect(c.delta).toBeGreaterThanOrEqual(0);
      expect(c.elapsed).toBeGreaterThanOrEqual(0);
    }
  });

  it('stop() halts further callbacks', async () => {
    let count = 0;
    const loop = new AnimationLoop();
    loop.start(() => {
      count++;
      if (count === 2) loop.stop();
    });
    await new Promise((r) => setTimeout(r, 60));
    expect(count).toBe(2);
  });

  it('second start() while running swaps the callback without a second loop', async () => {
    const seen: string[] = [];
    const loop = new AnimationLoop();
    loop.start(() => seen.push('a'));
    loop.start(() => seen.push('b'));
    await new Promise((r) => setTimeout(r, 40));
    loop.stop();
    expect(seen.length).toBeGreaterThan(0);
    expect(seen.every((s) => s === 'b')).toBe(true);
  });
});
