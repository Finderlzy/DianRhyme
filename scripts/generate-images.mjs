import { createHash } from 'node:crypto';
import { mkdir, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, extname, join, relative, resolve, sep } from 'node:path';
import sharp from 'sharp';

const ROOT = resolve(process.cwd());
const SOURCE_DIR = join(ROOT, 'assets', 'images-original');
const OUTPUT_DIR = join(ROOT, 'public', 'images');
const GENERATED_DIR = join(ROOT, 'src', 'generated');
const CACHE_PATH = join(ROOT, '.image-pipeline-cache.json');
const RECIPE_VERSION = '2026-08-19-v2';
const WEBP_VARIANTS = [
  { edge: 480, quality: 72 },
  { edge: 960, quality: 78 },
  { edge: 1920, quality: 82 },
];

function logicalPath(filePath) {
  return relative(SOURCE_DIR, filePath).split(sep).join('/');
}

function publicLogicalPath(filePath) {
  return `images/${logicalPath(filePath)}`;
}

function outputPath(logical, suffix = '') {
  const relativeLogical = logical.replace(/^images\//, '');
  const extension = extname(relativeLogical);
  const stem = relativeLogical.slice(0, -extension.length);
  return join(OUTPUT_DIR, `${stem}${suffix}${extension}`);
}

function webpPath(logical, edge) {
  const relativeLogical = logical.replace(/^images\//, '');
  const extension = extname(relativeLogical);
  const stem = relativeLogical.slice(0, -extension.length);
  return join(OUTPUT_DIR, `${stem}.${edge}.webp`);
}

function publicUrl(logical) {
  return `images/${logical}`;
}

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(path));
    else if (['.jpg', '.jpeg', '.png'].includes(extname(entry.name).toLowerCase())) files.push(path);
  }
  return files.sort();
}

async function sha256(filePath) {
  const bytes = await readFile(filePath);
  return createHash('sha256').update(bytes).digest('hex');
}

async function orientedMetadata(filePath) {
  const buffer = await sharp(filePath).rotate().toBuffer();
  const image = sharp(buffer);
  const metadata = await image.metadata();
  if (!metadata.width || !metadata.height) throw new Error('missing dimensions');
  return { buffer, width: metadata.width, height: metadata.height };
}

async function writeImage(filePath, buffer) {
  await mkdir(dirname(filePath), { recursive: true });
  let lastError;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      await writeFile(filePath, buffer);
      return;
    } catch (error) {
      lastError = error;
      await new Promise((resolve) => setTimeout(resolve, 100 * (attempt + 1)));
    }
  }
  throw lastError;
}

async function generateOne(sourcePath, previousCache) {
  const logical = publicLogicalPath(sourcePath);
  const hash = await sha256(sourcePath);
  const previous = previousCache[logical];
  const metadata = await orientedMetadata(sourcePath);
  const outputs = [outputPath(logical), ...WEBP_VARIANTS.map(({ edge }) => webpPath(logical, edge))];
  const complete = outputs.every(existsSync) && previous?.sourceHash === hash && previous?.recipeVersion === RECIPE_VERSION;

  if (!complete) {
    const image = sharp(metadata.buffer);
    for (const { edge, quality } of WEBP_VARIANTS) {
      await writeImage(webpPath(logical, edge), await image.clone().resize({ width: edge, height: edge, fit: 'inside', withoutEnlargement: true }).webp({ quality, effort: 5 }).toBuffer());
    }
    const extension = extname(logical).toLowerCase();
    const compatibilityImage = image.clone().resize({ width: 1920, height: 1920, fit: 'inside', withoutEnlargement: true });
    const compatibility = extension === '.png'
      ? compatibilityImage.png({ compressionLevel: 9, adaptiveFiltering: true, effort: 10 }).toBuffer()
      : compatibilityImage.jpeg({ quality: 82, progressive: true }).toBuffer();
    await writeImage(outputPath(logical), await compatibility);
  }

  return {
    logicalPath: logical,
    legacyPath: logical,
    sourceHash: hash,
    recipeVersion: RECIPE_VERSION,
    width: metadata.width,
    height: metadata.height,
    src: `/${publicUrl(logical.slice('images/'.length).replace(/\.(jpe?g|png)$/i, '.1920.webp'))}`,
    thumbnailSrc: `/${publicUrl(logical.slice('images/'.length).replace(/\.(jpe?g|png)$/i, '.480.webp'))}`,
    srcSet: WEBP_VARIANTS.map(({ edge }) => `/${publicUrl(logical.slice('images/'.length).replace(/\.(jpe?g|png)$/i, `.${edge}.webp`))} ${edge}w`).join(', '),
  };
}

async function main() {
  if (!existsSync(SOURCE_DIR)) throw new Error(`Image source directory missing: ${SOURCE_DIR}`);
  const files = await walk(SOURCE_DIR);
  if (files.length === 0) throw new Error(`No source images found under ${SOURCE_DIR}`);
  const previousCache = existsSync(CACHE_PATH) ? JSON.parse(await readFile(CACHE_PATH, 'utf8')) : {};
  const manifest = {};
  const nextCache = {};
  for (const filePath of files) {
    const entry = await generateOne(filePath, previousCache);
    const key = entry.logicalPath;
    manifest[key] = entry;
    nextCache[key] = { sourceHash: entry.sourceHash, recipeVersion: RECIPE_VERSION };
  }

  const logo = manifest['images/logo.jpg'];
  if (!logo) throw new Error('Required logical image missing: images/logo.jpg');
  const logoSource = join(SOURCE_DIR, 'logo.jpg');
  await writeImage(join(OUTPUT_DIR, 'logo-favicon.png'), await sharp(logoSource).rotate().resize({ width: 64, height: 64, fit: 'inside', withoutEnlargement: true }).png({ compressionLevel: 9, effort: 10 }).toBuffer());

  await mkdir(GENERATED_DIR, { recursive: true });
  const generated = `// Generated by scripts/generate-images.mjs. Do not edit.\nexport const IMAGE_RECIPE_VERSION = ${JSON.stringify(RECIPE_VERSION)} as const;\nexport const imageManifest = ${JSON.stringify(manifest, null, 2)} as const;\n`;
  await writeFile(join(GENERATED_DIR, 'image-manifest.ts'), generated, 'utf8');
  await writeFile(CACHE_PATH, JSON.stringify(nextCache, null, 2), 'utf8');
  console.log(`[images] ${files.length} source images, ${Object.keys(manifest).length} manifest entries, recipe ${RECIPE_VERSION}`);
}

main().catch((error) => {
  console.error(`[images] generation failed: ${error instanceof Error ? error.stack : String(error)}`);
  process.exitCode = 1;
});
