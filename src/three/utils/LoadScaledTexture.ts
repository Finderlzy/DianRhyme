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

export interface BitmapDeps {
  fetch: (url: string) => Promise<{ ok: boolean; blob: () => Promise<unknown> }>;
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

/**
 * 离屏路径:fetch 图片为 blob,交给 createImageBitmap 在浏览器 worker 中解码并等比缩放。
 * 主线程只负责发起,不做任何 drawImage。超大图会先解码取尺寸,再二次离屏缩放。
 * 注意:three 对 ImageBitmap 来源不应用 UNPACK_FLIP_Y_WEBGL(见 WebGLTextures.js),
 * 必须用 imageOrientation:'flipY' 预翻转,否则纹理上下颠倒。
 */
export async function loadImageBitmap(
  url: string,
  maxEdge: number,
  deps: BitmapDeps = defaultBitmapDeps(),
): Promise<ImageBitmapLike> {
  const response = await deps.fetch(url);
  if (!response.ok) throw new Error(`Failed to load image: ${url}`);
  const blob = await response.blob();
  const source = await deps.createImageBitmap(blob);
  const size = computeScaledSize(source.width, source.height, maxEdge);
  let result: ImageBitmapLike;
  if (size.scaled) {
    result = await deps.createImageBitmap(source, {
      resizeWidth: size.width,
      resizeHeight: size.height,
      resizeQuality: 'high',
      imageOrientation: 'flipY',
    });
  } else {
    result = await deps.createImageBitmap(source, { imageOrientation: 'flipY' });
  }
  source.close();
  return result;
}

export interface PacedTextureLoaderOptions {
  maxEdge: number;
  concurrency?: number;
}

/**
 * 带并发上限的纹理加载器:同一时刻最多 concurrency 张图片在途,避免大图下载/解码集中突发。
 * 优先走 createImageBitmap 离屏路径,不支持或失败时回退到 canvas 路径。
 */
export function createPacedTextureLoader(
  options: PacedTextureLoaderOptions,
  load?: (src: string) => Promise<THREE.Texture>,
): (src: string) => Promise<THREE.Texture> {
  const { maxEdge, concurrency = 6 } = options;
  let inFlight = 0;
  const queue: Array<() => void> = [];

  const pump = (): void => {
    while (inFlight < concurrency && queue.length > 0) {
      inFlight += 1;
      const run = queue.shift() as () => void;
      run();
    }
  };

  const enqueue = (job: () => Promise<THREE.Texture>): Promise<THREE.Texture> =>
    new Promise((resolve, reject) => {
      const run = (): void => {
        job().then(
          (value) => {
            inFlight -= 1;
            resolve(value);
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

  const loadImpl: (src: string) => Promise<THREE.Texture> =
    load ?? ((src) => loadSource(src, maxEdge).then(textureFromSource));

  return (src) => enqueue(() => loadImpl(src));
}

async function loadSource(url: string, maxEdge: number): Promise<TextureSource> {
  if (typeof globalThis.createImageBitmap === 'function' && typeof globalThis.fetch === 'function') {
    try {
      return await loadImageBitmap(url, maxEdge);
    } catch {
      // 离屏路径失败(如 CORS)时回退到 canvas 路径
    }
  }
  return loadScaledImage(url, maxEdge);
}