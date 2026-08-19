import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require('C:/Users/ASUS/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const baseUrl = process.argv[2] ?? 'http://127.0.0.1:4321';

async function openContext(width, height, javaScriptEnabled = true) {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width, height }, serviceWorkers: 'block', javaScriptEnabled });
  return { browser, context, page: await context.newPage() };
}

async function desktopStar() {
  const { browser, context, page } = await openContext(1440, 900);
  const images = [];
  page.on('response', async (response) => {
    if (response.request().resourceType() === 'image') images.push({ url: response.url(), status: response.status() });
  });
  await page.goto(`${baseUrl}/DianRhyme/moments/`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(3500);
  await page.screenshot({ path: 'C:/Users/ASUS/.codex/visualizations/2026/08/19/01a0193f-c421-72d3-a9b3-385a111082a5/star-acceptance.png', fullPage: false });
  const initialFull = images.filter(({ url }) => url.includes('.1920.webp')).length;
  const canvas = page.locator('#universe-canvas canvas');
  const box = await canvas.boundingBox();
  if (box) {
    for (let row = 1; row < 7; row += 1) {
      for (let col = 1; col < 9; col += 1) {
        await page.mouse.click(box.x + box.width * col / 9, box.y + box.height * row / 7);
        await page.waitForTimeout(70);
      }
    }
    for (const [x, y] of [[300, 785], [445, 815], [485, 835], [560, 875], [720, 850], [840, 850], [950, 840], [1058, 800]]) {
      await page.mouse.click(x, y);
      await page.waitForTimeout(120);
    }
    if (!images.some(({ url }) => url.includes('.1920.webp'))) {
      outer: for (let x = 16; x < box.width; x += 36) {
        for (let y = box.y + 16; y < box.y + box.height; y += 36) {
          await page.mouse.click(x, y);
          await page.waitForTimeout(10);
          if (images.some(({ url }) => url.includes('.1920.webp'))) break outer;
        }
      }
    }
  }
  await page.waitForTimeout(600);
  await page.screenshot({ path: 'C:/Users/ASUS/.codex/visualizations/2026/08/19/01a0193f-c421-72d3-a9b3-385a111082a5/star-after-sweep.png', fullPage: false });
  const fullUrls = images.filter(({ url }) => url.includes('.1920.webp')).map(({ url }) => url);
  const firstFull = fullUrls[0] ?? null;
  const beforeGallery = { canvas: await canvas.count(), galleryChildren: await page.locator('#gallery-mount > *').count(), box };
  await page.locator('.mode-switch button[data-mode="gallery"]').click();
  await page.waitForTimeout(250);
  const galleryMode = { canvas: await page.locator('#universe-canvas canvas').count(), galleryChildren: await page.locator('#gallery-mount > *').count() };
  await page.locator('.mode-switch button[data-mode="star"]').click();
  await page.waitForTimeout(2500);
  const starAgain = { canvas: await page.locator('#universe-canvas canvas').count(), galleryChildren: await page.locator('#gallery-mount > *').count() };
  await browser.close();
  return {
    initialFull,
    fullRequestsAfterSweep: fullUrls.length,
    uniqueFullRequestsAfterSweep: new Set(fullUrls).size,
    firstFull,
    beforeGallery,
    galleryMode,
    starAgain,
    statusesOk: images.every(({ status }) => status >= 200 && status < 400),
    context: await context.storageState().catch(() => null),
  };
}

async function mobileGallery() {
  const { browser, page } = await openContext(375, 800);
  const requests = [];
  page.on('request', (request) => requests.push(request.url()));
  await page.goto(`${baseUrl}/DianRhyme/moments/`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  const result = {
    mode: await page.locator('.moments-page').getAttribute('class'),
    canvasCount: await page.locator('#universe-canvas canvas').count(),
    mountedImages: await page.locator('#gallery-mount img').count(),
    threeRequests: requests.filter((url) => /three|src\/three|main\./i.test(url)),
  };
  await browser.close();
  return result;
}

async function noScriptGallery() {
  const { browser, page } = await openContext(375, 800, false);
  await page.goto(`${baseUrl}/DianRhyme/moments/`, { waitUntil: 'networkidle' });
  const bodyText = await page.locator('body').innerText();
  const result = { images: await page.locator('.no-script-gallery img').count(), bodyText: bodyText.includes('进入十四日的') && bodyText.includes('回声') };
  await browser.close();
  return result;
}

async function oldUrls() {
  const { browser, context } = await openContext(1440, 900);
  const paths = ['images/logo.jpg', 'images/team-photo.jpg', 'images/posts/7.26.jpg', 'images/moments/moment-12.jpg'];
  const statuses = {};
  for (const path of paths) statuses[path] = (await context.request.get(`${baseUrl}/DianRhyme/${path}`)).status();
  await browser.close();
  return statuses;
}

const result = { desktopStar: await desktopStar(), mobileGallery: await mobileGallery(), noScriptGallery: await noScriptGallery(), oldUrls: await oldUrls() };
console.log(JSON.stringify(result, null, 2));
