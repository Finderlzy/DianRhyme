export type PostPhase = 'prologue' | 'journey';

export interface RawPost {
  date?: unknown;
  title?: unknown;
  cover?: unknown;
  excerpt?: unknown;
  url?: unknown;
  location?: unknown;
  phase?: unknown;
  featured?: unknown;
  variant?: unknown;
}

export interface PostEntry {
  id: string;
  date: string;
  dateValue: number;
  title: string;
  cover: string;
  excerpt: string;
  url: string;
  location: string;
  phase: PostPhase;
  featured: boolean;
  variant: string;
}

const FALLBACK_DATE = '1970-01-01';

function asText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : value == null ? '' : String(value).trim();
}

function normalizeDate(value: unknown): { date: string; dateValue: number } {
  const raw = value instanceof Date ? value.toISOString().slice(0, 10) : asText(value);
  const parsed = Date.parse(raw);
  if (Number.isNaN(parsed)) return { date: FALLBACK_DATE, dateValue: 0 };
  const date = new Date(parsed);
  const normalized = date.toISOString().slice(0, 10);
  return { date: normalized, dateValue: date.getTime() };
}

function uniqueId(date: string, title: string, used: Set<string>): string {
  const seed = (date + '-' + (title || 'entry')).toLowerCase().replace(/[^a-z0-9\u4e00-\u9fff]+/g, '-').replace(/^-|-$/g, '') || 'entry';
  let id = seed;
  let suffix = 2;
  while (used.has(id)) id = seed + '-' + suffix++;
  used.add(id);
  return id;
}

export function normalizePostEntries(rawPosts: RawPost[], startDate = '2026-07-26'): PostEntry[] {
  const used = new Set<string>();
  const startValue = Date.parse(startDate);
  return rawPosts.map((raw) => {
    const date = normalizeDate(raw.date);
    const title = asText(raw.title) || '未命名纪事';
    const entry: PostEntry = {
      id: uniqueId(date.date, title, used),
      ...date,
      title,
      cover: asText(raw.cover),
      excerpt: asText(raw.excerpt),
      url: asText(raw.url),
      location: asText(raw.location) || '澜沧',
      phase: raw.phase === 'prologue' || raw.phase === 'journey' ? raw.phase : date.dateValue < startValue ? 'prologue' : 'journey',
      featured: raw.featured === true,
      variant: asText(raw.variant) || 'standard',
    };
    return entry;
  }).sort((a, b) => a.dateValue - b.dateValue || a.title.localeCompare(b.title));
}

export function groupPostEntries(entries: PostEntry[]): { prologue: PostEntry[]; journey: PostEntry[] } {
  return {
    prologue: entries.filter((entry) => entry.phase === 'prologue'),
    journey: entries.filter((entry) => entry.phase === 'journey'),
  };
}

export function formatPostDate(date: string): string {
  return date === FALLBACK_DATE ? '日期待核' : date.replace(/-/g, '.');
}

