import { describe, expect, it } from 'vitest';
import { groupPostEntries, normalizePostEntries } from '../src/data/posts';

describe('post entry normalization', () => {
  it('sorts posts and groups pre-trip records into the prologue', () => {
    const entries = normalizePostEntries([
      { date: '2026-07-27', title: '到达后' },
      { date: '2026-07-14', title: '第一次队员会' },
      { date: '2026-07-10', title: '小队集结' },
    ]);
    const groups = groupPostEntries(entries);
    expect(entries.map((entry) => entry.date)).toEqual(['2026-07-10', '2026-07-14', '2026-07-27']);
    expect(groups.prologue).toHaveLength(2);
    expect(groups.journey).toHaveLength(1);
  });

  it('falls back safely for incomplete frontmatter and keeps anchors unique', () => {
    const entries = normalizePostEntries([
      { title: '' },
      { title: '' },
      { date: 'not-a-date', title: '缺失日期' },
    ]);
    expect(entries).toHaveLength(3);
    expect(entries.every((entry) => entry.id.length > 0)).toBe(true);
    expect(new Set(entries.map((entry) => entry.id)).size).toBe(3);
    expect(entries[0].date).toBe('1970-01-01');
    expect(entries[0].excerpt).toBe('');
    expect(entries[0].location).toBe('澜沧');
  });

  it('does not drop the eleven current records', () => {
    const entries = normalizePostEntries(Array.from({ length: 11 }, (_, index) => ({ date: `2026-07-${String(index + 10).padStart(2, '0')}`, title: `记录 ${index}` })));
    expect(entries).toHaveLength(11);
  });
});

