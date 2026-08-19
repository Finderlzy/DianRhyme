import { describe, expect, it } from 'vitest';
import { getResponsiveImage } from '../src/lib/images';

describe('responsive image source', () => {
  it('keeps one logical image identity across src and srcset', () => {
    const image = getResponsiveImage('images/team-photo.jpg');
    expect(image.src).toContain('images/team-photo.1920.webp');
    expect(image.srcSet.split(', ')).toHaveLength(3);
    expect(image.srcSet).not.toContain('team-photo.jpg');
  });

  it('rejects missing logical paths with a useful error', () => {
    expect(() => getResponsiveImage('images/not-found.jpg')).toThrow(/not-found\.jpg/);
  });
});
