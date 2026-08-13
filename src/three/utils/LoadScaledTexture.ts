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

export function textureFromSource(source: HTMLImageElement | HTMLCanvasElement): THREE.Texture {
  const isCanvas =
    typeof HTMLCanvasElement !== 'undefined' && typeof source === 'object' && source instanceof HTMLCanvasElement;
  const texture = isCanvas ? new THREE.CanvasTexture(source) : new THREE.Texture(source);
  texture.needsUpdate = true;
  return texture;
}