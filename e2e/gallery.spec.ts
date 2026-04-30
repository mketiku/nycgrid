import { test, expect } from "@playwright/test";

test.describe("Gallery empty state", () => {
  test.beforeEach(async ({ page }) => {
    // Ensure localStorage has no saved shots so empty state renders
    await page.goto("/");
    await page.evaluate(() => localStorage.removeItem("nycgrid-my-shots"));
  });

  test("shows empty state when no shots are saved", async ({ page }) => {
    await page.goto("/gallery");

    await expect(page.getByRole("heading", { name: /my gallery/i })).toBeVisible();
    await expect(page.getByText(/no shots yet/i)).toBeVisible();
    await expect(page.getByRole("link", { name: /explore the map/i })).toBeVisible();
  });
});
