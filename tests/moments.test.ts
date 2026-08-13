import { describe, expect, it } from 'vitest';
import { moments } from '../src/data/moments';

describe('moments data', () => {
  it('is not empty', () => {
    expect(moments.length).toBeGreaterThan(0);
  });

  it('has unique ids and non-empty src for every entry', () => {
    const ids = new Set<string>();
    for (const m of moments) {
      expect(m.id).toBeTruthy();
      expect(ids.has(m.id)).toBe(false);
      ids.add(m.id);
      expect(m.src).toBeTruthy();
    }
    expect(ids.size).toBe(moments.length);
  });

  it('references existing image paths under the base prefix', () => {
    const base = import.meta.env.BASE_URL;
    for (const m of moments) {
      expect(m.src.startsWith(base)).toBe(true);
      expect(m.src.endsWith('.jpg') || m.src.endsWith('.png')).toBe(true);
    }
  });
});
