import { test, expect } from "@playwright/test";

// First camera ID from src/lib/cameras/data.ts
const CAMERA_ID = "00077ee3-2c13-4674-adbd-a51b3484b0be";

const STUB_JPEG = Buffer.from(
  "/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8U" +
    "HRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgN" +
    "DRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIy" +
    "MjL/wAARCAABAAEDASIAAhEBAxEB/8QAFgABAQEAAAAAAAAAAAAAAAAABgUEB" +
    "/8QAIRAAAQMEAwEAAAAAAAAAAAAAAQIDBAAFERIhMUH/xAAUAQEAAAAAAAAAAAAAAAAAAAAA" +
    "/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8Amm2tLa2ghhihijhjjjjjjj" +
    "jjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjj/2Q==",
  "base64"
);

test.describe("Photobooth flow", () => {
  test.beforeEach(async ({ page }) => {
    await page.route("**/api/camera-image/**", (route) => {
      route.fulfill({
        status: 200,
        contentType: "image/jpeg",
        body: STUB_JPEG,
      });
    });
  });

  test("shows preflight screen with terms agreement on first visit", async ({ page }) => {
    // Clear localStorage so preflight always shows
    await page.goto(`/photobooth/${CAMERA_ID}`);
    await page.evaluate(() => localStorage.removeItem("nycgrid-photobooth-agreed"));
    await page.reload();

    await expect(page.getByRole("heading", { name: /before you head out/i })).toBeVisible();

    // Agree to terms — the checkbox is sr-only with a custom visual overlay.
    // Click the label text instead, which is the intended interaction target.
    const termsLabel = page.getByText(/I've read the above and agree/i);
    await expect(termsLabel).toBeVisible();
    await termsLabel.click();

    // CTA button becomes enabled
    const ctaButton = page.getByRole("button", { name: /open photobooth/i });
    await expect(ctaButton).toBeEnabled();
  });

  test("capture button is visible after accepting terms", async ({ page }) => {
    // Pre-set agreement in localStorage before navigation
    await page.goto("/");
    await page.evaluate(() => localStorage.setItem("nycgrid-photobooth-agreed", "1"));

    await page.goto(`/photobooth/${CAMERA_ID}`);

    // Should land directly on the photobooth client (no preflight)
    const captureButton = page.getByRole("button", { name: /shoot/i });
    await expect(captureButton).toBeVisible({ timeout: 15_000 });
  });
});
