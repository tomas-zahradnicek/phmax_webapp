import { test, expect } from "@playwright/test";
import { gotoProductView } from "./smoke-helpers";

test.describe("PV mobilní smoke", () => {
  test.beforeEach(async ({ page }) => {
    await gotoProductView(page, "pv");
  });

  test("banner neúplných vstupů a Přejít k chybě", async ({ page }) => {
    const issueBanner = page.locator(".calculator-input-issue-banner");
    await expect(issueBanner).toBeVisible();
    await expect(issueBanner).toContainText(/PHmax|pracovišt/i);
    await expect(page.getByRole("button", { name: "Přejít k chybě" }).first()).toBeVisible();
  });

  test("plovoucí souhrn a Skrýt/Zobrazit chip", async ({ page }) => {
    const floatingSummary = page.locator(".calculator-mobile-scroll-results");
    await expect(floatingSummary).toBeVisible();
    await expect(page.getByRole("button", { name: /Skrýt souhrn/i })).toBeVisible();

    await page.locator(".calculator-mobile-scroll-results__dismiss").evaluate((node) => {
      (node as HTMLButtonElement).click();
    });

    const showChip = page.locator(".calculator-mobile-summary-chip");
    await expect(showChip).toBeVisible();
    await expect(floatingSummary).toHaveCount(0);
    await expect(showChip).toHaveAttribute("aria-label", "Zobrazit souhrn výsledků");

    await showChip.evaluate((node) => {
      (node as HTMLButtonElement).click();
    });
    await expect(floatingSummary).toBeVisible();
  });

  test("průvodce krok Vstupy a Přejít k chybě", async ({ page }) => {
    await page.getByRole("button", { name: "2 Vstupy" }).click({ force: true });
    await page.getByRole("button", { name: "Přejít k chybě" }).first().click();
    const section = page.locator('[data-section="pv-vstupy"]');
    await section.scrollIntoViewIfNeeded();
    await expect(section).toBeInViewport();
  });
});
