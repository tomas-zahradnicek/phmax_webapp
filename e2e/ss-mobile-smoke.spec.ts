import { test, expect } from "@playwright/test";
import { clearLocalStorageKeys, gotoProductView } from "./smoke-helpers";

test.describe("SŠ mobilní smoke", () => {
  test.beforeEach(async ({ page }) => {
    await clearLocalStorageKeys(page, ["phmax-ss-basic-wizard-step", "phmax-ss-units-draft"]);
    await gotoProductView(page, "ss");
  });

  test("banner neúplných vstupů a Přejít k chybě", async ({ page }) => {
    const issueBanner = page.locator(".calculator-input-issue-banner");
    await expect(issueBanner).toBeVisible();
    await expect(issueBanner).toContainText(/chybí povinné údaje|řádků/i);
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
    await expect(showChip).toBeFocused();

    await showChip.evaluate((node) => {
      (node as HTMLButtonElement).click();
    });
    await expect(floatingSummary).toBeVisible();
  });

  test("průvodce krok Vstupy a §16 checkbox", async ({ page }) => {
    await page.getByRole("button", { name: "2 Vstupy" }).click({ force: true });
    await page.getByRole("button", { name: "Přejít k chybě" }).first().click();
    await expect(page.locator('[data-section="ss-vstupy"]')).toBeInViewport();
    await expect(page.getByRole("checkbox", { name: /§\s*16/i }).first()).toBeVisible();
  });
});
