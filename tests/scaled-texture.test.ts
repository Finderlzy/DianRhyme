import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import {
  computeScaledSize,
  createPacedTextureLoader,
  loadImageBitmap,
  loadScaledImage,
} from '../src/three/utils/LoadScaledTexture';
import type { BitmapDeps, ImageDeps } from '../src/three/utils/LoadScaledTexture';

describe('computeScaledSize', () => {
  it('returns the original size when within maxEdge', () => {
    expect(computeScaledSize(800, 600, 2048)).toEqual({ width: 800, height: 600, scaled: false });
    expect(computeScaledSize(2048, 1024, 2048)).toEqual({ width: 2048, height: 1024, scaled: false });
  });

  it('downscales proportionally so the long side equals maxEdge', () => {
    const s = computeScaledSize(4000, 3000, 2048);
    expect(s.scaled).toBe(true);
    expect(s.width).toBe(2048);
    expect(s.height).toBe(1536);
  });

  it('clamps edges to a minimum of 1px', () => {
    const s = computeScaledSize(50000, 1, 2048);
    expect(s.scaled).toBe(true);
    expect(s.width).toBe(2048);
    expect(s.height).toBe(1);
  });
});

interface FakeContext {
  drawCalls: unknown[][];
}

function makeDeps(opts: {
  width: number;
  height: number;
  noContext?: boolean;
}): {
  deps: ImageDeps;
  canvas: { width: number; height: number };
  drawCalls: unknown[][];
  getInstance: () => any;
} {
  const drawCalls: unknown[][] = [];
  const canvas = {
    width: 0,
    height: 0,
    getContext: () =>
      opts.noContext
        ? null
        : {
            drawImage: (...args: unknown[]) => {
              drawCalls.push(args);
            },
          },
  };
  let instance: any;
  const FakeImage: ImageDeps['Image'] = class {
    decoding = '';
    src = '';
    onload: (() => void) | null = null;
    onerror: (() => void) | null = null;
    naturalWidth = opts.width;
    naturalHeight = opts.height;
    constructor() {
      instance = this;
    }
  } as unknown as ImageDeps['Image'];
  return {
    deps: { Image: FakeImage, document: { createElement: () => canvas } },
    canvas,
    drawCalls,
    getInstance: () => instance,
  };
}

describe('loadScaledImage', () => {
  it('downscales an oversized image onto a canvas', async () => {
    const { deps, canvas, drawCalls, getInstance } = makeDeps({ width: 4000, height: 3000 });
    const promise = loadScaledImage('x.jpg', 2048, deps);
    const img = getInstance();
    img.onload();

    const result = await promise;
    expect(result).toBe(canvas as unknown as HTMLCanvasElement);
    expect(canvas.width).toBe(2048);
    expect(canvas.height).toBe(1536);
    expect(drawCalls).toHaveLength(1);
  });

  it('keeps an already-small image unchanged', async () => {
    const { deps, getInstance } = makeDeps({ width: 800, height: 600 });
    const promise = loadScaledImage('x.jpg', 2048, deps);
    const img = getInstance();
    img.onload();

    const result = await promise;
    expect(result).toBe(img);
  });

  it('falls back to the original image when canvas context is unavailable', async () => {
    const { deps, getInstance } = makeDeps({ width: 4000, height: 3000, noContext: true });
    const promise = loadScaledImage('x.jpg', 2048, deps);
    const img = getInstance();
    img.onload();

    const result = await promise;
    expect(result).toBe(img);
  });

  it('rejects when the image fails to load', async () => {
    const { deps, getInstance } = makeDeps({ width: 800, height: 600 });
    const promise = loadScaledImage('x.jpg', 2048, deps);
    const img = getInstance();
    img.onerror();

    await expect(promise).rejects.toThrow(/Failed to load image/);
  });
});

function makeBitmapDeps(
  width: number,
  height: number,
  opts: { fetchFails?: boolean } = {},
): {
  deps: BitmapDeps;
  calls: unknown[][];
  getCallCount: () => number;
} {
  let callCount = 0;
  const calls: unknown[][] = [];
  const createImageBitmap = async (source: unknown, options?: { resizeWidth?: number; resizeHeight?: number }) => {
    callCount += 1;
    calls.push([source, options]);
    if (options?.resizeWidth) {
      return { width: options.resizeWidth, height: options.resizeHeight as number, close: () => undefined };
    }
    return { width, height, close: () => undefined };
  };
  const deps: BitmapDeps = {
    fetch: async () => ({
      ok: !opts.fetchFails,
      blob: async () => ({ fake: 'blob' }),
    }),
    createImageBitmap,
  };
  return { deps, calls, getCallCount: () => callCount };
}

describe('loadImageBitmap', () => {
  it('resizes an oversized image off-thread with a vertical flip', async () => {
    const { deps, calls, getCallCount } = makeBitmapDeps(4000, 3000);
    const result = await loadImageBitmap('x.jpg', 1024, deps);

    expect(result.width).toBe(1024);
    expect(result.height).toBe(768);
    expect(getCallCount()).toBe(2);
    expect(calls[1][1]).toEqual({
      resizeWidth: 1024,
      resizeHeight: 768,
      resizeQuality: 'high',
      imageOrientation: 'flipY',
    });
  });

  it('flips a small image vertically (no resize)', async () => {
    const { deps, calls, getCallCount } = makeBitmapDeps(800, 600);
    const result = await loadImageBitmap('x.jpg', 1024, deps);

    expect(result.width).toBe(800);
    expect(result.height).toBe(600);
    expect(getCallCount()).toBe(2);
    expect(calls[1][1]).toEqual({ imageOrientation: 'flipY' });
  });

  it('rejects when fetch fails', async () => {
    const { deps } = makeBitmapDeps(800, 600, { fetchFails: true });
    await expect(loadImageBitmap('x.jpg', 1024, deps)).rejects.toThrow(/Failed to load image/);
  });
});

describe('createPacedTextureLoader', () => {
  it('limits concurrent loads to the configured concurrency', async () => {
    let active = 0;
    let peak = 0;
    const resolves: Array<() => void> = [];
    const load = (): Promise<THREE.Texture> => {
      active += 1;
      peak = Math.max(peak, active);
      return new Promise((resolve) => {
        resolves.push(() => {
          active -= 1;
          resolve(new THREE.Texture());
        });
      });
    };
    const loader = createPacedTextureLoader({ maxEdge: 1024, concurrency: 2 }, load);

    const a = loader('a');
    const b = loader('b');
    const c = loader('c');
    expect(active).toBe(2);
    expect(peak).toBe(2);

    resolves[0]();
    await Promise.resolve();
    expect(active).toBe(2);

    resolves[1]();
    await Promise.resolve();
    expect(active).toBe(1);

    resolves[2]();
    await Promise.resolve();
    expect(active).toBe(0);
    await Promise.all([a, b, c]);
  });

  it('runs queued jobs in order and resolves all', async () => {
    const order: string[] = [];
    const resolves: Array<() => void> = [];
    const load = (src: string): Promise<THREE.Texture> =>
      new Promise((resolve) => {
        order.push(src);
        resolves.push(() => resolve(new THREE.Texture()));
      });
    const loader = createPacedTextureLoader({ maxEdge: 1024, concurrency: 1 }, load);

    const a = loader('a');
    const b = loader('b');
    const c = loader('c');
    expect(order).toEqual(['a']);

    resolves[0]();
    await Promise.resolve();
    expect(order).toEqual(['a', 'b']);

    resolves[1]();
    await Promise.resolve();
    expect(order).toEqual(['a', 'b', 'c']);

    resolves[2]();
    await Promise.all([a, b, c]);
  });
});