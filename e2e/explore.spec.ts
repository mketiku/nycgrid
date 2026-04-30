import { test, expect } from "@playwright/test";

// Minimal 1x1 JPEG (valid binary, avoids broken-image in tests)
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

test.describe("Explore flow", () => {
  test.beforeEach(async ({ page }) => {
    // Stub all camera image proxy requests — no real DOT calls
    await page.route("**/api/camera-image/**", (route) => {
      route.fulfill({
        status: 200,
        contentType: "image/jpeg",
        body: STUB_JPEG,
      });
    });
  });

  test("homepage renders the NYCGRID heading", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("NYCGRID");
  });

  test("explore page mounts the map container", async ({ page }) => {
    await page.goto("/explore");
    // The map is mounted once in the root layout via PersistentMap.
    // The map container div has a fixed class applied by MapLibre after init.
    // We wait for the MapLibre canvas to appear inside the container.
    const mapCanvas = page.locator(".maplibregl-canvas").first();
    await expect(mapCanvas).toBeVisible({ timeout: 20_000 });
  });

  test("selecting a camera from the browser panel opens the camera dialog", async ({ page }) => {
    await page.goto("/explore");

    // Wait for map to initialize
    await expect(page.locator(".maplibregl-canvas").first()).toBeVisible({ timeout: 20_000 });

    // The desktop camera browser list is visible at ≥1280px viewport (default Desktop Chrome)
    // Click the first camera button in the browse list
    const firstCameraButton = page
      .getByRole("button", { name: /MHB-30|Atlantic Ave|Hylan Ave/i })
      .first();
    await firstCameraButton.waitFor({ state: "visible", timeout: 15_000 });
    await firstCameraButton.click();

    // Camera panel should open with role="dialog"
    await expect(page.getByRole("dialog").first()).toBeVisible({ timeout: 10_000 });

    // Camera image inside the panel should be present (served from stub)
    await expect(page.getByRole("dialog").first().locator("img").first()).toBeVisible({
      timeout: 10_000,
    });
  });
});
