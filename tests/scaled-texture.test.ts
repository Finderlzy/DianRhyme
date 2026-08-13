import { describe, expect, it } from 'vitest';
import { computeScaledSize, loadScaledImage } from '../src/three/utils/LoadScaledTexture';
import type { ImageDeps } from '../src/three/utils/LoadScaledTexture';

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