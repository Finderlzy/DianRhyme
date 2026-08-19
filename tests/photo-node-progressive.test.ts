import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { PhotoNode } from '../src/three/photos/PhotoNode';
import type { Moment } from '../src/data/moments';

const moment: Moment = {
  id: 'progressive',
  src: 'full.webp',
  thumbnailSrc: 'thumb.webp',
  srcSet: 'thumb.webp 480w, full.webp 1920w',
  width: 1920,
  height: 1080,
};

describe('PhotoNode progressive loading', () => {
  it('loads only the thumbnail initially and requests full once on demand', async () => {
    let resolveThumbnail!: (texture: THREE.Texture) => void;
    let resolveFull!: (texture: THREE.Texture) => void;
    let fullCalls = 0;
    const thumbnail = new Promise<THREE.Texture>((resolve) => { resolveThumbnail = resolve; });
    const full = new Promise<THREE.Texture>((resolve) => { resolveFull = resolve; });
    const node = new PhotoNode(moment, { x: 0, y: 0, z: 0 }, {
      progressiveTextureLoader: () => ({ thumbnail, full: () => { fullCalls += 1; return full; } }),
      reducedMotion: true,
    });

    expect(fullCalls).toBe(0);
    resolveThumbnail(new THREE.Texture());
    await Promise.resolve();
    const first = node.loadFull();
    const second = node.loadFull();
    expect(first).toBe(second);
    expect(fullCalls).toBe(1);
    resolveFull(new THREE.Texture());
    await first;
    expect((node.mesh.material as THREE.MeshBasicMaterial).map).toBeTruthy();
    node.dispose();
  });

  it('keeps the thumbnail when full loading fails', async () => {
    let resolveThumbnail!: (texture: THREE.Texture) => void;
    let rejectFull!: () => void;
    const thumbnail = new Promise<THREE.Texture>((resolve) => { resolveThumbnail = resolve; });
    const full = new Promise<THREE.Texture>((_resolve, reject) => { rejectFull = () => reject(new Error('network')); });
    const node = new PhotoNode(moment, { x: 0, y: 0, z: 0 }, {
      progressiveTextureLoader: () => ({ thumbnail, full: () => full }),
      reducedMotion: true,
    });
    const thumbTexture = new THREE.Texture();
    resolveThumbnail(thumbTexture);
    await Promise.resolve();
    const fullPromise = node.loadFull();
    rejectFull();
    await fullPromise;
    expect((node.mesh.material as THREE.MeshBasicMaterial).map).toBe(thumbTexture);
    node.dispose();
  });
});
