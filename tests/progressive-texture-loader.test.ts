import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { createProgressiveTextureLoader } from '../src/three/utils/LoadScaledTexture';

describe('progressive texture loader', () => {
  it('does not start full loading before full is called and caches it after first call', async () => {
    const requests: string[] = [];
    const loader = createProgressiveTextureLoader({
      loadTexture: async (url) => {
        requests.push(url);
        return new THREE.Texture();
      },
    });
    const source = { thumbnail: 'thumb.webp', full: 'full.webp' };
    const staged = loader.load(source);
    await staged.thumbnail;
    expect(requests).toEqual(['thumb.webp']);
    const first = staged.full();
    const second = staged.full();
    expect(first).toBe(second);
    await first;
    expect(requests).toEqual(['thumb.webp', 'full.webp']);
    loader.dispose();
  });

  it('limits thumbnail and full queues independently', async () => {
    let thumbActive = 0;
    let fullActive = 0;
    let thumbPeak = 0;
    let fullPeak = 0;
    const loader = createProgressiveTextureLoader({
      thumbnailConcurrency: 2,
      fullConcurrency: 1,
      loadTexture: async (url) => {
        const isFull = url.startsWith('full');
        if (isFull) {
          fullActive += 1;
          fullPeak = Math.max(fullPeak, fullActive);
        } else {
          thumbActive += 1;
          thumbPeak = Math.max(thumbPeak, thumbActive);
        }
        await Promise.resolve();
        await Promise.resolve();
        if (isFull) fullActive -= 1;
        else thumbActive -= 1;
        return new THREE.Texture();
      },
    });
    const entries = ['a', 'b', 'c'].map((id) => loader.load({ thumbnail: `thumb-${id}`, full: `full-${id}` }));
    const all = entries.flatMap((entry) => [entry.thumbnail, entry.full()]);
    expect(thumbPeak).toBeLessThanOrEqual(2);
    expect(fullPeak).toBeLessThanOrEqual(1);
    await Promise.all(all);
    loader.dispose();
  });
});
