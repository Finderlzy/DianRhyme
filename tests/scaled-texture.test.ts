import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import {
  computeScaledSize,
  createStagedTextureLoader,
  loadScaledImage,
  loadStagedSource,
  parseImageDimensions,
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

describe('parseImageDimensions', () => {
  function pngBytes(width: number, height: number): Uint8Array {
    const bytes = new Uint8Array(24);
    bytes.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], 0);
    bytes[8] = 0; bytes[9] = 0; bytes[10] = 0; bytes[11] = 13;
    bytes[12] = 0x49; bytes[13] = 0x48; bytes[14] = 0x44; bytes[15] = 0x52; // "IHDR"
    bytes[16] = (width >>> 24) & 0xff;
    bytes[17] = (width >>> 16) & 0xff;
    bytes[18] = (width >>> 8) & 0xff;
    bytes[19] = width & 0xff;
    bytes[20] = (height >>> 24) & 0xff;
    bytes[21] = (height >>> 16) & 0xff;
    bytes[22] = (height >>> 8) & 0xff;
    bytes[23] = height & 0xff;
    return bytes;
  }

  function jpegBytes(width: number, height: number): Uint8Array {
    const bytes = new Uint8Array(17);
    bytes[0] = 0xff; bytes[1] = 0xd8;
    bytes[2] = 0xff; bytes[3] = 0xc0; // SOF0
    bytes[4] = 0x00; bytes[5] = 0x11;
    bytes[6] = 0x08; // precision
    bytes[7] = (height >>> 8) & 0xff; bytes[8] = height & 0xff;
    bytes[9] = (width >>> 8) & 0xff; bytes[10] = width & 0xff;
    return bytes;
  }

  it('reads PNG width/height from IHDR', () => {
    expect(parseImageDimensions(pngBytes(2560, 1440))).toEqual({ width: 2560, height: 1440 });
  });

  it('reads JPEG width/height from SOF0', () => {
    expect(parseImageDimensions(jpegBytes(1920, 1080))).toEqual({ width: 1920, height: 1080 });
  });

  it('returns null for non-image or truncated bytes', () => {
    expect(parseImageDimensions(new Uint8Array(0))).toBeNull();
    expect(parseImageDimensions(new Uint8Array([1, 2, 3, 4]))).toBeNull();
    expect(parseImageDimensions(new Uint8Array([0xff, 0xd8, 0xff]))).toBeNull();
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

function pngHeader(width: number, height: number): Uint8Array {
  const bytes = new Uint8Array(24);
  bytes.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], 0);
  bytes[12] = 0x49; bytes[13] = 0x48; bytes[14] = 0x44; bytes[15] = 0x52;
  bytes[16] = (width >>> 24) & 0xff;
  bytes[17] = (width >>> 16) & 0xff;
  bytes[18] = (width >>> 8) & 0xff;
  bytes[19] = width & 0xff;
  bytes[20] = (height >>> 24) & 0xff;
  bytes[21] = (height >>> 16) & 0xff;
  bytes[22] = (height >>> 8) & 0xff;
  bytes[23] = height & 0xff;
  return bytes;
}

function makeBitmapDeps(width: number, height: number): {
  deps: BitmapDeps;
  calls: Array<{ resizeWidth?: number; resizeHeight?: number; resizeQuality?: string }>;
} {
  const calls: Array<{ resizeWidth?: number; resizeHeight?: number; resizeQuality?: string }> = [];
  const header = pngHeader(width, height);
  const blob = {
    slice: () => ({ arrayBuffer: async () => header.slice().buffer as ArrayBuffer }),
  };
  const createImageBitmap = async (
    _source: unknown,
    options?: { resizeWidth?: number; resizeHeight?: number; resizeQuality?: 'low' | 'high' },
  ) => {
    calls.push(options ?? {});
    return {
      width: options?.resizeWidth ?? width,
      height: options?.resizeHeight ?? height,
      close: () => undefined,
    };
  };
  const deps: BitmapDeps = {
    fetch: async () => ({ ok: true, blob: async () => blob }),
    createImageBitmap,
  };
  return { deps, calls };
}

describe('loadStagedSource', () => {
  it('decodes a thumbnail first, then full, each scaled to keep aspect', async () => {
    const { deps, calls } = makeBitmapDeps(2560, 1440);
    const order: string[] = [];
    await loadStagedSource('x.jpg', { thumbEdge: 256, maxEdge: 1024 }, {
      thumbnail: () => order.push('thumb'),
      full: () => order.push('full'),
    }, deps);

    expect(order).toEqual(['thumb', 'full']);
    expect(calls[0].resizeWidth).toBe(256);
    expect(calls[0].resizeHeight).toBe(144);
    expect(calls[1].resizeWidth).toBe(1024);
    expect(calls[1].resizeHeight).toBe(576);
  });

  it('falls back to the canvas path when bitmap deps are unavailable', async () => {
    const { deps, getInstance } = makeDeps({ width: 800, height: 600 });
    const seen: string[] = [];
    const promise = loadStagedSource('x.jpg', { thumbEdge: 256, maxEdge: 1024 }, {
      thumbnail: () => seen.push('thumb'),
      full: () => seen.push('full'),
    }, null, deps);
    const img = getInstance();
    img.onload();

    await promise;
    expect(seen).toEqual(['thumb', 'full']);
  });
});

describe('createStagedTextureLoader', () => {
  it('limits concurrent loads to the configured concurrency', async () => {
    let active = 0;
    let peak = 0;
    const resolves: Array<() => void> = [];
    const loadSource = (_src: string, callbacks: { thumbnail: (s: unknown) => void; full: (s: unknown) => void }) => {
      active += 1;
      peak = Math.max(peak, active);
      return new Promise<void>((resolve) => {
        resolves.push(() => {
          active -= 1;
          callbacks.thumbnail({});
          callbacks.full({});
          resolve();
        });
      });
    };
    const loader = createStagedTextureLoader({ maxEdge: 1024, concurrency: 2 }, loadSource);

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
    await Promise.all([a.thumbnail, a.full, b.thumbnail, b.full, c.thumbnail, c.full]);
  });

  it('resolves thumbnail before full', async () => {
    const order: string[] = [];
    const loadSource = async (_src: string, callbacks: { thumbnail: (s: unknown) => void; full: (s: unknown) => void }) => {
      callbacks.thumbnail({});
      order.push('thumb');
      callbacks.full({});
      order.push('full');
    };
    const loader = createStagedTextureLoader({ maxEdge: 1024 }, loadSource);
    const { thumbnail, full } = loader('x');
    const [thumbTexture, fullTexture] = await Promise.all([thumbnail, full]);
    expect(thumbTexture).toBeInstanceOf(THREE.Texture);
    expect(fullTexture).toBeInstanceOf(THREE.Texture);
    expect(order).toEqual(['thumb', 'full']);
  });
});
