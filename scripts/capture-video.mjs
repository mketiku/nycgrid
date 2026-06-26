/**
 * Captures marketing GIFs of nycgrid.vercel.app using Playwright + gifski.
 * Frames are captured as lossless 2x Retina PNGs — no video encode in the pipeline.
 * Output saved to scripts/screenshots/gifs/, named with time-of-day suffix.
 *
 * Usage:
 *   bunx playwright install chromium  (first time only)
 *   node scripts/capture-video.mjs
 *
 * Best results:
 *   Day footage (cameras bright, Times Sq readable): run before 4pm
 *   Night footage (atmospheric, lights/rain):        run after 8pm
 *
 * Optional: point at local dev instead
 *   BASE_URL=http://localhost:3100 node scripts/capture-video.mjs
 */

import { chromium } from "@playwright/test";
import { mkdirSync, rmSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const BASE_URL = process.env.BASE_URL ?? "https://nycgrid.vercel.app";
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "screenshots");
const TEMP = join(ROOT, ".frames-tmp");

// Each run gets its own timestamped folder: gifs/2026-04-26T20-08/
const RUN_TS = new Date()
  .toISOString()
  .slice(0, 16)
  .replace("T", "T")
  .replace(":", "-")
  .replace(":", "-");
const GIFS = join(ROOT, "gifs", RUN_TS);

mkdirSync(GIFS, { recursive: true });

// Time-of-day tag: day = before 4pm ET, night = after 8pm ET, golden = 4-8pm
const hour = new Date().toLocaleString("en-US", {
  timeZone: "America/New_York",
  hour: "numeric",
  hour12: false,
});
const h = parseInt(hour, 10);
const TOD = h < 16 ? "day" : h >= 20 ? "night" : "golden";
console.log(`🕐  Time of day: ${TOD} (${h}:00 ET) — outputs will be tagged -${TOD}`);

function gifPath(name) {
  return join(GIFS, `${name}-${TOD}.gif`);
}



function wait(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

/** Wait for all web fonts to finish rendering — more reliable than networkidle alone. */
async function waitForFonts(page) {
  await page.evaluate(() => document.fonts.ready);
}


/**
 * Capture frames as lossless 2x PNGs from a live page and encode with gifski.
 * No video middleman — what you see is what gifski gets.
 */
async function captureGif(
  page,
  outputPath,
  { fps = 12, duration = 12, width = 800, quality = 75, lossy = 70 } = {}
) {
  const framesDir = join(TEMP, `frames-${Date.now()}`);
  mkdirSync(framesDir, { recursive: true });

  const totalFrames = fps * duration;
  const intervalMs = Math.round(1000 / fps);

  for (let i = 0; i < totalFrames; i++) {
    const framePath = join(framesDir, `frame${String(i).padStart(4, "0")}.png`);
    await page.screenshot({ path: framePath });
    await wait(intervalMs);
  }

  execSync(
    `gifski --fps ${fps} --width ${width} --quality ${quality} --lossy-quality ${lossy} --output "${outputPath}" "${framesDir}/frame"*.png`,
    { stdio: "pipe" }
  );

  rmSync(framesDir, { recursive: true, force: true });
}

async function newPage(browser, width, height, scale = 2) {
  const context = await browser.newContext({ deviceScaleFactor: scale });
  const page = await context.newPage();
  await page.setViewportSize({ width, height });
  await page.addStyleTag({ content: "[data-sonner-toaster]{display:none!important}" });
  return page;
}

const browser = await chromium.launch();

// ── Ambient desktop GIF: hover reveals controls → click Info → close ─────────
// 1x scale + narrow width keeps file size small (~4-6MB vs 36MB at 2x/1440px).
console.log("🎨  Capturing ambient desktop GIF...");
{
  const page = await newPage(browser, 1280, 800, 1);

  await page.goto(`${BASE_URL}/ambient`, { waitUntil: "networkidle" });
  await waitForFonts(page);
  await wait(2000);
  await page.getByRole("button", { name: "Start ambient mode" }).click();
  await wait(6000); // feed loaded, controls auto-hidden after 4s idle

  // Capture 9s: clean feed → hover reveals controls → click Info → overlay → close
  console.log("   → Capturing 9s (hover controls → Info → close)...");
  const gifCapture = captureGif(page, gifPath("ambient"), {
    fps: 6,
    duration: 9,
    width: 720,
  });

  await wait(1500); // clean fullscreen feed
  await page.mouse.move(640, 600); // nudge mouse → onMouseMove → controls fade in
  await wait(1200); // controls transition settles (~200ms) + brief dwell
  await page.getByRole("button", { name: "Show location info" }).click();
  await wait(3800); // info overlay visible
  await page.keyboard.press("Escape"); // close overlay
  await wait(2500); // overlay fades, back to clean feed

  await gifCapture;
  await page.close();
  console.log(`   ✓ gifs/ambient-${TOD}.gif`);
}

// ── Explore map GIF: hover camera → click → panel slides in → close ──────────
// 1x scale fixes font rendering (2x→gifski downscale was blurring text).
console.log("🗺️   Capturing explore map GIF...");
{
  const page = await newPage(browser, 1440, 900, 1);

  await page.goto(`${BASE_URL}/explore`, { waitUntil: "networkidle" });
  await waitForFonts(page);
  await wait(6000); // map tiles, markers, camera list, and fonts all settled

  // First camera button in the inline desktop browse panel
  const cameraBtn = page.locator("ul button[aria-pressed]").first();

  // Capture 9s: map visible → hover camera → click → panel in → close
  console.log("   → Capturing 9s (hover → click camera → panel → close)...");
  const gifCapture = captureGif(page, gifPath("explore"), {
    fps: 6,
    duration: 9,
    width: 800,
  });

  await wait(1200); // map + list visible
  await cameraBtn.hover(); // highlight camera row
  await wait(1000); // hover state visible
  await cameraBtn.click(); // camera panel slides in from right
  await wait(4000); // panel animates in, feed image loads, lore visible
  await page.keyboard.press("Escape"); // close panel
  await wait(2800); // panel slides out

  await gifCapture;
  await page.close();
  console.log(`   ✓ gifs/explore-${TOD}.gif`);
}

// ── Photobooth GIF: Broadway @ 42 St, Polaroid shot, full countdown → result ─
console.log("📷   Capturing photobooth GIF...");
{
  const page = await newPage(browser, 1440, 900);
  // Broadway @ 42 St — reliable online camera in a recognisable location
  const PHOTOBOOTH_CAMERA = "9565e94d-66f2-4965-9c13-82d5500d6cfd";

  // Navigate once to establish the origin so localStorage is accessible, then
  // set the preflight agreement key and reload — this skips the terms/tips screen
  // and renders PhotoboothClient directly on the second load.
  await page.goto(`${BASE_URL}/photobooth/${PHOTOBOOTH_CAMERA}`, {
    waitUntil: "networkidle",
  });
  await page.evaluate(() => localStorage.setItem("nycgrid-photobooth-agreed", "1"));
  await page.reload({ waitUntil: "networkidle" });
  await waitForFonts(page);
  await wait(3000); // live feed image settles

  // Select Polaroid (1 shot) — keeps the GIF tight while still showing the full flow.
  // Use locator with hasText rather than getByRole — the button contains an SVG icon
  // which can interfere with accessible name resolution.
  await page.locator("button", { hasText: "Polaroid" }).click();
  await wait(500);

  // Capture 13s: 3s countdown + ~1s fetch + compose + ~4s result dwell
  console.log("   → Capturing 13s (Polaroid: countdown → flash → result)...");
  const gifCapture = captureGif(page, gifPath("photobooth"), {
    fps: 8,
    duration: 13,
    width: 900,
  });

  await page.locator("button", { hasText: "Shoot" }).click();
  await wait(11000); // countdown (3s) + fetch + compose + result dwell

  await gifCapture;
  await page.close();
  console.log(`   ✓ gifs/photobooth-${TOD}.gif`);
}

// ── Walkthrough GIF: home → explore → hover camera → panel opens ──────────────
console.log("🎬   Capturing walkthrough GIF...");
{
  const page = await newPage(browser, 1440, 900, 1);

  await page.goto(BASE_URL, { waitUntil: "networkidle" });
  await waitForFonts(page);
  await wait(3000); // hero + spotlight image settle

  // Capture 12s: home (2s) → click Explore → map loads → hover + click camera → panel
  console.log("   → Capturing 12s (home → explore → camera panel)...");
  const gifCapture = captureGif(page, gifPath("walkthrough"), {
    fps: 6,
    duration: 12,
    width: 800,
  });

  await wait(2000); // dwell on home hero
  await page.getByRole("link", { name: /Explore the map/i }).first().click();
  await waitForFonts(page);
  await wait(4500); // map tiles, markers, camera list all settle

  // Hover then click the first camera in the list → panel slides in
  const cameraBtn = page.locator("ul button[aria-pressed]").first();
  await cameraBtn.hover();
  await wait(800);
  await cameraBtn.click();
  await wait(4200); // panel animates in, feed image loads

  await gifCapture;
  await page.close();
  console.log(`   ✓ gifs/walkthrough-${TOD}.gif`);
}

// ── Ambient mobile GIF: iPhone 16 — tap shows controls → Info → close ────────
console.log("📱   Capturing ambient mobile GIF...");
{
  const page = await newPage(browser, 390, 844, 1);

  await page.goto(`${BASE_URL}/ambient`, { waitUntil: "networkidle" });
  await waitForFonts(page);
  await wait(2000);
  await page.getByRole("button", { name: "Start ambient mode" }).click();
  await wait(6000); // feed loaded, controls auto-hidden after 4s idle

  // Capture 9s: clean feed → tap reveals controls → tap Info → overlay → close
  console.log("   → Capturing 9s (tap controls → Info → close)...");
  const gifCapture = captureGif(page, gifPath("ambient-mobile"), {
    fps: 6,
    duration: 9,
    width: 390,
  });

  await wait(1500); // clean fullscreen feed
  // Tap lower-center — triggers onMouseMove/click → controls reveal
  await page.mouse.click(195, 650);
  await wait(1200); // controls fade in + brief dwell
  await page.getByRole("button", { name: "Show location info" }).click();
  await wait(3800); // info overlay visible
  await page.keyboard.press("Escape");
  await wait(2500); // overlay fades

  await gifCapture;
  await page.close();
  console.log(`   ✓ gifs/ambient-mobile-${TOD}.gif`);
}

// Clean up temp frame directory
rmSync(TEMP, { recursive: true, force: true });

await browser.close();

console.log(`\n✅  GIFs saved to scripts/screenshots/gifs/${RUN_TS}/`);
console.log(`   ambient-${TOD}.gif        — hover controls → Info → close, 9s, 720px`);
console.log(`   explore-${TOD}.gif        — hover → click camera → panel → close, 9s, 800px`);
console.log(`   photobooth-${TOD}.gif     — Broadway @ 42 St, polaroid, 13s, 900px`);
console.log(`   walkthrough-${TOD}.gif    — home → explore → camera panel, 12s, 800px`);
console.log(`   ambient-mobile-${TOD}.gif — iPhone 16, tap controls → Info → close, 9s, 390px`);
console.log("\n💡  For best results:");
console.log("   Day footage (bright cameras):  run before 4pm ET");
console.log("   Night footage (atmospheric):   run after 8pm ET");
