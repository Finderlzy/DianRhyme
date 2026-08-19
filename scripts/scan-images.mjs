import { createHash } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';
import { extname, join, relative, resolve, sep } from 'node:path';
import sharp from 'sharp';

const root = resolve(process.cwd());
const sourceDir = join(root, 'assets', 'images-original');
const distDir = join(root, 'dist');

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...await walk(path));
    else if (['.jpg', '.jpeg', '.png', '.webp', '.avif'].includes(extname(entry.name).toLowerCase())) files.push(path);
  }
  return files;
}

const sourceFiles = await walk(sourceDir);
const sourceHashes = new Set();
for (const path of sourceFiles) sourceHashes.add(createHash('sha256').update(await readFile(path)).digest('hex'));
const distFiles = await walk(distDir);
const dimensions = [];
for (const path of distFiles) {
  const metadata = await sharp(path).metadata();
  dimensions.push({ path: relative(root, path).split(sep).join('/'), bytes: (await readFile(path)).byteLength, width: metadata.width ?? 0, height: metadata.height ?? 0, hash: createHash('sha256').update(await readFile(path)).digest('hex') });
}
console.log(JSON.stringify({
  sourceCount: sourceFiles.length,
  distImageCount: distFiles.length,
  distImageBytes: dimensions.reduce((sum, item) => sum + item.bytes, 0),
  oversized: dimensions.filter((item) => Math.max(item.width, item.height) > 1920),
  sourceHashMatches: dimensions.filter((item) => sourceHashes.has(item.hash)).map((item) => item.path),
  maxByVariant: Object.fromEntries([480, 960, 1920].map((edge) => [edge, dimensions.filter((item) => item.path.includes(`.${edge}.webp`)).reduce((max, item) => Math.max(max, item.width, item.height), 0)])),
}, null, 2));
