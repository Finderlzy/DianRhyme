import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require('C:/Users/ASUS/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const baseUrl = process.argv[2] ?? 'http://127.0.0.1:4321';
const output = 'C:/Users/ASUS/.codex/visualizations/2026/08/19/01a0193f-c421-72d3-a9b3-385a111082a5/matrix';
const cases = [
  ['home', '/DianRhyme/', false], ['diary', '/DianRhyme/diary/', false], ['moments', '/DianRhyme/moments/', true],
];
const results = [];
for (const width of [375, 768, 1440]) {
  for (const [name, path, star] of cases) {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ viewport: { width, height: 900 }, serviceWorkers: 'block' });
    const page = await context.newPage();
    await page.goto(`${baseUrl}${path}`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(star && width >= 900 ? 2500 : 500);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    const file = `${output}/${name}-${width}.png`;
    await page.screenshot({ path: file, fullPage: true });
    results.push({ name, width, overflow, file });
    await browser.close();
  }
}
console.log(JSON.stringify(results, null, 2));
