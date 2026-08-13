import { describe, expect, it, vi } from 'vitest';
import * as THREE from 'three';
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

  it('clamps delta to MAX_DELTA (0.05) when a single frame stalls', async () => {
    const getDeltaSpy = vi.spyOn(THREE.Clock.prototype, 'getDelta').mockReturnValue(10);
    const deltas: number[] = [];
    const loop = new AnimationLoop();
    loop.start((delta) => deltas.push(delta));
    await new Promise((r) => setTimeout(r, 20));
    loop.stop();
    getDeltaSpy.mockRestore();

    expect(deltas.length).toBeGreaterThan(0);
    for (const d of deltas) {
      expect(d).toBeLessThanOrEqual(0.05);
    }
  });

  it('pauses on document.hidden and resumes when visible (no double loop)', async () => {
    const listeners: Record<string, () => void> = {};
    const documentStub: {
      hidden: boolean;
      addEventListener: (type: string, cb: () => void) => void;
      removeEventListener: (type: string) => void;
    } = {
      hidden: false,
      addEventListener: (type, cb) => {
        listeners[type] = cb;
      },
      removeEventListener: (type) => {
        delete listeners[type];
      },
    };
    const originalDocument = (globalThis as Record<string, unknown>).document;
    (globalThis as Record<string, unknown>).document = documentStub;

    let count = 0;
    const loop = new AnimationLoop();
    loop.start(() => count++);
    await new Promise((r) => setTimeout(r, 30));
    expect(count).toBeGreaterThan(0);
    expect(typeof listeners['visibilitychange']).toBe('function');

    documentStub.hidden = true;
    listeners['visibilitychange']();
    const afterHide = count;
    await new Promise((r) => setTimeout(r, 30));
    expect(count).toBe(afterHide);

    documentStub.hidden = false;
    listeners['visibilitychange']();
    await new Promise((r) => setTimeout(r, 30));
    expect(count).toBeGreaterThan(afterHide);

    loop.stop();
    (globalThis as Record<string, unknown>).document = originalDocument;
  });
});
