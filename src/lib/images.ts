import { imageManifest as generatedImageManifest } from '../generated/image-manifest';

export interface ResponsiveImageSource {
  src: string;
  thumbnailSrc: string;
  srcSet: string;
  width: number;
  height: number;
}

export interface ImageManifestEntry extends ResponsiveImageSource {
  logicalPath: string;
  legacyPath: string;
  sourceHash: string;
  recipeVersion: string;
}

export const imageManifest = generatedImageManifest as unknown as Record<string, ImageManifestEntry>;

const base = import.meta.env.BASE_URL;

function withBase(path: string): string {
  return `${base.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
}

function normalizeLogicalPath(path: string): string {
  const normalized = path.trim().replaceAll('\\', '/');
  const withoutOrigin = normalized.replace(/^https?:\/\/[^/]+/i, '');
  const withoutBase = withoutOrigin.replace(/^\/DianRhyme\//, '/').replace(new RegExp(`^${base.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`), '/');
  const relative = withoutBase.replace(/^\/+/, '');
  return relative.startsWith('images/') ? relative : `images/${relative}`;
}

export function getResponsiveImage(path: string): ResponsiveImageSource {
  const logicalPath = normalizeLogicalPath(path);
  const entry = imageManifest[logicalPath];
  if (!entry) throw new Error(`Unknown logical image path: ${path}`);
  return {
    src: withBase(entry.src),
    thumbnailSrc: withBase(entry.thumbnailSrc),
    srcSet: entry.srcSet.replace(/(^|, )\//g, `$1${base.replace(/\/$/, '')}/`),
    width: entry.width,
    height: entry.height,
  };
}

export function getLegacyImageUrl(path: string): string {
  const logicalPath = normalizeLogicalPath(path);
  if (!imageManifest[logicalPath]) throw new Error(`Unknown logical image path: ${path}`);
  return withBase(logicalPath);
}

export function getImageLogicalPath(path: string): string {
  return normalizeLogicalPath(path);
}
