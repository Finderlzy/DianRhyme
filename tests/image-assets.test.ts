import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { getResponsiveImage, imageManifest } from '../src/lib/images';

describe('generated image manifest', () => {
  it('contains every source image and generated dimensions', () => {
    const entries = Object.values(imageManifest);
    expect(entries).toHaveLength(58);
    for (const entry of entries) {
      expect(entry.sourceHash).toMatch(/^[a-f0-9]{64}$/);
      expect(entry.width).toBeGreaterThan(0);
      expect(entry.height).toBeGreaterThan(0);
      expect(entry.thumbnailSrc).toContain('.480.webp');
      expect(entry.srcSet).toContain('480w');
      expect(entry.srcSet).toContain('960w');
      expect(entry.srcSet).toContain('1920w');
      expect(existsSync(join(process.cwd(), 'public', entry.legacyPath))).toBe(true);
    }
  });

  it('maps legacy and base-prefixed paths to responsive URLs', () => {
    const image = getResponsiveImage('/DianRhyme/images/posts/7.26.jpg');
    const base = import.meta.env.BASE_URL;
    expect(image.src).toBe(`${base}images/posts/7.26.1920.webp`);
    expect(image.thumbnailSrc).toBe(`${base}images/posts/7.26.480.webp`);
    expect(image.width).toBeGreaterThan(0);
    expect(image.height).toBeGreaterThan(0);
  });

  it('does not expose the source tree through generated artifacts', () => {
    const manifestSource = readFileSync(join(process.cwd(), 'src/generated/image-manifest.ts'), 'utf8');
    expect(manifestSource).not.toContain('assets/images-original');
  });
});
