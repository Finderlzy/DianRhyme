import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require('C:/Users/ASUS/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');

const baseUrl = process.argv[2];
if (!baseUrl) throw new Error('usage: measure-browser.mjs BASE_URL');

async function measure(path, width, height) {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width, height }, serviceWorkers: 'block' });
  const page = await context.newPage();
  const images = [];
  const scripts = [];
  page.on('response', async (response) => {
    const type = response.request().resourceType();
    if (type !== 'image' && type !== 'script') return;
    let bytes = null;
    try { bytes = (await response.body()).byteLength; } catch {}
    (type === 'image' ? images : scripts).push({ url: response.url(), type, status: response.status(), bytes });
  });
  await page.goto(`${baseUrl.replace(/\/$/, '')}${path}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  const state = await page.evaluate(() => ({
    mode: document.querySelector('.moments-page')?.className,
    galleryChildren: document.querySelector('#gallery-mount')?.childElementCount ?? null,
    templateImages: document.querySelector('#gallery-template')?.content.querySelectorAll('img').length ?? null,
    noscriptPresent: Boolean(document.querySelector('noscript')),
  }));
  const counts = new Map();
  for (const row of images) counts.set(row.url, (counts.get(row.url) ?? 0) + 1);
  await browser.close();
  return {
    path,
    viewport: { width, height },
    images,
    scripts,
    imageCount: images.length,
    imageBytes: images.reduce((sum, row) => sum + (row.bytes ?? 0), 0),
    duplicateImageUrls: [...counts.entries()].filter(([, count]) => count > 1).map(([url]) => url),
    state,
  };
}

const cases = [
  ['/DianRhyme/', 1440, 900],
  ['/DianRhyme/moments/', 1440, 900],
  ['/DianRhyme/moments/', 375, 800],
];
const results = [];
for (const testCase of cases) results.push(await measure(...testCase));
if (process.argv[3] === 'summary') {
  console.log(JSON.stringify(results.map(({ path, viewport, imageCount, imageBytes, duplicateImageUrls, state, scripts }) => ({
    path, viewport, imageCount, imageBytes, duplicateImageUrls, state,
    scriptUrls: scripts.map((row) => row.url).filter((url) => /three|main|moments/i.test(url)),
  })), null, 2));
} else {
  console.log(JSON.stringify(results, null, 2));
}
