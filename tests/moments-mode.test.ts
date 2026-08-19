import { describe, expect, it } from 'vitest';
import { chooseMomentsMode } from '../src/data/moments-mode';

describe('moments mode selection', () => {
  it('defaults to gallery for narrow or coarse-pointer devices', () => {
    expect(chooseMomentsMode({ width: 375, coarsePointer: false })).toBe('gallery');
    expect(chooseMomentsMode({ width: 1440, coarsePointer: true })).toBe('gallery');
  });

  it('defaults to star map on desktop', () => {
    expect(chooseMomentsMode({ width: 1440, coarsePointer: false })).toBe('star');
  });

  it('honors explicit user choice', () => {
    expect(chooseMomentsMode({ width: 375, coarsePointer: false, userChoice: 'star' })).toBe('star');
    expect(chooseMomentsMode({ width: 1440, coarsePointer: false, userChoice: 'gallery' })).toBe('gallery');
  });
});

