import { test, expect } from "@playwright/test";

test.describe("PV mobilní smoke", () => {
  test("banner, plovoucí souhrn a Skrýt/Zobrazit", async ({ page }) => {
    await page.goto("/?view=pv");

    const issueBanner = page.getByRole("status").filter({
      hasText: "Pro smysluplný součet PHmax doplňte pracoviště",
    });
    await expect(issueBanner).toBeVisible();
    await expect(page.getByRole("button", { name: "Přejít k chybě" }).first()).toBeVisible();

    const floatingSummary = page.locator(".calculator-mobile-scroll-results");
    await expect(floatingSummary).toBeVisible();
    await expect(page.getByRole("button", { name: /Skrýt souhrn/i })).toBeVisible();

    await page.locator(".calculator-mobile-scroll-results__dismiss").evaluate((node) => {
      (node as HTMLButtonElement).click();
    });

    const showChip = page.locator(".calculator-mobile-summary-chip");
    await expect(showChip).toBeVisible();
    await expect(floatingSummary).toHaveCount(0);

    await showChip.evaluate((node) => {
      (node as HTMLButtonElement).click();
    });
    await expect(floatingSummary).toBeVisible();

    await page.getByRole("button", { name: "2 Vstupy" }).click();
    await page.getByRole("button", { name: "Přejít k chybě" }).first().click();
    await expect(page.locator('[data-section="pv-vstupy"]')).toBeInViewport();
  });
});
