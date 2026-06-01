import { test, expect } from "@playwright/test";
import { clearLocalStorageKeys, gotoProductView } from "./smoke-helpers";

test.describe("ZŠ mobilní smoke", () => {
  test.beforeEach(async ({ page }) => {
    await clearLocalStorageKeys(page, [
      "phmax-zs-basic-wizard-step",
      "phmax-zs-view-mode",
      "edu-cz-zs-calculator-state",
    ]);
    await gotoProductView(page, "zs");
  });

  test("banner neúplných vstupů a Přejít k chybě", async ({ page }) => {
    const issueBanner = page.locator(".calculator-input-issue-banner");
    await expect(issueBanner).toBeVisible();
    await expect(issueBanner).toContainText(/kompletní|vyplňte|PHmax/i);
    await expect(page.getByRole("button", { name: "Přejít k chybě" }).first()).toBeVisible();
  });

  test("plovoucí souhrn a Skrýt/Zobrazit chip", async ({ page }) => {
    const floatingSummary = page.locator(".calculator-mobile-scroll-results");
    await expect(floatingSummary).toBeVisible();

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

  test("průvodce krok Třídy a Přejít k chybě", async ({ page }) => {
    await page.getByRole("button", { name: "2 Třídy" }).click({ force: true });
    await page.getByRole("button", { name: "Přejít k chybě" }).first().click();
    await expect(page.locator('[data-section="basic"]')).toBeVisible();
  });
});
