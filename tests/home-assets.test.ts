import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const projectRoot = process.cwd();
const homeSource = readFileSync(join(projectRoot, 'src/pages/index.astro'), 'utf8');
const portraitNames = [
  'sunyanan',
  'guohui',
  'leizichen',
  'zhangyao',
  'duyafen',
  'lizhaoyan',
  'dengjian',
  'bashengsheng',
  'zengjia',
];

describe('home page image assets', () => {
  it('uses the team photo as the homepage social preview', () => {
    expect(homeSource).toContain('ogImage="images/team-photo.jpg"');
  });

  it('uses the team photo as the visible homepage hero image', () => {
    expect(homeSource).toContain("getResponsiveImage('images/team-photo.jpg')");
  });

  it('keeps chapter one as an image slot until the expected file is supplied', () => {
    expect(homeSource).toContain("images/chapters/chapter-01.jpg");
    expect(homeSource).toContain('chapter-media--empty');
  });

  it('references a complete set of normalized portraits', () => {
    for (const name of portraitNames) {
      const relativePath = `images/portraits/${name}.jpg`;
      expect(homeSource).toContain(relativePath);
      expect(existsSync(join(projectRoot, 'assets', 'images-original', relativePath.replace(/^images\//, '')))).toBe(true);
    }
  });
});
