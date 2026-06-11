import { test, expect } from "@playwright/test";
import { applyCrossPhmaxSeed, defaultCrossPhmaxSeedKeys } from "./cross-phmax-seed";
import {
  clearLocalStorageKeys,
  confirmDashboardExportDisclaimer,
  gotoProductView,
  seedZsNamedSnapshot,
} from "./smoke-helpers";

test.describe("Dashboard UX 0.3.14", () => {
  test("role segmented – rychlý vstup podle role", async ({ page }) => {
    await clearLocalStorageKeys(page, ["phmax-dash-last-active-product", "phmax-dash-role-v1"]);
    await page.goto("/?view=dash");
    await expect(page.locator(".dash-role-segmented")).toBeVisible();
    await expect(page.getByRole("radio", { name: "Ředitel" })).toBeVisible();
    await expect(page.getByRole("button", { name: /Celá škola za 15 min/i })).toBeVisible();
  });

  test("export wizard po potvrzení (cross-PHmax)", async ({ page }) => {
    await page.addInitScript(applyCrossPhmaxSeed, {
      ...defaultCrossPhmaxSeedKeys(),
      pvRowKey: "pv-dash-ux-013",
      ssRowId: 113,
    });
    await gotoProductView(page, "dash");
    await expect(page.getByRole("heading", { name: /Souhrnný PHmax/ })).toBeVisible();
    await expect(page.locator("[data-testid='dash-export-wizard']")).toHaveCount(0);
    await confirmDashboardExportDisclaimer(page);
    await expect(page.locator("[data-testid='dash-export-wizard']")).toBeVisible();
  });

  test("porovnání záloh ZŠ – karta a odkaz", async ({ page }) => {
    await seedZsNamedSnapshot(page);
    await gotoProductView(page, "dash");
    await expect(page.getByRole("heading", { name: "Porovnání scénářů (ZŠ)" })).toBeVisible();
    await expect(page.locator("[data-testid='dash-compare-zs-primary']")).toBeVisible();
    await expect(
      page.locator(".dash-school-profile__metric").filter({ hasText: "Pojmenované zálohy" }),
    ).toContainText("1");
  });

  test("akční řádek v modulu PV (desktop dock)", async ({ page }) => {
    await gotoProductView(page, "pv");
    await expect(page.locator("[data-testid='calculator-next-action']")).toBeVisible();
    await expect(page.locator(".calculator-workspace-dock, .calculator-workspace__dock").first()).toBeVisible();
  });
});
