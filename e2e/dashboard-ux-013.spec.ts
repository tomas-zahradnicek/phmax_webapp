import { test, expect } from "@playwright/test";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { applyCrossPhmaxSeed, defaultCrossPhmaxSeedKeys } from "./cross-phmax-seed";
import {
  clearLocalStorageKeys,
  confirmDashboardExportDisclaimer,
  gotoProductView,
  openDashboardAdvancedToolsSection,
  seedZsNamedSnapshot,
} from "./smoke-helpers";

const handoffFixture = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../docs/import-templates/phmax-is-handoff.generated.json",
);

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

  test("porovnání záloh ZŠ – karta a odkaz od 2 scénářů", async ({ page }) => {
    await seedZsNamedSnapshot(page, 2);
    await gotoProductView(page, "dash");
    await expect(page.getByRole("heading", { name: "Scénáře ZŠ" })).toBeVisible();
    await expect(page.locator("[data-testid='dash-zs-scenarios-card']")).toBeVisible();
    await expect(page.locator("[data-testid='dash-compare-zs-primary']")).toBeVisible();
    await expect(
      page.locator(".dash-school-profile__metric").filter({ hasText: "Pojmenované zálohy" }),
    ).toContainText("2");
  });

  test("akční řádek v modulu PV (desktop dock)", async ({ page }) => {
    await gotoProductView(page, "pv");
    await expect(page.locator("[data-testid='calculator-next-action']")).toBeVisible();
    await expect(page.locator(".calculator-workspace-dock, .calculator-workspace__dock").first()).toBeVisible();
  });

  test("import handoff JSON – assertive toast a follow-up banner", async ({ page }) => {
    await clearLocalStorageKeys(page, [
      "phmax-dash-last-active-product",
      ...Object.values(defaultCrossPhmaxSeedKeys()),
    ]);
    await gotoProductView(page, "dash");
    await openDashboardAdvancedToolsSection(page);
    await page.getByTestId("dash-import-file-card").setInputFiles(handoffFixture);
    await expect(page.getByRole("dialog", { name: /Import ze školy/i })).toBeVisible();
    await page.getByTestId("dash-import-confirm").check();
    await page.getByTestId("dash-import-apply").click();
    const toast = page.locator(".ui-toast").first();
    await expect(toast).toBeVisible();
    await expect(toast).toHaveAttribute("aria-live", "assertive");
    await expect(toast).toContainText(/Import dokončen/i);
    await expect(page.getByTestId("dash-import-followup")).toBeVisible();
  });
});
