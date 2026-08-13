import { describe, expect, it } from 'vitest';
import { resolveTier } from '../src/three/utils/DeviceTier';

const base = { dpr: 1, width: 1280, coarsePointer: false, reducedMotion: false };

describe('resolveTier', () => {
  it('desktop gets full-quality rendering', () => {
    const tier = resolveTier(base);
    expect(tier.isMobile).toBe(false);
    expect(tier.isTouch).toBe(false);
    expect(tier.pixelRatioCap).toBe(2);
    expect(tier.maxTextureEdge).toBe(2048);
    expect(tier.particleCount).toBe(550);
    expect(tier.antialias).toBe(true);
  });

  it('mobile (narrow + coarse pointer) gets downgraded rendering', () => {
    const tier = resolveTier({ ...base, width: 390, coarsePointer: true });
    expect(tier.isMobile).toBe(true);
    expect(tier.isTouch).toBe(true);
    expect(tier.pixelRatioCap).toBe(1.75);
    expect(tier.maxTextureEdge).toBe(1024);
    expect(tier.particleCount).toBe(120);
    expect(tier.antialias).toBe(false);
  });

  it('narrow window without coarse pointer is not treated as mobile', () => {
    const tier = resolveTier({ ...base, width: 600, coarsePointer: false });
    expect(tier.isMobile).toBe(false);
  });

  it('passes reducedMotion through untouched', () => {
    const tier = resolveTier({ ...base, reducedMotion: true });
    expect(tier.reducedMotion).toBe(true);
    expect(tier.isMobile).toBe(false);
  });
});