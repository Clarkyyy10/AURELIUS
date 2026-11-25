import { expect, test } from "@playwright/test";

test("home page shows the store name", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle("Afable's Jewelry Store");
  await expect(
    page.getByRole("heading", { level: 1, name: "Afable's Jewelry Store" }),
  ).toBeVisible();
});
