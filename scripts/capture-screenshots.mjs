/**
 * Captures marketing screenshots of nycgrid.vercel.app using Playwright.
 * Output organized under scripts/screenshots/images/.
 *
 * Usage:
 *   bunx playwright install chromium  (first time only)
 *   node scripts/capture-screenshots.mjs
 *
 * Optional: point at local dev instead
 *   BASE_URL=http://localhost:3100 node scripts/capture-screenshots.mjs
 */

import { chromium } from "@playwright/test";
import { mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const BASE_URL = process.env.BASE_URL ?? "https://nycgrid.vercel.app";
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "screenshots");
const OUT = join(ROOT, "images");

// Iconic cameras: Broadway @ 42 St, FDR @ Brooklyn Bridge
const FEATURED_CAMERAS = [
  "9565e94d-66f2-4965-9c13-82d5500d6cfd", // Broadway @ 42 St
  "ecba28cb-ac70-4d25-abcb-6506111ea120", // FDR @ Brooklyn Bridge
];

mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();

async function newPage(width = 1440, height = 900) {
  const context = await browser.newContext({ deviceScaleFactor: 2 });
  const page = await context.newPage();
  await page.setViewportSize({ width, height });
  await page.addStyleTag({
    content: "[data-sonner-toaster] { display: none !important; }",
  });
  return page;
}

function wait(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function waitForFonts(page) {
  await page.evaluate(() => document.fonts.ready);
}

// 1. Home page — full above-the-fold hero
{
  console.log("📸  Home page hero...");
  const page = await newPage();
  await page.goto(BASE_URL, { waitUntil: "networkidle" });
  await waitForFonts(page);
  await wait(6000); // spotlight image + animations settle
  await page.screenshot({ path: join(OUT, "home-hero.png") });
  await page.close();
}

// 2. Explore page — map loaded, all camera dots visible
{
  console.log("📸  Explore map (full NYC)...");
  const page = await newPage();
  await page.goto(`${BASE_URL}/explore`, { waitUntil: "networkidle" });
  await waitForFonts(page);
  await wait(5000); // map tiles + markers settle
  await page.screenshot({ path: join(OUT, "explore-map.png") });
  await page.close();
}

// 3. Camera detail — featured cameras
for (const id of FEATURED_CAMERAS) {
  console.log(`📸  Camera detail: ${id.slice(0, 8)}...`);
  const page = await newPage();
  await page.goto(`${BASE_URL}/camera/${id}`, { waitUntil: "networkidle" });
  await waitForFonts(page);
  await wait(5000); // feed image + context panel settle
  await page.screenshot({ path: join(OUT, `camera-${id.slice(0, 8)}.png`) });
  await page.close();
}

// 4. Ambient mode — click start, wait for live feed
{
  console.log("📸  Ambient mode (live feed)...");
  const page = await newPage();
  await page.goto(`${BASE_URL}/ambient`, { waitUntil: "networkidle" });
  await waitForFonts(page);
  await wait(2000);
  await page.getByRole("button", { name: "Start ambient mode" }).click();
  await wait(6000); // feed + UI chrome fully rendered
  await page.screenshot({ path: join(OUT, "ambient.png") });
  await page.close();
}

// 5. Mobile home — iPhone 16 portrait
{
  console.log("📸  Mobile home (iPhone 16)...");
  const page = await newPage(390, 844);
  await page.goto(BASE_URL, { waitUntil: "networkidle" });
  await waitForFonts(page);
  await wait(6000);
  await page.screenshot({ path: join(OUT, "home-mobile.png") });
  await page.close();
}

// 6. Mobile ambient — iPhone 16 portrait, live feed
{
  console.log("📸  Mobile ambient (iPhone 16, live feed)...");
  const ctx = await browser.newContext({ deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addStyleTag({ content: "[data-sonner-toaster]{display:none!important}" });
  await page.goto(`${BASE_URL}/ambient`, { waitUntil: "networkidle" });
  await waitForFonts(page);
  await wait(2000);
  await page.getByRole("button", { name: "Start ambient mode" }).click();
  await wait(6000);
  await page.screenshot({ path: join(OUT, "ambient-mobile.png") });
  await page.close();
}

await browser.close();

console.log(`\n✅  Screenshots saved to scripts/screenshots/images/`);
console.log("   home-hero.png         — hero section, desktop");
console.log("   explore-map.png       — full NYC map with camera dots");
console.log("   camera-*.png          — live feed detail pages");
console.log("   ambient.png           — ambient mode, live feed");
console.log("   home-mobile.png       — mobile hero, iPhone 16");
console.log("   ambient-mobile.png    — ambient mode, iPhone 16");
