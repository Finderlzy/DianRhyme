import * as THREE from 'three';

export function computeScaledSize(
  width: number,
  height: number,
  maxEdge: number,
): { width: number; height: number; scaled: boolean } {
  const edge = Math.max(width, height);
  if (edge <= maxEdge) return { width, height, scaled: false };
  const scale = maxEdge / edge;
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
    scaled: true,
  };
}

export interface ImageDeps {
  Image: new () => {
    decoding?: string;
    src: string;
    onload: (() => void) | null;
    onerror: (() => void) | null;
    naturalWidth: number;
    naturalHeight: number;
  };
  document: {
    createElement(tag: string): {
      width: number;
      height: number;
      getContext(type: string, opts?: unknown): { drawImage(image: unknown, x: number, y: number, w: number, h: number): void } | null;
    };
  };
}

function defaultImageDeps(): ImageDeps {
  return {
    Image: globalThis.Image,
    document: globalThis.document,
  };
}

/**
 * 加载图片并（若超出 maxEdge）用 canvas 等比降采样。
 * 任何 DOM/canvas 异常都不阻断：兜底返回原图或 reject。
 */
export function loadScaledImage(
  url: string,
  maxEdge: number,
  deps: ImageDeps = defaultImageDeps(),
): Promise<HTMLImageElement | HTMLCanvasElement> {
  return new Promise((resolve, reject) => {
    const img = new deps.Image();
    img.decoding = 'async';
    img.onload = () => {
      try {
        const size = computeScaledSize(img.naturalWidth, img.naturalHeight, maxEdge);
        if (!size.scaled) {
          resolve(img as HTMLImageElement);
          return;
        }
        const canvas = deps.document.createElement('canvas');
        canvas.width = size.width;
        canvas.height = size.height;
        const ctx = canvas.getContext('2d', { alpha: false });
        if (!ctx) {
          resolve(img as HTMLImageElement);
          return;
        }
        ctx.drawImage(img, 0, 0, size.width, size.height);
        resolve(canvas as HTMLCanvasElement);
      } catch {
        resolve(img as HTMLImageElement);
      }
    };
    img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
    img.src = url;
  });
}

export interface ImageBitmapLike {
  readonly width: number;
  readonly height: number;
  close(): void;
}

export type TextureSource = HTMLImageElement | HTMLCanvasElement | ImageBitmapLike;

export function textureFromSource(source: TextureSource): THREE.Texture {
  const isCanvas =
    typeof HTMLCanvasElement !== 'undefined' && typeof source === 'object' && source instanceof HTMLCanvasElement;
  const texture = isCanvas
    ? new THREE.CanvasTexture(source)
    : new THREE.Texture(source as THREE.TextureImage);
  texture.needsUpdate = true;
  return texture;
}

/**
 * 从文件头解析图片尺寸，避免为取宽高而做一次完整解码。
 * 支持 JPEG（SOF0/SOF2 等）与 PNG（IHDR），其它格式返回 null。
 */
export function parseImageDimensions(bytes: Uint8Array): { width: number; height: number } | null {
  if (bytes.length < 4) return null;

  // PNG signature: 89 50 4E 47 0D 0A 1A 0A
  if (
    bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47 &&
    bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a &&
    bytes.length >= 24
  ) {
    const width = (bytes[16] << 24) | (bytes[17] << 16) | (bytes[18] << 8) | bytes[19];
    const height = (bytes[20] << 24) | (bytes[21] << 16) | (bytes[22] << 8) | bytes[23];
    if (width > 0 && height > 0) return { width, height };
    return null;
  }

  // JPEG SOI: FF D8
  if (bytes[0] === 0xff && bytes[1] === 0xd8) {
    let offset = 2;
    while (offset + 9 < bytes.length) {
      if (bytes[offset] !== 0xff) {
        offset += 1;
        continue;
      }
      const marker = bytes[offset + 1];
      if (marker === 0xff) {
        offset += 1;
        continue;
      }
      // 无长度字段的独立标记
      if (marker === 0xd8 || marker === 0xd9 || (marker >= 0xd0 && marker <= 0xd7)) {
        offset += 2;
        continue;
      }
      const length = (bytes[offset + 2] << 8) | bytes[offset + 3];
      if (length < 2) break;
      // SOF 标记族
      const isSof =
        (marker >= 0xc0 && marker <= 0xc3) ||
        (marker >= 0xc5 && marker <= 0xc7) ||
        (marker >= 0xc9 && marker <= 0xcb) ||
        (marker >= 0xcd && marker <= 0xcf);
      if (isSof) {
        const height = (bytes[offset + 5] << 8) | bytes[offset + 6];
        const width = (bytes[offset + 7] << 8) | bytes[offset + 8];
        if (width > 0 && height > 0) return { width, height };
        return null;
      }
      offset += 2 + length;
    }
    return null;
  }

  return null;
}

export interface BlobLike {
  slice(start?: number, end?: number): { arrayBuffer(): Promise<ArrayBuffer> };
}

export interface BitmapDeps {
  fetch: (url: string) => Promise<{ ok: boolean; blob: () => Promise<BlobLike> }>;
  createImageBitmap: (
    source: unknown,
    options?: {
      resizeWidth?: number;
      resizeHeight?: number;
      resizeQuality?: 'low' | 'medium' | 'high';
      imageOrientation?: 'from-image' | 'flipY' | 'none';
    },
  ) => Promise<ImageBitmapLike>;
}

function defaultBitmapDeps(): BitmapDeps {
  return {
    fetch: (url) => globalThis.fetch(url),
    createImageBitmap: (source, options) => globalThis.createImageBitmap(source as ImageBitmapSource, options),
  };
}

function hasOffThreadSupport(): boolean {
  return typeof globalThis.createImageBitmap === 'function' && typeof globalThis.fetch === 'function';
}

function scaledSizeFor(dims: { width: number; height: number }, edge: number): { w: number; h: number } | null {
  const longEdge = Math.max(dims.width, dims.height);
  if (longEdge <= edge) return null;
  const scale = edge / longEdge;
  return {
    w: Math.max(1, Math.round(dims.width * scale)),
    h: Math.max(1, Math.round(dims.height * scale)),
  };
}

async function decodeBitmap(
  deps: BitmapDeps,
  blob: BlobLike,
  dims: { width: number; height: number } | null,
  edge: number,
  quality: 'low' | 'high',
): Promise<ImageBitmapLike> {
  const size = dims ? scaledSizeFor(dims, edge) : null;
  const options = size
    ? { resizeWidth: size.w, resizeHeight: size.h, resizeQuality: quality, imageOrientation: 'flipY' as const }
    : { imageOrientation: 'flipY' as const };
  return deps.createImageBitmap(blob, options);
}

export interface StagedLoadOptions {
  thumbEdge: number;
  maxEdge: number;
}

export interface StagedCallbacks {
  thumbnail?: (source: TextureSource) => void;
  full?: (source: TextureSource) => void;
}

/**
 * 两段式加载：先解小尺寸缩略图（几乎瞬时点亮照片），再解全分辨率并替换。
 * 优先走 createImageBitmap 离屏路径（尺寸由文件头解析，避免为量宽高而做一次完整解码）；
 * 不支持或失败时回退到单次 Image 解码 + canvas 降采样。
 */
export async function loadStagedSource(
  url: string,
  opts: StagedLoadOptions,
  callbacks: StagedCallbacks,
  bitmapDeps: BitmapDeps | null = hasOffThreadSupport() ? defaultBitmapDeps() : null,
  imageDeps: ImageDeps = defaultImageDeps(),
): Promise<void> {
  if (bitmapDeps) {
    try {
      const response = await bitmapDeps.fetch(url);
      if (!response.ok) throw new Error(`Failed to load image: ${url}`);
      const blob = await response.blob();
      const header = new Uint8Array(await blob.slice(0, 65536).arrayBuffer());
      const dims = parseImageDimensions(header);
      const thumbnail = await decodeBitmap(bitmapDeps, blob, dims, opts.thumbEdge, 'low');
      callbacks.thumbnail?.(thumbnail);
      const full = await decodeBitmap(bitmapDeps, blob, dims, opts.maxEdge, 'high');
      callbacks.full?.(full);
      return;
    } catch {
      // 离屏路径失败（如 CORS）时回退到 canvas 路径
    }
  }
  const img = await loadScaledImage(url, opts.maxEdge, imageDeps);
  callbacks.thumbnail?.(img);
  callbacks.full?.(img);
}

export interface StagedTexture {
  thumbnail: THREE.Texture;
  full: THREE.Texture;
}

export type StagedTextureLoader = (src: string) => {
  thumbnail: Promise<THREE.Texture>;
  full: Promise<THREE.Texture>;
};

export interface StagedTextureLoaderOptions {
  thumbEdge?: number;
  maxEdge: number;
  concurrency?: number;
}

/**
 * 带并发上限的两段式纹理加载器：同一时刻最多 concurrency 张图片在途。
 * 缩略图先于全图 resolve，让照片尽快可见。
 */
export function createStagedTextureLoader(
  options: StagedTextureLoaderOptions,
  loadSource?: (src: string, callbacks: StagedCallbacks) => Promise<void>,
): StagedTextureLoader {
  const { thumbEdge = 256, maxEdge, concurrency = 6 } = options;
  const bitmapDeps = hasOffThreadSupport() ? defaultBitmapDeps() : null;
  const imageDeps = defaultImageDeps();
  const load =
    loadSource ??
    ((src: string, callbacks: StagedCallbacks) =>
      loadStagedSource(src, { thumbEdge, maxEdge }, callbacks, bitmapDeps, imageDeps));

  let inFlight = 0;
  const queue: Array<() => void> = [];

  const pump = (): void => {
    while (inFlight < concurrency && queue.length > 0) {
      inFlight += 1;
      const run = queue.shift() as () => void;
      run();
    }
  };

  const enqueue = (job: () => Promise<void>): Promise<void> =>
    new Promise((resolve, reject) => {
      const run = (): void => {
        job().then(
          () => {
            inFlight -= 1;
            resolve();
            pump();
          },
          (error) => {
            inFlight -= 1;
            reject(error);
            pump();
          },
        );
      };
      queue.push(run);
      pump();
    });

  return (src: string) => {
    let resolveThumb: (t: THREE.Texture) => void;
    let rejectThumb: (e: unknown) => void;
    let resolveFull: (t: THREE.Texture) => void;
    let rejectFull: (e: unknown) => void;
    const thumbnail = new Promise<THREE.Texture>((res, rej) => {
      resolveThumb = res;
      rejectThumb = rej;
    });
    const full = new Promise<THREE.Texture>((res, rej) => {
      resolveFull = res;
      rejectFull = rej;
    });
    enqueue(() =>
      load(src, {
        thumbnail: (s) => resolveThumb(textureFromSource(s)),
        full: (s) => resolveFull(textureFromSource(s)),
      }),
    ).catch((e) => {
      rejectThumb(e);
      rejectFull(e);
    });
    return { thumbnail, full };
  };
}
